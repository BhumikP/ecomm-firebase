
// src/models/Banner.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  altText: string;
  linkUrl?: string; // Optional URL the banner links to
  order: number; // For sorting banners
  dataAiHint?: string; // For AI-powered image suggestions if needed later
  isActive: boolean; // To toggle banner visibility
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema<IBanner> = new Schema({
  imageUrl: {
    type: String,
    required: [true, 'Banner image URL is required.'],
    trim: true,
  },
  altText: {
    type: String,
    required: [true, 'Alt text for the banner image is required.'],
    trim: true,
  },
  linkUrl: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  dataAiHint: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  }
}, { timestamps: true });

const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
