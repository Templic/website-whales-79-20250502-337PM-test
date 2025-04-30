/**
 * Migration to add recurring schedule fields to content_items table
 */
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { logger } from '../logger.js';

export async function runMigration() {
  try {
    logger.info('Starting migration: Adding recurring schedule fields to content_items table');
    
    // Check if the columns already exist
    const checkTimeZoneQuery = sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'content_items' AND column_name = 'timezone'
    `;
    
    const timeZoneExists = await db.execute(checkTimeZoneQuery);
    
    if (timeZoneExists.length === 0) {
      // Add timezone column
      await db.execute(sql`
        ALTER TABLE content_items 
        ADD COLUMN timezone TEXT DEFAULT 'UTC'
      `);
      logger.info('Added timezone column to content_items table');
    } else {
      logger.info('timezone column already exists in content_items table');
    }
    
    const checkRecurringScheduleQuery = sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'content_items' AND column_name = 'recurring_schedule'
    `;
    
    const recurringScheduleExists = await db.execute(checkRecurringScheduleQuery);
    
    if (recurringScheduleExists.length === 0) {
      // Add recurring_schedule column
      await db.execute(sql`
        ALTER TABLE content_items 
        ADD COLUMN recurring_schedule JSONB
      `);
      logger.info('Added recurring_schedule column to content_items table');
    } else {
      logger.info('recurring_schedule column already exists in content_items table');
    }
    
    const checkLastScheduleRunQuery = sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'content_items' AND column_name = 'last_schedule_run'
    `;
    
    const lastScheduleRunExists = await db.execute(checkLastScheduleRunQuery);
    
    if (lastScheduleRunExists.length === 0) {
      // Add last_schedule_run column
      await db.execute(sql`
        ALTER TABLE content_items 
        ADD COLUMN last_schedule_run TIMESTAMP
      `);
      logger.info('Added last_schedule_run column to content_items table');
    } else {
      logger.info('last_schedule_run column already exists in content_items table');
    }
    
    logger.info('Migration completed successfully: Added recurring schedule fields to content_items table');
  } catch (error) {
    logger.error('Error running migration:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
// ES modules don't have require.main, so we can use a different approach
// by checking if this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  runMigration()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}