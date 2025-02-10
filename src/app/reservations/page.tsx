'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'
import Button from '@/components/ui/Button'
import ReservationModal from '@/components/reservations/ReservationModal'
import ReservationStatus from '@/components/reservations/ReservationStatus'
import { format, parseISO } from 'date-fns'
import { hr } from 'date-fns/locale'

interface Reservation {
  id: string
  apartment_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guests_count: number
  check_in: string
  check_out: string
  status: string
  notes: string
  apartments: {
    name: string
  }
}

interface Apartment {
  id: string
  name: string
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    fetchReservations()
    fetchApartments()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reservations')
        .select('*, apartments(name)')
        .order('check_in', { ascending: true })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApartments = async () => {
    try {
      const { data: apartments, error } = await supabase
        .from('apartments')
        .select('*')
      
      if (error) throw error
      setApartments(apartments || [])
    } catch (error) {
      console.error('Error fetching apartments:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchReservations()
    } catch (error) {
      console.error('Error deleting reservation:', error)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return format(d, "dd. MM. yyyy. (EEEE) 'u' HH:mm", { locale: hr })
  }

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Reservations</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all reservations including guest details and dates.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button onClick={() => setShowModal(true)}>Add Reservation</Button>
          </div>
        </div>
        {loading ? (
          <div className="mt-6">
            <div className="animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white shadow rounded-lg p-4 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Guest
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Contact
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Apartment
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Check-in
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Check-out
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Notes
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {reservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div className="font-medium text-gray-900">{reservation.guest_name}</div>
                            <div className="text-gray-500">{reservation.guests_count} {reservation.guests_count === 1 ? 'guest' : 'guests'}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-500">
                              <a 
                                href={`mailto:${reservation.guest_email}`} 
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {reservation.guest_email}
                              </a>
                            </div>
                            {reservation.guest_phone && (
                              <div className="text-gray-500 mt-1">
                                <a 
                                  href={`tel:${reservation.guest_phone}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {reservation.guest_phone}
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {reservation.apartments?.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(reservation.check_in)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(reservation.check_out)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <ReservationStatus checkIn={reservation.check_in} checkOut={reservation.check_out} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {reservation.notes}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                            <button
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setShowModal(true)
                              }}
                              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(reservation.id)}
                              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <ReservationModal
          isOpen={showModal}
          reservation={selectedReservation}
          onClose={() => {
            setShowModal(false)
            setSelectedReservation(null)
          }}
          onSuccess={() => {
            fetchReservations()
            setShowModal(false)
            setSelectedReservation(null)
          }}
          apartments={apartments}
        />
      )}
    </MainLayout>
  )
}
