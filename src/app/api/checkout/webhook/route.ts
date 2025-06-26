// src/app/api/checkout/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Transaction, { ITransaction } from '@/models/Transaction'; // Import Transaction model
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Function to create order from transaction, avoids code duplication
const createOrderFromTransaction = async (transaction: ITransaction, session: mongoose.ClientSession) => {
    const existingOrder = await Order.findOne({ transactionId: transaction._id }).session(session);
    if (existingOrder) {
        console.log(`Order for transaction ${transaction._id} already exists.`);
        return existingOrder;
    }
    
    const settings = await mongoose.model('Setting').findOne({ configKey: 'global_settings' }).session(session);
    const taxAmount = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) * ((settings?.taxPercentage || 0) / 100);
    const shippingCost = settings?.shippingCharge || 0;


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
            transactionId: transaction.razorpay_payment_id,
            razorpay_payment_id: transaction.razorpay_payment_id,
            razorpay_order_id: transaction.razorpay_order_id,
            razorpay_signature: transaction.razorpay_signature,
        },
        shippingCost,
        taxAmount,
    });
    
    await newOrder.save({ session });
    
    // Reduce stock
    for (const item of newOrder.items) {
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
    
    return newOrder;
};

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
    const payment = event.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    
    const transaction = await Transaction.findOne({ razorpay_order_id: razorpayOrderId }).session(session);

    if (!transaction) {
      console.warn(`Webhook received for non-existent transaction with Razorpay Order ID: ${razorpayOrderId}`);
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: 'Transaction not found, but acknowledged.' }, { status: 200 });
    }
    
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      if (transaction.status === 'Success') {
        console.log(`Webhook received for already successful transaction: ${transaction._id}`);
      } else {
        transaction.status = 'Success';
        transaction.razorpay_payment_id = payment.id;
        await transaction.save({ session });
        
        // Create order since this is the source of truth
        await createOrderFromTransaction(transaction, session);
      }
    } else if (event.event === 'payment.failed') {
        if (transaction.status !== 'Success') {
            transaction.status = 'Failed';
            await transaction.save({ session });
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
