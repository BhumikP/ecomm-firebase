// src/models/Cart.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { IUser } from './User';
import type { IProduct } from './Product';

export interface ICartItem extends Types.Subdocument {
  product: Types.ObjectId; // Reference to the Product model
  quantity: number;
  nameSnapshot: string; // Product name at time of addition
  priceSnapshot: number; // Price per unit at time of addition
  imageSnapshot: string; // Product thumbnail or color image at time of addition
  selectedColorSnapshot?: { // Optional: if product has color variants
    name: string;
    hexCode?: string;
  };
}

const CartItemSchema: Schema<ICartItem> = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  nameSnapshot: { type: String, required: true },
  priceSnapshot: { type: Number, required: true },
  imageSnapshot: { type: String, required: true },
  selectedColorSnapshot: {
    name: { type: String },
    hexCode: { type: String },
  },
});

export interface ICart extends Document {
  userId: Types.ObjectId | IUser;
  items: Types.DocumentArray<ICartItem>;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema: Schema<ICart> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items: [CartItemSchema],
}, { timestamps: true });

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
