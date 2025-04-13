import { and, eq, gte, lte, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import { contentItems } from '../../shared/schema';

/**
 * Tracks scheduling performance metrics
 * @param scheduledContent Content items that were scheduled to be published
 * @param publishedContent Content items that were successfully published
 */
export async function trackSchedulingPerformance(scheduledContent: any[], publishedContent: any[]) {
  try {
    // Calculate performance metrics
    const successRate = scheduledContent.length > 0 
      ? (publishedContent.length / scheduledContent.length) * 100 
      : 0;
    
    console.log(`[Analytics] Content publishing performance: ${publishedContent.length}/${scheduledContent.length} (${successRate.toFixed(2)}%)`);
    
    // Here you could store these metrics in a database table for historical tracking
    
    return {
      total: scheduledContent.length,
      published: publishedContent.length,
      successRate,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[Analytics] Error tracking scheduling performance:', error);
    return null;
  }
}

/**
 * Generates a report on content scheduling performance for a given date range
 */
export async function generateSchedulingReport(startDate: Date, endDate: Date) {
  try {
    // Get all content items that were scheduled in the date range
    const scheduledItems = await db.query.contentItems.findMany({
      where: and(
        gte(contentItems.scheduledPublishAt, startDate),
        lte(contentItems.scheduledPublishAt, endDate),
        eq(contentItems.status, 'published')
      )
    });

    // Get all content items that were published in the date range (automatically or manually)
    const publishedItems = await db.query.contentItems.findMany({
      where: and(
        gte(contentItems.publishedAt, startDate),
        lte(contentItems.publishedAt, endDate),
        eq(contentItems.status, 'published')
      )
    });

    // Get all content items that expired in the date range
    const expiredItems = await db.query.contentItems.findMany({
      where: and(
        gte(contentItems.archivedAt, startDate),
        lte(contentItems.archivedAt, endDate),
        eq(contentItems.status, 'archived'),
        eq(contentItems.archiveReason, 'expired')
      )
    });

    // Calculate average time from scheduling to publishing
    let totalTimeMs = 0;
    let itemsWithCompletedWorkflow = 0;

    for (const item of scheduledItems) {
      if (item.publishedAt && item.createdAt) {
        const timeToPublish = item.publishedAt.getTime() - item.createdAt.getTime();
        totalTimeMs += timeToPublish;
        itemsWithCompletedWorkflow++;
      }
    }

    const avgPublishTimeMs = itemsWithCompletedWorkflow > 0 
      ? totalTimeMs / itemsWithCompletedWorkflow 
      : 0;

    const avgPublishTimeHours = avgPublishTimeMs / (1000 * 60 * 60);

    // Calculate success rate
    const publishRate = scheduledItems.length > 0 
      ? (publishedItems.length / scheduledItems.length) * 100 
      : 0;

    // Get daily metrics for publishing volume
    const dailyMetrics = await db.execute(sql`
      SELECT DATE(published_at) as date, COUNT(*) as count
      FROM content_items
      WHERE published_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE(published_at)
      ORDER BY date ASC
    `);

    // Build the report
    return {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalScheduled: scheduledItems.length,
        totalPublished: publishedItems.length,
        totalExpired: expiredItems.length,
        publishRate,
        avgPublishTimeMs,
        avgPublishTimeHours
      },
      detailedMetrics: dailyMetrics,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating scheduling report:', error);
    throw new Error('Failed to generate scheduling analytics report');
  }
}

/**
 * Gets upcoming scheduled content for the next X days
 */
export async function getUpcomingScheduledContent(days = 7) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const upcomingContent = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'approved'),
        gte(contentItems.scheduledPublishAt, now),
        lt(contentItems.scheduledPublishAt, futureDate)
      ),
      orderBy: (contentItems, { asc }) => [asc(contentItems.scheduledPublishAt)],
      with: {
        creator: true,
        reviewer: true
      }
    });
    
    return upcomingContent;
  } catch (error) {
    console.error('Error fetching upcoming scheduled content:', error);
    throw new Error('Failed to fetch upcoming scheduled content');
  }
}

/**
 * Gets soon-to-expire content for the next X days
 */
export async function getSoonToExpireContent(days = 7) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const expiringContent = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'published'),
        gte(contentItems.expirationDate, now),
        lt(contentItems.expirationDate, futureDate)
      ),
      orderBy: (contentItems, { asc }) => [asc(contentItems.expirationDate)],
      with: {
        creator: true
      }
    });
    
    return expiringContent;
  } catch (error) {
    console.error('Error fetching soon-to-expire content:', error);
    throw new Error('Failed to fetch soon-to-expire content');
  }
}