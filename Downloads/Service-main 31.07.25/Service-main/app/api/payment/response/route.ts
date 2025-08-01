import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { hdfcPaymentService } from '@/lib/hdfc-payment';
import { HDFCPaymentResponse } from '@/lib/types/payment';
import { transactionTrackingService } from '@/lib/transaction-tracking';

export async function POST(request: NextRequest) {
  try {
    // HDFC sends form data, not JSON
    const formData = await request.formData();
    const body: Record<string, string> = {};
    
    // Convert FormData to string object
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });
    
    console.log('HDFC Payment response received:', body);

    // Get client information for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const requestHeaders = Object.fromEntries(request.headers.entries());

    // CRITICAL SECURITY FIX: Replay Attack Protection
    // Check if this exact transaction has already been processed
    const existingTransaction = await transactionTrackingService.checkTransactionExists({
      orderId: body.order_id,
      hdfcOrderId: body.order_id,
      signature: body.signature
    });

    if (existingTransaction) {
      console.error('REPLAY ATTACK DETECTED:', {
        order_id: body.order_id,
        signature: body.signature,
        existing_transaction_id: existingTransaction.id,
        client_ip: clientIP,
        user_agent: userAgent
      });

      // Log security event for replay attack attempt
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'replay_attack_detected',
          severity: 'critical',
          description: `Replay attack detected - duplicate transaction attempt for order ${body.order_id}`,
          orderId: body.order_id,
          vulnerabilityType: 'replay_attack',
          eventData: {
            existing_transaction_id: existingTransaction.id,
            signature: body.signature,
            ip_address: clientIP,
            user_agent: userAgent,
            request_headers: requestHeaders,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed (continuing):', logError);
      }

      // Return security error page for replay attack
      const securityErrorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Security Error - Duplicate Transaction</title>
          <meta http-equiv="refresh" content="3;url=${process.env.NEXT_PUBLIC_APP_URL}/payment/error?message=duplicate_transaction">
        </head>
        <body>
          <h1>Security Error</h1>
          <p>Duplicate transaction detected. This payment has already been processed.</p>
          <p>If you believe this is an error, please contact support.</p>
        </body>
        </html>
      `;
      
      return new Response(securityErrorHtml, {
        status: 409, // Conflict - duplicate transaction
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // CRITICAL FIX: Handle both HDFC documentation formats
    // According to HDFC docs: uses "transaction_id" and "order_status"
    // But actual API might use different field names, so we check both
    // If no transaction_id is provided, use order_id as transaction reference
    const transactionId = body.transaction_id || body.txn_id || body.order_id; // Fallback to order_id
    const orderStatus = body.order_status || body.status;     // Docs use "order_status"
    
    console.log('HDFC Response Field Mapping:', { 
      received_fields: Object.keys(body),
      transaction_id: body.transaction_id,
      txn_id: body.txn_id,
      order_status: body.order_status,
      status: body.status,
      extracted_transaction_id: transactionId,
      extracted_status: orderStatus
    });

    // Verify signature using HDFC's algorithm
    const isSignatureValid = hdfcPaymentService.verifySignature(body);
    
    // Record transaction response in database (with graceful error handling)
    let dbTransactionId: string | null = null;
    try {
      dbTransactionId = await transactionTrackingService.recordTransactionResponse({
        orderId: body.order_id,
        transactionId: transactionId,
        status: orderStatus?.toUpperCase(), // Normalize to uppercase
        hdfcResponse: body,
        formData: body,
        signatureData: {
          signature: body.signature,
          verified: isSignatureValid,
          algorithm: body.signature_algorithm || 'HMAC-SHA256'
        },
        ipAddress: clientIP,
        userAgent: userAgent
      });
      console.log('Transaction recorded in database:', dbTransactionId);
    } catch (trackingError) {
      console.warn('Transaction tracking failed (continuing with payment processing):', trackingError);
      // Continue processing even if tracking fails
    }

    if (!isSignatureValid) {
      console.error('Invalid HDFC signature received:', {
        order_id: body.order_id,
        received_signature: body.signature,
        transaction_id: transactionId
      });
      
      // Log security event for signature verification failure (with graceful error handling)
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'signature_verification_failure',
          severity: 'high',
          description: `HDFC signature verification failed for order ${body.order_id}`,
          orderId: body.order_id,
          vulnerabilityType: 'signature_mismatch',
          eventData: {
            received_signature: body.signature,
            order_id: body.order_id,
            status: orderStatus,
            transaction_id: transactionId,
            ip_address: clientIP,
            user_agent: userAgent,
            request_headers: requestHeaders
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed (continuing):', logError);
      }

      // Return error page for invalid signature
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Security Error</title>
          <meta http-equiv="refresh" content="3;url=${process.env.NEXT_PUBLIC_APP_URL}/payment/error?message=signature_verification_failed">
        </head>
        <body>
          <h1>Security Error</h1>
          <p>Payment verification failed. Redirecting...</p>
        </body>
        </html>
      `;
      
      return new Response(errorHtml, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle different payment statuses
    // HDFC documentation shows lowercase status values: "charged", "failed", "pending"
    // But we also handle uppercase versions for compatibility
    let redirectUrl: string;
    const normalizedStatus = orderStatus?.toLowerCase();
    
    if (normalizedStatus === 'charged') {
      // Payment successful
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'payment_success',
          severity: 'low',
          description: `Payment completed successfully for order ${body.order_id}`,
          orderId: body.order_id,
          eventData: {
            transaction_id: transactionId,
            amount: body.amount,
            payment_method: body.payment_method,
            status: orderStatus
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed (continuing):', logError);
      }

      // Update session response in tracking (with graceful error handling)
      try {
        await transactionTrackingService.updateSessionResponse(body.order_id, {
          status: 'CHARGED',
          transaction_id: transactionId,
          payment_response: body
        });
      } catch (updateError) {
        console.warn('Session response update failed (continuing):', updateError);
      }

      redirectUrl = `${hdfcPaymentService.getSuccessUrl()}?order_id=${body.order_id}&transaction_id=${transactionId}&status=success`;
      console.log('Payment successful:', { order_id: body.order_id, transaction_id: transactionId });
      
    } else if (normalizedStatus === 'failed') {
      // Payment failed
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'payment_failure',
          severity: 'medium',
          description: `Payment failed for order ${body.order_id}: ${body.failure_reason || 'Unknown reason'}`,
          orderId: body.order_id,
          eventData: {
            transaction_id: transactionId,
            failure_reason: body.failure_reason,
            error_code: body.error_code,
            status: orderStatus
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed (continuing):', logError);
      }

      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || hdfcPaymentService.getSuccessUrl().replace('/payment/success', '')}/payment/failure?order_id=${body.order_id}&transaction_id=${transactionId}&status=failed&reason=${encodeURIComponent(body.failure_reason || 'Payment failed')}`;
      console.log('Payment failed:', { 
        order_id: body.order_id, 
        transaction_id: transactionId,
        reason: body.failure_reason 
      });
      
    } else if (normalizedStatus === 'pending') {
      // Payment pending
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'payment_processing',
          severity: 'low',
          description: `Payment processing initiated for order ${body.order_id}`,
          orderId: body.order_id,
          eventData: {
            transaction_id: transactionId,
            status: orderStatus
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed (continuing):', logError);
      }

      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?order_id=${body.order_id}&transaction_id=${transactionId}&status=pending`;
      console.log('Payment pending:', { order_id: body.order_id, transaction_id: transactionId });
      
    } else {
      // Unknown status
      console.warn('Unknown payment status received:', orderStatus);
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?order_id=${body.order_id}&transaction_id=${transactionId}&status=unknown&message=${encodeURIComponent('Unknown payment status: ' + orderStatus)}`;
    }

    // Return HTML redirect response (required by HDFC)
    const redirectHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Processing Payment</title>
        <meta http-equiv="refresh" content="0;url=${redirectUrl}">
      </head>
      <body>
        <h1>Processing Payment</h1>
        <p>Please wait while we redirect you...</p>
        <script>
          window.location.href = '${redirectUrl}';
        </script>
      </body>
      </html>
    `;

    return new Response(redirectHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('HDFC payment response processing error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Error</title>
        <meta http-equiv="refresh" content="3;url=${process.env.NEXT_PUBLIC_APP_URL}/payment/error?message=processing_error">
      </head>
      <body>
        <h1>Payment Processing Error</h1>
        <p>An error occurred while processing your payment. Redirecting...</p>
      </body>
      </html>
    `;
    
    return new Response(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// GET method for backward compatibility (some gateways may use GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Convert searchParams to body object
    const body: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      body[key] = value;
    });
    
    console.log('HDFC Payment response received via GET:', body);

    // Handle both HDFC documentation field formats
    const transactionId = body.transaction_id || body.txn_id;
    const orderStatus = body.order_status || body.status;
    
    console.log('Transaction ID extracted (GET):', { 
      transaction_id: body.transaction_id,
      txn_id: body.txn_id,
      order_status: body.order_status,
      status: body.status,
      extracted_transaction_id: transactionId,
      extracted_status: orderStatus
    });

    // Verify signature
    const isSignatureValid = hdfcPaymentService.verifySignature(body);
    
    if (!isSignatureValid) {
      return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?message=signature_verification_failed`);
    }

    // Handle different statuses (using lowercase as per HDFC docs)
    const normalizedStatus = orderStatus?.toLowerCase();
    
    if (normalizedStatus === 'charged') {
      return redirect(`${hdfcPaymentService.getSuccessUrl()}?order_id=${body.order_id}&transaction_id=${transactionId}&status=success`);
    } else if (normalizedStatus === 'failed') {
      return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?order_id=${body.order_id}&transaction_id=${transactionId}&status=failed`);
    } else if (normalizedStatus === 'pending') {
      return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?order_id=${body.order_id}&transaction_id=${transactionId}&status=pending`);
    } else {
      return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?order_id=${body.order_id}&transaction_id=${transactionId}&status=unknown`);
    }

  } catch (error) {
    console.error('HDFC payment response GET processing error:', error);
    return redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?message=processing_error`);
  }
} 