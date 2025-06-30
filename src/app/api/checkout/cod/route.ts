// src/app/api/checkout/cod/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Setting from '@/models/Setting';

export async function POST(req: NextRequest) {
  await connectDb();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, shippingAddress } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
    }
    if (!shippingAddress) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: 'Shipping address is required.' }, { status: 400 });
    }

    const cart = await Cart.findOne({ userId }).session(session).populate('items.product');
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 });
    }

    const settings = await Setting.findOne({ configKey: 'global_settings' }).session(session);
    const taxPercentage = settings?.taxPercentage || 0;
    const shippingCharge = settings?.shippingCharge || 0;

    let subtotal = 0;
    const orderItems = [];

    // Validate stock and prepare order items
    for (const item of cart.items) {
      const product = item.product as any;
      if (!product) throw new Error(`Product with ID ${item.product} not found in cart.`);

      const availableStock = item.selectedColorSnapshot?.name && product.colors?.length > 0
        ? product.colors.find((c: any) => c.name === item.selectedColorSnapshot!.name)?.stock ?? 0
        : product.stock;
      
      if (item.quantity > availableStock) {
        throw new Error(`Insufficient stock for product: ${product.title}`);
      }

      const price = product.discount && product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        productId: product._id,
        productName: product.title,
        quantity: item.quantity,
        price: price,
        image: item.imageSnapshot,
        selectedColorSnapshot: item.selectedColorSnapshot
      });
    }

    const taxAmount = subtotal * (taxPercentage / 100);
    const totalAmount = subtotal + taxAmount + shippingCharge;

    // Create the order
    const newOrder = new Order({
        userId,
        orderId: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
        items: orderItems,
        total: totalAmount,
        shippingAddress,
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        status: 'Processing',
        shippingCost: shippingCharge,
        taxAmount,
    });
    await newOrder.save({ session });

    // Decrement stock
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
        
        // Recalculate total stock if color variants exist
        if (product.colors && product.colors.length > 0) {
            product.stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
        }

        await product.save({ session });
    }

    // Clear the cart
    await Cart.deleteOne({ userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
        success: true,
        message: 'Order placed successfully',
        orderId: newOrder.orderId,
    }, { status: 201 });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error processing COD order:', error);
    return NextResponse.json({ message: error.message || 'Internal server error.', error: error.message }, { status: 500 });
  }
}
