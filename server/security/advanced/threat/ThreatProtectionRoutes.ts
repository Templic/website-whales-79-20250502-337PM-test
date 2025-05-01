/**
 * Threat Protection Routes
 * 
 * Express routes for security threat management:
 * - Threat monitoring & detection
 * - Security dashboard API
 * - Threat response operations
 */

import express from 'express';
import { threatDetectionService } from './ThreatDetectionService';
import { threatDbService } from './ThreatDatabaseService';
import { threatMonitoringService } from './ThreatMonitoringService';
import { z } from 'zod';

// Middleware for admin-only routes
const ensureAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || 
      (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')) {
    return res.status(403).json({ 
      success: false,
      error: 'Unauthorized access'
    });
  }
  next();
};

const router = express.Router();

/**
 * Get active threats
 * 
 * GET /api/security/threat/active
 */
router.get('/active', ensureAdmin, async (req, res) => {
  try {
    // Get active threats from the threat detection service
    const activeThreats = await threatDetectionService.getActiveThreats();
    
    res.json({
      success: true,
      threats: activeThreats
    });
  } catch (error) {
    console.error('Error fetching active threats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching active threats'
    });
  }
});

/**
 * Get recent threats
 * 
 * GET /api/security/threat/recent
 */
router.get('/recent', ensureAdmin, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const recentThreats = await threatDetectionService.getRecentThreats(limit);
    
    res.json({
      success: true,
      threats: recentThreats
    });
  } catch (error) {
    console.error('Error fetching recent threats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching recent threats'
    });
  }
});

/**
 * Get threat details
 * 
 * GET /api/security/threat/:id
 */
router.get('/:id', ensureAdmin, async (req, res) => {
  try {
    const threatId = req.params.id;
    const threat = await threatDbService.getThreatById(threatId);
    
    if (!threat) {
      return res.status(404).json({
        success: false,
        error: 'Threat not found'
      });
    }
    
    res.json({
      success: true,
      threat
    });
  } catch (error) {
    console.error(`Error fetching threat ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching threat details'
    });
  }
});

/**
 * Resolve a threat
 * 
 * POST /api/security/threat/:id/resolve
 */
router.post('/:id/resolve', ensureAdmin, async (req, res) => {
  try {
    const threatId = req.params.id;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(403).json({
        success: false,
        error: 'User ID required to resolve threats'
      });
    }
    
    const resolved = await threatDetectionService.resolveThreat(threatId, userId);
    
    if (!resolved) {
      return res.status(404).json({
        success: false,
        error: 'Threat not found or could not be resolved'
      });
    }
    
    // Record event
    threatMonitoringService.recordEvent(
      'threat_resolved',
      { threatId },
      threatId,
      undefined,
      userId
    );
    
    res.json({
      success: true,
      message: 'Threat resolved successfully'
    });
  } catch (error) {
    console.error(`Error resolving threat ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error resolving threat'
    });
  }
});

/**
 * Get blocked IPs
 * 
 * GET /api/security/threat/blocked-ips
 */
router.get('/blocked-ips', ensureAdmin, async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const blockedIps = await threatDbService.getBlockedIps(activeOnly);
    
    res.json({
      success: true,
      blockedIps
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
 * Block an IP
 * 
 * POST /api/security/threat/block-ip
 */
router.post('/block-ip', ensureAdmin, async (req, res) => {
  try {
    const blockIpSchema = z.object({
      ip: z.string().min(7).max(45),
      reason: z.string().min(3).max(200),
      duration: z.number().optional()
    });
    
    const validation = blockIpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.format()
      });
    }
    
    const { ip, reason, duration } = validation.data;
    const userId = req.user?.id;
    
    await threatDetectionService.blockIp(ip, reason, duration, userId);
    
    // Record event
    threatMonitoringService.recordEvent(
      'ip_blocked',
      { ip, reason, duration },
      undefined,
      undefined,
      userId
    );
    
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
 * Unblock an IP
 * 
 * POST /api/security/threat/unblock-ip
 */
router.post('/unblock-ip', ensureAdmin, async (req, res) => {
  try {
    const unblockIpSchema = z.object({
      ip: z.string().min(7).max(45)
    });
    
    const validation = unblockIpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.format()
      });
    }
    
    const { ip } = validation.data;
    const userId = req.user?.id;
    
    const success = await threatDetectionService.unblockIp(ip);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'IP not found or already unblocked'
      });
    }
    
    // Record event
    threatMonitoringService.recordEvent(
      'ip_unblocked',
      { ip },
      undefined,
      undefined,
      userId
    );
    
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
 * Get detection rules
 * 
 * GET /api/security/threat/rules
 */
