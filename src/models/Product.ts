// src/models/Product.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { ICategory } from './Category'; // Import ICategory

// Interface for ProductColor subdocument
export interface IProductColor extends Types.Subdocument {
  name: string;
  hexCode?: string; // Optional: for color swatch display (e.g., #FF0000)
  imageIndex: number; // Index in the 'images' array for this color variant
  stock?: number; // Optional: stock specific to this color/variant
}

// Schema for ProductColor subdocument
const ProductColorSchema: Schema<IProductColor> = new Schema({
  name: { type: String, required: true, trim: true },
  hexCode: { type: String, trim: true },
  imageIndex: { type: Number, required: true, min: 0 },
  stock: { type: Number, min: 0 },
}, { _id: true }); // Keep _id for subdocuments if they might be individually referenced/updated, or set to false if not.


export interface IProduct extends Document {
  image: string; // Main/featured image URL (typically images[0] or a specific one)
  images: string[]; // Array of all image URLs for the product
  title: string;
  description: string;
  price: number;
  discount: number | null; // Percentage d  iscount
  category: Types.ObjectId | ICategory; // Reference to Category model
  subcategory?: string; // Name of the subcategory (string)
  rating: number; // Average rating
  stock: number; // Overall stock for the product. If using per-color stock, this might be sum or base.
  features: string[];
  colors: IProductColor[]; // Array of color variants
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  image: { type: String, required: true }, // Primary display image
  images: [{ type: String }], // Array of all image URLs
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, max: 100, default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subcategory: { type: String, trim: true, index: true }, // Optional, indexed for filtering
  rating: { type: Number, default: 0, min: 0, max: 5 },
  stock: { type: Number, required: true, min: 0, default: 0 }, // Total/base stock
  features: [{ type: String }],
  colors: [ProductColorSchema], // Array of color variants
}, { timestamps: true });

// Avoid recompiling the model if it already exists
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
