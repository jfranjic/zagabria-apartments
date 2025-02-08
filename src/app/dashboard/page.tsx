'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'
import { User } from '@/types'

export default function DashboardPage() {
  console.log('Rendering DashboardPage')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('DashboardPage useEffect running')
    const checkUser = async () => {
      try {
        console.log('Getting user session')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          router.replace('/')
          return
        }

        if (!session?.user) {
          console.log('No user in session, redirecting to login')
          router.replace('/')
          return
        }

        console.log('User found:', session.user)
        
        // Get user profile from our users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error getting user profile:', profileError)
          router.replace('/')
          return
        }

        console.log('Dashboard rendering with user:', profile)
        setUser(profile)
        setLoading(false)
      } catch (error) {
        console.error('Error in checkUser:', error)
        router.replace('/')
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    console.log('Dashboard is loading')
    return (
      <MainLayout user={null}>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
              {/* Dashboard content */}
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Welcome, {user?.full_name || user?.email}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  This is your dashboard where you can manage your apartments and reservations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
