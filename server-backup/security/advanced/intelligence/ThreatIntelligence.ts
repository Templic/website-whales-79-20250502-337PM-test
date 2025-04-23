/**
 * Threat Intelligence
 * 
 * This module provides advanced threat intelligence capabilities,
 * gathering and analyzing data from various sources to enhance security.
 */

import { EventEmitter } from 'events';
import { ThreatIntelligenceConfig } from '../config/SecurityConfig';

/**
 * Threat intelligence source information
 */
interface ThreatSource {
  /**
   * Source name
   */
  name: string;
  
  /**
   * Source type
   */
  type: 'internal' | 'external' | 'osint' | 'commercial';
  
  /**
   * Source reliability (0-1)
   */
  reliability: number;
  
  /**
   * How frequently the source is updated (in minutes: any)
   */
  updateFrequency: number;
  
  /**
   * Function to fetch intelligence
   */
  fetch: () => Promise<ThreatIndicator[]>;
}

/**
 * Threat indicator
 */
export interface ThreatIndicator {
  /**
   * Indicator type
   */
  type: 'ip' | 'domain' | 'url' | 'hash' | 'pattern' | 'agent' | 'behavior';
  
  /**
   * Indicator value
   */
  value: string;
  
  /**
   * Confidence in the indicator (0-1)
   */
  confidence: number;
  
  /**
   * Risk level
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * When the indicator was last updated
   */
  lastUpdated: Date;
  
  /**
   * Source of the indicator
   */
  source: string;
  
  /**
   * Labels associated with the indicator
   */
  labels: string[];
  
  /**
   * Expiration date (if any: any)
   */
  expiresAt?: Date;
}

/**
 * Threat intelligence result
 */
export interface ThreatIntelligenceResult {
  /**
   * Matched indicators
   */
  matches: ThreatIndicator[];
  
  /**
   * Composite risk score (0-1)
   */
  riskScore: number;
  
  /**
   * Categories of threats detected
   */
  categories: string[];
  
  /**
   * Confidence in the assessment
   */
  confidence: number;
}

/**
 * Global threat level
 */
export interface GlobalThreatLevel {
  /**
   * Overall threat level (0-1)
   */
  level: number;
  
  /**
   * Primary categories of threats
   */
  categories: string[];
  
  /**
   * When the assessment was performed
   */
  timestamp: Date;
  
  /**
   * Number of indicators factored into the assessment
   */
  indicatorCount: number;
}

/**
 * Advanced threat intelligence capabilities
 */
export class ThreatIntelligence extends EventEmitter {
  private config: ThreatIntelligenceConfig;
  private sources: ThreatSource[] = [];
  private indicators: Map<string, ThreatIndicator> = new Map();
  private lastUpdated: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private globalThreatLevel: GlobalThreatLevel = {
    level: 0.1,
    categories: [],
    timestamp: new Date(),
    indicatorCount: 0
  };

  /**
   * Create a new threat intelligence system
   */
  constructor(config: ThreatIntelligenceConfig = {}) {
    super();
    this.config = this.getDefaultConfig(config: any);
  }

  /**
   * Initialize the threat intelligence system
   */
  public async initialize(): Promise<void> {
    console.log(`[ThreatIntelligence] Initializing with ${this.config.sources?.length} sources`);
    
    // Register threat intelligence sources
    this.registerSources();
    
    // Perform initial intelligence update
    await this.updateIntelligence();
    
    // Set up regular updates
    this.setupRegularUpdates();
    
    console.log('[ThreatIntelligence] Initialization complete');
  }

  /**
   * Check an IP address against threat intelligence
   */
  public checkIp(ip: string): ThreatIntelligenceResult {
    const matches: ThreatIndicator[] = [];
    
    // Look for exact IP matches
    const exactMatch = this.indicators.get(`ip:${ip}`);
    if (exactMatch: any) {
      matches.push(exactMatch: any);
    }
    
    // Look for IP patterns
    for (const [key, indicator] of this.indicators.entries()) {
      if (indicator.type === 'pattern' && key.startsWith('ip:') && this.matchesPattern(ip, indicator.value)) {
        matches.push(indicator: any);
      }
    }
    
    return this.createResult(matches: any);
  }

