'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface UserProfile {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  country?: string
  role: 'admin' | 'industry_expert' | 'student'
  status: 'active' | 'invited' | 'suspended'
  problems_submitted: number
  solutions_posted: number
  total_votes_received: number
  streak_days: number
  last_active: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
  isAdmin: boolean
  isExpert: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let isMounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          return
        }

        // Prevent multiple initialization attempts
        if (initialized) {
          return
        }

        console.log('Initializing authentication...')

        // Simple session check with shorter timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: Session | null }, error: any }>((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 3000)
          )
        ])
        
        if (error && !error.message.includes('timeout')) {
          console.error('Error getting session:', error)
          // Don't throw, just continue without auth
        }

        if (isMounted && !initialized) {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Only fetch profile if we have a session
          if (session?.user) {
            console.log('User found, fetching profile...')
            fetchUserProfile(session.user.id).catch(err => {
              console.warn('Profile fetch failed, continuing without profile:', err)
            })
          } else {
            console.log('No user session found')
          }
          
          setInitialized(true)
          setLoading(false)
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return
            
            console.log('Auth state changed:', event, session?.user?.id)
            
            // Prevent rapid-fire auth state changes
            if (event === 'INITIAL_SESSION') {
              return // We already handled this
            }
            
            if (isMounted) {
              // Handle token expiration
              if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
                console.log('Token refreshed or user signed in')
              } else if (event === 'SIGNED_OUT') {
                console.log('User signed out')
                setProfile(null)
              }
              
              setSession(session)
              setUser(session?.user ?? null)
              
              if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                fetchUserProfile(session.user.id).catch(error => {
                  console.warn('Profile fetch failed during auth state change:', error)
                })
              }
              
              if (!initialized) {
                setInitialized(true)
                setLoading(false)
              }
            }
          }
        )
        
        authSubscription = subscription
      } catch (error) {
        console.error('Auth initialization error:', error)
        
        // Always set initialized to prevent infinite loading
        if (isMounted) {
          setInitialized(true)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Shorter timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!initialized && isMounted) {
        console.warn('Auth initialization timeout - continuing without auth')
        setInitialized(true)
        setLoading(false)
      }
    }, 3000) // Further reduced timeout to prevent long loading

    return () => {
      isMounted = false
      clearTimeout(timeout)
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [initialized])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId)
      
      // Try user_profiles table first
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // If user_profiles doesn't work, try profiles table
      if (error && error.code === 'PGRST116') {
        console.log('user_profiles not found, trying profiles table...')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (profileError && profileError.code === 'PGRST116') {
          console.log('profiles not found either, trying by email...')
          const { data: userData } = await supabase.auth.getUser()
          const userEmail = userData.user?.email
          
          if (userEmail) {
            // Try finding by email in profiles table
            const { data: emailProfileData, error: emailError } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', userEmail)
              .single()
            
            if (!emailError && emailProfileData) {
              data = emailProfileData
              error = null
            }
          }
        } else if (!profileError) {
          data = profileData
          error = null
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch error:', error.message)
        // Create fallback profile if none exists
        await createFallbackProfile(userId)
        return
      }

      if (data) {
        // Ensure the role field is properly typed
        const profileWithRole = {
          ...data,
          role: data.role || 'student'
        } as UserProfile
        
        setProfile(profileWithRole)
        console.log('Profile loaded successfully:', profileWithRole)
      } else {
        console.log('No profile found, creating fallback...')
        await createFallbackProfile(userId)
      }
    } catch (error) {
      console.warn('Error fetching profile:', error)
      await createFallbackProfile(userId)
    }
  }

  const createFallbackProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      
      const fallbackProfile: UserProfile = {
        id: userId,
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        role: 'student',
        status: 'active',
        problems_submitted: 0,
        solutions_posted: 0,
        total_votes_received: 0,
        streak_days: 0,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setProfile(fallbackProfile)
      console.log('Fallback profile created')
      
      // Try to create profile in database (don't await to prevent blocking)
      createUserProfile(userId).catch(error => {
        console.warn('Error creating user profile in database:', error)
      })
    } catch (error) {
      console.warn('Error creating fallback profile:', error)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      const newProfile = {
        id: userId,
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        role: 'student' as const,
        status: 'active' as const,
        problems_submitted: 0,
        solutions_posted: 0,
        total_votes_received: 0,
        streak_days: 0,
        last_active: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_profiles')
        .insert([newProfile])

      if (error) {
        console.warn('Error creating user profile:', error.message)
      } else {
        console.log('User profile created successfully')
        setProfile({ ...newProfile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      }
    } catch (error) {
      console.warn('Error in createUserProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (!error && profile) {
        setProfile({ ...profile, ...updates, updated_at: new Date().toISOString() })
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading: loading || !initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isExpert: profile?.role === 'industry_expert',
    isStudent: profile?.role === 'student',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 