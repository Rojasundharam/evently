import { createClient } from '@/lib/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    // No code means this is a direct access - redirect to login
    return NextResponse.redirect(`${origin}/login`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('OAuth exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    // Success - redirect to student portal (safe for all roles)
    return NextResponse.redirect(`${origin}/student`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }
} 