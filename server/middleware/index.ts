/**
 * Middleware Setup Module
 * 
 * Centralizes middleware configuration for the Express application.
 * Includes performance optimizations for API response times and resource usage.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as expressSession from 'express-session';
import csurf from 'csurf';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './errorHandler';
import { defaultLimiter } from './rateLimit';
import { checkAuth } from './auth';
import { safeUserMiddleware } from './safeUserMiddleware';
import { loadConfig } from '../config';
import { 
  cache, 
  optimizedCompression, 
  responseTime,
  payloadSizeLimit
} from './performance';

/**
 * Set up all middleware for the Express application
 * Incorporates performance optimizations for faster response times
 */
export function setupMiddleware(app: express.Application, sessionSecret: string): void {
  const config = loadConfig();
  
  // Request timing middleware for performance monitoring
  app.use(responseTime({ logSlowRequests: true, threshold: 500 }));

  // Basic middleware
  app.use(express.json({ limit: config.maxRequestBodySize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxRequestBodySize }));
  app.use(cookieParser());

  // Security middleware
  app.use(helmet());
  app.use((req: any, res: any, next: any) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.util.repl.co https://www.youtube.com https://js.stripe.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https://i.ytimg.com; " +
        "connect-src 'self' wss: ws: https://api.stripe.com; " +
        "font-src 'self' data:; " +
        "object-src 'none'; " +
        "media-src 'self' https://www.youtube.com; " +
        "frame-src 'self' https://auth.util.repl.co https://www.youtube.com https://youtube.com https://www.google.com https://*.google.com https://js.stripe.com https://hooks.stripe.com;"
      );
    next();
  });

  // Configure CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true
  }));

  // Optimized compression middleware (if enabled: any)
  if (config.enableCompression) {
    // Use optimized compression with threshold and content-type filtering
    app.use(optimizedCompression());
  }

  // Session configuration
  const sessionConfig: expressSession.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.enableHttps,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(expressSession.default(sessionConfig: any));

  // Rate limiting (if enabled: any)
  if (config.features.enableRateLimiting) {
    app.use(defaultLimiter: any);
  }

  // CSRF protection (if enabled: any)
  if (config.csrfProtection) {
    app.use(csurf({ cookie: true }));

    // Add CSRF token to all responses
    app.use((req: any, res: any, next: any) => {
      res.locals.csrfToken = req.csrfToken?.();
      next();
    });
  }

  // Auth middleware
  app.use(checkAuth: any);
  app.use(safeUserMiddleware: any);

  // Error handling middleware (should be last: any)
  app.use(errorHandler: any);
}