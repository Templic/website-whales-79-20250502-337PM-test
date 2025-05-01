/**
 * Threat Monitoring Service
 * 
 * Provides monitoring, reporting, and visualization capabilities for security threats:
 * - Real-time security metrics collection
 * - Security score calculation
 * - Threat trend analysis
 * - Security recommendations
 */

import { threatDbService, ThreatType, ThreatSeverity } from './ThreatDatabaseService';
import { threatDetectionService } from './ThreatDetectionService';

/**
 * Security score component
 */
interface SecurityScoreComponent {
  score: number;   // 0-100
  weight: number;  // Component weight for overall calculation
  details: {
    [key: string]: number;
  };
  recommendations: string[];
}

/**
 * Security score with components
 */
interface SecurityScore {
  overall: number;  // 0-100
  lastUpdated: number;  // Timestamp
  components: {
    threatMitigation: number;    // How well threats are being mitigated
    configurationSecurity: number;  // Security settings configuration
    userSecurity: number;    // User access and permissions
    dataProtection: number;  // Data encryption and protection
    monitoring: number;      // Monitoring coverage
  };
  recommendations: string[];
}

/**
 * Security event types
 */
type SecurityEventType = 'threat_detected' | 'threat_blocked' | 'threat_resolved' | 
                         'rule_created' | 'rule_updated' | 'rule_deleted' | 
                         'ip_blocked' | 'ip_unblocked' | 
                         'settings_changed' | 'system_event';

/**
 * Security event interface
 */
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: number;
  details: Record<string, any>;
  relatedThreatId?: string;
  relatedRuleId?: string;
  userId?: string;
}

/**
 * Security metrics for tracking system activity
 */
interface SecurityMetrics {
  interval: number;  // Tracking interval in milliseconds
  startTime: number;  // Start of interval
  endTime: number;    // End of interval
  apiRequests: number;  // API requests in the interval
  blockedRequests: number;  // Blocked requests in the interval
  threats: {
    detected: number;
    resolved: number;
    byType: Record<ThreatType, number>;
    bySeverity: Record<ThreatSeverity, number>;
  };
  activeThreats: number;
  blockedIps: number;
}

/**
 * ThreatMonitoringService provides metrics and monitoring for security threats
 */
export class ThreatMonitoringService {
  private securityEvents: SecurityEvent[] = [];
  private metrics: SecurityMetrics = {
    interval: 24 * 60 * 60 * 1000,  // 24 hours
    startTime: Date.now() - 24 * 60 * 60 * 1000,
    endTime: Date.now(),
    apiRequests: 0,
    blockedRequests: 0,
    threats: {
      detected: 0,
      resolved: 0,
      byType: {} as Record<ThreatType, number>,
      bySeverity: {} as Record<ThreatSeverity, number>
    },
    activeThreats: 0,
    blockedIps: 0
  };
  
  private securityScore: SecurityScore = {
    overall: 70,  // Default starting score
    lastUpdated: Date.now(),
    components: {
      threatMitigation: 65,
      configurationSecurity: 75,
      userSecurity: 70,
      dataProtection: 80,
      monitoring: 60
    },
    recommendations: [
      'Enable additional security features for higher protection',
      'Review and resolve active security threats',
      'Configure automatic threat blocking for critical threats'
    ]
  };
  
  private statistics = {
    totalThreats: 0,
    resolvedThreats: 0,
    threatsByType: {} as Record<string, number>,
    threatsBySeverity: {} as Record<string, number>,
    totalBlockedIps: 0
  };
  
  constructor() {
    // Initialize with data from database
    this.initialize();
    
    // Set up periodic metrics collection
    setInterval(() => this.collectMetrics(), 30 * 60 * 1000);  // Every 30 minutes
  }
  
  /**
   * Initialize monitoring with data from database
   */
  private async initialize(): Promise<void> {
    try {
      await this.calculateStatistics();
      await this.updateSecurityScore();
      
      console.log('Threat Monitoring Service initialized');
    } catch (error) {
      console.error('Error initializing threat monitoring:', error);
    }
  }
  
  /**
   * Record a security event
   */
  recordEvent(type: SecurityEventType, details: Record<string, any>, relatedThreatId?: string, relatedRuleId?: string, userId?: string): void {
    const event: SecurityEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      type,
      timestamp: Date.now(),
      details,
      relatedThreatId,
      relatedRuleId,
      userId
    };
    
    // Keep maximum 1000 events in memory
    this.securityEvents.unshift(event);
    if (this.securityEvents.length > 1000) {
      this.securityEvents.pop();
    }
    
