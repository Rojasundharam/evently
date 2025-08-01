/**
 * Custom hook for managing staff data from MyJKKN API
 * Provides loading states, error handling, and pagination
 */

import { useState, useEffect, useCallback } from 'react'
import { myJkknApi, StaffData, PaginatedResponse, ApiResponse } from '../lib/myjkkn-api'

export interface UseStaffOptions {
  page?: number;
  limit?: number;
  search?: string;
  institution?: string;
  department?: string;
  designation?: string;
  gender?: string;
  isActive?: boolean | null;
  autoFetch?: boolean;
}

export interface UseStaffReturn {
  staff: StaffData[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  } | null;
  refetch: () => Promise<void>;
  fetchPage: (page: number) => Promise<void>;
  search: (query: string) => Promise<void>;
  filterByInstitution: (institution: string) => Promise<void>;
  filterByDepartment: (department: string) => Promise<void>;
  filterByDesignation: (designation: string) => Promise<void>;
  filterByGender: (gender: string) => Promise<void>;
  filterByStatus: (isActive: boolean | null) => Promise<void>;
  clearFilters: () => Promise<void>;
}

export function useStaff(options: UseStaffOptions = {}): UseStaffReturn {
  const {
    page = 1,
    limit = 100,
    search: initialSearch = '',
    institution = '',
    department = '',
    designation = '',
    gender = '',
    isActive = null,
    autoFetch = true
  } = options;

  const [staff, setStaff] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    total: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [currentFilters, setCurrentFilters] = useState({
    page,
    limit,
    search: initialSearch,
    institution,
    department,
    designation,
    gender,
    isActive
  });

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchStaff = useCallback(async (filters = currentFilters) => {
    // Skip if not mounted (during SSR)
    if (!isMounted) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching staff with filters:', filters);
      let response: ApiResponse<PaginatedResponse<StaffData>>;

      // Apply filters in priority order - search takes precedence
      if (filters.search) {
        response = await myJkknApi.searchStaff(
          filters.search,
          filters.page,
          filters.limit
        );
      } else {
        // For non-search filters, get all staff and filter client-side
        response = await myJkknApi.getStaff(filters.page, Math.max(filters.limit, 100));
        
        // Apply client-side filtering if we have filter criteria
        if (response.success && response.data?.data && 
            (filters.institution || filters.department || filters.designation || 
             filters.gender || filters.isActive !== null)) {
          
          let filteredStaff = response.data.data;
          
          // Apply institution filter
          if (filters.institution) {
            filteredStaff = filteredStaff.filter(staff => 
              staff.institution?.toLowerCase().includes(filters.institution.toLowerCase())
            );
          }
          
          // Apply department filter
          if (filters.department) {
            filteredStaff = filteredStaff.filter(staff => 
              staff.department?.toLowerCase().includes(filters.department.toLowerCase())
        );
          }
          
          // Apply designation filter
          if (filters.designation) {
            filteredStaff = filteredStaff.filter(staff => 
              staff.designation?.toLowerCase().includes(filters.designation.toLowerCase())
        );
          }
          
          // Apply gender filter
          if (filters.gender) {
            filteredStaff = filteredStaff.filter(staff => 
              staff.gender?.toLowerCase() === filters.gender.toLowerCase()
        );
          }
          
          // Apply status filter
          if (filters.isActive !== null) {
            filteredStaff = filteredStaff.filter(staff => {
              const isActive = staff.status?.toLowerCase() === 'active';
              return isActive === filters.isActive;
            });
          }
          
          // Update response with filtered data
          response.data.data = filteredStaff;
          response.data.metadata = {
            ...response.data.metadata,
            total: filteredStaff.length,
            totalPages: Math.ceil(filteredStaff.length / filters.limit)
          };
        }
      }

      console.log('🔍 useStaff API Response Debug:');
      console.log('- Full response:', response);
      console.log('- response.data:', response.data);
      console.log('- response.data type:', typeof response.data);
      console.log('- response.data keys:', response.data ? Object.keys(response.data) : 'No data');
      console.log('- response.data.data (staff array):', response.data?.data);
      console.log('- response.data.metadata:', response.data?.metadata);
      
      console.log('🔎 Raw API response structure analysis:');
      console.log('- Has data property:', response.data && 'data' in response.data);
      console.log('- Has metadata property:', response.data && 'metadata' in response.data);
      console.log('- Has total property:', response.data && 'total' in response.data);
      console.log('- Has page property:', response.data && 'page' in response.data);
      console.log('- Has totalPages property:', response.data && 'totalPages' in response.data);

      if (response.success && response.data) {
        console.log('📊 Setting', response.data.data?.length, 'staff members');
        setStaff(response.data.data);
        
        console.log('✅ Setting pagination metadata:', response.data.metadata);
        setPagination(response.data.metadata);
      } else {
        throw new Error(response.error || 'Failed to fetch staff');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setStaff([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, isMounted]);

  const refetch = useCallback(async () => {
    await fetchStaff();
  }, [fetchStaff]);

  const fetchPage = useCallback(async (newPage: number) => {
    const newFilters = { ...currentFilters, page: newPage };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const search = useCallback(async (query: string) => {
    const newFilters = {
      ...currentFilters,
      search: query,
      page: 1 // Reset to first page on search
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const filterByInstitution = useCallback(async (institutionName: string) => {
    const newFilters = {
      ...currentFilters,
      institution: institutionName,
      page: 1,
      search: '' // Only clear search when filtering
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const filterByDepartment = useCallback(async (departmentName: string) => {
    const newFilters = {
      ...currentFilters,
      department: departmentName,
      page: 1,
      search: '' // Only clear search when filtering
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const filterByDesignation = useCallback(async (designationName: string) => {
    const newFilters = {
      ...currentFilters,
      designation: designationName,
      page: 1,
      search: '' // Only clear search when filtering
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const filterByGender = useCallback(async (genderType: string) => {
    const newFilters = {
      ...currentFilters,
      gender: genderType,
      page: 1,
      search: '' // Only clear search when filtering
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const filterByStatus = useCallback(async (activeStatus: boolean | null) => {
    const newFilters = {
      ...currentFilters,
      isActive: activeStatus,
      page: 1,
      search: '' // Only clear search when filtering
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters, fetchStaff]);

  const clearFilters = useCallback(async () => {
    const newFilters = {
      page: 1,
      limit: currentFilters.limit,
      search: '',
      institution: '',
      department: '',
      designation: '',
      gender: '',
      isActive: null
    };
    setCurrentFilters(newFilters);
    await fetchStaff(newFilters);
  }, [currentFilters.limit, fetchStaff]);

  // Auto-fetch on mount or when filters change (only on client-side)
  useEffect(() => {
    if (autoFetch && isMounted) {
      fetchStaff();
    }
  }, [autoFetch, isMounted, fetchStaff]);

  // Listen for API configuration changes and refetch data (debounced)
  useEffect(() => {
    if (!isMounted) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleConfigChange = () => {
      console.log('Staff hook detected API config change, refetching...');
      
      // Clear any existing timeout to debounce multiple rapid changes
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the fetch call
      timeoutId = setTimeout(() => {
        if (autoFetch) {
          fetchStaff();
        }
      }, 500); // Wait 500ms before refetching
    };

    window.addEventListener('myjkkn-config-changed', handleConfigChange);
    return () => {
      window.removeEventListener('myjkkn-config-changed', handleConfigChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [autoFetch, fetchStaff, isMounted]);

  return {
    staff,
    loading,
    error,
    pagination,
    refetch,
    fetchPage,
    search,
    filterByInstitution,
    filterByDepartment,
    filterByDesignation,
    filterByGender,
    filterByStatus,
    clearFilters
  };
} 