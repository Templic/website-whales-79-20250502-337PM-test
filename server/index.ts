/**
 * Server main entry point with resilience, monitoring, and security features
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
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
import dbMonitorRoutes from './routes/db-monitor';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimit';
import monitoringMiddleware from './middleware/monitoring';
import { spawn } from 'child_process';

// Create Express app
const app = express();
let server: http.Server;

/**
 * Initialize and start the server
 */
let flaskProcess: any = null;

/**
 * Start the Flask frontend server process
 */
function startFlaskServer() {
  console.log('Starting Flask frontend server...');
  
  // Start Flask server as a child process
  flaskProcess = spawn('python3', ['app.py']);
  
  flaskProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Flask server stdout: ${data.toString()}`);
  });
  
  flaskProcess.stderr.on('data', (data: Buffer) => {
    console.error(`Flask server stderr: ${data.toString()}`);
  });
  
  flaskProcess.on('close', (code: number) => {
    console.log(`Flask server process exited with code ${code}`);
    flaskProcess = null;
  });
  
  // Wait for Flask server to start (simple delay)
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 2000);
  });
}

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
    
    // Start Flask frontend server
    await startFlaskServer();

    // Configure Express middleware
    configureExpress();

    // Register routes
    server = await registerRoutes(app);

    // Start HTTP server
    const port = process.env.PORT || 5000;
    const host = process.env.HOST || '0.0.0.0';

    server.listen(port, host as any, () => {
      console.log(`Server listening on ${host}:${port}`);
      
      // Add more helpful information for Replit environment
      if (process.env.REPL_ID && process.env.REPL_OWNER) {
        console.log(`\n✅ Application is running in Replit environment`);
        console.log(`Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
      } else {
        console.log(`\n✅ Local development URL: http://localhost:${port}`);
      }
      console.log(`API endpoint: http://localhost:${port}/api`);
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
  // Basic security middleware
  app.use(helmet());
  app.use(cors());
  // Security headers can be applied to all routes
  app.use(security.securityHeaders);

  // Body parsing middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Monitoring middleware for request timing
  app.use(monitoringMiddleware.requestTimingMiddleware);
  app.use(monitoringMiddleware.serverInfoMiddleware);

  // Rate limiting and security for API routes
  app.use('/api', apiRateLimit());
  // Apply security middleware only to specific API routes to avoid blocking 404 handler
  // Exclude database monitoring and health endpoints from security checks
  app.use(['/api/auth', '/api/user', '/api/data'], security.securityMiddleware);

  // Register health routes
  app.use('/api', healthRoutes);

  // Register auth routes
  app.use('/api/auth', authRoutes);

  // Register database monitoring routes
  app.use('/api/db', dbMonitorRoutes);

  // Add test endpoint directly to ensure it's registered
  app.get('/api/test', (req, res) => {
    res.status(200).json({
      message: 'API test successful',
      timestamp: new Date().toISOString(),
      userInfo: (req as any).user || null
    });
  });

  // Add Flask server proxy for all non-API frontend routes
  // This should be placed before the catch-all route
  const flaskProxy = createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    // Additional proxy options for Replit environment
    ws: true, // Support WebSocket
    pathRewrite: { '^/': '/' }, // No path rewriting
    // Add longer timeout for Replit environment
    timeout: 20000,
    proxyTimeout: 20000,
    // TypeScript error workarounds - simply use @ ts-ignore for now
    // @ts-ignore
    onProxyReq: (proxyReq: any, req: any) => {
      console.log(`Proxying request: ${req.method} ${req.url} to Flask server`);
    },
    // Improved error handling for Replit environment
    // @ts-ignore
    onError: (err: Error, req: any, res: any) => {
      console.error('Flask proxy error:', err);
      // Send a friendlier error response when proxy fails
      res.status(503).send(`
        <html>
          <head>
            <title>Service Temporarily Unavailable</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              h1 { color: #d32f2f; }
              .error-details { color: #666; margin-top: 20px; text-align: left; padding: 10px; background: #f5f5f5; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>Service Temporarily Unavailable</h1>
            <p>The frontend service is currently unavailable. Our team has been notified and is working on a fix.</p>
            <p>Please try refreshing the page or try again in a few moments.</p>
            <div class="error-details">
              <p><strong>Error details:</strong> ${err.message}</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Frontend routes to proxy to Flask server
  const frontendRoutes = [
    '/',
    '/about',
    '/new-music',
    '/archived-music',
    '/tour',
    '/engage',
    '/newsletter',
    '/blog',
    '/collaboration',
    '/contact',
    '/static'
  ];

  // Register API routes first so they don't get proxied to Flask
  // Add fallback API root route
  app.get('/api', (req, res) => {
    // Include more detailed server info for diagnostics
    res.json({
      message: 'API server is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime().toFixed(0) + ' seconds',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version
    });
  });

  // Register the Flask proxy for frontend routes AFTER API routes
  frontendRoutes.forEach(route => {
    app.use(route, flaskProxy);
  });

  // Serve static files directly from Express server for better performance
  app.use('/static', express.static('static'));
  // Also serve CSS file from the root (styles.css) directly
  app.use(express.static('.'));

  // Add catch-all route for unmatched paths
  app.use('*', (req, res) => {
    res.status(404).json({
      status: 'error',
      code: 'not_found',
      message: 'The requested route was not found'
    });
  });

  // Error handling middleware - registered last
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

  // Terminate Flask server process if running
  if (flaskProcess) {
    console.log('Terminating Flask server process...');
    try {
      flaskProcess.kill();
      console.log('Flask server process terminated');
    } catch (error) {
      console.error('Error terminating Flask server process:', error);
    }
    flaskProcess = null;
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
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default app;