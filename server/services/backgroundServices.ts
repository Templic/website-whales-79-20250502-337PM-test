/**
 * Background Services Manager
 * 
 * This module manages all background services including:
 * - Content scheduling and expiration
 * - Other periodic tasks
 */

import { processScheduledContent } from './contentScheduler';

// Store interval IDs for cleanup
const intervals: { [key: string]: NodeJS.Timeout } = {};

/**
 * Starts the content scheduler service
 * @param intervalMinutes How often to run the scheduler (in minutes)
 */
export function startContentScheduler(intervalMinutes = 1) {
  console.log(`[Background] Starting content scheduler (interval: ${intervalMinutes} minute(s))`);
  
  // Run immediately on startup
  processScheduledContent()
    .then(result => {
      console.log(`[Background] Initial content scheduling run complete: ${result.published} published, ${result.archived} archived`);
    })
    .catch(err => {
      console.error('[Background] Error during initial content scheduling run:', err);
    });
  
  // Then set up interval
  const intervalMs = intervalMinutes * 60 * 1000;
  intervals['contentScheduler'] = setInterval(async () => {
    try {
      const result = await processScheduledContent();
      if (result.published > 0 || result.archived > 0) {
        console.log(`[Background] Content scheduling run: ${result.published} published, ${result.archived} archived`);
      }
    } catch (err) {
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
  Object.keys(intervals).forEach(key => {
    clearInterval(intervals[key]);
    delete intervals[key];
  });
  
  console.log('[Background] All background services stopped');
}