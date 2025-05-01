/**
 * Admin Notifications API Routes
 * 
 * Provides endpoints for managing system notifications in the admin panel
 */
import express from 'express';
import { db } from '../../db';
import { 
  systemNotifications, 
  userNotifications,
  users 
} from '../../../shared/schema';
import { eq, and, desc, asc, sql, like, not, gt, lt, isNotNull, isNull } from 'drizzle-orm';

const router = express.Router();

// Authentication middleware for admin-only access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // @ts-ignore: User role property should exist
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  
  next();
};

/**
 * GET /api/admin/notifications/system
 * 
 * Retrieve all system notifications with pagination and filtering
 */
router.get('/system', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const search = req.query.search as string | undefined;
    const priority = req.query.priority as string | undefined;
    const category = req.query.category as string | undefined;
    
    // Build the query
    let query = db.select().from(systemNotifications);
    
    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        sql`lower(${systemNotifications.title}) LIKE lower(${'%' + search + '%'}) OR 
            lower(${systemNotifications.content}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    if (priority) {
      conditions.push(eq(systemNotifications.priority, priority));
    }
    
    if (category) {
      conditions.push(eq(systemNotifications.category, category));
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemNotifications)
      .where(() => conditions.length > 0 ? sql.and(...conditions) : undefined);
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(systemNotifications.createdAt));
    } else if (sortField === 'title') {
      query = query.orderBy(sortOrder(systemNotifications.title));
    } else if (sortField === 'category') {
      query = query.orderBy(sortOrder(systemNotifications.category));
    } else if (sortField === 'priority') {
      query = query.orderBy(sortOrder(systemNotifications.priority));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const notifications = await query;
    
    // Return notifications with pagination metadata
    res.json({
      notifications,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    res.status(500).json({ error: 'Failed to fetch system notifications' });
  }
});

/**
 * POST /api/admin/notifications/system
 * 
 * Create a new system notification
 */
router.post('/system', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      priority,
      type,
      actionUrl,
      startDate,
      endDate,
      allUsers,
      userRoles
    } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Create the notification
    const [notification] = await db.insert(systemNotifications)
      .values({
        title,
        content,
        category: category || 'general',
        priority: priority || 'normal',
        type: type || 'info',
        actionUrl: actionUrl || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        createdAt: new Date(),
        createdBy: req.user?.id || null,
        active: true
      })
      .returning();
    
    // If notification is for all users or specific roles, create user notifications
    if (allUsers || (userRoles && userRoles.length > 0)) {
      let usersQuery = db.select().from(users);
      
      // Filter by roles if specified
      if (!allUsers && userRoles && userRoles.length > 0) {
        usersQuery = usersQuery.where(sql`${users.role} IN (${userRoles.join(', ')})`);
      }
      
      const targetUsers = await usersQuery;
      
      // Create a user notification for each user
      if (targetUsers.length > 0) {
        const userNotificationsValues = targetUsers.map(user => ({
          userId: user.id,
          title,
          content,
          category: category || 'general',
          priority: priority || 'normal',
          type: type || 'info',
          actionUrl: actionUrl || null,
          systemNotificationId: notification.id,
          isRead: false,
          createdAt: new Date()
        }));
        
        await db.insert(userNotifications).values(userNotificationsValues);
      }
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({ error: 'Failed to create system notification' });
  }
});

/**
 * GET /api/admin/notifications/system/:id
 * 
 * Retrieve a specific system notification by ID
 */
router.get('/system/:id', requireAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const [notification] = await db
      .select()
      .from(systemNotifications)
      .where(eq(systemNotifications.id, notificationId));
    
    if (!notification) {
      return res.status(404).json({ error: 'System notification not found' });
    }
    
    // Get user notifications related to this system notification
    const userNotificationStats = await db
      .select({
        total: sql<number>`count(*)`,
        read: sql<number>`sum(case when ${userNotifications.isRead} = true then 1 else 0 end)`,
      })
      .from(userNotifications)
      .where(eq(userNotifications.systemNotificationId, notificationId));
    
    res.json({
      ...notification,
      stats: {
        totalDelivered: userNotificationStats[0]?.total || 0,
        totalRead: userNotificationStats[0]?.read || 0
      }
    });
  } catch (error) {
    console.error(`Error fetching system notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch system notification' });
  }
});

/**
 * PUT /api/admin/notifications/system/:id
 * 
 * Update a system notification
 */
