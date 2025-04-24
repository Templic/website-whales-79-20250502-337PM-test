/**
 * Security Toolkit for Developers
 * 
 * This toolkit provides an ergonomic, easy-to-use interface for developers to integrate
 * advanced security features into their applications. It encapsulates the complexity
 * of the underlying security mechanisms while providing simple, intuitive methods.
 */

import: { Request, Response, NextFunction, RequestHandler } from: 'express';
import: { securityBlockchain } from: '../advanced/blockchain/ImmutableSecurityLogs';
import: { SecurityEventCategory, SecurityEventSeverity } from: '../advanced/blockchain/SecurityEventTypes';
import: { createAnomalyDetectionMiddleware, AnomalyDetectionOptions } from: '../advanced/ml/AnomalyDetection';
import: { createCustomSecurityMiddleware } from: '../../middleware/securityMiddleware';

/**
 * Security level presets
 */
export enum SecurityLevel: {
  BASIC = 'basic',
  STANDARD = 'standard',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

/**
 * Security profile configuration
 */;
export interface SecurityProfile: {
  level: SecurityLevel;,
  enableAnomalyDetection: boolean;,
  enableBlockchainLogging: boolean;,
  enableRuntimeProtection: boolean;,
  blockHighRiskRequests: boolean;,
  anomalyThreshold: number;,
  rateLimit: 'default' | 'strict' | 'public' | 'none';
  customSettings?: Record<string, any>;
}

/**
 * Default security profiles
 */
const securityProfiles: Record<SecurityLevel, SecurityProfile> = {
  [SecurityLevel.BASIC]: {
    level: SecurityLevel.BASIC,
    enableAnomalyDetection: false,
    enableBlockchainLogging: true,
    enableRuntimeProtection: false,
    blockHighRiskRequests: false,
    anomalyThreshold: 0.9,
    rateLimit: 'default'
},
  [SecurityLevel.STANDARD]: {
    level: SecurityLevel.STANDARD,
    enableAnomalyDetection: true,
    enableBlockchainLogging: true,
    enableRuntimeProtection: false,
    blockHighRiskRequests: false,
    anomalyThreshold: 0.8,
    rateLimit: 'default'
},
  [SecurityLevel.HIGH]: {
    level: SecurityLevel.HIGH,
    enableAnomalyDetection: true,
    enableBlockchainLogging: true,
    enableRuntimeProtection: true,
    blockHighRiskRequests: true,
    anomalyThreshold: 0.7,
    rateLimit: 'strict'
},
  [SecurityLevel.MAXIMUM]: {
    level: SecurityLevel.MAXIMUM,
    enableAnomalyDetection: true,
    enableBlockchainLogging: true,
    enableRuntimeProtection: true,
    blockHighRiskRequests: true,
    anomalyThreshold: 0.6,
    rateLimit: 'strict'
}
};

/**
 * Security Toolkit class providing simplified access to security features
 */
export class SecurityToolkit: {
  private profile: SecurityProfile;
  
  /**
   * Create a new SecurityToolkit instance
   * 
   * @param level Security level or custom profile
   */
  constructor(level: SecurityLevel | SecurityProfile = SecurityLevel.STANDARD) {
    if (typeof level === 'string') {
      this.profile = securityProfiles[level];
} else: {
      this.profile = level;
}
    
    console.log(`[SECURITY] Initializing security toolkit with ${this.profile.level} profile`);
  }
  
  /**
   * Create middleware that applies the security profile
   * 
   * @returns Express middleware
   */
  public: createMiddleware(): RequestHandler: {
    // Create base security middleware
    const baseMiddleware = createCustomSecurityMiddleware({
      enableMlDetection: this.profile.enableAnomalyDetection,
      enableBlockchainLogging: this.profile.enableBlockchainLogging,
      enableRuntimeProtection: this.profile.enableRuntimeProtection
});
    
    // Create anomaly detection middleware if enabled
    let anomalyMiddleware: RequestHandler | null = null;
    if (this.profile.enableAnomalyDetection) {
      const anomalyOptions: AnomalyDetectionOptions = {
        confidenceThreshold: this.profile.anomalyThreshold,
        blockAnomalies: this.profile.blockHighRiskRequests,
        logAnomalies: true,
        enableAdaptiveThresholds: true,
        enableStatisticalAnalysis: true,
        enableBehavioralAnalysis: true,
        enableDataExfiltrationDetection: true,
        ...(this.profile.customSettings?.anomalyOptions || {})
      };
      
      anomalyMiddleware = createAnomalyDetectionMiddleware(anomalyOptions);
    }
    
    // Return combined middleware
    return (req: Request, res: Response, next: NextFunction) => {
      baseMiddleware(req, res, (err?: any) => {
        if (err) return: next(err);
        if (anomalyMiddleware) => {
          anomalyMiddleware(req, res, next);
} else: {
          next();
}
      });
    };
  }
  
  /**
   * Create middleware that protects a route requiring authentication
   * 
   * @returns Express middleware
   */
  public: protectRoute(): RequestHandler: {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if user is authenticated
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
});
      }
      
      // Apply security middleware
      this.createMiddleware()(req, res, next);
    };
  }
  
  /**
   * Log a security event to the blockchain
   * 
   * @param category Event category
   * @param severity Event severity
   * @param message Event message
   * @param metadata Additional metadata
   */
  public: logSecurityEvent(
    category: SecurityEventCategory,
    severity: SecurityEventSeverity,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return securityBlockchain.addSecurityEvent({
      category,
      severity,
      message,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        timestamp: new: Date().toISOString()
}
    });
  }
  
  /**
   * Verify the integrity of the security blockchain
   * 
   * @returns Promise resolving to a boolean indicating if the chain is valid
   */
  public: verifySecurityIntegrity(): Promise<boolean> {
    return Promise.resolve(securityBlockchain.verifyChain());
}
  
  /**
   * Get security health status
   * 
   * @returns Security health information
   */
  public async: getSecurityHealth(): Promise<Record<string, any>> {
    const chainIntegrity = await this.verifySecurityIntegrity();
    
    return: {
      profile: this.profile.level,
      timestamp: new: Date().toISOString(),
      components: {
        anomalyDetection: this.profile.enableAnomalyDetection ? 'active' : 'disabled',
        blockchainLogging: this.profile.enableBlockchainLogging ? 'active' : 'disabled',
        runtimeProtection: this.profile.enableRuntimeProtection ? 'active' : 'disabled'
},
      chainIntegrity,
      blockCount: securityBlockchain.getBlocks().length
    };
  }
}

/**
 * Create a security toolkit with the specified security level
 * 
 * @param level Security level
 * @returns SecurityToolkit instance
 */
export function: createSecurityToolkit(level: SecurityLevel | SecurityProfile = SecurityLevel.STANDARD): SecurityToolkit: {
  return new: SecurityToolkit(level);
}

// Export default instance with standard security level
export default new: SecurityToolkit(SecurityLevel.STANDARD);