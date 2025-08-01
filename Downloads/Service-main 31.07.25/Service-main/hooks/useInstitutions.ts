'use client'
import { useState, useEffect, useCallback } from 'react'
import { myJkknApi } from '../lib/myjkkn-api'
import type { InstitutionData, PaginatedResponse } from '../lib/myjkkn-api'

export interface UseInstitutionsOptions {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  category?: string
  institutionType?: string
}

export interface UseInstitutionsResult {
  institutions: InstitutionData[]
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
  setCategory: (category: string) => void
  setInstitutionType: (type: string) => void
  reset: () => void
  // API status
  isConfigured: boolean
  isMockMode: boolean
  isProxyMode: boolean
}

export function useInstitutions(options: UseInstitutionsOptions = {}): UseInstitutionsResult {
  const [institutions, setInstitutions] = useState<InstitutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPageState] = useState(options.page || 1)
  const [search, setSearchState] = useState(options.search || '')
  const [status, setStatusState] = useState<'all' | 'active' | 'inactive'>(options.status || 'all')
  const [category, setCategoryState] = useState(options.category || '')
  const [institutionType, setInstitutionTypeState] = useState(options.institutionType || '')
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

  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let response

      // Handle different filtering scenarios
      if (search) {
        response = await myJkknApi.searchInstitutions(search, page, limit)
      } else if (status === 'active') {
        response = await myJkknApi.getInstitutionsByStatus(true, page, limit)
      } else if (status === 'inactive') {
        response = await myJkknApi.getInstitutionsByStatus(false, page, limit)
      } else if (category) {
        response = await myJkknApi.getInstitutionsByCategory(category, page, limit)
      } else if (institutionType) {
        response = await myJkknApi.getInstitutionsByType(institutionType, page, limit)
      } else {
        response = await myJkknApi.getInstitutions(page, limit)
      }

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<InstitutionData>
        setInstitutions(paginatedData.data)
        setPagination({
          page: paginatedData.metadata.page,
          totalPages: paginatedData.metadata.totalPages,
          total: paginatedData.metadata.total,
          hasNextPage: paginatedData.metadata.page < paginatedData.metadata.totalPages,
          hasPreviousPage: paginatedData.metadata.page > 1
        })
      } else {
        throw new Error(response.error || 'Failed to fetch institutions')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setInstitutions([])
      setPagination({
        page: 1,
        totalPages: 1,
        total: 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
      console.error('Error fetching institutions:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, status, category, institutionType])

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  // Actions
  const refresh = useCallback(async () => {
    await fetchInstitutions()
  }, [fetchInstitutions])

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage)
  }, [])

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch)
    setPageState(1) // Reset to first page when searching
    setCategoryState('') // Clear other filters
    setInstitutionTypeState('')
  }, [])

  const setStatus = useCallback((newStatus: 'all' | 'active' | 'inactive') => {
    setStatusState(newStatus)
    setPageState(1) // Reset to first page when filtering
    setSearchState('') // Clear search when filtering
    setCategoryState('') // Clear other filters
    setInstitutionTypeState('')
  }, [])

  const setCategory = useCallback((newCategory: string) => {
    setCategoryState(newCategory)
    setPageState(1) // Reset to first page when filtering
    setSearchState('') // Clear search when filtering
    setStatusState('all') // Reset status filter
    setInstitutionTypeState('') // Clear type filter
  }, [])

  const setInstitutionType = useCallback((newType: string) => {
    setInstitutionTypeState(newType)
    setPageState(1) // Reset to first page when filtering
    setSearchState('') // Clear search when filtering
    setStatusState('all') // Reset status filter
    setCategoryState('') // Clear category filter
  }, [])

  const reset = useCallback(() => {
    setPageState(1)
    setSearchState('')
    setStatusState('all')
    setCategoryState('')
    setInstitutionTypeState('')
    setError(null)
  }, [])

  return {
    institutions,
    loading,
    error,
    pagination,
    // Actions
    refresh,
    setPage,
    setSearch,
    setStatus,
    setCategory,
    setInstitutionType,
    reset,
    // API status
    isConfigured,
    isMockMode,
    isProxyMode
  }
}

// Hook for getting a single institution by ID
export function useInstitution(institutionId?: string) {
  const [institution, setInstitution] = useState<InstitutionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInstitution = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await myJkknApi.getInstitutionById(id)

      if (response.success && response.data) {
        setInstitution(response.data as InstitutionData)
      } else {
        throw new Error(response.error || 'Institution not found')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setInstitution(null)
      console.error('Error fetching institution:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (institutionId) {
      fetchInstitution(institutionId)
    }
  }, [institutionId, fetchInstitution])

  const refresh = useCallback(() => {
    if (institutionId) {
      fetchInstitution(institutionId)
    }
  }, [institutionId, fetchInstitution])

  return {
    institution,
    loading,
    error,
    refresh
  }
} 