
// src/app/api/checkout/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Setting from '@/models/Setting';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { razorpayInstance } from '@/lib/razorpay';
import { generatePayuHash } from '@/lib/payu';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  await connectDb();

  try {
    const { userId, shippingAddress, saveAddress, bargainedAmounts = {} } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ message: 'Shipping address is required.' }, { status: 400 });
    }

    if (saveAddress) {
      await User.findByIdAndUpdate(userId, { $push: { addresses: shippingAddress } });
    }

    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 });
    }

    const settings = await Setting.findOne({ configKey: 'global_settings' });
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
    
    const newTransaction = new Transaction({
        userId,
        items: transactionItems,
        shippingAddress,
        amount: totalAmount,
        currency: 'INR',
        status: 'Pending',
    });
    await newTransaction.save();

    if (activeGateway === 'razorpay') {
        const options = {
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          receipt: newTransaction._id.toString(),
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
    } else if (activeGateway === 'payu') {
        const user = await User.findById(userId).lean();
        if (!user) {
          throw new Error('User not found for PayU transaction.');
        }

        const payuDetails = {
            key: process.env.PAYU_KEY!,
            txnid: newTransaction._id.toString(),
            amount: totalAmount.toFixed(2),
            productinfo: productInfoString.substring(0, 100),
            firstname: shippingAddress.name.split(' ')[0],
            email: user.email,
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
    if (error.statusCode === 400 && error.error) {
       return NextResponse.json({ message: `Error initiating checkout: ${error.error.description}`, error: error }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
