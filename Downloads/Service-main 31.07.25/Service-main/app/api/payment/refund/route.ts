import { NextRequest, NextResponse } from 'next/server';
import { hdfcPaymentService } from '@/lib/hdfc-payment';
import { HDFCRefundRequest } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, refund_amount, refund_note } = body;

    // Validate required fields
    if (!order_id || !refund_amount) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, refund_amount' },
        { status: 400 }
      );
    }

    // Validate refund amount
    if (isNaN(refund_amount) || refund_amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Prepare refund data with required HDFC fields
    const refundData: HDFCRefundRequest = {
      order_id,
      refund_amount: hdfcPaymentService.formatAmount(refund_amount),
      refund_note: refund_note || `Refund for order ${order_id}`,
    };

    console.log('Processing HDFC refund:', {
      order_id,
      refund_amount: refundData.refund_amount
    });

    // Process refund with HDFC
    const refundResponse = await hdfcPaymentService.processRefund(refundData);

    console.log('HDFC refund processed successfully:', {
      refund_id: refundResponse.refund_id,
      order_id: refundResponse.order_id,
      refund_ref_no: refundResponse.refund_ref_no,
      status: refundResponse.status
    });

    // Here you would typically save the refund response to your database
    // Example: await saveRefundResponse(refundResponse);

    return NextResponse.json({
      success: true,
      refund: refundResponse,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('HDFC refund processing error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process refund',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 