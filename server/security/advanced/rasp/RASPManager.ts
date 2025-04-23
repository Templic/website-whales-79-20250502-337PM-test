/**
 * Runtime Application Self-Protection (RASP) Manager
 * 
 * Provides real-time monitoring and protection against security threats at runtime
 * by integrating directly into the application's execution environment.
 */

import * as express from 'express';
import * as crypto from 'crypto';
import { securityFabric } from '../SecurityFabric';
import { SecurityEventSeverity, SecurityEventCategory, securityBlockchain } from '../blockchain/ImmutableSecurityLogs';

/**
 * RASP protection level
 */
export enum RASPProtectionLevel {
  /**
   * Only monitoring, no protection
   */
  MONITORING = 'monitoring',
  
  /**
   * Detection, limited protection
   */
  DETECTION = 'detection',
  
  /**
   * Full prevention and protection
   */
  PREVENTION = 'prevention'
}

/**
 * RASP protection categories
 */
export enum RASPProtectionCategory {
  /**
   * Input validation (SQL injection, XSS, etc.)
   */
  INPUT_VALIDATION = 'input-validation',
  
  /**
   * Command injection protection
   */
  COMMAND_INJECTION = 'command-injection',
  
  /**
   * Path traversal protection
   */
  PATH_TRAVERSAL = 'path-traversal',
  
  /**
   * Authentication and authorization
   */
  AUTHENTICATION = 'authentication',
  
  /**
   * API security
   */
  API_SECURITY = 'api-security',
  
  /**
   * Memory protection
   */
  MEMORY_PROTECTION = 'memory-protection',
  
  /**
   * Malicious payload detection
   */
  MALICIOUS_PAYLOAD = 'malicious-payload'
}

/**
 * RASP middleware options
 */
export interface RASPMiddlewareOptions {
  /**
   * Protection level
   */
  protectionLevel?: RASPProtectionLevel;
  
  /**
   * Whether to block requests
   */
  blockRequests?: boolean;
  
  /**
   * Whether to log events
   */
  logEvents?: boolean;
  
  /**
   * Paths to exclude from protection
   */
  excludePaths?: string[];
  
  /**
   * Additional protection categories to enable
   */
  enableCategories?: RASPProtectionCategory[];
  
  /**
   * Protection categories to disable
   */
  disableCategories?: RASPProtectionCategory[];
}

/**
 * RASP Manager class
 */
export class RASPManager {
  /**
   * Protection level
   */
  private protectionLevel: RASPProtectionLevel;
  
  /**
   * Whether to block requests
   */
  private blockRequests: boolean;
  
  /**
   * Whether to log events
   */
  private logEvents: boolean;
  
  /**
   * Paths to exclude from protection
   */
  private excludePaths: string[];
  
  /**
   * Enabled protection categories
   */
  private enabledCategories: Set<RASPProtectionCategory>;
  
  /**
   * Create a new RASP manager
   */
  constructor(options: RASPMiddlewareOptions = {}) {
    this.protectionLevel = options.protectionLevel || RASPProtectionLevel.PREVENTION;
    this.blockRequests = options.blockRequests !== undefined ? options.blockRequests : true;
    this.logEvents = options.logEvents !== undefined ? options.logEvents : true;
    this.excludePaths = options.excludePaths || [];
    
    // Initialize enabled categories with defaults
    this.enabledCategories = new Set([
      RASPProtectionCategory.INPUT_VALIDATION,
      RASPProtectionCategory.COMMAND_INJECTION,
      RASPProtectionCategory.PATH_TRAVERSAL,
      RASPProtectionCategory.AUTHENTICATION,
      RASPProtectionCategory.API_SECURITY,
      RASPProtectionCategory.MEMORY_PROTECTION,
      RASPProtectionCategory.MALICIOUS_PAYLOAD
    ]);
    
    // Add additional categories
    if (options.enableCategories) {
      options.enableCategories.forEach(category => {
        this.enabledCategories.add(category);
      });
    }
    
    // Remove disabled categories
    if (options.disableCategories) {
      options.disableCategories.forEach(category => {
        this.enabledCategories.delete(category);
      });
    }
  }
  
