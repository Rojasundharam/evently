'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Sparkles, ArrowRight, Save, DollarSign, AlertCircle, RefreshCw, CheckCircle, Brain } from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import MediaUpload from '../components/ui/MediaUpload'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
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

const SubmitProblemPage = () => {
  const router = useRouter()
  const { user: authUser, profile } = useAuth()
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    criteria: ''
  })
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAISuggesting, setIsAISuggesting] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Get real user name from authentication
  const getUserName = () => {
    return profile?.full_name || authUser?.email?.split('@')[0] || 'Anonymous'
  }

  const categories = [
    { id: 'technology', name: 'Technology', icon: '💻', color: 'from-blue-500 to-indigo-600' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: 'from-green-500 to-emerald-600' },
    { id: 'education', name: 'Education', icon: '📚', color: 'from-yellow-500 to-orange-600' },
    { id: 'environment', name: 'Environment', icon: '🌱', color: 'from-purple-500 to-pink-600' },
    { id: 'finance', name: 'Finance', icon: '💰', color: 'from-cyan-500 to-blue-600' },
    { id: 'social', name: 'Social Impact', icon: '🤝', color: 'from-pink-500 to-rose-600' }
  ]

  const difficulties = [
    { id: 'beginner', name: 'Beginner', description: 'Basic problem solving skills required', color: 'from-green-500 to-emerald-600' },
    { id: 'intermediate', name: 'Intermediate', description: 'Some experience and technical knowledge needed', color: 'from-yellow-500 to-orange-600' },
    { id: 'advanced', name: 'Advanced', description: 'Significant expertise and complex thinking required', color: 'from-orange-500 to-red-600' },
    { id: 'expert', name: 'Expert', description: 'Cutting-edge knowledge and innovation needed', color: 'from-red-500 to-pink-600' }
  ]

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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
        const fileName = `problem-media/${authUser?.id}/${timestamp}-${mediaFile.id}.${fileExtension}`

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
          // Fallback: Create a data URL for preview (not recommended for production)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Upload media files first
      const mediaUrls = await uploadMediaFiles()

      // Check if Supabase is configured
      const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                                   process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here'

      if (isSupabaseConfigured) {
        // Use Supabase for real submission
        const { data, error: supabaseError } = await supabase
          .from('problems')
          .insert([
            {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              difficulty: formData.difficulty,
              criteria: formData.criteria || null,
              media_urls: mediaUrls.length > 0 ? mediaUrls : null,
              author_id: authUser?.id,
              author_name: getUserName(),
              status: 'active' as const
            }
          ])
          .select()

        if (supabaseError) throw supabaseError

        // Log activity for streak calculation
        if (data && data.length > 0 && authUser?.id) {
          await supabase.from('activity_logs').insert([
            {
              user_id: authUser.id,
              activity_type: 'problem_submit',
              entity_type: 'problem',
              entity_id: data[0].id,
              entity_title: formData.title,
              points_earned: 50
            }
          ])
        }

        setSuccessMessage('Your problem submitted successfully! It will appear in the problems list in real-time.')
        setShowSuccessMessage(true)
      } else {
        // Fallback to localStorage for testing
        const newProblem = {
          id: Date.now().toString(),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          difficulty: formData.difficulty,
          criteria: formData.criteria || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          author_name: getUserName(),
          status: 'active' as const,
          created_at: new Date().toISOString(),
          votes: 0,
          solution_count: 0,
          views: 0
        }

        // Save to localStorage
        const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]')
        localStorage.setItem('problems', JSON.stringify([newProblem, ...existingProblems]))

        setSuccessMessage('Your problem submitted successfully! Note: Set up Supabase for real database functionality.')
        setShowSuccessMessage(true)
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: 'medium',
        criteria: ''
      })
      setMediaFiles([])
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = () => {
    const requiredFields = ['title', 'description', 'category']
    const filledFields = requiredFields.filter(field => formData[field as keyof typeof formData])
    return (filledFields.length / requiredFields.length) * 100
  }

  const handleAIFillForm = async () => {
    if (isAISuggesting || (!formData.title.trim() && !formData.description.trim())) return
    
    setIsAISuggesting(true)
    setAIError(null)
    
    try {
      const response = await fetch('/api/ai-suggest-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          isFormFillRequest: true
        }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI suggestions')
      }
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.suggestions || typeof data.suggestions !== 'object') {
        throw new Error('Invalid response format from AI')
      }

      console.log('AI Fill Form - Received suggestions:', data.suggestions)

      // AI Fill Form - fill all empty fields, preserve existing user inputs
      setFormData(prev => {
        const updated = {
          ...prev,
          title: prev.title.trim() ? prev.title : (data.suggestions.title || prev.title),
          description: prev.description.trim() ? prev.description : (data.suggestions.description || prev.description),
          category: prev.category ? prev.category : (data.suggestions.category || prev.category),
          difficulty: prev.difficulty === 'medium' ? (data.suggestions.difficulty || prev.difficulty) : prev.difficulty,
          criteria: data.suggestions.criteria || prev.criteria
        }
        console.log('AI Fill Form - Updated form data:', updated)
        return updated
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI suggestions'
      setAIError(errorMessage)
      console.error('AI suggestion error:', err)
    } finally {
      setIsAISuggesting(false)
    }
  }

  const handleRewrite = async () => {
    if (isRewriting || !formData.description.trim()) return
    
    setIsRewriting(true)
    setAIError(null)
    
    try {
      const rewriteData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        isRewriteRequest: true
      }
      
      const response = await fetch('/api/ai-suggest-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewriteData),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to rewrite content')
      }
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.suggestions || typeof data.suggestions !== 'object') {
        throw new Error('Invalid response format from AI')
      }

      console.log('Enhance Content - Received suggestions:', data.suggestions)

      // Enhance Content - ONLY update description, preserve everything else
      setFormData(prev => {
        const updated = {
          ...prev,
          description: data.suggestions.description || prev.description
        }
        console.log('Enhance Content - Updated description only:', {
          before: prev.description,
          after: updated.description
        })
        return updated
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rewrite content'
      setAIError(errorMessage)
      console.error('Rewrite error:', err)
    } finally {
      setIsRewriting(false)
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/submit-problem"
      />

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-4 right-4 md:top-4 md:left-auto md:right-4 z-50 md:max-w-md">
          <div className={`${isDarkMode ? 'bg-green-800 border-green-600' : 'bg-green-50 border-green-200'} border rounded-lg p-4 shadow-lg`}>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-green-100' : 'text-green-800'} mb-1`}>
                  Problem Submitted Successfully!
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-700'} break-words`}>
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className={`flex-shrink-0 ${isDarkMode ? 'text-green-200 hover:text-green-100' : 'text-green-500 hover:text-green-600'} p-1 hover:bg-green-100 dark:hover:bg-green-700/50 rounded-full transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300 pb-14 md:pb-8`}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-start md:justify-between mb-4 md:mb-6">
              <div className="flex-1">
                <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 tracking-tight flex items-center`}>
                  <Plus className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 mr-2 md:mr-3 text-indigo-500 flex-shrink-0" />
                  <span>Submit Problem</span>
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base lg:text-lg`}>
                  Share your challenge with our global community of innovators
                </p>
              </div>
              
              {/* Progress Indicator */}
              <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} rounded-lg md:rounded-xl lg:rounded-2xl border p-3 md:p-4 lg:p-6 shadow-lg w-full md:w-auto`}>
                <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
                  <span className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Completion Progress
                  </span>
                </div>
                <div className="w-full md:w-48 h-2 md:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Error Message */}
            {aiError && (
              <div className="mt-4 p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">AI Suggestion Failed</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300 break-words">{aiError}</p>
                </div>
                <button
                  onClick={() => setAIError(null)}
                  className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-full"
                >
                  <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Form Grid */}
          <div className="space-y-6">
            {/* Title Row */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl lg:rounded-2xl border shadow-lg`}>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Problem Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 md:px-4 py-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base`}
                  placeholder="Enter a descriptive title"
                  required
                />
                {isAISuggesting && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Description Row */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl lg:rounded-2xl border shadow-lg`}>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Problem Description *
              </label>
              <div className="space-y-3">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 md:px-4 py-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm md:text-base`}
                  placeholder="Describe the problem in detail..."
                  required
                />
                  
                {/* AI Action Buttons */}
                {(formData.title.trim().length > 3 || formData.description.trim().length > 10) && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* AI Fill Form Button */}
                      <button
                        type="button"
                        onClick={handleAIFillForm}
                        disabled={isAISuggesting}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Brain className={`w-4 h-4 ${isAISuggesting ? 'animate-spin' : ''}`} />
                        <span>{isAISuggesting ? 'Filling Form...' : 'AI Fill All Fields'}</span>
                      </button>
                      
                      {/* Rewrite Button - Based on Description */}
                      {formData.description.trim().length > 20 && (
                        <button
                          type="button"
                          onClick={handleRewrite}
                          disabled={isRewriting}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRewriting ? 'animate-spin' : ''}`} />
                          <span>{isRewriting ? 'Rewriting...' : 'Enhance Content'}</span>
                        </button>
                      )}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center space-y-1`}>
                      <div>🤖 <strong>AI Fill All Fields</strong>: Completes empty title, description, category, difficulty & criteria</div>
                      <div>✨ <strong>Enhance Content</strong>: Improves description text only (preserves everything else)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Upload Section */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-3 md:p-4 rounded-lg md:rounded-xl border shadow-lg`}>
              <label className={`block text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Supporting Media (Optional)
              </label>
              <MediaUpload
                onFilesChange={handleMediaFilesChange}
                maxFiles={5}
                maxSizePerFile={10}
                acceptedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt']}
              />
              <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                💡 Add supporting files to better explain your problem
              </div>
            </div>

            {/* Category Selection */}
            <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl lg:rounded-2xl border shadow-lg`}>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleInputChange('category', category.id)}
                    className={`flex items-center space-x-2 p-2.5 md:p-3 rounded-lg text-xs md:text-sm transition-all duration-200 ${
                      formData.category === category.id
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-base md:text-lg">{category.icon}</span>
                    <span className="truncate font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty and Success Criteria Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Difficulty Level */}
              <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl lg:rounded-2xl border shadow-lg lg:col-span-1`}>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Difficulty Level *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty.id}
                      type="button"
                      onClick={() => handleInputChange('difficulty', difficulty.id)}
                      className={`p-3 rounded-lg text-sm transition-all duration-200 text-left ${
                        formData.difficulty === difficulty.id
                          ? `bg-gradient-to-r ${difficulty.color} text-white shadow-lg`
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-semibold mb-1">{difficulty.name}</div>
                      <div className="text-xs opacity-80 leading-relaxed">{difficulty.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Success Criteria */}
              <div className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'} p-4 md:p-6 rounded-lg md:rounded-xl lg:rounded-2xl border shadow-lg lg:col-span-2`}>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Success Criteria (Optional)
                </label>
                <textarea
                  value={formData.criteria}
                  onChange={(e) => handleInputChange('criteria', e.target.value)}
                  rows={5}
                  className={`w-full px-3 md:px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm md:text-base`}
                  placeholder="How will solutions be evaluated? What makes a solution successful? Define clear criteria for measuring success..."
                />
                <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                  🤖 Use "AI Fill All Fields" button in description section to auto-complete this field
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                  All fields marked with * are required
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      difficulty: 'medium',
                      criteria: ''
                    })
                    setMediaFiles([])
                  }}
                  className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'} border rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium text-sm order-2 sm:order-1`}
                >
                  <X className="w-4 h-4" />
                  <span>Clear Form</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 md:px-8 py-3 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-xl hover:scale-105'
                  } text-white rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 font-semibold text-sm order-1 sm:order-2`}
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Problem'}</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmitProblemPage 