import express from 'express';
import { z } from 'zod';
import { format, addDays, subDays, isAfter, parseISO } from 'date-fns';
import type { Request, Response } from 'express';
import { db } from './db';

const router = express.Router();

// Schema for input validation
const contentActionSchema = z.object({
  comments: z.string().optional(),
});

/**
 * Get content workflow metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // In a real implementation, these would be fetched from the database
    const metrics = {
      pendingReviews: await db.query(
        'SELECT COUNT(*) FROM content WHERE status = $1',
        ['review']
      ).then(result => parseInt(result.rows[0].count, 10)),
      
      approvedContent: await db.query(
        'SELECT COUNT(*) FROM content WHERE status = $1',
        ['approved']
      ).then(result => parseInt(result.rows[0].count, 10)),
      
      scheduledPublications: await db.query(
        'SELECT COUNT(*) FROM content WHERE status = $1 AND scheduled_publish_at IS NOT NULL',
        ['approved']
      ).then(result => parseInt(result.rows[0].count, 10)),
      
      expiringContent: await db.query(
        'SELECT COUNT(*) FROM content WHERE status = $1 AND expiration_date IS NOT NULL AND expiration_date < $2',
        ['published', format(addDays(new Date(), 30), 'yyyy-MM-dd')]
      ).then(result => parseInt(result.rows[0].count, 10)),
      
      averageApprovalTime: await db.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric(10,1) as avg_hours
        FROM content_workflow_history
        WHERE action = 'approved'
      `).then(result => result.rows[0]?.avg_hours ? `${result.rows[0].avg_hours}h` : 'N/A'),
      
      reviewerPerformance: await db.query(`
        SELECT 
          u.id as reviewer_id,
          u.name as reviewer_name,
          COUNT(cwh.id) as total_reviewed,
          AVG(EXTRACT(EPOCH FROM (cwh.created_at - c.updated_at))/3600)::numeric(10,1) as avg_response_time
        FROM content_workflow_history cwh
        JOIN users u ON cwh.user_id = u.id
        JOIN content c ON cwh.content_id = c.id
        WHERE cwh.action IN ('approved', 'rejected', 'requested_changes')
        GROUP BY u.id, u.name
        ORDER BY total_reviewed DESC
      `).then(result => result.rows.map(row => ({
        reviewerId: row.reviewer_id,
        reviewerName: row.reviewer_name,
        totalReviewed: row.total_reviewed,
        averageResponseTime: `${row.avg_response_time}h`
      })))
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    res.status(500).json({ error: 'Failed to fetch workflow metrics' });
  }
});

/**
 * Get content queue based on filters
 */
