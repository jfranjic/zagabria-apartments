'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { startOfMonth, endOfMonth } from 'date-fns'
import MonthPicker from './MonthPicker'

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
  source: 'manual' | 'airbnb' | 'booking'
}

const monthNamesHr = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
];

const monthNamesEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ApartmentList() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthPickerOpen, setMonthPickerOpen] = useState<{ [key: string]: boolean }>({})
  const calendarRefs = useRef<{ [key: string]: any }>({})
  const titleButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

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

  const getEventColor = (source: string) => {
    switch (source) {
      case 'airbnb':
        return '#FF385C'
      case 'booking':
        return '#003580'
      case 'manual':
        return '#8B4513'
      default:
        return '#007bff'
    }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {apartments.map((apartment) => {
          const apartmentReservations = reservations
            .filter(res => res.apartment_id === apartment.id)
            .map(res => ({
              id: res.id,
              title: res.guest_name,
              start: res.checkin_date,
              end: res.checkout_date,
              backgroundColor: getEventColor(res.source),
              borderColor: getEventColor(res.source),
              classNames: ['reservation-event'],
              extendedProps: {
                source: res.source
              }
            }))

          return (
            <div key={apartment.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{apartment.name}</h3>
              <div className="relative" data-apartment-id={apartment.id}>
                <div className="calendar-header relative">
                  <MonthPicker
                    isOpen={monthPickerOpen[apartment.id] || false}
                    onClose={() => setMonthPickerOpen(prev => ({ ...prev, [apartment.id]: false }))}
                    onSelect={(month) => {
                      const calendar = calendarRefs.current[apartment.id];
                      if (calendar) {
                        const currentDate = calendar.getApi().getDate();
                        currentDate.setMonth(month);
                        calendar.getApi().gotoDate(currentDate);
                        setMonthPickerOpen(prev => ({ ...prev, [apartment.id]: false }));
                      }
                    }}
                    currentMonth={calendarRefs.current[apartment.id]?.getApi().getDate().getMonth() || new Date().getMonth()}
                    buttonRef={{ current: titleButtonRefs.current[apartment.id] }}
                  />
                </div>
                <FullCalendar
                  ref={(el) => {
                    if (el) {
                      calendarRefs.current[apartment.id] = el;
                    }
                  }}
                  plugins={[dayGridPlugin]}
                  initialView="dayGridMonth"
                  events={apartmentReservations}
                  headerToolbar={{
                    left: 'prev',
                    center: 'title',
                    right: 'next'
                  }}
                  titleFormat={(date) => {
                    const month = date.date.month;
                    const monthNumber = month + 1;
                    return `${monthNumber}. ${monthNamesHr[month]} / ${monthNamesEn[month]}`;
                  }}
                  dayHeaderFormat={{ weekday: 'short' }}
                  height="auto"
                  firstDay={1}
                  datesSet={(dateInfo) => {
                    // Ažuriraj naslov kad se promijeni datum
                    const month = dateInfo.view.currentStart.getMonth();
                    const monthNumber = month + 1;
                    const titleText = `${monthNumber}. ${monthNamesHr[month]} / ${monthNamesEn[month]}`;
                    
                    const toolbar = document.querySelector(`[data-apartment-id="${apartment.id}"] .fc-toolbar-title`);
                    if (toolbar) {
                      // Prvo ukloni stari event listener ako postoji
                      const oldClickHandler = toolbar.getAttribute('data-click-handler');
                      if (oldClickHandler && window[oldClickHandler as any]) {
                        toolbar.removeEventListener('click', window[oldClickHandler as any]);
                        delete window[oldClickHandler as any];
                      }

                      // Kreiraj novi click handler
                      const clickHandler = () => {
                        setMonthPickerOpen(prev => ({
                          ...prev,
                          [apartment.id]: !prev[apartment.id]
                        }));
                      };

                      // Spremi handler kao property na window objektu
                      const handlerId = `clickHandler_${apartment.id}_${Date.now()}`;
                      window[handlerId as any] = clickHandler;
                      toolbar.setAttribute('data-click-handler', handlerId);

                      toolbar.textContent = titleText;
                      toolbar.addEventListener('click', clickHandler);
                      titleButtonRefs.current[apartment.id] = toolbar as HTMLButtonElement;
                    }
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
