import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export interface UserPresence {
  user_id: string
  is_online: boolean
  last_seen: string
  full_name?: string
  avatar_url?: string
}

export function useUserPresence() {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [userStatus, setUserStatus] = useState<'online' | 'offline'>('offline')

  // Update user's online status via API (bypasses RLS)
  const updatePresence = async (isOnline: boolean) => {
    if (!user) return

    try {
      const response = await fetch('/api/user-presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id, 
          isOnline: isOnline 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error updating presence via API:', errorData)
        return
      }

      setUserStatus(isOnline ? 'online' : 'offline')
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  // Set user online when hook mounts
  useEffect(() => {
    if (user) {
      updatePresence(true)
      // Fallback: set status to online locally even if DB update fails
      setUserStatus('online')
    } else {
      setUserStatus('offline')
    }
  }, [user])

  // Set user offline when page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        // Use fetch with keepalive instead of sendBeacon for proper JSON handling
        fetch(`${window.location.origin}/api/user-presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, isOnline: false }),
          keepalive: true // Similar to sendBeacon for reliability
        }).catch(error => {
          console.error('Error setting user offline:', error)
        })
      }
    }

    const handleVisibilityChange = () => {
      if (user) {
        updatePresence(!document.hidden)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Fetch and subscribe to online users (read-only operations can use regular client)
  useEffect(() => {
    if (!user) return

    // Initial fetch of online users
    const fetchOnlineUsers = async () => {
      try {
        // First, try a simple query without joins
        const { data: presenceData, error: presenceError } = await supabase
          .from('user_presence')
          .select('user_id, is_online, last_seen')
          .eq('is_online', true)

        if (presenceError) {
          console.error('Error fetching presence data:', presenceError)
          return
        }

        if (!presenceData || presenceData.length === 0) {
          setOnlineUsers([])
          return
        }

        // Then fetch user profiles separately
        const userIds = presenceData.map(item => item.user_id)
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        if (profilesError) {
          console.warn('Error fetching user profiles:', profilesError)
          // Continue without profile data
        }

        const formattedUsers: UserPresence[] = presenceData.map((item: any) => {
          const profile = profilesData?.find(p => p.id === item.user_id)
          return {
            user_id: item.user_id,
            is_online: item.is_online,
            last_seen: item.last_seen,
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url
          }
        })

        setOnlineUsers(formattedUsers)
      } catch (error) {
        console.error('Error fetching online users:', error)
        // Set empty array on error to prevent UI issues
        setOnlineUsers([])
      }
    }

    fetchOnlineUsers()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('user_presence_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          fetchOnlineUsers() // Refetch to get updated data with profiles
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Heartbeat to maintain online status
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updatePresence(true)
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  return {
    onlineUsers,
    userStatus,
    updatePresence,
    currentUserOnlineCount: onlineUsers.length
  }
} 