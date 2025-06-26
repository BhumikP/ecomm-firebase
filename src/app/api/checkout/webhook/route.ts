// src/app/api/checkout/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import mongoose from 'mongoose';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ message: 'Webhook secret not configured.' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  if (!signature) {
    return NextResponse.json({ message: 'Signature missing from header.' }, { status: 400 });
  }

  const isVerified = verifyRazorpayWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET);

  if (!isVerified) {
    return NextResponse.json({ message: 'Invalid webhook signature.' }, { status: 400 });
  }

  await connectDb();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = JSON.parse(body);
    
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const order = await Order.findOne({ razorpay_order_id: razorpayOrderId }).session(session);

      if (!order) {
        console.warn(`Webhook received for non-existent order with Razorpay Order ID: ${razorpayOrderId}`);
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ message: 'Order not found, but acknowledged.' }, { status: 200 });
      }

      if (order.paymentStatus === 'Paid') {
        console.log(`Webhook received for already paid order: ${order.orderId}`);
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ message: 'Order already processed.' }, { status: 200 });
      }

      order.paymentStatus = 'Paid';
      order.status = 'Processing';
      order.paymentDetails = {
        gateway: 'Razorpay',
        transactionId: payment.id,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
      };

      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) throw new Error(`Product with ID ${item.productId} not found during stock reduction.`);

        if (item.selectedColorSnapshot?.name && product.colors?.length > 0) {
          const colorIndex = product.colors.findIndex(c => c.name === item.selectedColorSnapshot!.name);
          if (colorIndex > -1) {
            product.colors[colorIndex].stock -= item.quantity;
            if (product.colors[colorIndex].stock < 0) {
              throw new Error(`Insufficient stock for color ${item.selectedColorSnapshot.name} of product ${product.title}`);
            }
          }
        }
        product.stock -= item.quantity;
        if (product.stock < 0) {
          throw new Error(`Insufficient stock for product ${product.title}`);
        }
        await product.save({ session });
      }
      
      await order.save({ session });
    } else if (event.event === 'payment.failed') {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        const order = await Order.findOne({ razorpay_order_id: razorpayOrderId }).session(session);
        if(order && order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Failed';
            order.status = 'Payment Failed';
            await order.save({session});
        }
    }

    await session.commitTransaction();
    session.endSession();
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ message: 'Webhook processing error.', error: error.message }, { status: 500 });
  }
}
