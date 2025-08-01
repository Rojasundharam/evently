'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ClientWrapper from '@/components/ClientWrapper';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useRBAC } from '@/hooks/useRBAC';
import { getDefaultRoute } from '@/lib/rbac';
import { User } from '@supabase/supabase-js';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const rbac = useRBAC(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkSession = async () => {
      try {
        console.log('🔍 Checking session for pathname:', pathname);
        const { data: { session } } = await supabase.auth.getSession();
        
        const newUser = session?.user || null;
        console.log('🔍 Session check result:', { 
          hasSession: !!session, 
          hasUser: !!newUser, 
          userEmail: newUser?.email 
        });
        
        // Only update state if user actually changed
        setUser(prevUser => {
          if ((prevUser === null) !== (newUser === null) || 
              (prevUser?.id !== newUser?.id)) {
            console.log('👤 User state changed:', { 
              from: prevUser?.email || 'null', 
              to: newUser?.email || 'null' 
            });
            return newUser;
          }
          return prevUser;
        });
        
        // If user is authenticated but on login page, redirect to student portal
        if (session && pathname === '/login') {
          console.log('🔄 User authenticated but on login page, redirecting to student portal');
          router.replace('/student');
          return;
        }
        
        // Only redirect if not already on login page, not on callback page, and user is null
        if (!session && pathname !== '/login' && pathname !== '/auth/callback') {
          console.log('🔄 No session, redirecting to login from:', pathname);
          router.replace('/login');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('🔄 Auth state changed:', event, { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email 
      });
      
      const newUser = session?.user || null;
      
      // If user signed in, trigger profile creation
      if (event === 'SIGNED_IN' && newUser) {
        try {
          // Trigger profile creation/update
          const { data: profile, error } = await supabase
            .from('profiles')
            .upsert({
              id: newUser.id,
              email: newUser.email,
              full_name: newUser.user_metadata?.full_name || '',
              role: 'student', // Default role for security
              status: 'active',
              updated_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
            
          if (error) {
            console.log('Profile upsert error (this is normal if table doesn\'t exist):', error.message);
          } else {
            console.log('✅ Profile created/updated successfully');
          }
        } catch (error) {
          console.log('Profile creation error (this is normal if table doesn\'t exist):', error);
        }

        // Redirect to student portal after successful sign in
        if (pathname === '/login') {
          console.log('🎯 Signed in successfully, redirecting to student portal');
          router.replace('/student');
        }
      }
      
      setUser(prevUser => {
        if ((prevUser === null) !== (newUser === null) || 
            (prevUser?.id !== newUser?.id)) {
          console.log('👤 Auth listener - User state changed:', { 
            from: prevUser?.email || 'null', 
            to: newUser?.email || 'null' 
          });
          return newUser;
        }
        return prevUser;
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, mounted]);

  // Add debugging for render decisions
  console.log('🎨 Render decision:', { 
    mounted, 
    loading, 
    hasUser: !!user, 
    userEmail: user?.email,
    pathname 
  });

  // Don't render anything until mounted on client
  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If not logged in, show only the login page (children)
  if (!user && pathname === '/login') {
    console.log('📄 Showing login page');
    return <ClientWrapper showSidebar={false}>{children}</ClientWrapper>;
  }

  // If on callback page, show loading while auth processes
  if (pathname === '/auth/callback') {
    console.log('🔄 On callback page, letting auth process');
    return <div className="flex items-center justify-center min-h-screen">Authenticating...</div>;
  }

  // If not logged in and not on login page, show loading while redirect happens
  if (!user) {
    console.log('🔄 Not logged in, showing redirecting message');
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  // If logged in, show sidebar and children with role-based access control
  console.log('🏠 Showing dashboard with sidebar and RBAC protection');
  return (
    <RoleGuard user={user}>
      <ClientWrapper showSidebar={true} user={user} userRole={rbac.userRole}>
      {children}
    </ClientWrapper>
    </RoleGuard>
  );
} 