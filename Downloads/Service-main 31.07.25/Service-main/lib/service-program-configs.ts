/**
 * Service Program Configurations
 * Handles the program-specific service access configurations
 */

import { supabase } from '@/lib/supabase'

export interface ServiceProgramConfig {
  id: string
  service_id: string
  program_id: string
  program_name: string
  admission_year: string
  intake: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export type ServiceProgramConfigInsert = Omit<ServiceProgramConfig, 'id' | 'created_at' | 'updated_at'>

/**
 * Save service program configurations
 */
export async function saveServiceProgramConfigs(
  serviceId: string, 
  serviceType: 'all' | 'program_specific',
  configs: Omit<ServiceProgramConfig, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]
): Promise<ServiceProgramConfig[]> {
  try {
    // First, delete existing configurations for this service
    const { error: deleteError } = await supabase
      .from('service_program_configs')
      .delete()
      .eq('service_id', serviceId)
    
    if (deleteError) {
      console.error('Error deleting existing service program configs:', deleteError)
      throw new Error('Failed to update service program configurations')
    }

    // If service type is 'all', we don't need to insert any specific configurations
    if (serviceType === 'all' || configs.length === 0) {
      return []
    }

    // Insert new configurations
    const insertData = configs.map(config => ({
      service_id: serviceId,
      program_id: config.program_id,
      program_name: config.program_name,
      admission_year: config.admission_year,
      intake: config.intake,
      status: config.status
    }))

    const { data, error } = await supabase
      .from('service_program_configs')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error saving service program configs:', error)
      throw new Error('Failed to save service program configurations')
    }

    return data || []
  } catch (error) {
    console.error('Error in saveServiceProgramConfigs:', error)
    throw error instanceof Error ? error : new Error('Unexpected error saving service program configurations')
  }
}

/**
 * Get service program configurations by service ID
 */
export async function getServiceProgramConfigs(serviceId: string): Promise<ServiceProgramConfig[]> {
  try {
    const { data, error } = await supabase
      .from('service_program_configs')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching service program configs:', error)
      throw new Error('Failed to fetch service program configurations')
    }

    return data || []
  } catch (error) {
    console.error('Error in getServiceProgramConfigs:', error)
    throw error instanceof Error ? error : new Error('Unexpected error fetching service program configurations')
  }
}

/**
 * Check if a service is available for a specific program/year/intake combination
 */
export async function isServiceAvailableForProgram(
  serviceId: string,
  programId: string,
  admissionYear?: string,
  intake?: string
): Promise<boolean> {
  try {
    // First check if there are any program-specific configurations for this service
    const { data: configs, error } = await supabase
      .from('service_program_configs')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'active')

    if (error) {
      console.error('Error checking service availability:', error)
      return false
    }

    // If no program-specific configurations exist, service is available to all
    if (!configs || configs.length === 0) {
      return true
    }

    // Check if there's a matching configuration
    const matchingConfig = configs.find(config => {
      let matches = config.program_id === programId

      if (admissionYear && matches) {
        matches = config.admission_year === admissionYear
      }

      if (intake && matches) {
        matches = config.intake === intake
      }

      return matches
    })

    return !!matchingConfig
  } catch (error) {
    console.error('Error in isServiceAvailableForProgram:', error)
    return false
  }
}

/**
 * Get services available for a specific program/year/intake combination
 */
export async function getAvailableServicesForProgram(
  programId: string,
  admissionYear?: string,
  intake?: string
): Promise<string[]> {
  try {
    // Get all services that either have no program restrictions or have matching configurations
    const { data: allServices, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('status', 'active')

    if (servicesError || !allServices) {
      console.error('Error fetching services:', servicesError)
      return []
    }

    const availableServiceIds: string[] = []

    for (const service of allServices) {
      const isAvailable = await isServiceAvailableForProgram(
        service.id,
        programId,
        admissionYear,
        intake
      )

      if (isAvailable) {
        availableServiceIds.push(service.id)
      }
    }

    return availableServiceIds
  } catch (error) {
    console.error('Error in getAvailableServicesForProgram:', error)
    return []
  }
} 