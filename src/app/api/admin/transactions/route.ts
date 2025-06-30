
// src/app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Transaction, { ITransaction } from '@/models/Transaction';
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

    const mongoQuery: mongoose.FilterQuery<ITransaction> = {};

    if (searchQuery) {
      const regex = { $regex: searchQuery, $options: 'i' };
      mongoQuery.$or = [
        { razorpay_order_id: regex },
        { razorpay_payment_id: regex },
      ];
      // To search by user name/email, we'd need an aggregation pipeline
    }

    if (status && status !== 'all') {
      const validStatuses = ['Pending', 'Success', 'Failed', 'Cancelled'];
      if (validStatuses.includes(status)) {
        mongoQuery.status = status as ITransaction['status'];
      } else {
        return NextResponse.json({ message: `Invalid transaction status filter: ${status}` }, { status: 400 });
      }
    }

    const transactions = await Transaction.find(mongoQuery)
      .populate('userId', 'name email') // Populate user details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Transaction.countDocuments(mongoQuery);

    return NextResponse.json({
      transactions,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching transactions for admin:', error);
    return NextResponse.json({ message: 'Internal server error while fetching transactions' }, { status: 500 });
  }
}
