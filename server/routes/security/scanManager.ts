/**
 * Security Scan Manager API
 * 
 * Provides REST API endpoints to manage security scans,
 * including starting scans, checking status, and viewing results.
 */

import express, { Request, Response, Router } from 'express';
import { log } from '../../vite';
import { 
  scheduleAllSecurityScans, 
  enqueueSecurityScan, 
  getQueueStatus,
  cancelScan,
  clearQueue
} from '../../security/securityScanQueue';

// Create router
const router: Router = express.Router();

/**
 * GET /api/security/scan/status
 * Get the status of all security scans
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = getQueueStatus();
    res.json(status);
  } catch (error) {
    log(`Error getting security scan status: ${error}`, 'security-api');
    res.status(500).json({ error: 'Failed to get security scan status' });
  }
});

/**
 * POST /api/security/scan/start
 * Start a security scan
 */
router.post('/start', (req: Request, res: Response) => {
  try {
    const { type = 'CORE', deep = true } = req.body;
    
    log(`Received request to start security scan of type ${type} (deep: ${deep})`, 'security-api');
    
    // Start scan
    const scanId = enqueueSecurityScan(type, deep);
    
    res.status(201).json({
      success: true,
      message: `Security scan of type ${type} enqueued`,
      scanId,
      status: 'queued'
    });
  } catch (error) {
    log(`Error starting security scan: ${error}`, 'security-api');
    res.status(500).json({ error: 'Failed to start security scan' });
  }
});

/**
 * POST /api/security/scan/start-all
 * Start all security scans in sequence
 */
router.post('/start-all', (req: Request, res: Response) => {
  try {
    const { deep = true } = req.body;
    
    log(`Received request to start all security scans (deep: ${deep})`, 'security-api');
    
    // Start all scans
    const scanIds = scheduleAllSecurityScans(deep);
    
    res.status(201).json({
      success: true,
      message: `All security scans enqueued (${scanIds.length} scans)`,
      scanIds,
      status: 'queued'
    });
  } catch (error) {
    log(`Error starting all security scans: ${error}`, 'security-api');
    res.status(500).json({ error: 'Failed to start all security scans' });
  }
});

/**
 * DELETE /api/security/scan/:id
 * Cancel a specific security scan
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    log(`Received request to cancel security scan ${id}`, 'security-api');
    
    // Cancel scan
    const canceled = cancelScan(id);
    
    if (canceled) {
      res.json({
        success: true,
        message: `Security scan ${id} canceled`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Security scan ${id} not found or cannot be canceled (it might be running)`
      });
    }
  } catch (error) {
    log(`Error canceling security scan: ${error}`, 'security-api');
    res.status(500).json({ error: 'Failed to cancel security scan' });
  }
});

/**
 * DELETE /api/security/scan
 * Clear the entire security scan queue
 */
router.delete('/', (req: Request, res: Response) => {
  try {
    log('Received request to clear security scan queue', 'security-api');
    
    // Clear queue
    const count = clearQueue();
    
    res.json({
      success: true,
      message: `Security scan queue cleared (${count} scans removed)`
    });
  } catch (error) {
    log(`Error clearing security scan queue: ${error}`, 'security-api');
    res.status(500).json({ error: 'Failed to clear security scan queue' });
  }
});

export default router;