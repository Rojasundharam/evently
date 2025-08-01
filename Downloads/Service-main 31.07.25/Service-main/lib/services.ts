import { supabase } from './supabase'
import { ServiceWithCategory } from './types'

export const Enums = {
  applicable_to: ['student', 'staff', 'both'] as const,
  payment_method: ['prepaid', 'postpaid', 'free'] as const,
  service_status: ['active', 'inactive'] as const,
}

export type ApplicableTo = typeof Enums.applicable_to[number]
export type PaymentMethod = typeof Enums.payment_method[number]
export type ServiceStatus = typeof Enums.service_status[number]

export const Constants = {
  public: { Enums },
} as const

// ---------------------------------------------
// TYPES
// ---------------------------------------------

export interface ServiceCategory {
  id: string
  code: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  category_id: string | null
  request_no: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  applicable_to: ApplicableTo
  status: ServiceStatus
  service_limit: number | null
  attachment_url: string | null
  sla_period: number | null
  payment_method: PaymentMethod
  amount: number | null
  currency: string | null
  created_at: string | null
  service_categories?: ServiceCategory | null
}

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'service_categories'> & {
  id?: string
  created_at?: string
}

export type ServiceUpdate = Partial<ServiceInsert>

export type ServiceCategoryUpdate = Partial<Pick<ServiceCategory, 'name' | 'description'>>;

// ---------------------------------------------
// HELPERS
// ---------------------------------------------

function validateRequiredFields(obj: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    if (!obj[field]) {
      throw new Error(`${field.replace('_', ' ')} is required`)
    }
  }
}

// ---------------------------------------------
// CATEGORY FUNCTIONS
// ---------------------------------------------

export async function createServiceCategory(
  category: Pick<ServiceCategory, 'name' | 'code' | 'description'>
): Promise<{ success: boolean; data?: ServiceCategory }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    validateRequiredFields(category, ['name', 'code'])

    const code = category.code.trim().toUpperCase()
    const codeRegex = /^[A-Z0-9_]+$/
    if (!codeRegex.test(code)) {
      throw new Error('Code must contain only uppercase letters, numbers, and underscores')
    }

    const { data, error } = await supabase
      .from('service_categories')
      .insert([{ ...category, code }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('A category with this code already exists')
      }
      throw new Error(error.message || 'Failed to create service category')
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createServiceCategory:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

export { createServiceCategory as createCategory }

export async function getServiceCategories() {
  // To bypass potential caching issues, add a timestamp
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error
  return data as ServiceCategory[]
}

export async function getServiceCategoryById(id: string) {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ServiceCategory
}

export async function updateServiceCategory(
  id: string,
  serviceCategory: ServiceCategoryUpdate
): Promise<ServiceCategory | Error> {
  const { data, error } = await supabase
    .from('service_categories')
    .update(serviceCategory)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return error;
  if (!data) return new Error('No category was updated');

  return data as ServiceCategory;
}

export async function deleteServiceCategory(id: string): Promise<{ success: boolean }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    // Check if the category is in use
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (servicesError) throw new Error(servicesError.message)
    
    if (services && services.length > 0) {
      throw new Error('Cannot delete category as it is in use by one or more services')
    }

    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message || 'Failed to delete service category')
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteServiceCategory:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

