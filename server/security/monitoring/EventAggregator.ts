/**
 * EventAggregator.ts
 * 
 * A memory-efficient event aggregation system for PCI compliance monitoring (Phase 3).
 * This system implements PCI requirements 10.7 (audit trail retention) and 
 * 10.8 (security event monitoring) in a resource-efficient manner.
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { AuditEvent, AuditEventType, AuditEventSeverity } from '../secureAuditTrail';
import { getAuditLogs } from '../secureAuditTrail';
import { log } from '../../utils/logger';

// Constants for configuration
const AGGREGATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EVENTS_IN_MEMORY = 1000;
const HIGH_MEMORY_THRESHOLD = 85; // percentage
const AGGREGATED_LOGS_DIR = path.join(process.cwd(), 'logs', 'aggregated');

// Event categories for aggregation
export enum EventCategory {
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication',
  ACCESS_CONTROL = 'access_control',
  DATA_MODIFICATION = 'data_modification',
  SYSTEM = 'system'
}

// Aggregated metrics structure
interface AggregatedMetrics {
  timestamp: string;
  eventCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  userCounts: Record<string, number>;
  ipCounts: Record<string, number>;
  anomalyScore: number;
  summaryHash: string;
}

/**
 * Memory-efficient event aggregator for security monitoring
 */
export class EventAggregator {
  private eventBuffer: AuditEvent[] = [];
  private aggregationInterval: NodeJS.Timeout | null = null;
  private isAggregating = false;
  private latestMetrics: AggregatedMetrics | null = null;
  private alertThresholds: Record<string, number> = {
    'payment.failure': 5,
    'authentication.failure': 10,
    'access_control.unauthorized': 3,
    'data_modification.sensitive': 2,
    'system.error': 15
  };

  constructor() {
    this.createAggregatedLogsDirectory();
  }

  /**
   * Initialize the event aggregator
   */
  public initialize(): void {
    log('Initializing event aggregator for security monitoring', 'security');
    
    // Start the aggregation timer
    this.aggregationInterval = setInterval(() => {
      this.performAggregation();
    }, AGGREGATION_INTERVAL_MS);
    
    log('Event aggregation scheduled every 5 minutes', 'security');
  }

  /**
   * Add an event to the buffer for processing
   */
  public addEvent(event: AuditEvent): void {
    // Apply selective filtering - only store events relevant for security monitoring
    if (this.isRelevantForMonitoring(event)) {
      this.eventBuffer.push(event);
      
      // If buffer exceeds maximum size, trigger immediate aggregation
      if (this.eventBuffer.length > MAX_EVENTS_IN_MEMORY) {
        this.performAggregation();
      }
    }
  }

  /**
   * Get the latest aggregated metrics
   */
  public getLatestMetrics(): AggregatedMetrics | null {
    return this.latestMetrics;
  }

