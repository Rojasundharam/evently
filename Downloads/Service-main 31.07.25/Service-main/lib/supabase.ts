import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Global singleton instance to prevent multiple clients
let supabaseInstance: SupabaseClient | null = null

// Create singleton Supabase client with proper configuration
function createSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Check for existing global instance in browser
  if (typeof window !== 'undefined' && (window as any).__supabase) {
    supabaseInstance = (window as any).__supabase as SupabaseClient
    return supabaseInstance
  }

  // Create new instance with proper auth configuration
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token'
    },
    global: {
      headers: {
        'X-Client-Info': 'jkkn-admin-dashboard',
      },
    },
  })

  // Store instance globally in browser to prevent multiple instances
  if (typeof window !== 'undefined') {
    (window as any).__supabase = supabaseInstance
  }

  return supabaseInstance
}

export const supabase = createSupabaseClient()

// Export type for use in other files
export type { SupabaseClient }
