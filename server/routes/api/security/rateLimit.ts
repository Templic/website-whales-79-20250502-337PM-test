/**
 * Rate Limiting API
 * 
 * Provides API endpoints for monitoring and managing the rate limiting system.
 * These endpoints are protected and only accessible to authorized security admins.
 */

import { Router } from 'express';
import { 
  rateLimiters, 
  adaptiveRateLimiter, 
  rateLimitAnalytics,
  generateRateLimitReport,
  getAdaptiveAdjustmentMetrics 
} from '../../../security/advanced/threat/RateLimitingSystem';

const router = Router();

/**
 * GET /api/security/rate-limit/status
 * 
 * Gets the current status of all rate limiters
 */
router.get('/status', async (req, res) => {
  try {
    // Get status of all limiters
    const status = Object.entries(rateLimiters).map(([name, limiter]) => {
      return {
        name,
        config: limiter.getConfig(),
        violationStats: Object.keys(limiter.getViolationStats()).length
      };
    });
    
    // Get adaptive adjustment metrics
    const adaptiveMetrics = getAdaptiveAdjustmentMetrics();
    
    res.json({
      success: true,
      status,
      adaptiveMetrics
    });
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate limit status'
    });
  }
});

/**
 * GET /api/security/rate-limit/report
 * 
 * Generates a report on rate limiting activity
 * 
 * Query parameters:
 * - start: Start time (timestamp)
 * - end: End time (timestamp)
 */
router.get('/report', async (req, res) => {
  try {
    const startTime = req.query.start ? parseInt(req.query.start as string) : undefined;
    const endTime = req.query.end ? parseInt(req.query.end as string) : undefined;
    
    // Generate report
    const report = generateRateLimitReport(startTime, endTime);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating rate limit report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rate limit report'
    });
  }
});

/**
 * GET /api/security/rate-limit/threats
 * 
 * Identifies potential attackers based on rate limit violations
 */
router.get('/threats', async (req, res) => {
  try {
    // Collect latest violations
    rateLimitAnalytics.collectViolations();
    
    // Identify potential attackers
    const potentialAttackers = rateLimitAnalytics.identifyPotentialAttackers();
    
    res.json({
      success: true,
      potentialAttackers
    });
  } catch (error) {
    console.error('Error identifying rate limit threats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify rate limit threats'
    });
  }
});

/**
 * POST /api/security/rate-limit/reset
 * 
 * Resets rate limits for a specific key or all keys
 * 
 * Body parameters:
 * - limiter: Name of the limiter (optional, resets all if not specified)
 * - key: Specific key to reset (optional, resets all keys if not specified)
 */
router.post('/reset', async (req, res) => {
  try {
    const { limiter: limiterName, key } = req.body;
    
    if (limiterName && !rateLimiters[limiterName]) {
      return res.status(400).json({
        success: false,
        message: `Unknown limiter: ${limiterName}`
      });
    }
    
    if (limiterName && key) {
      // Reset specific key in specific limiter
      rateLimiters[limiterName].reset(key);
      
      res.json({
        success: true,
        message: `Reset rate limit for key '${key}' in limiter '${limiterName}'`
      });
    } else if (limiterName) {
      // Reset all keys in specific limiter
      rateLimiters[limiterName].resetAll();
      
      res.json({
        success: true,
        message: `Reset all rate limits in limiter '${limiterName}'`
      });
    } else {
      // Reset all keys in all limiters
      Object.entries(rateLimiters).forEach(([name, limiter]) => {
        limiter.resetAll();
      });
      
      res.json({
        success: true,
        message: 'Reset all rate limits in all limiters'
      });
    }
  } catch (error) {
    console.error('Error resetting rate limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset rate limits'
    });
  }
});

/**
 * POST /api/security/rate-limit/adaptive/reset
 * 
 * Resets all rate limiters to their base configurations
 */
router.post('/adaptive/reset', async (req, res) => {
  try {
    adaptiveRateLimiter.resetToBaseConfigs();
    
    res.json({
      success: true,
      message: 'Reset all rate limiters to base configurations'
    });
  } catch (error) {
    console.error('Error resetting adaptive rate limiters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset adaptive rate limiters'
    });
  }
});

/**
 * POST /api/security/rate-limit/adaptive/adjust
 * 
 * Forces an immediate adjustment of rate limits
 */
router.post('/adaptive/adjust', async (req, res) => {
  try {
    adaptiveRateLimiter.adjustRateLimits();
    
    const adaptiveMetrics = getAdaptiveAdjustmentMetrics();
    
    res.json({
      success: true,
      message: 'Rate limits adjusted',
      adaptiveMetrics
    });
  } catch (error) {
    console.error('Error adjusting rate limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust rate limits'
    });
  }
});

export default router;