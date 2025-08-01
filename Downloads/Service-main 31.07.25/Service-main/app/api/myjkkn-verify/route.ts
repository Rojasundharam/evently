/**
 * MyJKKN User Verification API Endpoint
 * Verifies if a user exists in MyJKKN staff or student lists
 */

import { NextRequest, NextResponse } from 'next/server';
import { myJKKNUserVerification } from '@/lib/myjkkn-user-verification';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: 'Email is required' 
        },
        { status: 400 }
      );
    }

    // Verify user with MyJKKN
    const result = await myJKKNUserVerification.verifyUser(email);

    // Return verification result
    return NextResponse.json(result);

  } catch (error) {
    console.error('MyJKKN verification API error:', error);
    
    return NextResponse.json(
      {
        isValid: false,
        userType: null,
        userData: null,
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for checking verification status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await myJKKNUserVerification.verifyUser(email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
} 