'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User as Home, Target, Plus, MessageSquare, User, Lightbulb } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const MobileBottomNav = () => {
  const pathname = usePathname()
  const { isDarkMode } = useTheme()

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
      isActive: pathname === '/'
    },
    {
      id: 'problems',
      label: 'Problems',
      icon: Target,
      href: '/problems',
      isActive: pathname.startsWith('/problems')
    },
    {
      id: 'submit',
      label: 'Submit',
      icon: Plus,
      href: '/submit-problem',
      isActive: pathname === '/submit-problem',
      isCenter: true
    },
    {
      id: 'solutions',
      label: 'Solutions',
      icon: Lightbulb,
      href: '/solutions',
      isActive: pathname.startsWith('/solutions')
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '/settings',
      isActive: pathname === '/settings'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div 
        className={`${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-800' 
            : 'bg-white/95 border-gray-200'
        } backdrop-blur-xl border-t`}
        style={{ height: '56px' }}
      >
        <div className="flex items-center justify-around h-full px-1">
          {navItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                  item.isCenter 
                    ? 'transform -translate-y-1' 
                    : ''
                }`}
              >
                <div 
                  className={`flex items-center justify-center transition-all duration-200 ${
                    item.isCenter
                      ? `w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg ${
                          item.isActive ? 'shadow-indigo-500/50' : ''
                        }`
                      : `${
                          item.isActive
                            ? isDarkMode 
                              ? 'text-indigo-400' 
                              : 'text-indigo-600'
                            : isDarkMode 
                              ? 'text-gray-400' 
                              : 'text-gray-600'
                        }`
                  }`}
                  style={{ 
                    opacity: item.isActive ? 1 : 0.7
                  }}
                >
                  <IconComponent 
                    className={item.isCenter ? 'w-5 h-5' : 'w-5 h-5'}
                    strokeWidth={2}
                  />
                </div>
                <span 
                  className={`text-xs font-medium mt-0.5 transition-all duration-200 ${
                    item.isCenter
                      ? isDarkMode 
                        ? 'text-gray-300' 
                        : 'text-gray-600'
                      : item.isActive
                        ? isDarkMode 
                          ? 'text-indigo-400' 
                          : 'text-indigo-600'
                        : isDarkMode 
                          ? 'text-gray-400' 
                          : 'text-gray-600'
                  }`}
                  style={{ 
                    opacity: item.isActive ? 1 : 0.7,
                    fontSize: '10px'
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileBottomNav 