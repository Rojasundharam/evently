'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import LoadingScreen from './LoadingScreen'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Check if environment variables are configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'

  // Define which pages don't require authentication
  const publicPages = ['/auth/login', '/auth/signup', '/auth/callback']
  const isPublicPage = publicPages.includes(pathname)

  // Show configuration error if Supabase is not configured
  if (!isSupabaseConfigured) {
    // Temporary bypass for demo purposes - remove in production
    if (process.env.NODE_ENV === 'production') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-yellow-500 text-5xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Demo Mode
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Running in demo mode. Some features may be limited.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Continue to App
            </button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Configuration Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The application is not properly configured. Environment variables are missing.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              Missing: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Please contact the administrator to resolve this issue.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Don't do anything while loading or on callback page
    if (loading || pathname === '/auth/callback') {
      return
    }

    // Simple redirect logic with delay to prevent loops
    const redirectTimer = setTimeout(() => {
      if (!user && !isPublicPage) {
        console.log('AuthGuard: Redirecting to login')
        router.replace('/auth/login')
      } else if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
        console.log('AuthGuard: Redirecting to dashboard')
        router.replace('/')
      }
    }, 100)

    return () => clearTimeout(redirectTimer)
  }, [user, loading, isPublicPage, pathname, router])

  // Always show loading while checking auth
  if (loading) {
    return <LoadingScreen message="Loading..." />
  }

  // Always allow callback page
  if (pathname === '/auth/callback') {
    return <>{children}</>
  }

  // Allow public pages for everyone
  if (isPublicPage) {
    return <>{children}</>
  }

  // Require authentication for protected pages
  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />
  }

  // Authenticated user on protected page
  return <>{children}</>
}

export default AuthGuard 