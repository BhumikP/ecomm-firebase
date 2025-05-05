// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
// Import authentication/authorization logic if needed for POST

// GET all products (or filtered products)
export async function GET(req: NextRequest) {
    await connectDb();
    const { searchParams } = new URL(req.url);

    // --- Filtering Logic ---
    const filters: any = {};
    const category = searchParams.get('category');
    const searchQuery = searchParams.get('searchQuery');
    const maxPrice = searchParams.get('maxPrice');
    const discountedOnly = searchParams.get('discountedOnly');

    if (category) {
        filters.category = category; // Could use $in for multiple categories later
    }
    if (searchQuery) {
        // Simple text search on title and description
        filters.$or = [
            { title: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
        ];
    }
     if (maxPrice) {
        const price = parseFloat(maxPrice);
        if (!isNaN(price)) {
           filters.price = { $lte: price };
        }
     }
     if (discountedOnly === 'true') {
         filters.discount = { $ne: null, $gt: 0 }; // Has a discount greater than 0
     }

    // --- Sorting Logic (Example) ---
    const sortOptions: any = {};
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // Default sort
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1; // Default desc
    sortOptions[sortBy] = sortOrder;

    // --- Pagination Logic (Example) ---
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10); // Default limit
    const skip = (page - 1) * limit;


    try {
        const products = await Product.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filters);
        const totalPages = Math.ceil(totalProducts / limit);

        return NextResponse.json({
             products,
             pagination: {
                 currentPage: page,
                 totalPages,
                 totalProducts,
                 limit
             }
         }, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST a new product (Admin only)
export async function POST(req: NextRequest) {
    await connectDb();

     // TODO: Add robust authentication and authorization check (ensure user is admin)
     // const isAdmin = await checkAdminRole(req); // Replace with your auth logic
     // if (!isAdmin) {
     //    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
     // }


    try {
        const body = await req.json() as Omit<IProduct, 'id' | 'createdAt' | 'updatedAt' | 'rating'>;

        // Basic validation (more robust validation using Zod is recommended)
        if (!body.title || !body.description || body.price == null || body.stock == null || !body.category || !body.image) {
            return NextResponse.json({ message: 'Missing required product fields' }, { status: 400 });
        }

        const newProduct = new Product({
            ...body,
            rating: body.rating ?? 0, // Set default rating if not provided
        });

        const savedProduct = await newProduct.save();
        return NextResponse.json(savedProduct, { status: 201 }); // Created

    } catch (error) {
        console.error('Error creating product:', error);
         if ((error as any).name === 'ValidationError') {
           return NextResponse.json({ message: 'Validation failed', errors: (error as any).errors }, { status: 400 });
         }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
