// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sentry/nextjs'; 

export async function middleware(request: NextRequest) {
  // Sentry's instrumentation will automatically handle request tracking.
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
    '/((?!_next/static|_next/image|favicon.ico|api/health|sentry-test).*)',
    // Optionally include API routes if you want middleware to run on them
    // '/api/:path*',
  ],
};
