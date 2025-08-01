'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: Error | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        setAuthState({
          user: data.session?.user || null,
          session: data.session,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          error: error as Error,
        })
      }
    }
    
    getInitialSession()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user || null,
          session,
          isLoading: false,
          error: null,
        })
      }
    )

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return authState
} 