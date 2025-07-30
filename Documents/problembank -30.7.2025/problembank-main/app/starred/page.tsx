'use client'

import React, { useState, useEffect } from 'react'
import { Star, Target, ArrowUpRight, Award, Lightbulb, Search, X } from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import StarAndViewIcons from '../components/StarAndViewIcons'
import Link from 'next/link'
import { supabase, Problem } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const StarredProblemsPage = () => {
  const { user } = useAuth()
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPath] = useState('/starred')
  const [starredProblems, setStarredProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    if (user?.id) {
      fetchStarredProblems()
      setupRealtimeSubscription()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  const fetchStarredProblems = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Fetch problems that the current user has starred
      const { data: starredData, error: starredError } = await supabase
        .from('problem_stars')
        .select(`
          problem_id,
          problems (
            id,
            title,
            description,
            category,
            difficulty,
            status,
            tags,
            author_name,
            created_at,
            deadline,
            views,
            solutions_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (starredError) throw starredError

      // Extract the problems from the join
      const problems = starredData
        ?.map(item => item.problems)
        .filter(problem => problem !== null) as unknown as Problem[]

      setStarredProblems(problems || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch starred problems')
      console.error('Error fetching starred problems:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user?.id) return

    // Subscribe to star changes for current user
    const starChannel = supabase
      .channel(`user_${user.id}_stars`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problem_stars',
        filter: `user_id=eq.${user.id}`
      }, (payload: RealtimePostgresChangesPayload<any>) => {
        console.log('User star update:', payload)
        // Refetch starred problems when stars change
        fetchStarredProblems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(starChannel)
    }
  }

  const categories = [
    { id: 'all', name: 'All Categories', count: starredProblems.length, color: 'from-gray-500 to-gray-600' },
    { id: 'technology', name: 'Technology', count: starredProblems.filter(p => p.category === 'technology').length, color: 'from-blue-500 to-indigo-600' },
    { id: 'healthcare', name: 'Healthcare', count: starredProblems.filter(p => p.category === 'healthcare').length, color: 'from-green-500 to-emerald-600' },
    { id: 'education', name: 'Education', count: starredProblems.filter(p => p.category === 'education').length, color: 'from-yellow-500 to-orange-600' },
    { id: 'environment', name: 'Environment', count: starredProblems.filter(p => p.category === 'environment').length, color: 'from-purple-500 to-pink-600' },
    { id: 'finance', name: 'Finance', count: starredProblems.filter(p => p.category === 'finance').length, color: 'from-cyan-500 to-blue-600' }
  ]

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'beginner': 'from-green-500 to-emerald-600',
      'intermediate': 'from-yellow-500 to-orange-600',
      'advanced': 'from-orange-500 to-red-600',
      'expert': 'from-red-500 to-pink-600'
    }
    return colors[difficulty] || 'from-gray-500 to-gray-600'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'technology': 'from-blue-500 to-indigo-600',
      'healthcare': 'from-green-500 to-emerald-600',
      'education': 'from-yellow-500 to-orange-600',
      'environment': 'from-purple-500 to-pink-600',
      'finance': 'from-cyan-500 to-blue-600',
      'social': 'from-pink-500 to-rose-600'
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'technology': '💻',
      'healthcare': '🏥',
      'education': '📚',
      'environment': '🌱',
      'finance': '💰',
      'social': '🤝'
    }
    return icons[category] || '📋'
  }

  const getAuthorAvatar = (authorName: string) => {
    const avatars = ['👨‍💻', '👩‍💻', '👨‍⚕️', '👩‍⚕️', '👨‍🏫', '👩‍🏫', '👨‍💼', '👩‍💼']
    const index = authorName.length % avatars.length
    return avatars[index]
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  // Filter problems based on search and selected filters
  const filteredProblems = starredProblems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || problem.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Authentication check
  if (!user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
        <EnhancedSidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          currentPath={currentPath}
        />
        <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300`}>
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Sign In Required</h2>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Please sign in to view your starred problems.
            </p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark-mode-bg' : 'bg-gray-50'} transition-colors duration-300`}>
        <EnhancedSidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          currentPath={currentPath}
        />
        <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300`}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading starred problems...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark-mode-bg' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath={currentPath}
      />

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-3 sm:p-4 md:p-8 transition-all duration-300`}>
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-0 md:flex-row md:items-center justify-between mb-4 md:mb-6">
            <div>
              <h1 className={`text-xl sm:text-2xl md:text-heading-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1 sm:mb-2 tracking-tight flex items-center`}>
                <Star className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-yellow-500 fill-current" />
                Starred Problems
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base md:text-body-large`}>
                Your favorite problems saved for quick access ({starredProblems.length} starred)
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm sm:text-base">{error}</p>
              <button
                onClick={fetchStarredProblems}
                className="mt-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="relative mb-3 sm:mb-4">
            <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search starred problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl text-sm sm:text-base transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
              } focus:ring-2 focus:ring-indigo-500/20 focus:outline-none`}
            />
          </div>

          <div className="mt-3 sm:mt-4">
            {/* Categories */}
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredProblems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className={`text-6xl mb-4 ${starredProblems.length === 0 ? '⭐' : '🔍'}`}></div>
              <h3 className={`text-heading-3 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {starredProblems.length === 0 
                  ? "No starred problems yet"
                  : "No problems match your search"
                }
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-body mb-4`}>
                {starredProblems.length === 0 
                  ? "Start exploring problems and star the ones you find interesting!"
                  : "Try adjusting your search or category filter"
                }
              </p>
              {starredProblems.length === 0 && (
                <Link 
                  href="/problems"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                >
                  <Target className="w-5 h-5" />
                  <span>Browse Problems</span>
                </Link>
              )}
            </div>
          ) : (
            filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className={`relative overflow-hidden rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-sm hover:shadow-md transition-all duration-200`}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl">
                        {getAuthorAvatar(problem.author_name || 'Unknown')}
                      </div>
                      <div>
                        <p className={`text-body font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {problem.author_name || 'Anonymous'}
                        </p>
                        <p className={`text-body-small ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTimeAgo(problem.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(problem.category)} text-white`}>
                      {getCategoryIcon(problem.category)} {problem.category}
                    </div>
                  </div>

                  <h3 className={`text-heading-4 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {problem.title}
                  </h3>
                  
                  <p className={`text-body mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {problem.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {problem.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs font-medium rounded-md ${
                          isDarkMode 
                            ? 'bg-gray-700/50 text-gray-300' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 3 && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                        isDarkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        +{problem.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Difficulty Badge */}
                  <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${getDifficultyColor(problem.difficulty)} text-white mb-4`}>
                    <Award className="w-3 h-3" />
                    <span className="capitalize">{problem.difficulty}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className={`px-5 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-caption">
                      <StarAndViewIcons 
                        problemId={problem.id} 
                        size="sm"
                        className="gap-3"
                      />
                      <div className="flex items-center space-x-1">
                        <Lightbulb className="w-3.5 h-3.5 text-gray-400" />
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{problem.solutions_count || 0}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/problems/${problem.id}`}
                      className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium text-xs"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default StarredProblemsPage