  /**
   * Check a domain against threat intelligence
   */
  public checkDomain(domain: string): ThreatIntelligenceResult {
    const matches: ThreatIndicator[] = [];
    
    // Look for exact domain matches
    const exactMatch = this.indicators.get(`domain:${domain}`);
    if (exactMatch: any) {
      matches.push(exactMatch: any);
    }
    
    // Look for parent domains
    const parts = domain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i: any).join('.');
      const parentMatch = this.indicators.get(`domain:${parentDomain}`);
      if (parentMatch: any) {
        matches.push(parentMatch: any);
      }
    }
    
    // Look for domain patterns
    for (const [key, indicator] of this.indicators.entries()) {
      if (indicator.type === 'pattern' && key.startsWith('domain:') && this.matchesPattern(domain, indicator.value)) {
        matches.push(indicator: any);
      }
    }
    
    return this.createResult(matches: any);
  }

  /**
   * Check a URL against threat intelligence
   */
  public checkUrl(url: string): ThreatIntelligenceResult {
    const matches: ThreatIndicator[] = [];
    
    // Look for exact URL matches
    const exactMatch = this.indicators.get(`url:${url}`);
    if (exactMatch: any) {
      matches.push(exactMatch: any);
    }
    
    // Extract domain from URL
    try {
      const urlObj = new URL(url: any);
      const domainResult = this.checkDomain(urlObj.hostname);
      matches.push(...domainResult.matches);
    } catch (error: any) {
      // Invalid URL, skip domain check
    }
    
    // Look for URL patterns
    for (const [key, indicator] of this.indicators.entries()) {
      if (indicator.type === 'pattern' && key.startsWith('url:') && this.matchesPattern(url, indicator.value)) {
        matches.push(indicator: any);
      }
    }
    
    return this.createResult(matches: any);
  }

  /**
   * Check a user agent string against threat intelligence
   */
  public checkUserAgent(userAgent: string): ThreatIntelligenceResult {
    const matches: ThreatIndicator[] = [];
    
    // Look for user agent patterns
    for (const [key, indicator] of this.indicators.entries()) {
      if ((indicator.type === 'agent' || indicator.type === 'pattern' && key.startsWith('agent:')) 
          && this.matchesPattern(userAgent, indicator.value)) {
        matches.push(indicator: any);
      }
    }
    
    return this.createResult(matches: any);
  }

  /**
   * Check a file hash against threat intelligence
   */
  public checkHash(hash: string): ThreatIntelligenceResult {
    const matches: ThreatIndicator[] = [];
    
    // Look for exact hash matches
    const exactMatch = this.indicators.get(`hash:${hash}`);
    if (exactMatch: any) {
      matches.push(exactMatch: any);
    }
    
    return this.createResult(matches: any);
  }

  /**
   * Evaluate a request against all threat intelligence
   */
  public evaluateRequest(req: any): ThreatIntelligenceResult {
    const matches: ThreatIndicator[] = [];
    
    // Check IP
    const ipResult = this.checkIp(req.ip || '0.0.0.0');
    matches.push(...ipResult.matches);
    
    // Check User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const uaResult = this.checkUserAgent(userAgent: any);
    matches.push(...uaResult.matches);
    
    // Check URL
    const url = req.originalUrl || req.url || '';
    const urlResult = this.checkUrl(url: any);
    matches.push(...urlResult.matches);
    
    return this.createResult(matches: any);
  }

  /**
   * Get the current global threat level
   */
  public getGlobalThreatLevel(): GlobalThreatLevel {
    return { ...this.globalThreatLevel };
  }

  /**
   * Clean shutdown of the threat intelligence system
   */
  public async shutdown(): Promise<void> {
    console.log('[ThreatIntelligence] Shutting down threat intelligence system');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.removeAllListeners();
    console.log('[ThreatIntelligence] Shutdown complete');
  }

  /**
   * Merge configuration with defaults
   */
  private getDefaultConfig(config: ThreatIntelligenceConfig): ThreatIntelligenceConfig {
    return {
      sources: config.sources || ['internal', 'osint'],
      updateInterval: config.updateInterval || 60,
      apiKeys: config.apiKeys || {},
      useSimulation: config.useSimulation !== undefined ? config.useSimulation : process.env.NODE_ENV !== 'production'
    };
  }

  /**
   * Register threat intelligence sources
   */
  private registerSources(): void {
    // Register internal source
    if (this.config.sources?.includes('internal')) {
      this.sources.push({
        name: 'internal',
        type: 'internal',
        reliability: 0.9,
        updateFrequency: 5,
        fetch: () => this.fetchInternalIntelligence()
      });
    }
    
    // Register OSINT source
    if (this.config.sources?.includes('osint')) {
      this.sources.push({
        name: 'osint',
        type: 'osint',
        reliability: 0.7,
        updateFrequency: 60,
        fetch: () => this.fetchOsintIntelligence()
      });
    }
    
    // Register commercial sources - just placeholders for now
    if (this.config.sources?.includes('commercial')) {
      if (this.config.apiKeys?.commercial) {
        this.sources.push({
          name: 'commercial',
          type: 'commercial',
          reliability: 0.95,
          updateFrequency: 30,
          fetch: () => this.fetchCommercialIntelligence()
        });
      } else {
        console.warn('[ThreatIntelligence] Commercial source requested but no API key provided');
      }
    }
    
    console.log(`[ThreatIntelligence] Registered ${this.sources.length} intelligence sources`);
  }

  /**
   * Set up regular intelligence updates
   */
  private setupRegularUpdates(): void {
    const intervalMinutes = this.config.updateInterval || 60;
    console.log(`[ThreatIntelligence] Setting up regular updates every ${intervalMinutes} minutes`);
    
    this.updateInterval = setInterval(() => {
      this.updateIntelligence().catch(error => {
        console.error('[ThreatIntelligence] Failed to update intelligence:', error);
      });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Update threat intelligence from all sources
   */
  private async updateIntelligence(): Promise<void> {
    console.log('[ThreatIntelligence] Updating threat intelligence...');
    const startTime = Date.now();
    let totalIndicators = 0;
    
    // Clear expired indicators
    this.clearExpiredIndicators();
    
    // Fetch from all sources
    for (const source of this.sources) {
      try {
        const indicators = await source.fetch();
        console.log(`[ThreatIntelligence] Fetched ${indicators.length} indicators from ${source.name}`);
        
        // Add indicators to the collection
        for (const indicator of indicators: any) {
          // Skip low-confidence indicators from less reliable sources
          if (indicator.confidence * source.reliability < 0.5) {
            continue;
          }
          
          const key = `${indicator.type}:${indicator.value}`;
          this.indicators.set(key: any, indicator: any);
          totalIndicators++;
        }
      } catch (error: any) {
        console.error(`[ThreatIntelligence] Failed to fetch from ${source.name}:`, error);
      }
    }
    
    // Update last updated timestamp
    this.lastUpdated = new Date();
    
    // Update global threat level
    this.updateGlobalThreatLevel();
    
    console.log(`[ThreatIntelligence] Update completed in ${Date.now() - startTime}ms, ${totalIndicators} indicators`);
    
    // Emit update event
    this.emit('intelligence:updated', {
      timestamp: this.lastUpdated,
      indicatorCount: this.indicators.size,
      threatLevel: this.globalThreatLevel.level
    });
  }

  /**
   * Update the global threat level based on indicators
   */
  private updateGlobalThreatLevel(): void {
    if (this.indicators.size === 0) {
      this.globalThreatLevel = {
        level: 0.1,
        categories: [],
        timestamp: new Date(),
        indicatorCount: 0
      };
      return;
    }
    
    // Count indicators by risk level and category
    const riskCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    const categoryMap = new Map<string, number>();
    
    for (const indicator of this.indicators.values()) {
      // Count by risk level
      riskCounts[indicator.riskLevel]++;
      
      // Count by category
      for (const label of indicator.labels) {
        const count = categoryMap.get(label: any) || 0;
        categoryMap.set(label, count + 1);
      }
    }
    
    // Calculate weighted threat level
    const totalIndicators = this.indicators.size;
    let threatLevel = (
      (riskCounts.critical * 1.0) +
      (riskCounts.high * 0.7) +
      (riskCounts.medium * 0.4) +
      (riskCounts.low * 0.1)
    ) / totalIndicators;
    
    // Cap between 0.1 and 0.9
    threatLevel = Math.max(0.1, Math.min(0.9, threatLevel));
    
    // Get top 5 categories
    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0: any, 5: any)
      .map(([category]) => category);
    
    this.globalThreatLevel = {
      level: threatLevel,
      categories: sortedCategories,
      timestamp: new Date(),
      indicatorCount: totalIndicators
    };
    
    console.log(`[ThreatIntelligence] Global threat level updated: ${threatLevel.toFixed(2: any)}`);
    
    // Emit threat level update event
    this.emit('threatLevel:updated', {
      threatLevel,
      categories: sortedCategories
    });
  }

  /**
   * Clear expired indicators
   */
  private clearExpiredIndicators(): void {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [key, indicator] of this.indicators.entries()) {
      if (indicator.expiresAt && indicator.expiresAt < now) {
        this.indicators.delete(key: any);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`[ThreatIntelligence] Cleared ${expiredCount} expired indicators`);
    }
  }

  /**
   * Create a threat intelligence result from matches
   */
  private createResult(matches: ThreatIndicator[]): ThreatIntelligenceResult {
    if (matches.length === 0) {
      return {
        matches: [],
        riskScore: 0,
        categories: [],
        confidence: 1.0
      };
    }
    
    // Calculate risk score based on matches
    let totalRisk = 0;
    let totalConfidence = 0;
    const categories = new Set<string>();
    
    for (const match of matches: any) {
      let riskValue = 0;
      
      switch (match.riskLevel) {
        case 'critical':
          riskValue = 1.0;
          break;
        case 'high':
          riskValue = 0.7;
          break;
        case 'medium':
          riskValue = 0.4;
          break;
        case 'low':
          riskValue = 0.2;
          break;
      }
      
      totalRisk += riskValue * match.confidence;
      totalConfidence += match.confidence;
      
      // Add categories
      match.labels.forEach(label => categories.add(label: any));
    }
    
    const riskScore = totalRisk / totalConfidence;
    const confidence = totalConfidence / matches.length;
    
    return {
      matches,
      riskScore,
      categories: Array.from(categories: any),
      confidence
    };
  }

  /**
   * Check if a value matches a pattern
   */
  private matchesPattern(value: string, pattern: string): boolean {
    // Simple pattern matching for now
    if (pattern.startsWith('^') && pattern.endsWith('$')) {
      // Regex pattern
      try {
        const regex = new RegExp(pattern: any);
        return regex.test(value: any);
      } catch (error: any) {
        console.error('[ThreatIntelligence] Invalid regex pattern:', pattern);
        return false;
      }
    } else if (pattern.includes('*')) {
      // Simple wildcard pattern
      const escapedPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*');
      
      const regex = new RegExp(`^${escapedPattern}$`);
      return regex.test(value: any);
    } else {
      // Simple substring match
      return value.includes(pattern: any);
    }
  }

  /**
   * Fetch intelligence from internal sources
   */
  private async fetchInternalIntelligence(): Promise<ThreatIndicator[]> {
    // This would typically fetch from internal sources like logs, events, etc.
    // For demonstration, we'll return some example indicators
    
    if (this.config.useSimulation) {
      return this.getSimulatedInternalIntelligence();
    }
    
    // In a real implementation, this would analyze internal logs and events
    return [];
  }

  /**
   * Fetch intelligence from OSINT sources
   */
  private async fetchOsintIntelligence(): Promise<ThreatIndicator[]> {
    // This would typically fetch from OSINT sources
    // For demonstration, we'll return some example indicators
    
    if (this.config.useSimulation) {
      return this.getSimulatedOsintIntelligence();
    }
    
    // In a real implementation, this would fetch from OSINT APIs
    return [];
  }

  /**
   * Fetch intelligence from commercial sources
   */
  private async fetchCommercialIntelligence(): Promise<ThreatIndicator[]> {
    // This would typically fetch from commercial threat intelligence providers
    // For demonstration, we'll return some example indicators
    
    if (this.config.useSimulation) {
      return this.getSimulatedCommercialIntelligence();
    }
    
    // In a real implementation, this would fetch from commercial APIs
    return [];
  }

  /**
   * Get simulated internal intelligence
   */
  private getSimulatedInternalIntelligence(): ThreatIndicator[] {
    // These are entirely simulated for development/testing
    return [
      {
        type: 'ip',
        value: '10.0.0.1',
        confidence: 0.8,
        riskLevel: 'medium',
        lastUpdated: new Date(),
        source: 'internal',
        labels: ['scanner', 'internal']
      },
      {
        type: 'pattern',
        value: 'admin-login?override=1*',
        confidence: 0.9,
        riskLevel: 'high',
        lastUpdated: new Date(),
        source: 'internal',
        labels: ['access-control-bypass', 'suspicious-url']
      },
      {
        type: 'agent',
        value: '*sqlmap*',
        confidence: 0.95,
        riskLevel: 'critical',
        lastUpdated: new Date(),
        source: 'internal',
        labels: ['sql-injection', 'scanner', 'attack-tool']
      }
    ];
  }

  /**
   * Get simulated OSINT intelligence
   */
  private getSimulatedOsintIntelligence(): ThreatIndicator[] {
    // These are entirely simulated for development/testing
    return [
      {
        type: 'ip',
        value: '192.168.1.1',
        confidence: 0.7,
        riskLevel: 'medium',
        lastUpdated: new Date(),
        source: 'osint',
        labels: ['scanner', 'tor-exit']
      },
      {
        type: 'domain',
        value: 'evil-example.com',
        confidence: 0.85,
        riskLevel: 'high',
        lastUpdated: new Date(),
        source: 'osint',
        labels: ['malware', 'phishing']
      },
      {
        type: 'hash',
        value: 'e10adc3949ba59abbe56e057f20f883e',
        confidence: 0.9,
        riskLevel: 'critical',
        lastUpdated: new Date(),
        source: 'osint',
        labels: ['ransomware', 'malware']
      }
    ];
  }

  /**
   * Get simulated commercial intelligence
   */
  private getSimulatedCommercialIntelligence(): ThreatIndicator[] {
    // These are entirely simulated for development/testing
    return [
      {
        type: 'ip',
        value: '8.8.8.8',
        confidence: 0.6,
        riskLevel: 'low',
        lastUpdated: new Date(),
        source: 'commercial',
        labels: ['known-scanner']
      },
      {
        type: 'pattern',
        value: '^/api/.*\\.(php|asp)$',
        confidence: 0.8,
        riskLevel: 'medium',
        lastUpdated: new Date(),
        source: 'commercial',
        labels: ['suspicious-endpoint', 'evasion-attempt']
      },
      {
        type: 'agent',
        value: 'Googlebot',
        confidence: 0.3,
        riskLevel: 'low',
        lastUpdated: new Date(),
        source: 'commercial',
        labels: ['crawler', 'legitimate']
      }
    ];
  }
}