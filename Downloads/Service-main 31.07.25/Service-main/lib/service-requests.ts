import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { getMaxApprovalLevel, approveAndForwardRequest } from '@/lib/approval-levels'

// Define type for the service request status
export type ServiceRequestStatus = Database['public']['Enums']['service_request_status']

// Define a type for the data returned from the database
interface ServiceRequestRecord {
  id: string;
  service_id: string;
  requester_id: string;
  status: ServiceRequestStatus;
  level?: number;
  max_approval_level?: number;
  created_at: string;
  updated_at: string;
  services?: { name: string };
  profiles?: { full_name: string };
  service_name?: string;
  requester_name?: string;
}

/**
 * Get all service requests - with robust fallback
 */
export async function getServiceRequests() {
  try {
    // First try using the view (more reliable)
    try {
      const { data, error } = await supabase
        .from('service_requests_view')
        .select()
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('View query failed:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        return []
      }
      
      // Transform the data to match the ServiceRequest interface
      return data.map((item: ServiceRequestRecord) => ({
        id: item.id,
        service_id: item.service_id,
        service_name: item.service_name || 'Unknown Service',
        requester_id: item.requester_id,
        requester_name: item.requester_name || 'Unknown User',
        status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
        level: item.level || 1,
        max_approval_level: item.max_approval_level || 1,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    } catch (viewError) {
      // Log the view error and continue with fallback
      console.error("View query failed, using fallback:", viewError);
    }
    
    // Fallback approach - get data in multiple queries
    // Get all service requests
    const { data: reqData, error: reqError } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (reqError) {
      throw new Error(`Error fetching service requests: ${reqError.message}`);
    }
    
    if (!reqData || reqData.length === 0) {
      return [];
    }
    
    // Get service names
    const serviceIds = [...new Set(reqData.map(req => req.service_id))];
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .in('id', serviceIds);
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      // Continue without service names
    }
    
    const serviceMap = new Map(
      servicesData?.map(service => [service.id, service.name]) || []
    );
    
    // Get requester names
    const requesterIds = [...new Set(reqData.map(req => req.requester_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', requesterIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profile names
    }
    
    const profileMap = new Map(
      profilesData?.map(profile => [profile.id, profile.full_name]) || []
    );
    
    // Transform the data
    return reqData.map(item => ({
      id: item.id,
      service_id: item.service_id,
      service_name: serviceMap.get(item.service_id) || 'Unknown Service',
      requester_id: item.requester_id,
      requester_name: profileMap.get(item.requester_id) || 'Unknown User',
      status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
      level: item.level || 1,
      max_approval_level: item.max_approval_level || 1,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('Error in getServiceRequests:', error);
    throw new Error(`Error fetching service requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get service requests by status - using the view to avoid relationship issues
 */
export async function getServiceRequestsByStatus(status: string[]) {
  try {
    // Skip trying to use the view since it's causing issues
    // Directly use the fallback approach
    
    // Get service requests with the specified status
    const { data: reqData, error: reqError } = await supabase
      .from('service_requests')
      .select('*')
      .in('status', status)
      .order('created_at', { ascending: false })
    
    if (reqError) {
      throw reqError;
    }
    
    if (!reqData || reqData.length === 0) {
      return [];
    }
    
    // Get service names
    const serviceIds = [...new Set(reqData.map(req => req.service_id))];
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name')
      .in('id', serviceIds);
    
    const serviceMap = new Map(
      servicesData?.map(service => [service.id, service.name]) || []
    );
    
    // Get requester names
    const requesterIds = [...new Set(reqData.map(req => req.requester_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', requesterIds);
    
    const profileMap = new Map(
      profilesData?.map(profile => [profile.id, profile.full_name]) || []
    );
    
    // Transform the data
    return reqData.map(item => ({
      id: item.id,
      service_id: item.service_id,
      service_name: serviceMap.get(item.service_id) || 'Unknown Service',
      requester_id: item.requester_id,
      requester_name: profileMap.get(item.requester_id) || 'Unknown User',
      status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
      level: item.level || 1,
      max_approval_level: item.max_approval_level || 1,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error("Error fetching service requests by status:", error);
    throw new Error(`Error fetching service requests by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get service requests by approver
 */
export async function getServiceRequestsByApprover(staffId: string) {
  try {
    // First get all pending requests, then filter based on approval permissions
    // This avoids the need to query the potentially problematic service_approval_levels table
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'pending')
    
    if (pendingError) {
      console.error('Error fetching pending requests:', pendingError);
      return [];
    }
    
    if (!pendingRequests || pendingRequests.length === 0) {
      return []; // No pending requests to approve
    }
    
    let approverRequests = [];
    
    // First try to get approval levels from the service_approval_levels table
    try {
      const { data: approvalLevels } = await supabase
        .from('service_approval_levels')
        .select('service_id, level')
        .eq('staff_id', staffId)
      
      if (approvalLevels && approvalLevels.length > 0) {
        // Create a map of service_id to levels this staff can approve
        const approvalMap = new Map();
        for (const level of approvalLevels) {
          approvalMap.set(`${level.service_id}_${level.level}`, true);
        }
        
        // Filter the pending requests to only those this staff can approve
        approverRequests = pendingRequests.filter(request => 
          approvalMap.has(`${request.service_id}_${request.level}`)
        );
      }
    } catch (approvalError) {
      console.log('Could not get approval levels, using fallback approach:', approvalError);
      
      // Fallback: Check if the user has admin role and show all pending requests
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', staffId);
        
        if (userRoles && userRoles.length > 0) {
          const { data: roles } = await supabase
            .from('roles')
            .select('name')
            .in('id', userRoles.map(ur => ur.role_id));
          
          // If user is an admin, show all pending requests
          if (roles && roles.some(role => role.name === 'admin')) {
            approverRequests = pendingRequests;
          }
        }
      } catch (roleError) {
        console.log('Role check failed, showing no requests:', roleError);
      }
    }
    
    if (approverRequests.length === 0) {
      return [];
    }
    
    // Get service names in a separate query
    const requestServiceIds = [...new Set(approverRequests.map(req => req.service_id))];
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .in('id', requestServiceIds);
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    }
    
    const serviceMap = new Map(
      servicesData?.map(service => [service.id, service.name]) || []
    );
    
    // Get requester names in a separate query
    const requesterIds = [...new Set(approverRequests.map(req => req.requester_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', requesterIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }
    
    const profileMap = new Map(
      profilesData?.map(profile => [profile.id, profile.full_name]) || []
    );
    
    // Transform the filtered requests
    return approverRequests.map(item => ({
      id: item.id,
      service_id: item.service_id,
      service_name: serviceMap.get(item.service_id) || 'Unknown Service',
      requester_id: item.requester_id,
      requester_name: profileMap.get(item.requester_id) || 'Unknown User',
      status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
      level: item.level || 1,
      max_approval_level: item.max_approval_level || 1,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('Error in getServiceRequestsByApprover:', error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
}

/**
 * Get a single service request by ID
 */
export async function getServiceRequestById(id: string) {
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      services(name),
      profiles:requester_id(full_name)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    throw new Error(`Error fetching service request: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('Service request not found')
  }
  
  // Transform the data
  return {
    id: data.id,
    service_id: data.service_id,
    service_name: data.services?.name || 'Unknown Service',
    requester_id: data.requester_id,
    requester_name: data.profiles?.full_name || 'Unknown User',
    status: data.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
    level: data.level || 1,
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

/**
 * Create a new service request
 */
export async function createServiceRequest(serviceId: string, requesterId: string) {
  // Validate input parameters
  if (typeof serviceId !== 'string' || !serviceId) {
    throw new Error('Invalid serviceId: must be a non-empty string')
  }
  
  if (typeof requesterId !== 'string' || !requesterId) {
    throw new Error('Invalid requesterId: must be a non-empty string')
  }
  
  // Get max approval level for this service
  let maxLevel = 1
  try {
    maxLevel = await getMaxApprovalLevel(serviceId)
    if (maxLevel === 0) maxLevel = 1 // Fallback to 1 if no approval levels defined
  } catch (error) {
    console.error('Failed to get max approval level, using default:', error)
  }
  
  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      service_id: serviceId,
      requester_id: requesterId,
      status: 'pending',
      level: 1
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Error creating service request: ${error.message}`)
  }
  
  return data
}

/**
 * Update a service request status
 */
export async function updateServiceRequestStatus(
  id: string, 
  status: ServiceRequestStatus, 
  level?: number
): Promise<void> {
  const { error } = await supabase
    .from('service_requests')
    .update({ 
      status,
      level,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update service request status: ${error.message}`)
  }
}

/**
 * Approve a service request and move to next level
 */
export async function approveServiceRequest(id: string) {
  try {
    return await approveAndForwardRequest(id)
  } catch (error) {
    // Fallback to the old implementation if RPC fails
    console.error('RPC failed, using fallback implementation:', error)
    
    // First get the current level
    const { data: currentRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('level, max_approval_level')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      throw new Error(`Error fetching service request: ${fetchError.message}`)
    }
    
    const newLevel = (currentRequest?.level || 1) + 1
    const maxLevel = currentRequest?.max_approval_level || 1
    
    // If we've reached the max level, set status to completed
    const newStatus = newLevel > maxLevel ? 'completed' : 'approved'
    
    // Then update the request
    return updateServiceRequestStatus(id, newStatus, newLevel)
  }
}

/**
 * Reject a service request
 */
export async function rejectServiceRequest(id: string) {
  return updateServiceRequestStatus(id, 'rejected')
}

/**
 * Cancel a service request
 */
export async function cancelServiceRequest(id: string) {
  return updateServiceRequestStatus(id, 'cancelled')
}

/**
 * Complete a service request
 */
export async function completeServiceRequest(id: string) {
  return updateServiceRequestStatus(id, 'completed')
} 