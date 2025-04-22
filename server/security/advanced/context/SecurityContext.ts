/**
 * Security Context
 * 
 * This module implements the security context for each request,
 * gathering all relevant security information for making access decisions.
 */

import { Request, Response } from 'express';
import { createHash } from 'crypto';

/**
 * Device information extracted from request
 */
export interface DeviceInfo {
  /**
   * Browser user agent
   */
  userAgent: string;
  
  /**
   * IP address
   */
  ip: string;
  
  /**
   * Calculated fingerprint
   */
  fingerprint: string;
  
  /**
   * Device type (desktop, mobile, tablet, etc.)
   */
  deviceType: string;
  
  /**
   * Operating system
   */
  os: string;
  
  /**
   * Browser name and version
   */
  browser: string;
  
  /**
   * Any available device identifiers
   */
  deviceId?: string;
}

/**
 * User information extracted from request
 */
export interface UserInfo {
  /**
   * User ID 
   */
  id?: string | number;
  
  /**
   * Username
   */
  username?: string;
  
  /**
   * User roles
   */
  roles?: string[];
  
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * Authentication method used
   */
  authMethod?: string;
  
  /**
   * When the user was authenticated
   */
  authTimestamp?: Date;
  
  /**
   * Multi-factor authentication status
   */
  mfaCompleted?: boolean;
}

/**
 * Request information
 */
export interface RequestInfo {
  /**
   * HTTP method
   */
  method: string;
  
  /**
   * Request path
   */
  path: string;
  
  /**
   * Query parameters
   */
  query: Record<string, any>;
  
  /**
   * Request body
   */
  body: any;
  
  /**
   * Request headers
   */
  headers: Record<string, string>;
  
  /**
   * Request timestamp
   */
  timestamp: Date;
  
  /**
   * Whether the request is over HTTPS
   */
  isSecure: boolean;
}

/**
 * Behavioral analysis results
 */
export interface BehavioralAnalysis {
  /**
   * Anomaly score (0-1)
   */
  anomalyScore: number;
  
  /**
   * Confidence in the anomaly score (0-1)
   */
  confidence: number;
  
  /**
   * Any anomalies detected
   */
  anomalies: string[];
  
  /**
   * Last known normal behavior
   */
  lastNormalBehavior?: Date;
  
  /**
   * Pattern match score (0-1)
   */
  patternMatchScore: number;
}

/**
 * Resource information
 */
export interface ResourceInfo {
  /**
   * Resource type
   */
  type: string;
  
  /**
   * Resource identifier
   */
  id?: string;
  
  /**
   * Resource sensitivity level (0-100)
   */
  sensitivityLevel: number;
  
  /**
   * Required permissions
   */
  requiredPermissions: string[];
}

/**
 * Threat assessment result
 */
export interface ThreatAssessment {
  /**
   * Overall risk score (0-1)
   */
  riskScore: number;
  
  /**
   * Threat indicators
   */
  indicators: string[];
  
  /**
   * IP address reputation (0-1, higher is worse)
   */
  ipReputation: number;
  
  /**
   * Device reputation (0-1, higher is worse)
   */
  deviceReputation: number;
  
  /**
   * Known malicious patterns detected
   */
  maliciousPatterns: string[];
}

/**
 * Context status after evaluation
 */
export type ContextStatus = 'collecting' | 'evaluating' | 'approved' | 'denied' | 'challenge' | 'error';

/**
 * Security Context
 * Encapsulates all security-relevant information about a request
 */
export class SecurityContext {
  private req: Request;
  private res: Response;
  
  /**
   * Device information
   */
  public deviceInfo: DeviceInfo;
  
  /**
   * User information
   */
  public userInfo: UserInfo;
  
  /**
   * Request information
   */
  public requestInfo: RequestInfo;
  
  /**
   * Resource being accessed
   */
  public resourceInfo: ResourceInfo | null = null;
  
  /**
   * Behavioral analysis results
   */
  public behavioralAnalysis: BehavioralAnalysis | null = null;
  
  /**
   * Threat assessment
   */
  public threatAssessment: ThreatAssessment | null = null;
  
  /**
   * Current context status
   */
  public status: ContextStatus = 'collecting';
  
  /**
   * Reason for current status
   */
  public statusReason: string = '';
  
  /**
   * When the context was created
   */
  public createdAt: Date = new Date();
  
  /**
   * Context identifier
   */
  public readonly id: string;
  
  /**
   * Create a security context from Express request and response
   */
  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.id = this.generateContextId();
    
    // Extract device information
    this.deviceInfo = this.extractDeviceInfo();
    
    // Extract user information
    this.userInfo = this.extractUserInfo();
    
