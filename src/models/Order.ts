
// src/models/Order.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { IUser } from './User';
import type { IProduct } from './Product';
import type { ITransaction } from './Transaction'; // Import ITransaction

// Define the structure for items within an order
export interface OrderItem {
  _id?: Types.ObjectId; // Mongoose subdocuments have _id by default
  productId: Types.ObjectId | IProduct;
  productName: string;
  quantity: number;
  price: number; // Price *per unit* at the time of order
  bargainDiscount?: number; // Discount per item from bargaining
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
  orderId: string; // Your internal, human-readable order ID
  transactionId: Types.ObjectId | ITransaction; // Link to the transaction - NOW REQUIRED
  items: Types.DocumentArray<OrderItem>; // Use DocumentArray for subdocuments
  total: number;
  totalBargainDiscount?: number; // Total discount from bargaining
  currency: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
  shippingAddress: ShippingAddress;
  paymentMethod: 'Razorpay' | 'COD' | 'PayU'; // Added PayU
  paymentDetails?: {
    transactionId?: string; // This will be razorpay_payment_id or PayU ID
    gateway?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    payu_mihpayid?: string;
    payu_txnid?: string;
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
  bargainDiscount: { type: Number, default: 0 },
  image: { type: String },
  selectedColorSnapshot: {
    name: { type: String },
    hexCode: { type: String },
  },
});

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
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
  items: [OrderItemSchema],
  total: { type: Number, required: true, min: 0 },
  totalBargainDiscount: { type: Number, default: 0 },
  currency: { type: String, required: true, default: 'INR' },
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing',
    required: true,
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    required: true,
    index: true,
  },
  shippingAddress: { type: ShippingAddressSchema, required: true },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'COD', 'PayU'],
    required: true,
  },
  paymentDetails: {
     transactionId: { type: String },
     gateway: { type: String },
     razorpay_payment_id: { type: String },
     razorpay_order_id: { type: String },
     razorpay_signature: { type: String },
     payu_mihpayid: { type: String },
     payu_txnid: { type: String },
  },
  shippingCost: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });


const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
