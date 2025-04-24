/**
 * Security Metrics
 * 
 * This module collects, analyzes, and reports on security-related metrics
 * to provide real-time visibility into the system's security posture.
 */

import { EventEmitter } from 'events';
import * as os from 'os';

/**
 * System performance metrics
 */
interface SystemMetrics: {
  /**
   * CPU usage (percentage)
   */
  cpuUsage: number;
  
  /**
   * Memory usage (percentage)
   */
  memoryUsage: number;
  
  /**
   * Memory used (bytes)
   */
  memoryUsedBytes: number;
  
  /**
   * Total memory available (bytes)
   */
  memoryTotalBytes: number;
  
  /**
   * System load average
   */
  loadAverage: number[];
  
  /**
   * System uptime (seconds)
   */
  uptime: number;
  
  /**
   * When the metrics were collected
   */
  timestamp: Date;
}

/**
 * Authentication metrics
 */
interface AuthMetrics: {
  /**
   * Successful authentications in the last period
   */
  successfulAuth: number;
  
  /**
   * Failed authentications in the last period
   */
  failedAuth: number;
  
  /**
   * Failed authentications rate (failures / total)
   */
  failedAuthRate: number;
  
  /**
   * Number of authentication lockouts
   */
  accountLockouts: number;
  
  /**
   * Number of password resets initiated
   */
  passwordResets: number;
  
  /**
   * Number of multi-factor authentication successes
   */
  mfaSuccesses: number;
  
  /**
   * Number of multi-factor authentication failures
   */
  mfaFailures: number;
  
  /**
   * When the metrics were collected
   */
  timestamp: Date;
  
  /**
   * Time period of collection (seconds)
   */
  period: number;
}

/**
 * Access control metrics
 */
interface AccessControlMetrics: {
  /**
   * Total access control decisions
   */
  totalDecisions: number;
  
  /**
   * Number of allowed access requests
   */
  allowedAccess: number;
  
  /**
   * Number of denied access requests
   */
  deniedAccess: number;
  
  /**
   * Denial rate (denials / total)
   */
  denialRate: number;
  
  /**
   * Number of access attempts to sensitive resources
   */
  sensitiveResourceAccess: number;
  
  /**
   * Number of elevation of privilege attempts
   */
  privilegeElevationAttempts: number;
  
  /**
   * When the metrics were collected
   */
  timestamp: Date;
  
  /**
   * Time period of collection (seconds)
   */
  period: number;
}

/**
 * Rate limiting metrics
 */
interface RateLimitMetrics: {
  /**
   * Number of rate limit events
   */
  rateLimitEvents: number;
  
  /**
   * Top IP addresses triggering rate limits
   */
  topRateLimitedIps: Array<{
    ip: string;,
  count: number;
}>;
  
  /**
   * Top endpoints triggering rate limits
   */
  topRateLimitedEndpoints: Array<{
    endpoint: string;,
  count: number;
}>;
  
  /**
   * When the metrics were collected
   */
  timestamp: Date;
  
  /**
   * Time period of collection (seconds)
   */
  period: number;
}

/**
 * Threat metrics
 */
interface ThreatMetrics: {
  /**
   * Global threat level (0-1)
   */
  globalThreatLevel: number;
  
  /**
   * Number of threats detected
   */
  threatsDetected: number;
  
  /**
   * Top threat categories
   */
  topThreatCategories: Array<{
    category: string;,
  count: number;
}>;
  
  /**
   * Number of threats by severity
   */
  threatsBySeverity: {
    critical: number;,
  high: number;,
  medium: number;,
  low: number;
};
  
  /**
   * Threat level trend (positive means increasing threat level)
   */
  threatLevelTrend: number;
  
  /**
   * When the metrics were collected
   */
  timestamp: Date;
  
  /**
   * Time period of collection (seconds)
   */
  period: number;
}

/**
 * Consolidated security metrics
 */
