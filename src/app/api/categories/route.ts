
// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Category, { ICategory } from '@/models/Category';
// TODO: Add admin authentication/authorization

// GET all categories
export async function GET(req: NextRequest) {
  await connectDb();
  // TODO: Implement admin check
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST a new category
export async function POST(req: NextRequest) {
  await connectDb();
  // TODO: Implement admin check
  try {
    const body = await req.json() as Partial<Pick<ICategory, 'name' | 'subcategories'>>;

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    let subcategoriesArray: string[] = [];
    if (body.subcategories && Array.isArray(body.subcategories)) {
      subcategoriesArray = body.subcategories.map(s => String(s).trim()).filter(s => s.length > 0);
      subcategoriesArray = Array.from(new Set(subcategoriesArray)); // Ensure uniqueness
    }

    const newCategory = new Category({
      name: body.name.trim(),
      subcategories: subcategoriesArray,
    });

    const savedCategory = await newCategory.save();
    return NextResponse.json(savedCategory, { status: 201 });

  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 11000) { // Duplicate key error for name
      return NextResponse.json({ message: 'Category name already exists' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
