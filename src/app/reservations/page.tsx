'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'
import Button from '@/components/ui/Button'
import ReservationModal from '@/components/reservations/ReservationModal'
import ReservationCalendar from '@/components/calendar/ReservationCalendar'
import { Apartment, Reservation, CleaningSession } from '@/types'

export default function ReservationsPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [cleaningSessions, setCleaningSessions] = useState<CleaningSession[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | undefined>()
  const [user, setUser] = useState<any>(null)
  const [selectedApartment, setSelectedApartment] = useState<string>('all')
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchData()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setUser(data)
    }
  }

  const fetchData = async () => {
    // Fetch apartments
    const { data: apartmentsData } = await supabase
      .from('apartments')
      .select('*')
      .order('name')
    
    if (apartmentsData) {
      setApartments(apartmentsData)
    }

    // Fetch reservations
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select('*, apartments(name)')
      .order('checkin_date')
    
    if (reservationsData) {
      setReservations(reservationsData)
    }

    // Fetch cleaning sessions
    const { data: cleaningData } = await supabase
      .from('cleaning_sessions')
      .select('*')
      .order('scheduled_date')
    
    if (cleaningData) {
      setCleaningSessions(cleaningData)
    }
  }

  const handleAddEdit = async (reservationData: Partial<Reservation>) => {
    try {
      if (selectedReservation) {
        // Update existing reservation
        const { error } = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', selectedReservation.id)

        if (error) throw error

        // Update cleaning session date if checkout date changed
        if (reservationData.checkout_date !== selectedReservation.checkout_date) {
          const { error: cleaningError } = await supabase
            .from('cleaning_sessions')
            .update({ scheduled_date: reservationData.checkout_date })
            .eq('reservation_id', selectedReservation.id)

          if (cleaningError) throw cleaningError
        }
      } else {
        // Add new reservation
        const { data: newReservation, error } = await supabase
          .from('reservations')
          .insert(reservationData)
          .select()
          .single()

        if (error) throw error

        // Create cleaning session for checkout day
        const { error: cleaningError } = await supabase
          .from('cleaning_sessions')
          .insert({
            apartment_id: reservationData.apartment_id,
            reservation_id: newReservation.id,
            scheduled_date: reservationData.checkout_date,
            status: 'pending'
          })

        if (cleaningError) throw cleaningError
      }

      fetchData()
      setIsModalOpen(false)
      setSelectedReservation(undefined)
    } catch (error) {
      console.error('Error saving reservation:', error)
      alert('Failed to save reservation. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation? This will also delete associated cleaning sessions.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error deleting reservation:', error)
      alert('Failed to delete reservation. Please try again.')
    }
  }

  const filteredReservations = selectedApartment === 'all'
    ? reservations
    : reservations.filter(r => r.apartment_id === selectedApartment)

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reservations</h1>
          <div className="flex space-x-3">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
            >
              <option value="all">All Apartments</option>
              {apartments.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-md shadow-sm">
              <Button
                variant={view === 'calendar' ? 'primary' : 'secondary'}
                onClick={() => setView('calendar')}
              >
                Calendar
              </Button>
              <Button
                variant={view === 'list' ? 'primary' : 'secondary'}
                onClick={() => setView('list')}
              >
                List
              </Button>
            </div>
            <Button
              onClick={() => {
                setSelectedReservation(undefined)
                setIsModalOpen(true)
              }}
            >
              Add Reservation
            </Button>
          </div>
        </div>

        {view === 'calendar' ? (
          <ReservationCalendar
            reservations={filteredReservations}
            cleaningSessions={cleaningSessions}
            onEventClick={(info) => {
              if (info.event.extendedProps.type === 'reservation') {
                const reservation = reservations.find(r => r.id === info.event.id)
                if (reservation) {
                  setSelectedReservation(reservation)
                  setIsModalOpen(true)
                }
              }
            }}
          />
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <li key={reservation.id}>
                  <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-medium text-indigo-600 truncate">
                          {reservation.guest_name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${reservation.source === 'airbnb' ? 'bg-red-100 text-red-800' : 
                              reservation.source === 'booking' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {reservation.source}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {reservation.apartments?.name} • {reservation.guest_count || 0} guests
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {new Date(reservation.checkin_date).toLocaleDateString()} - {new Date(reservation.checkout_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setIsModalOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(reservation.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ReservationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedReservation(undefined)
          }}
          onSubmit={handleAddEdit}
          reservation={selectedReservation}
          apartments={apartments}
        />
      </div>
    </MainLayout>
  )
}