router.get('/rules', ensureAdmin, async (req, res) => {
  try {
    const enabledOnly = req.query.enabledOnly === 'true';
    
    const rules = await threatDbService.getRules(enabledOnly);
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Error fetching detection rules:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching detection rules'
    });
  }
});

/**
 * Add or update a detection rule
 * 
 * POST /api/security/threat/rules
 */
router.post('/rules', ensureAdmin, async (req, res) => {
  try {
    const ruleSchema = z.object({
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(500),
      threatType: z.string().min(3).max(50),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      pattern: z.string().optional(),
      threshold: z.number().int().optional(),
      timeWindow: z.number().int().optional(),
      autoBlock: z.boolean().default(false),
      autoNotify: z.boolean().default(false),
      enabled: z.boolean().default(true)
    });
    
    const validation = ruleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule data',
        details: validation.error.format()
      });
    }
    
    const ruleData = validation.data;
    
    // Convert pattern string to RegExp if provided
    let pattern: RegExp | undefined = undefined;
    if (ruleData.pattern) {
      try {
        // Check if the pattern is already a RegExp string (starts and ends with /)
        if (ruleData.pattern.startsWith('/') && ruleData.pattern.lastIndexOf('/') > 0) {
          const lastSlashIndex = ruleData.pattern.lastIndexOf('/');
          const patternBody = ruleData.pattern.substring(1, lastSlashIndex);
          const flags = ruleData.pattern.substring(lastSlashIndex + 1);
          pattern = new RegExp(patternBody, flags);
        } else {
          // Treat as a plain string pattern
          pattern = new RegExp(ruleData.pattern);
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid regular expression pattern',
          details: (e as Error).message
        });
      }
    }
    
    // Add rule with parsed RegExp
    const rule = await threatDetectionService.addOrUpdateRule({
      name: ruleData.name,
      description: ruleData.description,
      threatType: ruleData.threatType,
      severity: ruleData.severity,
      pattern,
      threshold: ruleData.threshold,
      timeWindow: ruleData.timeWindow,
      autoBlock: ruleData.autoBlock,
      autoNotify: ruleData.autoNotify,
      enabled: ruleData.enabled
    });
    
    // Record event
    threatMonitoringService.recordEvent(
      'rule_created',
      { ruleName: rule.name, ruleId: rule.id },
      undefined,
      rule.id,
      req.user?.id
    );
    
    res.json({
      success: true,
      rule,
      message: 'Detection rule added/updated successfully'
    });
  } catch (error) {
    console.error('Error adding/updating detection rule:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error adding/updating detection rule'
    });
  }
});

/**
 * Enable/disable a rule
 * 
 * POST /api/security/threat/rules/:id/toggle
 */
router.post('/rules/:id/toggle', ensureAdmin, async (req, res) => {
  try {
    const ruleId = req.params.id;
    const userId = req.user?.id;
    
    const toggleSchema = z.object({
      enabled: z.boolean()
    });
    
    const validation = toggleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.format()
      });
    }
    
    const { enabled } = validation.data;
    
    const success = await threatDetectionService.setRuleEnabled(ruleId, enabled);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    // Record event
    threatMonitoringService.recordEvent(
      'rule_updated',
      { ruleId, enabled },
      undefined,
      ruleId,
      userId
    );
    
    res.json({
      success: true,
      message: `Rule ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error(`Error toggling rule ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error toggling rule'
    });
  }
});

/**
 * Delete a rule
 * 
 * DELETE /api/security/threat/rules/:id
 */
router.delete('/rules/:id', ensureAdmin, async (req, res) => {
  try {
    const ruleId = req.params.id;
    const userId = req.user?.id;
    
    const success = await threatDetectionService.deleteRule(ruleId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    
    // Record event
    threatMonitoringService.recordEvent(
      'rule_deleted',
      { ruleId },
      undefined,
      ruleId,
      userId
    );
    
    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting rule ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting rule'
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
 * Get security trends
 * 
 * GET /api/security/threat/trends
 */
router.get('/trends', ensureAdmin, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const trends = await threatMonitoringService.getThreatTrends(days);
    
    res.json({
      success: true,
      ...trends
    });
  } catch (error) {
    console.error('Error fetching threat trends:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching threat trends'
    });
  }
});

/**
 * Get recent security events
 * 
 * GET /api/security/threat/events
 */
router.get('/events', ensureAdmin, (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const events = threatMonitoringService.getRecentEvents(limit);
    
    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching security events'
    });
  }
});

export default router;