  /**
   * Check if a path is excluded from protection
   */
  private isExcludedPath(path: string): boolean {
    return this.excludePaths.some(excludePath => {
      // Check exact match
      if (excludePath === path) {
        return true;
      }
      
      // Check for wildcard (*) at the end
      if (excludePath.endsWith('*') && path.startsWith(excludePath.slice(0, -1))) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Check if a protection category is enabled
   */
  private isProtectionCategoryEnabled(category: RASPProtectionCategory): boolean {
    return this.enabledCategories.has(category);
  }
  
  /**
   * Create a RASP middleware instance
   */
  public createMiddleware(): express.RequestHandler {
    return (req, res, next) => {
      // Skip excluded paths
      if (this.isExcludedPath(req.path)) {
        return next();
      }
      
      // Create protection context
      const protectionContext = {
        request: req,
        response: res,
        path: req.path,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type'],
        timestamp: new Date(),
        protectionLevel: this.protectionLevel,
        blockRequests: this.blockRequests,
        detected: false,
        detectionCategory: null as RASPProtectionCategory | null,
        detectionDetails: null as any,
      };
      
      // Apply protections
      this.applyProtections(protectionContext);
      
      // If detection occurred and block is enabled
      if (protectionContext.detected && this.blockRequests) {
        // Log security event
        if (this.logEvents) {
          securityBlockchain.addSecurityEvent({
            severity: SecurityEventSeverity.HIGH,
            category: SecurityEventCategory.SYSTEM,
            message: `RASP protection blocked request: ${protectionContext.detectionCategory}`,
            ipAddress: req.ip,
            metadata: {
              path: req.path,
              method: req.method,
              protection: protectionContext.detectionCategory,
              details: protectionContext.detectionDetails
            }
          }).catch(error => {
            console.error('[RASP] Error logging security event:', error);
          });
          
          // Emit security event
          securityFabric.emit('security:rasp:blocked', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            category: protectionContext.detectionCategory,
            timestamp: new Date()
          });
        }
        
        // Return error response
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Request blocked by security protection'
        });
      }
      
      // Continue to next middleware
      next();
    };
  }
  
  /**
   * Apply all protection mechanisms
   */
  private applyProtections(context: any): void {
    // Apply input validation protection
    if (this.isProtectionCategoryEnabled(RASPProtectionCategory.INPUT_VALIDATION)) {
      this.applyInputValidationProtection(context);
    }
    
    // Apply command injection protection
    if (this.isProtectionCategoryEnabled(RASPProtectionCategory.COMMAND_INJECTION)) {
      this.applyCommandInjectionProtection(context);
    }
    
    // Apply path traversal protection
    if (this.isProtectionCategoryEnabled(RASPProtectionCategory.PATH_TRAVERSAL)) {
      this.applyPathTraversalProtection(context);
    }
    
    // Apply API security protection
    if (this.isProtectionCategoryEnabled(RASPProtectionCategory.API_SECURITY)) {
      this.applyApiSecurityProtection(context);
    }
    
    // Apply malicious payload protection
    if (this.isProtectionCategoryEnabled(RASPProtectionCategory.MALICIOUS_PAYLOAD)) {
      this.applyMaliciousPayloadProtection(context);
    }
  }
  
  /**
   * Apply input validation protection
   */
  private applyInputValidationProtection(context: any): void {
    // Skip if already detected
    if (context.detected) {
      return;
    }
    
    const { body, query } = context;
    
    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /('|").*\s+(OR|AND)\s+('|").*(=|<|>)/i,
      /;\s*DROP\s+TABLE/i,
      /;\s*DELETE\s+FROM/i,
      /UNION\s+SELECT/i,
      /SLEEP\s*\(\s*\d+\s*\)/i,
      /BENCHMARK\s*\(\s*\d+\s*,/i
    ];
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:[^\s]*/i,
      /on\w+\s*=\s*["']?[^"']*["']?/i,
      /<\s*img[^>]*src\s*=\s*["']?data:image\/[^;]*;base64/i
    ];
    
    // Function to check object recursively for patterns
    const checkObjectForPatterns = (obj: any, patterns: RegExp[]): { found: boolean, value?: string } => {
      if (!obj) {
        return { found: false };
      }
      
      if (typeof obj === 'string') {
        for (const pattern of patterns) {
          if (pattern.test(obj)) {
            return { found: true, value: obj };
          }
        }
        return { found: false };
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const result = checkObjectForPatterns(obj[key], patterns);
          if (result.found) {
            return result;
          }
        }
      }
      
      return { found: false };
    };
    
    // Check body for SQL injection
    const sqlBodyCheck = checkObjectForPatterns(body, sqlInjectionPatterns);
    if (sqlBodyCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.INPUT_VALIDATION;
      context.detectionDetails = {
        type: 'sql-injection',
        location: 'body',
        value: sqlBodyCheck.value
      };
      return;
    }
    
    // Check query for SQL injection
    const sqlQueryCheck = checkObjectForPatterns(query, sqlInjectionPatterns);
    if (sqlQueryCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.INPUT_VALIDATION;
      context.detectionDetails = {
        type: 'sql-injection',
        location: 'query',
        value: sqlQueryCheck.value
      };
      return;
    }
    
    // Check body for XSS
    const xssBodyCheck = checkObjectForPatterns(body, xssPatterns);
    if (xssBodyCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.INPUT_VALIDATION;
      context.detectionDetails = {
        type: 'xss',
        location: 'body',
        value: xssBodyCheck.value
      };
      return;
    }
    
    // Check query for XSS
    const xssQueryCheck = checkObjectForPatterns(query, xssPatterns);
    if (xssQueryCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.INPUT_VALIDATION;
      context.detectionDetails = {
        type: 'xss',
        location: 'query',
        value: xssQueryCheck.value
      };
      return;
    }
  }
  
