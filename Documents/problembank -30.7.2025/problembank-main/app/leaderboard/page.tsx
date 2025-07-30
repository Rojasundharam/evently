'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Crown, Users, Award, ArrowUpRight, Filter, X } from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  name: string
  role: 'Student' | 'Industry Expert' | 'Admin'
  avatar?: string
  credits: number
  problemsSubmitted: number
  solutionsProvided: number
  discussionsParticipated: number
  badges: Badge[]
  rank: number
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  type: 'bronze' | 'silver' | 'gold' | 'platinum'
  earnedDate: string
}

interface LeaderboardStats {
  totalUsers: number
  activeCompetitions: number
  badgesEarned: number
  topScore: number
}

export default function LeaderboardPage() {
  const { user: authUser, profile } = useAuth()
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'overall' | 'students' | 'experts'>('overall')
  const [timeFrame, setTimeFrame] = useState<'all-time' | 'this-month' | 'this-week'>('all-time')
  // const [isMobile, setIsMobile] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<LeaderboardStats>({
    totalUsers: 0,
    activeCompetitions: 0,
    badgesEarned: 0,
    topScore: 0
  })
  const [loading, setLoading] = useState(true)

  

  useEffect(() => {
    const handleResize = () => {
      // setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchLeaderboardData()
  }, [timeFrame])

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on timeFrame
      const now = new Date()
      let startDate = new Date(0) // Beginning of time for 'all-time'
      
      if (timeFrame === 'this-month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (timeFrame === 'this-week') {
        const dayOfWeek = now.getDay()
        startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000))
        startDate.setHours(0, 0, 0, 0)
      }

      // Fetch user profiles with their statistics
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          role,
          avatar_url,
          problems_submitted,
          solutions_posted,
          total_votes_received
        `)
        .eq('status', 'active')

      if (profilesError) throw profilesError

      // Fetch problems count for each user
      const { data: problemsData, error: problemsError } = await supabase
        .from('problems')
        .select('author_id')
        .gte('created_at', startDate.toISOString())

      if (problemsError) throw problemsError

      // Fetch solutions count for each user
      const { data: solutionsData, error: solutionsError } = await supabase
        .from('solutions')
        .select('author_id')
        .gte('created_at', startDate.toISOString())

      if (solutionsError) throw solutionsError

      // Fetch discussion posts count for each user
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('discussion_posts')
        .select('author_id')
        .gte('created_at', startDate.toISOString())

      if (discussionsError) throw discussionsError

      // Count statistics per user
      const userStats = new Map()
      
      // Count problems
      problemsData?.forEach(problem => {
        if (problem.author_id) {
          const current = userStats.get(problem.author_id) || { problems: 0, solutions: 0, discussions: 0 }
          current.problems++
          userStats.set(problem.author_id, current)
        }
      })

      // Count solutions
      solutionsData?.forEach(solution => {
        if (solution.author_id) {
          const current = userStats.get(solution.author_id) || { problems: 0, solutions: 0, discussions: 0 }
          current.solutions++
          userStats.set(solution.author_id, current)
        }
      })

      // Count discussions
      discussionsData?.forEach(discussion => {
        if (discussion.author_id) {
          const current = userStats.get(discussion.author_id) || { problems: 0, solutions: 0, discussions: 0 }
          current.discussions++
          userStats.set(discussion.author_id, current)
        }
      })

      // Calculate credits and create user objects
      const leaderboardUsers: User[] = profiles?.map(profile => {
        const stats = userStats.get(profile.id) || { problems: 0, solutions: 0, discussions: 0 }
        
        // Calculate credits (points system)
        const credits = (stats.problems * 50) + (stats.solutions * 30) + (stats.discussions * 10) + (profile.total_votes_received * 5)
        
        // Generate mock badges based on activity (you can implement real badge system later)
        const badges: Badge[] = []
        if (stats.problems >= 10) badges.push({ id: '1', name: 'Problem Solver', description: 'Solved 20+ problems', icon: '🧩', type: 'gold', earnedDate: new Date().toISOString() })
        if (stats.solutions >= 20) badges.push({ id: '2', name: 'Solution Master', description: 'Provided 20+ solutions', icon: '💡', type: 'gold', earnedDate: new Date().toISOString() })
        if (stats.discussions >= 30) badges.push({ id: '3', name: 'Discussion Leader', description: 'Participated in 30+ discussions', icon: '💬', type: 'silver', earnedDate: new Date().toISOString() })
        if (profile.total_votes_received >= 50) badges.push({ id: '4', name: 'Community Favorite', description: 'Received 50+ votes', icon: '⭐', type: 'platinum', earnedDate: new Date().toISOString() })

        return {
          id: profile.id,
          name: profile.full_name || 'Anonymous',
          role: (profile.role === 'industry_expert' ? 'Industry Expert' : 
                 profile.role === 'admin' ? 'Admin' : 'Student') as User['role'],
          avatar: profile.avatar_url,
          credits,
          problemsSubmitted: stats.problems,
          solutionsProvided: stats.solutions,
          discussionsParticipated: stats.discussions,
          badges,
          rank: 0 // Will be set after sorting
        }
      }) || []

      // Sort by credits and assign ranks
      leaderboardUsers.sort((a, b) => b.credits - a.credits)
      leaderboardUsers.forEach((user, index) => {
        user.rank = index + 1
      })

      setUsers(leaderboardUsers)

      // Calculate platform stats
      const totalUsers = leaderboardUsers.length
      const activeCompetitions = 12 // You can make this dynamic
      const badgesEarned = leaderboardUsers.reduce((sum, user) => sum + user.badges.length, 0)
      const topScore = leaderboardUsers.length > 0 ? leaderboardUsers[0].credits : 0

      setStats({
        totalUsers,
        activeCompetitions,
        badgesEarned,
        topScore
      })

    } catch (error) {
      console.error('Error fetching leaderboard data:', error)
      
      // Fallback to mock data if database fails
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          role: 'Student',
          credits: 2450,
          problemsSubmitted: 12,
          solutionsProvided: 23,
          discussionsParticipated: 45,
          badges: [
            { id: '1', name: 'Problem Solver', description: 'Solved 20+ problems', icon: '🧩', type: 'gold', earnedDate: '2024-01-15' }
          ],
          rank: 1
        }
      ]
      setUsers(mockUsers)
      setStats({ totalUsers: 1, activeCompetitions: 12, badgesEarned: 1, topScore: 2450 })
    } finally {
      setLoading(false)
    }
  }

  // Enhanced user data for sidebar
  const getUserRole = () => {
    if (profile?.role === 'industry_expert') return 'Industry Expert' as const
    if (profile?.role === 'admin') return 'Admin' as const
    return 'Student' as const
  }

  const currentUserData = {
    name: profile?.full_name || authUser?.email?.split('@')[0] || 'User',
    role: getUserRole(),
    avatar: profile?.avatar_url || '👤',
    level: 12,
    xp: 2450,
    nextLevelXp: 3000,
    streak: 7,
    badges: ['🏆', '⭐', '🚀', '💎']
  }

  const filteredUsers = users.filter(user => {
    if (activeTab === 'students') return user.role === 'Student'
    if (activeTab === 'experts') return user.role === 'Industry Expert'
    return true
  })

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'platinum': return 'bg-gray-800 text-white'
      case 'gold': return 'bg-yellow-500 text-white'
      case 'silver': return 'bg-gray-400 text-white'
      case 'bronze': return 'bg-orange-600 text-white'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600' // Gold
    if (rank === 2) return 'text-gray-500'   // Silver
    if (rank === 3) return 'text-orange-600' // Bronze
    return 'text-gray-400'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  // Current user stats
  const currentUser = users.find(u => u.id === authUser?.id)

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/leaderboard"
      />
      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-3 sm:p-4 md:p-8 transition-all duration-300`}>
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 space-y-4 md:space-y-0">
            <div>
              <h1 className={`text-heading-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 tracking-tight flex items-center`}>
                <Trophy className="w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3 text-yellow-500" />
                Leaderboard & Achievements
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-lg`}>
                Track your progress and rankings
              </p>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center space-x-4 mb-6">
            {/* Category Tabs */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category:</span>
              <div className="flex space-x-2">
                {[
                  { id: 'overall', name: 'Overall' },
                  { id: 'students', name: 'Students' },
                  { id: 'experts', name: 'Industry Experts' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Frame */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time Frame:</span>
              <div className="flex space-x-2">
                {[
                  { id: 'all-time', name: 'All Time' },
                  { id: 'this-month', name: 'This Month' },
                  { id: 'this-week', name: 'This Week' }
                ].map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setTimeFrame(frame.id as typeof timeFrame)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      timeFrame === frame.id
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {frame.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Filters Modal */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
              <div className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-t-2xl p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Category */}
                <div className="mb-6">
                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Category</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'overall', name: 'Overall' },
                      { id: 'students', name: 'Students' },
                      { id: 'experts', name: 'Industry Experts' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as typeof activeTab)
                          setIsFilterOpen(false)
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                            : isDarkMode
                              ? 'bg-gray-800 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Time Frame */}
                <div>
                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Time Frame</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all-time', name: 'All Time' },
                      { id: 'this-month', name: 'This Month' },
                      { id: 'this-week', name: 'This Week' }
                    ].map((frame) => (
                      <button
                        key={frame.id}
                        onClick={() => {
                          setTimeFrame(frame.id as typeof timeFrame)
                          setIsFilterOpen(false)
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          timeFrame === frame.id
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                            : isDarkMode
                              ? 'bg-gray-800 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {frame.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
          {[
            { label: 'Total Players', value: loading ? '...' : stats.totalUsers.toLocaleString(), icon: Users, iconColor: 'text-blue-500', bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50' },
            { label: 'Active Competitions', value: loading ? '...' : stats.activeCompetitions.toString(), icon: Trophy, iconColor: 'text-yellow-500', bgColor: isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50' },
            { label: 'Badges Earned', value: loading ? '...' : stats.badgesEarned.toLocaleString(), icon: Award, iconColor: 'text-purple-500', bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50' },
            { label: 'Top Score', value: loading ? '...' : stats.topScore.toLocaleString(), icon: Crown, iconColor: 'text-orange-500', bgColor: isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50' }
          ].map((stat, index) => (
            <div key={index} className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-lg border p-4 md:p-5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
              <div className={`absolute -top-6 -right-6 w-20 h-20 ${stat.bgColor} rounded-full opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-500`}></div>
              <div className={`absolute top-0 left-0 w-full h-1 ${stat.bgColor} group-hover:h-2 transition-all duration-300`}></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className={`p-2 md:p-3 ${stat.bgColor} rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.iconColor}`} />
                  </div>
                  <ArrowUpRight className={`w-4 h-4 md:w-5 md:h-5 ${stat.iconColor} opacity-0 group-hover:opacity-100 transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300`} />
                </div>
                <h3 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {stat.value}
                </h3>
                <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Problems</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Solutions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Discussions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRankColor(user.rank)} font-bold text-lg`}>
                        {getRankIcon(user.rank)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.avatar || '👤'}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Industry Expert'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.credits.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user.problemsSubmitted}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user.solutionsProvided}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user.discussionsParticipated}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex -space-x-1">
                        {user.badges.slice(0, 3).map((badge, badgeIndex) => (
                          <div
                            key={badge.id}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getBadgeColor(badge.type)} ring-2 ring-white dark:ring-gray-900`}
                            title={badge.name}
                          >
                            {badge.icon}
                          </div>
                        ))}
                        {user.badges.length > 3 && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900">
                            +{user.badges.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 