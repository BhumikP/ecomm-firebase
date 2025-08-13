// src/app/api/razorpay/test/route.ts
import { razorpayInstance } from '@/lib/razorpay';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are available
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    const status = {
      keyIdAvailable: !!keyId,
      keySecretAvailable: !!keySecret,
      keyIdFormat: keyId ? (keyId.startsWith('rzp_test_') ? 'test' : keyId.startsWith('rzp_live_') ? 'live' : 'invalid') : 'missing',
      instanceCreated: !!razorpayInstance,
      timestamp: new Date().toISOString()
    };
    
    if (!razorpayInstance) {
      return NextResponse.json({
        success: false,
        message: 'Razorpay instance not created',
        status,
        troubleshooting: [
          'Check if NEXT_PUBLIC_RAZORPAY_KEY_ID is set in .env.local',
          'Check if RAZORPAY_KEY_SECRET is set in .env.local',
          'Restart your development server after updating .env.local',
          'Ensure both keys are from the same Razorpay account'
        ]
      }, { status: 500 });
    }
    
    // Try to create a test order with minimum amount
    try {
      const testOrder = await razorpayInstance.orders.create({
        amount: 100, // ₹1 in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`
      });
      
      return NextResponse.json({
        success: true,
        message: 'Razorpay configuration is working correctly',
        status,
        testOrder: {
          id: testOrder.id,
          amount: testOrder.amount,
          currency: testOrder.currency,
          status: testOrder.status
        }
      }, { status: 200 });
      
    } catch (orderError: any) {
      return NextResponse.json({
        success: false,
        message: 'Razorpay configuration error',
        status,
        error: {
          statusCode: orderError.statusCode,
          message: orderError.message,
          description: orderError.error?.description
        },
        troubleshooting: [
          orderError.statusCode === 401 ? 'Invalid Razorpay credentials' : 'Check Razorpay account status',
          'Verify keys are not expired',
          'Check if account is activated for the mode (test/live)'
        ]
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Server error during Razorpay test',
      error: error.message
    }, { status: 500 });
  }
}
