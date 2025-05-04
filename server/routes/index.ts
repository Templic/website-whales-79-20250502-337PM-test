/**
 * Main Router
 * 
 * Configures and exports the main Express router with all route handlers.
 */

import { Router } from 'express';
import apiRouter from './api';
import { createUnifiedRateLimit } from '../middleware/unifiedRateLimit';

const router = Router();

// Apply global rate limiting to all routes
router.use(createUnifiedRateLimit({
  tier: 'global',
  blockingEnabled: true,
  logViolations: true
}));

// Apply appropriate rate limiting to specific API routes
router.use('/api/auth', createUnifiedRateLimit({ tier: 'auth' }));
router.use('/api/admin', createUnifiedRateLimit({ tier: 'admin' }));
router.use('/api/security', createUnifiedRateLimit({ tier: 'security' }));
router.use('/api', createUnifiedRateLimit({ tier: 'api' }));

// Register API routes
router.use('/api', apiRouter);

export default router;