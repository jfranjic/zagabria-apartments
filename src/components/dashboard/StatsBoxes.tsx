'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalApartments: number
  activeReservations: number
  upcomingReservations: number
}

export default function StatsBoxes() {
  const [stats, setStats] = useState<Stats>({
    totalApartments: 0,
    activeReservations: 0,
    upcomingReservations: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total apartments
        const { count: apartmentsCount, error: apartmentsError } = await supabase
          .from('apartments')
          .select('*', { count: 'exact', head: true })

        if (apartmentsError) throw apartmentsError

        // Get active reservations (current date falls between checkin_date and checkout_date)
        const today = new Date().toISOString().split('T')[0]
        const { data: activeReservations, error: activeError } = await supabase
          .from('reservations')
          .select('*')
          .lte('checkin_date', today)
          .gte('checkout_date', today)

        if (activeError) throw activeError

        // Get upcoming reservations (checkin_date is in the future)
        const { data: upcomingReservations, error: upcomingError } = await supabase
          .from('reservations')
          .select('*')
          .gt('checkin_date', today)

        if (upcomingError) throw upcomingError

        setStats({
          totalApartments: apartmentsCount || 0,
          activeReservations: activeReservations?.length || 0,
          upcomingReservations: upcomingReservations?.length || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Apartments</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalApartments}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Active Reservations</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.activeReservations}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Upcoming Reservations</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.upcomingReservations}</p>
      </div>
    </div>
  )
}
