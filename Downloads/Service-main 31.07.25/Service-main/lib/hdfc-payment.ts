import crypto from 'crypto';
import {
  HDFCConfig,
  HDFCPaymentSession,
  HDFCSessionResponse,
  HDFCPaymentResponse,
  HDFCRefundRequest,
  HDFCRefundResponse,
  HDFCOrderStatusResponse,
  HDFCWebhookEvent,
  PaymentEnvironment,
} from './types/payment';

class HDFCPaymentService {
  private config: HDFCConfig;

  constructor() {
    this.config = this.getConfig();
  }

  /**
   * Get payment status from HDFC - exact API format matching documentation
   */
  async getPaymentStatus(orderId: string): Promise<HDFCOrderStatusResponse> {
    this.validateConfig();

    // Mock mode for testing - return exact HDFC format
    if (process.env.HDFC_ENVIRONMENT === 'mock') {
      console.log('HDFC Mock Mode: Returning mock order status in exact HDFC format');
      
      const mockResponse: HDFCOrderStatusResponse = {
        customer_email: "test@jkkn.ac.in",
        customer_phone: "9876543210",
        customer_id: `cst_${orderId.substring(3, 15)}`,
        status_id: 21,
        status: "CHARGED",
        id: `order_${orderId.substring(3)}_${Date.now()}`,
        merchant_id: this.config.merchantId,
        amount: 1000, // Mock amount
        currency: "INR",
        order_id: orderId,
        date_created: new Date().toISOString(),
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        product_id: "",
        payment_links: {
          iframe: `https://smartgatewayuat.hdfcbank.com/merchant/ipay/${orderId}`,
          web: `https://smartgatewayuat.hdfcbank.com/merchant/pay/${orderId}`,
          mobile: `https://smartgatewayuat.hdfcbank.com/merchant/pay/${orderId}?mobile=true`
        },
        udf1: "",
        udf2: "",
        udf3: "",
        udf4: "",
        udf5: "",
        udf6: "",
        udf7: "",
        udf8: "",
        udf9: "",
        udf10: "",
        txn_id: `${this.config.merchantId}-${orderId}-1`,
        payment_method_type: "NB",
        auth_type: "THREE_DS",
        payment_method: "NB_HDFC",
        refunded: false,
        amount_refunded: 0,
        effective_amount: 1000,
        resp_code: null,
        resp_message: null,
        bank_error_code: "",
        bank_error_message: "",
        txn_uuid: `mock_uuid_${Date.now()}`,
        txn_detail: {
          txn_id: `${this.config.merchantId}-${orderId}-1`,
          order_id: orderId,
          status: "CHARGED",
          error_code: null,
          net_amount: 1000,
          surcharge_amount: null,
          tax_amount: null,
          txn_amount: 1000,
          offer_deduction_amount: 0,
          gateway_id: 12,
          currency: "INR",
          express_checkout: false,
          redirect: true,
          txn_uuid: `mock_uuid_${Date.now()}`,
          gateway: "MOCK_GATEWAY",
          error_message: "",
          created: new Date().toISOString(),
          txn_amount_breakup: `[{"name":"BASE","value":1000,"sno":1,"method":"ADD"}]`
        },
        payment_gateway_response: {
          resp_code: "success",
          rrn: "45903248",
          created: new Date().toISOString(),
          epg_txn_id: "40399371553295730",
          resp_message: "No Error",
          auth_id_code: "2732147",
          txn_id: `${this.config.merchantId}-${orderId}-1`
        },
        gateway_id: 12,
        gateway_reference_id: null,
        offers: [],
        
        // Backward compatibility
        order_status: "CHARGED",
        transaction_id: `${this.config.merchantId}-${orderId}-1`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Mock HDFC Order Status Response:', {
        order_id: mockResponse.order_id,
        status: mockResponse.status,
        status_id: mockResponse.status_id,
        txn_id: mockResponse.txn_id,
        amount: mockResponse.amount,
        currency: mockResponse.currency
      });

      return mockResponse;
    }

