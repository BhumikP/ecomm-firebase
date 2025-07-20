
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order, { IOrder } from '@/models/Order';
import mongoose from 'mongoose';

// GET user's orders
export async function GET(req: NextRequest) {
  await connectDb();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Valid userId is required as a query parameter.' }, { status: 400 });
  }

  // TODO: In a real app, userId should come from a secure session/token,
  // and authorization should verify if the requesting user matches this userId or is an admin.

  try {
    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // Newest orders first
      .populate({
        path: 'items.productId', // Populate product details within each item
        model: 'Product',
        select: 'title thumbnailUrl price', // Select specific fields needed for order list
      })
      .lean(); // Use lean for performance if not modifying docs

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST to create a new order (stub - normally part of checkout flow)
export async function POST(req: NextRequest) {
  await connectDb();
  // TODO: Implement order creation logic, typically after successful payment.
  // This would involve:
  // 1. Authenticating the user.
  // 2. Validating cart contents and stock.
  // 3. Creating an order document with items, total, shipping address, userId, etc.
  // 4. Clearing the user's cart.

  return NextResponse.json({ message: 'Order creation endpoint not fully implemented. This is typically handled post-payment.' }, { status: 501 });
}
