// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Order, { IOrder } from '@/models/Order';
import Transaction from '@/models/Transaction'; // Import Transaction model
import mongoose from 'mongoose';
// TODO: Implement proper admin authentication

interface Params {
  params: { id: string };
}

// GET a single order by its ID
export async function GET(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid order ID format' }, { status: 400 });
  }

  try {
    const order = await Order.findById(id)
      .populate('userId', 'name email') // Populate user name and email
      .populate('transactionId') // Populate full transaction details
      .lean();

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// PUT to update an order's status
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;
  const session = await mongoose.startSession();
  session.startTransaction();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ message: 'Invalid order ID format' }, { status: 400 });
  }

  try {
    const { status } = await req.json() as { status: IOrder['status'] };

    const validStatuses: IOrder['status'][] = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ message: `Invalid status provided. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }
    
    const updatePayload: Partial<IOrder> = { status: status };

    // If the order is a COD order and is being marked as Delivered,
    // update the payment status of the order and the associated transaction.
    if (status === 'Delivered') {
        const orderToUpdate = await Order.findById(id).session(session);
        if (orderToUpdate && orderToUpdate.paymentMethod === 'COD' && orderToUpdate.transactionId) {
            updatePayload.paymentStatus = 'Paid';
            await Transaction.findByIdAndUpdate(orderToUpdate.transactionId, {
                $set: { status: 'Success' }
            }, { session });
        }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true, session }
    )
    .populate('userId', 'name email')
    .populate('transactionId')
    .lean();

    if (!updatedOrder) {
      throw new Error('Order not found or failed to update.');
    }
    
    await session.commitTransaction();
    session.endSession();

    // TODO: Potentially trigger an email notification to the customer about the status update.

    return NextResponse.json({ order: updatedOrder, message: 'Order status updated successfully' }, { status: 200 });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error updating order ${id}:`, error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
