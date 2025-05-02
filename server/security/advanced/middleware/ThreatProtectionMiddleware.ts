/**
 * Threat Protection Middleware
 * 
 * Implements real-time threat detection and protection for the application:
 * - Request inspection and threat detection
 * - Rate limiting based on token bucket algorithm
 * - IP blocking for malicious actors
 * - Request validation against known attack patterns
 */

import { Request, Response, NextFunction } from 'express';
import { threatDetectionService, type DetectionContext } from '../threat/ThreatDetectionService';
import { threatMonitoringService } from '../threat/ThreatMonitoringService';
import { TokenBucketRateLimiter } from '../threat/TokenBucketRateLimiter';
import LRUCache from '../threat/SecurityCache';
import { securityConfig, SecurityLevel } from '../config/SecurityConfig';

// Import threat types from database service
import { ThreatType, ThreatSeverity } from '../threat/ThreatDatabaseService';

// ThreatSeverity imported from ThreatDatabaseService

// Interface for detected threats
export interface DetectedThreat {
  type: ThreatType;
  severity: ThreatSeverity;
  description: string;
  details?: any;
  includeBody?: boolean;
  autoBlock?: boolean;
}

// IP-based rate limiter
const ipRateLimiter = new TokenBucketRateLimiter({
  tokensPerInterval: 300,  // 300 requests per minute by default (increased from 100)
  interval: 60000,         // 1 minute
  burstCapacity: 500       // Allow bursts up to 500 requests (increased from 200)
});

// Cache for storing temporarily banned IPs (for quick lookups without hitting DB)
const blockedIpsCache = new LRUCache<string, { reason: string, until: number }>(1000, 24 * 60 * 60 * 1000);

// Reset all block caches on startup to prevent stale blocks from previous runs
console.log("[Security] Clearing IP block cache on server startup");
blockedIpsCache.clear(); // Explicitly clear the cache on server startup

// Infrastructure IPs that should always be allowed
const infraWhitelist = [
  '34.75.203.116', // Replit infrastructure
  '68.230.197.31',  // Detected in logs
  '127.0.0.1',     // Local development
  'localhost'      // Local development
];

// Configure paths that should be exempt from rate limiting (public resources, etc.)
const rateLimitExemptPaths = [
  /^\/static\//,
  /^\/public\//,
  /^\/assets\//,
  /^\/js\//,
  /^\/css\//,
  /^\/img\//,
  /^\/fonts\//,
  /^\/api\/public\//,
  /^\/favicon\.ico$/,
  /^\/api\/health$/,
  /^\/metrics$/,
  /^\/api\/metrics$/,
  /^\/assets\//,
  /\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i
];

/**
 * Get the current security level
 * Used to control protection intensity and what features are active
 */
function getSecurityLevel(): SecurityLevel {
  return securityConfig.getSecurityLevel();
}

/**
 * Detect and block threats in incoming requests
 * Security levels: MONITOR, LOW, MEDIUM, HIGH, MAXIMUM
 */
