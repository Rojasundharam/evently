/**
 * StaffSelector Component
 * Reusable staff selection component with search and filter capabilities
 * Integrates with MyJKKN Staff API
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useStaff } from '../../hooks/useStaff'
import { StaffData } from '../../lib/myjkkn-api'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { 
  Search, 
  X, 
  Users,
  ChevronDown,
  Check,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Filter,
  RefreshCw
} from 'lucide-react'

interface StaffSelectorProps {
  value?: StaffData | StaffData[] | null
  onChange: (staff: StaffData | StaffData[] | null) => void
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
  showDetails?: boolean
  filterByDepartment?: string
  filterByDesignation?: string
  filterByInstitution?: string
}

export function StaffSelector({
  value,
  onChange,
  placeholder = "Search and select staff...",
  multiple = false,
  disabled = false,
  required = false,
  className = "",
  showDetails = true,
  filterByDepartment,
  filterByDesignation,
  filterByInstitution
}: StaffSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffData[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Filter states
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const {
    staff,
    loading,
    error,
    search,
    filterByDepartment: filterDept,
    filterByDesignation: filterDesig,
    filterByInstitution: filterInst,
    filterByGender: filterGend,
    filterByStatus: filterStat,
    clearFilters
  } = useStaff({ 
    autoFetch: true,
    limit: 20 // Limit results for better performance
  })

  // Initialize selected staff from props
  useEffect(() => {
    if (value) {
      if (Array.isArray(value)) {
        setSelectedStaff(value)
      } else {
        setSelectedStaff([value])
      }
    } else {
      setSelectedStaff([])
    }
  }, [value])

  // Apply filters when props change
  useEffect(() => {
    const applyFilters = async () => {
      if (filterByDepartment && filterDept) {
        await filterDept(filterByDepartment)
      } else if (filterByDesignation && filterDesig) {
        await filterDesig(filterByDesignation)
      } else if (filterByInstitution && filterInst) {
        await filterInst(filterByInstitution)
      }
    }
    applyFilters()
  }, [filterByDepartment, filterByDesignation, filterByInstitution, filterDept, filterDesig, filterInst])

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      await search?.(query)
    } else {
      await clearFilters?.()
    }
  }

  // Filter handlers
  const handleInstitutionFilter = async (institution: string) => {
    setSelectedInstitution(institution)
    try {
      await filterInst?.(institution === 'all' ? '' : institution)
    } catch (err) {
      console.error('Error filtering by institution:', err)
    }
  }

  const handleDepartmentFilter = async (department: string) => {
    setSelectedDepartment(department)
    try {
      await filterDept?.(department === 'all' ? '' : department)
    } catch (err) {
      console.error('Error filtering by department:', err)
    }
  }

  const handleDesignationFilter = async (designation: string) => {
    setSelectedDesignation(designation)
    try {
      await filterDesig?.(designation === 'all' ? '' : designation)
    } catch (err) {
      console.error('Error filtering by designation:', err)
    }
  }

  const handleGenderFilter = async (gender: string) => {
    setSelectedGender(gender)
    try {
      await filterGend?.(gender === 'all' ? '' : gender)
    } catch (err) {
      console.error('Error filtering by gender:', err)
    }
  }

  const handleStatusFilter = async (status: string) => {
    setStatusFilter(status)
    try {
      const isActive = status === 'all' ? null : status === 'active'
      await filterStat?.(isActive)
    } catch (err) {
      console.error('Error filtering by status:', err)
    }
  }

  const handleClearFilters = async () => {
    setSearchQuery('')
    setSelectedInstitution('all')
    setSelectedDepartment('all')
    setSelectedDesignation('all')
    setSelectedGender('all')
    setStatusFilter('all')
    try {
      await clearFilters?.()
    } catch (err) {
      console.error('Error clearing filters:', err)
    }
  }

  // Handle staff selection
  const handleStaffSelect = (staff: StaffData) => {
    if (multiple) {
      const isSelected = selectedStaff.some(s => s.id === staff.id)
      let newSelection: StaffData[]
      
      if (isSelected) {
        newSelection = selectedStaff.filter(s => s.id !== staff.id)
      } else {
        newSelection = [...selectedStaff, staff]
      }
      
      setSelectedStaff(newSelection)
      onChange(newSelection)
    } else {
      setSelectedStaff([staff])
      onChange(staff)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // Remove selected staff
  const removeStaff = (staffId: string) => {
    const newSelection = selectedStaff.filter(s => s.id !== staffId)
    setSelectedStaff(newSelection)
    onChange(multiple ? newSelection : null)
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Filter staff results based on current selection
  const availableStaff = staff.filter(s => 
    !selectedStaff.some(selected => selected.id === s.id)
  )

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Staff Display */}
      {selectedStaff.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
            >
              <User className="h-3 w-3" />
              <span>{staffMember.first_name} {staffMember.last_name}</span>
              {showDetails && (
                <span className="text-xs text-muted-foreground">
                  ({staffMember.designation})
                </span>
              )}
              <button
                type="button"
                onClick={() => removeStaff(staffMember.id)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required && selectedStaff.length === 0}
          className="pr-20"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowFilters(!showFilters)}
            disabled={disabled}
          >
            <Filter className="h-3 w-3" />
          </Button>
          {loading && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Filter Options</h4>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={disabled || loading}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Select 
              value={selectedInstitution} 
              onValueChange={handleInstitutionFilter}
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-8 text-xs">
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
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-8 text-xs">
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
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-8 text-xs">
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
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-8 text-xs">
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
              disabled={disabled || loading}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 border-b">
              Error loading staff: {error}
            </div>
          )}
          
          {loading && staff.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">
              Loading staff...
            </div>
          )}
          
          {!loading && availableStaff.length === 0 && searchQuery && (
            <div className="p-3 text-sm text-muted-foreground">
              No staff found for "{searchQuery}"
            </div>
          )}
          
          {!loading && availableStaff.length === 0 && !searchQuery && (
            <div className="p-3 text-sm text-muted-foreground">
              No staff available
            </div>
          )}

          {availableStaff.map((staffMember) => {
            const isSelected = selectedStaff.some(s => s.id === staffMember.id)
            
            return (
              <div
                key={staffMember.id}
                onClick={() => handleStaffSelect(staffMember)}
                className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {staffMember.first_name} {staffMember.last_name}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                    </div>
                    
                    {showDetails && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          <span className="truncate">{staffMember.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{staffMember.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{staffMember.email}</span>
                        </div>
                        {staffMember.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{staffMember.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {staffMember.status && (
                    <Badge 
                      variant={staffMember.status.toLowerCase() === 'active' ? 'default' : 'secondary'}
                      className="text-xs ml-2"
                    >
                      {staffMember.status}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StaffSelector 