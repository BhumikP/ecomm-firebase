// src/app/api/checkout/initiate/route.ts
import connectDb from '@/lib/mongodb';
import { generatePayuHash } from '@/lib/payu';
import { razorpayInstance } from '@/lib/razorpay';
import Cart from '@/models/Cart';
import Setting from '@/models/Setting';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  
  try {
    await connectDb();
  } catch (dbError) {
    console.error("❌ Database connection failed:", dbError);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed', 
      details: 'Unable to connect to MongoDB'
    }, { status: 500 });
  }

  try {
    const { userId, shippingAddress, saveAddress, bargainedAmounts = {} } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ message: 'Shipping address is required.' }, { status: 400 });
    }

    if (saveAddress) {
      // Find user and add address if it doesn't already exist
      const user = await User.findById(userId);
      if (user) {
        const addressExists = user.addresses?.some(addr => 
            addr.street === shippingAddress.street &&
            addr.city === shippingAddress.city &&
            addr.zip === shippingAddress.zip
        );
        if (!addressExists) {
           user.addresses?.push(shippingAddress);
           await user.save();
        }
      }
    }

    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 });
    }

    const settings = await Setting.findOne({ configKey: 'global_settings' }).lean();
    const taxPercentage = settings?.taxPercentage || 0;
    const shippingCharge = settings?.shippingCharge || 0;
    const activeGateway = settings?.activePaymentGateway || 'razorpay';

    let subtotal = 0;
    let productInfoString = '';
    const transactionItems = cart.items.map((item, index) => {
      const product = item.product as any;
      if (!product) throw new Error(`Product with ID ${item.product} not found in cart.`);
      
      const price = product.discount && product.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;

      const bargainDiscountPerItem = bargainedAmounts[product._id.toString()] || 0;
      const finalPrice = price - bargainDiscountPerItem;
      if (finalPrice < 0) throw new Error('Invalid discount, price cannot be negative.');
      
      subtotal += finalPrice * item.quantity;
      if (index > 0) productInfoString += ', ';
      productInfoString += product.title;

      return {
        productId: product._id,
        productName: product.title,
        quantity: item.quantity,
        price: finalPrice,
        bargainDiscount: bargainDiscountPerItem,
        image: item.imageSnapshot,
        selectedColorSnapshot: item.selectedColorSnapshot
      };
    });

    const taxAmount = subtotal * (taxPercentage / 100);
    const totalAmount = subtotal + taxAmount + shippingCharge;
    
    // Ensure shipping address has email field
    let finalShippingAddress = { ...shippingAddress };
    if (!finalShippingAddress.email) {
      const user = await User.findById(userId).lean();
      if (!user || !user.email) {
        return NextResponse.json({ 
          success: false,
          message: 'Email is required for checkout. Please provide email in shipping address or ensure user has email.',
          error: 'Missing email' 
        }, { status: 400 });
      }
      finalShippingAddress.email = user.email;
    }
    
    const newTransaction = new Transaction({
        userId,
        items: transactionItems,
        shippingAddress: finalShippingAddress,
        amount: totalAmount,
        currency: 'INR',
        status: 'Pending',
    });
    await newTransaction.save();

    if (activeGateway === 'razorpay') {
        if (!razorpayInstance) {
          return NextResponse.json({
            success: false,
            error: 'Razorpay is not configured properly. Please check environment variables.',
            details: 'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing'
          }, { status: 500 });
        }
        
        try {
          const options = {
            amount: Math.round(totalAmount * 100), // Convert to paise
            currency: 'INR',
            receipt: (newTransaction._id as string).toString(),
          };
          const razorpayOrder = await razorpayInstance.orders.create(options);          
          newTransaction.razorpay_order_id = razorpayOrder.id;
          await newTransaction.save();
          
          return NextResponse.json({
            success: true,
            gateway: 'razorpay',
            transactionId: newTransaction._id,
            razorpayOrder,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          }, { status: 200 });
        } catch (razorpayError: any) {
          
          // Delete the transaction since order creation failed
          await Transaction.findByIdAndDelete(newTransaction._id);
          
          // Return specific error message based on Razorpay error
          let errorMessage = 'Failed to create payment order';
          if (razorpayError.statusCode === 400) {
            errorMessage = 'Invalid payment details';
          } else if (razorpayError.statusCode === 401) {
            errorMessage = 'Payment gateway authentication failed';
          } else if (razorpayError.statusCode === 500) {
            errorMessage = 'Payment gateway temporarily unavailable';
          }
          
          return NextResponse.json({
            success: false,
            error: errorMessage,
            details: razorpayError.message
          }, { status: 500 });
        }
    } else if (activeGateway === 'payu') {
        const payuDetails = {
            key: process.env.PAYU_KEY!,
            txnid: (newTransaction._id as string).toString(),
            amount: totalAmount.toFixed(2),
            productinfo: productInfoString.substring(0, 100),
            firstname: finalShippingAddress.name.split(' ')[0],
            email: finalShippingAddress.email,
        };

        const hash = generatePayuHash(payuDetails);

        return NextResponse.json({
            success: true,
            gateway: 'payu',
            transactionId: newTransaction._id,
            payuDetails: { ...payuDetails, hash },
        }, { status: 200 });
    } else {
        return NextResponse.json({ message: 'No active payment gateway configured.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error initiating checkout:', error);
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        success: false,
        message: 'Validation failed', 
        error: error.message,
        details: error.errors 
      }, { status: 400 });
    }
    
    if (error.statusCode === 400 && error.error) {
       return NextResponse.json({ 
         success: false,
         message: `Payment gateway error: ${error.error.description}`, 
         error: error.message 
       }, { status: 400 });
    }
    
    if (error.message?.includes('not found')) {
      return NextResponse.json({ 
        success: false,
        message: 'Resource not found', 
        error: error.message 
      }, { status: 404 });
    }
    
    // Generic server error
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error during checkout', 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
