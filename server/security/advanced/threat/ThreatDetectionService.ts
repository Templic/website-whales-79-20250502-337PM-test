/**
 * Threat Detection Service
 * 
 * Detects security threats by analyzing incoming requests and system events.
 * Provides detection for various threat types including SQL injection, XSS, CSRF, 
 * brute force attempts, rate limiting violations, and suspicious activity patterns.
 */

import { nanoid } from 'nanoid';

// Threat types
export enum ThreatType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  CSRF = 'CSRF',
  BRUTE_FORCE = 'BRUTE_FORCE',
  DDOS = 'DDOS',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  API_ABUSE = 'API_ABUSE',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// Threat severity levels
export enum ThreatSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Detected threat interface
export interface DetectedThreat {
  id: string;
  timestamp: number;
  threatType: ThreatType;
  severity: ThreatSeverity;
  description: string;
  sourceIp: string;
  userId?: string | number;
  requestPath?: string;
  requestMethod?: string;
  evidence?: any;
  ruleId: string;
  actionTaken?: string[];
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

// Threat detection rule interface
export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  enabled: boolean;
  pattern?: RegExp;
  threshold?: number;
  timeWindow?: number;
  autoBlock?: boolean;
  autoNotify?: boolean;
  checkFn?: (req: any) => boolean;
}

class ThreatDetectionService {
  private enabled: boolean = true;
  private mlDetectionEnabled: boolean = false;
  private detectedThreats: DetectedThreat[] = [];
  private activeRules: DetectionRule[] = [];
  private blockedIps: Set<string> = new Set();
  
  constructor() {
    // Initialize with some sample rules
    this.registerDefaultRules();
    
    // Initialize with some sample threats for testing
    this.initializeSampleThreats();
    
    console.log('Threat Detection Service initialized');
  }
  
