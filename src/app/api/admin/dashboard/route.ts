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
        // --- Date Ranges ---
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Sunday is 0, Monday is 1, etc.
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        // Adjust to the beginning of the week (assuming Sunday is the start)
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // --- Metric Calculations ---

        // 1. Revenue Metrics
        const revenueAggregate = await Transaction.aggregate([
            { $match: { status: 'Success' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    todayRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', today] }, '$amount', 0]
                        }
                    },
                    thisWeekRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0]
                        }
                    },
                    thisMonthRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$amount', 0]
                        }
                    }
                }
            }
        ]);

        const revenueData = revenueAggregate[0] || {};

        // 2. Order Metrics
        const [
            totalOrders,
            thisMonthOrders,
            thisWeekOrders,
            ordersToday,
            pendingIssues
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Order.countDocuments({ createdAt: { $gte: today } }),
            Order.countDocuments({ status: 'Processing' })
        ]);

        // 3. Customer Metrics
        const [
            totalCustomers,
            newCustomersThisMonth
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }), // Count only users, not admins
            User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } })
        ]);


        return NextResponse.json({
            summary: {
                totalRevenue: revenueData.totalRevenue || 0,
                thisMonthRevenue: revenueData.thisMonthRevenue || 0,
                thisWeekRevenue: revenueData.thisWeekRevenue || 0,
                todayRevenue: revenueData.todayRevenue || 0,
                
                totalOrders,
                thisMonthOrders,
                thisWeekOrders,
                ordersToday, // Kept from previous version, might be redundant but good to have
                
                totalCustomers,
                newCustomersThisMonth, // Renamed from newCustomers for clarity

                pendingIssues,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching admin dashboard summary:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
