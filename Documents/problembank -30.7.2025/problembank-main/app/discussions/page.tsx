'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Users, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import Link from 'next/link'
import { supabase, DiscussionCategory } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'

const DiscussionsPage = () => {
  const { user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [categories, setCategories] = useState<DiscussionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories with real-time subscription and update counts
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch categories from database
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('discussion_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        setError('Failed to load discussion categories. Please make sure the database is set up correctly.')
        return
      }

      if (!categoriesData || categoriesData.length === 0) {
        setError('No discussion categories found. Please run the database setup script.')
        return
      }

      // Fetch all discussions to calculate actual counts
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('discussions')
        .select('category_id, post_count')

      if (discussionsError) {
        console.error('Error fetching discussions data:', discussionsError)
        // Still use the categories we got, just without accurate counts
        setCategories(categoriesData)
        return
      }

      // Calculate actual counts for each category
      const categoriesWithCounts = categoriesData.map((category: any) => {
        const categoryDiscussions = (discussionsData || []).filter(d => d.category_id === category.id)
        const threadCount = categoryDiscussions.length
        const postCount = categoryDiscussions.reduce((sum, d) => sum + (d.post_count || 0), 0)
        
        return {
          ...category,
          thread_count: threadCount,
          post_count: postCount
        }
      })

      setCategories(categoriesWithCounts)
      console.log('✅ Successfully loaded categories from database:', categoriesWithCounts.length)

    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to connect to database. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    fetchCategories()
      
      // Subscribe to real-time changes
      const categoriesSubscription = supabase
        .channel('discussion_categories_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'discussion_categories'
          },
          (payload) => {
            fetchCategories() // Refetch on any change
          }
        )
        .subscribe()

      // Also subscribe to discussions changes to update counts
      const discussionsSubscription = supabase
        .channel('discussions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'discussions'
          },
          (payload) => {
            fetchCategories() // Refetch to update counts
          }
        )
        .subscribe()

      return () => {
        categoriesSubscription.unsubscribe()
        discussionsSubscription.unsubscribe()
    }
  }, [fetchCategories])

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading discussions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Unable to load discussions
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-md mx-auto`}>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null)
              fetchCategories()
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/discussions"
      />

      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-3 sm:p-4 md:p-8 transition-all duration-300`}>
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-xl sm:text-2xl md:text-heading-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1 sm:mb-2 flex items-center`}>
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-indigo-500" />
            Community Discussions
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base md:text-body-large`}>
            Connect, share knowledge, and discuss solutions with our global community
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg sm:text-xl md:text-heading-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
              No discussion categories found
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base mb-4`}>
              Please run the database setup script to create discussion categories.
            </p>
            <button
              onClick={() => {
                setError(null)
                fetchCategories()
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/discussions/${category.id}`}
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-4 sm:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center text-lg sm:text-2xl`}>
                    {category.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>

                <h3 className={`text-base sm:text-lg md:text-heading-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 line-clamp-2`}>
                  {category.name}
                </h3>
                
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3`}>
                  {category.description}
                </p>

                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{category.thread_count || 0} threads</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{category.post_count || 0} posts</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!user && (
          <div className={`mt-8 ${isDarkMode ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} rounded-xl p-6 border`}>
            <div className="text-center">
              <Users className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Join the Discussion
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Sign up to participate in discussions and share your expertise.
              </p>
              <Link href="/auth/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscussionsPage 