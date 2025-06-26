// src/app/api/payments/cancel-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { razorpay_order_id, order_id } = await req.json();

    if (!razorpay_order_id || !order_id) {
        return NextResponse.json({ message: 'Missing order details for cancellation.' }, { status: 400 });
    }

    const order = await Order.findOne({ orderId: order_id, razorpay_order_id: razorpay_order_id });

    if (!order) {
      // It's okay if the order is not found, it might have been processed already.
      // We just log it and acknowledge the request.
      console.warn(`Attempted to cancel an order that was not found or already processed. Order ID: ${order_id}`);
      return NextResponse.json({ success: true, message: 'Acknowledged.' }, { status: 200 });
    }

    // Only cancel if it's still in the 'Pending' state
    if (order.status === 'Pending') {
      order.status = 'Cancelled';
      order.paymentStatus = 'Failed'; // Or a new 'Cancelled' status if you add it to the enum
      await order.save();
    }

    return NextResponse.json({ success: true, message: 'Order status updated for cancellation.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error handling payment cancellation:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
