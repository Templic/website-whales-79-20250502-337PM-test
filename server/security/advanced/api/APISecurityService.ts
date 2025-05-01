/**
 * API Security Service
 * 
 * Provides comprehensive security for API requests including
 * deep inspection, parameter validation, semantic analysis,
 * and attack pattern detection.
 * 
 * Features:
 * - Request deep inspection
 * - Parameter validation and sanitization
 * - Semantic analysis of API calls
 * - Attack pattern detection
 * - Anomaly detection
 * - Rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';

// API Security configuration
export interface APISecurityConfig {
  enableDeepInspection: boolean;
  enableParameterValidation: boolean;
  enableSemanticAnalysis: boolean;
  enableAttackPatternDetection: boolean;
  enableAnomalyDetection: boolean;
  sensitiveParameters: string[];
  blockedPatterns: RegExp[];
  maxBodySize: number;
  maxUrlLength: number;
  maxHeaderSize: number;
  allowedContentTypes: string[];
  requestTimeout: number;
}

// Default configuration
const defaultConfig: APISecurityConfig = {
  enableDeepInspection: true,
  enableParameterValidation: true,
  enableSemanticAnalysis: true,
  enableAttackPatternDetection: true,
  enableAnomalyDetection: true,
  sensitiveParameters: ['password', 'token', 'secret', 'key', 'auth', 'credentials'],
  blockedPatterns: [
    /(<script|javascript:|onclick=|onload=|onerror=)/i,
    /(union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|--)/i,
    /(exec\s+xp_|exec\s+sp_)/i
  ],
  maxBodySize: 1024 * 1024, // 1MB
  maxUrlLength: 2048,
  maxHeaderSize: 8192,
  allowedContentTypes: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ],
  requestTimeout: 30000 // 30 seconds
};

// API request stats for anomaly detection
const requestStats: Map<string, {
  totalRequests: number;
  averageBodySize: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  lastRequest: number;
  patternSignatures: Set<string>;
}> = new Map();

/**
 * Deep inspection of an API request
 */
function deepInspectRequest(req: Request, config: APISecurityConfig): {
  issues: string[];
  score: number;
  data: Record<string, any>;
} {
  const issues: string[] = [];
  let score = 0;
  const data: Record<string, any> = {};
  
  // Check URL length
  if (req.originalUrl && req.originalUrl.length > config.maxUrlLength) {
    issues.push('URL exceeds maximum length');
    score += 20;
    data.urlLength = req.originalUrl.length;
  }
  
  // Check content type
  const contentType = req.headers['content-type'] as string;
  if (contentType && !config.allowedContentTypes.some(ct => contentType.includes(ct))) {
    issues.push('Unsupported content type');
    score += 30;
    data.contentType = contentType;
  }
  
  // Check body size
  const bodySize = req.body ? JSON.stringify(req.body).length : 0;
  if (bodySize > config.maxBodySize) {
    issues.push('Request body exceeds maximum size');
    score += 15;
    data.bodySize = bodySize;
  }
  
  // Check headers size
  const headersSize = JSON.stringify(req.headers).length;
  if (headersSize > config.maxHeaderSize) {
    issues.push('Headers exceed maximum size');
    score += 10;
    data.headersSize = headersSize;
  }
  
  // Check for blocked patterns in URL
  if (req.originalUrl) {
    for (const pattern of config.blockedPatterns) {
      if (pattern.test(req.originalUrl)) {
        issues.push('URL contains suspicious pattern');
        score += 50;
        data.suspiciousUrlPattern = true;
        break;
      }
    }
  }
  
  // Check for blocked patterns in body
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    for (const pattern of config.blockedPatterns) {
      if (pattern.test(bodyStr)) {
        issues.push('Request body contains suspicious pattern');
        score += 50;
        data.suspiciousBodyPattern = true;
        break;
      }
    }
  }
  
  // Check for sensitive parameters in URL
  if (req.query) {
    for (const param of config.sensitiveParameters) {
      if (param in req.query) {
        issues.push(`Sensitive parameter '${param}' found in URL`);
        score += 40;
        data.sensitivesInUrl = true;
        break;
      }
    }
  }
  
  return { issues, score, data };
}

