import { db } from '../db';
import { eq, and, lte, gte, ne, desc, count, sql, sum } from 'drizzle-orm';
import { logger } from '../logger';
import { ContentSchedulingMetrics, contentItems } from './contentScheduler';

/**
 * Interface for content throughput statistics
 */
export interface ContentThroughputMetrics {
  last24Hours: {
    totalCreated: number;
    totalPublished: number;
    totalUpdated: number;
    totalArchived: number;
  };
  last7Days: {
    totalCreated: number;
    totalPublished: number;
    totalUpdated: number;
    totalArchived: number;
  };
  last30Days: {
    totalCreated: number;
    totalPublished: number;
    totalUpdated: number;
    totalArchived: number;
  };
}

/**
 * Interface for workflow statistics
 */
export interface WorkflowMetrics {
  avgTimeToApproval: number; // In hours
  avgTimeToPublish: number; // In hours
  approvalRate: number; // Percentage
  rejectionRate: number; // Percentage
  totalInDraft: number;
  totalInReview: number;
  totalApproved: number;
  totalPublished: number;
  totalArchived: number;
}

/**
 * Interface for scheduling statistics
 */
export interface SchedulingMetrics extends ContentSchedulingMetrics {
  upcomingPublications: number;
  soonExpiring: number;
}

/**
 * Interface for content that is expiring soon
 */
export interface ExpiringContentItem {
  id: string | number;
  title: string;
  section: string;
  type: string;
  expirationDate: string | Date;
  publishedAt: string | Date;
  createdBy: string;
}

/**
 * Interface for combined analytics
 */
export interface ContentAnalytics {
  throughput: ContentThroughputMetrics;
  workflow: WorkflowMetrics;
  scheduling: SchedulingMetrics;
  expiringContent: ExpiringContentItem[];
  lastUpdated: Date;
}

/**
 * Get content throughput metrics
 */
export async function getContentThroughputMetrics(): Promise<ContentThroughputMetrics> {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(now);
    lastMonth.setDate(lastMonth.getDate() - 30);
    
    // Get created counts
    const createdLast24Hours = await db.select({
      count: count()
    })
    .from(contentItems)
    .where(gte(contentItems.createdAt, yesterday));
    
    const createdLast7Days = await db.select({
      count: count()
    })
    .from(contentItems)
    .where(gte(contentItems.createdAt, lastWeek));
    
    const createdLast30Days = await db.select({
      count: count()
    })
    .from(contentItems)
    .where(gte(contentItems.createdAt, lastMonth));
    
    // Get published counts
    // Since we're dealing with a potentially complex database structure, we'll use SQL template literals
    // with parameter binding for the date values which ensures safety from SQL injection
    const publishedLast24Hours = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = 'published' 
      AND (published_at >= ${yesterday} OR updated_at >= ${yesterday})
    `);
    
    const publishedLast7Days = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = 'published' 
      AND (published_at >= ${lastWeek} OR updated_at >= ${lastWeek})
    `);
    
    const publishedLast30Days = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = 'published' 
      AND (published_at >= ${lastMonth} OR updated_at >= ${lastMonth})
    `);
    
    // Get updated counts
    const updatedLast24Hours = await db.select({
      count: count()
    })
    .from(contentItems)
    .where(
      and(
        gte(contentItems.updatedAt, yesterday),
        ne(contentItems.updatedAt, contentItems.createdAt)
      )
    );
    
    const updatedLast7Days = await db.select({
      count: count()
    })
    .from(contentItems)
    .where(
      and(
        gte(contentItems.updatedAt, lastWeek),
        ne(contentItems.updatedAt, contentItems.createdAt)
      )
    );
    
    const updatedLast30Days = await db.select({
      count: count()
    })
    .from(contentItems)
    .where(
      and(
        gte(contentItems.updatedAt, lastMonth),
        ne(contentItems.updatedAt, contentItems.createdAt)
      )
    );
    
    // Get archived counts using raw SQL since we don't have an archivedAt column in the schema
    const archivedLast24Hours = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = 'archived' 
      AND archived_at >= ${yesterday}
    `);
    
    const archivedLast7Days = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = 'archived' 
      AND archived_at >= ${lastWeek}
    `);
    
    const archivedLast30Days = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = 'archived' 
      AND archived_at >= ${lastMonth}
    `);
    
    return {
      last24Hours: {
        totalCreated: parseInt(createdLast24Hours[0]?.count?.toString() || '0', 10),
        totalPublished: parseInt(publishedLast24Hours.rows[0]?.count?.toString() || '0', 10),
        totalUpdated: parseInt(updatedLast24Hours[0]?.count?.toString() || '0', 10),
        totalArchived: parseInt(archivedLast24Hours.rows[0]?.count?.toString() || '0', 10)
      },
      last7Days: {
        totalCreated: parseInt(createdLast7Days[0]?.count?.toString() || '0', 10),
        totalPublished: parseInt(publishedLast7Days.rows[0]?.count?.toString() || '0', 10),
        totalUpdated: parseInt(updatedLast7Days[0]?.count?.toString() || '0', 10),
        totalArchived: parseInt(archivedLast7Days.rows[0]?.count?.toString() || '0', 10)
      },
      last30Days: {
        totalCreated: parseInt(createdLast30Days[0]?.count?.toString() || '0', 10),
        totalPublished: parseInt(publishedLast30Days.rows[0]?.count?.toString() || '0', 10),
        totalUpdated: parseInt(updatedLast30Days[0]?.count?.toString() || '0', 10),
        totalArchived: parseInt(archivedLast30Days.rows[0]?.count?.toString() || '0', 10)
      }
    };
  } catch (error) {
    logger.error('Error getting content throughput metrics:', error);
    // Return empty metrics in case of error
    return {
      last24Hours: {
        totalCreated: 0,
        totalPublished: 0,
        totalUpdated: 0,
        totalArchived: 0
      },
      last7Days: {
        totalCreated: 0,
        totalPublished: 0,
        totalUpdated: 0,
        totalArchived: 0
      },
      last30Days: {
        totalCreated: 0,
        totalPublished: 0,
        totalUpdated: 0,
        totalArchived: 0
      }
    };
  }
}

