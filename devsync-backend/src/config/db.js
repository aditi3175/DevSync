import mongoose from 'mongoose';
import config from './index.js';

mongoose.set('strictQuery', true); 

//-- DB Connection --
export async function connectDB() {
  const mongoUri = config.db.mongoUri;

  if (!mongoUri) {
    console.error('❌ No MongoDB URI found in config.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      // Connection pooling configuration
      maxPoolSize: 10, // Maximum connections in pool
      minPoolSize: 5, // Minimum connections to maintain
      maxIdleTimeMS: 45000, // Close idle connections after 45s
      serverSelectionTimeoutMS: 10000, // Fail fast if cannot connect
      socketTimeoutMS: 45000, // 45s socket timeout
      family: 4, // Use IPv4 (can be 4 or 6)
      retryWrites: true, // Enable retry writes
      retryReads: true, // Enable retry reads
    });


    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // event listeners
  mongoose.connection.on('connected', () => {
    console.log('Mongoose event: connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose event: disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.log('Mongoose event: error', err);
  });
}

//-- Close DB Connection --
export async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB:', err.message);
  }
}
