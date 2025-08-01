import { NextRequest, NextResponse } from 'next/server';
import { hdfcStatusHandler } from '@/lib/hdfc-status-handler';

export async function POST(request: NextRequest) {
  try {
    const { order_id, poll_until_terminal } = await request.json();

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: order_id' },
        { status: 400 }
      );
    }

    console.log(`Admin: Fetching transaction status for Order ID: ${order_id}`);

    let result;
    
    if (poll_until_terminal) {
      // Poll until terminal status (following HDFC best practices)
      console.log('Polling until terminal status...');
      result = await hdfcStatusHandler.pollTransactionStatus(order_id, 10, 3000); // 10 attempts, 3 seconds interval
    } else {
      // Single status check
      result = await hdfcStatusHandler.checkTransactionStatus(order_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction status fetched and stored successfully',
      result: {
        orderId: result.orderId,
        status: result.status,
        statusId: result.statusId,
        isTerminal: result.isTerminal,
        shouldPoll: result.shouldPoll,
        transactionId: result.transactionId,
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        message: result.message,
        actionable: result.actionable
      },
      hdfc_response: result.rawResponse
    });

  } catch (error) {
    console.error('Fetch transaction status error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

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

    console.log(`Admin: Quick status check for Order ID: ${order_id}`);

    const result = await hdfcStatusHandler.checkTransactionStatus(order_id);

    return NextResponse.json({
      success: true,
      message: 'Transaction status fetched successfully',
      result: {
        orderId: result.orderId,
        status: result.status,
        statusId: result.statusId,
        isTerminal: result.isTerminal,
        shouldPoll: result.shouldPoll,
        transactionId: result.transactionId,
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        message: result.message,
        actionable: result.actionable
      },
      hdfc_response: result.rawResponse
    });

  } catch (error) {
    console.error('Quick transaction status error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 