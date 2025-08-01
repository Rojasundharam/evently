/**
 * Access Denied Page
 * Shown when user is not found in MyJKKN lists
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getErrorMessage = (reason: string | null) => {
    switch (reason) {
      case 'not-in-myjkkn':
        return 'Your account was not found in the MyJKKN staff or student database. Only registered MyJKKN users can access this application.';
      case 'verification-failed':
        return 'We could not verify your account at this time. Please try again later.';
      case 'no-email':
        return 'Your account does not have a valid email address.';
      default:
        return 'You do not have permission to access this application.';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            {getErrorMessage(reason)}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
            <p className="text-sm text-blue-800 mb-3">
              If you believe this is an error, please contact your institution's IT support or ensure:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You are a registered MyJKKN staff member or student</li>
              <li>• Your email matches your MyJKKN account</li>
              <li>• Your account is active in the MyJKKN system</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Link href="/logout" passHref>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="mailto:support@jkkn.ac.in">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 