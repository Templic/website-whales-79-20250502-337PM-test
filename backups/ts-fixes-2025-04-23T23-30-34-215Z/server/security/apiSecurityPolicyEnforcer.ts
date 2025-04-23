/**
 * API Security Policy Enforcer
 * 
 * This module provides security policy enforcement for API requests,
 * including various checks for request validation, injection prevention,
 * and security policy compliance.
 */

import { Request } from 'express';
import { immutableSecurityLogs as securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';

/**
 * Security check result
 */
interface SecurityCheckResult {
  // Whether to block the request
  block: boolean;
  
  // Reason for blocking (if block is true)
  reason?: string;
  
  // Additional metadata about the security check
  metadata?: Record<string, any>;
}

/**
 * Security policy enforcer
 */
class SecurityPolicyEnforcer {
  /**
   * Known malicious patterns in request parameters
   */
  private maliciousPatterns: RegExp[] = [
    /((?:\%3C)|<)[^\n]+((?:\%3E)|>)/i, // XSS detection
    /\b(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from)\b/i, // SQL injection
    /\.\.\//g, // Path traversal
    /\b(eval|setTimeout|setInterval|Function|constructor|fetch|XMLHttpRequest)\s*\(/i, // Code injection
    /\b(exec|system|passthru|shell_exec|popen|proc_open|pcntl_exec)\s*\(/i, // Command injection
  ];
  
  /**
   * Disallowed HTTP headers
   */
  private disallowedHeaders: string[] = [
    'x-powered-by',
    'server',
    'x-aspnet-version',
    'x-aspnetmvc-version'
  ];
  
  /**
   * Check if a request violates security policies
   */
  public checkRequest(req: Request): SecurityCheckResult {
    try {
      // Check for malicious patterns in request parameters
      const maliciousParamCheck = this.checkRequestParameters(req);
      if (maliciousParamCheck.block) {
        return maliciousParamCheck;
      }
      
      // Check request headers
      const headerCheck = this.checkRequestHeaders(req);
      if (headerCheck.block) {
        return headerCheck;
      }
      
      // Check content type if the request has a body
      if (req.body && Object.keys(req.body).length > 0) {
        const contentTypeCheck = this.checkContentType(req);
        if (contentTypeCheck.block) {
          return contentTypeCheck;
        }
      }
      
      // Check for HTTP method restrictions
      const methodCheck = this.checkHttpMethod(req);
      if (methodCheck.block) {
        return methodCheck;
      }
      
      // All checks passed
      return { block: false };
    } catch (error: Error) {
      // Log the error
      console.error('Error in security policy enforcer:', error);
      
      // Log to blockchain
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.API,
        severity: SecurityEventSeverity.ERROR,
        message: 'Security policy enforcer error',
        timestamp: Date.now(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          method: req.method
        }
      }).catch(console.error);
      
      // Allow the request to continue in case of error
      return { block: false };
    }
  }
  
  /**
   * Check request parameters for malicious patterns
   */
  private checkRequestParameters(req: Request): SecurityCheckResult {
    // Combine query parameters and body
    const allParams = { ...req.query, ...req.params, ...req.body };
    
    // Convert parameters to string for pattern matching
    const paramsString = JSON.stringify(allParams);
    
    // Check for malicious patterns
    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(paramsString)) {
        // Determine the type of attack
        let attackType = 'Unknown';
        if (pattern.toString().includes('union\\s+select')) {
          attackType = 'SQL Injection';
        } else if (pattern.toString().includes('(?:\\%3C)|<')) {
          attackType = 'Cross-Site Scripting (XSS)';
        } else if (pattern.toString().includes('\\.\\.\\/')) {
          attackType = 'Path Traversal';
        } else if (pattern.toString().includes('eval|setTimeout')) {
          attackType = 'Code Injection';
        } else if (pattern.toString().includes('exec|system')) {
          attackType = 'Command Injection';
        }
        
        // Log the attack to blockchain
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.API,
          severity: SecurityEventSeverity.WARNING,
          message: `Potential ${attackType} attack detected`,
          timestamp: Date.now(),
          metadata: {
            pattern: pattern.toString(),
            path: req.path,
            method: req.method,
            ip: req.ip || req.connection.remoteAddress,
            params: JSON.stringify(allParams).substring(0, 1000) // Truncate to avoid large logs
          }
        }).catch(console.error);
        
        return {
          block: true,
          reason: `Potential ${attackType} attack detected`,
          metadata: {
            pattern: pattern.toString()
          }
        };
      }
    }
    
    return { block: false };
  }
  
  /**
   * Check request headers for security issues
   */
  private checkRequestHeaders(req: Request): SecurityCheckResult {
    // Check for disallowed headers
    for (const header of this.disallowedHeaders) {
      if (req.headers[header]) {
        return {
          block: true,
          reason: `Disallowed header detected: ${header}`,
          metadata: {
            header
          }
        };
      }
    }
    
    // Check for overly large headers
    const headers = JSON.stringify(req.headers);
    if (headers.length > 8192) { // 8 KB header limit
      return {
        block: true,
        reason: 'Header size exceeds permitted limit',
        metadata: {
          headerSize: headers.length
        }
      };
    }
    
    return { block: false };
  }
  
  /**
   * Check content type for security issues
   */
  private checkContentType(req: Request): SecurityCheckResult {
    // Allowed content types for different methods
    const allowedContentTypes: Record<string, string[]> = {
      POST: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
      PUT: ['application/json', 'application/x-www-form-urlencoded'],
      PATCH: ['application/json', 'application/x-www-form-urlencoded']
    };
    
    // Skip content type check for methods that don't typically have a body
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return { block: false };
    }
    
    // Get the request content type
    const contentType = req.headers['content-type'] || '';
    
    // Check if the content type is allowed for this method
    const allowed = allowedContentTypes[req.method];
    if (allowed && !allowed.some(type => contentType.includes(type))) {
      return {
        block: true,
        reason: `Unsupported content type for ${req.method}: ${contentType}`,
        metadata: {
          contentType,
          method: req.method,
          allowedTypes: allowed
        }
      };
    }
    
    return { block: false };
  }
  
  /**
   * Check HTTP method for security issues
   */
  private checkHttpMethod(req: Request): SecurityCheckResult {
    // Allowed HTTP methods
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
    
    // Check if the method is allowed
    if (!allowedMethods.includes(req.method)) {
      return {
        block: true,
        reason: `Unsupported HTTP method: ${req.method}`,
        metadata: {
          method: req.method,
          allowedMethods
        }
      };
    }
    
    // Restrict methods for specific paths
    if (req.path.includes('/api/admin') && !['GET', 'POST'].includes(req.method)) {
      return {
        block: true,
        reason: `Method ${req.method} not allowed for admin endpoints`,
        metadata: {
          method: req.method,
          path: req.path,
          allowedMethods: ['GET', 'POST']
        }
      };
    }
    
    return { block: false };
  }
}

// Create a singleton instance
export const securityPolicyEnforcer = new SecurityPolicyEnforcer();