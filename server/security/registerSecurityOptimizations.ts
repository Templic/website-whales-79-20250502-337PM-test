/**
 * Register Security Optimizations
 * 
 * This module provides functions to register the various security
 * optimizations with the main application.
 */

import { Express } from 'express';
import chalk from 'chalk';

import { securityEventService } from './events/SecurityEventService';
import { createSecurityEventsMiddleware, flushSecurityEvents } from './middleware/securityEventsMiddleware';
import { SecurityMode } from './SecurityManager';
import lazySecurityLoader from './LazySecurityLoader';
import { EventPriority } from './events/BatchedEventProcessor';

/**
 * Options for registering security optimizations
 */
export interface SecurityOptimizationsOptions {
  /**
   * Whether to enable batched event processing
   */
  enableBatchedEvents: boolean;
  
  /**
   * Whether to enable lazy loading
   */
  enableLazyLoading: boolean;
  
  /**
   * Security mode
   */
  securityMode: SecurityMode;
  
  /**
   * Batch processing options
   */
  batchProcessingOptions?: {
    /**
     * Log all requests
     */
    logAllRequests?: boolean;
    
    /**
     * Log API requests
     */
    logApiRequests?: boolean;
    
    /**
     * Log admin requests
     */
    logAdminRequests?: boolean;
    
    /**
     * Paths to exclude from logging
     */
    excludePaths?: string[];
  };
  
  /**
   * Lazy loading options
   */
  lazyLoadingOptions?: {
    /**
     * Whether to defer loading of non-critical components
     */
    deferLoading?: boolean;
  };
}

/**
 * Default options
 */
const defaultOptions: SecurityOptimizationsOptions = {
  enableBatchedEvents: true,
  enableLazyLoading: true,
  securityMode: SecurityMode.STANDARD,
  batchProcessingOptions: {
    logAllRequests: false,
    logApiRequests: true,
    logAdminRequests: true,
    excludePaths: [
      '/health',
      '/favicon.ico',
      '/static',
      '/assets',
      '/_next',
      '/api/health'
    ]
  },
  lazyLoadingOptions: {
    deferLoading: true
  }
};

/**
 * Register security optimizations with the application
 * 
 * @param app Express application instance
 * @param options Security optimization options
 */
export async function registerSecurityOptimizations(
  app: Express,
  options: Partial<SecurityOptimizationsOptions> = {}
): Promise<void> {
  // Merge options with defaults
  const config = {
    ...defaultOptions,
    ...options,
    batchProcessingOptions: {
      ...defaultOptions.batchProcessingOptions,
      ...options.batchProcessingOptions,
      excludePaths: [
        ...(defaultOptions.batchProcessingOptions?.excludePaths || []),
        ...(options.batchProcessingOptions?.excludePaths || [])
      ]
    },
    lazyLoadingOptions: {
      ...defaultOptions.lazyLoadingOptions,
      ...options.lazyLoadingOptions
    }
  };
  
  console.log(chalk.blue('[SecurityOptimizations] Registering security optimizations:'), {
    batchedEvents: config.enableBatchedEvents,
    lazyLoading: config.enableLazyLoading,
    securityMode: config.securityMode
  });
  
  // Register batched event processing
  if (config.enableBatchedEvents) {
    await registerBatchedEventProcessing(app, config);
  }
  
  // Register lazy loading
  if (config.enableLazyLoading) {
    await registerLazyLoading(app, config);
  }
  
  console.log(chalk.green('[SecurityOptimizations] Security optimizations registered successfully'));
}

/**
 * Register batched event processing
 * 
 * @param app Express application instance
 * @param config Security optimization options
 */
