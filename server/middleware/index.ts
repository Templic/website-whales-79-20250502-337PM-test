/**
 * Middleware Setup Module
 * 
 * Centralizes middleware configuration for the Express application.
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

/**
 * Set up all middleware for the Express application
 */
export function setupMiddleware(app: express.Application, sessionSecret: string): void {
  const config = loadConfig();

  // Basic middleware
  app.use(express.json({ limit: config.maxRequestBodySize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxRequestBodySize }));
  app.use(cookieParser());

  // Security middleware
  app.use(helmet());
  app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.util.repl.co https://www.youtube.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https://i.ytimg.com; " +
        "connect-src 'self' wss: ws:; " +
        "font-src 'self' data:; " +
        "object-src 'none'; " +
        "media-src 'self' https://www.youtube.com; " +
        "frame-src 'self' https://auth.util.repl.co https://www.youtube.com https://youtube.com https://www.google.com https://*.google.com;"
      );
    next();
  });

  // Configure CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true
  }));

  // Compression middleware (if enabled)
  if (config.enableCompression) {
    app.use(compression());
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

  app.use(expressSession.default(sessionConfig));

  // Rate limiting (if enabled)
  if (config.features.enableRateLimiting) {
    app.use(defaultLimiter);
  }

  // CSRF protection (if enabled)
  if (config.csrfProtection) {
    app.use(csurf({ cookie: true }));

    // Add CSRF token to all responses
    app.use((req, res, next) => {
      res.locals.csrfToken = req.csrfToken?.();
      next();
    });
  }

  // Auth middleware
  app.use(checkAuth);
  app.use(safeUserMiddleware);

  // Error handling middleware (should be last)
  app.use(errorHandler);
}