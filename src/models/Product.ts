// src/models/Product.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { ICategory } from './Category'; // Import ICategory

export interface IProduct extends Document {
  image: string;
  title: string;
  description: string;
  price: number;
  discount: number | null; // Percentage discount
  category: Types.ObjectId | ICategory; // Reference to Category model
  subcategory?: string; // Name of the subcategory (string)
  rating: number; // Average rating
  stock: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  image: { type: String, required: true },
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, max: 100, default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subcategory: { type: String, trim: true, index: true }, // Optional, indexed for filtering
  rating: { type: Number, default: 0, min: 0, max: 5 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  features: [{ type: String }],
}, { timestamps: true });

// Avoid recompiling the model if it already exists
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;