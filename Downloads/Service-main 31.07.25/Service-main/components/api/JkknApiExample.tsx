'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useJkknApi } from '@/hooks/useJkknApi'
import { 
  RefreshCw, 
  Database, 
  FileText, 
  BarChart3, 
  Bell,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export default function JkknApiExample() {
  const {
    isConfigured,
    isLoading,
    lastError,
    services,
    categories,
    requests,
    dashboard,
    notifications,
    testConnection
  } = useJkknApi()

  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [activeTest, setActiveTest] = useState<string>('')

  // Test functions for different endpoints
  const testEndpoints = [
    {
      id: 'test-connection',
      name: 'Test Connection',
      icon: Database,
      description: 'Test basic API connectivity',
      action: async () => {
        const result = await testConnection()
        setResults(prev => ({ ...prev, 'test-connection': result }))
      }
    },
    {
      id: 'dashboard-stats',
      name: 'Dashboard Stats',
      icon: BarChart3,
      description: 'Fetch dashboard statistics',
      action: async () => {
        const result = await dashboard.getStats()
        setResults(prev => ({ ...prev, 'dashboard-stats': result }))
      }
    },
    {
      id: 'services',
      name: 'Get Services',
      icon: FileText,
      description: 'Fetch all services from API',
      action: async () => {
        const result = await services.getAll()
        setResults(prev => ({ ...prev, 'services': result }))
      }
    },
    {
      id: 'categories',
      name: 'Get Categories',
      icon: FileText,
      description: 'Fetch service categories',
      action: async () => {
        const result = await categories.getAll()
        setResults(prev => ({ ...prev, 'categories': result }))
      }
    },
    {
      id: 'requests',
      name: 'Service Requests',
      icon: FileText,
      description: 'Fetch service requests',
      action: async () => {
        const result = await requests.getAll({ status: 'pending' })
        setResults(prev => ({ ...prev, 'requests': result }))
      }
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Fetch user notifications',
      action: async () => {
        const result = await notifications.getAll('sample-user-id')
        setResults(prev => ({ ...prev, 'notifications': result }))
      }
    }
  ]

  const handleTestEndpoint = async (test: typeof testEndpoints[0]) => {
    setActiveTest(test.id)
    try {
      await test.action()
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error)
    } finally {
      setActiveTest('')
    }
  }

  const renderResult = (result: TestResult | undefined) => {
    if (!result) return null

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm">
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium">
            {result.success ? 'Success' : 'Failed'}
          </span>
        </div>
        
        {result.success ? (
          <div>
            <p className="text-gray-600 mb-2">Response:</p>
            <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ) : (
          <div>
            <p className="text-red-600">Error: {result.error}</p>
          </div>
        )}
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            JKKN API Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">API Not Configured</h3>
            <p className="text-gray-500 mb-4">
              Configure your JKKN API credentials to start using the integration features.
            </p>
            <Badge variant="secondary">Click &quot;Setup API&quot; in the header to configure</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            JKKN API Integration Test Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              API Configured
            </Badge>
            {lastError && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {lastError}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Test different JKKN API endpoints to verify your integration is working correctly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testEndpoints.map((test) => {
              const Icon = test.icon
              const isActive = activeTest === test.id
              const result = results[test.id]
              
              return (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary-50 p-2 rounded-lg">
                      <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{test.name}</h4>
                      <p className="text-xs text-gray-500">{test.description}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleTestEndpoint(test)}
                    disabled={isActive || isLoading}
                    size="sm"
                    className="w-full"
                    variant={result?.success ? "default" : "outline"}
                  >
                    {isActive ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-2" />
                    )}
                    {isActive ? 'Testing...' : 'Test'}
                  </Button>
                  
                  {renderResult(result)}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Service Management</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• GET /services - List all services</li>
                <li>• GET /services/:id - Get service details</li>
                <li>• POST /services - Create new service</li>
                <li>• PUT /services/:id - Update service</li>
                <li>• DELETE /services/:id - Delete service</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Service Requests</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• GET /service-requests - List requests</li>
                <li>• POST /service-requests - Create request</li>
                <li>• PUT /service-requests/:id - Update request</li>
                <li>• POST /service-requests/:id/approve - Approve</li>
                <li>• POST /service-requests/:id/reject - Reject</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Analytics & Reports</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• GET /dashboard/stats - Dashboard data</li>
                <li>• GET /analytics - Performance metrics</li>
                <li>• POST /reports/generate - Generate reports</li>
                <li>• GET /reports - List user reports</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">User Management</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• GET /users/:id - Get user profile</li>
                <li>• PUT /users/:id - Update profile</li>
                <li>• GET /users/:id/notifications - Get notifications</li>
                <li>• PUT /notifications/:id/read - Mark as read</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}