  /**
   * Apply command injection protection
   */
  private applyCommandInjectionProtection(context: any): void {
    // Skip if already detected
    if (context.detected) {
      return;
    }
    
    const { body, query } = context;
    
    // Check for command injection patterns
    const commandInjectionPatterns = [
      /\s*\|\s*\w+/i, // Pipe operator
      /\s*;\s*\w+/i, // Semicolon
      /\s*&&\s*\w+/i, // AND operator
      /\s*\|\|\s*\w+/i, // OR operator
      /`.*`/i, // Backticks
      /\$\(.*\)/i, // $() syntax
      />\s*[^\s]+/i, // Redirection
      /<\s*[^\s]+/i // Input redirection
    ];
    
    // Function to check object recursively for patterns
    const checkObjectForPatterns = (obj: any, patterns: RegExp[]): { found: boolean, value?: string } => {
      if (!obj) {
        return { found: false };
      }
      
      if (typeof obj === 'string') {
        for (const pattern of patterns) {
          if (pattern.test(obj)) {
            return { found: true, value: obj };
          }
        }
        return { found: false };
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const result = checkObjectForPatterns(obj[key], patterns);
          if (result.found) {
            return result;
          }
        }
      }
      
      return { found: false };
    };
    
    // Check body for command injection
    const commandBodyCheck = checkObjectForPatterns(body, commandInjectionPatterns);
    if (commandBodyCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.COMMAND_INJECTION;
      context.detectionDetails = {
        type: 'command-injection',
        location: 'body',
        value: commandBodyCheck.value
      };
      return;
    }
    
