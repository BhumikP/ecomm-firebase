
// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order from '@/models/Order'; // Assuming you have an Order model
import { processPayment, PaymentDetails, PaymentResult } from '@/services/juspay'; // Import Juspay service

// TODO: Import and implement proper authentication middleware
// import { isAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    await connectDb();

    // --- Authentication Check ---
    // const user = await isAuthenticatedUser(req);
    // if (!user) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // --- End Placeholder Auth Check ---


    try {
        // 1. Extract payment details from request body
        // This should include order ID, amount, currency, potentially user details
        const { orderId, amount, currency /*, other necessary details */ } = await req.json();

        if (!orderId || !amount || !currency) {
            return NextResponse.json({ message: 'Missing required payment details (orderId, amount, currency)' }, { status: 400 });
        }

        // 2. Fetch the corresponding order from the database (optional but recommended)
        // Ensure the order exists, belongs to the user, and the amount matches
        // const order = await Order.findOne({ _id: orderId, userId: user._id }); // Adjust based on your Order model
        // if (!order) {
        //     return NextResponse.json({ message: 'Order not found or unauthorized' }, { status: 404 });
        // }
        // if (order.total !== amount || order.currency !== currency) {
        //     return NextResponse.json({ message: 'Payment amount or currency mismatch' }, { status: 400 });
        // }
        // if (order.paymentStatus === 'Paid') {
        //     return NextResponse.json({ message: 'Order already paid' }, { status: 400 });
        // }


        // 3. Prepare payment details for Juspay
        const paymentDetails: PaymentDetails = {
            amount: amount,
            currency: currency,
            orderId: orderId,
            // customerEmail: user.email, // Pass customer email
            customerEmail: "customer@example.com" // Placeholder email
            // Add other required fields for Juspay API
        };

        // 4. Call the Juspay payment processing service
        // This is where the actual interaction with the Juspay SDK/API happens
        const paymentResult: PaymentResult = await processPayment(paymentDetails);

        // 5. Handle the payment result
        if (paymentResult.success) {
            // Payment successful: Update order status in your database
            // await Order.findByIdAndUpdate(orderId, {
            //     paymentStatus: 'Paid',
            //     paymentDetails: { // Store relevant payment info (optional)
            //         transactionId: paymentResult.transactionId,
            //         gateway: 'Juspay',
            //         // etc.
            //     },
            //     status: 'Processing' // Update order status if needed
            // });

            console.log(`Payment successful for order ${orderId}, Transaction ID: ${paymentResult.transactionId}`);

            return NextResponse.json({
                message: 'Payment successful',
                orderId: orderId,
                transactionId: paymentResult.transactionId
            }, { status: 200 });

        } else {
            // Payment failed: Log error, potentially update order status to 'Payment Failed'
            // await Order.findByIdAndUpdate(orderId, {
            //     paymentStatus: 'Failed',
            // });
             console.error(`Payment failed for order ${orderId}: ${paymentResult.errorMessage}`);
            return NextResponse.json({
                message: 'Payment failed',
                error: paymentResult.errorMessage || 'Unknown payment processing error'
            }, { status: 400 }); // Use 400 or appropriate error code
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        // Check for specific error types if needed
        return NextResponse.json({ message: 'Internal server error during payment processing' }, { status: 500 });
    }
}
