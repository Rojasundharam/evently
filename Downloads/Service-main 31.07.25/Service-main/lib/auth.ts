import { redirect } from 'next/navigation'
import { supabase } from './supabase'
import type { Database } from '@/lib/database.types'


export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

export type Role = Database['public']['Tables']['roles']['Row']['name']

export async function assignRole(userEmail: string, role: Role) {
  await supabase
    .rpc('assign_role', {
      user_id: userEmail, // Assuming user_email should be user_id
      role_id: role // Assuming role_name should be role_id
    })
}

export async function checkUserRole(role: Role): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('approve_service_request', {
      request_id: role
    })

  if (error) throw error
  return data || false
}

export async function getUserRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role:roles(name)
    `)

  if (error) throw error
  return (data || []).map(item => (item.role as { name: Role }).name)
} 