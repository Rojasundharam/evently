'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserRole, 
  hasAccess, 
  getAccessibleNavItems, 
  canAccessNavItem,
  getDefaultRoute,
  getRedirectPath,
  NavigationItem
} from '@/lib/rbac';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
}

interface UseRBACReturn {
  userRole: UserRole | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasAccess: (route: string) => boolean;
  getAccessibleNavItems: () => NavigationItem[];
  canAccessNavItem: (item: NavigationItem) => boolean;
  getDefaultRoute: () => string;
  getRedirectPath: (currentPath: string) => string | null;
  refreshUserProfile: () => Promise<void>;
}

export function useRBAC(user: User | null): UseRBACReturn {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!user) {
      setUserRole(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 RBAC: Fetching user profile for:', user.email);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ RBAC: Error fetching user profile:', profileError);
        
        // Handle specific RLS infinite recursion error
        if (profileError.message.includes('infinite recursion')) {
          console.log('🔄 RBAC: Detected RLS infinite recursion - using fallback');
          
          // Fallback: Create a basic profile with default student role
          const fallbackProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            role: 'student' as UserRole,
            status: 'active'
          };
          
          setUserRole('student');
          setUserProfile(fallbackProfile);
          setError('Using fallback profile due to RLS configuration issue');
          return;
        }
        
        setError(`Failed to fetch user profile: ${profileError.message}`);
        setUserRole(null);
        setUserProfile(null);
        return;
      }

      if (!profile) {
        console.error('❌ RBAC: No profile found for user');
        setError('User profile not found');
        setUserRole(null);
        setUserProfile(null);
        return;
      }

      console.log('✅ RBAC: User profile loaded:', {
        email: profile.email,
        role: profile.role,
        status: profile.status
      });

      setUserRole(profile.role as UserRole);
      setUserProfile(profile as UserProfile);

    } catch (err) {
      console.error('❌ RBAC: Unexpected error:', err);
      
      // Handle any other unexpected errors with fallback
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('infinite recursion')) {
        console.log('🔄 RBAC: Detected RLS infinite recursion in catch - using fallback');
        
        const fallbackProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          role: 'student' as UserRole,
          status: 'active'
        };
        
        setUserRole('student');
        setUserProfile(fallbackProfile);
        setError('Using fallback profile due to RLS configuration issue');
      } else {
        setError('Unexpected error fetching user profile');
        setUserRole(null);
        setUserProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile when user changes
  useEffect(() => {
    fetchUserProfile();
  }, [user?.id]);

  // Subscribe to profile changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 RBAC: Profile changed:', payload);
          fetchUserProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    userRole,
    userProfile,
    loading,
    error,
    hasAccess: (route: string) => hasAccess(userRole, route),
    getAccessibleNavItems: () => getAccessibleNavItems(userRole),
    canAccessNavItem: (item: NavigationItem) => canAccessNavItem(userRole, item),
    getDefaultRoute: () => userRole ? getDefaultRoute(userRole) : '/',
    getRedirectPath: (currentPath: string) => getRedirectPath(userRole, currentPath),
    refreshUserProfile: fetchUserProfile
  };
} 