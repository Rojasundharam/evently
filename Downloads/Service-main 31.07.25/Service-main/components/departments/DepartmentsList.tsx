'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Building, Users, BookOpen, GraduationCap } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useInstitutions } from '@/hooks/useInstitutions'
import { usePrograms } from '@/hooks/usePrograms'

// Icons
import { 
  SearchIcon, 
  SlidersHorizontalIcon,
  GraduationCapIcon,
  CheckCircleIcon,
  XIcon,
  RefreshCwIcon
} from 'lucide-react'

interface Department {
  id: string
  department_name: string
  department_code: string
  institution_id: string
  degree_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DepartmentsListProps {
  className?: string
}

export default function DepartmentsList({ className = '' }: DepartmentsListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all')
  const [selectedDegree, setSelectedDegree] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Use hooks for data
  const {
    departments,
    loading,
    error,
    pagination,
    refresh,
    setPage,
    setSearch,
    setStatus,
    setInstitutionId,
    setDegreeId,
    reset,
    isMockMode,
    isProxyMode
  } = useDepartments()

  // Get institutions and programs for filter dropdowns
  const { institutions } = useInstitutions({ limit: 1000 })
  const { programs } = usePrograms({ pageSize: 1000 })

  // Create unique filter options from actual data
  const uniqueInstitutions = useMemo(() => {
    const unique = Array.from(new Set(
      institutions.map(inst => ({ id: inst.id, name: inst.name }))
    ))
    return unique
  }, [institutions])

  const uniqueDegrees = useMemo(() => {
    const unique = Array.from(new Set(
      programs.map(prog => ({ id: prog.program_id, name: prog.program_name }))
    ))
    return unique
  }, [programs])

  // Calculate stats from current departments
  const stats = useMemo(() => {
    const total = departments.length
    const active = departments.filter(dept => dept.is_active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [departments])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setShowFilters(false)
  }

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setSelectedStatus(status)
    setStatus(status)
    setShowFilters(false)
  }

  const handleInstitutionFilter = (institutionId: string) => {
    setSelectedInstitution(institutionId)
    setInstitutionId(institutionId === 'all' ? '' : institutionId)
    setShowFilters(false)
  }

  const handleDegreeFilter = (degreeId: string) => {
    setSelectedDegree(degreeId)
    setDegreeId(degreeId === 'all' ? '' : degreeId)
    setShowFilters(false)
  }

  const handleReset = () => {
    setSearchInput('')
    setSelectedInstitution('all')
    setSelectedDegree('all')
    setSelectedStatus('all')
    reset()
    setShowFilters(false)
  }

  const handleRefresh = () => {
    refresh()
  }

  const handlePageChange = (page: number) => {
    setPage(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md">
          <CheckCircleIcon className="w-3 h-3" />
          Active
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md">
          <XIcon className="w-3 h-3" />
          Inactive
        </span>
      )
    }
  }

  const getDepartmentTypeColor = (departmentCode: string) => {
    // Color coding based on discipline
    if (['CSE', 'EEE', 'MECH', 'CIVIL', 'ECE', 'IT', 'AIDS', 'AUTO'].includes(departmentCode)) {
      return 'bg-blue-100 text-blue-800' // Engineering
    } else if (['MATH', 'PHYS', 'CHEM', 'ENG', 'BBA'].includes(departmentCode)) {
      return 'bg-green-100 text-green-800' // Arts & Science
    } else if (['MD', 'OMFS', 'ORTHO', 'PHARM', 'PHARM-CHEM', 'CLIN-PHARM'].includes(departmentCode)) {
      return 'bg-red-100 text-red-800' // Medical
    } else if (['MLT', 'PHYSIO', 'RADIO'].includes(departmentCode)) {
      return 'bg-purple-100 text-purple-800' // Allied Health
    } else if (['CA'].includes(departmentCode)) {
      return 'bg-indigo-100 text-indigo-800' // Technical
    } else if (['B.ED', 'ED-PSYCH'].includes(departmentCode)) {
      return 'bg-yellow-100 text-yellow-800' // Education
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
          <XIcon className="w-5 h-5" />
          Error Loading Departments
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
        >
          <RefreshCwIcon className="w-4 h-4" />
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCapIcon className="w-7 h-7 text-blue-600" />
            Departments Management
          </h2>
          <p className="text-gray-600 mt-1">
            {stats.total > 0 ? `${stats.total} departments found` : `${departments.length} departments found`}
            {isMockMode && (
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                Mock Mode
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontalIcon className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments by name, code, institution, or degree..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Filter Options</h3>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Departments' },
                    { value: 'active', label: 'Active Only' },
                    { value: 'inactive', label: 'Inactive Only' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusFilter(option.value as 'all' | 'active' | 'inactive')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedStatus === option.value
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Institution Filter (Mock Mode Only) */}
              {isMockMode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Institution</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => handleInstitutionFilter('all')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedInstitution === 'all'
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Institutions
                    </button>
                    {uniqueInstitutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleInstitutionFilter(inst.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                          selectedInstitution === inst.id
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {inst.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Degree Filter (Mock Mode Only) */}
              {isMockMode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Degree</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => handleDegreeFilter('all')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedDegree === 'all'
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Degrees
                    </button>
                    {uniqueDegrees.map((degree) => (
                      <button
                        key={degree.id}
                        onClick={() => handleDegreeFilter(degree.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                          selectedDegree === degree.id
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {degree.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600 mb-4">
            {searchInput || selectedStatus !== 'all' || selectedInstitution !== 'all' || selectedDegree !== 'all'
              ? 'Try adjusting your search criteria or filters.'
              : 'No departments are available at the moment.'}
          </p>
          {(searchInput || selectedStatus !== 'all' || selectedInstitution !== 'all' || selectedDegree !== 'all') && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div
              key={department.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 p-6 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {department.department_name}
                  </h3>
                  <p className="text-sm text-gray-600 font-mono">
                    {department.department_code}
                  </p>
                </div>
                {getStatusBadge(department.is_active)}
              </div>

              <div className="space-y-3">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getDepartmentTypeColor(department.department_code)}`}>
                    {department.department_code}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Institution:</span> {department.institution_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Degree:</span> {department.degree_id}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>Created: {formatDate(department.created_at)}</span>
                  <span>Updated: {formatDate(department.updated_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * 20 + 1} to{' '}
            {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} departments
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pageNum === pagination.page
                        ? 'text-white bg-blue-600 border border-blue-600'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 