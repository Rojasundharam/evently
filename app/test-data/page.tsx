'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDataPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    testAllDataSources()
  }, [])

  const testAllDataSources = async () => {
    setLoading(true)
    const testResults: any = {}

    // Test 1: Direct Supabase client query
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .limit(5)
      
      testResults.directSupabase = {
        success: !error,
        count: events?.length || 0,
        error: error?.message,
        data: events
      }
    } catch (err) {
      testResults.directSupabase = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 2: API endpoint
    try {
      const response = await fetch('/api/events?category=all&limit=5')
      const data = await response.json()
      
      testResults.apiEndpoint = {
        success: response.ok,
        status: response.status,
        count: data.events?.length || 0,
        error: data.error,
        data: data.events
      }
    } catch (err) {
      testResults.apiEndpoint = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 3: Authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      testResults.authentication = {
        success: !error,
        authenticated: !!user,
        user: user ? { id: user.id, email: user.email } : null,
        error: error?.message
      }
    } catch (err) {
      testResults.authentication = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 4: Profiles table
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(3)
      
      testResults.profiles = {
        success: !error,
        count: profiles?.length || 0,
        error: error?.message,
        data: profiles
      }
    } catch (err) {
      testResults.profiles = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 5: Bookings table
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .limit(3)
      
      testResults.bookings = {
        success: !error,
        count: bookings?.length || 0,
        error: error?.message,
        data: bookings
      }
    } catch (err) {
      testResults.bookings = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    setResults(testResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b6d41] mx-auto mb-4"></div>
          <p className="text-gray-600">Testing data sources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Source Test</h1>
          <p className="text-gray-600 mt-2">Testing all data fetching methods</p>
        </div>
        <button
          onClick={testAllDataSources}
          className="px-4 py-2 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
        >
          Retest
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(results).map(([testName, result]: [string, any]) => (
          <div key={testName} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {testName.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>

              {result.status && (
                <div className="flex justify-between">
                  <span className="text-gray-600">HTTP Status:</span>
                  <span className="font-medium">{result.status}</span>
                </div>
              )}

              {result.count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Records:</span>
                  <span className="font-medium">{result.count}</span>
                </div>
              )}

              {result.authenticated !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Authenticated:</span>
                  <span className={`font-medium ${result.authenticated ? 'text-green-600' : 'text-red-600'}`}>
                    {result.authenticated ? 'YES' : 'NO'}
                  </span>
                </div>
              )}

              {result.user && (
                <div className="text-sm text-gray-600">
                  <p>User: {result.user.email}</p>
                  <p>ID: {result.user.id}</p>
                </div>
              )}

              {result.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700 font-medium">Error:</p>
                  <p className="text-sm text-red-600 mt-1">{result.error}</p>
                </div>
              )}

              {result.data && result.data.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    View Data ({result.data.length} records)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                    <pre className="overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Environment Check */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Check</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Supabase URL:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Missing ✗'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Supabase Anon Key:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✓' : 'Missing ✗'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/events"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Events Page
          </a>
          <a
            href="/bookings"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Bookings Page
          </a>
          <a
            href="/organizer/my-events"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Test Organizer Page
          </a>
          <a
            href="/admin/payments"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Test Admin Page
          </a>
        </div>
      </div>
    </div>
  )
}
