'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnection() {
  const [status, setStatus] = useState<string>('Testing connection...')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth check:', { user, authError })
      
      if (authError) {
        setError(`Auth error: ${authError.message}`)
        setStatus('Authentication failed')
        return
      }

      // Test 2: Try to fetch from profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)
      
      console.log('Profiles fetch:', { profiles, profileError })
      
      if (profileError) {
        setError(`Profile fetch error: ${profileError.message}`)
        setStatus('Database connection failed')
        return
      }

      // Test 3: Try to fetch from events table
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(5)
      
      console.log('Events fetch:', { events, eventsError })
      
      if (eventsError) {
        setError(`Events fetch error: ${eventsError.message}`)
        setStatus('Events table access failed')
        return
      }

      setData({
        user,
        profilesCount: profiles?.length || 0,
        eventsCount: events?.length || 0,
        profiles,
        events
      })
      setStatus('Connection successful!')
    } catch (err) {
      console.error('Test connection error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Connection test failed')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-4">
        <p className="text-lg">Status: <span className={error ? 'text-red-600' : 'text-green-600'}>{status}</span></p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <h2 className="text-red-800 font-semibold mb-2">Error:</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {data && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h2 className="text-green-800 font-semibold mb-2">Connection Data:</h2>
          <div className="space-y-2">
            <p>User: {data.user?.email || 'Not authenticated'}</p>
            <p>Profiles found: {data.profilesCount}</p>
            <p>Events found: {data.eventsCount}</p>
            
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View raw data</summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-[#0b6d41] text-white rounded hover:bg-[#095a37]"
        >
          Retry Test
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Environment Variables Check:</h2>
        <p className="text-sm">NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</p>
        <p className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
      </div>
    </div>
  )
}