import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "./vite";
import { setupVite } from "./vite";
import httpServer from "./routes";
import { pgPool } from "./db";
import { setupAuth } from "./auth";
import { storageInstance as storage } from "./storage";
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add session cleanup interval
let cleanupInterval: NodeJS.Timer;

async function startServer() {
  console.log('Starting server initialization...');

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite in development mode...');
      const app = express();

      // Set up CSP headers for development
      app.use((req, res, next) => {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self';" +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
          "style-src 'self' 'unsafe-inline';" +
          "img-src 'self' data: blob: https:;" +
          "font-src 'self' data:;" +
          "connect-src 'self' ws: wss:;" + // Allow WebSocket connections
          "worker-src 'self' blob:;" // Allow Web Workers
        );
        next();
      });

      await setupVite(app, httpServer);
    }

    // Start periodic session cleanup (every 6 hours)
    cleanupInterval = setInterval(async () => {
      try {
        await storage.cleanupExpiredSessions();
        console.log('Session cleanup completed successfully');
      } catch (error) {
        console.error('Session cleanup failed:', error);
      }
    }, 6 * 60 * 60 * 1000);

    await new Promise((resolve, reject) => {
      httpServer.listen(5000, '0.0.0.0', () => {
        console.log(`Server successfully listening on port 5000`);
        log(`Server listening on port 5000`);
        resolve(true);
      }).on('error', (err: Error) => {
        console.error('Server startup error:', err);
        reject(err);
      });
    });

    // Add shutdown handler
    const shutdown = async () => {
      console.log('Shutting down server...');
      try {
        // Clear session cleanup interval
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
        }

        await new Promise<void>((resolve) => {
          httpServer.close(() => {
            console.log('HTTP server closed');
            resolve();
          });
        });

        console.log('Closing database pool...');
        await pgPool.end();
        console.log('Database pool closed');

        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();