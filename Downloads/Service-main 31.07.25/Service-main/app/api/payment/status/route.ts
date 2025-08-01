import { NextRequest, NextResponse } from 'next/server';
import { hdfcPaymentService } from '@/lib/hdfc-payment';

// GET method for order status (HDFC API requirement)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: order_id' },
        { status: 400 }
      );
    }

    console.log('Checking HDFC payment status for order:', order_id);

    // Get payment status from HDFC
    const statusResponse = await hdfcPaymentService.getPaymentStatus(order_id);

    console.log('HDFC payment status response (exact format):', {
      order_id: statusResponse.order_id,
      status: statusResponse.status,
      status_id: statusResponse.status_id,
      txn_id: statusResponse.txn_id,
      amount: statusResponse.amount,
      currency: statusResponse.currency,
      payment_method: statusResponse.payment_method
    });

    // Return the exact HDFC response format
    return NextResponse.json({
      success: true,
      // Return the exact HDFC format as primary response
      ...statusResponse,
      // Also include simplified format for backward compatibility
      payment_status: {
        order_id: statusResponse.order_id,
        status: statusResponse.status || statusResponse.order_status,
        transaction_id: statusResponse.txn_id || statusResponse.transaction_id,
        amount: statusResponse.amount,
        currency: statusResponse.currency,
        payment_method: statusResponse.payment_method,
        customer_id: statusResponse.customer_id,
        merchant_id: statusResponse.merchant_id,
        created_at: statusResponse.date_created || statusResponse.created_at,
        updated_at: statusResponse.updated_at,
        status_id: statusResponse.status_id
      }
    });

  } catch (error) {
    console.error('HDFC payment status check error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// POST method for backward compatibility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: order_id' },
        { status: 400 }
      );
    }

    console.log('Checking HDFC payment status (POST) for order:', order_id);

    // Get payment status from HDFC
    const statusResponse = await hdfcPaymentService.getPaymentStatus(order_id);

    console.log('HDFC payment status response (POST, exact format):', {
      order_id: statusResponse.order_id,
      status: statusResponse.status,
      status_id: statusResponse.status_id,
      txn_id: statusResponse.txn_id,
      amount: statusResponse.amount,
      currency: statusResponse.currency
    });

    // Return the exact HDFC response format
    return NextResponse.json({
      success: true,
      // Return the exact HDFC format as primary response
      ...statusResponse,
      // Also include simplified format for backward compatibility
      payment_status: {
        order_id: statusResponse.order_id,
        status: statusResponse.status || statusResponse.order_status,
        transaction_id: statusResponse.txn_id || statusResponse.transaction_id,
        amount: statusResponse.amount,
        currency: statusResponse.currency,
        payment_method: statusResponse.payment_method,
        customer_id: statusResponse.customer_id,
        merchant_id: statusResponse.merchant_id,
        created_at: statusResponse.date_created || statusResponse.created_at,
        updated_at: statusResponse.updated_at,
        status_id: statusResponse.status_id
      }
    });

  } catch (error) {
    console.error('HDFC payment status check (POST) error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 