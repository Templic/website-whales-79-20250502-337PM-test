/**
 * Threat Protection Routes
 * 
 * API endpoints for threat detection, monitoring, and management:
 * - Retrieving threat statistics and details
 * - Managing threat detection rules and responses
 * - Executing manual responses to threats
 */

import express from 'express';
import { threatDetectionService, ThreatType, ThreatSeverity } from './ThreatDetectionService';
import { threatMonitoringService } from './ThreatMonitoringService';

const router = express.Router();

/**
 * Middleware to ensure request is authenticated and from an admin
 */
function ensureAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  // In a production environment, this would use a proper auth check
  // For simplification in this demo, we'll assume all requests are from admins
  next();
}

/**
 * Get all detected threats with pagination
 * 
 * GET /api/security/threat/detected
 */
router.get('/detected', ensureAdmin, (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    
    const threats = threatDetectionService.getDetectedThreats(limit, offset);
    
    res.json({
      success: true,
      threats,
      total: threatDetectionService.getDetectedThreats().length,
      active: threatDetectionService.getActiveThreats().length
    });
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching threat data'
    });
  }
});

/**
 * Get active threats
 * 
 * GET /api/security/threat/active
 */
router.get('/active', ensureAdmin, (req, res) => {
  try {
    const activeThreats = threatDetectionService.getActiveThreats();
    
    res.json({
      success: true,
      threats: activeThreats,
      count: activeThreats.length
    });
  } catch (error) {
    console.error('Error fetching active threats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching active threat data'
    });
  }
});

/**
 * Get all threat detection rules
 * 
 * GET /api/security/threat/rules
 */
router.get('/rules', ensureAdmin, (req, res) => {
  try {
    // Get active rules
    const activeRules = threatDetectionService.getActiveRules();
    
    res.json({
      success: true,
      rules: activeRules,
      count: activeRules.length
    });
  } catch (error) {
    console.error('Error fetching threat rules:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching threat rules'
    });
  }
});

/**
 * Update a threat detection rule
 * 
 * PUT /api/security/threat/rules/:ruleId
 */
router.put('/rules/:ruleId', ensureAdmin, (req, res) => {
  try {
    const ruleId = req.params.ruleId;
    const updates = req.body;
    
    // Validate updates
    if (updates.checkFn) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update rule check function through API'
      });
    }
    
    const success = threatDetectionService.updateRule(ruleId, updates);
    
    if (success) {
      // Log action
      console.log(`Threat detection rule ${ruleId} updated by user ${req.user?.id || 'unknown'}`);
      
      res.json({
        success: true,
        message: `Rule ${ruleId} updated successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Rule ${ruleId} not found`
      });
    }
  } catch (error) {
    console.error('Error updating threat rule:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating threat rule'
    });
  }
});

/**
 * Get all blocked IPs
 * 
 * GET /api/security/threat/blocked-ips
 */
router.get('/blocked-ips', ensureAdmin, (req, res) => {
  try {
    const blockedIps = threatDetectionService.getBlockedIps();
    
    res.json({
      success: true,
      ips: blockedIps,
      count: blockedIps.length
    });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching blocked IPs'
    });
  }
});

/**
 * Block an IP address
 * 
 * POST /api/security/threat/block-ip
 */
router.post('/block-ip', ensureAdmin, (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }
    
    threatDetectionService.blockIp(ip);
    
    // Log action
    console.log(`IP address ${ip} manually blocked by user ${req.user?.id || 'unknown'}`);
    
    res.json({
      success: true,
      message: `IP ${ip} blocked successfully`
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error blocking IP'
    });
  }
});

/**
 * Unblock an IP address
 * 
 * POST /api/security/threat/unblock-ip
 */
router.post('/unblock-ip', ensureAdmin, (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }
    
    threatDetectionService.unblockIp(ip);
    
    // Log action
    console.log(`IP address ${ip} manually unblocked by user ${req.user?.id || 'unknown'}`);
    
    res.json({
      success: true,
      message: `IP ${ip} unblocked successfully`
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error unblocking IP'
    });
  }
});

