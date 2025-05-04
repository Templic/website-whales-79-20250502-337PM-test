/**
 * Rate Limit Context Builder
 *
 * This module builds context information for rate limiting decisions.
 * It helps make context-aware rate limiting decisions.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp, getIpSubnet, isPrivateIp } from '../../../utils/ip-utils';
import { threatDetectionService } from './ThreatDetectionService';

/**
 * Configuration for context builder
 */
export interface RateLimitContextBuilderConfig {
  /**
   * List of whitelisted IPs (skips rate limiting)
   */
  whitelistedIps?: string[];
  
  /**
   * List of blacklisted IPs (more restrictive rate limiting)
   */
  blacklistedIps?: string[];
  
  /**
   * List of known good bot user agents
   */
  goodBots?: RegExp[];
  
  /**
   * List of known bad bot user agents
   */
  badBots?: RegExp[];
  
  /**
   * Request cost multipliers for HTTP methods
   */
  methodCosts?: Record<string, number>;
  
  /**
   * Request paths that are more resource-intensive
   */
  resourceIntensivePaths?: Array<{
    pattern: RegExp;
    cost: number;
    sensitivity: number;
  }>;
}

/**
 * Rate limit context
 */
export interface RateLimitContext {
  /**
   * Client IP address
   */
  ip: string;
  
  /**
   * IP subnet
   */
  ipSubnet: string;
  
  /**
   * User ID (if authenticated)
   */
  userId?: string | number;
  
  /**
   * Whether the user is authenticated
   */
  authenticated: boolean;
  
  /**
   * User role (if available)
   */
  role?: string;
  
  /**
   * Role weight (lower = more privileged)
   */
  roleWeight: number;
  
  /**
   * Resource type identifier
   */
  resourceType: string;
  
  /**
   * Resource sensitivity (1-5, higher = more sensitive)
   */
  resourceSensitivity: number;
  
  /**
   * API key (if available)
   */
  apiKey?: string;
  
  /**
   * User agent string
   */
  userAgent?: string;
  
  /**
   * Whether user agent is a known good bot
   */
  isGoodBot: boolean;
  
  /**
   * Whether user agent is a known bad bot
   */
  isBadBot: boolean;
  
  /**
   * Whether IP is whitelisted
   */
  isWhitelisted: boolean;
  
  /**
   * Whether IP is blacklisted
   */
  isBlacklisted: boolean;
  
  /**
   * Threat level (0-1, higher = more threatening)
   */
  threatLevel: number;
  
  /**
   * Unique identifier for this context
   */
  identifier: string;
  
  /**
   * Any custom attributes
   */
  attributes: Record<string, any>;
}

/**
 * Role weight mapping
 */
const ROLE_WEIGHTS: Record<string, number> = {
  'admin': 1,
  'superuser': 1,
  'staff': 3,
  'moderator': 4,
  'premium': 6,
  'subscriber': 7,
  'user': 8,
  'guest': 10
};

/**
 * Default method costs
 */
const DEFAULT_METHOD_COSTS: Record<string, number> = {
  'GET': 1,
  'HEAD': 0.5,
  'OPTIONS': 0.5,
  'POST': 2,
  'PUT': 2,
  'PATCH': 1.5,
  'DELETE': 3
};

/**
 * Default resource-intensive paths
 */
const DEFAULT_RESOURCE_INTENSIVE_PATHS: Array<{
  pattern: RegExp;
  cost: number; 
  sensitivity: number;
}> = [
  { pattern: /\/api\/search/, cost: 3, sensitivity: 3 },
  { pattern: /\/api\/report/, cost: 5, sensitivity: 3 },
  { pattern: /\/api\/admin/, cost: 3, sensitivity: 5 },
  { pattern: /\/api\/security/, cost: 2, sensitivity: 5 },
  { pattern: /\/api\/auth/, cost: 2, sensitivity: 5 },
  { pattern: /\/api\/upload/, cost: 4, sensitivity: 4 },
  { pattern: /\/api\/download/, cost: 3, sensitivity: 2 },
  { pattern: /\/api\/batch/, cost: 5, sensitivity: 3 }
];

/**
 * Good bots user agent patterns
 */
const GOOD_BOTS: RegExp[] = [
  /Googlebot/i,
  /Bingbot/i,
  /Slackbot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /PinterestBot/i
];

/**
 * Bad bots user agent patterns
 */
const BAD_BOTS: RegExp[] = [
  /PetalBot/i,
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /YandexBot/i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /Bytespider/i
];

/**
 * Builds context for rate limiting decisions
 */
export class RateLimitContextBuilder {
  private whitelistedIps: Set<string>;
  private blacklistedIps: Set<string>;
  private goodBots: RegExp[];
  private badBots: RegExp[];
  private methodCosts: Record<string, number>;
  private resourceIntensivePaths: Array<{
    pattern: RegExp;
    cost: number;
    sensitivity: number;
  }>;
  
