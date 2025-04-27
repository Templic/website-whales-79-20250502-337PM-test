/**
 * Security Metrics Collector
 * 
 * This module collects and provides real-time security metrics from various
 * security systems and components.
 */

import { logSecurityEvent } from '../advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/blockchain/SecurityEventTypes';
import { ImmutableSecurityLogs } from '../advanced/blockchain/ImmutableSecurityLogs';

// Security metrics interface
export interface SecurityMetrics {
  score: {
    overall: number;
    authentication: number;
    dataProtection: number;
    vulnerabilities: number;
    apiSecurity: number;
    anomalyDetection: number;
    quantum: number;
  };
  threats: {
    active: number;
    critical: number;
    blockedAttempts: number;
    monitoredEvents: number;
  };
  authStatus: {
    mfaEnabled: boolean;
    bruteForceProtection: boolean;
    sessionProtection: boolean;
    accountLockout: string;
  };
  quantumStatus: {
    nistPqc: string;
    keyEncapsulation: string;
    digitalSignatures: string;
    hybridCryptography: boolean;
  };
  apiStatus: {
    inputValidation: boolean;
    rateLimit: number;
    corsProtection: string;
    sqlInjectionDefense: boolean;
  };
  activity: {
    lastUpdated: Date;
    loginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    apiRequests: number;
    blockedRequests: number;
  };
}

// Store the latest metrics in memory
let latestMetrics: SecurityMetrics = {
  score: {
    overall: 85,
    authentication: 90,
    dataProtection: 85,
    vulnerabilities: 70,
    apiSecurity: 95,
    anomalyDetection: 80,
    quantum: 100
  },
  threats: {
    active: 3,
    critical: 0,
    blockedAttempts: 42,
    monitoredEvents: 7
  },
  authStatus: {
    mfaEnabled: true,
    bruteForceProtection: true,
    sessionProtection: true,
    accountLockout: 'partial'
  },
  quantumStatus: {
    nistPqc: 'implemented',
    keyEncapsulation: 'kyber-1024',
    digitalSignatures: 'dilithium',
    hybridCryptography: true
  },
  apiStatus: {
    inputValidation: true,
    rateLimit: 100,
    corsProtection: 'strict',
    sqlInjectionDefense: true
  },
  activity: {
    lastUpdated: new Date(),
    loginAttempts: 0,
    successfulLogins: 0,
    failedLogins: 0,
    apiRequests: 0,
    blockedRequests: 0
  }
};

// Initialize metrics collection
let metricsCollectionInterval: NodeJS.Timeout | null = null;

/**
 * Start collecting security metrics
 */
export function startMetricsCollection(intervalMs: number = 60000): void {
  if (metricsCollectionInterval) {
    clearInterval(metricsCollectionInterval);
  }
  
  // Collect metrics immediately
  collectSecurityMetrics();
  
  // Schedule regular collection
  metricsCollectionInterval = setInterval(collectSecurityMetrics, intervalMs);
  
  logSecurityEvent({
    category: SecurityEventCategory.SYSTEM,
    severity: SecurityEventSeverity.INFO,
    message: 'Security metrics collection started',
    data: { intervalMs }
  });
}

/**
 * Stop collecting security metrics
 */
export function stopMetricsCollection(): void {
  if (metricsCollectionInterval) {
    clearInterval(metricsCollectionInterval);
    metricsCollectionInterval = null;
    
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      message: 'Security metrics collection stopped'
    });
  }
}

/**
 * Collect security metrics from various systems
 */