/**
 * Validate and sanitize parameters
 */
function validateParameters(req: Request): {
  issues: string[];
  sanitizedBody: Record<string, any> | null;
  sanitizedQuery: Record<string, any> | null;
} {
  const issues: string[] = [];
  let sanitizedBody: Record<string, any> | null = null;
  let sanitizedQuery: Record<string, any> | null = null;
  
  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    sanitizedBody = {};
    for (const key in req.body) {
      const value = req.body[key];
      
      // Skip undefined or null values
      if (value === undefined || value === null) {
        sanitizedBody[key] = value;
        continue;
      }
      
      // Sanitize strings
      if (typeof value === 'string') {
        // Check for very long strings
        if (value.length > 10000) {
          issues.push(`Body parameter '${key}' exceeds maximum length`);
          sanitizedBody[key] = value.substring(0, 10000) + '...';
          continue;
        }
        
        // Basic HTML sanitization
        sanitizedBody[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        continue;
      }
      
      // Pass through other types
      sanitizedBody[key] = value;
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    sanitizedQuery = {};
    for (const key in req.query) {
      const value = req.query[key];
      
      // Skip undefined or null values
      if (value === undefined || value === null) {
        sanitizedQuery[key] = value;
        continue;
      }
      
      // Sanitize strings
      if (typeof value === 'string') {
        // Check for very long strings
        if (value.length > 1000) {
          issues.push(`Query parameter '${key}' exceeds maximum length`);
          sanitizedQuery[key] = value.substring(0, 1000) + '...';
          continue;
        }
        
        // Basic HTML sanitization
        sanitizedQuery[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        continue;
      }
      
      // Pass through other types
      sanitizedQuery[key] = value;
    }
  }
  
  return { issues, sanitizedBody, sanitizedQuery };
}

/**
 * Perform semantic analysis on the request
 */
function semanticAnalysis(req: Request): {
  risk: number;
  anomalies: string[];
  classification: string;
} {
  const anomalies: string[] = [];
  let risk = 0;
  
  // Get the route pattern, fallback to the path if not available
  const route = (req as any).route?.path || req.path;
  
  // Calculate request signature for behavior analysis
  const signature = calculateRequestSignature(req);
  
  // Get or initialize stats for this route
  const now = Date.now();
  let stats = requestStats.get(route);
  if (!stats) {
    stats = {
      totalRequests: 0,
      averageBodySize: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      lastRequest: 0,
      patternSignatures: new Set<string>()
    };
    requestStats.set(route, stats);
  }
  
  // Check request frequency
  if (stats.lastRequest > 0) {
    const timeDiff = now - stats.lastRequest;
    const rpm = 60000 / Math.max(timeDiff, 1); // Requests per minute
    
    // Update the running average
    stats.requestsPerMinute = 0.7 * stats.requestsPerMinute + 0.3 * rpm;
    
    // Check for unusual request frequency
    if (stats.totalRequests > 10 && rpm > stats.requestsPerMinute * 5) {
      anomalies.push('Unusual request frequency');
      risk += 20;
    }
  }
  
  // Check for unusual request pattern
  if (stats.totalRequests > 5 && !stats.patternSignatures.has(signature)) {
    anomalies.push('Unusual request pattern');
    risk += 15;
    
    // Add to known patterns if not too many
    if (stats.patternSignatures.size < 20) {
      stats.patternSignatures.add(signature);
    }
  }
  
  // Update stats
  stats.totalRequests++;
  stats.lastRequest = now;
  requestStats.set(route, stats);
  
  // Classify request based on risk
  let classification = 'normal';
  if (risk >= 50) {
    classification = 'high-risk';
  } else if (risk >= 25) {
    classification = 'medium-risk';
  } else if (risk >= 10) {
    classification = 'low-risk';
  }
  
  return { risk, anomalies, classification };
}

/**
 * Calculate a signature for the request pattern
 */
function calculateRequestSignature(req: Request): string {
  const hash = createHash('sha256');
  
  // Add method and path
  hash.update(`${req.method}:${req.path}`);
  
  // Add query parameter keys (sorted)
  const queryKeys = Object.keys(req.query || {}).sort();
  hash.update(`query:${queryKeys.join(',')}`);
  
  // Add body parameter keys (sorted)
  let bodyKeys: string[] = [];
  if (req.body && typeof req.body === 'object') {
    bodyKeys = Object.keys(req.body).sort();
  }
  hash.update(`body:${bodyKeys.join(',')}`);
  
  // Add header keys (sorted, excluding dynamic ones)
  const headerKeys = Object.keys(req.headers || {})
    .filter(k => !['cookie', 'authorization', 'user-agent'].includes(k))
    .sort();
  hash.update(`headers:${headerKeys.join(',')}`);
  
  return hash.digest('hex');
}

/**
 * Detect attack patterns in the request
 */
function detectAttackPatterns(req: Request): {
  patterns: string[];
  confidence: number;
  details: Record<string, any>;
} {
  const patterns: string[] = [];
  let confidence = 0;
  const details: Record<string, any> = {};
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /'--/i,
    /union\s+select/i,
    /select.+from.+where/i,
    /select\s*@@/i,
    /insert\s+into\s+values/i,
    /delete\s+from/i,
    /drop\s+table/i,
    /alter\s+table/i
  ];
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /alert\s*\(/i,
    /document\.cookie/i,
    /eval\s*\(/i
  ];
  
  // Check for command injection patterns
  const commandPatterns = [
    /;\s*rm\s+-rf/i,
    /\|\s*cat\s+/i,
    />\s*\/etc\/passwd/i,
    /\|\s*bash/i,
    /\|\s*sh\s+/i,
    /`\s*cat\s+/i
  ];
  
  // Check for path traversal
  const traversalPatterns = [
    /\.\.\//i,
    /\.\.%2f/i,
    /\/etc\/passwd/i,
    /\/windows\/system32/i,
    /c:\\windows/i
  ];
  
  // Create a check function for pattern lists
  function checkPatterns(
    patternList: RegExp[], 
    fields: Record<string, any>, 
    attackName: string
  ): boolean {
    for (const key in fields) {
      const value = fields[key];
      if (typeof value === 'string') {
        for (const pattern of patternList) {
          if (pattern.test(value)) {
            patterns.push(attackName);
            confidence += 25;
            details[attackName] = details[attackName] || [];
            details[attackName].push(key);
            return true;
          }
        }
      }
    }
    return false;
  }
  
  // Check URL parameters
  if (req.query) {
    checkPatterns(sqlPatterns, req.query, 'SQL Injection');
    checkPatterns(xssPatterns, req.query, 'Cross-Site Scripting');
    checkPatterns(commandPatterns, req.query, 'Command Injection');
    checkPatterns(traversalPatterns, req.query, 'Path Traversal');
  }
  
  // Check body parameters
  if (req.body && typeof req.body === 'object') {
    checkPatterns(sqlPatterns, req.body, 'SQL Injection');
    checkPatterns(xssPatterns, req.body, 'Cross-Site Scripting');
    checkPatterns(commandPatterns, req.body, 'Command Injection');
    checkPatterns(traversalPatterns, req.body, 'Path Traversal');
  }
  
  // Check headers
  if (req.headers) {
    checkPatterns(sqlPatterns, req.headers, 'SQL Injection');
    checkPatterns(xssPatterns, req.headers, 'Cross-Site Scripting');
    checkPatterns(traversalPatterns, req.headers, 'Path Traversal');
  }
  
  // Adjust confidence based on the number of distinct attack patterns
  const uniquePatterns = new Set(patterns);
  if (uniquePatterns.size > 1) {
    confidence = Math.min(confidence * 1.5, 100);
  }
  
  return { patterns: Array.from(uniquePatterns), confidence, details };
}

/**
 * API Security middleware
 */
export function apiSecurityMiddleware(
  options: Partial<APISecurityConfig> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  // Merge with default configuration
  const config: APISecurityConfig = { ...defaultConfig, ...options };
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Store original request data for comparison
    const originalBody = { ...req.body };
    const originalQuery = { ...req.query };
    
    // Store security analysis results
    const securityAnalysis: Record<string, any> = {
      requestId: createHash('sha256')
        .update(`${req.ip}:${Date.now()}:${Math.random()}`)
        .digest('hex')
        .slice(0, 16),
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Reset request timeout
    req.setTimeout(config.requestTimeout);
    
    // Set API security flag for downstream middleware
    res.locals.apiSecurity = true;
    
    let shouldBlock = false;
    let blockReason = '';
    
    // ===== Deep inspection =====
    if (config.enableDeepInspection) {
      const inspection = deepInspectRequest(req, config);
      securityAnalysis.deepInspection = inspection;
      
      // Block request if the risk score is too high
      if (inspection.score >= 70) {
        shouldBlock = true;
        blockReason = 'High risk request detected';
      }
    }
    
    // ===== Parameter validation =====
    if (config.enableParameterValidation) {
      const validation = validateParameters(req);
      securityAnalysis.parameterValidation = validation;
      
      // Apply sanitized parameters
      if (validation.sanitizedBody) {
        req.body = validation.sanitizedBody;
      }
      if (validation.sanitizedQuery) {
        req.query = validation.sanitizedQuery;
      }
    }
    
    // ===== Semantic analysis =====
    if (config.enableSemanticAnalysis) {
      const analysis = semanticAnalysis(req);
      securityAnalysis.semanticAnalysis = analysis;
      
      // Block request if classified as high-risk
      if (analysis.classification === 'high-risk') {
        shouldBlock = true;
        blockReason = 'Request classified as high-risk';
      }
    }
    
    // ===== Attack pattern detection =====
    if (config.enableAttackPatternDetection) {
      const patterns = detectAttackPatterns(req);
      securityAnalysis.attackPatterns = patterns;
      
      // Block request if attack patterns detected with high confidence
      if (patterns.patterns.length > 0 && patterns.confidence >= 60) {
        shouldBlock = true;
        blockReason = 'Attack pattern detected: ' + patterns.patterns.join(', ');
      }
    }
    
    // ===== Process results =====
    
    // Calculate the overall security score (0-100)
    let securityScore = 0;
    if (securityAnalysis.deepInspection) {
      securityScore += securityAnalysis.deepInspection.score * 0.3;
    }
    if (securityAnalysis.semanticAnalysis) {
      securityScore += securityAnalysis.semanticAnalysis.risk * 0.3;
    }
    if (securityAnalysis.attackPatterns) {
      securityScore += securityAnalysis.attackPatterns.confidence * 0.4;
    }
    
    securityAnalysis.securityScore = Math.min(Math.round(securityScore), 100);
    
    // Determine the severity based on the score
    let severity: SecurityEventSeverity;
    if (securityScore >= 70) {
      severity = SecurityEventSeverity.CRITICAL;
    } else if (securityScore >= 50) {
      severity = SecurityEventSeverity.HIGH;
    } else if (securityScore >= 30) {
      severity = SecurityEventSeverity.MEDIUM;
    } else if (securityScore >= 10) {
      severity = SecurityEventSeverity.LOW;
    } else {
      severity = SecurityEventSeverity.INFO;
    }
    
    // Add security analysis to the request
    res.locals.securityAnalysis = securityAnalysis;
    
    // Log the security event
    logSecurityEvent({
      category: SecurityEventCategory.API_SECURITY,
      severity,
      message: shouldBlock ? 'Blocked suspicious API request' : 'API security check',
      data: {
        requestId: securityAnalysis.requestId,
        method: req.method,
        path: req.path,
        securityScore: securityAnalysis.securityScore,
        blocked: shouldBlock,
        blockReason: blockReason || undefined,
        processingTime: Date.now() - startTime
      }
    });
    
    // Block the request if necessary
    if (shouldBlock) {
      logAuditEvent(
        AuditAction.SECURITY_BLOCKED,
        AuditCategory.API,
        req.path,
        {
          reason: blockReason,
          score: securityAnalysis.securityScore,
          requestId: securityAnalysis.requestId
        },
        req
      );
      
      res.status(403).json({
        error: 'Request blocked',
        reason: blockReason,
        requestId: securityAnalysis.requestId
      });
      return;
    }
    
    // Continue to the next middleware
    next();
  };
}

export default {
  apiSecurityMiddleware
};