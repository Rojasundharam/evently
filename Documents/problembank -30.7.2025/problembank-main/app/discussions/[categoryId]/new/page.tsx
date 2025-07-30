'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Tag, Send, AlertCircle } from 'lucide-react'
import EnhancedSidebar from '../../../components/layout/EnhancedSidebar'
import MediaUpload from '../../../components/ui/MediaUpload'
import Link from 'next/link'
import { supabase, DiscussionCategory } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video' | 'document'
  uploading?: boolean
  uploaded?: boolean
  error?: string
}

const NewDiscussionPage = () => {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string
  const { isDarkMode, setIsDarkMode } = useTheme()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [category, setCategory] = useState<DiscussionCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[]
  })
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [currentTag, setCurrentTag] = useState('')

  useEffect(() => {
    async function fetchCategory() {
      try {
        const { data, error } = await supabase
          .from('discussion_categories')
          .select('*')
          .eq('id', categoryId)
          .single()

        if (error) throw error
        setCategory(data)
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Category not found')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

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

  const handleMediaFilesChange = (files: MediaFile[]) => {
    setMediaFiles(files)
  }

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return []

    const uploadedUrls: string[] = []

    for (const mediaFile of mediaFiles) {
    try {
        // Update file status to uploading
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: true, error: undefined } : f
        ))
      
        // Create unique filename
        const timestamp = Date.now()
        const fileExtension = mediaFile.file.name.split('.').pop()
        const fileName = `discussion-media/${user?.id}/${timestamp}-${mediaFile.id}.${fileExtension}`

        // Upload to Supabase Storage (if configured)
        const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                                     process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here'

        if (isSupabaseConfigured) {
          const { data, error } = await supabase.storage
            .from('media')
            .upload(fileName, mediaFile.file)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(fileName)

          uploadedUrls.push(publicUrl)
        } else {
          // Fallback: Create a data URL for preview
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(mediaFile.file)
          })
          uploadedUrls.push(dataUrl)
        }

        // Update file status to uploaded
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: false, uploaded: true } : f
        ))

      } catch (error) {
        console.error('File upload error:', error)
        // Update file status to error
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { 
            ...f, 
            uploading: false, 
            error: 'Upload failed' 
          } : f
        ))
    }
    }

    return uploadedUrls
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be signed in to create a discussion')
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Upload media files first
      const mediaUrls = await uploadMediaFiles()

      // Submit to Supabase
      const discussionData: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category_id: categoryId,
        author_id: user.id,
        author_name: user.user_metadata?.full_name || user.email || 'Anonymous',
        author_avatar: user.user_metadata?.avatar_url,
        tags: formData.tags,
        status: 'active'
      }
      
      // Add media_urls if there are any uploaded files
      // (Comment this back in after running fix-discussions-media.sql)
      // if (mediaUrls.length > 0) {
      //   discussionData.media_urls = mediaUrls
      // }
      
      const { data, error } = await supabase
        .from('discussions')
        .insert(discussionData)
        .select()
        .single()

      if (error) throw error

      // Log activity for streak calculation
      if (data && user?.id) {
        await supabase.from('activity_logs').insert([
          {
            user_id: user.id,
            activity_type: 'discussion_create',
            entity_type: 'discussion',
            entity_id: data.id,
            entity_title: formData.title,
            points_earned: 15
          }
        ])
      }

      // Redirect to the new discussion
      router.push(`/discussions/${categoryId}/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discussion')
      console.error('Error creating discussion:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>Loading category...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} mx-auto mb-4`} />
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Sign In Required
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            You need to be signed in to create a discussion.
          </p>
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} mx-auto mb-4`} />
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Category Not Found
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            The discussion category you're looking for doesn't exist.
          </p>
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
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath={`/discussions/${categoryId}/new`}
      />

      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300 pb-14 md:pb-8`}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
          <div className="flex items-center mb-4">
              <Link 
                href={`/discussions/${categoryId}`} 
              className={`flex items-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors mr-4`}
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base">Back to {category.name}</span>
              </Link>
            </div>
            
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-2xl md:text-3xl mr-4`}>
                {category.icon}
              </div>
            <div>
              <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Plus className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 mr-2 md:mr-3 text-indigo-500" />
                  Start New Discussion
                </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base lg:text-lg`}>
                Share your thoughts with the {category.name.toLowerCase()} community
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

              {/* Title */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl border shadow-lg`}>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Discussion Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 md:px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base`}
                placeholder="Enter a clear, descriptive title..."
                  required
                  disabled={submitting}
                />
              </div>

              {/* Content */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl border shadow-lg`}>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className={`w-full px-3 md:px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm md:text-base`}
                  placeholder="Describe your topic, ask questions, or share your thoughts..."
                  required
                  disabled={submitting}
                />
              </div>

            {/* Media Upload Section */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-3 md:p-4 rounded-lg md:rounded-xl border shadow-lg`}>
              <label className={`block text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Supporting Media (Optional)
              </label>
              <MediaUpload
                onFilesChange={handleMediaFilesChange}
                maxFiles={3}
                maxSizePerFile={10}
                acceptedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx']}
                className="mb-2"
              />
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                📎 Add supporting files
              </div>
              </div>

              {/* Tags */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl border shadow-lg`}>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Tags (Optional)
                </label>
                
              {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                                             <Tag className="w-3 h-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-indigo-600 dark:hover:text-indigo-200"
                          disabled={submitting}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
              {/* Add New Tag */}
              {formData.tags.length < 5 && (
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                                         <Tag className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm`}
                      placeholder="Add a tag..."
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                    disabled={!currentTag.trim() || submitting}
                  >
                    Add
                  </button>
                </div>
              )}
              
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                Tags help others find your discussion ({formData.tags.length}/5)
                </p>
              </div>

              {/* Submit Button */}
            <div className="flex justify-end space-x-4">
                  <Link
                    href={`/discussions/${categoryId}`}
                className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg transition-colors font-medium text-sm`}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold text-sm"
                  >
                      <Send className="w-4 h-4" />
                    <span>{submitting ? 'Creating...' : 'Create Discussion'}</span>
                  </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  )
}

export default NewDiscussionPage