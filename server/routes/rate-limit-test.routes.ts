/**
 * Rate Limiting Test Routes
 * 
 * This file contains test endpoints to validate rate limiting behavior.
 * These routes should be disabled in production.
 */

import { Router, Request, Response } from 'express';
import { log } from '../utils/logger';
import { rateLimitingSystem } from '../security/advanced/threat/RateLimitingSystem';
import { getClientIp } from '../utils/ip-utils';
import { config } from '../config';

const router = Router();

/**
 * Test endpoint for basic rate limiting
 * This endpoint consumes 1 token per request
 */
router.get('/basic', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Basic rate limit test endpoint',
    timestamp: new Date().toISOString(),
    clientIp: getClientIp(req),
    headers: {
      'X-RateLimit-Limit': res.getHeader('X-RateLimit-Limit'),
      'X-RateLimit-Remaining': res.getHeader('X-RateLimit-Remaining'),
      'X-RateLimit-Reset': res.getHeader('X-RateLimit-Reset')
    }
  });
});

/**
 * Test endpoint for high-cost rate limiting
 * This endpoint consumes 5 tokens per request
 */
router.get('/high-cost', (req: Request, res: Response) => {
  // This will be handled by the context builder, which will
  // assign a higher cost to this endpoint based on the custom header
  res.setHeader('X-Rate-Limit-Cost', '5');
  
  return res.json({
    success: true,
    message: 'High-cost rate limit test endpoint (5 tokens)',
    timestamp: new Date().toISOString(),
    clientIp: getClientIp(req),
    headers: {
      'X-RateLimit-Limit': res.getHeader('X-RateLimit-Limit'),
      'X-RateLimit-Remaining': res.getHeader('X-RateLimit-Remaining'),
      'X-RateLimit-Reset': res.getHeader('X-RateLimit-Reset')
    }
  });
});

/**
 * Test endpoint for simulating security failures
 * Records a security failure that affects rate limiting
 */
router.get('/simulate-security-failure', (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    
    // Record a simulated security failure
    rateLimitingSystem.recordFailedSecurityCheck({
      clientIp,
      userId: req.session?.['userId'] as string || 'anonymous',
      securityComponent: 'test',
      checkType: 'simulation',
      failureType: 'simulated_failure',
      path: req.path,
      failureValue: 10 // High penalty for testing
    });
    
    return res.json({
      success: true,
      message: 'Simulated security failure recorded',
      timestamp: new Date().toISOString(),
      clientIp: getClientIp(req),
      note: 'Your next requests may be more restricted due to this simulated failure'
    });
  } catch (error) {
    log(`Error in simulate-security-failure endpoint: ${error}`, 'error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test endpoint for simulating security success
 * Records a security success that affects rate limiting
 */
router.get('/simulate-security-success', (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    
    // Record a simulated security success
    rateLimitingSystem.recordSuccessfulSecurityCheck({
      clientIp,
      userId: req.session?.['userId'] as string || 'anonymous',
      securityComponent: 'test',
      checkType: 'simulation',
      successValue: 5 // Reward for testing
    });
    
    return res.json({
      success: true,
      message: 'Simulated security success recorded',
      timestamp: new Date().toISOString(),
      clientIp: getClientIp(req),
      note: 'Your next requests may be less restricted due to this simulated success'
    });
  } catch (error) {
    log(`Error in simulate-security-success endpoint: ${error}`, 'error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test endpoint for getting rate limiting stats
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    const userId = req.session?.['userId'] as string || 'anonymous';
    
    // Get deficit information
    const deficit = rateLimitingSystem.getTokenDeficit({
      clientIp,
      userId,
      path: req.path
    });
    
    // Get a report of rate limiting activity
    const report = rateLimitingSystem.generateReport();
    
    // Get adaptive adjustment metrics
    const adaptiveMetrics = rateLimitingSystem.getAdaptiveAdjustmentMetrics();
    
    return res.json({
      success: true,
      clientInfo: {
        clientIp,
        userId,
        deficit
      },
      metrics: {
        adaptiveMultipliers: adaptiveMetrics
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Error in stats endpoint: ${error}`, 'error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Wrapper for test routes that ensures they are only available in non-production environments
 */
function createRateLimitTestRouter() {
  const testRouter = Router();
  
  // Only enable in non-production environments
  if (config.environment !== 'production') {
    testRouter.use('/rate-limit-test', router);
    log('Rate limit test endpoints enabled', 'info');
  } else {
    // In production, return 404 for all test routes
    testRouter.use('/rate-limit-test', (req: Request, res: Response) => {
      return res.status(404).json({
        error: 'Not found',
        message: 'Rate limit test endpoints are disabled in production'
      });
    });
    log('Rate limit test endpoints disabled in production', 'info');
  }
  
  return testRouter;
}

export const rateLimitTestRouter = createRateLimitTestRouter();