
// src/app/api/products/[id]/rate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import User from '@/models/User';
import mongoose from 'mongoose';

interface Params {
  params: { id: string };
}

interface RateRequestBody {
  userId: string;
  ratingValue: number;
}

export async function POST(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const body = await req.json() as RateRequestBody;
    const { userId, ratingValue } = body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required' }, { status: 400 });
    }
    // Basic check for user existence
    const userExists = await User.findById(userId);
    if (!userExists) {
        return NextResponse.json({ message: 'User not found. Please log in.' }, { status: 404 });
    }

    if (ratingValue == null || typeof ratingValue !== 'number' || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ message: 'Rating value must be a number between 1 and 5' }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const oldAverageRating = product.rating || 0;
    const oldNumRatings = product.numRatings || 0;

    const newNumRatings = oldNumRatings + 1;
    const newAverageRating = ((oldAverageRating * oldNumRatings) + ratingValue) / newNumRatings;

    product.rating = parseFloat(newAverageRating.toFixed(2));
    product.numRatings = newNumRatings;

    await product.save();

    return NextResponse.json({
        message: 'Rating submitted successfully',
        updatedProduct: {
            _id: product._id,
            rating: product.rating,
            numRatings: product.numRatings,
        }
    }, { status: 200 });

  } catch (error) {
    // console.error(`Error submitting rating for product ${id}:`, error); // Omitted for brevity
    return NextResponse.json({ message: 'Internal server error while submitting rating' }, { status: 500 });
  }
}
