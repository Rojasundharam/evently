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
      .from('security_audit_log')
      .select(`
        id,
        event_type,
        severity,
        event_description,
        order_id,
        detected_at,
        created_at
      `);

    // Filter by order_id if provided
    if (orderId) {
      query = query.eq('order_id', orderId);
    } else {
      query = query.order('detected_at', { ascending: false }).limit(200);
    }

    const { data: securityLogs, error } = await query;

    if (error) {
      console.error('Error fetching security audit logs:', error);
      
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Security audit log table not yet created. Run migration first.'
        });
      }
      
      return NextResponse.json({
        success: true,
        data: [],
        error: error.message
      });
    }

    // Transform data to match expected format
    const transformedLogs = securityLogs?.map(log => ({
      ...log,
      description: log.event_description,
      created_at: log.detected_at || log.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedLogs,
      logs: transformedLogs,
      count: transformedLogs.length
    });

  } catch (error) {
    console.error('Security audit logs API error:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Error fetching security audit logs. Please check configuration.'
    });
  }
} 