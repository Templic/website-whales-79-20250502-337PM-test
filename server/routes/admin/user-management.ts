/**
 * Admin User Management API Routes
 * 
 * Provides endpoints for managing users from the admin panel
 */
import express from 'express';
import { db } from '../../db';
import { storage } from '../../storage';
import { users } from '../../../shared/schema';
import { eq, desc, asc, sql, like } from 'drizzle-orm';

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
 * GET /api/admin/users
 * 
 * Retrieve all users with pagination and filtering
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    
    // Build the query
    let query = db.select().from(users);
    
    // Apply filters
    if (role) {
      query = query.where(eq(users.role, role));
    }
    
    if (search) {
      query = query.where(
        sql`lower(${users.username}) LIKE lower(${'%' + search + '%'}) OR 
            lower(${users.email}) LIKE lower(${'%' + search + '%'}) OR
            lower(${users.firstName}) LIKE lower(${'%' + search + '%'}) OR
            lower(${users.lastName}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(() => {
        const conditions = [];
        if (role) conditions.push(eq(users.role, role));
        if (search) {
          conditions.push(
            sql`lower(${users.username}) LIKE lower(${'%' + search + '%'}) OR 
                lower(${users.email}) LIKE lower(${'%' + search + '%'}) OR
                lower(${users.firstName}) LIKE lower(${'%' + search + '%'}) OR
                lower(${users.lastName}) LIKE lower(${'%' + search + '%'})`
          );
        }
        return conditions.length > 0 ? sql.and(...conditions) : undefined;
      });
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(users.createdAt));
    } else if (sortField === 'username') {
      query = query.orderBy(sortOrder(users.username));
    } else if (sortField === 'email') {
      query = query.orderBy(sortOrder(users.email));
    } else if (sortField === 'role') {
      query = query.orderBy(sortOrder(users.role));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const usersList = await query;
    
    // Return users with pagination metadata
    res.json({
      users: usersList,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * 
 * Retrieve a specific user by ID
 */
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(`Error fetching user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * 
 * Update a user's role
 */
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    // Validate role
    if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // @ts-ignore: req.user.role might not exist in the type definition
    const currentUserRole = req.user?.role;
    
    // Super admin role can only be assigned by another super admin
    if (role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can assign super admin role' });
    }
    
    const updatedUser = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser[0]);
  } catch (error) {
    console.error(`Error updating role for user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * PUT /api/admin/users/:id/ban
 * 
 * Ban or unban a user
 */
router.put('/users/:id/ban', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBanned } = req.body;
    
    if (typeof isBanned !== 'boolean') {
      return res.status(400).json({ error: 'isBanned field must be a boolean' });
    }
    
    // Cannot ban super admins
    const [userToUpdate] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userToUpdate.role === 'super_admin') {
      return res.status(403).json({ error: 'Super admins cannot be banned' });
    }
    
    const updatedUser = await db
      .update(users)
      .set({ isBanned, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    res.json(updatedUser[0]);
  } catch (error) {
    console.error(`Error updating ban status for user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update user ban status' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * 
 * Delete a user (super admin only)
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Only super admins can delete users
    // @ts-ignore: req.user.role might not exist in the type definition
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete users' });
    }
    
    // Check if user exists
    const [userToDelete] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Cannot delete super admins
    if (userToDelete.role === 'super_admin') {
      return res.status(403).json({ error: 'Super admin users cannot be deleted' });
    }
    
    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * POST /api/admin/users/export
 * 
 * Export users to CSV
 */
router.post('/users/export', requireAdmin, async (req, res) => {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Create CSV header
    const header = ['ID', 'Username', 'Email', 'Role', 'First Name', 'Last Name', 'Created At', 'Last Login'];
    
    // Create CSV rows
    const rows = allUsers.map(user => [
      user.id,
      user.username,
      user.email || '',
      user.role,
      user.firstName || '',
      user.lastName || '',
      user.createdAt ? new Date(user.createdAt).toISOString() : '',
      user.lastLogin ? new Date(user.lastLogin).toISOString() : ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    
    // Return CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

export default router;