/**
 * Content Analytics Service
 * Tracks and analyzes performance of content workflow and scheduling
 */

import { db } from '../db';
import { contentItems, contentAnalytics } from '../../shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { log } from '../vite';

/**
 * Track scheduling performance metrics
 * @param scheduledContent Array of content items scheduled for publication
 * @param publishedContent Array of content items that were published
 * @returns Analytics data object
 */
export async function trackSchedulingPerformance(scheduledContent: any[], publishedContent: any[]) {
  const timestamp = new Date();
  const analytics = {
    totalScheduled: scheduledContent.length,
    totalPublished: publishedContent.length,
    publishedRatio: scheduledContent.length > 0 
      ? (publishedContent.length / scheduledContent.length) * 100 
      : 0,
    timestamp
  };

  try {
    // Store analytics in the database
    await db.insert(contentAnalytics).values({
      timestamp,
      metricsType: 'scheduling_performance',
      metricsData: analytics
    });

    log(`Scheduling performance metrics recorded: ${JSON.stringify(analytics)}`, 'analytics');
    return analytics;
  } catch (error) {
    log(`Error recording scheduling performance metrics: ${error}`, 'analytics');
    return analytics;
  }
}

/**
 * Track engagement for published content
 * @param contentId ID of the content item
 * @param engagementType Type of engagement (view, like, comment, share)
 * @returns Success status
 */
export async function trackContentEngagement(contentId: number, engagementType: 'view' | 'like' | 'comment' | 'share') {
  try {
    // Get existing content to verify it exists
    const content = await db.select().from(contentItems).where(eq(contentItems.id, contentId));
    
    if (!content || content.length === 0) {
      log(`Cannot track engagement: Content ${contentId} not found`, 'analytics');
      return false;
    }

    // Save engagement data as separate analytics record instead of updating the content item
    const engagementData = {
      [engagementType]: 1,
      contentId,
      timestamp: new Date()
    };

    // Record this engagement in analytics
    await db.insert(contentAnalytics).values({
      timestamp: new Date(),
      metricsType: 'content_engagement',
      metricsData: {
        contentId,
        engagementType,
        timestamp: new Date()
      }
    });

    return true;
  } catch (error) {
    log(`Error tracking content engagement: ${error}`, 'analytics');
    return false;
  }
}

/**
 * Generate scheduling analytics report for a date range
 * @param startDate Start date for the report
 * @param endDate End date for the report
 * @returns Analytics report data
 */
export async function generateSchedulingReport(startDate: Date, endDate: Date) {
  try {
    // Get all scheduling performance metrics in the date range
    const metrics = await db.select()
      .from(contentAnalytics)
      .where(
        and(
          eq(contentAnalytics.metricsType, 'scheduling_performance'),
          gte(contentAnalytics.timestamp, startDate),
          lte(contentAnalytics.timestamp, endDate)
        )
      );
    
    // Get all content workflow events in the date range
    const contentEvents = await db.select()
      .from(contentItems)
      .where(
        and(
          gte(contentItems.updatedAt, startDate),
          lte(contentItems.updatedAt, endDate)
        )
      );
    
    // Compute aggregate stats
    const totalScheduled = contentEvents.filter(item => item.scheduledPublishAt !== null).length;
    const totalPublished = contentEvents.filter(item => item.status === 'published').length;
    const totalExpired = contentEvents.filter(item => item.status === 'archived' && item.expirationDate !== null).length;
    
    // Calculate average time between status changes
    let totalPublishTime = 0;
    let publishTimeCount = 0;
    
    contentEvents.forEach(item => {
      if (item.status === 'published' && item.createdAt) {
        const createTime = new Date(item.createdAt).getTime();
        const publishTime = new Date(item.updatedAt || item.createdAt).getTime();
        totalPublishTime += (publishTime - createTime);
        publishTimeCount++;
      }
    });
    
    const avgPublishTime = publishTimeCount > 0 ? totalPublishTime / publishTimeCount : 0;
    
    // Generate the report
    const report = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalScheduled,
        totalPublished,
        totalExpired,
        publishRate: totalScheduled > 0 ? (totalPublished / totalScheduled) * 100 : 0,
        avgPublishTimeMs: avgPublishTime,
        avgPublishTimeHours: avgPublishTime / (1000 * 60 * 60)
      },
      detailedMetrics: metrics,
      generatedAt: new Date()
    };
    
    return report;
  } catch (error) {
    log(`Error generating scheduling report: ${error}`, 'analytics');
    return {
      error: 'Failed to generate report',
      generatedAt: new Date()
    };
  }
}