  /**
   * Register default detection rules
   */
  private registerDefaultRules() {
    // SQL Injection rule
    this.activeRules.push({
      id: 'sql-injection-1',
      name: 'SQL Injection Detection',
      description: 'Detects common SQL injection patterns in request parameters',
      threatType: ThreatType.SQL_INJECTION,
      severity: ThreatSeverity.HIGH,
      enabled: true,
      pattern: /('|%27)(\s)*(O|%4F|o|%6F)(\s)*(R|%52|r|%72)/i,
      autoBlock: true,
      autoNotify: true
    });
    
    // XSS rule
    this.activeRules.push({
      id: 'xss-1',
      name: 'Cross-Site Scripting Detection',
      description: 'Detects common XSS patterns in request parameters',
      threatType: ThreatType.XSS,
      severity: ThreatSeverity.HIGH,
      enabled: true,
      pattern: /<script[^>]*>.*?<\/script>/i,
      autoBlock: true,
      autoNotify: true
    });
    
    // Path traversal rule
    this.activeRules.push({
      id: 'path-traversal-1',
      name: 'Path Traversal Detection',
      description: 'Detects path traversal attempts in request parameters',
      threatType: ThreatType.PATH_TRAVERSAL,
      severity: ThreatSeverity.MEDIUM,
      enabled: true,
      pattern: /(\.\.|%2e%2e)(\/|%2f)/i,
      autoBlock: false,
      autoNotify: true
    });
    
    // Brute force rule
    this.activeRules.push({
      id: 'brute-force-1',
      name: 'Brute Force Detection',
      description: 'Detects brute force login attempts',
      threatType: ThreatType.BRUTE_FORCE,
      severity: ThreatSeverity.MEDIUM,
      enabled: true,
      threshold: 5,
      timeWindow: 60000, // 1 minute
      autoBlock: false,
      autoNotify: true
    });
    
    // Rate limiting rule
    this.activeRules.push({
      id: 'api-abuse-1',
      name: 'API Rate Limiting',
      description: 'Detects API abuse through high request rates',
      threatType: ThreatType.API_ABUSE,
      severity: ThreatSeverity.LOW,
      enabled: true,
      threshold: 100,
      timeWindow: 60000, // 1 minute
      autoBlock: false,
      autoNotify: false
    });
  }
  
  /**
   * Initialize with sample threats for testing the UI
   */
  private initializeSampleThreats() {
    // Sample SQL injection threat
    this.detectedThreats.push({
      id: nanoid(),
      timestamp: Date.now() - 30000,
      threatType: ThreatType.SQL_INJECTION,
      severity: ThreatSeverity.HIGH,
      description: 'SQL Injection attempt detected in login form',
      sourceIp: '192.168.1.100',
      requestPath: '/api/login',
      requestMethod: 'POST',
      evidence: {
        payload: "username=admin'; DROP TABLE users; --"
      },
      ruleId: 'sql-injection-1',
      actionTaken: ['IP Temporarily Blocked']
    });
    
    // Sample XSS threat
    this.detectedThreats.push({
      id: nanoid(),
      timestamp: Date.now() - 120000,
      threatType: ThreatType.XSS,
      severity: ThreatSeverity.MEDIUM,
      description: 'XSS attempt detected in comment form',
      sourceIp: '192.168.1.101',
      requestPath: '/api/comments',
      requestMethod: 'POST',
      evidence: {
        payload: "<script>alert('XSS')</script>"
      },
      ruleId: 'xss-1'
    });
    
    // Sample brute force threat
    this.detectedThreats.push({
      id: nanoid(),
      timestamp: Date.now() - 300000,
      threatType: ThreatType.BRUTE_FORCE,
      severity: ThreatSeverity.MEDIUM,
      description: 'Multiple failed login attempts detected',
      sourceIp: '192.168.1.102',
      requestPath: '/api/login',
      requestMethod: 'POST',
      evidence: {
        attemptCount: 7,
        timespan: '45 seconds'
      },
      ruleId: 'brute-force-1',
      resolved: true,
      resolvedBy: 'system',
      resolvedAt: Date.now() - 240000
    });
    
    // Sample API abuse threat
    this.detectedThreats.push({
      id: nanoid(),
      timestamp: Date.now() - 600000,
      threatType: ThreatType.API_ABUSE,
      severity: ThreatSeverity.LOW,
      description: 'Excessive API requests detected',
      sourceIp: '192.168.1.103',
      requestPath: '/api/products',
      requestMethod: 'GET',
      evidence: {
        requestCount: 120,
        timespan: '58 seconds'
      },
      ruleId: 'api-abuse-1',
      resolved: true,
      resolvedBy: 'admin',
      resolvedAt: Date.now() - 540000
    });
  }
  
  /**
   * Enable or disable threat detection
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Threat detection ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Enable or disable ML-based anomaly detection
   */
  public setMlDetectionEnabled(enabled: boolean): void {
    this.mlDetectionEnabled = enabled;
    console.log(`ML-based anomaly detection ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get all detected threats with optional pagination
   */
  public getDetectedThreats(limit?: number, offset?: number): DetectedThreat[] {
    let threats = [...this.detectedThreats].sort((a, b) => b.timestamp - a.timestamp);
    
    if (offset !== undefined) {
      threats = threats.slice(offset);
    }
    
    if (limit !== undefined) {
      threats = threats.slice(0, limit);
    }
    
    return threats;
  }
  
  /**
   * Get active (unresolved) threats
   */
  public getActiveThreats(): DetectedThreat[] {
    return this.detectedThreats
      .filter(threat => !threat.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get all active detection rules
   */
  public getActiveRules(): DetectionRule[] {
    return [...this.activeRules];
  }
  
  /**
   * Update a detection rule
   */
  public updateRule(ruleId: string, updates: Partial<DetectionRule>): boolean {
    const ruleIndex = this.activeRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) {
      return false;
    }
    
    this.activeRules[ruleIndex] = {
      ...this.activeRules[ruleIndex],
      ...updates
    };
    
    console.log(`Rule ${ruleId} updated:`, updates);
    return true;
  }
  
  /**
   * Get list of blocked IPs
   */
  public getBlockedIps(): string[] {
    return Array.from(this.blockedIps);
  }
  
  /**
   * Block an IP address
   */
  public blockIp(ip: string): void {
    this.blockedIps.add(ip);
    console.log(`IP ${ip} blocked`);
  }
  
  /**
   * Unblock an IP address
   */
  public unblockIp(ip: string): void {
    this.blockedIps.delete(ip);
    console.log(`IP ${ip} unblocked`);
  }
  
  /**
   * Check if an IP is blocked
   */
  public isIpBlocked(ip: string): boolean {
    return this.blockedIps.has(ip);
  }
  
  /**
   * Resolve a threat
   */
  public resolveThreat(threatId: string, resolvedBy: string): boolean {
    const threatIndex = this.detectedThreats.findIndex(threat => threat.id === threatId);
    
    if (threatIndex === -1) {
      return false;
    }
    
    this.detectedThreats[threatIndex] = {
      ...this.detectedThreats[threatIndex],
      resolved: true,
      resolvedBy,
      resolvedAt: Date.now()
    };
    
    console.log(`Threat ${threatId} resolved by ${resolvedBy}`);
    return true;
  }
  
  /**
   * Process a request for threats (simplified mock implementation)
   */
  public processRequest(req: any): DetectedThreat | null {
    if (!this.enabled) {
      return null;
    }
    
    // In a real implementation, this would analyze the request and detect threats
    return null;
  }
}

export const threatDetectionService = new ThreatDetectionService();