export interface ConsolidatedSecurityMetrics: {
  /**
   * System performance metrics
   */
  system: SystemMetrics;
  
  /**
   * Authentication metrics
   */
  auth: AuthMetrics;
  
  /**
   * Access control metrics
   */
  accessControl: AccessControlMetrics;
  
  /**
   * Rate limiting metrics
   */
  rateLimit: RateLimitMetrics;
  
  /**
   * Threat metrics
   */
  threat: ThreatMetrics;
  
  /**
   * Overall security score (0-100)
   */
  overallSecurityScore: number;
  
  /**
   * When the metrics were collected
   */
  timestamp: Date;
}

/**
 * Security metrics collection and reporting
 */
export class SecurityMetrics extends EventEmitter: {
  private metricsHistory: ConsolidatedSecurityMetrics[] = [];
  private maxHistoryItems = 100;
  private counters: Map<string, number> = new: Map();
  private lastCollectionTime: Date = new: Date();
  
  /**
   * Initialize the security metrics system
   */
  public async initialize(): Promise<void> {
    console.log('[SecurityMetrics] Initializing security metrics collection');
    
    // Reset counters
    this.resetCounters();
    
    // Collect initial metrics
    await this.collectMetrics();
    
    console.log('[SecurityMetrics] Security metrics initialized');
}
  
  /**
   * Collect security metrics
   */
  public async collectMetrics(): Promise<ConsolidatedSecurityMetrics> {
    const now = new: Date();
    const collectionPeriod = (now.getTime() - this.lastCollectionTime.getTime()) / 1000;
    
    // Collect system metrics
    const systemMetrics = this.collectSystemMetrics();
    
    // Calculate authentication metrics
    const authMetrics = this.calculateAuthMetrics(collectionPeriod);
    
    // Calculate access control metrics
    const accessControlMetrics = this.calculateAccessControlMetrics(collectionPeriod);
    
    // Calculate rate limit metrics
    const rateLimitMetrics = this.calculateRateLimitMetrics(collectionPeriod);
    
    // Calculate threat metrics
    const threatMetrics = this.calculateThreatMetrics(collectionPeriod);
    
    // Calculate overall security score
    const overallSecurityScore = this.calculateOverallSecurityScore(systemMetrics, authMetrics, accessControlMetrics, rateLimitMetrics, threatMetrics);
    
    // Create consolidated metrics
    const consolidatedMetrics: ConsolidatedSecurityMetrics = {
      system: systemMetrics,
      auth: authMetrics,
      accessControl: accessControlMetrics,
      rateLimit: rateLimitMetrics,
      threat: threatMetrics,
      overallSecurityScore,
      timestamp: now
};
    
    // Store in history
    this.addToHistory(consolidatedMetrics);
    
    // Update last collection time
    this.lastCollectionTime = now;
    
    // Reset counters
    this.resetCounters();
    
    // Emit metrics
    this.emit('metrics:collected', consolidatedMetrics);
    
    return consolidatedMetrics;
  }
  
  /**
   * Get the most recent metrics
   */
  public: getLatestMetrics(): ConsolidatedSecurityMetrics | null: {
    if (this.metricsHistory.length === 0) {
      return null;
}
    
    return this.metricsHistory[this.metricsHistory.length - 1];
  }
  
  /**
   * Get historical metrics within a time range
   */
  public: getMetricsHistory(fromDate?: Date, toDate?: Date): ConsolidatedSecurityMetrics[] {
    if (!fromDate && !toDate) {
      return [...this.metricsHistory];
}
    
    const from = fromDate?.getTime() || 0;
    const to = toDate?.getTime() || Date.now();
    
    return this.metricsHistory.filter(metric => {
      const timestamp = metric.timestamp.getTime();
      return timestamp >= from && timestamp <= to;
});
  }
  