  /**
   * Get aggregated metrics for a specific time range
   * Uses on-demand processing to minimize memory usage
   */
  public async getMetricsForTimeRange(
    startTime: string, 
    endTime: string
  ): Promise<AggregatedMetrics[]> {
    const metrics: AggregatedMetrics[] = [];
    
    try {
      // Get list of all aggregated log files
      const files = fs.readdirSync(AGGREGATED_LOGS_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const timestamp = file.replace('aggregate-', '').replace('.json', '');
          return { file, timestamp };
        })
        .filter(item => {
          const fileTime = new Date(item.timestamp).getTime();
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          return fileTime >= start && fileTime <= end;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Read each file in the range
      for (const fileInfo of files) {
        const filePath = path.join(AGGREGATED_LOGS_DIR, fileInfo.file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const metrics_data = JSON.parse(fileContent) as AggregatedMetrics;
        metrics.push(metrics_data);
      }
      
      return metrics;
    } catch (error) {
      log(`Error retrieving metrics for time range: ${error}`, 'error');
      return [];
    }
  }

  /**
   * Check for security anomalies based on configured thresholds
   * Returns the anomaly details if found, or null if no anomalies
   */
  public checkForAnomalies(): { category: string, count: number, threshold: number } | null {
    if (!this.latestMetrics) return null;
    
    // Check each threshold against current counts
    for (const [category, threshold] of Object.entries(this.alertThresholds)) {
      const [type, subtype] = category.split('.');
      const key = `${type}.${subtype}`;
      const count = this.latestMetrics.eventCounts[key] || 0;
      
      if (count >= threshold) {
        return { category, count, threshold };
      }
    }
    
    return null;
  }

  /**
   * Perform aggregation of events in the buffer
   */
  private performAggregation(): void {
    // Skip if already aggregating or buffer is empty
    if (this.isAggregating || this.eventBuffer.length === 0) {
      return;
    }
    
    this.isAggregating = true;
    
    try {
      // Check system memory before proceeding
      this.checkSystemMemory();
      
      // Copy events to process and clear buffer to reduce memory pressure
      const eventsToProcess = [...this.eventBuffer];
      this.eventBuffer = [];
      
      // Perform aggregation
      const metrics = this.aggregateEvents(eventsToProcess);
      this.latestMetrics = metrics;
      
      // Save aggregated data to disk
      this.saveAggregatedMetrics(metrics);
      
      log(`Successfully aggregated ${eventsToProcess.length} security events`, 'security');
    } catch (error) {
      log(`Error during event aggregation: ${error}`, 'error');
    } finally {
      this.isAggregating = false;
    }
  }

  /**
   * Aggregate events into metrics
   */
  private aggregateEvents(events: AuditEvent[]): AggregatedMetrics {
    const timestamp = new Date().toISOString();
    const eventCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    
    // Process each event
    for (const event of events) {
      // Count by event type
      const eventTypeKey = `${event.type}.${event.subtype || 'general'}`;
      eventCounts[eventTypeKey] = (eventCounts[eventTypeKey] || 0) + 1;
      
      // Count by severity
      severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1;
      
      // Count by user
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
      
      // Count by IP address
      if (event.data && event.data.ipAddress) {
        ipCounts[event.data.ipAddress] = (ipCounts[event.data.ipAddress] || 0) + 1;
      }
    }
    
    // Calculate anomaly score based on severity and event patterns
    const anomalyScore = this.calculateAnomalyScore(eventCounts, severityCounts);
    
    // Create a hash of the aggregated data for integrity verification
    const dataToHash = JSON.stringify({
      timestamp,
      eventCounts,
      severityCounts,
      userCounts,
      ipCounts,
      anomalyScore
    });
    
    const summaryHash = createHash('sha256').update(dataToHash).digest('hex');
    
    return {
      timestamp,
      eventCounts,
      severityCounts,
      userCounts,
      ipCounts,
      anomalyScore,
      summaryHash
    };
  }

  /**
   * Calculate an anomaly score based on event patterns
   */
  private calculateAnomalyScore(
    eventCounts: Record<string, number>,
    severityCounts: Record<string, number>
  ): number {
    let score = 0;
    
    // Add points for high severity events
    score += (severityCounts['critical'] || 0) * 10;
    score += (severityCounts['high'] || 0) * 5;
    score += (severityCounts['medium'] || 0) * 2;
    
    // Add points for specific concerning event types
    score += (eventCounts['payment.failure'] || 0) * 8;
    score += (eventCounts['authentication.failure'] || 0) * 3;
    score += (eventCounts['access_control.unauthorized'] || 0) * 7;
    score += (eventCounts['data_modification.sensitive'] || 0) * 9;
    
    return score;
  }

  /**
   * Save aggregated metrics to disk
   */
  private saveAggregatedMetrics(metrics: AggregatedMetrics): void {
    try {
      const filename = `aggregate-${metrics.timestamp.replace(/:/g, '-')}.json`;
      const filePath = path.join(AGGREGATED_LOGS_DIR, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));
      
      // Maintain a summary index file for faster access
      this.updateMetricsIndex(metrics);
    } catch (error) {
      log(`Error saving aggregated metrics: ${error}`, 'error');
    }
  }

  /**
   * Update the metrics index file
   */
  private updateMetricsIndex(metrics: AggregatedMetrics): void {
    try {
      const indexPath = path.join(AGGREGATED_LOGS_DIR, 'metrics-index.json');
      let index: any[] = [];
      
      // Read existing index if it exists
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        index = JSON.parse(indexContent);
      }
      
      // Add new metrics summary to the index
      index.push({
        timestamp: metrics.timestamp,
        anomalyScore: metrics.anomalyScore,
        criticalCount: metrics.severityCounts['critical'] || 0,
        highCount: metrics.severityCounts['high'] || 0,
        summaryHash: metrics.summaryHash
      });
      
      // Keep only the last 1000 entries to limit file size
      if (index.length > 1000) {
        index = index.slice(index.length - 1000);
      }
      
      // Write the updated index
      fs.writeFileSync(indexPath, JSON.stringify(index));
    } catch (error) {
      log(`Error updating metrics index: ${error}`, 'error');
    }
  }

