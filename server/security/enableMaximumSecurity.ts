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
import { createQuantumResistantMiddleware, createPublicKeyEndpointMiddleware } from './advanced/quantum/QuantumResistantMiddleware';

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
  app.use(createMaximumSecurityScanMiddleware({
    realtimeValidation: enableDeepValidation,
    deepInspection: blockSuspiciousRequests,
    quantumResistantAlgorithms: true,
    mlAnomalyDetection: enableAnomalyDetection,
    blockchainLogging: true,
    performanceImpactWarnings: true
  }));
  
  // Apply quantum-resistant middleware for sensitive data protection
  app.use(createQuantumResistantMiddleware({
    encryptResponses: true,
    verifyRequestSignatures: true,
    protectedPaths: [
      '/api/user',
      '/api/auth',
      '/api/security',
      '/api/payment',
      '/api/admin'
    ],
    exemptPaths: excludePaths,
    bypassInDevelopment: process.env.NODE_ENV === 'development',
    sensitiveResponseFields: [
      'password',
      'token',
      'key',
      'secret',
      'ssn',
      'creditCard',
      'bankAccount'
    ]
  }));
  
  // Add endpoint to provide the server's quantum-resistant public key
  app.get('/api/security/quantum-key', createPublicKeyEndpointMiddleware());
  
  // Log maximum security enablement
  securityBlockchain.recordEvent({
    severity: SecurityEventSeverity.INFO,
    category: SecurityEventCategory.GENERAL,
    title: 'Maximum Security Mode Enabled',
    description: 'Maximum security mode has been enabled for the application',
    metadata: {
      options,
      timestamp: new Date().toISOString()
    }
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
      
      const { securityScanner, SecurityScanType } = await import('./maximumSecurityScan');
      
      const scanId = securityScanner.createScan({
        scanType: scanOptions.scanType ? scanOptions.scanType : SecurityScanType.FULL,
        deep: scanOptions.deep !== undefined ? scanOptions.deep : true,
        emitEvents: true,
        logFindings: true,
        customRules: scanOptions.customRules
      });
      
      return securityScanner.startScan(scanId);
    }
  };
}

/**
 * Default maximum security instance
 */
export const maximumSecurity = {
  enable: enableMaximumSecurity
};