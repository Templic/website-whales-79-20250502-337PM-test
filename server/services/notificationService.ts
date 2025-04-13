import { db } from '../db';
import { workflowNotifications, users } from '../../shared/schema';
import { eq, and, desc, gt, SQL } from 'drizzle-orm';

// Types
export interface NotificationInput {
  userId: number;
  type: string;
  message: string;
  relatedItemId?: number | null;
  relatedItemType?: string | null;
}

export interface NotificationPreferencesInput {
  userId: number;
  contentApproval?: boolean;
  contentPublished?: boolean;
  contentExpiring?: boolean;
  systemAlerts?: boolean;
  emailNotifications?: boolean;
}

// Notification service
export const notificationService = {
  // Create a new notification
  async createNotification(data: NotificationInput) {
    try {
      // Check if user has preferences to receive this type of notification
      const shouldSend = await this.shouldSendNotification(data.userId, data.type);
      
      if (!shouldSend) {
        return null; // Skip notifications based on user preferences
      }
      
      const [newNotification] = await db
        .insert(workflowNotifications)
        .values({
          userId: data.userId,
          type: data.type,
          title: data.message, // Use title field for message
          message: data.message,
          contentId: data.relatedItemId,
          contentTitle: data.relatedItemType,
          isRead: false,
          createdAt: new Date(),
        })
        .returning();

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  },

  // Get notifications for a user
  async getUserNotifications(userId: number, options: { limit?: number; includeRead?: boolean } = {}) {
    try {
      let query = db
        .select()
        .from(workflowNotifications)
        .where(eq(workflowNotifications.userId, userId))
        .orderBy(desc(workflowNotifications.createdAt));

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (!options.includeRead) {
        query = query.where(eq(workflowNotifications.isRead, false));
      }

      const results = await query.execute();
      return results;
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      throw new Error('Failed to fetch notifications');
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: number, userId: number) {
    try {
      const [updated] = await db
        .update(workflowNotifications)
        .set({ isRead: true })
        .where(
          and(
            eq(workflowNotifications.id, notificationId),
            eq(workflowNotifications.userId, userId)
          )
        )
        .returning();

      return updated;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw new Error('Failed to mark notification as read');
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number) {
    try {
      const result = await db
        .update(workflowNotifications)
        .set({ isRead: true })
        .where(
          and(
            eq(workflowNotifications.userId, userId),
            eq(workflowNotifications.isRead, false)
          )
        );

      return true;
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw new Error('Failed to mark all notifications as read');
    }
  },

  // Get notification count for a user
  async getUnreadCount(userId: number) {
    try {
      const result = await db
        .select({ count: sql`count(*)` })
        .from(workflowNotifications)
        .where(
          and(
            eq(workflowNotifications.userId, userId),
            eq(workflowNotifications.isRead, false)
          )
        )
        .execute();

      return parseInt(result[0].count.toString(), 10);
    } catch (error) {
      console.error(`Error getting unread count for user ${userId}:`, error);
      throw new Error('Failed to get notification count');
    }
  },

  // Get or create notification preferences
  async getOrCreatePreferences(userId: number) {
    try {
      // Check if preferences exist
      const existing = await db
        .select()
        .from(workflowPreferences)
        .where(eq(workflowPreferences.userId, userId))
        .limit(1)
        .execute();

      if (existing.length > 0) {
        return existing[0];
      }

      // Create default preferences
      const [newPreferences] = await db
        .insert(workflowPreferences)
        .values({
          userId,
          contentApproval: true,
          contentPublished: true,
          contentExpiring: true,
          systemAlerts: true,
          emailNotifications: false,
          updatedAt: new Date(),
        })
        .returning();

      return newPreferences;
    } catch (error) {
      console.error(`Error getting/creating notification preferences for user ${userId}:`, error);
      throw new Error('Failed to get notification preferences');
    }
  },

  // Update notification preferences
  async updatePreferences(userId: number, data: NotificationPreferencesInput) {
    try {
      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.contentApproval !== undefined) updateData.contentApproval = data.contentApproval;
      if (data.contentPublished !== undefined) updateData.contentPublished = data.contentPublished;
      if (data.contentExpiring !== undefined) updateData.contentExpiring = data.contentExpiring;
      if (data.systemAlerts !== undefined) updateData.systemAlerts = data.systemAlerts;
      if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;

      // Check if preferences exist
      const existing = await db
        .select()
        .from(workflowPreferences)
        .where(eq(workflowPreferences.userId, userId))
        .limit(1)
        .execute();

      if (existing.length > 0) {
        // Update existing preferences
        const [updated] = await db
          .update(workflowPreferences)
          .set(updateData)
          .where(eq(workflowPreferences.userId, userId))
          .returning();

        return updated;
      } else {
        // Create new preferences
        const [newPreferences] = await db
          .insert(workflowPreferences)
          .values({
            userId,
            contentApproval: data.contentApproval ?? true,
            contentPublished: data.contentPublished ?? true,
            contentExpiring: data.contentExpiring ?? true,
            systemAlerts: data.systemAlerts ?? true,
            emailNotifications: data.emailNotifications ?? false,
            updatedAt: new Date(),
          })
          .returning();

        return newPreferences;
      }
    } catch (error) {
      console.error(`Error updating notification preferences for user ${userId}:`, error);
      throw new Error('Failed to update notification preferences');
    }
  },

  // Helper function to check if a notification should be sent based on user preferences
  async shouldSendNotification(userId: number, notificationType: string): Promise<boolean> {
    try {
      // Get user preferences
      const prefs = await this.getOrCreatePreferences(userId);
      
      // Default to true if we can't determine
      if (!prefs) return true;
      
      // Check notification type against preferences
      switch (notificationType) {
        case 'approval_request':
          return prefs.contentApproval;
        case 'content_approved':
        case 'content_rejected':
        case 'content_published':
          return prefs.contentPublished;
        case 'content_expiring':
          return prefs.contentExpiring;
        case 'system_alert':
          return prefs.systemAlerts;
        default:
          return true; // Default to sending for unknown types
      }
    } catch (error) {
      console.error(`Error checking notification preferences:`, error);
      return true; // Default to sending on error
    }
  }
};

export default notificationService;