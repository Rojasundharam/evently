'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Star, Target, ArrowUpRight, Award, Lightbulb } from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import StarAndViewIcons from '../components/StarAndViewIcons'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase, Problem } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const ProblemsPage = () => {
  const { isDarkMode, setIsDarkMode } = useTheme()
  const searchParams = useSearchParams()
  const [problems, setProblems] = useState<Problem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [searchTags, setSearchTags] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentPath = '/problems'

  // Handle URL search parameters
  useEffect(() => {
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || 'all'
    const difficulty = searchParams.get('difficulty') || 'all'
    const tags = searchParams.get('tags') || ''
    const author = searchParams.get('author') || ''

    setSearchQuery(query)
    setSelectedCategory(category)
    setSelectedDifficulty(difficulty)
    setSearchTags(tags)
    setSearchAuthor(author)
  }, [searchParams])

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

  // Fetch problems from Supabase with real-time updates
  useEffect(() => {
    fetchProblems()
    
    // Set up real-time subscription for Supabase
    const channel = supabase
      .channel('problems_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problems'
      }, (payload: RealtimePostgresChangesPayload<Problem>) => {
        console.log('Real-time update:', payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          setProblems(prev => [payload.new as Problem, ...prev])
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setProblems(prev => prev.map(p => 
            p.id === payload.new.id ? payload.new as Problem : p
          ))
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setProblems(prev => prev.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchProblems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to fetch problems')
      }
      
      setProblems(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch problems'
      setError(errorMessage)
      console.error('Error fetching problems:', err)
    } finally {
      setLoading(false)
    }
  }

  const { user } = useAuth()

  const categories = [
    { id: 'all', name: 'All Categories', count: problems.length, color: 'from-gray-500 to-gray-600' },
    { id: 'technology', name: 'Technology', count: problems.filter(p => p.category === 'technology').length, color: 'from-blue-500 to-indigo-600' },
    { id: 'healthcare', name: 'Healthcare', count: problems.filter(p => p.category === 'healthcare').length, color: 'from-green-500 to-emerald-600' },
    { id: 'education', name: 'Education', count: problems.filter(p => p.category === 'education').length, color: 'from-yellow-500 to-orange-600' },
    { id: 'environment', name: 'Environment', count: problems.filter(p => p.category === 'environment').length, color: 'from-purple-500 to-pink-600' },
    { id: 'finance', name: 'Finance', count: problems.filter(p => p.category === 'finance').length, color: 'from-cyan-500 to-blue-600' }
  ]

  /*
  const difficulties = [
    { id: 'all', name: 'All Levels', color: 'from-gray-500 to-gray-600' },
    { id: 'beginner', name: 'Beginner', color: 'from-green-500 to-emerald-600' },
    { id: 'intermediate', name: 'Intermediate', color: 'from-yellow-500 to-orange-600' },
    { id: 'advanced', name: 'Advanced', color: 'from-orange-500 to-red-600' },
    { id: 'expert', name: 'Expert', color: 'from-red-500 to-pink-600' }
  ]
  */

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
  const filteredProblems = problems.filter(problem => {
    const matchesSearch = !searchQuery || 
                         problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || problem.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || problem.difficulty === selectedDifficulty
    
    const matchesTags = !searchTags || 
                       searchTags.split(',').some(tag => 
                         problem.tags.some(problemTag => 
                           problemTag.toLowerCase().includes(tag.trim().toLowerCase())
                         )
                       )
    
    const matchesAuthor = !searchAuthor || 
                         (problem.author_name && problem.author_name.toLowerCase().includes(searchAuthor.toLowerCase()))
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesTags && matchesAuthor
  })

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
        <EnhancedSidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          currentPath={currentPath}
        />
        <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300`}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading problems...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
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
                <Target className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-indigo-500" />
                Problems
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base md:text-body-large`}>
                Discover challenges and contribute solutions to real-world problems ({problems.length} active)
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm sm:text-base">{error}</p>
              <button
                onClick={fetchProblems}
                className="mt-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search and Actions */}
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Enhanced Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search problems..."
                  className={`pl-10 pr-3 py-2.5 w-full ${isDarkMode ? 'bg-gray-800/80 border-gray-700 text-white' : 'bg-white border-gray-200'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Submit Problem Button */}
              <Link 
                href="/submit-problem"
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md shadow-indigo-500/25 flex items-center justify-center space-x-2 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Problem</span>
              </Link>
            </div>
          </div>

          {/* Filters - Mobile Optimized */}
          <div className="mt-3 sm:mt-4">
            {/* Categories */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
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
            <div className="col-span-full text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔍</div>
              <h3 className={`text-lg sm:text-xl md:text-heading-3 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No problems found
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base mb-4 px-4`}>
                {problems.length === 0 
                  ? "Be the first to submit a problem!"
                  : "Try adjusting your search or filters"
                }
              </p>
              <Link 
                href="/submit-problem"
                className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Submit First Problem</span>
              </Link>
            </div>
          ) : (
            filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-sm hover:shadow-md transition-all duration-200`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                        {getAuthorAvatar(problem.author_name || 'Unknown')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} truncate`}>
                          {problem.author_name || 'Anonymous'}
                        </p>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTimeAgo(problem.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(problem.category)} text-white flex-shrink-0 ml-2`}>
                      <span className="hidden sm:inline">{getCategoryIcon(problem.category)} </span>{problem.category}
                    </div>
                  </div>

                  <h3 className={`text-base sm:text-lg md:text-heading-4 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                    {problem.title}
                  </h3>
                  
                  <p className={`text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {problem.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
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
                  <div className={`inline-flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${getDifficultyColor(problem.difficulty)} text-white mb-3 sm:mb-4`}>
                    <Award className="w-3 h-3" />
                    <span className="capitalize">{problem.difficulty}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className={`px-4 sm:px-5 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <StarAndViewIcons 
                      problemId={problem.id} 
                      size="sm"
                      className="gap-2 sm:gap-3"
                      showViewButton={true}
                      showLabels={false}
                    />
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

export default ProblemsPage 