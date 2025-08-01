/**
 * MyJKKN API Service
 * Handles API calls to the MyJKKN Admin system at myadmin.jkkn.ac.in
 */

// Mock data imports removed - using real API only

import axios from 'axios'

// Types for MyJKKN API
export interface ProgramData {
  id: string;
  program_id: string;
  program_name: string;
  institution_id: string;
  department_id: string;
  degree_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionData {
  id: string;
  name: string;
  counselling_code: string;
  category: string;
  institution_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentData {
  id: string;
  department_name: string;
  department_code: string;
  institution_id: string;
  degree_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentData {
  id: string;
  student_name: string;
  roll_number: string;
  institution: string;
  department: string;
  program: string;
  is_profile_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StaffData {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone: string;
  institution_email: string;
  designation: string;
  department: string;
  institution: string;
  employee_id?: string;
  date_of_joining?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// MyJKKN API Configuration Interface
interface MyJKKNApiConfig {
  baseUrl: string;
  apiKey: string;
  mockMode: boolean;
  proxyMode: boolean;
}

class MyJKKNApiService {
  private config: MyJKKNApiConfig;

  constructor() {
    // Prioritize environment variables over localStorage
    const envApiKey = process.env.NEXT_PUBLIC_MYJKKN_API_KEY;
    const envMockModeString = process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE;
    const envProxyModeString = process.env.NEXT_PUBLIC_MYJKKN_PROXY_MODE;
    const envBaseUrl = process.env.NEXT_PUBLIC_MYJKKN_BASE_URL;

    // Parse environment variables with proper defaults
    const envMockMode = envMockModeString === 'true' || envMockModeString === '1';
    const envProxyMode = envProxyModeString === 'true' || envProxyModeString === '1';

    // Set initial configuration
    this.config = {
      baseUrl: envBaseUrl || 'https://myadmin.jkkn.ac.in/api',
      apiKey: envApiKey || '',
      mockMode: envMockModeString !== undefined ? envMockMode : false, // Default to real API mode
      proxyMode: envProxyModeString !== undefined ? envProxyMode : false,
    };
    
    // Only load from localStorage if no environment variables are set
    if (!envApiKey && envMockModeString === undefined) {
      this.loadConfiguration();
    }
  }

  // Load configuration from localStorage (fallback)
  private loadConfiguration() {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
      const savedConfig = localStorage.getItem('myjkkn_api_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Only use localStorage values if env variables are not set
        if (!process.env.NEXT_PUBLIC_MYJKKN_API_KEY && parsedConfig.apiKey) {
          this.config.apiKey = parsedConfig.apiKey;
        }
        
        if (process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE === undefined) {
          this.config.mockMode = parsedConfig.mockMode !== undefined ? parsedConfig.mockMode : true;
        }
        
        if (process.env.NEXT_PUBLIC_MYJKKN_PROXY_MODE === undefined) {
          this.config.proxyMode = parsedConfig.proxyMode || false;
        }
        
        console.debug('MyJKKN API configuration loaded from localStorage:', {
          hasApiKey: !!this.config.apiKey,
          mockMode: this.config.mockMode,
          proxyMode: this.config.proxyMode
        });
      }
    } catch (error) {
      console.warn('Failed to load MyJKKN API configuration from localStorage:', error);
    }
  }

  // Reload configuration from localStorage (can be called externally)
  reloadConfiguration() {
    this.loadConfiguration();
  }

  // Force refresh configuration from environment variables (useful for lazy loading)
  refreshFromEnvironment() {
    const envApiKey = process.env.NEXT_PUBLIC_MYJKKN_API_KEY;
    const envMockModeString = process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE;
    const envProxyModeString = process.env.NEXT_PUBLIC_MYJKKN_PROXY_MODE;
    const envBaseUrl = process.env.NEXT_PUBLIC_MYJKKN_BASE_URL;

    // Parse environment variables with proper defaults
    const envMockMode = envMockModeString === 'true' || envMockModeString === '1';
    const envProxyMode = envProxyModeString === 'true' || envProxyModeString === '1';

    // Update configuration
    this.config = {
      baseUrl: envBaseUrl || 'https://myadmin.jkkn.ac.in/api',
      apiKey: envApiKey || this.config.apiKey,
      mockMode: envMockModeString !== undefined ? envMockMode : this.config.mockMode,
      proxyMode: envProxyModeString !== undefined ? envProxyMode : this.config.proxyMode,
    };
  }

  // Set API credentials
  setCredentials(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  // Set mock mode
  setMockMode(enabled: boolean) {
    this.config.mockMode = enabled;
  }

  // Get mock mode status
  isMockMode(): boolean {
    return this.config.mockMode;
  }

  // Set proxy mode (use Next.js API route)
  setProxyMode(enabled: boolean) {
    this.config.proxyMode = enabled;
  }

  // Get proxy mode status
  isProxyMode(): boolean {
    return this.config.proxyMode;
  }

  // Validate API key format (supports both student and staff API keys)
  private isValidApiKey(apiKey: string): boolean {
    return /^(jk_[a-zA-Z0-9]+_[a-zA-Z0-9]+|jkkn_[a-zA-Z0-9]+_[a-zA-Z0-9]+)$/.test(apiKey);
  }

  // Mock mode disabled - redirects to real API configuration
  private async handleMockRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: Record<string, string | number>;
      body?: any;
    }
  ): Promise<ApiResponse<T>> {
    console.warn('🚫 Mock mode is disabled. Please configure a real MyJKKN API key.');
          return {
            success: false,
      error: 'Mock mode is disabled. Please configure a real MyJKKN API key to fetch live data. Visit the API Configuration page to set up your credentials.'
    };
  }

  // Handle actual API requests to MyJKKN
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: Record<string, string | number>;
      body?: any;
    } = {}
  ): Promise<ApiResponse<T>> {
    // Use mock data if in mock mode
    if (this.config.mockMode) {
      return this.handleMockRequest<T>(endpoint, options);
    }

    // Validate API configuration
    if (!this.config.apiKey || !this.isValidApiKey(this.config.apiKey)) {
      return {
        success: false,
        error: 'Invalid or missing API key. Please check your configuration.'
      };
    }

    if (!this.config.baseUrl) {
      return {
        success: false,
        error: 'Base URL not configured'
      };
    }

    // Build URL
    const { method = 'GET', params, body } = options;
    const baseUrl = this.config.proxyMode ? '/api/myjkkn' : this.config.baseUrl;
    let url = `${baseUrl}${endpoint}`;

    console.log('URL Building Debug:', {
      proxyMode: this.config.proxyMode,
      baseUrl: baseUrl,
      endpoint: endpoint,
      finalUrl: url,
      configProxyMode: this.config.proxyMode,
      envProxyMode: process.env.NEXT_PUBLIC_MYJKKN_PROXY_MODE,
      allConfig: this.config
    });

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      url += `?${searchParams.toString()}`;
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    // Add CORS headers for direct API calls
    if (!this.config.proxyMode) {
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }

    try {
      console.debug(`MyJKKN API ${method}:`, url);

      const requestConfig: RequestInit = {
        method,
        headers,
        mode: this.config.proxyMode ? 'cors' : 'cors',
        credentials: this.config.proxyMode ? 'omit' : 'omit',
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        requestConfig.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please check your API permissions.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check your configuration.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      // Parse response
      const responseText = await response.text();
      console.debug('Response body:', responseText.substring(0, 500) + '...');

      let data: T;
      try {
        data = JSON.parse(responseText);
        
        // Debug: Log the parsed data structure for students/staff endpoints
        if (endpoint.includes('/students') || endpoint.includes('/staff')) {
          console.debug('📊 MyJKKN API Response Analysis:')
          console.debug('- Endpoint:', endpoint)
          console.debug('- Raw data structure:', JSON.stringify(data, null, 2).substring(0, 1000))
          
          // Check if this is a paginated response from MyJKKN API
          if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
            console.debug('🔧 Transforming MyJKKN API response structure...')
            
            // Transform MyJKKN response structure to our expected format
            const originalData = data as any;
            const transformedResponse = {
              data: originalData.data || [],
              metadata: {
                page: originalData.page || 1,
                totalPages: originalData.totalPages || 1,
                total: originalData.total || 0
              }
            };
            
            console.debug('✅ Transformed response:', transformedResponse)
            
            // Transform ONLY the student/staff data array, NOT the metadata
            const finalResponse = {
              data: this.transformApiResponse(transformedResponse.data),
              metadata: transformedResponse.metadata // Keep metadata as-is without transformation
            };
            
            console.debug('🎯 Final response with transformed data but preserved metadata:', finalResponse)
            console.debug('🔍 Metadata preservation check:', {
              originalMetadata: transformedResponse.metadata,
              preservedMetadata: finalResponse.metadata,
              hasTotal: finalResponse.metadata && 'total' in finalResponse.metadata,
              totalValue: finalResponse.metadata && finalResponse.metadata.total
            })
            
            // Skip the general transformApiResponse call below since we handled it here
            return {
              success: true,
              data: finalResponse as T
            };
          } else {
            console.debug('⚠️ API response does not match expected MyJKKN structure')
            console.debug('- Has data property:', 'data' in (data as any))
            console.debug('- Has total property:', 'total' in (data as any))
            console.debug('- Data type:', typeof data)
            console.debug('- Full response keys:', Object.keys(data as any))
          }
          
          // Special debugging for staff data
          if (endpoint.includes('/staff') && data && typeof data === 'object' && 'data' in data) {
            const staffArray = (data as any).data;
            if (Array.isArray(staffArray) && staffArray.length > 0) {
              console.debug('🔍 Staff API Response Analysis:');
              console.debug('- Staff array length:', staffArray.length);
              console.debug('- First staff item before transformation:', JSON.stringify(staffArray[0], null, 2));
              console.debug('- First staff status field:', staffArray[0]?.status);
              console.debug('- First staff status type:', typeof staffArray[0]?.status);
            }
          }
        }
        
        // Transform the data to ensure all values are strings/primitives
        data = this.transformApiResponse(data) as T;
        
      } catch (parseError) {
        return {
          success: false,
          error: 'Invalid JSON response from server'
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('MyJKKN API request failed:', error);
      
      let errorMessage = 'Network error occurred';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = this.config.proxyMode 
          ? 'Unable to connect to API proxy. Please check your network connection.'
          : 'CORS error or network failure. Try enabling proxy mode or check your network connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Transform API response to ensure all nested objects are converted to strings
  private transformApiResponse(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.transformApiResponse(item));
    }

    if (typeof data === 'object') {
      // Special handling: Don't transform metadata objects
      if (data && typeof data === 'object' && 'page' in data && 'total' in data && 'totalPages' in data) {
        console.debug('🛡️ Skipping transformation of metadata object:', data);
        return data; // Return metadata as-is
      }

      const transformed: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
          transformed[key] = value;
        } else if (key === 'metadata' && typeof value === 'object' && !Array.isArray(value)) {
          // Special handling: preserve metadata object as-is
          console.debug('🛡️ Preserving metadata object for key:', key, value);
          transformed[key] = value;
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          // Preserve simple primitive values as-is
          transformed[key] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Handle different types of nested objects
          if (value && typeof value === 'object') {
            // Special handling for important fields that should preserve their values
            if (key === 'status' && value && typeof value === 'object') {
              // For status field, try to extract the actual status value
              console.debug('🔍 Processing status field:', value);
              if ('status' in value) {
                transformed[key] = String((value as any).status || 'Unknown');
              } else if ('is_active' in value) {
                transformed[key] = (value as any).is_active ? 'Active' : 'Inactive';
              } else if ('active' in value) {
                transformed[key] = (value as any).active ? 'Active' : 'Inactive';
              } else if ('state' in value) {
                transformed[key] = String((value as any).state || 'Unknown');
              } else if ('value' in value) {
                transformed[key] = String((value as any).value || 'Unknown');
              } else {
                // If it's an object but doesn't match known patterns, convert to string representation
                transformed[key] = JSON.stringify(value);
                console.debug('⚠️ Unknown status object structure, converted to string:', transformed[key]);
              }
            } else if (key === 'employee_id' && value && typeof value === 'object') {
              // For employee_id, extract the actual ID value
              transformed[key] = String((value as any).employee_id || (value as any).id || 'N/A');
            } else if (key === 'date_of_joining' && value && typeof value === 'object') {
              // For date fields, extract the actual date value
              transformed[key] = String((value as any).date_of_joining || (value as any).date || 'N/A');
            } else if ('id' in value && 'name' in value) {
              // Standard {id, name} objects
              transformed[key] = String((value as any).name || (value as any).id || 'N/A');
            } else if ('id' in value && 'department_name' in value) {
              // Department objects: {id, department_name}
              transformed[key] = String((value as any).department_name || (value as any).id || 'N/A');
            } else if ('id' in value && 'institution_name' in value) {
              // Institution objects: {id, institution_name}
              transformed[key] = String((value as any).institution_name || (value as any).id || 'N/A');
            } else if ('id' in value && 'program_name' in value) {
              // Program objects: {id, program_name}
              transformed[key] = String((value as any).program_name || (value as any).id || 'N/A');
            } else if ('id' in value && 'designation_name' in value) {
              // Designation objects: {id, designation_name}
              transformed[key] = String((value as any).designation_name || (value as any).id || 'N/A');
            } else if ('first_name' in value && 'last_name' in value) {
              // Person objects: {first_name, last_name}
              const firstName = String((value as any).first_name || '');
              const lastName = String((value as any).last_name || '');
              transformed[key] = `${firstName} ${lastName}`.trim() || 'N/A';
            } else if ('name' in value) {
              // Generic name field
              transformed[key] = String((value as any).name || 'N/A');
            } else if ('title' in value) {
              // Title field
              transformed[key] = String((value as any).title || 'N/A');
            } else {
              // For complex objects, try to find any meaningful string field
              const stringFields = ['name', 'title', 'label', 'description', 'code', 'value'];
              let found = false;
              
              for (const field of stringFields) {
                if (field in value && (value as any)[field]) {
                  transformed[key] = String((value as any)[field]);
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                // If no meaningful string field found, recursively transform
                const recursiveResult = this.transformApiResponse(value);
                // If recursive transformation still returns an object, convert to string
                if (typeof recursiveResult === 'object') {
                  transformed[key] = 'N/A';
                } else {
                  transformed[key] = recursiveResult;
                }
              }
            }
          } else {
            transformed[key] = 'N/A';
          }
        } else if (Array.isArray(value)) {
          transformed[key] = this.transformApiResponse(value);
        } else {
          transformed[key] = value;
        }
      }

      // Post-processing: Add derived fields for staff data
      if (transformed && typeof transformed === 'object') {
        // Create status field from is_active boolean
        if ('is_active' in transformed && !('status' in transformed)) {
          transformed.status = transformed.is_active ? 'Active' : 'Inactive';
          console.debug('🔄 Created status field from is_active:', transformed.status);
        }
        
        // Map staff_id to employee_id if available
        if ('staff_id' in transformed && !('employee_id' in transformed)) {
          transformed.employee_id = transformed.staff_id;
          console.debug('🔄 Mapped staff_id to employee_id:', transformed.employee_id);
        }
        
        // Create full name from first_name and last_name if both exist
        if ('first_name' in transformed && 'last_name' in transformed && !('name' in transformed)) {
          const firstName = String(transformed.first_name || '').trim();
          const lastName = String(transformed.last_name || '').trim();
          transformed.name = `${firstName} ${lastName}`.trim();
          console.debug('🔄 Created full name:', transformed.name);
        }
      }
      
      return transformed;
    }

    return data;
  }

  // Programs API methods
  async getPrograms(page: number = 1, limit: number = 100): Promise<ApiResponse<PaginatedResponse<ProgramData>>> {
    return this.makeRequest<PaginatedResponse<ProgramData>>('/api-management/organizations/programs', {
      method: 'GET',
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  async getProgramById(programId: string): Promise<ApiResponse<ProgramData>> {
    return this.makeRequest<ProgramData>(`/api-management/organizations/programs/${programId}`);
  }

  async searchPrograms(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ProgramData>>> {
    return this.makeRequest<PaginatedResponse<ProgramData>>('/api-management/organizations/programs', {
      method: 'GET',
      params: { 
        search: query, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getProgramsByStatus(
    isActive: boolean, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ProgramData>>> {
    return this.makeRequest<PaginatedResponse<ProgramData>>('/api-management/organizations/programs', {
      method: 'GET',
      params: { 
        is_active: isActive.toString(), 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  // Institutions API methods
  async getInstitutions(page: number = 1, limit: number = 100): Promise<ApiResponse<PaginatedResponse<InstitutionData>>> {
    return this.makeRequest<PaginatedResponse<InstitutionData>>('/api-management/organizations/institutions', {
      method: 'GET',
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  async getInstitutionById(institutionId: string): Promise<ApiResponse<InstitutionData>> {
    return this.makeRequest<InstitutionData>(`/api-management/organizations/institutions/${institutionId}`);
  }

  async searchInstitutions(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<InstitutionData>>> {
    return this.makeRequest<PaginatedResponse<InstitutionData>>('/api-management/organizations/institutions', {
      method: 'GET',
      params: { 
        search: query, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getInstitutionsByCategory(
    category: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<InstitutionData>>> {
    return this.makeRequest<PaginatedResponse<InstitutionData>>('/api-management/organizations/institutions', {
      method: 'GET',
      params: { 
        category: category, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getInstitutionsByType(
    type: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<InstitutionData>>> {
    return this.makeRequest<PaginatedResponse<InstitutionData>>('/api-management/organizations/institutions', {
      method: 'GET',
      params: { 
        institution_type: type, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getInstitutionsByStatus(
    isActive: boolean, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<InstitutionData>>> {
    return this.makeRequest<PaginatedResponse<InstitutionData>>('/api-management/organizations/institutions', {
      method: 'GET',
      params: { 
        is_active: isActive.toString(), 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  // Departments API methods
  async getDepartments(page: number = 1, limit: number = 100): Promise<ApiResponse<PaginatedResponse<DepartmentData>>> {
    return this.makeRequest<PaginatedResponse<DepartmentData>>('/api-management/organizations/departments', {
      method: 'GET',
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  async getDepartmentById(departmentId: string): Promise<ApiResponse<DepartmentData>> {
    return this.makeRequest<DepartmentData>(`/api-management/organizations/departments/${departmentId}`);
  }

  async searchDepartments(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<DepartmentData>>> {
    return this.makeRequest<PaginatedResponse<DepartmentData>>('/api-management/organizations/departments', {
      method: 'GET',
      params: { 
        search: query, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getDepartmentsByInstitution(
    institutionId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<DepartmentData>>> {
    return this.makeRequest<PaginatedResponse<DepartmentData>>('/api-management/organizations/departments', {
      method: 'GET',
      params: { 
        institution_id: institutionId, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getDepartmentsByDegree(
    degreeId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<DepartmentData>>> {
    return this.makeRequest<PaginatedResponse<DepartmentData>>('/api-management/organizations/departments', {
      method: 'GET',
      params: { 
        degree_id: degreeId, 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getDepartmentsByStatus(
    isActive: boolean, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<DepartmentData>>> {
    return this.makeRequest<PaginatedResponse<DepartmentData>>('/api-management/organizations/departments', {
      method: 'GET',
      params: { 
        is_active: isActive.toString(), 
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  // Student API methods
  async getStudents(page: number = 1, limit: number = 100): Promise<ApiResponse<PaginatedResponse<StudentData>>> {
    return this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
      method: 'GET',
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  async getStudentById(studentId: string): Promise<ApiResponse<StudentData>> {
    return this.makeRequest<StudentData>(`/api-management/students/${studentId}`);
  }

  async searchStudents(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StudentData>>> {
    return this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
      method: 'GET',
      params: { search: query, page: page.toString(), limit: limit.toString() }
    });
  }

  async getStudentsByInstitution(
    institution: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StudentData>>> {
    return this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
      method: 'GET',
      params: { institution, page: page.toString(), limit: limit.toString() }
    });
  }

  async getStudentsByDepartment(
    department: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StudentData>>> {
    return this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
      method: 'GET',
      params: { department, page: page.toString(), limit: limit.toString() }
    });
  }

  async getStudentsByProgram(
    program: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StudentData>>> {
    return this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
      method: 'GET',
      params: { program, page: page.toString(), limit: limit.toString() }
    });
  }

  async getStudentsByProfileStatus(
    isComplete: boolean, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StudentData>>> {
    return this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
      method: 'GET',
      params: { is_profile_complete: isComplete.toString(), page: page.toString(), limit: limit.toString() }
    });
  }

  // Staff API methods
  async getStaff(page: number = 1, limit: number = 100): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  async getStaffById(staffId: string): Promise<ApiResponse<StaffData>> {
    return this.makeRequest<StaffData>(`/api-management/staff/${staffId}`);
  }

  async searchStaff(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { 
        search: query,
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getStaffByInstitution(
    institution: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { 
        institution: institution,
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getStaffByDepartment(
    department: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { 
        department: department,
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getStaffByDesignation(
    designation: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { 
        designation: designation,
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getStaffByGender(
    gender: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { 
        gender: gender,
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  async getStaffByStatus(
    isActive: boolean, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<StaffData>>> {
    return this.makeRequest<PaginatedResponse<StaffData>>('/api-management/staff', {
      method: 'GET',
      params: { 
        is_active: isActive.toString(),
        page: page.toString(), 
        limit: limit.toString() 
      }
    });
  }

  // Test API connection
  async testConnection(): Promise<ApiResponse<any>> {
    if (this.config.mockMode) {
      return {
        success: true,
        data: { 
          message: 'Mock mode connection test successful',
          timestamp: new Date().toISOString(),
          mode: 'mock'
        }
      };
    }

    // Test with a simple students endpoint call
    try {
      const response = await this.makeRequest<PaginatedResponse<StudentData>>('/api-management/students', {
        method: 'GET',
        params: { page: 1, limit: 1 }
      });

      if (response.success) {
        return {
          success: true,
          data: { 
            message: 'MyJKKN API connection successful',
            timestamp: new Date().toISOString(),
            mode: this.config.proxyMode ? 'proxy' : 'direct',
            endpoint: this.config.baseUrl
          }
        };
      } else {
        return response;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Get API configuration status
  isConfigured(): boolean {
    // If environment variables are set, consider it configured
    if (process.env.NEXT_PUBLIC_MYJKKN_API_KEY || process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE === 'true') {
      return true;
    }
    
    // Otherwise check localStorage configuration
    return !!this.config.apiKey && this.isValidApiKey(this.config.apiKey);
  }

  // Get current configuration (without exposing the full API key)
  getConfigInfo() {
    const isEnvConfigured = !!(process.env.NEXT_PUBLIC_MYJKKN_API_KEY || process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE === 'true');
    
    return {
      baseUrl: this.config.baseUrl,
      hasApiKey: !!this.config.apiKey,
      isValidKey: this.config.apiKey ? this.isValidApiKey(this.config.apiKey) : false,
      keyPreview: this.config.apiKey ? `${this.config.apiKey.slice(0, 8)}...` : 'Not set',
      mockMode: this.config.mockMode,
      proxyMode: this.config.proxyMode,
      configuredViaEnv: isEnvConfigured
    };
  }
}

// Lazy singleton instance
let _myJkknApiInstance: MyJKKNApiService | null = null;

function getMyJkknApiInstance(): MyJKKNApiService {
  if (!_myJkknApiInstance) {
    _myJkknApiInstance = new MyJKKNApiService();
    // Refresh configuration to ensure environment variables are loaded
    _myJkknApiInstance.refreshFromEnvironment();
  } else {
    // Always refresh configuration to ensure latest environment variables
    _myJkknApiInstance.refreshFromEnvironment();
  }
  return _myJkknApiInstance;
}

// Export as property getter to ensure lazy initialization
export const myJkknApi = new Proxy({} as MyJKKNApiService, {
  get(target, prop) {
    const instance = getMyJkknApiInstance();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
}); 