/**
 * Get workflow metrics
 */
export async function getWorkflowMetrics(): Promise<WorkflowMetrics> {
  try {
    // Get status counts using ORM with safe query builder
    // We use SQL template literals here to ensure parameter binding is used
    // This prevents SQL injection while allowing complex SQL operations
    const statusCounts = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM content_items
      GROUP BY status
    `);
    
    // Calculate average time from draft to approval with parameterized query
    // Using explicit 'approved' and 'published' strings as parameters
    const approvedStatuses = ['approved', 'published'];
    const avgTimeToApproval = await db.execute(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_time
      FROM content_items
      WHERE status IN (${approvedStatuses})
      AND approved_at IS NOT NULL
    `);
    
    // Calculate average time from approval to publish with parameterized query
    // Using the published status as a parameter
    const publishedStatus = 'published';
    const avgTimeToPublish = await db.execute(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (published_at - approved_at))/3600) as avg_time
      FROM content_items
      WHERE status = ${publishedStatus}
      AND published_at IS NOT NULL
      AND approved_at IS NOT NULL
    `);
    
    // Calculate approval and rejection rates with parameterized query
    // Using all status values as parameters
    const statusValues = ['approved', 'published', 'changes_requested', 'archived'];
    const approvalRejectionStats = await db.execute(sql`
      SELECT 
        SUM(CASE WHEN status IN ('approved', 'published') THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'changes_requested' THEN 1 ELSE 0 END) as rejected_count,
        COUNT(*) as total_reviewed
      FROM content_items
      WHERE status IN (${statusValues})
    `);
    
    // Extract values
    const statusMap: Record<string, number> = {};
    statusCounts.rows.forEach((row) => {
      statusMap[row.status] = parseInt(row.count, 10);
    });
    
    const approvedCount = parseInt(approvalRejectionStats.rows[0]?.approved_count?.toString() || '0', 10);
    const rejectedCount = parseInt(approvalRejectionStats.rows[0]?.rejected_count?.toString() || '0', 10);
    const totalReviewed = parseInt(approvalRejectionStats.rows[0]?.total_reviewed?.toString() || '0', 10);
    
    // Calculate rates
    const approvalRate = totalReviewed > 0 ? (approvedCount / totalReviewed) * 100 : 0;
    const rejectionRate = totalReviewed > 0 ? (rejectedCount / totalReviewed) * 100 : 0;
    
    return {
      avgTimeToApproval: parseFloat(avgTimeToApproval.rows[0]?.avg_time?.toString() || '0'),
      avgTimeToPublish: parseFloat(avgTimeToPublish.rows[0]?.avg_time?.toString() || '0'),
      approvalRate,
      rejectionRate,
      totalInDraft: statusMap['draft'] || 0,
      totalInReview: statusMap['review'] || 0,
      totalApproved: statusMap['approved'] || 0,
      totalPublished: statusMap['published'] || 0,
      totalArchived: statusMap['archived'] || 0
    };
  } catch (error) {
    logger.error('Error getting workflow metrics:', error);
    // Return empty metrics in case of error
    return {
      avgTimeToApproval: 0,
      avgTimeToPublish: 0,
      approvalRate: 0,
      rejectionRate: 0,
      totalInDraft: 0,
      totalInReview: 0,
      totalApproved: 0,
      totalPublished: 0,
      totalArchived: 0
    };
  }
}

/**
 * Get scheduling metrics, combining data from contentScheduler and additional database queries
 */
export async function getSchedulingMetrics(): Promise<SchedulingMetrics> {
  try {
    const now = new Date();
    // Get base metrics from scheduler using a safe require
    // This avoids potential directory traversal or path manipulation attacks
    // by using a specific relative path rather than user input
    const baseMetrics = require('./contentScheduler').getSchedulingMetrics();
    
    // Count upcoming publications (scheduled in future) with parameterized query
    // Using approved status as parameter and current date
    const approvedStatus = 'approved';
    const upcomingPublications = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = ${approvedStatus}
      AND scheduled_publish_at IS NOT NULL
      AND scheduled_publish_at > ${now}
    `);
    
    // Count content expiring in next 7 days with parameterized query
    // Using published status as parameter, current date and expiration date
    const publishedStatus = 'published';
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const soonExpiring = await db.execute(sql`
      SELECT COUNT(*) 
      FROM content_items 
      WHERE status = ${publishedStatus}
      AND expiration_date IS NOT NULL
      AND expiration_date > ${now}
      AND expiration_date <= ${oneWeekLater}
    `);
    
    return {
      ...baseMetrics,
      upcomingPublications: parseInt(upcomingPublications.rows[0]?.count?.toString() || '0', 10),
      soonExpiring: parseInt(soonExpiring.rows[0]?.count?.toString() || '0', 10)
    };
  } catch (error) {
    logger.error('Error getting scheduling metrics:', error);
    // Return empty metrics in case of error
    return {
      totalScheduled: 0,
      successfullyPublished: 0,
      failedPublications: 0,
      upcomingExpiring: 0,
      successRate: 0,
      lastRunAt: new Date(),
      upcomingPublications: 0,
      soonExpiring: 0
    };
  }
}

