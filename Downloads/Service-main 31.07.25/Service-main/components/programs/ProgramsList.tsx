'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { usePrograms } from '@/hooks/usePrograms'
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Filter,
  AlertCircle,
  Loader2,
  GraduationCap,
  CheckCircle,
  XCircle,
  Calendar,
  Hash
} from 'lucide-react'
import { type ProgramData } from '@/lib/myjkkn-api'

interface ProgramsListProps {
  className?: string
}

function ProgramCard({ program }: { program: ProgramData }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
            {program.program_name}
          </CardTitle>
          <Badge variant={program.is_active ? "default" : "secondary"} className="ml-2">
            {program.is_active ? (
              <><CheckCircle className="h-3 w-3 mr-1" />Active</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" />Inactive</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Program ID:</span>
              <div className="font-mono text-gray-900 mt-1">{program.program_id}</div>
            </div>
            <div>
              <span className="text-gray-500">Institution ID:</span>
              <div className="font-mono text-gray-900 mt-1">{program.institution_id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Department ID:</span>
              <div className="font-mono text-gray-900 mt-1">{program.department_id}</div>
            </div>
            <div>
              <span className="text-gray-500">Degree ID:</span>
              <div className="font-mono text-gray-900 mt-1">{program.degree_id}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {formatDate(program.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                ID: {program.id}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PaginationControls({ 
  pagination, 
  onPageChange, 
  onFirstPage, 
  onPrevPage, 
  onNextPage, 
  onLastPage 
}: {
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
  }
  onPageChange: (page: number) => void
  onFirstPage: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onLastPage: () => void
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-gray-500">
        Showing {Math.min((pagination.currentPage - 1) * 20 + 1, pagination.total)} to{' '}
        {Math.min(pagination.currentPage * 20, pagination.total)} of {pagination.total} results
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFirstPage}
          disabled={!pagination.hasPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!pagination.hasPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 mx-4">
          <span className="text-sm text-gray-500">Page</span>
          <Input
            type="number"
            value={pagination.currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value)
              if (page >= 1 && page <= pagination.totalPages) {
                onPageChange(page)
              }
            }}
            className="w-16 h-8 text-center"
            min={1}
            max={pagination.totalPages}
          />
          <span className="text-sm text-gray-500">of {pagination.totalPages}</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!pagination.hasNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onLastPage}
          disabled={!pagination.hasNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ProgramsList({ className = '' }: ProgramsListProps) {
  const {
    programs,
    loading,
    error,
    pagination,
    searchQuery,
    statusFilter,
    isApiConfigured,
    searchPrograms,
    filterByStatus,
    refresh,
    reset,
    goToPage,
    goToFirstPage,
    goToPrevPage,
    goToNextPage,
    goToLastPage,
    isEmpty,
    hasData
  } = usePrograms()

  const [searchInput, setSearchInput] = React.useState(searchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchPrograms(searchInput)
  }

  const handleStatusFilter = (status: boolean | null) => {
    filterByStatus(status)
  }

  const handleReset = () => {
    setSearchInput('')
    reset()
  }

  if (!isApiConfigured) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">API Not Configured</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Configure your MyJKKN API credentials to start fetching programs data.
          </p>
          <Badge variant="secondary">Configure API credentials to continue</Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            Programs Management
          </h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} programs found
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search programs..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(true)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Active
              </Button>
              <Button
                variant={statusFilter === false ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(false)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Inactive
              </Button>
            </div>


          </div>

          {/* Active Filters */}
          {(searchQuery || statusFilter !== null) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: &quot;{searchQuery}&quot;</Badge>
              )}
              {statusFilter !== null && (
                <Badge variant="secondary">
                  Status: {statusFilter ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-gray-600">Loading programs...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800">Error Loading Programs</h4>
                <p className="text-red-700 text-sm mt-1 whitespace-pre-line">{error}</p>
                {error.includes('CORS') && (
                  <div className="mt-3 flex items-center gap-2">
                    <Link href="/programs/cors-help">
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                        View CORS Solutions
                      </Button>
                    </Link>
                    <span className="text-xs text-gray-500">or enable Mock Mode in API settings</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchQuery || statusFilter !== null
                ? "No programs match your current filters."
                : "No programs are available at the moment."}
            </p>
            {(searchQuery || statusFilter !== null) && (
              <Button variant="outline" onClick={handleReset}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Programs Grid */}
      {!loading && !error && hasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <PaginationControls
                  pagination={pagination}
                  onPageChange={goToPage}
                  onFirstPage={goToFirstPage}
                  onPrevPage={goToPrevPage}
                  onNextPage={goToNextPage}
                  onLastPage={goToLastPage}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}