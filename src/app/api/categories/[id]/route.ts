
// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Category, { ICategory } from '@/models/Category';
import Product from '@/models/Product';
import mongoose from 'mongoose';
// TODO: Add admin authentication/authorization

interface Params {
  params: { id: string };
}

// GET a single category by ID
export async function GET(req: NextRequest, { params }: Params) {
  await connectDb();
  // TODO: Implement admin check
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({category}, { status: 200 }); // Wrap in {category: category}
  } catch (error) {
    // console.error(`Error fetching category ${id}:`, error); // Removed
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT (update) a category by ID
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  // TODO: Implement admin check
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
  }

  try {
    const body = await req.json() as Partial<Pick<ICategory, 'name' | 'subcategories'>>;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const updateData: Partial<ICategory> = {};
    if (body.name && body.name.trim() !== '') {
      updateData.name = body.name.trim();
    }
    if (body.subcategories && Array.isArray(body.subcategories)) {
      // Filter out empty strings and trim, then ensure uniqueness
      updateData.subcategories = Array.from(new Set(body.subcategories.map(s => String(s).trim()).filter(s => s.length > 0)));
    }


    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // If category name changed, or subcategories changed, this might affect products.
    // For simplicity, not handling cascading updates to products' subcategory field here.
    // That would require more complex logic if a subcategory is renamed/removed.

    return NextResponse.json({category: updatedCategory}, { status: 200 }); // Wrap in {category: updatedCategory}
  } catch (error: any) {
    // console.error(`Error updating category ${id}:`, error); // Removed
    if (error.code === 11000) { // Duplicate key error for name
      return NextResponse.json({ message: 'Category name already exists' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a category by ID
export async function DELETE(req: NextRequest, { params }: Params) {
  await connectDb();
  // TODO: Implement admin check
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
  }

  try {
    // Check if any products are using this category
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return NextResponse.json({
        message: `Cannot delete category. ${productCount} product(s) are currently assigned to it. Please reassign them first.`,
      }, { status: 400 });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    // console.error(`Error deleting category ${id}:`, error); // Removed
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

