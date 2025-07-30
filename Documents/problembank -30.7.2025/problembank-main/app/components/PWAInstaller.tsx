'use client'

import { useEffect, useState } from 'react'

// PWA installer component to handle service worker registration and install prompts
const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('PWA: Service Worker registered successfully:', registration.scope)
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New update available
                    console.log('PWA: New update available!')
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.log('PWA: Service Worker registration failed:', error)
          })
      })
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Store the event so it can be triggered later
      setDeferredPrompt(e)
      setIsInstallable(true)
      console.log('PWA: Install prompt is available')
    }

    // Listen for the app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed successfully')
      setDeferredPrompt(null)
      setIsInstallable(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Function to trigger the install prompt
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No install prompt available')
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt')
    } else {
      console.log('PWA: User dismissed the install prompt')
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  // Don't render anything - this is just for PWA functionality
  return null
}

export default PWAInstaller 