export const threatProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Extract client IP
  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
  
  // Skip threat protection for health checks and internal requests
  if (req.path === '/health' || req.path === '/api/internal/status' || req.path === '/api/internal/metrics') {
    return next();
  }
  
  // For development/testing, give special credentials to Replit users and localhost
  if (clientIp === '127.0.0.1' || clientIp === 'localhost' || clientIp.startsWith('10.') || 
      clientIp.startsWith('172.') || clientIp.startsWith('192.168.')) {
    // Mark this request as from a developer for potential elevated permissions
    req.headers['x-developer-request'] = 'true';
  }

  // Static asset paths should bypass most security (but not all)
  const isStaticAsset = req.path.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i) !== null;

  // Get current active security level
  const securityLevel = getSecurityLevel();
  
  // In MONITOR mode, only record events but don't block
  const monitorOnly = securityLevel === 'MONITOR';
  
  // Skip rest of checks for static assets in LOW mode
  if (isStaticAsset && securityLevel === 'LOW') {
    threatMonitoringService.recordApiRequest(false);
    return next();
  }
  
  // Check if IP is blocked (with better whitelist) - enabled in MEDIUM+ modes
  if (securityLevel !== 'MONITOR' && 
      securityLevel !== 'LOW' && 
      !isStaticAsset && 
      isIpBlocked(clientIp)) {
    
    // Log the block event
    threatMonitoringService.recordApiRequest(true);
    console.log(`[Security] Blocked request from ${clientIp} - IP is in block list (${securityLevel} mode)`);
    
    // Only return block response in MEDIUM, HIGH or MAXIMUM modes
    return res.status(403).json({ 
      error: 'Access denied',
      code: 'IP_BLOCKED',
      message: 'Your IP address has been blocked due to suspicious activity',
      canAppeal: true,
      appealProcess: 'Please contact support if you believe this is an error'
    });
  }
  
  // Skip rate limiting for exempt paths
  const shouldRateLimit = !rateLimitExemptPaths.some(pattern => pattern.test(req.path));
  
  // Apply rate limiting if needed and security level is appropriate (MEDIUM+)
  if (shouldRateLimit && 
      securityLevel !== 'MONITOR' && 
      securityLevel !== 'LOW') {
    
    // Skip rate limiting for static assets unless in MAXIMUM mode
    if (!isStaticAsset || securityLevel === 'MAXIMUM') {
      // Get custom rate limit for this path if any
      const pathRate = getPathRateLimit(req.path);
      if (pathRate) {
        ipRateLimiter.setCustomConfig(clientIp, pathRate);
      }
      
      if (!ipRateLimiter.consume(clientIp)) {
        // Rate limit exceeded
        threatMonitoringService.recordApiRequest(true);
        
        // Increment failed attempt counter
        const attemptsCache = getAttemptsCache();
        const attempts = (attemptsCache.get(clientIp) || 0) + 1;
        attemptsCache.set(clientIp, attempts);
        
        // If too many rate limit violations, consider it a threat
        if (attempts >= 10) {
          threatDetectionService.reportThreat({
            threatType: 'RATE_LIMIT_ABUSE' as ThreatType,
            severity: 'medium' as ThreatSeverity,
            sourceIp: clientIp,
            description: `Rate limit exceeded multiple times (${attempts} attempts)`,
            evidence: {
              path: req.path,
              method: req.method,
              headers: req.headers as Record<string, string>,
              attempts
            }
          });
          
          // Only block in HIGH or MAXIMUM mode
          if (securityLevel === 'HIGH' || securityLevel === 'MAXIMUM') {
            // Temporarily block IP - shorter time in HIGH mode
            const blockTime = securityLevel === 'HIGH' ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 or 15 minutes
            blockedIpsCache.set(clientIp, { 
              reason: 'Rate limit abuse', 
              until: Date.now() + blockTime
            });
          }
        }
        
        // Set rate limit headers
        const retryAfter = Math.ceil(ipRateLimiter.getTimeToNextToken(clientIp) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        
        // Return rate limit response
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter
        });
      }
    }
  }
  
  // Record API request - always do this in all modes
  threatMonitoringService.recordApiRequest(false);
  
  // Check for threats in all security levels, but only block in appropriate levels
  const threatInfo = inspectRequest(req);
  if (threatInfo) {
    // Always report the threat regardless of security level
    const threatId = threatDetectionService.reportThreat({
      threatType: threatInfo.type as ThreatType,
      severity: threatInfo.severity,
      sourceIp: clientIp,
      description: threatInfo.description,
      evidence: {
        path: req.path,
        method: req.method,
        query: req.query,
        headers: req.headers as Record<string, string>,
        body: threatInfo.includeBody ? req.body : undefined,
        detectionDetails: threatInfo.details
      }
    });
    
    // Auto-block in HIGH and MAXIMUM modes only
    if ((securityLevel === 'HIGH' || securityLevel === 'MAXIMUM') && 
        threatInfo.autoBlock) {
      
      blockedIpsCache.set(clientIp, { 
        reason: threatInfo.description, 
        until: Date.now() + 60 * 60 * 1000 // 1 hour
      });
      
      threatDetectionService.blockIp(
        clientIp, 
        threatInfo.description, 
        60 * 60 // 1 hour
      );
      
      // Block based on security level - use string comparison for proper TypeScript type checking
      const blockingLevels: SecurityLevel[] = ['MEDIUM', 'HIGH', 'MAXIMUM'];
      if (blockingLevels.includes(securityLevel)) {
        return res.status(403).json({ 
          error: 'Access denied',
          code: 'SECURITY_VIOLATION'
        });
      }
    }
    
    // For low severity threats, just log and continue
    if (threatInfo.severity === 'low') {
      // Allow the request but mark it
      req.threatDetected = true;
      req.threatId = typeof threatId === 'string' ? threatId : 'unknown-threat';
      return next();
    }
    
    // Block medium+ severity in appropriate security levels
    const blockingLevels: SecurityLevel[] = ['MEDIUM', 'HIGH', 'MAXIMUM'];
    if (blockingLevels.includes(securityLevel)) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'SECURITY_VIOLATION'
      });
    }
  }
  
  // Add response interceptor for HIGH and MAXIMUM modes only
  if (securityLevel === 'HIGH' || securityLevel === 'MAXIMUM') {
    const originalSend = res.send;
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      
      // Skip response inspection for static content or non-strings
      if (!isStaticAsset && typeof body === 'string' && body.length > 0) {
        const responseThreat = inspectResponse(body, req, responseTime);
        
        if (responseThreat) {
          // Report the threat
          threatDetectionService.reportThreat({
            threatType: responseThreat.type as ThreatType,
            severity: responseThreat.severity,
            sourceIp: clientIp,
            description: responseThreat.description,
            evidence: {
              path: req.path,
              method: req.method,
              headers: req.headers as Record<string, string>,
              responseTime,
              responseSize: body.length,
              detectionDetails: responseThreat.details
            }
          });
          
          // In MAXIMUM mode, we can actually block dangerous responses
          if (securityLevel === 'MAXIMUM' && 
              (responseThreat.severity === 'high' || responseThreat.severity === 'critical')) {
            // Replace with sanitized response for high severity threats
            return originalSend.call(this, JSON.stringify({
              error: 'Response blocked',
              code: 'RESPONSE_SECURITY_VIOLATION',
              reason: 'The server response was blocked due to security policy violations.'
            }));
          }
        }
      }
      
      return originalSend.call(this, body);
    };
  }
  
  next();
};

