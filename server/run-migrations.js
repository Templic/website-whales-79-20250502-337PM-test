/**
 * Script to run database migrations in sequence
 */
import { logger } from './logger.js';
import { runMigration as addRecurringScheduleFields } from './migrations/add-recurring-schedule-fields.js';

export async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Run migrations in sequence
    // Each migration should be added here in the correct order
    await addRecurringScheduleFields();
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration sequence failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
// ES modules don't have require.main, so we can use a different approach
if (import.meta.url.endsWith(process.argv[1])) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration sequence failed:', error);
      process.exit(1);
    });
}