    // Update relevant metrics
    if (type === 'threat_detected') {
      this.metrics.threats.detected++;
      
      // Update by type and severity if available
      if (details.threatType) {
        this.metrics.threats.byType[details.threatType as ThreatType] = 
          (this.metrics.threats.byType[details.threatType as ThreatType] || 0) + 1;
      }
      
      if (details.severity) {
        this.metrics.threats.bySeverity[details.severity as ThreatSeverity] = 
          (this.metrics.threats.bySeverity[details.severity as ThreatSeverity] || 0) + 1;
      }
    } else if (type === 'threat_resolved') {
      this.metrics.threats.resolved++;
    } else if (type === 'ip_blocked') {
      this.metrics.blockedIps++;
    }
  }
  
  /**
   * Record an API request (for metrics)
   */
  recordApiRequest(blocked: boolean = false): void {
    this.metrics.apiRequests++;
    if (blocked) {
      this.metrics.blockedRequests++;
    }
  }
  
  /**
   * Collect metrics from the database and threat detection service
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Update time range for metrics
      const now = Date.now();
      this.metrics.startTime = now - this.metrics.interval;
      this.metrics.endTime = now;
      
      // Get active threats count
      this.metrics.activeThreats = threatDetectionService.getActiveThreats().length;
      
      // Calculate and update statistics
      await this.calculateStatistics();
      
      // Update security score
      await this.updateSecurityScore();
      
    } catch (error) {
      console.error('Error collecting security metrics:', error);
    }
  }
  
  /**
   * Calculate threat statistics from database
   */
  private async calculateStatistics(): Promise<void> {
    try {
      // Get threat stats from database
      const dbStats = await threatDbService.getThreatStatistics();
      
      // Extract and update statistics
      if (dbStats.last24Hours) {
        this.statistics = {
          totalThreats: dbStats.last24Hours.total || 0,
          resolvedThreats: dbStats.last24Hours.resolved || 0,
          threatsByType: dbStats.last24Hours.byType || {},
          threatsBySeverity: {
            critical: dbStats.last24Hours.critical || 0,
            high: dbStats.last24Hours.high || 0,
            medium: dbStats.last24Hours.medium || 0,
            low: dbStats.last24Hours.low || 0
          },
          totalBlockedIps: 0  // Will be updated separately
        };
      }
      
      // Get blocked IPs count
      const blockedIps = await threatDbService.getBlockedIps(true);
      this.statistics.totalBlockedIps = blockedIps.length;
      
    } catch (error) {
      console.error('Error calculating threat statistics:', error);
    }
  }
  
  /**
   * Update the security score based on current statistics
   */
  private async updateSecurityScore(): Promise<void> {
    try {
      // Calculate threat mitigation score
      const criticalCount = this.statistics.threatsBySeverity.critical || 0;
      const highCount = this.statistics.threatsBySeverity.high || 0;
      const mediumCount = this.statistics.threatsBySeverity.medium || 0;
      const lowCount = this.statistics.threatsBySeverity.low || 0;
      
      // Calculate threat mitigation score
      // More weight for higher severity threats
      const threatWeight = (criticalCount * 10 + highCount * 5 + mediumCount * 2 + lowCount) || 1;
      const mitigationRatio = this.statistics.resolvedThreats / (this.statistics.totalThreats || 1);
      const threatMitigation = Math.max(0, Math.min(100, 100 * mitigationRatio - (threatWeight / 5)));
      
      // Calculate monitoring score based on active rules
      const activeRules = threatDetectionService.getActiveRules();
      const monitoring = Math.min(100, 50 + activeRules.length * 5);
      
      // For now, keep other scores the same (in a real implementation, these would be calculated)
      const { configurationSecurity, userSecurity, dataProtection } = this.securityScore.components;
      
      // Calculate overall score (weighted average)
      const overall = Math.round(
        (threatMitigation * 0.3) +
        (configurationSecurity * 0.2) +
        (userSecurity * 0.15) +
        (dataProtection * 0.25) +
        (monitoring * 0.1)
      );
      
      // Generate recommendations based on scores
      const recommendations: string[] = [];
      
      if (threatMitigation < 60) {
        recommendations.push("Improve threat response time by setting up automated remediation");
      }
      
      if (monitoring < 70) {
        recommendations.push("Enable more threat detection rules to improve coverage");
      }
      
      if (criticalCount > 0) {
        recommendations.push(`Address ${criticalCount} critical security threat(s) immediately`);
      } else if (highCount > 0) {
        recommendations.push(`Resolve ${highCount} high severity security threat(s)`);
      }
      
      if (configurationSecurity < 70) {
        recommendations.push("Review security configuration settings for best practices");
      }
      
      // Update security score
      this.securityScore = {
        overall,
        lastUpdated: Date.now(),
        components: {
          threatMitigation,
          configurationSecurity,
          userSecurity,
          dataProtection,
          monitoring
        },
        recommendations: recommendations.length > 0 ? recommendations : ["No specific security recommendations at this time"]
      };
      
    } catch (error) {
      console.error('Error updating security score:', error);
    }
  }
  
  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(0, limit);
  }
  
  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get security score
   */
  getSecurityScore(): SecurityScore {
    return { ...this.securityScore };
  }
  
  /**
   * Get threat statistics
   */
  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }
  
  /**
   * Get threat trend analysis
   */
  async getThreatTrends(days: number = 7): Promise<Record<string, any>> {
    // In a real implementation, this would fetch historical data from the database
    // For this example, we'll return a simple mock of trend data
    
    return {
      trends: {
        byDay: Array(days).fill(0).map((_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + (days - i)
        })),
        byType: Object.fromEntries(
          Object.entries(this.statistics.threatsByType).map(([type, count]) => [
            type,
            Array(days).fill(0).map((_, i) => Math.floor(count * (i / days) * Math.random()))
          ])
        )
      }
    };
  }
}

// Create singleton instance
export const threatMonitoringService = new ThreatMonitoringService();