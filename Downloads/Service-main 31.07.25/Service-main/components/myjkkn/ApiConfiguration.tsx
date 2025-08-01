/**
 * ApiConfiguration Component
 * Allows users to configure MyJKKN API settings including API key and connection modes
 */

'use client'

import React, { useState, useEffect } from 'react'
import { myJkknApi } from '../../lib/myjkkn-api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/use-toast'
import { 
  Settings, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TestTube,
  Loader2,
  Info
} from 'lucide-react'

interface ApiConfigurationProps {
  onConfigurationChange?: (isConfigured: boolean) => void;
  className?: string;
}

export function ApiConfiguration({ onConfigurationChange, className }: ApiConfigurationProps) {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState('')
  const [mockMode, setMockMode] = useState(false)
  const [proxyMode, setProxyMode] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Load current configuration on mount
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null
    
    const loadConfigFromStorage = () => {
      try {
        const savedConfig = localStorage.getItem('myjkkn_api_config')
        // console.log('Loading API configuration from localStorage:', savedConfig)
        
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig)
          // console.log('Parsed configuration:', parsedConfig)
          
          // Set the actual API key value (not the preview) - only if different
          if (parsedConfig.apiKey && parsedConfig.apiKey !== apiKey) {
            setApiKey(parsedConfig.apiKey)
            // console.log('Setting API key:', parsedConfig.apiKey.slice(0, 8) + '...')
          }
          
          // Only update if values are different
          if ((parsedConfig.mockMode || false) !== mockMode) {
            setMockMode(parsedConfig.mockMode || false)
          }
          if ((parsedConfig.proxyMode || false) !== proxyMode) {
            setProxyMode(parsedConfig.proxyMode || false)
          }
          
          const isValidKey = validateApiKey(parsedConfig.apiKey || '')
          // console.log('API key validation result:', isValidKey)
          
          // Notify parent of initial configuration status
          onConfigurationChange?.(isValidKey || parsedConfig.mockMode)
        } else {
          // console.log('No saved configuration found')
          // If no config, try to get from API service
          const config = myJkknApi.getConfigInfo()
          // console.log('API service config info:', config)
          
          if (config.hasApiKey) {
            // Don't use keyPreview, reload the actual API key from the service
            myJkknApi.reloadConfiguration()
            const reloadedConfig = myJkknApi.getConfigInfo()
            // console.log('Reloaded config info:', reloadedConfig)
          }
          
          // Only update if values are different
          if (config.mockMode !== mockMode) {
            setMockMode(config.mockMode)
          }
          if (config.proxyMode !== proxyMode) {
            setProxyMode(config.proxyMode)
          }
          onConfigurationChange?.(config.isValidKey || config.mockMode)
        }
      } catch (error) {
        console.error('Error loading configuration:', error)
        setApiKey('')
        setMockMode(false)
        setProxyMode(false)
        onConfigurationChange?.(false)
      }
    }

    // Initial load without debounce
    loadConfigFromStorage()
    
    // Listen for storage changes and custom config changes with debouncing
    const handleConfigChange = (event: Event) => {
      // Ignore storage events if we just made the change ourselves
      if (event.type === 'storage') {
        const storageEvent = event as StorageEvent
        if (storageEvent.key !== 'myjkkn_api_config') {
          return
        }
      }
      
      // console.log('Configuration change detected, debouncing reload...')
      
      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      
      // Debounce the reload to prevent rapid firing
      debounceTimeout = setTimeout(() => {
        // console.log('Executing debounced configuration reload')
        loadConfigFromStorage()
      }, 1000) // 1 second debounce
    }

    window.addEventListener('storage', handleConfigChange)
    window.addEventListener('myjkkn-config-changed', handleConfigChange)
    
    return () => {
      window.removeEventListener('storage', handleConfigChange)
      window.removeEventListener('myjkkn-config-changed', handleConfigChange)
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [onConfigurationChange]) // Removed apiKey, mockMode, proxyMode dependencies to prevent loops

  const validateApiKey = (key: string): boolean => {
    return /^(jk_[a-zA-Z0-9]+_[a-zA-Z0-9]+|jkkn_[a-zA-Z0-9]+_[a-zA-Z0-9]+)$/.test(key)
  }

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    if (value) {
      myJkknApi.setCredentials(value)
      const isValid = validateApiKey(value)
      
      // Save to localStorage immediately
      const currentConfig = JSON.parse(localStorage.getItem('myjkkn_api_config') || '{}')
      const newConfig = {
        ...currentConfig,
        apiKey: value,
        mockMode,
        proxyMode
      }
      localStorage.setItem('myjkkn_api_config', JSON.stringify(newConfig))
      
      // Also trigger a reload of the API configuration
      myJkknApi.reloadConfiguration()
      
      // Don't dispatch event here - it causes infinite loops
      // The parent component will handle notifications
      
      onConfigurationChange?.(isValid || mockMode)
      
      if (isValid) {
        setConnectionStatus('unknown') // Reset status when key changes
        setConnectionError(null)
      }
    } else {
      // Clear API key from localStorage
      const currentConfig = JSON.parse(localStorage.getItem('myjkkn_api_config') || '{}')
      const newConfig = {
        ...currentConfig,
        apiKey: '',
        mockMode,
        proxyMode
      }
      localStorage.setItem('myjkkn_api_config', JSON.stringify(newConfig))
        
      // Also trigger a reload of the API configuration
      myJkknApi.reloadConfiguration()
      
      // Don't dispatch event here - it causes infinite loops
        
      onConfigurationChange?.(mockMode)
    }
  }

  const handleMockModeChange = (enabled: boolean) => {
    setMockMode(enabled)
    myJkknApi.setMockMode(enabled)
    
    // Save to localStorage immediately
    const currentConfig = JSON.parse(localStorage.getItem('myjkkn_api_config') || '{}')
    const newConfig = {
      ...currentConfig,
      apiKey,
      mockMode: enabled,
      proxyMode
    }
    localStorage.setItem('myjkkn_api_config', JSON.stringify(newConfig))
      
    // Also trigger a reload of the API configuration
    myJkknApi.reloadConfiguration()
    
    // Don't dispatch event here - it causes infinite loops
      
    onConfigurationChange?.(enabled || validateApiKey(apiKey))
    
    if (enabled) {
      setConnectionStatus('success')
      setConnectionError(null)
      toast({
        title: "Mock Mode Enabled",
        description: "Using mock data for testing and development.",
      })
    } else {
      setConnectionStatus('unknown')
      setConnectionError(null)
    }
  }

  const handleProxyModeChange = (enabled: boolean) => {
    setProxyMode(enabled)
    myJkknApi.setProxyMode(enabled)
    
    // Save to localStorage immediately
    const currentConfig = JSON.parse(localStorage.getItem('myjkkn_api_config') || '{}')
    const newConfig = {
      ...currentConfig,
      apiKey,
      mockMode,
      proxyMode: enabled
    }
    localStorage.setItem('myjkkn_api_config', JSON.stringify(newConfig))
      
    // Also trigger a reload of the API configuration
    myJkknApi.reloadConfiguration()
    
    // Don't dispatch event here - it causes infinite loops
      
    toast({
      title: enabled ? "Proxy Mode Enabled" : "Direct Mode Enabled",
      description: enabled 
        ? "API requests will go through Next.js API routes." 
        : "API requests will go directly to MyJKKN servers.",
    })
  }

  const testConnection = async () => {
    if (mockMode) {
      setConnectionStatus('success')
      setConnectionError(null)
      toast({
        title: "Connection Test Success",
        description: "Mock mode is working correctly.",
      })
      return
    }

    if (!apiKey || !validateApiKey(apiKey)) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key in the format: jk_xxxxx_xxxxx (students) or jkkn_xxxxx_xxxxx (staff)",
        variant: "destructive",
      })
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('unknown')
    setConnectionError(null)

    try {
      const response = await myJkknApi.testConnection()
      
      if (response.success) {
        setConnectionStatus('success')
        setConnectionError(null)
        toast({
          title: "Connection Test Success",
          description: "Successfully connected to MyJKKN API.",
        })
      } else {
        throw new Error(response.error || 'Connection test failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setConnectionStatus('error')
      setConnectionError(errorMessage)
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Connection Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Not Tested
          </Badge>
        )
    }
  }

  const isConfigured = validateApiKey(apiKey) || mockMode

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            MyJKKN API Configuration
          </CardTitle>
          <CardDescription>
            Configure your connection to the MyJKKN API system. You can use mock data for testing 
            or connect to the real API with your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mock Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Mock Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use mock data for testing and development
              </p>
            </div>
            <Switch
              checked={mockMode}
              onCheckedChange={handleMockModeChange}
            />
          </div>

          {/* API Key Configuration */}
          {!mockMode && (
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-base">
                API Key
              </Label>
              <div className="space-y-2">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="jk_xxxxx_xxxxx"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your MyJKKN API key provided by the administrator. 
                  Format: jk_xxxxx_xxxxx
                </p>
                {apiKey && !validateApiKey(apiKey) && (
                  <p className="text-sm text-red-600">
                    Invalid API key format. Expected: jk_xxxxx_xxxxx
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Proxy Mode Toggle */}
          {!mockMode && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Proxy Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Route requests through Next.js API to avoid CORS issues
                </p>
              </div>
              <Switch
                checked={proxyMode}
                onCheckedChange={handleProxyModeChange}
              />
            </div>
          )}

          {/* Connection Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Connection Status</Label>
              {getConnectionStatusBadge()}
            </div>
            
            {connectionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{connectionError}</p>
              </div>
            )}

            <Button 
              onClick={testConnection}
              disabled={(!apiKey && !mockMode) || isTestingConnection}
              variant="outline"
              className="w-full"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {/* Configuration Summary */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base">Current Configuration</Label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Mode:</span>
                <span className="ml-2">
                  {mockMode ? 'Mock Data' : 'Live API'}
                </span>
              </div>
              <div>
                <span className="font-medium">Connection:</span>
                <span className="ml-2">
                  {mockMode ? 'Mock' : proxyMode ? 'Proxy' : 'Direct'}
                </span>
              </div>
              <div>
                <span className="font-medium">API Key:</span>
                <span className="ml-2">
                  {mockMode ? 'Not Required' : apiKey ? 'Configured' : 'Not Set'}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2">
                  {isConfigured ? 'Ready' : 'Needs Configuration'}
                </span>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Getting Started:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Enable <strong>Mock Mode</strong> to test with sample data</li>
                <li>For production, contact your administrator for an API key</li>
                <li>Use <strong>Proxy Mode</strong> if you encounter CORS errors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 