    try {
      // Generate customer_id for header (required by HDFC API)
      const customerId = this.generateCustomerId(orderId);

      // Use exact headers from HDFC documentation
      const response = await fetch(`${this.config.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(), // Basic base_64_encoded_api_key
          'Content-Type': 'application/json',    // Required by HDFC docs
          'version': '2023-06-30',               // Required API version
          'x-merchantid': this.config.merchantId, // Required by HDFC docs
          'x-customerid': customerId,            // Required by HDFC docs
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HDFC Order Status API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          orderId,
          headers: {
            'Authorization': 'Basic [REDACTED]',
            'Content-Type': 'application/json',
            'version': '2023-06-30',
            'x-merchantid': this.config.merchantId,
            'x-customerid': customerId
          }
        });
        throw new Error(`HDFC API Error: ${response.status} - ${errorText}`);
      }

      const data: HDFCOrderStatusResponse = await response.json();
      
      console.log('HDFC Order Status Response (real API):', {
        order_id: data.order_id,
        status: data.status,
        status_id: data.status_id,
        txn_id: data.txn_id,
        amount: data.amount,
        currency: data.currency,
        payment_method: data.payment_method,
        txn_detail: data.txn_detail,
        payment_gateway_response: data.payment_gateway_response
      });

      return data;
    } catch (error) {
      console.error('Get payment status error:', error);
      throw new Error(`Failed to get payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get configuration with environment variable support for URLs
   */
  private getConfig(): HDFCConfig {
    const environment = (process.env.HDFC_ENVIRONMENT as PaymentEnvironment) || 'sandbox';
    
    // Support environment variables for URLs (as per HDFC docs)
    const baseUrls = {
      sandbox: process.env.HDFC_SANDBOX_URL || 'https://smartgatewayuat.hdfcbank.com',
      production: process.env.HDFC_PRODUCTION_URL || 'https://smartgateway.hdfcbank.com'
    };
    
    // Get base app URL with fallbacks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
      apiKey: process.env.HDFC_API_KEY!,
      merchantId: process.env.HDFC_MERCHANT_ID!,
      paymentPageClientId: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID || process.env.HDFC_MERCHANT_ID!,
      responseKey: process.env.HDFC_RESPONSE_KEY!,
      environment,
      baseUrl: baseUrls[environment],
      returnUrl: process.env.PAYMENT_RETURN_URL || `${appUrl}/api/payment/response`,
      successUrl: process.env.PAYMENT_SUCCESS_URL || `${appUrl}/payment/success`,
      cancelUrl: process.env.PAYMENT_CANCEL_URL || `${appUrl}/payment/cancel`
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.apiKey || !this.config.merchantId || !this.config.responseKey) {
      console.error('HDFC Configuration Missing:', {
        hasApiKey: !!this.config.apiKey,
        hasMerchantId: !!this.config.merchantId,
        hasResponseKey: !!this.config.responseKey,
        environment: this.config.environment
      });
      throw new Error('Missing HDFC configuration. Please check your environment variables: HDFC_API_KEY, HDFC_MERCHANT_ID, HDFC_RESPONSE_KEY');
    }
  }

  /**
   * Generate unique order ID with guaranteed uniqueness
   * HDFC-compatible format: ORD + timestamp + random + short UUID fragment
   * This ensures compatibility with HDFC while maintaining uniqueness
   */
  generateOrderId(): string {
    // Use crypto.randomUUID for guaranteed uniqueness
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8); // Shorter UUID fragment
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Shorter random
    
    // HDFC-compatible format: ORD + timestamp + random + short uuid
    // This keeps the order ID shorter while maintaining uniqueness
    return `ORD${timestamp}${random}${uuid}`;
  }

  /**
   * Generate customer ID with email hash
   */
  generateCustomerId(customerEmail: string): string {
    const timestamp = Date.now();
    const emailHash = crypto.createHash('md5').update(customerEmail).digest('hex').substring(0, 8);
    return `CUST${emailHash}${timestamp}`;
  }

