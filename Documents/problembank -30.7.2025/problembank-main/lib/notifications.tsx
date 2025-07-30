'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export interface Notification {
  id: string
  type: 'problem_reply' | 'leaderboard_update' | 'product_announcement' | 'solution_vote' | 'new_problem'
  title: string
  message: string
  read: boolean
  created_at: string
  user_id: string
  related_id?: string // ID of related problem, solution, etc.
  priority: 'low' | 'medium' | 'high'
}

export interface NotificationPreferences {
  problem_replies: boolean
  leaderboard_updates: boolean
  product_announcements: boolean
  email_notifications: boolean
  push_notifications: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    problem_replies: true,
    leaderboard_updates: true,
    product_announcements: true,
    email_notifications: true,
    push_notifications: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [userProblemIds, setUserProblemIds] = useState<string[]>([])
  const [userSolutionIds, setUserSolutionIds] = useState<string[]>([])

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (user) {
      loadNotificationsFromStorage()
      loadPreferencesFromStorage()
    }
  }, [user])

  // Set up real-time listeners
  useEffect(() => {
    if (!user || userProblemIds.length === 0 && userSolutionIds.length === 0) return

    const channels: any[] = []

    // Listen for comments on user's problems
    if (userProblemIds.length > 0) {
      const problemCommentsChannel = supabase
        .channel(`problem-comments-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `problem_id=in.(${userProblemIds.join(',')})`
          },
          (payload) => {
            if (preferences.problem_replies && payload.new.author_id !== user.id) {
              addNotification({
                type: 'problem_reply',
                title: 'New Reply to Your Problem',
                message: 'Someone replied to your problem discussion',
                read: false,
                related_id: payload.new.problem_id,
                priority: 'medium'
              })
            }
          }
        )
        .subscribe()
      
      channels.push(problemCommentsChannel)
    }

    // Listen for votes on user's solutions
    if (userSolutionIds.length > 0) {
      const solutionVotesChannel = supabase
        .channel(`solution-votes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'votes',
            filter: `solution_id=in.(${userSolutionIds.join(',')})`
          },
          (payload) => {
            if (payload.new.user_id !== user.id) {
              addNotification({
                type: 'solution_vote',
                title: 'Your Solution Got a Vote!',
                message: `Someone ${payload.new.vote_type === 'up' ? 'upvoted' : 'downvoted'} your solution`,
                read: false,
                related_id: payload.new.solution_id,
                priority: 'low'
              })
            }
          }
        )
        .subscribe()
      
      channels.push(solutionVotesChannel)
    }

    // Listen for new problems (general)
    const newProblemsChannel = supabase
      .channel(`new-problems-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'problems'
        },
        (payload) => {
          if (preferences.product_announcements && payload.new.author_id !== user.id) {
            addNotification({
              type: 'new_problem',
              title: 'New Problem Posted',
              message: `Check out the new problem: ${payload.new.title}`,
              read: false,
              related_id: payload.new.id,
              priority: 'low'
            })
          }
        }
      )
      .subscribe()
    
    channels.push(newProblemsChannel)

    // Listen for discussion replies
    const discussionRepliesChannel = supabase
      .channel(`discussion-replies-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_posts'
        },
        (payload) => {
          if (preferences.problem_replies && payload.new.author_id !== user.id) {
            addNotification({
              type: 'problem_reply',
              title: 'New Discussion Reply',
              message: 'Someone replied to a discussion',
              read: false,
              related_id: payload.new.discussion_id,
              priority: 'medium'
            })
          }
        }
      )
      .subscribe()
    
    channels.push(discussionRepliesChannel)

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [user, preferences, userProblemIds, userSolutionIds])

  const loadNotificationsFromStorage = () => {
    if (!user) return
    
    try {
      const stored = localStorage.getItem(`notifications-${user.id}`)
      if (stored) {
        const parsedNotifications = JSON.parse(stored)
        setNotifications(parsedNotifications)
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveNotificationsToStorage = (notifs: Notification[]) => {
    if (!user) return
    
    try {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifs))
    } catch (error) {
      console.error('Error saving notifications to storage:', error)
    }
  }

  const loadPreferencesFromStorage = () => {
    if (!user) return
    
    try {
      const stored = localStorage.getItem(`notification-prefs-${user.id}`)
      if (stored) {
        const parsedPrefs = JSON.parse(stored)
        setPreferences(parsedPrefs)
      }
    } catch (error) {
      console.error('Error loading preferences from storage:', error)
    }
  }

  const savePreferencesToStorage = (prefs: NotificationPreferences) => {
    if (!user) return
    
    try {
      localStorage.setItem(`notification-prefs-${user.id}`, JSON.stringify(prefs))
    } catch (error) {
      console.error('Error saving preferences to storage:', error)
    }
  }
  // Fetch user's problem and solution IDs
  useEffect(() => {
    if (!user) return

    const fetchUserContent = async () => {
      try {
        // Fetch user's problems
        const { data: problems, error: problemsError } = await supabase
          .from('problems')
          .select('id')
          .eq('author_id', user.id)

        if (problemsError) {
          console.warn('Error fetching user problems:', problemsError)
        } else if (problems) {
          setUserProblemIds(problems.map(p => p.id))
          console.log(`Found ${problems.length} problems for user`)
        }

        // Fetch user's solutions
        const { data: solutions, error: solutionsError } = await supabase
          .from('solutions')
          .select('id')
          .eq('author_id', user.id)

        if (solutionsError) {
          console.warn('Error fetching user solutions:', solutionsError)
        } else if (solutions) {
          setUserSolutionIds(solutions.map(s => s.id))
          console.log(`Found ${solutions.length} solutions for user`)
        }
      } catch (error) {
        console.error('Error fetching user content IDs:', error)
      }
    }

    fetchUserContent()
  }, [user])

  const getUserProblemIds = (): string[] => {
    return userProblemIds
  }

  const getUserSolutionIds = (): string[] => {
    return userSolutionIds
  }

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      user_id: user.id
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 100) // Keep only last 100 notifications
      saveNotificationsToStorage(updated)
      return updated
    })

    // Show browser notification if permissions granted and enabled
    if (preferences.push_notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      })
    }
  }, [user, preferences])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
      saveNotificationsToStorage(updated)
      return updated
    })
  }

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }))
      saveNotificationsToStorage(updated)
      return updated
    })
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId)
      saveNotificationsToStorage(updated)
      return updated
    })
  }

  const clearAllNotifications = () => {
    setNotifications([])
    if (user) {
      localStorage.removeItem(`notifications-${user.id}`)
    }
  }

  const updatePreferences = (newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs }
      savePreferencesToStorage(updated)
      return updated
    })
  }

  const unreadCount = notifications.filter(notif => !notif.read).length

  // Request notification permission on mount
  useEffect(() => {
    if (preferences.push_notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [preferences.push_notifications])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    isLoading
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Helper functions for creating specific notification types
export const NotificationHelpers = {
  createProblemReply: (problemTitle: string, commenterName: string, problemId: string) => ({
    type: 'problem_reply' as const,
    title: 'New Reply to Your Problem',
    message: `${commenterName} replied to "${problemTitle}"`,
    read: false,
    related_id: problemId,
    priority: 'medium' as const
  }),

  createLeaderboardUpdate: (newRank: number, previousRank: number) => ({
    type: 'leaderboard_update' as const,
    title: 'Leaderboard Update',
    message: `Your rank changed from #${previousRank} to #${newRank}!`,
    read: false,
    priority: newRank < previousRank ? 'high' as const : 'medium' as const
  }),

  createProductAnnouncement: (title: string, message: string) => ({
    type: 'product_announcement' as const,
    title,
    message,
    read: false,
    priority: 'low' as const
  }),

  createSolutionVote: (voteType: 'up' | 'down', solutionId: string) => ({
    type: 'solution_vote' as const,
    title: `Solution ${voteType === 'up' ? 'Upvoted' : 'Downvoted'}`,
    message: `Someone ${voteType === 'up' ? 'upvoted' : 'downvoted'} your solution`,
    read: false,
    related_id: solutionId,
    priority: 'low' as const
  }),

  createNewProblem: (problemTitle: string, problemId: string) => ({
    type: 'new_problem' as const,
    title: 'New Problem Posted',
    message: `Check out: "${problemTitle}"`,
    read: false,
    related_id: problemId,
    priority: 'low' as const
  })
}