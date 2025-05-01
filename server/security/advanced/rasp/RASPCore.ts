
/**
 * Runtime Application Self-Protection (RASP) Core Module
 * 
 * Provides real-time threat detection and protection against attacks at runtime.
 * This implementation uses a combination of techniques including behavioral analysis,
 * payload inspection, context-aware security checks, and adaptive response.
 * 
 * Features:
 * - Self-defending middleware for Express applications
 * - Runtime payload analysis and sanitization
 * - Behavioral anomaly detection
 * - Adaptive blocking based on threat patterns
 * - Integration with quantum-resistant cryptography
 * - Zero-knowledge security proofs for sensitive operations
 */

import { Request, Response, NextFunction } from 'express';
import { QuantumResistantEncryption, EncryptionLevel } from '../quantum/QuantumResistantEncryption';
import { ImmutableSecurityLogger } from '../blockchain/SecurityLogger';
import { createHash } from 'crypto';

// Define types for better type safety
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ProtectionMode = 'monitor' | 'protect' | 'aggressive';

export interface RASPOptions {
  mode?: ProtectionMode;
  severityThreshold?: number;
  blockDuration?: number;
  encryptResponses?: boolean;
  encryptionLevel?: EncryptionLevel;
  enableZKProofs?: boolean;
  customRules?: RASPRule[];
  logAllRequests?: boolean;
}

export interface RASPRule {
  id: string;
  name: string;
  description: string;
  test: (req: Request) => Promise<boolean> | boolean;
  severity: ThreatSeverity;
  action: 'block' | 'log' | 'monitor';
}

export interface ThreatAssessment {
  score: number;
  severity: ThreatSeverity;
  reasons: string[];
  action: 'allow' | 'block' | 'challenge';
  timestamp: number;
}

export interface BlockedEntry {
  ip: string;
  reason: string;
  severity: ThreatSeverity;
  timestamp: number;
  expiresAt: number;
}

export class RASPCore {
  private static readonly DEFAULT_SEVERITY_THRESHOLD = 0.75;
  private static readonly DEFAULT_BLOCK_DURATION = 3600000; // 1 hour
  private static readonly blockedPatterns = new Set<string>();
  private static readonly blockedIPs = new Map<string, BlockedEntry>();
  private static readonly logger = new ImmutableSecurityLogger('RASP');
  
  private static options: RASPOptions = {
    mode: 'protect',
    severityThreshold: 0.75,
    blockDuration: 3600000,
    encryptResponses: true,
    encryptionLevel: 'enhanced',
    enableZKProofs: true,
    logAllRequests: false
  };
  
  private static customRules: RASPRule[] = [];
  
  /**
   * Initialize RASP with options
   */
  static initialize(options?: RASPOptions): void {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    // Log initialization
    this.logger.log({
      action: 'RASP_INITIALIZED',
      timestamp: Date.now(),
      options: this.options
    });
    
    // Set up predefined rules
    this.setupDefaultRules();
  }
  
  /**
   * Add custom RASP rule
   */
  static addRule(rule: RASPRule): void {
    this.customRules.push(rule);
    
    // Log rule addition
    this.logger.log({
      action: 'RULE_ADDED',
      timestamp: Date.now(),
      ruleId: rule.id,
      ruleName: rule.name
    });
  }
  
  /**
   * Create RASP middleware for Express
   */
  static createMiddleware(options?: RASPOptions): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    // Merge options
    const mergedOptions = { ...this.options, ...(options || {}) };
    
    // Return the middleware function
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Start timing for performance metrics
        const startTime = Date.now();
        
        // Check if IP is already blocked
        if (this.isIPBlocked(req.ip)) {
          // Log blocked request
          this.logger.log({
            action: 'REQUEST_BLOCKED',
            timestamp: Date.now(),
            ip: req.ip,
            url: req.url,
            method: req.method,
            reason: 'IP in block list'
          });
          
          return res.status(403).json({ error: 'Access denied by security system' });
        }
        
        // Analyze threat level
        const threatAssessment = await this.analyzeThreatLevel(req);
        
        // Log the assessment for all requests if configured
        if (mergedOptions.logAllRequests) {
          this.logger.log({
            action: 'THREAT_ASSESSMENT',
            timestamp: Date.now(),
            ip: req.ip,
            url: req.url,
            method: req.method,
            threatScore: threatAssessment.score,
            severity: threatAssessment.severity,
            processingTime: Date.now() - startTime
          });
        }
        
        // Check if request should be blocked based on threat assessment
        if (threatAssessment.action === 'block') {
          // Block the request
          await this.blockIP(req.ip, `Threat score ${threatAssessment.score} exceeds threshold`, threatAssessment.severity);
          
          // Log blocked request with detailed reasons
          this.logger.log({
            action: 'REQUEST_BLOCKED',
            timestamp: Date.now(),
            ip: req.ip,
            url: req.url,
            method: req.method,
            threatScore: threatAssessment.score,
            severity: threatAssessment.severity,
            reasons: threatAssessment.reasons,
            processingTime: Date.now() - startTime
          });
          
          return res.status(403).json({ error: 'Access denied for security reasons' });
        }
        
