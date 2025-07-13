
// src/app/api/payments/verify-payment/route.ts
// This route is now SPECIFIC to Razorpay verification.
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Setting from '@/models/Setting';
import Cart from '@/models/Cart';
import Product from '@/models/Product'; // Needed for stock reduction

export async function POST(req: NextRequest) {
  await connectDb();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ success: false, message: 'Missing payment details.' }, { status: 400 });
    }

    const isSignatureValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isSignatureValid) {
      await Transaction.findByIdAndUpdate(transactionId, { status: 'Failed' }, { session });
      await session.commitTransaction();
      session.endSession();
      return NextResponse.json({ success: false, message: 'Invalid payment signature.' }, { status: 400 });
    }

    const transaction = await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ success: false, message: 'Transaction not found.' }, { status: 404 });
    }

    if (transaction.status === 'Success') {
      const order = await Order.findOne({ transactionId: transaction._id }).session(session);
      await session.commitTransaction();
      session.endSession();
      return NextResponse.json({ success: true, message: 'Payment already verified.', orderId: order?.orderId }, { status: 200 });
    }

    transaction.status = 'Success';
    transaction.razorpay_payment_id = razorpay_payment_id;
    transaction.razorpay_signature = razorpay_signature;
    await transaction.save({ session });

    const settings = await Setting.findOne({ configKey: 'global_settings' }).session(session);
    const taxPercentage = settings?.taxPercentage || 0;
    const shippingCharge = settings?.shippingCharge || 0;
    const subtotal = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (taxPercentage / 100);

    const newOrder = new Order({
        userId: transaction.userId,
        orderId: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
        transactionId: transaction._id,
        items: transaction.items,
        total: transaction.amount,
        currency: transaction.currency,
        shippingAddress: transaction.shippingAddress,
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid',
        paymentDetails: {
            gateway: 'Razorpay',
            transactionId: razorpay_payment_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            razorpay_signature: razorpay_signature,
        },
        shippingCost: shippingCharge,
        taxAmount: taxAmount,
        totalBargainDiscount: transaction.items.reduce((acc, item) => acc + (item.bargainDiscount || 0) * item.quantity, 0),
    });
    await newOrder.save({ session });

    for (const item of newOrder.items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product with ID ${item.productId} not found during stock reduction.`);
      let stockUpdated = false;
      if (item.selectedColorSnapshot?.name && product.colors?.length > 0) {
        const colorIndex = product.colors.findIndex(c => c.name === item.selectedColorSnapshot!.name);
        if (colorIndex > -1) {
          product.colors[colorIndex].stock -= item.quantity;
          stockUpdated = true;
        }
      }
      if (!stockUpdated) {
        product.stock -= item.quantity;
      }
      if (product.colors && product.colors.length > 0) {
        product.stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
      }
      await product.save({ session });
    }

    await Cart.deleteOne({ userId: transaction.userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ success: true, message: 'Payment verified and order created.', orderId: newOrder.orderId }, { status: 200 });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
