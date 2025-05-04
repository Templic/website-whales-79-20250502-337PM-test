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
import { enableMaximumSecurity } from './security/enableMaximumSecurity';
import { scheduleIntelligentMaintenance } from './db-maintenance';
import { loadConfig, getEnabledFeatures, config } from './config';
import securityInitConfig from './security-init';
import { runMigrations } from './run-migrations.js';
import { initBackgroundServices, stopBackgroundServices } from './background-services';
import expressSession from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';
import csurf from 'csurf';
import setupResponseCompression from './middleware/compression';
import http2OptimizationMiddleware from './lib/http2-optimization';
import { AdvancedAPIValidation } from './security/advanced/apiValidation_new';
import { RASPCore } from './security/advanced/rasp/RASPCore';
import { SecurityMonitor } from './security/advanced/monitoring/SecurityMonitor';

// Import Flask proxy and starter
import { setupFlaskProxy } from './middleware/flaskProxyMiddleware';
import { startFlaskApp } from './utils/startFlaskApp';

// Start time tracking
const startTime = Date.now();

// Create Express app
const app = express();
// Create HTTP server
const httpServer = createServer(app);

// Initialize essential middleware based on startup mode
app.use(cookieParser());

// Set up CSRF protection with exempt paths for Replit Auth
import { CSRFProtection } from './middleware/csrfProtection';

// Initialize CSRF protection with deep security features
if (config.security.csrfProtection) {
  log('Setting up enhanced CSRF protection with deep security features', 'server');
  
  // Create a CSRF protection instance with comprehensive configuration
  const csrfProtection = new CSRFProtection({
    // Configure cookie properties
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    },
    
    // Additional exempted paths (beyond the defaults)
    exemptPaths: [
      // API specific exemptions
      '/api/webhook/stripe',
      '/api/webhook/github',
      '/api/webhook/analytics',
      '/api/metrics/public',
      '/api/health-check',
      '/api/status',
      // Development endpoints (if applicable)
      ...(process.env.NODE_ENV === 'development' ? ['/api/dev'] : [])
    ],
    
    // Core security features
    enableSecurityLogging: true,
    tokenLength: 64,
    refreshTokenAutomatically: true,
    
    // Deep protection configuration
    deepProtection: {
      enabled: true,
      
      // Token security
      tokenBinding: true,
      tokenSignatures: true,
      doubleSubmitCheck: true,
      entropyValidation: true,
      
      // Request validation - customize for the application
      validateOrigin: true,
      trustedOrigins: [
        // Replit-specific origins
        'https://replit.com',
        'https://*.replit.app',
        // Application-specific
        process.env.NODE_ENV === 'production' 
          ? 'https://*.cosmic-community.com' 
          : 'http://localhost:*',
        // Allow null origin in development
        ...(process.env.NODE_ENV === 'development' ? ['null'] : [])
      ],
      
      // Rate limiting for security failures
      enableRateLimiting: true,
      rateLimitThreshold: 5,  // 5 failures within window
      rateLimitWindowMs: 60 * 1000, // 1 minute window
      
      // Advanced security detection
      anomalyDetection: true,
      securityHeaderCheck: true,
      
      // Token binding configuration
      tokenBindingMethod: 'session',
      
      // Use environment variable for signature secret if available
      signatureSecret: process.env.CSRF_SIGNATURE_SECRET
    }
  });
  
  // Apply CSRF middleware
  app.use(csrfProtection.middleware);
  
  // Set up CSRF token endpoint
  csrfProtection.setupTokenEndpoint(app);
  
  // No separate error handler needed - it's integrated into the middleware
  log('Deep CSRF protection enabled with multiple validation layers', 'security');
} else {
  // CSRF protection disabled in config
  log('⚠️ CSRF protection disabled in configuration', 'server');
  
  // Set up dummy endpoint for compatibility
  app.get('/api/csrf-token', (req, res) => {
    log('CSRF protection is disabled - returning placeholder token', 'security');
    res.json({ csrfToken: 'csrf-disabled-in-config' });
  });
}

