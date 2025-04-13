import express from 'express';
import type { Request, Response } from 'express';
import { db } from './db';

const router = express.Router();

/**
 * Get all notifications for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // In a real app, you would use req.user.id to get notifications for the current user
    // For demonstration, we'll return all notifications
    const userId = req.user?.id || 1; // Default to user ID 1 if not logged in
    
    const result = await db.query(`
      SELECT 
        id, 
        type, 
        user_id as "userId", 
        content_id as "contentId", 
        content_title as "contentTitle", 
        message, 
        created_at as "createdAt", 
        is_read as "isRead", 
        action_required as "actionRequired", 
        due_date as "dueDate"
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Mark a notification as read
 */
router.post('/mark-read/:id', async (req: Request, res: Response) => {
  const notificationId = parseInt(req.params.id, 10);
  
  if (isNaN(notificationId)) {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }
  
  try {
    // In a real app, you would check that the notification belongs to the current user
    const userId = req.user?.id || 1;
    
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * Mark all notifications as read
 */
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    // In a real app, you would use req.user.id
    const userId = req.user?.id || 1;
    
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const notificationId = parseInt(req.params.id, 10);
  
  if (isNaN(notificationId)) {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }
  
  try {
    // In a real app, you would check that the notification belongs to the current user
    const userId = req.user?.id || 1;
    
    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export const notificationsRoutes = router;