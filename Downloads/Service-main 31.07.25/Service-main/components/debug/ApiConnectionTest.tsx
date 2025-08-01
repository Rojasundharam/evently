'use client'

import { useState, useEffect } from 'react'
import { myJkknApi } from '@/lib/myjkkn-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export function ApiConnectionTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [configInfo, setConfigInfo] = useState<any>(null)

  useEffect(() => {
    setConfigInfo(myJkknApi.getConfigInfo())
  }, [])

  const testApiConnection = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      console.log('🧪 Testing real API connection...')
      
      // Test basic connection
      const connectionTest = await myJkknApi.testConnection()
      
      // Test staff endpoint
      const staffTest = await myJkknApi.getStaff(1, 5)
      
      // Test students endpoint  
      const studentsTest = await myJkknApi.getStudents(1, 5)
      
      // Test departments endpoint
      const departmentsTest = await myJkknApi.getDepartments(1, 5)

      setTestResults({
        connection: connectionTest,
        staff: staffTest,
        students: studentsTest,
        departments: departmentsTest,
        timestamp: new Date().toLocaleTimeString()
      })

      console.log('🧪 API Test Results:', {
        connection: connectionTest.success,
        staff: staffTest.success,
        students: studentsTest.success,
        departments: departmentsTest.success
      })

    } catch (error) {
      console.error('❌ API Test Error:', error)
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Real API Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Mock Mode</p>
            <Badge variant={configInfo?.mockMode ? "destructive" : "default"}>
              {configInfo?.mockMode ? "ENABLED" : "DISABLED"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">API Key</p>
            <Badge variant={configInfo?.hasApiKey ? "default" : "destructive"}>
              {configInfo?.hasApiKey ? "CONFIGURED" : "MISSING"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Base URL</p>
            <p className="text-xs text-muted-foreground">{configInfo?.baseUrl}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Environment</p>
            <Badge variant={configInfo?.configuredViaEnv ? "default" : "secondary"}>
              {configInfo?.configuredViaEnv ? "ENV VARS" : "MANUAL"}
            </Badge>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={testApiConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing API Connection...
            </>
          ) : (
            'Test Real API Connection'
          )}
        </Button>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results ({testResults.timestamp})</h4>
            
            {testResults.error ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{testResults.error}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Connection Test</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.connection?.success)}
                    <span className="text-xs text-muted-foreground">
                      {testResults.connection?.success ? 'Connected' : testResults.connection?.error}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Staff Data</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.staff?.success)}
                    <span className="text-xs text-muted-foreground">
                      {testResults.staff?.success 
                        ? `${testResults.staff?.data?.data?.length || 0} records` 
                        : testResults.staff?.error}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Student Data</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.students?.success)}
                    <span className="text-xs text-muted-foreground">
                      {testResults.students?.success 
                        ? `${testResults.students?.data?.data?.length || 0} records` 
                        : testResults.students?.error}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Department Data</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.departments?.success)}
                    <span className="text-xs text-muted-foreground">
                      {testResults.departments?.success 
                        ? `${testResults.departments?.data?.data?.length || 0} records` 
                        : testResults.departments?.error}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Environment Debug */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Environment Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              envVars: {
                NEXT_PUBLIC_MYJKKN_API_KEY: process.env.NEXT_PUBLIC_MYJKKN_API_KEY ? 'SET' : 'NOT SET',
                NEXT_PUBLIC_MYJKKN_BASE_URL: process.env.NEXT_PUBLIC_MYJKKN_BASE_URL,
                NEXT_PUBLIC_MYJKKN_MOCK_MODE: process.env.NEXT_PUBLIC_MYJKKN_MOCK_MODE,
                NEXT_PUBLIC_MYJKKN_PROXY_MODE: process.env.NEXT_PUBLIC_MYJKKN_PROXY_MODE,
              },
              configInfo
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
} 