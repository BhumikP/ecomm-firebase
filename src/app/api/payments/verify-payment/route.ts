// src/app/api/payments/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Missing payment details.' }, { status: 400 });
    }

    const isSignatureValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isSignatureValid) {
      return NextResponse.json({ success: false, message: 'Invalid payment signature.' }, { status: 400 });
    }

    // Signature is valid, find the order and update its status
    const order = await Order.findOne({ razorpay_order_id });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    // Update order status. The webhook will handle stock deduction as the final source of truth.
    order.paymentStatus = 'Paid';
    order.status = 'Processing';
    order.paymentDetails = {
      gateway: 'Razorpay',
      transactionId: razorpay_payment_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    };
    await order.save();

    return NextResponse.json({ success: true, message: 'Payment verified successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
