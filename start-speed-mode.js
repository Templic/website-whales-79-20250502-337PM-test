/**
 * Speed Mode Starter
 * 
 * This script directly starts the server with speed optimizations,
 * bypassing the configuration loading system.
 */

import express from 'express';
import { createServer } from 'http';
import { log, setupVite } from './server/vite.js';
import { initializeDatabase } from './server/db.js';
import { registerRoutes } from './server/routes.js';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import crypto from 'crypto';
import cors from 'cors';

// Print banner
console.log('=======================================');
console.log('⚡ STARTING SERVER IN QUICK MODE ⚡');
console.log('=======================================');

// Start time tracking
const startTime = Date.now();

// Create Express app
const app = express();
// Create HTTP server
const httpServer = createServer(app);

// Initialize essential middleware based on startup mode
app.use(cookieParser());

// CSRF protection completely disabled for speed
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: 'csrf-disabled-for-speed-mode' });
});

// Initialize the server
async function initializeServer() {
  try {
    // === STAGE 1: Essential Services ===
    // Connect to database (critical)
    const dbStartTime = Date.now();
    await initializeDatabase();
    const dbConnectTime = Date.now() - dbStartTime;
    log(`Database connected in ${dbConnectTime}ms`, 'server');

    // === STAGE 2: Core Server Components ===
    // Basic middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Enable minimal CORS
    app.use(cors({
      origin: '*',
      credentials: true
    }));

    // Minimal security headers
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    });

    // Session configuration - minimal for speed
    const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    app.use(expressSession({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Set up routes
    await registerRoutes(app);

    // Set up Vite middleware in development (always needed)
    log('Setting up Vite in development mode...', 'server');
    await setupVite(app, httpServer);

    // Start listening for connections
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, '0.0.0.0', () => {
      log(`⚡ Speed server successfully listening on port ${PORT}`, 'server');
      console.log(`${new Date().toLocaleTimeString()} [express] Server listening on port ${PORT}`);
    });

    // Calculate and log server initialization time
    const initTime = Date.now() - startTime;
    console.log(`⚡ Server initialization complete in ${initTime}ms`);

    // Log startup performance metrics
    console.log('=== Server Startup Performance ===');
    console.log(`Total startup time: ${initTime}ms`);
    console.log('Startup priority: SPEED MODE');
    console.log('Database optimization: disabled');
    console.log('Background services: disabled');
    console.log('Security scans: disabled');
    console.log('All non-critical features: disabled');
    console.log('=================================');

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\nReceived SIGINT signal, shutting down gracefully...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\nReceived SIGTERM signal, shutting down gracefully...`);
  process.exit(0);
});

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Start the server
initializeServer();