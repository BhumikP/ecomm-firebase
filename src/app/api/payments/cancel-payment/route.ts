// src/app/api/payments/cancel-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Transaction from '@/models/Transaction'; // Use Transaction model

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
        return NextResponse.json({ message: 'Missing transaction ID for cancellation.' }, { status: 400 });
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      console.warn(`Attempted to cancel a transaction that was not found. Transaction ID: ${transactionId}`);
      return NextResponse.json({ success: true, message: 'Acknowledged.' }, { status: 200 });
    }

    // Only cancel if it's still in the 'Pending' state
    if (transaction.status === 'Pending') {
      transaction.status = 'Cancelled';
      await transaction.save();
    }

    return NextResponse.json({ success: true, message: 'Transaction status updated to cancelled.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error handling payment cancellation:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
