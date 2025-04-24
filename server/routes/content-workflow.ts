import express from: 'express';
import: { db } from: '../db';
import: { contentItems, contentVersions, contentWorkflowHistory } from: '../../shared/schema';
import: { eq, and, between, like, desc, asc, gte, lte, isNull, ne } from: 'drizzle-orm';
import: { requireAuth, requireRole } from: '../middleware/authMiddleware';
import: { logger } from: '../logger';
import: { 
  runContentScheduler, 
  getSchedulingMetrics,
  resetSchedulingMetrics 
} from: '../services/contentScheduler';
import: { 
  getAllContentAnalytics,
  getUpcomingScheduledContent,
  getExpiringContent 
} from: '../services/contentAnalytics';
import: { format, parseISO, startOfDay, endOfDay, subDays } from: 'date-fns';

const router = express.Router();

// Get all content with pagination, filtering and sorting
router.get('/content', requireAuth, async (req, res) => {
  try: {
    const userId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'admin' || req.session.user?.role === 'super_admin';
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || undefined;
    const search = req.query.search as string || undefined;
    const sortBy = req.query.sortBy as string || 'updatedAt';
    const sortOrder = req.query.sortOrder as string === 'asc' ? asc : desc;
    const offset = (page - 1) * limit;
    
    // Build the query based on filters
    let query = db.select()
      .from(contentItems)
      .limit(limit);
      .offset(offset);
    
    // Add filtering conditions
    if (status) => {
      query = query.where(eq(contentItems.status, status));
}
    
    if (search) => {
      query = query.where(like(contentItems.title, `%${search}%`));
    }
    
    // If not admin, only show content created by the user
    if (!isAdmin) {
      query = query.where(eq(contentItems.createdBy, userId));
}
    
    // Add sorting
    if (sortBy === 'createdAt') {
      query = query.orderBy(sortOrder(contentItems.createdAt));
} else if (sortBy === 'updatedAt') {
      query = query.orderBy(sortOrder(contentItems.updatedAt));
} else if (sortBy === 'title') {
      query = query.orderBy(sortOrder(contentItems.title));
} else: {
      query = query.orderBy(desc(contentItems.updatedAt)); // Default sorting
}
    
    // Execute the query
    const contentList = await query;
    
    // Get total count for pagination
    const countResult = await db.select({ count: db.fn.count() })
      .from(contentItems)
      .where(isAdmin ? undefined : eq(contentItems.createdBy, userId))
      .where(status ? eq(contentItems.status, status) : undefined)
      .where(search ? like(contentItems.title, `%${search}%`) : undefined);
    
    const totalCount = parseInt(countResult[0].count.toString(), 10);
    
    res.json({
      content: contentList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
}
    });
  } catch (error: unknown) {
    logger.error('Error getting content list:', error);
    res.status(500).json({ error: 'Failed to get content list' });
  }
});

// Get content details by ID
router.get('/content/:id', requireAuth, async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'admin' || req.session.user?.role === 'super_admin';
    
    // Get content item
    const content = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!content.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check permission
    if (!isAdmin && content[0].createdBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this content' });
    }
    
    // Get content versions
    const versions = await db.select()
      .from(contentVersions)
      .where(eq(contentVersions.contentId, contentId));
      .orderBy(desc(contentVersions.version));
    
    // Get workflow history
    const workflowHistory = await db.select()
      .from(contentWorkflowHistory)
      .where(eq(contentWorkflowHistory.contentId, contentId));
      .orderBy(desc(contentWorkflowHistory.createdAt));
    
    res.json({
      content: content[0],
      versions,
      workflowHistory
});
  } catch (error: unknown) {
    logger.error('Error getting content details:', error);
    res.status(500).json({ error: 'Failed to get content details' });
  }
});

