// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Extract database name from URI if present, otherwise handle error or default
let dbName = 'eshop'; // Default database name
try {
    const url = new URL(MONGODB_URI);
    // Pathname usually starts with '/', so remove it
    const pathDbName = url.pathname.substring(1);
    // Check if a database name is specified in the path
    if (pathDbName) {
        dbName = pathDbName.split('/')[0]; // Get the first part of the path
        console.log(`Database name specified in URI: ${dbName}`);
    } else {
        // Check for dbName in query parameters (less common)
        const queryDbName = url.searchParams.get('dbName'); // Or relevant param like 'database'
        if (queryDbName) {
            dbName = queryDbName;
             console.log(`Database name specified in query params: ${dbName}`);
        } else {
            console.warn(`No database name specified in MongoDB URI path or query params, using default: '${dbName}'. Ensure your URI includes the database name (e.g., ...mongodb.net/eshop?...)`);
        }
    }
} catch (e) {
    console.error("Could not parse MONGODB_URI to extract database name.", e);
    // Potentially throw an error here if db name is mandatory
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
    // Verify connection state if needed
    if (cached.conn.readyState === 1) {
        // console.log('Using cached MongoDB connection');
        return cached.conn;
    }
     console.warn('Cached connection found but not ready. Attempting to reconnect.');
     // Reset cached promise/conn to force reconnection
     cached.conn = null;
     cached.promise = null;

  }

  if (!cached.promise) {
     const opts = {
       bufferCommands: false,
       dbName: dbName, // Explicitly set the database name
       serverSelectionTimeoutMS: 5000, // Faster timeout
       // Add other mongoose connection options if needed
     };

    console.log(`Creating new MongoDB connection to database: ${dbName}`);
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
        console.log('MongoDB connected successfully.');
      return mongooseInstance;
    }).catch(error => {
        console.error('MongoDB connection error:', error.message);
        cached.promise = null; // Reset promise on error
        throw error; // Re-throw error to indicate connection failure
    });
  }

  try {
      cached.conn = await cached.promise;
  } catch (error) {
      cached.promise = null; // Ensure promise is cleared if connection fails
       console.error('Failed to establish MongoDB connection.'); // Log failure specifically
      throw error; // Re-throw the error after attempting connection
  }
  return cached.conn;
}

// Optional: Add event listeners for connection status
mongoose.connection.on('error', err => {
  console.error(`MongoDB connection error event: ${err}`);
  // Consider resetting cache here if appropriate for your error handling strategy
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected!');
  // Consider resetting cache here
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('connected', () => {
    // console.log('MongoDB reconnected event.'); // Can be noisy, use if needed
});


export default connectDb;
