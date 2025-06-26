// src/app/api/checkout/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Setting from '@/models/Setting';
import Transaction from '@/models/Transaction'; // Import Transaction model
import { razorpayInstance } from '@/lib/razorpay';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  await connectDb();

  try {
    const { userId, shippingAddress } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ message: 'Shipping address is required.' }, { status: 400 });
    }

    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 });
    }

    const settings = await Setting.findOne({ configKey: 'global_settings' });
    const taxPercentage = settings?.taxPercentage || 0;
    const shippingCharge = settings?.shippingCharge || 0;

    let subtotal = 0;
    const transactionItems = cart.items.map(item => {
      const product = item.product as any;
      if (!product) throw new Error(`Product with ID ${item.product} not found in cart.`);
      const price = product.discount && product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;
      subtotal += price * item.quantity;
      return {
        productId: product._id,
        productName: product.title,
        quantity: item.quantity,
        price: price,
        image: item.imageSnapshot,
        selectedColorSnapshot: item.selectedColorSnapshot
      };
    });

    const taxAmount = subtotal * (taxPercentage / 100);
    const totalAmount = subtotal + taxAmount + shippingCharge;
    
    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100), // amount in smallest currency unit
      currency: 'INR',
      receipt: `receipt_user_${userId}_${Date.now()}`,
    };
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Create a new Transaction document in our DB
    const newTransaction = new Transaction({
        userId,
        items: transactionItems,
        shippingAddress,
        amount: totalAmount,
        currency: 'INR',
        status: 'Pending',
        razorpay_order_id: razorpayOrder.id,
    });
    await newTransaction.save();
    
    return NextResponse.json({
      success: true,
      message: 'Transaction initiated',
      transactionId: newTransaction._id, // Send our internal transaction ID to client
      razorpayOrder,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error initiating checkout:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
