'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, Tag, Target, Trophy, ThumbsUp, ThumbsDown, MessageCircle, Plus, Send, Lightbulb } from 'lucide-react'
import { supabase, Problem, Solution, Comment } from '@/lib/supabase'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import StarAndViewIcons from '../../components/StarAndViewIcons'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function ProblemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string
  const { user, profile, loading: authLoading } = useAuth()
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true)
  const subscriptionsRef = useRef<any[]>([])

  const [problem, setProblem] = useState<Problem | null>(null)
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSolutionForm, setShowSolutionForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})

  // Form states
  const [solutionForm, setSolutionForm] = useState({
    title: '',
    description: '',
    attachments: [] as File[]
  })

  const [commentForm, setCommentForm] = useState('')

  // Cleanup function for subscriptions
  const cleanupSubscriptions = () => {
    subscriptionsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn('Error removing channel:', error)
      }
    })
    subscriptionsRef.current = []
  }

  // Fetch problem and solutions on mount
  useEffect(() => {
    isMountedRef.current = true
    
    if (problemId && !authLoading) {
      fetchProblemData()
      setupRealtimeSubscription()
      loadUserVotes()
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      cleanupSubscriptions()
    }
  }, [problemId, authLoading])

  // Load user votes from localStorage
  const loadUserVotes = () => {
    if (!user) return
    
    const votes: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`vote_${user.id}_`)) {
        const solutionId = key.replace(`vote_${user.id}_`, '')
        votes[solutionId] = localStorage.getItem(key) || ''
      }
    }
    setUserVotes(votes)
  }

  const fetchProblemData = async () => {
    if (!isMountedRef.current) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch problem details with error handling
      const { data: problemData, error: problemError } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .single()

      if (!isMountedRef.current) return

      if (problemError) {
        if (problemError.code === 'PGRST116') {
          throw new Error('Problem not found')
        }
        throw problemError
      }
      
      setProblem(problemData)

      // Fetch solutions for this problem
      const { data: solutionsData, error: solutionsError } = await supabase
        .from('solutions')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })

      if (!isMountedRef.current) return

      if (solutionsError) {
        console.warn('Error fetching solutions:', solutionsError)
        // Don't throw here, just log the warning
      } else {
        // Ensure all solutions have a votes field initialized
        const solutionsWithVotes = (solutionsData || []).map(solution => ({
          ...solution,
          votes: solution.votes || 0
        }))
        setSolutions(solutionsWithVotes)
      }

      // Fetch comments for this problem
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })

      if (!isMountedRef.current) return

      if (commentsError) {
        console.warn('Error fetching comments:', commentsError)
        // Don't throw here, just log the warning
      } else {
        setComments(commentsData || [])
      }

    } catch (err) {
      if (!isMountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch problem data'
      setError(errorMessage)
      console.error('Error fetching problem data:', err)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const setupRealtimeSubscription = () => {
    if (!isMountedRef.current) return

    try {
      // Clean up any existing subscriptions first
      cleanupSubscriptions()

      // Subscribe to solutions changes for this problem
      const solutionsChannel = supabase
        .channel(`problem_${problemId}_solutions`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'solutions',
          filter: `problem_id=eq.${problemId}`
        }, (payload: RealtimePostgresChangesPayload<Solution>) => {
          if (!isMountedRef.current) return
          
          console.log('Real-time solution update:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newSolution = { ...payload.new as Solution, votes: payload.new.votes || 0 }
            setSolutions(prev => [newSolution, ...prev])
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedSolution = { ...payload.new as Solution, votes: payload.new.votes || 0 }
            setSolutions(prev => prev.map(s => 
              s.id === payload.new.id ? updatedSolution : s
            ))
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSolutions(prev => prev.filter(s => s.id !== payload.old.id))
          }
        })
        .subscribe()

      // Subscribe to comments changes for this problem
      const commentsChannel = supabase
        .channel(`problem_${problemId}_comments`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `problem_id=eq.${problemId}`
        }, (payload: RealtimePostgresChangesPayload<Comment>) => {
          if (!isMountedRef.current) return
          
          console.log('Real-time comment update:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setComments(prev => [payload.new as Comment, ...prev])
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setComments(prev => prev.map(c => 
              c.id === payload.new.id ? payload.new as Comment : c
            ))
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setComments(prev => prev.filter(c => c.id !== payload.old.id))
          }
        })
        .subscribe()

      // Store channels for cleanup
      subscriptionsRef.current = [solutionsChannel, commentsChannel]

    } catch (error) {
      console.warn('Error setting up real-time subscriptions:', error)
      // Don't throw here, just log the warning
    }
  }

  const handleSolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMountedRef.current) return
    
    if (!user && !profile?.full_name) {
      alert('Please log in to submit a solution.')
      return
    }
    
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('solutions')
        .insert([
          {
            problem_id: problemId,
            title: solutionForm.title,
            description: solutionForm.description,
            author_id: user?.id,
            author_name: profile?.full_name || user?.email?.split('@')[0] || 'Anonymous',
            status: 'submitted' as const
          }
        ])
        .select()

      if (!isMountedRef.current) return

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

      setSolutionForm({ title: '', description: '', attachments: [] })
      setShowSolutionForm(false)
      alert('Solution submitted successfully!')
    } catch (err) {
      if (!isMountedRef.current) return
      
      console.error('Error submitting solution:', err)
      alert('Failed to submit solution. Please try again.')
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMountedRef.current || !commentForm.trim()) return
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            problem_id: problemId,
            content: commentForm,
            author_id: user?.id,
            author_name: profile?.full_name || user?.email?.split('@')[0] || 'Anonymous'
          }
        ])
        .select()

      if (!isMountedRef.current) return

      if (error) throw error

      // Log activity for streak calculation
      if (data && data.length > 0 && user?.id) {
        await supabase.from('activity_logs').insert([
          {
            user_id: user.id,
            activity_type: 'comment_create',
            entity_type: 'comment',
            entity_id: data[0].id,
            entity_title: 'Comment on problem',
            points_earned: 10
          }
        ])
      }

      setCommentForm('')
    } catch (err) {
      if (!isMountedRef.current) return
      
      console.error('Error posting comment:', err)
      alert('Failed to post comment. Please try again.')
    }
  }

  const handleVote = async (solutionId: string, voteType: 'up' | 'down') => {
    if (!isMountedRef.current || !user) {
      if (!user) {
        alert('Please log in to vote.')
      }
      return
    }

      // Check if user has already voted on this solution
    const existingVote = userVotes[solutionId]
    if (existingVote === voteType) {
      alert('You have already voted on this solution.')
      return
    }

    try {
      // Update solution vote count directly since votes table may not exist
      const currentSolution = solutions.find(s => s.id === solutionId)
      if (!currentSolution) return

      let newVoteCount = currentSolution.votes || 0
      
      // If user is changing their vote, first remove the old vote
      if (existingVote) {
        if (existingVote === 'up') {
          newVoteCount -= 1
        } else {
          newVoteCount += 1
        }
      }
      
      // Apply the new vote
      if (voteType === 'up') {
        newVoteCount += 1
      } else {
        newVoteCount = Math.max(0, newVoteCount - 1) // Prevent negative votes
      }

      // Update the solution in the database
      const { error: updateError } = await supabase
        .from('solutions')
        .update({ votes: newVoteCount })
        .eq('id', solutionId)

      if (!isMountedRef.current) return
      if (updateError) {
        console.error('Error updating vote count:', updateError)
        throw updateError
      }

      // Update local state immediately for better UX
      setSolutions(prev => prev.map(solution => 
        solution.id === solutionId 
          ? { ...solution, votes: newVoteCount }
          : solution
      ))

      // Store user vote preference in localStorage and state
      const userVoteKey = `vote_${user.id}_${solutionId}`
      localStorage.setItem(userVoteKey, voteType)
      setUserVotes(prev => ({ ...prev, [solutionId]: voteType }))

      // Show success message
      console.log(`Successfully ${voteType} voted on solution!`)

    } catch (err) {
      if (!isMountedRef.current) return
      
      console.error('Error voting:', err)
      alert('Failed to vote. Please try again.')
    }
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

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'beginner': 'from-green-500 to-emerald-600',
      'intermediate': 'from-yellow-500 to-orange-600',
      'advanced': 'from-orange-500 to-red-600',
      'expert': 'from-red-500 to-pink-600'
    }
    return colors[difficulty] || 'from-gray-500 to-gray-600'
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-indigo-500 mx-auto mb-3 md:mb-4"></div>
              <p className="text-gray-600 text-sm md:text-base">Loading problem details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 md:py-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Problem Not Found</h2>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base px-4">{error || 'The problem you are looking for does not exist.'}</p>
            <Link 
              href="/problems"
              className="inline-flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span>Back to Problems</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-500 mb-4 md:mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Back to Problems</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Problem Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
          <div className="space-y-4 md:space-y-6">
            {/* Tags and Status */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r ${getCategoryColor(problem.category)} text-white`}>
                {problem.category}
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r ${getDifficultyColor(problem.difficulty)} text-white`}>
                {problem.difficulty}
              </div>
              <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs md:text-sm font-medium">
                {problem.status}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight break-words font-['Poppins']">{problem.title}</h1>
            
            {/* Metadata */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 text-sm text-gray-600 font-['Poppins']">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>By {problem.author_name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{formatTimeAgo(problem.created_at)}</span>
                </div>
                {problem.deadline && (
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 flex-shrink-0" />
                    <span>Deadline: {new Date(problem.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {/* Star and View Icons */}
              <StarAndViewIcons 
                problemId={problemId} 
                size="sm"
                showLabels={true}
                className="self-start"
              />
            </div>

            {/* Tags */}
            {problem.tags && problem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Problem Description */}
          <div className="space-y-4 md:space-y-6">
            <div className="mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 font-['Poppins'] flex items-center">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-3"></div>
                Problem Description
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 md:p-6 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-gray-700 text-sm md:text-base leading-relaxed font-['Poppins'] whitespace-pre-line">{problem.description}</p>
              </div>
            </div>

            {problem.criteria && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 font-['Poppins'] flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></div>
                  Success Criteria
                </h3>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 p-4 md:p-6 rounded-xl border border-green-100 shadow-sm">
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed font-['Poppins'] whitespace-pre-line">{problem.criteria}</p>
                </div>
              </div>
            )}

            {problem.resources && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 font-['Poppins'] flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full mr-3"></div>
                  Resources
                </h3>
                <div className="bg-gradient-to-br from-orange-50 to-red-50/30 p-4 md:p-6 rounded-xl border border-orange-100 shadow-sm">
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed font-['Poppins'] whitespace-pre-line">{problem.resources}</p>
                </div>
              </div>
            )}

            {problem.test_cases && problem.test_cases.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 font-['Poppins'] flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-3"></div>
                  Test Cases
                </h3>
                <div className="space-y-4 md:space-y-6">
                  {problem.test_cases.map((testCase: any, index: number) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm font-['Poppins'] mr-3">
                          {index + 1}
                        </div>
                        <h4 className="text-base md:text-lg font-semibold text-gray-900 font-['Poppins']">Test Case {index + 1}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Input Section */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm md:text-base font-semibold text-gray-800 font-['Poppins']">Input:</span>
                          </div>
                          <div className="bg-white rounded-lg border-2 border-blue-100 shadow-sm overflow-hidden">
                            <div className="bg-blue-50 px-3 py-2 border-b border-blue-100">
                              <span className="text-xs font-medium text-blue-700 font-['Poppins'] uppercase tracking-wide">Input Data</span>
                            </div>
                            <div className="p-4">
                              <pre className="text-sm md:text-base text-gray-700 font-['Poppins'] overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">{testCase.input}</pre>
                            </div>
                          </div>
                        </div>

                        {/* Expected Output Section */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm md:text-base font-semibold text-gray-800 font-['Poppins']">Expected Output:</span>
                          </div>
                          <div className="bg-white rounded-lg border-2 border-green-100 shadow-sm overflow-hidden">
                            <div className="bg-green-50 px-3 py-2 border-b border-green-100">
                              <span className="text-xs font-medium text-green-700 font-['Poppins'] uppercase tracking-wide">Expected Result</span>
                            </div>
                            <div className="p-4">
                              <pre className="text-sm md:text-base text-gray-700 font-['Poppins'] overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">{testCase.output}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Solutions Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-0 mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center">
              <Lightbulb className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-500" />
              Solutions ({solutions.length})
            </h2>
            <button
              onClick={() => setShowSolutionForm(!showSolutionForm)}
              className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Solution</span>
            </button>
          </div>

          {/* Solution Submission Form */}
          {showSolutionForm && (
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Submit Your Solution</h3>
              <form onSubmit={handleSolutionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solution Title *
                  </label>
                  <input
                    type="text"
                    value={solutionForm.title}
                    onChange={(e) => setSolutionForm({ ...solutionForm, title: e.target.value })}
                    className="w-full px-3 py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter a descriptive title for your solution..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solution Description *
                  </label>
                  <textarea
                    value={solutionForm.description}
                    onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Provide a detailed explanation of your solution, including implementation steps, technologies, and expected outcomes..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-indigo-600 text-white text-sm md:text-base font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Solution'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSolutionForm(false)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm md:text-base font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Solutions List */}
          <div className="space-y-3 md:space-y-6">
            {solutions.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <Lightbulb className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No solutions yet</h3>
                <p className="text-gray-600 text-sm md:text-base">Be the first to submit a solution to this problem!</p>
              </div>
            ) : (
              solutions.map((solution) => (
                <div key={solution.id} className="border border-gray-200 rounded-lg p-3 md:p-6 bg-white">
                  {/* Solution Header - Mobile Optimized */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-2 leading-tight break-words">{solution.title}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600">
                        <span className="font-medium">By {solution.author_name || 'Anonymous'}</span>
                        <span>{formatTimeAgo(solution.created_at)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium self-start ${
                          solution.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          solution.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {solution.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Voting Buttons - Mobile Optimized */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleVote(solution.id, 'up')}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            userVotes[solution.id] === 'up'
                              ? 'text-green-600 bg-green-100 border border-green-300'
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50 border border-gray-200'
                          }`}
                          disabled={!user}
                          title={!user ? 'Please log in to vote' : userVotes[solution.id] === 'up' ? 'You liked this solution' : 'Like this solution'}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-medium">{solution.votes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleVote(solution.id, 'down')}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            userVotes[solution.id] === 'down'
                              ? 'text-red-600 bg-red-100 border border-red-300'
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200'
                          }`}
                          disabled={!user}
                          title={!user ? 'Please log in to vote' : userVotes[solution.id] === 'down' ? 'You disliked this solution' : 'Dislike this solution'}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span className="font-medium">0</span>
                        </button>
                      </div>
                      
                      {/* Additional Actions */}
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Solution Description */}
                  <div className="prose prose-sm md:prose-base max-w-none">
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed break-words">{solution.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 