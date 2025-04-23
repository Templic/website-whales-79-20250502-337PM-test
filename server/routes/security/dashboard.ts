/**
 * Security Dashboard API Routes
 * 
 * This file contains the API routes for the security dashboard.
 */

import { Router, Request, Response } from 'express';
import { immutableSecurityLogs as securityBlockchain } from '../../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../../security/advanced/blockchain/SecurityEventTypes';
import { securityScanner, SecurityScanType } from '../../security/maximumSecurityScan';

export const securityDashboardRoutes = Router();

/**
 * Get security events with pagination and filtering
 * 
 * @route GET /api/security/dashboard/events
 */
securityDashboardRoutes.get('/events', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const severity = req.query.severity as SecurityEventSeverity | undefined;
    const category = req.query.category as SecurityEventCategory | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    const titleContains = req.query.titleContains as string | undefined;
    const descriptionContains = req.query.descriptionContains as string | undefined;
    
    const events = securityBlockchain.queryEvents({
      severity,
      category,
      titleContains,
      descriptionContains,
      fromDate,
      toDate,
      maxResults: page * limit
    }).slice((page - 1) * limit, page * limit);
    
    const total = securityBlockchain.queryEvents({
      severity,
      category,
      titleContains,
      descriptionContains,
      fromDate,
      toDate
    }).length;
    
    return res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch security events'
    });
  }
});

/**
 * Get a specific security event by ID
 * 
 * @route GET /api/security/dashboard/events/:id
 */
securityDashboardRoutes.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // In this stub implementation, just return a mock event
    return res.json({
      id,
      severity: SecurityEventSeverity.MEDIUM,
      category: SecurityEventCategory.API_SECURITY,
      title: 'Mock Security Event',
      description: 'This is a mock security event',
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`Error fetching security event ${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch security event'
    });
  }
});

/**
 * Acknowledge a security event
 * 
 * @route POST /api/security/dashboard/events/:id/acknowledge
 */
securityDashboardRoutes.post('/events/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { acknowledgedBy } = req.body;
    
    if (!acknowledgedBy) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'acknowledgedBy is required'
      });
    }
    
    // In this stub implementation, just return a success response
    return res.json({
      success: true,
      message: `Security event ${id} acknowledged by ${acknowledgedBy}`
    });
  } catch (error) {
    console.error(`Error acknowledging security event ${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to acknowledge security event'
    });
  }
});

/**
 * Get security metrics
 * 
 * @route GET /api/security/dashboard/metrics
 */
securityDashboardRoutes.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Calculate metrics
    const eventsLast24Hours = securityBlockchain.queryEvents({
      fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }).length;
    
    const criticalEvents = securityBlockchain.queryEvents({
      severity: SecurityEventSeverity.CRITICAL
    }).length;
    
    const highEvents = securityBlockchain.queryEvents({
      severity: SecurityEventSeverity.HIGH
    }).length;
    
    const mediumEvents = securityBlockchain.queryEvents({
      severity: SecurityEventSeverity.MEDIUM
    }).length;
    
    const lowEvents = securityBlockchain.queryEvents({
      severity: SecurityEventSeverity.LOW
    }).length;
    
    const infoEvents = securityBlockchain.queryEvents({
      severity: SecurityEventSeverity.INFO
    }).length;
    
    // Event counts by category
    const categoryCounts: Record<string, number> = {};
    Object.values(SecurityEventCategory).forEach(category: string: string => {
      categoryCounts[category] = securityBlockchain.queryEvents({
        category: category as SecurityEventCategory
      }).length;
    });
    
    // Calculate daily event counts for the last 30 days
    const dailyEventCounts: Record<string, number> = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const startOfDay = new Date(dateString as string);
      const endOfDay = new Date(dateString as string);
      endOfDay.setHours(23, 59, 59, 999);
      
      dailyEventCounts[dateString] = securityBlockchain.queryEvents({
        fromDate: startOfDay,
        toDate: endOfDay
      }).length;
    }
    
    // Get blockchain statistics
    const blockchainStats = {
      blockCount: securityBlockchain.getBlocks().length,
      eventsCount: securityBlockchain.queryEvents().length,
      integrityVerified: securityBlockchain.verifyChain()
    };
    
    return res.json({
      timestamp: new Date(),
      totalEventCount: securityBlockchain.queryEvents().length,
      eventsLast24Hours,
      severityCounts: {
        critical: criticalEvents,
        high: highEvents,
        medium: mediumEvents,
        low: lowEvents,
        info: infoEvents
      },
      categoryCounts,
      dailyEventCounts,
      blockchainStats
    });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch security metrics'
    });
  }
});

/**
 * Run a security scan
 * 
 * @route POST /api/security/dashboard/scans
 */
securityDashboardRoutes.post('/scans', async (req: Request, res: Response) => {
  try {
    const { scanType = SecurityScanType.QUICK, deep = false } = req.body;
    
    // Create a new scan
    const scanId = securityScanner.createScan({
      scanType: scanType as SecurityScanType,
      deep,
      emitEvents: true,
      logFindings: true
    });
    
    // Start the scan in the background
    securityScanner.startScan(scanId).catch(error: string: string => {
      console.error(`Error running security scan ${scanId}:`, error);
    });
    
    return res.json({
      scanId,
      message: `Security scan of type ${scanType} started`,
      status: 'started'
    });
  } catch (error) {
    console.error('Error starting security scan:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start security scan'
    });
  }
});

/**
 * Get all security scans
 * 
 * @route GET /api/security/dashboard/scans
 */
securityDashboardRoutes.get('/scans', async (req: Request, res: Response) => {
  try {
    const scans = securityScanner.getAllScans();
    return res.json({ scans });
  } catch (error) {
    console.error('Error fetching security scans:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch security scans'
    });
  }
});

/**
 * Get a specific security scan by ID
 * 
 * @route GET /api/security/dashboard/scans/:id
 */
securityDashboardRoutes.get('/scans/:id', async (req: Request, res: Response) => {
  try {
    const scanId = req.params.id as string;
    const scan = securityScanner.getScan(scanId);
    
    if (!scan) {
      return res.status(404).json({
        error: 'Not found',
        message: `Security scan ${scanId} not found`
      });
    }
    
    return res.json({ scan });
  } catch (error) {
    console.error(`Error fetching security scan ${req.params.id}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch security scan'
    });
  }
});