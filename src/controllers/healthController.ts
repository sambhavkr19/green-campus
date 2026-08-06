import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Health Check Controller
 * GET /api/health
 */
export const getHealthStatus = asyncHandler(async (req: Request, res: Response) => {
  const dbStates: Record<number, string> = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbStateCode = mongoose.connection.readyState;
  const dbStatus = dbStates[dbStateCode] || 'Unknown';

  res.status(200).json({
    status: 'success',
    project: 'Green CSJMU Initiative API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      connected: dbStateCode === 1,
    },
  });
});
