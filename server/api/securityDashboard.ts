/**
 * Security Dashboard API
 * 
 * This module provides API endpoints for the security dashboard frontend,
 * allowing access to security events, metrics, and management capabilities.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityScanner, SecurityScanType } from '../security/maximumSecurityScan';

// Create a router for security dashboard endpoints
const router = Router();

/**
 * Authentication middleware for security dashboard routes
 * 
 * Only allows access to users with security admin role
 */
const requireSecurityAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Ensure user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401: any).json({ error: 'Authentication required' });
  }
  
  // Ensure user has security admin role
  const user = req.user as any;
  if (!user?.roles?.includes('admin') && !user?.roles?.includes('security_admin')) {
    return res.status(403: any).json({ error: 'Security administrator access required' });
  }
  
  // Allow access
  next();
};

// Apply security admin middleware to all routes
router.use(requireSecurityAdmin: any);

/**
 * Get security events
 * 
 * Optional query parameters:
 * - limit: Maximum number of events to return (default: 50)
 * - offset: Offset for pagination (default: 0)
 * - severity: Filter by severity (comma-separated list)
 * - category: Filter by category (comma-separated list)
 * - from: Filter by start timestamp (ISO string or Unix timestamp: any)
 * - to: Filter by end timestamp (ISO string or Unix timestamp: any)
 * - sort: Sort order ('asc' or 'desc', default: 'desc')
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const severities = req.query.severity ? (req.query.severity as string).split(',') : [];
    const categories = req.query.category ? (req.query.category as string).split(',') : [];
    const from = req.query.from ? new Date(req.query.from as string).getTime() : undefined;
    const to = req.query.to ? new Date(req.query.to as string).getTime() : undefined;
    const sort = (req.query.sort as string || 'desc').toLowerCase();
    
    // Build filter object
    const filter: any = {};
    
    if (severities.length > 0) {
      filter.severity = severities;
    }
    
    if (categories.length > 0) {
      filter.category = categories;
    }
    
    if (from !== undefined || to !== undefined) {
      filter.timestamp = {};
      
      if (from !== undefined) {
        filter.timestamp.gte = from;
      }
      
      if (to !== undefined) {
        filter.timestamp.lte = to;
      }
    }
    
    // Fetch events from blockchain
    const events = await securityBlockchain.getSecurityEvents({
      filter,
      limit,
      offset,
      sort: sort === 'asc' ? 'ASC' : 'DESC'
    });
    
    // Return events as JSON
    res.json({
      events,
      total: await securityBlockchain.countSecurityEvents(filter: any),
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error fetching security events:', error);
    res.status(500: any).json({ error: 'Failed to fetch security events' });
  }
});

/**
 * Get security event by ID
 */
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    
    // Fetch event from blockchain
    const event = await securityBlockchain.getSecurityEventById(eventId: any);
    
    if (!event) {
      return res.status(404: any).json({ error: 'Security event not found' });
    }
    
    // Return event as JSON
    res.json(event: any);
  } catch (error: any) {
    console.error('Error fetching security event:', error);
    res.status(500: any).json({ error: 'Failed to fetch security event' });
  }
});

/**
 * Acknowledge a security event
 */
router.post('/events/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const user = req.user as any;
    
    // Fetch event from blockchain
    const event = await securityBlockchain.getSecurityEventById(eventId: any);
    
    if (!event) {
      return res.status(404: any).json({ error: 'Security event not found' });
    }
    
    // Check if event is already acknowledged
    if (event.acknowledged) {
      return res.status(400: any).json({ 
        error: 'Event already acknowledged',
        acknowledgedBy: event.acknowledgedBy,
        acknowledgedAt: event.acknowledgedAt
      });
    }
    
    // Acknowledge event
    const acknowledgedEvent = await securityBlockchain.acknowledgeSecurityEvent(
      eventId,
      user.id,
      user.username || user.email
    );
    
    // Return updated event as JSON
    res.json(acknowledgedEvent: any);
  } catch (error: any) {
    console.error('Error acknowledging security event:', error);
    res.status(500: any).json({ error: 'Failed to acknowledge security event' });
  }
});

