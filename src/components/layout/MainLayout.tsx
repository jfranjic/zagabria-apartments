'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  full_name: string
  role: string
  active: boolean
  email?: string
}

interface MainLayoutProps {
  children: React.ReactNode
  user: User | null
}

export default function MainLayout({ children, user }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', adminOnly: false },
    { name: 'Apartments', href: '/apartments', adminOnly: false },
    { name: 'Reservations', href: '/reservations', adminOnly: false },
    { name: 'Cleanings', href: '/cleanings', adminOnly: false },
    { name: 'Users', href: '/users', adminOnly: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md text-indigo-600 hover:text-indigo-700 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 backdrop-blur-sm bg-white/30"
        >
          <span className="sr-only">Open sidebar</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar */}
      <div className={`${isSidebarOpen ? '' : 'hidden'} fixed inset-0 flex z-40 md:hidden`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/95 backdrop-blur-lg">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                (!item.adminOnly || user?.role === 'admin') && (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-900'
                    } group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 group block text-red-500 hover:text-red-600 transition-colors duration-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop top navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  Zagabria Apartments
                </span>
              </div>
              <nav className="ml-10 flex items-center space-x-2">
                {navigation.map((item) => (
                  (!item.adminOnly || user?.role === 'admin') && (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        pathname === item.href
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200'
                          : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                      } px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200`}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
              </nav>
            </div>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-medium">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium">{user.full_name}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-red-500 hover:text-red-600 text-sm font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-[2400px] mx-auto px-3 py-4">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-3">
          {children}
        </div>
      </main>
    </div>
  )
}
