'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Lightbulb, Users, Star, MessageCircle, Award, TrendingUp, ArrowUpRight, ArrowRight, X, Send, Target, CheckCircle, AlertCircle } from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import Link from 'next/link'
import { supabase, Solution, Problem } from '@/lib/supabase'

interface SolutionWithProblem extends Solution {
  problems?: {
    id: string
    title: string
    category: string
    difficulty: string
  }
  comment_count?: number
  technologies?: string[]
  github_link?: string
  demo_link?: string
}
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import MediaUpload from '../components/ui/MediaUpload'

interface SimpleProblem {
  id: string
  title: string
  category: string
  status: string
}

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video' | 'document'
  uploading?: boolean
  uploaded?: boolean
  error?: string
}

const SolutionsPage = () => {
  const { user, profile } = useAuth()
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [activeStatsFilter, setActiveStatsFilter] = useState('all')
  // const [isMobile, setIsMobile] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [solutions, setSolutions] = useState<SolutionWithProblem[]>([])
  const [problems, setProblems] = useState<SimpleProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSolution, setSelectedSolution] = useState<SolutionWithProblem | null>(null)
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Solution submission form states
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [solutionForm, setSolutionForm] = useState({
    problem_id: '',
    title: '',
    description: '',
    implementation_details: '',
    technologies: [] as string[],
    repository_url: '',
    demo_url: ''
  })
  const [solutionMediaFiles, setSolutionMediaFiles] = useState<MediaFile[]>([])

  // Enhanced modal states
  const [problemSearchQuery, setProblemSearchQuery] = useState('')
  const [selectedProblemCategory, setSelectedProblemCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [filteredProblems, setFilteredProblems] = useState<SimpleProblem[]>([])
  const [currentTechnology, setCurrentTechnology] = useState('')

  // Problem categories and difficulties
  const problemCategories = [
    { id: 'all', name: 'All Categories', icon: '📋' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'environment', name: 'Environment', icon: '🌱' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'social', name: 'Social Impact', icon: '🤝' },
    { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' }
  ]

  const difficulties = [
    { id: 'all', name: 'All Levels', color: 'bg-gray-500' },
    { id: 'easy', name: 'Easy', color: 'bg-green-500' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-500' },
    { id: 'hard', name: 'Hard', color: 'bg-red-500' }
  ]

  const commonTechnologies = [
    'React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust',
    'Machine Learning', 'AI', 'Blockchain', 'IoT', 'Cloud Computing', 'Mobile Development',
    'Data Science', 'DevOps', 'Cybersecurity', 'Web3', 'AR/VR', 'Quantum Computing'
  ]

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

  // Enhanced modal keyboard events and body scroll management
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSolution) {
          setSelectedSolution(null)
        }
        if (showSubmissionForm) {
          setShowSubmissionForm(false)
        }
      }
    }

    // Manage body scroll for modals
    if (selectedSolution || showSubmissionForm) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedSolution, showSubmissionForm])

  // Reset all modal states when component unmounts or when needed
  useEffect(() => {
    return () => {
      // Cleanup: ensure body scroll is restored
      document.body.style.overflow = 'unset'
      setSelectedSolution(null)
      setShowSubmissionForm(false)
    }
  }, [])

  // Force clear any potential overlay issues on mount
  useEffect(() => {
    // Clear any potential modal overlays on component mount
    const clearOverlays = () => {
      document.body.style.overflow = 'unset'
      setSelectedSolution(null)
      setShowSubmissionForm(false)
      setIsFilterOpen(false)
      
      // Remove any potential corrupted overlay elements
      const overlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"][class*="bg-black"]')
      overlays.forEach(overlay => {
        if (overlay && overlay.parentNode && !overlay.closest('[data-modal="true"]')) {
          overlay.remove()
        }
      })
    }
    
    clearOverlays()
    
    // Also clear on window focus (in case user switches tabs)
    window.addEventListener('focus', clearOverlays)
    
    return () => {
      window.removeEventListener('focus', clearOverlays)
    }
  }, [])

  // Handle voting on solutions
  const handleVote = async (solutionId: string) => {
    if (!user) {
      setNotification({ message: 'Please login to vote on solutions', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    if (votingStates[solutionId]) return // Prevent double voting

    setVotingStates(prev => ({ ...prev, [solutionId]: true }))

    try {
      const { error } = await supabase
        .from('solution_votes')
        .insert([{
          solution_id: solutionId,
          user_id: user.id
        }])

      if (error) throw error

      // Update solution vote count locally
      setSolutions(prev => prev.map(solution => 
        solution.id === solutionId 
          ? { ...solution, votes: (solution.votes || 0) + 1 }
          : solution
      ))

      // Update selected solution if it's the one being voted on
      if (selectedSolution?.id === solutionId) {
        setSelectedSolution(prev => prev ? { ...prev, votes: (prev.votes || 0) + 1 } : null)
      }

      setNotification({ message: 'Solution starred successfully! ⭐', type: 'success' })
      setTimeout(() => setNotification(null), 3000)

    } catch (err) {
      console.error('Error voting:', err)
      setNotification({ message: 'Failed to vote. Please try again.', type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setVotingStates(prev => ({ ...prev, [solutionId]: false }))
    }
  }

  const fetchSolutions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('solutions')
        .select(`
          *,
          problems!inner (
            id,
            title,
            category,
            difficulty
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSolutions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch solutions')
      console.error('Error fetching solutions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProblems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('id, title, category, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProblems(data || [])
    } catch (err) {
      console.error('Error fetching problems:', err)
    }
  }, [])

  // Fetch solutions and problems with real-time subscription
  useEffect(() => {
    fetchSolutions()
    fetchProblems()
    
    // Set up real-time subscription for solutions
    const solutionsChannel = supabase
      .channel('solutions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solutions'
      }, (payload: RealtimePostgresChangesPayload<SolutionWithProblem>) => {
        console.log('Real-time solution update:', payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Re-fetch solutions to get complete data with problem info
          fetchSolutions()
          setSubmissionSuccess(true)
          setTimeout(() => setSubmissionSuccess(false), 3000)
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // Re-fetch solutions to get complete data with problem info
          fetchSolutions()
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setSolutions(prev => prev.filter(s => s.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(solutionsChannel)
    }
  }, [fetchSolutions, fetchProblems])

  // Filter problems based on search and filters
  useEffect(() => {
    let filtered = problems

    // Filter by search query
    if (problemSearchQuery) {
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(problemSearchQuery.toLowerCase()) ||
        problem.category.toLowerCase().includes(problemSearchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedProblemCategory !== 'all') {
      filtered = filtered.filter(problem => 
        problem.category === selectedProblemCategory
      )
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(problem => 
        (problem as any).difficulty === selectedDifficulty
      )
    }

    setFilteredProblems(filtered)
  }, [problems, problemSearchQuery, selectedProblemCategory, selectedDifficulty])

  // Reset modal states when opening
  useEffect(() => {
    if (showSubmissionForm) {
      setProblemSearchQuery('')
      setSelectedProblemCategory('all')
      setSelectedDifficulty('all')
    }
  }, [showSubmissionForm])

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenSolutionModal = () => {
      setShowSubmissionForm(true)
    }

    window.addEventListener('openSolutionSubmissionModal', handleOpenSolutionModal)
    
    return () => {
      window.removeEventListener('openSolutionSubmissionModal', handleOpenSolutionModal)
    }
  }, [])

  const handleSolutionMediaFilesChange = (files: MediaFile[]) => {
    setSolutionMediaFiles(files)
  }

  const uploadSolutionMediaFiles = async (): Promise<string[]> => {
    if (solutionMediaFiles.length === 0) return []

    const uploadedUrls: string[] = []

    for (const mediaFile of solutionMediaFiles) {
      try {
        // Update file status to uploading
        setSolutionMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: true, error: undefined } : f
        ))

        // Create unique filename
        const timestamp = Date.now()
        const fileExtension = mediaFile.file.name.split('.').pop()
        const fileName = `solution-media/${user?.id}/${timestamp}-${mediaFile.id}.${fileExtension}`

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
        setSolutionMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: false, uploaded: true } : f
        ))

      } catch (error) {
        console.error('File upload error:', error)
        // Update file status to error
        setSolutionMediaFiles(prev => prev.map(f => 
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

  const handleSolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solutionForm.problem_id || !solutionForm.title || !solutionForm.description) {
      alert('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload media files first
      const mediaUrls = await uploadSolutionMediaFiles()

      const { data, error } = await supabase
        .from('solutions')
        .insert([
          {
            problem_id: solutionForm.problem_id,
            title: solutionForm.title,
            description: solutionForm.description,
            implementation_details: solutionForm.implementation_details,
            technologies: solutionForm.technologies,
            repository_url: solutionForm.repository_url || null,
            demo_url: solutionForm.demo_url || null,
            media_urls: mediaUrls.length > 0 ? mediaUrls : null,
            author_id: user?.id,
            author_name: profile?.full_name || user?.email?.split('@')[0] || 'Anonymous',
            status: 'submitted'
          }
        ])
        .select()

      if (error) throw error

      // Log activity for streak calculation
      if (data && data.length > 0 && user?.id) {
        await supabase.from('activity_logs').insert([
          {
            user_id: user.id,
            activity_type: 'solution_submit',
            entity_type: 'solution',
            entity_id: data[0].id,
            entity_title: solutionForm.title,
            points_earned: 30
          }
        ])
      }

      // Reset form and close modal
      setSolutionForm({
        problem_id: '',
        title: '',
        description: '',
        implementation_details: '',
        technologies: [],
        repository_url: '',
        demo_url: ''
      })
      setSolutionMediaFiles([])
      setShowSubmissionForm(false)
      
    } catch (err) {
      console.error('Error submitting solution:', err)
      alert('Failed to submit solution. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Technology management functions
  const addTechnology = () => {
    if (currentTechnology.trim() && !solutionForm.technologies.includes(currentTechnology.trim())) {
      setSolutionForm(prev => ({
        ...prev,
        technologies: [...prev.technologies, currentTechnology.trim()]
      }))
      setCurrentTechnology('')
    }
  }

  const removeTechnology = (tech: string) => {
    setSolutionForm(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }

  const addCommonTechnology = (tech: string) => {
    if (!solutionForm.technologies.includes(tech)) {
      setSolutionForm(prev => ({
        ...prev,
        technologies: [...prev.technologies, tech]
      }))
    }
  }

  const clearAllFilters = () => {
    setProblemSearchQuery('')
    setSelectedProblemCategory('all')
    setSelectedDifficulty('all')
  }

  const categories = [
    { id: 'all', name: 'All Categories', color: 'from-gray-500 to-gray-600' },
    { id: 'technology', name: 'Technology', color: 'from-blue-500 to-indigo-600' },
    { id: 'healthcare', name: 'Healthcare', color: 'from-green-500 to-emerald-600' },
    { id: 'education', name: 'Education', color: 'from-yellow-500 to-orange-600' },
    { id: 'environment', name: 'Environment', color: 'from-purple-500 to-pink-600' },
    { id: 'finance', name: 'Finance', color: 'from-cyan-500 to-blue-600' },
    { id: 'social', name: 'Social Impact', color: 'from-pink-500 to-rose-600' }
  ]

  const statusTypes = [
    { id: 'all', name: 'All Status', color: 'from-gray-500 to-gray-600' },
    { id: 'draft', name: 'Draft', color: 'from-gray-500 to-gray-600' },
    { id: 'submitted', name: 'Submitted', color: 'from-blue-500 to-cyan-600' },
    { id: 'reviewed', name: 'Reviewed', color: 'from-yellow-500 to-orange-600' },
    { id: 'accepted', name: 'Accepted', color: 'from-green-500 to-emerald-600' }
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'from-gray-500 to-gray-600',
      'submitted': 'from-blue-500 to-cyan-600',
      'reviewed': 'from-yellow-500 to-orange-600',
      'accepted': 'from-green-500 to-emerald-600'
    }
    return colors[status] || 'from-gray-500 to-gray-600'
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

  const getAuthorAvatar = (authorName: string) => {
    return authorName ? authorName.charAt(0).toUpperCase() : '?'
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

  const getProblemTitle = (solution: SolutionWithProblem) => {
    if (solution.problems?.title) {
      return solution.problems.title
    }
    // Fallback to searching in the problems array
    const problem = problems.find(p => p.id === solution.problem_id)
    return problem ? problem.title : 'Unknown Problem'
  }

  // Filter solutions based on search and selected filters
  const filteredSolutions = solutions.filter(solution => {
    const matchesSearch = solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         solution.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || solution.status === selectedStatus
    
    // Add category filter logic
    const matchesCategory = selectedCategory === 'all' || 
                           (solution.problems && solution.problems.category === selectedCategory)
    
    // Add stats filter logic
    let matchesStatsFilter = true
    if (activeStatsFilter === 'accepted') {
      matchesStatsFilter = solution.status === 'accepted'
    } else if (activeStatsFilter === 'reviewed') {
      // Under Review should include both submitted and reviewed statuses
      matchesStatsFilter = solution.status === 'submitted' || solution.status === 'reviewed'
    } else if (activeStatsFilter === 'contributors') {
      // When contributors is selected, show all solutions (no additional filtering)
      matchesStatsFilter = true
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesStatsFilter
  })

  // Handle stats card clicks
  const handleStatsCardClick = (filterType: string) => {
    if (activeStatsFilter === filterType) {
      // If clicking the same filter, reset to show all
      setActiveStatsFilter('all')
    } else {
      setActiveStatsFilter(filterType)
    }
    
    // Clear search when using stats filter for cleaner experience
    if (filterType !== 'all') {
      setSearchQuery('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading solutions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load solutions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSolutions}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/solutions"
      />

      {/* Success Notification */}
      {submissionSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>Solution submitted successfully!</span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Solution Submission Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4" data-modal="true">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="hidden md:inline">Submit Your Solution</span>
                  <span className="md:hidden">Submit Solution</span>
                </h2>
                <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  <span className="hidden md:inline">Choose a problem and share your innovative solution with the community</span>
                  <span className="md:hidden">Share your solution</span>
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
                {/* Left Panel - Problem Selection */}
                <div className="p-4 lg:p-6 border-r border-gray-200 dark:border-gray-700">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    📋 Select a Problem
                  </h3>

                  {/* Search and Filters */}
                  <div className="space-y-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={problemSearchQuery}
                        onChange={(e) => setProblemSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="Search problems by title or category..."
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {problemCategories.slice(0, 6).map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedProblemCategory(category.id)}
                            className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-all duration-200 ${
                              selectedProblemCategory === category.id
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-2 border-indigo-300'
                                : isDarkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                            }`}
                          >
                            <span>{category.icon}</span>
                            <span className="truncate">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Results & Clear */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''} found
                      </span>
                      {(problemSearchQuery || selectedProblemCategory !== 'all') && (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear filters</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Problems List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredProblems.length > 0 ? (
                      filteredProblems.map((problem) => (
                        <div
                          key={problem.id}
                          onClick={() => setSolutionForm({ ...solutionForm, problem_id: problem.id })}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            solutionForm.problem_id === problem.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                              : isDarkMode
                              ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                              : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                {problem.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {problem.category}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}>
                                  {problem.status}
                                </span>
                              </div>
                            </div>
                            {solutionForm.problem_id === problem.id && (
                              <CheckCircle className="w-5 h-5 text-indigo-500 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No problems found</p>
                        <p className="text-sm">Try adjusting your search criteria or browse all problems</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Solution Details */}
                <div className="p-4 lg:p-6">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    💡 Solution Details
                  </h3>

                  <form onSubmit={handleSolutionSubmit} className="space-y-5">
                    {/* Selected Problem Display */}
                    {solutionForm.problem_id && (
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-indigo-500" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            Selected Problem
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-indigo-200' : 'text-indigo-600'}`}>
                          {problems.find(p => p.id === solutionForm.problem_id)?.title}
                        </p>
                      </div>
                    )}

                    {/* Solution Title */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Solution Title *
                      </label>
                      <input
                        type="text"
                        value={solutionForm.title}
                        onChange={(e) => setSolutionForm({ ...solutionForm, title: e.target.value })}
                        className={`w-full px-4 py-3 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                        placeholder="Enter a compelling title for your solution..."
                        required
                      />
                    </div>

                    {/* Solution Description */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Solution Description *
                      </label>
                      <textarea
                        value={solutionForm.description}
                        onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                        rows={4}
                        className={`w-full px-4 py-3 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                        placeholder="Describe your approach, methodology, and how it solves the problem..."
                        required
                      />
                    </div>

                    {/* Media Upload Section */}
                    <div>
                      <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Supporting Media (Optional)
                      </label>
                      <MediaUpload
                        onFilesChange={handleSolutionMediaFilesChange}
                        maxFiles={3}
                        maxSizePerFile={10}
                        acceptedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx']}
                        className="mb-2"
                      />
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                        📸 Add screenshots or documents
                      </div>
                    </div>

                    {/* Technologies */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Technologies & Tools
                      </label>
                      
                      {/* Current Technologies */}
                      {solutionForm.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {solutionForm.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {tech}
                              <button
                                type="button"
                                onClick={() => removeTechnology(tech)}
                                className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add Technology */}
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={currentTechnology}
                          onChange={(e) => setCurrentTechnology(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                          className={`flex-1 px-3 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="Add technology..."
                        />
                        <button
                          type="button"
                          onClick={addTechnology}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Quick Add Technologies */}
                      <div className="space-y-2">
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Quick add:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {commonTechnologies.slice(0, 8).map((tech) => (
                            <button
                              key={tech}
                              type="button"
                              onClick={() => addCommonTechnology(tech)}
                              disabled={solutionForm.technologies.includes(tech)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                solutionForm.technologies.includes(tech)
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : isDarkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {tech}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-3 md:justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setShowSubmissionForm(false)}
                        className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors text-sm font-medium`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !solutionForm.problem_id || !solutionForm.title || !solutionForm.description}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmitting ? 'Submitting...' : 'Submit Solution'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} w-full max-w-full p-3 sm:p-4 md:p-8 pb-14 md:pb-8 transition-all duration-300 overflow-x-hidden`}>
        {/* Header */}
        <div className="mb-4 md:mb-8 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
            <div>
              <h1 className={`text-2xl md:text-heading-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 tracking-tight flex items-center`}>
                <Lightbulb className="w-6 h-6 md:w-10 md:h-10 mr-2 md:mr-3 text-yellow-500" />
                Solutions
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-lg`}>
                Explore innovative solutions from our global community
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="px-3 py-2 md:px-6 md:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md shadow-indigo-500/25 flex items-center justify-center space-x-1 md:space-x-2 font-medium text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden md:inline">Submit Solution</span>
                <span className="md:hidden">Submit</span>
              </button>
              
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Quick Submit Banner */}
          <div className={`${isDarkMode ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} border rounded-xl p-6 mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Got an innovative solution?
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                  Share your ideas with the community and help solve real-world problems.
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>Start Solving</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div 
              onClick={() => handleStatsCardClick('all')}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-xl p-4 ${
                activeStatsFilter === 'all' 
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg' 
                  : isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className={`w-5 h-5 ${activeStatsFilter === 'all' ? 'text-yellow-600' : 'text-yellow-500'}`} />
                <span className={`text-sm ${
                  activeStatsFilter === 'all' 
                    ? 'text-yellow-700 dark:text-yellow-300' 
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Solutions</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${
                activeStatsFilter === 'all' 
                  ? 'text-yellow-700 dark:text-yellow-300' 
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {solutions.length}
              </p>
            </div>
            
            <div 
              onClick={() => handleStatsCardClick('accepted')}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-xl p-4 ${
                activeStatsFilter === 'accepted' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                  : isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Award className={`w-5 h-5 ${activeStatsFilter === 'accepted' ? 'text-green-600' : 'text-green-500'}`} />
                <span className={`text-sm ${
                  activeStatsFilter === 'accepted' 
                    ? 'text-green-700 dark:text-green-300' 
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Accepted</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${
                activeStatsFilter === 'accepted' 
                  ? 'text-green-700 dark:text-green-300' 
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {solutions.filter(s => s.status === 'accepted').length}
              </p>
            </div>
            
            <div 
              onClick={() => handleStatsCardClick('reviewed')}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-xl p-4 ${
                activeStatsFilter === 'reviewed' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                  : isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className={`w-5 h-5 ${activeStatsFilter === 'reviewed' ? 'text-blue-600' : 'text-blue-500'}`} />
                <span className={`text-sm ${
                  activeStatsFilter === 'reviewed' 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Under Review</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${
                activeStatsFilter === 'reviewed' 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {solutions.filter(s => s.status === 'submitted' || s.status === 'reviewed').length}
              </p>
              </div>
              
            <div 
              onClick={() => handleStatsCardClick('contributors')}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-xl p-4 ${
                activeStatsFilter === 'contributors' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg' 
                  : isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className={`w-5 h-5 ${activeStatsFilter === 'contributors' ? 'text-purple-600' : 'text-purple-500'}`} />
                <span className={`text-sm ${
                  activeStatsFilter === 'contributors' 
                    ? 'text-purple-700 dark:text-purple-300' 
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Contributors</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${
                activeStatsFilter === 'contributors' 
                  ? 'text-purple-700 dark:text-purple-300' 
                  : isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {new Set(solutions.map(s => s.author_id)).size}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              />
            </div>
            
            {/* Desktop Filters */}
            <div className="hidden md:flex space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  // Reset stats filter when using dropdown filters
                  if (e.target.value !== 'all') {
                    setActiveStatsFilter('all')
                  }
                }}
                className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  // Reset stats filter when using dropdown filters
                  if (e.target.value !== 'all') {
                    setActiveStatsFilter('all')
                  }
                }}
                className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              >
                {statusTypes.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {(activeStatsFilter !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <div className="flex items-center space-x-2 mb-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active filters:
              </span>
              {activeStatsFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-full text-xs">
                  {activeStatsFilter === 'accepted' ? 'Accepted Solutions' : 
                   activeStatsFilter === 'reviewed' ? 'Under Review' : 
                   activeStatsFilter === 'contributors' ? 'All Contributors' : 'All Solutions'}
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                  Status: {statusTypes.find(s => s.id === selectedStatus)?.name}
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs">
                  Search: "{searchQuery}"
                </span>
              )}
              <button
                onClick={() => {
                  setActiveStatsFilter('all')
                  setSelectedStatus('all')
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Mobile Filters */}
          {isFilterOpen && (
            <div className="md:hidden mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)}>
                  <X className="w-5 h-5" />
                  </button>
                </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      // Reset stats filter when using dropdown filters
                      if (e.target.value !== 'all') {
                        setActiveStatsFilter('all')
                      }
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value)
                      // Reset stats filter when using dropdown filters
                      if (e.target.value !== 'all') {
                        setActiveStatsFilter('all')
                      }
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg"
                  >
                    {statusTypes.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Solutions Grid */}
        {filteredSolutions.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
              {searchQuery ? 'No solutions found' : 'No solutions available'}
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {searchQuery 
                ? 'Try adjusting your search terms or filters.' 
                : 'Solutions will appear here once they are submitted.'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/problems"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Target className="w-4 h-4 mr-2" />
                Browse Problems
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 w-full">
            {filteredSolutions.map((solution) => (
            <div
              key={solution.id}
              onClick={() => setSelectedSolution(solution)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedSolution(solution)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for solution: ${solution.title}`}
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-3 md:p-6 hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-indigo-300 hover:scale-[1.02] md:hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full`}
            >
              <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Problem Reference */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 text-xs">
                        <Target className="w-3 h-3 text-indigo-500" />
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                          Solving: {getProblemTitle(solution)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2`}>
                      {solution.title}
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm line-clamp-3 mb-4`}>
                      {solution.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getStatusColor(solution.status)} text-white flex-shrink-0 ml-2`}>
                    {solution.status}
                  </span>
              </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                      {getAuthorAvatar(solution.author_name || '')}
                    </div>
                    <span>{solution.author_name || 'Anonymous'}</span>
                  </div>
                  <span>{formatTimeAgo(solution.created_at)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVote(solution.id)
                      }}
                      disabled={votingStates[solution.id]}
                      className="flex items-center space-x-1 hover:text-yellow-500 transition-colors disabled:opacity-50"
                      title="Star this solution"
                    >
                      <Star className={`w-4 h-4 ${votingStates[solution.id] ? 'animate-pulse' : ''}`} />
                      <span>{solution.votes || 0}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{solution.comment_count || 0}</span>
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && solutions.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <div className="text-center">
              <Users className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Our Community</h3>
              <p className="text-gray-600 mb-4">Sign up to submit your own solutions and contribute to solving global challenges.</p>
              <Link href="/auth/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Get Started
              </Link>
            </div>
        </div>
        )}

        {/* Solution Detail Modal */}
        {selectedSolution && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
            data-modal="true"
            onClick={() => setSelectedSolution(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSelectedSolution(null)
              }
            }}
            tabIndex={-1}
          >
            <div 
              className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm mb-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                      Solving: {getProblemTitle(selectedSolution)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getStatusColor(selectedSolution.status)} text-white`}>
                      {selectedSolution.status}
                    </span>
                  </div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedSolution.title}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                        {getAuthorAvatar(selectedSolution.author_name || '')}
                      </div>
                      <span>{selectedSolution.author_name || 'Anonymous'}</span>
                    </div>
                    <span>{formatTimeAgo(selectedSolution.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSolution(null)}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                      Solution Description
                    </h3>
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap leading-relaxed`}>
                      {selectedSolution.description}
                    </div>
                  </div>

                  {/* Technologies */}
                  {selectedSolution.technologies && selectedSolution.technologies.length > 0 && (
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Technologies Used
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSolution.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GitHub Link */}
                  {selectedSolution.github_link && (
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Source Code
                      </h3>
                      <a
                        href={selectedSolution.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <span>View on GitHub</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Demo Link */}
                  {selectedSolution.demo_link && (
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Live Demo
                      </h3>
                      <a
                        href={selectedSolution.demo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <span>View Demo</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Interactive Stats and Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleVote(selectedSolution.id)}
                          disabled={votingStates[selectedSolution.id]}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400 transition-colors disabled:opacity-50 border border-transparent hover:border-yellow-200 dark:hover:border-yellow-800"
                          title="Star this solution"
                        >
                          <Star className={`w-5 h-5 ${votingStates[selectedSolution.id] ? 'animate-pulse' : ''}`} />
                          <span className="font-medium">{selectedSolution.votes || 0} Stars</span>
                        </button>
                        <div className="flex items-center space-x-2 px-3 py-2 text-gray-500">
                          <MessageCircle className="w-5 h-5" />
                          <span>{selectedSolution.comment_count || 0} Comments</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {formatTimeAgo(selectedSolution.created_at)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 pt-2">
                                           <button
                       onClick={() => {
                         setSelectedSolution(null)
                         setShowSubmissionForm(true)
                       }}
                       className="flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                     >
                       <Plus className="w-4 h-4" />
                       <span className="hidden md:inline">Submit Your Solution</span>
                       <span className="md:hidden">Submit Solution</span>
                     </button>
                      {selectedSolution.problems && (
                        <Link 
                          href={`/problems/${selectedSolution.problem_id}`}
                          className="flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          <Target className="w-4 h-4" />
                          <span className="hidden md:inline">View Problem</span>
                          <span className="md:hidden">View</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



      </div>
    </div>
  )
}

export default SolutionsPage 