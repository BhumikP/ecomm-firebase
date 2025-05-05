// src/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  joinedDate: Date;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
  // Add other user fields as needed (e.g., addresses, phone number)
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  joinedDate: { type: Date, default: Date.now },
  avatarUrl: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
}, { timestamps: true });

// Avoid recompiling the model if it already exists
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; // Ensure default export for TypeScript modules
