import { useState, useEffect, useCallback } from 'react'
import { myJkknApi, type ProgramData, type PaginatedResponse, type ApiResponse } from '@/lib/myjkkn-api'

interface UseProgramsState {
  programs: ProgramData[]
  loading: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseProgramsOptions {
  initialPage?: number
  pageSize?: number
  autoFetch?: boolean
}

export function usePrograms(options: UseProgramsOptions = {}) {
  const { initialPage = 1, pageSize = 20, autoFetch = true } = options

  const [state, setState] = useState<UseProgramsState>({
    programs: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: initialPage,
      totalPages: 0,
      total: 0,
      hasNext: false,
      hasPrev: false
    }
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)

  // Update pagination info
  const updatePagination = useCallback((page: number, totalPages: number, total: number) => {
    setState(prev => ({
      ...prev,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }))
  }, [])

  // Fetch programs data
  const fetchPrograms = useCallback(async (
    page: number = state.pagination.currentPage,
    search?: string,
    isActive?: boolean | null
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      let response: ApiResponse<PaginatedResponse<ProgramData>>

      // Determine which API method to use based on parameters
      if (search && search.trim()) {
        response = await myJkknApi.searchPrograms(search.trim(), page, pageSize)
      } else if (isActive !== null && isActive !== undefined) {
        response = await myJkknApi.getProgramsByStatus(isActive, page, pageSize)
      } else {
        response = await myJkknApi.getPrograms(page, pageSize)
      }

      if (response.success && response.data) {
        const { data, metadata } = response.data
        
        setState(prev => ({
          ...prev,
          programs: data,
          loading: false,
          error: null
        }))

        updatePagination(metadata.page, metadata.totalPages, metadata.total)
      } else {
        setState(prev => ({
          ...prev,
          programs: [],
          loading: false,
          error: response.error || 'Failed to fetch programs'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        programs: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
    }
  }, [state.pagination.currentPage, pageSize, updatePagination])

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.pagination.totalPages) {
      fetchPrograms(page, searchQuery, statusFilter)
    }
  }, [fetchPrograms, searchQuery, statusFilter, state.pagination.totalPages])

  const goToNextPage = useCallback(() => {
    if (state.pagination.hasNext) {
      goToPage(state.pagination.currentPage + 1)
    }
  }, [goToPage, state.pagination.hasNext, state.pagination.currentPage])

  const goToPrevPage = useCallback(() => {
    if (state.pagination.hasPrev) {
      goToPage(state.pagination.currentPage - 1)
    }
  }, [goToPage, state.pagination.hasPrev, state.pagination.currentPage])

  const goToFirstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const goToLastPage = useCallback(() => {
    goToPage(state.pagination.totalPages)
  }, [goToPage, state.pagination.totalPages])

  // Search function
  const searchPrograms = useCallback((query: string) => {
    setSearchQuery(query)
    fetchPrograms(1, query, statusFilter)
  }, [fetchPrograms, statusFilter])

  // Filter by status
  const filterByStatus = useCallback((isActive: boolean | null) => {
    setStatusFilter(isActive)
    fetchPrograms(1, searchQuery, isActive)
  }, [fetchPrograms, searchQuery])

  // Refresh current data
  const refresh = useCallback(() => {
    fetchPrograms(state.pagination.currentPage, searchQuery, statusFilter)
  }, [fetchPrograms, state.pagination.currentPage, searchQuery, statusFilter])

  // Reset to initial state
  const reset = useCallback(() => {
    setSearchQuery('')
    setStatusFilter(null)
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: initialPage }
    }))
    fetchPrograms(initialPage)
  }, [fetchPrograms, initialPage])

  // Get a specific program by ID
  const getProgramById = useCallback(async (programId: string) => {
    const response = await myJkknApi.getProgramById(programId)
    return response
  }, [])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && myJkknApi.isConfigured()) {
      fetchPrograms(initialPage)
    }
  }, [autoFetch, fetchPrograms, initialPage])

  // Check if API is configured
  const isApiConfigured = myJkknApi.isConfigured()

  return {
    // State
    ...state,
    searchQuery,
    statusFilter,
    isApiConfigured,
    
    // Actions
    fetchPrograms,
    searchPrograms,
    filterByStatus,
    refresh,
    reset,
    getProgramById,
    
    // Navigation
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    
    // Utilities
    isEmpty: state.programs.length === 0 && !state.loading,
    hasData: state.programs.length > 0,
    apiConfig: myJkknApi.getConfigInfo()
  }
}