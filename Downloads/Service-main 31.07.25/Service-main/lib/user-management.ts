import { supabase } from '@/lib/supabase'

export type UserRole = 'admin' | 'staff' | 'student'
export type UserStatus = 'active' | 'inactive'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  role: UserRole
  status: UserStatus
  last_sign_in_at?: string
}

export interface CreateUserData {
  email: string
  full_name: string
  role: UserRole
  status?: UserStatus
  password?: string
}

export interface UpdateUserData {
  full_name?: string
  role?: UserRole
  status?: UserStatus
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  staffUsers: number
  studentUsers: number
  inactiveUsers: number
}

// Debug function to check database status
export async function debugDatabaseStatus(): Promise<{
  hasSession: boolean;
  sessionUserId?: string;
  profilesTableExists: boolean;
  profilesCount: number;
  canReadProfiles: boolean;
  error?: string;
}> {
  try {
    console.log('🔍 DEBUG: Starting database status check...');
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 DEBUG: Session check result:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      sessionError: sessionError?.message 
    });

    if (sessionError) {
      return {
        hasSession: false,
        profilesTableExists: false,
        profilesCount: 0,
        canReadProfiles: false,
        error: `Session error: ${sessionError.message}`
      };
    }

    if (!session) {
      return {
        hasSession: false,
        profilesTableExists: false,
        profilesCount: 0,
        canReadProfiles: false,
        error: 'No active session'
      };
    }

    // Check if profiles table exists and is accessible
    console.log('🔍 DEBUG: Checking profiles table access...');
    const { data: profiles, error: profilesError, count } = await supabase
      .from('profiles')
      .select('id, email, role, status', { count: 'exact' });

    console.log('🔍 DEBUG: Profiles query result:', {
      profilesCount: count || 0,
      profilesLength: profiles?.length || 0,
      error: profilesError?.message,
      errorCode: profilesError?.code,
      firstProfile: profiles?.[0]
    });

    return {
      hasSession: true,
      sessionUserId: session.user.id,
      profilesTableExists: !profilesError,
      profilesCount: count || 0,
      canReadProfiles: !!profiles && !profilesError,
      error: profilesError?.message
    };

  } catch (error) {
    console.error('🔍 DEBUG: Database status check failed:', error);
    return {
      hasSession: false,
      profilesTableExists: false,
      profilesCount: 0,
      canReadProfiles: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all users - SAFE VERSION (no recursion) with enhanced debugging
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    console.log('📊 getAllUsers: Starting...');
    
    // First run debug check
    const debugInfo = await debugDatabaseStatus();
    console.log('📊 getAllUsers: Debug info:', debugInfo);

    if (!debugInfo.hasSession) {
      console.warn('📊 getAllUsers: No session, returning empty array');
      return [];
    }

    if (!debugInfo.canReadProfiles) {
      console.error('📊 getAllUsers: Cannot read profiles table:', debugInfo.error);
      return [];
    }

    // Try to fetch profiles with detailed logging
    console.log('📊 getAllUsers: Fetching profiles...');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at,
        role,
        status,
        last_sign_in_at
      `)
      .order('created_at', { ascending: false });

    console.log('📊 getAllUsers: Query completed:', {
      profilesCount: profiles?.length || 0,
      error: error?.message,
      errorCode: error?.code,
      firstProfile: profiles?.[0]
    });

    if (error) {
      console.error('📊 getAllUsers: Query error:', error);
      if (error.code === 'PGRST301' || error.message.includes('policy')) {
        console.log('📊 getAllUsers: RLS policy restriction, trying current user only');
        return await getCurrentUserProfile();
      }
      return [];
    }

    const users: UserProfile[] = (profiles || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: (profile.role as UserRole) || 'student',
      status: (profile.status as UserStatus) || 'active',
      last_sign_in_at: profile.last_sign_in_at || undefined
    }));

    console.log(`📊 getAllUsers: Successfully fetched ${users.length} users`);
    return users;
  } catch (error) {
    console.error('📊 getAllUsers: Unexpected error:', error);
    // Fallback to current user
    return await getCurrentUserProfile();
  }
}

/**
 * Get current user profile only - SAFE FALLBACK
 */
async function getCurrentUserProfile(): Promise<UserProfile[]> {
  try {
    console.log('👤 getCurrentUserProfile: Starting...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('👤 getCurrentUserProfile: No user found');
      return [];
    }

    console.log('👤 getCurrentUserProfile: Fetching profile for user:', user.id);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('👤 getCurrentUserProfile: Error fetching profile:', error);
      return [];
    }

    if (!profile) {
      console.log('👤 getCurrentUserProfile: No profile found for user');
      return [];
    }

    console.log('👤 getCurrentUserProfile: Profile found:', profile);
    return [{
      id: profile.id,
      email: profile.email || user.email || '',
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: (profile.role as UserRole) || 'student',
      status: (profile.status as UserStatus) || 'active',
      last_sign_in_at: profile.last_sign_in_at
    }];
  } catch (error) {
    console.error('👤 getCurrentUserProfile: Unexpected error:', error);
    return [];
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  try {
    console.log('🔍 getUserById: Fetching user:', id);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profile) {
      console.error('🔍 getUserById: Error:', error);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: (profile.role as UserRole) || 'student',
      status: (profile.status as UserStatus) || 'active',
      last_sign_in_at: profile.last_sign_in_at
    };
  } catch (error) {
    console.error('🔍 getUserById: Unexpected error:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserData): Promise<UserProfile> {
  try {
    console.log('➕ createUser: Creating user:', userData.email);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || generateRandomPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      }
    });

    if (authError || !authData.user) {
      console.error('➕ createUser: Auth error:', authError);
      throw new Error(`Failed to create user: ${authError?.message || 'Unknown error'}`);
    }

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        status: userData.status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('➕ createUser: Profile error:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log('➕ createUser: User created successfully');
    return {
      id: authData.user.id,
      email: authData.user.email || '',
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: authData.user.created_at,
      updated_at: profile.updated_at,
      role: profile.role as UserRole,
      status: profile.status as UserStatus
    };
  } catch (error) {
    console.error('➕ createUser: Unexpected error:', error);
    throw error;
  }
}

/**
 * Update user - SAFE VERSION
 */
export async function updateUser(id: string, userData: UpdateUserData): Promise<UserProfile | null> {
  try {
    console.log('✏️ updateUser: Updating user:', id, userData);
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('✏️ updateUser: Error:', error);
      return null;
    }

    console.log('✏️ updateUser: User updated successfully');
    return {
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: (profile.role as UserRole) || 'student',
      status: (profile.status as UserStatus) || 'active',
      last_sign_in_at: profile.last_sign_in_at
    };
  } catch (error) {
    console.error('✏️ updateUser: Unexpected error:', error);
    return null;
  }
}

/**
 * Delete user (deactivate)
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    console.log('🗑️ deleteUser: Deactivating user:', id);
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('🗑️ deleteUser: Error:', error);
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
    console.log('🗑️ deleteUser: User deactivated successfully');
  } catch (error) {
    console.error('🗑️ deleteUser: Unexpected error:', error);
    throw error;
  }
}

/**
 * Toggle user status
 */
export async function toggleUserStatus(userId: string): Promise<UserStatus | null> {
  try {
    console.log('🔄 toggleUserStatus: Toggling status for user:', userId);
    const user = await getUserById(userId);
    if (!user) return null;

    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    const updatedUser = await updateUser(userId, { status: newStatus });
    
    return updatedUser?.status || null;
  } catch (error) {
    console.error('🔄 toggleUserStatus: Unexpected error:', error);
    return null;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  try {
    console.log('🎭 updateUserRole: Updating role for user:', userId, 'to:', newRole);
    const updatedUser = await updateUser(userId, { role: newRole });
    return updatedUser !== null;
  } catch (error) {
    console.error('🎭 updateUserRole: Unexpected error:', error);
    return false;
  }
}

/**
 * Get user stats - SAFE VERSION with enhanced debugging
 */
export async function getUserStats(): Promise<UserStats | null> {
  try {
    console.log('📈 getUserStats: Calculating statistics...');
    const users = await getAllUsers();
    
    const stats: UserStats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      staffUsers: users.filter(u => u.role === 'staff').length,
      studentUsers: users.filter(u => u.role === 'student').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
    };

    console.log('📈 getUserStats: Statistics calculated:', stats);
    return stats;
  } catch (error) {
    console.error('📈 getUserStats: Unexpected error:', error);
    return null;
  }
}

/**
 * Search users - SAFE VERSION
 */
export async function searchUsers(query: string): Promise<UserProfile[]> {
  try {
    console.log('🔍 searchUsers: Searching for:', query);
    if (!query.trim()) {
      return await getAllUsers();
    }

    const users = await getAllUsers();
    const searchLower = query.toLowerCase();
    
    const results = users.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchLower))
    );

    console.log(`🔍 searchUsers: Found ${results.length} results for "${query}"`);
    return results;
  } catch (error) {
    console.error('🔍 searchUsers: Unexpected error:', error);
    return [];
  }
}

/**
 * Subscribe to real-time user changes with enhanced debugging
 */
export function subscribeToUserChanges(callback: (users: UserProfile[]) => void) {
  console.log('🔄 subscribeToUserChanges: Setting up realtime subscription...');
  
  const subscription = supabase
    .channel('user-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles'
      },
      async (payload) => {
        console.log('🔄 subscribeToUserChanges: Received realtime update:', payload);
        try {
          const users = await getAllUsers();
          console.log('🔄 subscribeToUserChanges: Fetched updated users, calling callback with', users.length, 'users');
          callback(users);
        } catch (error) {
          console.error('🔄 subscribeToUserChanges: Error handling realtime change:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log('🔄 subscribeToUserChanges: Subscription status:', status);
    });

  return subscription;
}

/**
 * Cleanup - for removing old functions
 */
export async function assignUserRole(): Promise<void> {
  // Deprecated - use updateUserRole instead
}

export async function initializeRoles(): Promise<void> {
  // Deprecated - roles are managed in profiles table
}

function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
} 