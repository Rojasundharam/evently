import { supabase } from '@/lib/supabase'
import { ServiceRequest } from '@/lib/types'

/**
 * Fallback implementation that doesn't rely on relationship queries
 * Get all service requests
 */
export async function getServiceRequestsFallback() {
  // First, get all the service requests
  const { data: requestsData, error: requestsError } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (requestsError) {
    throw new Error(`Error fetching service requests: ${requestsError.message}`)
  }
  
  if (!requestsData || requestsData.length === 0) {
    return []
  }
  
  // Create a map to collect service names
  const serviceIds = [...new Set(requestsData.map(req => req.service_id))]
  const { data: servicesData } = await supabase
    .from('services')
    .select('id, name')
    .in('id', serviceIds)
  
  const serviceMap = new Map(
    servicesData?.map(service => [service.id, service.name]) || []
  )
  
  // Create a map to collect requester names
  const requesterIds = [...new Set(requestsData.map(req => req.requester_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', requesterIds)
  
  const profileMap = new Map(
    profilesData?.map(profile => [profile.id, profile.full_name]) || []
  )
  
  // Transform the data
  return requestsData.map(item => ({
    id: item.id,
    service_id: item.service_id,
    service_name: serviceMap.get(item.service_id) || 'Unknown Service',
    requester_id: item.requester_id,
    requester_name: profileMap.get(item.requester_id) || 'Unknown User',
    status: item.status,
    level: item.level || 1,
    max_approval_level: item.max_approval_level || 1,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) as ServiceRequest[]
}

/**
 * Fallback implementation that doesn't rely on relationship queries
 * Get service requests by status
 */
export async function getServiceRequestsByStatusFallback(status: string[]) {
  // First, get service requests with the specified status
  const { data: requestsData, error: requestsError } = await supabase
    .from('service_requests')
    .select('*')
    .in('status', status)
    .order('created_at', { ascending: false })
  
  if (requestsError) {
    throw new Error(`Error fetching service requests: ${requestsError.message}`)
  }
  
  if (!requestsData || requestsData.length === 0) {
    return []
  }
  
  // Create a map to collect service names
  const serviceIds = [...new Set(requestsData.map(req => req.service_id))]
  const { data: servicesData } = await supabase
    .from('services')
    .select('id, name')
    .in('id', serviceIds)
  
  const serviceMap = new Map(
    servicesData?.map(service => [service.id, service.name]) || []
  )
  
  // Create a map to collect requester names
  const requesterIds = [...new Set(requestsData.map(req => req.requester_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', requesterIds)
  
  const profileMap = new Map(
    profilesData?.map(profile => [profile.id, profile.full_name]) || []
  )
  
  // Transform the data
  return requestsData.map(item => ({
    id: item.id,
    service_id: item.service_id,
    service_name: serviceMap.get(item.service_id) || 'Unknown Service',
    requester_id: item.requester_id,
    requester_name: profileMap.get(item.requester_id) || 'Unknown User',
    status: item.status,
    level: item.level || 1,
    max_approval_level: item.max_approval_level || 1,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) as ServiceRequest[]
}

/**
 * Fallback implementation that doesn't rely on relationship queries
 * Get service requests by approver
 */
export async function getServiceRequestsByApproverFallback(staffId: string) {
  try {
    // Get all pending requests that this staff member can approve
    const { data: requestsData, error: requestsError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (requestsError) {
      throw new Error(`Error fetching service requests: ${requestsError.message}`)
    }
    
    if (!requestsData || requestsData.length === 0) {
      return []
    }
    
    // Get service names
    const serviceIds = [...new Set(requestsData.map(req => req.service_id))]
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name')
      .in('id', serviceIds)
    
    const serviceMap = new Map(
      servicesData?.map(service => [service.id, service.name]) || []
    )
    
    // Get requester names
    const requesterIds = [...new Set(requestsData.map(req => req.requester_id))]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', requesterIds)
    
    const profileMap = new Map(
      profilesData?.map(profile => [profile.id, profile.full_name]) || []
    )
    
    // Check if staff member is an approver for each request
    const { data: approverData } = await supabase
      .from('service_approval_levels')
      .select('service_id, level')
      .eq('staff_id', staffId)
    
    const approverMap = new Map(
      approverData?.map(approval => [`${approval.service_id}-${approval.level}`, true]) || []
    )
    
    // Filter requests where staff is an approver at the current level
    const filteredRequests = requestsData.filter(req => 
      approverMap.has(`${req.service_id}-${req.level || 1}`)
    )
    
    // Transform the data
    return filteredRequests.map(item => ({
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
    })) as ServiceRequest[]
  } catch (error) {
    console.error('Error in getServiceRequestsByApproverFallback:', error)
    return []
  }
} 