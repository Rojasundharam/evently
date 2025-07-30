'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import MobileBottomNav from './layout/MobileBottomNav'
import FloatingActionButton from './layout/FloatingActionButton'
import MobileHeader from './MobileHeader'

const GlobalMobileNavigation = () => {
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  // Define authentication pages where navigation should be hidden
  const authPages = ['/auth/login', '/auth/signup', '/auth/callback', '/login', '/signup']
  const isAuthPage = authPages.includes(pathname) || pathname?.startsWith('/auth')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only render after client-side mounting to prevent SSR issues
  if (!isMounted) {
    return null
  }

  // Don't render navigation on authentication pages
  if (isAuthPage) {
    return null
  }

  return (
    <>
      <MobileHeader />
      <MobileBottomNav />
      <FloatingActionButton />
    </>
  )
}

export default GlobalMobileNavigation 