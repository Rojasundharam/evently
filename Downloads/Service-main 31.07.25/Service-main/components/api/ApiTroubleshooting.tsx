'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, RefreshCw, Network, Shield, Server } from 'lucide-react'

interface ApiTroubleshootingProps {
  onRetry?: () => void
  onEnableMockMode?: () => void
}

export default function ApiTroubleshooting({ onRetry, onEnableMockMode }: ApiTroubleshootingProps) {
  const troubleshootingSteps = [
    {
      title: 'Check Your Network Connection',
      icon: Network,
      description: 'Ensure you have a stable internet connection',
      solutions: [
        'Try accessing other websites to confirm connectivity',
        'Check if you&apos;re behind a corporate firewall',
        'Try switching to a different network (mobile hotspot)'
      ]
    },
    {
      title: 'Verify API Credentials',
      icon: Shield,
      description: 'Double-check your API key and settings',
      solutions: [
        'Ensure your API key is correct and not expired',
        'Verify the base URL is accurate',
        'Check if your API key has the required permissions'
      ]
    },
    {
      title: 'CORS Policy Issues',
      icon: Server,
      description: 'The API server might not allow browser requests',
      solutions: [
        'Contact your API provider about CORS configuration',
        'Use Mock Mode for testing and development',
        'Consider setting up a proxy server for production'
      ]
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
        <div className="text-red-700">
          <strong>Connection Failed:</strong> Unable to reach the JKKN API server. 
          Here are some solutions to try:
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {troubleshootingSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-blue-600" />
                  {step.title}
                </CardTitle>
                <p className="text-xs text-gray-600">{step.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {step.solutions.map((solution, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{solution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">💡 Quick Solution: Mock Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 mb-4">
            If you&apos;re having trouble connecting to the real API, you can enable Mock Mode 
            to test the integration with simulated data.
          </p>
          <div className="flex gap-2">
            {onEnableMockMode && (
              <Button onClick={onEnableMockMode} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Enable Mock Mode
              </Button>
            )}
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 border border-gray-200 bg-gray-50 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-gray-600 flex-shrink-0" />
        <div className="text-gray-700">
          <strong>Still having issues?</strong> Contact your JKKN API provider or system administrator 
          for assistance with API access and CORS configuration.
        </div>
      </div>
    </div>
  )
} 