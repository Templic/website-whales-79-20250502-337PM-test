/**
 * Admin statistics API routes
 * 
 * Provides endpoints for retrieving aggregate statistics for the admin dashboard
 */
import express from 'express';
import { db } from '../../db';
import { count, sql, eq } from 'drizzle-orm';
import { 
  users, 
  posts, 
  comments, 
  products, 
  subscribers, 
  newsletters,
  orders,
  contentItems,
  typeScriptErrors,
  themes
} from '../../../shared/schema';

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
 * GET /api/admin/stats
 * 
 * Retrieve aggregate statistics for the admin dashboard
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get total users count
    const [userCount] = await db.select({ count: count() }).from(users);
    
    // Get user roles distribution
    const userRoles = await db.select({
      role: users.role,
      count: count()
    })
    .from(users)
    .groupBy(users.role);

    // Create a map of role counts
    const roleCountMap: Record<string, number> = {
      user: 0,
      admin: 0,
      super_admin: 0
    };

    userRoles.forEach(role => {
      if (role.role) {
        roleCountMap[role.role] = role.count;
      }
    });

    // Get total posts count
    const [postCount] = await db.select({ count: count() }).from(posts);
    
    // Get total products count
    const [productCount] = await db.select({ count: count() }).from(products);
    
    // Get pending reviews count (unapproved content)
    const [pendingPosts] = await db.select({ count: count() })
      .from(posts)
      .where(eq(posts.approved, false));
    
    const [pendingComments] = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.approved, false));
    
    // Calculate approval rate (if we have any reviews)
    const totalReviews = await db.select({
      approved: count(comments.approved),
      total: count()
    })
    .from(comments);
    
    let approvalRate = 0;
    if (totalReviews[0]?.total > 0) {
      approvalRate = Math.round((totalReviews[0].approved / totalReviews[0].total) * 100);
    }

    // Get new users (registered in the last 7 days)
    const [newUsers] = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`);

    // Get total music tracks (placeholder for now)
    const musicTracksCount = 0; // This should be replaced with actual count when music schema is added
    
    // Get recent activity (limited to 10 most recent actions)
    // This would typically come from an activity log table
    // For now we'll use a placeholder array
    const recentActivities = [];
    
    // Determine system health based on various metrics
    // This is a simple placeholder implementation
    const systemHealth = 'good';

    // Return all statistics
    res.json({
      totalUsers: userCount.count,
      newUsers: newUsers.count,
      activeUsers: Math.floor(userCount.count * 0.7), // Placeholder - 70% of users as active
      newRegistrations: newUsers.count,
      pendingReviews: pendingPosts.count + pendingComments.count,
      approvalRate,
      systemHealth,
      totalPosts: postCount.count,
      totalProducts: productCount.count,
      totalMusic: musicTracksCount,
      userRolesDistribution: roleCountMap,
      recentActivities: recentActivities,
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

/**
 * GET /api/admin/users/stats
 * 
 * Retrieve detailed user statistics for the admin dashboard
 */
router.get('/users/stats', requireAdmin, async (req, res) => {
  try {
    // Total users
    const [userCount] = await db.select({ count: count() }).from(users);
    
    // New users in last 7 days
    const [newUsers] = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`);
    
    // New users in last 30 days
    const [newUsers30Days] = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '30 days'`);
    
    // User roles distribution
    const userRoles = await db.select({
      role: users.role,
      count: count()
    })
    .from(users)
    .groupBy(users.role);
    
    // Format user roles for the response
    const rolesDistribution: Record<string, number> = {};
    userRoles.forEach(role => {
      if (role.role) {
        rolesDistribution[role.role] = role.count;
      }
    });
    
    res.json({
      totalUsers: userCount.count,
      newUsers7Days: newUsers.count,
      newUsers30Days: newUsers30Days.count,
      rolesDistribution
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

/**
 * GET /api/admin/content/stats
 * 
 * Retrieve detailed content statistics for the admin dashboard
 */
router.get('/content/stats', requireAdmin, async (req, res) => {
  try {
    // Total posts
    const [postCount] = await db.select({ count: count() }).from(posts);
    
    // Published posts
    const [publishedPosts] = await db.select({ count: count() })
      .from(posts)
      .where(eq(posts.published, true));
    
    // Pending posts (not approved)
    const [pendingPosts] = await db.select({ count: count() })
      .from(posts)
      .where(eq(posts.approved, false));
    
    // Total comments
    const [commentCount] = await db.select({ count: count() }).from(comments);
    
    // Pending comments (not approved)
    const [pendingComments] = await db.select({ count: count() })
      .from(comments)
      .where(eq(comments.approved, false));
    
    res.json({
      totalPosts: postCount.count,
      publishedPosts: publishedPosts.count,
      pendingPosts: pendingPosts.count,
      totalComments: commentCount.count,
      pendingComments: pendingComments.count
    });
  } catch (error) {
    console.error('Error fetching content statistics:', error);
    res.status(500).json({ error: 'Failed to fetch content statistics' });
  }
});

/**
 * GET /api/admin/shop/stats
 * 
 * Retrieve detailed shop statistics for the admin dashboard
 */
router.get('/shop/stats', requireAdmin, async (req, res) => {
  try {
    // Total products
    const [productCount] = await db.select({ count: count() }).from(products);
    
    // Total orders
    const [orderCount] = await db.select({ count: count() }).from(orders);
    
    // Recent orders (last 7 days)
    const [recentOrders] = await db.select({ count: count() })
      .from(orders)
      .where(sql`${orders.createdAt} >= NOW() - INTERVAL '7 days'`);
    
    // Orders by status
    const ordersByStatus = await db.select({
      status: orders.status,
      count: count()
    })
    .from(orders)
    .groupBy(orders.status);
    
    // Format order status for the response
    const statusDistribution: Record<string, number> = {};
    ordersByStatus.forEach(status => {
      if (status.status) {
        statusDistribution[status.status] = status.count;
      }
    });
    
    res.json({
      totalProducts: productCount.count,
      totalOrders: orderCount.count,
      recentOrders: recentOrders.count,
      ordersByStatus: statusDistribution
    });
  } catch (error) {
    console.error('Error fetching shop statistics:', error);
    res.status(500).json({ error: 'Failed to fetch shop statistics' });
  }
});

export default router;