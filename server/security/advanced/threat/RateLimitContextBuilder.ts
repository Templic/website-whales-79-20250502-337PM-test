/**
 * Rate Limit Context Builder
 * 
 * Builds rich context objects from HTTP requests for use in context-aware rate limiting.
 * Extracts and normalizes various properties that might influence rate limiting decisions.
 */

import { Request } from 'express';
import { RequestContext } from './TokenBucketRateLimiter';

// Import optional services if available
let systemMonitor: any;
let securityFabric: any;

try {
  // Attempt to import system monitor for load information
  systemMonitor = require('../../../utils/systemMonitor');
} catch (error) {
  console.log('System monitor not available for rate limit context');
}

try {
  // Attempt to import security fabric for threat information
  securityFabric = require('../SecurityFabric').default;
} catch (error) {
  console.log('Security fabric not available for rate limit context');
}

/**
 * Builds a rich context object from the request for rate limiting decisions
 * 
 * @param req The Express request object
 * @param customContextBuilder Optional function to add custom context data
 * @returns A context object for rate limiting decisions
 */
export function buildRateLimitContext(
  req: Request, 
  customContextBuilder?: (req: Request) => Record<string, any>
): RequestContext {
  // Extract basic request data
  const context: RequestContext = {
    ip: req.ip || req.socket.remoteAddress || '0.0.0.0',
    path: req.path,
    method: req.method,
    headers: {...req.headers} as Record<string, string>,
    securityRisk: 0,
    systemLoad: 0
  };
  
  // Add user info if available
  if (req.user) {
    context.userId = (req.user as any).id;
    context.userRole = (req.user as any).role;
  }
  
  // Determine resource type from path
  if (req.path.includes('/api/admin')) {
    context.resourceType = 'admin';
  } else if (req.path.includes('/api/security')) {
    context.resourceType = 'security';
  } else if (req.path.includes('/api/auth')) {
    context.resourceType = 'auth';
  } else if (req.path.startsWith('/api/')) {
    context.resourceType = 'api';
  } else {
    context.resourceType = 'public';
  }
  
  // Add system load if available
  if (systemMonitor && systemMonitor.getCurrentLoad) {
    context.systemLoad = systemMonitor.getCurrentLoad() || 0;
  }
  
  // Add security risk assessment if available
  if (securityFabric && securityFabric.getThreatScore) {
    try {
      const threatScore = securityFabric.getThreatScore(req.ip);
      context.securityRisk = threatScore / 100; // Normalize to 0-1
    } catch (error) {
      console.error('Error getting threat score:', error);
    }
  }
  
  // Add custom context data if provided
  if (customContextBuilder) {
    try {
      context.customData = customContextBuilder(req);
    } catch (error) {
      console.error('Error building custom context:', error);
      context.customData = {};
    }
  }
  
  return context;
}

/**
 * Get a simplified string representation of the context for logging
 */
export function stringifyContext(context: RequestContext): string {
  return JSON.stringify({
    ip: context.ip,
    userId: context.userId,
    userRole: context.userRole,
    path: context.path,
    method: context.method,
    resourceType: context.resourceType,
    securityRisk: context.securityRisk,
    systemLoad: context.systemLoad
  });
}