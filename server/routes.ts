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
  
  // Simple root route
  app.get('/', (req, res) => {
    res.json({
      message: 'API server is running',
      timestamp: new Date().toISOString()
    });
  });
  
  // Health check endpoints
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  
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