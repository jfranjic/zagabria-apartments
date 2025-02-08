import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { Apartment, CleaningSession, User } from '@/types'

interface CleaningModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<CleaningSession>) => Promise<void>
  cleaningSession?: CleaningSession
  apartments: Apartment[]
  cleaners: User[]
}

export default function CleaningModal({
  isOpen,
  onClose,
  onSubmit,
  cleaningSession,
  apartments,
  cleaners
}: CleaningModalProps) {
  const [formData, setFormData] = useState({
    apartment_id: '',
    cleaner_id: '',
    scheduled_date: '',
    status: 'pending' as const,
    notes: ''
  })

  useEffect(() => {
    if (cleaningSession) {
      setFormData({
        apartment_id: cleaningSession.apartment_id,
        cleaner_id: cleaningSession.cleaner_id || '',
        scheduled_date: cleaningSession.scheduled_date,
        status: cleaningSession.status,
        notes: cleaningSession.notes || ''
      })
    } else {
      // Reset form for new cleaning session
      setFormData({
        apartment_id: apartments[0]?.id || '',
        cleaner_id: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: ''
      })
    }
  }, [cleaningSession, apartments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {cleaningSession ? 'Edit Cleaning Session' : 'Add New Cleaning Session'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
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
              <label htmlFor="cleaner" className="block text-sm font-medium text-gray-700">
                Assigned Cleaner
              </label>
              <select
                id="cleaner"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.cleaner_id}
                onChange={(e) => setFormData(prev => ({ ...prev, cleaner_id: e.target.value }))}
              >
                <option value="">Not assigned</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">
                Scheduled Date
              </label>
              <input
                type="date"
                id="scheduled_date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              />
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
                placeholder="Any special instructions or notes for the cleaner..."
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
              {cleaningSession ? 'Save Changes' : 'Add Cleaning Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
