import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Apartment, Reservation, ReservationSource } from '@/types';
import { format, parseISO } from 'date-fns';
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
    check_in: reservation?.check_in ? format(parseISO(reservation.check_in), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    check_out: reservation?.check_out ? format(parseISO(reservation.check_out), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    estimated_arrival_time: reservation?.estimated_arrival_time || '',
    notes: reservation?.notes || ''
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        apartment_id: reservation.apartment_id,
        guest_name: reservation.guest_name,
        guests_count: reservation.guests_count,
        guest_email: reservation.guest_email || '',
        guest_phone: reservation.guest_phone || '',
        check_in: reservation.check_in ? format(parseISO(reservation.check_in), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        check_out: reservation.check_out ? format(parseISO(reservation.check_out), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        estimated_arrival_time: reservation.estimated_arrival_time || '',
        notes: reservation.notes || ''
      });
    }
  }, [reservation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const reservationData = {
        apartment_id: formData.apartment_id,
        guest_name: formData.guest_name,
        guests_count: parseInt(formData.guests_count.toString()),
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        check_in: formData.check_in,
        check_out: formData.check_out,
        estimated_arrival_time: formData.estimated_arrival_time || null,
        notes: formData.notes,
        source: 'manual' as const
      };

      if (reservation?.id) {
        // Update existing reservation
        const { error } = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', reservation.id);

        if (error) throw error;
      } else {
        // Create new reservation
        const { error } = await supabase
          .from('reservations')
          .insert([reservationData]);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Failed to save reservation. Please try again.');
    }
  };

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
              {reservation ? 'Edit Reservation' : 'New Reservation'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-500 mb-4">
            {reservation ? 'Edit the details of this reservation.' : 'Fill in the details to create a new reservation.'}
          </Dialog.Description>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="apartment_id" className="block text-sm font-medium leading-6 text-gray-900">
                    Apartment
                  </label>
                  <div className="mt-2">
                    <select
                      name="apartment_id"
                      id="apartment_id"
                      value={formData.apartment_id}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                      <option value="">Select apartment</option>
                      {apartments.map((apartment) => (
                        <option key={apartment.id} value={apartment.id}>
                          {apartment.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="guest_name" className="block text-sm font-medium leading-6 text-gray-900">
                    Guest Name
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="guest_name"
                      id="guest_name"
                      value={formData.guest_name}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="guest_email" className="block text-sm font-medium leading-6 text-gray-900">
                    Guest Email
                  </label>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="guest_email"
                      id="guest_email"
                      value={formData.guest_email}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="guest_phone" className="block text-sm font-medium leading-6 text-gray-900">
                    Guest Phone
                  </label>
                  <div className="mt-2">
                    <input
                      type="tel"
                      name="guest_phone"
                      id="guest_phone"
                      value={formData.guest_phone}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="guests_count" className="block text-sm font-medium leading-6 text-gray-900">
                    Number of Guests
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="guests_count"
                      id="guests_count"
                      min="1"
                      value={formData.guests_count}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="check_in" className="block text-sm font-medium leading-6 text-gray-900">
                    Check-in Date & Time
                  </label>
                  <div className="mt-2">
                    <input
                      type="datetime-local"
                      name="check_in"
                      id="check_in"
                      value={formData.check_in}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="check_out" className="block text-sm font-medium leading-6 text-gray-900">
                    Check-out Date & Time
                  </label>
                  <div className="mt-2">
                    <input
                      type="datetime-local"
                      name="check_out"
                      id="check_out"
                      value={formData.check_out}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="estimated_arrival_time" className="block text-sm font-medium leading-6 text-gray-900">
                    Estimated Arrival Time
                  </label>
                  <div className="mt-2">
                    <input
                      type="time"
                      name="estimated_arrival_time"
                      id="estimated_arrival_time"
                      value={formData.estimated_arrival_time}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
                    Notes
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="notes"
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-x-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-semibold leading-6 text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
