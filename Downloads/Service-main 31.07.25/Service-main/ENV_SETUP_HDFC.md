# HDFC SmartGateway Environment Setup

Add these environment variables to your `.env.local` file:

```bash
# HDFC SmartGateway Payment Configuration
HDFC_API_KEY=hdfc_xxxxx_xxxxx
HDFC_MERCHANT_ID=your_merchant_id
HDFC_PAYMENT_PAGE_CLIENT_ID=your_merchant_id
HDFC_RESPONSE_KEY=your_response_key
HDFC_ENVIRONMENT=sandbox

# Payment URLs
PAYMENT_RETURN_URL=https://yourdomain.com/api/payment/response
PAYMENT_SUCCESS_URL=https://yourdomain.com/payment/success
PAYMENT_CANCEL_URL=https://yourdomain.com/payment/cancel

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Service Role (for backend operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Environment Values:

- **HDFC_API_KEY**: Your API key provided by HDFC (format: hdfc_xxxxx_xxxxx)
- **HDFC_MERCHANT_ID**: Your merchant ID for authentication headers
- **HDFC_PAYMENT_PAGE_CLIENT_ID**: Payment page client ID (usually same as merchant ID)
- **HDFC_RESPONSE_KEY**: Used for HDFC's custom signature verification
- **HDFC_ENVIRONMENT**: Set to 'sandbox' for testing, 'production' for live
- **PAYMENT_RETURN_URL**: URL where HDFC sends payment responses
- **PAYMENT_SUCCESS_URL**: Success page URL
- **PAYMENT_CANCEL_URL**: Cancel/failure page URL

## API URLs:
- **Sandbox**: https://smartgatewayuat.hdfcbank.com/session
- **Production**: https://smartgateway.hdfcbank.com/session

## Authentication:
- **Method**: Basic Auth with Base64 encoded API key
- **Headers**: Authorization, x-merchantid, x-customerid
- **Signature**: HDFC's custom HMAC-SHA256 algorithm 