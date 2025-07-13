// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sentry/nextjs'; 

export async function middleware(request: NextRequest) {
  // Sentry's instrumentation will automatically handle request tracking.
  const { pathname } = request.nextUrl;

  // Protect all /account routes
  if (pathname.startsWith('/account')) {
    const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); // Optional: redirect back after login
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
    const userRole = request.cookies.get('userRole')?.value;
    if (!isLoggedIn || userRole !== 'admin') {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health|sentry-test|api/checkout/webhook).*)',
    // Optionally include API routes if you want middleware to run on them
    // '/api/:path*',
  ],
};
