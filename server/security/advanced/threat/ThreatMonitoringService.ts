/**
 * Threat Monitoring Service
 * 
 * Provides real-time monitoring and response capabilities for security threats:
 * - Monitors threats detected by the ThreatDetectionService
 * - Collects statistics about threats
 * - Recommends security improvements
 * - Provides automated responses to threats based on their type and severity
 */

import { ThreatType, ThreatSeverity, DetectedThreat, threatDetectionService } from './ThreatDetectionService';

// Threat statistics interface
export interface ThreatStatistics {
  totalThreats: number;
  activeThreats: number;
  resolvedThreats: number;
  threatsByType: Record<string, number>;
  threatsBySeverity: Record<string, number>;
  threatsByTimeOfDay: Record<string, number>;
  threatsByIp: Record<string, number>;
  threatsByEndpoint: Record<string, number>;
  topRules: Array<{id: string, count: number, name: string}>;
  lastUpdated: number;
}

// Security score components
export interface SecurityScore {
  overall: number; // 0-100
  components: {
    threatMitigation: number;
    configurationSecurity: number;
    userSecurity: number;
    dataProtection: number;
    monitoring: number;
  };
  recommendations: string[];
  lastUpdated: number;
}

// Response action definition for automated threat responses
export interface ResponseAction {
  id: string;
  name: string;
  description: string;
  threatTypes: ThreatType[];
  minSeverity: ThreatSeverity;
  action: (threat: DetectedThreat) => Promise<void>;
  automatic: boolean;
}

class ThreatMonitoringService {
  private statistics: ThreatStatistics;
  private securityScore: SecurityScore;
  private responseActions: ResponseAction[] = [];
  private monitoredThreats: Set<string> = new Set(); // Keep track of threats we've already processed
  private statisticsUpdatedListeners: Array<(stats: ThreatStatistics) => void> = [];
  private securityScoreUpdatedListeners: Array<(score: SecurityScore) => void> = [];
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    // Initialize statistics
    this.statistics = {
      totalThreats: 0,
      activeThreats: 0,
      resolvedThreats: 0,
      threatsByType: {},
      threatsBySeverity: {},
      threatsByTimeOfDay: {},
      threatsByIp: {},
      threatsByEndpoint: {},
      topRules: [],
      lastUpdated: Date.now()
    };
    
    // Initialize security score
    this.securityScore = {
      overall: 70, // Initial baseline score
      components: {
        threatMitigation: 70,
        configurationSecurity: 70,
        userSecurity: 70,
        dataProtection: 80,
        monitoring: 60
      },
      recommendations: [
        "Enable real-time monitoring for all critical systems",
        "Implement multi-factor authentication for all admin users",
        "Update security policies for sensitive data access"
      ],
      lastUpdated: Date.now()
    };
    
    // Register default response actions
    this.registerDefaultResponseActions();
    
    // Start the monitoring interval
    this.startMonitoring();
    
