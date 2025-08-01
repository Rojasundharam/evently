'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { myJKKNUserVerification } from '@/lib/myjkkn-user-verification';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

interface MyJKKNVerificationWrapperProps {
  children: React.ReactNode;
}

export default function MyJKKNVerificationWrapper({ children }: MyJKKNVerificationWrapperProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [verificationState, setVerificationState] = useState<{
    loading: boolean;
    verified: boolean;
    error: string | null;
  }>({
    loading: true,
    verified: false,
    error: null
  });

  useEffect(() => {
    const verifyUser = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated || !user?.email) {
        router.push('/login');
        return;
      }

      try {
        setVerificationState({ loading: true, verified: false, error: null });
        
        const result = await myJKKNUserVerification.verifyUser(user.email);
        
        if (result.isValid) {
          setVerificationState({ loading: false, verified: true, error: null });
        } else {
          // Redirect to access denied page
          const params = new URLSearchParams({
            reason: result.error || 'not-in-myjkkn',
            email: user.email
          });
          router.push(`/access-denied?${params.toString()}`);
        }
      } catch (error) {
        console.error('Verification failed:', error);
        setVerificationState({
          loading: false,
          verified: false,
          error: error instanceof Error ? error.message : 'Verification failed'
        });
      }
    };

    verifyUser();
  }, [isAuthenticated, user?.email, authLoading, router]);

  // Show loading while checking auth or verification
  if (authLoading || verificationState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verifying Access</h3>
            <p className="text-gray-600">
              Checking your MyJKKN credentials...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if verification failed
  if (verificationState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
            <p className="text-gray-600 mb-4">
              {verificationState.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If verified, render children
  if (verificationState.verified) {
    return <>{children}</>;
  }

  // Default fallback
  return null;
} 