    // Extract request information
    this.requestInfo = this.extractRequestInfo();
  }

  /**
   * Set the resource being accessed
   */
  public setResource(resourceInfo: ResourceInfo): void {
    this.resourceInfo = resourceInfo;
  }

  /**
   * Add behavioral analysis results
   */
  public setBehavioralAnalysis(analysis: BehavioralAnalysis): void {
    this.behavioralAnalysis = analysis;
  }

  /**
   * Add threat assessment
   */
  public setThreatAssessment(assessment: ThreatAssessment): void {
    this.threatAssessment = assessment;
  }

  /**
   * Update context status
   */
  public setStatus(status: ContextStatus, reason: string = ''): void {
    this.status = status;
    this.statusReason = reason;
  }

  /**
   * Calculate trust score based on all context information
   * Returns a score between 0-1 where higher means more trustworthy
   */
  public calculateTrustScore(): number {
    let score = 0.5; // Start with neutral score
    
    // Adjust based on user authentication
    if (this.userInfo.isAuthenticated) {
      score += 0.2;
      if (this.userInfo.mfaCompleted) {
        score += 0.1;
      }
    }
    
    // Adjust based on connection security
    if (this.requestInfo.isSecure) {
      score += 0.1;
    }
    
    // Adjust based on behavioral analysis
    if (this.behavioralAnalysis) {
      // Lower anomaly score is better
      score += (1 - this.behavioralAnalysis.anomalyScore) * 0.2;
      
      // Higher pattern match is better
      score += this.behavioralAnalysis.patternMatchScore * 0.1;
    }
    
    // Adjust based on threat assessment
    if (this.threatAssessment) {
      // Lower risk score is better
      score -= this.threatAssessment.riskScore * 0.3;
      
      // Each malicious pattern reduces score
      score -= this.threatAssessment.maliciousPatterns.length * 0.05;
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate a risk score based on all context information
   * Returns a score between 0-1 where higher means more risky
   */
  public calculateRiskScore(): number {
    // Inverse of trust score with some additional logic
    const baseRisk = 1 - this.calculateTrustScore();
    
    // Add additional risk factors
    let adjustedRisk = baseRisk;
    
    // High sensitivity resources are riskier
    if (this.resourceInfo && this.resourceInfo.sensitivityLevel > 50) {
      adjustedRisk += (this.resourceInfo.sensitivityLevel / 100) * 0.2;
    }
    
    // Mutation operations are riskier
    if (this.requestInfo.method !== 'GET') {
      adjustedRisk += 0.1;
    }
    
    // If the threat assessment shows risk, amplify it
    if (this.threatAssessment && this.threatAssessment.riskScore > 0.7) {
      adjustedRisk += 0.2;
    }
    
    // If behavioral analysis detected anomalies, increase risk
    if (this.behavioralAnalysis && this.behavioralAnalysis.anomalies.length > 0) {
      adjustedRisk += 0.15;
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, adjustedRisk));
  }

  /**
   * Get a simplified version of the context for logging
   */
  public toLogFormat(): Record<string, any> {
    return {
      contextId: this.id,
      timestamp: this.createdAt.toISOString(),
      status: this.status,
      user: this.userInfo.isAuthenticated ? {
        id: this.userInfo.id,
        username: this.userInfo.username,
        roles: this.userInfo.roles
      } : 'anonymous',
      device: {
        ip: this.deviceInfo.ip,
        userAgent: this.deviceInfo.userAgent,
        fingerprint: this.deviceInfo.fingerprint
      },
      request: {
        method: this.requestInfo.method,
        path: this.requestInfo.path,
        isSecure: this.requestInfo.isSecure
      },
      resource: this.resourceInfo,
      riskScore: this.calculateRiskScore(),
      trustScore: this.calculateTrustScore()
    };
  }

  /**
   * Generate a unique ID for this context
   */
  private generateContextId(): string {
    const timestamp = new Date().getTime().toString();
    const ip = this.req.ip || '0.0.0.0';
    const userAgent = this.req.headers['user-agent'] || 'unknown';
    const path = this.req.originalUrl || this.req.url || '/';
    
    const hash = createHash('sha256');
    hash.update(`${timestamp}:${ip}:${userAgent}:${path}`);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Extract device information from request
   */
  private extractDeviceInfo(): DeviceInfo {
    const userAgent = this.req.headers['user-agent'] || 'unknown';
    const ip = this.req.ip || this.req.socket.remoteAddress || '0.0.0.0';
    
    // Simple device type detection
    let deviceType = 'unknown';
    let os = 'unknown';
    let browser = 'unknown';
    
    if (userAgent.includes('Mobile')) {
      deviceType = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }
    
    // Simple OS detection
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      os = 'MacOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS')) {
      os = 'iOS';
    }
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
    }
    
    // Generate fingerprint
    const fingerprint = this.generateDeviceFingerprint(ip, userAgent);
    
    return {
      userAgent,
      ip,
      fingerprint,
      deviceType,
      os,
      browser,
      deviceId: (this.req as any).cookies?.deviceId
    };
  }

  /**
   * Extract user information from request
   */
  private extractUserInfo(): UserInfo {
    const user = this.req.user || (this.req as any).session?.user;
    
    if (!user) {
      return {
        isAuthenticated: false
      };
    }
    
    return {
      id: user.id,
      username: user.username,
      roles: Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []),
      isAuthenticated: true,
      authMethod: (this.req as any).authMethod || 'session',
      authTimestamp: user.lastLogin ? new Date(user.lastLogin) : new Date(),
      mfaCompleted: user.mfaCompleted || false
    };
  }

  /**
   * Extract request information
   */
  private extractRequestInfo(): RequestInfo {
    return {
      method: this.req.method,
      path: this.req.originalUrl || this.req.url || '/',
      query: this.req.query,
      body: this.req.body,
      headers: this.getFilteredHeaders(),
      timestamp: new Date(),
      isSecure: this.req.secure || this.req.headers['x-forwarded-proto'] === 'https'
    };
  }

  /**
   * Generate a fingerprint for the device
   */
  private generateDeviceFingerprint(ip: string, userAgent: string): string {
    const data = `${ip}:${userAgent}`;
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Get filtered request headers (excludes sensitive headers)
   */
  private getFilteredHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const [key, value] of Object.entries(this.req.headers)) {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
    
    return headers;
  }
}