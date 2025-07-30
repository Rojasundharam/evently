'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, Users, Lightbulb, Target, Plus, Sparkles, Brain, ArrowUpRight, Trophy, Medal, Star, Zap, Flame, MessageSquare, BookOpen, Crown, Calendar, Activity, TrendingDown, X, User } from 'lucide-react'
import MagicStatsCard from './components/ui/magic-stats-card'
import EnhancedSidebar from './components/layout/EnhancedSidebar'
import NotificationCenter from './components/NotificationCenter'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { useUserPresence } from '@/lib/hooks/useUserPresence'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const Dashboard = () => {
  const router = useRouter()
  const { user: authUser, profile } = useAuth()
  const { isDarkMode } = useTheme()
  const { userStatus, currentUserOnlineCount } = useUserPresence()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // User's personal stats - all real-time data from database
  const [userStats, setUserStats] = useState({
    rank: 0,
    totalPoints: 0,
    problemsSubmitted: 0,
    solutionsProvided: 0,
    discussionsStarted: 0,
    rating: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    streak: 0,
    badges: [] as string[]
  })
  
  // Achievement definitions
  const [achievements, setAchievements] = useState([
    { name: 'First Problem', icon: '🎯', earned: false, condition: 'problemsSubmitted' },
    { name: 'Problem Solver', icon: '💡', earned: false, condition: 'solutionsProvided' },
    { name: 'Discussion Starter', icon: '💬', earned: false, condition: 'discussionsStarted' },
    { name: 'Top Contributor', icon: '🏆', earned: false, condition: 'totalPoints' }
  ])

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  
  // Additional realtime state
  const [globalStats, setGlobalStats] = useState({
    totalProblems: 0,
    totalSolutions: 0,
    totalDiscussions: 0,
    activeUsers: 0,
    recentProblems: [] as any[],
    recentSolutions: [] as any[]
  })
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  const updateAchievements = (stats: any) => {
    setAchievements(prev => prev.map(achievement => {
      let earned = false
      
      switch (achievement.condition) {
        case 'problemsSubmitted':
          earned = stats.problemsSubmitted > 0
          break
        case 'solutionsProvided':
          earned = stats.solutionsProvided > 0
          break
        case 'discussionsStarted':
          earned = stats.discussionsStarted > 0
          break
        case 'totalPoints':
          earned = stats.totalPoints >= 100 // Top contributor at 100+ points
          break
      }
      
      return { ...achievement, earned }
    }))
  }

  const fetchUserStats = async () => {
    if (!authUser?.id) return

    try {
      // Fetch user stats from database
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        console.warn('Error fetching user stats:', statsError)
        return
      }

      // Fetch user profile data (including streak_days)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('streak_days, problems_submitted, solutions_posted')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.warn('Error fetching profile data:', profileError)
        return
      }

      // Calculate next level XP (100 XP per level)
      const currentLevel = statsData?.level || 1
      const currentXP = statsData?.xp || 0
      const nextLevelXp = currentLevel * 100
      const currentLevelStartXp = (currentLevel - 1) * 100
      const xpInCurrentLevel = currentXP - currentLevelStartXp

      // Update userStats with real data
      if (statsData || profileData) {
        const newStats = {
          rank: statsData?.rank || 0,
          totalPoints: statsData?.total_points || 0,
          problemsSubmitted: statsData?.problems_submitted || profileData?.problems_submitted || 0,
          solutionsProvided: statsData?.solutions_provided || profileData?.solutions_posted || 0,
          discussionsStarted: statsData?.discussions_started || 0,
          level: currentLevel,
          xp: xpInCurrentLevel,
          nextLevelXp: 100, // Each level requires 100 XP
          streak: statsData?.streak_days || profileData?.streak_days || 0,
          rating: statsData?.rating || 0,
          badges: []
        }
        
        setUserStats(prev => ({ ...prev, ...newStats }))
        
        // Update achievements based on actual stats
        updateAchievements(newStats)
      }
    } catch (error) {
      console.warn('Error in fetchUserStats:', error)
    }
  }

  const fetchRecentActivity = async () => {
    if (!authUser?.id) return

    setActivityLoading(true)
    try {
      // Fetch recent activity with detailed information
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select(`
          id,
          activity_type,
          created_at,
          points_earned,
          metadata,
          entity_type,
          entity_id,
          entity_title
        `)
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!activityError && activityData) {
        const formattedActivity = activityData.map(activity => {
          // Enhanced time formatting
          const now = new Date()
          const activityTime = new Date(activity.created_at)
          const diffInHours = (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60)
          
          let timeAgo = ''
          if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60)
            timeAgo = diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
          } else if (diffInHours < 24) {
            timeAgo = `${Math.floor(diffInHours)}h ago`
          } else if (diffInHours < 168) { // 7 days
            const diffInDays = Math.floor(diffInHours / 24)
            timeAgo = `${diffInDays}d ago`
          } else {
            timeAgo = activityTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }
          
          // Enhanced action mapping with context
          const actionMap: Record<string, (activity: any) => string> = {
            'problem_submit': (a) => `submitted a problem${a.entity_title ? `: "${a.entity_title}"` : ''}`,
            'solution_submit': (a) => `provided a solution${a.entity_title ? ` for "${a.entity_title}"` : ''}`, 
            'discussion_create': (a) => `started a discussion${a.entity_title ? `: "${a.entity_title}"` : ''}`,
            'discussion_post': (a) => `posted in discussion${a.entity_title ? `: "${a.entity_title}"` : ''}`,
            'comment_create': (a) => `added a comment${a.entity_title ? ` on "${a.entity_title}"` : ''}`,
            'achievement_earned': (a) => {
              const desc = a.metadata?.description || 'earned an achievement'
              return desc.toLowerCase().includes('streak') ? '🔥 ' + desc : '🏆 ' + desc
            },
            'vote_cast': () => 'voted on content',
            'team_join': (a) => `joined team${a.entity_title ? `: "${a.entity_title}"` : ''}`,
            'team_create': (a) => `created team${a.entity_title ? `: "${a.entity_title}"` : ''}`
          }

          const getActivityIcon = (type: string) => {
            const iconMap: Record<string, any> = {
              'problem_submit': Target,
              'solution_submit': Lightbulb,
              'discussion_create': MessageSquare,
              'discussion_post': MessageSquare,
              'comment_create': MessageSquare,
              'achievement_earned': Trophy,
              'vote_cast': TrendingUp,
              'team_join': Users,
              'team_create': Users
            }
            return iconMap[type] || Activity
          }

          const getActivityColor = (type: string) => {
            const colorMap: Record<string, string> = {
              'problem_submit': 'blue',
              'solution_submit': 'yellow',
              'discussion_create': 'green',
              'discussion_post': 'green',
              'comment_create': 'purple',
              'achievement_earned': 'orange',
              'vote_cast': 'indigo',
              'team_join': 'pink',
              'team_create': 'pink'
            }
            return colorMap[type] || 'gray'
          }

          return {
            id: activity.id,
            action: actionMap[activity.activity_type] 
              ? actionMap[activity.activity_type](activity)
              : activity.activity_type.replace('_', ' '),
            user: 'You',
            time: timeAgo,
            type: activity.activity_type.replace('_', '-'),
            points: activity.points_earned || 0,
            icon: getActivityIcon(activity.activity_type),
            color: getActivityColor(activity.activity_type),
            metadata: activity.metadata,
            entityType: activity.entity_type,
            rawTime: activity.created_at
          }
                 })
         setRecentActivity(formattedActivity)
       }
     } catch (error) {
       console.warn('Error fetching recent activity:', error)
     } finally {
       setActivityLoading(false)
     }
   }

  // Fetch global dashboard statistics
  const fetchGlobalStats = async () => {
    try {
      // Fetch total counts
      const [problemsResult, solutionsResult, discussionsResult] = await Promise.all([
        supabase.from('problems').select('id', { count: 'exact', head: true }),
        supabase.from('solutions').select('id', { count: 'exact', head: true }),
        supabase.from('discussions').select('id', { count: 'exact', head: true })
      ])

      // Fetch recent problems and solutions
      const [recentProblemsResult, recentSolutionsResult] = await Promise.all([
        supabase
          .from('problems')
          .select('id, title, created_at, author_name, category')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('solutions')
          .select('id, title, created_at, author_name, problem_id')
          .order('created_at', { ascending: false })
          .limit(3)
      ])

      setGlobalStats({
        totalProblems: problemsResult.count || 0,
        totalSolutions: solutionsResult.count || 0,
        totalDiscussions: discussionsResult.count || 0,
        activeUsers: currentUserOnlineCount || 0,
        recentProblems: recentProblemsResult.data || [],
        recentSolutions: recentSolutionsResult.data || []
      })
    } catch (error) {
      console.warn('Error fetching global stats:', error)
    }
  }

  // Enhanced real-time subscription for comprehensive dashboard updates
  useEffect(() => {
    if (!authUser?.id) return

    console.log('Setting up realtime subscriptions...')
    setRealtimeConnected(false)

    // Set up real-time subscription for user-specific data
    const userActivitySubscription = supabase
      .channel('user_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${authUser.id}`
        },
        (payload) => {
          console.log('New activity detected:', payload)
          fetchRecentActivity()
          fetchUserStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${authUser.id}`
        },
        (payload) => {
          console.log('User stats updated:', payload)
          fetchUserStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${authUser.id}`
        },
        (payload) => {
          console.log('User profile updated:', payload)
          fetchUserStats()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('User activity subscription active')
          setRealtimeConnected(true)
        }
      })

    // Set up real-time subscription for global dashboard data
    const globalDataSubscription = supabase
      .channel('global_data')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'problems'
        },
        (payload) => {
          console.log('New problem added:', payload)
          fetchGlobalStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'solutions'
        },
        (payload) => {
          console.log('New solution added:', payload)
          fetchGlobalStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussions'
        },
        (payload) => {
          console.log('New discussion started:', payload)
          fetchGlobalStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'problems'
        },
        (payload) => {
          console.log('Problem updated:', payload)
          fetchGlobalStats()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Global data subscription active')
        }
      })

    return () => {
      console.log('Cleaning up realtime subscriptions')
      supabase.removeChannel(userActivitySubscription)
      supabase.removeChannel(globalDataSubscription)
      setRealtimeConnected(false)
    }
  }, [authUser?.id])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
    
    // Fetch real user stats and activity if authenticated
    if (authUser?.id) {
      fetchUserStats()
      fetchRecentActivity()
      fetchGlobalStats()
    }
  }, [authUser?.id])

  // Enhanced user data for sidebar
  const currentUserData = {
    name: profile?.full_name || authUser?.email?.split('@')[0] || 'ROJA SUNDHARAM',
    role: profile?.role === 'industry_expert' ? 'Industry Expert' : 
          profile?.role === 'admin' ? 'Admin' : 'Student',
    avatar: profile?.avatar_url || '👤',
    level: userStats.level,
    xp: userStats.xp,
    nextLevelXp: userStats.nextLevelXp,
    streak: userStats.streak,
    badges: userStats.badges
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark-mode-bg' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/"
      />

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300`}>
        
        {/* Header */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
          <div className="flex-1">
            <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 tracking-tight`}>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome back, {currentUserData.name}!
              </span>
              </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg`}>
                Here's your innovation dashboard for today
              </p>
          </div>
          
          {/* Realtime Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              realtimeConnected 
                ? `${isDarkMode ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-green-100 text-green-700 border border-green-200'}` 
                : `${isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-500/20' : 'bg-red-100 text-red-700 border border-red-200'}`
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span>{realtimeConnected ? 'Live Updates' : 'Offline'}</span>
            </div>
            {globalStats.activeUsers > 0 && (
              <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                isDarkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                <Users className="w-3 h-3" />
                <span>{globalStats.activeUsers} online</span>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-800/80 to-gray-700/60' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border ${isDarkMode ? 'border-gray-700/50' : 'border-blue-100'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                {/* Mobile Layout */}
            <div className="flex items-center space-x-4 md:hidden">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        R
                      </div>
                      </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg dark:bg-blue-900/30 dark:text-blue-300">
                    Admin
                  </span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-lg dark:bg-orange-900/30 dark:text-orange-300 flex items-center">
                                          {userStats.streak > 0 ? `🔥 Day ${userStats.streak} streak` : '🌟 Start streak'}
                  </span>
                    </div>
                <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-white" />
                        </div>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Level {userStats.level}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {userStats.totalPoints}
                        </span>
                      </div>
                    <div className="flex items-center space-x-1">
                      <Crown className="w-4 h-4 text-purple-500" />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Rank #{userStats.rank || '?'}
                      </span>
                  </div>
                </div>
                        </div>
                      </div>
                      
            {/* Desktop Layout */}
            <div className="hidden md:flex md:items-center md:justify-between md:w-full">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                    R
                          </div>
                        </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {currentUserData.name}
                  </h2>
                  <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                              <Trophy className="w-4 h-4 text-white" />
                            </div>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Level {userStats.level}
                            </span>
                          </div>
                          
                          <div className="w-px h-6 bg-gray-300"></div>
                          <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Star className="w-4 h-4 text-white" />
                            </div>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {userStats.totalPoints}
                            </span>
                          </div>
                          
                          <div className="w-px h-6 bg-gray-300"></div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Crown className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Rank #{userStats.rank || '?'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
              
              {/* Desktop Streak Display */}
              <div className="flex items-center space-x-3">
                <div className="px-3 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl border border-orange-200/50 dark:border-orange-800/30">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {userStats.streak > 0 ? `Day ${userStats.streak} Streak` : 'Start Your Streak'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-orange-300/80' : 'text-orange-500/80'}`}>
                        {userStats.streak >= 7 ? 'Complete!' : `${7 - userStats.streak} days to level up`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
                  </div>
                </div>
              </div>

        {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
                {[
                  {
                    title: 'Problems',
                    value: userStats.problemsSubmitted,
                    target: 10,
                    icon: Target, 
                    color: 'from-blue-500 to-indigo-600',
                    iconBg: 'bg-blue-500',
                    href: '/problems'
                  },
                  {
                    title: 'Solutions',
                    value: userStats.solutionsProvided,
                    target: 20,
                    icon: Lightbulb, 
                    color: 'from-yellow-500 to-orange-600',
                    iconBg: 'bg-yellow-500',
                    href: '/solutions'
                  },
                  {
                    title: 'Discussions',
                    value: userStats.discussionsStarted,
                    target: 5,
                    icon: MessageSquare, 
                    color: 'from-green-500 to-emerald-600',
                    iconBg: 'bg-green-500',
                    href: '/discussions'
                  },
                  {
                    title: 'Rank',
              value: userStats.rank || 1,
                    target: 100,
                    icon: Trophy, 
                    color: 'from-purple-500 to-pink-600',
                    iconBg: 'bg-purple-500',
                    href: '/leaderboard'
                  }
                ].map((stat, index) => (
            <Link key={index} href={stat.href}>
              <MagicStatsCard 
                gradient={isDarkMode ? 'from-gray-800/80 to-gray-700/50' : 'from-white to-gray-50'}
                hoverColor={stat.color.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : 
                           stat.color.includes('yellow') ? 'rgba(245, 158, 11, 0.1)' :
                           stat.color.includes('green') ? 'rgba(16, 185, 129, 0.1)' :
                           'rgba(139, 92, 246, 0.1)'}
                icon={<stat.icon className="w-6 h-6" />}
                className="h-full cursor-pointer group"
              >
                    <div className="relative">
                      {/* Mobile-optimized icon */}
                      <div className={`w-8 h-8 md:w-12 md:h-12 ${stat.iconBg} rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                        <stat.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                      
                      {/* Mobile-optimized stats */}
                      <div className="mb-2 md:mb-3">
                        <h3 className={`text-xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1 group-hover:scale-105 transition-transform duration-300`}>
                          {loading ? (
                            <div className={`animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded h-6 md:h-8 w-8 md:w-12`}></div>
                          ) : (
                            stat.value
                          )}
                        </h3>
                        <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                          {stat.title}
                        </p>
                      </div>
                      
                      {/* Mobile-optimized progress bar */}
                      <div className="mb-1 md:mb-2">
                        <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1.5 md:h-2 overflow-hidden`}>
                          <div 
                            className={`bg-gradient-to-r ${stat.color} h-1.5 md:h-2 rounded-full transition-all duration-700 ease-out`}
                            style={{ width: `${Math.min(100, (Number(stat.value) / stat.target) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} font-medium`}>
                          {stat.value}/{stat.target} Target
                        </p>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {Math.round((Number(stat.value) / stat.target) * 100)}%
                        </span>
                    </div>
                    
                    {/* Mobile-optimized arrow indicator */}
                    <ArrowUpRight className={`absolute top-2 right-2 md:top-4 md:right-4 w-3 h-3 md:w-4 md:h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300`} />
                </div>
              </MagicStatsCard>
                  </Link>
                ))}
              </div>

        {/* Global Community Stats */}
        <div className="mb-6">
          <MagicStatsCard 
            gradient={isDarkMode ? 'from-gray-800/80 to-gray-700/50' : 'from-white to-gray-50'}
            hoverColor="rgba(59, 130, 246, 0.1)"
            className="p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Community Overview</h3>
              <div className="flex items-center space-x-1">
                <Activity className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {globalStats.totalProblems}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Problems</p>
              </div>
              
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center`}>
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {globalStats.totalSolutions}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Solutions Posted</p>
              </div>
              
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center`}>
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {globalStats.totalDiscussions}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discussions</p>
              </div>
              
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentUserOnlineCount}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Users Online</p>
              </div>
            </div>
            
            {/* Recent Activity Feed */}
            {globalStats.recentProblems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Recent Community Activity
                </h4>
                <div className="space-y-2">
                  {globalStats.recentProblems.slice(0, 2).map((problem: any) => (
                    <div key={problem.id} className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center justify-between`}>
                      <span>
                        <strong>{problem.author_name}</strong> posted: "{problem.title.slice(0, 40)}..."
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {problem.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </MagicStatsCard>
        </div>

        {/* Mini Stats Grid - Removed Day Streak, keeping only 3 items */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className={`p-3 md:p-4 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/50 to-indigo-900/50' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} rounded-lg md:rounded-xl border ${isDarkMode ? 'border-blue-800/30' : 'border-blue-200/50'}`}>
                  <div className="flex items-center space-x-2 mb-1 md:mb-2">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                    <h3 className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userStats.problemsSubmitted}</h3>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Problems</p>
                </div>
                <div className={`p-3 md:p-4 ${isDarkMode ? 'bg-gradient-to-br from-yellow-900/50 to-orange-900/50' : 'bg-gradient-to-br from-yellow-50 to-orange-50'} rounded-lg md:rounded-xl border ${isDarkMode ? 'border-yellow-800/30' : 'border-yellow-200/50'}`}>
                  <div className="flex items-center space-x-2 mb-1 md:mb-2">
                    <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                    <h3 className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userStats.solutionsProvided}</h3>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Solutions</p>
                </div>
          <MagicStatsCard 
            gradient={isDarkMode ? 'from-purple-900/50 to-pink-900/50' : 'from-purple-50 to-pink-50'}
            hoverColor="rgba(139, 92, 246, 0.1)"
            icon={<Crown className="w-6 h-6" />}
          >
                  <div className="flex items-center space-x-2 mb-1 md:mb-2">
              <Crown className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
              <h3 className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>#{userStats.rank || '?'}</h3>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rank</p>
          </MagicStatsCard>
        </div>

        {/* Enhanced Level Progress Section with 7-Day Streak System */}
        <div className="mb-6">
          <MagicStatsCard 
            gradient={isDarkMode ? 'from-gray-800/80 to-gray-700/50' : 'from-white to-gray-50'}
            hoverColor="rgba(139, 92, 246, 0.1)"
            className="p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Level {userStats.level} Progress
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {userStats.xp}/{userStats.nextLevelXp} XP
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {userStats.nextLevelXp - userStats.xp} XP to Level {userStats.level + 1}
                </p>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden mb-4`}>
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
              ></div>
            </div>

            {/* 7-Day Streak System */}
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Daily Streak Challenge
                    </h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Complete 7 consecutive days to advance level
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                            Day {Math.max(userStats.streak, 1)}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    of 7 days
                  </p>
                </div>
              </div>

              {/* 7-Day Streak Visual Progress */}
              <div className="flex items-center space-x-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                                          const isCompleted = userStats.streak >= day
                        const isCurrent = userStats.streak === day - 1 && day <= 7
                  
                  return (
                    <div
                      key={day}
                      className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg'
                          : isCurrent
                          ? 'bg-gradient-to-r from-orange-300 to-red-300 animate-pulse'
                          : isDarkMode
                          ? 'bg-gray-700'
                          : 'bg-gray-200'
                      }`}
                    />
                  )
                })}
              </div>

              {/* Streak Status Messages */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {userStats.streak === 0 ? (
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      🌟 Start your streak today!
                    </span>
                  ) : userStats.streak >= 7 ? (
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      🎉 Streak Complete! Level up bonus earned!
                    </span>
                  ) : (
                    <span className={`text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      🔥 {7 - userStats.streak} days to complete streak
                    </span>
                  )}
                  </div>
                
                <div className="flex items-center space-x-1">
                  {/* Show daily streak icons */}
                  {[...Array(Math.min(userStats.streak, 7))].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>

              {/* Streak Bonus Info */}
              {userStats.streak >= 5 && userStats.streak < 7 && (
                <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-orange-900/20 border border-orange-800/30' : 'bg-orange-50 border border-orange-200/50'}`}>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    🎯 Almost there! Complete {7 - userStats.streak} more day{7 - userStats.streak !== 1 ? 's' : ''} to earn level advancement bonus!
                  </p>
                </div>
              )}

              {userStats.streak >= 7 && (
                <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-200/50'}`}>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ✨ Congratulations! Your 7-day streak is complete. Keep going to maintain your momentum!
                  </p>
                </div>
              )}
            </div>
          </MagicStatsCard>
          </div>

        {/* Recent Activity & Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Recent Activity */}
          <MagicStatsCard 
            gradient={isDarkMode ? 'from-gray-800/80 to-gray-700/50' : 'from-white to-gray-50'}
            hoverColor="rgba(59, 130, 246, 0.1)"
            className="p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchRecentActivity}
                  disabled={activityLoading}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    activityLoading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95'
                  }`}
                  title="Refresh activity"
                >
                  <Activity className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${activityLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {activityLoading ? (
                <div className="text-center py-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-3`}>
                    <Activity className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-spin`} />
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Loading recent activity...
                  </p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No recent activity yet
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Start by submitting a problem or solution!
                  </p>
                </div>
              ) : (
                recentActivity.map((activity, index) => {
                  const ActivityIcon = activity.icon || Activity
                  const getColorClasses = (color: string) => {
                    const colorMap: Record<string, { bg: string, text: string, darkBg: string, darkText: string }> = {
                      'blue': { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
                      'yellow': { bg: 'bg-yellow-100', text: 'text-yellow-600', darkBg: 'dark:bg-yellow-900/30', darkText: 'dark:text-yellow-400' },
                      'green': { bg: 'bg-green-100', text: 'text-green-600', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
                      'purple': { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
                      'orange': { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
                      'indigo': { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
                      'pink': { bg: 'bg-pink-100', text: 'text-pink-600', darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-400' },
                      'gray': { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-700/30', darkText: 'dark:text-gray-400' }
                    }
                    return colorMap[color] || colorMap.gray
                  }
                  
                  const colors = getColorClasses(activity.color)
                  
                  return (
                <div key={activity.id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.darkBg} ring-2 ring-white dark:ring-gray-800 shadow-sm`}>
                    <ActivityIcon className={`w-5 h-5 ${colors.text} ${colors.darkText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-tight`}>
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                              {activity.time}
                            </p>
                            {activity.entityType && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} font-medium`}>
                                {activity.entityType}
                              </span>
                            )}
                          </div>
                          {activity.points > 0 && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-400 ring-1 ring-green-400/20' : 'bg-green-100 text-green-700 ring-1 ring-green-200'} shadow-sm`}>
                              +{activity.points} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  )
                })
              )}
            </div>
          </MagicStatsCard>

          {/* Quick Actions */}
          <MagicStatsCard 
            gradient={isDarkMode ? 'from-gray-800/80 to-gray-700/50' : 'from-white to-gray-50'}
            hoverColor="rgba(16, 185, 129, 0.1)"
            className="p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
              <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  title: 'Submit Problem',
                  icon: Plus,
                  color: 'from-blue-500 to-indigo-600',
                  href: '/submit-problem'
                },
                {
                  title: 'Browse Problems',
                  icon: Search,
                  color: 'from-green-500 to-emerald-600',
                  href: '/problems'
                },
                {
                  title: 'Join Discussion',
                  icon: MessageSquare,
                  color: 'from-purple-500 to-pink-600',
                  href: '/discussions'
                },
                {
                  title: 'View Leaderboard',
                  icon: Trophy,
                  color: 'from-yellow-500 to-orange-600',
                  href: '/leaderboard'
                }
              ].map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'} hover:shadow-lg transition-all duration-300 group cursor-pointer`}>
                    <div className={`w-8 h-8 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                      {action.title}
                    </h4>
                  </div>
            </Link>
              ))}
            </div>
          </MagicStatsCard>
        </div>

        {/* Bottom Achievement Section */}
        <MagicStatsCard 
          gradient={isDarkMode ? 'from-gray-800/80 to-gray-700/50' : 'from-white to-gray-50'}
          hoverColor="rgba(245, 158, 11, 0.1)"
          className="p-4 md:p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Achievements</h3>
            <Medal className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className={`text-center p-3 rounded-lg border ${
                achievement.earned 
                  ? `${isDarkMode ? 'border-yellow-700/30 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}` 
                  : `${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`
              }`}>
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className={`text-xs font-medium ${
                  achievement.earned 
                    ? `${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}` 
                    : `${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`
                }`}>
                  {achievement.name}
                </h4>
              </div>
            ))}
          </div>
        </MagicStatsCard>

      </div>
    </div>
  )
}

export default Dashboard 