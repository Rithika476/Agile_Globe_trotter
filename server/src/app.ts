import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import tripRoutes from './routes/trip.routes';
import sharedRoutes from './routes/shared.routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/shared', sharedRoutes);

// 404 Handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Central Error Handling Middleware
app.use(errorHandler);

export default app;
