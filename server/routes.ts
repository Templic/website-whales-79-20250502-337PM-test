/**
 * Server routes registration
 */

import express, { Request, Response } from 'express';
import http from 'http';
import dbMonitorRoutes from './routes/db-monitor';

/**
 * Register all API routes
 */
export async function registerRoutes(app: express.Application): Promise<http.Server> {
  console.log('Registering API routes...');
  
  // Create HTTP server
  const httpServer = http.createServer(app);
  
  // Root route is now defined in server/index.ts
  
  // Health check endpoints are now mounted in configureExpress in server/index.ts
  
  // Mount database monitoring routes
  app.use('/api/db', dbMonitorRoutes);
  
  // Simple test endpoint - protected by rate limiting
  app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'API test successful',
      timestamp: new Date().toISOString(),
      userInfo: (req as any).user || null
    });
  });
  
  console.log('API routes registered successfully');
  return httpServer;
}

export default {
  registerRoutes
};