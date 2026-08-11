import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

/**
 * Seeds initial demo data (users, initiatives) into MongoDB if collection is empty
 */
export const seedInitialData = async () => {
  try {
    const User = mongoose.model('User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB Seeding] Initializing default CSJMU campus demo accounts...');
      await User.create([
        {
          name: 'Aarav Student',
          email: 'student@csjmu.ac.in',
          password: 'password123',
          role: 'student',
          department: 'Computer Science & Engineering',
          greenPoints: 350,
        },
        {
          name: 'Priya Verma',
          email: 'priya@csjmu.ac.in',
          password: 'password123',
          role: 'student',
          department: 'Biotechnology',
          greenPoints: 280,
        },
        {
          name: 'Dr. Sunita Sharma',
          email: 'faculty@csjmu.ac.in',
          password: 'password123',
          role: 'faculty',
          department: 'Environmental Sciences',
          greenPoints: 450,
        },
        {
          name: 'Campus Admin',
          email: 'admin@csjmu.ac.in',
          password: 'password123',
          role: 'admin',
          department: 'Administration',
          greenPoints: 1000,
        },
      ]);
      console.log('[MongoDB Seeding] Default CSJMU demo accounts seeded successfully!');
    }
  } catch (err: any) {
    console.warn('[MongoDB Seeding Notice]', err.message || err);
  }
};

/**
 * Connects to MongoDB Atlas / MongoDB using process.env.MONGODB_URI.
 * Falls back to MongoMemoryServer (embedded live MongoDB engine) if no URI is supplied.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  // Reuse existing connection if already connected (1) or connecting (2)
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  const mongoUri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');

  // 1. Try process.env.MONGODB_URI if valid
  if (mongoUri && !mongoUri.includes('<') && !mongoUri.includes('>')) {
    try {
      const isAtlas = mongoUri.startsWith('mongodb+srv://');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: isAtlas ? 8000 : 3000,
      });

      console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host} | DB: ${conn.connection.name}`);
      await seedInitialData();
      return conn;
    } catch (error: any) {
      console.warn(`[MongoDB Atlas Warning] Failed to connect to MONGODB_URI (${error.message}). Switching to Embedded Live MongoDB Engine.`);
    }
  }

  // 2. Embedded Live MongoMemoryServer Fallback (Guarantees real MongoDB instance is ALWAYS connected)
  try {
    if (!mongoMemoryServer) {
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'green_csjmu' }
      });
    }
    const memUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memUri);

    console.log(`[MongoDB Engine] Live MongoMemoryServer active and connected at: ${memUri}`);
    await seedInitialData();
    return conn;
  } catch (memErr: any) {
    console.error(`[MongoDB Engine Error] Could not start embedded MongoMemoryServer: ${memErr.message || memErr}`);
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


