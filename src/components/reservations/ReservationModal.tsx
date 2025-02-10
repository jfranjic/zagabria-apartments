import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Apartment, Reservation, ReservationSource } from '@/types';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface ReservationModalProps {
  isOpen: boolean;
  reservation?: Reservation | null;
  onClose: () => void;
  onSuccess?: () => void;
  apartments: Apartment[];
}

interface FormData {
  apartment_id: string;
  guest_name: string;
  guests_count: number;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  check_in_time: string;
  check_out_time: string;
  planned_departure_time: string;
  notes: string;
  daily_rental: boolean;
}

const PAYMENT_STATUSES = ['pending', 'partial', 'paid'] as const;
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' }
];

const COUNTRIES = [
  { code: 'HR', name: 'Croatia' },
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'IT', name: 'Italy' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }
];

const DEFAULT_CHECK_IN_TIME = "15:00";
const DEFAULT_CHECK_OUT_TIME = "10:00";
const DEFAULT_DAILY_CHECK_IN_TIME = "08:00";
const DEFAULT_DAILY_CHECK_OUT_TIME = "20:00";

export default function ReservationModal({
  isOpen,
  reservation,
  onClose,
  onSuccess,
  apartments
}: ReservationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    apartment_id: reservation?.apartment_id || '',
    guest_name: reservation?.guest_name || '',
    guests_count: reservation?.guests_count || 1,
    guest_email: reservation?.guest_email || '',
    guest_phone: reservation?.guest_phone || '',
    check_in: reservation?.check_in 
      ? format(parseISO(reservation.check_in), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    check_out: reservation?.check_out 
      ? format(parseISO(reservation.check_out), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    check_in_time: DEFAULT_CHECK_IN_TIME,
    check_out_time: DEFAULT_CHECK_OUT_TIME,
    planned_departure_time: DEFAULT_DAILY_CHECK_OUT_TIME,
    notes: reservation?.notes || '',
    daily_rental: reservation?.daily_rental || false
  });

  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFormData({
        apartment_id: reservation.apartment_id,
        guest_name: reservation.guest_name,
        guests_count: reservation.guests_count,
        guest_email: reservation.guest_email || '',
        guest_phone: reservation.guest_phone || '',
        check_in: reservation.check_in 
          ? format(parseISO(reservation.check_in), "yyyy-MM-dd")
          : format(DEFAULT_CHECK_IN_TIME, "yyyy-MM-dd"),
        check_out: reservation.check_out 
          ? format(parseISO(reservation.check_out), "yyyy-MM-dd")
          : format(DEFAULT_CHECK_OUT_TIME, "yyyy-MM-dd"),
        check_in_time: DEFAULT_CHECK_IN_TIME,
        check_out_time: DEFAULT_CHECK_OUT_TIME,
        planned_departure_time: DEFAULT_DAILY_CHECK_OUT_TIME,
        notes: reservation.notes || '',
        daily_rental: reservation.daily_rental || false
      });
    }
  }, [reservation]);

  useEffect(() => {
    const checkDateConflicts = async () => {
      if (!formData.apartment_id || !formData.check_in || !formData.check_out) return;

      // Convert dates to UTC time with proper check-in/check-out times
      const checkInDate = new Date(formData.check_in);
      const checkOutDate = new Date(formData.check_out);
      
      // For validation, we compare dates without times first
      const checkInDay = new Date(checkInDate);
      const checkOutDay = new Date(checkOutDate);
      checkInDay.setUTCHours(0, 0, 0, 0);
      checkOutDay.setUTCHours(0, 0, 0, 0);

      // Check-out day cannot be before check-in day
      if (checkOutDay < checkInDay) {
        setDateError('Check-out date cannot be before check-in date');
        return;
      }

      // If it's not a daily rental, check-out must be after check-in day
      if (!formData.daily_rental && checkOutDay <= checkInDay) {
        setDateError('For regular bookings, check-out must be at least one day after check-in');
        return;
      }

      // Now set the proper times for database comparison
      const [checkInHours, checkInMinutes] = formData.check_in_time.split(':').map(Number);
      const [checkOutHours, checkOutMinutes] = formData.check_out_time.split(':').map(Number);
      checkInDate.setUTCHours(checkInHours, checkInMinutes, 0, 0);
      checkOutDate.setUTCHours(checkOutHours, checkOutMinutes, 0, 0);

      // Validate that check-in is not in the past
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      if (checkInDay < now) {
        setDateError('Check-in date cannot be in the past');
        return;
      }

      try {
        // Query for overlapping reservations
        let query = supabase
          .from('reservations')
          .select('id, check_in, check_out')
          .eq('apartment_id', formData.apartment_id)
          .lt('check_in', checkOutDate.toISOString())
          .gt('check_out', checkInDate.toISOString());

        // Only add the id filter if we're editing an existing reservation
        if (reservation?.id) {
          query = query.neq('id', reservation.id);
        }

        const { data: conflictingReservations, error } = await query;

        if (error) throw error;

        if (conflictingReservations && conflictingReservations.length > 0) {
          setDateError('These dates overlap with an existing reservation');
        } else {
          setDateError(null);
        }
      } catch (error) {
        console.error('Error checking date conflicts:', error);
        setDateError('Error checking date availability');
      }
    };

    checkDateConflicts();
  }, [formData.apartment_id, formData.check_in, formData.check_out, reservation?.id, formData.daily_rental, formData.check_in_time, formData.check_out_time]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDailyRentalChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      daily_rental: checked,
      check_in_time: checked ? DEFAULT_DAILY_CHECK_IN_TIME : DEFAULT_CHECK_IN_TIME,
      check_out_time: checked ? DEFAULT_DAILY_CHECK_OUT_TIME : DEFAULT_CHECK_OUT_TIME,
      planned_departure_time: DEFAULT_DAILY_CHECK_OUT_TIME
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const checkInDate = new Date(formData.check_in);
      const checkOutDate = new Date(formData.check_out);
      
      if (formData.daily_rental) {
        // For daily rentals, set check-out to next day to satisfy valid_dates constraint
        checkOutDate.setDate(checkInDate.getDate() + 1);
      }

      // Format dates (YYYY-MM-DD)
      const formattedCheckIn = format(checkInDate, "yyyy-MM-dd");
      const formattedCheckOut = format(checkOutDate, "yyyy-MM-dd");

      // Set times based on rental type
      let estimatedArrivalTime = null;
      let plannedDepartureTime = null;

      if (formData.daily_rental) {
        estimatedArrivalTime = formData.check_in_time;
        plannedDepartureTime = formData.planned_departure_time;
      } else {
        estimatedArrivalTime = formData.check_in_time;
        plannedDepartureTime = formData.check_out_time;
      }

      console.log('Form Data:', formData);
      console.log('Check-in:', formattedCheckIn, estimatedArrivalTime);
      console.log('Check-out:', formattedCheckOut, plannedDepartureTime);
      console.log('Daily Rental:', formData.daily_rental);

      const reservationData = {
        apartment_id: formData.apartment_id,
        guest_name: formData.guest_name,
        guests_count: formData.guests_count,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        check_in: formattedCheckIn,
        check_out: formattedCheckOut,
        estimated_arrival_time: estimatedArrivalTime,
        planned_departure_time: plannedDepartureTime,
        notes: formData.notes,
        source: 'manual',
        daily_rental: formData.daily_rental
      };

      console.log('Sending to Supabase:', reservationData);

      const { data, error } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select()

      if (error) throw error

      onSuccess?.()
    } catch (error) {
      console.error('Error saving reservation:', error)
      setDateError(error instanceof Error ? error.message : 'Failed to save reservation');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {reservation ? 'Edit' : 'New'} Reservation
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Fill in the reservation details below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        {dateError && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="text-sm text-red-700">{dateError}</div>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2.5">
              <label htmlFor="apartment_id" className="block text-sm font-medium text-gray-900">
                Apartment *
              </label>
              <select
                id="apartment_id"
                name="apartment_id"
                required
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.apartment_id}
                onChange={handleInputChange}
              >
                <option value="">Select an apartment</option>
                {apartments.map((apartment) => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="guest_name" className="block text-sm font-medium text-gray-900">
                Guest Name *
              </label>
              <input
                type="text"
                id="guest_name"
                name="guest_name"
                required
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.guest_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label htmlFor="guests_count" className="block text-sm font-medium text-gray-900">
                  Number of Guests *
                </label>
                <input
                  type="number"
                  id="guests_count"
                  name="guests_count"
                  required
                  min="1"
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.guests_count}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2.5">
                <label htmlFor="guest_email" className="block text-sm font-medium text-gray-900">
                  Guest Email
                </label>
                <input
                  type="email"
                  id="guest_email"
                  name="guest_email"
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.guest_email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-900">
                Guest Phone
              </label>
              <input
                type="tel"
                id="guest_phone"
                name="guest_phone"
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.guest_phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="daily_rental"
                name="daily_rental"
                checked={formData.daily_rental}
                onChange={(e) => 
                  handleDailyRentalChange(e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label
                htmlFor="daily_rental"
                className="text-sm font-medium text-gray-900 select-none cursor-pointer"
              >
                Daily Rental (allows same-day check-in/out)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label htmlFor="check_in" className="block text-sm font-medium text-gray-900">
                  Check-in Date *
                </label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    id="check_in"
                    name="check_in"
                    required
                    className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.check_in}
                    onChange={handleInputChange}
                  />
                  <input
                    type="time"
                    id="check_in_time"
                    name="check_in_time"
                    required
                    className="block w-32 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.check_in_time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <label htmlFor="check_out" className="block text-sm font-medium text-gray-900">
                  {formData.daily_rental ? 'Reservation Date *' : 'Check-out Date *'}
                </label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    id="check_out"
                    name="check_out"
                    required
                    className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.daily_rental ? formData.check_in : formData.check_out}
                    disabled={formData.daily_rental}
                    onChange={handleInputChange}
                  />
                  {formData.daily_rental ? (
                    <input
                      type="time"
                      id="planned_departure_time"
                      name="planned_departure_time"
                      required
                      className="block w-32 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.planned_departure_time}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <input
                      type="time"
                      id="check_out_time"
                      name="check_out_time"
                      required
                      className="block w-32 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.check_out_time}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Save
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
