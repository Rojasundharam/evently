'use client'

import { useState, useMemo } from 'react'
import { useInstitutions } from '@/hooks/useInstitutions'

// Icons
import { 
  SearchIcon, 
  SlidersHorizontalIcon,
  BuildingIcon,
  CheckCircleIcon,
  XIcon,
  RefreshCwIcon
} from 'lucide-react'

interface InstitutionsListProps {
  className?: string
}

export default function InstitutionsList({ className = '' }: InstitutionsListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const {
    institutions,
    loading,
    error,
    pagination,
    refresh,
    setPage,
    setSearch,
    setStatus,
    setCategory,
    setInstitutionType,
    reset,
    isMockMode,
    isProxyMode
  } = useInstitutions()

  const [searchInput, setSearchInput] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')

  // Extract unique values for filters from actual data
  const categories = useMemo(() => {
    const unique = Array.from(new Set(institutions.map(inst => inst.category).filter(Boolean)))
    return unique
  }, [institutions])

  const institutionTypes = useMemo(() => {
    const unique = Array.from(new Set(institutions.map(inst => inst.institution_type).filter(Boolean)))
    return unique
  }, [institutions])

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

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    setCategory(category)
    setShowFilters(false)
  }

  const handleTypeFilter = (type: string) => {
    setSelectedType(type)
    setInstitutionType(type)
    setShowFilters(false)
  }

  const handleReset = () => {
    setSearchInput('')
    setSelectedStatus('all')
    setSelectedCategory('')
    setSelectedType('')
    reset()
    setShowFilters(false)
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'bg-blue-100 text-blue-800',
      'Medical': 'bg-red-100 text-red-800',
      'Arts & Science': 'bg-green-100 text-green-800',
      'Management': 'bg-purple-100 text-purple-800',
      'Education': 'bg-yellow-100 text-yellow-800',
      'Technical': 'bg-indigo-100 text-indigo-800',
      'Research': 'bg-pink-100 text-pink-800',
      'Innovation': 'bg-orange-100 text-orange-800',
      'Vocational': 'bg-teal-100 text-teal-800',
      'Distance Education': 'bg-cyan-100 text-cyan-800',
      'International': 'bg-amber-100 text-amber-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
          <XIcon className="w-5 h-5" />
          Error Loading Institutions
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={refresh}
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
            <BuildingIcon className="w-7 h-7 text-blue-600" />
            Institutions Management
          </h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} institutions found
            {isMockMode && (
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                Mock Mode
              </span>
            )}
            {isProxyMode && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                Proxy Mode
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
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
              placeholder="Search institutions by name, code, category, or type..."
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
                    { value: 'all', label: 'All Institutions' },
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

              {/* Category Filter (Mock Mode Only) */}
              {isMockMode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => handleCategoryFilter('')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedCategory === ''
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Institution Type Filter (Mock Mode Only) */}
              {isMockMode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Institution Type</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => handleTypeFilter('')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedType === ''
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Types
                    </button>
                    {institutionTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeFilter(type)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md border transition-colors ${
                          selectedType === type
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Institutions Grid */}
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
      ) : institutions.length === 0 ? (
        <div className="text-center py-12">
          <BuildingIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No institutions found</h3>
          <p className="text-gray-600 mb-4">
            {searchInput || selectedStatus !== 'all' || selectedCategory || selectedType
              ? 'Try adjusting your search criteria or filters.'
              : 'No institutions are available at the moment.'}
          </p>
          {(searchInput || selectedStatus !== 'all' || selectedCategory || selectedType) && (
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
          {institutions.map((institution) => (
            <div
              key={institution.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 p-6 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {institution.name}
                  </h3>
                  <p className="text-sm text-gray-600 font-mono">
                    {institution.counselling_code}
                  </p>
                </div>
                {getStatusBadge(institution.is_active)}
              </div>

              <div className="space-y-3">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getCategoryColor(institution.category)}`}>
                    {institution.category}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {institution.institution_type}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>Created: {formatDate(institution.created_at)}</span>
                  <span>Updated: {formatDate(institution.updated_at)}</span>
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
            Showing {Math.min((pagination.page - 1) * 20 + 1, pagination.total)} to{' '}
            {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} institutions
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
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
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
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