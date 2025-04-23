/**
 * Zero-Trust Security Middleware
 * 
 * This middleware implements a comprehensive zero-trust security model
 * that validates every request with continuous authentication and
 * context-aware access control.
 */

import { Request, Response, NextFunction } from 'express';
import { SecurityContext } from '../context/SecurityContext';
import { AnomalyDetection } from '../analytics/AnomalyDetection';
import { securityFabric } from '../SecurityFabric';

export interface ZeroTrustOptions {
  /**
   * Minimum trust score required for access (0-1)
   * Higher values are more restrictive
   */
  minTrustScore?: number;
  
  /**
   * Maximum risk score allowed for access (0-1)
   * Lower values are more restrictive
   */
  maxRiskScore?: number;
  
  /**
   * Whether to perform context-sensitive verification
   */
  contextSensitive?: boolean;
  
  /**
   * Sensitivity level of the protected resource (0-100)
   * Higher values enforce stricter access requirements
   */
  resourceSensitivity?: number;
  
  /**
   * Required permissions for access
   */
  requiredPermissions?: string[];
}

/**
 * Default options for zero-trust middleware
 */
const DEFAULT_OPTIONS: ZeroTrustOptions = {
  minTrustScore: 0.6,
  maxRiskScore: 0.3,
  contextSensitive: true,
  resourceSensitivity: 50,
  requiredPermissions: []
};

/**
 * Creates a zero-trust middleware function
 */
