import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import * as ical from 'node-ical'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Get all apartments with iCal URLs
    const { data: apartments } = await supabase
      .from('apartments')
      .select('*')
      .not('ical_url', 'is', null)

    if (!apartments?.length) {
      return NextResponse.json({ message: 'No apartments with iCal URLs found' })
    }

    const results = []

    for (const apartment of apartments) {
      try {
        // Fetch and parse iCal feed
        const events = await ical.async.fromURL(apartment.ical_url!)
        
        // Process each event
        for (const event of Object.values(events)) {
          if (event.type !== 'VEVENT') continue

          const start = event.start
          const end = event.end

          if (!start || !end) continue

          // Try to determine the source based on the iCal URL
          const source = apartment.ical_url.includes('airbnb') ? 'airbnb' : 
                        apartment.ical_url.includes('booking') ? 'booking' : 
                        'manual'

          // Check if reservation already exists
          const { data: existingReservation } = await supabase
            .from('reservations')
            .select('id')
            .eq('apartment_id', apartment.id)
            .eq('external_id', event.uid)
            .single()

          if (!existingReservation) {
            // Create new reservation
            const { error: reservationError } = await supabase
              .from('reservations')
              .insert({
                apartment_id: apartment.id,
                guest_name: event.summary || 'Guest',
                checkin_date: start.toISOString().split('T')[0],
                checkout_date: end.toISOString().split('T')[0],
                source,
                external_id: event.uid,
                notes: event.description
              })

            if (reservationError) {
              throw reservationError
            }

            // Create cleaning session for checkout day
            const { error: cleaningError } = await supabase
              .from('cleaning_sessions')
              .insert({
                apartment_id: apartment.id,
                scheduled_date: end.toISOString().split('T')[0],
                status: 'pending'
              })

            if (cleaningError) {
              throw cleaningError
            }

            results.push({
              apartment: apartment.name,
              event: event.summary,
              status: 'added'
            })
          }
        }
      } catch (error) {
        console.error(`Error processing apartment ${apartment.name}:`, error)
        results.push({
          apartment: apartment.name,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: 'iCal sync completed',
      results
    })
  } catch (error) {
    console.error('Error in iCal sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
