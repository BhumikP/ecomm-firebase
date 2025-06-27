
// src/models/User.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Define the interface for a single shipping address
export interface IShippingAddress extends Types.Subdocument {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

// Define the schema for a single shipping address
const ShippingAddressSchema: Schema<IShippingAddress> = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
});


export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  joinedDate: Date;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
  addresses?: Types.DocumentArray<IShippingAddress>; // Array of shipping addresses
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  joinedDate: { type: Date, default: Date.now },
  avatarUrl: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
  addresses: { type: [ShippingAddressSchema], default: [] }, // Add addresses to the schema
}, { timestamps: true });

// Avoid recompiling the model if it already exists
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; // Ensure default export for TypeScript modules
