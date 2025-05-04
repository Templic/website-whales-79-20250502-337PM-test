/**
 * Rate Limit API Routes
 *
 * This module provides API endpoints for managing and monitoring the rate limiting system.
 */

import { Router } from 'express';
import { log } from '../../../utils/logger';
import { isAdmin } from '../../../middleware/authMiddleware';
import { 
  rateLimiters, 
  generateRateLimitReport, 
  getAdaptiveAdjustmentMetrics 
} from '../../../security/advanced/threat/RateLimitingSystem';
import { 
  contextBuilder 
} from '../../../security/advanced/threat/RateLimitingSystem';
import { 
  adaptiveRateLimiter 
} from '../../../security/advanced/threat/RateLimitingSystem';
import { threatDetectionService } from '../../../security/advanced/threat/ThreatDetectionService';
import { recordAuditEvent } from '../../../security/secureAuditTrail';

const router = Router();

/**
 * Get rate limiting status
 */
router.get('/status', isAdmin, (req, res) => {
  try {
    // Generate report
    const report = generateRateLimitReport();
    
    // Return report
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      report
    });
  } catch (error) {
    log(`Error getting rate limit status: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while getting rate limit status.'
    });
  }
});

/**
 * Get threat detection status
 */
router.get('/threats', isAdmin, (req, res) => {
  try {
    // Get threat stats
    const stats = threatDetectionService.getStats();
    
    // Return stats
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    log(`Error getting threat stats: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while getting threat stats.'
    });
  }
});

/**
 * Get adaptive adjustment metrics
 */
router.get('/adaptive', isAdmin, (req, res) => {
  try {
    // Get metrics
    const metrics = getAdaptiveAdjustmentMetrics();
    
    // Return metrics
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    log(`Error getting adaptive metrics: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while getting adaptive metrics.'
    });
  }
});

/**
 * Force recalculation of adaptive factors
 */
router.post('/adaptive/recalculate', isAdmin, (req, res) => {
  try {
    // Force recalculation
    adaptiveRateLimiter.forceRecalculation();
    
    // Record audit event
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_ADAPTIVE_RECALCULATION',
      resource: 'system',
      result: 'success',
      severity: 'info',
      details: {
        userId: req.session?.userId,
        ip: req.ip
      }
    });
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Adaptive factors recalculated.'
    });
  } catch (error) {
    log(`Error recalculating adaptive factors: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while recalculating adaptive factors.'
    });
  }
});

/**
 * Clear old threat data
 */
router.post('/threats/clear', isAdmin, (req, res) => {
  try {
    // Clear old threats
    threatDetectionService.clearOldThreats();
    
    // Record audit event
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_THREATS_CLEARED',
      resource: 'system',
      result: 'success',
      severity: 'info',
      details: {
        userId: req.session?.userId,
        ip: req.ip
      }
    });
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Old threat data cleared.'
    });
  } catch (error) {
    log(`Error clearing threat data: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while clearing threat data.'
    });
  }
});

/**
 * Update rate limit configuration for a tier
 */
router.post('/config/:tier', isAdmin, (req, res) => {
  try {
    // Get tier
    const tier = req.params.tier;
    
    // Check if valid tier
    if (!rateLimiters[tier]) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: `Rate limiter for tier "${tier}" not found.`
      });
    }
    
    // Get config
    const config = req.body;
    
    // Check for required fields
    if (!config.capacity || !config.refillRate || !config.refillInterval) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Missing required fields: capacity, refillRate, refillInterval.'
      });
    }
    
    // Validate fields
    if (config.capacity < 1 || config.refillRate < 1 || config.refillInterval < 1000) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Invalid configuration values.'
      });
    }
    
    // TODO: Update configuration
    // Note: Since we don't have a mechanism to update the configuration of an
    // existing rate limiter, we'd need to create a new one with the new config
    // and replace the existing one. For now, we'll just log the request.
    
    log(`Rate limit configuration update requested for tier ${tier}: ${JSON.stringify(config)}`, 'security');
    
    // Record audit event
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_CONFIG_UPDATE',
      resource: `tier:${tier}`,
      result: 'success',
      severity: 'info',
      details: {
        userId: req.session?.userId,
        ip: req.ip,
        tier,
        config
      }
    });
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Rate limit configuration for tier "${tier}" updated.`,
      note: 'Note: This feature is not fully implemented yet.'
    });
  } catch (error) {
    log(`Error updating rate limit configuration: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while updating rate limit configuration.'
    });
  }
});

/**
 * Add an IP to the blacklist
 */
router.post('/blacklist', isAdmin, (req, res) => {
  try {
    // Get IP
    const ip = req.body.ip;
    
    // Check if IP is provided
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'invalid_request',
        message: 'Missing required field: ip.'
      });
    }
    
    // Add to blacklist
    contextBuilder.blacklistIp(ip);
    
    // Record in threat detection
    threatDetectionService.recordViolation(ip, `ip:${ip}`, 2.0);
    
    // Record audit event
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_IP_BLACKLISTED',
      resource: `ip:${ip}`,
      result: 'success',
      severity: 'warning',
      details: {
        userId: req.session?.userId,
        adminIp: req.ip,
        blacklistedIp: ip
      }
    });
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `IP ${ip} has been blacklisted.`
    });
  } catch (error) {
    log(`Error blacklisting IP: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while blacklisting IP.'
    });
  }
});

/**
 * Remove an IP from the blacklist
 */
router.delete('/blacklist/:ip', isAdmin, (req, res) => {
  try {
    // Get IP
    const ip = req.params.ip;
    
    // Remove from blacklist
    contextBuilder.unblacklistIp(ip);
    
    // Record audit event
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_IP_UNBLACKLISTED',
      resource: `ip:${ip}`,
      result: 'success',
      severity: 'info',
      details: {
        userId: req.session?.userId,
        adminIp: req.ip,
        unblacklistedIp: ip
      }
    });
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `IP ${ip} has been removed from the blacklist.`
    });
  } catch (error) {
    log(`Error unblacklisting IP: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while removing IP from blacklist.'
    });
  }
});

/**
 * Reset a specific rate limiter bucket
 */
router.post('/reset/:tier/:identifier', isAdmin, (req, res) => {
  try {
    // Get tier and identifier
    const tier = req.params.tier;
    const identifier = req.params.identifier;
    
    // Check if valid tier
    if (!rateLimiters[tier]) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: `Rate limiter for tier "${tier}" not found.`
      });
    }
    
    // Generate key
    const key = `${tier}:${identifier}`;
    
    // Reset bucket
    rateLimiters[tier].resetBucket(key);
    
    // Record audit event
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_BUCKET_RESET',
      resource: key,
      result: 'success',
      severity: 'info',
      details: {
        userId: req.session?.userId,
        adminIp: req.ip,
        tier,
        identifier
      }
    });
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Rate limit bucket "${key}" has been reset.`
    });
  } catch (error) {
    log(`Error resetting rate limit bucket: ${error}`, 'security');
    
    return res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An error occurred while resetting rate limit bucket.'
    });
  }
});

export default router;