async function collectSecurityMetrics(): Promise<void> {
  try {
    // In a real application, these metrics would be collected from actual security systems
    // For this example, we'll generate simulated metrics
    
    // Update API request count (simulate API activity)
    latestMetrics.activity.apiRequests += Math.floor(Math.random() * 5);
    
    // Occasionally add blocked requests
    if (Math.random() > 0.7) {
      const blockedRequests = Math.floor(Math.random() * 3);
      latestMetrics.activity.blockedRequests += blockedRequests;
      latestMetrics.threats.blockedAttempts += blockedRequests;
    }
    
    // Occasionally add login attempts
    if (Math.random() > 0.6) {
      const loginAttempts = Math.floor(Math.random() * 2) + 1;
      latestMetrics.activity.loginAttempts += loginAttempts;
      
      // Most login attempts are successful
      const successfulLogins = Math.random() > 0.2 ? loginAttempts : loginAttempts - 1;
      latestMetrics.activity.successfulLogins += successfulLogins;
      
      // The rest are failed
      latestMetrics.activity.failedLogins += (loginAttempts - successfulLogins);
    }
    
    // Update the last updated timestamp
    latestMetrics.activity.lastUpdated = new Date();
    
    // Occasionally adjust threat levels
    if (Math.random() > 0.9) {
      // Simulate changing threat levels
      const threatChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      latestMetrics.threats.active = Math.max(0, latestMetrics.threats.active + threatChange);
      
      // Critical threats are rare
      latestMetrics.threats.critical = Math.random() > 0.95 ? 1 : 0;
    }
    
    // Get security score from blockchain logs (dummy for now)
    try {
      const blockchainLogger = ImmutableSecurityLogs.getInstance();
      const blockCount = await blockchainLogger.getBlockCount();
      
      // Adjust anomaly detection score based on blockchain activity
      latestMetrics.score.anomalyDetection = 75 + Math.min(25, blockCount / 4);
    } catch (error) {
      // Ignore blockchain errors
    }
    
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.DEBUG,
      message: 'Security metrics collected',
      data: {
        apiRequests: latestMetrics.activity.apiRequests,
        blockedRequests: latestMetrics.activity.blockedRequests,
        activeThreats: latestMetrics.threats.active
      }
    });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error collecting security metrics',
      data: { error: (error as Error).message }
    });
  }
}

/**
 * Get the latest security metrics
 */
export async function getLatestSecurityMetrics(): Promise<SecurityMetrics> {
  // If metrics collection hasn't started, start it now
  if (!metricsCollectionInterval) {
    startMetricsCollection();
  }
  
  return { ...latestMetrics }; // Return a copy to prevent mutation
}

/**
 * Record a login attempt
 */
export function recordLoginAttempt(successful: boolean): void {
  latestMetrics.activity.loginAttempts++;
  
  if (successful) {
    latestMetrics.activity.successfulLogins++;
  } else {
    latestMetrics.activity.failedLogins++;
  }
  
  latestMetrics.activity.lastUpdated = new Date();
}

/**
 * Record an API request
 */
export function recordApiRequest(blocked: boolean = false): void {
  latestMetrics.activity.apiRequests++;
  
  if (blocked) {
    latestMetrics.activity.blockedRequests++;
    latestMetrics.threats.blockedAttempts++;
  }
  
  latestMetrics.activity.lastUpdated = new Date();
}

/**
 * Record a security threat
 */
export function recordSecurityThreat(critical: boolean = false): void {
  latestMetrics.threats.active++;
  
  if (critical) {
    latestMetrics.threats.critical++;
  }
  
  latestMetrics.activity.lastUpdated = new Date();
}

/**
 * Resolve a security threat
 */
export function resolveSecurityThreat(critical: boolean = false): void {
  if (latestMetrics.threats.active > 0) {
    latestMetrics.threats.active--;
  }
  
  if (critical && latestMetrics.threats.critical > 0) {
    latestMetrics.threats.critical--;
  }
  
  latestMetrics.activity.lastUpdated = new Date();
}

/**
 * Update security scores
 */
export function updateSecurityScores(scores: Partial<SecurityMetrics['score']>): void {
  latestMetrics.score = {
    ...latestMetrics.score,
    ...scores
  };
  
  // Recalculate overall score
  const scoreValues = Object.values(latestMetrics.score).filter(value => typeof value === 'number' && value !== latestMetrics.score.overall);
  const average = scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length;
  
  latestMetrics.score.overall = Math.round(average);
  latestMetrics.activity.lastUpdated = new Date();
}