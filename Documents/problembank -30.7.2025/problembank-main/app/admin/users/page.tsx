'use client'

import React, { useState, useEffect } from 'react'
import { Search, Users, MoreVertical, Edit, Ban, CheckCircle, XCircle, Trash2, RefreshCw, Filter, ChevronDown } from 'lucide-react'
import EnhancedSidebar from '../../components/layout/EnhancedSidebar'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name?: string
  email?: string
  role: 'admin' | 'industry_expert' | 'student'
  status: 'active' | 'invited' | 'suspended'
  problems_submitted: number
  solutions_posted: number
  total_votes_received: number
  created_at: string
  last_active?: string
}

const AdminUsersPage = () => {
  const { user, profile, isAdmin } = useAuth()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [modalAction, setModalAction] = useState<'edit' | 'suspend' | 'activate' | 'delete'>('edit')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  // Mobile responsive detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card')
        setIsSidebarCollapsed(true)
      } else {
        setViewMode('table')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Redirect if not admin
  useEffect(() => {
    if (user && profile && !isAdmin) {
      router.push('/')
    }
  }, [user, profile, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Try user_profiles table first
      let { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // If user_profiles doesn't exist or is empty, try profiles table
      if (profilesError || !profiles || profiles.length === 0) {
        console.log('Trying profiles table...')
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!profilesErr && profilesData && profilesData.length > 0) {
          profiles = profilesData
          profilesError = null
        }
      }

      if (profilesError) throw profilesError

      // Fetch actual problem counts
      const { data: problemCounts, error: problemError } = await supabase
        .from('problems')
        .select('author_id')
        .not('author_id', 'is', null)

      if (problemError) throw problemError

      // Fetch actual solution counts
      const { data: solutionCounts, error: solutionError } = await supabase
        .from('solutions')
        .select('author_id')
        .not('author_id', 'is', null)

      if (solutionError) throw solutionError

      // Count problems and solutions per user
      const problemCountMap = new Map()
      const solutionCountMap = new Map()

      problemCounts?.forEach(problem => {
        const count = problemCountMap.get(problem.author_id) || 0
        problemCountMap.set(problem.author_id, count + 1)
      })

      solutionCounts?.forEach(solution => {
        const count = solutionCountMap.get(solution.author_id) || 0
        solutionCountMap.set(solution.author_id, count + 1)
      })

      // Combine data
      const usersWithCounts: UserProfile[] = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        problems_submitted: problemCountMap.get(profile.id) || 0,
        solutions_posted: solutionCountMap.get(profile.id) || 0,
        total_votes_received: profile.total_votes_received || 0,
        created_at: profile.created_at,
        last_active: profile.last_active
      })) || []

      setUsers(usersWithCounts)
    } catch (error) {
      console.error('Error fetching users:', error)
      
      // Fallback to mock data if database fails
      setUsers([
        {
          id: '1',
          full_name: 'Dr. Sarah Chen',
          email: 'sarah.chen@example.com',
          role: 'industry_expert',
          status: 'active',
          problems_submitted: 15,
          solutions_posted: 42,
          total_votes_received: 120,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          full_name: 'Mike Johnson',
          email: 'mike.j@example.com',
          role: 'student',
          status: 'active',
          problems_submitted: 8,
          solutions_posted: 12,
          total_votes_received: 45,
          created_at: '2024-02-20T09:15:00Z'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'industry_expert' | 'student') => {
    try {
      setActionLoading(userId)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))

      alert(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const updateUserRoleByEmail = async (email: string, newRole: 'admin' | 'industry_expert' | 'student') => {
    try {
      setActionLoading(email)
      
      console.log(`Attempting to update role for ${email} to ${newRole}`)
      
      // Try to update by email in user_profiles table first
      let { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('email', email)

      if (error) {
        console.log('user_profiles update failed, trying profiles table...')
        // If that fails, try to update in profiles table
        const { error: profilesError } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('email', email)
        
        if (profilesError) {
          console.error('Both table updates failed:', error, profilesError)
          throw profilesError
        } else {
          console.log('Successfully updated role in profiles table')
        }
      } else {
        console.log('Successfully updated role in user_profiles table')
      }

      // Refresh the users list
      await fetchUsers()

      alert(`User role updated to ${newRole} for ${email}`)
    } catch (error) {
      console.error('Error updating user role by email:', error)
      alert(`Failed to update user role for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setActionLoading(null)
    }
  }



  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      setActionLoading(userId)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ))

      alert(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`)
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    } finally {
      setActionLoading(null)
      setShowModal(false)
    }
  }

  const handleUserAction = (user: UserProfile, action: 'edit' | 'suspend' | 'activate' | 'delete') => {
    setSelectedUser(user)
    setModalAction(action)
    setShowModal(true)
  }

  const executeAction = async () => {
    if (!selectedUser) return

    switch (modalAction) {
      case 'suspend':
        await updateUserStatus(selectedUser.id, 'suspended')
        break
      case 'activate':
        await updateUserStatus(selectedUser.id, 'active')
        break
      case 'delete':
        // Implement delete functionality if needed
        alert('Delete functionality not implemented for safety')
        setShowModal(false)
        break
      default:
        setShowModal(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'from-red-500 to-pink-600'
      case 'industry_expert': return 'from-blue-500 to-indigo-600'
      case 'student': return 'from-green-500 to-emerald-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
      case 'invited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  if (!isAdmin && user) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-red-500">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300 pb-20 md:pb-0`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/admin/users"
      />

      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-4 md:p-8 transition-all duration-300`}>
        {/* Header */}
        <div className="mb-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className={`text-xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 flex items-center`}>
                  <Users className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 text-indigo-500 flex-shrink-0" />
                  <span>User Management</span>
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
                  Manage users, roles, and permissions across the platform
                </p>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium self-start"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 shadow-sm`}>
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Users</h3>
            <p className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '...' : users.length.toLocaleString()}
            </p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 shadow-sm`}>
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Users</h3>
            <p className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '...' : users.filter(u => u.status === 'active').length.toLocaleString()}
            </p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 shadow-sm`}>
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Experts</h3>
            <p className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '...' : users.filter(u => u.role === 'industry_expert').length.toLocaleString()}
            </p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 shadow-sm`}>
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Students</h3>
            <p className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '...' : users.filter(u => u.role === 'student').length.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 mb-6 shadow-sm`}>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm`}
              />
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <div className="md:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              >
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filters */}
            <div className={`space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm`}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="industry_expert">Industry Expert</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View / Desktop Table View */}
        {viewMode === 'card' ? (
          // Mobile Card View
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border-2 p-4 shadow-lg`}>
                {/* User Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-lg`}>
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-base truncate`}>
                        {user.full_name || 'No name'}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors flex-shrink-0`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Role and Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(user.role)} text-white`}>
                    {user.role === 'industry_expert' ? 'Expert' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.problems_submitted}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                      Problems
                    </div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.solutions_posted}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                      Solutions
                    </div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                    <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(user.created_at)}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                      Joined
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {/* Role Change */}
                  <div className="space-y-2">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Change Role
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'industry_expert' | 'student')}
                      disabled={actionLoading === user.id}
                      className={`w-full px-3 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium`}
                    >
                      <option value="student">Student</option>
                      <option value="industry_expert">Industry Expert</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-3">
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleUserAction(user, 'suspend')}
                        disabled={actionLoading === user.id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Suspend User</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(user, 'activate')}
                        disabled={actionLoading === user.id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Activate User</span>
                      </button>
                    )}

                    {/* Loading indicator */}
                    {actionLoading === user.id && (
                      <div className="flex items-center justify-center px-4 py-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop Table View
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    User
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Activity
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Joined
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} flex items-center justify-center text-white font-medium`}>
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.full_name || 'No name'}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(user.role)} text-white`}>
                        {user.role === 'industry_expert' ? 'Expert' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        <div>{user.problems_submitted} problems</div>
                        <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.solutions_posted} solutions
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Role Change Dropdown */}
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'industry_expert' | 'student')}
                          disabled={actionLoading === user.id}
                          className={`text-xs px-2 py-1 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                        >
                          <option value="student">Student</option>
                          <option value="industry_expert">Expert</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Status Actions */}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleUserAction(user, 'suspend')}
                            disabled={actionLoading === user.id}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Suspend user"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user, 'activate')}
                            disabled={actionLoading === user.id}
                            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="Activate user"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Loading indicator */}
                        {actionLoading === user.id && (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`} />
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No users found
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Confirmation Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border-2 p-6 max-w-md w-full shadow-2xl`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Confirm Action
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                {modalAction === 'suspend' && `Are you sure you want to suspend ${selectedUser.full_name || selectedUser.email}?`}
                {modalAction === 'activate' && `Are you sure you want to activate ${selectedUser.full_name || selectedUser.email}?`}
                {modalAction === 'delete' && `Are you sure you want to delete ${selectedUser.full_name || selectedUser.email}? This action cannot be undone.`}
              </p>
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-6 py-3 rounded-xl border-2 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors font-medium`}
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading === selectedUser.id}
                  className={`px-6 py-3 rounded-xl text-white transition-colors font-medium ${
                    modalAction === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : modalAction === 'suspend'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {actionLoading === selectedUser.id ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage 