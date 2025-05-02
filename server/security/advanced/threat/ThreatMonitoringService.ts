/**
 * Threat Monitoring Service
 * 
 * Provides real-time monitoring of security metrics:
 * - API request tracking
 * - Blocked request counting
 * - Active threat monitoring
 * - Metrics collection and reporting
 */

import { securityConfig } from '../config/SecurityConfig';
import { threatDatabaseService } from './ThreatDatabaseService';

interface SecurityMetrics {
  // Request metrics
  apiRequests: number;
  blockedRequests: number;
  
  // Threat metrics
  activeThreats: number;
  
  // Authentication metrics
  failedLogins?: number;
  successfulLogins?: number;
  
  // Rate limiting metrics
  rateLimitedRequests?: number;
  
  // Time metrics
  timestamp: number;
}

interface MetricsHistory {
  // For rolling window statistics
  requestHistory: Array<{ timestamp: number, blocked: boolean }>;
  
  // Historical metrics for trends
  historicalMetrics: SecurityMetrics[];
  
  // Maximum historical metrics to keep (one entry per collection interval)
  maxHistoryLength: number;
}

/**
 * Service for monitoring and collecting security metrics
 */
class ThreatMonitoringService {
  // Current metrics
  private metrics: SecurityMetrics = {
    apiRequests: 0,
    blockedRequests: 0,
    activeThreats: 0,
    timestamp: Date.now()
  };
  
  // Metrics history for trends
  private history: MetricsHistory = {
    requestHistory: [],
    historicalMetrics: [],
    maxHistoryLength: 1440  // Default: 24 hours at 1 minute intervals
  };
  
  // Request history window (for calculating rates)
  private readonly requestHistoryWindow = 60 * 60 * 1000; // 1 hour
  
  // Collection interval for timed metrics
  private collectionInterval: NodeJS.Timeout | null = null;
  private collectionIntervalMs = 30 * 1000; // 30 seconds by default
  
  // Listeners for metrics updates
  private metricListeners: Array<(metrics: SecurityMetrics) => void> = [];
  
  constructor() {
    // Reset metrics on initialization to avoid unrealistic values
    this.resetMetrics();
    
    // Start metrics collection if configured to do so
    if (securityConfig.getSecurityFeatures().realTimeMonitoring) {
      this.startMetricsCollection();
    }
    
    // Subscribe to security config changes
    securityConfig.addChangeListener((features) => {
      if (features.realTimeMonitoring) {
        this.startMetricsCollection();
      } else {
        this.stopMetricsCollection();
      }
    });
  }
  
  /**
   * Reset metrics to initial state
   * Useful for clearing counters that may have accumulated unrealistically
   */
  resetMetrics(): void {
    this.metrics = {
      apiRequests: 0,
      blockedRequests: 0,
      activeThreats: 0,
      timestamp: Date.now()
    };
    
    this.history.requestHistory = [];
    
    if (process.env.DEBUG_SECURITY === 'true') {
      console.log('[debug] [system] Security metrics reset to initial values');
    }
  }
  
  /**
   * Record an API request
   * 
   * @param blocked Whether the request was blocked
   */
  recordApiRequest(blocked: boolean): void {
    this.metrics.apiRequests++;
    
    if (blocked) {
      this.metrics.blockedRequests++;
    }
    
    // Add to request history for rate calculations
    this.history.requestHistory.push({
      timestamp: Date.now(),
      blocked
    });
    
    // Clean up old history entries
    this.cleanupRequestHistory();
  }
  
  /**
   * Record a successful login
   */
  recordSuccessfulLogin(): void {
    if (this.metrics.successfulLogins === undefined) {
      this.metrics.successfulLogins = 0;
    }
    this.metrics.successfulLogins++;
  }
  
  /**
   * Record a failed login
   */
  recordFailedLogin(): void {
    if (this.metrics.failedLogins === undefined) {
      this.metrics.failedLogins = 0;
    }
    this.metrics.failedLogins++;
  }
  
  /**
   * Record a rate-limited request
   */
  recordRateLimitedRequest(): void {
    if (this.metrics.rateLimitedRequests === undefined) {
      this.metrics.rateLimitedRequests = 0;
    }
    this.metrics.rateLimitedRequests++;
  }
  
  /**
   * Record a threat of a specific type
   *
   * @param threatType The type of threat detected
   * @param severity The severity of the threat
   */
  recordThreat(threatType: string, severity: string): void {
    // Record the threat in metrics
    // This is separate from database recording and serves for
    // real-time monitoring purposes
    
    // We don't need to increment a counter here since
    // activeThreats is fetched directly from the database
    
    // Log for monitoring purposes
    console.warn(`[Security] Threat detected: ${threatType} (${severity})`);
  }
  
  /**
   * Record a security event
   *
   * @param eventType Type of security event
   * @param details Event details
   * @param ipAddress Related IP address
   * @param userId Related user ID
   * @param adminId Admin who triggered the event (for admin actions)
   */
  recordEvent(
    eventType: string,
    details: Record<string, any>,
    ipAddress?: string,
    userId?: string,
    adminId?: string
  ): void {
    // Store security event in database
    threatDatabaseService.recordSecurityEvent({
      eventType,
      details: JSON.stringify(details),
      ipAddress: ipAddress || null,
      userId: userId || null,
      adminId: adminId || null,
      timestamp: new Date()
    });
    
    // Log for monitoring
    console.info(`[Security Event] ${eventType}${adminId ? ' by admin '+adminId : ''}`);
  }
  
  /**
   * Get recent security events
   *
   * @param limit Maximum number of events to return
   * @returns Array of recent security events
   */
  async getRecentEvents(limit: number = 50): Promise<any[]> {
    return await threatDatabaseService.getSecurityEvents(limit);
  }
  
  /**
   * Get security statistics
   *
   * @returns Security statistics object
   */
  getStatistics(): Record<string, any> {
    return {
      requestRate: this.getRequestRate(),
      blockedRate: this.getBlockedRate(),
      activeThreats: this.metrics.activeThreats,
      apiRequests: this.metrics.apiRequests,
      blockedRequests: this.metrics.blockedRequests,
      rateLimitedRequests: this.metrics.rateLimitedRequests || 0,
      failedLogins: this.metrics.failedLogins || 0,
      successfulLogins: this.metrics.successfulLogins || 0,
      threatsByType: threatDatabaseService.getThreatStatsByType(),
      threatsBySeverity: threatDatabaseService.getThreatStatsBySeverity(),
      recentEvents: this.getRecentEvents(5)
    };
  }
  
  /**
   * Get security score
   *
   * @returns Security score object with component scores
   */
  getSecurityScore(): {
    overall: number;
    components: Record<string, number>;
    recommendations: string[];
  } {
    // Calculate component scores (0-100)
    const threatMitigation = this.calculateThreatMitigationScore();
    const configSecurity = this.calculateConfigSecurityScore();
    const userSecurity = this.calculateUserSecurityScore();
    const dataProtection = this.calculateDataProtectionScore();
    const monitoringCoverage = this.calculateMonitoringCoverageScore();
    
    // Calculate overall score (weighted average)
    const overall = Math.round(
      (threatMitigation * 0.3) +
      (configSecurity * 0.2) +
      (userSecurity * 0.2) +
      (dataProtection * 0.2) +
      (monitoringCoverage * 0.1)
    );
    
    // Generate recommendations based on scores
    const recommendations = this.generateSecurityRecommendations({
      threatMitigation,
      configSecurity,
      userSecurity,
      dataProtection,
      monitoringCoverage
    });
    
    return {
      overall,
      components: {
        threatMitigation,
        configSecurity,
        userSecurity,
        dataProtection,
        monitoringCoverage
      },
      recommendations
    };
  }
  
  /**
   * Calculate threat mitigation score
   * 
   * @returns Score from 0-100
   */
  private calculateThreatMitigationScore(): number {
    // For now, use a simple placeholder calculation
    // This would normally be based on threat response time, etc.
    return 85;
  }
  
  /**
   * Calculate configuration security score
   * 
   * @returns Score from 0-100
   */
  private calculateConfigSecurityScore(): number {
    // Based on enabled security features
    const features = securityConfig.getSecurityFeatures();
    let score = 0;
    
    // Count enabled features
    const enabledCount = Object.values(features).filter(Boolean).length;
    const totalFeatures = Object.keys(features).length;
    
    score = Math.round((enabledCount / totalFeatures) * 100);
    
    return score;
  }
  
  /**
   * Calculate user security score
   * 
   * @returns Score from 0-100
   */
  private calculateUserSecurityScore(): number {
    // Would normally be based on password strength, MFA adoption, etc.
    return 80;
  }
  
  /**
   * Calculate data protection score
   * 
   * @returns Score from 0-100
   */
  private calculateDataProtectionScore(): number {
    // Would normally be based on encryption usage, etc.
    return 90;
  }
  
  /**
   * Calculate monitoring coverage score
   * 
   * @returns Score from 0-100
   */
  private calculateMonitoringCoverageScore(): number {
    // Based on whether monitoring is enabled
    return securityConfig.getSecurityFeatures().realTimeMonitoring ? 100 : 0;
  }
  
  /**
   * Generate security recommendations based on component scores
   * 
   * @param scores Component scores
   * @returns Array of recommendation strings
   */
  private generateSecurityRecommendations(scores: Record<string, number>): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on low scores
    if (scores.threatMitigation < 70) {
      recommendations.push('Configure automatic blocking for high-severity threats');
    }
    
    if (scores.configSecurity < 70) {
      recommendations.push('Enable additional security features in the security configuration');
    }
    
    if (scores.userSecurity < 70) {
      recommendations.push('Enforce stronger password policies and encourage MFA adoption');
    }
    
    if (scores.dataProtection < 70) {
      recommendations.push('Enable additional data encryption features');
    }
    
    if (scores.monitoringCoverage < 70) {
      recommendations.push('Enable real-time security monitoring');
    }
    
    return recommendations;
  }
  
  /**
   * Get threat trends over time
   */
  getThreatTrends(): any {
    return {
      timeSeries: this.history.historicalMetrics.map(metrics => ({
        timestamp: metrics.timestamp,
        apiRequests: metrics.apiRequests,
        blockedRequests: metrics.blockedRequests,
        activeThreats: metrics.activeThreats,
        failedLogins: metrics.failedLogins || 0
      })),
      summary: {
        apiRequestsGrowth: this.calculateMetricGrowth('apiRequests'),
        blockedRequestsGrowth: this.calculateMetricGrowth('blockedRequests'),
        activeThreatsGrowth: this.calculateMetricGrowth('activeThreats'),
      }
    };
  }
  
  /**
   * Calculate growth rate for a metric
   * 
   * @param metricName Name of the metric to calculate growth for
   * @returns Growth percentage (positive or negative)
   */
  private calculateMetricGrowth(metricName: keyof SecurityMetrics): number {
    const history = this.history.historicalMetrics;
    
    if (history.length < 2) {
      return 0;
    }
    
    // Get oldest and newest values
    const oldValue = history[0][metricName] as number || 0;
    const newValue = history[history.length - 1][metricName] as number || 0;
    
    // Avoid division by zero
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    
    // Calculate growth percentage
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }
  
  /**
   * Set the active threat count
   * 
   * @param count Number of active threats
   */
  setActiveThreats(count: number): void {
    this.metrics.activeThreats = count;
  }
  
  /**
   * Get current security metrics
   * 
   * @returns The current security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get request rate over the last hour
   * 
   * @returns Requests per minute
   */
  getRequestRate(): number {
    const now = Date.now();
    const recentRequests = this.history.requestHistory.filter(
      req => now - req.timestamp <= 60 * 1000  // last minute
    );
    
    return recentRequests.length;
  }
  
  /**
   * Get blocked request rate over the last hour
   * 
   * @returns Blocked requests per minute
   */
  getBlockedRate(): number {
    const now = Date.now();
    const recentBlockedRequests = this.history.requestHistory.filter(
      req => now - req.timestamp <= 60 * 1000 && req.blocked  // last minute, blocked only
    );
    
    return recentBlockedRequests.length;
  }
  
  /**
   * Add a metrics listener
   * 
   * @param listener Function to call when metrics are updated
   */
  addMetricsListener(listener: (metrics: SecurityMetrics) => void): void {
    this.metricListeners.push(listener);
  }
  
  /**
   * Remove a metrics listener
   * 
   * @param listener The listener to remove
   */
  removeMetricsListener(listener: (metrics: SecurityMetrics) => void): void {
    const index = this.metricListeners.indexOf(listener);
    if (index !== -1) {
      this.metricListeners.splice(index, 1);
    }
  }
  
  /**
   * Start collecting metrics on an interval
   * 
   * @param intervalMs Collection interval in milliseconds (default: 5 minutes)
   */
  startMetricsCollection(intervalMs: number = 5 * 60 * 1000): void {
    // Don't start if already running
    if (this.collectionInterval !== null) {
      return;
    }
    
    this.collectionIntervalMs = intervalMs;
    
    // Reset metrics when starting collection to prevent accumulation
    this.resetMetrics();
    
    // Log initial start (only in debug mode)
    if (process.env.DEBUG_SECURITY === 'true') {
      console.log(`[info] [system] Security metrics collection started { intervalMs: ${intervalMs} }`);
    }
    
    // Immediately collect metrics
    this.collectMetrics();
    
    // Set up interval for regular collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }
  
  /**
   * Stop collecting metrics
   */
  stopMetricsCollection(): void {
    if (this.collectionInterval !== null) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
  
  /**
   * Collect metrics and notify listeners
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Update timestamp
      this.metrics.timestamp = Date.now();
      
      // Get active (unresolved) threats count from database
      const unresolved = await threatDatabaseService.getThreats({ 
        resolved: false,
        limit: 1000 // Just in case there are many unresolved threats
      });
      this.metrics.activeThreats = unresolved.length;
      
      // Add metrics to history
      this.history.historicalMetrics.push({ ...this.metrics });
      
      // Trim history if it gets too long
      if (this.history.historicalMetrics.length > this.history.maxHistoryLength) {
        this.history.historicalMetrics.shift();
      }
      
      // Notify listeners
      this.notifyListeners();
      
      // Debug log metrics in development environment - only in debug mode
      if (process.env.DEBUG_SECURITY === 'true') {
        console.log(`[debug] [system] Security metrics collected ${JSON.stringify({
          apiRequests: this.metrics.apiRequests,
          blockedRequests: this.metrics.blockedRequests,
          activeThreats: this.metrics.activeThreats
        })}`);
      }
    } catch (error) {
      console.error('Error collecting security metrics:', error);
    }
  }
  
  /**
   * Clean up old request history entries
   */
  private cleanupRequestHistory(): void {
    const now = Date.now();
    this.history.requestHistory = this.history.requestHistory.filter(
      req => now - req.timestamp <= this.requestHistoryWindow
    );
  }
  
  /**
   * Notify all metrics listeners
   */
  private notifyListeners(): void {
    const metricsSnapshot = { ...this.metrics };
    
    for (const listener of this.metricListeners) {
      try {
        listener(metricsSnapshot);
      } catch (error) {
        console.error('Error in metrics listener:', error);
      }
    }
  }
}

// Create and export singleton instance
export const threatMonitoringService = new ThreatMonitoringService();