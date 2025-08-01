import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to environment variables.'
      });
    }

    // Create service client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    // Build query
    let query = supabase
      .from('payment_sessions')
      .select(`
        id,
        order_id,
        customer_email,
        customer_phone,
        amount,
        currency,
        session_status,
        hdfc_session_response,
        test_case_id,
        test_scenario,
        created_at
      `);

    // Filter by order_id if provided
    if (orderId) {
      query = query.eq('order_id', orderId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(100);
    }

    const { data: paymentSessions, error } = await query;

    if (error) {
      console.error('Error fetching payment sessions:', error);
      
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Payment sessions table not yet created. Run migration first.'
        });
      }
      
      return NextResponse.json({
        success: true,
        data: [],
        error: error.message
      });
    }

    // For single order lookup, return the first session directly
    if (orderId && paymentSessions && paymentSessions.length > 0) {
      return NextResponse.json({
        success: true,
        sessions: paymentSessions,
        session: paymentSessions[0], // Single session for backward compatibility
        count: paymentSessions.length
      });
    }

    return NextResponse.json({
      success: true,
      data: paymentSessions || [],
      sessions: paymentSessions || [],
      count: paymentSessions?.length || 0
    });

  } catch (error) {
    console.error('Payment sessions API error:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Error fetching payment sessions. Please check configuration.'
    });
  }
} 