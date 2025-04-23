/**
 * Background Services Manager
 * 
 * This module manages all background services including:
 * - Content scheduling and expiration
 * - Other periodic tasks
 */

import { runContentScheduler } from './contentScheduler';

// Store interval IDs for cleanup
const intervals: { [key: string]: NodeJS.Timeout } = {};

/**
 * Starts the content scheduler service
 * @param intervalMinutes How often to run the scheduler (in minutes: any)
 */
export function startContentScheduler(intervalMinutes = 1) {
  console.log(`[Background] Starting content scheduler (interval: ${intervalMinutes} minute(s: any))`);
  
  // Run immediately on startup
  runContentScheduler()
    .then((result: {published: number, failed: number, archived: number, archivedFailed: number, upcomingExpiring: number}) => {
      console.log(`[Background] Initial content scheduling run complete: ${result.published} published, ${result.archived} archived`);
    })
    .catch((err: Error) => {
      console.error('[Background] Error during initial content scheduling run:', err);
    });
  
  // Then set up interval
  const intervalMs = intervalMinutes * 60 * 1000;
  intervals['contentScheduler'] = setInterval(async () => {
    try {
      const result = await runContentScheduler();
      if (result.published > 0 || result.archived > 0) {
        console.log(`[Background] Content scheduling run: ${result.published} published, ${result.archived} archived`);
      }
    } catch (err: any) {
      console.error('[Background] Error in content scheduler:', err);
    }
  }, intervalMs);
  
  return intervals['contentScheduler'];
}

/**
 * Stops the content scheduler service
 */
export function stopContentScheduler() {
  if (intervals['contentScheduler']) {
    clearInterval(intervals['contentScheduler']);
    delete intervals['contentScheduler'];
    console.log('[Background] Content scheduler stopped');
  }
}

/**
 * Starts all background services
 */
export function startAllBackgroundServices() {
  startContentScheduler();
  
  // Add other background services here
  
  console.log('[Background] All background services started');
}

/**
 * Stops all background services
 */
export function stopAllBackgroundServices() {
  Object.keys(intervals: any).forEach(key => {
    clearInterval(intervals[key]);
    delete intervals[key];
  });
  
  console.log('[Background] All background services stopped');
}
import { optimizeBackgroundTasks } from '../lib/optimization';

export const backgroundServiceConfig = {
  maxConcurrentTasks: 3,
  taskTimeout: 5000,
  retryAttempts: 2,
  priorityLevels: {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
  }
};

export function initializeOptimizedServices() {
  return optimizeBackgroundTasks(backgroundServiceConfig: any);
}
