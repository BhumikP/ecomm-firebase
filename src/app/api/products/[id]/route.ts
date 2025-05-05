// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import mongoose from 'mongoose';
// Import authentication/authorization logic if needed for PUT/DELETE

interface Params {
  params: { id: string };
}

// GET a single product by ID
export async function GET(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT (update) a product by ID (Admin only)
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  // TODO: Add robust authentication and authorization check (ensure user is admin)
  // const isAdmin = await checkAdminRole(req); // Replace with your auth logic
  // if (!isAdmin) {
  //    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const body = await req.json() as Partial<Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>>;

     // Basic validation (consider Zod)
     if (Object.keys(body).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
     }
     if (body.price !== undefined && body.price < 0) {
          return NextResponse.json({ message: 'Price cannot be negative' }, { status: 400 });
     }
      if (body.stock !== undefined && body.stock < 0) {
          return NextResponse.json({ message: 'Stock cannot be negative' }, { status: 400 });
     }
      if (body.discount !== undefined && (body.discount === null || (body.discount >= 0 && body.discount <= 100))) {
         // valid discount or null
      } else if (body.discount !== undefined) {
           return NextResponse.json({ message: 'Discount must be between 0 and 100, or null' }, { status: 400 });
      }


    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: body }, // Use $set to update only provided fields
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
     if ((error as any).name === 'ValidationError') {
       return NextResponse.json({ message: 'Validation failed', errors: (error as any).errors }, { status: 400 });
     }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a product by ID (Admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;

  // TODO: Add robust authentication and authorization check (ensure user is admin)
  // const isAdmin = await checkAdminRole(req); // Replace with your auth logic
  // if (!isAdmin) {
  //    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
