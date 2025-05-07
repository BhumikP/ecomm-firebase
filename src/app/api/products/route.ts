// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct, IProductColor } from '@/models/Product';
import Category, { ICategory } from '@/models/Category'; // Import Category model
import mongoose from 'mongoose';

// Define interfaces for client data to ensure strictness
interface ClientProductColorData {
    name: string;
    hexCode?: string;
    imageUrls: string[];
    stock: number;
}

interface ClientProductPOSTData {
    title: string;
    description: string;
    price: number;
    discount?: number | null;
    category: string; // Category ID string
    subcategory?: string;
    rating?: number;
    stock: number; // Can be overall stock or will be overridden by color stock sum
    features?: string[];
    colors?: ClientProductColorData[];
    thumbnailUrl: string;
}


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
        const body = await req.json() as ClientProductPOSTData;

        if (!body.title || !body.description || body.price == null || !body.category || !body.thumbnailUrl) {
            return NextResponse.json({ message: 'Missing required product fields: title, description, price, category, thumbnailUrl.' }, { status: 400 });
        }
         if (body.thumbnailUrl.trim() === '') {
             return NextResponse.json({ message: 'Primary Thumbnail URL cannot be empty.' }, { status: 400 });
         }
         if (body.price < 0) {
            return NextResponse.json({ message: 'Price cannot be negative.' }, { status: 400 });
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
        let subcategoryToSave: string | undefined = undefined;
        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!categoryExists.subcategories.includes(body.subcategory.trim())) {
                return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in category '${categoryExists.name}'` }, { status: 400 });
            }
            subcategoryToSave = body.subcategory.trim();
        }


        // Validate and parse colors, calculate total stock
        let finalStock = 0;
        const parsedColorsForDB: ClientProductColorData[] = [];
        if (body.colors && Array.isArray(body.colors) && body.colors.length > 0) {
            // If colors array exists and is not empty, validate each color and sum their stock
            for (const clientColor of body.colors) {
                if (!clientColor.name || typeof clientColor.name !== 'string' || clientColor.name.trim() === '') {
                    return NextResponse.json({ message: 'Each color variant must have a name.' }, { status: 400 });
                }
                 if (!Array.isArray(clientColor.imageUrls) || clientColor.imageUrls.length === 0 || clientColor.imageUrls.every(url => !url || url.trim() === '')) {
                    return NextResponse.json({ message: `Each color variant ('${clientColor.name}') must have at least one valid image URL.` }, { status: 400 });
                 }
                  if (clientColor.stock === undefined || typeof clientColor.stock !== 'number' || clientColor.stock < 0) {
                     return NextResponse.json({ message: `Stock for color '${clientColor.name}' must be a non-negative number.` }, { status: 400 });
                 }

                const validImageUrls = clientColor.imageUrls.map(img => String(img).trim()).filter(img => img);
                if (validImageUrls.length === 0)  return NextResponse.json({ message: `Each color variant ('${clientColor.name}') must have at least one valid image URL.` }, { status: 400 });

                parsedColorsForDB.push({
                    name: clientColor.name.trim(),
                    hexCode: clientColor.hexCode?.trim() || undefined,
                    imageUrls: validImageUrls,
                    stock: Number(clientColor.stock),
                });
                finalStock += Number(clientColor.stock); // Sum stock from colors
            }
        } else {
            // If no colors or empty colors array, use the provided overall stock
            if (body.stock == null || body.stock < 0) {
                 return NextResponse.json({ message: 'Overall Stock is required and must be non-negative when no color variants are added.' }, { status: 400 });
            }
            finalStock = body.stock;
        }


        const newProductDataForDB: Partial<IProduct> = {
            title: body.title,
            description: body.description,
            price: body.price,
            thumbnailUrl: body.thumbnailUrl.trim(),
            category: new mongoose.Types.ObjectId(body.category),
            stock: finalStock, // Set the calculated or provided overall stock
        };

        if (body.discount !== undefined && body.discount !== null) newProductDataForDB.discount = body.discount;
        if (subcategoryToSave) newProductDataForDB.subcategory = subcategoryToSave;
        if (body.rating !== undefined) newProductDataForDB.rating = body.rating ?? 0;
        if (body.features && Array.isArray(body.features)) newProductDataForDB.features = body.features;
        if (parsedColorsForDB.length > 0) newProductDataForDB.colors = parsedColorsForDB as any;


        const newProduct = new Product(newProductDataForDB);

        const savedProduct = await newProduct.save();
        const populatedProduct = await Product.findById(savedProduct._id).populate('category');

        return NextResponse.json(populatedProduct, { status: 201 });

    } catch (error) {
        console.error('Error creating product:', error);
         if ((error as any).name === 'ValidationError') {
           console.error('Mongoose Validation Errors:', (error as any).errors);
           return NextResponse.json({ message: 'Validation failed. Check product data.', errors: (error as any).errors }, { status: 400 });
         }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
