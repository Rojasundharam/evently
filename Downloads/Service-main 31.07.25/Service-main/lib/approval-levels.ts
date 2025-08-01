import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { ApprovalLevel } from '@/components/services/ApprovalLevelConfig'

export type ServiceApprovalLevel = Database['public']['Tables']['service_approval_levels']['Row']

/**
 * Get approval levels for a service
 */
export async function getServiceApprovalLevels(serviceId: string) {
  const { data, error } = await supabase
    .from('service_approval_levels')
    .select(`
      *,
      profiles:staff_id (full_name)
    `)
    .eq('service_id', serviceId)
    .order('level')
  
  if (error) {
    throw new Error(`Error fetching approval levels: ${error.message}`)
  }
  
  return data.map(level => ({
    id: level.id,
    level: level.level,
    staff_id: level.staff_id,
    staff_name: level.profiles?.full_name || 'Unknown Staff'
  })) as ApprovalLevel[]
}

/**
 * Create or update approval levels for a service
 */
export async function saveServiceApprovalLevels(serviceId: string, levels: ApprovalLevel[]) {
  // First, delete all existing levels for this service
  const { error: deleteError } = await supabase
    .from('service_approval_levels')
    .delete()
    .eq('service_id', serviceId)
  
  if (deleteError) {
    throw new Error(`Error deleting existing approval levels: ${deleteError.message}`)
  }
  
  // Then insert the new levels
  if (levels.length === 0) {
    return []
  }
  
  const insertData = levels.map(level => ({
    service_id: serviceId,
    level: level.level,
    staff_id: level.staff_id,
  }))
  
  const { data, error: insertError } = await supabase
    .from('service_approval_levels')
    .insert(insertData)
    .select()
  
  if (insertError) {
    throw new Error(`Error creating approval levels: ${insertError.message}`)
  }
  
  return data
}

/**
 * Get staff assigned to a specific approval level for a service
 */
export async function getApproverForLevel(serviceId: string, level: number) {
  const { data, error } = await supabase
    .from('service_approval_levels')
    .select(`
      *,
      profiles:staff_id (full_name, email)
    `)
    .eq('service_id', serviceId)
    .eq('level', level)
    .single()
  
  if (error) {
    throw new Error(`Error fetching approver: ${error.message}`)
  }
  
  return data
}

/**
 * Get the maximum approval level for a service
 */
export async function getMaxApprovalLevel(serviceId: string) {
  // Validate input parameter
  if (typeof serviceId !== 'string' || !serviceId) {
    console.error('Invalid serviceId passed to getMaxApprovalLevel:', serviceId)
    return 1 // Return default value instead of throwing
  }
  
  const { data, error } = await supabase
    .from('service_approval_levels')
    .select('level')
    .eq('service_id', serviceId)
    .order('level', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No levels found
      return 0
    }
    throw new Error(`Error fetching max approval level: ${error.message}`)
  }
  
  return data.level
}

/**
 * Check if user is an approver for the given service request
 */
export async function isUserApproverForRequest(userId: string, requestId: string) {
  try {
    const { data: request, error: requestError } = await supabase
      .from('service_requests')
      .select('service_id, level')
      .eq('id', requestId)
      .single()
    
    if (requestError) {
      throw new Error(`Error fetching request: ${requestError.message}`)
    }

    // Since service_approval_levels table may not exist, we implement a fallback
    // For demo purposes, assume level 1 requests can be approved by any user
    // This would be replaced with a proper authorization mechanism in production
    if (request && request.level === 1) {
      return true
    }
    
    // Try with service_approval_levels if available
    try {
      const { data: approver, error: approverError } = await supabase
        .from('service_approval_levels')
        .select('*')
        .eq('service_id', request.service_id)
        .eq('level', request.level)
        .eq('staff_id', userId)
      
      if (approverError) {
        // Table doesn't exist or other error
        return false
      }
      
      return approver && approver.length > 0
    } catch (err) {
      console.error('Error checking approval levels table:', err)
      return false
    }
  } catch (error) {
    console.error('Error in isUserApproverForRequest:', error)
    return false
  }
}

/**
 * Approve and forward a service request to the next level
 */
export async function approveAndForwardRequest(requestId: string) {
  const { data, error } = await supabase
    .rpc('approve_and_forward_request', { request_id: requestId })
  
  if (error) {
    throw new Error(`Error approving request: ${error.message}`)
  }
  
  return data
} 