'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    this.setState({ error, errorInfo })

    // Check if it's a chunk loading error and try to reload
    if (error.message?.includes('Loading chunk') || 
        error.message?.includes('Loading CSS chunk') ||
        error.message?.includes('ChunkLoadError')) {
      console.log('Chunk loading error detected, reloading page...')
      // Small delay before reload to prevent infinite loops
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      
      // Check for specific error types
      const isChunkError = error?.message?.includes('Loading chunk') || 
                          error?.message?.includes('ChunkLoadError')
      const isHydrationError = error?.message?.includes('Hydration') ||
                              error?.message?.includes('hydration')

      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={error!} reset={this.handleReset} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-5xl mb-4">
              {isChunkError ? '📦' : isHydrationError ? '🔄' : '⚠️'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {isChunkError ? 'Loading Error' : 
               isHydrationError ? 'Synchronization Error' : 
               'Something went wrong'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {isChunkError ? 
                'There was an issue loading the application. The page will refresh automatically.' :
                isHydrationError ?
                'The application is synchronizing. Please wait...' :
                'An unexpected error occurred. You can try refreshing the page.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left mb-4 bg-gray-100 dark:bg-gray-700 rounded p-4">
                <summary className="cursor-pointer text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {error.toString()}
                </pre>
              </details>
            )}
            
            <div className="space-y-2">
              <button 
                onClick={this.handleReset}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 