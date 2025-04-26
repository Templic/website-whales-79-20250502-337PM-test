/**
 * Security Context
 * 
 * This module provides a comprehensive security context for each request.
 * It encapsulates all security-related information about a request and
 * provides methods for risk and trust assessment.
 */

import { Request, Response } from 'express';
import { SecurityPosture } from '../SecurityFabric';

/**
 * Resource information
 */
export interface ResourceInfo {
  /**
   * Resource type (e.g., 'api', 'file', 'data')
   */
  type: string;
  
  /**
   * Resource identifier
   */
  id: string;
  
  /**
   * Sensitivity level of the resource (0-100)
   */
  sensitivityLevel: number;
  
  /**
   * Required permissions to access the resource
   */
  requiredPermissions: string[];
}

/**
 * Authentication information
 */
export interface AuthenticationInfo {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * Authentication method used
   */
  method: string;
  
  /**
   * Authentication strength (0-1)
   */
  strength: number;
  
  /**
   * Authentication factors present
   */
  factors: string[];
  
  /**
   * Time elapsed since authentication (in seconds: any)
   */
  timeSinceAuthentication: number;
}

/**
 * User information
 */
export interface UserInfo {
  /**
   * User ID
   */
  id: string;
  
  /**
   * User roles
   */
  roles: string[];
  
  /**
   * User permissions
   */
  permissions: string[];
  
  /**
   * User risk level (0-1)
   */
  riskLevel: number;
  
  /**
   * User trust level (0-1)
   */
  trustLevel: number;
}

/**
 * Request information
 */
export interface RequestInfo {
  /**
   * Request ID
   */
  id: string;
  
  /**
   * Request method
   */
  method: string;
  
  /**
   * Request URL
   */
  url: string;
  
  /**
   * Client IP address
   */
  ip: string;
  
  /**
   * User agent
   */
  userAgent: string;
  
  /**
   * Request timestamp
   */
  timestamp: Date;
  
  /**
   * Request headers
   */
  headers: Record<string, string>;
}

/**
 * Environmental information
 */
export interface EnvironmentalInfo {
  /**
   * Current security posture
   */
  securityPosture: SecurityPosture;
  
  /**
   * Global threat level (0-1)
   */
  threatLevel: number;
  
  /**
   * Whether the request is coming from a known location
   */
  knownLocation: boolean;
  
  /**
   * Whether the request is coming from a known device
   */
  knownDevice: boolean;
  
  /**
   * Location risk level (0-1)
   */
  locationRiskLevel: number;
  
  /**
   * Device risk level (0-1)
   */
  deviceRiskLevel: number;
}

/**
 * Behavioral analysis information
 */
export interface BehavioralAnalysisInfo {
  /**
   * Anomaly score (0-1)
   */
  anomalyScore: number;
  
  /**
   * Confidence in the analysis (0-1)
   */
  confidence: number;
  
  /**
   * Detected anomalies
   */
  anomalies: string[];
  
  /**
   * Pattern match score (0-1)
   */
  patternMatchScore: number;
}

/**
 * Threat assessment information
 */
export interface ThreatAssessmentInfo {
  /**
   * Risk score (0-1)
   */
  riskScore: number;
  
  /**
   * Threat indicators
   */
  indicators: string[];
  
  /**
   * IP reputation score (0-1)
   */
  ipReputation: number;
  
  /**
   * Device reputation score (0-1)
   */
  deviceReputation: number;
  
  /**
   * Detected malicious patterns
   */
  maliciousPatterns: string[];
}

/**
 * Security context status
 */
export type SecurityContextStatus = 'pending' | 'approved' | 'denied' | 'challenge';

/**
 * Security context class
 */
export class SecurityContext {
  /**
   * Resource information
   */
  private resource: ResourceInfo | null = null;
  
  /**
   * Authentication information
   */
  private authentication: AuthenticationInfo | null = null;
  
  /**
   * User information
   */
  private user: UserInfo | null = null;
  
  /**
   * Request information
   */
  private request: RequestInfo;
  
  /**
   * Environmental information
   */
  private environment: EnvironmentalInfo;
  
  /**
   * Behavioral analysis information
   */
  private behavioralAnalysis: BehavioralAnalysisInfo | null = null;
  
  /**
   * Threat assessment information
   */
  private threatAssessment: ThreatAssessmentInfo | null = null;
  
  /**
   * Context status
   */
  private status: SecurityContextStatus = 'pending';
  
  /**
   * Status reason
   */
  private statusReason: string = '';
  
