/**
 * Threat Detection Service
 * 
 * Provides threat detection and protection capabilities:
 * - Real-time request analysis
 * - Rule-based threat detection
 * - IP blocking and rate limiting
 * - Memory and database-based persistence
 */

import { threatDbService, type ThreatType, type ThreatSeverity, type BlockAction, type DetectedThreat } from './ThreatDatabaseService';
import { nanoid } from 'nanoid';
import LRUCache from './SecurityCache';
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';

// Types for HTTP request data
export interface RequestData {
  ip: string;
  path: string;
  method: string;
  headers: Record<string, string | string[]>;
  query: Record<string, string | string[]>;
  body: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
}

// Detection rule interface
export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  pattern?: RegExp;
  threshold?: number;
  timeWindow?: number;  // in milliseconds
  autoBlock: boolean;
  autoNotify: boolean;
  enabled: boolean;
}

// Threshold tracker for rate limit rules
interface ThresholdTracker {
  count: number;
  firstSeen: number;
  lastSeen: number;
}

// Base settings for detection service
interface DetectionServiceSettings {
  enabled: boolean;
  mlDetectionEnabled: boolean;
  cacheTTL: number;  // Cache TTL in milliseconds
  maxCacheSize: number;  // Max number of items in LRU cache
  rateLimitWindowMs: number;  // Rate limit window in milliseconds
  rateLimitMaxRequests: number;  // Max requests per window
}

/**
 * Threat Detection Service
 * - Uses in-memory cache for performance-critical operations
 * - Persists threats and configuration to database
 * - Provides real-time threat detection for requests
 */
export class ThreatDetectionService {
  private settings: DetectionServiceSettings = {
    enabled: true,
    mlDetectionEnabled: false,
    cacheTTL: 5 * 60 * 1000,  // 5 minutes
    maxCacheSize: 10000,
    rateLimitWindowMs: 60000,  // 1 minute
    rateLimitMaxRequests: 100
  };
  
  // Memory caches for performance
  private activeThreats = new LRUCache<string, DetectedThreat>(1000, 30 * 60 * 1000);  // 30 minutes
  private recentThreats = new LRUCache<string, DetectedThreat>(5000, 24 * 60 * 60 * 1000);  // 24 hours
  private blockedIps = new LRUCache<string, { reason: string, expiresAt?: Date }>(1000, 24 * 60 * 60 * 1000);  // 24 hours
  
  // Rules cache
  private activeRules: DetectionRule[] = [];
  
  // Threshold trackers for rate limit rules (IP + path + userId based)
  private thresholdTrackers = new Map<string, ThresholdTracker>();
  
  // Rate limiter using token bucket algorithm
  private rateLimiter: TokenBucketRateLimiter;

  constructor() {
    // Initialize rate limiter
    this.rateLimiter = new TokenBucketRateLimiter({
      tokensPerInterval: this.settings.rateLimitMaxRequests,
      interval: this.settings.rateLimitWindowMs,
      burstCapacity: this.settings.rateLimitMaxRequests * 2
    });
    
    // Load configuration and rules from database
    this.initialize();
    
    // Set up periodic cache refresh and maintenance
    setInterval(() => this.performMaintenance(), this.settings.cacheTTL / 2);
    
    console.log('Threat Detection Service initialized');
  }
  
  /**
   * Initialize the service by loading data from database
   */
  private async initialize(): Promise<void> {
    try {
      // Load rules
      await this.loadRulesFromDatabase();
      
      // Load blocked IPs to cache
      await this.loadBlockedIpsToCache();
      
      // Load recent active threats
      await this.loadRecentThreatsToCache();
      
      console.log(`Threat Detection Service initialized with ${this.activeRules.length} rules`);
    } catch (error) {
      console.error('Error initializing threat detection service:', error);
    }
  }
  
