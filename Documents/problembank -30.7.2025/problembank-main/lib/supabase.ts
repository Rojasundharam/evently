import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Filter out noisy GoTrueClient logs
if (typeof window !== 'undefined') {
  const originalConsoleLog = console.log
  console.log = (...args) => {
    // Filter out GoTrueClient debug messages
    const message = args.join(' ')
    if (message.includes('GoTrueClient') || message.includes('#_useSession') || 
        message.includes('#_autoRefreshTokenTick') || message.includes('#_acquireLock')) {
      return // Skip these logs
    }
    originalConsoleLog.apply(console, args)
  }
}

// Validate environment variables
const validateEnvironment = () => {
  const hasValidUrl = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  const hasValidKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-key'
  
  if (!hasValidUrl || !hasValidKey) {
    console.error('❌ Missing required environment variables')
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ Running in production without proper Supabase configuration')
      console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables')
    }
    return false
  }

  // Remove any extra whitespace
  const cleanUrl = supabaseUrl.trim()
  const cleanKey = supabaseAnonKey.trim()

  // Basic validation of URL format
  if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://')) {
    console.error('❌ Invalid SUPABASE_URL format:', cleanUrl)
    return false
  }

  // Basic validation of anon key format
  if (cleanKey.length < 100) {
    console.error('❌ SUPABASE_ANON_KEY appears invalid (too short)')
    return false
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase environment variables are properly configured')
  }
  return true
}

const isValidEnv = validateEnvironment()

// Better error handling for missing environment variables
if (!isValidEnv) {
  console.error('❌ Supabase configuration error - authentication may not work properly')
  if (process.env.NODE_ENV === 'development') {
    console.error('Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly')
    console.error('Make sure there are no extra spaces around the = signs in your .env.local file')
    console.error('Current values:')
    console.error('- SUPABASE_URL:', supabaseUrl ? '[SET]' : '[MISSING]')
    console.error('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '[SET]' : '[MISSING]')
  }
}

// Database types
export interface Problem {
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string
  category: string
  difficulty: string
  tags: string[]
  deadline?: string
  resources?: string
  criteria?: string
  test_cases?: { input: string; output: string }[]
  author_id?: string
  author_name?: string
  status: 'active' | 'closed' | 'solved'
  views: number
  likes: number
  solutions_count: number
}

export interface Solution {
  id: string
  created_at: string
  updated_at: string
  problem_id: string
  title: string
  description: string
  author_id?: string
  author_name?: string
  status: 'draft' | 'submitted' | 'reviewed' | 'accepted'
  votes: number
  attachments?: string[]
}

export interface Comment {
  id: string
  created_at: string
  updated_at: string
  content: string
  author_id?: string
  author_name?: string
  problem_id?: string
  solution_id?: string
  parent_id?: string
  likes: number
}

export interface Vote {
  id: string
  created_at: string
  user_id: string
  solution_id?: string
  problem_id?: string
  vote_type: 'up' | 'down'
}

export interface UserPreferences {
  id: string
  created_at: string
  updated_at: string
  problem_replies: boolean
  leaderboard_updates: boolean
  product_announcements: boolean
  email_notifications: boolean
  push_notifications: boolean
}

export interface DiscussionCategory {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  icon: string
  color: string
  thread_count: number
  post_count: number
  sort_order: number
}

export interface Discussion {
  id: string
  created_at: string
  updated_at: string
  title: string
  content: string
  category_id: string
  author_id?: string
  author_name?: string
  author_avatar?: string
  status: 'active' | 'closed' | 'pinned'
  views: number
  likes: number
  post_count: number
  last_post_at: string
  last_post_author?: string
  is_featured: boolean
  tags: string[]
}

export interface DiscussionPost {
  id: string
  created_at: string
  updated_at: string
  discussion_id: string
  parent_id?: string
  content: string
  author_id?: string
  author_name?: string
  author_avatar?: string
  likes: number
  is_solution: boolean
}

export interface ProblemStar {
  id: string
  created_at: string
  user_id: string
  problem_id: string
}

export interface ProblemView {
  id: string
  created_at: string
  user_id?: string
  problem_id: string
  ip_address?: string
  user_agent?: string
}

export interface Database {
  public: {
    Tables: {
      problems: {
        Row: Problem
        Insert: Omit<Problem, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'solutions_count'>
        Update: Partial<Omit<Problem, 'id' | 'created_at'>>
      }
      solutions: {
        Row: Solution
        Insert: Omit<Solution, 'id' | 'created_at' | 'updated_at' | 'votes'>
        Update: Partial<Omit<Solution, 'id' | 'created_at'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'likes'>
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, 'id' | 'created_at'>
        Update: Partial<Omit<Vote, 'id' | 'created_at'>>
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserPreferences, 'id' | 'created_at'>>
      }
      discussion_categories: {
        Row: DiscussionCategory
        Insert: Omit<DiscussionCategory, 'id' | 'created_at' | 'updated_at' | 'thread_count' | 'post_count'>
        Update: Partial<Omit<DiscussionCategory, 'id' | 'created_at'>>
      }
      discussions: {
        Row: Discussion
        Insert: Omit<Discussion, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'post_count' | 'last_post_at' | 'last_post_author'>
        Update: Partial<Omit<Discussion, 'id' | 'created_at'>>
      }
      discussion_posts: {
        Row: DiscussionPost
        Insert: Omit<DiscussionPost, 'id' | 'created_at' | 'updated_at' | 'likes'>
        Update: Partial<Omit<DiscussionPost, 'id' | 'created_at'>>
      }
      problem_stars: {
        Row: ProblemStar
        Insert: Omit<ProblemStar, 'id' | 'created_at'>
        Update: Partial<Omit<ProblemStar, 'id' | 'created_at'>>
      }
      problem_views: {
        Row: ProblemView
        Insert: Omit<ProblemView, 'id' | 'created_at'>
        Update: Partial<Omit<ProblemView, 'id' | 'created_at'>>
      }
    }
  }
}

// Create the Supabase client with proper error handling
export const supabase = createClient<Database>(
  supabaseUrl?.trim() || 'https://placeholder.supabase.co', 
  supabaseAnonKey?.trim() || 'placeholder-key', 
  {
    realtime: {
      params: {
        eventsPerSecond: 5, // Reduced to prevent rate limiting
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      debug: process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true' // Only enable if explicitly set
    },
    global: {
      headers: {
        'x-client-info': 'problembank-web'
      },
      fetch: (url, options = {}) => {
        // Add timeout and error handling to fetch requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal
        }).finally(() => {
          clearTimeout(timeoutId)
        }).catch(error => {
          if (error.name === 'AbortError') {
            console.error('Supabase request timed out:', url)
            throw new Error('Request timeout - please check your connection')
          }
          throw error
        })
      }
    }
  }
)

// Helper function to wrap Supabase queries with error handling
export const withErrorHandling = async <T>(
  queryPromise: Promise<{ data: T; error: any }>,
  context: string = 'Database operation'
): Promise<{ data: T; error: any }> => {
  try {
    const result = await queryPromise
    if (result.error) {
      console.error(`${context} error:`, result.error)
      if (result.error.message?.includes('network') || result.error.message?.includes('fetch')) {
        return {
          data: result.data,
          error: new Error('Network error - please check your connection and try again')
        }
      }
    }
    return result
  } catch (error: any) {
    console.error(`${context} error:`, error)
    if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('timeout')) {
      return {
        data: null as T,
        error: new Error('Network error - please check your connection and try again')
      }
    }
    return {
      data: null as T,
      error
    }
  }
}

// Export default for convenience
export default supabase