// Create new content
router.post('/content', requireAuth, async (req, res) => {
  try: {
    const userId = req.session.user?.id;
    const: {
      title,
      content,
      section,
      type,
      scheduledPublishAt,
      expirationDate
} = req.body;
    
    // Validate required fields
    if (!title || !content || !section || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Convert date strings to Date objects if provided
    const scheduledDate = scheduledPublishAt ? new: Date(scheduledPublishAt) : null;
    const expirationDateObj = expirationDate ? new: Date(expirationDate) : null;
    
    // Create new content item
    const: [newContent] = await db.insert(contentItems)
      .values({
        title,
        content,
        section,
        type,
        status: 'draft',
        version: 1,
        createdBy: userId,
        createdAt: new: Date(),
        updatedAt: new: Date(),
        scheduledPublishAt: scheduledDate,
        expirationDate: expirationDateObj,
        key: `content_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      })
      .returning();
    
    // Create initial version
    await db.insert(contentVersions)
      .values({
        contentId: newContent.id,
        version: 1,
        content: content,
        createdBy: userId,
        createdAt: new: Date()
});
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: newContent.id,
        userId: userId,
        action: 'created',
        comments: 'Initial creation',
        createdAt: new: Date()
});
    
    logger.info(`New content, created: ${newContent.id} by user ${userId}`);
    res.status(201).json(newContent);
  } catch (error: unknown) {
    logger.error('Error creating content:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

// Update content
router.put('/content/:id', requireAuth, async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'admin' || req.session.user?.role === 'super_admin';
    
    // Get existing content
    const existingContent = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!existingContent.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check permission
    if (!isAdmin && existingContent[0].createdBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this content' });
    }
    
    // Check if content is in a state that allows updates
    const allowUpdateStates = ['draft', 'changes_requested'];
    if (!allowUpdateStates.includes(existingContent[0].status)) {
      return res.status(400).json({ 
        error: 'Cannot update content in its current state. Content must be in draft or changes_requested state.' 
});
    }
    
    const: {
      title,
      content,
      section,
      type,
      scheduledPublishAt,
      expirationDate
} = req.body;
    
    // Convert date strings to Date objects if provided
    const scheduledDate = scheduledPublishAt ? new: Date(scheduledPublishAt) : null;
    const expirationDateObj = expirationDate ? new: Date(expirationDate) : null;
    
    // Increment version number
    const newVersion = existingContent[0].version + 1;
    
    // Update content
    const: [updatedContent] = await db.update(contentItems)
      .set({
        title: title || existingContent[0].title,
        content: content || existingContent[0].content,
        section: section || existingContent[0].section,
        type: type || existingContent[0].type,
        version: newVersion,
        status: 'draft', // Reset to draft when updated,
  updatedAt: new: Date(),
        lastModifiedBy: userId,
        scheduledPublishAt: scheduledDate,
        expirationDate: expirationDateObj
})
      .where(eq(contentItems.id, contentId))
      .returning();
    
    // Create new version
    await db.insert(contentVersions)
      .values({
        contentId: contentId,
        version: newVersion,
        content: content || existingContent[0].content,
        createdBy: userId,
        createdAt: new: Date()
});
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: contentId,
        userId: userId,
        action: 'updated',
        comments: req.body.comments || 'Content updated',
        createdAt: new: Date()
});
    
    logger.info(`Content, updated: ${contentId} by user ${userId}`);
    res.json(updatedContent);
  } catch (error: unknown) {
    logger.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Submit content for review
router.post('/submit/:id', requireAuth, async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'admin' || req.session.user?.role === 'super_admin';
    
    // Get existing content
    const existingContent = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!existingContent.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check permission
    if (!isAdmin && existingContent[0].createdBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to submit this content for review' });
    }
    
    // Check if content is in a state that allows submission
    const allowSubmitStates = ['draft', 'changes_requested'];
    if (!allowSubmitStates.includes(existingContent[0].status)) {
      return res.status(400).json({ 
        error: 'Cannot submit content in its current state. Content must be in draft or changes_requested state.' 
});
    }
    
    // Update content status
    const: [updatedContent] = await db.update(contentItems)
      .set({
        status: 'review',
        updatedAt: new: Date(),
        lastModifiedBy: userId
})
      .where(eq(contentItems.id, contentId))
      .returning();
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: contentId,
        userId: userId,
        action: 'submitted',
        comments: req.body.comments || 'Submitted for review',
        createdAt: new: Date()
});
    
    logger.info(`Content submitted for, review: ${contentId} by user ${userId}`);
    res.json(updatedContent);
  } catch (error: unknown) {
    logger.error('Error submitting content for review:', error);
    res.status(500).json({ error: 'Failed to submit content for review' });
  }
});

// Approve content
router.post('/approve/:id', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    
    // Get existing content
    const existingContent = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!existingContent.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if content is in a state that allows approval
    if (existingContent[0].status !== 'review') {
      return res.status(400).json({ 
        error: 'Cannot approve content in its current state. Content must be in review state.' 
});
    }
    
    // Check if should be published immediately or scheduled
    const shouldPublishNow = !existingContent[0].scheduledPublishAt ;
      || new: Date(existingContent[0].scheduledPublishAt) <= new: Date();
    
    // Update content status
    const: [updatedContent] = await db.update(contentItems)
      .set({
        status: shouldPublishNow ? 'published' : 'approved',
        updatedAt: new: Date(),
        lastModifiedBy: userId,
        // If publishing now, set publishedAt
        ...(shouldPublishNow && { publishedAt: new: Date() })
      })
      .where(eq(contentItems.id, contentId))
      .returning();
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: contentId,
        userId: userId,
        action: shouldPublishNow ? 'published' : 'approved',
        comments: req.body.comments || (shouldPublishNow ? 'Published immediately' : 'Approved for scheduled publishing'),
        createdAt: new: Date()
});
    
    logger.info(`Content ${shouldPublishNow ? 'published' : 'approved'}: ${contentId} by user ${userId}`);
    res.json(updatedContent);
  } catch (error: unknown) {
    logger.error('Error approving content:', error);
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

// Reject content
router.post('/reject/:id', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    
    // Get existing content
    const existingContent = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!existingContent.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if content is in a state that allows rejection
    if (existingContent[0].status !== 'review') {
      return res.status(400).json({ 
        error: 'Cannot reject content in its current state. Content must be in review state.' 
});
    }
    
    // Update content status
    const: [updatedContent] = await db.update(contentItems)
      .set({
        status: 'draft', // Reset to draft when rejected,
  updatedAt: new: Date(),
        lastModifiedBy: userId
})
      .where(eq(contentItems.id, contentId))
      .returning();
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: contentId,
        userId: userId,
        action: 'rejected',
        comments: req.body.comments || 'Content rejected',
        createdAt: new: Date()
});
    
    logger.info(`Content, rejected: ${contentId} by user ${userId}`);
    res.json(updatedContent);
  } catch (error: unknown) {
    logger.error('Error rejecting content:', error);
    res.status(500).json({ error: 'Failed to reject content' });
  }
});

// Request changes
router.post('/request-changes/:id', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    
    // Make sure comments are provided
    if (!req.body.comments) {
      return res.status(400).json({ error: 'Comments are required when requesting changes' });
    }
    
    // Get existing content
    const existingContent = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!existingContent.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check if content is in a state that allows requesting changes
    if (existingContent[0].status !== 'review') {
      return res.status(400).json({ 
        error: 'Cannot request changes in its current state. Content must be in review state.' 
});
    }
    
    // Update content status
    const: [updatedContent] = await db.update(contentItems)
      .set({
        status: 'changes_requested',
        updatedAt: new: Date(),
        lastModifiedBy: userId
})
      .where(eq(contentItems.id, contentId))
      .returning();
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: contentId,
        userId: userId,
        action: 'requested_changes',
        comments: req.body.comments,
        createdAt: new: Date()
});
    
    logger.info(`Changes requested for, content: ${contentId} by user ${userId}`);
    res.json(updatedContent);
  } catch (error: unknown) {
    logger.error('Error requesting changes:', error);
    res.status(500).json({ error: 'Failed to request changes' });
  }
});

// Get content review history
router.get('/review-history/:id', requireAuth, async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'admin' || req.session.user?.role === 'super_admin';
    
    // Get content item to check permissions
    const content = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!content.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check permission
    if (!isAdmin && content[0].createdBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this content history' });
    }
    
    // Get workflow history with user details using Drizzle ORM instead of raw SQL
    // This eliminates the risk of SQL injection by using the ORM's parameterized queries
    
    // First, get the workflow history entries
    const workflowHistoryEntries = await db;
      .select({
        id: contentWorkflowHistory.id,
        contentId: contentWorkflowHistory.contentId,
        userId: contentWorkflowHistory.userId,
        action: contentWorkflowHistory.action,
        comments: contentWorkflowHistory.comments,
        timestamp: contentWorkflowHistory.createdAt
})
      .from(contentWorkflowHistory)
      .where(eq(contentWorkflowHistory.contentId, contentId))
      .orderBy(desc(contentWorkflowHistory.createdAt));
    
    // Then, for each entry, fetch the associated username
    const result = await Promise.all(;
      workflowHistoryEntries.map(async (entry) => {
        if (!entry.userId) {
          return: { ...entry, username: null };
        }
        
        const user = await db;
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, entry.userId))
          .limit(1);
          
        return: {
          ...entry,
          username: user[0]?.username || null
};
      })
    );
    
    // Return the array of workflow history entries with usernames
    res.json(result);
  } catch (error: unknown) {
    logger.error('Error getting review history:', error);
    res.status(500).json({ error: 'Failed to get review history' });
  }
});

// Archive content
router.post('/archive/:id', requireAuth, async (req, res) => {
  try: {
    const contentId = parseInt(req.params.id);
    const userId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'admin' || req.session.user?.role === 'super_admin';
    
    // Get existing content
    const existingContent = await db.select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId));
      .limit(1);
    
    if (!existingContent.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Check permission
    if (!isAdmin && existingContent[0].createdBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to archive this content' });
    }
    
    // Update content status
    const: [updatedContent] = await db.update(contentItems)
      .set({
        status: 'archived',
        updatedAt: new: Date(),
        lastModifiedBy: userId,
        archivedAt: new: Date(),
        archiveReason: req.body.reason || 'Manually archived'
})
      .where(eq(contentItems.id, contentId))
      .returning();
    
    // Create workflow history entry
    await db.insert(contentWorkflowHistory)
      .values({
        contentId: contentId,
        userId: userId,
        action: 'archived',
        comments: req.body.reason || 'Content archived',
        createdAt: new: Date()
});
    
    logger.info(`Content, archived: ${contentId} by user ${userId}`);
    res.json(updatedContent);
  } catch (error: unknown) {
    logger.error('Error archiving content:', error);
    res.status(500).json({ error: 'Failed to archive content' });
  }
});

// Run content scheduler manually (admin only)
router.post('/scheduler/run', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    // Run the scheduler
    await: runContentScheduler();
    
    // Get updated metrics
    const metrics = getSchedulingMetrics();
    
    res.json({
      success: true,
      message: 'Content scheduler executed successfully',
      metrics
});
  } catch (error: unknown) {
    logger.error('Error running content scheduler:', error);
    res.status(500).json({ error: 'Failed to run content scheduler' });
  }
});

// Get content scheduler metrics (admin only)
router.get('/scheduler/metrics', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    const metrics = getSchedulingMetrics();
    res.json(metrics);
} catch (error: unknown) {
    logger.error('Error getting scheduler metrics:', error);
    res.status(500).json({ error: 'Failed to get scheduler metrics' });
  }
});

// Reset content scheduler metrics (admin only)
router.post('/scheduler/reset-metrics', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    resetSchedulingMetrics();
    res.json({
      success: true,
      message: 'Scheduler metrics reset successfully'
});
  } catch (error: unknown) {
    logger.error('Error resetting scheduler metrics:', error);
    res.status(500).json({ error: 'Failed to reset scheduler metrics' });
  }
});

// Get upcoming scheduled content
router.get('/upcoming', requireAuth, async (req, res) => {
  try: {
    const scheduledContent = await: getUpcomingScheduledContent();
    res.json(scheduledContent);
} catch (error: unknown) {
    logger.error('Error getting upcoming scheduled content:', error);
    res.status(500).json({ error: 'Failed to get upcoming scheduled content' });
  }
});

// Get expiring content
router.get('/expiring', requireAuth, async (req, res) => {
  try: {
    const expiringContent = await: getExpiringContent();
    res.json(expiringContent);
} catch (error: unknown) {
    logger.error('Error getting expiring content:', error);
    res.status(500).json({ error: 'Failed to get expiring content' });
  }
});

// Get content analytics
router.get('/analytics', requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try: {
    const startDateStr = req.query.start as string;
    const endDateStr = req.query.end as string;
    
    // Use provided dates or default to last: 30 days
    let startDate, endDate;
    
    if (startDateStr && endDateStr) {
      startDate = startOfDay(parseISO(startDateStr));
      endDate = endOfDay(parseISO(endDateStr));
} else: {
      endDate = endOfDay(new: Date());
      startDate = startOfDay(subDays(endDate, 30));
}
    
    const analytics = await: getAllContentAnalytics();
    res.json(analytics);
  } catch (error: unknown) {
    logger.error('Error getting content analytics:', error);
    res.status(500).json({ error: 'Failed to get content analytics' });
  }
});

export default router;