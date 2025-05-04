/**
 * Threat Detection Service
 *
 * This service is responsible for detecting potential security threats based on request patterns,
 * user behavior, and known attack signatures. It provides a threat level rating that can be used
 * by the rate limiting system to adjust limits accordingly.
 */

import { Request } from 'express';
import fs from 'fs';
import path from 'path';

// Define threat rules interface
interface ThreatRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  target: 'path' | 'query' | 'body' | 'headers' | 'ip' | 'userAgent';
  severity: number; // 0 to 1
  description: string;
  patternType: 'regex' | 'substring';
}

// Define cached IP reputations
interface IpReputation {
  ip: string;
  score: number; // 0 to 1 (higher is worse)
  lastUpdated: number;
  source: string;
}

export class ThreatDetectionService {
  private rules: ThreatRule[] = [];
  private ipReputations: Map<string, IpReputation> = new Map();
  private violationCounts: Map<string, number> = new Map();
  private recentSuspiciousIps: Set<string> = new Set();
  private lastRuleUpdateTime: number = 0;
  private ruleUpdateInterval: number = 3600000; // 1 hour
  
  constructor() {
    // Load initial threat rules
    this.loadThreatRules();
    
    // Set up periodic rule updates
    setInterval(() => {
      this.loadThreatRules();
    }, this.ruleUpdateInterval);
  }
  
  /**
   * Get the threat level for a request
   * 
   * @param req The Express request
   * @param ip The client IP address
   * @param userId The user ID if authenticated
   * @returns A threat level between 0 and 1
   */
  public getThreatLevel(req: Request, ip: string, userId?: string | number): number {
    // Start with a base threat level of 0
    let threatLevel = 0;
    
    // Check IP reputation
    const ipReputation = this.getIpReputation(ip);
    if (ipReputation > 0) {
      // IP reputation contributes significantly to threat level
      threatLevel += ipReputation * 0.4;
    }
    
    // Check for suspicious patterns in the request
    const patternThreat = this.checkRequestPatterns(req);
    if (patternThreat > 0) {
      // Pattern matches contribute to threat level
      threatLevel += patternThreat * 0.5;
    }
    
    // Check previous violations
    const violationThreat = this.checkPreviousViolations(ip, userId);
    if (violationThreat > 0) {
      // Previous violations contribute to threat level
      threatLevel += violationThreat * 0.3;
    }
    
    // Normalize to ensure we're between 0 and 1
    threatLevel = Math.min(1, threatLevel);
    
    // If this is a high threat, add to recent suspicious IPs
    if (threatLevel > 0.6) {
      this.recentSuspiciousIps.add(ip);
    }
    
    return threatLevel;
  }
  
  /**
   * Get the global threat level based on recent activity
   * 
   * @returns A threat level between 0 and 1
   */
  public getGlobalThreatLevel(): number {
    // Calculate based on number of recent suspicious IPs
    const suspiciousIpCount = this.recentSuspiciousIps.size;
    
    // More than 10 suspicious IPs is considered high threat
    const normalizedCount = Math.min(suspiciousIpCount / 10, 1);
    
    return normalizedCount * 0.8; // Scale to 0.8 max since this is a global metric
  }
  
  /**
   * Record a violation by an identifier
   * 
   * @param identifier The user or IP identifier
   */
  public recordViolation(identifier: string): void {
    const currentCount = this.violationCounts.get(identifier) || 0;
    this.violationCounts.set(identifier, currentCount + 1);
  }
  
  /**
   * Check the reputation of an IP address
   * 
   * @param ip The IP address to check
   * @returns A reputation score between 0 and 1 (higher is worse)
   */
  private getIpReputation(ip: string): number {
    // Check if we have a cached reputation
    if (this.ipReputations.has(ip)) {
      const reputation = this.ipReputations.get(ip);
      // Cache reputation for 24 hours
      if (reputation && Date.now() - reputation.lastUpdated < 86400000) {
        return reputation.score;
      }
    }
    
    // In a real implementation, this would call out to a reputation service
    // For this example, we'll use a simple heuristic based on the IP
    let score = 0;
    
    // Check if IP is in recent suspicious list
    if (this.recentSuspiciousIps.has(ip)) {
      score += 0.5;
    }
    
    // Check previous violations
    const violations = this.violationCounts.get(ip) || 0;
    if (violations > 0) {
      // More violations means higher score
      score += Math.min(violations / 10, 0.5);
    }
    
    // Cache the result
    this.ipReputations.set(ip, {
      ip,
      score,
      lastUpdated: Date.now(),
      source: 'internal'
    });
    
    return score;
  }
  
