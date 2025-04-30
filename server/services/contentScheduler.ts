import { db } from '../db';
import { pgTable, serial, text, timestamp, integer, json, boolean } from 'drizzle-orm/pg-core';
import { eq, and, lte, gte, ne, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';
import { sendNotification } from './notificationService';
import { format, addDays, addMonths, setHours, setMinutes, setSeconds, isAfter, isBefore, getDay, parse } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

// Define content items table locally since it's not in shared/schema.ts
export const contentItems = pgTable('content_items', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull().default('text'),
  page: text('page'),
  status: text('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  metadata: json('metadata'),
  createdBy: integer('created_by'),
  publishedAt: timestamp('published_at'),
  archivedAt: timestamp('archived_at'),
  archiveReason: text('archive_reason'),
  scheduledPublishAt: timestamp('scheduled_publish_at'),
  expirationDate: timestamp('expiration_date'),
  timezone: text('timezone').default('UTC'),
  recurringSchedule: json('recurring_schedule'),
  lastScheduleRun: timestamp('last_schedule_run'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Fallback strategies for failed scheduling operations
 */
export type FallbackStrategy = 'retry' | 'notify' | 'abort';

/**
 * Types of recurring schedules
 */
export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Days of the week for weekly schedules
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Interface for recurring schedule configuration
 */
export interface RecurringSchedule {
  type: RecurringType;
  enabled: boolean;
  // For daily scheduling
  time?: string; // Format: "HH:MM" (24-hour format)
  // For weekly scheduling
  daysOfWeek?: DayOfWeek[];
  // For monthly scheduling
  dayOfMonth?: number; // 1-31, or -1 for last day of month
  // For custom scheduling (cron-like)
  pattern?: string;
  // End date for the recurring schedule (optional)
  endDate?: string | null;
  // Number of occurrences (optional alternative to endDate)
  maxOccurrences?: number;
  // Metadata and tracking
  startedAt: string;
  nextRun?: string | null;
  occurrences: number;
}

/**
 * Metrics to track content scheduling performance
 */
export interface ContentSchedulingMetrics {
  totalScheduled: number;
  successfullyPublished: number;
  failedPublications: number;
  retryAttempts: number;
  retrySuccesses: number;
  upcomingExpiring: number;
  successRate: number;
  lastRunAt: Date;
}

// Initialize metrics
let schedulingMetrics: ContentSchedulingMetrics = {
  totalScheduled: 0,
  successfullyPublished: 0,
  failedPublications: 0,
  retryAttempts: 0,
  retrySuccesses: 0,
  upcomingExpiring: 0,
  successRate: 0,
  lastRunAt: new Date()
};

/**
 * Run the content scheduler to publish scheduled content and archive expired content
 * This function should be called periodically (e.g., every 5 minutes) by a background job
 */
export async function runContentScheduler() {
  logger.info('Running content scheduler');
  const now = new Date();
  let published = 0;
  let failed = 0;
  let archived = 0;
  let archivedFailed = 0;
  let recurringProcessed = 0;
  
  try {
    // Process recurring schedules first
    recurringProcessed = await processRecurringSchedules(now);
    
    // Find content that should be published now
    const scheduledContent = await db.select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, 'approved'),
          sql`${contentItems.scheduledPublishAt} IS NOT NULL`,
          sql`${contentItems.scheduledPublishAt} <= ${now}`
        )
      );
    
    logger.info(`Found ${scheduledContent.length} items to publish`);
    
    // Process each scheduled content item
    for (const item of scheduledContent) {
      // Get the fallback strategy from metadata (default to 'retry')
      const fallbackStrategy = 
        item.metadata && 
        (item.metadata as any).schedulingMetadata && 
        (item.metadata as any).schedulingMetadata.fallbackStrategy ? 
        (item.metadata as any).schedulingMetadata.fallbackStrategy as FallbackStrategy : 
        'retry';
      
      let publishSuccess = false;
      let maxRetries = fallbackStrategy === 'retry' ? 3 : 1;
      let retryCount = 0;
      
      // Retry loop (will run only once for notify or abort strategies)
      while (!publishSuccess && retryCount < maxRetries) {
        try {
          // Update status to published
          await db.update(contentItems)
            .set({
              status: 'published',
              updatedAt: now,
              // We need to add a custom field for published date
              publishedAt: now
            })
            .where(eq(contentItems.id, item.id));
          
          // Send notification
          await sendNotification({
            type: 'content_published',
            userId: item.createdBy,
            contentId: item.id,
            contentTitle: item.title,
            message: `Your content "${item.title}" has been published automatically.`
          });
          
          // If reaching here, publication was successful
          publishSuccess = true;
          published++;
          
          // Update retry metrics if this was a retry attempt
          if (retryCount > 0) {
            schedulingMetrics.retrySuccesses++;
            logger.info(`Successfully published content ID ${item.id} after ${retryCount} retry attempts.`);
          } else {
            logger.info(`Published content ID ${item.id}: ${item.title}`);
          }
        } catch (error) {
          retryCount++;
          schedulingMetrics.retryAttempts++;
          
          // Log the error
          logger.error(`Failed to publish content ID ${item.id}, attempt ${retryCount}:`, error);
          
          if (retryCount < maxRetries && fallbackStrategy === 'retry') {
            // Wait for a short time before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            logger.info(`Retrying publication for content ID ${item.id}, attempt ${retryCount + 1}...`);
          } else {
            // All retries failed or not using retry strategy
            failed++;
            
            // Handle based on fallback strategy
            if (fallbackStrategy === 'notify' || fallbackStrategy === 'retry') {
              // Send notification to admin and content creator
              await sendNotification({
                type: 'system_message',
                userId: null, // System notification, will be sent to all admins
                contentId: item.id,
                contentTitle: item.title,
                message: `Failed to automatically publish content "${item.title}" after ${retryCount} attempt(s). Manual intervention required.`,
                actionRequired: true
              });
              
              // Also notify content creator
              if (item.createdBy) {
                await sendNotification({
                  type: 'system_message',
                  userId: item.createdBy,
                  contentId: item.id,
                  contentTitle: item.title,
                  message: `Your content "${item.title}" could not be published automatically. An administrator has been notified.`
                });
              }
              
              logger.warn(`Publication failed for content ID ${item.id}. Admin notification sent.`);
            } else if (fallbackStrategy === 'abort') {
              // For abort strategy, we don't send notifications, just log the failure
              logger.warn(`Publication aborted for content ID ${item.id} per fallback strategy setting.`);
            }
          }
        }
      }
    }
    
    // Find content that has expired
    const expiredContent = await db.select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, 'published'),
          sql`${contentItems.expirationDate} IS NOT NULL`,
          sql`${contentItems.expirationDate} <= ${now}`
        )
      );
    
    logger.info(`Found ${expiredContent.length} items to archive due to expiration`);
    
    // Process each expired content item
    for (const item of expiredContent) {
      try {
        // Update status to archived
        await db.update(contentItems)
          .set({
            status: 'archived',
            updatedAt: now,
            // We need to add a custom field for archived date
            archivedAt: now,
            archiveReason: 'Automatically archived due to expiration'
          })
          .where(eq(contentItems.id, item.id));
        
        // Send notification
        await sendNotification({
          type: 'content_expired',
          userId: item.createdBy,
          contentId: item.id,
          contentTitle: item.title,
          message: `Your content "${item.title}" has been archived because it reached its expiration date.`
        });
        
        archived++;
        logger.info(`Archived expired content ID ${item.id}: ${item.title}`);
      } catch (error) {
        archivedFailed++;
        logger.error(`Failed to archive expired content ID ${item.id}:`, error);
      }
    }
    
    // Find content that will expire soon (in the next 7 days) and send notifications
    const expiringContent = await db.select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, 'published'),
          sql`${contentItems.expirationDate} IS NOT NULL`,
          sql`${contentItems.expirationDate} > ${now}`,
          sql`${contentItems.expirationDate} <= ${new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)}`
        )
      );
    
    logger.info(`Found ${expiringContent.length} items expiring soon`);
    
    // Send expiration warning notifications
    for (const item of expiringContent) {
      try {
        // Calculate days until expiration
        const expirationDate = new Date(item.expirationDate!);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        // Only send notifications for 7, 3, and 1 days before expiration to avoid spam
        if (daysUntilExpiration === 7 || daysUntilExpiration === 3 || daysUntilExpiration === 1) {
          await sendNotification({
            type: 'expiration_warning',
            userId: item.createdBy,
            contentId: item.id,
            contentTitle: item.title,
            message: `Your content "${item.title}" will expire in ${daysUntilExpiration} day${daysUntilExpiration > 1 ? 's' : ''}.`,
            actionRequired: true,
            dueDate: item.expirationDate
          });
          
          logger.info(`Sent expiration warning for content ID ${item.id}: ${daysUntilExpiration} days remaining`);
        }
      } catch (error) {
        logger.error(`Failed to send expiration warning for content ID ${item.id}:`, error);
      }
    }
    
    // Get the current retry metrics
    const retryAttempts = schedulingMetrics.retryAttempts;
    const retrySuccesses = schedulingMetrics.retrySuccesses;
    
    // Update metrics with all results, including retries
    updateSchedulingMetrics({
      published,
      failed,
      archived,
      archivedFailed,
      upcomingExpiring: expiringContent.length,
      retryAttempts,
      retrySuccesses
    });
    
    logger.info(`Content scheduler completed: Published ${published}, Failed ${failed}, Archived ${archived}, Archived Failed ${archivedFailed}, Retry Attempts ${retryAttempts}, Retry Successes ${retrySuccesses}`);
    
    return {
      published,
      failed,
      archived,
      archivedFailed,
      upcomingExpiring: expiringContent.length,
      retryAttempts,
      retrySuccesses
    };
  } catch (error) {
    logger.error('Error running content scheduler:', error);
    throw error;
  }
}

