import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Apartment } from '@/types';
import { isValidICalUrl, testICalUrl } from '@/utils/calendar';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';

interface ApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Apartment>) => Promise<void>;
  apartment?: Apartment;
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
    airbnb_ical_url: '',
    booking_ical_url: '',
    beds: 1,
    max_guests: 2,
    description: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    cleaning_fee: 0,
    active: true
  });

  const [isTestingUrl, setIsTestingUrl] = useState({
    airbnb: false,
    booking: false
  });

  const [urlStatus, setUrlStatus] = useState({
    airbnb: { isValid: true, message: '' },
    booking: { isValid: true, message: '' }
  });

  useEffect(() => {
    if (apartment) {
      setFormData({
        name: apartment.name,
        address: apartment.address,
        airbnb_ical_url: apartment.airbnb_ical_url || '',
        booking_ical_url: apartment.booking_ical_url || '',
        beds: apartment.beds,
        max_guests: apartment.max_guests,
        description: apartment.description || '',
        check_in_time: apartment.check_in_time,
        check_out_time: apartment.check_out_time,
        cleaning_fee: apartment.cleaning_fee,
        active: apartment.active
      });
    }
  }, [apartment]);

  const handleUrlChange = (field: 'airbnb_ical_url' | 'booking_ical_url', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const type = field === 'airbnb_ical_url' ? 'airbnb' : 'booking';
    const isValid = isValidICalUrl(value);
    setUrlStatus(prev => ({
      ...prev,
      [type]: { isValid, message: isValid ? '' : 'Invalid URL format' }
    }));
  };

  const handleTestUrl = async (type: 'airbnb' | 'booking') => {
    const url = type === 'airbnb' ? formData.airbnb_ical_url : formData.booking_ical_url;
    
    setIsTestingUrl(prev => ({ ...prev, [type]: true }));
    const result = await testICalUrl(url);
    setIsTestingUrl(prev => ({ ...prev, [type]: false }));
    
    setUrlStatus(prev => ({
      ...prev,
      [type]: { isValid: result.success, message: result.message }
    }));

    if (result.success) {
      toast.success(`${type === 'airbnb' ? 'Airbnb' : 'Booking.com'} calendar URL is valid`);
    } else {
      toast.error(result.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URLs if they are provided
    if (formData.airbnb_ical_url && !isValidICalUrl(formData.airbnb_ical_url)) {
      toast.error('Invalid Airbnb calendar URL');
      return;
    }
    if (formData.booking_ical_url && !isValidICalUrl(formData.booking_ical_url)) {
      toast.error('Invalid Booking.com calendar URL');
      return;
    }

    await onSubmit(formData);
  };

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-medium">
              {apartment ? 'Edit Apartment' : 'Add Apartment'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    placeholder:text-gray-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter apartment name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    placeholder:text-gray-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#FF5A5F]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.5 2h-21C.675 2 0 2.675 0 3.5v17c0 .825.675 1.5 1.5 1.5h21c.825 0 1.5-.675 1.5-1.5v-17c0-.825-.675-1.5-1.5-1.5zm-9.793 16.413c-3.636 0-6.587-2.951-6.587-6.587s2.951-6.587 6.587-6.587 6.587 2.951 6.587 6.587-2.951 6.587-6.587 6.587zm2.274-10.242c-1.257 0-2.274 1.017-2.274 2.274s1.017 2.274 2.274 2.274 2.274-1.017 2.274-2.274-1.017-2.274-2.274-2.274z"/>
                    </svg>
                    Airbnb Calendar URL
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`flex-1 px-3 py-2 border rounded-md text-gray-900 bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      placeholder:text-gray-500 ${!urlStatus.airbnb.isValid ? 'border-red-300' : 'border-gray-300'}`}
                    value={formData.airbnb_ical_url || ''}
                    onChange={(e) => handleUrlChange('airbnb_ical_url', e.target.value)}
                    placeholder="Enter Airbnb iCal URL"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestUrl('airbnb')}
                    disabled={!formData.airbnb_ical_url || isTestingUrl.airbnb}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium
                      text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 
                      focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTestingUrl.airbnb ? 'Testing...' : 'Test URL'}
                  </button>
                </div>
                {urlStatus.airbnb.message && (
                  <p className={`mt-1 text-sm ${urlStatus.airbnb.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {urlStatus.airbnb.message}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">Export calendar from your Airbnb listing</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#003580]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.04.96H2.96A2.04 2.04 0 00.92 3v18c0 1.13.91 2.04 2.04 2.04h18.08c1.13 0 2.04-.91 2.04-2.04V3c0-1.13-.91-2.04-2.04-2.04zM12 15.75c-3.17 0-5.75-2.58-5.75-5.75S8.83 4.25 12 4.25s5.75 2.58 5.75 5.75-2.58 5.75-5.75 5.75zm2.274-10.242c-1.257 0-2.274 1.017-2.274 2.274s1.017 2.274 2.274 2.274 2.274-1.017 2.274-2.274-1.017-2.274-2.274-2.274z"/>
                    </svg>
                    Booking.com Calendar URL
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`flex-1 px-3 py-2 border rounded-md text-gray-900 bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      placeholder:text-gray-500 ${!urlStatus.booking.isValid ? 'border-red-300' : 'border-gray-300'}`}
                    value={formData.booking_ical_url || ''}
                    onChange={(e) => handleUrlChange('booking_ical_url', e.target.value)}
                    placeholder="Enter Booking.com iCal URL"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestUrl('booking')}
                    disabled={!formData.booking_ical_url || isTestingUrl.booking}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium
                      text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 
                      focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTestingUrl.booking ? 'Testing...' : 'Test URL'}
                  </button>
                </div>
                {urlStatus.booking.message && (
                  <p className={`mt-1 text-sm ${urlStatus.booking.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {urlStatus.booking.message}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">Export calendar from your Booking.com property</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      placeholder:text-gray-500"
                    value={formData.beds}
                    onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      placeholder:text-gray-500"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    placeholder:text-gray-500"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    placeholder:text-gray-500"
                  value={formData.cleaning_fee || ''}
                  onChange={(e) => setFormData({ ...formData, cleaning_fee: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {apartment ? 'Save Changes' : 'Create Apartment'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
