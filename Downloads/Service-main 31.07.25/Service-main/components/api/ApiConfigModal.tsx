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
import { Settings, Key, TestTube, CheckCircle, XCircle } from 'lucide-react'
import { jkknApi, isApiConfigured } from '@/lib/jkkn-api'

interface ApiConfigModalProps {
  onConfigSaved?: () => void;
}

export default function ApiConfigModal({ onConfigSaved }: ApiConfigModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.jkkn.com')
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [mockMode, setMockMode] = useState(false)

  useEffect(() => {
    // Check if API is already configured
    setIsConfigured(isApiConfigured())
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'API Key is required' })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      // Set the credentials in the API service
      jkknApi.setCredentials(apiKey, apiSecret, mockMode)

      // Test the connection (unless in mock mode)
      const testResponse = mockMode 
        ? { success: true, data: { message: 'Mock mode enabled - no real API connection needed' } }
        : await jkknApi.testConnection()
      
      if (testResponse.success) {
        // Save to localStorage for persistence (in production, use secure storage)
        localStorage.setItem('jkkn_api_config', JSON.stringify({
          apiKey,
          apiSecret,
          baseUrl,
          mockMode
        }))

        setTestResult({ 
          success: true, 
          message: mockMode 
            ? 'Mock mode enabled successfully!' 
            : 'API configured successfully!' 
        })
        setIsConfigured(true)
        
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
    if (!mockMode && !apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API Key first or enable Mock Mode' })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      // Temporarily set credentials for testing
      jkknApi.setCredentials(apiKey, apiSecret, mockMode)
      
      const testResponse = mockMode 
        ? { success: true, data: { message: 'Mock mode test successful' } }
        : await jkknApi.testConnection()
      
      if (testResponse.success) {
        setTestResult({ 
          success: true, 
          message: mockMode ? 'Mock mode test successful!' : 'Connection successful!' 
        })
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
      const savedConfig = localStorage.getItem('jkkn_api_config')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setApiKey(config.apiKey || '')
          setApiSecret(config.apiSecret || '')
          setBaseUrl(config.baseUrl || 'https://api.jkkn.com')
          setMockMode(config.mockMode || false)
          
          // Apply the saved configuration to the API service
          jkknApi.setCredentials(config.apiKey, config.apiSecret, config.mockMode)
        } catch (error) {
          console.error('Error loading saved config:', error)
        }
      }
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {isConfigured ? 'API Settings' : 'Setup API'}
          {isConfigured && <CheckCircle className="h-4 w-4 text-green-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            JKKN API Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your JKKN API credentials to enable full integration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your JKKN API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret (Optional)</Label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="Enter your JKKN API secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://api.jkkn.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="mockMode"
              type="checkbox"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <Label htmlFor="mockMode" className="text-sm font-medium text-gray-700">
              Enable Mock Mode (for testing without real API)
            </Label>
          </div>
          
          {mockMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              <p className="font-medium mb-1">Mock Mode Enabled</p>
              <p>This will use simulated responses for testing. Perfect when the real API is not accessible.</p>
            </div>
          )}

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
  )
}