export function createZeroTrustMiddleware(options: ZeroTrustOptions = {}) {
  // Merge options with defaults
  const mergedOptions: ZeroTrustOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create security context for this request
      const securityContext = securityFabric.createSecurityContext(req, res);
      
      // Attach context to request for later use
      (req as any).securityContext = securityContext;
      
      // Set resource information
      securityContext.setResource({
        type: 'api',
        id: req.originalUrl,
        sensitivityLevel: mergedOptions.resourceSensitivity || 50,
        requiredPermissions: mergedOptions.requiredPermissions || []
      });
      
      // Get anomaly detection component
      const anomalyDetection = securityFabric.getComponent<AnomalyDetection>('anomalyDetection');
      
      // Perform behavioral analysis if anomaly detection is available
      if (anomalyDetection) {
        const anomalyResult = anomalyDetection.analyzeRequest(req, securityContext);
        
        // Add behavioral analysis to security context
        securityContext.setBehavioralAnalysis({
          anomalyScore: anomalyResult.anomalyScore,
          confidence: anomalyResult.confidence,
          anomalies: anomalyResult.featureContributions
            .filter(f => f.contribution > 0.5)
            .map(f => f.feature),
          patternMatchScore: 1 - anomalyResult.anomalyScore
        });
        
        // If high confidence anomaly, log it
        if (anomalyResult.isAnomaly && anomalyResult.confidence > 0.7) {
          console.warn(`[ZeroTrust] High-confidence anomaly detected for request to ${req.originalUrl} from ${req.ip}`);
        }
      }
      
      // Get threat intelligence component
      const threatIntelligence = securityFabric.getComponent('threatIntelligence');
      
      // Perform threat assessment if threat intelligence is available
      if (threatIntelligence) {
        const threatResult = threatIntelligence.evaluateRequest(req);
        
        // Add threat assessment to security context
        securityContext.setThreatAssessment({
          riskScore: threatResult.riskScore,
          indicators: threatResult.categories,
          ipReputation: 0, // Not implemented yet
          deviceReputation: 0, // Not implemented yet
          maliciousPatterns: threatResult.matches.map(m => m.value)
        });
      }
      
      // Calculate trust and risk scores
      const trustScore = securityContext.calculateTrustScore();
      const riskScore = securityContext.calculateRiskScore();
      
      // Apply adaptive thresholds based on security posture
      const currentPosture = securityFabric.getSecurityPosture();
      let adjustedMinTrustScore = mergedOptions.minTrustScore || DEFAULT_OPTIONS.minTrustScore!;
      let adjustedMaxRiskScore = mergedOptions.maxRiskScore || DEFAULT_OPTIONS.maxRiskScore!;
      
      // Adjust thresholds based on security posture
      switch (currentPosture) {
        case 'maximum':
          adjustedMinTrustScore += 0.2; // Much stricter trust requirement
          adjustedMaxRiskScore -= 0.1; // Much lower risk tolerance
          break;
        case 'high':
          adjustedMinTrustScore += 0.1; // Stricter trust requirement
          adjustedMaxRiskScore -= 0.05; // Lower risk tolerance
          break;
        case 'elevated':
          adjustedMinTrustScore += 0.05; // Slightly stricter trust requirement
          adjustedMaxRiskScore -= 0.02; // Slightly lower risk tolerance
          break;
      }
      
      // Evaluate zero-trust access decision
      let accessDecision: 'allow' | 'deny' | 'challenge' = 'deny';
      let decisionReason = '';
      
      // Check required permissions first
      const requiredPermissions = mergedOptions.requiredPermissions || [];
      const userPermissions = (req.user as any)?.permissions || [];
      const userRoles = (req.user as any)?.roles || [(req.user as any)?.role].filter(Boolean);
      
      const hasRequiredPermissions = requiredPermissions.length === 0 || 
        requiredPermissions.every(perm => userPermissions.includes(perm));
      
      // Super admins bypass most checks
      if (Array.isArray(userRoles) && userRoles.includes('super_admin')) {
        accessDecision = 'allow';
        decisionReason = 'Super admin access';
      }
      // If permissions are missing, deny access
      else if (requiredPermissions.length > 0 && !hasRequiredPermissions) {
        accessDecision = 'deny';
        decisionReason = 'Missing required permissions';
      }
      // If trust score is too low, deny access
      else if (trustScore < adjustedMinTrustScore) {
        if (trustScore < adjustedMinTrustScore - 0.1) {
          accessDecision = 'deny';
          decisionReason = 'Trust level too low';
        } else {
          accessDecision = 'challenge';
          decisionReason = 'Additional verification required due to low trust level';
        }
      }
      // If risk score is too high, deny access
      else if (riskScore > adjustedMaxRiskScore) {
        if (riskScore > adjustedMaxRiskScore + 0.1) {
          accessDecision = 'deny';
          decisionReason = 'Risk level too high';
        } else {
          accessDecision = 'challenge';
          decisionReason = 'Additional verification required due to elevated risk';
        }
      }
      // Otherwise, allow access
      else {
        accessDecision = 'allow';
        decisionReason = 'Context evaluation passed';
      }
      
      // Update security context with decision
      securityContext.setStatus(
        accessDecision === 'allow' ? 'approved' : 
        accessDecision === 'challenge' ? 'challenge' : 'denied',
        decisionReason
      );
      
      // Log the decision
      if (accessDecision === 'deny') {
        console.warn(`[ZeroTrust] Access denied to ${req.originalUrl} from ${req.ip}: ${decisionReason} (trust: ${trustScore.toFixed(2)}, risk: ${riskScore.toFixed(2)})`);
      }
      
      // Implement the access decision
      if (accessDecision === 'allow') {
        // Allow the request to proceed
        next();
      }
      else if (accessDecision === 'challenge') {
        // Implement step-up authentication or verification
        // For now, we'll just deny access with a special status code
        res.status(403).json({
          success: false,
          message: 'Additional verification required',
          code: 'VERIFICATION_REQUIRED',
          reason: decisionReason
        });
      }
      else {
        // Deny access
        res.status(403).json({
          success: false,
          message: 'Access denied',
          reason: decisionReason
        });
      }
    } catch (error) {
      console.error('[ZeroTrust] Error in zero-trust middleware:', error);
      
      // In case of internal error, deny access
      res.status(500).json({
        success: false,
        message: 'Security verification error'
      });
    }
  };
}

/**
 * Creates a middleware function that verifies resource access
 * considering the specific resource's sensitivity level
 */
export function createResourceAccessMiddleware(resourceType: string, resourceId: string, sensitivityLevel: number = 75) {
  return createZeroTrustMiddleware({
    resourceSensitivity: sensitivityLevel,
    contextSensitive: true,
    minTrustScore: 0.5 + (sensitivityLevel / 200), // 0.5 to 1.0 based on sensitivity
    maxRiskScore: 0.3 - (sensitivityLevel / 500)   // 0.3 to 0.1 based on sensitivity
  });
}

/**
 * Creates a middleware function for admin access
 * with high trust requirements and low risk tolerance
 */
export function createAdminAccessMiddleware() {
  return createZeroTrustMiddleware({
    resourceSensitivity: 90,
    minTrustScore: 0.8,
    maxRiskScore: 0.1,
    requiredPermissions: ['admin.access']
  });
}

/**
 * Creates a middleware function for security operations
 * with maximum trust requirements and zero risk tolerance
 */
export function createSecurityOperationsMiddleware() {
  return createZeroTrustMiddleware({
    resourceSensitivity: 100,
    minTrustScore: 0.9,
    maxRiskScore: 0.05,
    requiredPermissions: ['security.manage']
  });
}