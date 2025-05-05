/**
 * Script to manually trigger TypeScript error metrics collection
 * 
 * This script can be run directly to collect and store TypeScript error metrics
 * without waiting for the scheduled job.
 */

import { recordDailyMetrics } from './utils/ts-error-metrics';
import { log } from './vite';
import { fileURLToPath } from 'url';

async function runMetricsCollection() {
  try {
    log('Starting manual TypeScript error metrics collection...', 'metrics');
    await recordDailyMetrics();
    log('TypeScript error metrics collection completed successfully', 'metrics');
    console.log('✅ Metrics collection complete');
  } catch (error) {
    log(`Error during metrics collection: ${error}`, 'metrics');
    console.error('❌ Error during metrics collection:', error);
  }
}

// Run the metrics collection when the script is executed directly
// Check if this file is being executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runMetricsCollection()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runMetricsCollection };