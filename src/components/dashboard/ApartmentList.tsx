'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

interface Apartment {
  id: string
  name: string
  status: string
}

interface Reservation {
  id: string
  apartment_id: string
  checkin_date: string
  checkout_date: string
  guest_name: string
}

export default function ApartmentList() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: apartmentsData, error: apartmentsError } = await supabase
          .from('apartments')
          .select('*')
          .order('name')

        if (apartmentsError) {
          console.error('Error fetching apartments:', apartmentsError)
          throw apartmentsError
        }

        setApartments(apartmentsData || [])

        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')

        if (reservationsError) {
          console.error('Error fetching reservations:', reservationsError)
          throw reservationsError
        }

        setReservations(reservationsData || [])

      } catch (error: any) {
        console.error('Error fetching data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getReservationsForApartment = (apartmentId: string) => {
    return reservations.filter(res => res.apartment_id === apartmentId)
  }

  if (loading) {
    return (
      <div className="mt-6">
        <div className="animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6 bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {apartments.map((apartment) => (
        <div key={apartment.id} className="mb-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{apartment.name}</h3>
          <Calendar
            className="w-full"
            tileClassName={({ date }) => {
              const dateStr = date.toISOString().split('T')[0]
              const hasReservation = getReservationsForApartment(apartment.id).some(
                res => dateStr >= res.checkin_date && dateStr <= res.checkout_date
              )
              return hasReservation ? 'bg-blue-100 text-blue-800' : ''
            }}
            tileContent={({ date }) => {
              const dateStr = date.toISOString().split('T')[0]
              const reservation = getReservationsForApartment(apartment.id).find(
                res => dateStr >= res.checkin_date && dateStr <= res.checkout_date
              )
              return reservation ? (
                <div className="text-xs mt-1">{reservation.guest_name}</div>
              ) : null
            }}
          />
        </div>
      ))}
    </div>
  )
}
