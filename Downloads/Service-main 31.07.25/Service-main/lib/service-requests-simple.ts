import { supabase } from '@/lib/supabase'

/**
 * Get all service requests in a reliable way without depending on views
 */
export async function getServiceRequestsSimple() {
  try {
    // 1. Get all service requests directly
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
    
    // 2. Detect column names from the first row of data
    const columns = Object.keys(requestsData[0])
    console.log('Service requests columns:', columns)
    
    // Find service_id and requester_id column names - they might be named differently
    const serviceIdCol = columns.find(c => 
      c === 'service_id' || c.includes('service') && c.includes('id')
    ) || 'service_id' // fallback
    
    const requesterIdCol = columns.find(c => 
      c === 'requester_id' || c === 'user_id' || (c.includes('user') && c.includes('id'))
    ) || 'requester_id' // fallback
    
    // 3. Get service names for all service IDs in one batch
    const serviceIds = [...new Set(requestsData.map(r => r[serviceIdCol]))].filter(Boolean)
    
    let serviceMap = new Map()
    if (serviceIds.length > 0) {
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name')
        .in('id', serviceIds)
      
      serviceMap = new Map(
        servicesData?.map(service => [service.id, service.name]) || []
      )
    }
    
    // 4. Get requester names for all requester IDs in one batch
    const requesterIds = [...new Set(requestsData.map(r => r[requesterIdCol]))].filter(Boolean)
    
    let requesterMap = new Map()
    if (requesterIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', requesterIds)
      
      requesterMap = new Map(
        profilesData?.map(profile => [profile.id, profile.full_name]) || []
      )
    }
    
    // 5. Transform the data with consistent column naming
    return requestsData.map(item => ({
      id: item.id,
      service_id: item[serviceIdCol],
      service_name: serviceMap.get(item[serviceIdCol]) || 'Unknown Service',
      requester_id: item[requesterIdCol],
      requester_name: requesterMap.get(item[requesterIdCol]) || 'Unknown User',
      status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
      level: item.level || 1,
      max_approval_level: item.max_approval_level || 1,
      created_at: item.created_at,
      updated_at: item.updated_at
    }))
  } catch (error) {
    console.error('Error in getServiceRequestsSimple:', error)
    return [] // Return empty array instead of crashing
  }
}

/**
 * Get service requests by status without relying on views
 */
export async function getServiceRequestsByStatusSimple(status: string[]) {
  try {
    // Get service requests with the specified status
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
    
    // Detect column names from the first row of data
    const columns = Object.keys(requestsData[0])
    
    // Find service_id and requester_id column names
    const serviceIdCol = columns.find(c => 
      c === 'service_id' || c.includes('service') && c.includes('id')
    ) || 'service_id'
    
    const requesterIdCol = columns.find(c => 
      c === 'requester_id' || c === 'user_id' || (c.includes('user') && c.includes('id'))
    ) || 'requester_id'
    
    // Get service names
    const serviceIds = [...new Set(requestsData.map(r => r[serviceIdCol]))].filter(Boolean)
    let serviceMap = new Map()
    
    if (serviceIds.length > 0) {
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name')
        .in('id', serviceIds)
      
      serviceMap = new Map(
        servicesData?.map(service => [service.id, service.name]) || []
      )
    }
    
    // Get requester names
    const requesterIds = [...new Set(requestsData.map(r => r[requesterIdCol]))].filter(Boolean)
    let requesterMap = new Map()
    
    if (requesterIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', requesterIds)
      
      requesterMap = new Map(
        profilesData?.map(profile => [profile.id, profile.full_name]) || []
      )
    }
    
    // Transform the data
    return requestsData.map(item => ({
      id: item.id,
      service_id: item[serviceIdCol],
      service_name: serviceMap.get(item[serviceIdCol]) || 'Unknown Service',
      requester_id: item[requesterIdCol],
      requester_name: requesterMap.get(item[requesterIdCol]) || 'Unknown User',
      status: item.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
      level: item.level || 1,
      max_approval_level: item.max_approval_level || 1,
      created_at: item.created_at,
      updated_at: item.updated_at
    }))
  } catch (error) {
    console.error('Error in getServiceRequestsByStatusSimple:', error)
    return [] // Return empty array instead of crashing
  }
} 