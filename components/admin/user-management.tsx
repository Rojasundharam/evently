'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Shield, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string | null
  role: 'user' | 'organizer' | 'admin'
  created_at?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [promoting, setPromoting] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Fetch current user's role to verify admin access
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (currentUserProfile?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required')
      }
      
      // Fetch all users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Fetched users:', data)
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToOrganizer = async (userId: string) => {
    try {
      setPromoting(userId)
      const supabase = createClient()
      
      // Update user role to organizer
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'organizer' })
        .eq('id', userId)

      if (error) throw error
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error promoting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to promote user')
    } finally {
      setPromoting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && error.includes('Unauthorized')) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Access Denied: Admin privileges required</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-[#0b6d41]" />
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 text-gray-600 hover:text-[#0b6d41] hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
      </div>

      <div className="p-6">
        {error && !error.includes('Unauthorized') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={fetchUsers}
                className="text-red-700 hover:text-red-900"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gradient-to-br from-[#ffde59] to-[#0b6d41] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {user.full_name || 'No name'}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'organizer'
                        ? 'bg-[#ffde59]/20 text-[#0b6d41]'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user.role === 'user' && (
                  <button
                    onClick={() => handlePromoteToOrganizer(user.id)}
                    disabled={promoting === user.id}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0b6d41] bg-[#ffde59]/20 border border-[#ffde59] rounded-md hover:bg-[#ffde59]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="h-4 w-4" />
                    {promoting === user.id ? 'Promoting...' : 'Promote to Organizer'}
                  </button>
                )}
                {user.role === 'organizer' && (
                  <div className="flex items-center gap-2 text-[#0b6d41]">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Organizer</span>
                  </div>
                )}
                {user.role === 'admin' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Administrator</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  )
}