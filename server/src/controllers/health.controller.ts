import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'globe-trotter-api',
    timestamp: new Date().toISOString(),
  });
};

export const getDbHealth = (_req: Request, res: Response): void => {
  const stateMap: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  const dbState = stateMap[readyState] || 'disconnected';
  const isConnected = readyState === 1;

  const responsePayload = {
    status: isConnected ? 'ok' : 'error',
    database: dbState,
    dbName: mongoose.connection.name || 'globetrotter',
    timestamp: new Date().toISOString(),
  };

  const statusCode = isConnected ? 200 : 503;
  res.status(statusCode).json(responsePayload);
};
