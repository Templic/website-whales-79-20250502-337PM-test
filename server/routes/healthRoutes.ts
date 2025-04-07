/**
 * Health check routes for API monitoring and status
 */

import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import monitoring from '../monitoring';
import { pgPool } from '../db';

const router = express.Router();

/**
 * Basic health check route - returns 200 if server is running
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

/**
 * Get detailed system metrics for monitoring
 * Only accessible by admin or from local networks
 */
router.get('/health/metrics', asyncHandler(async (req: Request, res: Response) => {
  // Basic IP-based access control - only allow internal networks or admin users
  const ip = req.ip || 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
    'unknown';
  
  const isInternalRequest = 
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip.startsWith('10.') || 
    ip.startsWith('192.168.') || 
    ip.startsWith('172.16.') ||
    // Allow Replit internal monitoring
    ip.includes('.repl.') || 
    ip.endsWith('.repl.co');
  
  // Check if user has admin role
  const isAdmin = (req as any).user?.role === 'admin';
  
  if (!isInternalRequest && !isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: this endpoint requires admin privileges'
    });
  }
  
  const metrics = await monitoring.getSystemMetrics();
  res.status(200).json(metrics);
}));

/**
 * Get database connection health
 */
router.get('/health/database', asyncHandler(async (req: Request, res: Response) => {
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query('SELECT NOW() as time');
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          time: result.rows[0].time,
          connections: {
            total: pgPool.totalCount,
            idle: pgPool.idleCount,
            waiting: pgPool.waitingCount
          }
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message
    });
  }
}));

/**
 * Get API health metrics for monitoring
 */
router.get('/health/api', asyncHandler(async (req: Request, res: Response) => {
  // Similar access control as metrics endpoint
  const ip = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim();
  const isInternalRequest = 
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip.startsWith('10.') || 
    ip.startsWith('192.168.') || 
    ip.startsWith('172.16.') ||
    ip.includes('.repl.') || 
    ip.endsWith('.repl.co');
  
  const isAdmin = (req as any).user?.role === 'admin';
  
  if (!isInternalRequest && !isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: this endpoint requires admin privileges'
    });
  }
  
  // How many minutes of API metrics to return
  const minutes = Math.min(
    parseInt(req.query.minutes as string) || 60, 
    24 * 60 // Max 24 hours
  );
  
  // Optional filtering by specific endpoint
  const endpoint = req.query.endpoint as string;
  
  const metrics = monitoring.getApiMetrics({ 
    lastMinutes: minutes,
    endpoint: endpoint
  });
  
  res.status(200).json(metrics);
}));

export default router;