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
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) {
    // If a cached connection exists, return it.
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // If a connection promise doesn't exist, create one. Mongoose will handle
    // the database name from the URI.
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    // Await the connection promise and cache the connection instance.
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, reset the promise so the next request can try again.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDb;
