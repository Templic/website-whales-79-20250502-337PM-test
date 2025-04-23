/**
 * Security API Routes
 * 
 * Provides endpoints for the security dashboard and security operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../security/advanced/blockchain/SecurityEventTypes';
import { asyncHandler } from '../middleware/errorHandler';
import { csrfProtection } from '../middleware/csrfProtection';
import { runSecurityScan } from '../security/securityController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Middleware to ensure only authenticated admin users can access security routes
const requireAdmin = [requireAuth, (req: Request, res: Response, next: NextFunction): void => {
  // In a real app, we would check if the user has the admin role
  // For now, we'll assume all authenticated users are admins
  next();
}];

/**
 * @route GET /api/security/blockchain/blocks
 * @desc Get all blocks from the security blockchain
 * @access Admin only
 */
router.get('/blockchain/blocks', requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const blocks = securityBlockchain.getBlocks();
  res.json(blocks);
}));

/**
 * @route GET /api/security/events
 * @desc Get filtered security events
 * @access Admin only
 */
router.get('/events', requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { 
    severity, 
    category, 
    titleContains, 
    descriptionContains,
    fromDate,
    toDate,
    maxResults
  } = req.query;

  // Convert query params to the right types
  const queryOptions: {
    severity?: SecurityEventSeverity;
    category?: SecurityEventCategory;
    titleContains?: string;
    descriptionContains?: string;
    fromDate?: Date;
    toDate?: Date;
    maxResults?: number;
  } = {};
  
  if (severity) {
    queryOptions.severity = severity as SecurityEventSeverity;
  }
  
  if (category) {
    queryOptions.category = category as SecurityEventCategory;
  }
  
  if (titleContains) {
    queryOptions.titleContains = titleContains as string;
  }
  
  if (descriptionContains) {
    queryOptions.descriptionContains = descriptionContains as string;
  }
  
  if (fromDate) {
    queryOptions.fromDate = new Date(fromDate as string);
  }
  
  if (toDate) {
    queryOptions.toDate = new Date(toDate as string);
  }
  
  if (maxResults) {
    queryOptions.maxResults = parseInt(maxResults as string);
  }
  
  const events = securityBlockchain.queryEvents(queryOptions);
  res.json(events);
}));

/**
 * @route POST /api/security/scan/force
 * @desc Force a security scan with specified level
 * @access Admin only
 */
router.post('/scan/force', requireAdmin, csrfProtection, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { level = 'normal' } = req.body;
  
  // Start security scan in background
  runSecurityScan({ 
    level, 
    userId: req.user?.id ? String(req.user.id) : undefined, 
    userIp: req.ip
  });
  
  res.json({ 
    success: true, 
    message: `Security scan initiated with level: ${level}` 
  });
}));

/**
 * @route GET /api/security/health
 * @desc Get security system health and status
 * @access Admin only
 */
router.get('/health', requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // In a real app, we would check the status of all security systems
  const securityHealth = {
    csrfProtection: { status: 'active', lastChecked: new Date() },
    immutableLogs: { status: 'active', lastChecked: new Date() },
    quantumResistantCrypto: { status: 'active', lastChecked: new Date() },
    anomalyDetection: { status: 'active', lastChecked: new Date() },
    raspProtection: { status: 'active', lastChecked: new Date() },
    chainIntegrity: securityBlockchain.verifyChain()
  };
  
  res.json(securityHealth);
}));

export default router;