/**
 * Resolve a threat
 * 
 * POST /api/security/threat/resolve
 */
router.post('/resolve/:threatId', ensureAdmin, (req, res) => {
  try {
    const threatId = req.params.threatId;
    const resolvedBy = req.user?.id?.toString() || req.user?.username || 'unknown';
    
    const success = threatDetectionService.resolveThreat(threatId, resolvedBy);
    
    if (success) {
      res.json({
        success: true,
        message: `Threat ${threatId} resolved successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Threat ${threatId} not found`
      });
    }
  } catch (error) {
    console.error('Error resolving threat:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error resolving threat'
    });
  }
});

/**
 * Get threat statistics
 * 
 * GET /api/security/threat/statistics
 */
router.get('/statistics', ensureAdmin, (req, res) => {
  try {
    const statistics = threatMonitoringService.getStatistics();
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error fetching threat statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching threat statistics'
    });
  }
});

/**
 * Get security score
 * 
 * GET /api/security/threat/security-score
 */
router.get('/security-score', ensureAdmin, (req, res) => {
  try {
    const securityScore = threatMonitoringService.getSecurityScore();
    
    res.json({
      success: true,
      securityScore
    });
  } catch (error) {
    console.error('Error fetching security score:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching security score'
    });
  }
});

/**
 * Execute a response action on a threat
 * 
 * POST /api/security/threat/execute-action
 */
router.post('/execute-action', ensureAdmin, async (req, res) => {
  try {
    const { actionId, threatId } = req.body;
    
    if (!actionId || !threatId) {
      return res.status(400).json({
        success: false,
        error: 'Action ID and threat ID are required'
      });
    }
    
    const success = await threatMonitoringService.executeAction(actionId, threatId);
    
    if (success) {
      res.json({
        success: true,
        message: `Action ${actionId} executed successfully on threat ${threatId}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to execute action ${actionId} on threat ${threatId}`
      });
    }
  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error executing action'
    });
  }
});

/**
 * Get recommended actions for a threat
 * 
 * GET /api/security/threat/recommended-actions/:threatId
 */
router.get('/recommended-actions/:threatId', ensureAdmin, (req, res) => {
  try {
    const threatId = req.params.threatId;
    
    // Find the threat
    const threat = threatDetectionService.getDetectedThreats().find(t => t.id === threatId);
    
    if (!threat) {
      return res.status(404).json({
        success: false,
        error: `Threat ${threatId} not found`
      });
    }
    
    // Get recommended actions
    const actions = threatMonitoringService.getRecommendedActions(threat);
    
    res.json({
      success: true,
      threatId,
      actions: actions.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        automatic: a.automatic
      }))
    });
  } catch (error) {
    console.error('Error fetching recommended actions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching recommended actions'
    });
  }
});

/**
 * Enable/disable threat detection
 * 
 * POST /api/security/threat/toggle
 */
router.post('/toggle', ensureAdmin, (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Enabled status is required'
      });
    }
    
    threatDetectionService.setEnabled(!!enabled);
    
    // Log action
    console.log(`Threat detection ${enabled ? 'enabled' : 'disabled'} by user ${req.user?.id || 'unknown'}`);
    
    res.json({
      success: true,
      message: `Threat detection ${enabled ? 'enabled' : 'disabled'}`,
      status: !!enabled
    });
  } catch (error) {
    console.error('Error toggling threat detection:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error toggling threat detection'
    });
  }
});

/**
 * Enable/disable ML-based anomaly detection
 * 
 * POST /api/security/threat/toggle-ml
 */
router.post('/toggle-ml', ensureAdmin, (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Enabled status is required'
      });
    }
    
    threatDetectionService.setMlDetectionEnabled(!!enabled);
    
    // Log action
    console.log(`ML-based anomaly detection ${enabled ? 'enabled' : 'disabled'} by user ${req.user?.id || 'unknown'}`);
    
    res.json({
      success: true,
      message: `ML-based anomaly detection ${enabled ? 'enabled' : 'disabled'}`,
      status: !!enabled
    });
  } catch (error) {
    console.error('Error toggling ML detection:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error toggling ML detection'
    });
  }
});

export default router;