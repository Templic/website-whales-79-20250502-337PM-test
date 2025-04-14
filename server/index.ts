/**
 * Main Server Entry Point
 * 
 * Provides a configurable, staged initialization process
 * that prioritizes fast startup while still performing all necessary operations.
 */

import express from 'express';
import { createServer } from 'http';
import { log, setupVite } from './vite';
import { initializeDatabase } from './db';
import { registerRoutes } from './routes';
import { runDeferredSecurityScan } from './securityScan';
import { scheduleIntelligentMaintenance } from './db-maintenance';
import { loadConfig, getEnabledFeatures, config } from './config';
import { initBackgroundServices, stopBackgroundServices } from './background-services';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';

// Start time tracking
const startTime = Date.now();

// Create Express app
const app = express();
const httpServer = createServer(app);

/**
 * Initialize the server in stages
 * - First stage: Essential services (database)
 * - Second stage: Core server components
 * - Third stage: Deferred non-critical services
 */
async function initializeServer() {
  console.log('Starting server initialization...');
  log(`Server startup priority: ${config.startupPriority}`, 'server');
  
  try {
    // === STAGE 1: Essential Services ===
    // Connect to database (critical)
    const dbStartTime = Date.now();
    await initializeDatabase();
    const dbConnectTime = Date.now() - dbStartTime;
    log(`Database connected in ${dbConnectTime}ms`, 'server');
    
    // === STAGE 2: Core Server Components ===
    // Basic middleware
    app.use(express.json({ limit: config.security.maxPayloadSize }));
    app.use(express.urlencoded({ extended: true, limit: config.security.maxPayloadSize }));
    app.use(cookieParser());
    
    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'", 
              "'unsafe-inline'", 
              "'unsafe-eval'", 
              "https://*.googleapis.com", 
              "https://*.gstatic.com", 
              "https://*.google.com", 
              "https://*.youtube.com", 
              "https://*.ytimg.com", 
              "https://*.taskade.com",
              "https://assets.taskade.com"
            ],
            styleSrc: [
              "'self'", 
              "'unsafe-inline'", 
              "https://fonts.googleapis.com", 
              "https://*.gstatic.com",
              "https://*.taskade.com"
            ],
            imgSrc: [
              "'self'", 
              "data:", 
              "blob:", 
              "https://*.googleapis.com", 
              "https://*.gstatic.com", 
              "https://*.google.com", 
              "https://*.ytimg.com", 
              "https://onlyinhawaii.org", 
              "https://yt3.ggpht.com", 
              "https://*.taskade.com",
              "*"
            ],
            connectSrc: [
              "'self'", 
              "ws:", 
              "wss:", 
              "https://*.googleapis.com", 
              "https://*.google.com", 
              "https://*.youtube.com",
              "https://*.taskade.com", 
              "https://assets.taskade.com"
            ],
            fontSrc: [
              "'self'", 
              "data:", 
              "https://fonts.gstatic.com",
              "https://*.taskade.com"
            ],
            objectSrc: ["'none'"],
            mediaSrc: [
              "'self'", 
              "https://*.youtube.com", 
              "https://*"
            ],
            frameSrc: [
              "'self'", 
              "https://*.youtube.com", 
              "https://youtube.com", 
              "https://*.youtube-nocookie.com", 
              "https://www.google.com", 
              "https://maps.google.com", 
              "https://www.google.com/maps/", 
              "https://maps.googleapis.com",
              "https://*.taskade.com",
              "https://www.taskade.com"
            ],
            workerSrc: [
              "'self'",
              "blob:",
              "https://*.taskade.com"
            ]
          },
        },
      })
    );
    
    // Enable CORS
    app.use(cors({
      origin: '*',
      credentials: true
    }));
    
    // Enable compression if configured
    if (config.enableCompression) {
      app.use(compression());
    }
    
    // Session configuration
    const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    log('Generated dynamic session secret for this instance', 'server');
    
    app.use(session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.enableHttps,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    } as any));
    
    // Set up routes
    await registerRoutes(app);
    
    // Set up Vite middleware in development
    if (process.env.NODE_ENV !== 'production') {
      log('Setting up Vite in development mode...', 'server');
      await setupVite(app, httpServer);
    }
    
    // Start listening for connections
    const PORT = config.port;
    httpServer.listen(PORT, config.host, () => {
      log(`Server successfully listening on port ${PORT}`, 'server');
      console.log(`${new Date().toLocaleTimeString()} [express] Server listening on port ${PORT}`);
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
      
      // Stop background services first
      if (config.features.enableBackgroundTasks) {
        await stopBackgroundServices();
      }
      
      // Close HTTP server to stop accepting new connections
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