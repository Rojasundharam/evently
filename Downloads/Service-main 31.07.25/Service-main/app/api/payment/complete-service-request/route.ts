import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedServiceId, userId, notes, orderId } = body;

    // Validate required fields
    if (!selectedServiceId || !userId || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: selectedServiceId, userId, orderId' },
        { status: 400 }
      );
    }

    console.log('Creating service request after payment:', {
      selectedServiceId,
      userId,
      orderId
    });

    // Create server-side Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use the system function to create service request (bypasses RLS)
    const { data: requestId, error: functionError } = await supabase
      .rpc('create_service_request_system', {
        p_service_id: selectedServiceId,
        p_requester_id: userId,
        p_status: 'pending',
        p_level: 1
      });

    if (functionError) {
      console.error('Service request function error:', functionError);
      throw new Error(`Error creating service request: ${functionError.message}`);
    }

    // Get the created service request details
    const { data: serviceRequest, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Service request creation error:', error);
      throw new Error(`Error creating service request: ${error.message}`);
    }

    if (serviceRequest) {
      console.log('Service request created successfully after payment:', serviceRequest);
      
      return NextResponse.json({
        success: true,
        serviceRequest,
        message: 'Service request created successfully after payment'
      });
    } else {
      throw new Error('Failed to create service request');
    }

  } catch (error) {
    console.error('Service request creation error after payment:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create service request after payment',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 