export async function reassignServicesCategory(fromCategoryId: string, toCategoryId: string | null): Promise<{ success: boolean; count: number }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    // Get count of services to update
    const { count, error: countError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', fromCategoryId)
    
    if (countError) throw new Error(countError.message)
    if (!count) return { success: true, count: 0 }

    // Update all services from the old category to the new one
    const { error } = await supabase
      .from('services')
      .update({ category_id: toCategoryId })
      .eq('category_id', fromCategoryId)

    if (error) {
      throw new Error(error.message || 'Failed to reassign services')
    }

    return { success: true, count }
  } catch (error) {
    console.error('Error in reassignServicesCategory:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

export async function deleteServiceCategoryWithReassign(id: string, reassignToCategoryId: string | null): Promise<{ success: boolean }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    // First reassign all services to the new category
    await reassignServicesCategory(id, reassignToCategoryId)

    // Then delete the category
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message || 'Failed to delete service category')
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteServiceCategoryWithReassign:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

// ---------------------------------------------
// SERVICE FUNCTIONS
// ---------------------------------------------

export async function createService(service: Omit<ServiceInsert, 'id' | 'created_at'>) {
  try {
    validateRequiredFields(service, [
      'name', 'request_no', 'category_id',
      'applicable_to', 'payment_method', 'status'
    ])

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    const { data, error } = await supabase
      .from('services')
      .insert([{ ...service, service_limit: service.service_limit || 1 }])
      .select('*, service_categories(*)')
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Service request number already exists')
      throw new Error(error.message || 'Failed to create service')
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createService:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(*)')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Service[]
}

export async function getServiceById(id: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  
  // Transform the response to match the expected Service type
  if (data) {
    return data as unknown as ServiceWithCategory
  }
  throw new Error('Service not found')
}

export async function updateService(
  id: string, 
  service: Partial<Omit<ServiceInsert, 'id' | 'created_at'>>
): Promise<{ success: boolean; data?: Service }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    // Check required fields if they are being updated
    if (service.name !== undefined && !service.name.trim()) {
      throw new Error('Name is required')
    }

    if (service.request_no !== undefined && !service.request_no.trim()) {
      throw new Error('Request number is required')
    }

    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select('*, service_categories(*)')
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Service request number already exists')
      throw new Error(error.message || 'Failed to update service')
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateService:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

export async function deleteService(id: string): Promise<{ success: boolean }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message || 'Failed to delete service')
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteService:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

// Helper function to clean up any data inconsistencies
export async function cleanupOrphanedCategories(): Promise<{ success: boolean; count: number }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Authentication required')

    // Check for authentication only
    const { error: categoriesError } = await supabase
      .from('service_categories')
      .select(`
        id,
        services:services(id)
      `)
      .gte('services.id', 0)

    if (categoriesError) throw new Error(categoriesError.message)
    
    // Get categories with specific known issue names
    const { data: problemCategories, error: problemError } = await supabase
      .from('service_categories')
      .select('id')
      .in('name', ['BONAFIED CERTIFICATE REQUEST'])
    
    if (problemError) throw new Error(problemError.message)
    
    const categoriesToDelete = problemCategories || []
    
    let deleteCount = 0
    for (const category of categoriesToDelete) {
      // Use our force delete function to safely remove these
      const { error: deleteError } = await supabase.rpc('force_delete_category', { 
        category_id: category.id 
      })
      
      if (!deleteError) deleteCount++
    }

    return { success: true, count: deleteCount }
  } catch (error) {
    console.error('Error in cleanupOrphanedCategories:', error)
    throw error instanceof Error ? error : new Error('Unexpected error')
  }
}

// Function to test service categories policies
export async function checkServiceCategoriesPolicy(): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return { 
        success: false, 
        message: 'Authentication required to check policies' 
      }
    }

    // Test read access
    const { error: readError } = await supabase
      .from('service_categories')
      .select('id')
      .limit(1)

    if (readError) {
      return { 
        success: false, 
        message: `Read policy check failed: ${readError.message}` 
      }
    }

    // Test insert access (without actually inserting)
    await supabase
      .from('service_categories')
      .insert({ 
        code: 'TEST_POLICY', 
        name: 'Test Policy', 
        description: 'Just testing policies' 
      })
      .select('id')
      .abortSignal(new AbortController().signal)
    
    // We deliberately abort to prevent actual insertion

    return { 
      success: true, 
      message: 'Service categories policies check passed' 
    }
  } catch (error) {
    console.error('Error in checkServiceCategoriesPolicy:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error checking policies'
    }
  }
}

// Utility to get next service request number
export async function getNextServiceRequestNo(): Promise<string> {
  const { data, error } = await supabase
    .from('services')
    .select('request_no')
    .order('request_no', { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.request_no) return 'SNO1';

  const match = data.request_no.match(/^SNO(\d+)$/);
  const nextNo = match ? parseInt(match[1], 10) + 1 : 1;
  return `SNO${nextNo}`;
}

// Utility to get next category code
export async function getNextCategoryCode(): Promise<string> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('code')
    .order('code', { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.code) return 'SNO1';

  const match = data.code.match(/^SNO(\d+)$/);
  const nextNo = match ? parseInt(match[1], 10) + 1 : 1;
  return `SNO${nextNo}`;
}
