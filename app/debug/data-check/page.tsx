'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface DataCheckResult {
  table: string
  status: 'success' | 'error' | 'loading'
  count: number
  error?: string
  sampleData?: any[]
}

export default function DataCheckPage() {
  const [user, setUser] = useState<User | null>(null)
  const [results, setResults] = useState<DataCheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const tables = [
    'profiles',
    'events', 
    'bookings',
    'payments',
    'tickets',
    'check_ins',
    'event_staff',
    'payment_logs',
    'role_permissions',
    'audit_logs'
  ]

  useEffect(() => {
    checkAllData()
  }, [])

  const checkAllData = async () => {
    setLoading(true)
    
    // Check user authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      setUser(user)
      if (error) {
        console.error('Auth error:', error)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }

    // Check each table
    const tableResults: DataCheckResult[] = []
    
    for (const table of tables) {
      try {
        const result: DataCheckResult = {
          table,
          status: 'loading',
          count: 0
        }
        
        // Get count
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          result.status = 'error'
          result.error = countError.message
        } else {
          result.count = count || 0
          
          // Get sample data (first 3 records)
          const { data: sampleData, error: dataError } = await supabase
            .from(table)
            .select('*')
            .limit(3)
          
          if (dataError) {
            result.status = 'error'
            result.error = dataError.message
          } else {
            result.status = 'success'
            result.sampleData = sampleData || []
          }
        }
        
        tableResults.push(result)
      } catch (error) {
        tableResults.push({
          table,
          status: 'error',
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    setResults(tableResults)
    setLoading(false)
  }

  const testAPIEndpoints = async () => {
    const endpoints = [
      '/api/events?category=all&limit=5',
      '/api/bookings',
      '/api/user/role'
    ]
    
    console.log('Testing API endpoints...')
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        const data = await response.json()
        console.log(`${endpoint}:`, { status: response.status, data })
      } catch (error) {
        console.error(`${endpoint} failed:`, error)
      }
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Data Check</h1>
          <p className="text-gray-600 mt-2">Comprehensive check of all Supabase tables and data</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={checkAllData}
            className="px-4 py-2 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={testAPIEndpoints}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test APIs
          </button>
        </div>
      </div>

      {/* User Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-700">
            {user ? `Authenticated as: ${user.email}` : 'Not authenticated'}
          </span>
        </div>
        {user && (
          <div className="mt-2 text-sm text-gray-600">
            <p>User ID: {user.id}</p>
            <p>Created: {new Date(user.created_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b6d41] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking all database tables...</p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div key={result.table} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {result.table}
                </h3>
                <div className={`w-3 h-3 rounded-full ${
                  result.status === 'success' ? 'bg-green-500' : 
                  result.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Records:</span>
                  <span className="font-medium text-gray-900">{result.count}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    result.status === 'success' ? 'text-green-600' : 
                    result.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>

                {result.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700 font-medium">Error:</p>
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  </div>
                )}

                {result.sampleData && result.sampleData.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      View Sample Data ({result.sampleData.length} records)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                      <pre className="overflow-auto max-h-40">
                        {JSON.stringify(result.sampleData, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && results.length > 0 && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Tables Working</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {results.filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Tables with Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {results.reduce((sum, r) => sum + r.count, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {results.filter(r => r.count > 0).length}
              </div>
              <div className="text-sm text-gray-600">Tables with Data</div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Troubleshooting Guide</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>If tables show 0 records:</strong> The tables exist but have no data. This is normal for a new installation.</p>
          <p><strong>If tables show errors:</strong> Check your Supabase connection, RLS policies, or table permissions.</p>
          <p><strong>If authentication fails:</strong> Check your Supabase environment variables and auth configuration.</p>
          <p><strong>To populate test data:</strong> Use the Supabase dashboard or create some events/bookings through the UI.</p>
        </div>
      </div>
    </div>
  )
}
