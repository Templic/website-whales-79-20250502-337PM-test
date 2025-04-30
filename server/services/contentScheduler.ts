import { db } from '../db';
import { pgTable, serial, text, timestamp, integer, json, boolean } from 'drizzle-orm/pg-core';
import { eq, and, lte, gte, ne } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';
import { sendNotification } from './notificationService';

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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Fallback strategies for failed scheduling operations
 */
export type FallbackStrategy = 'retry' | 'notify' | 'abort';

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
  
  try {
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
        
        published++;
        logger.info(`Published content ID ${item.id}: ${item.title}`);
      } catch (error) {
        failed++;
        logger.error(`Failed to publish content ID ${item.id}:`, error);
        
        // Send failure notification to admin
        await sendNotification({
          type: 'system_message',
          userId: null, // System notification, will be sent to all admins
          contentId: item.id,
          contentTitle: item.title,
          message: `Failed to automatically publish content "${item.title}". Manual intervention required.`,
          actionRequired: true
        });
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
    
    // Update metrics
    updateSchedulingMetrics({
      published,
      failed,
      archived,
      archivedFailed,
      upcomingExpiring: expiringContent.length
    });
    
    logger.info(`Content scheduler completed: Published ${published}, Failed ${failed}, Archived ${archived}, Archived Failed ${archivedFailed}`);
    
    return {
      published,
      failed,
      archived,
      archivedFailed,
      upcomingExpiring: expiringContent.length
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
}) {
  schedulingMetrics.totalScheduled += result.published + result.failed;
  schedulingMetrics.successfullyPublished += result.published;
  schedulingMetrics.failedPublications += result.failed;
  schedulingMetrics.upcomingExpiring = result.upcomingExpiring;
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
    upcomingExpiring: 0,
    successRate: 0,
    lastRunAt: new Date()
  };
  
  logger.info('Content scheduling metrics have been reset');
}