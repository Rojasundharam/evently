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

    // Fetch bank test cases (with error handling)
    const { data: testCases, error } = await supabase
      .from('bank_test_cases')
      .select(`
        id,
        test_case_id,
        test_scenario,
        test_description,
        test_amount,
        test_currency,
        expected_result,
        actual_result,
        test_status,
        error_messages,
        vulnerabilities_found,
        executed_by,
        execution_date,
        execution_duration,
        testing_phase,
        phase_notes,
        created_at,
        updated_at
      `)
      .order('test_case_id', { ascending: true });

    if (error) {
      console.error('Error fetching bank test cases:', error);
      
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Bank test cases table not yet created. Run migration first.'
        });
      }
      
      return NextResponse.json({
        success: true,
        data: [],
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      data: testCases || []
    });

  } catch (error) {
    console.error('Bank test cases API error:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Error fetching test cases. Please check configuration.'
    });
  }
} 