/**
 * MyJKKN Staff Page
 * Staff data management
 */

'use client'

import React from 'react'
import { StaffDataManager } from '../../../components/myjkkn/StaffDataManager'
import ErrorBoundary from '../../../components/ErrorBoundary'

export default function MyJKKNStaffPage() {
  return (
    <div className="space-y-6">
      {/* Staff Data Interface */}
      <ErrorBoundary>
        <StaffDataManager />
      </ErrorBoundary>
    </div>
  )
} 