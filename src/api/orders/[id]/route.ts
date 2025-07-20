
// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order, { IOrder } from '@/models/Order';
import mongoose from 'mongoose';

interface Params {
  params: { id: string }; // This 'id' will be the MongoDB _id of the order
}

// GET a specific order by its MongoDB _id
export async function GET(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid order ID format' }, { status: 400 });
  }

  // TODO: Implement proper authentication and authorization.
  // For now, we'll assume the client fetches this if they have the ID.
  // In a real app:
  // 1. Get authenticated userId from session/token.
  // 2. Check if the user is an admin OR if order.userId matches authenticated userId.
  // const authenticatedUserId = '...'; // Get from session/token
  // const userRole = '...'; // Get from session/token

  try {
    const order = await Order.findById(id)
      .populate({
        path: 'items.productId', // Populate product details within each item
        model: 'Product',
        select: 'title thumbnailUrl', // Select specific fields for display
      })
      .lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Basic authorization check (placeholder)
    // if (userRole !== 'admin' && order.userId.toString() !== authenticatedUserId) {
    //   return NextResponse.json({ message: 'Unauthorized to view this order' }, { status: 403 });
    // }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
