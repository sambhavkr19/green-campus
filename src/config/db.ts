import mongoose from 'mongoose';

// Disable command buffering so operations fail immediately if MongoDB is disconnected
mongoose.set('bufferCommands', false);

/**
 * MongoDB Connection Handler
 * Connects to MongoDB using Mongoose with robust event listeners
 * and graceful fallback handling.
 */
export const connectDB = async (): Promise<void> => {
  let mongoUri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');

  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    mongoUri = 'mongodb://127.0.0.1:27017/green_csjmu';
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3s if unable to connect
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Initial connection failed: ${(error as Error).message}`);
    console.log('[MongoDB Fallback] Operating with in-memory fallback layer until MongoDB instance is connected.');
  }
};

// Event listeners for database connection lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Error]', err);
});
