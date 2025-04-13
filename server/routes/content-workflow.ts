import express from 'express';
import { eq, and, or, gt, lt, gte, lte, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { contentItems, workflowNotifications, users, contentHistory } from '../../shared/schema';
import { isAdmin, isAuthenticated } from '../middleware/auth';
import { generateSchedulingReport } from '../services/contentAnalytics';
import { formatDistanceToNow, format } from 'date-fns';

const router = express.Router();

// Function to calculate percent change between two numbers
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Format time in 12-hour format
function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

// Get content items in review queue
router.get('/review-queue', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const userRole = req.session.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    let query = and(
      or(
        eq(contentItems.status, 'review'), 
        eq(contentItems.status, 'changes_requested')
      )
    );
    
    // If not admin, only show content assigned to this reviewer
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      query = and(
        query,
        eq(contentItems.reviewerId, userId)
      );
    }
    
    const reviewQueue = await db.query.contentItems.findMany({
      where: query,
      orderBy: (contentItems, { desc }) => [desc(contentItems.updatedAt)],
      with: {
        creator: true,
        reviewer: true
      }
    });
    
    return res.json(reviewQueue);
  } catch (error) {
    console.error('Error fetching review queue:', error);
    return res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// Get my content in workflow (items created by me)
router.get('/my-content', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const myContent = await db.query.contentItems.findMany({
      where: eq(contentItems.createdBy, userId),
      orderBy: (contentItems, { desc }) => [desc(contentItems.updatedAt)],
      with: {
        reviewer: true
      }
    });
    
    return res.json(myContent);
  } catch (error) {
    console.error('Error fetching my content:', error);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get scheduled content (admin only)
router.get('/scheduled', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    
    const scheduledContent = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'approved'),
        or(
          gt(contentItems.scheduledPublishAt, now),
          isNull(contentItems.scheduledPublishAt)
        )
      ),
      orderBy: (contentItems, { asc }) => [asc(contentItems.scheduledPublishAt)],
      with: {
        creator: true,
        reviewer: true
      }
    });
    
    return res.json(scheduledContent);
  } catch (error) {
    console.error('Error fetching scheduled content:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled content' });
  }
});

// Submit content for review
router.post('/:id/submit-for-review', isAuthenticated, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    const { reviewerId } = req.body;
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find content item
    const contentItem = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, contentId)
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if user is the creator or admin
    if (contentItem.createdBy !== userId && req.session.user?.role !== 'admin' && req.session.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to submit this content for review' });
    }
    
    // Update content status
    await db.update(contentItems)
      .set({ 
        status: 'review',
        reviewerId: reviewerId || null,
        reviewStatus: 'pending',
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));
      
    // Create notification for reviewer if specified
    if (reviewerId) {
      await db.insert(workflowNotifications)
        .values({
          title: 'New Content Review Request',
          message: `Content "${contentItem.title}" has been submitted for your review.`,
          type: 'approval',
          contentId,
          contentTitle: contentItem.title,
          userId: reviewerId
        });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error submitting content for review:', error);
    return res.status(500).json({ error: 'Failed to submit content for review' });
  }
});

// Start review
router.post('/:id/start-review', isAuthenticated, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find content item
    const contentItem = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, contentId)
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if user is the assigned reviewer or admin
    if (contentItem.reviewerId !== userId && req.session.user?.role !== 'admin' && req.session.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to review this content' });
    }
    
    // Update review status
    await db.update(contentItems)
      .set({ 
        reviewStatus: 'in_progress',
        reviewStartedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));
      
    return res.json({ success: true });
  } catch (error) {
    console.error('Error starting review:', error);
    return res.status(500).json({ error: 'Failed to start review' });
  }
});