  constructor(config: RateLimitContextBuilderConfig = {}) {
    // Initialize properties
    this.whitelistedIps = new Set(config.whitelistedIps || []);
    this.blacklistedIps = new Set(config.blacklistedIps || []);
    this.goodBots = config.goodBots || GOOD_BOTS;
    this.badBots = config.badBots || BAD_BOTS;
    this.methodCosts = { ...DEFAULT_METHOD_COSTS, ...(config.methodCosts || {}) };
    this.resourceIntensivePaths = config.resourceIntensivePaths || DEFAULT_RESOURCE_INTENSIVE_PATHS;
    
    // Add localhost and development IPs to whitelist
    this.whitelistedIps.add('127.0.0.1');
    this.whitelistedIps.add('::1');
    this.whitelistedIps.add('localhost');
    
    log('Rate limit context builder initialized', 'security');
  }
  
  /**
   * Build context from request
   * 
   * @param req Express request
   * @returns Rate limit context
   */
  public buildContext(req: Request): RateLimitContext {
    try {
      // Get client IP
      const ip = getClientIp(req);
      const ipSubnet = getIpSubnet(ip);
      
      // Check whitelisted and blacklisted
      const isWhitelisted = this.isIpWhitelisted(ip);
      const isBlacklisted = this.isIpBlacklisted(ip);
      
      // Get user agent
      const userAgent = req.headers['user-agent'] as string;
      
      // Check if bot
      const isGoodBot = this.isGoodBot(userAgent);
      const isBadBot = this.isBadBot(userAgent);
      
      // Get user info
      const userId = req.session?.userId;
      const authenticated = !!userId;
      const role = req.session?.role || 'guest';
      const roleWeight = this.getRoleWeight(role);
      
      // Get API key
      const apiKey = this.extractApiKey(req);
      
      // Get resource info
      const { resourceType, resourceSensitivity } = this.getResourceInfo(req);
      
      // Get threat level
      const threatLevel = threatDetectionService.getThreatLevel(req, ip, userId);
      
      // Create unique identifier for rate limiting
      const identifier = this.generateIdentifier(req, ip, userId, apiKey);
      
      // Create context
      const context: RateLimitContext = {
        ip,
        ipSubnet,
        userId,
        authenticated,
        role,
        roleWeight,
        resourceType,
        resourceSensitivity,
        apiKey,
        userAgent,
        isGoodBot,
        isBadBot,
        isWhitelisted,
        isBlacklisted,
        threatLevel,
        identifier,
        attributes: {}
      };
      
      return context;
    } catch (error) {
      log(`Error building rate limit context: ${error}`, 'security');
      
      // Return safe default context
      return {
        ip: getClientIp(req),
        ipSubnet: '',
        authenticated: false,
        roleWeight: 10,
        resourceType: 'unknown',
        resourceSensitivity: 3,
        isGoodBot: false,
        isBadBot: false,
        isWhitelisted: false,
        isBlacklisted: false,
        threatLevel: 0,
        identifier: req.ip || 'unknown',
        attributes: {}
      };
    }
  }
  
  /**
   * Calculate request cost based on context
   * 
   * @param req Express request
   * @param context Rate limit context
   * @returns Cost in tokens to consume
   */
  public calculateRequestCost(req: Request, context: RateLimitContext): number {
    try {
      // Start with base cost by method
      const method = req.method.toUpperCase();
      let cost = this.methodCosts[method] || 1;
      
      // Check resource-intensive paths
      for (const { pattern, cost: pathCost } of this.resourceIntensivePaths) {
        if (pattern.test(req.path)) {
          cost *= pathCost;
          break;
        }
      }
      
      // Adjust cost based on context
      if (context.isBlacklisted) {
        cost *= 2; // Blacklisted IPs have double cost
      }
      
      if (context.isBadBot) {
        cost *= 3; // Bad bots have triple cost
      }
      
      if (context.isGoodBot) {
        cost *= 0.5; // Good bots have half cost
      }
      
      // Adjust for authentication status
      if (context.authenticated) {
        cost *= 0.8; // Authenticated users get a discount
      }
      
      // Adjust for threat level
      if (context.threatLevel > 0) {
        const threatMultiplier = 1 + (context.threatLevel * 3);
        cost *= threatMultiplier; // Higher threat = higher cost
      }
      
      // Adjust for role
      if (context.roleWeight <= 3) {
        cost *= 0.5; // Admins and staff get a discount
      }
      
      // Ensure minimum cost of 1
      return Math.max(1, Math.round(cost));
    } catch (error) {
      log(`Error calculating request cost: ${error}`, 'security');
      
      // Return default cost
      return 1;
    }
  }
  
  /**
   * Check if IP is whitelisted
   * 
   * @param ip IP address
   * @returns Whether IP is whitelisted
   */
  private isIpWhitelisted(ip: string): boolean {
    return this.whitelistedIps.has(ip) || isPrivateIp(ip);
  }
  
  /**
   * Check if IP is blacklisted
   * 
   * @param ip IP address
   * @returns Whether IP is blacklisted
   */
  private isIpBlacklisted(ip: string): boolean {
    return this.blacklistedIps.has(ip);
  }
  