router.get('/queue', async (req: Request, res: Response) => {
  const filter = req.query.filter as string || 'all';
  
  try {
    let query = `
      SELECT 
        c.id, 
        c.title, 
        c.status, 
        c.version, 
        c.content_type as "contentType",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        c.scheduled_publish_at as "scheduledPublishAt",
        c.expiration_date as "expirationDate",
        u.name as "authorName"
      FROM content c
      LEFT JOIN users u ON c.author_id = u.id
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filter && filter !== 'all') {
      if (filter === 'pending') {
        query += ` WHERE c.status = $${paramIndex++}`;
        params.push('review');
      } else if (filter === 'approved') {
        query += ` WHERE c.status = $${paramIndex++}`;
        params.push('approved');
      } else if (filter === 'scheduled') {
        query += ` WHERE c.status = $${paramIndex++} AND c.scheduled_publish_at IS NOT NULL`;
        params.push('approved');
      }
    }
    
    query += ' ORDER BY c.updated_at DESC';
    
    const result = await db.query(query, params);
    
    // Format dates for frontend display
    const queue = result.rows.map(item => ({
      ...item,
      updatedAtFormatted: format(new Date(item.updatedAt), 'MMM d, h:mm a')
    }));
    
    res.json(queue);
  } catch (error) {
    console.error('Error fetching content queue:', error);
    res.status(500).json({ error: 'Failed to fetch content queue' });
  }
});

/**
 * Get content details including versions and workflow history
 */
router.get('/content/:id', async (req: Request, res: Response) => {
  const contentId = parseInt(req.params.id, 10);
  
  if (isNaN(contentId)) {
    return res.status(400).json({ error: 'Invalid content ID' });
  }
  
  try {
    // Get content details
    const contentResult = await db.query(
      'SELECT * FROM content WHERE id = $1',
      [contentId]
    );
    
    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const content = contentResult.rows[0];
    
    // Get content versions
    const versionsResult = await db.query(
      'SELECT * FROM content_versions WHERE content_id = $1 ORDER BY version DESC',
      [contentId]
    );
    
    // Get workflow history
    const historyResult = await db.query(`
      SELECT 
        cwh.id,
        cwh.content_id as "contentId",
        cwh.user_id as "userId",
        cwh.action,
        cwh.comments,
        cwh.created_at as "timestamp",
        u.name as username
      FROM content_workflow_history cwh
      JOIN users u ON cwh.user_id = u.id
      WHERE cwh.content_id = $1
      ORDER BY cwh.created_at DESC
    `, [contentId]);
    
    res.json({
      content,
      versions: versionsResult.rows,
      workflowHistory: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching content details:', error);
    res.status(500).json({ error: 'Failed to fetch content details' });
  }
});

/**
 * Get review history for a content item
 */
router.get('/review-history/:id', async (req: Request, res: Response) => {
  const contentId = parseInt(req.params.id, 10);
  
  if (isNaN(contentId)) {
    return res.status(400).json({ error: 'Invalid content ID' });
  }
  
  try {
    const historyResult = await db.query(`
      SELECT 
        cwh.id,
        cwh.content_id as "contentId",
        cwh.user_id as "userId",
        cwh.action,
        cwh.comments,
        cwh.created_at as "timestamp",
        u.name as username
      FROM content_workflow_history cwh
      JOIN users u ON cwh.user_id = u.id
      WHERE cwh.content_id = $1
      ORDER BY cwh.created_at DESC
    `, [contentId]);
    
    res.json(historyResult.rows);
  } catch (error) {
    console.error('Error fetching review history:', error);
    res.status(500).json({ error: 'Failed to fetch review history' });
  }
});

/**
 * Get upcoming content (scheduled to be published)
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.title, 
        c.scheduled_publish_at as "scheduledPublishAt",
        c.content_type as "type",
        COALESCE(c.section, 'General') as section
      FROM content c
      WHERE c.status = 'approved'
      AND c.scheduled_publish_at IS NOT NULL
      AND c.scheduled_publish_at > NOW()
      ORDER BY c.scheduled_publish_at ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming content:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming content' });
  }
});

/**
 * Get expiring content
 */
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.title, 
        c.expiration_date as "expirationDate",
        c.published_at as "publishedAt",
        c.content_type as "type",
        COALESCE(c.section, 'General') as section
      FROM content c
      WHERE c.status = 'published'
      AND c.expiration_date IS NOT NULL
      AND c.expiration_date > NOW()
      AND c.expiration_date < NOW() + INTERVAL '30 days'
      ORDER BY c.expiration_date ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expiring content:', error);
    res.status(500).json({ error: 'Failed to fetch expiring content' });
  }
});

/**
 * Approve content
 */
router.post('/approve/:id', async (req: Request, res: Response) => {
  const contentId = parseInt(req.params.id, 10);
  
  if (isNaN(contentId)) {
    return res.status(400).json({ error: 'Invalid content ID' });
  }
  
  const validation = contentActionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.format() });
  }
  
  const { comments } = validation.data;
  
  try {
    // Check if content exists and has correct status
    const contentResult = await db.query(
      'SELECT * FROM content WHERE id = $1',
      [contentId]
    );
    
    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const content = contentResult.rows[0];
    if (content.status !== 'review') {
      return res.status(400).json({ error: 'Content is not in review status' });
    }
    
    const hasScheduledDate = !!content.scheduled_publish_at && isAfter(parseISO(content.scheduled_publish_at), new Date());
    const newStatus = hasScheduledDate ? 'approved' : 'published';
    const publishedAt = hasScheduledDate ? null : new Date();
    
    // Update content status
    await db.query(
      `UPDATE content SET 
        status = $1, 
        published_at = $2,
        updated_at = NOW()
      WHERE id = $3`,
      [newStatus, publishedAt, contentId]
    );
    
    // Record action in workflow history
    await db.query(
      `INSERT INTO content_workflow_history 
       (content_id, user_id, action, comments, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [contentId, req.user?.id || 1, 'approved', comments || '']
    );
    
    // Add notification for content creator
    await db.query(
      `INSERT INTO notifications
       (user_id, type, content_id, content_title, message, created_at, is_read, action_required)
       VALUES ($1, $2, $3, $4, $5, NOW(), FALSE, FALSE)`,
      [
        content.author_id, 
        'content_approved', 
        contentId, 
        content.title, 
        hasScheduledDate 
          ? `Your content "${content.title}" has been approved and will be published on the scheduled date.` 
          : `Your content "${content.title}" has been approved and published.`
      ]
    );
    
    res.json({ 
      success: true, 
      status: newStatus,
      scheduledPublishAt: content.scheduled_publish_at
    });
  } catch (error) {
    console.error('Error approving content:', error);
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

/**
 * Reject content
 */
router.post('/reject/:id', async (req: Request, res: Response) => {
  const contentId = parseInt(req.params.id, 10);
  
  if (isNaN(contentId)) {
    return res.status(400).json({ error: 'Invalid content ID' });
  }
  
  const validation = contentActionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.format() });
  }
  
  const { comments } = validation.data;
  if (!comments) {
    return res.status(400).json({ error: 'Comments are required when rejecting content' });
  }
  
  try {
    // Check if content exists and has correct status
    const contentResult = await db.query(
      'SELECT * FROM content WHERE id = $1',
      [contentId]
    );
    
    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const content = contentResult.rows[0];
    if (content.status !== 'review') {
      return res.status(400).json({ error: 'Content is not in review status' });
    }
    
    // Update content status
    await db.query(
      `UPDATE content SET 
        status = 'draft', 
        updated_at = NOW()
      WHERE id = $1`,
      [contentId]
    );
    
    // Record action in workflow history
    await db.query(
      `INSERT INTO content_workflow_history 
       (content_id, user_id, action, comments, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [contentId, req.user?.id || 1, 'rejected', comments]
    );
    
    // Add notification for content creator
    await db.query(
      `INSERT INTO notifications
       (user_id, type, content_id, content_title, message, created_at, is_read, action_required)
       VALUES ($1, $2, $3, $4, $5, NOW(), FALSE, TRUE)`,
      [
        content.author_id, 
        'content_rejected', 
        contentId, 
        content.title, 
        `Your content "${content.title}" has been rejected. Please review the feedback.`
      ]
    );
    
    res.json({ success: true, status: 'draft' });
  } catch (error) {
    console.error('Error rejecting content:', error);
    res.status(500).json({ error: 'Failed to reject content' });
  }
});

/**
 * Request changes to content
 */
router.post('/request-changes/:id', async (req: Request, res: Response) => {
  const contentId = parseInt(req.params.id, 10);
  
  if (isNaN(contentId)) {
    return res.status(400).json({ error: 'Invalid content ID' });
  }
  
  const validation = contentActionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.format() });
  }
  
  const { comments } = validation.data;
  if (!comments) {
    return res.status(400).json({ error: 'Comments are required when requesting changes' });
  }
  
  try {
    // Check if content exists and has correct status
    const contentResult = await db.query(
      'SELECT * FROM content WHERE id = $1',
      [contentId]
    );
    
    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const content = contentResult.rows[0];
    if (content.status !== 'review') {
      return res.status(400).json({ error: 'Content is not in review status' });
    }
    
    // Update content status
    await db.query(
      `UPDATE content SET 
        status = 'changes_requested', 
        updated_at = NOW()
      WHERE id = $1`,
      [contentId]
    );
    
    // Record action in workflow history
    await db.query(
      `INSERT INTO content_workflow_history 
       (content_id, user_id, action, comments, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [contentId, req.user?.id || 1, 'requested_changes', comments]
    );
    
    // Add notification for content creator
    await db.query(
      `INSERT INTO notifications
       (user_id, type, content_id, content_title, message, created_at, is_read, action_required)
       VALUES ($1, $2, $3, $4, $5, NOW(), FALSE, TRUE)`,
      [
        content.author_id, 
        'changes_requested', 
        contentId, 
        content.title, 
        `Changes have been requested for your content "${content.title}". Please review the feedback.`
      ]
    );
    
    res.json({ success: true, status: 'changes_requested' });
  } catch (error) {
    console.error('Error requesting changes:', error);
    res.status(500).json({ error: 'Failed to request changes' });
  }
});

export const contentWorkflowRoutes = router;