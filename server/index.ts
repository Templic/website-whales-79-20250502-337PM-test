/**
 * Main Server Entry Point
 * 
 * Simple minimal version to get the server running without advanced features
 */

import express from 'express';
import { createServer } from 'http';
import { log, setupVite } from './vite';
import { initializeDatabase } from './db';
import { registerRoutes } from './routes';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

// Start time tracking
const startTime = Date.now();

// Create Express app
const app = express();
const httpServer = createServer(app);

async function startServer() {
  console.log('Starting server initialization...');
  
  try {
    // Connect to database
    const dbStartTime = Date.now();
    await initializeDatabase();
    const dbConnectTime = Date.now() - dbStartTime;
    log(`Database connected in ${dbConnectTime}ms`, 'server');
    
    // Basic middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(cookieParser());
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
          },
        },
      })
    );
    app.use(cors({
      origin: '*',
      credentials: true
    }));
    
    // Session configuration
    const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    log('Generated dynamic session secret for this instance', 'server');
    
    app.use(session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
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
    const PORT = parseInt(process.env.PORT || '5000', 10);
    httpServer.listen(PORT, '0.0.0.0', () => {
      log(`Server successfully listening on port ${PORT}`, 'server');
      console.log(`${new Date().toLocaleTimeString()} [express] Server listening on port ${PORT}`);
    });
    
    // Calculate and log server initialization time
    const initTime = Date.now() - startTime;
    console.log(`Server initialization complete in ${initTime}ms`);
    console.log('=== Server Startup Performance ===');
    console.log(`Total startup time: ${initTime}ms`);
    console.log('=================================');
    
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
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

// Start server
startServer();

// Export for testing
export { app, httpServer };