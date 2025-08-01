'use client'

import { useState, useEffect, useCallback } from 'react'
import { myJkknApi } from '@/lib/myjkkn-api'
import type { DepartmentData, PaginatedResponse } from '@/lib/myjkkn-api'

export interface UseDepartmentsOptions {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  institutionId?: string
  degreeId?: string
}

export interface UseDepartmentsResult {
  departments: DepartmentData[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    total: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  // Actions
  refresh: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setStatus: (status: 'all' | 'active' | 'inactive') => void
  setInstitutionId: (institutionId: string) => void
  setDegreeId: (degreeId: string) => void
  reset: () => void
  // API status
  isConfigured: boolean
  isMockMode: boolean
  isProxyMode: boolean
}

export function useDepartments(options: UseDepartmentsOptions = {}): UseDepartmentsResult {
  const [departments, setDepartments] = useState<DepartmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPageState] = useState(options.page || 1)
  const [search, setSearchState] = useState(options.search || '')
  const [status, setStatusState] = useState<'all' | 'active' | 'inactive'>(options.status || 'all')
  const [institutionId, setInstitutionIdState] = useState(options.institutionId || '')
  const [degreeId, setDegreeIdState] = useState(options.degreeId || '')
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const limit = options.limit || 20

  // Check API configuration
  const isConfigured = myJkknApi.isConfigured()
  const isMockMode = myJkknApi.isMockMode()
  const isProxyMode = myJkknApi.isProxyMode()

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let response

      // Handle different filtering scenarios
      if (search) {
        response = await myJkknApi.searchDepartments(search, page, limit)
      } else if (status === 'active') {
        response = await myJkknApi.getDepartmentsByStatus(true, page, limit)
      } else if (status === 'inactive') {
        response = await myJkknApi.getDepartmentsByStatus(false, page, limit)
      } else if (institutionId) {
        response = await myJkknApi.getDepartmentsByInstitution(institutionId, page, limit)
      } else if (degreeId) {
        response = await myJkknApi.getDepartmentsByDegree(degreeId, page, limit)
      } else {
        response = await myJkknApi.getDepartments(page, limit)
      }

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<DepartmentData>
        setDepartments(paginatedData.data)
        setPagination({
          page: paginatedData.metadata.page,
          totalPages: paginatedData.metadata.totalPages,
          total: paginatedData.metadata.total,
          hasNextPage: paginatedData.metadata.page < paginatedData.metadata.totalPages,
          hasPreviousPage: paginatedData.metadata.page > 1
        })
      } else {
        throw new Error(response.error || 'Failed to fetch departments')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setDepartments([])
      setPagination({
        page: 1,
        totalPages: 1,
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
      console.error('Error fetching departments:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, status, institutionId, degreeId])

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  // Actions
  const refresh = useCallback(async () => {
    await fetchDepartments()
  }, [fetchDepartments])

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage)
  }, [])

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch)
    setPageState(1) // Reset to first page when searching
    setInstitutionIdState('') // Clear other filters
    setDegreeIdState('')
  }, [])

  const setStatus = useCallback((newStatus: 'all' | 'active' | 'inactive') => {
    setStatusState(newStatus)
    setPageState(1) // Reset to first page when filtering
    setSearchState('') // Clear search when filtering
    setInstitutionIdState('') // Clear other filters
    setDegreeIdState('')
  }, [])

  const setInstitutionId = useCallback((newInstitutionId: string) => {
    setInstitutionIdState(newInstitutionId)
    setPageState(1) // Reset to first page when filtering
    setSearchState('') // Clear search when filtering
    setStatusState('all') // Reset status filter
    setDegreeIdState('') // Clear degree filter
  }, [])

  const setDegreeId = useCallback((newDegreeId: string) => {
    setDegreeIdState(newDegreeId)
    setPageState(1) // Reset to first page when filtering
    setSearchState('') // Clear search when filtering
    setStatusState('all') // Reset status filter
    setInstitutionIdState('') // Clear institution filter
  }, [])

  const reset = useCallback(() => {
    setPageState(1)
    setSearchState('')
    setStatusState('all')
    setInstitutionIdState('')
    setDegreeIdState('')
    setError(null)
  }, [])

  return {
    departments,
    loading,
    error,
    pagination,
    // Actions
    refresh,
    setPage,
    setSearch,
    setStatus,
    setInstitutionId,
    setDegreeId,
    reset,
    // API status
    isConfigured,
    isMockMode,
    isProxyMode
  }
}

// Hook for getting a single department by ID
export function useDepartment(departmentId?: string) {
  const [department, setDepartment] = useState<DepartmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartment = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await myJkknApi.getDepartmentById(id)

      if (response.success && response.data) {
        setDepartment(response.data as DepartmentData)
      } else {
        throw new Error(response.error || 'Department not found')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setDepartment(null)
      console.error('Error fetching department:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (departmentId) {
      fetchDepartment(departmentId)
    }
  }, [departmentId, fetchDepartment])

  const refresh = useCallback(() => {
    if (departmentId) {
      fetchDepartment(departmentId)
    }
  }, [departmentId, fetchDepartment])

  return {
    department,
    loading,
    error,
    refresh
  }
} 