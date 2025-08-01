import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface PaymentErrorProps {
  searchParams: Promise<{
    message?: string;
  }>;
}

async function PaymentErrorContent({ searchParams }: PaymentErrorProps) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AlertTriangle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl text-orange-600">
            Payment Error
          </CardTitle>
          <CardDescription>
            Something went wrong while processing your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {message && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Error Details:</h4>
              <p className="text-orange-700 text-sm">{decodeURIComponent(message)}</p>
            </div>
          )}

          {/* What to do next */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">What you can do:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Try making the payment again</li>
              <li>• Check your internet connection</li>
              <li>• Use a different browser</li>
              <li>• Contact our support team if the issue persists</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/payment">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild>
                <Link href="/contact">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Get Help
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>

          {/* Support Info */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>For immediate assistance, contact our support team</p>
            <p className="text-xs">Available 24/7 for payment-related issues</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentErrorPage({ searchParams }: PaymentErrorProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <PaymentErrorContent searchParams={searchParams} />
    </Suspense>
  );
} 