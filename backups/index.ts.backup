/**
 * Main Server Entry Point
 * 
 * Provides a configurable, staged initialization process
 * that prioritizes fast startup while still performing all necessary operations.
 */

import express from 'express';
import { createServer } from 'http';
import { log } from './vite';
import { connectDB } from './db';
import { setupSocketIO, setupWebSockets } from './websocket';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { createViteServer } from './vite';
import { runDeferredSecurityScan } from './securityScan';
import { scheduleIntelligentMaintenance } from './db-maintenance';
import { loadConfig, getEnabledFeatures, config } from './config';
import { initBackgroundServices } from './background-services';
import crypto from 'crypto';

// Start time tracking
const startTime = Date.now();

let app: express.Application;
let httpServer: any;

/**
 * Initialize the server in stages
 * - First stage: Essential services (database)
 * - Second stage: Core server components
 * - Third stage: Deferred non-critical services
 */
async function initializeServer() {
  console.log('Starting server initialization...');
  log(`Server startup priority: ${config.startupPriority}`, 'server');
  
  // Create Express app and HTTP server
  app = express();
  httpServer = createServer(app);
  
  try {
    // === STAGE 1: Essential Services ===
    // Connect to database (critical)
    const dbStartTime = Date.now();
    await connectDB();
    const dbConnectTime = Date.now() - dbStartTime;
    log(`Database connected in ${dbConnectTime}ms`, 'server');
    
    // === STAGE 2: Core Server Components ===
    // Set up session with dynamic secret for security
    const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    log('Generated dynamic session secret for this instance', 'server');
    
    // Set up middleware and routes
    setupMiddleware(app, sessionSecret);
    setupRoutes(app);
    
    // Initialize WebSockets if enabled
    if (config.features.enableWebSockets) {
      setupSocketIO(httpServer);
      setupWebSockets(httpServer);
      log('WebSocket and Socket.IO servers initialized successfully', 'server');
    }
    
    // Set up Vite middleware in development
    if (process.env.NODE_ENV !== 'production') {
      log('Setting up Vite in development mode...', 'server');
      await createViteServer(app);
    }
    
    // Start listening for connections
    const PORT = config.port;
    httpServer.listen(PORT, '0.0.0.0', () => {
      log(`Server successfully listening on port ${PORT}`, 'server');
      console.log(`1:${new Date().toLocaleTimeString()} [express] Server listening on port ${PORT}`);
    });
    
    // Calculate and log server initialization time
    const initTime = Date.now() - startTime;
    console.log(`Server initialization complete in ${initTime}ms`);
    
    // Log startup performance metrics
    logStartupPerformance(initTime);
    
    // === STAGE 3: Deferred Non-Critical Services ===
    if (config.deferBackgroundServices) {
      log('Using deferred initialization for non-critical services', 'server');
      initializeNonCriticalServices();
    } else {
      log('Initializing all services immediately (non-deferred mode)', 'server');
      // Initialize all services immediately
      await initializeAllServices();
    }
    
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

/**
 * Initialize all non-critical services with deferred timing
 */
function initializeNonCriticalServices() {
  // Initialize database optimization (if enabled)
  if (config.features.enableDatabaseOptimization) {
    setTimeout(() => {
      log('Starting deferred database optimization...', 'server');
      scheduleIntelligentMaintenance();
    }, config.maintenanceDelay);
  }
  
  // Initialize background services (if enabled)
  if (config.features.enableBackgroundTasks) {
    setTimeout(() => {
      log('Starting deferred background services...', 'server');
      initBackgroundServices();
    }, config.backgroundServicesDelay);
  }
  
  // Initialize security scans (if enabled)
  if (config.features.enableSecurityScans) {
    setTimeout(() => {
      runDeferredSecurityScan();
    }, config.securityScanDelay);
  }
}

/**
 * Initialize all services immediately (non-deferred mode)
 */
async function initializeAllServices() {
  // Initialize database optimization
  if (config.features.enableDatabaseOptimization) {
    log('Initializing database optimization...', 'server');
    await scheduleIntelligentMaintenance();
  }
  
  // Initialize background services
  if (config.features.enableBackgroundTasks) {
    log('Initializing background services...', 'server');
    await initBackgroundServices();
  }
  
  // Initialize security scans
  if (config.features.enableSecurityScans) {
    log('Initializing security scans...', 'server');
    await runDeferredSecurityScan();
  }
}

/**
 * Log startup performance metrics
 */
function logStartupPerformance(initTime: number) {
  console.log('=== Server Startup Performance ===');
  console.log(`Total startup time: ${initTime}ms`);
  console.log(`Startup priority: ${config.startupPriority}`);
  console.log(`Database optimization: ${config.features.enableDatabaseOptimization ? 'enabled' : 'disabled'}`);
  console.log(`Background services: ${config.features.enableBackgroundTasks ? 'enabled' : 'disabled'}`);
  console.log(`Security scans: ${config.features.enableSecurityScans ? 'enabled' : 'disabled'}`);
  console.log(`Non-critical services deferred: ${config.deferBackgroundServices ? 'yes' : 'no'}`);
  console.log('=================================');
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  // Handle process termination signals
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\nReceived ${signal} signal, shutting down gracefully...`);
      
      // Close HTTP server first to stop accepting new connections
      if (httpServer) {
        httpServer.close(() => {
          console.log('HTTP server closed');
        });
      }
      
      // Give existing connections some time to complete
      console.log('Allowing existing requests to complete...');
      setTimeout(() => {
        console.log('Server shutdown complete');
        process.exit(0);
      }, 3000);
    });
  });
  
  // Handle unhandled rejections and exceptions
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

// Set up graceful shutdown handler
setupGracefulShutdown();

// Start server initialization
initializeServer();

// Export for testing
export { app, httpServer };