
// src/models/Setting.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISetting extends Document {
  configKey: string; // Unique key, e.g., "global_settings"
  storeName: string;
  supportEmail: string;
  taxPercentage: number;
  shippingCharge: number;
  announcementText?: string;
  announcementLink?: string;
  isAnnouncementActive?: boolean;
  activePaymentGateway: 'razorpay' | 'payu'; // To toggle between payment gateways
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema<ISetting> = new Schema({
  configKey: {
    type: String,
    required: true,
    unique: true,
    default: 'global_settings', // Only one document for settings
    index: true,
  },
  storeName: {
    type: String,
    required: true,
    default: 'eShop Simplified',
  },
  supportEmail: {
    type: String,
    required: true,
    default: 'support@eshop.com',
  },
  taxPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  shippingCharge: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  announcementText: {
    type: String,
    trim: true,
  },
  announcementLink: {
    type: String,
    trim: true,
  },
  isAnnouncementActive: {
    type: Boolean,
    default: false,
  },
  activePaymentGateway: {
    type: String,
    enum: ['razorpay', 'payu'],
    default: 'razorpay',
    required: true,
  },
}, { timestamps: true });

const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
