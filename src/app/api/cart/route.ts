// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Cart, { ICart, ICartItem } from '@/models/Cart';
import Product, { IProduct, IProductColor } from '@/models/Product';
import User from '@/models/User'; // Assuming User model exists and is used
import mongoose from 'mongoose';

// GET current user's cart
export async function GET(req: NextRequest) {
  await connectDb();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Valid userId is required' }, { status: 400 });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.product', // Populate the product field within each item
      model: 'Product', // Explicitly specify the model for population
      select: 'title price thumbnailUrl stock colors minOrderQuantity category subcategory rating', // Select necessary fields
    });

    if (!cart) {
      // If no cart, return an empty cart structure
      return NextResponse.json({ cart: { userId, items: [], _id: new mongoose.Types.ObjectId().toString() } }, { status: 200 });
    }
    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// POST to add/update item in cart
export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { userId, productId, quantity, selectedColorName } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required' }, { status: 400 });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ message: 'Valid productId is required' }, { status: 400 });
    }
    if (quantity == null || quantity < 1) {
      return NextResponse.json({ message: 'Quantity must be at least 1' }, { status: 400 });
    }

    const product = await Product.findById(productId) as IProduct | null;
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const priceSnapshot = product.discount && product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price;

    let selectedColorData: IProductColor | undefined;
    let imageSnapshot = product.thumbnailUrl; // Default to product thumbnail

    if (selectedColorName && product.colors && product.colors.length > 0) {
      selectedColorData = product.colors.find(c => c.name === selectedColorName);
      if (!selectedColorData) {
        return NextResponse.json({ message: `Color ${selectedColorName} not found for this product.` }, { status: 400 });
      }
      // Use the first image of the selected color variant for the cart, if available
      if (selectedColorData.imageUrls && selectedColorData.imageUrls.length > 0) {
        imageSnapshot = selectedColorData.imageUrls[0];
      }
    }
    
    // Check stock availability
    const stockToCheck = selectedColorData ? selectedColorData.stock : product.stock;
    if (stockToCheck < quantity) {
        return NextResponse.json({ message: 'Insufficient stock for the requested quantity.' }, { status: 400 });
    }


    const existingItemIndex = cart.items.findIndex(item =>
      item.product.toString() === productId &&
      item.selectedColorSnapshot?.name === selectedColorName // Works even if selectedColorName is undefined
    );

    if (existingItemIndex > -1) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity = quantity; // Directly set to new quantity
    } else {
      // Add new item
      const newItem: Partial<ICartItem> = { // Use Partial because _id is auto-generated
        product: new mongoose.Types.ObjectId(productId),
        quantity: quantity,
        nameSnapshot: product.title,
        priceSnapshot: priceSnapshot,
        imageSnapshot: imageSnapshot,
      };
      if (selectedColorData) {
        newItem.selectedColorSnapshot = {
          name: selectedColorData.name,
          hexCode: selectedColorData.hexCode,
        };
      }
      cart.items.push(newItem as ICartItem);
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate({
        path: 'items.product', model: 'Product', select: 'title price thumbnailUrl stock colors minOrderQuantity'
    });
    return NextResponse.json({ cart: populatedCart, message: 'Cart updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
