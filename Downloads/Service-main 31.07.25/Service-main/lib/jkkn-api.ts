/**
 * JKKN API Integration Service
 * This file handles all API calls to the JKKN endpoints
 */

// API Configuration
interface JKKNApiConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret?: string;
  mockMode?: boolean;
}

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JKKN API Class
class JKKNApiService {
  private config: JKKNApiConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_JKKN_API_BASE_URL || 'https://api.jkkn.com',
      apiKey: process.env.JKKN_API_KEY || '',
      apiSecret: process.env.JKKN_API_SECRET || '',
      mockMode: process.env.NODE_ENV === 'development' && !process.env.JKKN_API_KEY, // Auto-enable mock mode in dev when no API key
    };
  }

  // Set API credentials (to be called when user provides API keys)
  setCredentials(apiKey: string, apiSecret?: string, mockMode?: boolean) {
    this.config.apiKey = apiKey;
    if (apiSecret) {
      this.config.apiSecret = apiSecret;
    }
    if (mockMode !== undefined) {
      this.config.mockMode = mockMode;
    }
  }

  // Mock response generator for testing
  private generateMockResponse<T>(endpoint: string, method: string): ApiResponse<T> {
    const mockData: Record<string, any> = {
      '/health': { status: 'ok', message: 'API is healthy', timestamp: new Date().toISOString() },
      '/dashboard/stats': {
        totalServices: 25,
        activeRequests: 12,
        completedRequests: 156,
        totalUsers: 89,
        systemHealth: 'excellent'
      },
      '/services': [
        { id: '1', name: 'IT Support', category: 'Technical', status: 'active' },
        { id: '2', name: 'Facilities Management', category: 'Operations', status: 'active' },
        { id: '3', name: 'HR Services', category: 'Human Resources', status: 'active' }
      ],
      '/service-categories': [
        { id: '1', name: 'Technical', description: 'IT and technical services' },
        { id: '2', name: 'Operations', description: 'Operational services' },
        { id: '3', name: 'Human Resources', description: 'HR related services' }
      ],
      '/service-requests': [
        { id: '1', service: 'IT Support', status: 'pending', created: new Date().toISOString() },
        { id: '2', service: 'Facilities', status: 'approved', created: new Date().toISOString() }
      ]
    };

    // Find matching mock data
    const mockResponse = mockData[endpoint] || mockData[endpoint.split('?')[0]] || { message: 'Mock response', endpoint, method };

    return {
      success: true,
      data: mockResponse as T,
      message: `Mock response for ${method} ${endpoint}`
    };
  }

  // Generic API request method
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    // Return mock response if in mock mode
    if (this.config.mockMode) {
      console.log(`🔧 Mock Mode: ${method} ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return this.generateMockResponse<T>(endpoint, method);
    }

    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.apiSecret) {
        headers['X-API-Secret'] = this.config.apiSecret;
      }

      const requestOptions: RequestInit = {
        method,
        headers,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Don't send credentials for CORS
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        // Handle different HTTP error codes
        if (response.status === 404) {
          throw new Error(`Endpoint not found: ${endpoint}`);
        } else if (response.status === 401) {
          throw new Error('Authentication failed - check your API key');
        } else if (response.status === 403) {
          throw new Error('Access forbidden - check your API permissions');
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}) - API server might be down`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`JKKN API Error (${endpoint}):`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot reach API server. This might be due to:\n' +
                     '• CORS policy restrictions\n' +
                     '• Network connectivity issues\n' +
                     '• Invalid API URL\n' +
                     '• API server is down\n\n' +
                     '💡 Try enabling Mock Mode for testing';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Authentication & User Management Endpoints
  async authenticate(credentials: { username: string; password: string }) {
    return this.makeRequest('/auth/login', 'POST', credentials);
  }

  async getProfile(userId: string) {
    return this.makeRequest(`/users/${userId}`);
  }

  async updateProfile(userId: string, profileData: any) {
    return this.makeRequest(`/users/${userId}`, 'PUT', profileData);
  }

  // Service Management Endpoints
  async getServices(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.makeRequest(`/services${queryParams}`);
  }

  async getServiceById(serviceId: string) {
    return this.makeRequest(`/services/${serviceId}`);
  }

  async createService(serviceData: any) {
    return this.makeRequest('/services', 'POST', serviceData);
  }

  async updateService(serviceId: string, serviceData: any) {
    return this.makeRequest(`/services/${serviceId}`, 'PUT', serviceData);
  }

  async deleteService(serviceId: string) {
    return this.makeRequest(`/services/${serviceId}`, 'DELETE');
  }

  // Service Categories Endpoints
  async getServiceCategories() {
    return this.makeRequest('/service-categories');
  }

  async createServiceCategory(categoryData: any) {
    return this.makeRequest('/service-categories', 'POST', categoryData);
  }

  // Service Requests Endpoints
  async getServiceRequests(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.makeRequest(`/service-requests${queryParams}`);
  }

  async getServiceRequestById(requestId: string) {
    return this.makeRequest(`/service-requests/${requestId}`);
  }

  async createServiceRequest(requestData: any) {
    return this.makeRequest('/service-requests', 'POST', requestData);
  }

  async updateServiceRequest(requestId: string, requestData: any) {
    return this.makeRequest(`/service-requests/${requestId}`, 'PUT', requestData);
  }

  async approveServiceRequest(requestId: string, approvalData?: any) {
    return this.makeRequest(`/service-requests/${requestId}/approve`, 'POST', approvalData);
  }

  async rejectServiceRequest(requestId: string, rejectionData?: any) {
    return this.makeRequest(`/service-requests/${requestId}/reject`, 'POST', rejectionData);
  }

  // Dashboard & Analytics Endpoints
  async getDashboardStats() {
    return this.makeRequest('/dashboard/stats');
  }

  async getAnalytics(period?: string) {
    const queryParams = period ? `?period=${period}` : '';
    return this.makeRequest(`/analytics${queryParams}`);
  }

  // Approval Workflow Endpoints
  async getApprovalLevels(serviceId: string) {
    return this.makeRequest(`/services/${serviceId}/approval-levels`);
  }

  async setApprovalLevels(serviceId: string, levels: any[]) {
    return this.makeRequest(`/services/${serviceId}/approval-levels`, 'POST', { levels });
  }

  // Notifications Endpoints
  async getNotifications(userId: string) {
    return this.makeRequest(`/users/${userId}/notifications`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.makeRequest(`/notifications/${notificationId}/read`, 'PUT');
  }

  // Reports Endpoints
  async generateReport(reportType: string, filters?: any) {
    return this.makeRequest('/reports/generate', 'POST', { type: reportType, filters });
  }

  async getReports(userId: string) {
    return this.makeRequest(`/reports?userId=${userId}`);
  }

  // File Upload Endpoints
  async uploadFile(file: File, purpose?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (purpose) formData.append('purpose', purpose);

    try {
      const response = await fetch(`${this.config.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Test API Connection
  async testConnection() {
    return this.makeRequest('/health');
  }
}

// Export singleton instance
export const jkknApi = new JKKNApiService();

// Export types for use in other components
export type { ApiResponse, JKKNApiConfig };

// Helper function to check if API is configured
export function isApiConfigured(): boolean {
  return !!(process.env.JKKN_API_KEY || jkknApi['config'].apiKey);
}