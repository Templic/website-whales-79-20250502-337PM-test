/**
 * Rate Limit Context Builder
 *
 * This class builds contextual information from HTTP requests
 * to inform context-aware rate limiting decisions.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp, isPrivateIp } from '../../../utils/ip-utils';
import { threatDetectionService } from './ThreatDetectionService';

// Context-aware rate limiting data
export interface RateLimitContext {
  // Basic request metadata
  ip: string;
  identifier: string;
  method: string;
  path: string;
  userAgent?: string;
  
  // User and role
  userId?: string | number;
  userRole?: string;
  authenticated: boolean;
  roleWeight: number; // Lower = higher privilege
  
  // Resource type and sensitivity
  resourceType: string;
  resourceId?: string;
  resourceSensitivity: number; // Higher = more sensitive
  
  // Security context
  threatLevel: number;
  riskLevel: number; // Computed risk score
  isBlacklisted: boolean;
  isGoodBot: boolean;
  isBadBot: boolean;
  
  // Request specifics
  contentLength: number;
  hasAttachments: boolean;
  isWrite: boolean; // POST, PUT, DELETE
  isRead: boolean; // GET
}

export class RateLimitContextBuilder {
  private blacklistedIPs: Set<string> = new Set();
  private whitelistedIPs: Set<string> = new Set();
  private resourceTypePatterns: Map<RegExp, string> = new Map();
  private sensitiveEndpoints: Map<RegExp, number> = new Map();
  private goodBotPatterns: RegExp[] = [];
  private badBotPatterns: RegExp[] = [];
  
  constructor() {
    // Initialize resource type patterns
    this.initializeResourceTypePatterns();
    
    // Initialize sensitive endpoints
    this.initializeSensitiveEndpoints();
    
    // Initialize bot detection
    this.initializeBotPatterns();
    
    // Add well-known whitelisted IPs (monitoring, etc.)
    this.whitelistedIPs.add('127.0.0.1');
  }
  
  /**
   * Build context from a request
   * 
   * @param req Express request
   * @returns Context for rate limiting
   */
  public buildContext(req: Request): RateLimitContext {
    try {
      // Get client IP
      const ip = getClientIp(req);
      
      // Check if IP is blacklisted
      const isBlacklisted = this.blacklistedIPs.has(ip);
      
      // Check if IP is whitelisted
      const isWhitelisted = this.whitelistedIPs.has(ip) || isPrivateIp(ip);
      
      // Get user agent
      const userAgent = req.headers['user-agent'] || '';
      
      // Determine if this is a bot based on user agent
      const isGoodBot = this.isGoodBot(userAgent);
      const isBadBot = this.isBadBot(userAgent);
      
      // Determine if the user is authenticated
      const authenticated = !!req.session?.userId || !!req.headers.authorization;
      
      // Try to get user ID from session or request
      const userId = this.extractUserId(req);
      
      // Try to get user role from session or request
      const userRole = this.extractUserRole(req);
      
      // Calculate role weight (lower = higher privilege)
      const roleWeight = this.calculateRoleWeight(userRole, authenticated, isWhitelisted);
      
      // Determine resource type
      const resourceType = this.determineResourceType(req.path);
      
      // Determine resource ID (if applicable)
      const resourceId = this.extractResourceId(req.path);
      
      // Determine resource sensitivity
      const resourceSensitivity = this.determineResourceSensitivity(req.path, req.method);
      
      // Get request-specific data
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      const hasAttachments = this.hasAttachments(req);
      const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const isRead = req.method === 'GET';
      
      // Create identifier (IP-based if not authenticated, user-based if authenticated)
      const identifier = userId ? `user:${userId}` : `ip:${ip}`;
      
      // Get threat level from threat detection service
      const threatLevel = threatDetectionService.getThreatLevel(req, ip, userId);
      
      // Calculate overall risk level based on various factors
      const riskLevel = this.calculateRiskLevel({
        authenticated,
        roleWeight,
        resourceSensitivity,
        isWrite,
        contentLength,
        hasAttachments,
        threatLevel,
        isBlacklisted,
        isBadBot
      });
      
      // Build and return context
      return {
        ip,
        identifier,
        method: req.method,
        path: req.path,
        userAgent: userAgent || undefined,
        userId,
        userRole,
        authenticated,
        roleWeight,
        resourceType,
        resourceId,
        resourceSensitivity,
        threatLevel,
        riskLevel,
        isBlacklisted,
        isGoodBot,
        isBadBot,
        contentLength,
        hasAttachments,
        isWrite,
        isRead
      };
    } catch (error) {
      // Log the error
      log(`Error building rate limit context: ${error}`, 'security');
      
      // Return a minimal context (fail safe)
      const ip = getClientIp(req);
      return {
        ip,
        identifier: `ip:${ip}`,
        method: req.method,
        path: req.path,
        authenticated: false,
        roleWeight: 2.0, // Default to anonymous
        resourceType: 'unknown',
        resourceSensitivity: 1.0, // Default to moderate
        threatLevel: 0,
        riskLevel: 0.5, // Default to medium
        isBlacklisted: false,
        isGoodBot: false,
        isBadBot: false,
        contentLength: 0,
        hasAttachments: false,
        isWrite: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
        isRead: req.method === 'GET'
      };
    }
  }
  
  /**
   * Calculate the cost of a request based on context
   * 
   * @param req Express request
   * @param context Context for rate limiting
   * @returns Cost of the request in tokens
   */
  public calculateRequestCost(req: Request, context: RateLimitContext): number {
    try {
      // Base cost
      let cost = 1;
      
      // Adjust cost based on method
      if (context.isWrite) {
        // Write operations are more expensive
        cost += 1;
        
        // Write operations with content are even more expensive
        if (context.contentLength > 0) {
          // Add cost for every 10 KB of content
          cost += Math.ceil(context.contentLength / (10 * 1024));
        }
        
        // Attachments are expensive
        if (context.hasAttachments) {
          cost += 5;
        }
      }
      
      // Adjust cost based on resource sensitivity
      if (context.resourceSensitivity > 1.0) {
        cost = Math.ceil(cost * context.resourceSensitivity);
      }
      
      // Adjust cost based on threat level
      if (context.threatLevel > 0.5) {
        cost = Math.ceil(cost * (1 + context.threatLevel));
      }
      
      // Adjust cost based on risk level
      if (context.riskLevel > 0.5) {
        cost = Math.ceil(cost * (1 + context.riskLevel * 0.5));
      }
      
      // Cap cost at 20 tokens per request
      return Math.min(20, cost);
    } catch (error) {
      // Log the error
      log(`Error calculating request cost: ${error}`, 'security');
      
      // Default to 1 token
      return 1;
    }
  }
  
  /**
   * Add an IP address to the blacklist
   * 
   * @param ip IP address to blacklist
   */
  public blacklistIp(ip: string): void {
    this.blacklistedIPs.add(ip);
    log(`IP ${ip} blacklisted`, 'security');
  }
  
  /**
   * Remove an IP address from the blacklist
   * 
   * @param ip IP address to unblacklist
   */
  public unblacklistIp(ip: string): void {
    this.blacklistedIPs.delete(ip);
    log(`IP ${ip} removed from blacklist`, 'security');
  }
  
  /**
   * Add an IP address to the whitelist
   * 
   * @param ip IP address to whitelist
   */
  public whitelistIp(ip: string): void {
    this.whitelistedIPs.add(ip);
    log(`IP ${ip} whitelisted`, 'security');
  }
  
  /**
   * Remove an IP address from the whitelist
   * 
   * @param ip IP address to unwhitelist
   */
  public unwhitelistIp(ip: string): void {
    this.whitelistedIPs.delete(ip);
    log(`IP ${ip} removed from whitelist`, 'security');
  }
  
  /**
   * Initialize resource type patterns
   */
  private initializeResourceTypePatterns(): void {
    // Auth-related endpoints
    this.resourceTypePatterns.set(/^\/api\/auth\/?.*$/, 'auth');
    
    // Admin-related endpoints
    this.resourceTypePatterns.set(/^\/api\/admin\/?.*$/, 'admin');
    
    // User-related endpoints
    this.resourceTypePatterns.set(/^\/api\/users\/?.*$/, 'user');
    
    // Content-related endpoints
    this.resourceTypePatterns.set(/^\/api\/content\/?.*$/, 'content');
    
    // Media-related endpoints
    this.resourceTypePatterns.set(/^\/api\/media\/?.*$/, 'media');
    
    // Security-related endpoints
    this.resourceTypePatterns.set(/^\/api\/security\/?.*$/, 'security');
    
    // API endpoints
    this.resourceTypePatterns.set(/^\/api\/?.*$/, 'api');
    
    // Static assets
    this.resourceTypePatterns.set(/^\/assets\/?.*$/, 'asset');
    this.resourceTypePatterns.set(/^\/static\/?.*$/, 'static');
    
    // Public pages
    this.resourceTypePatterns.set(/^\/pages\/?.*$/, 'page');
    
    // Catch-all for anything else
    this.resourceTypePatterns.set(/^\/.*$/, 'web');
  }
  
  /**
   * Initialize sensitive endpoints
   */
  private initializeSensitiveEndpoints(): void {
    // Authentication endpoints (very sensitive)
    this.sensitiveEndpoints.set(/^\/api\/auth\/login$/, 3.0);
    this.sensitiveEndpoints.set(/^\/api\/auth\/register$/, 3.0);
    this.sensitiveEndpoints.set(/^\/api\/auth\/reset-password$/, 4.0);
    this.sensitiveEndpoints.set(/^\/api\/auth\/change-password$/, 4.0);
    
    // Admin endpoints (very sensitive)
    this.sensitiveEndpoints.set(/^\/api\/admin\/?.*$/, 3.5);
    this.sensitiveEndpoints.set(/^\/api\/admin\/users\/?.*$/, 4.0);
    this.sensitiveEndpoints.set(/^\/api\/admin\/settings\/?.*$/, 3.5);
    
    // User endpoints (somewhat sensitive)
    this.sensitiveEndpoints.set(/^\/api\/users\/?.*$/, 2.5);
    this.sensitiveEndpoints.set(/^\/api\/users\/\d+\/.*$/, 3.0);
    
    // Security-related endpoints (somewhat sensitive)
    this.sensitiveEndpoints.set(/^\/api\/security\/?.*$/, 2.5);
    
    // API endpoints (moderate sensitivity)
    this.sensitiveEndpoints.set(/^\/api\/?.*$/, 1.5);
    
    // Everything else (low sensitivity)
    this.sensitiveEndpoints.set(/^\/.*$/, 1.0);
  }
  
  /**
   * Initialize bot detection patterns
   */
  private initializeBotPatterns(): void {
    // Good bots
    this.goodBotPatterns = [
      /googlebot/i,
      /bingbot/i,
      /yandexbot/i,
      /uptimerobot/i,
      /pingdom/i,
      /healthchecks\.io/i
    ];
    
    // Bad bots
    this.badBotPatterns = [
      /zh_cn/i,
      /zh-cn/i,
      /zgrab/i,
      /semrush/i,
      /ahrefsbot/i,
      /mj12bot/i,
      /dotbot/i,
      /scrapy/i,
      /phantomjs/i,
      /headless/i,
      /curl/i,
      /wget/i,
      /python-requests/i
    ];
  }
  
  /**
   * Check if a user agent is a good bot
   * 
   * @param userAgent User agent string
   * @returns True if the user agent is a good bot
   */
  private isGoodBot(userAgent: string): boolean {
    return this.goodBotPatterns.some(pattern => pattern.test(userAgent));
  }
  
  /**
   * Check if a user agent is a bad bot
   * 
   * @param userAgent User agent string
   * @returns True if the user agent is a bad bot
   */
  private isBadBot(userAgent: string): boolean {
    return this.badBotPatterns.some(pattern => pattern.test(userAgent));
  }
  
  /**
   * Extract user ID from request
   * 
   * @param req Express request
   * @returns User ID or undefined
   */
  private extractUserId(req: Request): string | number | undefined {
    try {
      // Try to get from session
      if (req.session && 'userId' in req.session) {
        return req.session.userId;
      }
      
      // Try to get from auth header (JWT)
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          // Note: This is a simplified approach; in a real app you would
          // use a proper JWT library to decode and verify the token.
          try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            if (payload && payload.userId) {
              return payload.userId;
            }
          } catch (e) {
            // Ignore token parsing errors
          }
        }
      }
      
      // Try to get from query parameter (not recommended, but some APIs do this)
      if (req.query && req.query.userId) {
        return req.query.userId as string;
      }
      
      // Try to get from authenticated user object
      if (req.user && 'id' in req.user) {
        return req.user.id;
      }
      
      // No user ID found
      return undefined;
    } catch (error) {
      // Log the error
      log(`Error extracting user ID: ${error}`, 'security');
      
      // Return undefined
      return undefined;
    }
  }
  
  /**
   * Extract user role from request
   * 
   * @param req Express request
   * @returns User role or undefined
   */
  private extractUserRole(req: Request): string | undefined {
    try {
      // Try to get from session
      if (req.session && 'userRole' in req.session) {
        return req.session.userRole as string;
      }
      
      // Try to get from auth header (JWT)
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            if (payload && payload.role) {
              return payload.role;
            }
          } catch (e) {
            // Ignore token parsing errors
          }
        }
      }
      
      // Try to get from authenticated user object
      if (req.user && 'role' in req.user) {
        return req.user.role as string;
      }
      
      // No user role found
      return undefined;
    } catch (error) {
      // Log the error
      log(`Error extracting user role: ${error}`, 'security');
      
      // Return undefined
      return undefined;
    }
  }
  
  /**
   * Calculate role weight (lower = higher privilege)
   * 
   * @param role User role
   * @param authenticated Whether the user is authenticated
   * @param isWhitelisted Whether the IP is whitelisted
   * @returns Role weight
   */
  private calculateRoleWeight(
    role?: string,
    authenticated: boolean = false,
    isWhitelisted: boolean = false
  ): number {
    // Whitelisted IPs have highest privilege
    if (isWhitelisted) {
      return 0.1;
    }
    
    // Not authenticated = lowest privilege
    if (!authenticated) {
      return 2.0;
    }
    
    // Role-based weights
    if (role) {
      switch (role.toLowerCase()) {
        case 'admin':
        case 'administrator':
          return 0.2;
        case 'moderator':
        case 'editor':
          return 0.4;
        case 'staff':
        case 'employee':
          return 0.6;
        case 'premium':
        case 'paid':
          return 0.8;
        default:
          // Regular authenticated user
          return 1.0;
      }
    }
    
    // Default for authenticated users without a specific role
    return 1.0;
  }
  
  /**
   * Determine resource type from path
   * 
   * @param path Request path
   * @returns Resource type
   */
  private determineResourceType(path: string): string {
    for (const [pattern, type] of this.resourceTypePatterns.entries()) {
      if (pattern.test(path)) {
        return type;
      }
    }
    
    // Default to 'web' if no patterns match
    return 'web';
  }
  
  /**
   * Extract resource ID from path
   * 
   * @param path Request path
   * @returns Resource ID or undefined
   */
  private extractResourceId(path: string): string | undefined {
    try {
      // Try to extract ID from API paths like /api/users/123
      const match = path.match(/\/api\/\w+\/([^\/]+)/);
      
      // Return the ID if found
      if (match && match[1] && !isNaN(parseInt(match[1], 10))) {
        return match[1];
      }
      
      // Try to extract UUID
      const uuidMatch = path.match(/\/api\/\w+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      
      // Return the UUID if found
      if (uuidMatch && uuidMatch[1]) {
        return uuidMatch[1];
      }
      
      // No resource ID found
      return undefined;
    } catch (error) {
      // Log the error
      log(`Error extracting resource ID: ${error}`, 'security');
      
      // Return undefined
      return undefined;
    }
  }
  
  /**
   * Determine resource sensitivity from path and method
   * 
   * @param path Request path
   * @param method HTTP method
   * @returns Resource sensitivity
   */
  private determineResourceSensitivity(path: string, method: string): number {
    // Start with a base sensitivity of 1.0
    let sensitivity = 1.0;
    
    // Find the highest matching sensitivity from the patterns
    for (const [pattern, value] of this.sensitiveEndpoints.entries()) {
      if (pattern.test(path)) {
        sensitivity = Math.max(sensitivity, value);
      }
    }
    
    // Adjust sensitivity based on method
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      sensitivity *= 1.5; // Write operations are more sensitive
    } else if (method === 'DELETE') {
      sensitivity *= 2.0; // Delete operations are very sensitive
    }
    
    return sensitivity;
  }
  
  /**
   * Check if a request has file attachments
   * 
   * @param req Express request
   * @returns True if the request has file attachments
   */
  private hasAttachments(req: Request): boolean {
    // Check for multipart/form-data content type
    const contentType = req.headers['content-type'] || '';
    
    // Check for file uploads
    return (
      contentType.includes('multipart/form-data') ||
      !!(req.files && Object.keys(req.files).length > 0)
    );
  }
  
  /**
   * Calculate risk level based on context
   * 
   * @param params Context parameters
   * @returns Risk level (0-1)
   */
  private calculateRiskLevel(params: {
    authenticated: boolean;
    roleWeight: number;
    resourceSensitivity: number;
    isWrite: boolean;
    contentLength: number;
    hasAttachments: boolean;
    threatLevel: number;
    isBlacklisted: boolean;
    isBadBot: boolean;
  }): number {
    let risk = 0;
    
    // Blacklisted IPs have maximum risk
    if (params.isBlacklisted) {
      return 1.0;
    }
    
    // Bad bots have very high risk
    if (params.isBadBot) {
      risk += 0.8;
    }
    
    // Threat level directly contributes to risk
    risk += params.threatLevel;
    
    // Unauthenticated users have higher risk
    if (!params.authenticated) {
      risk += 0.2;
    }
    
    // Higher role weight (lower privilege) means higher risk
    risk += params.roleWeight * 0.1;
    
    // Higher resource sensitivity means higher risk
    risk += (params.resourceSensitivity - 1.0) * 0.1;
    
    // Write operations are riskier
    if (params.isWrite) {
      risk += 0.1;
    }
    
    // Large requests are riskier
    if (params.contentLength > 10 * 1024) { // 10 KB
      risk += 0.1;
    }
    
    // File uploads are riskier
    if (params.hasAttachments) {
      risk += 0.2;
    }
    
    // Clamp risk to [0, 1]
    return Math.max(0, Math.min(1, risk));
  }
}