/**
 * Update scheduling metrics with new data
 */
function updateSchedulingMetrics(result: { 
  published: number;
  failed: number;
  archived: number;
  archivedFailed: number;
  upcomingExpiring: number;
  retryAttempts?: number;
  retrySuccesses?: number;
}) {
  schedulingMetrics.totalScheduled += result.published + result.failed;
  schedulingMetrics.successfullyPublished += result.published;
  schedulingMetrics.failedPublications += result.failed;
  schedulingMetrics.upcomingExpiring = result.upcomingExpiring;
  
  // Optionally update retry metrics if provided
  if (result.retryAttempts !== undefined) {
    schedulingMetrics.retryAttempts += result.retryAttempts;
  }
  
  if (result.retrySuccesses !== undefined) {
    schedulingMetrics.retrySuccesses += result.retrySuccesses;
  }
  
  schedulingMetrics.lastRunAt = new Date();
  
  if (schedulingMetrics.totalScheduled > 0) {
    schedulingMetrics.successRate = Math.round(
      (schedulingMetrics.successfullyPublished / schedulingMetrics.totalScheduled) * 100
    );
  }
}

/**
 * Get current content scheduling metrics
 */
export function getSchedulingMetrics(): ContentSchedulingMetrics {
  return { ...schedulingMetrics };
}

