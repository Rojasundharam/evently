/**
 * StaffDataManager Component
 * Comprehensive interface for viewing and managing staff data from MyJKKN API
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useStaff } from '../../hooks/useStaff'
import { type StaffData, myJkknApi } from '../../lib/myjkkn-api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { useToast } from '../ui/use-toast'
import { 
  Search, 
  RefreshCw, 
  Filter,
  X, 
  ChevronLeft, 
  ChevronRight,
  Users,
  UserCheck,
  Building,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User
} from 'lucide-react'

interface StaffDataManagerProps {
  className?: string;
}

export function StaffDataManager({ className }: StaffDataManagerProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    staff,
    loading,
    error,
    pagination,
    refetch,
    fetchPage,
    search: searchStaff,
    filterByInstitution,
    filterByDepartment,
    filterByDesignation,
    filterByGender,
    filterByStatus,
    clearFilters
  } = useStaff({ autoFetch: true })

  // Show toast for errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Staff",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleSearch = async (query: string) => {
    if (!searchStaff) return;
    setSearchQuery(query);
    try {
      await searchStaff(query);
    } catch (err) {
      console.error('Error searching staff:', err);
    }
  };

  const handleInstitutionFilter = async (institution: string) => {
    if (!filterByInstitution) return;
    setSelectedInstitution(institution);
    try {
      await filterByInstitution(institution === 'all' ? '' : institution);
    } catch (err) {
      console.error('Error filtering by institution:', err);
    }
  };

  const handleDepartmentFilter = async (department: string) => {
    if (!filterByDepartment) return;
    setSelectedDepartment(department);
    try {
      await filterByDepartment(department === 'all' ? '' : department);
    } catch (err) {
      console.error('Error filtering by department:', err);
    }
  };

  const handleDesignationFilter = async (designation: string) => {
    if (!filterByDesignation) return;
    setSelectedDesignation(designation);
    try {
      await filterByDesignation(designation === 'all' ? '' : designation);
    } catch (err) {
      console.error('Error filtering by designation:', err);
    }
  };

  const handleGenderFilter = async (gender: string) => {
    if (!filterByGender) return;
    setSelectedGender(gender);
    try {
      await filterByGender(gender === 'all' ? '' : gender);
    } catch (err) {
      console.error('Error filtering by gender:', err);
    }
  };

  const handleStatusFilter = async (status: string) => {
    if (!filterByStatus) return;
    setStatusFilter(status);
    try {
      const isActive = status === 'all' ? null : status === 'active';
      await filterByStatus(isActive);
    } catch (err) {
      console.error('Error filtering by status:', err);
    }
  };

  const handleClearFilters = async () => {
    if (!clearFilters) return;
    setSearchQuery('');
    setSelectedInstitution('all');
    setSelectedDepartment('all');
    setSelectedDesignation('all');
    setSelectedGender('all');
    setStatusFilter('all');
    try {
      await clearFilters();
    } catch (err) {
      console.error('Error clearing filters:', err);
    }
  };

  const handleRefresh = async () => {
    if (!refetch) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing staff data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!fetchPage || page < 1) return;
    try {
      await fetchPage(page);
    } catch (err) {
      console.error('Error changing page:', err);
    }
  };

  const getStatusBadge = (status?: string) => {
    const isActive = status?.toLowerCase() === 'active'
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const getGenderBadge = (gender: string) => {
    const color = gender.toLowerCase() === 'male' ? 'blue' : 
                  gender.toLowerCase() === 'female' ? 'pink' : 'gray'
    return (
      <Badge variant="outline" className={`border-${color}-300 text-${color}-700`}>
        {gender}
      </Badge>
    )
  }

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4 items-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderErrorState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to Load Staff</h3>
        <p className="text-muted-foreground text-center mb-4">
          {error || 'An unexpected error occurred while fetching staff data.'}
        </p>
        <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )

  const renderEmptyState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Staff Found</h3>
        <p className="text-muted-foreground text-center mb-4">
          {searchQuery || hasActiveFilters ? 
            'No staff members match your current filters. Try adjusting your search criteria.' :
            'No staff data available. Please check your API configuration.'}
        </p>
        {(searchQuery || hasActiveFilters) && (
          <Button onClick={handleClearFilters} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )

  // Get unique values for filter dropdowns
  const uniqueInstitutions = React.useMemo(() => {
    const institutions = new Set(staff.map(s => s.institution).filter(Boolean))
    return Array.from(institutions).sort()
  }, [staff])

  const uniqueDepartments = React.useMemo(() => {
    const departments = new Set(staff.map(s => s.department).filter(Boolean))
    return Array.from(departments).sort()
  }, [staff])

  const uniqueDesignations = React.useMemo(() => {
    const designations = new Set(staff.map(s => s.designation).filter(Boolean))
    return Array.from(designations).sort()
  }, [staff])

  const hasActiveFilters = searchQuery || selectedInstitution !== 'all' || 
                          selectedDepartment !== 'all' || selectedDesignation !== 'all' || 
                          selectedGender !== 'all' || statusFilter !== 'all'

  // Debug pagination data
  console.log('🎯 StaffDataManager Pagination Debug:');
  console.log('- pagination:', pagination);
  console.log('- staff length:', staff.length);
  console.log('- totalItems:', pagination?.total);
  console.log('- startItem:', pagination ? ((pagination.page - 1) * 100) + 1 : 0);
  console.log('- endItem:', pagination ? Math.min(pagination.page * 100, pagination.total) : 0);
  console.log('- loading:', loading);
  console.log('- error:', error);
  console.log('- active staff count (old logic):', staff?.filter(s => s?.status?.toLowerCase() === 'active')?.length || 0);
  console.log('- active staff count (new logic):', staff?.filter(s => {
    const status = s?.status;
    if (!status || status === 'N/A') return false;
    return status.toLowerCase() === 'active';
  })?.length || 0);
  console.log('- first staff member (for debugging):', staff[0] ? {
    id: staff[0].id,
    name: `${staff[0].first_name} ${staff[0].last_name}`,
    status: staff[0].status,
    statusType: typeof staff[0].status,
    statusValue: JSON.stringify(staff[0].status),
    allKeys: Object.keys(staff[0]),
    allStatusValues: staff.slice(0, 3).map(s => ({ id: s.id, status: s.status, statusType: typeof s.status }))
  } : 'No staff data');

  // Don't render anything until mounted to prevent hydration errors
  if (!isMounted) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  try {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Staff Management
            </h2>
            <p className="text-gray-600 mt-1">
              {pagination?.total || 0} staff members found
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRefresh} 
              disabled={loading || isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
            <CardDescription>
              Search staff or apply filters to narrow down results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, designation, department..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select 
                value={selectedInstitution} 
                onValueChange={handleInstitutionFilter}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {uniqueInstitutions.map((institution) => (
                    <SelectItem key={institution} value={institution}>
                      {institution}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedDepartment} 
                onValueChange={handleDepartmentFilter}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedDesignation} 
                onValueChange={handleDesignationFilter}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {uniqueDesignations.map((designation) => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedGender} 
                onValueChange={handleGenderFilter}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={statusFilter} 
                onValueChange={handleStatusFilter}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleClearFilters} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        {pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
                          <span>
              Showing {((pagination.page - 1) * 100) + 1} to {Math.min(pagination.page * 100, pagination.total)} of {pagination.total} staff members
            </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {pagination && staff.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Staff</div>
                  <div className="text-2xl font-bold">{pagination?.total || 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Staff</div>
                  <div className="text-2xl font-bold">
                    {staff?.filter(s => {
                      const status = s?.status;
                      if (!status || status === 'N/A') return false;
                      return status.toLowerCase() === 'active';
                    })?.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Institutions</div>
                  <div className="text-2xl font-bold">{uniqueInstitutions?.length || 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Designations</div>
                  <div className="text-2xl font-bold">{uniqueDesignations?.length || 0}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {error ? (
          renderErrorState()
        ) : loading ? (
          <Card>
            <CardContent className="p-6">
              {renderLoadingSkeleton()}
            </CardContent>
          </Card>
        ) : !staff || staff.length === 0 ? (
          renderEmptyState()
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Info</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(staff || []).map((member) => {
                      try {
                        // Ensure member exists
                        if (!member) {
                          return (
                            <TableRow key={Math.random()}>
                              <TableCell colSpan={9} className="text-center text-muted-foreground py-4">
                                Invalid staff data
                              </TableCell>
                            </TableRow>
                          )
                        }

                        // Ensure all data is safely converted to strings with nested object handling
                        const safeMember = {
                          id: String(member?.id || 'N/A'),
                          first_name: String(
                            typeof member?.first_name === 'object' 
                              ? (member.first_name as any)?.name || (member.first_name as any)?.value || 'N/A'
                              : member?.first_name || 'N/A'
                          ),
                          last_name: String(
                            typeof member?.last_name === 'object' 
                              ? (member.last_name as any)?.name || (member.last_name as any)?.value || 'N/A'
                              : member?.last_name || 'N/A'
                          ),
                          email: String(
                            typeof member?.email === 'object' 
                              ? (member.email as any)?.email || (member.email as any)?.value || 'N/A'
                              : member?.email || 'N/A'
                          ),
                          phone: String(
                            typeof member?.phone === 'object' 
                              ? (member.phone as any)?.phone || (member.phone as any)?.value || 'N/A'
                              : member?.phone || 'N/A'
                          ),
                          designation: String(
                            typeof member?.designation === 'object' 
                              ? (member.designation as any)?.designation_name || (member.designation as any)?.name || 'N/A'
                              : member?.designation || 'N/A'
                          ),
                          department: String(
                            typeof member?.department === 'object' 
                              ? (member.department as any)?.department_name || (member.department as any)?.name || 'N/A'
                              : member?.department || 'N/A'
                          ),
                          institution: String(
                            typeof member?.institution === 'object' 
                              ? (member.institution as any)?.institution_name || (member.institution as any)?.name || 'N/A'
                              : member?.institution || 'N/A'
                          ),
                          gender: String(
                            typeof member?.gender === 'object' 
                              ? (member.gender as any)?.gender || (member.gender as any)?.value || 'N/A'
                              : member?.gender || 'N/A'
                          ),
                          employee_id: String(
                            typeof member?.employee_id === 'object' 
                              ? (member.employee_id as any)?.employee_id || (member.employee_id as any)?.value || 'N/A'
                              : member?.employee_id || 'N/A'
                          )
                        }
                        
                        const getStaffStatusBadge = (status?: string) => {
                          if (!status || status === 'N/A') {
                            return (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                Unknown
                              </Badge>
                            );
                          }
                          
                          const isActive = status.toLowerCase() === 'active';
                          return isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              {status}
                            </Badge>
                          );
                        };

                        return (
                        <TableRow key={safeMember.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{`${safeMember.first_name} ${safeMember.last_name}`}</div>
                                <div className="text-sm text-muted-foreground">ID: {safeMember.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {safeMember.email}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {safeMember.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{safeMember.designation}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{safeMember.department}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{safeMember.institution}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getGenderBadge(safeMember.gender)}
                          </TableCell>
                          <TableCell>
                            {getStaffStatusBadge(member?.status)}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{safeMember.employee_id}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Contact">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      } catch (renderError) {
                        console.error('Error rendering staff row:', renderError, member);
                        return (
                          <TableRow key={member?.id || Math.random()}>
                            <TableCell colSpan={9} className="text-center text-red-500 py-4">
                              Error rendering staff data
                            </TableCell>
                          </TableRow>
                        )
                      }
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((pagination?.page || 1) - 1)}
                disabled={(pagination?.page || 1) <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((pagination?.page || 1) + 1)}
                disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1) || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Go to page:</span>
              <Select 
                value={String(pagination?.page || 1)} 
                onValueChange={(value) => handlePageChange(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: pagination?.totalPages || 1 }, (_, i) => i + 1).map((pageNum) => (
                    <SelectItem key={String(pageNum)} value={String(pageNum)}>
                      {pageNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    )
  } catch (renderError) {
    console.error('Error rendering staff data:', renderError);
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 items-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
} 