/**
 * TypeScript Error Metrics Scheduler
 * 
 * This module schedules the daily collection of TypeScript error metrics
 * to track progress over time and provide insights into error trends.
 */

import { recordDailyMetrics } from '../utils/ts-error-metrics';
import { scheduleJob } from 'node-schedule';
import { logger } from '../logger';

// Default schedule is 3:00 AM
const DEFAULT_SCHEDULE = '0 3 * * *';

/**
 * Initialize the metrics scheduler
 */
export function initializeMetricsScheduler(schedule: string = DEFAULT_SCHEDULE): void {
  try {
    // Schedule the daily metrics collection
    const job = scheduleJob('typescript-error-metrics', schedule, async function() {
      logger.info('[TypeScript Metrics] Running scheduled TypeScript error metrics collection');
      
      try {
        await recordDailyMetrics();
        logger.info('[TypeScript Metrics] Daily metrics collection completed successfully');
      } catch (error) {
        logger.error('[TypeScript Metrics] Error during metrics collection:', error);
      }
    });
    
    logger.info(`[TypeScript Metrics] Scheduled TypeScript error metrics collection (schedule: ${schedule})`);
    
    // Return the scheduled job so it can be cancelled if needed
    return job;
  } catch (error) {
    logger.error('[TypeScript Metrics] Failed to initialize metrics scheduler:', error);
  }
}

// Check if we have recent metrics, and if not, run immediately
export async function checkAndRunInitialMetrics(): Promise<void> {
  try {
    logger.info('[TypeScript Metrics] Checking if initial metrics collection is needed');
    
    // Run the collection immediately
    await recordDailyMetrics();
    logger.info('[TypeScript Metrics] Initial metrics collection completed');
  } catch (error) {
    logger.error('[TypeScript Metrics] Error during initial metrics collection:', error);
  }
}