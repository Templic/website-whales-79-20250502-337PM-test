import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "./vite";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { pgPool } from "./db";
import { setupAuth } from "./auth";
import { storage } from "./storage";

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
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Enhanced CSP with more restrictive policies
  res.setHeader('Content-Security-Policy', 
    "default-src 'self';" +
    "img-src 'self' data: https:;" +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
    "style-src 'self' 'unsafe-inline';" +
    "font-src 'self';" +
    "frame-src 'none';" +
    "object-src 'none';" +
    "base-uri 'self';" +
    "form-action 'self';" +
    "frame-ancestors 'none';"
  );
  
  // Additional security headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 
    'geolocation=(),' +
    'microphone=(),' +
    'camera=(),' +
    'payment=(),' +
    'usb=(),' +
    'battery=(),' +
    'midi=(),' +
    'notifications=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Remove unnecessary headers
  res.removeHeader('X-Powered-By');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup CSRF protection
const csrf = require('csurf');
const csrfProtection = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: true
  }
});

// Apply CSRF protection to all routes except those that don't need it
app.use((req, res, next) => {
  if (req.path.startsWith('/api/login') || req.path.startsWith('/api/register')) {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// Provide CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  createParentPath: true,
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  debug: process.env.NODE_ENV !== 'production'
}));


// Add enhanced security logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const referrer = req.headers['referer'] || 'Direct';
      const method = req.method;
      const path = req.path;
      const status = res.statusCode;
      
      // Log in a structured format for easier parsing
      log(JSON.stringify({
        timestamp: new Date().toISOString(),
        ip: clientIP,
        method: method,
        path: path,
        status: status,
        duration: duration,
        userAgent: userAgent,
        referrer: referrer,
        authenticated: req.isAuthenticated(),
        userId: req.user?.id || 'anonymous'
      }));

      // Additional logging for suspicious activities
      if (status >= 400) {
        console.warn(`Security alert: Failed request from IP ${clientIP} to ${method} ${path} (${status})`);
      }
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

// Use port 5000 as required by the workflow
const port = process.env.PORT || 5000;

// Add session cleanup interval
let cleanupInterval: NodeJS.Timer;

async function startServer() {
  console.log('Starting server initialization...');

  try {
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
            clearInterval(cleanupInterval);
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