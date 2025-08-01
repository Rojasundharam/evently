import { NextRequest, NextResponse } from 'next/server';
import { hdfcPaymentService } from '@/lib/hdfc-payment';
import { HDFCWebhookEvent } from '@/lib/types/payment';
import { transactionTrackingService } from '@/lib/transaction-tracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('HDFC Webhook received:', body);

    // Get client information for security audit
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // CRITICAL SECURITY FIX: Check for webhook replay attacks
    const webhookId = body.webhook_id || body.event_id || `${body.order_id}_${body.event_type}_${Date.now()}`;
    const signatureHash = body.signature || 'no_signature';
    
    // Check if this webhook has already been processed
    const existingWebhook = await checkWebhookExists(webhookId, body.event_type, body.order_id, signatureHash);
    
    if (existingWebhook) {
      console.error('WEBHOOK REPLAY ATTACK DETECTED:', {
        webhook_id: webhookId,
        order_id: body.order_id,
        event_type: body.event_type,
        signature: signatureHash,
        client_ip: clientIP,
        user_agent: userAgent
      });

      // Log security event for webhook replay attack
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'webhook_replay_detected',
          severity: 'critical',
          description: `Webhook replay attack detected for order ${body.order_id}`,
          orderId: body.order_id,
          vulnerabilityType: 'webhook_replay',
          eventData: {
            webhook_id: webhookId,
            event_type: body.event_type,
            signature: signatureHash,
            ip_address: clientIP,
            user_agent: userAgent,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed:', logError);
      }

      return NextResponse.json(
        { status: 'error', message: 'Duplicate webhook - replay attack detected' },
        { status: 409 } // Conflict - duplicate webhook
      );
    }

    // Record webhook processing to prevent future replays
    await recordWebhookProcessing(webhookId, body.event_type, body.order_id, signatureHash, body, clientIP, userAgent);

    // Verify webhook signature
    const isSignatureValid = hdfcPaymentService.verifyWebhookSignature(body);
    
    if (!isSignatureValid) {
      console.error('Invalid HDFC webhook signature:', {
        order_id: body.order_id,
        signature: body.signature
      });

      // Log signature verification failure
      try {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'webhook_signature_verification_failure',
          severity: 'high',
          description: `HDFC webhook signature verification failed for order ${body.order_id}`,
          orderId: body.order_id,
          vulnerabilityType: 'signature_mismatch',
          eventData: {
            webhook_id: webhookId,
            received_signature: body.signature,
            ip_address: clientIP,
            user_agent: userAgent
          }
        });
      } catch (logError) {
        console.warn('Security event logging failed:', logError);
      }
      
      return NextResponse.json(
        { status: 'error', message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process webhook event
    const event: HDFCWebhookEvent = body;
    
    console.log('Processing HDFC webhook event:', {
      event_type: event.event_type,
      order_id: event.order_id,
      status: event.status,
      amount: event.amount
    });

    // Handle different event types
    switch (event.event_type) {
      case 'success':
        await handleSuccessEvent(event);
        break;
      
      case 'failed':
        await handleFailedEvent(event);
        break;
      
      case 'pending':
        await handlePendingEvent(event);
        break;
      
      case 'refunded':
        await handleRefundedEvent(event);
        break;
      
      default:
        console.warn('Unknown HDFC webhook event type:', event.event_type);
    }

    // Return success response to HDFC
    return NextResponse.json({
      status: 'success',
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('HDFC webhook processing error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment webhook
 */
async function handleSuccessEvent(event: HDFCWebhookEvent) {
  try {
    console.log('Processing successful payment webhook:', event.order_id);
    
    // Update database with successful payment
    // Example: await updatePaymentStatus(event.order_id, 'completed');
    
    // Send confirmation email
    // Example: await sendPaymentConfirmationEmail(event);
    
    // Trigger fulfillment process
    // Example: await triggerFulfillment(event.order_id);
    
    console.log('Success webhook processed for order:', event.order_id);
  } catch (error) {
    console.error('Error processing success webhook:', error);
    throw error;
  }
}

/**
 * Handle failed payment webhook
 */
async function handleFailedEvent(event: HDFCWebhookEvent) {
  try {
    console.log('Processing failed payment webhook:', event.order_id);
    
    // Update database with failed payment
    // Example: await updatePaymentStatus(event.order_id, 'failed');
    
    // Send failure notification
    // Example: await sendPaymentFailureEmail(event);
    
    console.log('Failed webhook processed for order:', event.order_id);
  } catch (error) {
    console.error('Error processing failed webhook:', error);
    throw error;
  }
}

/**
 * Handle pending payment webhook
 */
async function handlePendingEvent(event: HDFCWebhookEvent) {
  try {
    console.log('Processing pending payment webhook:', event.order_id);
    
    // Update database with pending status
    // Example: await updatePaymentStatus(event.order_id, 'pending');
    
    console.log('Pending webhook processed for order:', event.order_id);
  } catch (error) {
    console.error('Error processing pending webhook:', error);
    throw error;
  }
}

/**
 * Handle refund webhook
 */
async function handleRefundedEvent(event: HDFCWebhookEvent) {
  try {
    console.log('Processing refund webhook:', event.order_id);
    
    // Update database with refund status
    // Example: await updatePaymentStatus(event.order_id, 'refunded');
    
    // Send refund confirmation
    // Example: await sendRefundConfirmationEmail(event);
    
    console.log('Refund webhook processed for order:', event.order_id);
  } catch (error) {
    console.error('Error processing refund webhook:', error);
    throw error;
  }
}

/**
 * Check if webhook has already been processed (replay attack detection)
 */
async function checkWebhookExists(
  webhookId: string,
  eventType: string,
  orderId: string,
  signatureHash: string
): Promise<boolean> {
  try {
    // Use database function to check for webhook replay
    const { data, error } = await transactionTrackingService['supabase']
      .rpc('detect_webhook_replay', {
        p_webhook_id: webhookId,
        p_event_type: eventType,
        p_order_id: orderId,
        p_signature_hash: signatureHash,
        p_event_data: {}
      });

    if (error) {
      console.error('Error checking webhook existence:', error);
      // Fail secure - assume it's a replay if we can't check
      return true;
    }

    return data || false;
  } catch (error) {
    console.error('Webhook existence check failed:', error);
    // Fail secure - assume it's a replay if we can't check
    return true;
  }
}

/**
 * Record webhook processing to prevent future replays
 */
async function recordWebhookProcessing(
  webhookId: string,
  eventType: string,
  orderId: string,
  signatureHash: string,
  eventData: any,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    const { error } = await transactionTrackingService['supabase']
      .from('webhook_event_tracking')
      .insert({
        webhook_id: webhookId,
        event_type: eventType,
        order_id: orderId,
        signature_hash: signatureHash,
        event_data: eventData,
        ip_address: ipAddress,
        user_agent: userAgent,
        processing_status: 'processed',
        duplicate_detected: false
      });

    if (error) {
      console.error('Error recording webhook processing:', error);
      throw new Error(`Failed to record webhook processing: ${error.message}`);
    }

    console.log('Webhook processing recorded:', {
      webhook_id: webhookId,
      event_type: eventType,
      order_id: orderId
    });
  } catch (error) {
    console.error('Webhook recording failed:', error);
    throw error;
  }
} 