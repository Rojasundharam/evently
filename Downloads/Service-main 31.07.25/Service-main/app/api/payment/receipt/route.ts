import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch service request and payment data
    const { data: serviceRequest, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        services (
          name,
          description,
          amount,
          currency,
          payment_method
        )
      `)
      .eq('id', orderId.replace('ORD', '')) // Try to match service request
      .single();

    let paymentData = {
      orderId,
      transactionId: transactionId || 'N/A',
      amount: '100.00',
      currency: 'INR',
      paymentMethod: 'HDFC SmartGateway',
      serviceName: 'Service Request',
      serviceDescription: 'Payment for service request',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      status: 'Completed'
    };

    // If we found service request data, use it
    if (serviceRequest && serviceRequest.services) {
      paymentData = {
        ...paymentData,
        amount: serviceRequest.services.amount?.toFixed(2) || '100.00',
        currency: serviceRequest.services.currency || 'INR',
        serviceName: serviceRequest.services.name || 'Service Request',
        serviceDescription: serviceRequest.services.description || 'Payment for service request'
      };
    }

    // Try to get stored payment data from localStorage (for recent payments)
    // This is passed via URL parameters from the success page
    const amountParam = searchParams.get('amount');
    const serviceParam = searchParams.get('service');
    
    if (amountParam) {
      paymentData.amount = amountParam;
    }
    if (serviceParam) {
      paymentData.serviceName = decodeURIComponent(serviceParam);
    }

    // Generate receipt HTML
    const receiptHtml = generateReceiptHtml(paymentData);

    // Return HTML response for printing/saving as PDF
    return new Response(receiptHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="receipt-${orderId}.html"`
      }
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}

function generateReceiptHtml(data: {
  orderId: string;
  transactionId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  serviceName: string;
  serviceDescription: string;
  date: string;
  time: string;
  status: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - ${data.orderId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .receipt-header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .receipt-title {
            color: #2563eb;
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
        }
        .receipt-subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .receipt-body {
            margin-bottom: 30px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            font-family: 'Courier New', monospace;
            color: #1f2937;
        }
        .service-section {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .amount-row {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .amount-row .detail-value {
            font-size: 20px;
            font-weight: bold;
            color: #059669;
        }
        .status-completed {
            color: #059669;
            font-weight: bold;
        }
        .receipt-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .print-btn {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .print-btn:hover {
            background-color: #1d4ed8;
        }
        @media print {
            .print-btn {
                display: none;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-header">
        <h1 class="receipt-title">Payment Receipt</h1>
        <p class="receipt-subtitle">JKKN Service Management System</p>
    </div>

    <div class="receipt-body">
        <div class="service-section">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">Service Details</h3>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${data.serviceName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${data.serviceDescription}</span>
            </div>
        </div>

        <div class="detail-row">
            <span class="detail-label">Order ID:</span>
            <span class="detail-value">${data.orderId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">${data.transactionId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${data.date}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${data.time}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${data.paymentMethod}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-completed">${data.status}</span>
        </div>
        
        <div class="amount-row">
            <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">${data.currency} ${data.amount}</span>
            </div>
        </div>
    </div>

    <button class="print-btn" onclick="window.print()">
        🖨️ Print Receipt
    </button>

    <div class="receipt-footer">
        <p><strong>Thank you for your payment!</strong></p>
        <p>This is a computer generated receipt and does not require a signature.</p>
        <p>For any queries, please contact support with your transaction ID: <strong>${data.transactionId}</strong></p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br>
        <p style="font-size: 12px; color: #9ca3af;">
            JKKN Service Management System - Digital Receipt<br>
            This receipt serves as proof of payment for your service request.
        </p>
    </div>

    <script>
        // Auto-print option
        if (window.location.hash === '#print') {
            window.print();
        }
        
        // Save as PDF option
        function savePDF() {
            window.print();
        }
    </script>
</body>
</html>
  `;
} 