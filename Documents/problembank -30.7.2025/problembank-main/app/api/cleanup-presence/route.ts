import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { supabase } from '@/lib/supabase'
=======
import { createClient } from '@supabase/supabase-js'

// Create a service role client for server-side operations that bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
>>>>>>> 0e47ed7 (Initial commit)

export async function POST() {
  try {
    // Call the cleanup function to set inactive users offline
<<<<<<< HEAD
    const { error } = await supabase.rpc('cleanup_inactive_users')
=======
    const { error } = await supabaseAdmin.rpc('cleanup_inactive_users')
>>>>>>> 0e47ed7 (Initial commit)

    if (error) {
      console.error('Error cleaning up inactive users:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup inactive users' },
        { status: 500 }
      )
    }

    // Get the current online user count
<<<<<<< HEAD
    const { data: onlineCount, error: countError } = await supabase.rpc('get_online_user_count')
=======
    const { data: onlineCount, error: countError } = await supabaseAdmin.rpc('get_online_user_count')
>>>>>>> 0e47ed7 (Initial commit)

    if (countError) {
      console.error('Error getting online user count:', countError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Inactive users cleaned up successfully',
      onlineUserCount: onlineCount || 0
    })
  } catch (error) {
    console.error('Error in cleanup presence API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({ 
    status: 'Presence cleanup endpoint is running',
    timestamp: new Date().toISOString()
  })
} 