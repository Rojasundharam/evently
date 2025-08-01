'use client';

import React from 'react';
import PageContainer, { PageTitle } from '@/components/layout/PageContainer';
import { DashboardAnalytics } from '@/components/analytics/DashboardAnalytics';

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <PageTitle>Analytics</PageTitle>
      <DashboardAnalytics />
    </PageContainer>
  );
} 