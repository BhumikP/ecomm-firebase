// src/models/Order.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { IUser } from './User';
import type { IProduct } from './Product';

// Define the structure for items within an order
export interface OrderItem {
  _id?: Types.ObjectId; // Mongoose subdocuments have _id by default
  productId: Types.ObjectId | IProduct;
  productName: string;
  quantity: number;
  price: number; // Price *per unit* at the time of order
  image?: string;
  selectedColorSnapshot?: {
    name: string;
    hexCode?: string;
  };
}

// Define the structure for the shipping address
interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

// Define the main Order interface extending Mongoose Document
export interface IOrder extends Document {
  userId: Types.ObjectId | IUser; // Reference to the User model
  orderId: string;
  items: Types.DocumentArray<OrderItem>; // Use DocumentArray for subdocuments
  total: number;
  currency: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Payment Failed';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentDetails?: {
    transactionId?: string;
    gateway?: string;
  };
  shippingCost?: number;
  taxAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema<OrderItem> = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  selectedColorSnapshot: {
    name: { type: String },
    hexCode: { type: String },
  },
}); // _id is true by default for subdocuments

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
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  items: [OrderItemSchema], // Use the defined subdocument schema
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
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
}, { timestamps: true });


OrderSchema.pre<IOrder>('save', async function(next) {
    if (this.isNew && !this.orderId) {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 7);
        this.orderId = `ORD-${timestamp.toUpperCase()}-${randomPart.toUpperCase()}`;
        let existingOrder = await mongoose.models.Order.findOne({ orderId: this.orderId });
        while (existingOrder) {
            const newRandomPart = Math.random().toString(36).substring(2, 7);
            this.orderId = `ORD-${timestamp.toUpperCase()}-${newRandomPart.toUpperCase()}`;
            existingOrder = await mongoose.models.Order.findOne({ orderId: this.orderId });
        }
    }
    next();
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
