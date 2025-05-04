/**
 * Security API Routes
 * 
 * Centralized router for all security-related API endpoints.
 */

import { Router } from 'express';
import rateLimitRouter from './rateLimit';

const router = Router();

// Rate limiting endpoints
router.use('/rate-limit', rateLimitRouter);

export default router;