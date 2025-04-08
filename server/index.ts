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
import { initializeSecurityScans } from "./securityScan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import authRoutes from './routes/authRoutes'; // Added import for auth routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Cookie parser middleware
app.use(cookieParser());

// Apply helmet middleware for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-src": ["'self'", "https://maps.google.com"],
        "script-src": ["'self'", "https://maps.google.com", "https://maps.googleapis.com"],
        "img-src": ["'self'", "https://maps.google.com", "https://maps.googleapis.com", "https://maps.gstatic.com", "data:"]
      }
    }
  })
);

// Set Content-Security-Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.util.repl.co; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self' wss: ws:; " +
    "font-src 'self' data:; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'self' https://auth.util.repl.co;"
  );
  next();
});

// Force HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Set up CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cosmic-community.replit.app'] 
    : ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));

// Import enhanced rate limiting middleware
import { 
  defaultLimiter, 
  authLimiter, 
  adminLimiter, 
  publicLimiter 
} from './middleware/rateLimit';

// Apply rate limiting to different routes based on their purposes
app.use('/api/auth', authLimiter);         // Stricter limits for authentication endpoints
app.use('/api/admin', adminLimiter);       // Admin operations get their own rate limit
app.use('/api/public', publicLimiter);     // Public API endpoints get more generous limits
app.use('/api', defaultLimiter);           // Default rate limiting for all other API routes

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

// Setup CSRF protection with more permissive settings
// In development mode, we're even more permissive to simplify testing
const csrfProtection = csurf({ 
  cookie: {
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't require CSRF for these methods
  value: (req) => {
    // For development, accept CSRF token from various locations
    if (process.env.NODE_ENV !== 'production') {
      const token = 
        req.body?._csrf || 
        req.query?._csrf || 
        req.headers['csrf-token'] || 
        req.headers['x-csrf-token'] ||
        req.headers['x-xsrf-token'];
      if (token) return token;
    }
    // In production, use the standard behavior
    // Fall back to default extraction if available, otherwise allow token to be undefined
    // which will likely fail CSRF validation (secure in production)
    return (req.cookies && req.cookies['_csrf']) || 
           (req.body && req.body._csrf) || 
           (req.query && req.query._csrf) ||
           req.headers['csrf-token'] ||
           req.headers['x-csrf-token'] ||
           req.headers['x-xsrf-token'];
  }
});

// Provide CSRF token for client-side forms (must be defined before applying CSRF protection)
app.get('/api/csrf-token', csrfProtection, (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to all API routes except the token endpoint and user endpoint
app.use('/api', (req, res, next) => {
  // Be more permissive with CSRF protection in development mode
  if (process.env.NODE_ENV !== 'production') {
    // Skip CSRF protection for GET requests in development
    if (req.method === 'GET') {
      return next();
    }

    // Skip CSRF for development convenience endpoints
    if (req.path.startsWith('/test/') || req.path === '/health') {
      return next();
    }
  }

  // Skip CSRF protection for the token endpoint and authentication endpoints
  if (req.path === '/csrf-token' || req.path === '/user' || req.path === '/login' || req.path === '/register') {
    return next();
  }

  csrfProtection(req, res, next);
});

// CSRF error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Handle CSRF token errors
    return res.status(403).json({
      error: 'CSRF attack detected. Form submission rejected.'
    });
  }
  // Pass other errors to the next error handler
  next(err);
});


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

// Import global error handling middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Use port 5000, defaulting to 5000 if PORT env var is invalid
const port = parseInt(process.env.PORT || "5000", 10) || 5000;

// Add session cleanup interval
let cleanupInterval: NodeJS.Timeout;

async function startServer() {
  console.log('Starting server initialization...');

  try {
    // Essential initialization first: database connection only
    // This is necessary before anything else can work
    await initializeDatabase();
    
    // Start non-essential services in parallel but don't wait for them
    // This allows the server to start handling requests while these complete in the background
    Promise.all([
      initDatabaseOptimization().catch(err => {
        console.warn('Database optimization initialization failed, continuing:', err);
      }),
      initBackgroundServices().catch(err => {
        console.warn('Background services initialization failed, continuing:', err);
      })
    ]);
    
    // Start security scans asynchronously after server is up
    // This doesn't block the initialization process
    setTimeout(() => {
      initializeSecurityScans(24);
    }, 1000);

    // Setup authentication first (before any routes are registered)
    setupAuth(app);

    // Register API routes
    const httpServer = await registerRoutes(app);

    // Add 404 handler for API routes
    app.use(notFoundHandler);

    // Add global error handler (must be after all other middleware and routes)
    app.use(errorHandler);

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

        console.log('Server initialization complete');

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