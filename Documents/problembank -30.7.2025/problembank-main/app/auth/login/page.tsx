'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import MagicCard from '@/app/components/ui/magic-card'
import MagicButton from '@/app/components/ui/magic-button'

const LoginPage = () => {
  // const router = useRouter()
  const { loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add auth-page class to body on mount, remove on unmount
  React.useEffect(() => {
    document.body.classList.add('auth-page')
    return () => {
      document.body.classList.remove('auth-page')
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message || 'Failed to sign in with Google')
      }
      // If successful, user will be redirected automatically
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-page-container bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page-container bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Login Card with Magic Effects */}
        <MagicCard className="p-8 shadow-2xl">
          <div className="text-center mb-8">
            {/* Enhanced Logo */}
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-110 transition-transform duration-300">
                <User className="w-10 h-10 text-white" />
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              </div>
              {/* Floating particles */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Continue with Google
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-50/50"></div>
              <p className="text-red-700 text-sm relative z-10 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Enhanced Google Sign In Button */}
            <MagicButton
              onClick={handleGoogleSignIn}
              disabled={isLoading || loading}
              className="w-full"
              size="lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>
                {isLoading || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Continue with Google'
                )}
              </span>
            </MagicButton>
          </div>

          {/* Enhanced Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              New to Problem Bank?{' '}
              <Link 
                href="/auth/signup" 
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-all duration-200 hover:underline decoration-2 underline-offset-2"
              >
                Create Account
              </Link>
            </p>
          </div>
        </MagicCard>
      </div>
    </div>
  )
}

export default LoginPage 