// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
     const opts = {
       bufferCommands: false,
       // Add other mongoose connection options if needed
     };

    console.log('Creating new MongoDB connection');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
        console.log('MongoDB connected successfully');
      return mongooseInstance;
    }).catch(error => {
        console.error('MongoDB connection error:', error);
        cached.promise = null; // Reset promise on error
        throw error; // Re-throw error to indicate connection failure
    });
  }

  try {
      cached.conn = await cached.promise;
  } catch (error) {
      cached.promise = null; // Ensure promise is cleared if connection fails
      throw error; // Re-throw the error after attempting connection
  }
  return cached.conn;
}

export default connectDb;
