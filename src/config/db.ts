import mongoose from 'mongoose';

// Disable command buffering so operations fail fast if disconnected
mongoose.set('bufferCommands', false);

/**
 * Connects to MongoDB Atlas / MongoDB using process.env.MONGODB_URI.
 * Creates a single, reusable connection across the application lifecycle.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  // Reuse existing connection if already connected (1) or connecting (2)
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  const mongoUri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');

  if (!mongoUri) {
    const fallbackUri = 'mongodb://127.0.0.1:27017/green_csjmu';
    console.warn('[MongoDB Warning] MONGODB_URI is not set in environment. Attempting fallback local connection.');
    try {
      return await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2500 });
    } catch (err: any) {
      console.warn('[MongoDB Notice] Local MongoDB instance unavailable. Operating with in-memory store.');
      return mongoose;
    }
  }

  // Validate placeholder credentials in URI
  if (mongoUri.includes('<') || mongoUri.includes('>')) {
    console.warn('[MongoDB Warning] MONGODB_URI contains unreplaced placeholders (e.g. <username> or <password>).');
    return mongoose;
  }

  try {
    const isAtlas = mongoUri.startsWith('mongodb+srv://');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: isAtlas ? 10000 : 3000,
    });

    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error(`[MongoDB Connection Error] Failed to connect: ${error.message || error}`);
    console.log('[MongoDB Fallback] Application continues with in-memory fallback layer.');
    return mongoose;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  if (err && err.name !== 'MongoServerSelectionError' && err.name !== 'MongoParseError') {
    console.error('[MongoDB Error Event]', err.message || err);
  }
});

