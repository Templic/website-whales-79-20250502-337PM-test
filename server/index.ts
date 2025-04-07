/**
 * Server main entry point with resilience, monitoring, and security features
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import db from './db';
import resilience from './resilience';
import monitoring from './monitoring';
import { registerRoutes } from './routes';
import { initializeSecurityScans, stopSecurityScans } from './securityScan';
import { initDatabaseOptimization } from './db-optimize';
import { initBackgroundServices, shutdownBackgroundServices } from './db-background';
import { initializeCompliance } from './security/compliance';
import security from './security/security';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimit';
import monitoringMiddleware from './middleware/monitoring';

// Create Express app
const app = express();
let server: http.Server;

/**
 * Initialize and start the server
 */
export async function startServer(): Promise<http.Server> {
  console.log('Starting server with enhanced resilience and monitoring...');
  
  try {
    // Initialize resilience components
    resilience.initializeResilienceComponents();
    
    // Initialize database
    const dbInitialized = await db.initDatabaseConnection();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database connection');
    }
    
    // Initialize database optimization
    await initDatabaseOptimization();
    
    // Initialize background services
    await initBackgroundServices();
    
    // Initialize monitoring
    monitoring.initialize({
      systemMetricsIntervalMs: 60000 // Collect metrics every minute
    });
    
    // Initialize security scanning
    initializeSecurityScans();
    
    // Initialize compliance framework
    initializeCompliance();
    
    // Configure Express middleware
    configureExpress();
    
    // Register routes
    server = await registerRoutes(app);
    
    // Start HTTP server
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    server.listen(port, host as any, () => {
      console.log(`Server listening on ${host}:${port}`);
    });
    
    // Handle graceful shutdown
    setupGracefulShutdown();
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Configure Express middleware
 */
function configureExpress(): void {
  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(security.securityMiddleware);
  app.use(security.securityHeaders);
  
  // Body parsing middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Monitoring middleware for request timing
  app.use(monitoringMiddleware.requestTimingMiddleware);
  app.use(monitoringMiddleware.serverInfoMiddleware);
  
  // Rate limiting for API routes
  app.use('/api', apiRateLimit());
  
  // Register health routes
  app.use(healthRoutes);
  
  // Register auth routes
  app.use('/api/auth', authRoutes);
  
  // Error handling middleware - should be registered last
  app.use(notFoundHandler);
  app.use(errorHandler);
}

/**
 * Set up graceful shutdown handling
 */
function setupGracefulShutdown(): void {
  // Handle process termination signals
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      await shutdown();
    });
  }
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await shutdown();
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled promise rejection at:', promise, 'reason:', reason);
    // Don't shut down for unhandled rejections, just log them
  });
}

/**
 * Gracefully shut down the server and release resources
 */
export async function shutdown(): Promise<void> {
  console.log('Shutting down server...');
  
  // Close HTTP server first to stop accepting new connections
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    });
  }
  
  // Shutdown monitoring
  monitoring.shutdown();
  
  // Shutdown security scans
  stopSecurityScans();
  
  // Shutdown background services
  await shutdownBackgroundServices();
  
  // Shutdown resilience components
  resilience.shutdownResilienceComponents();
  
  // Close database connection last
  await db.closeDatabaseConnection();
  
  console.log('Server shutdown complete');
  
  // Force exit if shutdown takes too long
  setTimeout(() => {
    console.log('Forced exit after shutdown timeout');
    process.exit(0);
  }, 5000);
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default app;