/**
 * EventAggregator.ts
 * 
 * A memory-efficient event aggregation system for PCI compliance (Phase 3).
 * This component collects and aggregates security events to detect patterns
 * and support reporting requirements for PCI DSS 10.7 and 10.8.
 */

import fs from 'fs';
import path from 'path';
import { log } from '../../utils/logger';

// Constants
const AGGREGATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const METRICS_RETENTION_DAYS = 90; // PCI requires 90 days of history
const METRICS_FILE_PATH = path.join(process.cwd(), 'logs', 'security', 'event-metrics.json');
const METRICS_ARCHIVE_DIR = path.join(process.cwd(), 'logs', 'security', 'metrics-archive');

// Event categories for classification
export enum EventCategory {
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  ACCESS_CONTROL = 'access_control',
  DATA = 'data',
  SYSTEM = 'system'
}

// Define the metrics structure
export interface SecurityEventMetrics {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  eventCounts: Record<string, number>;
  userActivitySummary: Record<string, number>;
  ipAddressSummary: Record<string, number>;
  paymentStats?: {
    totalAmount: number;
    averageAmount: number;
    transactionCount: number;
    failureRate: number;
  };
  authStats?: {
    attemptCount: number;
    failureCount: number;
    failureRate: number;
    uniqueUsers: number;
  };
  apiStats?: {
    requestCount: number;
    validationFailures: number;
    errorRate: number;
  };
  riskScore: number;
}

/**
 * Event aggregation system for security events
 */
export class EventAggregator {
  private metrics: SecurityEventMetrics[] = [];
  private currentPeriodEvents: any[] = [];
  private aggregationInterval: NodeJS.Timeout | null = null;
  private initialized = false;
  
  constructor() {
    this.createDirectories();
  }
  
  /**
   * Initialize the event aggregator
   */
  public initialize(): void {
    if (this.initialized) return;
    
    log('Initializing event aggregator for security monitoring', 'security');
    
    try {
      // Load any existing metrics
      this.loadMetrics();
      
      // Schedule regular aggregation
      this.aggregationInterval = setInterval(() => {
        this.aggregateEvents();
      }, AGGREGATION_INTERVAL_MS);
      
      log(`Event aggregation scheduled every ${AGGREGATION_INTERVAL_MS / 60000} minutes`, 'security');
      
      this.initialized = true;
    } catch (error) {
      log(`Failed to initialize event aggregator: ${error}`, 'error');
    }
  }
  
  /**
   * Add an event to be aggregated
   */
  public addEvent(event: any): void {
    try {
      // For memory efficiency, only store events until next aggregation
      if (this.currentPeriodEvents.length < 10000) { // Limit to prevent memory issues
        this.currentPeriodEvents.push(event);
      }
    } catch (error) {
      log(`Error adding event to aggregator: ${error}`, 'error');
    }
  }
  
  /**
   * Get the latest metrics
   */
  public getLatestMetrics(): SecurityEventMetrics | undefined {
    if (this.metrics.length > 0) {
      return this.metrics[this.metrics.length - 1];
    }
    return undefined;
  }
  