  /**
   * Load rules from database
   */
  private async loadRulesFromDatabase(): Promise<void> {
    try {
      // Load only enabled rules
      const dbRules = await threatDbService.getRules(true);
      
      this.activeRules = dbRules.map(rule => {
        // Convert stored pattern string back to RegExp if present
        let pattern: RegExp | undefined = undefined;
        if (rule.pattern) {
          // Extract pattern between /pattern/flags format
          const patternMatch = /\/(.*)\/([gimuy]*)/.exec(rule.pattern);
          if (patternMatch) {
            try {
              pattern = new RegExp(patternMatch[1], patternMatch[2]);
            } catch (e) {
              console.error(`Failed to parse RegExp pattern: ${rule.pattern}`, e);
            }
          }
        }
        
        return {
          id: rule.ruleId,
          name: rule.name,
          description: rule.description,
          threatType: rule.threatType as ThreatType,
          severity: rule.severity as ThreatSeverity,
          pattern,
          threshold: rule.threshold || undefined,
          timeWindow: rule.timeWindow || undefined,
          autoBlock: rule.autoBlock || false,
          autoNotify: rule.autoNotify || false,
          enabled: rule.enabled
        };
      });
      
      console.log(`Loaded ${this.activeRules.length} detection rules from database`);
    } catch (error) {
      console.error('Failed to load rules from database:', error);
      this.registerDefaultRules();
    }
  }
  
  /**
   * Load blocked IPs from database to cache
   */
  private async loadBlockedIpsToCache(): Promise<void> {
    try {
      const blockedIps = await threatDbService.getBlockedIps(true);
      
      for (const blockedIp of blockedIps) {
        this.blockedIps.set(blockedIp.ip, {
          reason: blockedIp.reason || 'No reason provided',
          expiresAt: blockedIp.expiresAt || undefined
        });
      }
      
      console.log(`Loaded ${blockedIps.length} blocked IPs to cache`);
    } catch (error) {
      console.error('Failed to load blocked IPs from database:', error);
    }
  }
  
  /**
   * Load recent threats from database to cache
   */
  private async loadRecentThreatsToCache(): Promise<void> {
    try {
      // Get threats from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentThreats = await threatDbService.getThreats({
        fromDate: oneHourAgo,
        limit: 1000
      });
      
      for (const threat of recentThreats) {
        const detectedThreat: DetectedThreat = {
          ...threat,
          evidence: threat.evidence as Record<string, any>,
          actionTaken: threat.actionTaken as string[]
        };
        
        // Active threats are unresolved and from the last hour
        if (!threat.resolved) {
          this.activeThreats.set(threat.threatId, detectedThreat);
        }
        
        // All threats go to recent cache
        this.recentThreats.set(threat.threatId, detectedThreat);
      }
      
