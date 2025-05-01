/**
 * Admin API Routes Index
 * 
 * Combines all admin-related API routes
 */
import express from 'express';
import statsRoutes from './admin-stats';
import userManagementRoutes from './user-management';
import contentManagementRoutes from './content-management';
import notificationsRoutes from './notifications';
import shopManagementRoutes from './shop-management';
import securitySettingsRoutes from './security-settings';
import mediaManagementRoutes from './media-management';
import postsRoutes from './posts-routes';

const router = express.Router();

// Add type interface to properly type Express.User
import { User } from '@shared/schema';

// Extend Express Request interface
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: string;
    }
  }
}

// Authentication middleware for admin-only access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  
  next();
};

// Apply admin authentication to all routes
router.use((req, res, next) => requireAdmin(req, res, next));

// Mount all admin routes
router.use('/', statsRoutes);
router.use('/', userManagementRoutes);
router.use('/', contentManagementRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/shop', shopManagementRoutes);
router.use('/security', securitySettingsRoutes);
router.use('/media', mediaManagementRoutes);
router.use('/posts', postsRoutes);

export default router;