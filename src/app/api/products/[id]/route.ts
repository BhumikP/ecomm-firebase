// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct, IProductColor } from '@/models/Product';
import Category, { ICategory } from '@/models/Category'; // Import Category model
import mongoose, { Types } from 'mongoose'; // Import Types

interface Params {
  params: { id: string };
}

// Define interfaces for client data to ensure strictness
interface ClientProductColorUpdateData {
    _id?: string; // For identifying existing subdocuments
    name: string;
    hexCode?: string;
    imageUrls: string[];
    stock: number;
}

interface ClientProductPUTData {
    title?: string;
    description?: string;
    price?: number;
    discount?: number | null;
    category?: string; // Category ID string
    subcategory?: string;
    rating?: number;
    stock?: number; // Can be overall stock or will be overridden by color stock sum
    features?: string[];
    colors?: ClientProductColorUpdateData[];
    thumbnailUrl?: string;
    minOrderQuantity?: number;
    isTopBuy?: boolean; // Added for featured products
}


// GET a single product by ID
export async function GET(req: NextRequest, { params }: Params) {
  await connectDb();
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const populateCategory = searchParams.get('populate') === 'category';

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid product ID format' }, { status: 400 });
  }

  try {
    let query = Product.findById(id);
    if (populateCategory) {
        query = query.populate<{ category: ICategory }>('category', 'name subcategories _id');
    }
    const product = await query.exec();

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
    const body = await req.json() as ClientProductPUTData;

     if (Object.keys(body).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
     }

    const updateDataForDB: { [key: string]: any } = {};

    if (body.title !== undefined) updateDataForDB.title = body.title;
    if (body.description !== undefined) updateDataForDB.description = body.description;

    if (body.price !== undefined) {
        if (body.price < 0) return NextResponse.json({ message: 'Price cannot be negative' }, { status: 400 });
        updateDataForDB.price = body.price;
    }
    if (body.thumbnailUrl !== undefined) {
        if (body.thumbnailUrl.trim() === '') return NextResponse.json({ message: 'Primary Thumbnail URL cannot be empty' }, { status: 400 });
        updateDataForDB.thumbnailUrl = body.thumbnailUrl.trim();
    }

    if (body.discount !== undefined) {
        if (body.discount === null || (body.discount >= 0 && body.discount <= 100)) {
            updateDataForDB.discount = body.discount;
        } else {
            return NextResponse.json({ message: 'Discount must be between 0 and 100, or null' }, { status: 400 });
        }
    }
    if (body.rating !== undefined) updateDataForDB.rating = body.rating;
    if (body.features !== undefined) updateDataForDB.features = body.features;
    if (body.minOrderQuantity !== undefined) {
        if (typeof body.minOrderQuantity !== 'number' || body.minOrderQuantity < 1) {
            return NextResponse.json({ message: 'Minimum Order Quantity must be a positive number.' }, { status: 400 });
        }
        updateDataForDB.minOrderQuantity = body.minOrderQuantity;
    }
    if (body.isTopBuy !== undefined) { // Handle isTopBuy
      updateDataForDB.isTopBuy = body.isTopBuy;
    }


    // Handle category and subcategory updates
    if (body.category) {
        if (!mongoose.Types.ObjectId.isValid(body.category)) return NextResponse.json({ message: 'Invalid category ID format for update' }, { status: 400 });
        const categoryExists = await Category.findById(body.category);
        if (!categoryExists) return NextResponse.json({ message: 'Selected category for update does not exist' }, { status: 400 });
        updateDataForDB.category = new mongoose.Types.ObjectId(body.category);

        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!categoryExists.subcategories.includes(body.subcategory.trim())) return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in category '${categoryExists.name}'` }, { status: 400 });
            updateDataForDB.subcategory = body.subcategory.trim();
        } else {
             updateDataForDB.subcategory = undefined; // Explicitly set to undefined to remove it
        }
    } else if (body.hasOwnProperty('subcategory') && body.subcategory === '') { // If only subcategory is sent and it's empty
        updateDataForDB.subcategory = undefined; // Remove subcategory
    } else if (body.hasOwnProperty('subcategory') && body.subcategory && body.subcategory.trim() !== '') { // If only subcategory is sent and it's not empty
        const existingProduct = await Product.findById(id).populate('category');
        if (!existingProduct) return NextResponse.json({ message: 'Product not found for subcategory update' }, { status: 404 });
        const productCategory = existingProduct.category as ICategory;
        if (!productCategory || !productCategory.subcategories.includes(body.subcategory.trim())) {
             return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in product's current category '${productCategory?.name}'` }, { status: 400 });
        }
        updateDataForDB.subcategory = body.subcategory.trim();
    }


    // Handle color updates and calculate total stock
    let finalStock = 0;
    if (body.colors && Array.isArray(body.colors)) {
        const parsedColorsForUpdate: any[] = [];
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

            const colorUpdateData: any = {
                name: clientColor.name.trim(),
                hexCode: clientColor.hexCode?.trim() || undefined,
                imageUrls: validImageUrls,
                stock: Number(clientColor.stock),
            };
            if (clientColor._id && mongoose.Types.ObjectId.isValid(clientColor._id.toString())) {
                colorUpdateData._id = new mongoose.Types.ObjectId(clientColor._id.toString());
            } else {
                 colorUpdateData._id = new mongoose.Types.ObjectId();
            }
            parsedColorsForUpdate.push(colorUpdateData);
             finalStock += Number(clientColor.stock);
        }
        updateDataForDB.colors = parsedColorsForUpdate;
         updateDataForDB.stock = finalStock;

    } else if (body.hasOwnProperty('colors') && body.colors === null) { // Explicitly removing all colors
        updateDataForDB.colors = [];
        if (body.stock !== undefined) { // If overall stock is provided alongside color removal
             if (body.stock < 0) return NextResponse.json({ message: 'Overall Stock cannot be negative when no colors are provided' }, { status: 400 });
             updateDataForDB.stock = body.stock;
        } else { // If no overall stock provided, and colors are removed, stock becomes 0 or product's current stock if not touched.
            const existingProduct = await Product.findById(id);
            if (existingProduct) updateDataForDB.stock = existingProduct.stock; // retain current stock or set to 0
        }
    } else if (body.hasOwnProperty('stock') && body.colors === undefined) { // Only stock is being updated, no changes to colors array
         if (body.stock === undefined || typeof body.stock !== 'number' || body.stock < 0) {
             return NextResponse.json({ message: 'Stock cannot be negative' }, { status: 400 });
         }
         updateDataForDB.stock = body.stock;
    }


    if (Object.keys(updateDataForDB).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateDataForDB },
      { new: true, runValidators: true, overwrite: false }
    ).populate<{ category: ICategory }>('category', 'name subcategories _id');

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
     if ((error as any).name === 'ValidationError') {
       console.error('Mongoose Validation Errors during PUT:', (error as any).errors);
       return NextResponse.json({ message: 'Validation failed. Check product data.', errors: (error as any).errors }, { status: 400 });
     }
     if ((error as mongoose.Error.CastError).kind === 'ObjectId') {
       return NextResponse.json({ message: 'Invalid ID format provided in request body.' }, { status: 400 });
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

