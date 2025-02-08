import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { Reservation, CleaningSession } from '@/types'

interface Event {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    type: 'reservation' | 'cleaning'
    status?: string
  }
}

interface ReservationCalendarProps {
  reservations: Reservation[]
  cleaningSessions: CleaningSession[]
  onEventClick?: (info: any) => void
}

export default function ReservationCalendar({
  reservations,
  cleaningSessions,
  onEventClick
}: ReservationCalendarProps) {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const reservationEvents = reservations.map((reservation): Event => ({
      id: reservation.id,
      title: `${reservation.guest_name} (${reservation.source})`,
      start: reservation.checkin_date,
      end: reservation.checkout_date,
      backgroundColor: getReservationColor(reservation.source),
      borderColor: getReservationColor(reservation.source),
      textColor: '#ffffff',
      extendedProps: {
        type: 'reservation'
      }
    }))

    const cleaningEvents = cleaningSessions.map((cleaning): Event => ({
      id: cleaning.id,
      title: `Cleaning: ${cleaning.status}`,
      start: cleaning.scheduled_date,
      end: cleaning.scheduled_date,
      backgroundColor: getCleaningColor(cleaning.status),
      borderColor: getCleaningColor(cleaning.status),
      textColor: '#ffffff',
      extendedProps: {
        type: 'cleaning',
        status: cleaning.status
      }
    }))

    setEvents([...reservationEvents, ...cleaningEvents])
  }, [reservations, cleaningSessions])

  const getReservationColor = (source: string) => {
    switch (source) {
      case 'airbnb':
        return '#FF5A5F' // Airbnb red
      case 'booking':
        return '#003580' // Booking.com blue
      default:
        return '#8B4513' // Brown for manual
    }
  }

  const getCleaningColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22C55E' // Green
      case 'in_progress':
        return '#F97316' // Orange
      default:
        return '#EF4444' // Red
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={onEventClick}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
      />
    </div>
  )
}
