import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    // Check if we can connect to Supabase
    const { count: healthCheck, error: healthError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })

    if (healthError) {
      console.error('Health check error:', healthError)
      throw new Error(`Failed to connect to Supabase: ${healthError.message}`)
    }

    console.log('Health check passed:', healthCheck)

    // First, insert test apartments if they don't exist
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .upsert([
        { name: 'Apartman 1' },
        { name: 'Apartman 2' },
        { name: 'Apartman 3' },
        { name: 'Apartman 4' },
        { name: 'Apartman 5' },
        { name: 'Apartman 6' },
        { name: 'Apartman 7' },
        { name: 'Apartman 8' },
        { name: 'Apartman 9' }
      ])
      .select()

    if (apartmentsError) {
      console.error('Apartments error:', apartmentsError)
      throw new Error(`Failed to create apartments: ${apartmentsError.message}`)
    }

    if (!apartments || apartments.length < 9) {
      throw new Error('Failed to create apartments: No data returned')
    }

    console.log('Created apartments:', apartments)

    // Insert test reservations
    const { error: reservationsError } = await supabase
      .from('reservations')
      .insert([
        {
          apartment_id: apartments[0].id,
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+385 91 234 5678',
          guests_count: 2,
          check_in: '2025-02-01',
          check_out: '2025-02-05',
          source: 'manual'
        },
        {
          apartment_id: apartments[1].id,
          guest_name: 'Jane Smith',
          guest_email: 'jane@example.com',
          guest_phone: '+385 98 765 4321',
          guests_count: 3,
          check_in: '2025-02-15',
          check_out: '2025-02-20',
          source: 'manual'
        },
        {
          apartment_id: apartments[2].id,
          guest_name: 'Bob Wilson',
          guest_email: 'bob@example.com',
          guest_phone: '+385 95 123 4567',
          guests_count: 2,
          check_in: '2025-03-01',
          check_out: '2025-03-07',
          source: 'manual'
        },
        {
          apartment_id: apartments[3].id,
          guest_name: 'Alice Brown',
          guest_email: 'alice@example.com',
          guest_phone: '+385 99 876 5432',
          guests_count: 4,
          check_in: '2025-02-05',
          check_out: '2025-02-10',
          source: 'airbnb'
        },
        {
          apartment_id: apartments[4].id,
          guest_name: 'Charlie Davis',
          guest_email: 'charlie@example.com',
          guest_phone: '+385 92 345 6789',
          guests_count: 2,
          check_in: '2025-02-08',
          check_out: '2025-02-12',
          source: 'booking'
        }
      ])

    if (reservationsError) {
      console.error('Reservation error:', reservationsError)
      throw new Error(`Failed to create reservations: ${reservationsError.message}`)
    }

    return NextResponse.json({ message: 'Test data added successfully' })
  } catch (error: any) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    )
  }
}
