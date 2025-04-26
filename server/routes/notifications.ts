import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { pgTable, serial, text, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { isAdmin, isAuthenticated } from '../middleware/auth';

// Define workflowNotifications locally since it's not in shared/schema.ts
const workflowNotifications = pgTable('workflow_notifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  contentId: integer('content_id'),
  contentTitle: text('content_title'),
  userId: integer('user_id').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

const router = express.Router();

// Get all workflow notifications
router.get('/workflow', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get notifications for the current user
    const notifications = await db.select()
      .from(workflowNotifications)
      .where(eq(workflowNotifications.userId, userId))
      .orderBy(desc(workflowNotifications.createdAt))
      .limit(20);
    
    // @ts-ignore - Response type issue
  return res.json(notifications);
  } catch (error) {
    console.error('Error fetching workflow notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/workflow/:id/read', isAuthenticated, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Find notification
    const [notification] = await db.select()
      .from(workflowNotifications)
      .where(eq(workflowNotifications.id, notificationId))
      .limit(1);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this notification' });
    }
    
    // Mark as read
    await db.update(workflowNotifications)
      .set({ isRead: true })
      .where(eq(workflowNotifications.id, notificationId));
      
    // @ts-ignore - Response type issue
  return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Create a new notification (admin only)
router.post('/workflow', isAdmin, async (req, res) => {
  try {
    const { title, message, type, contentId, contentTitle, userId } = req.body;
    
    if (!title || !message || !type || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const notification = await db.insert(workflowNotifications)
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
      
    return res.status(201).json(notification[0]);
  } catch (error) {
    console.error('Error creating workflow notification:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;