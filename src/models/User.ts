
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
  isPrimary?: boolean; // New field to mark the primary address
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
  isPrimary: { type: Boolean, default: false }, // Default to not primary
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


// Pre-save hook to ensure only one address is primary
UserSchema.pre('save', function(next) {
  if (this.isModified('addresses')) {
    const primaryAddresses = this.addresses?.filter(addr => addr.isPrimary);

    // If more than one address is marked as primary, un-mark all but the last one.
    // This handles both adding a new primary address and updating an existing one.
    if (primaryAddresses && primaryAddresses.length > 1) {
      // Find the most recently-marked-as-primary address among the modified ones.
      // This is a simple heuristic; a more complex one might be needed for concurrent updates.
      const lastPrimaryId = primaryAddresses[primaryAddresses.length - 1]._id;
      this.addresses?.forEach(addr => {
        if (addr.isPrimary && addr._id?.toString() !== lastPrimaryId?.toString()) {
          addr.isPrimary = false;
        }
      });
    }

    // Ensure at least one address is primary if there are any addresses, but none is marked.
    if (this.addresses && this.addresses.length > 0 && !this.addresses.some(addr => addr.isPrimary)) {
        this.addresses[0].isPrimary = true;
    }
  }
  next();
});


// Avoid recompiling the model if it already exists
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; // Ensure default export for TypeScript modules