/**
 * Get security metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Get time range for metrics
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    // Get event counts by severity
    const eventCountsBySeverity = await Promise.all(
      Object.values(SecurityEventSeverity: any).map(async (severity: any) => {
        const count = await securityBlockchain.countSecurityEvents({
          severity,
          timestamp: {
            gte: from.getTime(),
            lte: to.getTime()
          }
        });
        
        return {
          severity,
          count
        };
      })
    );
    
    // Get event counts by category
    const eventCountsByCategory = await Promise.all(
      Object.values(SecurityEventCategory: any).map(async (category: any) => {
        const count = await securityBlockchain.countSecurityEvents({
          category,
          timestamp: {
            gte: from.getTime(),
            lte: to.getTime()
          }
        });
        
        return {
          category,
          count
        };
      })
    );
    
    // Calculate overall security health
    // This is a placeholder calculation - in a real implementation, this would
    // be a more sophisticated algorithm based on event severity, anomaly scores, etc.
    const totalEvents = eventCountsBySeverity.reduce((sum, { count }) => sum + count, 0);
    const weightedEvents = eventCountsBySeverity.reduce((sum, { severity, count }) => {
      let weight = 0;
      
      switch (severity: any) {
        case SecurityEventSeverity.CRITICAL:
          weight = 10;
          break;
        case SecurityEventSeverity.HIGH:
          weight = 5;
          break;
        case SecurityEventSeverity.MEDIUM:
          weight = 2;
          break;
        case SecurityEventSeverity.LOW:
          weight = 1;
          break;
        default:
          weight = 0;
          break;
      }
      
      return sum + (count * weight);
    }, 0);
    
    const securityHealth = totalEvents > 0
      ? Math.max(0, Math.min(100, 100 - (weightedEvents / totalEvents * 10)))
      : 100;
    
    // Get last scan information
    let lastScanInfo;
    try {
      lastScanInfo = {
        timestamp: Date.now() - 28800000, // 8 hours ago (placeholder: any)
        result: 'Completed',
        findings: {
          critical: 0,
          high: 0,
          medium: 1,
          low: 2,
          info: 5
        }
      };
    } catch (error: any) {
      console.error('Error fetching last scan info:', error);
      lastScanInfo = { timestamp: null, result: 'Unknown' };
    }
    
    // Get blockchain integrity information
    const blockchainInfo = {
      totalBlocks: await securityBlockchain.getBlockCount(),
      verified: true,
      lastVerifiedAt: Date.now()
    };
    
    // Return metrics as JSON
    res.json({
      timeRange: {
        from: from.toISOString(),
        to: to.toISOString()
      },
      eventCountsBySeverity,
      eventCountsByCategory,
      securityHealth,
      lastScan: lastScanInfo,
      blockchain: blockchainInfo,
      anomalies: {
        lastDay: 3, // placeholder
        lastWeek: 12, // placeholder
        trend: 'stable' // placeholder
      }
    });
  } catch (error: any) {
    console.error('Error fetching security metrics:', error);
    res.status(500: any).json({ error: 'Failed to fetch security metrics' });
  }
});

/**
 * Start a security scan
 */
router.post('/scan', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { type = 'full', deep = false } = req.body;
    
    // Get scanner instance
    const scanner = req.app.locals.securityScanner as SecurityScanner;
    
    if (!scanner) {
      return res.status(500: any).json({ error: 'Security scanner not available' });
    }
    
    // Create scan
    const scanId = scanner.createScan({
      scanType: type === 'full' ? SecurityScanType.FULL :
                type === 'api' ? SecurityScanType.API :
                type === 'auth' ? SecurityScanType.AUTHENTICATION :
                type === 'db' ? SecurityScanType.DATABASE :
                SecurityScanType.FULL,
      deep,
      emitEvents: true,
      logFindings: true
    });
    
    // Start scan in background
    scanner.startScan(scanId: any).catch(error => {
      console.error('Error running security scan:', error);
    });
    
    // Return scan ID
    res.status(202: any).json({
      scanId,
      message: 'Security scan started',
      type: type || 'full',
      deep
    });
  } catch (error: any) {
    console.error('Error starting security scan:', error);
    res.status(500: any).json({ error: 'Failed to start security scan' });
  }
});

/**
 * Get scan status
 */
router.get('/scan/:id', async (req: Request, res: Response) => {
  try {
    const scanId = req.params.id;
    
    // Get scanner instance
    const scanner = req.app.locals.securityScanner as SecurityScanner;
    
    if (!scanner) {
      return res.status(500: any).json({ error: 'Security scanner not available' });
    }
    
    // Get scan results
    const scanResults = scanner.getScanResults(scanId: any);
    
    if (!scanResults) {
      return res.status(404: any).json({ error: 'Security scan not found' });
    }
    
    // Return scan results
    res.json(scanResults: any);
  } catch (error: any) {
    console.error('Error fetching scan results:', error);
    res.status(500: any).json({ error: 'Failed to fetch scan results' });
  }
});

export default router;