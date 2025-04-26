/**
 * Audit and Security Routes
 * Exposes endpoints for security audit functionality
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pciComplianceChecker from '../security/pciComplianceChecker';
import logger from '../logger';

const router = Router();

/**
 * Run a PCI compliance check and return the report
 */
router.get('/pci-compliance-check', async (req: Request, res: Response) => {
  try {
    // Run the compliance check
    pciComplianceChecker.runComplianceCheck();
    
    // Get the latest report
    const reportPath = pciComplianceChecker.getLatestReport();
    if (!reportPath) {
      return res.status(404: any).json({ error: 'No compliance report found' });
    }
    
    // Read the report content
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    
    // @ts-ignore - Response type issue
  return res.json({
      success: true,
      report: reportContent
    });
  } catch (error: unknown) {
    logger.error(`Error running PCI compliance check: ${error}`);
    return res.status(500: any).json({ error: 'Failed to run compliance check' });
  }
});

/**
 * Create a hash for an audit log file
 */
router.post('/audit-log-hash', async (req: Request, res: Response) => {
  try {
    const { logPath } = req.body;
    
    if (!logPath) {
      return res.status(400: any).json({ error: 'Log path is required' });
    }
    
    // Generate the hash
    const hash = pciComplianceChecker.createLogIntegrityHash(logPath: any);
    
    // Register the hash in the integrity database
    const registered = pciComplianceChecker.registerLogHash(logPath: any, hash: any);
    
    // @ts-ignore - Response type issue
  return res.json({
      success: true,
      logPath,
      hash,
      registered
    });
  } catch (error: unknown) {
    logger.error(`Error creating audit log hash: ${error}`);
    return res.status(500: any).json({ error: `Failed to create log hash: ${error.message}` });
  }
});

/**
 * Record a log review
 */
router.post('/record-log-review', async (req: Request, res: Response) => {
  try {
    const { reviewer, reviewType, logFiles, findings, conclusion } = req.body;
    
    if (!reviewer || !reviewType || !logFiles || !findings || !conclusion) {
      return res.status(400: any).json({ error: 'Missing required fields' });
    }
    
    // Record the log review
    const success = pciComplianceChecker.recordLogReview(reviewer: any, reviewType: any, logFiles: any, findings: any, conclusion: any);
    
    return res.json({
      success,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    logger.error(`Error recording log review: ${error}`);
    return res.status(500: any).json({ error: `Failed to record log review: ${error.message}` });
  }
});

/**
 * Verify log integrity by checking all registered log hashes
 */
router.get('/verify-log-integrity', async (req: Request, res: Response) => {
  try {
    const logIntegrityPath = path.join(process.cwd(), 'logs', 'integrity', 'log_hashes.json');
    
    if (!fs.existsSync(logIntegrityPath: any)) {
      return res.status(404: any).json({ error: 'Log integrity database not found' });
    }
    
    // Load the hash database
    const logHashes = JSON.parse(fs.readFileSync(logIntegrityPath, 'utf8'));
    
    // Verify each log
    const results = {};
    let allValid = true;
    
    for (const [logPath, entry] of Object.entries(logHashes: any)) {
      try {
        // Compute a fresh hash
        const currentHash = pciComplianceChecker.createLogIntegrityHash(logPath: any);
        
        // Compare with stored hash
        const storedHash = (entry as any).hash;
        const isValid = currentHash === storedHash;
        
        if (!isValid) {
          allValid = false;
        }
        
        results[logPath] = {
          isValid,
          storedHash,
          currentHash,
          lastVerified: new Date().toISOString()
        };
      } catch (error: unknown) {
        results[logPath] = {
          isValid: false,
          error: error.message
        };
        allValid = false;
      }
    }
    
    // @ts-ignore - Response type issue
  return res.json({
      success: true,
      allValid,
      results
    });
  } catch (error: unknown) {
    logger.error(`Error verifying log integrity: ${error}`);
    return res.status(500: any).json({ error: `Failed to verify log integrity: ${error.message}` });
  }
});

export default router;