// Approve content
router.post('/:id/approve', isAuthenticated, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    const { scheduledPublishAt, reviewNotes } = req.body;
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find content item
    const contentItem = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, contentId),
      with: {
        creator: true
      }
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if user is the assigned reviewer or admin
    if (contentItem.reviewerId !== userId && req.session.user?.role !== 'admin' && req.session.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to approve this content' });
    }
    
    // Parse date if provided
    let publishDate = null;
    if (scheduledPublishAt) {
      publishDate = new Date(scheduledPublishAt);
    }
    
    // Update status to approved
    await db.update(contentItems)
      .set({ 
        status: 'approved',
        reviewStatus: 'completed',
        reviewCompletedAt: new Date(),
        scheduledPublishAt: publishDate,
        reviewNotes: reviewNotes || null,
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));
    
    // Create notification for content creator
    if (contentItem.creator?.id) {
      await db.insert(workflowNotifications)
        .values({
          title: 'Content Approved',
          message: `Your content "${contentItem.title}" has been approved.`,
          type: 'publish',
          contentId,
          contentTitle: contentItem.title,
          userId: contentItem.creator.id
        });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error approving content:', error);
    return res.status(500).json({ error: 'Failed to approve content' });
  }
});

// Request changes
router.post('/:id/request-changes', isAuthenticated, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    const { reviewNotes } = req.body;
    const userId = req.session.user?.id;
    
    if (!userId || !reviewNotes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find content item
    const contentItem = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, contentId),
      with: {
        creator: true
      }
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if user is the assigned reviewer or admin
    if (contentItem.reviewerId !== userId && req.session.user?.role !== 'admin' && req.session.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to review this content' });
    }
    
    // Update status to changes_requested
    await db.update(contentItems)
      .set({ 
        status: 'changes_requested',
        reviewStatus: 'completed',
        reviewCompletedAt: new Date(),
        reviewNotes,
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));
    
    // Create notification for content creator
    if (contentItem.creator?.id) {
      await db.insert(workflowNotifications)
        .values({
          title: 'Changes Requested',
          message: `Changes have been requested for your content "${contentItem.title}".`,
          type: 'changes',
          contentId,
          contentTitle: contentItem.title,
          userId: contentItem.creator.id
        });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error requesting changes:', error);
    return res.status(500).json({ error: 'Failed to request changes' });
  }
});

// Publish content
router.post('/:id/publish', isAdmin, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    
    // Find content item
    const contentItem = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, contentId),
      with: {
        creator: true
      }
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if content is approved
    if (contentItem.status !== 'approved') {
      return res.status(400).json({ error: 'Content must be approved before publishing' });
    }
    
    // Update status to published
    await db.update(contentItems)
      .set({ 
        status: 'published',
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));
    
    // Create notification for content creator
    if (contentItem.creator?.id) {
      await db.insert(workflowNotifications)
        .values({
          title: 'Content Published',
          message: `Your content "${contentItem.title}" has been published.`,
          type: 'info',
          contentId,
          contentTitle: contentItem.title,
          userId: contentItem.creator.id
        });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error publishing content:', error);
    return res.status(500).json({ error: 'Failed to publish content' });
  }
});

// Archive content
router.post('/:id/archive', isAdmin, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    
    // Find content item
    const contentItem = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, contentId),
      with: {
        creator: true
      }
    });
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Update status to archived
    await db.update(contentItems)
      .set({ 
        status: 'archived',
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));
    
    // Create notification for content creator
    if (contentItem.creator?.id) {
      await db.insert(workflowNotifications)
        .values({
          title: 'Content Archived',
          message: `Your content "${contentItem.title}" has been archived.`,
          type: 'info',
          contentId,
          contentTitle: contentItem.title,
          userId: contentItem.creator.id
        });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error archiving content:', error);
    return res.status(500).json({ error: 'Failed to archive content' });
  }
});

// Get scheduling analytics report
router.get('/analytics/scheduling', isAdmin, async (req, res) => {
  try {
    // Parse date range from query parameters
    const { start, end } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Default to last 30 days if no dates provided
    if (!start) {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(start as string);
    }
    
    if (!end) {
      // Default to current date if no end date
    } else {
      endDate = new Date(end as string);
    }
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    
    // Generate report
    const report = await generateSchedulingReport(startDate, endDate);
    
    return res.json(report);
  } catch (error) {
    console.error('Error generating scheduling analytics report:', error);
    return res.status(500).json({ error: 'Failed to generate analytics report' });
  }
});

