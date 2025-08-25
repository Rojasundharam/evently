import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/config/admin-emails'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('🔄 OAuth callback - exchanging code for session')
    
    if (error) {
      console.error('❌ OAuth exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth_error`)
    }
    
    if (data?.user) {
      console.log('✅ OAuth successful for user:', data.user.email)
      
      // Check if user profile exists, create if not
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()
      
      if (!existingProfile || profileError) {
        console.log('📝 Creating profile for new OAuth user')
        
        // Check if this email should be an admin
        const isAdmin = isAdminEmail(data.user.email)
        
        // Create profile for new OAuth user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
            role: isAdmin ? 'admin' : 'user'
          })
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError)
        } else {
          console.log(`✅ Profile created successfully with role: ${isAdmin ? 'admin' : 'user'}`)
        }
      } else {
        console.log('👤 Existing profile found with role:', existingProfile)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