  /**
   * Create Basic Auth header with Base64 encoded API key
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(this.config.apiKey + ':').toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * HDFC's Exact Signature Verification Algorithm
   */
  verifySignature(params: Record<string, any>): boolean {
    try {
      const receivedSignature = params.signature;
      if (!receivedSignature) {
        console.error('No signature found in payment response');
        return false;
      }

      // Step 1: Filter out signature and signature_algorithm from params
      const filteredParams = { ...params };
      delete filteredParams.signature;
      delete filteredParams.signature_algorithm;

      // Step 2: Sort parameters alphabetically by key
      const sortedKeys = Object.keys(filteredParams).sort();

      // Step 3: Create URL-encoded parameter string: key=value&key=value
      const paramString = sortedKeys
        .map(key => `${key}=${filteredParams[key]}`)
        .join('&');

      // Step 4: URL encode the entire parameter string
      const encodedParamString = encodeURIComponent(paramString);

      // Step 5: HMAC-SHA256 with Response Key, output as base64
      const computedHash = crypto
        .createHmac('sha256', this.config.responseKey)
        .update(encodedParamString)
        .digest('base64');

      // Step 6: URL encode the computed hash
      const encodedComputedHash = encodeURIComponent(computedHash);

      console.log('HDFC Signature Verification:', {
        paramString,
        encodedParamString,
        computedHash,
        encodedComputedHash,
        receivedSignature,
        receivedSignatureDecoded: decodeURIComponent(receivedSignature)
      });

      // Step 7: Compare with received signature (both encoded and decoded)
      return receivedSignature === encodedComputedHash || 
             decodeURIComponent(receivedSignature) === computedHash;

    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create payment session
   */
  async createPaymentSession(sessionData: HDFCPaymentSession): Promise<HDFCSessionResponse> {
    this.validateConfig();

    try {
      // Check if we should use mock mode (only for explicit mock environment)
      if (process.env.HDFC_ENVIRONMENT === 'mock') {
        console.log('HDFC Mock Mode: Creating mock payment session');
        return {
          session_id: `mock_${Date.now()}`,
          order_id: sessionData.order_id,
          payment_links: {
            web: `http://localhost:3000/payment/success?order_id=${sessionData.order_id}&status=CHARGED`,
            mobile: `http://localhost:3000/payment/success?order_id=${sessionData.order_id}&status=CHARGED`
          },
          redirect_url: `http://localhost:3000/payment/success?order_id=${sessionData.order_id}&status=CHARGED`
        };
      }

      const apiUrl = `${this.config.baseUrl}/session`;
      
      // Debug logging to identify the issue
      console.log('HDFC Payment Session Debug:', {
        apiUrl,
        baseUrl: this.config.baseUrl,
        environment: this.config.environment,
        merchantId: this.config.merchantId,
        hasApiKey: !!this.config.apiKey,
        customerId: sessionData.customer_id,
        orderId: sessionData.order_id,
        amount: sessionData.amount
      });

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
        'x-merchantid': this.config.merchantId,
        'x-customerid': sessionData.customer_id,
      };

      console.log('HDFC Request Headers:', {
        'Content-Type': headers['Content-Type'],
        'Authorization': headers.Authorization ? 'Basic [REDACTED]' : 'Missing',
        'x-merchantid': headers['x-merchantid'],
        'x-customerid': headers['x-customerid']
      });

      console.log('HDFC Request Body:', sessionData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionData),
      });

      console.log('HDFC Response Status:', response.status);
      console.log('HDFC Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HDFC API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          errorBody: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`HDFC API Error: ${response.status} - ${errorText}`);
      }

      const data: HDFCSessionResponse = await response.json();
      
      console.log('HDFC Session Response:', data);
      
      // Handle undefined session_id in response
      if (!data.session_id && !data.redirect_url) {
        console.warn('HDFC response missing session_id and redirect_url');
      }

      return data;
    } catch (error) {
      console.error('Create payment session error:', error);
      throw new Error(`Failed to create payment session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundData: HDFCRefundRequest): Promise<HDFCRefundResponse> {
    this.validateConfig();

    const refundRefNo = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    try {
      const payload = {
        ...refundData,
        refund_ref_no: refundRefNo,
        merchant_id: this.config.merchantId,
      };

      const response = await fetch(`${this.config.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          'x-merchantid': this.config.merchantId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HDFC API Error: ${response.status} - ${errorText}`);
      }

      const data: HDFCRefundResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Process refund error:', error);
      throw new Error(`Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(event: HDFCWebhookEvent): boolean {
    return this.verifySignature(event as any);
  }

  /**
   * Format amount for HDFC (always 2 decimal places)
   */
  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Parse customer name into first and last name
   */
  parseCustomerName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || parts[0] || ''
    };
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // Indian phone number validation (10 digits, may start with +91)
    const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  /**
   * Format phone number for HDFC
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('+91')) {
      return cleaned;
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    return phone;
  }

  /**
   * Get return URL for payment response
   */
  getReturnUrl(): string {
    return this.config.returnUrl;
  }

  /**
   * Get success URL
   */
  getSuccessUrl(): string {
    return this.config.successUrl;
  }

  /**
   * Get cancel URL
   */
  getCancelUrl(): string {
    return this.config.cancelUrl;
  }

  /**
   * Map HDFC status values to our internal format
   */
  private mapHdfcStatus(hdfcStatus: string): string {
    const statusMapping: Record<string, string> = {
      'charged': 'CHARGED',
      'failed': 'FAILED', 
      'pending': 'PENDING',
      'declined': 'DECLINED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED'
    };
    
    return statusMapping[hdfcStatus.toLowerCase()] || hdfcStatus.toUpperCase();
  }
}

// Export singleton instance
export const hdfcPaymentService = new HDFCPaymentService();

// Export class for testing
export { HDFCPaymentService }; 