'use client'

import { useEffect } from 'react'
import { checkServiceCategoriesPolicy } from '@/lib/services'

export default function TestPolicyPage() {
  useEffect(() => {
    const checkPolicies = async () => {
      const result = await checkServiceCategoriesPolicy()
      console.log('Policy check result:', result)
    }
    checkPolicies()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Testing Service Categories Policies</h1>
      <p>Please check the browser console for policy test results.</p>
    </div>
  )
} 