/**
 * Reset content scheduling metrics
 */
export function resetSchedulingMetrics() {
  schedulingMetrics = {
    totalScheduled: 0,
    successfullyPublished: 0,
    failedPublications: 0,
    retryAttempts: 0,
    retrySuccesses: 0,
    upcomingExpiring: 0,
    successRate: 0,
    lastRunAt: new Date()
  };
  
  logger.info('Content scheduling metrics have been reset');
}

/**
 * Process recurring schedules
 * This function looks for content items with recurring schedules
 * and creates scheduled publications for them
 */
async function processRecurringSchedules(now: Date): Promise<number> {
  try {
    logger.info('Processing recurring schedules');
    
    // Find all content items with recurring schedules
    const itemsWithRecurringSchedules = await db.select()
      .from(contentItems)
      .where(
        and(
          sql`${contentItems.recurringSchedule} IS NOT NULL`,
          or(
            // Draft items that need to be scheduled
            eq(contentItems.status, 'draft'),
            // Published items that need to be republished
            eq(contentItems.status, 'published')
          )
        )
      );
    
    logger.info(`Found ${itemsWithRecurringSchedules.length} items with recurring schedules to process`);
    
    let processedCount = 0;
    
    for (const item of itemsWithRecurringSchedules) {
      try {
        if (!item.recurringSchedule) continue;
        
        // Parse recurring schedule
        const recurringSchedule = item.recurringSchedule as unknown as RecurringSchedule;
        
        // Skip if recurring schedule is disabled
        if (!recurringSchedule.enabled) {
          logger.debug(`Skipping disabled recurring schedule for content ID ${item.id}`);
          continue;
        }
        
        // Check if recurring schedule has ended
        if (recurringSchedule.endDate && new Date(recurringSchedule.endDate) < now) {
          logger.info(`Recurring schedule for content ID ${item.id} has ended (end date: ${recurringSchedule.endDate})`);
          
          // Disable the recurring schedule
          await db.update(contentItems)
            .set({
              recurringSchedule: JSON.stringify({
                ...recurringSchedule,
                enabled: false
              }),
              updatedAt: now
            })
            .where(eq(contentItems.id, item.id));
            
          continue;
        }
        
        // Check if max occurrences has been reached
        if (recurringSchedule.maxOccurrences && recurringSchedule.occurrences >= recurringSchedule.maxOccurrences) {
          logger.info(`Recurring schedule for content ID ${item.id} has reached max occurrences (${recurringSchedule.maxOccurrences})`);
          
          // Disable the recurring schedule
          await db.update(contentItems)
            .set({
              recurringSchedule: JSON.stringify({
                ...recurringSchedule,
                enabled: false
              }),
              updatedAt: now
            })
            .where(eq(contentItems.id, item.id));
            
          continue;
        }
        
        // Check if it's time to schedule the next publication
        const nextRun = recurringSchedule.nextRun ? new Date(recurringSchedule.nextRun) : null;
        
        if (!nextRun) {
          // First run, calculate next run time
          const nextRunDate = calculateNextRunTime(recurringSchedule, now, item.timezone || 'UTC');
          
          if (nextRunDate) {
            // Update the recurring schedule with the next run time
            await db.update(contentItems)
              .set({
                recurringSchedule: JSON.stringify({
                  ...recurringSchedule,
                  nextRun: nextRunDate.toISOString()
                }),
                updatedAt: now
              })
              .where(eq(contentItems.id, item.id));
              
            logger.info(`Set initial next run time for content ID ${item.id} to ${nextRunDate.toISOString()}`);
          }
        } else if (nextRun <= now) {
          // It's time to schedule the next publication
          
          // Clone the item for the next publication
          const clonedItemData = {
            key: `${item.key}-${Date.now()}`,
            title: item.title,
            content: item.content,
            type: item.type,
            page: item.page,
            status: 'approved', // Set to approved so it will be published automatically
            version: item.version + 1,
            metadata: item.metadata,
            createdBy: item.createdBy,
            scheduledPublishAt: nextRun,
            timezone: item.timezone
          };
          
          // Create a new content item for this occurrence
          const result = await db.insert(contentItems)
            .values(clonedItemData)
            .returning();
          
          if (result && result.length > 0) {
            // Calculate the next run time
            const nextRunDate = calculateNextRunTime(recurringSchedule, now, item.timezone || 'UTC');
            
            // Update the recurring schedule with the next run time and increment occurrences
            await db.update(contentItems)
              .set({
                recurringSchedule: JSON.stringify({
                  ...recurringSchedule,
                  nextRun: nextRunDate ? nextRunDate.toISOString() : null,
                  occurrences: recurringSchedule.occurrences + 1,
                  lastScheduleRun: now.toISOString()
                }),
                lastScheduleRun: now,
                updatedAt: now
              })
              .where(eq(contentItems.id, item.id));
              
            processedCount++;
            logger.info(`Scheduled next publication for recurring content ID ${item.id}, next run: ${nextRunDate ? nextRunDate.toISOString() : 'none'}`);
            
            // Send notification to content creator
            if (item.createdBy) {
              await sendNotification({
                type: 'content_scheduled',
                userId: item.createdBy,
                contentId: result[0].id,
                contentTitle: item.title,
                message: `Your recurring content "${item.title}" has been scheduled for publication.`
              });
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to process recurring schedule for content ID ${item.id}:`, error);
      }
    }
    
    logger.info(`Processed ${processedCount} recurring schedules`);
    
    return processedCount;
  } catch (error) {
    logger.error('Error processing recurring schedules:', error);
    return 0;
  }
}

/**
 * Calculate the next run time for a recurring schedule
 */
function calculateNextRunTime(schedule: RecurringSchedule, now: Date, timezone: string): Date | null {
  const { type } = schedule;
  
  try {
    // Use a date library that supports timezones to create a date in the specified timezone
    const nowInTimezone = convertToTimezone(now, timezone);
    
    let nextRun: Date | null = null;
    
    switch (type) {
      case 'daily': {
        // Parse time (format: "HH:MM")
        if (!schedule.time) return null;
        
        const [hours, minutes] = schedule.time.split(':').map(Number);
        
        // Create a new date for today at the specified time
        const todayRun = new Date(nowInTimezone);
        todayRun.setHours(hours, minutes, 0, 0);
        
        // If today's run time has already passed, schedule for tomorrow
        if (todayRun <= nowInTimezone) {
          const tomorrowRun = new Date(todayRun);
          tomorrowRun.setDate(tomorrowRun.getDate() + 1);
          nextRun = convertFromTimezone(tomorrowRun, timezone);
        } else {
          nextRun = convertFromTimezone(todayRun, timezone);
        }
        break;
      }
      
      case 'weekly': {
        // Need days of week and time
        if (!schedule.daysOfWeek || !schedule.daysOfWeek.length || !schedule.time) return null;
        
        const [hours, minutes] = schedule.time.split(':').map(Number);
        
        // Get the day of week indices (0 = Sunday, 1 = Monday, etc.)
        const dayIndices = schedule.daysOfWeek.map(day => getDayOfWeekIndex(day));
        
        // Current day of week (0-6, where 0 is Sunday)
        const currentDayOfWeek = nowInTimezone.getDay();
        
        // Create a date object for the current time with the specified hours and minutes
        const baseTime = new Date(nowInTimezone);
        baseTime.setHours(hours, minutes, 0, 0);
        
        // Check if today is one of the scheduled days and the time hasn't passed
        if (dayIndices.includes(currentDayOfWeek) && baseTime > nowInTimezone) {
          // Schedule for today
          nextRun = convertFromTimezone(baseTime, timezone);
        } else {
          // Find the next scheduled day
          let daysToAdd = 1;
          let nextDayOfWeek = (currentDayOfWeek + daysToAdd) % 7;
          
          while (!dayIndices.includes(nextDayOfWeek) && daysToAdd < 7) {
            daysToAdd++;
            nextDayOfWeek = (currentDayOfWeek + daysToAdd) % 7;
          }
          
          // Create a date for the next scheduled day
          const nextRunDate = new Date(nowInTimezone);
          nextRunDate.setDate(nextRunDate.getDate() + daysToAdd);
          nextRunDate.setHours(hours, minutes, 0, 0);
          
          nextRun = convertFromTimezone(nextRunDate, timezone);
        }
        break;
      }
      
      case 'monthly': {
        // Need day of month and time
        if (!schedule.dayOfMonth || !schedule.time) return null;
        
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const dayOfMonth = schedule.dayOfMonth;
        
        // Create a date for this month's scheduled day
        const thisMonthRun = new Date(nowInTimezone);
        
        // Handle special case for end of month
        if (dayOfMonth === -1) {
          // Last day of the month
          thisMonthRun.setMonth(thisMonthRun.getMonth() + 1);
          thisMonthRun.setDate(0); // Set to last day of previous month
        } else {
          thisMonthRun.setDate(dayOfMonth);
        }
        
        thisMonthRun.setHours(hours, minutes, 0, 0);
        
        // If this month's run has already passed, schedule for next month
        if (thisMonthRun <= nowInTimezone) {
          const nextMonthRun = new Date(thisMonthRun);
          nextMonthRun.setMonth(nextMonthRun.getMonth() + 1);
          nextRun = convertFromTimezone(nextMonthRun, timezone);
        } else {
          nextRun = convertFromTimezone(thisMonthRun, timezone);
        }
        break;
      }
      
      case 'custom': {
        // Custom scheduling using cron-like pattern
        // For simplicity in this implementation, we'll use a simple approximation
        // In a full implementation, you would use a cron parser library
        
        if (!schedule.pattern) return null;
        
        logger.warn(`Custom schedule pattern "${schedule.pattern}" not fully implemented yet`);
        
        // Simple fallback: schedule for tomorrow at midnight
        const tomorrowMidnight = new Date(nowInTimezone);
        tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
        tomorrowMidnight.setHours(0, 0, 0, 0);
        
        nextRun = convertFromTimezone(tomorrowMidnight, timezone);
        break;
      }
    }
    
    return nextRun;
  } catch (error) {
    logger.error(`Error calculating next run time for ${schedule.type} schedule:`, error);
    return null;
  }
}

/**
 * Convert a day of week string to its index (0-6, where 0 is Sunday)
 */
function getDayOfWeekIndex(day: DayOfWeek): number {
  const dayMap: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  
  return dayMap[day.toLowerCase() as DayOfWeek];
}

/**
 * Convert a UTC date to a specific timezone
 * Uses date-fns-tz toZonedTime function to handle timezone conversions properly
 */
function convertToTimezone(date: Date, timezone: string): Date {
  try {
    // Convert the UTC date to the specified timezone
    return toZonedTime(date, timezone);
  } catch (error) {
    logger.error(`Error converting date to timezone ${timezone}:`, error);
    // Fall back to UTC if there's an error
    return new Date(date.toISOString());
  }
}

/**
 * Convert a date from a specific timezone to UTC
 * Uses date-fns-tz fromZonedTime function to handle timezone conversions properly
 */
function convertFromTimezone(date: Date, timezone: string): Date {
  try {
    // Convert the zoned date to UTC
    return fromZonedTime(date, timezone);
  } catch (error) {
    logger.error(`Error converting date from timezone ${timezone}:`, error);
    // Fall back to UTC if there's an error
    return new Date(date.getTime());
  }
}