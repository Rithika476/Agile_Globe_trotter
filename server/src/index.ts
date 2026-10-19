import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB, disconnectDB } from './config/db';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Initialize server listener
const server = app.listen(PORT, async () => {
  console.log(`[server]: Globe Trotter API running on http://localhost:${PORT}`);
  console.log(`[server]: Health check available at http://localhost:${PORT}/api/health`);
  console.log(`[server]: DB health check available at http://localhost:${PORT}/api/health/db`);

  // Connect to MongoDB without blocking server responsiveness
  await connectDB();
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[server]: Shutting down gracefully...');
  server.close(async () => {
    console.log('[server]: HTTP server closed.');
    await disconnectDB();
    console.log('[server]: Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
