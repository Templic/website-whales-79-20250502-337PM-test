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
   * @param intervalMs Collection interval in milliseconds (default: 30 seconds)
   */
  startMetricsCollection(intervalMs: number = 30 * 1000): void {
    // Don't start if already running
    if (this.collectionInterval !== null) {
      return;
    }
    
    this.collectionIntervalMs = intervalMs;
    
    // Log initial start
    console.log(`[info] [system] Security metrics collection started { intervalMs: ${intervalMs} }`);
    
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
      
      // Debug log metrics in development environment
      console.log(`[debug] [system] Security metrics collected ${JSON.stringify({
        apiRequests: this.metrics.apiRequests,
        blockedRequests: this.metrics.blockedRequests,
        activeThreats: this.metrics.activeThreats
      })}`);
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