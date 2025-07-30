'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, MessageCircle, Users, ArrowUpRight, Clock, Star, Search } from 'lucide-react'
import EnhancedSidebar from '../../components/layout/EnhancedSidebar'
import Link from 'next/link'
import { supabase, DiscussionCategory, Discussion } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { cleanDiscussionTitle, cleanDiscussionContent, cleanAuthorName } from '@/lib/textUtils'

const CategoryDiscussionsPage = () => {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [category, setCategory] = useState<DiscussionCategory | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch category and discussions with real-time subscription
  useEffect(() => {
    async function fetchCategoryAndDiscussions() {
      if (!supabase) return;
      
      setLoading(true);
      try {
        // Fetch category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('discussion_categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (categoryError) {
          console.error('Error fetching category:', categoryError);
          setError('Category not found or database error occurred.');
          return;
        }

        setCategory(categoryData);

        // Fetch discussions for this category
        const { data: discussionsData, error: discussionsError } = await supabase
          .from('discussions')
          .select(`
            *,
            discussion_categories(name)
          `)
          .eq('category_id', categoryId)
          .order('last_post_at', { ascending: false });

        if (discussionsError) {
          console.error('Error fetching discussions:', discussionsError);
          setError('Failed to load discussions');
          return;
        }
        
        // Clean and validate discussion data
        const cleanedDiscussions = (discussionsData || [])
          .filter(discussion => discussion && discussion.id) // Remove any null/invalid discussions
          .map(discussion => ({
              ...discussion,
            title: cleanDiscussionTitle(discussion.title, categoryData?.name),
              content: cleanDiscussionContent(discussion.content),
              author_name: cleanAuthorName(discussion.author_name || 'Anonymous'),
              likes: discussion.likes || 0,
              post_count: discussion.post_count || 0,
              tags: Array.isArray(discussion.tags) ? discussion.tags : []
          }));

        setDiscussions(cleanedDiscussions);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryAndDiscussions();
  }, [categoryId, supabase]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!supabase || !categoryId) return;

    // Subscribe to category changes
    const categorySubscription = supabase
      .channel('category-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'discussion_categories', filter: `id=eq.${categoryId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setCategory(payload.new as any);
          }
        }
      )
      .subscribe();

    // Subscribe to discussion changes in this category
    const discussionsSubscription = supabase
      .channel('discussions-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'discussions', filter: `category_id=eq.${categoryId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newDiscussion = {
              ...payload.new as any,
              title: cleanDiscussionTitle((payload.new as any).title, category?.name),
              content: cleanDiscussionContent((payload.new as any).content),
              author_name: cleanAuthorName((payload.new as any).author_name || 'Anonymous'),
              likes: (payload.new as any).likes || 0,
              post_count: (payload.new as any).post_count || 0,
              tags: Array.isArray((payload.new as any).tags) ? (payload.new as any).tags : []
            };
            setDiscussions(prev => [newDiscussion, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedDiscussion = {
              ...payload.new as any,
              title: cleanDiscussionTitle((payload.new as any).title, category?.name),
              content: cleanDiscussionContent((payload.new as any).content),
              author_name: cleanAuthorName((payload.new as any).author_name || 'Anonymous'),
              likes: (payload.new as any).likes || 0,
              post_count: (payload.new as any).post_count || 0,
              tags: Array.isArray((payload.new as any).tags) ? (payload.new as any).tags : []
            };
            setDiscussions(prev => prev.map(d => d.id === updatedDiscussion.id ? updatedDiscussion : d));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setDiscussions(prev => prev.filter(d => d.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categorySubscription);
      supabase.removeChannel(discussionsSubscription);
    };
  }, [categoryId, supabase]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getAuthorAvatar = (authorName: string, authorAvatar?: string) => {
    // Clean corrupted avatar URLs
    if (authorAvatar) {
      if (authorAvatar.includes('ocLYGZMcc9bDx') || 
          authorAvatar.includes('DefMt') ||
          authorAvatar.includes('=s96') ||
          authorAvatar.includes('ya29.') ||
          authorAvatar.includes('eyJ') ||
          authorAvatar.includes('googleapis') ||
          /[A-Za-z0-9]{25,}/.test(authorAvatar)) {
        return authorName ? authorName.charAt(0).toUpperCase() : 'A';
      }
      return authorAvatar;
    }
    return authorName ? authorName.charAt(0).toUpperCase() : 'A';
  }

  // Filter discussions based on search query
  const filteredDiscussions = discussions.filter(discussion =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discussions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load discussions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">📂</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Category not found</h2>
          <p className="text-gray-600 mb-4">The discussion category you're looking for doesn't exist.</p>
          <Link
            href="/discussions"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Discussions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath={`/discussions/${categoryId}`}
      />

      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href="/discussions" 
              className={`flex items-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors mr-4`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Discussions
            </Link>
          </div>
          
          <div className="flex items-center mb-4">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-3xl mr-4`}>
              {category.icon}
            </div>
            <div>
              <h1 className={`text-heading-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {category.name}
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
                {category.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{category.thread_count} threads</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{category.post_count} posts</span>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            />
          </div>
          {user && (
            <Link
              href={`/discussions/${categoryId}/new`}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Discussion</span>
            </Link>
          )}
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
        {filteredDiscussions.length === 0 ? (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 text-center`}>
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {searchQuery ? 'No discussions match your search' : 'No discussions yet'}
            </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              {searchQuery 
                  ? 'Try adjusting your search terms or browse all discussions.' 
                  : 'Be the first to start a discussion in this category!'
              }
            </p>
            {user && !searchQuery && (
              <Link
                  href={`/discussions/${categoryId}/new`}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Start Discussion
              </Link>
            )}
          </div>
        ) : (
            filteredDiscussions.map((discussion) => (
              <div
                key={discussion.id}
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                      {getAuthorAvatar(discussion.author_name || '', discussion.author_avatar)}
                      </div>
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {discussion.author_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTimeAgo(discussion.created_at)}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/discussions/${categoryId}/${discussion.id}`}
                      className="block group"
                    >
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2`}>
                        {discussion.title}
                      </h3>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2`}>
                        {discussion.content}
                      </p>
                    </Link>

                    {discussion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {discussion.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {discussion.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{discussion.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{discussion.post_count} replies</span>
                      </div>
                      
                      {discussion.likes > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>{discussion.likes} likes</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link
                    href={`/discussions/${categoryId}/${discussion.id}`}
                    className="ml-4 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                </div>
          </div>
            ))
        )}
        </div>

        {/* Call to Action for non-authenticated users */}
        {!user && (
          <div className={`mt-8 ${isDarkMode ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} rounded-xl p-6 border`}>
            <div className="text-center">
              <Users className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Join the Discussion
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Sign up to start discussions and share your expertise.
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

export default CategoryDiscussionsPage 