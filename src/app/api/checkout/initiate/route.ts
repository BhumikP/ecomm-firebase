// src/app/api/checkout/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Order from '@/models/Order';
import Setting from '@/models/Setting';
import Product from '@/models/Product';
import { razorpayInstance } from '@/lib/razorpay';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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
    const orderItems = cart.items.map(item => {
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
    
    const newOrder = new Order({
      userId,
      orderId: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
      items: orderItems,
      total: totalAmount,
      currency: 'INR',
      status: 'Pending',
      paymentStatus: 'Pending',
      shippingAddress,
      paymentMethod: 'Razorpay',
      shippingCost: shippingCharge,
      taxAmount,
    });
    
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: newOrder.orderId,
    };
    
    const razorpayOrder = await razorpayInstance.orders.create(options);
    
    newOrder.razorpay_order_id = razorpayOrder.id;
    await newOrder.save();
    
    // Remove cart after order is successfully created
    await Cart.findByIdAndDelete(cart._id);
    
    return NextResponse.json({
      success: true,
      message: 'Order initiated',
      order: newOrder,
      razorpayOrder,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error initiating checkout:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