    // Check query for command injection
    const commandQueryCheck = checkObjectForPatterns(query, commandInjectionPatterns);
    if (commandQueryCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.COMMAND_INJECTION;
      context.detectionDetails = {
        type: 'command-injection',
        location: 'query',
        value: commandQueryCheck.value
      };
      return;
    }
  }
  
  /**
   * Apply path traversal protection
   */
  private applyPathTraversalProtection(context: any): void {
    // Skip if already detected
    if (context.detected) {
      return;
    }
    
    const { body, query, path } = context;
    
    // Check for path traversal patterns
    const pathTraversalPatterns = [
      /\.\.\//i, // ../
      /\.\.%2f/i, // ..%2f
      /\.\.\\\\//i, // ..\\
      /\.\.%5c/i, // ..%5c
      /\.\.%255c/i, // ..%255c
      /~root/i, // ~root
      /~nobody/i, // ~nobody
      /etc\/passwd/i, // etc/passwd
      /etc\/shadow/i, // etc/shadow
      /proc\/self/i, // proc/self
      /\/\.\.\/\.\./i // /../..
    ];
    
    // Check path for traversal
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(path)) {
        context.detected = true;
        context.detectionCategory = RASPProtectionCategory.PATH_TRAVERSAL;
        context.detectionDetails = {
          type: 'path-traversal',
          location: 'path',
          value: path
        };
        return;
      }
    }
    
    // Function to check object recursively for patterns
    const checkObjectForPatterns = (obj: any, patterns: RegExp[]): { found: boolean, value?: string } => {
      if (!obj) {
        return { found: false };
      }
      
      if (typeof obj === 'string') {
        for (const pattern of patterns) {
          if (pattern.test(obj)) {
            return { found: true, value: obj };
          }
        }
        return { found: false };
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const result = checkObjectForPatterns(obj[key], patterns);
          if (result.found) {
            return result;
          }
        }
      }
      
      return { found: false };
    };
    
    // Check body for path traversal
    const traversalBodyCheck = checkObjectForPatterns(body, pathTraversalPatterns);
    if (traversalBodyCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.PATH_TRAVERSAL;
      context.detectionDetails = {
        type: 'path-traversal',
        location: 'body',
        value: traversalBodyCheck.value
      };
      return;
    }
    
    // Check query for path traversal
    const traversalQueryCheck = checkObjectForPatterns(query, pathTraversalPatterns);
    if (traversalQueryCheck.found) {
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.PATH_TRAVERSAL;
      context.detectionDetails = {
        type: 'path-traversal',
        location: 'query',
        value: traversalQueryCheck.value
      };
      return;
    }
  }
  
  /**
   * Apply API security protection
   */
  private applyApiSecurityProtection(context: any): void {
    // Skip if already detected
    if (context.detected) {
      return;
    }
    
    const { method, path, headers } = context;
    
    // Check for missing API security headers
    if (path.startsWith('/api/')) {
      // Check for API methods requiring authentication
      if (
        (method === 'POST' || method === 'PUT' || method === 'DELETE') && 
        !headers.authorization && 
        !path.includes('/auth/') &&
        !path.includes('/login') &&
        !path.includes('/register')
      ) {
        context.detected = true;
        context.detectionCategory = RASPProtectionCategory.API_SECURITY;
        context.detectionDetails = {
          type: 'missing-auth',
          location: 'headers',
          value: 'No authorization header found for protected method'
        };
        return;
      }
      
      // Check for missing content type on POST/PUT
      if ((method === 'POST' || method === 'PUT') && !headers['content-type']) {
        context.detected = true;
        context.detectionCategory = RASPProtectionCategory.API_SECURITY;
        context.detectionDetails = {
          type: 'missing-content-type',
          location: 'headers',
          value: 'No content-type header found for POST/PUT request'
        };
        return;
      }
    }
  }
  
  /**
   * Apply malicious payload protection
   */
  private applyMaliciousPayloadProtection(context: any): void {
    // Skip if already detected
    if (context.detected) {
      return;
    }
    
    const { body, headers } = context;
    
    // Skip if no body or not a JSON/form content type
    if (
      !body || 
      typeof body !== 'object' || 
      !(
        headers['content-type']?.includes('application/json') ||
        headers['content-type']?.includes('application/x-www-form-urlencoded')
      )
    ) {
      return;
    }
    
    // Check for excessively large payloads
    const jsonSize = JSON.stringify(body).length;
    if (jsonSize > 1024 * 1024) { // > 1MB
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.MALICIOUS_PAYLOAD;
      context.detectionDetails = {
        type: 'oversized-payload',
        location: 'body',
        value: `Payload size (${jsonSize} bytes) exceeds maximum allowed size`
      };
      return;
    }
    
    // Check for suspicious JSON structure (deeply nested)
    const checkObjectDepth = (obj: any, currentDepth = 0): number => {
      if (currentDepth > 20) { // Too deep, early exit
        return currentDepth;
      }
      
      if (!obj || typeof obj !== 'object') {
        return currentDepth;
      }
      
      let maxDepth = currentDepth;
      
      for (const key in obj) {
        const depth = checkObjectDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
      
      return maxDepth;
    };
    
    const depth = checkObjectDepth(body);
    if (depth > 10) { // > 10 levels deep
      context.detected = true;
      context.detectionCategory = RASPProtectionCategory.MALICIOUS_PAYLOAD;
      context.detectionDetails = {
        type: 'deep-nesting',
        location: 'body',
        value: `Object nesting depth (${depth}) exceeds maximum allowed depth`
      };
      return;
    }
  }
}

/**
 * Singleton RASP manager instance
 */
const raspManager = new RASPManager();

/**
 * Create a RASP middleware with custom options
 */
export function createRASPMiddleware(options: RASPMiddlewareOptions = {}): express.RequestHandler {
  const manager = new RASPManager(options);
  return manager.createMiddleware();
}

/**
 * Default RASP middleware (maximum protection)
 */
export const raspMiddleware = raspManager.createMiddleware();

/**
 * Export RASP manager instance
 */
export { raspManager };