
// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order, { IOrder } from '@/models/Order';
import mongoose from 'mongoose';

const DEFAULT_PAGE_LIMIT = 10;

// TODO: Implement proper admin authentication/authorization middleware

export async function GET(req: NextRequest) {
  await connectDb();

  // const isAdmin = await checkAdminAuth(req); // Placeholder for admin check
  // if (!isAdmin) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('searchQuery') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10);
    const skip = (page - 1) * limit;

    const mongoQuery: mongoose.FilterQuery<IOrder> = {};

    if (searchQuery) {
      const regex = { $regex: searchQuery, $options: 'i' };
      mongoQuery.$or = [
        { orderId: regex },
        { 'paymentDetails.transactionId': regex },
        // Note: Searching by customer email directly on Order model isn't possible
        // if email is not stored there. If userId was on Order and populated,
        // a more complex aggregation would be needed.
      ];
    }

    if (status && status !== 'all') {
      // Ensure status matches one of the allowed enum values for paymentStatus
      const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
      if (validStatuses.includes(status)) {
        mongoQuery.paymentStatus = status as IOrder['paymentStatus'];
      } else {
        return NextResponse.json({ message: `Invalid payment status filter: ${status}` }, { status: 400 });
      }
    }

    const orders = await Order.find(mongoQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use .lean() for better performance if not modifying docs

    const totalCount = await Order.countDocuments(mongoQuery);

    return NextResponse.json({
      orders,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching orders for admin:', error);
    return NextResponse.json({ message: 'Internal server error while fetching orders' }, { status: 500 });
  }
}
