
// src/models/Setting.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISetting extends Document {
  configKey: string; // Unique key, e.g., "global_settings"
  storeName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  taxPercentage: number;
  shippingCharge: number;
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
  maintenanceMode: {
    type: Boolean,
    required: true,
    default: false,
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
}, { timestamps: true });

const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;

    