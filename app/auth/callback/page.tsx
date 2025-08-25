'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  
  useEffect(() => {
    const supabase = createClient()
    
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const redirectTo = urlParams.get('redirectTo') || '/'
        
        if (!code) {
          console.error('No authorization code found')
          router.push('/auth/sign-in?error=no_code')
          return
        }
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Error exchanging code for session:', error)
          router.push('/auth/sign-in?error=auth_failed')
          return
        }
        
        if (data?.user) {
          console.log('Authentication successful for:', data.user.email)
          
          // Check if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (!profile) {
            // Create profile for new user
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
                role: 'user'
              })
            
            if (profileError) {
              console.error('Error creating profile:', profileError)
            }
          }
          
          // Redirect to the intended page
          router.push(redirectTo)
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth/sign-in?error=unexpected')
      }
    }
    
    handleCallback()
  }, [router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b6d41] to-[#ffde59] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b6d41] mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Completing sign in...</h2>
          <p className="text-sm text-gray-600 mt-2">Please wait while we authenticate you</p>
        </div>
      </div>
    </div>
  )
}