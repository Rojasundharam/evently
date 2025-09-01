'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const { user, profile, loading, error } = useAuth()
  const [directProfile, setDirectProfile] = useState<any>(null)
  const [directError, setDirectError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchDirectly() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          setDirectError(error.message)
        } else {
          setDirectProfile(data)
        }
      }
    }
    
    fetchDirectly()
  }, [])
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Auth Context State:</h2>
          <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
            {JSON.stringify({ 
              loading, 
              error,
              user: user ? { id: user.id, email: user.email } : null,
              profile 
            }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Direct Supabase Fetch:</h2>
          {directError && (
            <div className="text-red-600 mb-2">Error: {directError}</div>
          )}
          <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
            {JSON.stringify(directProfile, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Role Check:</h2>
          <div className="space-y-1">
            <p>Context Profile Role: <strong>{profile?.role || 'NOT SET'}</strong></p>
            <p>Direct Fetch Role: <strong>{directProfile?.role || 'NOT SET'}</strong></p>
            <p className={profile?.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
              Is Admin (Context): {profile?.role === 'admin' ? 'YES ✅' : 'NO ❌'}
            </p>
            <p className={directProfile?.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
              Is Admin (Direct): {directProfile?.role === 'admin' ? 'YES ✅' : 'NO ❌'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}