
// src/models/Transaction.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { IUser } from './User';

// Snapshot of items at the time of transaction initiation
interface TransactionItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  price: number; // Price per unit at time of transaction (after bargain)
  bargainDiscount?: number;
  image?: string;
  selectedColorSnapshot?: {
    name: string;
    hexCode?: string;
  };
}

const TransactionItemSchema: Schema<TransactionItem> = new Schema({
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
}, { _id: false });

// Shipping address snapshot
interface ShippingAddress {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

const ShippingAddressSchema: Schema<ShippingAddress> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
}, { _id: false });


export interface ITransaction extends Document {
  userId: Types.ObjectId | IUser;
  items: TransactionItem[];
  shippingAddress: ShippingAddress;
  amount: number; // Total amount in the main currency unit (e.g., rupees)
  currency: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payu_mihpayid?: string; // PayU Payment ID
  payu_txnid?: string; // Our transaction ID sent to PayU
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [TransactionItemSchema], required: true },
  shippingAddress: { type: ShippingAddressSchema, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
  status: {
    type: String,
    enum: ['Pending', 'Success', 'Failed', 'Cancelled'],
    default: 'Pending',
    required: true,
    index: true,
  },
  razorpay_order_id: { type: String, index: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  payu_mihpayid: { type: String },
  payu_txnid: { type: String },
}, { timestamps: true });

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