    console.log('Threat Monitoring Service initialized');
  }
  
  /**
   * Register default response actions
   */
  private registerDefaultResponseActions(): void {
    // Block IP for severe SQL injection attempts
    this.addResponseAction({
      id: 'block-sql-injection',
      name: 'Block IP for SQL Injection',
      description: 'Automatically blocks the source IP of severe SQL injection attempts',
      threatTypes: [ThreatType.SQL_INJECTION],
      minSeverity: ThreatSeverity.HIGH,
      action: async (threat: DetectedThreat) => {
        threatDetectionService.blockIp(threat.sourceIp);
        console.log(`[ThreatMonitoring] Automated response: Blocked IP ${threat.sourceIp} for SQL injection`);
      },
      automatic: true
    });
    
    // Block IP for severe XSS attempts
    this.addResponseAction({
      id: 'block-xss',
      name: 'Block IP for XSS',
      description: 'Automatically blocks the source IP of severe XSS attempts',
      threatTypes: [ThreatType.XSS],
      minSeverity: ThreatSeverity.HIGH,
      action: async (threat: DetectedThreat) => {
        threatDetectionService.blockIp(threat.sourceIp);
        console.log(`[ThreatMonitoring] Automated response: Blocked IP ${threat.sourceIp} for XSS`);
      },
      automatic: true
    });
    
    // Notify admins for any critical threat
    this.addResponseAction({
      id: 'notify-critical',
      name: 'Notify Admins of Critical Threats',
      description: 'Sends notification to administrators for any critical threat',
      threatTypes: Object.values(ThreatType),
      minSeverity: ThreatSeverity.CRITICAL,
      action: async (threat: DetectedThreat) => {
        console.log(`[ThreatMonitoring] Would send notification to admins about: ${threat.description}`);
        
        // In a real implementation, this would call a notification service
      },
      automatic: true
    });
    
    // Rate limit IP for API abuse
    this.addResponseAction({
      id: 'rate-limit-api-abuse',
      name: 'Rate Limit IP for API Abuse',
      description: 'Applies rate limiting to IPs that abuse API endpoints',
      threatTypes: [ThreatType.API_ABUSE],
      minSeverity: ThreatSeverity.MEDIUM,
      action: async (threat: DetectedThreat) => {
        // In a real implementation, this would adjust rate limits for this IP
        console.log(`[ThreatMonitoring] Automated response: Applied enhanced rate limiting to IP ${threat.sourceIp}`);
      },
      automatic: true
    });
  }
  
  /**
   * Add a new response action
   */
  public addResponseAction(action: ResponseAction): void {
    // Check for duplicate ID
    if (this.responseActions.some(a => a.id === action.id)) {
      console.warn(`Response action with ID ${action.id} already exists. Skipping.`);
      return;
    }
    
    this.responseActions.push(action);
  }
  
  /**
   * Start monitoring interval
   */
  public startMonitoring(intervalMs: number = 60000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.updateStatistics();
      this.updateSecurityScore();
    }, intervalMs);
  }
  
  /**
   * Stop monitoring interval
   */
  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Handle detected threats
   */
  private async handleThreatDetected(threat: DetectedThreat): Promise<void> {
    // Skip if we've already processed this threat
    if (this.monitoredThreats.has(threat.id)) {
      return;
    }
    
    // Mark as processed
    this.monitoredThreats.add(threat.id);
    
    console.log(`[ThreatMonitoring] Processing detected threat: ${threat.id}, type: ${threat.threatType}, severity: ${threat.severity}`);
    
    // Update statistics (will be processed in next interval)
    
    // Find applicable response actions
    const applicableActions = this.responseActions.filter(action => 
      action.threatTypes.includes(threat.threatType) && 
      this.compareSeverity(threat.severity, action.minSeverity) >= 0
    );
    
    // Execute automatic actions
    for (const action of applicableActions) {
      if (action.automatic) {
        try {
          await action.action(threat);
          
          // Add to the list of actions taken for this threat
          threat.actionTaken = threat.actionTaken || [];
          threat.actionTaken.push(action.name);
          
        } catch (error) {
          console.error(`[ThreatMonitoring] Error executing response action ${action.id}:`, error);
        }
      }
    }
  }
  
  /**
   * Update threat statistics
   */
  private updateStatistics(): void {
    const threats = threatDetectionService.getDetectedThreats();
    
    // Reset counters
    const stats: ThreatStatistics = {
      totalThreats: threats.length,
      activeThreats: 0,
      resolvedThreats: 0,
      threatsByType: {},
      threatsBySeverity: {},
      threatsByTimeOfDay: {},
      threatsByIp: {},
      threatsByEndpoint: {},
      topRules: [],
      lastUpdated: Date.now()
    };
    
    // Count rules
    const ruleCounts = new Map<string, { count: number, name: string }>();
    
    // Process each threat
    for (const threat of threats) {
      // Count active vs resolved
      if (threat.resolved) {
        stats.resolvedThreats++;
      } else {
        stats.activeThreats++;
      }
      
      // Count by type
      stats.threatsByType[threat.threatType] = (stats.threatsByType[threat.threatType] || 0) + 1;
      
      // Count by severity
      stats.threatsBySeverity[threat.severity] = (stats.threatsBySeverity[threat.severity] || 0) + 1;
      
      // Count by time of day
      const hour = new Date(threat.timestamp).getHours();
      const timeKey = `${hour.toString().padStart(2, '0')}:00`;
      stats.threatsByTimeOfDay[timeKey] = (stats.threatsByTimeOfDay[timeKey] || 0) + 1;
      
      // Count by IP
      if (threat.sourceIp) {
        stats.threatsByIp[threat.sourceIp] = (stats.threatsByIp[threat.sourceIp] || 0) + 1;
      }
      
      // Count by endpoint
      if (threat.requestPath) {
        stats.threatsByEndpoint[threat.requestPath] = (stats.threatsByEndpoint[threat.requestPath] || 0) + 1;
      }
      
      // Count by rule ID
      if (threat.ruleId) {
        const existingRule = ruleCounts.get(threat.ruleId);
        if (existingRule) {
          existingRule.count++;
        } else {
          // Get rule name from threat description if available
          const name = threat.description.split(' - ')[0] || threat.ruleId;
          ruleCounts.set(threat.ruleId, { count: 1, name });
        }
      }
    }
    
    // Convert rule counts to sorted array
    stats.topRules = Array.from(ruleCounts.entries())
      .map(([id, { count, name }]) => ({ id, count, name }))
      .sort((a, b) => b.count - a.count);
    
    // Update statistics
    this.statistics = stats;
    
    // Notify listeners
    this.notifyStatisticsUpdated();
  }
  
  /**
   * Update security score based on current threats and system configuration
   */
  private updateSecurityScore(): void {
    // Get counts for different threat severities
    const criticalCount = this.statistics.threatsBySeverity[ThreatSeverity.CRITICAL] || 0;
    const highCount = this.statistics.threatsBySeverity[ThreatSeverity.HIGH] || 0;
    const mediumCount = this.statistics.threatsBySeverity[ThreatSeverity.MEDIUM] || 0;
    const lowCount = this.statistics.threatsBySeverity[ThreatSeverity.LOW] || 0;
    
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
      recommendations.push("Address all critical threats immediately to improve security posture");
    }
    
    if (this.statistics.activeThreats > 10) {
      recommendations.push("Review and resolve the high number of active threats");
    }
    
    // Update security score
    this.securityScore = {
      overall,
      components: {
        threatMitigation,
        configurationSecurity,
        userSecurity,
        dataProtection,
        monitoring
      },
      recommendations,
      lastUpdated: Date.now()
    };
    
    // Notify listeners
    this.notifySecurityScoreUpdated();
  }
  
  /**
   * Get current threat statistics
   */
  public getStatistics(): ThreatStatistics {
    // Ensure we have the latest data
    this.updateStatistics();
    return this.statistics;
  }
  
  /**
   * Get current security score
   */
  public getSecurityScore(): SecurityScore {
    // Ensure we have the latest score
    this.updateSecurityScore();
    return this.securityScore;
  }
  
  /**
   * Get recommended actions for a specific threat
   */
  public getRecommendedActions(threat: DetectedThreat): ResponseAction[] {
    return this.responseActions.filter(action => 
      action.threatTypes.includes(threat.threatType) && 
      this.compareSeverity(threat.severity, action.minSeverity) >= 0
    );
  }
  
  /**
   * Execute a specific response action on a threat
   */
  public async executeAction(actionId: string, threatId: string): Promise<boolean> {
    const action = this.responseActions.find(a => a.id === actionId);
    if (!action) {
      return false;
    }
    
    const threat = threatDetectionService.getDetectedThreats().find(t => t.id === threatId);
    if (!threat) {
      return false;
    }
    
    try {
      await action.action(threat);
      
      // Add to the list of actions taken for this threat
      threat.actionTaken = threat.actionTaken || [];
      threat.actionTaken.push(`${action.name} (Manual)`);
      
      return true;
    } catch (error) {
      console.error(`[ThreatMonitoring] Error executing response action ${actionId}:`, error);
      return false;
    }
  }
  
  /**
   * Subscribe to statistics updates
   */
  public onStatisticsUpdated(callback: (stats: ThreatStatistics) => void): () => void {
    this.statisticsUpdatedListeners.push(callback);
    return () => {
      this.statisticsUpdatedListeners = this.statisticsUpdatedListeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Subscribe to security score updates
   */
  public onSecurityScoreUpdated(callback: (score: SecurityScore) => void): () => void {
    this.securityScoreUpdatedListeners.push(callback);
    return () => {
      this.securityScoreUpdatedListeners = this.securityScoreUpdatedListeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all statistics update listeners
   */
  private notifyStatisticsUpdated(): void {
    for (const listener of this.statisticsUpdatedListeners) {
      try {
        listener(this.statistics);
      } catch (error) {
        console.error('[ThreatMonitoring] Error in statistics update listener:', error);
      }
    }
  }
  
  /**
   * Notify all security score update listeners
   */
  private notifySecurityScoreUpdated(): void {
    for (const listener of this.securityScoreUpdatedListeners) {
      try {
        listener(this.securityScore);
      } catch (error) {
        console.error('[ThreatMonitoring] Error in security score update listener:', error);
      }
    }
  }
  
  /**
   * Compare two severity levels
   * Returns:
   * - positive number if a is more severe than b
   * - negative number if a is less severe than b
   * - 0 if they are the same severity
   */
  private compareSeverity(a: ThreatSeverity, b: ThreatSeverity): number {
    const severityMap: Record<ThreatSeverity, number> = {
      [ThreatSeverity.CRITICAL]: 4,
      [ThreatSeverity.HIGH]: 3,
      [ThreatSeverity.MEDIUM]: 2,
      [ThreatSeverity.LOW]: 1
    };
    
    return severityMap[a] - severityMap[b];
  }
}

export const threatMonitoringService = new ThreatMonitoringService();