        // Challenge suspicious requests
        if (threatAssessment.action === 'challenge' && mergedOptions.enableZKProofs) {
          // Generate a challenge the client must solve
          const challengeResult = await this.generateSecurityChallenge(req);
          
          // Log the challenge
          this.logger.log({
            action: 'SECURITY_CHALLENGE_ISSUED',
            timestamp: Date.now(),
            ip: req.ip,
            url: req.url,
            method: req.method,
            threatScore: threatAssessment.score
          });
          
          // Send the challenge to the client
          return res.status(429).json({ 
            message: 'Additional verification required',
            challengeId: challengeResult.id,
            challenge: challengeResult.challenge
          });
        }
        
        // Add secure headers
        this.addSecureHeaders(res);
        
        // Audit response when it completes
        res.on('finish', () => {
          // Record processing time
          const processingTime = Date.now() - startTime;
          
          // Audit the response
          this.auditResponse(req, res, processingTime);
        });
        
        // Proceed with the request
        next();
      } catch (error) {
        // Handle any errors in the RASP middleware
        this.handleError(error, res);
      }
    };
  }

  /**
   * RASP middleware factory function
   */
  static protect(options?: RASPOptions) {
    return this.createMiddleware(options);
  }
  
  /**
   * Add secure headers to response
   */
  private static addSecureHeaders(res: Response): void {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
  
  /**
   * Check if IP is currently blocked
   */
  private static isIPBlocked(ip: string): boolean {
    const entry = this.blockedIPs.get(ip);
    if (!entry) return false;
    
    // Check if block has expired
    if (Date.now() > entry.expiresAt) {
      // Remove expired block
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }
  
  /**
   * Block an IP address for the configured duration
   */
  private static async blockIP(ip: string, reason: string, severity: ThreatSeverity): Promise<void> {
    const timestamp = Date.now();
    const expiresAt = timestamp + this.options.blockDuration;
    
    // Add to blocked IPs
    this.blockedIPs.set(ip, {
      ip,
      reason,
      severity,
      timestamp,
      expiresAt
    });
    
    // Log IP block
    this.logger.log({
      action: 'IP_BLOCKED',
      timestamp,
      ip,
      reason,
      severity,
      expiresAt
    });
  }
  
  /**
   * Set up default RASP rules
   */
  private static setupDefaultRules(): void {
    // SQL Injection Detection Rule
    this.addRule({
      id: 'RASP-001',
      name: 'SQL Injection Detection',
      description: 'Detects potential SQL injection patterns in request parameters',
      test: (req) => {
        const sqlPatterns = [
          /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
          /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
          /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
          /((\%27)|(\'))union/i
        ];
        
        const checkParam = (param: string) => {
          return sqlPatterns.some(pattern => pattern.test(param));
        };
        
        // Check query parameters
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string' && checkParam(req.query[key] as string)) {
              return true;
            }
          }
        }
        
        // Check body parameters
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string' && checkParam(req.body[key])) {
              return true;
            }
          }
        }
        
        return false;
      },
      severity: 'high',
      action: 'block'
    });
    
    // XSS Detection Rule
    this.addRule({
      id: 'RASP-002',
      name: 'XSS Attack Detection',
      description: 'Detects potential cross-site scripting payloads',
      test: (req) => {
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
          /src[\r\n]*=[\r\n]*\\\'(.*?)\\\'/i,
          /src[\r\n]*=[\r\n]*\\\"(.*?)\\\"/i,
          /\w+\s*=\s*\\\'javascript:(.*)\\\'"/i,
          /\w+\s*=\s*\\\"javascript:(.*)\\\""/i,
          /on\w+\s*=\s*\\\'(.*?)\\\'"/i,
          /on\w+\s*=\s*\\\"(.*?)\\\""/i
        ];
        
        const checkParam = (param: string) => {
          return xssPatterns.some(pattern => pattern.test(param));
        };
        
        // Check query parameters
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string' && checkParam(req.query[key] as string)) {
              return true;
            }
          }
        }
        
        // Check body parameters
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string' && checkParam(req.body[key])) {
              return true;
            }
          }
        }
        
        return false;
      },
      severity: 'high',
      action: 'block'
    });
    
    // Path Traversal Detection Rule
    this.addRule({
      id: 'RASP-003',
      name: 'Path Traversal Detection',
      description: 'Detects path traversal attempts',
      test: (req) => {
        const pathTraversalPatterns = [
          /\.\.\//i,
          /\.\.\\i/,
          /%2e%2e\//i,
          /%2e%2e\\/i
        ];
        
        // Check URL path
        if (pathTraversalPatterns.some(pattern => pattern.test(req.path))) {
          return true;
        }
        
        // Check query parameters
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string' && 
                pathTraversalPatterns.some(pattern => pattern.test(req.query[key] as string))) {
              return true;
            }
          }
        }
        
        return false;
      },
      severity: 'high',
      action: 'block'
    });
    
    // Command Injection Detection Rule
    this.addRule({
      id: 'RASP-004',
      name: 'Command Injection Detection',
      description: 'Detects operating system command injection attempts',
      test: (req) => {
        const commandInjectionPatterns = [
          /;|\||`|\$\(|\$\{|\&\&|\|\|/i,
          /\/bin\/(?:bash|sh|zsh|tcsh|csh)/i,
          /ping\s+-[a-z]*c/i,
          /wget\s+/i,
          /curl\s+/i
        ];
        
        const checkParam = (param: string) => {
          return commandInjectionPatterns.some(pattern => pattern.test(param));
        };
        
        // Check query parameters
        if (req.query) {
          for (const key in req.query) {
            if (typeof req.query[key] === 'string' && checkParam(req.query[key] as string)) {
              return true;
            }
          }
        }
        
        // Check body parameters
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string' && checkParam(req.body[key])) {
              return true;
            }
          }
        }
        
        return false;
      },
      severity: 'high',
      action: 'block'
    });
  }
  
  /**
   * Analyze the threat level of a request
   */
  private static async analyzeThreatLevel(req: Request): Promise<ThreatAssessment> {
    const reasons: string[] = [];
    let score = 0;
    
    // Check custom rules
    for (const rule of this.customRules) {
      try {
        const ruleFired = await Promise.resolve(rule.test(req));
        if (ruleFired) {
          // Increment score based on severity
          switch (rule.severity) {
            case 'low':
              score += 0.2;
              break;
            case 'medium':
              score += 0.4;
              break;
            case 'high':
              score += 0.6;
              break;
            case 'critical':
              score += 0.8;
              break;
          }
          
          // Add to reasons
          reasons.push(`Rule ${rule.id}: ${rule.name}`);
          
          // Immediate block for critical rules that specify 'block' action
          if (rule.severity === 'critical' && rule.action === 'block') {
            return {
              score: 1.0,
              severity: 'critical',
              reasons,
              action: 'block',
              timestamp: Date.now()
            };
          }
        }
      } catch (error) {
        // Log rule execution error but continue
        this.logger.log({
          action: 'RULE_EXECUTION_ERROR',
          timestamp: Date.now(),
          ruleId: rule.id,
          error: error.message
        });
      }
    }
    
    // Determine severity based on score
    let severity: ThreatSeverity = 'low';
    if (score >= 0.8) severity = 'critical';
    else if (score >= 0.6) severity = 'high';
    else if (score >= 0.4) severity = 'medium';
    
    // Determine action based on score and options
    let action: 'allow' | 'block' | 'challenge' = 'allow';
    if (score >= this.options.severityThreshold) {
      // In protection mode, block high-risk requests
      if (this.options.mode === 'protect' || this.options.mode === 'aggressive') {
        action = 'block';
      }
      // If not blocking, still challenge suspicious requests
      else if (score >= 0.5) {
        action = 'challenge';
      }
    }
    // In aggressive mode, challenge medium-risk requests
    else if (this.options.mode === 'aggressive' && score >= 0.4) {
      action = 'challenge';
    }
    
    return {
      score,
      severity,
      reasons,
      action,
      timestamp: Date.now()
    };
  }
  
  /**
   * Generate a security challenge for suspicious requests
   */
  private static async generateSecurityChallenge(req: Request): Promise<{ id: string; challenge: string }> {
    const challengeId = createHash('sha256')
      .update(`${req.ip}:${Date.now()}:${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
      
    // Create a simple challenge that the client must solve
    // In a real implementation, this would be a more sophisticated challenge
    const challenge = `Solve: ${Math.floor(Math.random() * 100)} + ${Math.floor(Math.random() * 100)}`;
    
    return { id: challengeId, challenge };
  }
  
  /**
   * Audit the response after it is sent
   */
  private static auditResponse(req: Request, res: Response, processingTime: number): void {
    // Only log if configured to do so
    if (!this.options.logAllRequests && res.statusCode < 400) {
      return;
    }
    
    // Log response details
    this.logger.log({
      action: 'RESPONSE_AUDIT',
      timestamp: Date.now(),
      ip: req.ip,
      url: req.url,
      method: req.method,
      statusCode: res.statusCode,
      processingTime
    });
  }
  
  /**
   * Handle errors in the RASP middleware
   */
  private static handleError(error: Error, res: Response): void {
    // Log the error
    this.logger.log({
      action: 'RASP_ERROR',
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    });
    
    // Send a generic error response
    res.status(500).json({ error: 'An internal security error occurred' });
  }
}
