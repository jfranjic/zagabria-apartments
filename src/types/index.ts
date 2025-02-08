export type UserRole = 'admin' | 'cleaner'
export type ReservationSource = 'manual' | 'airbnb' | 'booking'
export type CleaningStatus = 'pending' | 'in_progress' | 'completed'

export interface User {
  id: string
  full_name: string | null
  role: UserRole
  active: boolean
  email?: string
  created_at: string
  updated_at: string
}

export interface Apartment {
  id: string
  name: string
  address: string
  ical_url: string | null
  beds: number
  max_guests: number
  description: string | null
  check_in_time: string
  check_out_time: string
  cleaning_fee: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  apartment_id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  check_in: string
  check_out: string
  guests_count: number
  source: ReservationSource
  source_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CleaningSession {
  id: string
  apartment_id: string
  reservation_id: string
  cleaner_id: string | null
  status: CleaningStatus
  scheduled_date: string
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CalendarLog {
  id: string
  apartment_id: string
  event_type: string
  description: string | null
  created_at: string
}
