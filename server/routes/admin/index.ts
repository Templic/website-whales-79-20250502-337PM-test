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

// Apply admin authentication to all routes
router.use(requireAdmin);

// Mount all admin routes
router.use('/', statsRoutes);
router.use('/', userManagementRoutes);
router.use('/', contentManagementRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/shop', shopManagementRoutes);
router.use('/security', securitySettingsRoutes);
router.use('/media', mediaManagementRoutes);

export default router;