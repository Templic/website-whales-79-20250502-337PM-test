/**
 * Lazy Loading Security System - Usage Example
 * 
 * This module demonstrates how to use the lazy loading security system
 * in an Express application.
 * 
 * NOTE: This is an example file, not meant for production use.
 */

import express from 'express';
import chalk from 'chalk';

import {
  initializeSecurity,
  securityMiddleware,
  securityManager,
  SecurityMode,
  applySecuritySettings,
  maximumSecurity
} from '../middleware/securityMiddleware';
import { SecurityComponentName } from '../SecurityComponentRegistry';

/**
 * Example of setting up Express with lazy-loaded security
 */
export async function setupExampleApp() {
  const app = express();
  
  // Initialize security in deferred mode for faster startup
  await initializeSecurity(SecurityMode.STANDARD, { defer: true });
  
  // Add global security middleware (applies basic protections)
  app.use(securityMiddleware());
  
  // Standard API routes (apply standard security settings)
  app.use('/api', applySecuritySettings({
    csrfProtection: true,
    xssProtection: true,
    sqlInjectionProtection: true,
    rateLimiting: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100 // 100 requests per minute
    },
    apiValidation: true
  }));
  
  // Admin routes (apply maximum security)
  app.use('/api/admin', maximumSecurity());
  
  // Authentication routes (focus on brute force protection)
  app.use('/api/auth', applySecuritySettings({
    csrfProtection: true,
    xssProtection: true,
    bruteForceProtection: {
      freeRetries: 5,
      minWait: 60 * 1000 // 1 minute
    }
  }));
  
  // Public routes (minimal security)
  app.use('/api/public', applySecuritySettings({
    xssProtection: true
  }));
  
  // Example route to manually load and use a component
  app.get('/api/admin/security-stats', async (req, res) => {
    try {
      // This will automatically load the metrics component if not already loaded
      const metricsCollector = await securityManager.getComponent(SecurityComponentName.MONITORING_METRICS);
      
      // Get metrics data
      const metrics = await metricsCollector.getMetrics();
      
      res.json({
        success: true,
        metrics,
        securityInfo: securityManager.getSecurityInfo()
      });
    } catch (error) {
      console.error(chalk.red('[Example] Error fetching security metrics:'), error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security metrics'
      });
    }
  });
  
  return app;
}

/**
 * Example of manually using the security components
 */
export async function manualComponentUsageExample() {
  console.log(chalk.blue('[Example] Starting manual component usage example...'));
  
  try {
    // Initialize security if not already done
    if (!securityManager.isInitialized()) {
      await initializeSecurity(SecurityMode.STANDARD, { defer: true });
    }
    
    // Get a security component (this will load it if not already loaded)
    const threatDetector = await securityManager.getComponent(SecurityComponentName.DETECTION_THREAT_DETECTOR);
    
    // Use the component
    const mockRequest = {
      ip: '192.168.1.1',
      method: 'GET',
      path: '/api/test',
      headers: {
        'user-agent': 'ExampleClient/1.0'
      },
      body: {
        test: 'data'
      }
    } as any;
    
    const result = await threatDetector.detect(mockRequest);
    
    console.log(chalk.green('[Example] Threat detection result:'), result);
    
    // Get security status
    const securityInfo = securityManager.getSecurityInfo();
    console.log(chalk.green('[Example] Security status:'), securityInfo);
    
    return {
      success: true,
      result,
      securityInfo
    };
  } catch (error) {
    console.error(chalk.red('[Example] Error in manual component usage:'), error);
    
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Run the example if this module is executed directly
 */
if (require.main === module) {
  (async () => {
    try {
      console.log(chalk.blue('Running lazy loading security example...'));
      
      const app = await setupExampleApp();
      
      // Start the server
      const port = 3000;
      app.listen(port, () => {
        console.log(chalk.green(`Example server listening on port ${port}`));
      });
      
      // Run manual component usage example
      await manualComponentUsageExample();
    } catch (error) {
      console.error(chalk.red('Error running example:'), error);
    }
  })();
}