/**
 * Security Configuration
 * 
 * This module defines the configuration options for the advanced security system.
 */

import { SecurityPosture } from '../SecurityFabric';

/**
 * Security configuration options
 */
export interface SecurityConfig {
  /**
   * Initial security posture
   */
  initialSecurityPosture?: SecurityPosture;
  
  /**
   * Maximum security scan interval in minutes
   */
  maxSecurityScanInterval?: number;
  
  /**
   * Whether to enable zero-trust security model
   */
  enableZeroTrust?: boolean;
  
  /**
   * Whether to enable machine learning-based anomaly detection
   */
  enableAnomalyDetection?: boolean;
  
  /**
   * Whether to enable threat intelligence
   */
  enableThreatIntelligence?: boolean;
  
  /**
   * Whether to enable security metrics collection
   */
  enableSecurityMetrics?: boolean;
  
  /**
   * Whether to enable database security
   */
  enableDatabaseSecurity?: boolean;
  
  /**
   * Whether to block SQL injections
   */
  blockSqlInjections?: boolean;
  
  /**
   * Whether to enable API security
   */
  enableApiSecurity?: boolean;
  
  /**
   * Whether to enable file security
   */
  enableFileSecurity?: boolean;
  
  /**
   * Whether to enable secure headers
   */
  enableSecureHeaders?: boolean;
  
  /**
   * Whether to enable CSRF protection
   */
  enableCsrf?: boolean;
  
  /**
   * Whether to enable rate limiting
   */
  enableRateLimiting?: boolean;
  
  /**
   * Rate limiting options
   */
  rateLimiting?: {
    /**
     * Maximum number of requests per window
     */
    maxRequests?: number;
    
    /**
     * Window size in milliseconds
     */
    windowMs?: number;
  };
  
  /**
   * Content Security Policy options
   */
  csp?: {
    /**
     * Whether to enable CSP
     */
    enabled?: boolean;
    
    /**
     * Whether to set CSP in report-only mode
     */
    reportOnly?: boolean;
  };
  
  /**
   * HTTP Strict Transport Security options
   */
  hsts?: {
    /**
     * Whether to enable HSTS
     */
    enabled?: boolean;
    
    /**
     * Max age in seconds
     */
    maxAge?: number;
    
    /**
     * Whether to include subdomains
     */
    includeSubDomains?: boolean;
    
    /**
     * Whether to preload
     */
    preload?: boolean;
  };
  
  /**
   * Anomaly detection options
   */
  anomalyDetection?: {
    /**
     * Anomaly detection mode
     */
    mode?: 'standard' | 'enhanced' | 'maximum';
    
    /**
     * Minimum confidence threshold for anomaly alerts
     */
    minConfidence?: number;
    
    /**
     * Learning period in days
     */
    learningPeriod?: number;
    
    /**
     * Baseline update interval in hours
     */
    baselineUpdateInterval?: number;
  };
  
  /**
   * Zero-trust options
   */
  zeroTrust?: {
    /**
     * Default minimum trust score (0-1)
     */
    defaultMinTrustScore?: number;
    
    /**
     * Default maximum risk score (0-1)
     */
    defaultMaxRiskScore?: number;
    
    /**
     * Whether to challenge users for additional verification
     */
    enableChallenges?: boolean;
  };
  
  /**
   * Database security options
   */
  databaseSecurity?: {
    /**
     * Whether to analyze all queries
     */
    analyzeAllQueries?: boolean;
    
    /**
     * Whether to log all query analyses
     */
    logAllQueries?: boolean;
    
    /**
     * Maximum query length to analyze
     */
    maxQueryLength?: number;
  };
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  initialSecurityPosture: 'normal',
  maxSecurityScanInterval: 60,
  enableZeroTrust: true,
  enableAnomalyDetection: true,
  enableThreatIntelligence: true,
  enableSecurityMetrics: true,
  enableDatabaseSecurity: true,
  blockSqlInjections: true,
  enableApiSecurity: true,
  enableFileSecurity: true,
  enableSecureHeaders: true,
  enableCsrf: true,
  enableRateLimiting: true,
  
  rateLimiting: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minute
  },
  
  csp: {
    enabled: true,
    reportOnly: false
  },
  
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  anomalyDetection: {
    mode: 'enhanced',
    minConfidence: 0.7,
    learningPeriod: 7,
    baselineUpdateInterval: 24
  },
  
  zeroTrust: {
    defaultMinTrustScore: 0.6,
    defaultMaxRiskScore: 0.3,
    enableChallenges: true
  },
  
  databaseSecurity: {
    analyzeAllQueries: true,
    logAllQueries: false,
    maxQueryLength: 10000
  }
};