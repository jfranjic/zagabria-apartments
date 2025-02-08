'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'
import StatsBoxes from '@/components/dashboard/StatsBoxes'
import ApartmentList from '@/components/dashboard/ApartmentList'
import { User } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('Checking user session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Failed to get session')
          router.replace('/')
          return
        }

        if (!session?.user) {
          console.log('No user session found')
          router.replace('/')
          return
        }

        console.log('Session found:', session)
        
        // Get user profile from our users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          setError('Failed to get user profile')
          return
        }

        console.log('User profile:', profile)
        setUser(profile)
        setLoading(false)
      } catch (error) {
        console.error('Unexpected error:', error)
        setError('An unexpected error occurred')
        router.replace('/')
      }
    }

    checkUser()
  }, [router])

  if (error) {
    return (
      <MainLayout user={null}>
        <div className="flex items-center justify-center h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout user={null}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user?.full_name || user?.email}</span>
            </div>
          </div>
          
          {/* Stats Boxes */}
          <StatsBoxes />
          
          {/* Apartment List with Calendars */}
          <ApartmentList />
        </div>
      </div>
    </MainLayout>
  )
}
