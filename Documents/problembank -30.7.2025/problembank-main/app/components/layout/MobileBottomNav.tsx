'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Target, Plus, MessageSquare, Lightbulb, ArrowRight, Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'

const MobileBottomNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { isDarkMode } = useTheme()
  const { isAdmin, loading, signOut } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      if (!signOut) {
        console.error('signOut function not available')
        return
      }
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  interface NavItem {
    id: string
    label: string
    icon: React.ComponentType<any>
    href: string
    isActive: boolean
    isCenter?: boolean
    color: string
  }

  // Base navigation items for regular users
  const baseNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: User,
      href: '/',
      isActive: pathname === '/',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'problems',
      label: 'Problems',
      icon: Target,
      href: '/problems',
      isActive: pathname.startsWith('/problems'),
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'submit',
      label: 'Submit',
      icon: Plus,
      href: '/submit-problem',
      isActive: pathname === '/submit-problem',
      isCenter: true,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'solutions',
      label: 'Solutions',
      icon: Lightbulb,
      href: '/solutions',
      isActive: pathname.startsWith('/solutions'),
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: ArrowRight,
      href: '#',
      isActive: false,
      color: 'from-red-500 to-pink-500'
    }
  ]

  // Admin navigation items
  const adminNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: User,
      href: '/',
      isActive: pathname === '/',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'problems',
      label: 'Problems',
      icon: Target,
      href: '/problems',
      isActive: pathname.startsWith('/problems'),
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'submit',
      label: 'Submit',
      icon: Plus,
      href: '/submit-problem',
      isActive: pathname === '/submit-problem',
      isCenter: true,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'solutions',
      label: 'Solutions',
      icon: Lightbulb,
      href: '/solutions',
      isActive: pathname.startsWith('/solutions'),
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: ArrowRight,
      href: '#',
      isActive: false,
      color: 'from-red-500 to-pink-500'
    }
  ]

  // Choose navigation items based on admin status
  const navItems = isAdmin ? adminNavItems : baseNavItems

  // Prevent SSR hydration mismatch and wait for auth
  if (!isMounted || loading) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Main navigation container */}
      <div 
        className={`relative ${
          isDarkMode 
            ? 'bg-slate-900/90 border-slate-700/30' 
            : 'bg-white/90 border-gray-200/40'
        } backdrop-blur-md border-t shadow-lg`}
        style={{ height: '60px' }}
      >
        {/* Active indicator background */}
        <div className="absolute top-0 left-0 right-0 h-0.5">
          <div className="relative h-full">
            {navItems.map((item) => (
              item.isActive && (
                <div
                  key={`indicator-${item.id}`}
                  className={`absolute top-0 h-0.5 bg-gradient-to-r ${item.color} transition-all duration-300`}
                  style={{
                    left: `${(navItems.indexOf(item) / navItems.length) * 100}%`,
                    width: `${100 / navItems.length}%`
                  }}
                />
              )
            ))}
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex items-center justify-around h-full px-1 relative">
          {navItems.map((item, index) => {
            const IconComponent = item.icon
            
            // Handle logout action
            if (item.id === 'logout') {
              return (
                <button
                  key={item.id}
                  onClick={handleLogout}
                  className={`group flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative overflow-hidden rounded-xl hover:scale-105 active:scale-95`}
                  tabIndex={0}
                  aria-label="Logout"
                >
                  {/* Hover background effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-8 transition-opacity duration-200 rounded-xl`} />
                  
                  <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'group-hover:bg-red-500/15' 
                      : 'group-hover:bg-red-500/10'
                  }`}>
                    <IconComponent 
                      className="w-5 h-5 text-red-500 transition-all duration-200 group-hover:scale-105"
                      strokeWidth={2}
                    />
                  </div>
                  
                  <span className="text-[10px] font-medium mt-0.5 text-red-500 transition-all duration-200">
                    {item.label}
                  </span>
                </button>
              )
            }
            
            // Handle center submit button
            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative overflow-hidden rounded-xl`}
                >
                  {/* Center button elevated design */}
                  <div className={`relative z-10 flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-r ${item.color} shadow-md transition-all duration-200 group-hover:shadow-lg group-hover:scale-105 group-active:scale-95 ${
                    item.isActive ? 'scale-105 shadow-lg' : ''
                  }`}>
                    <IconComponent 
                      className="w-5 h-5 text-white transition-all duration-200"
                      strokeWidth={2.5}
                    />
                  </div>
                  
                  <span className={`text-[10px] font-medium mt-0.5 transition-all duration-200 ${
                    item.isActive 
                      ? 'text-indigo-500 font-semibold' 
                      : isDarkMode 
                        ? 'text-gray-400 group-hover:text-gray-300' 
                        : 'text-gray-600 group-hover:text-gray-700'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active state dot indicator */}
                  {item.isActive && (
                    <div className={`absolute -top-1 w-1 h-1 rounded-full bg-gradient-to-r ${item.color} animate-pulse`} />
                  )}
                </Link>
              )
            }
            
            // Regular navigation items
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative overflow-hidden rounded-xl hover:scale-105 active:scale-95`}
              >
                {/* Hover background effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-8 transition-opacity duration-200 rounded-xl`} />
                
                <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                  item.isActive 
                    ? `bg-gradient-to-r ${item.color} bg-opacity-15` 
                    : isDarkMode 
                      ? 'group-hover:bg-white/5' 
                      : 'group-hover:bg-black/5'
                }`}>
                  <IconComponent 
                    className={`w-5 h-5 transition-all duration-200 ${
                      item.isActive 
                        ? item.id === 'home' 
                          ? 'text-blue-500'
                          : item.id === 'problems'
                          ? 'text-emerald-500'
                          : item.id === 'solutions'
                          ? 'text-amber-500'
                          : 'text-gray-500'
                        : isDarkMode 
                          ? 'text-gray-400 group-hover:text-gray-300' 
                          : 'text-gray-600 group-hover:text-gray-700'
                    }`}
                    strokeWidth={2}
                  />
                </div>
                
                <span className={`text-[10px] font-medium mt-0.5 transition-all duration-200 ${
                  item.isActive 
                    ? item.id === 'home' 
                      ? 'text-blue-500 font-semibold'
                      : item.id === 'problems'
                      ? 'text-emerald-500 font-semibold'
                      : item.id === 'solutions'
                      ? 'text-amber-500 font-semibold'
                      : 'text-gray-500 font-semibold'
                    : isDarkMode 
                      ? 'text-gray-400 group-hover:text-gray-300' 
                      : 'text-gray-600 group-hover:text-gray-700'
                }`}>
                  {item.label}
                </span>
                
                {/* Active state dot indicator */}
                {item.isActive && (
                  <div className={`absolute -top-1 w-1 h-1 rounded-full bg-gradient-to-r ${item.color} animate-pulse`} />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileBottomNav 