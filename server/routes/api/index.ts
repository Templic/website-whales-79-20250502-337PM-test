/**
 * API Routes
 * 
 * Main API router that organizes all API endpoints by category.
 */

import { Router } from 'express';
import securityRouter from './security';

const router = Router();

// Security routes
router.use('/security', securityRouter);

export default router;