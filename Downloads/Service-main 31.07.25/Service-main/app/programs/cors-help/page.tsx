'use client'

import React from 'react'
import PageContainer, { PageTitle } from '@/components/layout/PageContainer'
import CorsHelp from '@/components/programs/CorsHelp'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CorsHelpPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/programs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
          <div>
            <PageTitle>CORS Troubleshooting Guide</PageTitle>
            <p className="text-gray-600 mt-1">
              Solutions for Cross-Origin Resource Sharing (CORS) issues
            </p>
          </div>
        </div>

        {/* CORS Help Component */}
        <CorsHelp />
      </div>
    </PageContainer>
  )
} 