  /**
   * Check for suspicious patterns in the request
   * 
   * @param req The Express request
   * @returns A threat score between 0 and 1
   */
  private checkRequestPatterns(req: Request): number {
    let highestSeverity = 0;
    let matchCount = 0;
    
    // Check each rule against the request
    for (const rule of this.rules) {
      let target: any;
      
      // Get the appropriate part of the request to check
      switch (rule.target) {
        case 'path':
          target = req.path;
          break;
        case 'query':
          target = req.query ? JSON.stringify(req.query) : '';
          break;
        case 'body':
          target = req.body ? JSON.stringify(req.body) : '';
          break;
        case 'headers':
          target = req.headers ? JSON.stringify(req.headers) : '';
          break;
        case 'ip':
          target = req.ip || '';
          break;
        case 'userAgent':
          target = req.headers['user-agent'] || '';
          break;
        default:
          target = '';
      }
      
      // Skip if target is not available
      if (!target) continue;
      
      // Check if the pattern matches
      let matches = false;
      
      if (rule.patternType === 'regex') {
        const pattern = rule.pattern instanceof RegExp ? 
          rule.pattern : new RegExp(rule.pattern as string);
        matches = pattern.test(target);
      } else {
        // Substring match
        matches = target.includes(rule.pattern);
      }
      
      if (matches) {
        matchCount++;
        highestSeverity = Math.max(highestSeverity, rule.severity);
      }
    }
    
    // Calculate threat level based on matches and their severity
    if (matchCount === 0) {
      return 0;
    } else if (matchCount === 1) {
      return highestSeverity;
    } else {
      // Multiple matches increase the threat level
      return Math.min(1, highestSeverity + (matchCount - 1) * 0.1);
    }
  }
  
  /**
   * Check for previous violations by this IP or user
   * 
   * @param ip The client IP address
   * @param userId The user ID if authenticated
   * @returns A threat score between 0 and 1
   */
  private checkPreviousViolations(ip: string, userId?: string | number): number {
    const ipViolations = this.violationCounts.get(ip) || 0;
    let userViolations = 0;
    
    if (userId) {
      userViolations = this.violationCounts.get(`user:${userId}`) || 0;
    }
    
    // Use the higher of the two counts
    const violations = Math.max(ipViolations, userViolations);
    
    // Scale violations to a threat score
    return Math.min(violations / 20, 1);
  }
  
  /**
   * Load threat detection rules
   */
  private loadThreatRules(): void {
    try {
      // Check if we've updated recently
      if (Date.now() - this.lastRuleUpdateTime < this.ruleUpdateInterval) {
        return;
      }
      
      // In a real implementation, this would load from a database or file
      // For this example, we'll use a simple set of built-in rules
      this.rules = [
        {
          id: 'sql-injection-1',
          name: 'SQL Injection Attempt (Basic)',
          pattern: /'.*(\s|\+)*(or|and)(\s|\+)*.*=.*--.*/i,
          target: 'query',
          severity: 0.8,
          description: 'SQL injection attempt with OR/AND operator and comment',
          patternType: 'regex'
        },
        {
          id: 'xss-basic-1',
          name: 'XSS Attempt (Basic)',
          pattern: /<script>.*<\/script>/i,
          target: 'body',
          severity: 0.7,
          description: 'Basic cross-site scripting attempt with script tags',
          patternType: 'regex'
        },
        {
          id: 'path-traversal-1',
          name: 'Path Traversal Attempt',
          pattern: /\.\.(\/|\\)/,
          target: 'path',
          severity: 0.8,
          description: 'Directory traversal attempt with ../',
          patternType: 'regex'
        },
        {
          id: 'admin-access',
          name: 'Admin Access Attempt',
          pattern: /\/api\/admin/i,
          target: 'path',
          severity: 0.3,
          description: 'Attempt to access admin API endpoints',
          patternType: 'regex'
        },
        {
          id: 'auth-brute-force',
          name: 'Authentication Brute Force',
          pattern: /\/api\/auth\/login/i,
          target: 'path',
          severity: 0.4,
          description: 'Multiple authentication attempts',
          patternType: 'regex'
        },
        {
          id: 'suspicious-user-agent-1',
          name: 'Suspicious User Agent',
          pattern: /(nmap|nikto|sqlmap|scanner|gobuster|burpsuite)/i,
          target: 'userAgent',
          severity: 0.9,
          description: 'User agent contains known security tool',
          patternType: 'regex'
        }
      ];
      
      // Load custom rules from file if available
      try {
        const customRulesPath = path.join(process.cwd(), 'config', 'threat-rules.json');
        
        if (fs.existsSync(customRulesPath)) {
          const customRules = JSON.parse(fs.readFileSync(customRulesPath, 'utf8'));
          
          if (Array.isArray(customRules)) {
            // Convert string patterns to RegExp for regex pattern types
            const processedRules = customRules.map(rule => {
              if (rule.patternType === 'regex' && typeof rule.pattern === 'string') {
                return {
                  ...rule,
                  pattern: new RegExp(rule.pattern, 'i')
                };
              }
              return rule;
            });
            
            this.rules = [...this.rules, ...processedRules];
          }
        }
      } catch (error) {
        console.error('[ThreatDetection] Error loading custom threat rules:', error);
      }
      
      this.lastRuleUpdateTime = Date.now();
    } catch (error) {
      console.error('[ThreatDetection] Error loading threat rules:', error);
    }
  }
  
  /**
   * Clear the suspicious IP cache older than a certain time
   * 
   * @param maxAgeMs Maximum age in milliseconds
   */
  public clearOldSuspiciousIps(maxAgeMs: number = 3600000): void {
    // In a real implementation, this would track when IPs were added
    // For simplicity, we'll just clear the entire set in this example
    this.recentSuspiciousIps.clear();
  }
}

// Export a singleton instance
export const threatDetectionService = new ThreatDetectionService();