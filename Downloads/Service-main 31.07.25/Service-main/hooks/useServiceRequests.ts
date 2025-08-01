'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ServiceRequest } from '@/lib/types';
import { User } from '@supabase/supabase-js';
import { useRBAC } from '@/hooks/useRBAC';

export interface ServiceRequestFilters {
  status?: string[];
  serviceId?: string;
  requesterId?: string;
  level?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string;
}

export interface ServiceRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
  byLevel: Record<number, number>;
  byService: Record<string, number>;
}

interface UseServiceRequestsReturn {
  // Data
  requests: ServiceRequest[];
  filteredRequests: ServiceRequest[];
  stats: ServiceRequestStats;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Filters
  filters: ServiceRequestFilters;
  setFilters: (filters: ServiceRequestFilters) => void;
  clearFilters: () => void;
  
  // Actions
  refreshRequests: () => Promise<void>;
  approveRequest: (id: string, notes?: string) => Promise<void>;
  rejectRequest: (id: string, reason?: string) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  completeRequest: (id: string) => Promise<void>;
  bulkApprove: (ids: string[]) => Promise<void>;
  bulkReject: (ids: string[], reason?: string) => Promise<void>;
  
  // Utilities
  canApprove: (request: ServiceRequest) => boolean;
  canReject: (request: ServiceRequest) => boolean;
  canCancel: (request: ServiceRequest) => boolean;
  canComplete: (request: ServiceRequest) => boolean;
  getStatusColor: (status: string) => string;
  exportToCSV: () => void;
}

export function useServiceRequests(user: User | null): UseServiceRequestsReturn {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceRequestFilters>({});
  
  const { userRole, hasAccess } = useRBAC(user);

  // Fetch service requests with proper error handling
  const fetchServiceRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching service requests...');

      // Get service requests based on user role
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          services:service_id (
            id,
            name,
            category_id,
            service_categories:category_id (
              id,
              name
            )
          ),
          profiles:requester_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'student') {
        // Students can only see their own requests
        query = query.eq('requester_id', user?.id);
      } else if (userRole === 'staff') {
        // Staff can see all requests (for approval/management)
        // No additional filtering needed
      } else if (userRole === 'admin') {
        // Admins can see all requests
        // No additional filtering needed
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch service requests: ${fetchError.message}`);
      }

      // Transform data to match ServiceRequest interface
      const transformedRequests: ServiceRequest[] = (data || []).map(item => {
        try {
          return {
        id: item.id,
        service_id: item.service_id,
        service_name: item.services?.name || 'Unknown Service',
        service_category: item.services?.service_categories?.name || 'Unknown Category',
        requester_id: item.requester_id,
        requester_name: item.profiles?.full_name || 'Unknown User',
        requester_email: item.profiles?.email || '',
        status: item.status,
        level: item.level || 1,
        max_approval_level: item.max_approval_level || 1,
        created_at: item.created_at,
        updated_at: item.updated_at,
        notes: item.notes || '',
        rejection_reason: item.rejection_reason || ''
          };
        } catch (err) {
          console.error('Error transforming service request item:', err, item);
          return null;
        }
      }).filter(Boolean) as ServiceRequest[];

      setRequests(transformedRequests);
      console.log(`✅ Fetched ${transformedRequests.length} service requests`);

    } catch (err) {
      console.error('❌ Error fetching service requests:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRole]);

  // Initial fetch
  useEffect(() => {
    if (user && userRole) {
      fetchServiceRequests();
    }
  }, [user, userRole, fetchServiceRequests]);

  // Apply filters to requests
  const filteredRequests = requests.filter(request => {
    if (filters.status && !filters.status.includes(request.status)) return false;
    if (filters.serviceId && request.service_id !== filters.serviceId) return false;
    if (filters.requesterId && request.requester_id !== filters.requesterId) return false;
    if (filters.level && request.level !== filters.level) return false;
    
    if (filters.createdAfter && new Date(request.created_at) < filters.createdAfter) return false;
    if (filters.createdBefore && new Date(request.created_at) > filters.createdBefore) return false;
    
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      return (
        (request.service_name || '').toLowerCase().includes(searchTerm) ||
        (request.requester_name || '').toLowerCase().includes(searchTerm) ||
        (request.requester_email || '').toLowerCase().includes(searchTerm) ||
        request.status.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  // Calculate statistics
  const stats: ServiceRequestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
    byLevel: requests.reduce((acc, r) => {
      acc[r.level] = (acc[r.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
    byService: requests.reduce((acc, r) => {
      const serviceName = r.service_name || 'Unknown Service';
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Action handlers
  const approveRequest = async (id: string, notes?: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'approved',
          level: 1, // We'll handle level increment in the backend
          notes: notes || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchServiceRequests();
      console.log('✅ Request approved successfully');
    } catch (err) {
      console.error('❌ Error approving request:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (id: string, reason?: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchServiceRequests();
      console.log('✅ Request rejected successfully');
    } catch (err) {
      console.error('❌ Error rejecting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchServiceRequests();
      console.log('✅ Request cancelled successfully');
    } catch (err) {
      console.error('❌ Error cancelling request:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  const completeRequest = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchServiceRequests();
      console.log('✅ Request completed successfully');
    } catch (err) {
      console.error('❌ Error completing request:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete request');
    } finally {
      setLoading(false);
    }
  };

  const bulkApprove = async (ids: string[]) => {
    try {
      setLoading(true);
      
      for (const id of ids) {
        await approveRequest(id);
      }
      
      console.log(`✅ Bulk approved ${ids.length} requests`);
    } catch (err) {
      console.error('❌ Error bulk approving requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk approve requests');
    } finally {
      setLoading(false);
    }
  };

  const bulkReject = async (ids: string[], reason?: string) => {
    try {
      setLoading(true);
      
      for (const id of ids) {
        await rejectRequest(id, reason);
      }
      
      console.log(`✅ Bulk rejected ${ids.length} requests`);
    } catch (err) {
      console.error('❌ Error bulk rejecting requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk reject requests');
    } finally {
      setLoading(false);
    }
  };

  // Permission checks
  const canApprove = (request: ServiceRequest) => {
    if (!userRole) return false;
    if (userRole === 'student') return false;
    if (request.status !== 'pending') return false;
    return userRole === 'admin' || userRole === 'staff';
  };

  const canReject = (request: ServiceRequest) => {
    if (!userRole) return false;
    if (userRole === 'student') return false;
    if (request.status !== 'pending') return false;
    return userRole === 'admin' || userRole === 'staff';
  };

  const canCancel = (request: ServiceRequest) => {
    if (!userRole) return false;
    // Users can cancel their own requests if pending
    if (request.requester_id === user?.id && request.status === 'pending') return true;
    // Admins can cancel any request
    if (userRole === 'admin') return true;
    return false;
  };

  const canComplete = (request: ServiceRequest) => {
    if (!userRole) return false;
    if (userRole === 'student') return false;
    if (request.status !== 'approved') return false;
    return userRole === 'admin' || userRole === 'staff';
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const csvData = filteredRequests.map(request => ({
      ID: request.id,
      Service: request.service_name,
      Requester: request.requester_name,
      Email: request.requester_email,
      Status: request.status,
      Level: request.level,
      Created: new Date(request.created_at).toLocaleDateString(),
      Updated: new Date(request.updated_at).toLocaleDateString()
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    requests,
    filteredRequests,
    stats,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    refreshRequests: fetchServiceRequests,
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
  };
} 