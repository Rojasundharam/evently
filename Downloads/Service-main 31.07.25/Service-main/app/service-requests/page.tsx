'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useServiceRequests } from '@/hooks/useServiceRequests'
import { useRBAC } from '@/hooks/useRBAC'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ServiceRequestsTable from '@/components/service-requests/ServiceRequestsTable'
import ServiceRequestsDashboard from '@/components/service-requests/ServiceRequestsDashboard'
import { RoleGuard } from '@/components/auth/RoleGuard'
import PageContainer, { PageTitle } from '@/components/layout/PageContainer'

export default function ServiceRequestsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { userRole } = useRBAC(user)
  const {
    requests,
    filteredRequests,
    stats,
    loading,
    error,
    refreshRequests,
    approveRequest,
    rejectRequest,
    cancelRequest,
    completeRequest,
    bulkApprove,
    bulkReject,
    canApprove,
    canReject,
    canCancel,
    canComplete,
    getStatusColor,
    exportToCSV
  } = useServiceRequests(user)

  if (authLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <RoleGuard user={user} allowedRoles={['admin', 'staff', 'student']}>
    <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <PageTitle>Service Requests</PageTitle>
          {userRole && (
            <div className="text-sm text-gray-600 capitalize">
              Role: {userRole}
            </div>
          )}
      </div>
      
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 w-full md:w-auto overflow-x-auto flex md:inline-flex no-scrollbar">
            <TabsTrigger value="overview" className="flex-1 md:flex-none">
              Overview
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 md:flex-none">
              All Requests
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 md:flex-none">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex-1 md:flex-none">
              My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ServiceRequestsDashboard stats={stats} loading={loading} />
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <ServiceRequestsTable
                requests={requests} 
              loading={loading}
              error={error}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onCancel={cancelRequest}
              onComplete={completeRequest}
              onBulkApprove={bulkApprove}
              onBulkReject={bulkReject}
              onRefresh={refreshRequests}
              onExport={exportToCSV}
              canApprove={canApprove}
              canReject={canReject}
              canCancel={canCancel}
              canComplete={canComplete}
              getStatusColor={getStatusColor}
            />
          </TabsContent>
          
          <TabsContent value="pending" className="mt-0">
            <ServiceRequestsTable
              requests={requests.filter(r => r.status === 'pending')}
              loading={loading}
              error={error}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onCancel={cancelRequest}
              onComplete={completeRequest}
              onBulkApprove={bulkApprove}
              onBulkReject={bulkReject}
              onRefresh={refreshRequests}
              onExport={exportToCSV}
              canApprove={canApprove}
              canReject={canReject}
              canCancel={canCancel}
              canComplete={canComplete}
              getStatusColor={getStatusColor}
            />
          </TabsContent>
          
          <TabsContent value="my-requests" className="mt-0">
            <ServiceRequestsTable
              requests={requests.filter(r => r.requester_id === user?.id)}
              loading={loading}
              error={error}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onCancel={cancelRequest}
              onComplete={completeRequest}
              onBulkApprove={bulkApprove}
              onBulkReject={bulkReject}
              onRefresh={refreshRequests}
              onExport={exportToCSV}
              canApprove={canApprove}
              canReject={canReject}
              canCancel={canCancel}
              canComplete={canComplete}
              getStatusColor={getStatusColor}
            />
            </TabsContent>
        </Tabs>
    </PageContainer>
    </RoleGuard>
  )
} 