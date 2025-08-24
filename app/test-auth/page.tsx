'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function TestAuthPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session check:', { session, sessionError })

      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('User check:', { user, userError })

      if (userError) {
        setError(`User error: ${userError.message}`)
        return
      }

      setUser(user)

      if (user) {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        console.log('Profile check:', { profileData, profileError })

        if (profileError) {
          setError(`Profile error: ${profileError.message}`)
        } else {
          setProfile(profileData)
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/test-auth`
        }
      })
      
      if (error) {
        setError(`Sign in error: ${error.message}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(`Sign out error: ${error.message}`)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  const updateUserRole = async (newRole: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)

      if (error) {
        setError(`Role update error: ${error.message}`)
      } else {
        // Refresh profile data
        checkAuth()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role update failed')
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b6d41] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authentication Test</h1>
          <p className="text-gray-600 mt-2">Test and manage user authentication and roles</p>
        </div>
        <button
          onClick={checkAuth}
          className="px-4 py-2 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Authentication Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700">
              {user ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          {user && (
            <>
              <div className="text-sm text-gray-600">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          {!user ? (
            <button
              onClick={handleSignIn}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In with Google
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      {user && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          {profile ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Full Name:</p>
                  <p className="font-medium">{profile.full_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Role:</p>
                  <p className={`font-medium ${
                    profile.role === 'admin' ? 'text-red-600' :
                    profile.role === 'organizer' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {profile.role || 'user'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-600 mb-2">Update Role:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateUserRole('user')}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    User
                  </button>
                  <button
                    onClick={() => updateUserRole('organizer')}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Organizer
                  </button>
                  <button
                    onClick={() => updateUserRole('admin')}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No profile found. Creating profile...</p>
          )}
        </div>
      )}

      {/* Environment Check */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Check</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Supabase URL:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 
                'Missing ✗'
              }
            </p>
          </div>
          <div>
            <p className="text-gray-600">Supabase Anon Key:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` : 
                'Missing ✗'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/events"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Events Page
          </a>
          <a
            href="/admin/payments"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Test Admin Payments
          </a>
          <a
            href="/organizer/my-events"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Test Organizer Events
          </a>
          <a
            href="/test-api"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test API Endpoints
          </a>
        </div>
      </div>
    </div>
  )
}