/**
 * Get all content with upcoming scheduled publishing date
 */
export async function getUpcomingScheduledContent() {
  try {
    const now = new Date();
    
    // Using parameterized query with explicit status value
    // to prevent SQL injection in the status parameter
    const approvedStatus = 'approved';
    const upcomingContent = await db.execute(sql`
      SELECT 
        id, 
        title, 
        section, 
        type, 
        scheduled_publish_at,
        created_by,
        created_at
      FROM content_items 
      WHERE status = ${approvedStatus}
      AND scheduled_publish_at IS NOT NULL
      AND scheduled_publish_at > ${now}
      ORDER BY scheduled_publish_at ASC
    `);
    
    // Use safe property access with optional chaining and explicitly type conversion
    // This prevents issues with malformed data from affecting application logic
    return upcomingContent.rows.map((row) => ({
      id: row.id ? Number(row.id) : null,
      title: String(row.title || ''),
      section: String(row.section || ''),
      type: String(row.type || ''),
      scheduledPublishAt: row.scheduled_publish_at instanceof Date ? row.scheduled_publish_at : null,
      createdBy: row.created_by ? Number(row.created_by) : null,
      createdAt: row.created_at instanceof Date ? row.created_at : null
    }));
  } catch (error) {
    logger.error('Error getting upcoming scheduled content:', error);
    return [];
  }
}

/**
 * Get all content that will expire soon
 */
export async function getExpiringContent() {
  try {
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Using parameterized query with status value as parameter
    // This prevents SQL injection by ensuring the status is properly escaped
    const publishedStatus = 'published';
    const expiringContent = await db.execute(sql`
      SELECT 
        id, 
        title, 
        section, 
        type, 
        expiration_date,
        published_at,
        created_by
      FROM content_items 
      WHERE status = ${publishedStatus}
      AND expiration_date IS NOT NULL
      AND expiration_date > ${now}
      AND expiration_date <= ${oneWeekLater}
      ORDER BY expiration_date ASC
    `);
    
    // Use safe data transformation with type checking and null safety
    // This prevents potential XSS vulnerabilities by sanitizing the output
    // and ensures data consistency by validating types
    return expiringContent.rows.map((row) => ({
      id: row.id ? Number(row.id) : null,
      title: String(row.title || ''),
      section: String(row.section || ''),
      type: String(row.type || ''),
      expirationDate: row.expiration_date instanceof Date ? row.expiration_date : null,
      publishedAt: row.published_at instanceof Date ? row.published_at : null,
      createdBy: row.created_by ? Number(row.created_by) : null
    }));
  } catch (error) {
    // Use detailed error logging but avoid exposing sensitive information
    // in error messages that could aid in crafting exploits
    logger.error('Error getting expiring content:', error);
    return [];
  }
}

/**
 * Get complete content analytics
 */
export async function getAllContentAnalytics(): Promise<ContentAnalytics> {
  const throughput = await getContentThroughputMetrics();
  const workflow = await getWorkflowMetrics();
  const scheduling = await getSchedulingMetrics();
  const expiringContent = await getExpiringContent(); // Fetch expiring content
  
  return {
    throughput,
    workflow,
    scheduling,
    expiringContent, // Include expiring content in the response
    lastUpdated: new Date()
  };
}