import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = app.listen(PORT, () => {
  console.log(`[server]: Globe Trotter API running on http://localhost:${PORT}`);
  console.log(`[server]: Health check available at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n[server]: Shutting down gracefully...');
  server.close(() => {
    console.log('[server]: Closed remaining connections.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
