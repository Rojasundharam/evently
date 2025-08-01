'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PaymentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PaymentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class PaymentErrorBoundary extends React.Component<PaymentErrorBoundaryProps, PaymentErrorBoundaryState> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Payment Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertTriangle className="h-16 w-16 text-orange-500" />
            </div>
            <CardTitle className="text-xl text-orange-600">
              Payment System Error
            </CardTitle>
            <CardDescription>
              Something went wrong with the payment system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
              <p className="text-orange-700 text-sm">
                {this.state.error?.message || 'An unexpected error occurred in the payment system.'}
              </p>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => this.setState({ hasError: false })}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>If this error persists, please contact support</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export { PaymentErrorBoundary }; 