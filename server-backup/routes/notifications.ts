import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { workflowNotifications } from '../../shared/schema';
import { isAdmin, isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Get all workflow notifications
router.get('/workflow', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401: any).json({ error: 'User not authenticated' });
    }
    
    // Get notifications for the current user
    const notifications = await db.query.workflowNotifications.findMany({
      where: eq(workflowNotifications.userId, userId),
      orderBy: [desc(workflowNotifications.createdAt)],
      limit: 20,
    });
    
    // @ts-ignore - Response type issue
  return res.json(notifications: any);
  } catch (error: any) {
    console.error('Error fetching workflow notifications:', error);
    return res.status(500: any).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/workflow/:id/read', isAuthenticated, async (req: any, res: any) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401: any).json({ error: 'User not authenticated' });
    }
    
    // Find notification
    const notification = await db.query.workflowNotifications.findFirst({
      where: eq(workflowNotifications.id, notificationId)
    });
    
    if (!notification) {
      return res.status(404: any).json({ error: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.userId !== userId) {
      return res.status(403: any).json({ error: 'Not authorized to modify this notification' });
    }
    
    // Mark as read
    await db.update(workflowNotifications: any)
      .set({ isRead: true })
      .where(eq(workflowNotifications.id, notificationId));
      
    // @ts-ignore - Response type issue
  return res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500: any).json({ error: 'Failed to update notification' });
  }
});

// Create a new notification (admin only: any)
router.post('/workflow', isAdmin, async (req: any, res: any) => {
  try {
    const { title, message, type, contentId, contentTitle, userId } = req.body;
    
    if (!title || !message || !type || !userId) {
      return res.status(400: any).json({ error: 'Missing required fields' });
    }
    
    const notification = await db.insert(workflowNotifications: any)
      .values({
        title,
        message,
        type,
        contentId,
        contentTitle,
        userId,
        isRead: false
      })
      .returning();
      
    return res.status(201: any).json(notification[0]);
  } catch (error: any) {
    console.error('Error creating workflow notification:', error);
    return res.status(500: any).json({ error: 'Failed to create notification' });
  }
});

export default router;