import { NextRequest, NextResponse } from 'next/server';
import { hdfcPaymentService } from '@/lib/hdfc-payment';
import { HDFCPaymentSession } from '@/lib/types/payment';
import { transactionTrackingService } from '@/lib/transaction-tracking';

export async function POST(request: NextRequest) {
  let body: any = {};
  
  try {
    body = await request.json();
    const { amount, customerName, customerEmail, customerPhone, description } = body;

    // Validate required fields
    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, customerName, customerEmail, customerPhone' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!hdfcPaymentService.validatePhoneNumber(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be a valid Indian mobile number.' },
        { status: 400 }
      );
    }

    // Generate IDs
    const orderId = hdfcPaymentService.generateOrderId();
    const customerId = hdfcPaymentService.generateCustomerId(customerEmail);
    
    // Parse customer name
    const { firstName, lastName } = hdfcPaymentService.parseCustomerName(customerName);

    // Prepare session data
    const sessionData: HDFCPaymentSession = {
      order_id: orderId,
      amount: hdfcPaymentService.formatAmount(amount),
      customer_id: customerId,
      customer_email: customerEmail,
      customer_phone: hdfcPaymentService.formatPhoneNumber(customerPhone),
      payment_page_client_id: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID || process.env.HDFC_MERCHANT_ID!,
      return_url: hdfcPaymentService.getReturnUrl(),
      description: description || `Payment for order ${orderId}`,
      first_name: firstName,
      last_name: lastName,
    };

    console.log('Creating payment session:', { orderId, amount: sessionData.amount });

    // Try to create tracked payment session in database, but don't fail if tracking unavailable
    let paymentSessionId = null;
    let finalOrderId = orderId; // Use the generated order ID initially
    
    try {
      paymentSessionId = await transactionTrackingService.createPaymentSession({
        orderId,
        customerId,
        customerEmail,
        customerPhone,
        firstName,
        lastName,
        amount: parseFloat(sessionData.amount),
        currency: 'INR',
        description: sessionData.description,
        testCaseId: body.testCaseId, // Optional test case ID from request
        testScenario: body.testScenario // Optional test scenario from request
      });
      console.log('Payment session tracked in database:', paymentSessionId);
    } catch (trackingError) {
      console.warn('Payment session tracking failed (continuing without tracking):', trackingError);
      
      // If the error is due to duplicate order ID, try to generate a new one using database
      if (trackingError.message && trackingError.message.includes('duplicate') || 
          trackingError.message && trackingError.message.includes('already exists')) {
        try {
          console.log('Attempting to generate unique order ID using database function...');
          finalOrderId = await transactionTrackingService.generateUniqueOrderId();
          
          // Update session data with new order ID
          sessionData.order_id = finalOrderId;
          sessionData.description = description || `Payment for order ${finalOrderId}`;
          
          console.log('Generated new unique order ID:', finalOrderId);
          
          // Try to create payment session again with new order ID
          paymentSessionId = await transactionTrackingService.createPaymentSession({
            orderId: finalOrderId,
            customerId,
            customerEmail,
            customerPhone,
            firstName,
            lastName,
            amount: parseFloat(sessionData.amount),
            currency: 'INR',
            description: sessionData.description,
            testCaseId: body.testCaseId,
            testScenario: body.testScenario
          });
          console.log('Payment session tracked in database with new order ID:', paymentSessionId);
        } catch (retryError) {
          console.warn('Failed to generate unique order ID, continuing without tracking:', retryError);
          // Continue without tracking - don't fail the payment
        }
      } else {
        // Continue without tracking - don't fail the payment
      }
    }

    // Create payment session with HDFC
    const sessionResponse = await hdfcPaymentService.createPaymentSession(sessionData);

    // Try to update session with HDFC response, but don't fail if tracking unavailable
    if (paymentSessionId) {
      try {
        await transactionTrackingService.updateSessionResponse(finalOrderId, sessionResponse);
      } catch (updateError) {
        console.warn('Failed to update session response in tracking:', updateError);
        // Continue - don't fail the payment
      }
    }

    // Log successful session creation
    console.log('Payment session created successfully:', {
      session_id: sessionResponse.session_id,
      order_id: sessionResponse.order_id,
      database_session_id: paymentSessionId
    });

    // Handle HDFC response format - extract proper redirect URL
    const redirectUrl = sessionResponse.redirect_url || 
                       sessionResponse.payment_links?.web || 
                       (sessionResponse.session_id ? `${process.env.HDFC_ENVIRONMENT === 'sandbox' ? 'https://smartgatewayuat.hdfcbank.com' : 'https://smartgateway.hdfcbank.com'}/pay/${sessionResponse.session_id}` : null);

    // Extract session ID from HDFC response
    const sessionId = sessionResponse.session_id || sessionResponse.id;

    return NextResponse.json({
      success: true,
      session: {
        ...sessionResponse,
        session_id: sessionId,
        redirect_url: redirectUrl
      },
      order_id: finalOrderId,
      redirect_url: redirectUrl,
      tracking_id: paymentSessionId
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    
    // Log security event for session creation failure (with safe body access)
    try {
      if (body?.orderId) {
        await transactionTrackingService.logSecurityEvent({
          eventType: 'session_creation_failure',
          severity: 'medium',
          description: `Failed to create payment session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          orderId: body.orderId,
          eventData: { error: error instanceof Error ? error.message : 'Unknown error', body }
        });
      }
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create payment session',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 