'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, User, Mail, Phone, IndianRupee } from 'lucide-react';
import { Service } from '@/lib/services';

interface ServicePaymentFormProps {
  service: Service;
  user: any;
  onPaymentSubmit: (paymentData: PaymentFormData) => void;
  isSubmitting?: boolean;
}

export interface PaymentFormData {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  serviceId: string;
  notes?: string;
}

export function ServicePaymentForm({ 
  service, 
  user, 
  onPaymentSubmit, 
  isSubmitting = false 
}: ServicePaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: service.amount || 100,
    customerName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    customerEmail: user?.email || '',
    customerPhone: user?.user_metadata?.phone || '',
    description: `Payment for ${service.name}`,
    serviceId: service.id,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Full name is required';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^(\+91[-\s]?)?[6-9]\d{9}$/.test(formData.customerPhone.replace(/[\s-]/g, ''))) {
      newErrors.customerPhone = 'Please enter a valid Indian phone number';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onPaymentSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: service.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
          <CreditCard className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl text-blue-900">Service Payment</CardTitle>
        <CardDescription>
          Complete your payment for <strong>{service.name}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Service:</span>
                <p className="font-medium">{service.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <p className="font-medium text-green-600 text-lg">
                  {formatAmount(formData.amount)}
                </p>
              </div>
            </div>
            {service.description && (
              <div className="mt-2">
                <span className="text-gray-600">Description:</span>
                <p className="text-sm text-gray-700">{service.description}</p>
              </div>
            )}
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Payment Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
              <IndianRupee className="h-4 w-4 absolute left-2.5 top-3 text-gray-500" />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount}</p>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className={errors.customerName ? 'border-red-500' : ''}
                  placeholder="Enter your full name"
                />
                {errors.customerName && (
                  <p className="text-red-500 text-sm">{errors.customerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className={errors.customerEmail ? 'border-red-500' : ''}
                  placeholder="your.email@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-red-500 text-sm">{errors.customerEmail}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className={errors.customerPhone ? 'border-red-500' : ''}
                placeholder="+91 9876543210"
              />
              {errors.customerPhone && (
                <p className="text-red-500 text-sm">{errors.customerPhone}</p>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information or special requests..."
              rows={3}
            />
          </div>

          {/* Payment Information */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Secure Payment</h4>
                <p className="text-blue-700 text-sm mb-2">
                  You will be redirected to HDFC SmartGateway for secure payment processing.
                </p>
                <div className="text-xs text-blue-600">
                  <p>✓ 256-bit SSL Encryption</p>
                  <p>✓ PCI DSS Compliant</p>
                  <p>✓ Multiple Payment Options</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay {formatAmount(formData.amount)}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 