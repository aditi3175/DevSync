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
      serverSelectionTimeoutMS: 10000, // fail fast if cannot connect
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