/**
 * Check if an IP is currently blocked
 * Note: This is a synchronous function for blocking decisions 
 * that uses both memory cache and asynchronous database checks.
 */
function isIpBlocked(ip: string): boolean {
  // Skip blocking for IPs in the infrastructure whitelist
  if (infraWhitelist.includes(ip)) {
    console.log(`[Security] Allowing whitelisted IP: ${ip}`);
    return false;
  }
  
  // Skip blocking for localhost, internal IPs, and Replit infrastructure
  if (ip === '127.0.0.1' || ip === 'localhost' || 
      ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.') ||
      // Replit specific infrastructure IPs - never block these
      ip === '35.229.33.38' || ip.startsWith('35.') || ip.startsWith('34.') || 
      ip.startsWith('104.') || ip.startsWith('172.') || ip.startsWith('34.') ||
      // Google Cloud infrastructure which Replit may use
      ip.includes('googleusercontent') || ip.includes('compute.internal')) {
    console.log(`[Security] Allowing infrastructure IP: ${ip}`);
    return false;
  }
  
  // First check in-memory cache for performance
  const cachedBlock = blockedIpsCache.get(ip);
  if (cachedBlock) {
    // Check if block has expired
    if (cachedBlock.until > Date.now()) {
      console.log(`[Security] Blocked request from ${ip} - IP is in block list`);
      return true;
    } else {
      // Expired, remove from cache
      blockedIpsCache.delete(ip);
    }
  }
  
  // Trigger database check asynchronously to update cache for future requests
  // but still return the current cache state for this request
  setTimeout(() => {
    threatDetectionService.isIpBlocked(ip)
      .then(blocked => {
        if (blocked) {
          // Update cache for future requests
          blockedIpsCache.set(ip, { 
            reason: 'Database block', 
            until: Date.now() + 24 * 60 * 60 * 1000 // 24 hours cache
          });
          console.log(`[Security] IP ${ip} confirmed blocked from database`);
        }
      })
      .catch(err => {
        console.error('Error checking IP block status:', err);
      });
  }, 0);
  
  // For this request, we rely on cache only for performance
  return false;
}

