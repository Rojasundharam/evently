'use client';

import { useState, useCallback } from 'react';
import { PaymentFormData, PaymentStatusResponse } from '@/lib/types/payment';

interface UsePaymentsReturn {
  isLoading: boolean;
  error: string | null;
  createPaymentSession: (data: PaymentFormData) => Promise<string | null>;
  checkPaymentStatus: (orderId: string) => Promise<PaymentStatusResponse | null>;
  processRefund: (orderId: string, amount: number, note?: string) => Promise<boolean>;
  clearError: () => void;
}

export function usePayments(): UsePaymentsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createPaymentSession = useCallback(async (data: PaymentFormData): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment session');
      }

      if (result.success && result.session) {
        // Redirect to payment gateway
        window.location.href = result.session.payment_links.web;
        return result.order_id;
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment session';
      setError(errorMessage);
      console.error('Payment session creation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (orderId: string): Promise<PaymentStatusResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check payment status');
      }

      if (result.success && result.payment_status) {
        return result.payment_status;
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check payment status';
      setError(errorMessage);
      console.error('Payment status check error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processRefund = useCallback(async (
    orderId: string, 
    amount: number, 
    note?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          refund_amount: amount,
          refund_note: note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process refund');
      }

      if (result.success && result.refund) {
        return true;
      } else {
        throw new Error('Invalid response from refund service');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
      setError(errorMessage);
      console.error('Refund processing error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createPaymentSession,
    checkPaymentStatus,
    processRefund,
    clearError,
  };
} 