  /**
   * Get metrics for a time range
   */
  public getMetricsForRange(startDate: Date, endDate: Date): SecurityEventMetrics[] {
    try {
      return this.metrics.filter(metric => {
        const metricDate = new Date(metric.timestamp);
        return metricDate >= startDate && metricDate <= endDate;
      });
    } catch (error) {
      log(`Error retrieving metrics for range: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Force immediate aggregation of events
   */
  public forceAggregation(): SecurityEventMetrics | undefined {
    try {
      return this.aggregateEvents();
    } catch (error) {
      log(`Error during forced aggregation: ${error}`, 'error');
      return undefined;
    }
  }
  
  /**
   * Aggregate events and generate metrics
   */
  private aggregateEvents(): SecurityEventMetrics | undefined {
    try {
      if (this.currentPeriodEvents.length === 0) {
        log('No events to aggregate in this period', 'security');
        return undefined;
      }
      
      const now = new Date();
      const periodStart = new Date(now.getTime() - AGGREGATION_INTERVAL_MS);
      
      // Initialize event counts
      const eventCounts: Record<string, number> = {};
      const userActivity: Record<string, number> = {};
      const ipAddressActivity: Record<string, number> = {};
      
      // Payment-specific metrics
      let paymentTotal = 0;
      let paymentCount = 0;
      let paymentFailures = 0;
      
      // Auth-specific metrics
      let authAttempts = 0;
      let authFailures = 0;
      const uniqueUsers = new Set<string>();
      
      // API-specific metrics
      let apiRequests = 0;
      let apiValidationFailures = 0;
      
      // Process all events for this period
      for (const event of this.currentPeriodEvents) {
        try {
          // Count by event type
          const eventType = `${event.type}.${event.subtype || 'general'}`;
          eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;
          
          // Track user activity if available
          if (event.userId) {
            userActivity[event.userId] = (userActivity[event.userId] || 0) + 1;
            uniqueUsers.add(event.userId);
          }
          
          // Track IP address activity if available
          if (event.data?.ipAddress) {
            ipAddressActivity[event.data.ipAddress] = 
              (ipAddressActivity[event.data.ipAddress] || 0) + 1;
          }
          
          // Collect payment metrics
          if (event.type === 'payment') {
            if (event.data?.amount) {
              paymentTotal += Number(event.data.amount);
              paymentCount++;
            }
            
            if (event.status === 'failure') {
              paymentFailures++;
            }
          }
          
          // Collect authentication metrics
          if (event.type === 'authentication') {
            authAttempts++;
            
            if (event.status === 'failure') {
              authFailures++;
            }
          }
          
          // Collect API metrics
          if (event.type === 'api') {
            apiRequests++;
            
            if (event.subtype === 'validation' && event.status === 'failure') {
              apiValidationFailures++;
            }
          }
        } catch (eventError) {
          log(`Error processing event for aggregation: ${eventError}`, 'error');
        }
      }
      
      // Calculate risk score (simplified version)
      let riskScore = 0;
      
      // Authentication failures increase risk
      if (authAttempts > 0) {
        const authFailureRate = authFailures / authAttempts;
        riskScore += authFailureRate * 30; // Up to 30 points for auth failures
      }
      
      // Payment failures increase risk
      if (paymentCount > 0) {
        const paymentFailureRate = paymentFailures / paymentCount;
        riskScore += paymentFailureRate * 40; // Up to 40 points for payment failures
      }
      
      // API validation failures increase risk
      if (apiRequests > 0) {
        const apiFailureRate = apiValidationFailures / apiRequests;
        riskScore += apiFailureRate * 20; // Up to 20 points for API failures
      }
      
      // Calculate unusual activity metrics
      const userActivityValues = Object.values(userActivity);
      const avgUserActivity = userActivityValues.length > 0 
        ? userActivityValues.reduce((sum, val) => sum + val, 0) / userActivityValues.length 
        : 0;
      
      // Identify users with excessive activity (3x average)
      const highActivityUsers = Object.keys(userActivity)
        .filter(userId => userActivity[userId] > avgUserActivity * 3)
        .length;
      
      // Add up to 10 points for unusual user activity
      riskScore += Math.min(highActivityUsers * 2, 10);
      
      // Create the metrics object
      const metrics: SecurityEventMetrics = {
        timestamp: now.toISOString(),
        period: {
          start: periodStart.toISOString(),
          end: now.toISOString()
        },
        eventCounts,
        userActivitySummary: userActivity,
        ipAddressSummary: ipAddressActivity,
        paymentStats: paymentCount > 0 ? {
          totalAmount: paymentTotal,
          averageAmount: paymentCount > 0 ? paymentTotal / paymentCount : 0,
          transactionCount: paymentCount,
          failureRate: paymentCount > 0 ? paymentFailures / paymentCount : 0
        } : undefined,
        authStats: authAttempts > 0 ? {
          attemptCount: authAttempts,
          failureCount: authFailures,
          failureRate: authAttempts > 0 ? authFailures / authAttempts : 0,
          uniqueUsers: uniqueUsers.size
        } : undefined,
        apiStats: apiRequests > 0 ? {
          requestCount: apiRequests,
          validationFailures: apiValidationFailures,
          errorRate: apiRequests > 0 ? apiValidationFailures / apiRequests : 0
        } : undefined,
        riskScore: Math.min(riskScore, 100) // Cap at 100%
      };
      
      // Add to metrics history and save
      this.metrics.push(metrics);
      this.saveMetrics();
      
      // Clean up metrics that are older than retention period
      this.cleanupOldMetrics();
      
      // Clear current period events to free memory
      this.currentPeriodEvents = [];
      
      log(`Aggregated ${eventCounts ? Object.keys(eventCounts).length : 0} event types with risk score ${metrics.riskScore.toFixed(2)}`, 'security');
      
      return metrics;
    } catch (error) {
      log(`Error during event aggregation: ${error}`, 'error');
      return undefined;
    }
  }
  
  /**
   * Save current metrics to disk
   */
  private saveMetrics(): void {
    try {
      // For real-time access, save latest metrics to main file
      fs.writeFileSync(METRICS_FILE_PATH, JSON.stringify(
        this.metrics.slice(-10), // Keep only the 10 most recent in main file
        null, 
        2
      ));
      
      // Archive all metrics periodically
      const now = new Date();
      const archiveFileName = `metrics-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.json`;
      const archiveFilePath = path.join(METRICS_ARCHIVE_DIR, archiveFileName);
      
      fs.writeFileSync(archiveFilePath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      log(`Error saving metrics: ${error}`, 'error');
    }
  }
  
  /**
   * Load metrics from disk
   */
  private loadMetrics(): void {
    try {
      // First, check if main metrics file exists
      if (fs.existsSync(METRICS_FILE_PATH)) {
        const metricsData = fs.readFileSync(METRICS_FILE_PATH, 'utf-8');
        const loadedMetrics = JSON.parse(metricsData);
        
        if (Array.isArray(loadedMetrics)) {
          this.metrics = loadedMetrics;
          log(`Loaded ${this.metrics.length} recent metrics`, 'security');
        }
      }
      
      // Check archive directory for older metrics
      if (fs.existsSync(METRICS_ARCHIVE_DIR)) {
        const files = fs.readdirSync(METRICS_ARCHIVE_DIR)
          .filter(file => file.startsWith('metrics-') && file.endsWith('.json'))
          .sort();
        
        // Load most recent archive file if needed
        if (files.length > 0 && this.metrics.length === 0) {
          const mostRecentArchive = files[files.length - 1];
          const archiveData = fs.readFileSync(
            path.join(METRICS_ARCHIVE_DIR, mostRecentArchive), 
            'utf-8'
          );
          
          const archivedMetrics = JSON.parse(archiveData);
          if (Array.isArray(archivedMetrics)) {
            this.metrics = archivedMetrics;
            log(`Loaded ${this.metrics.length} metrics from archive ${mostRecentArchive}`, 'security');
          }
        }
      }
    } catch (error) {
      log(`Error loading metrics: ${error}`, 'error');
      this.metrics = [];
    }
  }
  
  /**
   * Clean up metrics older than retention period
   */
  private cleanupOldMetrics(): void {
    try {
      const now = new Date();
      const retentionDate = new Date(now.getTime() - (METRICS_RETENTION_DAYS * 24 * 60 * 60 * 1000));
      
      // Keep only metrics within retention period
      const initialCount = this.metrics.length;
      this.metrics = this.metrics.filter(metric => {
        return new Date(metric.timestamp) >= retentionDate;
      });
      
      const removedCount = initialCount - this.metrics.length;
      if (removedCount > 0) {
        log(`Removed ${removedCount} metrics older than ${METRICS_RETENTION_DAYS} days`, 'security');
      }
    } catch (error) {
      log(`Error cleaning up old metrics: ${error}`, 'error');
    }
  }
  
  /**
   * Create necessary directories
   */
  private createDirectories(): void {
    try {
      const metricsDir = path.dirname(METRICS_FILE_PATH);
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }
      
      if (!fs.existsSync(METRICS_ARCHIVE_DIR)) {
        fs.mkdirSync(METRICS_ARCHIVE_DIR, { recursive: true });
      }
    } catch (error) {
      log(`Error creating directories: ${error}`, 'error');
    }
  }
  
  /**
   * Shutdown the event aggregator
   */
  public shutdown(): void {
    try {
      // Clear aggregation interval
      if (this.aggregationInterval) {
        clearInterval(this.aggregationInterval);
        this.aggregationInterval = null;
      }
      
      // Perform final aggregation
      this.aggregateEvents();
      
      // Save metrics
      this.saveMetrics();
      
      log('Event aggregator shut down successfully', 'security');
    } catch (error) {
      log(`Error shutting down event aggregator: ${error}`, 'error');
    }
  }
}

// Create singleton instance
export const eventAggregator = new EventAggregator();

// Export initialization function
export function initializeEventAggregator(): void {
  eventAggregator.initialize();
}