/**
 * Get custom rate limit config for specific paths
 */
function getPathRateLimit(path: string): { tokensPerInterval: number, interval: number, burstCapacity: number } | null {
  // API-specific rate limits
  if (path.startsWith('/api/auth')) {
    return {
      tokensPerInterval: 20,   // 20 requests per 5 minutes
      interval: 5 * 60 * 1000, // 5 minutes
      burstCapacity: 30        // Max 30 at once
    };
  }
  
  if (path.startsWith('/api/user/password-reset')) {
    return {
      tokensPerInterval: 5,    // 5 requests per 10 minutes
      interval: 10 * 60 * 1000, // 10 minutes
      burstCapacity: 10        // Max 10 at once
    };
  }
  
  if (path.startsWith('/api/search')) {
    return {
      tokensPerInterval: 60,   // 60 requests per minute
      interval: 60 * 1000,     // 1 minute
      burstCapacity: 80        // Max 80 at once
    };
  }
  
  return null;
}

/**
 * Get or create the attempts cache for rate limiting
 */
function getAttemptsCache(): LRUCache<string, number> {
  let cache = (global as any).__rateAttemptsCache;
  if (!cache) {
    cache = new LRUCache<string, number>(1000, 30 * 60 * 1000); // 30 minute expiry
    (global as any).__rateAttemptsCache = cache;
  }
  return cache;
}

/**
 * Inspect incoming request for threats
 */
function inspectRequest(req: Request): DetectedThreat | null {
  try {
    // Apply all active detection rules
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
    
    // Create a context object that exactly matches the DetectionContext interface
    const context: DetectionContext = {
      ip: clientIp,
      path: req.path,
      method: req.method,
      params: req.params || {},
      headers: req.headers as Record<string, string>,
      body: req.body, 
      data: {
        query: req.query
      }
    };
    
    const scanResult = threatDetectionService.scanRequest(context);
    
    // Check if any threats were detected
    if (scanResult && Array.isArray(scanResult) && scanResult.length > 0) {
      // Use the highest severity threat
      const highestThreat = scanResult.reduce((highest, current) => {
        // Safely compare severity levels
        const severityRank: Record<ThreatSeverity, number> = {
          'low': 1,
          'medium': 2,
          'high': 3,
          'critical': 4
        };
        
        const currentRank = severityRank[current.severity as ThreatSeverity] || 0;
        const highestRank = severityRank[highest.severity as ThreatSeverity] || 0;
        
        return (currentRank > highestRank) ? current : highest;
      }, scanResult[0]);
      
      return {
        type: highestThreat.type,
        severity: highestThreat.severity as 'low' | 'medium' | 'high' | 'critical',
        description: highestThreat.description,
        details: highestThreat.details,
        includeBody: highestThreat.includeBody,
        autoBlock: highestThreat.autoBlock
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Security] Error in threat detection:', error);
    return null;
  }
}

/**
 * Inspect response for suspicious patterns
 */
function inspectResponse(body: string, req: Request, responseTime: number): DetectedThreat | null {
  // For now just check for extremely slow responses that could indicate
  // a security issue like database data exfiltration
  if (responseTime > 5000 && body.length > 100000) {
    return {
      type: 'SUSPICIOUS_RESPONSE' as ThreatType,
      severity: 'low' as ThreatSeverity,
      description: 'Suspiciously large and slow response detected',
      details: {
        responseTime,
        responseSize: body.length,
        path: req.path
      }
    };
  }
  
  // Could add more checks here for:
  // - Data leakage (e.g., stack traces, internal IPs)
  // - Sensitive data patterns
  // - Unauthorized data access patterns
  
  return null;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      threatDetected?: boolean;
      threatId?: string;
    }
  }
}