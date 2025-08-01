/**
 * StudentsDataManager Component
 * Comprehensive interface for viewing and managing student data from MyJKKN API
 * Redesigned to match JKKN reference interface
 */

'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useStudents } from '../../hooks/useStudents'
import { StudentData } from '../../lib/myjkkn-api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { Checkbox } from '../ui/checkbox'
import { useToast } from '../ui/use-toast'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { 
  Search, 
  RefreshCw, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Users,
  GraduationCap,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  UserCheck,
  UserX,
  Trash2,
  MoreHorizontal,
  Download
} from 'lucide-react'
import { myJkknApi } from '../../lib/myjkkn-api'

interface StudentsDataManagerProps {
  className?: string;
}

export function StudentsDataManager({ className }: StudentsDataManagerProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentLimit, setCurrentLimit] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    try {
      setIsMounted(true)
    } catch (err) {
      console.error('Error during mounting:', err)
      setHasError(true)
    }
  }, [])

  // Initialize useStudents hook with error handling
  let studentsHookResult
  try {
    studentsHookResult = useStudents({
      page: currentPage,
      limit: currentLimit,
      autoFetch: isMounted // Only auto-fetch after mounting
    })
  } catch (err) {
    console.error('Error in useStudents hook:', err)
    setHasError(true)
    studentsHookResult = {
      students: [],
      loading: false,
      error: 'Failed to initialize students data',
      pagination: null,
      refetch: async () => {},
      fetchPage: async () => {},
      search: async () => {},
      clearFilters: async () => {}
    }
  }

  const {
    students,
    loading,
    error,
    pagination,
    refetch,
    fetchPage,
    search,
    clearFilters
  } = studentsHookResult

  // Show toast for errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Students",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    if (query.trim()) {
      try {
        await search(query)
        toast({
          title: "Search Complete",
          description: `Searching for "${query}"`,
        })
      } catch (err) {
        console.error('Search error:', err)
        toast({
          title: "Search Error",
          description: "Failed to search students. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      await clearFilters()
    }
  }, [search, clearFilters, toast])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      setSelectedStudents([])
      setSelectAll(false)
      setSearchQuery('')
      setStatusFilter('all')
      toast({
        title: "Success",
        description: "Student data refreshed successfully.",
      })
    } catch (err) {
      console.error('Refresh error:', err)
      toast({
        title: "Refresh Error",
        description: "Failed to refresh student data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch, toast])

  // Handle page change
  const handlePageChange = useCallback(async (newPage: number) => {
    setCurrentPage(newPage)
    try {
      await fetchPage(newPage)
      setSelectedStudents([])
      setSelectAll(false)
    } catch (err) {
      console.error('Page change error:', err)
      toast({
        title: "Navigation Error",
        description: "Failed to load page. Please try again.",
        variant: "destructive",
      })
    }
  }, [fetchPage, toast])

  // Handle rows per page change
  const handleLimitChange = useCallback((newLimit: string) => {
    const limit = parseInt(newLimit)
    setCurrentLimit(limit)
    setCurrentPage(1)
    // Re-fetch with new limit
    fetchPage(1)
  }, [fetchPage])

  // Handle status filter change
  const handleStatusFilter = useCallback(async (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    try {
      if (status === 'all') {
        await clearFilters()
      } else if (status === 'active') {
        // Filter for complete profiles
        await clearFilters() // This will be handled by client-side filtering
      } else if (status === 'inactive') {
        // Filter for incomplete profiles
        await clearFilters() // This will be handled by client-side filtering
      }
    } catch (err) {
      console.error('Status filter error:', err)
      toast({
        title: "Filter Error",
        description: "Failed to apply status filter.",
        variant: "destructive",
      })
    }
  }, [clearFilters, toast])

  // Handle individual student selection
  const handleStudentSelect = useCallback((studentId: string, checked: boolean | string) => {
    const isChecked = checked === true || checked === 'true'
    setSelectedStudents(prev => {
      if (isChecked) {
        return [...prev, studentId]
      } else {
        return prev.filter(id => id !== studentId)
      }
    })
  }, [])

  // Client-side filtering for search and status
  const filteredStudents = useMemo(() => {
    if (!students) return []
    
    let filtered = [...students]
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.program?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.institution?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (statusFilter === 'active') {
          return student.is_profile_complete === true
        } else if (statusFilter === 'inactive') {
          return student.is_profile_complete === false
        }
        return true
      })
    }
    
    return filtered
  }, [students, searchQuery, statusFilter])

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean | string) => {
    const isChecked = checked === true || checked === 'true'
    setSelectAll(isChecked)
    if (isChecked) {
      setSelectedStudents(filteredStudents.map(s => s.id))
    } else {
      setSelectedStudents([])
    }
  }, [filteredStudents])

  // Action handlers
  const handleViewProfile = useCallback((studentId: string) => {
    toast({
      title: "View Profile",
      description: `Opening profile for student ID: ${studentId}`,
    })
  }, [toast])

  const handleEditUser = useCallback((studentId: string) => {
    toast({
      title: "Edit User",
      description: `Opening edit form for student ID: ${studentId}`,
    })
  }, [toast])

  const handleChangeRole = useCallback((studentId: string) => {
    toast({
      title: "Change Role",
      description: `Opening role change for student ID: ${studentId}`,
    })
  }, [toast])

  const handleDeactivateUser = useCallback((studentId: string) => {
    toast({
      title: "Deactivate User",
      description: `Deactivating student ID: ${studentId}`,
    })
  }, [toast])

  const handleDeleteUser = useCallback((studentId: string) => {
    toast({
      title: "Delete User",
      description: `Deleting student ID: ${studentId}`,
      variant: "destructive",
    })
  }, [toast])

  // Test MyJKKN API directly
  const handleTestApi = useCallback(async () => {
    try {
      setIsRefreshing(true)
      console.log('🔄 Testing MyJKKN API directly...')
      
      // Get current configuration
      const config = myJkknApi.getConfigInfo()
      console.log('📋 API Configuration:', config)
      
      // Test API connection first
      console.log('🔗 Testing API connection...')
      const connectionTest = await myJkknApi.testConnection()
      console.log('🔗 Connection test result:', connectionTest)
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Connection test failed')
      }
      
      // Test direct students API call
      console.log('👥 Fetching students from API...')
      const studentsResponse = await myJkknApi.getStudents(1, 10)
      console.log('👥 Raw Students API response:', studentsResponse)
      
      if (studentsResponse.success && studentsResponse.data) {
        console.log('🔍 Detailed Response Analysis:')
        console.log('- studentsResponse.success:', studentsResponse.success)
        console.log('- studentsResponse.data:', studentsResponse.data)
        console.log('- typeof studentsResponse.data:', typeof studentsResponse.data)
        console.log('- studentsResponse.data.data:', studentsResponse.data.data)
        console.log('- studentsResponse.data.metadata:', studentsResponse.data.metadata)
        
        // Check if it's in the expected format
        const hasMetadata = studentsResponse.data.metadata && 
                           typeof studentsResponse.data.metadata === 'object' &&
                           'total' in studentsResponse.data.metadata
        
        const hasDirectTotal = studentsResponse.data && 'total' in studentsResponse.data
        
        console.log('- Has metadata object:', hasMetadata)
        console.log('- Has direct total:', hasDirectTotal)
        
        if (hasMetadata) {
          const { data, metadata } = studentsResponse.data
          console.log('✅ API Test Results (with metadata):')
          console.log(`- Total students: ${metadata.total}`)
          console.log(`- Current page: ${metadata.page}`)
          console.log(`- Total pages: ${metadata.totalPages}`)
          console.log(`- Students in this page: ${data.length}`)
          console.log('- Sample student data:', data[0])
          
          toast({
            title: "✅ API Test Successful",
            description: `Fetched ${data.length} students. Total: ${metadata.total}. Mode: ${config.mockMode ? 'Mock' : 'Live API'}`,
          })
        } else if (hasDirectTotal) {
          const responseData = studentsResponse.data as any
          console.log('⚠️ API Response has direct structure (not transformed):')
          console.log(`- Total: ${responseData.total}`)
          console.log(`- Page: ${responseData.page}`)
          console.log(`- Total Pages: ${responseData.totalPages}`)
          console.log(`- Data length: ${responseData.data?.length || 0}`)
          
          toast({
            title: "⚠️ API Response Format Issue",
            description: `Found ${responseData.data?.length || 0} students, but pagination structure is incorrect. Total: ${responseData.total}`,
            variant: "destructive",
          })
        } else {
          console.log('❌ Unexpected response structure')
          toast({
            title: "❌ Unexpected Response",
            description: "API response doesn't match expected structure",
            variant: "destructive",
          })
        }
      } else {
        throw new Error(studentsResponse.error || 'Failed to fetch students')
      }
      
    } catch (error) {
      console.error('❌ API Test failed:', error)
      toast({
        title: "❌ API Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  // Update select all when filtered students change
  useEffect(() => {
    if (filteredStudents.length > 0) {
      setSelectAll(filteredStudents.every(s => selectedStudents.includes(s.id)))
    }
  }, [filteredStudents, selectedStudents])

  // Get profile status badge
  const getProfileStatusBadge = (isComplete: boolean) => {
    return isComplete ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
        Inactive
      </Badge>
    )
  }

  // Calculate pagination display values
  const getPaginationDisplay = () => {
    if (!pagination) return { startItem: 0, endItem: 0, totalItems: 0 }
    
    const startItem = ((pagination.page - 1) * currentLimit) + 1
    const endItem = Math.min(pagination.page * currentLimit, pagination.total)
    const totalItems = pagination.total
    
    return { startItem, endItem, totalItems }
  }

  const { startItem, endItem, totalItems } = getPaginationDisplay()

  // Debug pagination state
  useEffect(() => {
    console.log('🎯 StudentsDataManager Pagination Debug:')
    console.log('- pagination:', pagination)
    console.log('- students length:', students?.length || 0)
    console.log('- totalItems:', totalItems)
    console.log('- startItem:', startItem)
    console.log('- endItem:', endItem)
    console.log('- loading:', loading)
    console.log('- error:', error)
  }, [pagination, students, totalItems, startItem, endItem, loading, error])

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(currentLimit)].map((_, i) => (
        <div key={i} className="flex space-x-4 items-center">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )

  // Handle errors gracefully
  if (hasError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Component Error</h3>
          <p className="text-muted-foreground text-center mb-4">
            There was an error loading the students component.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            {renderLoadingSkeleton()}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Student Management
          </h2>
          <p className="text-gray-600 mt-1">
            {totalItems} students found
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
        <Card>
          <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              {renderLoadingSkeleton()}
            </div>
          ) : !filteredStudents || filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Students Found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== 'all' ? 
                  'No students match your current filters.' :
                  'No students available.'
                }
              </p>
            </div>
          ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>S.No</TableHead>
                  <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredStudents.map((student, index) => {
                  const isSelected = selectedStudents.includes(student.id)
                  const serialNumber = ((currentPage - 1) * currentLimit) + index + 1
                      return (
                    <TableRow key={student.id} className={isSelected ? 'bg-muted/50' : ''}>
                          <TableCell>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => handleStudentSelect(student.id, checked || false)}
                        />
                          </TableCell>
                      <TableCell>{serialNumber}</TableCell>
                          <TableCell>
                        <div className="font-medium">{student.student_name}</div>
                          </TableCell>
                          <TableCell>
                        <div className="font-mono text-sm">{student.roll_number || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                        <div className="text-sm">{student.program}</div>
                          </TableCell>
                          <TableCell>
                        {getProfileStatusBadge(student.is_profile_complete)}
                          </TableCell>
                          <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewProfile(student.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(student.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeRole(student.id)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeactivateUser(student.id)}>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(student.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                  })}
                </TableBody>
              </Table>
          )}
          </CardContent>
        </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {selectedStudents.length} of {filteredStudents.length} row(s) selected.
            </div>
          <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <Select value={String(currentLimit)} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <span className="text-sm text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">Go to:</span>
              <Input
                type="number"
                min="1"
                max={pagination.totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page)
                  }
                }}
                className="w-16 h-8"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 