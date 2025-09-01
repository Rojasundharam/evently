'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'organizer' | 'admin'
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  const supabase = createClient()

  // Fetch profile for a user
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return null
    }
  }

  // Initialize auth
  const initAuth = async () => {
    try {
      // Only run on client
      if (typeof window === 'undefined') {
        return
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('User fetch error:', userError)
        setState({ user: null, profile: null, loading: false, error: userError.message })
        return
      }

      if (!user) {
        setState({ user: null, profile: null, loading: false, error: null })
        return
      }

      // Fetch profile
      const profile = await fetchProfile(user.id)
      
      // If no profile exists, create one
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: 'user', // New users always start as 'user'
            avatar_url: user.user_metadata?.avatar_url || null
          })
          .select()
          .single()

        if (!createError && newProfile) {
          setState({ user, profile: newProfile, loading: false, error: null })
        } else {
          setState({ user, profile: null, loading: false, error: 'Failed to create profile' })
        }
      } else {
        setState({ user, profile, loading: false, error: null })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setState({
        user: null,
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Auth initialization failed'
      })
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setState({ user: null, profile: null, loading: false, error: null })
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id)
      setState(prev => ({ ...prev, profile }))
    }
  }

  // Initialize on mount
  useEffect(() => {
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        setState({ user: null, profile: null, loading: false, error: null })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Re-initialize auth on any auth change
        initAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Set up realtime subscription for profile changes
  useEffect(() => {
    if (!state.user) return

    const channel = supabase
      .channel(`profile_${state.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${state.user.id}`
        },
        (payload) => {
          console.log('Profile changed via realtime:', payload)
          if (payload.new && typeof payload.new === 'object' && 'role' in payload.new) {
            setState(prev => ({
              ...prev,
              profile: payload.new as UserProfile
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.user, supabase])

  return (
    <AuthContext.Provider value={{
      ...state,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Safe version that doesn't throw
export function useAuthSafe() {
  const context = useContext(AuthContext)
  return context || {
    user: null,
    profile: null,
    loading: true,
    error: null,
    signOut: async () => {},
    refreshProfile: async () => {}
  }
}

// Re-export types and helpers for compatibility
export type { UserProfile, AuthState }