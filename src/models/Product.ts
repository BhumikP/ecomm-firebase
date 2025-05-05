// src/models/Product.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  image: string;
  title: string;
  description: string;
  price: number;
  discount: number | null; // Percentage discount
  category: string;
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
  category: { type: String, required: true, index: true },
  rating: { type: Number, default: 0, min: 0, max: 5 }, // Could be calculated based on reviews
  stock: { type: Number, required: true, min: 0, default: 0 },
  features: [{ type: String }],
}, { timestamps: true }); // Adds createdAt and updatedAt fields

// Avoid recompiling the model if it already exists
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
