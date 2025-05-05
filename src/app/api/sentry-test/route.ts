// src/app/api/sentry-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
  try {
    // Simulate an error
    throw new Error("Sentry Test Error from API Route");
  } catch (error) {
     // Manually capture the exception to send it to Sentry
     Sentry.captureException(error);

     // Return an error response to the client
     return NextResponse.json(
       { message: "An intentional error occurred and was reported to Sentry." },
       { status: 500 }
     );
  }
}
