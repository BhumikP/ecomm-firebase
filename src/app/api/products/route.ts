// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct, IProductColor } from '@/models/Product';
import Category, { ICategory } from '@/models/Category'; // Import Category model
import mongoose from 'mongoose';

// GET all products (or filtered products)
export async function GET(req: NextRequest) {
    await connectDb();
    const { searchParams } = new URL(req.url);

    const filters: any = {};
    const categoryIdQuery = searchParams.get('category');
    const subcategoryQuery = searchParams.get('subcategory');
    const searchQuery = searchParams.get('searchQuery');
    const maxPrice = searchParams.get('maxPrice');
    const discountedOnly = searchParams.get('discountedOnly');
    const populateCategory = searchParams.get('populate') === 'category';

    if (categoryIdQuery && mongoose.Types.ObjectId.isValid(categoryIdQuery)) {
        filters.category = categoryIdQuery;
    }
    if (subcategoryQuery) {
        filters.subcategory = { $regex: `^${subcategoryQuery}$`, $options: 'i' }; // Exact match for subcategory
    }
    if (searchQuery) {
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
         filters.discount = { $ne: null, $gt: 0 };
     }

    const sortOptions: any = {};
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    sortOptions[sortBy] = sortOrder;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    try {
        let query = Product.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        if (populateCategory) {
            query = query.populate<{ category: ICategory }>('category', 'name subcategories _id');
        }

        const products = await query.exec();
        const totalProducts = await Product.countDocuments(filters);
        const totalPages = Math.ceil(totalProducts / limit);

        return NextResponse.json({
             products,
             pagination: { currentPage: page, totalPages, totalProducts, limit }
         }, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST a new product (Admin only)
export async function POST(req: NextRequest) {
    await connectDb();
    // TODO: Implement admin check

    try {
        // Expect ProductFormData structure from the client (includes thumbnailUrl, colors without thumbnailUrl)
        const body = await req.json() as Omit<IProduct, '_id' | 'createdAt' | 'updatedAt' | 'rating'> & { category: string; colors?: Array<Omit<IProductColor, '_id' | 'thumbnailUrl' > & {imageUrls: string[]}> };

        if (!body.title || !body.description || body.price == null || body.stock == null || !body.category || !body.thumbnailUrl) {
            return NextResponse.json({ message: 'Missing required product fields: title, description, price, stock, category, thumbnailUrl.' }, { status: 400 });
        }
         if (body.thumbnailUrl.trim() === '') {
             return NextResponse.json({ message: 'Primary Thumbnail URL cannot be empty.' }, { status: 400 });
         }

        // Validate category
        if (!mongoose.Types.ObjectId.isValid(body.category)) {
            return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
        }
        const categoryExists = await Category.findById(body.category);
        if (!categoryExists) {
            return NextResponse.json({ message: 'Selected category does not exist' }, { status: 400 });
        }

        // Validate subcategory
        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!categoryExists.subcategories.includes(body.subcategory.trim())) {
                return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in category '${categoryExists.name}'` }, { status: 400 });
            }
            body.subcategory = body.subcategory.trim();
        } else {
            body.subcategory = undefined;
        }


        // Validate and parse colors
        const parsedColors: Partial<IProductColor>[] = []; // Use Partial for constructing
        if (body.colors && Array.isArray(body.colors)) {
            for (const color of body.colors) {
                if (!color.name || typeof color.name !== 'string' || color.name.trim() === '') {
                    return NextResponse.json({ message: 'Each color variant must have a name.' }, { status: 400 });
                }
                 if (!Array.isArray(color.imageUrls) || color.imageUrls.length === 0) {
                    return NextResponse.json({ message: `Each color variant ('${color.name}') must have at least one image URL.` }, { status: 400 });
                 }
                  if (color.stock === undefined || typeof color.stock !== 'number' || color.stock < 0) {
                     return NextResponse.json({ message: `Stock for color '${color.name}' must be a non-negative number.` }, { status: 400 });
                 }

                const parsedImageUrls = color.imageUrls.map(img => String(img).trim()).filter(img => img);
                if (parsedImageUrls.length === 0)  return NextResponse.json({ message: `Each color variant ('${color.name}') must have at least one valid image URL.` }, { status: 400 });


                parsedColors.push({
                    name: color.name.trim(),
                    hexCode: color.hexCode?.trim() || undefined,
                    imageUrls: parsedImageUrls,
                    stock: color.stock,
                    // No thumbnailUrl for color variants
                });
            }
        }


        const newProductData: Partial<IProduct> = {
            title: body.title,
            description: body.description,
            price: body.price,
            discount: body.discount,
            category: new mongoose.Types.ObjectId(body.category),
            subcategory: body.subcategory, // Already processed
            rating: body.rating ?? 0,
            stock: body.stock,
            features: body.features,
            colors: parsedColors as any, // Set the validated colors array
            thumbnailUrl: body.thumbnailUrl.trim(), // Main thumbnail
        };


        const newProduct = new Product(newProductData);

        const savedProduct = await newProduct.save();
        const populatedProduct = await Product.findById(savedProduct._id).populate('category');

        return NextResponse.json(populatedProduct, { status: 201 });

    } catch (error) {
        console.error('Error creating product:', error);
         if ((error as any).name === 'ValidationError') {
           // Log detailed validation errors for debugging
           console.error('Mongoose Validation Errors:', (error as any).errors);
           return NextResponse.json({ message: 'Validation failed. Check product data.', errors: (error as any).errors }, { status: 400 });
         }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}