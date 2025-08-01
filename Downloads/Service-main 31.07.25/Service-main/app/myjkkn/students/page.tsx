/**
 * MyJKKN Students Page  
 * Student data management
 */

'use client'

import React from 'react'
import { StudentsDataManager } from '../../../components/myjkkn/StudentsDataManager'
import ErrorBoundary from '../../../components/ErrorBoundary'

export default function MyJKKNStudentsPage() {
  return (
    <div className="space-y-6">
      {/* Student Data Interface */}
      <ErrorBoundary>
        <StudentsDataManager />
      </ErrorBoundary>
    </div>
  )
} 