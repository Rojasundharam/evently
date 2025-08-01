'use client'

import { useEffect, createContext, useContext, ReactNode, useState } from 'react'
import { myJkknApi } from '../../lib/myjkkn-api'

interface ApiConfigState {
  isConfigured: boolean
  mockMode: boolean
  proxyMode: boolean
  hasApiKey: boolean
  lastUpdated: number
}

interface ApiContextValue extends ApiConfigState {
  refreshConfig: () => void
}

const ApiContext = createContext<ApiContextValue | null>(null)

export function useApiConfig() {
  const context = useContext(ApiContext)
  if (!context) {
    // Return default values instead of throwing error to prevent ErrorBoundary triggers
    console.warn('useApiConfig used outside MyJkknApiProvider, returning defaults')
    return {
      isConfigured: false,
      mockMode: true, // Default to mock mode for safety
      proxyMode: false,
      hasApiKey: false,
      lastUpdated: Date.now(),
      refreshConfig: () => {}
    }
  }
  return context
}

export default function MyJkknApiProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ApiConfigState>({
    isConfigured: false,
    mockMode: false,
    proxyMode: false,
    hasApiKey: false,
    lastUpdated: Date.now()
  })

  const loadConfiguration = () => {
    try {
      const savedConfig = localStorage.getItem('myjkkn_api_config')
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig)
        
        // First reload the configuration from localStorage
        myJkknApi.reloadConfiguration()
        
        // Then set individual settings (for backwards compatibility)
        if (parsedConfig.apiKey) {
          myJkknApi.setCredentials(parsedConfig.apiKey)
        }
        
        // Set modes
        myJkknApi.setMockMode(parsedConfig.mockMode || false)
        myJkknApi.setProxyMode(parsedConfig.proxyMode || false)
        
        // Update state only if actually changed to prevent loops
        const newConfig = {
          isConfigured: !!parsedConfig.apiKey && !parsedConfig.mockMode,
          mockMode: parsedConfig.mockMode || false,
          proxyMode: parsedConfig.proxyMode || false,
          hasApiKey: !!parsedConfig.apiKey,
          lastUpdated: Date.now()
        }
        
        setConfig(prevConfig => {
          // Only update if values actually changed
          if (prevConfig.isConfigured !== newConfig.isConfigured ||
              prevConfig.mockMode !== newConfig.mockMode ||
              prevConfig.proxyMode !== newConfig.proxyMode ||
              prevConfig.hasApiKey !== newConfig.hasApiKey) {
            // console.log('MyJKKN API configuration updated:', newConfig)
            return newConfig
          }
          return prevConfig
        })
      } else {
        // No config found - set defaults
        myJkknApi.setMockMode(false)
        myJkknApi.setProxyMode(false)
        
        setConfig(prevConfig => {
          if (prevConfig.isConfigured || prevConfig.mockMode || prevConfig.proxyMode || prevConfig.hasApiKey) {
            return {
              isConfigured: false,
              mockMode: false,
              proxyMode: false,
              hasApiKey: false,
              lastUpdated: Date.now()
            }
          }
          return prevConfig
        })
      }
    } catch (error) {
      console.error('Error loading saved MyJKKN config:', error)
      // Clear invalid config
      localStorage.removeItem('myjkkn_api_config')
      
      // Reset to defaults
      setConfig({
        isConfigured: false,
        mockMode: false,
        proxyMode: false,
        hasApiKey: false,
        lastUpdated: Date.now()
      })
    }
  }

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration()
  }, [])

  // Listen for storage changes (cross-tab communication)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'myjkkn_api_config') {
        // console.log('API configuration changed in another tab, reloading...')
        loadConfiguration()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Listen for custom configuration change events (same-tab communication)
  useEffect(() => {
    const handleConfigChange = () => {
      // console.log('API configuration changed, reloading...')
      loadConfiguration()
    }

    window.addEventListener('myjkkn-config-changed', handleConfigChange)
    return () => window.removeEventListener('myjkkn-config-changed', handleConfigChange)
  }, [])

  const refreshConfig = () => {
    loadConfiguration()
  }

  const contextValue: ApiContextValue = {
    ...config,
    refreshConfig
  }

  return (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  )
} 