      console.log(`Loaded ${recentThreats.length} recent threats, ${this.activeThreats.size()} active`);
    } catch (error) {
      console.error('Failed to load recent threats from database:', error);
    }
  }
  
  /**
   * Register default rules if database loading fails
   */
  private registerDefaultRules(): void {
    this.activeRules = [
      {
        id: 'rule_sql_injection',
        name: 'SQL Injection Detection',
        description: 'Detects SQL injection attempts in query parameters and body',
        threatType: 'sql_injection',
        severity: 'high',
        pattern: /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: 'rule_xss',
        name: 'Cross-Site Scripting (XSS) Detection',
        description: 'Detects XSS attempts in query parameters and body',
        threatType: 'xss',
        severity: 'high',
        pattern: /<script[^>]*>.*?<\/script>/i,
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: 'rule_path_traversal',
        name: 'Path Traversal Detection',
        description: 'Detects path traversal attempts in URL',
        threatType: 'path_traversal',
        severity: 'high',
        pattern: /\.\.\//i,
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: 'rule_brute_force',
        name: 'Authentication Brute Force',
        description: 'Detects brute force login attempts',
        threatType: 'brute_force',
        severity: 'medium',
        threshold: 5,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: 'rule_rate_limit',
        name: 'API Rate Limiting',
        description: 'Limits API request rate per IP address',
        threatType: 'rate_limit',
        severity: 'low',
        threshold: 100,
        timeWindow: 60 * 1000, // 1 minute
        autoBlock: false,
        autoNotify: false,
        enabled: true
      }
    ];
    
    console.log(`Registered ${this.activeRules.length} default rules`);
  }
  
  /**
   * Periodic maintenance tasks
   */
  private async performMaintenance(): Promise<void> {
    try {
      // Clean up expired IP blocks
      const cleanedUpCount = await threatDbService.cleanupExpiredBlocks();
      if (cleanedUpCount > 0) {
        console.log(`Cleaned up ${cleanedUpCount} expired IP blocks`);
        
        // Reload blocks to cache
        await this.loadBlockedIpsToCache();
      }
      
      // Clean up stale threshold trackers
      const now = Date.now();
      let staleCount = 0;
      
      for (const [key, tracker] of this.thresholdTrackers.entries()) {
        const maxTimeWindow = Math.max(...this.activeRules
          .filter(rule => rule.timeWindow !== undefined)
          .map(rule => rule.timeWindow || 0)
        );
        
        if (now - tracker.lastSeen > maxTimeWindow) {
          this.thresholdTrackers.delete(key);
          staleCount++;
        }
      }
      
      if (staleCount > 0) {
        console.log(`Cleaned up ${staleCount} stale threshold trackers`);
      }
      
      // Reload rules from database periodically
      await this.loadRulesFromDatabase();
      
    } catch (error) {
      console.error('Error during maintenance:', error);
    }
  }
  
  /**
   * Check if an IP is blocked
   */
  isIpBlocked(ip: string): boolean {
    // Check cache first for performance
    const cachedBlock = this.blockedIps.get(ip);
    
    if (cachedBlock) {
      // Check if block has expired
      if (cachedBlock.expiresAt && cachedBlock.expiresAt < new Date()) {
        this.blockedIps.delete(ip);
        return false;
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Block an IP address
   */
  async blockIp(ip: string, reason: string, duration?: number, blockedBy?: string): Promise<void> {
    try {
      let expiresAt: Date | undefined = undefined;
      
      if (duration) {
        expiresAt = new Date(Date.now() + duration);
      }
      
      // Add to database
      await threatDbService.addBlockedIp(ip, reason, blockedBy, expiresAt);
      
      // Add to cache
      this.blockedIps.set(ip, {
        reason,
        expiresAt
      });
      
      console.log(`Blocked IP ${ip} for reason: ${reason}`);
    } catch (error) {
      console.error(`Failed to block IP ${ip}:`, error);
    }
  }
  
  /**
   * Unblock an IP address
   */
  async unblockIp(ip: string): Promise<boolean> {
    try {
      // Remove from database
      const success = await threatDbService.unblockIp(ip);
      
      // Remove from cache
      this.blockedIps.delete(ip);
      
      console.log(`Unblocked IP ${ip}`);
      return success;
    } catch (error) {
      console.error(`Failed to unblock IP ${ip}:`, error);
      return false;
    }
  }
  
  /**
   * Apply rate limiting to a request
   */
  applyRateLimit(ip: string, path: string): boolean {
    // Get rate limit rule
    const rateLimitRule = this.activeRules.find(rule => 
      rule.enabled && rule.threatType === 'rate_limit');
    
    if (!rateLimitRule || !rateLimitRule.threshold) {
      // No rate limit rule configured, allow request
      return true;
    }
    
    // Use token bucket algorithm for rate limiting
    const key = `${ip}:${path}`;
    return this.rateLimiter.consume(key);
  }
  
  /**
   * Process a request for threats
   * Returns a threat object if detected, or null if no threats found
   */
  async processRequest(requestData: RequestData): Promise<DetectedThreat | null> {
    if (!this.settings.enabled) {
      return null;
    }
    
    // Step 1: Check if IP is blocked
    if (this.isIpBlocked(requestData.ip)) {
      // IP is blocked, report as threat
      const threat: DetectedThreat = {
        threatId: `threat_${nanoid(10)}`,
        timestamp: Date.now(),
        threatType: 'unauthorized_access',
        severity: 'medium',
        description: 'Request from blocked IP address',
        sourceIp: requestData.ip,
        userId: requestData.userId,
        requestPath: requestData.path,
        requestMethod: requestData.method,
        evidence: { 
          reason: this.blockedIps.get(requestData.ip)?.reason || 'Unknown reason'
        },
        ruleId: 'blocked_ip',
        actionTaken: ['blocked_request'],
        resolved: false
      };
      
      // Store threat in database
      await threatDbService.saveThreat(threat);
      
      // Update caches
      this.activeThreats.set(threat.threatId, threat);
      this.recentThreats.set(threat.threatId, threat);
      
      return threat;
    }
    
    // Step 2: Apply rate limiting
    if (!this.applyRateLimit(requestData.ip, requestData.path)) {
      // Rate limit exceeded, report as threat
      const threat: DetectedThreat = {
        threatId: `threat_${nanoid(10)}`,
        timestamp: Date.now(),
        threatType: 'rate_limit',
        severity: 'low',
        description: 'Rate limit exceeded',
        sourceIp: requestData.ip,
        userId: requestData.userId,
        requestPath: requestData.path,
        requestMethod: requestData.method,
        evidence: { 
          path: requestData.path,
          method: requestData.method,
          headers: this.sanitizeHeaders(requestData.headers)
        },
        ruleId: 'rate_limit',
        actionTaken: ['blocked_request'],
        resolved: false
      };
      
      // Store threat in database
      await threatDbService.saveThreat(threat);
      
      // Update caches
      this.activeThreats.set(threat.threatId, threat);
      this.recentThreats.set(threat.threatId, threat);
      
      return threat;
    }
    
    // Step 3: Check pattern-based rules
    for (const rule of this.activeRules) {
      if (!rule.enabled || !rule.pattern) {
        continue;
      }
      
      // Test the pattern against relevant parts of the request
      const requestString = this.buildRequestStringForPattern(requestData);
      
      if (rule.pattern.test(requestString)) {
        // Pattern matched, report as threat
        const threat: DetectedThreat = {
          threatId: `threat_${nanoid(10)}`,
          timestamp: Date.now(),
          threatType: rule.threatType,
          severity: rule.severity,
          description: `Detected ${rule.name}`,
          sourceIp: requestData.ip,
          userId: requestData.userId,
          requestPath: requestData.path,
          requestMethod: requestData.method,
          evidence: { 
            pattern: rule.pattern.toString(),
            matchedOn: requestString.substring(0, 1000), // Limit size
            headers: this.sanitizeHeaders(requestData.headers)
          },
          ruleId: rule.id,
          actionTaken: [],
          resolved: false
        };
        
        // Take action based on rule configuration
        if (rule.autoBlock) {
          // Block IP for a day
          await this.blockIp(
            requestData.ip, 
            `Automatic block due to ${rule.threatType} detection`, 
            24 * 60 * 60 * 1000
          );
          threat.actionTaken!.push('blocked_ip');
        }
        
        // Always block the current request for pattern-based threats
        threat.actionTaken!.push('blocked_request');
        
        // Store threat in database
        await threatDbService.saveThreat(threat);
        
        // Update caches
        this.activeThreats.set(threat.threatId, threat);
        this.recentThreats.set(threat.threatId, threat);
        
        return threat;
      }
    }
    
    // Step 4: Check threshold-based rules
    for (const rule of this.activeRules) {
      if (!rule.enabled || !rule.threshold || !rule.timeWindow) {
        continue;
      }
      
      // Key for tracking thresholds
      // For authentication, use IP + userId (if available)
      // For other cases, use IP + path
      const key = rule.threatType === 'brute_force' && requestData.path.includes('/login')
        ? `${rule.id}:${requestData.ip}:${requestData.userId || 'anonymous'}`
        : `${rule.id}:${requestData.ip}:${requestData.path}`;
      
      // Update threshold tracker
      let tracker = this.thresholdTrackers.get(key);
      const now = Date.now();
      
      if (!tracker) {
        tracker = {
          count: 1,
          firstSeen: now,
          lastSeen: now
        };
        this.thresholdTrackers.set(key, tracker);
      } else {
        // Check if we're still within the time window
        if (now - tracker.firstSeen > rule.timeWindow) {
          // Reset tracker
          tracker.count = 1;
          tracker.firstSeen = now;
          tracker.lastSeen = now;
        } else {
          // Increment count
          tracker.count++;
          tracker.lastSeen = now;
        }
      }
      
      // Check if threshold is exceeded
      if (tracker.count >= rule.threshold) {
        // Threshold exceeded, report as threat
        const threat: DetectedThreat = {
          threatId: `threat_${nanoid(10)}`,
          timestamp: Date.now(),
          threatType: rule.threatType,
          severity: rule.severity,
          description: `Detected ${rule.name}`,
          sourceIp: requestData.ip,
          userId: requestData.userId,
          requestPath: requestData.path,
          requestMethod: requestData.method,
          evidence: { 
            threshold: rule.threshold,
            timeWindow: rule.timeWindow,
            count: tracker.count,
            timeFrame: `${new Date(tracker.firstSeen).toISOString()} - ${new Date(tracker.lastSeen).toISOString()}`,
            headers: this.sanitizeHeaders(requestData.headers)
          },
          ruleId: rule.id,
          actionTaken: [],
          resolved: false
        };
        
        // Take action based on rule configuration
        if (rule.autoBlock) {
          // Block IP for 1 hour for threshold-based issues
          await this.blockIp(
            requestData.ip, 
            `Automatic block due to ${rule.threatType} detection`, 
            60 * 60 * 1000
          );
          threat.actionTaken!.push('blocked_ip');
        }
        
        // For brute force, always block request
        if (rule.threatType === 'brute_force') {
          threat.actionTaken!.push('blocked_request');
        }
        
        // Reset tracker
        this.thresholdTrackers.delete(key);
        
        // Store threat in database
        await threatDbService.saveThreat(threat);
        
        // Update caches
        this.activeThreats.set(threat.threatId, threat);
        this.recentThreats.set(threat.threatId, threat);
        
        return threat;
      }
    }
    
    // No threats detected
    return null;
  }
  
  /**
   * Build a string representation of the request for pattern matching
   */
  private buildRequestStringForPattern(requestData: RequestData): string {
    const parts: string[] = [];
    
    // Include URL
    parts.push(requestData.path);
    
    // Include query parameters
    if (requestData.query && Object.keys(requestData.query).length > 0) {
      for (const [key, value] of Object.entries(requestData.query)) {
        parts.push(`${key}=${value}`);
      }
    }
    
    // Include body data for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(requestData.method) && requestData.body) {
      if (typeof requestData.body === 'string') {
        parts.push(requestData.body);
      } else if (typeof requestData.body === 'object') {
        try {
          parts.push(JSON.stringify(requestData.body));
        } catch (e) {
          // Ignore stringify errors
        }
      }
    }
    
    return parts.join('|');
  }
  
  /**
   * Sanitize headers for safe storage (remove sensitive info)
   */
  private sanitizeHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
    const sanitized: Record<string, string | string[]> = {};
    
    // Create a list of headers to include
    // Omit authorization, cookies, etc.
    const allowedHeaders = [
      'user-agent',
      'content-type',
      'accept',
      'origin',
      'referer',
      'host',
      'x-forwarded-for',
      'x-real-ip'
    ];
    
    for (const header of allowedHeaders) {
      if (headers[header]) {
        sanitized[header] = headers[header];
      }
    }
    
    return sanitized;
  }
  
  /**
   * Get all active threats
   */
  getActiveThreats(): DetectedThreat[] {
    return this.activeThreats.values();
  }
  
  /**
   * Get recent threats (from cache and database)
   */
  async getRecentThreats(limit: number = 100): Promise<DetectedThreat[]> {
    // Start with cache for best performance
    const cachedThreats = this.recentThreats.values().slice(0, limit);
    
    // If we have enough in cache, return those
    if (cachedThreats.length >= limit) {
      return cachedThreats.slice(0, limit);
    }
    
    // Otherwise, fetch from database
    const dbThreats = await threatDbService.getThreats({
      limit,
      includeArchived: false
    });
    
    return dbThreats.map(threat => ({
      ...threat,
      evidence: threat.evidence as Record<string, any>,
      actionTaken: threat.actionTaken as string[]
    }));
  }
  
  /**
   * Get active detection rules
   */
  getActiveRules(): DetectionRule[] {
    return this.activeRules;
  }
  
  /**
   * Add or update a detection rule
   */
  async addOrUpdateRule(rule: Omit<DetectionRule, 'id'>): Promise<DetectionRule> {
    try {
      // Convert RegExp to string for storage
      const patternStr = rule.pattern ? rule.pattern.toString() : null;
      
      // Prepare database rule object
      const dbRule = {
        ruleId: rule.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: rule.name,
        description: rule.description,
        threatType: rule.threatType,
        severity: rule.severity,
        pattern: patternStr,
        threshold: rule.threshold,
        timeWindow: rule.timeWindow,
        autoBlock: rule.autoBlock,
        autoNotify: rule.autoNotify,
        enabled: rule.enabled
      };
      
      // Check if rule already exists
      const existingRule = await threatDbService.getRuleById(dbRule.ruleId);
      
      let savedRule;
      if (existingRule) {
        // Update existing rule
        savedRule = await threatDbService.updateRule(dbRule.ruleId, dbRule);
      } else {
        // Create new rule
        savedRule = await threatDbService.saveRule(dbRule);
      }
      
      if (!savedRule) {
        throw new Error(`Failed to save rule: ${rule.name}`);
      }
      
      // Reload rules
      await this.loadRulesFromDatabase();
      
      // Convert back to DetectionRule type
      return {
        id: savedRule.ruleId,
        name: savedRule.name,
        description: savedRule.description,
        threatType: savedRule.threatType as ThreatType,
        severity: savedRule.severity as ThreatSeverity,
        pattern: rule.pattern,
        threshold: savedRule.threshold || undefined,
        timeWindow: savedRule.timeWindow || undefined,
        autoBlock: savedRule.autoBlock,
        autoNotify: savedRule.autoNotify,
        enabled: savedRule.enabled
      };
    } catch (error) {
      console.error('Error adding/updating rule:', error);
      throw error;
    }
  }
  
  /**
   * Enable or disable a rule
   */
  async setRuleEnabled(ruleId: string, enabled: boolean): Promise<boolean> {
    try {
      const updatedRule = await threatDbService.setRuleEnabled(ruleId, enabled);
      
      if (updatedRule) {
        // Reload rules
        await this.loadRulesFromDatabase();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error ${enabled ? 'enabling' : 'disabling'} rule ${ruleId}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const success = await threatDbService.deleteRule(ruleId);
      
      if (success) {
        // Reload rules
        await this.loadRulesFromDatabase();
      }
      
      return success;
    } catch (error) {
      console.error(`Error deleting rule ${ruleId}:`, error);
      return false;
    }
  }
  
  /**
   * Resolve a threat
   */
  async resolveThreat(threatId: string, resolvedBy: string): Promise<boolean> {
    try {
      const updatedThreat = await threatDbService.resolveThreat(threatId, resolvedBy);
      
      if (updatedThreat) {
        // Update caches
        this.activeThreats.delete(threatId);
        
        // Update recent threats cache
        const existingThreat = this.recentThreats.get(threatId);
        if (existingThreat) {
          existingThreat.resolved = true;
          existingThreat.resolvedBy = resolvedBy;
          existingThreat.resolvedAt = Date.now();
          this.recentThreats.set(threatId, existingThreat);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error resolving threat ${threatId}:`, error);
      return false;
    }
  }
  
  /**
   * Get threat statistics
   */
  async getStatistics(): Promise<Record<string, any>> {
    try {
      // Get database statistics
      const dbStats = await threatDbService.getThreatStatistics();
      
      // Add memory statistics
      return {
        ...dbStats,
        current: {
          activeThreats: this.activeThreats.size(),
          recentThreats: this.recentThreats.size(),
          blockedIps: this.blockedIps.size(),
          thresholdTrackers: this.thresholdTrackers.size,
          activeRules: this.activeRules.length
        }
      };
    } catch (error) {
      console.error('Error getting threat statistics:', error);
      return {
        current: {
          activeThreats: this.activeThreats.size(),
          recentThreats: this.recentThreats.size(),
          blockedIps: this.blockedIps.size(),
          thresholdTrackers: this.thresholdTrackers.size,
          activeRules: this.activeRules.length
        }
      };
    }
  }
  
  /**
   * Enable or disable the threat detection service
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    console.log(`Threat Detection Service ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if the service is enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }
  
  /**
   * Enable or disable ML-based detection
   */
  setMlDetectionEnabled(enabled: boolean): void {
    this.settings.mlDetectionEnabled = enabled;
    console.log(`ML-based Threat Detection ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get service settings
   */
  getSettings(): DetectionServiceSettings {
    return { ...this.settings };
  }
  
  /**
   * Update service settings
   */
  updateSettings(settings: Partial<DetectionServiceSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
    
    // Update rate limiter if settings changed
    if (settings.rateLimitWindowMs || settings.rateLimitMaxRequests) {
      this.rateLimiter = new TokenBucketRateLimiter({
        tokensPerInterval: this.settings.rateLimitMaxRequests,
        interval: this.settings.rateLimitWindowMs,
        burstCapacity: this.settings.rateLimitMaxRequests * 2
      });
    }
    
    console.log('Threat Detection Service settings updated');
  }
}

// Create singleton instance
export const threatDetectionService = new ThreatDetectionService();