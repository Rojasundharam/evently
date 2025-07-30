'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Users, Target, Lightbulb, TrendingUp, RefreshCw, Calendar, MessageSquare, Award, Clock, Activity } from 'lucide-react'
import EnhancedSidebar from '../../components/layout/EnhancedSidebar'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AnalyticsStats {
  totalUsers: number
  activeUsers: number
  totalProblems: number
  totalSolutions: number
  totalDiscussions: number
  averageResponseTime: string
  userGrowth: string
  problemGrowth: string
  solutionGrowth: string
  engagementRate: string
  solutionsPerProblem: string
}

interface ActivityItem {
  type: string
  user: string
  action: string
  item: string
  time: string
  icon: React.ComponentType<any>
}

interface AnalyticsData {
  stats: AnalyticsStats
  roleDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
  recentActivity: ActivityItem[]
}

const AdminAnalyticsPage = () => {
  const { user, profile, isAdmin } = useAuth()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Get theme context with proper destructuring
  const { isDarkMode = false, setIsDarkMode = () => {} } = useTheme() || {}
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (user && profile && !isAdmin) {
      router.push('/')
    }
  }, [user, profile, isAdmin, router])

  // Calculate date range for filtering
  const getDateFilter = useCallback(() => {
    const now = new Date()
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange]
    
    const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
    return filterDate.toISOString()
  }, [timeRange])

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dateFilter = getDateFilter()

      // Fetch all data in parallel with error handling
      const [
        { data: allUsers, error: usersError },
        { data: recentUsers, error: recentUsersError },
        { data: allProblems, error: problemsError },
        { data: recentProblems, error: recentProblemsError },
        { data: allSolutions, error: solutionsError },
        { data: recentSolutions, error: recentSolutionsError },
        { data: allDiscussions, error: discussionsError },
        { data: recentDiscussions, error: recentDiscussionsError },
        { data: recentPosts, error: postsError }
      ] = await Promise.all([
        supabase.from('user_profiles').select('role, status, created_at, last_active'),
        supabase.from('user_profiles').select('role, status, created_at, last_active').gte('created_at', dateFilter),
        supabase.from('problems').select('category, status, created_at, title, author_name'),
        supabase.from('problems').select('category, status, created_at, title, author_name').gte('created_at', dateFilter),
        supabase.from('solutions').select('created_at, problem_id, author_id, title, author_name').order('created_at', { ascending: false }),
        supabase.from('solutions').select('created_at, problem_id, author_id, title, author_name').gte('created_at', dateFilter),
        supabase.from('discussions').select('category_id, created_at, title, author_name'),
        supabase.from('discussions').select('category_id, created_at, title, author_name').gte('created_at', dateFilter),
        supabase.from('discussion_posts').select('created_at, author_name, discussion_id').order('created_at', { ascending: false }).limit(50)
      ])

      // Check for specific errors
      const errors = [
        usersError && `Users: ${usersError.message}`,
        recentUsersError && `Recent Users: ${recentUsersError.message}`,
        problemsError && `Problems: ${problemsError.message}`,
        recentProblemsError && `Recent Problems: ${recentProblemsError.message}`,
        solutionsError && `Solutions: ${solutionsError.message}`,
        recentSolutionsError && `Recent Solutions: ${recentSolutionsError.message}`,
        discussionsError && `Discussions: ${discussionsError.message}`,
        recentDiscussionsError && `Recent Discussions: ${recentDiscussionsError.message}`,
        postsError && `Posts: ${postsError.message}`
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error('Database query errors:', errors)
        setError(`Database query errors: ${errors.join(', ')}`)
        return
      }

      // Calculate statistics with validation
      const totalUsers = Array.isArray(allUsers) ? allUsers.length : 0
      const activeUsers = Array.isArray(allUsers) ? allUsers.filter(u => {
        if (!u || !u.last_active) return false
        try {
          const lastActive = new Date(u.last_active)
          const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
          return lastActive > thirtyDaysAgo
        } catch (e) {
          console.warn('Invalid date format in user last_active:', u.last_active)
          return false
        }
      }).length : 0

      const totalProblems = Array.isArray(allProblems) ? allProblems.length : 0
      const totalSolutions = Array.isArray(allSolutions) ? allSolutions.length : 0
      const totalDiscussions = Array.isArray(allDiscussions) ? allDiscussions.length : 0

      // Calculate growth rates with validation
      const userGrowth = Array.isArray(recentUsers) ? recentUsers.length : 0
      const problemGrowth = Array.isArray(recentProblems) ? recentProblems.length : 0 
      const solutionGrowth = Array.isArray(recentSolutions) ? recentSolutions.length : 0

      const userGrowthPercent = totalUsers > userGrowth ? ((userGrowth / (totalUsers - userGrowth)) * 100).toFixed(1) : '0'
      const problemGrowthPercent = totalProblems > problemGrowth ? ((problemGrowth / (totalProblems - problemGrowth)) * 100).toFixed(1) : '0'
      const solutionGrowthPercent = totalSolutions > solutionGrowth ? ((solutionGrowth / (totalSolutions - solutionGrowth)) * 100).toFixed(1) : '0'

      // Calculate engagement rate (users with solutions or discussions) with validation
      const solutionAuthorIds = Array.isArray(allSolutions) ? allSolutions.filter(s => s && s.author_id).map(s => s.author_id) : []
      const discussionAuthors = Array.isArray(allDiscussions) ? allDiscussions.filter(d => d && d.author_name).map(d => d.author_name) : []
      
      const engagedUsers = new Set([
        ...solutionAuthorIds,
        ...discussionAuthors
      ]).size
      const engagementRate = totalUsers > 0 ? ((engagedUsers / totalUsers) * 100).toFixed(1) : '0'

      const stats: AnalyticsStats = {
        totalUsers,
        activeUsers,
        totalProblems,
        totalSolutions,
        totalDiscussions,
        averageResponseTime: '2.3 days', // This would need more complex calculation
        userGrowth: `+${userGrowthPercent}%`,
        problemGrowth: `+${problemGrowthPercent}%`,
        solutionGrowth: `+${solutionGrowthPercent}%`,
        engagementRate: `${engagementRate}%`,
        solutionsPerProblem: totalProblems > 0 ? (totalSolutions / totalProblems).toFixed(1) : '0'
      }

      // User distribution by role with validation
      const roleDistribution: Record<string, number> = Array.isArray(allUsers) ? allUsers.reduce((acc: Record<string, number>, user: any) => {
        if (!user) return acc
        const role = user.role || 'student'
        acc[role] = (acc[role] || 0) + 1
        return acc
      }, {}) : {}

      // Problems by category with validation
      const categoryDistribution: Record<string, number> = Array.isArray(allProblems) ? allProblems.reduce((acc: Record<string, number>, problem: any) => {
        if (!problem) return acc
        const category = problem.category || 'Technology'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {}) : {}

      // Recent activity from actual database
      const recentActivity: ActivityItem[] = []

      // Add recent problems with validation
      const recentProblemsActivity = Array.isArray(recentProblems) ? recentProblems.slice(0, 3).map(problem => ({
        type: 'problem',
        user: problem?.author_name || 'Anonymous User',
        action: 'submitted',
        item: problem?.title?.substring(0, 50) + (problem?.title?.length > 50 ? '...' : '') || 'New problem',
        time: formatTimeAgo(problem?.created_at || new Date().toISOString()),
        icon: Target
      })) : []

      // Add recent solutions with validation
      const recentSolutionsActivity = Array.isArray(recentSolutions) ? recentSolutions.slice(0, 2).map(solution => ({
        type: 'solution',
        user: solution?.author_name || 'Anonymous User',
        action: 'provided solution:',
        item: solution?.title?.substring(0, 50) + (solution?.title?.length > 50 ? '...' : '') || 'Problem solution',
        time: formatTimeAgo(solution?.created_at || new Date().toISOString()),
        icon: Lightbulb
      })) : []

      // Add recent discussions with validation
      const recentDiscussionsActivity = Array.isArray(recentDiscussions) ? recentDiscussions.slice(0, 2).map(discussion => ({
        type: 'discussion',
        user: discussion?.author_name || 'Anonymous User',
        action: 'started discussion on',
        item: discussion?.title?.substring(0, 50) + (discussion?.title?.length > 50 ? '...' : '') || 'Discussion topic',
        time: formatTimeAgo(discussion?.created_at || new Date().toISOString()),
        icon: MessageSquare
      })) : []

      // Add recent posts with validation
      const recentPostsActivity = Array.isArray(recentPosts) ? recentPosts.slice(0, 2).map(post => ({
        type: 'post',
        user: post?.author_name || 'Anonymous User',
        action: 'replied to discussion',
        item: 'Discussion thread',
        time: formatTimeAgo(post?.created_at || new Date().toISOString()),
        icon: MessageSquare
      })) : []

      // Combine and sort by most recent
      const combinedActivity = [
        ...recentProblemsActivity,
        ...recentSolutionsActivity,
        ...recentDiscussionsActivity,
        ...recentPostsActivity
      ].sort((a, b) => {
        // Simple sort by time string (this could be improved)
        if (a.time.includes('minutes') && b.time.includes('hour')) return -1
        if (a.time.includes('hour') && b.time.includes('minutes')) return 1
        return 0
      }).slice(0, 10)

      setAnalyticsData({
        stats,
        roleDistribution,
        categoryDistribution,
        recentActivity: combinedActivity
      })

    } catch (err) {
      console.error('Error fetching analytics:', err)
      if (err instanceof Error) {
        setError(`Failed to load analytics data: ${err.message}`)
      } else {
        setError('Failed to load analytics data. Please check your database connection and ensure all tables exist.')
      }
    } finally {
      setLoading(false)
    }
  }, [getDateFilter])

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  // Set up real-time subscriptions
  useEffect(() => {
    fetchAnalyticsData()

    // Use a single channel for all analytics subscriptions to reduce connections
    const analyticsChannel = supabase
      .channel('analytics_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problems' }, () => {
        // Debounce the refresh to avoid too many requests
        setTimeout(fetchAnalyticsData, 1000)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solutions' }, () => {
        setTimeout(fetchAnalyticsData, 1000)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
        setTimeout(fetchAnalyticsData, 1000)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussions' }, () => {
        setTimeout(fetchAnalyticsData, 1000)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discussion_posts' }, () => {
        setTimeout(fetchAnalyticsData, 1000)
      })
      .subscribe()

    return () => {
      analyticsChannel.unsubscribe()
    }
  }, [fetchAnalyticsData])

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'  
      case '90d': return 'Last 90 days'
      case '1y': return 'Last year'
      default: return 'Last 30 days'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'from-red-500 to-pink-600'
      case 'industry_expert': return 'from-blue-500 to-indigo-600'
      case 'student': return 'from-green-500 to-emerald-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600',
      'from-yellow-500 to-orange-600',
      'from-purple-500 to-pink-600',
      'from-cyan-500 to-blue-600',
      'from-red-500 to-rose-600'
    ]
    return colors[index % colors.length]
  }

  if (!isAdmin && user) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-red-500">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/admin/analytics"
      />

      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300 pb-20 md:pb-0`}>
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
              <div className="flex-1">
                <h1 className={`text-xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 flex items-center`}>
                  <Activity className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 text-indigo-500 flex-shrink-0" />
                  <span>Analytics Dashboard</span>
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
                  Monitor platform performance and user engagement
                </p>
              </div>
              
              {/* Mobile-friendly controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                    className={`appearance-none w-full sm:w-auto ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                </div>
                <button
                  onClick={fetchAnalyticsData}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 md:h-64">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading analytics data...
            </p>
          </div>
        ) : error ? (
          <div className={`${isDarkMode ? 'bg-red-900/20 border-red-800/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg p-4 md:p-6`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium mb-1">Error Loading Analytics</h3>
                <p className="text-sm break-words">{error}</p>
              </div>
            </div>
          </div>
        ) : analyticsData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Total Users */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Users</p>
                    <p className={`text-xl md:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {analyticsData.stats.totalUsers.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1 md:mt-2">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-xs md:text-sm font-medium">{analyticsData.stats.userGrowth}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Users</p>
                    <p className={`text-xl md:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {analyticsData.stats.activeUsers.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1 md:mt-2">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-xs md:text-sm font-medium">{analyticsData.stats.engagementRate}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Problems */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Problems</p>
                    <p className={`text-xl md:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {analyticsData.stats.totalProblems.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1 md:mt-2">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-xs md:text-sm font-medium">{analyticsData.stats.problemGrowth}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Solutions */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Solutions</p>
                    <p className={`text-xl md:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {analyticsData.stats.totalSolutions.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1 md:mt-2">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-xs md:text-sm font-medium">{analyticsData.stats.solutionGrowth}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                    <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Discussions */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6 hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Discussions</p>
                    <p className={`text-xl md:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {analyticsData.stats.totalDiscussions.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1 md:mt-2">
                      <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-blue-500 mr-1" />
                      <span className="text-blue-500 text-xs md:text-sm font-medium">Active</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* User Distribution by Role */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6`}>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Roles</h3>
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                </div>
                
                <div className="space-y-4 md:space-y-6">
                  {Object.entries(analyticsData.roleDistribution).map(([role, count], index) => {
                    const total = Object.values(analyticsData.roleDistribution).reduce((a: number, b: unknown) => a + Number(b), 0);
                    const percentage = total > 0 ? ((Number(count) / total) * 100).toFixed(1) : '0';

                    return (
                      <div key={role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getRoleColor(role)} flex-shrink-0`}></div>
                            <span className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} capitalize truncate`}>
                              {role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{count}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{percentage}%</div>
                          </div>
                        </div>
                        <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${getRoleColor(role)} transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Problems by Category */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6`}>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Problem Categories</h3>
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                </div>
                
                <div className="space-y-4 md:space-y-6">
                  {Object.entries(analyticsData.categoryDistribution).map(([category, count], index) => {
                    const total = Object.values(analyticsData.categoryDistribution).reduce((a: number, b: unknown) => a + Number(b), 0)
                    const percentage = total > 0 ? ((Number(count) / total) * 100).toFixed(1) : '0'
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getCategoryColor(index)} flex-shrink-0`}></div>
                            <span className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} capitalize truncate`}>
                              {category}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{count}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{percentage}%</div>
                          </div>
                        </div>
                        <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${getCategoryColor(index)} transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 md:p-6`}>
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
                <h3 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-indigo-500" />
                  <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Live updates</span>
                </div>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {analyticsData.recentActivity.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Activity className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                    <h3 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      No recent activity
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Activity will appear here as users interact with the platform.
                    </p>
                  </div>
                ) : (
                  analyticsData.recentActivity.map((activity: ActivityItem, index: number) => (
                    <div key={index} className={`flex items-start space-x-3 md:space-x-4 p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}>
                      <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'problem' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        activity.type === 'solution' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        activity.type === 'discussion' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        activity.type === 'post' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        activity.type === 'user' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <activity.icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} leading-relaxed`}>
                          <span className="font-medium">{activity.user}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium text-indigo-600 dark:text-indigo-400 break-words">{activity.item}</span>
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default AdminAnalyticsPage 