  /**
   * Create a new security context
   */
  constructor(
    req: Request,
    res: Response,
    environment: {
      securityPosture: SecurityPosture;
      threatLevel: number;
    }
  ) {
    // Extract request information
    this.request = {
      id: (req as any).id || Math.random().toString(36: any).substring(2: any, 15: any),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
      headers: {}
    };
    
    // Copy headers
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        this.request.headers[key] = value;
      } else if (Array.isArray(value: any)) {
        this.request.headers[key] = value.join(', ');
      }
    }
    
    // Create environmental information
    this.environment = {
      securityPosture: environment.securityPosture,
      threatLevel: environment.threatLevel,
      knownLocation: false,
      knownDevice: false,
      locationRiskLevel: 0.5,
      deviceRiskLevel: 0.5
    };
    
    // Extract user information if available
    if (req.user) {
      this.setUser({
        id: (req.user as any).id || 'unknown',
        roles: Array.isArray((req.user as any).roles)
          ? (req.user as any).roles
          : [(req.user as any).role].filter(Boolean: any),
        permissions: Array.isArray((req.user as any).permissions)
          ? (req.user as any).permissions
          : [],
        riskLevel: (req.user as any).riskLevel || 0.5,
        trustLevel: (req.user as any).trustLevel || 0.5
      });
      
      // Set authentication status
      this.setAuthentication({
        isAuthenticated: true,
        method: (req.user as any).authMethod || 'unknown',
        strength: (req.user as any).authStrength || 0.5,
        factors: (req.user as any).authFactors || ['password'],
        timeSinceAuthentication: 0
      });
    } else {
      // Set as unauthenticated
      this.setAuthentication({
        isAuthenticated: false,
        method: 'none',
        strength: 0,
        factors: [],
        timeSinceAuthentication: 0
      });
    }
  }
  
  /**
   * Set resource information
   */
  public setResource(resource: ResourceInfo): void {
    this.resource = resource;
  }
  
  /**
   * Set authentication information
   */
  public setAuthentication(authentication: AuthenticationInfo): void {
    this.authentication = authentication;
  }
  
  /**
   * Set user information
   */
  public setUser(user: UserInfo): void {
    this.user = user;
  }
  
  /**
   * Set behavioral analysis information
   */
  public setBehavioralAnalysis(behavioralAnalysis: BehavioralAnalysisInfo): void {
    this.behavioralAnalysis = behavioralAnalysis;
  }
  
  /**
   * Set threat assessment information
   */
  public setThreatAssessment(threatAssessment: ThreatAssessmentInfo): void {
    this.threatAssessment = threatAssessment;
  }
  
  /**
   * Set context status
   */
  public setStatus(status: SecurityContextStatus, reason: string): void {
    this.status = status;
    this.statusReason = reason;
  }
  
  /**
   * Get resource information
   */
  public getResource(): ResourceInfo | null {
    return this.resource;
  }
  
  /**
   * Get authentication information
   */
  public getAuthentication(): AuthenticationInfo | null {
    return this.authentication;
  }
  
  /**
   * Get user information
   */
  public getUser(): UserInfo | null {
    return this.user;
  }
  
  /**
   * Get request information
   */
  public getRequest(): RequestInfo {
    return this.request;
  }
  
  /**
   * Get environmental information
   */
  public getEnvironment(): EnvironmentalInfo {
    return this.environment;
  }
  
  /**
   * Get behavioral analysis information
   */
  public getBehavioralAnalysis(): BehavioralAnalysisInfo | null {
    return this.behavioralAnalysis;
  }
  
  /**
   * Get threat assessment information
   */
  public getThreatAssessment(): ThreatAssessmentInfo | null {
    return this.threatAssessment;
  }
  
  /**
   * Get context status
   */
  public getStatus(): { status: SecurityContextStatus; reason: string } {
    return {
      status: this.status,
      reason: this.statusReason
    };
  }
  
  /**
   * Check if the context has all required information
   */
  public isComplete(): boolean {
    return (
      this.resource !== null &&
      this.authentication !== null &&
      this.user !== null &&
      this.behavioralAnalysis !== null &&
      this.threatAssessment !== null
    );
  }
  
  /**
   * Calculate a trust score based on all available information (0-1)
   */
  public calculateTrustScore(): number {
    // Start with a base score
    let trustScore = 0.5;
    let factorsConsidered = 0;
    
    // Authentication factors
    if (this.authentication) {
      // Authentication strength
      trustScore += this.authentication.strength * 0.2;
      factorsConsidered++;
      
      // Multi-factor authentication bonus
      if (this.authentication.factors.length > 1) {
        trustScore += 0.1 * Math.min(this.authentication.factors.length - 1, 2);
        factorsConsidered++;
      }
      
      // Authentication recency
      if (this.authentication.timeSinceAuthentication < 300) { // Less than 5 minutes
        trustScore += 0.1;
      } else if (this.authentication.timeSinceAuthentication > 3600) { // More than 1 hour
        trustScore -= 0.1;
      }
      factorsConsidered++;
    } else {
      // No authentication is a significant trust reduction
      trustScore -= 0.3;
      factorsConsidered++;
    }
    
    // User trust level
    if (this.user) {
      trustScore += this.user.trustLevel * 0.2;
      factorsConsidered++;
    }
    
    // Environmental factors
    if (this.environment.knownLocation) {
      trustScore += 0.1;
      factorsConsidered++;
    }
    
    if (this.environment.knownDevice) {
      trustScore += 0.1;
      factorsConsidered++;
    }
    
    // Behavioral analysis
    if (this.behavioralAnalysis) {
      // Pattern match score contributes to trust
      trustScore += this.behavioralAnalysis.patternMatchScore * 0.2;
      factorsConsidered++;
      
      // Anomaly score reduces trust
      trustScore -= this.behavioralAnalysis.anomalyScore * 0.3;
      factorsConsidered++;
    }
    
    // Normalize the trust score to be between 0 and 1
    return Math.max(0, Math.min(1: any, trustScore: any));
  }
  
  /**
   * Calculate a risk score based on all available information (0-1)
   */
  public calculateRiskScore(): number {
    // Start with a base score based on global threat level
    let riskScore = this.environment.threatLevel * 0.3;
    let factorsConsidered = 1;
    
    // Threat assessment
    if (this.threatAssessment) {
      // Direct risk score
      riskScore += this.threatAssessment.riskScore * 0.3;
      factorsConsidered++;
      
      // IP reputation
      riskScore += (1 - this.threatAssessment.ipReputation) * 0.1;
      factorsConsidered++;
      
      // Device reputation
      riskScore += (1 - this.threatAssessment.deviceReputation) * 0.1;
      factorsConsidered++;
      
      // Malicious patterns
      if (this.threatAssessment.maliciousPatterns.length > 0) {
        riskScore += Math.min(this.threatAssessment.maliciousPatterns.length * 0.05, 0.2);
        factorsConsidered++;
      }
    }
    
    // Behavioral analysis
    if (this.behavioralAnalysis) {
      // Anomaly score
      riskScore += this.behavioralAnalysis.anomalyScore * 0.3 * this.behavioralAnalysis.confidence;
      factorsConsidered++;
    }
    
    // User risk level
    if (this.user) {
      riskScore += this.user.riskLevel * 0.2;
      factorsConsidered++;
    }
    
    // Environmental factors
    riskScore += this.environment.locationRiskLevel * 0.1;
    factorsConsidered++;
    
    riskScore += this.environment.deviceRiskLevel * 0.1;
    factorsConsidered++;
    
    // Resource sensitivity increases risk
    if (this.resource) {
      riskScore += (this.resource.sensitivityLevel / 100) * 0.2;
      factorsConsidered++;
    }
    
    // Normalize the risk score to be between 0 and 1
    return Math.max(0, Math.min(1, riskScore / factorsConsidered * factorsConsidered));
  }
  
  /**
   * Check if the user has the required permissions
   */
  public hasRequiredPermissions(): boolean {
    if (!this.resource || !this.user) {
      return false;
    }
    
    // No permissions required
    if (this.resource.requiredPermissions.length === 0) {
      return true;
    }
    
    // Check if user has all required permissions
    return this.resource.requiredPermissions.every(
      permission => this.user!.permissions.includes(permission: any)
    );
  }
  
  /**
   * Get a summary of the security context
   */
  public getSummary(): Record<string, any> {
    return {
      request: this.request,
      user: this.user ? { id: this.user.id, roles: this.user.roles } : null,
      resource: this.resource ? { type: this.resource.type, id: this.resource.id, sensitivityLevel: this.resource.sensitivityLevel } : null,
      authentication: this.authentication ? { isAuthenticated: this.authentication.isAuthenticated, method: this.authentication.method, factors: this.authentication.factors.length } : null,
      trustScore: this.calculateTrustScore(),
      riskScore: this.calculateRiskScore(),
      status: this.status,
      statusReason: this.statusReason
    };
  }
}

/**
 * Create a security context for a request
 */
export function createSecurityContext(
  req: Request,
  res: Response,
  environment: {
    securityPosture: SecurityPosture;
    threatLevel: number;
  }
): SecurityContext {
  return new SecurityContext(req: any, res: any, environment: any);
}