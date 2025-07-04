'use server';
import connectDb from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export interface UserTransactionSummary {
  userId: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedOrCancelledTransactions: number;
  totalSpent: number;
  averageOrderValue: number;
  firstTransactionDate?: Date;
  lastTransactionDate?: Date;
}

export async function getUserTransactionSummary(userId: string): Promise<UserTransactionSummary> {
  await connectDb();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const transactions = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: 'asc' });

  if (transactions.length === 0) {
    return {
      userId,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedOrCancelledTransactions: 0,
      totalSpent: 0,
      averageOrderValue: 0,
    };
  }

  let successfulTransactions = 0;
  let totalSpent = 0;

  for (const t of transactions) {
    if (t.status === 'Success') {
      successfulTransactions++;
      totalSpent += t.amount;
    }
  }

  const totalTransactions = transactions.length;
  const failedOrCancelledTransactions = totalTransactions - successfulTransactions;
  const averageOrderValue = successfulTransactions > 0 ? totalSpent / successfulTransactions : 0;
  
  return {
    userId,
    totalTransactions,
    successfulTransactions,
    failedOrCancelledTransactions,
    totalSpent,
    averageOrderValue,
    firstTransactionDate: transactions[0]?.createdAt,
    lastTransactionDate: transactions[transactions.length - 1]?.createdAt,
  };
}
