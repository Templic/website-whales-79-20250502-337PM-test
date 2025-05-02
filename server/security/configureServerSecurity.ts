/**
 * Configure Server Security
 * 
 * This module integrates the lazy-loaded security components with the main Express server.
 */

import { Express } from 'express';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import {
  initializeSecurity,
  securityMiddleware,
  SecurityMode,
  applySecuritySettings,
  maximumSecurity
} from './middleware/securityMiddleware';

/**
 * Configuration options for server security
 */
export interface SecurityConfiguration {
  mode: SecurityMode;
  defer: boolean;
  securePublicRoutes: boolean;
  secureApiRoutes: boolean;
  secureAdminRoutes: boolean;
  enableBlockchainLogging: boolean;
  enableQuantumResistance: boolean;
  rateLimitingOptions?: {
    windowMs: number;
    maxRequests: number;
  };
  bruteForceOptions?: {
    freeRetries: number;
    minWait: number;
  };
}

/**
 * Default security configuration
 */
const defaultConfig: SecurityConfiguration = {
  mode: SecurityMode.STANDARD,
  defer: true,
  securePublicRoutes: true,
  secureApiRoutes: true,
  secureAdminRoutes: true,
  enableBlockchainLogging: false,
  enableQuantumResistance: false,
  rateLimitingOptions: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  },
  bruteForceOptions: {
    freeRetries: 5,
    minWait: 60 * 1000 // 1 minute
  }
};

/**
 * Configure security for an Express server
 */
export async function configureServerSecurity(
  app: Express,
  userConfig: Partial<SecurityConfiguration> = {}
): Promise<void> {
  // Merge user configuration with defaults
  const config: SecurityConfiguration = {
    ...defaultConfig,
    ...userConfig,
    rateLimitingOptions: {
      ...defaultConfig.rateLimitingOptions,
      ...userConfig.rateLimitingOptions
    },
    bruteForceOptions: {
      ...defaultConfig.bruteForceOptions,
      ...userConfig.bruteForceOptions
    }
  };
  
  console.log(chalk.blue(`[Security] Configuring server security in ${config.mode} mode (defer: ${config.defer})`));
  
  // Try to load security configuration from file
  const configPath = path.join(process.cwd(), 'config', 'security.json');
  try {
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Map string mode to enum
      if (fileConfig.mode) {
        fileConfig.mode = SecurityMode[fileConfig.mode.toUpperCase() as keyof typeof SecurityMode] || config.mode;
      }
      
      // Merge file configuration with current configuration (file takes precedence over defaults but not over explicit user config)
      Object.keys(fileConfig).forEach(key => {
        // Only overwrite values that weren't explicitly provided in userConfig
        if (userConfig[key as keyof SecurityConfiguration] === undefined) {
          (config as any)[key] = fileConfig[key];
        }
      });
      
      console.log(chalk.green(`[Security] Loaded configuration from ${configPath}`));
    }
  } catch (error) {
    console.warn(chalk.yellow(`[Security] Failed to load configuration from ${configPath}:`), error);
  }
  
  // Initialize security system
  await initializeSecurity(config.mode, { defer: config.defer });
  
  // Apply global security middleware (basic protections for all routes)
  app.use(securityMiddleware());
  
  // Secure API routes
  if (config.secureApiRoutes) {
    app.use('/api', applySecuritySettings({
      csrfProtection: true,
      xssProtection: true,
      sqlInjectionProtection: true,
      rateLimiting: config.rateLimitingOptions,
      apiValidation: true,
      threatDetection: true
    }));
  }
  
  // Secure admin routes with maximum security
  if (config.secureAdminRoutes) {
    if (config.mode === SecurityMode.MAXIMUM) {
      // In maximum mode, use all protections
      app.use('/api/admin', maximumSecurity());
    } else {
      // In other modes, use enhanced but not all protections
      app.use('/api/admin', applySecuritySettings({
        csrfProtection: true,
        xssProtection: true,
        sqlInjectionProtection: true,
        rateLimiting: {
          ...config.rateLimitingOptions,
          maxRequests: Math.floor(config.rateLimitingOptions?.maxRequests || 100) / 2 // More restrictive for admin routes
        },
        apiValidation: true,
        threatDetection: true,
        blockchainLogging: config.enableBlockchainLogging,
        quantumResistance: config.enableQuantumResistance
      }));
    }
  }
  
  // Secure public routes with minimal protections
  if (config.securePublicRoutes) {
    app.use('/', applySecuritySettings({
      xssProtection: true,
      rateLimiting: {
        ...config.rateLimitingOptions,
        maxRequests: (config.rateLimitingOptions?.maxRequests || 100) * 2 // Less restrictive for public routes
      }
    }));
  }
  
  // Secure authentication routes
  app.use(['/api/auth', '/api/login', '/api/register'], applySecuritySettings({
    csrfProtection: true,
    xssProtection: true,
    bruteForceProtection: config.bruteForceOptions,
    threatDetection: true
  }));
  
  console.log(chalk.green('[Security] Server security configured successfully'));
}

/**
 * Get performance metrics for the security system
 */
export async function getSecurityMetrics(): Promise<any> {
  try {
    // Import securityManager 
    const { securityManager } = await import('./middleware/securityMiddleware');
    const { SecurityComponentName } = await import('./SecurityComponentRegistry');
    
    // Get security info
    const securityInfo = securityManager.getSecurityInfo();
    
    // Try to get metrics if the component is loaded
    let metrics = null;
    try {
      const metricsCollector = securityManager.getComponentSync(SecurityComponentName.MONITORING_METRICS);
      if (metricsCollector) {
        metrics = await metricsCollector.getMetrics();
      }
    } catch (error) {
      console.warn(chalk.yellow('[Security] Failed to get metrics:'), error);
    }
    
    return {
      ...securityInfo,
      metrics
    };
  } catch (error) {
    console.error(chalk.red('[Security] Error getting security metrics:'), error);
    throw error;
  }
}

/**
 * Export default function for convenience
 */
export default configureServerSecurity;