async function registerBatchedEventProcessing(
  app: Express,
  config: SecurityOptimizationsOptions
): Promise<void> {
  console.log(chalk.blue('[SecurityOptimizations] Registering batched event processing...'));
  
  // Add security events middleware
  const middleware = createSecurityEventsMiddleware({
    logAllRequests: config.batchProcessingOptions?.logAllRequests,
    logApiRequests: config.batchProcessingOptions?.logApiRequests,
    logAdminRequests: config.batchProcessingOptions?.logAdminRequests,
    logErrors: true,
    requestPriority: EventPriority.INFO,
    apiRequestPriority: EventPriority.LOW,
    adminRequestPriority: EventPriority.MEDIUM,
    errorPriority: EventPriority.HIGH,
    excludePaths: config.batchProcessingOptions?.excludePaths,
    loggingOptions: {
      includeHeaders: false
    }
  });
  
  // Add middleware to Express
  app.use(middleware);
  
  // Register shutdown handler
  const originalClose = app.listen;
  
  // Override app.listen to add shutdown handler
  (app as any).listen = function(...args: any[]) {
    const server = originalClose.apply(this, args);
    
    server.on('close', async () => {
      console.log(chalk.blue('[SecurityOptimizations] Server closing, flushing security events...'));
      
      try {
        await flushSecurityEvents();
      } catch (error) {
        console.error(chalk.red('[SecurityOptimizations] Error flushing security events:'), error);
      }
    });
    
    return server;
  };
  
  console.log(chalk.green('[SecurityOptimizations] Batched event processing registered'));
}

/**
 * Register lazy loading
 * 
 * @param app Express application instance
 * @param config Security optimization options
 */
async function registerLazyLoading(
  app: Express,
  config: SecurityOptimizationsOptions
): Promise<void> {
  console.log(chalk.blue('[SecurityOptimizations] Registering lazy loading...'));
  
  // Initialize lazy loader
  lazySecurityLoader.initialize(
    config.lazyLoadingOptions?.deferLoading ? 'deferred' : 'immediate'
  );
  
  // Import and initialize SecurityManager
  const { securityManager } = await import('./SecurityManager');
  
  // Initialize security manager
  await securityManager.initialize(
    config.securityMode,
    {
      defer: config.lazyLoadingOptions?.deferLoading
    }
  );
  
  console.log(chalk.green('[SecurityOptimizations] Lazy loading registered'));
}

/**
 * Get optimization statistics
 */
export function getOptimizationStats(): {
  batchedEvents?: {
    totalReceived: number;
    totalProcessed: number;
    totalDeduplicated: number;
    currentQueueSize: number;
    averageProcessingTime: number;
  };
  lazyLoading?: {
    loadedComponents: number;
    totalComponents: number;
    averageLoadTime: number;
  };
} {
  const stats: any = {};
  
  // Get batched events stats
  try {
    const eventStats = securityEventService.getStats();
    stats.batchedEvents = {
      totalReceived: eventStats.totalReceived,
      totalProcessed: eventStats.totalProcessed,
      totalDeduplicated: eventStats.totalDeduplicated,
      currentQueueSize: eventStats.currentQueueSize,
      averageProcessingTime: eventStats.averageProcessingTime
    };
  } catch (error) {
    console.warn(chalk.yellow('[SecurityOptimizations] Error getting batched events stats:'), error);
  }
  
  // Get lazy loading stats
  try {
    const loaderStats = lazySecurityLoader.getComponents().reduce(
      (acc, component) => {
        acc.totalComponents++;
        if (component.status === 'loaded') {
          acc.loadedComponents++;
          if (component.loadTime) {
            acc.totalLoadTime += component.loadTime;
            acc.loadTimeCount++;
          }
        }
        return acc;
      },
      { 
        loadedComponents: 0, 
        totalComponents: 0, 
        totalLoadTime: 0, 
        loadTimeCount: 0 
      }
    );
    
    stats.lazyLoading = {
      loadedComponents: loaderStats.loadedComponents,
      totalComponents: loaderStats.totalComponents,
      averageLoadTime: loaderStats.loadTimeCount > 0 
        ? loaderStats.totalLoadTime / loaderStats.loadTimeCount 
        : 0
    };
  } catch (error) {
    console.warn(chalk.yellow('[SecurityOptimizations] Error getting lazy loading stats:'), error);
  }
  
  return stats;
}

// Export default function for convenience
export default registerSecurityOptimizations;