// Get comprehensive content analytics
router.get('/analytics', isAdmin, async (req, res) => {
  try {
    // Parse date range from query parameters
    const { start, end } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Default to last 30 days if no dates provided
    if (!start) {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(start as string);
    }
    
    if (!end) {
      // Default to current date if no end date
    } else {
      endDate = new Date(end as string);
    }
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    
    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(endDate.getTime() - periodDuration);
    
    // Current period data
    const schedulingReport = await generateSchedulingReport(startDate, endDate);
    
    // Get previous period data for comparison
    const previousReport = await generateSchedulingReport(previousStartDate, previousEndDate);
    
    // Get content status distribution
    const statusDistribution = await db.execute(sql`
      SELECT status, COUNT(*) as count
      FROM content_items
      GROUP BY status
      ORDER BY count DESC
    `);
    
    // Format status distribution
    const formattedStatusDistribution: Record<string, number> = {};
    statusDistribution.forEach((row: any) => {
      formattedStatusDistribution[row.status] = Number(row.count);
    });
    
    // Get content needing attention (pending review, scheduled today, expiring soon)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Content in review
    const inReview = await db.query.contentItems.findMany({
      where: eq(contentItems.status, 'review'),
      orderBy: (contentItems, { asc }) => [asc(contentItems.createdAt)],
      limit: 5
    });
    
    // Content scheduled for today
    const scheduledToday = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'approved'),
        isNotNull(contentItems.scheduledPublishAt),
        sql`DATE(${contentItems.scheduledPublishAt}) = DATE(NOW())`
      ),
      limit: 5
    });
    
    // Content expiring soon (in the next 2 days)
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const expiringSoon = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'published'),
        isNotNull(contentItems.expirationDate),
        gte(contentItems.expirationDate, now),
        lt(contentItems.expirationDate, twoDaysFromNow)
      ),
      orderBy: (contentItems, { asc }) => [asc(contentItems.expirationDate)],
      limit: 5
    });
    
    // Format attention items
    const attentionItems = [
      ...inReview.map(item => ({
        id: item.id,
        title: item.title,
        type: 'review_needed',
        status: 'Review Needed',
        message: 'Awaiting review',
        dueTime: item.createdAt ? `Submitted ${formatDistanceToNow(item.createdAt, { addSuffix: true })}` : undefined
      })),
      ...scheduledToday.map(item => ({
        id: item.id,
        title: item.title,
        type: 'scheduled_today',
        status: 'Publishing Today',
        message: 'Scheduled to be published today',
        dueTime: item.scheduledPublishAt ? formatTime(item.scheduledPublishAt) : undefined
      })),
      ...expiringSoon.map(item => ({
        id: item.id,
        title: item.title,
        type: 'expiring_soon',
        status: 'Expiring Soon',
        message: 'Content will be archived soon',
        dueTime: item.expirationDate ? `Expires ${formatDistanceToNow(item.expirationDate, { addSuffix: true })}` : undefined
      }))
    ].slice(0, 10); // Limit to 10 total items
    
    // Get total content counts
    const totalContent = await db.execute(sql`
      SELECT COUNT(*) as count FROM content_items
    `);
    
    const previousTotalContent = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM content_items 
      WHERE created_at < ${startDate}
    `);
    
    // Get workflow stage times
    const workflowQuery = await db.execute(sql`
      WITH status_changes AS (
        SELECT 
          content_id,
          status,
          modified_at AS change_time,
          LEAD(modified_at) OVER (PARTITION BY content_id ORDER BY modified_at) AS next_change_time
        FROM content_history
        WHERE modified_at BETWEEN ${startDate} AND ${endDate}
      )
      SELECT 
        status,
        AVG(EXTRACT(EPOCH FROM (next_change_time - change_time)) / 3600) AS avg_hours_in_status
      FROM status_changes
      WHERE next_change_time IS NOT NULL
      GROUP BY status
    `);
    
    // Format workflow times
    const workflowTimes: Record<string, number> = {};
    workflowQuery.forEach((row: any) => {
      workflowTimes[row.status] = Number(row.avg_hours_in_status);
    });
    
    // Calculate percent changes for comparison metrics
    const currentPeriodData = {
      totalContent: Number(totalContent[0]?.count || 0),
      publishRate: schedulingReport.summary?.publishRate || 0,
      avgReviewTimeHours: schedulingReport.summary?.avgPublishTimeHours || 0,
      pendingReview: inReview.length
    };
    
    const previousPeriodData = {
      totalContent: Number(previousTotalContent[0]?.count || 0),
      publishRate: previousReport.summary?.publishRate || 0,
      avgReviewTimeHours: previousReport.summary?.avgPublishTimeHours || 0
    };
    
    const comparisonMetrics = {
      contentChange: calculatePercentChange(
        currentPeriodData.totalContent,
        previousPeriodData.totalContent
      ),
      publishRateChange: calculatePercentChange(
        currentPeriodData.publishRate,
        previousPeriodData.publishRate
      ),
      reviewTimeChange: calculatePercentChange(
        currentPeriodData.avgReviewTimeHours,
        previousPeriodData.avgReviewTimeHours
      )
    };
    
    // Return the complete analytics report
    return res.json({
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        ...schedulingReport.summary,
        totalContent: currentPeriodData.totalContent,
        pendingReview: inReview.length,
        urgentReview: inReview.filter(item => {
          // Items waiting > 48 hours need urgent review
          if (!item.createdAt) return false;
          const hoursWaiting = (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
          return hoursWaiting > 48;
        }).length
      },
      comparison: comparisonMetrics,
      statusDistribution: formattedStatusDistribution,
      workflowTimes,
      dailyMetrics: schedulingReport.detailedMetrics,
      attentionItems
    });
  } catch (error) {
    console.error('Error generating content analytics:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to generate content analytics' });
  }
});

// Get upcoming scheduled content analytics
router.get('/analytics/upcoming', isAdmin, async (req, res) => {
  try {
    // Get days parameter or default to 7
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    
    if (isNaN(days) || days <= 0 || days > 90) {
      return res.status(400).json({ error: 'Days parameter must be between 1 and 90.' });
    }
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    // Get upcoming scheduled content
    const upcomingContent = await db.query.contentItems.findMany({
      where: and(
        eq(contentItems.status, 'approved'),
        isNotNull(contentItems.scheduledPublishAt),
        gt(contentItems.scheduledPublishAt, now)
      ),
      orderBy: (contentItems, { asc }) => [asc(contentItems.scheduledPublishAt)],
      with: {
        creator: true,
        reviewer: true
      }
    });
    
    // Get soon-to-expire content
    const expiringContent = await db.query.contentItems.findMany({
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
    
    // Calculate daily publishing load
    const dayPublishCounts = Array(days).fill(0);
    const dayExpireCounts = Array(days).fill(0);
    
    upcomingContent.forEach(content => {
      if (content.scheduledPublishAt) {
        const daysFromNow = Math.floor((content.scheduledPublishAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysFromNow >= 0 && daysFromNow < days) {
          dayPublishCounts[daysFromNow]++;
        }
      }
    });
    
    expiringContent.forEach(content => {
      if (content.expirationDate) {
        const daysFromNow = Math.floor((content.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysFromNow >= 0 && daysFromNow < days) {
          dayExpireCounts[daysFromNow]++;
        }
      }
    });
    
    return res.json({
      period: {
        start: now,
        end: futureDate,
        days
      },
      summary: {
        totalUpcoming: upcomingContent.length,
        totalExpiring: expiringContent.length
      },
      dailySchedule: Array(days).fill(0).map((_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split('T')[0],
          publishing: dayPublishCounts[i],
          expiring: dayExpireCounts[i]
        };
      }),
      upcomingContent,
      expiringContent
    });
  } catch (error) {
    console.error('Error generating upcoming content analytics:', error);
    return res.status(500).json({ error: 'Failed to generate upcoming content analytics' });
  }
});

export default router;