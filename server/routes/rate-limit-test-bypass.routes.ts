/**
 * Rate Limiting Test Bypass Routes
 * 
 * This file contains test endpoints that bypass CSRF protection to test rate limiting.
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
  // Apply rate limiting manually
  const clientIp = getClientIp(req);
  const userId = req.session?.['userId'] as string || 'anonymous';
  
  const context = {
    clientIp,
    userId,
    path: req.path,
    method: req.method,
    isAuthenticated: Boolean(req.session?.['userId']),
    resourceType: 'api'
  };
  
  // Consume 1 token
  const result = rateLimitingSystem.consumeTokens(context);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetTime.toString());
  
  // Check if rate limited
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.resetTime
    });
  }
  
  return res.json({
    success: true,
    message: 'Basic rate limit test endpoint',
    timestamp: new Date().toISOString(),
    clientIp,
    userId,
    tokens: {
      remaining: result.remaining,
      limit: result.limit,
      reset: result.resetTime
    }
  });
});

/**
 * Test endpoint for high-cost rate limiting
 * This endpoint consumes 5 tokens per request
 */
router.get('/high-cost', (req: Request, res: Response) => {
  // Apply rate limiting manually
  const clientIp = getClientIp(req);
  const userId = req.session?.['userId'] as string || 'anonymous';
  
  const context = {
    clientIp,
    userId,
    path: req.path,
    method: req.method,
    isAuthenticated: Boolean(req.session?.['userId']),
    resourceType: 'api',
    costMultiplier: 5
  };
  
  // Consume 5 tokens
  const result = rateLimitingSystem.consumeTokens(context, 5);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetTime.toString());
  
  // Check if rate limited
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.resetTime
    });
  }
  
  return res.json({
    success: true,
    message: 'High-cost rate limit test endpoint (5 tokens)',
    timestamp: new Date().toISOString(),
    clientIp,
    userId,
    tokens: {
      remaining: result.remaining,
      limit: result.limit,
      reset: result.resetTime,
      cost: 5
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
    const userId = req.session?.['userId'] as string || 'anonymous';
    
    // Record a simulated security failure
    rateLimitingSystem.recordFailedSecurityCheck({
      clientIp,
      userId,
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
      clientIp,
      userId,
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
    const userId = req.session?.['userId'] as string || 'anonymous';
    
    // Record a simulated security success
    rateLimitingSystem.recordSuccessfulSecurityCheck({
      clientIp,
      userId,
      securityComponent: 'test',
      checkType: 'simulation',
      successValue: 5 // Reward for testing
    });
    
    return res.json({
      success: true,
      message: 'Simulated security success recorded',
      timestamp: new Date().toISOString(),
      clientIp,
      userId,
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
      report: {
        totalRequestsProcessed: report.totalRequestsProcessed,
        totalRequestsAllowed: report.totalRequestsAllowed,
        totalRequestsRateLimited: report.totalRequestsRateLimited,
        rateLimitPercentage: report.rateLimitPercentage,
        averageTokensPerClient: report.averageTokensPerClient
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Error in stats endpoint: ${error}`, 'error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Wrapper for test routes that ensures they are only available in development
 */
function createRateLimitTestBypassRouter() {
  const bypassRouter = Router();
  
  // Add a direct bypass endpoint that specifically skips CSRF
  bypassRouter.use('/no-csrf/rate-limit-test*', (req: Request, res: Response, next: NextFunction) => {
    // Mark this request to skip CSRF validation
    (req as any).__skipCSRF = true;
    log(`Direct CSRF bypass for rate limiting test: ${req.method} ${req.path}`, 'warn');
    
    // Continue to the actual route handlers
    return router(req, res, next);
  });
  
  // Only enable in non-production environments
  if (config.environment !== 'production') {
    bypassRouter.use('/api/test/rate-limit', router);
    log('Rate limit test bypass endpoints enabled at /api/test/rate-limit/*', 'info');
  } else {
    // In production, return 404 for all test routes
    bypassRouter.use('/api/test/rate-limit', (req: Request, res: Response) => {
      return res.status(404).json({
        error: 'Not found',
        message: 'Rate limit test bypass endpoints are disabled in production'
      });
    });
    log('Rate limit test bypass endpoints disabled in production', 'info');
  }
  
  return bypassRouter;
}

export const rateLimitTestBypassRouter = createRateLimitTestBypassRouter();