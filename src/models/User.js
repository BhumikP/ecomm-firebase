// src/models/User.js - CommonJS export for the Node script
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  joinedDate: { type: Date, default: Date.now },
  avatarUrl: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
}, { timestamps: true });

// Avoid recompiling the model if it already exists
// Use CommonJS syntax for export
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
