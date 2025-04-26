/**
 * Advanced Security System
 * 
 * This module integrates all the advanced security components into a unified
 * security system that provides comprehensive protection for the application.
 */

import express, { Request, Response, NextFunction } from 'express';
import { SecurityFabric, securityFabric } from './SecurityFabric';
import { AnomalyDetection } from './analytics/AnomalyDetection';
import { createZeroTrustMiddleware, createAdminAccessMiddleware, createSecurityOperationsMiddleware } from './middleware/ZeroTrustMiddleware';
import { sqlInjectionPrevention, createDatabaseProtectionMiddleware } from './database/SQLInjectionPrevention';
import { SecurityConfig } from './config/SecurityConfig';

/**
 * Initializes the advanced security system and all its components
 */
export async function initializeAdvancedSecurity(app: express.Application, config: SecurityConfig = {}): Promise<void> {
  console.log('[AdvancedSecurity] Initializing advanced security system...');
  
  try {
    // Initialize security fabric
    await securityFabric.initialize(config);
    
    // Initialize anomaly detection
    const anomalyDetection = new AnomalyDetection(config.anomalyDetection);
    await anomalyDetection.initialize();
    securityFabric.registerComponent('anomalyDetection', anomalyDetection);
    
    // Initialize database protection
    const databaseProtection = createDatabaseProtectionMiddleware();
    securityFabric.registerComponent('databaseProtection', databaseProtection);
    
    // Set up minimum security for all routes
    setupBaselineSecurity(app);
    
    // Set up advanced security for specific route groups
    setupAdvancedSecurity(app);
    
    console.log('[AdvancedSecurity] Advanced security system initialized successfully');
    
    // Update threat level periodically based on security metrics
    setupThreatLevelUpdates();
  } catch (error) {
    console.error('[AdvancedSecurity] Failed to initialize advanced security system:', error);
    throw error;
  }
}

/**
 * Sets up baseline security for all routes
 */
function setupBaselineSecurity(app: express.Application): void {
  // Add basic security middleware for all routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add security headers to all responses
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    
    // Continue to next middleware
    next();
  });
  
  // Create request ID for all requests
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as unknown).id = require('crypto').randomBytes(16).toString('hex');
    next();
  });
  
  console.log('[AdvancedSecurity] Baseline security setup complete');
}

/**
 * Sets up advanced security for specific route groups
 */
function setupAdvancedSecurity(app: express.Application): void {
  // Protect sensitive admin routes with advanced security
  app.use('/api/admin', createAdminAccessMiddleware());
  
  // Protect security operations with maximum security
  app.use('/api/security', createSecurityOperationsMiddleware());
  
  // Protect user management routes
  app.use('/api/users', createZeroTrustMiddleware({
    resourceSensitivity: 70,
    minTrustScore: 0.7,
    maxRiskScore: 0.2
  }));
  
  // Protect payment routes
  app.use('/api/payments', createZeroTrustMiddleware({
    resourceSensitivity: 85,
    minTrustScore: 0.8,
    maxRiskScore: 0.1
  }));
  
  console.log('[AdvancedSecurity] Advanced security setup complete');
}

/**
 * Sets up periodic updates of system threat level based on security metrics
 */
function setupThreatLevelUpdates(): void {
  // Update threat level every 5 minutes
  setInterval(() => {
    try {
      const metrics = securityFabric.getComponent('securityMetrics');
      if (metrics) {
        const latestMetrics = metrics.getLatestMetrics();
        if (latestMetrics) {
          // Update global threat level based on metrics
          securityFabric.adjustSecurityPosture(latestMetrics.threat.globalThreatLevel);
        }
      }
    } catch (error) {
      console.error('[AdvancedSecurity] Error updating threat level:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('[AdvancedSecurity] Threat level updates scheduled');
}

/**
 * Shuts down the advanced security system
 */
export async function shutdownAdvancedSecurity(): Promise<void> {
  console.log('[AdvancedSecurity] Shutting down advanced security system...');
  
  try {
    // Shutdown security fabric
    await securityFabric.shutdown();
    
    console.log('[AdvancedSecurity] Advanced security system shut down successfully');
  } catch (error) {
    console.error('[AdvancedSecurity] Error shutting down advanced security system:', error);
    throw error;
  }
}

/**
 * Gets the current status of the advanced security system
 */
export function getSecurityStatus(): Record<string, unknown> {
  return {
    securityPosture: securityFabric.getSecurityPosture(),
    threatLevel: securityFabric.getThreatLevel(),
    timestamp: new Date()
  };
}

/**
 * Creates an Express middleware that applies zero-trust security to a route
 */
export function secureRoute(options: unknown= {}) {
  return createZeroTrustMiddleware(options);
}

/**
 * Creates a middleware that applies zero-trust security to a specific resource
 */
export function secureResource(resourceType: string, resourceId: string, sensitivityLevel: number = 75) {
  return createZeroTrustMiddleware({
    resourceSensitivity: sensitivityLevel,
    contextSensitive: true,
    minTrustScore: 0.5 + (sensitivityLevel / 200), // 0.5 to 1.0 based on sensitivity
    maxRiskScore: 0.3 - (sensitivityLevel / 500)   // 0.3 to 0.1 based on sensitivity
  });
}

/**
 * Creates a middleware for securing an admin route
 */
export function secureAdminRoute() {
  return createAdminAccessMiddleware();
}

/**
 * Creates a middleware for securing a security operation route
 */
export function secureSecurityRoute() {
  return createSecurityOperationsMiddleware();
}

/**
 * Export security components
 */
export {
  securityFabric,
  createZeroTrustMiddleware,
  createAdminAccessMiddleware,
  createSecurityOperationsMiddleware,
  sqlInjectionPrevention,
  createDatabaseProtectionMiddleware
};