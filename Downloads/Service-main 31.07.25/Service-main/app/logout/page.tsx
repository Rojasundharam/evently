'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
        router.replace('/login');
      } catch (error) {
        console.error('Error signing out:', error);
        // Redirect to login even if there's an error
        router.replace('/login');
      }
    };
    
    handleLogout();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Signing out...</h1>
        <p className="text-gray-600">You are being signed out of your account.</p>
      </div>
    </div>
  );
} 