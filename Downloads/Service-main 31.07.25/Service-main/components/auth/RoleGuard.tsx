'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRBAC } from '@/hooks/useRBAC';
import { User } from '@supabase/supabase-js';
import { UserRole } from '@/lib/rbac';

interface RoleGuardProps {
  children: React.ReactNode;
  user: User | null;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  children, 
  user, 
  allowedRoles,
  redirectTo,
  fallback 
}: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, loading, error, hasAccess, getRedirectPath } = useRBAC(user);

  useEffect(() => {
    if (loading) return; // Wait for loading to complete

    // If no user, redirect to login
    if (!user) {
      console.log('🚫 RoleGuard: No user, redirecting to login');
      router.replace('/login');
      return;
    }

    // If error fetching user profile, redirect to login
    if (error) {
      console.error('🚫 RoleGuard: Error fetching profile, redirecting to login:', error);
      router.replace('/login');
      return;
    }

    // If no user role found, redirect to login
    if (!userRole) {
      console.log('🚫 RoleGuard: No user role found, redirecting to login');
      router.replace('/login');
      return;
    }

    // Check specific allowed roles if provided
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      console.log(`🚫 RoleGuard: User role ${userRole} not in allowed roles:`, allowedRoles);
      const redirect = redirectTo || getRedirectPath(pathname);
      if (redirect) {
        router.replace(redirect);
      }
      return;
    }

    // Check general route access
    if (!hasAccess(pathname)) {
      console.log(`🚫 RoleGuard: User role ${userRole} cannot access ${pathname}`);
      const redirect = getRedirectPath(pathname);
      if (redirect) {
        console.log(`🔄 RoleGuard: Redirecting to ${redirect}`);
        router.replace(redirect);
      }
      return;
    }

    console.log(`✅ RoleGuard: User role ${userRole} has access to ${pathname}`);
  }, [user, userRole, loading, error, pathname, allowedRoles, redirectTo, hasAccess, getRedirectPath, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show error state or redirect
  if (!user || error || !userRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied or authentication error</p>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check role access
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Your role ({userRole}) is not authorized to access this page.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Check route access
  if (!hasAccess(pathname)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}

// Convenience component for admin-only routes
export function AdminGuard({ children, user }: { children: React.ReactNode; user: User | null }) {
  return (
    <RoleGuard user={user} allowedRoles={['admin']}>
      {children}
    </RoleGuard>
  );
}

// Convenience component for staff-only routes
export function StaffGuard({ children, user }: { children: React.ReactNode; user: User | null }) {
  return (
    <RoleGuard user={user} allowedRoles={['admin', 'staff']}>
      {children}
    </RoleGuard>
  );
}

// Convenience component for student-only routes
export function StudentGuard({ children, user }: { children: React.ReactNode; user: User | null }) {
  return (
    <RoleGuard user={user} allowedRoles={['student']}>
      {children}
    </RoleGuard>
  );
} 