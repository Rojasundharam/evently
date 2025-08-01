import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/utils/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

// Define protected routes that require authentication (but not MyJKKN verification for now)
const PROTECTED_ROUTES = [
  '/user-management',
  '/analytics',
  '/notifications',
  '/services',
  '/service-requests',
  '/departments',
  '/institutions',
  '/programs',
  '/myjkkn',
  
  '/admin'
];

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Allow root path to handle its own auth redirect
  '/login',
  '/logout',
  '/api/auth',
  '/api/myjkkn-verify', // Our verification endpoint
  '/auth/callback',
  '/auth/auth-code-error',
  '/payment', // Payment pages (success, failure, error)
  '/api/payment' // Payment API routes
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except our verification)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') && !pathname.startsWith('/api/myjkkn-verify') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires protection
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Update session first (this handles auth cookies)
    const response = await updateSession(request);
    
    // Create Supabase client for this request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    );

    // Get user session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Redirect to login if no session
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TEMPORARILY DISABLED: MyJKKN verification for development
    // TODO: Re-enable MyJKKN verification once the system is stable
    /*
    // Get user email
    const userEmail = user.email;
    if (!userEmail) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no-email');
      return NextResponse.redirect(loginUrl);
    }

    // Check MyJKKN verification status from headers or make verification request
    const verificationResult = await verifyUserWithMyJKKN(userEmail, request);

    if (!verificationResult.isValid) {
      // Redirect to access denied page
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('reason', verificationResult.error || 'not-in-myjkkn');
      return NextResponse.redirect(accessDeniedUrl);
    }

    // Add user verification info to headers for the app to use
    response.headers.set('x-user-verified', 'true');
    response.headers.set('x-user-type', verificationResult.userType || '');
    response.headers.set('x-user-email', userEmail);
    */

    // Add basic user info to headers
    response.headers.set('x-user-verified', 'true');
    response.headers.set('x-user-email', user.email || '');

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // Redirect to login instead of error page for better UX
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'auth-failed');
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Verify user with MyJKKN API
 * TEMPORARILY DISABLED FOR DEVELOPMENT
 */
async function verifyUserWithMyJKKN(email: string, request: NextRequest) {
  try {
    // Make internal API call to our verification endpoint
    const verificationUrl = new URL('/api/myjkkn-verify', request.url);
    
    const verificationResponse = await fetch(verificationUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    if (!verificationResponse.ok) {
      throw new Error('Verification API failed');
    }

    const result = await verificationResponse.json();
    return result;
    
  } catch (error) {
    console.error('MyJKKN verification failed:', error);
    return {
      isValid: false,
      userType: null,
      userData: null,
      error: 'Verification service unavailable'
    };
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (OAuth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}; 