router.put('/system/:id', requireAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const {
      title,
      content,
      category,
      priority,
      type,
      actionUrl,
      startDate,
      endDate,
      active
    } = req.body;
    
    // Validate at least one field to update
    if (!(title || content || category || priority || type || actionUrl || startDate || endDate || active !== undefined)) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }
    
    // Create update object with only provided fields
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (type !== undefined) updates.type = type;
    if (actionUrl !== undefined) updates.actionUrl = actionUrl;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (active !== undefined) updates.active = active;
    
    // Update the notification
    const [updatedNotification] = await db
      .update(systemNotifications)
      .set(updates)
      .where(eq(systemNotifications.id, notificationId))
      .returning();
    
    if (!updatedNotification) {
      return res.status(404).json({ error: 'System notification not found' });
    }
    
    // Update corresponding user notifications if title or content has changed
    if (title !== undefined || content !== undefined) {
      const userUpdates: Record<string, any> = {};
      if (title !== undefined) userUpdates.title = title;
      if (content !== undefined) userUpdates.content = content;
      
      await db
        .update(userNotifications)
        .set(userUpdates)
        .where(eq(userNotifications.systemNotificationId, notificationId));
    }
    
    res.json(updatedNotification);
  } catch (error) {
    console.error(`Error updating system notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update system notification' });
  }
});

/**
 * DELETE /api/admin/notifications/system/:id
 * 
 * Delete a system notification
 */
router.delete('/system/:id', requireAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    // Delete related user notifications first
    await db
      .delete(userNotifications)
      .where(eq(userNotifications.systemNotificationId, notificationId));
    
    // Then delete the system notification
    await db
      .delete(systemNotifications)
      .where(eq(systemNotifications.id, notificationId));
    
    res.json({ success: true, message: 'System notification deleted successfully' });
  } catch (error) {
    console.error(`Error deleting system notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete system notification' });
  }
});

/**
 * GET /api/admin/notifications/user
 * 
 * Retrieve all user notifications with pagination and filtering
 */
router.get('/user', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const userId = req.query.userId as string | undefined;
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
    const search = req.query.search as string | undefined;
    
    // Build the query
    let query = db.select({
      ...userNotifications,
      username: users.username
    }).from(userNotifications)
      .leftJoin(users, eq(userNotifications.userId, users.id));
    
    // Apply filters
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(userNotifications.userId, userId));
    }
    
    if (isRead !== undefined) {
      conditions.push(eq(userNotifications.isRead, isRead));
    }
    
    if (search) {
      conditions.push(
        sql`lower(${userNotifications.title}) LIKE lower(${'%' + search + '%'}) OR 
            lower(${userNotifications.content}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .where(() => conditions.length > 0 ? sql.and(...conditions) : undefined);
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(userNotifications.createdAt));
    } else if (sortField === 'title') {
      query = query.orderBy(sortOrder(userNotifications.title));
    } else if (sortField === 'username') {
      query = query.orderBy(sortOrder(users.username));
    } else if (sortField === 'isRead') {
      query = query.orderBy(sortOrder(userNotifications.isRead));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const notifications = await query;
    
    // Return notifications with pagination metadata
    res.json({
      notifications,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: 'Failed to fetch user notifications' });
  }
});

/**
 * GET /api/admin/notifications/stats
 * 
 * Get notification statistics for the admin dashboard
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Count active system notifications
    const [activeSystemNotifications] = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemNotifications)
      .where(eq(systemNotifications.active, true))
      .where(
        sql`${systemNotifications.startDate} <= CURRENT_TIMESTAMP AND 
            (${systemNotifications.endDate} IS NULL OR ${systemNotifications.endDate} >= CURRENT_TIMESTAMP)`
      );
    
    // Count notifications by priority
    const notificationsByPriority = await db
      .select({
        priority: systemNotifications.priority,
        count: sql<number>`count(*)`
      })
      .from(systemNotifications)
      .where(eq(systemNotifications.active, true))
      .groupBy(systemNotifications.priority);
    
    // Format priority counts
    const priorityCount: Record<string, number> = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0
    };
    
    notificationsByPriority.forEach(item => {
      if (item.priority) {
        priorityCount[item.priority] = item.count;
      }
    });
    
    // Count read vs unread user notifications
    const [userNotificationStats] = await db
      .select({
        total: sql<number>`count(*)`,
        read: sql<number>`sum(case when ${userNotifications.isRead} = true then 1 else 0 end)`,
        unread: sql<number>`sum(case when ${userNotifications.isRead} = false then 1 else 0 end)`
      })
      .from(userNotifications);
    
    // Count notifications created in the last 7 days
    const [recentNotifications] = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemNotifications)
      .where(sql`${systemNotifications.createdAt} >= CURRENT_TIMESTAMP - INTERVAL '7 days'`);
    
    res.json({
      activeSystemNotifications: activeSystemNotifications.count,
      notificationsByPriority: priorityCount,
      userNotifications: {
        total: userNotificationStats.total || 0,
        read: userNotificationStats.read || 0,
        unread: userNotificationStats.unread || 0
      },
      recentNotifications: recentNotifications.count
    });
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

export default router;