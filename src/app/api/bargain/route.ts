// src/app/api/bargain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bargainForCart } from '@/ai/flows/bargain-flow';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, prompt, cartItems } = body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ message: 'A bargaining prompt is required.' }, { status: 400 });
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ message: 'Cart items are required for bargaining.' }, { status: 400 });
    }

    // Call the Genkit flow
    const result = await bargainForCart({ userId, prompt, cartItems });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error in bargain API route:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
