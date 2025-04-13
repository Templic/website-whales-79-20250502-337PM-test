/**
 * Content Scheduler Service
 * 
 * This service handles the automatic publishing of scheduled content
 * and archiving of expired content based on their respective dates.
 */

import { db } from '../db';
import { eq, lte, gt, and, isNotNull } from 'drizzle-orm';
import { contentItems, workflowNotifications } from '../../shared/schema';
import { trackSchedulingPerformance } from './contentAnalytics';

/**
 * Processes content scheduled for publication and content that has expired
 * Should be called periodically (e.g., every minute) to ensure timely updates
 */
export async function processScheduledContent() {
  const now = new Date();
  
  try {
    // Process content scheduled for publishing
    const scheduledContent = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'approved'),
        isNotNull(contentItems.scheduledPublishAt),
        lte(contentItems.scheduledPublishAt, now)
      ),
      with: {
        creator: true
      }
    });
    
    if (scheduledContent.length > 0) {
      console.log(`[Scheduler] Publishing ${scheduledContent.length} scheduled content items`);
      
      // Create list of successfully published content
      const publishedContent = [];
      
      for (const content of scheduledContent) {
        try {
          // Update content status to published
          await db.update(contentItems)
            .set({ 
              status: 'published',
              updatedAt: now
            })
            .where(eq(contentItems.id, content.id));
            
          // Create notification for content creator
          if (content.creator?.id) {
            await db.insert(workflowNotifications)
              .values({
                title: 'Content Published',
                message: `Your scheduled content "${content.title}" has been automatically published.`,
                type: 'info',
                contentId: content.id,
                contentTitle: content.title,
                userId: content.creator.id,
                isRead: false
              });
          }
          
          // Add to successfully published list
          publishedContent.push(content);
          
          console.log(`[Scheduler] Published scheduled content: "${content.title}" (ID: ${content.id})`);
        } catch (error) {
          console.error(`[Scheduler] Error publishing content ID ${content.id}: ${error.message}`);
        }
      }
      
      // Track scheduling performance in analytics
      await trackSchedulingPerformance(scheduledContent, publishedContent);
    }
    
    // Process expired content
    const expiredContent = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'published'),
        isNotNull(contentItems.expirationDate),
        lte(contentItems.expirationDate, now)
      ),
      with: {
        creator: true
      }
    });
    
    if (expiredContent.length > 0) {
      console.log(`[Scheduler] Archiving ${expiredContent.length} expired content items`);
      
      for (const content of expiredContent) {
        // Update content status to archived
        await db.update(contentItems)
          .set({ 
            status: 'archived',
            updatedAt: now
          })
          .where(eq(contentItems.id, content.id));
          
        // Create notification for content creator
        if (content.creator?.id) {
          await db.insert(workflowNotifications)
            .values({
              title: 'Content Archived',
              message: `Your content "${content.title}" has been automatically archived as it reached its expiration date.`,
              type: 'info',
              contentId: content.id,
              contentTitle: content.title,
              userId: content.creator.id,
              isRead: false
            });
        }
        
        console.log(`[Scheduler] Archived expired content: "${content.title}" (ID: ${content.id})`);
      }
    }
    
    return {
      published: scheduledContent.length,
      archived: expiredContent.length
    };
  } catch (error) {
    console.error(`[Scheduler] Error processing scheduled content: ${error.message}`);
    throw error;
  }
}

/**
 * Gets upcoming scheduled content for the next X days
 */
export async function getUpcomingScheduledContent(days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return db.query.contentItems.findMany({
    where: and(
      eq(contentItems.status, 'approved'),
      isNotNull(contentItems.scheduledPublishAt),
      gt(contentItems.scheduledPublishAt, now),
      lte(contentItems.scheduledPublishAt, futureDate)
    ),
    orderBy: (contentItems, { asc }) => [asc(contentItems.scheduledPublishAt)],
    with: {
      creator: true,
      reviewer: true
    }
  });
}

/**
 * Gets soon-to-expire content for the next X days
 */
export async function getSoonToExpireContent(days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return db.query.contentItems.findMany({
    where: and(
      eq(contentItems.status, 'published'),
      isNotNull(contentItems.expirationDate),
      gt(contentItems.expirationDate, now),
      lte(contentItems.expirationDate, futureDate)
    ),
    orderBy: (contentItems, { asc }) => [asc(contentItems.expirationDate)],
    with: {
      creator: true
    }
  });
}