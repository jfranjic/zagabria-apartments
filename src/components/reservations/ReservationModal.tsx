import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Apartment, Reservation, ReservationSource } from '@/types';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface ReservationModalProps {
  isOpen: boolean;
  reservation?: Reservation | null;
  onClose: () => void;
  onSave: () => void;
  apartments: Apartment[];
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

// Default check-in time is 15:00 (3 PM)
const DEFAULT_CHECK_IN_TIME = setHours(setMinutes(new Date(), 0), 15);
// Default check-out time is 10:00 (10 AM)
const DEFAULT_CHECK_OUT_TIME = setHours(setMinutes(new Date(), 0), 10);

export default function ReservationModal({
  isOpen,
  reservation,
  onClose,
  onSave,
  apartments
}: ReservationModalProps) {
  const [formData, setFormData] = useState({
    apartment_id: reservation?.apartment_id || '',
    guest_name: reservation?.guest_name || '',
    guests_count: reservation?.guests_count || 1,
    guest_email: reservation?.guest_email || '',
    guest_phone: reservation?.guest_phone || '',
    check_in: reservation?.check_in 
      ? format(parseISO(reservation.check_in), "yyyy-MM-dd") 
      : format(DEFAULT_CHECK_IN_TIME, "yyyy-MM-dd"),
    check_out: reservation?.check_out 
      ? format(parseISO(reservation.check_out), "yyyy-MM-dd") 
      : format(DEFAULT_CHECK_OUT_TIME, "yyyy-MM-dd"),
    notes: reservation?.notes || ''
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
        notes: reservation.notes || ''
      });
    }
  }, [reservation]);

  useEffect(() => {
    const checkDateConflicts = async () => {
      if (!formData.apartment_id || !formData.check_in || !formData.check_out) return;

      // Convert dates to UTC time with proper check-in/check-out times
      const checkInDate = new Date(formData.check_in);
      const checkOutDate = new Date(formData.check_out);
      
      checkInDate.setUTCHours(15, 0, 0, 0);
      checkOutDate.setUTCHours(10, 0, 0, 0);

      // Allow same day check-in/check-out, but check-out can't be before check-in
      if (checkOutDate < checkInDate) {
        setDateError('Check-out date cannot be before check-in date');
        return;
      }

      // Validate that check-in is not in the past
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      if (checkInDate < now) {
        setDateError('Check-in date cannot be in the past');
        return;
      }

      try {
        // Query for overlapping reservations
        let query = supabase
          .from('reservations')
          .select('id, check_in, check_out')
          .eq('apartment_id', formData.apartment_id)
          .or(
            `and(check_in,lt.${checkOutDate.toISOString()},check_out,gt.${checkInDate.toISOString()})`
          );

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
  }, [formData.apartment_id, formData.check_in, formData.check_out, reservation?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDateError(null);

    try {
      // Format dates with proper check-in (15:00) and check-out (10:00) times
      const checkInDate = new Date(formData.check_in);
      const checkOutDate = new Date(formData.check_out);
      
      // Set check-in time to 15:00 UTC
      checkInDate.setUTCHours(15, 0, 0, 0);
      // Set check-out time to 10:00 UTC
      checkOutDate.setUTCHours(10, 0, 0, 0);

      const formattedData = {
        apartment_id: formData.apartment_id,
        guest_name: formData.guest_name,
        guests_count: parseInt(formData.guests_count.toString()),
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        check_in: checkInDate.toISOString(),
        check_out: checkOutDate.toISOString(),
        notes: formData.notes || '',
        source: 'manual' as const,
        status: 'confirmed' as const,
        payment_status: 'pending' as const
      };

      if (reservation?.id) {
        const { error: updateError } = await supabase
          .from('reservations')
          .update(formattedData)
          .eq('id', reservation.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('reservations')
          .insert([formattedData]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving reservation:', error);
      setDateError('Failed to save reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby="reservation-form-description"
        >
          <Dialog.Title className="text-xl font-semibold mb-4">
            {reservation ? 'Edit Reservation' : 'New Reservation'}
          </Dialog.Title>
          
          <p id="reservation-form-description" className="sr-only">
            Form for {reservation ? 'editing an existing' : 'creating a new'} reservation. You can specify the apartment, guest details, and booking dates.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {dateError && (
              <div className="p-3 rounded-md bg-red-50 text-red-700 text-base">
                {dateError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Apartment Selection */}
              <div>
                <label htmlFor="apartment_id" className="block text-sm font-medium text-gray-900">
                  Apartment
                </label>
                <select
                  id="apartment_id"
                  name="apartment_id"
                  value={formData.apartment_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select an apartment</option>
                  {apartments.map((apartment) => (
                    <option key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Name */}
              <div>
                <label htmlFor="guest_name" className="block text-sm font-medium text-gray-900">
                  Guest Name
                </label>
                <input
                  type="text"
                  id="guest_name"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Guest Count */}
              <div>
                <label htmlFor="guests_count" className="block text-sm font-medium text-gray-900">
                  Number of Guests
                </label>
                <input
                  type="number"
                  id="guests_count"
                  name="guests_count"
                  min="1"
                  value={formData.guests_count}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Guest Email */}
              <div>
                <label htmlFor="guest_email" className="block text-sm font-medium text-gray-900">
                  Guest Email
                </label>
                <input
                  type="email"
                  id="guest_email"
                  name="guest_email"
                  value={formData.guest_email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Guest Phone */}
              <div>
                <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-900">
                  Guest Phone
                </label>
                <input
                  type="tel"
                  id="guest_phone"
                  name="guest_phone"
                  value={formData.guest_phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Check-in Date */}
              <div>
                <label htmlFor="check_in" className="block text-sm font-medium text-gray-900">
                  Check-in Date (15:00)
                </label>
                <input
                  type="date"
                  id="check_in"
                  name="check_in"
                  value={formData.check_in}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label htmlFor="check_out" className="block text-sm font-medium text-gray-900">
                  Check-out Date (10:00)
                </label>
                <input
                  type="date"
                  id="check_out"
                  name="check_out"
                  value={formData.check_out}
                  onChange={handleInputChange}
                  min={formData.check_in || new Date().toISOString().split('T')[0]}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting || !!dateError}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
