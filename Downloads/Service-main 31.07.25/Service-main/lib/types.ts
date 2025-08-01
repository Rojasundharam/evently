import type { Database } from '@/lib/database.types'


export type ServiceCategory = Database['public']['Tables']['service_categories']['Row']
export type ServiceCategoryInsert = Database['public']['Tables']['service_categories']['Insert']
export type ServiceCategoryUpdate = Database['public']['Tables']['service_categories']['Update']

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

export type ServiceStatus = Database['public']['Enums']['service_status']

export type ServiceWithCategory = Service & {
  service_categories: ServiceCategory
}

export interface ServiceRequest {
  id: string;
  service_id: string;
  service_name?: string;
  service_category?: string;
  requester_id: string;
  requester_name?: string;
  requester_email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  level: number;
  max_approval_level: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  rejection_reason?: string;
}

// New type for approval levels
export interface ServiceApprovalLevel {
  id: string;
  service_id: string;
  level: number;
  staff_id: string;
  staff_name?: string;
  created_at: string;
  updated_at: string;
} 