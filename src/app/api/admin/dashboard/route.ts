
// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
// TODO: Admin auth check

export async function GET(req: NextRequest) {
    await connectDb();

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Total Revenue from successful transactions
        const revenueData = await Transaction.aggregate([
            { $match: { status: 'Success' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueData[0]?.totalRevenue || 0;

        // 2. New Customers this month
        const newCustomers = await User.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // 3. Orders placed today
        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // 4. Pending Issues (orders with 'Processing' status)
        const pendingIssues = await Order.countDocuments({
            status: 'Processing'
        });

        return NextResponse.json({
            summary: {
                totalRevenue,
                newCustomers,
                ordersToday,
                pendingIssues,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching admin dashboard summary:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