  /**
   * Check if user agent is a good bot
   * 
   * @param userAgent User agent string
   * @returns Whether it's a good bot
   */
  private isGoodBot(userAgent?: string): boolean {
    if (!userAgent) {
      return false;
    }
    
    return this.goodBots.some(pattern => pattern.test(userAgent));
  }
  
  /**
   * Check if user agent is a bad bot
   * 
   * @param userAgent User agent string
   * @returns Whether it's a bad bot
   */
  private isBadBot(userAgent?: string): boolean {
    if (!userAgent) {
      return true; // Missing user agent is suspicious
    }
    
    return this.badBots.some(pattern => pattern.test(userAgent));
  }
  
  /**
   * Get role weight (lower = more privileged)
   * 
   * @param role User role
   * @returns Role weight
   */
  private getRoleWeight(role: string): number {
    const lowercaseRole = role.toLowerCase();
    
    return ROLE_WEIGHTS[lowercaseRole] || 10;
  }
  
  /**
   * Extract API key from request
   * 
   * @param req Express request
   * @returns API key or undefined
   */
  private extractApiKey(req: Request): string | undefined {
    // Check authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check query param
    if (req.query.api_key) {
      return String(req.query.api_key);
    }
    
    // Check other common names
    if (req.query.apikey) {
      return String(req.query.apikey);
    }
    
    if (req.query.key) {
      return String(req.query.key);
    }
    
    // Check body
    if (req.body && (req.body.api_key || req.body.apikey || req.body.key)) {
      return String(req.body.api_key || req.body.apikey || req.body.key);
    }
    
    return undefined;
  }
  
  /**
   * Get resource info from request
   * 
   * @param req Express request
   * @returns Resource type and sensitivity
   */
  private getResourceInfo(req: Request): { resourceType: string; resourceSensitivity: number } {
    const path = req.path.toLowerCase();
    
    // Check resource-intensive paths
    for (const { pattern, sensitivity } of this.resourceIntensivePaths) {
      if (pattern.test(path)) {
        const match = pattern.exec(path);
        const resourceType = match ? match[0].replace(/^\/api\//, '') : 'unknown';
        
        return {
          resourceType,
          resourceSensitivity: sensitivity
        };
      }
    }
    
    // Default categorization by path segments
    if (path.includes('/api/')) {
      const segments = path.split('/').filter(Boolean);
      const resourceType = segments.length > 1 ? segments[1] : 'api';
      
      let resourceSensitivity = 2;
      
      if (path.includes('/admin')) {
        resourceSensitivity = 5;
      } else if (path.includes('/auth') || path.includes('/security')) {
        resourceSensitivity = 5;
      } else if (path.includes('/user') || path.includes('/account')) {
        resourceSensitivity = 4;
      }
      
      return { resourceType, resourceSensitivity };
    }
    
    // Static assets
    if (path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return { resourceType: 'static', resourceSensitivity: 1 };
    }
    
    // Default
    return { resourceType: 'web', resourceSensitivity: 2 };
  }
  
  /**
   * Generate unique identifier for rate limiting
   * 
   * @param req Express request
   * @param ip Client IP
   * @param userId User ID
   * @param apiKey API key
   * @returns Unique identifier
   */
  private generateIdentifier(
    req: Request,
    ip: string,
    userId?: string | number,
    apiKey?: string
  ): string {
    // If API key is provided, use that
    if (apiKey) {
      return `api:${apiKey}`;
    }
    
    // If authenticated, use user ID
    if (userId) {
      return `user:${userId}`;
    }
    
    // Otherwise, use IP
    return `ip:${ip}`;
  }
  
  /**
   * Add IP to whitelist
   * 
   * @param ip IP address
   */
  public whitelistIp(ip: string): void {
    this.whitelistedIps.add(ip);
    this.blacklistedIps.delete(ip); // Remove from blacklist if present
    
    log(`Added IP ${ip} to rate limit whitelist`, 'security');
  }
  
  /**
   * Remove IP from whitelist
   * 
   * @param ip IP address
   */
  public unwhitelistIp(ip: string): void {
    this.whitelistedIps.delete(ip);
    
    log(`Removed IP ${ip} from rate limit whitelist`, 'security');
  }
  
  /**
   * Add IP to blacklist
   * 
   * @param ip IP address
   */
  public blacklistIp(ip: string): void {
    this.blacklistedIps.add(ip);
    this.whitelistedIps.delete(ip); // Remove from whitelist if present
    
    log(`Added IP ${ip} to rate limit blacklist`, 'security');
  }
  
  /**
   * Remove IP from blacklist
   * 
   * @param ip IP address
   */
  public unblacklistIp(ip: string): void {
    this.blacklistedIps.delete(ip);
    
    log(`Removed IP ${ip} from rate limit blacklist`, 'security');
  }
  
  /**
   * Get whitelisted IPs
   * 
   * @returns Array of whitelisted IPs
   */
  public getWhitelistedIps(): string[] {
    return Array.from(this.whitelistedIps);
  }
  
  /**
   * Get blacklisted IPs
   * 
   * @returns Array of blacklisted IPs
   */
  public getBlacklistedIps(): string[] {
    return Array.from(this.blacklistedIps);
  }
}