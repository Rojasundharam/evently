
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, Target, MessageSquare, Star, Trophy, User, Users, Activity, Lightbulb } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

interface FABAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  href: string
  color: string
  adminOnly?: boolean
}

const FloatingActionButton = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { isDarkMode } = useTheme()
  const { isAdmin, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const fabRef = useRef<HTMLDivElement>(null)

  const actions: FABAction[] = [
    {
      id: pathname.startsWith('/solutions') ? 'submit-solution' : 'submit-problem',
      label: pathname.startsWith('/solutions') ? 'Submit Solution' : 'Submit Problem',
      icon: pathname.startsWith('/solutions') ? Lightbulb : Target,
      href: pathname.startsWith('/solutions') ? '/solutions' : '/submit-problem',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'start-discussion',
      label: 'Discussion',
      icon: MessageSquare,
      href: '/discussions',
      color: 'from-emerald-500 to-green-500'
    },
    {
      id: 'view-starred',
      label: 'Starred',
      icon: Star,
      href: '/starred',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      href: '/leaderboard',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      href: '/admin/analytics',
      color: 'from-blue-500 to-cyan-500',
      adminOnly: true
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      href: '/admin/users',
      color: 'from-violet-500 to-purple-500',
      adminOnly: true
    }
  ]

  // Filter actions based on admin status
  const filteredActions = actions.filter(action => 
    !action.adminOnly || (action.adminOnly && isAdmin)
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  const handleFABClick = () => {
    setIsExpanded(!isExpanded)
  }

  const handleActionClick = (action: FABAction) => {
    if (action.id === 'submit-solution' && pathname.startsWith('/solutions')) {
      // Trigger custom event for solutions page to open submission modal
      const event = new CustomEvent('openSolutionSubmissionModal')
      window.dispatchEvent(event)
      setIsExpanded(false)
    } else {
      router.push(action.href)
      setIsExpanded(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(false)
  }

  if (!isMounted || loading) return null

  return (
    <>
      {/* Backdrop overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[90] md:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Main FAB Container */}
      <div ref={fabRef} className="fixed z-[110] bottom-16 right-4 md:hidden">
        {/* Sub-actions */}
        {isExpanded && (
          <div className="absolute bottom-14 right-0 flex flex-col-reverse space-y-reverse space-y-2.5 z-[120]">
            {filteredActions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-end space-x-2.5 animate-in slide-in-from-bottom-1 fade-in z-[120]"
                  style={{
                    animationDelay: `${index * 40}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Action label */}
                  <div 
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${
                      isDarkMode 
                        ? 'bg-gray-800/90 text-gray-100 border border-gray-600/40' 
                        : 'bg-white/90 text-gray-800 border border-gray-300/40'
                    } backdrop-blur-sm`}
                  >
                    {action.label}
                  </div>
                  
                  {/* Action button */}
                  <button
                    onClick={() => handleActionClick(action)}
                    className={`w-10 h-10 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 z-[120]`}
                    aria-label={action.label}
                  >
                    <IconComponent className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={handleFABClick}
          className={`w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 dark:focus:ring-indigo-400/50 z-[130] ${
            isExpanded ? 'rotate-45' : 'rotate-0'
          }`}
          aria-label={isExpanded ? "Close menu" : "Open menu"}
        >
          {isExpanded ? (
            <X className="w-5 h-5" strokeWidth={2.5} />
          ) : (
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </>
  )
}

export default FloatingActionButton 