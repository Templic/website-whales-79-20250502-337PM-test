/**
 * Threat Detection Service
 * 
 * Provides real-time detection of security threats:
 * - Pattern-based detection for common threats
 * - Behavioral analysis for anomalous patterns
 * - Rate-based detection for brute force attempts
 * - IP reputation checks
 */

import { threatDatabaseService, type ThreatType, type ThreatSeverity, type DetectedThreat } from './ThreatDatabaseService';
import { threatMonitoringService } from './ThreatMonitoringService';
import LRUCache from './SecurityCache';
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';
import { securityConfig } from '../config/SecurityConfig';
import { v4 as uuidv4 } from 'uuid';

// Specialized detection contexts
interface DetectionContext {
  ip: string;
  userId?: string;
  path: string;
  method: string;
  params: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  // Used by detection rules to store contextual data between middleware stages
  data: Record<string, any>;
}

// Detection rule runtime representation
interface DetectionRule {
  id: string;
  name: string;
  description: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  pattern?: RegExp;
  threshold?: number;
  timeWindow?: number; // in seconds
  autoBlock: boolean;
  autoNotify: boolean;
  enabled: boolean;
}

// Type for block actions
export type BlockAction = 'temp_block' | 'perm_block' | 'warning' | 'log_only';

// Request hit counter for rate-based rules
interface RequestCounter {
  count: number;
  firstRequest: number;
  lastRequest: number;
  paths: Set<string>;
}

// Default detection patterns
const SQL_INJECTION_PATTERNS = [
  "\\b(union|select|insert|delete|update|drop|alter)\\b.*(\\bfrom\\b|\\binto\\b|\\bwhere\\b)",
  "'\\s*(--|#|\\/\\*|;)",
  "(\\b|\\A)select(\\b|\\s.*\\b)(from|into|case|when|then|else)\\b",
  "(\\b|\\A)insert(\\b|\\s.*\\b)(into|values|select)\\b",
  "(\\b|\\A)update(\\b|\\s.*\\b)(set)\\b",
  "(\\b|\\A)delete(\\b|\\s.*\\b)(from)\\b",
];

const XSS_PATTERNS = [
  "<[^\\w<>]*(?:[^<>\"'\\s]*:)?[^\\w<>]*(?:script|alert|svg|iframe|x|on\\w+|action|data)",
  "\\b(javascript|data|vbscript):",
  "<script[^>]*>[\\s\\S]*?<\\/script>",
  "<\\s*img[^>]*\\s+src\\s*=\\s*['\\\"](?:javascript|data):[^'\\\"]*['\\\"]",
  "<\\s*object[^>]*>",
  "(alert|confirm|prompt)\\s*\\("
];

const PATH_TRAVERSAL_PATTERNS = [
  "\\.\\.(\/|\\\\)",
  "(%2e%2e|\\.\\.)(\\\\|\\/|%2f|%5c)",
  "etc\/passwd",
  "\\\/etc\\\/shadow",
  "\\\/proc\\\/self\\\/",
  "\\\/dev\\\/urandom"
];

// Detection service class
class ThreatDetectionService {
  private rules: DetectionRule[] = [];
  private ipHitCache: LRUCache<string, RequestCounter> = new LRUCache<string, RequestCounter>(10000, 3600 * 1000); // 1 hour TTL
  private rateLimiter: TokenBucketRateLimiter;
  
  constructor() {
    // Initialize rate limiter with default config
    this.rateLimiter = new TokenBucketRateLimiter({
      tokensPerInterval: 60,  // 60 requests per minute
      interval: 60 * 1000,    // 1 minute
      burstCapacity: 100      // Burst of 100 requests allowed
    });
    
    // Load default rules
    this.loadDefaultRules();
    
    // Load rules from database
    this.loadRulesFromDatabase();
  }
  
