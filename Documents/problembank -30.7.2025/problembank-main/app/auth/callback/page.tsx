'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const hasProcessed = useRef(false) // Prevent duplicate processing

  // Add auth-page class to body on mount, remove on unmount
  useEffect(() => {
    document.body.classList.add('auth-page')
    return () => {
      document.body.classList.remove('auth-page')
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let redirectTimeout: NodeJS.Timeout

    const handleAuthCallback = async () => {
      // Prevent duplicate processing
      if (hasProcessed.current) {
        console.log('Callback already processed, skipping...')
        return
      }
      
      hasProcessed.current = true

      try {
        console.log('Auth callback starting...', window.location.href)
        
        // Check for error in URL params first
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription)
          if (isMounted) {
            setError(errorDescription || errorParam)
            setIsProcessing(false)
            redirectTimeout = setTimeout(() => {
              if (isMounted) router.replace('/auth/login')
            }, 3000)
          }
          return
        }

        // Check if we have a code parameter
        const code = searchParams.get('code')
        if (!code) {
          console.log('No auth code found, checking current session...')
          
          // Check if we already have a valid session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (session && session.user) {
            console.log('✅ Already authenticated, redirecting...')
            console.log('🔄 FORCING REDIRECT TO DASHBOARD (existing session)')
            if (isMounted) {
              setIsProcessing(false)
              redirectTimeout = setTimeout(() => {
                if (isMounted) {
                  console.log('🎯 Executing dashboard redirect (existing session)')
                  router.replace('/')
                }
              }, 100)
            }
            return
          }
          
          console.log('No code and no session, redirecting to login...')
          if (isMounted) {
            setError('No authorization code received')
            setIsProcessing(false)
            redirectTimeout = setTimeout(() => {
              if (isMounted) router.replace('/auth/login')
            }, 2000)
          }
          return
        }

        // Check if this code has already been used
        const currentUrl = window.location.href
        console.log('Current URL:', currentUrl)
        
        // ✅ PKCE Flow: Exchange code for session
        console.log('Exchanging code for session...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(currentUrl)
        
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError)
          
          // Handle specific PKCE error
          if (exchangeError.message.includes('code verifier') || exchangeError.message.includes('invalid request')) {
            console.log('PKCE error detected, checking existing session...')
            
            // Check if we already have a valid session despite the error
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (session && session.user) {
              console.log('✅ Valid session exists despite PKCE error, proceeding...')
              console.log('🔄 FORCING REDIRECT TO DASHBOARD (PKCE error recovery)')
              if (isMounted) {
                setIsProcessing(false)
                // Clean up URL immediately
                window.history.replaceState({}, document.title, '/')
                redirectTimeout = setTimeout(() => {
                  if (isMounted) {
                    console.log('🎯 Executing dashboard redirect (PKCE error recovery)')
                    router.replace('/')
                  }
                }, 100)
              }
              return
            }
          }
          
          if (isMounted) {
            setError(`Authentication failed: ${exchangeError.message}`)
            setIsProcessing(false)
            redirectTimeout = setTimeout(() => {
              if (isMounted) router.replace('/auth/login')
            }, 3000)
          }
          return
        }

        // Check if we got a valid session
        if (data.session && data.session.user) {
          console.log('✅ Session created successfully:', data.session.user.email)
          console.log('Session expires at:', new Date(data.session.expires_at! * 1000))
          console.log('🔄 FORCING REDIRECT TO DASHBOARD')
          
          if (isMounted) {
            setIsProcessing(false)
            // Clean up URL and redirect
            window.history.replaceState({}, document.title, '/')
            
            // Force immediate redirect to dashboard
            console.log('🏠 Redirecting to dashboard now...')
            setTimeout(() => {
              if (isMounted) {
                console.log('🎯 Executing dashboard redirect')
                router.replace('/')
              }
            }, 100)
          }
        } else {
          console.log('❌ No session created from code exchange')
          if (isMounted) {
            setError('Session creation failed. Please try signing in again.')
            setIsProcessing(false)
            redirectTimeout = setTimeout(() => {
              if (isMounted) router.replace('/auth/login')
            }, 3000)
          }
        }
      } catch (error) {
        console.error('Callback handler error:', error)
        if (isMounted) {
          setError('An unexpected error occurred during authentication')
          setIsProcessing(false)
          redirectTimeout = setTimeout(() => {
            if (isMounted) router.replace('/auth/login')
          }, 3000)
        }
      }
    }

    // Add a small delay to ensure the component is mounted before processing
    const initTimeout = setTimeout(() => {
      if (isMounted && !hasProcessed.current) {
        handleAuthCallback()
      }
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(initTimeout)
      if (redirectTimeout) {
        clearTimeout(redirectTimeout)
      }
    }
  }, [router, searchParams])

  // Reset processing flag when component unmounts
  useEffect(() => {
    return () => {
      hasProcessed.current = false
    }
  }, [])

  if (error) {
    return (
      <div className="auth-page-container bg-white flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
          <button 
            onClick={() => router.replace('/auth/login')}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="auth-page-container bg-white flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment...</p>
        </div>
      </div>
    )
  }

  // This should rarely be reached
  return (
    <div className="auth-page-container bg-white flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Authentication complete. Redirecting...</p>
      </div>
    </div>
  )
}