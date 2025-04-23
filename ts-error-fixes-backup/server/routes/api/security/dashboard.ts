/**
 * Security Dashboard API Routes
 * 
 * This module provides API endpoints for the security dashboard,
 * including security metrics, configuration, and security scan endpoints.
 */

import express from 'express';
import { getLatestSecurityMetrics } from '../../../security/monitoring/MetricsCollector';
import { getSecurityEventsHistory } from '../../../security/monitoring/EventsCollector';
import { logSecurityEvent } from '../../../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../../../security/advanced/SecurityFabric';

// Create router
const router = express.Router();

/**
 * Get security metrics
 * GET /api/security/dashboard/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getLatestSecurityMetrics();
    res.json(metrics);
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching security metrics',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ error: 'Failed to fetch security metrics' });
  }
});

/**
 * Get security events
 * GET /api/security/dashboard/events
 */
router.get('/events', async (req, res) => {
  try {
    // Parse query parameters
    const timeRange = req.query.timeRange as string || '24h';
    const category = req.query.category as string || 'all';
    const type = req.query.type as string || 'all';
    const limit = parseInt(req.query.limit as string || '100');
    
    const events = await getSecurityEventsHistory(timeRange, category, type, limit);
    res.json(events);
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching security events',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

/**
 * Get security configuration
 * GET /api/security/dashboard/config
 */
router.get('/config', (req, res) => {
  try {
    // In a real application, this would fetch the actual security configuration
    const securityConfig = {
      mfaRequired: true,
      passwordRequirements: {
        minLength: 12,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
        requireLowercase: true
      },
      sessionTimeout: 30, // minutes
      ipWhitelist: ['192.168.1.0/24', '10.0.0.1'],
      quantumProtection: 'high', // 'low', 'medium', 'high'
      apiRateLimiting: {
        enabled: true,
        requestsPerMinute: 100
      },
      blockTor: true,
      blockVPNs: false,
      anomalyDetection: {
        sensitivity: 'medium', // 'low', 'medium', 'high'
        autoBlock: true,
        alertThreshold: 'medium' // 'low', 'medium', 'high'
      },
      securityScanSchedule: 'daily' // 'hourly', 'daily', 'weekly'
    };
    
    res.json(securityConfig);
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error fetching security configuration',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ error: 'Failed to fetch security configuration' });
  }
});

/**
 * Update security configuration
 * POST /api/security/dashboard/config
 */
router.post('/config', (req, res) => {
  try {
    const newConfig = req.body;
    
    // In a real application, this would validate and update the security configuration
    
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: 'Security configuration updated',
      data: { updatedBy: (req.user as any)?.id, newConfig }
    });
    
    res.json({ success: true, message: 'Security configuration updated' });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error updating security configuration',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ error: 'Failed to update security configuration' });
  }
});

/**
 * Run security scan
 * POST /api/security/dashboard/scan
 */
router.post('/scan', async (req, res) => {
  try {
    // In a real application, this would initiate a security scan
    
    // Log the scan initiation
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: 'Security scan initiated',
      data: { initiatedBy: (req.user as any)?.id }
    });
    
    // Simulate a scan delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log the scan completion
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: 'Security scan completed',
      data: {
        duration: '2.1s',
        threats: 0,
        warnings: 3
      }
    });
    
    res.json({
      success: true,
      message: 'Security scan completed',
      result: {
        duration: '2.1s',
        threats: 0,
        warnings: 3,
        details: [
          { type: 'warning', message: 'Session timeout is less than recommended 60 minutes' },
          { type: 'warning', message: 'Some API endpoints lack rate limiting' },
          { type: 'warning', message: 'CORS configuration allows multiple origins' }
        ]
      }
    });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error running security scan',
      data: { error: (error as Error).message }
    });
    
    res.status(500).json({ error: 'Failed to run security scan' });
  }
});

export default router;