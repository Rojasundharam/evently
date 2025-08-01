/**
 * Custom hook for managing student data from MyJKKN API
 * Provides loading states, error handling, and pagination
 */

import { useState, useEffect, useCallback } from 'react'
import { myJkknApi, StudentData, PaginatedResponse, ApiResponse } from '../lib/myjkkn-api'

export interface UseStudentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  institution?: string;
  department?: string;
  program?: string;
  profileComplete?: boolean | null;
  autoFetch?: boolean;
}

export interface UseStudentsReturn {
  students: StudentData[];
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
  filterByProgram: (program: string) => Promise<void>;
  filterByProfileStatus: (isComplete: boolean | null) => Promise<void>;
  clearFilters: () => Promise<void>;
}

export function useStudents(options: UseStudentsOptions = {}): UseStudentsReturn {
  const {
    page = 1,
    limit = 100,
    search: initialSearch = '',
    institution = '',
    department = '',
    program = '',
    profileComplete = null,
    autoFetch = true
  } = options;

  const [students, setStudents] = useState<StudentData[]>([]);
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
    program,
    profileComplete
  });

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchStudents = useCallback(async (filters = currentFilters) => {
    // Skip if not mounted (during SSR)
    if (!isMounted) return;
    
    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<PaginatedResponse<StudentData>>;

      // Choose the appropriate API method based on filters
      if (filters.search) {
        response = await myJkknApi.searchStudents(
          filters.search,
          filters.page,
          filters.limit
        );
      } else if (filters.institution) {
        response = await myJkknApi.getStudentsByInstitution(
          filters.institution,
          filters.page,
          filters.limit
        );
      } else if (filters.department) {
        response = await myJkknApi.getStudentsByDepartment(
          filters.department,
          filters.page,
          filters.limit
        );
      } else if (filters.program) {
        response = await myJkknApi.getStudentsByProgram(
          filters.program,
          filters.page,
          filters.limit
        );
      } else if (filters.profileComplete !== null) {
        response = await myJkknApi.getStudentsByProfileStatus(
          filters.profileComplete,
          filters.page,
          filters.limit
        );
      } else {
        response = await myJkknApi.getStudents(filters.page, filters.limit);
      }

      if (response.success && response.data) {
        console.log('🔍 useStudents API Response Debug:')
        console.log('- Full response:', response)
        console.log('- response.data:', response.data)
        console.log('- response.data type:', typeof response.data)
        console.log('- response.data keys:', Object.keys(response.data))
        console.log('- response.data.data (students array):', response.data.data)
        console.log('- response.data.metadata:', response.data.metadata)
        
        // Log the actual structure to understand what we're getting
        console.log('🔎 Raw API response structure analysis:')
        console.log('- Has data property:', 'data' in response.data)
        console.log('- Has metadata property:', 'metadata' in response.data)
        console.log('- Has total property:', 'total' in response.data)
        console.log('- Has page property:', 'page' in response.data)
        console.log('- Has totalPages property:', 'totalPages' in response.data)
        
        // Check if response.data has the MyJKKN structure directly
        if (response.data && 'total' in response.data && 'data' in response.data) {
          console.log('🚨 FOUND: Response has MyJKKN structure at top level!')
          console.log('- Direct total:', (response.data as any).total)
          console.log('- Direct page:', (response.data as any).page)
          console.log('- Direct totalPages:', (response.data as any).totalPages)
          console.log('- Direct data length:', (response.data as any).data?.length)
        }
        
        // Set students data
        const studentsData = response.data.data || [];
        console.log(`📊 Setting ${studentsData.length} students`)
        setStudents(studentsData);
        
        // Check if metadata exists and has the expected structure
        if (response.data.metadata) {
          console.log('✅ Setting pagination metadata:', response.data.metadata)
          setPagination(response.data.metadata);
        } else {
          console.log('❌ No metadata found in response.data')
          
          // Check if the response has the pagination data at the top level (for fallback)
          const responseAny = response as any
          if (responseAny.data && responseAny.data.total !== undefined) {
            const extractedMetadata = {
              page: responseAny.data.page || 1,
              totalPages: responseAny.data.totalPages || Math.ceil((responseAny.data.total || 0) / filters.limit),
              total: responseAny.data.total || 0
            }
            console.log('🔧 Extracted metadata from top level:', extractedMetadata)
            setPagination(extractedMetadata);
          } else {
            console.log('🚫 Cannot find pagination metadata anywhere')
            // Set fallback pagination based on students array length
            const fallbackMetadata = {
              page: filters.page,
              totalPages: 1,
              total: studentsData.length
            }
            console.log('📋 Using fallback metadata (based on array length):', fallbackMetadata)
            setPagination(fallbackMetadata);
          }
        }
      } else {
        throw new Error(response.error || 'Failed to fetch students');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setStudents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, isMounted]);

  const refetch = useCallback(async () => {
    await fetchStudents();
  }, [fetchStudents]);

  const fetchPage = useCallback(async (newPage: number) => {
    const newFilters = { ...currentFilters, page: newPage };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters, fetchStudents]);

  const search = useCallback(async (query: string) => {
    const newFilters = {
      ...currentFilters,
      search: query,
      page: 1, // Reset to first page on search
      institution: '', // Clear other filters when searching
      department: '',
      program: '',
      profileComplete: null
    };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters, fetchStudents]);

  const filterByInstitution = useCallback(async (institutionName: string) => {
    const newFilters = {
      ...currentFilters,
      institution: institutionName,
      page: 1,
      search: '', // Clear search when filtering
      department: '',
      program: '',
      profileComplete: null
    };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters, fetchStudents]);

  const filterByDepartment = useCallback(async (departmentName: string) => {
    const newFilters = {
      ...currentFilters,
      department: departmentName,
      page: 1,
      search: '',
      institution: '',
      program: '',
      profileComplete: null
    };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters, fetchStudents]);

  const filterByProgram = useCallback(async (programName: string) => {
    const newFilters = {
      ...currentFilters,
      program: programName,
      page: 1,
      search: '',
      institution: '',
      department: '',
      profileComplete: null
    };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters, fetchStudents]);

  const filterByProfileStatus = useCallback(async (isComplete: boolean | null) => {
    const newFilters = {
      ...currentFilters,
      profileComplete: isComplete,
      page: 1,
      search: '',
      institution: '',
      department: '',
      program: ''
    };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters, fetchStudents]);

  const clearFilters = useCallback(async () => {
    const newFilters = {
      page: 1,
      limit: currentFilters.limit,
      search: '',
      institution: '',
      department: '',
      program: '',
      profileComplete: null
    };
    setCurrentFilters(newFilters);
    await fetchStudents(newFilters);
  }, [currentFilters.limit, fetchStudents]);

  // Auto-fetch on mount or when filters change (only on client-side)
  useEffect(() => {
    if (autoFetch && isMounted) {
      fetchStudents();
    }
  }, [autoFetch, isMounted, fetchStudents]);

  // Listen for API configuration changes and refetch data (debounced)
  useEffect(() => {
    if (!isMounted) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleConfigChange = () => {
      console.log('Students hook detected API config change, refetching...');
      
      // Clear any existing timeout to debounce multiple rapid changes
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the fetch call
      timeoutId = setTimeout(() => {
        if (autoFetch) {
          fetchStudents();
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
  }, [autoFetch, fetchStudents, isMounted]);

  return {
    students,
    loading,
    error,
    pagination,
    refetch,
    fetchPage,
    search,
    filterByInstitution,
    filterByDepartment,
    filterByProgram,
    filterByProfileStatus,
    clearFilters
  };
} 