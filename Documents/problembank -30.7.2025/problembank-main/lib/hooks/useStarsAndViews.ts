'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, ProblemStar, ProblemView } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Global cache to prevent duplicate requests for the same problem
const viewCache = new Map<string, { views: number, timestamp: number }>()
const pendingViewRequests = new Set<string>()
const CACHE_DURATION = 30000 // 30 seconds

export function useStarsAndViews(problemId: string) {
  const { user } = useAuth()
  const [isStarred, setIsStarred] = useState(false)
  const [starCount, setStarCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const hasTrackedView = useRef(false)
  const realtimeChannelsRef = useRef<any[]>([])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Clean up all real-time channels
      realtimeChannelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.warn('Error removing channel:', error)
        }
      })
      realtimeChannelsRef.current = []
    }
  }, [])

  // Fetch initial data
  useEffect(() => {
    if (problemId && isMountedRef.current) {
      console.log('🔄 Starting initial data fetch for problem:', problemId)
      fetchStarAndViewData()
      setupRealtimeSubscriptions()
    }
  }, [problemId, user?.id])

  // Track view when component mounts (only once per problem per session)
  useEffect(() => {
    if (problemId && !hasTrackedView.current && isMountedRef.current) {
      hasTrackedView.current = true
      
      // Debounce view tracking
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          trackView()
        }
      }, 2000) // Longer delay to ensure database is ready
      
      return () => clearTimeout(timer)
    }
  }, [problemId])

  const fetchStarAndViewData = async () => {
    if (!isMountedRef.current) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching view data for problem:', problemId)
      
      // Fetch problem data including views
      const { data: problemData, error: problemError } = await supabase
        .from('problems')
        .select('views')
        .eq('id', problemId)
        .single()

      if (!isMountedRef.current) return

      if (problemError) {
        console.warn('❌ Error fetching problem views:', problemError)
        setViewCount(0)
      } else {
        const views = problemData.views || 0
        console.log('📊 Fetched view count:', views, 'for problem:', problemId)
        setViewCount(views)
        // Update cache
        viewCache.set(problemId, { views, timestamp: Date.now() })
      }

      // Check if current user has starred this problem (only for authenticated users)
      if (user?.id && isMountedRef.current) {
        const { data: starData, error: starError } = await supabase
          .from('problem_stars')
          .select('id')
          .eq('problem_id', problemId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!isMountedRef.current) return

        if (starError && starError.code !== 'PGRST116') {
          console.warn('❌ Error fetching star data:', starError)
          setIsStarred(false)
        } else {
          setIsStarred(!!starData)
          console.log('⭐ Star status:', !!starData ? 'starred' : 'not starred')
        }
      }

    } catch (err) {
      if (!isMountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch star/view data'
      setError(errorMessage)
      console.error('❌ Error fetching star/view data:', errorMessage, err)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        console.log('✅ Initial data fetch completed')
      }
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!isMountedRef.current) return

    console.log('🔔 Setting up real-time subscriptions for problem:', problemId)

    // Subscribe to problem updates (for view count changes)
    const problemChannel = supabase
      .channel(`problem_${problemId}_updates`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'problems',
        filter: `id=eq.${problemId}`
      }, (payload: any) => {
        if (!isMountedRef.current) return
        
        console.log('📡 Real-time update received for problem:', problemId, payload)
        
        // Problem view count updated
        if (payload.new && payload.new.views !== undefined) {
          const newViews = payload.new.views
          const oldViews = payload.old?.views || 0
          
          console.log(`📊 View count updated via real-time: ${oldViews} → ${newViews}`)
          
          // Always update to the database value (source of truth)
          setViewCount(newViews)
          
          // Update cache
          viewCache.set(problemId, { views: newViews, timestamp: Date.now() })
        }
      })
      .subscribe()

    // Add to cleanup list
    realtimeChannelsRef.current.push(problemChannel)

    // Subscribe to star changes for this problem (only for authenticated users)
    if (user?.id) {
      const starChannel = supabase
        .channel(`problem_${problemId}_stars_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'problem_stars',
          filter: `problem_id=eq.${problemId}`
        }, (payload: RealtimePostgresChangesPayload<ProblemStar>) => {
          if (!isMountedRef.current) return
          
          console.log('⭐ Star update received:', payload)
          
          // Only update if it's the current user's star
          const newStar = payload.new as ProblemStar
          const oldStar = payload.old as ProblemStar
          
          if (newStar?.user_id === user.id || oldStar?.user_id === user.id) {
            if (payload.eventType === 'INSERT' && newStar) {
              setIsStarred(true)
            } else if (payload.eventType === 'DELETE' && oldStar) {
              setIsStarred(false)
            }
          }
        })
        .subscribe()

      // Add to cleanup list
      realtimeChannelsRef.current.push(starChannel)
    }
  }

  const trackView = async () => {
    if (!isMountedRef.current || !problemId) {
      return
    }

    // Create a unique key for this view tracking attempt
    const sessionId = Math.random().toString(36).substring(7)
    const viewKey = user?.id ? `${problemId}_${user.id}` : `${problemId}_${sessionId}`
    
    // Prevent duplicate view tracking for the same problem
    if (pendingViewRequests.has(viewKey)) {
      console.log('⏳ View tracking already in progress for:', viewKey)
      return
    }

    try {
      pendingViewRequests.add(viewKey)
      
      console.log('🔍 Tracking view for problem:', problemId, 'User:', user?.id || 'anonymous')

      // Try to insert view record
      const viewData: any = {
        problem_id: problemId
      }
      
      // Add user_id only if user is authenticated
      if (user?.id) {
        viewData.user_id = user.id
      }

      const { error: insertError } = await supabase
        .from('problem_views')
        .insert([viewData])

      if (!isMountedRef.current) return

      // Handle different types of errors
      if (insertError) {
        // If it's a duplicate error (constraint violation), that's fine - view already counted
        if (insertError.code === '23505') {
          console.log('✅ View already counted for this user/problem combination')
        } else {
          console.warn('❌ Error inserting view record:', insertError)
        }
      } else {
        console.log('✅ Successfully tracked new view!')
        console.log('⏰ Database trigger should update view count and fire real-time event...')
      }

      // Always refresh the view count to ensure UI matches database
      setTimeout(async () => {
        if (isMountedRef.current) {
          console.log('🔄 Syncing view count with database...')
          
          const { data: updatedProblem, error } = await supabase
            .from('problems')
            .select('views')
            .eq('id', problemId)
            .single()
          
          if (!error && updatedProblem) {
            const dbViews = updatedProblem.views || 0
            console.log('📊 Database view count:', dbViews, 'Current UI count:', viewCount)
            
            // Only update if there's a difference
            if (dbViews !== viewCount) {
              console.log('🔄 Syncing UI to match database')
              setViewCount(dbViews)
            }
          }
        }
      }, 1000) // Give time for trigger to execute

    } catch (err) {
      if (!isMountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error tracking view'
      console.warn('❌ Error tracking view:', {
        message: errorMessage,
        problemId,
        userId: user?.id
      })
    } finally {
      pendingViewRequests.delete(viewKey)
    }
  }

  const toggleStar = async () => {
    if (!user?.id || !isMountedRef.current) {
      alert('Please log in to star problems.')
      return
    }

    try {
      if (isStarred) {
        // Remove star
        const { error } = await supabase
          .from('problem_stars')
          .delete()
          .eq('problem_id', problemId)
          .eq('user_id', user.id)

        if (error) throw error
        if (isMountedRef.current) {
          setIsStarred(false)
        }
      } else {
        // Add star
        const { error } = await supabase
          .from('problem_stars')
          .insert([
            {
              user_id: user.id,
              problem_id: problemId
            }
          ])

        if (error) throw error
        if (isMountedRef.current) {
          setIsStarred(true)
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error toggling star'
      console.error('Error toggling star:', errorMessage, err)
      alert(`Failed to update star: ${errorMessage}. Please try again.`)
    }
  }

  return {
    isStarred,
    starCount,
    viewCount,
    loading,
    error,
    toggleStar
  }
} 