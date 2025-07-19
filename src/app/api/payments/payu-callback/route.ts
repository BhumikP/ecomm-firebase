// src/app/api/payments/payu-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import { verifyPayuResponseHash } from '@/lib/payu';
import Transaction, { ITransaction } from '@/models/Transaction';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Cart from '@/models/Cart';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Setting from '@/models/Setting';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  await connectDb();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const formData = await req.formData();
    const payuResponse = Object.fromEntries(formData.entries());

    const { status, txnid, hash: receivedHash, mihpayid, amount, productinfo, firstname, email } = payuResponse as Record<string, string>;

    if (!txnid || !status || !receivedHash) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.redirect(new URL('/payment/failure?error=invalid_response', req.url));
    }

    const transaction = await Transaction.findById(txnid).session(session);
    if (!transaction) {
      console.error(`PayU callback for non-existent transaction ID: ${txnid}`);
      await session.abortTransaction();
      session.endSession();
      return NextResponse.redirect(new URL('/payment/failure?error=transaction_not_found', req.url));
    }
    
    // Construct details for hash verification
    const hashVerificationDetails = {
      key: process.env.PAYU_KEY!,
      txnid: txnid,
      amount: amount,
      productinfo: productinfo,
      firstname: firstname,
      email: email,
      status: status,
    };
    
    const isHashValid = verifyPayuResponseHash(hashVerificationDetails, receivedHash);

    if (!isHashValid) {
        transaction.status = 'Failed';
        await transaction.save({ session });
        await session.commitTransaction();
        session.endSession();
        return NextResponse.redirect(new URL('/payment/failure?error=hash_mismatch', req.url));
    }
    
    let orderIdForRedirect = '';
    
    if (status === 'success') {
      if (transaction.status !== 'Success') {
        transaction.status = 'Success';
        transaction.payu_mihpayid = mihpayid;
        transaction.payu_txnid = txnid;
        await transaction.save({ session });

        const settings = await Setting.findOne({ configKey: 'global_settings' }).session(session);
        const taxPercentage = settings?.taxPercentage || 0;
        const shippingCharge = settings?.shippingCharge || 0;
        
        const totalBargainDiscount = transaction.items.reduce((acc, item) => acc + (item.bargainDiscount || 0) * item.quantity, 0);
        const subtotalAfterBargain = transaction.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const taxAmount = subtotalAfterBargain * (taxPercentage / 100);
        const grandTotal = subtotalAfterBargain + taxAmount + shippingCharge;

        // Create Order from Transaction
        const newOrder = new Order({
            userId: transaction.userId,
            orderId: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
            transactionId: transaction._id,
            items: transaction.items,
            total: grandTotal,
            totalBargainDiscount,
            currency: transaction.currency,
            shippingAddress: transaction.shippingAddress,
            paymentMethod: 'PayU',
            paymentStatus: 'Paid',
            paymentDetails: { gateway: 'PayU', payu_mihpayid: mihpayid, payu_txnid: txnid },
            shippingCost: shippingCharge,
            taxAmount,
        });
        await newOrder.save({ session });
        orderIdForRedirect = newOrder.orderId;

        // Decrement stock
        for (const item of newOrder.items) {
          const product = await Product.findById(item.productId).session(session);
          if (!product) throw new Error(`Product with ID ${item.productId} not found during stock reduction.`);
          if (item.selectedColorSnapshot?.name && product.colors?.length > 0) {
            const colorIndex = product.colors.findIndex(c => c.name === item.selectedColorSnapshot!.name);
            if (colorIndex > -1) product.colors[colorIndex].stock -= item.quantity;
          } else {
            product.stock -= item.quantity;
          }
           if (product.colors && product.colors.length > 0) {
            product.stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
          }
          await product.save({ session });
        }
        
        await Cart.deleteOne({ userId: transaction.userId }).session(session);
      } else {
        const existingOrder = await Order.findOne({ transactionId: transaction._id }).session(session);
        orderIdForRedirect = existingOrder?.orderId || '';
      }
      
      await session.commitTransaction();
      session.endSession();
      return NextResponse.redirect(new URL(`/payment/success?order_id=${orderIdForRedirect}`, req.url));

    } else {
      // Handle failed or pending scenarios
      transaction.status = 'Failed'; // Or handle other statuses from PayU
      await transaction.save({ session });
      await session.commitTransaction();
      session.endSession();
      return NextResponse.redirect(new URL(`/payment/failure?transaction_id=${txnid}`, req.url));
    }

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('PayU callback error:', error);
    return NextResponse.redirect(new URL('/payment/failure?error=server_error', req.url));
  }
}
