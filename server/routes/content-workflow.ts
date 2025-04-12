import express from 'express';
import { eq, and, or, gt, isNull } from 'drizzle-orm';
import { db } from '../db';
import { contentItems, workflowNotifications, users } from '../../shared/schema';
import { isAdmin, isAuthenticated } from '../middleware/auth';

const router = express.Router();

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

export default router;