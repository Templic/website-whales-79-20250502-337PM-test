/**
 * Enable Maximum Security Module
 * 
 * This module provides a function to enable all security mechanisms
 * in the application with maximum protection levels.
 */

import { Express } from 'express';
import { protectApiRoutes } from './apiRoutesProtector';
import { raspManager } from './advanced/rasp';
import { createMaximumSecurityScanMiddleware } from './maximumSecurityScan';
import { anomalyDetectionMiddleware } from './advanced/ml/AnomalyDetection';
import { securityFabric } from './advanced/SecurityFabric';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from './advanced/blockchain/SecurityEventTypes';

/**
 * Maximum security options
 */
export interface MaximumSecurityOptions {
  /**
   * Whether to block suspicious requests
   */
  blockSuspiciousRequests?: boolean;
  
  /**
   * Whether to enable anomaly detection
   */
  enableAnomalyDetection?: boolean;
  
  /**
   * Whether to enable RASP protection
   */
  enableRASP?: boolean;
  
  /**
   * Whether to enable API security
   */
  enableApiSecurity?: boolean;
  
  /**
   * Whether to enable deep validation
   */
  enableDeepValidation?: boolean;
  
  /**
   * Paths to exclude from protection
   */
  excludePaths?: string[];
}

/**
 * Enable maximum security for the application
 */
export function enableMaximumSecurity(app: Express, options: MaximumSecurityOptions = {}) {
  const {
    blockSuspiciousRequests = true,
    enableAnomalyDetection = true,
    enableRASP = true,
    enableApiSecurity = true,
    enableDeepValidation = true,
    excludePaths = [
      '/api/health',
      '/api/public',
      '/api/webhooks',
      '/api/external-callbacks',
      '/api/stripe-webhook'
    ]
  } = options;
  
  console.log('[SECURITY] Enabling maximum security mode');
  
  // Apply API routes protection
  protectApiRoutes(app, {
    enableRASP,
    enableApiSecurity,
    enableDefaultValidation: enableDeepValidation,
    enableSensitiveProcedures: true,
    excludePaths,
    additionalMiddlewares: enableAnomalyDetection ? [anomalyDetectionMiddleware] : []
  });
  
  // Apply maximum security scan middleware to all routes
  app.use(createMaximumSecurityScanMiddleware(raspManager));
  
  // Log maximum security enablement
  securityBlockchain.addSecurityEvent({
    severity: SecurityEventSeverity.INFO,
    category: SecurityEventCategory.SYSTEM,
    message: 'Maximum security mode enabled',
    metadata: {
      options,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date()
  }).catch(error => {
    console.error('[SECURITY] Error logging maximum security enablement:', error);
  });
  
  // Emit maximum security enablement event
  securityFabric.emit('security:maximum-security:enabled', {
    options,
    timestamp: new Date()
  });
  
  console.log('[SECURITY] Maximum security mode enabled');
  
  return {
    /**
     * Run a security scan
     */
    runSecurityScan: async (scanOptions: any = {}) => {
      console.log('[SECURITY] Running security scan');
      
      const { performSecurityScan } = await import('./maximumSecurityScan');
      
      return performSecurityScan({
        scanType: scanOptions.scanType || 'full',
        deep: scanOptions.deep !== undefined ? scanOptions.deep : true,
        emitEvents: true,
        logFindings: true,
        ...scanOptions
      }, raspManager);
    }
  };
}

/**
 * Default maximum security instance
 */
export const maximumSecurity = {
  enable: enableMaximumSecurity
};