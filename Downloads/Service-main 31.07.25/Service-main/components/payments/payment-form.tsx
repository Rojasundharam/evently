'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, User, Mail, Phone, IndianRupee } from 'lucide-react';
import { PaymentFormData } from '@/lib/types/payment';

interface PaymentFormProps {
  initialAmount?: number;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentForm({ 
  initialAmount = 0,
  onSuccess,
  onError 
}: PaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: initialAmount,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    description: ''
  });

  const [validationErrors, setValidationErrors] = useState<Partial<PaymentFormData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<PaymentFormData> = {};

    // Validate amount
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (formData.amount < 1) {
      errors.amount = 'Minimum amount is ₹1';
    } else if (formData.amount > 100000) {
      errors.amount = 'Maximum amount is ₹1,00,000';
    }

    // Validate customer name
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    } else if (formData.customerName.trim().length < 2) {
      errors.customerName = 'Name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!emailRegex.test(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }

    // Validate phone
    const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.customerPhone.replace(/[\s-]/g, ''))) {
      errors.customerPhone = 'Please enter a valid Indian mobile number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear general error
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating payment session...');
      
      // Create payment session
      const response = await fetch('/api/payment/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session');
      }

      if (data.success && data.session) {
        console.log('Payment session created:', data.session);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(data.order_id);
        }

        // Redirect to HDFC payment gateway
        window.location.href = data.session.payment_links.web;
      } else {
        throw new Error('Invalid response from payment service');
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Enter your details to proceed with secure payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              min="1"
              max="100000"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className={validationErrors.amount ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {validationErrors.amount && (
              <p className="text-sm text-red-500">{validationErrors.amount}</p>
            )}
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="customerName"
              type="text"
              placeholder="Enter your full name"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className={validationErrors.customerName ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {validationErrors.customerName && (
              <p className="text-sm text-red-500">{validationErrors.customerName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="Enter your email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className={validationErrors.customerEmail ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {validationErrors.customerEmail && (
              <p className="text-sm text-red-500">{validationErrors.customerEmail}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="Enter your mobile number"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className={validationErrors.customerPhone ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {validationErrors.customerPhone && (
              <p className="text-sm text-red-500">{validationErrors.customerPhone}</p>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description (Optional)
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Payment description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ₹{formData.amount?.toFixed(2) || '0.00'}
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="text-xs text-gray-500 text-center mt-4">
            <p>🔒 Secured by HDFC SmartGateway</p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 