import mongoose from 'mongoose';

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('[database]: MongoDB connected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('[database]: MongoDB runtime connection error:', err.message || err);
});

mongoose.connection.on('disconnected', () => {
  console.log('[database]: MongoDB connection disconnected.');
});

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 * Does not throw on initial connection failure to allow the server
 * to continue running and serving non-database health endpoints.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[database]: MONGODB_URI environment variable is not defined.');
    return;
  }

  try {
    // serverSelectionTimeoutMS ensures quick failure instead of hanging
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown connection error';
    // Strictly avoid printing the full URI to protect credentials/host details
    console.error(`[database]: Failed to connect to MongoDB (${errMessage}). Server will continue running.`);
  }
};

/**
 * Cleanly close the MongoDB connection during graceful shutdown.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[database]: MongoDB connection closed gracefully.');
    }
  } catch (error: unknown) {
    console.error('[database]: Error while closing MongoDB connection:', error);
  }
};
