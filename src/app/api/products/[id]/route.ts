// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import Category from '@/models/Category'; // Import Category model
import mongoose from 'mongoose';

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
    const product = await Product.findById(id).populate<{ category: typeof Category }>('category', 'name subcategories _id');
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
  // TODO: Implement admin check

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    const body = await req.json() as Partial<Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>> & { category?: string };

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

    const updateData: any = { ...body };

    if (body.category) {
        if (!mongoose.Types.ObjectId.isValid(body.category)) {
            return NextResponse.json({ message: 'Invalid category ID format for update' }, { status: 400 });
        }
        const categoryExists = await Category.findById(body.category);
        if (!categoryExists) {
            return NextResponse.json({ message: 'Selected category for update does not exist' }, { status: 400 });
        }
        updateData.category = new mongoose.Types.ObjectId(body.category);

        // Validate or clear subcategory based on new category
        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!categoryExists.subcategories.includes(body.subcategory.trim())) {
                return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in category '${categoryExists.name}'` }, { status: 400 });
            }
            updateData.subcategory = body.subcategory.trim();
        } else {
            // If subcategory field is present but empty, or if category changes and subcategory is not re-validated
            updateData.subcategory = undefined; // Clear subcategory if not valid for new category or explicitly emptied
        }
    } else if (body.hasOwnProperty('subcategory')) { // If only subcategory is being updated
        const existingProduct = await Product.findById(id).populate('category');
        if (!existingProduct) {
            return NextResponse.json({ message: 'Product not found for subcategory update' }, { status: 404 });
        }
        const productCategory = existingProduct.category as unknown as ICategory; // Cast to ICategory
        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!productCategory || !productCategory.subcategories.includes(body.subcategory.trim())) {
                return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in product's current category '${productCategory?.name}'` }, { status: 400 });
            }
            updateData.subcategory = body.subcategory.trim();
        } else {
             updateData.subcategory = undefined; // Clear subcategory if explicitly emptied
        }
    }


    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate<{ category: typeof Category }>('category', 'name subcategories _id');

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
  // TODO: Implement admin check

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