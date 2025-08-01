'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Shield,
  Cpu,
  Code,
  Server,
  Globe,
  ChevronDown,
  ChevronUp,

} from 'lucide-react'

interface CorsHelpProps {
  className?: string
}

export default function CorsHelp({ className = '' }: CorsHelpProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const solutions = [
    {
      id: 'mock-mode',
      title: 'Enable Mock Mode',
      icon: Cpu,
      difficulty: 'Easy',
      description: 'Use sample data for testing without real API calls',
      badge: 'Recommended',
      steps: [
        'Open the API Configuration modal',
        'Toggle "Mock Mode" to enabled',
        'Click "Save & Apply"',
        'Test with sample programs data'
      ]
    },
    {
      id: 'cors-proxy',
      title: 'Use CORS Proxy (Development)',
      icon: Server,
      difficulty: 'Medium',
      description: 'Route requests through a CORS proxy server',
      badge: 'Development Only',
      steps: [
        'Install a CORS proxy: npm install -g cors-anywhere',
        'Start proxy: cors-anywhere',
        'Update API base URL to use proxy',
        'Only use for development/testing'
      ]
    },
    {
      id: 'api-admin',
      title: 'Contact API Administrator',
      icon: Shield,
      difficulty: 'Varies',
      description: 'Request CORS configuration on the server',
      badge: 'Production Solution',
      steps: [
        'Contact the MyJKKN API administrator',
        'Request CORS headers to be added',
        'Provide your domain/origin information',
        'Wait for server configuration update'
      ]
    },
    {
      id: 'backend-proxy',
      title: 'Create Backend Proxy',
      icon: Code,
      difficulty: 'Hard',
      description: 'Route API calls through your own backend',
      badge: 'Custom Solution',
      steps: [
        'Create a backend API endpoint',
        'Forward requests to MyJKKN API from server',
        'Return data to your frontend',
        'Handle authentication securely'
      ]
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'Recommended': return 'default'
      case 'Development Only': return 'secondary'
      case 'Production Solution': return 'outline'
      case 'Custom Solution': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* What is CORS */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Understanding CORS (Cross-Origin Resource Sharing)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700">
          <p className="mb-3">
            CORS is a web browser security feature that blocks requests from one domain to another 
            unless the server explicitly allows it by sending proper headers. It&apos;s like a security guard that checks if one website is allowed to talk to another website.
          </p>
          <p className="text-sm">
            <strong>Your situation:</strong> Your app (localhost:3000) is trying to access the MyJKKN API 
            (myadmin.jkkn.ac.in), but the API server doesn&apos;t include the necessary CORS headers.
          </p>
        </CardContent>
      </Card>

      {/* Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Solutions & Workarounds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {solutions.map((solution) => {
            const Icon = solution.icon
            const isExpanded = expandedSection === solution.id
            
            return (
              <div key={solution.id} className="border rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection(solution.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{solution.title}</h3>
                      <p className="text-sm text-gray-600">{solution.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getBadgeVariant(solution.badge)} className="text-xs">
                      {solution.badge}
                    </Badge>
                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(solution.difficulty)}`}>
                      {solution.difficulty}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      {solution.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Technical Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">CORS Headers Needed:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div className="flex items-center justify-between">
                <span>Access-Control-Allow-Origin: *</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard('Access-Control-Allow-Origin: *')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Access-Control-Allow-Methods: GET, POST, PUT, DELETE</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard('Access-Control-Allow-Methods: GET, POST, PUT, DELETE')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Access-Control-Allow-Headers: Authorization, Content-Type</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard('Access-Control-Allow-Headers: Authorization, Content-Type')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Error Details:</h4>
            <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
              <p className="text-red-800">
                <code>Access to fetch at &apos;https://myadmin.jkkn.ac.in/api/...&apos; from origin &apos;http://localhost:3000&apos; 
                has been blocked by CORS policy</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Cpu className="h-5 w-5" />
            Quick Solution: Enable Mock Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            The fastest way to continue development is to enable Mock Mode, which uses sample data 
            and doesn&apos;t make actual API calls, bypassing CORS issues entirely.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              ✓ No CORS issues
            </Badge>
            <Badge variant="default" className="text-xs">
              ✓ Full feature testing
            </Badge>
            <Badge variant="default" className="text-xs">
              ✓ Realistic sample data
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Learn More
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a 
              href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="h-3 w-3" />
              MDN: Cross-Origin Resource Sharing (CORS)
            </a>
            <a 
              href="https://web.dev/cross-origin-resource-sharing/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="h-3 w-3" />
              Web.dev: Understanding CORS
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Common CORS Issues */}
    </div>
  )
}