import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { Apartment } from '@/types'

interface ApartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Apartment>) => Promise<void>
  apartment?: Apartment
}

export default function ApartmentModal({
  isOpen,
  onClose,
  onSubmit,
  apartment
}: ApartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    ical_url: '',
    beds: 1,
    max_guests: 2,
    description: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    cleaning_fee: 0,
    active: true
  })

  useEffect(() => {
    if (apartment) {
      setFormData({
        name: apartment.name,
        address: apartment.address,
        ical_url: apartment.ical_url || '',
        beds: apartment.beds,
        max_guests: apartment.max_guests,
        description: apartment.description || '',
        check_in_time: apartment.check_in_time,
        check_out_time: apartment.check_out_time,
        cleaning_fee: apartment.cleaning_fee,
        active: apartment.active
      })
    }
  }, [apartment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {apartment ? 'Edit Apartment' : 'Add New Apartment'}
          </h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">iCal URL</label>
              <input
                type="url"
                value={formData.ical_url}
                onChange={(e) => setFormData({ ...formData, ical_url: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Beds</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.beds}
                  onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
                <input
                  type="time"
                  required
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
                <input
                  type="time"
                  required
                  value={formData.check_out_time}
                  onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cleaning Fee</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.cleaning_fee}
                onChange={(e) => setFormData({ ...formData, cleaning_fee: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {apartment ? 'Save Changes' : 'Create Apartment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
