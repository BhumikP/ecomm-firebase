// src/app/api/payments/route.ts
// This file is now a placeholder as Razorpay integration uses its own routes.
// It can be removed or repurposed if another payment provider is added later.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use Razorpay checkout flow.' },
    { status: 404 }
  );
}
