
// src/app/api/categories/[id]/route.ts
import connectDb from '@/lib/mongodb';
import Category, { ICategory } from '@/models/Category';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
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
    const body = await req.json() as Partial<Pick<ICategory, 'name' | 'subcategories' | 'image'>>;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const updateData: Partial<ICategory> = {};
    if (body.name && body.name.trim() !== '') {
      updateData.name = body.name.trim();
    }
    if (body.image && typeof body.image === 'string') {
      updateData.image = body.image.trim();
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

    // Get the category first to check if it has an image
    const categoryToDelete = await Category.findById(id);
    
    if (!categoryToDelete) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // Delete the category from database
    await Category.findByIdAndDelete(id);

    // If the category had an image, attempt to delete it from S3
    if (categoryToDelete.image && categoryToDelete.image.trim() !== '') {
      try {
        // Call the delete image API
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/categories/image?categoryId=${id}&imageUrl=${encodeURIComponent(categoryToDelete.image)}`, {
          method: 'DELETE',
        });
      } catch (imageError) {
        // Log warning but don't fail the category deletion
        console.warn(`Failed to delete image for category ${id}:`, imageError);
      }
    }

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      imageDeleted: !!categoryToDelete.image
    }, { status: 200 });
  } catch {
    // console.error(`Error deleting category ${id}:`, error); // Removed
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

