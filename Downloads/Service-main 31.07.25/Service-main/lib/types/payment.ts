// HDFC SmartGateway Payment Types

export interface HDFCPaymentSession {
  order_id: string;
  amount: string;
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  payment_page_client_id: string;
  return_url: string;
  description: string;
  first_name: string;
  last_name: string;
}

export interface HDFCSessionResponse {
  session_id?: string; // May be undefined in HDFC response
  order_id: string;
  payment_links?: {
    web: string;
    mobile: string;
  };
  redirect_url?: string; // HDFC may return direct redirect URL
}

export interface HDFCPaymentResponse {
  order_id: string;
  status: 'CHARGED' | 'FAILED' | 'PENDING'; // HDFC uses uppercase
  status_id?: string;
  transaction_id?: string;
  amount?: string;
  payment_method?: string;
  bank_ref_no?: string;
  merchant_id?: string;
  signature: string;
  signature_algorithm?: string;
  gateway_transaction_id?: string;
  payment_gateway?: string;
  response_code?: string;
  response_message?: string;
  created_at?: string;
}

export interface HDFCRefundRequest {
  order_id: string;
  refund_amount: string;
  refund_note?: string;
}

export interface HDFCRefundResponse {
  refund_id: string;
  order_id: string;
  refund_amount: string;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
}

export interface PaymentFormData {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
}

export interface PaymentStatusRequest {
  order_id: string;
}

export interface PaymentStatusResponse {
  order_id: string;
  status: string;
  amount: string;
  transaction_id?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentEnvironment = 'sandbox' | 'production';

export interface HDFCConfig {
  apiKey: string;
  merchantId: string;
  paymentPageClientId: string;
  responseKey: string;
  environment: PaymentEnvironment;
  baseUrl: string;
  returnUrl: string;
  successUrl: string;
  cancelUrl: string;
}

// EXACT HDFC Order Status Response - matching the official documentation
export interface HDFCOrderStatusResponse {
  customer_email: string;
  customer_phone: string;
  customer_id: string;
  status_id: number;
  status: "CHARGED" | "FAILED" | "PENDING" | "DECLINED" | "CANCELLED" | "REFUNDED" | "NEW" | "PENDING_VBV" | "AUTHORIZED" | "JUSPAY_DECLINED" | "AUTHENTICATION_FAILED" | "AUTHORIZATION_FAILED" | "AUTHORIZING" | "VOIDED" | "VOID_INITIATED" | "VOID_FAILED" | "STARTED" | "AUTO_REFUNDED" | "CAPTURE_INITIATED" | "CAPTURE_FAILED";
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  order_id: string;
  date_created: string;
  return_url: string;
  product_id: string;
  payment_links: {
    iframe: string;
    web: string;
    mobile: string;
  };
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  udf6?: string;
  udf7?: string;
  udf8?: string;
  udf9?: string;
  udf10?: string;
  txn_id: string;
  payment_method_type: string;
  auth_type: string;
  payment_method: string;
  refunded: boolean;
  amount_refunded: number;
  effective_amount: number;
  resp_code: string | null;
  resp_message: string | null;
  bank_error_code: string;
  bank_error_message: string;
  txn_uuid: string;
  txn_detail: {
    txn_id: string;
    order_id: string;
    status: string;
    error_code: string | null;
    net_amount: number;
    surcharge_amount: number | null;
    tax_amount: number | null;
    txn_amount: number;
    offer_deduction_amount: number;
    gateway_id: number;
    currency: string;
    express_checkout: boolean;
    redirect: boolean;
    txn_uuid: string;
    gateway: string;
    error_message: string;
    created: string;
    txn_amount_breakup: string;
  };
  payment_gateway_response: {
    resp_code: string;
    rrn: string;
    created: string;
    epg_txn_id: string;
    resp_message: string;
    auth_id_code: string;
    txn_id: string;
  };
  gateway_id: number;
  gateway_reference_id: string | null;
  offers: any[];
  
  // Backward compatibility fields
  order_status?: string;
  transaction_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HDFCRefundResponse {
  refund_id: string;
  order_id: string;
  refund_amount: string;
  refund_ref_no: string;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
}

export interface HDFCWebhookEvent {
  event_type: 'success' | 'failed' | 'pending' | 'refunded';
  order_id: string;
  status: string;
  amount: string;
  transaction_id?: string;
  signature: string;
  timestamp: string;
} 