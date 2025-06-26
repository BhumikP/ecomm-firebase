// This file is deprecated and no longer used.
// The logic has been integrated into /api/checkout/initiate/route.ts
// to create the database order and the Razorpay order in a single atomic step.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use /api/checkout/initiate instead.' },
    { status: 410 } // 410 Gone
  );
}
