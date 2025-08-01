'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PaymentSuccessHandlerProps {
  orderId: string;
}

export function PaymentSuccessHandler({ orderId }: PaymentSuccessHandlerProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleServiceRequestCreation = async () => {
      // Check if there's pending service request data in localStorage
      const pendingData = localStorage.getItem('pendingServiceRequest');
      
      if (!pendingData) {
        console.log('No pending service request data found');
        setIsProcessing(false);
        return;
      }

      if (!user) {
        console.log('User not available yet, waiting...');
        return;
      }

      try {
        const serviceRequestData = JSON.parse(pendingData);
        
        // Verify the order ID matches
        if (serviceRequestData.orderId !== orderId) {
          console.log('Order ID mismatch, skipping service request creation');
          setIsProcessing(false);
          return;
        }

        console.log('Creating service request after successful payment:', serviceRequestData);

        // Create the service request
        const response = await fetch('/api/payment/complete-service-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedServiceId: serviceRequestData.selectedServiceId,
            userId: user.id,
            notes: serviceRequestData.notes,
            orderId: orderId
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create service request');
        }

        if (result.success) {
          console.log('Service request created successfully:', result.serviceRequest);
          setSuccess(true);
          
          // Clean up localStorage
          localStorage.removeItem('pendingServiceRequest');
        } else {
          throw new Error('Invalid response from service request API');
        }

      } catch (err) {
        console.error('Error creating service request after payment:', err);
        setError(err instanceof Error ? err.message : 'Failed to create service request');
      } finally {
        setIsProcessing(false);
      }
    };

    // Only run if we have a user and are still processing
    if (user && isProcessing) {
      handleServiceRequestCreation();
    }
  }, [user, orderId, isProcessing]);

  // Don't render anything if not processing a service request
  if (!isProcessing && !success && !error) {
    return null;
  }

  return (
    <div className="mt-4">
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">Processing your service request...</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Creating your service request now that payment is complete.
          </p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Service Request Created!</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Your service request has been submitted successfully. You can view it in your Student Portal.
          </p>
          <div className="mt-3 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Payment & Service Request Complete
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 font-medium">Service Request Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Payment was successful, but there was an error creating your service request: {error}
          </p>
          <p className="text-red-700 text-sm mt-1">
            Please contact support with your payment details.
          </p>
        </div>
      )}
    </div>
  );
}

// Import CheckCircle for success state
import { CheckCircle } from 'lucide-react'; 