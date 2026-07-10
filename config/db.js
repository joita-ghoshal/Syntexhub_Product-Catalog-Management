const mongoose = require('mongoose');

// Cache the connection across serverless function invocations (Vercel, AWS Lambda, etc.)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Uses a caching strategy compatible with serverless environments
 * (Vercel, AWS Lambda, etc.) where each invocation may be a separate process.
 * In traditional environments (PM2, Docker), the cache simply holds
 * the single persistent connection.
 */
const connectDB = async () => {
  // Return cached connection if it exists and is still ready
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log(`MongoDB Connected: ${mongooseInstance.connection.host}/${mongooseInstance.connection.name}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect is handled by the driver.');
    cached.conn = null;
    cached.promise = null;
  });

  return cached.conn;
};

module.exports = connectDB;
