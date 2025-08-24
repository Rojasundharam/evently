'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    testAllAPIs()
  }, [])

  const testAllAPIs = async () => {
    setLoading(true)
    const testResults: any = {}

    // Get current user first
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      setUser(user)
      testResults.currentUser = {
        success: !error,
        authenticated: !!user,
        user: user ? { id: user.id, email: user.email } : null,
        error: error?.message
      }
    } catch (err) {
      testResults.currentUser = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 1: Events API
    try {
      const response = await fetch('/api/events?category=all&limit=10')
      const data = await response.json()
      
      testResults.eventsAPI = {
        success: response.ok,
        status: response.status,
        count: data.events?.length || 0,
        error: data.error,
        hasData: (data.events?.length || 0) > 0
      }
    } catch (err) {
      testResults.eventsAPI = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 2: Direct Supabase Events Query
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .limit(10)
      
      testResults.directEvents = {
        success: !error,
        count: events?.length || 0,
        error: error?.message,
        hasData: (events?.length || 0) > 0
      }
    } catch (err) {
      testResults.directEvents = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 3: Direct Supabase Payments Query
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .limit(10)
      
      testResults.directPayments = {
        success: !error,
        count: payments?.length || 0,
        error: error?.message,
        hasData: (payments?.length || 0) > 0
      }
    } catch (err) {
      testResults.directPayments = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 4: Direct Supabase Bookings Query
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .limit(10)
      
      testResults.directBookings = {
        success: !error,
        count: bookings?.length || 0,
        error: error?.message,
        hasData: (bookings?.length || 0) > 0
      }
    } catch (err) {
      testResults.directBookings = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test 5: Profiles Query
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10)
      
      testResults.directProfiles = {
        success: !error,
        count: profiles?.length || 0,
        error: error?.message,
        hasData: (profiles?.length || 0) > 0
      }
    } catch (err) {
      testResults.directProfiles = {
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
          <p className="text-gray-600">Testing all API endpoints and database access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API & Database Test</h1>
          <p className="text-gray-600 mt-2">Comprehensive test of all data access methods</p>
        </div>
        <button
          onClick={testAllAPIs}
          className="px-4 py-2 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
        >
          Retest All
        </button>
      </div>

      {/* Current User Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${results.currentUser?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700">Auth Check</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${results.currentUser?.authenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700">Authenticated</span>
          </div>
          <div className="text-sm text-gray-600">
            {results.currentUser?.user ? (
              <span>User: {results.currentUser.user.email}</span>
            ) : (
              <span>Not authenticated</span>
            )}
          </div>
        </div>
        {results.currentUser?.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">{results.currentUser.error}</p>
          </div>
        )}
      </div>

      {/* Test Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(results).filter(([key]) => key !== 'currentUser').map(([testName, result]: [string, any]) => (
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
                  <span className={`font-medium ${result.hasData ? 'text-green-600' : 'text-yellow-600'}`}>
                    {result.count}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Has Data:</span>
                <span className={`font-medium ${result.hasData ? 'text-green-600' : 'text-yellow-600'}`}>
                  {result.hasData ? 'YES' : 'NO'}
                </span>
              </div>

              {result.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700 font-medium">Error:</p>
                  <p className="text-sm text-red-600 mt-1">{result.error}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(results).filter((r: any) => r.success).length - 1}
            </div>
            <div className="text-sm text-gray-600">Tests Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(results).filter((r: any) => !r.success).length}
            </div>
            <div className="text-sm text-gray-600">Tests Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(results).filter((r: any) => r.hasData).length}
            </div>
            <div className="text-sm text-gray-600">Sources with Data</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {Object.values(results).reduce((sum: number, r: any) => sum + (r.count || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Records</div>
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
            href="/admin/payments"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Test Admin Payments
          </a>
          <a
            href="/organizer/my-events"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Test Organizer Events
          </a>
          <a
            href="/payments"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test User Payments
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Next Steps</h3>
        <div className="space-y-2 text-sm text-yellow-800">
          <p><strong>If tests are failing:</strong> Run the RLS policy fix in your Supabase SQL editor</p>
          <p><strong>If no data is showing:</strong> Your database tables are empty - add some test data</p>
          <p><strong>If authentication fails:</strong> Make sure you're signed in to the application</p>
          <p><strong>If everything passes:</strong> Your application should be working correctly!</p>
        </div>
      </div>
    </div>
  )
}
