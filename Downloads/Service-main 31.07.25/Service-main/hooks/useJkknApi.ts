import { useState, useEffect, useCallback } from 'react'
import { jkknApi, isApiConfigured, type ApiResponse } from '@/lib/jkkn-api'

interface UseJkknApiState {
  isConfigured: boolean
  isLoading: boolean
  lastError: string | null
}

export function useJkknApi() {
  const [state, setState] = useState<UseJkknApiState>({
    isConfigured: false,
    isLoading: false,
    lastError: null
  })

  // Check configuration status on mount and when storage changes
  useEffect(() => {
    const checkConfiguration = () => {
      const configured = isApiConfigured()
      setState(prev => ({ ...prev, isConfigured: configured }))
      
      // Load saved credentials if available
      if (configured) {
        const savedConfig = localStorage.getItem('jkkn_api_config')
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig)
            jkknApi.setCredentials(config.apiKey, config.apiSecret)
          } catch (error) {
            console.error('Error loading saved API config:', error)
          }
        }
      }
    }

    checkConfiguration()

    // Listen for storage changes (when user configures API in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jkkn_api_config') {
        checkConfiguration()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Generic API call wrapper with loading and error handling
  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, isLoading: true, lastError: null }))
    
    try {
      const result = await apiFunction()
      
      if (!result.success) {
        setState(prev => ({ ...prev, lastError: result.error || 'Unknown error' }))
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, lastError: errorMessage }))
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Service management functions
  const services = {
    getAll: useCallback((filters?: any) => 
      apiCall(() => jkknApi.getServices(filters)), [apiCall]),
    
    getById: useCallback((id: string) => 
      apiCall(() => jkknApi.getServiceById(id)), [apiCall]),
    
    create: useCallback((data: any) => 
      apiCall(() => jkknApi.createService(data)), [apiCall]),
    
    update: useCallback((id: string, data: any) => 
      apiCall(() => jkknApi.updateService(id, data)), [apiCall]),
    
    delete: useCallback((id: string) => 
      apiCall(() => jkknApi.deleteService(id)), [apiCall])
  }

  // Service categories functions
  const categories = {
    getAll: useCallback(() => 
      apiCall(() => jkknApi.getServiceCategories()), [apiCall]),
    
    create: useCallback((data: any) => 
      apiCall(() => jkknApi.createServiceCategory(data)), [apiCall])
  }

  // Service requests functions
  const requests = {
    getAll: useCallback((filters?: any) => 
      apiCall(() => jkknApi.getServiceRequests(filters)), [apiCall]),
    
    getById: useCallback((id: string) => 
      apiCall(() => jkknApi.getServiceRequestById(id)), [apiCall]),
    
    create: useCallback((data: any) => 
      apiCall(() => jkknApi.createServiceRequest(data)), [apiCall]),
    
    update: useCallback((id: string, data: any) => 
      apiCall(() => jkknApi.updateServiceRequest(id, data)), [apiCall]),
    
    approve: useCallback((id: string, data?: any) => 
      apiCall(() => jkknApi.approveServiceRequest(id, data)), [apiCall]),
    
    reject: useCallback((id: string, data?: any) => 
      apiCall(() => jkknApi.rejectServiceRequest(id, data)), [apiCall])
  }

  // User management functions
  const users = {
    getProfile: useCallback((id: string) => 
      apiCall(() => jkknApi.getProfile(id)), [apiCall]),
    
    updateProfile: useCallback((id: string, data: any) => 
      apiCall(() => jkknApi.updateProfile(id, data)), [apiCall])
  }

  // Dashboard and analytics
  const dashboard = {
    getStats: useCallback(() => 
      apiCall(() => jkknApi.getDashboardStats()), [apiCall]),
    
    getAnalytics: useCallback((period?: string) => 
      apiCall(() => jkknApi.getAnalytics(period)), [apiCall])
  }

  // Approval workflow
  const approvals = {
    getLevels: useCallback((serviceId: string) => 
      apiCall(() => jkknApi.getApprovalLevels(serviceId)), [apiCall]),
    
    setLevels: useCallback((serviceId: string, levels: any[]) => 
      apiCall(() => jkknApi.setApprovalLevels(serviceId, levels)), [apiCall])
  }

  // Notifications
  const notifications = {
    getAll: useCallback((userId: string) => 
      apiCall(() => jkknApi.getNotifications(userId)), [apiCall]),
    
    markAsRead: useCallback((id: string) => 
      apiCall(() => jkknApi.markNotificationAsRead(id)), [apiCall])
  }

  // Reports
  const reports = {
    generate: useCallback((type: string, filters?: any) => 
      apiCall(() => jkknApi.generateReport(type, filters)), [apiCall]),
    
    getAll: useCallback((userId: string) => 
      apiCall(() => jkknApi.getReports(userId)), [apiCall])
  }

  // File upload
  const uploadFile = useCallback((file: File, purpose?: string) => 
    apiCall(() => jkknApi.uploadFile(file, purpose)), [apiCall])

  // Test connection
  const testConnection = useCallback(() => 
    apiCall(() => jkknApi.testConnection()), [apiCall])

  // Authentication
  const authenticate = useCallback((credentials: { username: string; password: string }) => 
    apiCall(() => jkknApi.authenticate(credentials)), [apiCall])

  return {
    // State
    isConfigured: state.isConfigured,
    isLoading: state.isLoading,
    lastError: state.lastError,
    
    // API functions organized by domain
    services,
    categories,
    requests,
    users,
    dashboard,
    approvals,
    notifications,
    reports,
    
    // Utility functions
    uploadFile,
    testConnection,
    authenticate,
    
    // Raw API access for custom calls
    api: jkknApi
  }
}