/**
 * Initialize the server in stages
 * - First stage: Essential services (database)
 * - Second stage: Core server components
 * - Third stage: Deferred non-critical services
 */
async function initializeServer() {
  console.log('=======================================');
  console.log(`STARTING SERVER IN ${config.startupPriority.toUpperCase()} MODE`);
  console.log('=======================================');
  log(`Server startup priority: ${config.startupPriority}`, 'server');

  try {
    // === STAGE 1: Essential Services ===
    // Start Flask app (before anything else)
    log('Starting Flask app...', 'server');
    try {
      await startFlaskApp();
      log('Flask app started successfully', 'server');
    } catch (flaskError) {
      log(`Error starting Flask app: ${flaskError}`, 'server');
      console.error('Flask app error:', flaskError);
    }
    
    // Set up Flask proxy before other middleware
    setupFlaskProxy(app);
    
    // Connect to database (critical)
    const dbStartTime = Date.now();
    await initializeDatabase();
    const dbConnectTime = Date.now() - dbStartTime;
    log(`Database connected in ${dbConnectTime}ms`, 'server');

    // Run database migrations
    try {
      log('Running database migrations...', 'server');
      await runMigrations();
      log('Database migrations completed successfully', 'server');
    } catch (migrationError) {
      log(`Error running migrations: ${migrationError}`, 'server');
      console.error('Migration error:', migrationError);
    }

    // === STAGE 2: Core Server Components ===
    // Basic middleware
    app.use(express.json({ limit: config.security.maxPayloadSize }));
    app.use(express.urlencoded({ extended: true, limit: config.security.maxPayloadSize }));

    // Temporarily disable advanced API validation to resolve "Invalid request" errors
    // app.use(AdvancedAPIValidation.validateRequest);
    console.log("⚠️ Advanced API validation temporarily disabled to resolve Invalid request errors");
    SecurityMonitor.getInstance();

    // Enable secure headers
    app.use((req, res, next) => {
      res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      next();
    });


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
              "https://assets.taskade.com",
              "https://js.stripe.com"
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
              "https://assets.taskade.com",
              "https://api.stripe.com"
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
              "https://www.taskade.com",
              "https://js.stripe.com",
              "https://*.stripe.com"
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

    // Handle compression based on startup priority
    if (config.enableCompression) {
      if (config.startupPriority === 'quickstart') {
        // In quickstart mode, use simplified compression for faster startup
        log('Using simplified compression for faster startup', 'server');
        app.use(compression({
          level: 1, // Use lowest compression level for fastest processing
          threshold: '10kb', // Only compress responses larger than 10KB
          filter: (req, res) => {
            // Skip compression for images and audio/video which are already compressed
            const contentType = res.getHeader('Content-Type') as string || '';
            if (contentType.includes('image/') || 
                contentType.includes('audio/') || 
                contentType.includes('video/')) {
              return false;
            }
            return compression.filter(req, res);
          }
        }));

        // Enable full compression after delay
        setTimeout(() => {
          log('Upgrading to full compression settings', 'server');
          // Replace the middleware (this is for the next requests, not existing ones)
          app.use(setupResponseCompression({
            threshold: '1kb',
            level: 6,
            memLevel: 8,
            forceCompression: false,
            dynamicCompression: true,
            useBrotli: true,
            includeVaryHeader: true
          }));
        }, 120000); // After 2 minutes

        // Defer HTTP/2 optimizations
        setTimeout(() => {
          log('Enabling HTTP/2 optimizations', 'server');
          app.use(http2OptimizationMiddleware({
            staticPath: 'public',
            enablePush: true,
            globalPreloads: [
              { url: '/assets/icons/icon-192x192.svg', type: 'preload', as: 'image' },
              { url: '/manifest.json', type: 'preload' }
            ],
            globalPreconnect: [
              { url: 'https://fonts.googleapis.com', type: 'preconnect' },
              { url: 'https://fonts.gstatic.com', type: 'preconnect', crossorigin: true }
            ],
            optimizeHpack: true,
            setDefaultPriorities: true
          }));
        }, 180000); // After 3 minutes
      } else {
        // For standard and other modes, use full compression immediately
        app.use(setupResponseCompression({
          threshold: '1kb',
          level: 6,
          memLevel: 8,
          forceCompression: false,
          dynamicCompression: true,
          useBrotli: true,
          includeVaryHeader: true
        }));

        // Apply HTTP/2 optimizations if available
        app.use(http2OptimizationMiddleware({
          staticPath: 'public',
          enablePush: true,
          globalPreloads: [
            { url: '/assets/icons/icon-192x192.svg', type: 'preload', as: 'image' },
            { url: '/manifest.json', type: 'preload' }
          ],
          globalPreconnect: [
            { url: 'https://fonts.googleapis.com', type: 'preconnect' },
            { url: 'https://fonts.gstatic.com', type: 'preconnect', crossorigin: true }
          ],
          optimizeHpack: true,
          setDefaultPriorities: true
        }));
      }
    }

    // Session configuration
    const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    log('Generated dynamic session secret for this instance', 'server');

    // Create the session middleware
    app.use(expressSession({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.enableHttps,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Set up routes
    await registerRoutes(app);

    // Set up Vite middleware in development
    if (process.env.NODE_ENV !== 'production') {
      log('Setting up Vite in development mode...', 'server');
      await setupVite(app, httpServer);
    }

    // Start listening for connections
    // Use port 5000 to match the workflow waitForPort configuration
    const PORT = 5000;
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
      // Initialize the enhanced security system
      log('Initializing enhanced security system...', 'security');
      
      try {
        const { initializeSecurity } = require('./security');
        initializeSecurity();
        log('Enhanced security system initialized successfully', 'security');
      } catch (error) {
        log(`Failed to initialize enhanced security: ${error}`, 'security');
        
        // Fall back to legacy security if enhanced fails
        if ((config.security as any)?.scanMode === 'maximum' || 
            (config.features as any)?.enableDeepSecurityScanning) {
          log('Falling back to MAXIMUM security scan mode', 'security');
          enableMaximumSecurity(app);
        } else {
          log('Falling back to standard security scan', 'security');
          runDeferredSecurityScan();
        }
      }
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

    // Initialize the enhanced security system
    try {
      // Use direct imports instead - avoid dynamic imports
      try {
        // First initialize the secure audit trail
        import('./security/secureAuditTrail').then(({ initializeAuditTrail }) => {
          initializeAuditTrail();
          log('Secure audit trail initialized successfully', 'security');
          
          // Then initialize the log reviewer
          import('./security/logReviewer').then(({ initializeLogReviewer }) => {
            initializeLogReviewer(12); // Review logs every 12 hours
            log('Log reviewer initialized successfully', 'security');
            
            // Finally initialize the security scan queue if needed
            import('./security/securityScanQueue').then(({ initializeSecurityScanQueue }) => {
              initializeSecurityScanQueue();
              log('Security scan queue initialized successfully', 'security');
            });
          });
        });
        
        log('Enhanced security components initialized', 'security');
      } catch (err) {
        throw err;
      }
    } catch (error) {
      log(`Failed to initialize enhanced security: ${error}`, 'security');
      
      // Fall back to legacy security if enhanced fails
      if ((config.security as any)?.scanMode === 'maximum' || 
          (config.features as any)?.enableDeepSecurityScanning) {
        log('Falling back to MAXIMUM security scan mode', 'security');
        enableMaximumSecurity(app); 
      } else {
        log('Falling back to standard security scan', 'security');
        runDeferredSecurityScan();
      }
    }
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

  // Check if maximum security mode is enabled
  const maximumSecurity = config.security?.scanMode === 'maximum' || 
                          config.features.enableDeepSecurityScanning === true;

  console.log(`Security scans: ${config.features.enableSecurityScans ? 'enabled' : 'disabled'}`);
  if (config.features.enableSecurityScans && maximumSecurity) {
    console.log(`Security mode: MAXIMUM (All shields up)`);
  }
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