  /**
   * Check if event is relevant for security monitoring
   */
  private isRelevantForMonitoring(event: AuditEvent): boolean {
    // Always include critical and high severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      return true;
    }
    
    // Include all payment-related events
    if (event.type === 'payment') {
      return true;
    }
    
    // Include authentication failures
    if (event.type === 'authentication' && event.subtype === 'failure') {
      return true;
    }
    
    // Include access control events
    if (event.type === 'access' || event.type === 'authorization') {
      return true;
    }
    
    // Include data modification events for sensitive data
    if (event.type === 'data' && event.subtype === 'modification' && 
        event.data && event.data.sensitiveData === true) {
      return true;
    }
    
    // Filter out routine low-severity events to save resources
    return false;
  }

  /**
   * Check system memory usage and adapt behavior if needed
   */
  private checkSystemMemory(): void {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      if (memoryPercentage > HIGH_MEMORY_THRESHOLD) {
        // If memory usage is high, process fewer events at once
        log(`High memory usage detected (${memoryPercentage.toFixed(1)}%), reducing event batch size`, 'warning');
        
        // If buffer is too large, keep only the most critical events
        if (this.eventBuffer.length > MAX_EVENTS_IN_MEMORY / 2) {
          this.eventBuffer = this.eventBuffer
            .filter(event => event.severity === 'critical' || event.severity === 'high')
            .slice(-MAX_EVENTS_IN_MEMORY / 4);
          
          log(`Memory pressure - reduced event buffer to ${this.eventBuffer.length} critical events`, 'security');
        }
      }
    } catch (error) {
      log(`Error checking system memory: ${error}`, 'error');
    }
  }

  /**
   * Create directory for aggregated logs if it doesn't exist
   */
  private createAggregatedLogsDirectory(): void {
    try {
      if (!fs.existsSync(AGGREGATED_LOGS_DIR)) {
        fs.mkdirSync(AGGREGATED_LOGS_DIR, { recursive: true });
      }
    } catch (error) {
      log(`Error creating aggregated logs directory: ${error}`, 'error');
    }
  }

  /**
   * Cleanup resources when shutting down
   */
  public shutdown(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }
    
    // Flush any remaining events
    if (this.eventBuffer.length > 0) {
      this.performAggregation();
    }
    
    log('Event aggregator shut down successfully', 'security');
  }
}

// Singleton instance
export const eventAggregator = new EventAggregator();

// Export convenience function for adding events
export function addSecurityEvent(event: AuditEvent): void {
  eventAggregator.addEvent(event);
}

// Export function to initialize aggregator
export function initializeEventAggregator(): void {
  eventAggregator.initialize();
}