import { db } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { logger } from '../logger';

/**
 * Interface for notification payload
 */
export interface NotificationPayload {
  type: 'content_scheduled' | 'content_published' | 'review_requested' | 'changes_requested' | 
        'content_approved' | 'content_rejected' | 'expiration_warning' | 'content_expired' |
        'security_alert' | 'system_message';
  userId: number | null;
  contentId?: number;
  contentTitle?: string;
  message: string;
  actionRequired?: boolean;
  dueDate?: Date | null;
}

/**
 * Send a notification to a user or all users
 * @param payload The notification data
 * @returns The created notification ID or undefined if it failed
 */
export async function sendNotification(payload: NotificationPayload): Promise<number | undefined> {
  try {
    logger.info(`Sending notification of type ${payload.type}`);
    
    // Handle system notifications (to all admins)
    if (payload.userId === null) {
      // Get all admin users
      const adminUsers = await db.execute(
        sql`SELECT id FROM users WHERE role = 'admin' OR role = 'super_admin'`
      );
      
      const notificationIds: number[] = [];
      
      // Create notification for each admin
      if (adminUsers && Array.isArray(adminUsers.rows)) {
        for (const user of adminUsers.rows) {
          const [notification] = await db.execute(
            sql`INSERT INTO notifications (type, user_id, content_id, content_title, message, created_at, is_read, action_required, due_date) VALUES (
              ${payload.type}, 
              ${user.id}, 
              ${payload.contentId || null}, 
              ${payload.contentTitle || null}, 
              ${payload.message}, 
              NOW(), 
              false, 
              ${payload.actionRequired || false}, 
              ${payload.dueDate || null}
            ) RETURNING id`
          );
          
          if (notification && notification.id) {
            notificationIds.push(notification.id);
          }
        }
      }
      
      logger.info(`Sent system notification to ${notificationIds.length} admin users`);
      return notificationIds.length > 0 ? notificationIds[0] : undefined;
    } else {
      // Send to specific user
      const [notification] = await db.execute(
        sql`INSERT INTO notifications (type, user_id, content_id, content_title, message, created_at, is_read, action_required, due_date) VALUES (
          ${payload.type}, 
          ${payload.userId}, 
          ${payload.contentId || null}, 
          ${payload.contentTitle || null}, 
          ${payload.message}, 
          NOW(), 
          false, 
          ${payload.actionRequired || false}, 
          ${payload.dueDate || null}
        ) RETURNING id`
      );
      
      logger.info(`Sent notification to user ${payload.userId}`);
      return notification?.id;
    }
  } catch (error) {
    logger.error('Error sending notification:', error);
    return undefined;
  }
}

/**
 * Mark a notification as read
 * @param id The notification ID
 * @returns Whether the operation was successful
 */
export async function markNotificationAsRead(id: number): Promise<boolean> {
  try {
    await db.execute(
      sql`UPDATE notifications SET is_read = true WHERE id = ${id}`
    );
    
    logger.info(`Marked notification ${id} as read`);
    return true;
  } catch (error) {
    logger.error(`Error marking notification ${id} as read:`, error);
    return false;
  }
}

/**
 * Mark all notifications for a user as read
 * @param userId The user ID
 * @returns Whether the operation was successful
 */
export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  try {
    await db.execute(
      sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId}`
    );
    
    logger.info(`Marked all notifications for user ${userId} as read`);
    return true;
  } catch (error) {
    logger.error(`Error marking all notifications as read for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get unread notification count for a user
 * @param userId The user ID
 * @returns The number of unread notifications
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) FROM notifications WHERE user_id = ${userId} AND is_read = false`
    );
    
    if (result && result.rows && result.rows.length > 0) {
      return parseInt(result.rows[0].count, 10);
    }
    
    return 0;
  } catch (error) {
    logger.error(`Error getting unread notification count for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Delete old notifications
 * @param olderThan Age in days (default: 30)
 * @returns Number of deleted notifications
 */
export async function purgeOldNotifications(olderThan: number = 30): Promise<number> {
  try {
    const result = await db.execute(
      sql`DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '${olderThan} days' RETURNING id`
    );
    
    const count = result && result.rows ? result.rows.length : 0;
    logger.info(`Purged ${count} notifications older than ${olderThan} days`);
    
    return count;
  } catch (error) {
    logger.error(`Error purging old notifications:`, error);
    return 0;
  }
}