'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'
import Button from '@/components/ui/Button'
import ApartmentModal from '@/components/apartments/ApartmentModal'
import { Apartment, User } from '@/types'

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedApartment, setSelectedApartment] = useState<Apartment | undefined>()
  const [user, setUser] = useState<User | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    fetchApartments()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return
      }

      setUser({
        ...profile,
        email: session.user.email
      })
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('name')

      if (error) throw error
      setApartments(data || [])
    } catch (error) {
      console.error('Error fetching apartments:', error)
    }
  }

  const handleCreateApartment = async (apartmentData: Partial<Apartment>) => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .insert([apartmentData])
        .select()
        .single()

      if (error) throw error

      setApartments([...apartments, data])
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error creating apartment:', error)
      alert('Failed to create apartment. Please try again.')
    }
  }

  const handleEditApartment = async (id: string, apartmentData: Partial<Apartment>) => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .update(apartmentData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setApartments(apartments.map(apt => apt.id === id ? data : apt))
      setIsModalOpen(false)
      setSelectedApartment(undefined)
    } catch (error) {
      console.error('Error updating apartment:', error)
      alert('Failed to update apartment. Please try again.')
    }
  }

  const handleDeleteApartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this apartment?')) return

    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setApartments(apartments.filter(apt => apt.id !== id))
    } catch (error) {
      console.error('Error deleting apartment:', error)
      alert('Failed to delete apartment. Please try again.')
    }
  }

  const handleSyncCalendar = async (id: string) => {
    setIsSyncing(true)
    try {
      const { error } = await supabase.functions.invoke('sync-calendar', {
        body: { apartmentId: id }
      })

      if (error) throw error
      alert('Calendar synced successfully!')
    } catch (error) {
      console.error('Error syncing calendar:', error)
      alert('Failed to sync calendar. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <MainLayout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Apartments</h1>
            <Button onClick={() => setIsModalOpen(true)}>
              Add Apartment
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-gray-900 text-sm font-medium truncate">
                            {apartment.name}
                          </h3>
                          {!apartment.active && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-gray-500 text-sm truncate">
                          {apartment.address}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Beds</dt>
                          <dd className="mt-1 text-sm text-gray-900">{apartment.beds}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Max Guests</dt>
                          <dd className="mt-1 text-sm text-gray-900">{apartment.max_guests}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Check-in</dt>
                          <dd className="mt-1 text-sm text-gray-900">{apartment.check_in_time}</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Check-out</dt>
                          <dd className="mt-1 text-sm text-gray-900">{apartment.check_out_time}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <div className="flex justify-between space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedApartment(apartment)
                            setIsModalOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDeleteApartment(apartment.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleSyncCalendar(apartment.id)}
                          disabled={isSyncing}
                        >
                          {isSyncing ? 'Syncing...' : 'Sync Calendar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ApartmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedApartment(undefined)
        }}
        onSubmit={selectedApartment ? 
          (data) => handleEditApartment(selectedApartment.id, data) : 
          handleCreateApartment}
        apartment={selectedApartment}
      />
    </MainLayout>
  )
}
