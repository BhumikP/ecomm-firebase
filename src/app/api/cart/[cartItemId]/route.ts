// src/app/api/cart/[cartItemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import Cart, { ICart } from '@/models/Cart';
import Product from '@/models/Product'; // Needed for stock checks
import mongoose from 'mongoose';

interface Params {
  params: { cartItemId: string };
}

// PUT to update specific cart item quantity
export async function PUT(req: NextRequest, { params }: Params) {
  await connectDb();
  const { cartItemId } = params;

  if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
    return NextResponse.json({ message: 'Invalid cart item ID' }, { status: 400 });
  }

  try {
    const { userId, newQuantity } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required' }, { status: 400 });
    }
    if (newQuantity == null || newQuantity < 1) {
      return NextResponse.json({ message: 'New quantity must be at least 1' }, { status: 400 });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return NextResponse.json({ message: 'Cart not found for user' }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(item => item._id?.toString() === cartItemId);
    if (itemIndex === -1) {
      return NextResponse.json({ message: 'Cart item not found' }, { status: 404 });
    }

    const cartItem = cart.items[itemIndex];
    const product = await Product.findById(cartItem.product);
    if (!product) {
        // This case should ideally not happen if product existed when added to cart
        // But good to handle if product gets deleted.
        cart.items.splice(itemIndex, 1); // Remove inconsistent item
        await cart.save();
        return NextResponse.json({ message: 'Product associated with cart item not found, item removed.' }, { status: 404 });
    }

    let availableStock = product.stock;
    if (cartItem.selectedColorSnapshot?.name && product.colors) {
        const colorVariant = product.colors.find(c => c.name === cartItem.selectedColorSnapshot!.name);
        if (colorVariant) {
            availableStock = colorVariant.stock;
        } else {
             // Color variant on product no longer exists, remove item or handle as error
            cart.items.splice(itemIndex, 1);
            await cart.save();
            return NextResponse.json({ message: 'Color variant no longer available, item removed.' }, { status: 400 });
        }
    }

    if (newQuantity > availableStock) {
        return NextResponse.json({ message: 'Requested quantity exceeds available stock.' }, { status: 400 });
    }


    cart.items[itemIndex].quantity = newQuantity;
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate({
        path: 'items.product', model: 'Product', select: 'title price thumbnailUrl stock colors minOrderQuantity'
    });

    return NextResponse.json({ cart: populatedCart, message: 'Cart item quantity updated' }, { status: 200 });

  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE specific cart item
export async function DELETE(req: NextRequest, { params }: Params) {
  await connectDb();
  const { cartItemId } = params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');


  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Valid userId is required in query parameters' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
    return NextResponse.json({ message: 'Invalid cart item ID' }, { status: 400 });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return NextResponse.json({ message: 'Cart not found for user' }, { status: 404 });
    }

    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(item => item._id?.toString() !== cartItemId) as Types.DocumentArray<ICartItem>;

    if (cart.items.length === initialItemCount) {
        return NextResponse.json({ message: 'Cart item not found or already removed' }, { status: 404 });
    }

    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate({
        path: 'items.product', model: 'Product', select: 'title price thumbnailUrl stock colors minOrderQuantity'
    });

    return NextResponse.json({ cart: populatedCart, message: 'Cart item removed' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