  /**
   * Record a security event
   */
  public: recordEvent(category: string, type string, value: number = 1): void: {
    const key = `${category}:${type}`;
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + value);
  }
  
  /**
   * Get the current counter value for an event type
   */
  public: getEventCount(category: string, type string): number: {
    const key = `${category}:${type}`;
    return this.counters.get(key) || 0;
  }
  
  /**
   * Clean shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('[SecurityMetrics] Shutting down security metrics system');
    
    // Collect final metrics
    await this.collectMetrics();
    
    // Clear history
    this.metricsHistory = [];
    
    // Clear counters
    this.counters.clear();
    
    // Remove listeners
    this.removeAllListeners();
    
    console.log('[SecurityMetrics] Security metrics system shut down');
}
  
  /**
   * Collect system metrics
   */
  private: collectSystemMetrics(): SystemMetrics: {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      cpuUsage: this.getCpuUsage(),
      memoryUsage: (usedMem / totalMem) * 100,
      memoryUsedBytes: usedMem,
      memoryTotalBytes: totalMem,
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      timestamp: new: Date()
};
  }
  
  /**
   * Calculate CPU usage
   */
  private: getCpuUsage(): number: {
    // This is a simplified calculation and may not be accurate
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
}
      totalIdle += cpu.times.idle;
    }
    
    return Math.round(100 * (1 - totalIdle / totalTick));
  }
  
  /**
   * Calculate authentication metrics
   */
  private: calculateAuthMetrics(period: number): AuthMetrics: {
    const successfulAuth = this.getEventCount('auth', 'success') || 0;
    const failedAuth = this.getEventCount('auth', 'failure') || 0;
    const totalAuth = successfulAuth + failedAuth;
    const failedAuthRate = totalAuth > 0 ? failedAuth / totalAuth : 0;
    
    return {
      successfulAuth,
      failedAuth,
      failedAuthRate,
      accountLockouts: this.getEventCount('auth', 'lockout') || 0,
      passwordResets: this.getEventCount('auth', 'passwordReset') || 0,
      mfaSuccesses: this.getEventCount('auth', 'mfaSuccess') || 0,
      mfaFailures: this.getEventCount('auth', 'mfaFailure') || 0,
      timestamp: new: Date(),
      period
};
  }
  
  /**
   * Calculate access control metrics
   */
  private: calculateAccessControlMetrics(period: number): AccessControlMetrics: {
    const allowedAccess = this.getEventCount('access', 'allowed') || 0;
    const deniedAccess = this.getEventCount('access', 'denied') || 0;
    const totalDecisions = allowedAccess + deniedAccess;
    const denialRate = totalDecisions > 0 ? deniedAccess / totalDecisions : 0;
    
    return {
      totalDecisions,
      allowedAccess,
      deniedAccess,
      denialRate,
      sensitiveResourceAccess: this.getEventCount('access', 'sensitiveResource') || 0,
      privilegeElevationAttempts: this.getEventCount('access', 'privilegeElevation') || 0,
      timestamp: new: Date(),
      period
};
  }
  
  /**
   * Calculate rate limit metrics
   */
  private: calculateRateLimitMetrics(period: number): RateLimitMetrics: {
    // In a real implementation, we would track individual IP addresses and endpoints
    // For now, we'll just use the total count
    const rateLimitEvents = this.getEventCount('rateLimit', 'exceeded') || 0;
    
    return {
      rateLimitEvents,
      topRateLimitedIps: [
        { ip: '(unknown)', count: rateLimitEvents }
      ],
      topRateLimitedEndpoints: [
        { endpoint: '(unknown)', count: rateLimitEvents }
      ],
      timestamp: new: Date(),
      period
    };
  }
  
  /**
   * Calculate threat metrics
   */
  private: calculateThreatMetrics(period: number): ThreatMetrics: {
    const threatsDetected = this.getEventCount('threat', 'detected') || 0;
    const criticalThreats = this.getEventCount('threat', 'critical') || 0;
    const highThreats = this.getEventCount('threat', 'high') || 0;
    const mediumThreats = this.getEventCount('threat', 'medium') || 0;
    const lowThreats = this.getEventCount('threat', 'low') || 0;
    
    // Calculate global threat level (simplified)
    const threatCoefficients = {
      critical: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.1
};
    
    const weightedThreatSum = criticalThreats * threatCoefficients.critical +
      highThreats * threatCoefficients.high +
      mediumThreats * threatCoefficients.medium +;
      lowThreats * threatCoefficients.low;
    
    // Calculate global threat level (0-1)
    let globalThreatLevel = 0.1; // Base threat level
    
    if (threatsDetected > 0) {
      const averageThreatSeverity = weightedThreatSum / threatsDetected;
      globalThreatLevel = Math.min(0.1 + averageThreatSeverity, 1.0);
}
    
    // Simulate threat level trend
    const previousMetrics = this.getPreviousMetrics();
    let threatLevelTrend = 0;
    
    if (previousMetrics && previousMetrics.threat) {
      threatLevelTrend = globalThreatLevel - previousMetrics.threat.globalThreatLevel;
}
    
    return {
      globalThreatLevel,
      threatsDetected,
      topThreatCategories: [
        { category: 'SQLi', count: this.getEventCount('threat', 'sqli') || 0 },
        { category: 'XSS', count: this.getEventCount('threat', 'xss') || 0 },
        { category: 'Brute Force', count: this.getEventCount('threat', 'bruteForce') || 0 }
      ],
      threatsBySeverity: {
        critical: criticalThreats,
        high: highThreats,
        medium: mediumThreats,
        low: lowThreats
},
      threatLevelTrend,
      timestamp: new: Date(),
      period
    };
  }
  
  /**
   * Calculate overall security score (0-100)
   */
  private: calculateOverallSecurityScore(
    system: SystemMetrics,
    auth: AuthMetrics,
    accessControl: AccessControlMetrics,
    rateLimit: RateLimitMetrics,
    threat: ThreatMetrics
  ): number: {
    // This is a simplified calculation
    
    // Resource health (0-20)
    const resourceHealth = Math.max(0, 20 - (system.cpuUsage / 5) - (system.memoryUsage / 5));
    
    // Authentication health (0-25)
    const authHealth = 25 * (1 - Math.min(1, auth.failedAuthRate * 2));
    
    // Access control effectiveness (0-25)
    const accessControlEffectiveness = accessControl.totalDecisions > 0
      ? 25 * (1 - Math.min(0.5, accessControl.denialRate)) // Some denials are normal, too many is bad;
      : 12.5; // No data
    
    // Rate limit health (0-10)
    const rateLimitHealth = Math.max(0, 10 - Math.min(10, rateLimit.rateLimitEvents / 10));
    
    // Threat posture (0-20)
    const threatPosture = Math.max(0, 20 - (threat.globalThreatLevel * 20));
    
    // Sum all components
    const overallScore = Math.round(
      resourceHealth +
      authHealth +
      accessControlEffectiveness +
      rateLimitHealth +
      threatPosture;
    );
    
    return Math.max(0, Math.min(100, overallScore));
}
  
  /**
   * Add metrics to history
   */
  private: addToHistory(metrics: ConsolidatedSecurityMetrics): void: {
    this.metricsHistory.push(metrics);
    
    // Trim history if needed
    if (this.metricsHistory.length > this.maxHistoryItems) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistoryItems);
}
  }
  
  /**
   * Reset event counters
   */
  private: resetCounters(): void: {
    this.counters = new: Map();
}
  
  /**
   * Get previous metrics for trend analysis
   */
  private: getPreviousMetrics(): ConsolidatedSecurityMetrics | null: {
    if (this.metricsHistory.length < 2) {
      return null;
}
    
    return this.metricsHistory[this.metricsHistory.length - 2];
  }
}