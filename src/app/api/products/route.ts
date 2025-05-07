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
        const body = await req.json() as Omit<IProduct, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'colors'> & { category: string; colors?: Array<Omit<IProductColor, '_id' | 'id'> & {imageIndices: number[]}> };


        if (!body.title || !body.description || body.price == null || body.stock == null || !body.category || !body.image) {
            return NextResponse.json({ message: 'Missing required product fields: title, description, price, stock, category, image.' }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(body.category)) {
            return NextResponse.json({ message: 'Invalid category ID format' }, { status: 400 });
        }

        const categoryExists = await Category.findById(body.category);
        if (!categoryExists) {
            return NextResponse.json({ message: 'Selected category does not exist' }, { status: 400 });
        }

        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!categoryExists.subcategories.includes(body.subcategory.trim())) {
                return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in category '${categoryExists.name}'` }, { status: 400 });
            }
        } else {
            body.subcategory = undefined;
        }

        const imagesToSave = Array.isArray(body.images) && body.images.length > 0 ? body.images.map(img => img.trim()).filter(img => img) : [body.image.trim()].filter(img => img);
        if (imagesToSave.length === 0) {
             return NextResponse.json({ message: 'At least one image URL is required.' }, { status: 400 });
        }
        const primaryImage = imagesToSave[0];


        const parsedColors: IProductColor[] = [];
        if (body.colors && Array.isArray(body.colors)) {
            for (const color of body.colors) {
                if (!color.name || typeof color.name !== 'string' || color.name.trim() === '') {
                    return NextResponse.json({ message: 'Each color variant must have a name.' }, { status: 400 });
                }
                if (!Array.isArray(color.imageIndices) || color.imageIndices.length === 0) {
                    return NextResponse.json({ message: `Each color variant ('${color.name}') must have at least one image index.` }, { status: 400 });
                }
                for (const imageIndex of color.imageIndices) {
                    if (typeof imageIndex !== 'number' || imageIndex < 0 || imageIndex >= imagesToSave.length) {
                        return NextResponse.json({ message: `Invalid imageIndex '${imageIndex}' for color '${color.name}'. It must be a valid index of the product's 'images' array (0 to ${imagesToSave.length - 1}).` }, { status: 400 });
                    }
                }
                if (color.stock !== undefined && (typeof color.stock !== 'number' || color.stock < 0)) {
                     return NextResponse.json({ message: `Stock for color '${color.name}' must be a non-negative number or undefined.` }, { status: 400 });
                }
                parsedColors.push({
                    name: color.name.trim(),
                    hexCode: color.hexCode?.trim() || undefined,
                    imageIndices: color.imageIndices,
                    stock: color.stock
                } as IProductColor);
            }
        }


        const newProduct = new Product({
            ...body,
            image: primaryImage,
            images: imagesToSave,
            colors: parsedColors,
            category: new mongoose.Types.ObjectId(body.category),
            rating: body.rating ?? 0,
            subcategory: body.subcategory ? body.subcategory.trim() : undefined,
        });

        const savedProduct = await newProduct.save();
        const populatedProduct = await Product.findById(savedProduct._id).populate('category');

        return NextResponse.json(populatedProduct, { status: 201 });

    } catch (error) {
        console.error('Error creating product:', error);
         if ((error as any).name === 'ValidationError') {
           return NextResponse.json({ message: 'Validation failed', errors: (error as any).errors }, { status: 400 });
         }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

