import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "./vite";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { pgPool, initializeDatabase } from "./db";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { initDatabaseOptimization } from "./db-optimize";
import { initBackgroundServices, shutdownBackgroundServices } from "./db-background";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Force HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add MIME type for JavaScript modules
app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.mjs') || req.path.includes('.js?')) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  }
  if (req.path.endsWith('.css') || req.path.includes('.css?')) {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  createParentPath: true,
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: false // Disable debug messages
}));


// Add logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Add error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error('Error:', err);
  res.status(status).json({ message });
});

// Use port 5000, defaulting to 5000 if PORT env var is invalid
const port = parseInt(process.env.PORT || "5000", 10) || 5000;

// Add session cleanup interval
let cleanupInterval: NodeJS.Timeout;

async function startServer() {
  console.log('Starting server initialization...');

  try {
    // Initialize database connection
    await initializeDatabase();

    // Initialize database optimization and background services
    await initDatabaseOptimization().catch(err => {
      console.warn('Database optimization initialization failed, continuing without it:', err);
    });

    await initBackgroundServices().catch(err => {
      console.warn('Background database services initialization failed, continuing without them:', err);
    });

    // Setup authentication first
    setupAuth(app);

    // Register API routes
    const httpServer = await registerRoutes(app);

    // Initialize WebSocket and Socket.IO servers
    try {
      const { wss, io } = await import('./websocket').then(({ setupWebSockets }) => setupWebSockets(httpServer));
      console.log('WebSocket and Socket.IO servers initialized successfully');

      // Add WebSocket server cleanup to shutdown process
      const shutdown = async () => {
        console.log('Shutting down server...');
        try {
          // Clear session cleanup interval
          if (cleanupInterval) {
            clearInterval(cleanupInterval as any);
          }

          // Close WebSocket connections
          wss.clients.forEach(client => {
            try {
              client.close();
            } catch (err) {
              console.error('Error closing WebSocket client:', err);
            }
          });
          wss.close();

          // Close Socket.IO connections
          io.close(() => {
            console.log('Socket.IO server closed');
          });

          await new Promise<void>((resolve) => {
            httpServer.close(() => {
              console.log('HTTP server closed');
              resolve();
            });
          });

          // Shutdown background services
          try {
            await shutdownBackgroundServices();
            console.log('Background database services stopped');
          } catch (err) {
            console.error('Error shutting down background services:', err);
          }

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
      console.error('Failed to initialize WebSocket server:', error);
      // Continue server startup even if WebSocket fails
    }

    // Error handling and crash recovery
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Perform cleanup if needed but keep server running
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Log but don't exit process
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite in development mode...');
      await setupVite(app, httpServer);
    } else {
      app.use(express.static(path.resolve(__dirname, "../templates")));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(__dirname, "../templates/home_page.html"));
      });
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
      httpServer.listen(port, '0.0.0.0', () => {
        console.log(`Server successfully listening on port ${port}`);
        log(`Server listening on port ${port}`);
        resolve(true);
      }).on('error', (err: Error) => {
        console.error('Server startup error:', err);
        reject(err);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();