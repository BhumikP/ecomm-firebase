// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sentry/nextjs'; // Import Sentry client if needed for specific checks

// Initialize Sentry (This line is often handled by Sentry's automatic instrumentation, but can be included for clarity)
// You typically don't need to manually call init here if using the automatic setup.

// Example middleware (adjust as needed)
export async function middleware(request: NextRequest) {
  // Sentry's instrumentation will automatically handle request tracking if configured correctly.
  // You don't usually need to add Sentry-specific code *inside* the middleware function itself
  // unless you want to add custom tags, context, or perform specific checks based on Sentry data.

  // Example: Log request path (optional)
  // console.log(`Middleware handling request: ${request.nextUrl.pathname}`);

  // Example: Add custom tag to Sentry events for this request
  // const sentry = createClient(); // Get Sentry client if needed
  // sentry.setTag("middleware_handled", "true");

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  // Matcher specifies routes where the middleware should run.
  // Adjust this to include all paths where you want Sentry request instrumentation.
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
