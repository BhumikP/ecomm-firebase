
// src/models/Order.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { IUser } from './User'; // Import User type if linking users
import type { IProduct } from './Product'; // Import Product type if linking products

// Define the structure for items within an order
interface OrderItem {
  productId: Types.ObjectId | IProduct; // Reference to the Product model
  productName: string; // Store name at time of order for history
  quantity: number;
  price: number; // Price *per unit* at the time of order
  image?: string; // Optional: Store image URL at time of order
}

// Define the structure for the shipping address
interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string; // Optional
}

// Define the main Order interface extending Mongoose Document
export interface IOrder extends Document {
  // userId: Types.ObjectId | IUser; // Reference to the User model
  orderId: string; // Custom, potentially human-readable order ID (e.g., ORD-1001) - ensure uniqueness
  items: OrderItem[];
  total: number; // Total amount paid/due for the order
  currency: string; // Currency code (e.g., 'INR', 'USD')
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Payment Failed';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  shippingAddress: ShippingAddress;
  paymentMethod: string; // e.g., "Visa **** 1234", "PayPal", "Juspay"
  paymentDetails?: { // Optional: Store details from payment gateway
    transactionId?: string;
    gateway?: string;
    // Add other relevant fields from Juspay or other gateways
  };
  shippingCost?: number; // Optional
  taxAmount?: number; // Optional
  notes?: string; // Optional customer notes
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema<OrderItem> = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
}, { _id: false }); // Don't create separate _id for subdocuments unless needed

const ShippingAddressSchema: Schema<ShippingAddress> = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
}, { _id: false });

const OrderSchema: Schema<IOrder> = new Schema({
  // userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true }, // Ensure unique order IDs
  items: { type: [OrderItemSchema], required: true },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' }, // Default currency changed to INR
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Payment Failed'],
    default: 'Pending',
    required: true,
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
    required: true,
    index: true,
  },
  shippingAddress: { type: ShippingAddressSchema, required: true },
  paymentMethod: { type: String, required: true },
  paymentDetails: {
     transactionId: { type: String },
     gateway: { type: String },
  },
  shippingCost: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true }); // Adds createdAt and updatedAt fields


// Middleware to generate a unique orderId before saving (Example)
// Consider a more robust unique ID generation strategy for production
OrderSchema.pre<IOrder>('save', async function(next) {
    if (this.isNew && !this.orderId) {
        // Simple example: Timestamp + random part. Needs improvement for scale.
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 7);
        this.orderId = `ORD-${timestamp.toUpperCase()}-${randomPart.toUpperCase()}`;

        // Check for uniqueness (important for production)
        let existingOrder = await mongoose.models.Order.findOne({ orderId: this.orderId });
        while (existingOrder) {
            // Regenerate if collision occurs (unlikely with this method, but possible)
            const newRandomPart = Math.random().toString(36).substring(2, 7);
            this.orderId = `ORD-${timestamp.toUpperCase()}-${newRandomPart.toUpperCase()}`;
            existingOrder = await mongoose.models.Order.findOne({ orderId: this.orderId });
        }
    }
    next();
});


// Avoid recompiling the model if it already exists
const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
