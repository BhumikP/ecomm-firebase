
// src/models/User.js - CommonJS export for the Node script
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the reusable ShippingAddress schema
const ShippingAddressSchema = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
  isPrimary: { type: Boolean, default: false }, // Added for primary address
});


const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  joinedDate: { type: Date, default: Date.now },
  avatarUrl: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
  addresses: { type: [ShippingAddressSchema], default: [] }, // Added addresses field
}, { timestamps: true });

// Avoid recompiling the model if it already exists
// Use CommonJS syntax for export
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
