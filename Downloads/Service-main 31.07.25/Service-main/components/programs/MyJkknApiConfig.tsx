'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Key, TestTube, CheckCircle, XCircle, Shield, Cpu, AlertTriangle } from 'lucide-react'
import { myJkknApi } from '@/lib/myjkkn-api'

interface MyJkknApiConfigProps {
  onConfigSaved?: () => void
}

export default function MyJkknApiConfig({ onConfigSaved }: MyJkknApiConfigProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [mockMode, setMockMode] = useState(false)
  const [proxyMode, setProxyMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [configInfo, setConfigInfo] = useState(myJkknApi.getConfigInfo())

  // Update config info when component mounts or modal opens
  useEffect(() => {
    setConfigInfo(myJkknApi.getConfigInfo())
  }, [isOpen])

  const validateApiKey = (key: string): boolean => {
    return /^jk_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/.test(key)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Configure modes
      myJkknApi.setMockMode(mockMode)
      myJkknApi.setProxyMode(proxyMode && !mockMode) // Only use proxy if not in mock mode

      if (mockMode) {
        // Save mock mode configuration
        localStorage.setItem('myjkkn_api_config', JSON.stringify({
          apiKey: apiKey || 'mock_key',
          baseUrl: 'https://myadmin.jkkn.ac.in/api',
          mockMode: true,
          proxyMode: false
        }))

        setTestResult({ success: true, message: 'Mock Mode enabled successfully! Using sample data for testing.' })
        setConfigInfo(myJkknApi.getConfigInfo())
        
        // Notify parent component
        if (onConfigSaved) {
          onConfigSaved()
        }

        // Close modal after a brief delay
        setTimeout(() => {
          setIsOpen(false)
          setTestResult(null)
        }, 2000)
        return
      }

      // Real API mode validation
      if (!apiKey.trim()) {
        setTestResult({ success: false, message: 'API Key is required for real API mode' })
        return
      }

      if (!validateApiKey(apiKey)) {
        setTestResult({ 
          success: false, 
          message: 'Invalid API key format. Expected format: jk_xxxxx_xxxxx' 
        })
        return
      }

      // Set the credentials in the API service
      myJkknApi.setCredentials(apiKey)

      // Test the connection
      const testResponse = await myJkknApi.testConnection()
      
      if (testResponse.success) {
        // Save to localStorage for persistence
        localStorage.setItem('myjkkn_api_config', JSON.stringify({
          apiKey,
          baseUrl: 'https://myadmin.jkkn.ac.in/api',
          mockMode: false,
          proxyMode: proxyMode
        }))

        setTestResult({ success: true, message: 'MyJKKN API configured successfully!' })
        setConfigInfo(myJkknApi.getConfigInfo())
        
        // Notify parent component
        if (onConfigSaved) {
          onConfigSaved()
        }

        // Close modal after a brief delay
        setTimeout(() => {
          setIsOpen(false)
          setTestResult(null)
        }, 2000)
      } else {
        setTestResult({ 
          success: false, 
          message: `Configuration failed: ${testResponse.error}` 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

          try {
        // Configure modes for testing
        myJkknApi.setMockMode(mockMode)
        myJkknApi.setProxyMode(proxyMode && !mockMode)

      if (mockMode) {
        // Test mock mode
        await myJkknApi.testConnection()
        setTestResult({ 
          success: true, 
          message: 'Mock mode test successful! Sample data is available.' 
        })
        return
      }

      if (proxyMode) {
        // Test proxy mode
        if (!apiKey.trim()) {
          setTestResult({ success: false, message: 'API Key is required for proxy mode' })
          return
        }
        
        if (!validateApiKey(apiKey)) {
          setTestResult({ 
            success: false, 
            message: 'Invalid API key format. Expected format: jk_xxxxx_xxxxx' 
          })
          return
        }
        
        myJkknApi.setCredentials(apiKey)
        const testResponse = await myJkknApi.testConnection()
        
        if (testResponse.success) {
          setTestResult({ 
            success: true, 
            message: 'Proxy mode test successful! Real API connection working through Next.js backend.' 
          })
        } else {
          setTestResult({ 
            success: false, 
            message: `Proxy mode failed: ${testResponse.error}` 
          })
        }
        return
      }

      // Real API mode validation
      if (!apiKey.trim()) {
        setTestResult({ success: false, message: 'Please enter an API Key first' })
        return
      }

      if (!validateApiKey(apiKey)) {
        setTestResult({ 
          success: false, 
          message: 'Invalid API key format. Expected format: jk_xxxxx_xxxxx' 
        })
        return
      }

      // Temporarily set credentials for testing
      myJkknApi.setCredentials(apiKey)
      
      const testResponse = await myJkknApi.testConnection()
      
      if (testResponse.success) {
        setTestResult({ success: true, message: 'Connection successful!' })
      } else {
        setTestResult({ 
          success: false, 
          message: `Connection failed: ${testResponse.error}` 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load saved config when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedConfig = localStorage.getItem('myjkkn_api_config')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setApiKey(config.apiKey || '')
          setMockMode(config.mockMode || false)
          setProxyMode(config.proxyMode || false)
          
          // Apply the saved configuration to the API service
          if (config.apiKey) {
            myJkknApi.setCredentials(config.apiKey)
          }
          myJkknApi.setMockMode(config.mockMode || false)
          myJkknApi.setProxyMode(config.proxyMode || false)
        } catch (error) {
          console.error('Error loading saved MyJKKN config:', error)
        }
      }
    }
  }, [isOpen])

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            MyJKKN API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base URL:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {configInfo.baseUrl}
              </code>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Key:</span>
              <div className="flex items-center gap-2">
                {configInfo.hasApiKey ? (
                  <>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {configInfo.keyPreview}
                    </code>
                    <Badge variant={configInfo.isValidKey ? "default" : "destructive"} className="text-xs">
                      {configInfo.isValidKey ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Valid</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" />Invalid</>
                      )}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not configured</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mode:</span>
              <div className="flex items-center gap-2">
                {configInfo.mockMode ? (
                  <Badge variant="secondary" className="text-xs">
                    <Cpu className="h-3 w-3 mr-1" />
                    Mock Mode
                  </Badge>
                ) : configInfo.proxyMode ? (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Proxy Mode
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Direct API
                  </Badge>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    {configInfo.hasApiKey ? 'Update Configuration' : 'Configure API'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      MyJKKN API Configuration
                    </DialogTitle>
                    <DialogDescription>
                      Configure your MyJKKN API credentials to fetch programs data.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* CORS Solutions */}
                    <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">CORS Issue Solutions</p>
                          <p className="text-xs text-amber-700">Choose how to handle CORS restrictions</p>
                        </div>
                      </div>
                      
                      {/* Mock Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Mock Mode</p>
                          <p className="text-xs text-gray-600">Use sample data (no API calls)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mockMode}
                            onChange={(e) => {
                              setMockMode(e.target.checked)
                              if (e.target.checked) setProxyMode(false)
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Proxy Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Proxy Mode</p>
                          <p className="text-xs text-gray-600">Route through Next.js backend (real API)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={proxyMode}
                            disabled={mockMode}
                            onChange={(e) => {
                              setProxyMode(e.target.checked)
                              if (e.target.checked) setMockMode(false)
                            }}
                            className="sr-only peer disabled:cursor-not-allowed"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 ${mockMode ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key {mockMode ? '(Optional in Mock Mode)' : '*'}</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="jk_xxxxx_xxxxx"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono"
                        disabled={mockMode}
                      />
                      <p className="text-xs text-gray-500">
                        {mockMode 
                          ? 'Mock mode uses sample data - API key not required'
                          : proxyMode
                          ? 'Proxy mode routes through Next.js backend - API key required'
                          : 'Format: jk_xxxxx_xxxxx (provided by administrator)'
                        }
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Base URL</Label>
                      <Input
                        value="https://myadmin.jkkn.ac.in/api"
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        MyJKKN Admin API endpoint (read-only)
                      </p>
                    </div>

                    {testResult && (
                      <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                        testResult.success 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {testResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {testResult.message}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isLoading}
                        className="flex items-center gap-2 flex-1"
                      >
                        <TestTube className="h-4 w-4" />
                        Test Connection
                      </Button>
                      
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 flex-1"
                      >
                        <Key className="h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save & Apply'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}