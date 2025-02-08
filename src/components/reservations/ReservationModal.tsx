import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { Apartment, Reservation, ReservationSource } from '@/types'

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Reservation>) => Promise<void>
  reservation?: Reservation
  apartments: Apartment[]
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSubmit,
  reservation,
  apartments
}: ReservationModalProps) {
  const [formData, setFormData] = useState({
    apartment_id: '',
    guest_name: '',
    guest_count: '',
    email: '',
    contact: '',
    checkin_date: '',
    checkout_date: '',
    source: 'manual' as ReservationSource,
    notes: ''
  })

  useEffect(() => {
    if (reservation) {
      setFormData({
        apartment_id: reservation.apartment_id,
        guest_name: reservation.guest_name,
        guest_count: reservation.guest_count?.toString() || '',
        email: reservation.email || '',
        contact: reservation.contact || '',
        checkin_date: reservation.checkin_date,
        checkout_date: reservation.checkout_date,
        source: reservation.source,
        notes: reservation.notes || ''
      })
    } else {
      // Reset form for new reservation
      setFormData({
        apartment_id: apartments[0]?.id || '',
        guest_name: '',
        guest_count: '',
        email: '',
        contact: '',
        checkin_date: '',
        checkout_date: '',
        source: 'manual',
        notes: ''
      })
    }
  }, [reservation, apartments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      guest_count: formData.guest_count ? parseInt(formData.guest_count) : null
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {reservation ? 'Edit Reservation' : 'Add New Reservation'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="apartment" className="block text-sm font-medium text-gray-700">
                  Apartment
                </label>
                <select
                  id="apartment"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.apartment_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartment_id: e.target.value }))}
                >
                  {apartments.map((apartment) => (
                    <option key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source
                </label>
                <select
                  id="source"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as ReservationSource }))}
                >
                  <option value="manual">Manual</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking.com</option>
                </select>
              </div>

              <div>
                <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700">
                  Guest Name
                </label>
                <input
                  type="text"
                  id="guest_name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.guest_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="guest_count" className="block text-sm font-medium text-gray-700">
                  Number of Guests
                </label>
                <input
                  type="number"
                  id="guest_count"
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.guest_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, guest_count: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="text"
                  id="contact"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="checkin_date" className="block text-sm font-medium text-gray-700">
                  Check-in Date
                </label>
                <input
                  type="date"
                  id="checkin_date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.checkin_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkin_date: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="checkout_date" className="block text-sm font-medium text-gray-700">
                  Check-out Date
                </label>
                <input
                  type="date"
                  id="checkout_date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.checkout_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkout_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              {reservation ? 'Save Changes' : 'Add Reservation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
