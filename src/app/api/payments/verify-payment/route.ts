// src/app/api/payments/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Setting from '@/models/Setting'; // Import Setting model
import Cart from '@/models/Cart'; // Import Cart model for deletion

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return NextResponse.json({ success: false, message: 'Missing payment details.' }, { status: 400 });
    }

    const isSignatureValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isSignatureValid) {
      // Find transaction and mark as failed
      await Transaction.findByIdAndUpdate(transactionId, { status: 'Failed' });
      return NextResponse.json({ success: false, message: 'Invalid payment signature.' }, { status: 400 });
    }

    // Signature is valid, find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found.' }, { status: 404 });
    }

    if (transaction.status === 'Success') {
        const order = await Order.findOne({ transactionId: transaction._id });
        return NextResponse.json({ success: true, message: 'Payment already verified.', orderId: order?.orderId }, { status: 200 });
    }

    // Update transaction status to Success
    transaction.status = 'Success';
    transaction.razorpay_payment_id = razorpay_payment_id;
    transaction.razorpay_signature = razorpay_signature;
    await transaction.save();

    // Fetch settings to calculate final costs for the order
    const settings = await Setting.findOne({ configKey: 'global_settings' });
    const taxPercentage = settings?.taxPercentage || 0;
    const shippingCharge = settings?.shippingCharge || 0;
    const subtotal = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (taxPercentage / 100);

    // Create the Order since payment is successful
    const newOrder = new Order({
        userId: transaction.userId,
        orderId: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
        transactionId: transaction._id,
        items: transaction.items,
        total: transaction.amount,
        currency: transaction.currency,
        shippingAddress: transaction.shippingAddress,
        paymentMethod: 'Razorpay',
        paymentDetails: {
            gateway: 'Razorpay',
            transactionId: razorpay_payment_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            razorpay_signature: razorpay_signature,
        },
        shippingCost: shippingCharge,
        taxAmount: taxAmount,
    });
    await newOrder.save();
    
    // Clear the user's cart for immediate UI feedback.
    await Cart.deleteOne({ userId: transaction.userId });
    console.log(`Cart for user ${transaction.userId} cleared after successful payment verification.`);


    // NOTE: Stock reduction should be handled definitively by the webhook to prevent race conditions.
    // This API provides a fast response to the user, but the webhook is the ultimate source of truth.

    return NextResponse.json({ success: true, message: 'Payment verified and order created.', orderId: newOrder.orderId }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
