/**
 * Rate Limiting API Routes
 *
 * This module provides API endpoints for monitoring and managing the rate limiting system.
 * These endpoints are for authorized administrators to view and control rate limiting behavior.
 */

import express, { Request, Response } from 'express';
import { isAdmin } from '../../../utils/auth-utils';
import { 
  rateLimiters, 
  adaptiveRateLimiter, 
  rateLimitAnalytics 
} from '../../../security/advanced/threat/RateLimitingSystem';
import { recordAuditEvent } from '../../../security/secureAuditTrail';

const router = express.Router();

// Get rate limiting status
router.get('/status', isAdmin, (req: Request, res: Response) => {
  try {
    // Get metrics from each component
    const analytics = rateLimitAnalytics.generateReport();
    const adaptiveMetrics = adaptiveRateLimiter.getAdjustmentMetrics();
    
    // Build a comprehensive status
    const status = {
      timestamp: new Date().toISOString(),
      metrics: {
        analytics: {
          totalViolations: analytics.summary.totalViolations,
          recentViolations: analytics.summary.recentViolations,
          suspiciousUsers: analytics.summary.suspiciousUsers,
          globalErrorRate: analytics.summary.globalErrorRate,
          suspiciousRequestRate: analytics.summary.suspiciousRequestRate
        },
        adaptive: {
          systemLoadFactor: adaptiveMetrics.systemLoadFactor,
          threatFactor: adaptiveMetrics.threatFactor,
          errorRateFactor: adaptiveMetrics.errorRateFactor,
          effectiveMultipliers: adaptiveMetrics.effectiveMultipliers
        }
      },
      resourceTypes: analytics.resourceTypes,
      suspiciousUsers: analytics.suspiciousUsers,
      trends: analytics.trends
    };
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate limit status'
    });
  }
});

// Force collection of rate limit violations
router.post('/collect-violations', isAdmin, (req: Request, res: Response) => {
  try {
    // Trigger collection of violation data
    rateLimitAnalytics.storeViolations();
    
    res.json({
      success: true,
      message: 'Rate limit violations collected'
    });
  } catch (error) {
    console.error('[RateLimit] Error collecting rate limit violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to collect rate limit violations'
    });
  }
});

// Update rate limit configuration for a specific tier
router.post('/configure/:tier', isAdmin, (req: Request, res: Response) => {
  try {
    const { tier } = req.params;
    const { capacity, refillRate, refillInterval } = req.body;
    
    // Validate the tier
    if (!rateLimiters[tier]) {
      return res.status(400).json({
        success: false,
        message: `Invalid rate limit tier: ${tier}`
      });
    }
    
    // Validate the parameters
    if (capacity === undefined || refillRate === undefined || refillInterval === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: capacity, refillRate, refillInterval'
      });
    }
    
    // Update the configuration
    const limiter = rateLimiters[tier];
    limiter.updateConfig({
      capacity: Number(capacity),
      refillRate: Number(refillRate),
      refillInterval: Number(refillInterval)
    });
    
    // Record the configuration change
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_CONFIG_UPDATE',
      resource: `rate-limit-${tier}`,
      result: 'success',
      severity: 'info',
      details: {
        tier,
        capacity: Number(capacity),
        refillRate: Number(refillRate),
        refillInterval: Number(refillInterval),
        updatedBy: req.user?.username || 'unknown'
      }
    });
    
    res.json({
      success: true,
      message: `Rate limit configuration updated for tier: ${tier}`,
      config: {
        tier,
        capacity: Number(capacity),
        refillRate: Number(refillRate),
        refillInterval: Number(refillInterval)
      }
    });
  } catch (error) {
    console.error(`[RateLimit] Error updating rate limit configuration:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rate limit configuration'
    });
  }
});

// Force recalculation of adaptive rate limiting factors
router.post('/recalculate-factors', isAdmin, (req: Request, res: Response) => {
  try {
    // Force immediate recalculation
    adaptiveRateLimiter.forceRecalculation();
    
    // Get the updated metrics
    const adaptiveMetrics = adaptiveRateLimiter.getAdjustmentMetrics();
    
    res.json({
      success: true,
      message: 'Adaptive rate limiting factors recalculated',
      metrics: adaptiveMetrics
    });
  } catch (error) {
    console.error('[RateLimit] Error recalculating adaptive factors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate adaptive factors'
    });
  }
});

// Block a specific IP or user from making requests (extreme rate limiting)
router.post('/block', isAdmin, (req: Request, res: Response) => {
  try {
    const { identifier, reason, duration } = req.body;
    
    // Validate parameters
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: identifier'
      });
    }
    
    // Duration is in minutes, default to 60 (1 hour)
    const blockDuration = duration ? Number(duration) : 60;
    
    // Apply a custom rate limit configuration to this identifier
    // This effectively blocks them by setting extremely low limits
    for (const tier in rateLimiters) {
      rateLimiters[tier].setCustomConfig(identifier, {
        capacity: 1,
        refillRate: 1,
        refillInterval: blockDuration * 60000 // Convert minutes to milliseconds
      });
    }
    
    // Record the block action
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_BLOCK',
      resource: 'rate-limiting',
      result: 'success',
      severity: 'warning',
      details: {
        identifier,
        reason: reason || 'Manual block by administrator',
        duration: blockDuration,
        blockedBy: req.user?.username || 'unknown'
      }
    });
    
    res.json({
      success: true,
      message: `Blocked ${identifier} for ${blockDuration} minutes`,
      expiresAt: new Date(Date.now() + blockDuration * 60000).toISOString()
    });
  } catch (error) {
    console.error('[RateLimit] Error blocking identifier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block identifier'
    });
  }
});

// Unblock a specific IP or user
router.post('/unblock', isAdmin, (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    
    // Validate parameters
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: identifier'
      });
    }
    
    // Remove custom rate limit configurations for this identifier
    for (const tier in rateLimiters) {
      rateLimiters[tier].removeCustomConfig(identifier);
    }
    
    // Record the unblock action
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_UNBLOCK',
      resource: 'rate-limiting',
      result: 'success',
      severity: 'info',
      details: {
        identifier,
        reason: 'Manual unblock by administrator',
        unblocked_by: req.user?.username || 'unknown'
      }
    });
    
    res.json({
      success: true,
      message: `Unblocked ${identifier}`
    });
  } catch (error) {
    console.error('[RateLimit] Error unblocking identifier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock identifier'
    });
  }
});

export default router;