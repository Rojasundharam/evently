'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-card shadow-lg rounded-xl p-8 w-full max-w-md border border-border">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">Authentication Error</h1>
        <p className="text-center text-muted-foreground mb-6">
          There was an error during the authentication process. This might be due to:
        </p>
        
        <ul className="text-sm text-muted-foreground mb-6 space-y-2">
          <li>• Invalid or expired authentication code</li>
          <li>• Database connection issues</li>
          <li>• Configuration problems</li>
        </ul>
        
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Redirecting to login in 5 seconds...
        </div>
      </div>
    </div>
  )
} 