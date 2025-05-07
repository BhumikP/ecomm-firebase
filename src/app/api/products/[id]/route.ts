// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Product, { IProduct, IProductColor } from '@/models/Product';
import Category, { ICategory } from '@/models/Category'; // Import Category model
import mongoose, { Types } from 'mongoose'; // Import Types

interface Params {
  params: { id: string };
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
    // Expecting structure similar to ProductFormData (or IProduct subset) from client
    const body = await req.json() as Partial<Omit<IProduct, '_id' | 'createdAt' | 'updatedAt' | 'colors'>> & { category?: string; colors?: Array<Partial<Omit<IProductColor, '_id' | 'thumbnailUrl'>> & { imageUrls: string[], _id?: string }> };


     if (Object.keys(body).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
     }
     // Basic field validations
     if (body.price !== undefined && body.price < 0) return NextResponse.json({ message: 'Price cannot be negative' }, { status: 400 });
     if (body.stock !== undefined && body.stock < 0) return NextResponse.json({ message: 'Stock cannot be negative' }, { status: 400 });
     if (body.discount !== undefined && (body.discount === null || (body.discount >= 0 && body.discount <= 100))) {/* valid */} else if (body.discount !== undefined) return NextResponse.json({ message: 'Discount must be between 0 and 100, or null' }, { status: 400 });
     if (body.thumbnailUrl !== undefined && body.thumbnailUrl.trim() === '') return NextResponse.json({ message: 'Primary Thumbnail URL cannot be empty' }, { status: 400 });

    const updateData: any = { ...body }; // Start with body, will refine

    // Handle category and subcategory updates
    if (body.category) {
        if (!mongoose.Types.ObjectId.isValid(body.category)) return NextResponse.json({ message: 'Invalid category ID format for update' }, { status: 400 });
        const categoryExists = await Category.findById(body.category);
        if (!categoryExists) return NextResponse.json({ message: 'Selected category for update does not exist' }, { status: 400 });
        updateData.category = new mongoose.Types.ObjectId(body.category);

        // When category changes, validate or clear subcategory
        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!categoryExists.subcategories.includes(body.subcategory.trim())) return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in category '${categoryExists.name}'` }, { status: 400 });
            updateData.subcategory = body.subcategory.trim();
        } else {
             updateData.subcategory = undefined; // Clear subcategory if category changes and no new subcat provided
        }
    } else if (body.hasOwnProperty('subcategory')) {
        // Only subcategory is being updated, check against current category
        const existingProduct = await Product.findById(id).populate('category');
        if (!existingProduct) return NextResponse.json({ message: 'Product not found for subcategory update' }, { status: 404 });
        const productCategory = existingProduct.category as ICategory;
        if (body.subcategory && body.subcategory.trim() !== '') {
            if (!productCategory || !productCategory.subcategories.includes(body.subcategory.trim())) return NextResponse.json({ message: `Subcategory '${body.subcategory}' does not exist in product's current category '${productCategory?.name}'` }, { status: 400 });
            updateData.subcategory = body.subcategory.trim();
        } else {
             updateData.subcategory = undefined; // Clear subcategory
        }
    }

    // Handle color updates
    if (body.colors && Array.isArray(body.colors)) {
        const parsedColors: Partial<IProductColor>[] = []; // Use Partial for constructing

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

            const newColorData: Partial<IProductColor> = {
                name: color.name.trim(),
                hexCode: color.hexCode?.trim() || undefined,
                imageUrls: parsedImageUrls, // Already validated
                stock: color.stock,
                 // Include _id ONLY if it's a valid ObjectId (for updating existing subdocs)
                ...(color._id && mongoose.Types.ObjectId.isValid(color._id.toString()) && { _id: new mongoose.Types.ObjectId(color._id.toString()) })
             };

            parsedColors.push(newColorData);
        }
        updateData.colors = parsedColors; // Replace the entire colors array
    } else if (body.hasOwnProperty('colors') && body.colors === null) {
        // Allow explicitly setting colors to null or empty array to remove all colors
        updateData.colors = [];
    }

    // Trim thumbnailUrl if provided
    if (updateData.thumbnailUrl) {
        updateData.thumbnailUrl = updateData.thumbnailUrl.trim();
    }


    // Use findByIdAndUpdate with $set to update only provided fields
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // runValidators ensures schema rules are checked
    ).populate<{ category: ICategory }>('category', 'name subcategories _id');

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
     if ((error as any).name === 'ValidationError') {
       // Log detailed validation errors for debugging
       console.error('Mongoose Validation Errors during PUT:', (error as any).errors);
       return NextResponse.json({ message: 'Validation failed. Check product data.', errors: (error as any).errors }, { status: 400 });
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