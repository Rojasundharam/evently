import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface PaymentFailureProps {
  searchParams: Promise<{
    order_id?: string;
    status?: string;
    message?: string;
  }>;
}

async function PaymentFailureContent({ searchParams }: PaymentFailureProps) {
  const { order_id, status, message } = await searchParams;

  const getStatusMessage = (status?: string) => {
    switch (status) {
      case 'failed':
        return 'Payment failed due to a processing error';
      case 'declined':
        return 'Payment was declined by your bank';
      case 'pending':
        return 'Payment is still being processed';
      default:
        return message || 'Payment could not be completed';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'declined':
      case 'failed':
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Payment {status === 'pending' ? 'Pending' : 'Failed'}
          </CardTitle>
          <CardDescription>
            {getStatusMessage(status)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-gray-900">Payment Details</h3>
            {order_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">{order_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold capitalize ${getStatusColor(status)}`}>
                {status || 'Failed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Error Message */}
          {message && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
              <p className="text-red-700 text-sm">{decodeURIComponent(message)}</p>
            </div>
          )}

          {/* Common Reasons */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Common Reasons for Payment Failure:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Insufficient funds in your account</li>
              <li>• Incorrect card details or expired card</li>
              <li>• Bank server temporarily unavailable</li>
              <li>• Transaction limit exceeded</li>
              <li>• Card not enabled for online transactions</li>
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
            <p>Having trouble? Contact our support team</p>
            <p className="text-xs">Reference ID: {order_id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailurePage({ searchParams }: PaymentFailureProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <PaymentFailureContent searchParams={searchParams} />
    </Suspense>
  );
} 