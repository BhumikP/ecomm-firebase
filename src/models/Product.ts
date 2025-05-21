
// src/models/Product.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { ICategory } from './Category'; // Import ICategory

// Interface for ProductColor subdocument
export interface IProductColor extends Types.Subdocument {
  name: string;
  hexCode?: string; // Optional: for color swatch display (e.g., #FF0000)
  imageUrls: string[]; // Array of image URLs for this color variant - REQUIRED
  stock: number; // Stock specific to this color/variant
}

// Schema for ProductColor subdocument
const ProductColorSchema: Schema<IProductColor> = new Schema({
  name: { type: String, required: true, trim: true },
  hexCode: { type: String, trim: true },
  imageUrls: {
    type: [String],
    required: [true, 'At least one image URL is required for each color variant.'],
    validate: [
      {
        validator: function(arr: string[]) {
          // Check if it's an array, not empty, and all elements are non-empty strings
          return Array.isArray(arr) && arr.length > 0 && arr.every(url => typeof url === 'string' && url.trim() !== '');
        },
        message: 'imageUrls array must contain at least one non-empty string URL.'
      },
    ]
  },
  stock: { type: Number, required: true, min: 0 },
}, { _id: true });


export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  discount: number | null; // Percentage discount
  category: Types.ObjectId | ICategory; // Reference to Category model
  subcategory?: string; // Name of the subcategory (string)
  rating: number; // Average rating
  stock: number; // Overall stock for the product. If using per-color stock, this might be sum or base.
  features: string[];
  colors: Types.DocumentArray<IProductColor>; // Use Mongoose DocumentArray for subdocuments
  thumbnailUrl: string; // The url for the product thumbnail - REQUIRED
  minOrderQuantity: number; // Minimum quantity per order
  isTopBuy?: boolean;
  isNewlyLaunched?: boolean; // New field for newly launched products
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, max: 100, default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subcategory: { type: String, trim: true, index: true }, // Optional, indexed for filtering
  rating: { type: Number, default: 0, min: 0, max: 5 },
  stock: { type: Number, required: true, min: 0, default: 0 }, // Total/base stock
  features: [{ type: String }],
  colors: { type: [ProductColorSchema], default: [] }, // Array of color variants, default to empty array
  thumbnailUrl: { type: String, required: [true, 'Primary Thumbnail URL is required.'] },
  minOrderQuantity: { type: Number, default: 1, min: 1 },
  isTopBuy: { type: Boolean, default: false, index: true },
  isNewlyLaunched: { type: Boolean, default: false, index: true }, // New field definition
}, { timestamps: true });


// Avoid recompiling the model if it already exists
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