  /**
   * Initialize with default detection rules
   */
  private loadDefaultRules() {
    // Default rules to use before DB rules are loaded
    this.rules = [
      {
        id: "default-sql-injection",
        name: "SQL Injection Detection",
        description: "Detects common SQL injection attack patterns",
        threatType: "SQL_INJECTION",
        severity: "high",
        pattern: new RegExp(SQL_INJECTION_PATTERNS.join("|"), "i"),
        threshold: undefined,
        timeWindow: undefined,
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: "default-xss",
        name: "Cross-Site Scripting (XSS) Detection",
        description: "Detects common XSS attack patterns",
        threatType: "XSS",
        severity: "high",
        pattern: new RegExp(XSS_PATTERNS.join("|"), "i"),
        threshold: undefined,
        timeWindow: undefined,
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: "default-path-traversal",
        name: "Path Traversal Detection",
        description: "Detects common path traversal attack patterns",
        threatType: "PATH_TRAVERSAL",
        severity: "high",
        pattern: new RegExp(PATH_TRAVERSAL_PATTERNS.join("|"), "i"),
        threshold: undefined,
        timeWindow: undefined,
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: "default-brute-force",
        name: "Authentication Brute Force Detection",
        description: "Detects rapid authentication attempts",
        threatType: "BRUTE_FORCE",
        severity: "medium",
        pattern: undefined,
        threshold: 10,
        timeWindow: 60, // 1 minute
        autoBlock: true,
        autoNotify: true,
        enabled: true
      },
      {
        id: "default-rate-limit",
        name: "Rate Limiting",
        description: "Limits request rates for individual IPs",
        threatType: "RATE_LIMIT_ABUSE",
        severity: "low",
        pattern: undefined,
        threshold: 100,
        timeWindow: 60, // 1 minute
        autoBlock: false,
        autoNotify: false,
        enabled: true
      }
    ];
    
    console.log(`Loaded ${this.rules.length} default detection rules`);
  }
  
  /**
   * Load rules from database
   */
  private async loadRulesFromDatabase() {
    try {
      const dbRules = await threatDatabaseService.getRules({ enabled: true });
      console.log(`Loaded ${dbRules.length} detection rules from database`);
      
      if (dbRules.length > 0) {
        // Replace default rules with database rules
        this.rules = dbRules.map(rule => ({
          id: rule.id.toString(),
          name: rule.name,
          description: rule.description,
          threatType: rule.threatType as ThreatType,
          severity: rule.severity as ThreatSeverity,
          pattern: rule.pattern ? new RegExp(rule.pattern, 'i') : undefined,
          threshold: rule.threshold || undefined,
          timeWindow: rule.timeWindow || undefined,
          autoBlock: rule.autoBlock,
          autoNotify: rule.autoNotify,
          enabled: rule.enabled
        }));
      } else {
        // If no rules in database, import defaults
        await threatDatabaseService.importDefaultRules();
      }
    } catch (error) {
      console.error('Error loading rules from database:', error);
    }
  }
  
