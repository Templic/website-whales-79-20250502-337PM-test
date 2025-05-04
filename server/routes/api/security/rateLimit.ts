/**
 * Rate Limiting API Routes
 *
 * This module provides API endpoints for managing and monitoring the rate limiting system.
 */

import express, { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { isAdmin } from '../../../middleware/authMiddleware';
import { 
  rateLimiters,
  generateRateLimitReport,
  getAdaptiveAdjustmentMetrics
} from '../../../security/advanced/threat/RateLimitingSystem';
import { threatDetectionService } from '../../../security/advanced/threat/ThreatDetectionService';
import { contextBuilder } from '../../../security/advanced/threat/RateLimitingSystem';
import { adaptiveRateLimiter } from '../../../security/advanced/threat/RateLimitingSystem';

// Create router
const router = express.Router();

/**
 * Get rate limiting status and statistics
 * 
 * @route GET /api/security/rate-limit/status
 * @access Admin
 */
router.get('/status', isAdmin, (req: Request, res: Response) => {
  try {
    // Generate rate limit report
    const report = generateRateLimitReport();
    
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    log(`Error getting rate limit status: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get rate limit status'
    });
  }
});

/**
 * Get threat detection status and statistics
 * 
 * @route GET /api/security/rate-limit/threats
 * @access Admin
 */
router.get('/threats', isAdmin, (req: Request, res: Response) => {
  try {
    // Get threat statistics
    const stats = threatDetectionService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    log(`Error getting threat detection stats: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get threat detection stats'
    });
  }
});

/**
 * Get adaptive rate limiting metrics
 * 
 * @route GET /api/security/rate-limit/adaptive
 * @access Admin
 */
router.get('/adaptive', isAdmin, (req: Request, res: Response) => {
  try {
    // Get adaptive adjustment metrics
    const metrics = getAdaptiveAdjustmentMetrics();
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    log(`Error getting adaptive rate limit metrics: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get adaptive rate limit metrics'
    });
  }
});

/**
 * Force recalculation of adaptive factors
 * 
 * @route POST /api/security/rate-limit/adaptive/recalculate
 * @access Admin
 */
router.post('/adaptive/recalculate', isAdmin, (req: Request, res: Response) => {
  try {
    // Force recalculation
    adaptiveRateLimiter.forceRecalculation();
    
    // Get the updated metrics
    const metrics = getAdaptiveAdjustmentMetrics();
    
    return res.json({
      success: true,
      message: 'Adaptive factors recalculated successfully',
      data: metrics
    });
  } catch (error) {
    log(`Error recalculating adaptive factors: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to recalculate adaptive factors'
    });
  }
});

/**
 * Clear old threat data
 * 
 * @route POST /api/security/rate-limit/threats/clear
 * @access Admin
 */
router.post('/threats/clear', isAdmin, (req: Request, res: Response) => {
  try {
    // Clear old threats
    threatDetectionService.clearOldThreats();
    
    return res.json({
      success: true,
      message: 'Old threat data cleared successfully'
    });
  } catch (error) {
    log(`Error clearing old threats: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to clear old threats'
    });
  }
});

/**
 * Update rate limit configuration for a specific tier
 * 
 * @route POST /api/security/rate-limit/config/:tier
 * @access Admin
 */
router.post('/config/:tier', isAdmin, (req: Request, res: Response) => {
  try {
    const { tier } = req.params;
    const { capacity, refillRate, refillInterval } = req.body;
    
    // Validate the tier
    if (!rateLimiters[tier]) {
      return res.status(400).json({
        success: false,
        message: `Invalid tier: ${tier}`
      });
    }
    
    // Validate the parameters
    if (!capacity || !refillRate || !refillInterval) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: capacity, refillRate, refillInterval'
      });
    }
    
    // Update the configuration
    rateLimiters[tier].updateConfig({
      capacity: parseInt(capacity, 10),
      refillRate: parseInt(refillRate, 10),
      refillInterval: parseInt(refillInterval, 10)
    });
    
    log(`Rate limit configuration updated for tier ${tier}`, 'security');
    
    return res.json({
      success: true,
      message: `Rate limit configuration updated for tier ${tier}`
    });
  } catch (error) {
    log(`Error updating rate limit configuration: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update rate limit configuration'
    });
  }
});

/**
 * Blacklist an IP address
 * 
 * @route POST /api/security/rate-limit/blacklist
 * @access Admin
 */
router.post('/blacklist', isAdmin, (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    
    // Validate the IP
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: ip'
      });
    }
    
    // Blacklist the IP
    contextBuilder.blacklistIp(ip);
    
    log(`IP address ${ip} blacklisted`, 'security');
    
    return res.json({
      success: true,
      message: `IP address ${ip} blacklisted`
    });
  } catch (error) {
    log(`Error blacklisting IP: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to blacklist IP'
    });
  }
});

/**
 * Remove an IP address from the blacklist
 * 
 * @route DELETE /api/security/rate-limit/blacklist/:ip
 * @access Admin
 */
router.delete('/blacklist/:ip', isAdmin, (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    
    // Remove from blacklist
    contextBuilder.unblacklistIp(ip);
    
    log(`IP address ${ip} removed from blacklist`, 'security');
    
    return res.json({
      success: true,
      message: `IP address ${ip} removed from blacklist`
    });
  } catch (error) {
    log(`Error removing IP from blacklist: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to remove IP from blacklist'
    });
  }
});

/**
 * Reset a specific rate limiter bucket
 * 
 * @route POST /api/security/rate-limit/reset/:tier/:identifier
 * @access Admin
 */
router.post('/reset/:tier/:identifier', isAdmin, (req: Request, res: Response) => {
  try {
    const { tier, identifier } = req.params;
    
    // Validate the tier
    if (!rateLimiters[tier]) {
      return res.status(400).json({
        success: false,
        message: `Invalid tier: ${tier}`
      });
    }
    
    // Reset the bucket
    rateLimiters[tier].resetBucket(identifier);
    
    log(`Rate limit bucket reset for ${identifier} in tier ${tier}`, 'security');
    
    return res.json({
      success: true,
      message: `Rate limit bucket reset for ${identifier} in tier ${tier}`
    });
  } catch (error) {
    log(`Error resetting rate limit bucket: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to reset rate limit bucket'
    });
  }
});

export default router;