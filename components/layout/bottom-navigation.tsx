'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Plus, Ticket, User, LogIn } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'

// Navigation items for different user states
const guestNavigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: '', href: '/events/create', icon: Plus, isFab: true },
  { name: 'Sign In', href: '/auth/signin', icon: LogIn, isSignIn: true },
]

const userNavigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: '', href: '/events/create', icon: Plus, isFab: true },
  { name: 'Bookings', href: '/bookings', icon: Ticket },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function BottomNavigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error checking user:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Handle Google Sign In for mobile
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Error signing in:', error)
    }
  }

  // Get navigation items based on user state
  const navigationItems = user ? userNavigationItems : guestNavigationItems

  // Show loading state to prevent flash
  if (isLoading) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-50">
        <div className="flex items-center justify-around h-16">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center w-full h-full py-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-12 h-3 bg-gray-200 rounded mt-1 animate-pulse"></div>
            </div>
          ))}
        </div>
      </nav>
    )
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-50">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))

          if (item.isFab) {
            // Central FAB placeholder
            return (
              <div key={item.href} className="w-14" />
            )
          }

          // Handle sign-in button specially
          if (item.isSignIn) {
            return (
              <button
                key="signin"
                onClick={handleGoogleSignIn}
                className="flex flex-col items-center justify-center w-full h-full py-2 transition-all duration-200 group text-slate-500 hover:text-[#0b6d41]"
              >
                <div className="group-hover:bg-gray-100 rounded-full p-2 transition-colors duration-200">
                  <item.icon className="h-5 w-5 transition-all duration-200 text-slate-500 group-hover:text-[#0b6d41] group-hover:scale-110" />
                </div>
                <span className="text-xs mt-1 font-medium transition-all duration-200 text-slate-500 group-hover:text-[#0b6d41]">
                  {item.name}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-2 transition-all duration-200 group ${
                isActive 
                  ? 'text-[#0b6d41]' 
                  : 'text-slate-500 hover:text-[#0b6d41]'
              }`}
            >
              <div className={`relative ${
                isActive 
                  ? 'bg-gradient-to-r from-[#ffde59]/20 to-[#fff4a3]/20 rounded-full p-2' 
                  : 'group-hover:bg-gray-100 rounded-full p-2 transition-colors duration-200'
              }`}>
                <item.icon 
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? 'text-[#0b6d41]' : 'text-slate-500 group-hover:text-[#0b6d41] group-hover:scale-110'
                  }`} 
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#ffde59] rounded-full"></div>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium transition-all duration-200 ${
                isActive ? 'text-[#0b6d41]' : 'text-slate-500 group-hover:text-[#0b6d41]'
              }`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