  /**
   * Process an incoming request to check for threats
   * 
   * @param context Detection context
   * @returns Object with whether request should be blocked and details
   */
  async detectThreats(context: DetectionContext): Promise<{
    blocked: boolean;
    action?: BlockAction;
    threat?: DetectedThreat;
  }> {
    // Skip if security is disabled
    if (!securityConfig.getSecurityFeatures().threatDetection) {
      return { blocked: false };
    }
    
    // Check IP block list first (most efficient check)
    const ipBlocked = await threatDatabaseService.isIpBlocked(context.ip);
    if (ipBlocked) {
      return { 
        blocked: true,
        action: 'perm_block',
        threat: {
          threatId: uuidv4(),
          description: "Request from blocked IP address",
          threatType: "SUSPICIOUS_ACTIVITY",
          severity: "medium",
          sourceIp: context.ip,
          userId: context.userId || null,
          resolved: false,
          isArchived: false,
          evidence: {
            requestPath: context.path,
            requestMethod: context.method,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
    
    // Always record the request for metrics
    threatMonitoringService.recordApiRequest(false);
    
    // Start with pattern-based detection (most specific)
    const patternThreat = this.detectPatternBasedThreats(context);
    if (patternThreat) {
      return this.processThreat(patternThreat, context);
    }
    
    // Then check for rate-based attacks
    const rateThreat = await this.detectRateBasedThreats(context);
    if (rateThreat) {
      return this.processThreat(rateThreat, context);
    }
    
    // Finally check for behavioral anomalies
    const behaviorThreat = await this.detectBehavioralAnomalies(context);
    if (behaviorThreat) {
      return this.processThreat(behaviorThreat, context);
    }
    
    // No threats detected
    return { blocked: false };
  }
  
  /**
   * Detect pattern-based threats (SQL injection, XSS, etc.)
   */
  private detectPatternBasedThreats(context: DetectionContext): DetectedThreat | null {
    // Only check pattern-based rules
    const patternRules = this.rules.filter(rule => 
      rule.enabled && rule.pattern !== undefined
    );
    
    // No rules to check
    if (patternRules.length === 0) {
      return null;
    }
    
    // Prepare strings to check (URL params, body content, headers)
    const checkStrings: string[] = [];
    
    // Add query parameters
    if (context.params) {
      const queryValues = Object.values(context.params).filter(
        v => typeof v === 'string'
      ) as string[];
      checkStrings.push(...queryValues);
    }
    
    // Add body content (if it's an object, serialize as JSON)
    if (context.body) {
      if (typeof context.body === 'string') {
        checkStrings.push(context.body);
      } else if (typeof context.body === 'object') {
        // Add individual fields from body
        Object.values(context.body).forEach(value => {
          if (typeof value === 'string') {
            checkStrings.push(value);
          }
        });
        
        // Also add serialized version for deep checks
        try {
          checkStrings.push(JSON.stringify(context.body));
        } catch (e) {
          // Ignore stringify errors
        }
      }
    }
    
    // Add specific headers that might contain attack vectors
    const sensitiveHeaders = [
      'user-agent', 'referer', 'cookie', 'origin', 'x-forwarded-for'
    ];
    
    for (const header of sensitiveHeaders) {
      const value = context.headers[header];
      if (value) {
        checkStrings.push(value);
      }
    }
    
    // Also check URL path
    checkStrings.push(context.path);
    
    // Check each rule against all strings
    for (const rule of patternRules) {
      for (const str of checkStrings) {
        if (rule.pattern && rule.pattern.test(str)) {
          return {
            threatId: uuidv4(),
            description: `${rule.name} detected in request`,
            threatType: rule.threatType,
            severity: rule.severity,
            sourceIp: context.ip,
            userId: context.userId || null,
            resolved: false,
            isArchived: false,
            evidence: {
              rule: rule.id,
              matchedPattern: rule.pattern.toString(),
              matchedValue: str,
              matchedField: checkStrings.indexOf(str) < Object.keys(context.params || {}).length ? 'params' : 
                            (checkStrings.indexOf(str) === checkStrings.length - 1 ? 'path' : 'body'),
              requestPath: context.path,
              requestMethod: context.method,
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Detect rate-based threats (brute force, DoS)
   */
  private async detectRateBasedThreats(context: DetectionContext): Promise<DetectedThreat | null> {
    // Get rate-based rules
    const rateRules = this.rules.filter(rule => 
      rule.enabled && rule.threshold !== undefined && rule.timeWindow !== undefined
    );
    
    // No rules to check
    if (rateRules.length === 0) {
      return null;
    }
    
    // Track request rate for this IP
    const counter = this.ipHitCache.get(context.ip) || {
      count: 0,
      firstRequest: Date.now(),
      lastRequest: Date.now(),
      paths: new Set<string>()
    };
    
    // Update counter
    counter.count++;
    counter.lastRequest = Date.now();
    counter.paths.add(context.path);
    this.ipHitCache.set(context.ip, counter);
    
    // Check if any rate-based rule thresholds are exceeded
    const now = Date.now();
    const elapsedSeconds = (now - counter.firstRequest) / 1000;
    
    for (const rule of rateRules) {
      // Skip if no threshold or time window
      if (!rule.threshold || !rule.timeWindow) {
        continue;
      }
      
      // Check if request rate exceeds threshold
      const requestRate = counter.count / elapsedSeconds;
      const thresholdRate = rule.threshold / rule.timeWindow;
      
      // Check if we've exceeded the threshold rate
      if (requestRate > thresholdRate && elapsedSeconds >= 1 && counter.count >= rule.threshold) {
        // Special case for brute force - check if paths include auth endpoints
        if (rule.threatType === 'BRUTE_FORCE') {
          const authPaths = Array.from(counter.paths).filter(
            path => /\/(login|signin|auth|authenticate|token)/.test(path)
          );
          
          if (authPaths.length === 0) {
            continue; // Skip if no auth paths - not likely a brute force
          }
        }
        
        // Create threat data
        return {
          threatId: uuidv4(),
          description: `${rule.name} detected from IP ${context.ip}`,
          threatType: rule.threatType,
          severity: rule.severity,
          sourceIp: context.ip,
          userId: context.userId || null,
          resolved: false,
          isArchived: false,
          evidence: {
            rule: rule.id,
            requestCount: counter.count,
            timeWindowSeconds: elapsedSeconds,
            thresholdRate: `${thresholdRate} req/sec`,
            actualRate: `${requestRate.toFixed(2)} req/sec`,
            uniquePaths: Array.from(counter.paths),
            requestPath: context.path,
            requestMethod: context.method,
            timestamp: new Date().toISOString()
          }
        };
      }
    }
    
    return null;
  }
  
  /**
   * Detect behavioral anomalies
   */
  private async detectBehavioralAnomalies(context: DetectionContext): Promise<DetectedThreat | null> {
    // This is a stub for future AI-based behavioral analysis
    // It would check for unusual patterns that don't match specific rules
    
    // Special cases for common threats not caught by patterns:
    
    // 1. Check for consistent 404s (path scanning)
    if (context.data.statusCode === 404) {
      const notFoundCounter = this.ipHitCache.get(`${context.ip}:404`) || {
        count: 0,
        firstRequest: Date.now(),
        lastRequest: Date.now(),
        paths: new Set<string>()
      };
      
      notFoundCounter.count++;
      notFoundCounter.lastRequest = Date.now();
      notFoundCounter.paths.add(context.path);
      this.ipHitCache.set(`${context.ip}:404`, notFoundCounter);
      
      // If client has made many 404 requests to different paths recently
      if (notFoundCounter.count >= 10 && notFoundCounter.paths.size >= 5) {
        const elapsedSeconds = (Date.now() - notFoundCounter.firstRequest) / 1000;
        
        // If happening in a short time window
        if (elapsedSeconds < 60) {
          // More likely to be scanning if paths have similar patterns
          const paths = Array.from(notFoundCounter.paths);
          
          return {
            threatId: uuidv4(),
            description: `Possible directory scanning detected`,
            threatType: "SUSPICIOUS_ACTIVITY",
            severity: "medium",
            sourceIp: context.ip,
            userId: context.userId || null,
            resolved: false,
            isArchived: false,
            evidence: {
              notFoundCount: notFoundCounter.count,
              uniquePaths: paths,
              timeWindowSeconds: elapsedSeconds,
              requestPath: context.path,
              requestMethod: context.method,
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    }
    
    // 2. Check for rapid authentication failures
    if (context.path.includes('/login') || 
        context.path.includes('/signin') || 
        context.path.includes('/auth')) {
      
      // If the context data indicates an auth failure
      if (context.data.authFailure) {
        const authFailCounter = this.ipHitCache.get(`${context.ip}:auth:fail`) || {
          count: 0,
          firstRequest: Date.now(),
          lastRequest: Date.now(),
          paths: new Set<string>(),
          usernames: new Set<string>()
        };
        
        authFailCounter.count++;
        authFailCounter.lastRequest = Date.now();
        authFailCounter.paths.add(context.path);
        
        // Track usernames used in failed attempts
        if (context.body && context.body.username) {
          authFailCounter.usernames.add(context.body.username);
        }
        
        this.ipHitCache.set(`${context.ip}:auth:fail`, authFailCounter);
        
        // If more than 5 failures in a short window
        if (authFailCounter.count >= 5) {
          const elapsedSeconds = (Date.now() - authFailCounter.firstRequest) / 1000;
          
          if (elapsedSeconds < 300) { // 5 minutes
            // Determine if this is a single account attack or distributed
            const isSingleAccountAttack = authFailCounter.usernames.size === 1;
            const isDistributedAttack = authFailCounter.usernames.size >= 3;
            
            return {
              threatId: uuidv4(),
              description: isSingleAccountAttack 
                ? `Possible brute force attack against a single account`
                : (isDistributedAttack 
                  ? `Possible distributed account scanning` 
                  : `Multiple authentication failures`),
              threatType: "BRUTE_FORCE",
              severity: "high",
              sourceIp: context.ip,
              userId: context.userId || null,
              resolved: false,
              isArchived: false,
              evidence: {
                failureCount: authFailCounter.count,
                uniqueUsernames: Array.from(authFailCounter.usernames),
                timeWindowSeconds: elapsedSeconds,
                requestPath: context.path,
                requestMethod: context.method,
                timestamp: new Date().toISOString()
              }
            };
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Process a detected threat and determine the action to take
   */
  private async processThreat(
    threat: DetectedThreat, 
    context: DetectionContext
  ): Promise<{
    blocked: boolean;
    action?: BlockAction;
    threat: DetectedThreat;
  }> {
    // Always report the threat to the database
    await threatDatabaseService.reportThreat(threat);
    
    // Find the corresponding rule
    const rule = this.rules.find(r => 
      r.threatType === threat.threatType && r.enabled
    );
    
    // Determine if we should block this request
    let blocked = false;
    let action: BlockAction = 'log_only';
    
    if (rule && rule.autoBlock) {
      blocked = true;
      
      // Determine block action based on severity
      if (threat.severity === 'critical' || threat.severity === 'high') {
        action = 'perm_block';
        
        // Add IP to blocklist
        await threatDatabaseService.blockIp(
          threat.sourceIp,
          `Auto-blocked due to ${threat.threatType} threat`,
          // Block for 24 hours for high severity threats
          24 * 60 * 60
        );
      } else {
        action = 'temp_block';
        
        // Add IP to blocklist for a shorter time
        const blockDuration = threat.severity === 'medium' 
          ? 60 * 60 // 1 hour for medium
          : 10 * 60; // 10 minutes for low
          
        await threatDatabaseService.blockIp(
          threat.sourceIp,
          `Auto-blocked due to ${threat.threatType} threat`,
          blockDuration
        );
      }
    }
    
    // Record blocked request in monitoring
    if (blocked) {
      threatMonitoringService.recordApiRequest(true);
    }
    
    return {
      blocked,
      action,
      threat
    };
  }
  
  /**
   * Check if a request should be rate limited based on token bucket
   */
  isRateLimited(ip: string): boolean {
    return !this.rateLimiter.consume(ip);
  }
  
  /**
   * Check if an IP is blocked in the database
   * 
   * @param ip IP address to check
   * @returns Promise resolving to true if IP is blocked
   */
  async isIpBlocked(ip: string): Promise<boolean> {
    return await threatDatabaseService.isIpBlocked(ip);
  }
  
  /**
   * Report a security threat from any source
   * 
   * @param threatData Threat details
   * @returns The recorded threat
   */
  async reportThreat(threatData: {
    threatType: ThreatType;
    severity: ThreatSeverity;
    sourceIp: string;
    description: string;
    userId?: string | null;
    evidence: Record<string, any>;
  }): Promise<DetectedThreat> {
    // Create unique ID for this threat
    const threatId = uuidv4();
    
    // Prepare threat object
    const threat: DetectedThreat = {
      threatId: threatId,
      description: threatData.description,
      threatType: threatData.threatType,
      severity: threatData.severity,
      sourceIp: threatData.sourceIp,
      userId: threatData.userId || null,
      isArchived: false,
      evidence: threatData.evidence
    };
    
    // Store in database
    await threatDatabaseService.recordThreat(threat);
    
    // Log the incident
    console.warn(`Security threat detected: ${threatData.description} from ${threatData.sourceIp}`);
    
    // Report to monitoring service
    threatMonitoringService.recordThreat(threatData.threatType, threatData.severity);
    
    return threat;
  }
  
  /**
   * Block an IP address
   * 
   * @param ip IP address to block
   * @param reason Reason for blocking
   * @param duration Duration in seconds (optional)
   * @param userId User who initiated the block (optional)
   */
  async blockIp(ip: string, reason: string, duration?: number, userId?: string): Promise<void> {
    // Add to database blocklist
    await threatDatabaseService.blockIp(ip, reason, duration, userId);
    
    // Log the block
    console.warn(`IP Address ${ip} blocked: ${reason}`);
  }
  
  /**
   * Unblock an IP address
   * 
   * @param ip IP address to unblock
   * @returns True if successful
   */
  async unblockIp(ip: string): Promise<boolean> {
    const result = await threatDatabaseService.unblockIp(ip);
    
    if (result) {
      console.log(`IP Address ${ip} unblocked`);
    }
    
    return result;
  }
  
  /**
   * Resolve a threat (mark as handled)
   * 
   * @param threatId ID of the threat to resolve
   * @param resolvedBy User who resolved the threat
   * @returns True if successful
   */
  async resolveThreat(threatId: string, resolvedBy: string): Promise<boolean> {
    return await threatDatabaseService.resolveThreat(threatId, resolvedBy);
  }
  
  /**
   * Get active threats
   * 
   * @returns Promise resolving to active threats
   */
  async getActiveThreats(): Promise<DetectedThreat[]> {
    return await threatDatabaseService.getThreats({
      resolved: false,
      isArchived: false
    });
  }
  
  /**
   * Get recent threats
   * 
   * @param limit Maximum number of threats to return
   * @returns Promise resolving to recent threats
   */
  async getRecentThreats(limit: number = 100): Promise<DetectedThreat[]> {
    return await threatDatabaseService.getThreats({
      limit,
      sortBy: 'timestamp',
      sortDirection: 'desc'
    });
  }
  
  /**
   * Add or update a detection rule
   * 
   * @param rule Rule to add or update
   * @returns The added/updated rule
   */
  async addOrUpdateRule(rule: {
    name: string;
    description: string;
    threatType: ThreatType;
    severity: ThreatSeverity;
    pattern?: RegExp;
    threshold?: number;
    timeWindow?: number;
    autoBlock: boolean;
    autoNotify: boolean;
    enabled: boolean;
  }): Promise<any> {
    // Convert RegExp to string if provided
    const patternStr = rule.pattern ? rule.pattern.toString() : undefined;
    
    // Save to database
    return await threatDatabaseService.addOrUpdateRule({
      ...rule,
      pattern: patternStr
    });
  }
  
  /**
   * Set a rule's enabled status
   * 
   * @param ruleId ID of the rule to update
   * @param enabled Whether the rule should be enabled
   * @returns True if successful
   */
  async setRuleEnabled(ruleId: string, enabled: boolean): Promise<boolean> {
    return await threatDatabaseService.updateRuleStatus(ruleId, enabled);
  }
  
  /**
   * Delete a detection rule
   * 
   * @param ruleId ID of the rule to delete
   * @returns True if successful
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    return await threatDatabaseService.deleteRule(ruleId);
  }
  
  /**
   * Get time until rate limit reset
   */
  getRateLimitResetTime(ip: string): number {
    return this.rateLimiter.getTimeToNextToken(ip);
  }
  
  /**
   * Scan a request for potential security threats
   * 
   * @param context The request context
   * @returns Promise resolving to threats found
   */
  async scanRequest(context: DetectionContext): Promise<DetectedThreat[]> {
    const threats: DetectedThreat[] = [];
    
    // Check pattern-based threats
    const patternThreat = this.detectPatternBasedThreats(context);
    if (patternThreat) {
      threats.push(patternThreat);
    }
    
    // Check rate-based threats
    const rateThreat = await this.detectRateBasedThreats(context);
    if (rateThreat) {
      threats.push(rateThreat);
    }
    
    // Check behavioral anomalies
    const behaviorThreat = await this.detectBehavioralAnomalies(context);
    if (behaviorThreat) {
      threats.push(behaviorThreat);
    }
    
    return threats;
  }
}

// Export singleton instance
export const threatDetectionService = new ThreatDetectionService();