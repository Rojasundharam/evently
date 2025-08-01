'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserCircle, Calendar, Mail, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get user session data
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Format the last sign in date if available
          if (session.user.last_sign_in_at) {
            const lastSignIn = new Date(session.user.last_sign_in_at);
            setLastLogin(lastSignIn.toLocaleString());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-lg max-w-lg mx-auto shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p>You must be logged in to view this page.</p>
          <Link href="/" className="mt-4 inline-flex items-center text-red-700 hover:text-red-800 font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-5 mb-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">My Profile</h1>
        <Link 
          href="/" 
          className="px-4 py-2 bg-white border border-gray-200 rounded-md flex items-center text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 p-6">
            <div className="flex items-center">
              <div className="bg-primary-50 p-4 rounded-full mr-5 shadow-sm">
                <UserCircle className="h-14 w-14 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">User Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Your account information and preferences</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Email */}
            <div className="flex items-start">
              <div className="bg-gray-50 p-3 rounded-lg mr-5 shadow-sm">
                <Mail className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                <p className="text-base font-medium text-gray-800">{user.email}</p>
              </div>
            </div>
            
            {/* Last Login */}
            <div className="flex items-start">
              <div className="bg-gray-50 p-3 rounded-lg mr-5 shadow-sm">
                <LogIn className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Login</p>
                <p className="text-base font-medium text-gray-800">{lastLogin || 'Not available'}</p>
              </div>
            </div>
            
            {/* Created At */}
            <div className="flex items-start">
              <div className="bg-gray-50 p-3 rounded-lg mr-5 shadow-sm">
                <Calendar className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Account Created</p>
                <p className="text-base font-medium text-gray-800">
                  {user.created_at ? new Date(user.created_at).toLocaleString() : 'Not available'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 mt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium">
                  Edit Profile
                </button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 