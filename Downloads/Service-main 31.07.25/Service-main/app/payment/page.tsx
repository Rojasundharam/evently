import { Suspense } from 'react';
import PaymentForm from '@/components/payments/payment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Zap } from 'lucide-react';

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Secure Payment Gateway
          </h1>
          <p className="text-gray-600">
            Fast, secure, and reliable payments powered by HDFC SmartGateway
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse">Loading payment form...</div>
              </div>
            }>
              <PaymentForm />
            </Suspense>
          </div>

          {/* Features and Security Info */}
          <div className="space-y-6">
            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Why Choose Our Payment Gateway?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Bank-Grade Security</h4>
                    <p className="text-sm text-gray-600">
                      Your payment data is encrypted with 256-bit SSL encryption
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Lightning Fast</h4>
                    <p className="text-sm text-gray-600">
                      Complete your payment in under 30 seconds
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">PCI DSS Compliant</h4>
                    <p className="text-sm text-gray-600">
                      Meets the highest security standards for card payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accepted Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Accepted Payment Methods</CardTitle>
                <CardDescription>
                  We support all major payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold mb-2">Credit/Debit Cards</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Visa</li>
                      <li>• Mastercard</li>
                      <li>• RuPay</li>
                      <li>• American Express</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Digital Wallets</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• UPI</li>
                      <li>• Paytm</li>
                      <li>• Google Pay</li>
                      <li>• PhonePe</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Info */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>Our customer support team is available 24/7 to assist you with any payment-related queries.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Email:</strong>
                    <br />
                    <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                      support@example.com
                    </a>
                  </div>
                  <div>
                    <strong>Phone:</strong>
                    <br />
                    <a href="tel:+911234567890" className="text-blue-600 hover:underline">
                      +91 12345 67890
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Trusted by thousands of customers across India
          </p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-xs font-semibold">🏦 HDFC BANK</div>
            <div className="text-xs font-semibold">🔒 SSL SECURED</div>
            <div className="text-xs font-semibold">✅ PCI COMPLIANT</div>
            <div className="text-xs font-semibold">🛡️ 256-BIT ENCRYPTION</div>
          </div>
        </div>
      </div>
    </div>
  );
} 