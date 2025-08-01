'use client';

import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Home, Receipt, User, Calendar, CreditCard, Hash } from 'lucide-react';
import Link from 'next/link';
import { PaymentSuccessHandler } from '@/components/payments/payment-success-handler';
import { ReceiptDownloadButton } from '@/components/payments/receipt-download-button';

interface PaymentSuccessProps {
  searchParams: Promise<{
    order_id?: string;
    transaction_id?: string;
  }>;
}

function PaymentSuccessContent({ searchParams }: PaymentSuccessProps) {
  const [mounted, setMounted] = useState(false);
  const [orderData, setOrderData] = useState<{order_id?: string; transaction_id?: string}>({});

  useEffect(() => {
    const loadData = async () => {
      const params = await searchParams;
      setOrderData(params);
      setMounted(true);
    };
    loadData();
  }, [searchParams]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading payment details...</div>
      </div>
    );
  }

  const { order_id, transaction_id } = orderData;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        {/* Header Section */}
        <CardHeader className="text-center bg-green-50 border-b">
          <div className="mx-auto mb-4">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
              <div className="absolute inset-0 animate-ping">
                <CheckCircle className="h-20 w-20 text-green-400 opacity-75" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl text-green-600 font-bold">
            🎉 Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Your payment has been processed successfully
          </CardDescription>
          
          {/* Success Badge */}
          <div className="mt-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
              <CheckCircle className="w-4 h-4 mr-2" />
              Payment Confirmed
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Receipt-Style Payment Details */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-inner">
            <div className="text-center border-b pb-4 mb-4">
              <Receipt className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <h3 className="text-xl font-bold text-gray-900">Payment Receipt</h3>
              <p className="text-sm text-gray-500">JKKN Service Payment</p>
            </div>

            <div className="space-y-4">
              {/* Order Information */}
              {order_id && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <Hash className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="font-medium text-gray-700">Order ID</span>
                  </div>
                  <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{order_id}</span>
                </div>
              )}

              {/* Transaction Information */}
              {transaction_id && transaction_id !== 'undefined' && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="font-medium text-gray-700">Transaction ID</span>
                  </div>
                  <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{transaction_id}</span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="font-medium text-gray-700">Payment Status</span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  ✓ Completed
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="font-medium text-gray-700">Payment Date</span>
                </div>
                <span className="text-gray-900">{new Date().toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>

              {/* Customer */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="font-medium text-gray-700">Customer</span>
                </div>
                <span className="text-gray-900">ROJA SUNDHARAM</span>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <h4 className="text-lg font-semibold text-green-800">Payment Completed Successfully!</h4>
                <p className="text-green-700 mt-1">
                  Thank you for your payment. A confirmation email has been sent to your registered email address.
                  Your service request will be processed shortly.
                </p>
              </div>
            </div>
          </div>

          {/* Service Request Handler */}
          {order_id && <PaymentSuccessHandler orderId={order_id} />}

          {/* Action Buttons */}
          <div className="space-y-4 pt-4 border-t">
            {/* Download Receipt Button */}
            <div className="text-center">
              <ReceiptDownloadButton 
                orderId={order_id} 
                transactionId={transaction_id} 
              />
            </div>
            
            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild size="lg" className="w-full">
                <Link href="/student">
                  <Home className="mr-2 h-5 w-5" />
                  Return to Student Portal
                </Link>
              </Button>
              
              <Button variant="outline" asChild size="lg" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Go to Homepage
                </Link>
              </Button>
            </div>
          </div>

          {/* Footer Information */}
          <div className="text-center text-sm text-gray-500 border-t pt-4 space-y-2">
            <p className="font-medium">Need help with your payment?</p>
            <p>Contact support with your Order ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{order_id}</span></p>
            <p className="text-xs">Keep this receipt for your records</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage({ searchParams }: PaymentSuccessProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading payment receipt...</div>
      </div>
    }>
      <PaymentSuccessContent searchParams={searchParams} />
    </Suspense>
  );
} 