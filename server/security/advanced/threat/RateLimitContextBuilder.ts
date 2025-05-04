/**
 * Rate Limit Context Builder
 *
 * This module builds context objects for rate limiting decisions.
 * It extracts information from requests to make informed decisions.
 */

import { Request } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp, getIpSubnet } from '../../../utils/ip-utils';
import { threatDetectionService } from './ThreatDetectionService';

/**
 * Rate limit context
 */
export interface RateLimitContext {
  /**
   * IP address of the client
   */
  ip: string;
  
  /**
   * IP subnet (for rate limiting by network)
   */
  subnet: string;
  
  /**
   * User ID (if authenticated)
   */
  userId?: string | number;
  
  /**
   * User role (if authenticated)
   */
  role?: string;
  
  /**
   * User role weight (lower = more privileged)
   */
  roleWeight: number;
  
  /**
   * Session ID (if available)
   */
  sessionId?: string;
  
  /**
   * Unique identifier for this client
   */
  identifier: string;
  
  /**
   * Whether the user is authenticated
   */
  authenticated: boolean;
  
  /**
   * User agent from request
   */
  userAgent?: string;
  
  /**
   * Resource type being accessed
   */
  resourceType: string;
  
  /**
   * Resource sensitivity (1-5)
   */
  resourceSensitivity: number;
  
  /**
   * Method cost multiplier (GET=1, POST=2, etc.)
   */
  methodCost: number;
  
  /**
   * Content size cost factor
   */
  contentSizeFactor: number;
  
  /**
   * Whether the IP is blacklisted
   */
  isBlacklisted: boolean;
  
  /**
   * Whether the request is from a known good bot
   */
  isGoodBot: boolean;
  
  /**
   * Whether the request is from a known bad bot
   */
  isBadBot: boolean;
  
  /**
   * Request path
   */
  path: string;
  
  /**
   * Request method
   */
  method: string;
  
  /**
   * Threat level (0-1)
   */
  threatLevel: number;
  
  /**
   * API key (if applicable)
   */
  apiKey?: string;
  
  /**
   * Additional metadata
   */
  metadata: Record<string, any>;
}

/**
 * Configuration for the context builder
 */
export interface RateLimitContextBuilderConfig {
  /**
   * Whitelisted IPs (no rate limiting)
   */
  whitelistedIps?: string[];
  
  /**
   * Blacklisted IPs (always rate limited)
   */
  blacklistedIps?: string[];
  
  /**
   * Good bot user agent patterns
   */
  goodBots?: string[];
  
  /**
   * Bad bot user agent patterns
   */
  badBots?: string[];
  
  /**
   * Resource types and their sensitivity (1-5)
   */
  resourceTypes?: Record<string, number>;
}

/**
 * Builds rate limit contexts from requests
 */
export class RateLimitContextBuilder {
  private config: RateLimitContextBuilderConfig;
  
  constructor(config: RateLimitContextBuilderConfig = {}) {
    this.config = {
      whitelistedIps: config.whitelistedIps || [],
      blacklistedIps: config.blacklistedIps || [],
      goodBots: config.goodBots || [
        'googlebot',
        'bingbot',
        'yandexbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'pingdom',
        'uptimerobot'
      ],
      badBots: config.badBots || [
        'spam',
        'scrap',
        'crawl',
        'httrack',
        'grabber',
        'libwww',
        'wget',
        'python-requests'
      ],
      resourceTypes: config.resourceTypes || {
        'auth': 5,      // Authentication endpoints
        'admin': 5,     // Admin endpoints
        'security': 5,  // Security endpoints
        'user': 4,      // User data endpoints
        'api': 3,       // General API endpoints
        'static': 1,    // Static assets
        'public': 1     // Public endpoints
      }
    };
  }
  
  /**
   * Build a rate limit context from a request
   * 
   * @param req Express request
   * @returns Rate limit context
   */
  public buildContext(req: Request): RateLimitContext {
    try {
      // Get IP address
      const ip = getClientIp(req);
      
      // Get IP subnet
      const subnet = getIpSubnet(ip);
      
      // Get user ID from session
      const userId = req.session?.userId;
      
      // Get session ID
      const sessionId = req.session?.id;
      
      // Get user agent
      const userAgent = req.headers['user-agent'] as string;
      
      // Check if authenticated
      const authenticated = Boolean(userId);
      
      // Determine role and role weight
      const role = req.session?.role || 'guest';
      const roleWeight = this.getRoleWeight(role);
      
      // Get request path and method
      const path = req.path;
      const method = req.method;
      
      // Determine resource type
      const resourceType = this.determineResourceType(path);
      
      // Get resource sensitivity
      const resourceSensitivity = this.config.resourceTypes![resourceType] || 3;
      
      // Calculate method cost
      const methodCost = this.getMethodCost(method);
      
      // Calculate content size factor
      const contentSizeFactor = this.getContentSizeFactor(req);
      
      // Check if blacklisted
      const isBlacklisted = this.config.blacklistedIps!.includes(ip);
      
      // Check if bot
      const isGoodBot = this.isGoodBot(userAgent);
      const isBadBot = this.isBadBot(userAgent);
      
      // Get threat level
      const threatLevel = threatDetectionService.getThreatLevel(req, ip, userId);
      
      // Get API key
      const apiKey = (req.headers['x-api-key'] || req.query.api_key) as string;
      
      // Create identifier
      const identifier = userId ? `user:${userId}` : `ip:${ip}`;
      
      // Build context
      return {
        ip,
        subnet,
        userId,
        role,
        roleWeight,
        sessionId,
        identifier,
        authenticated,
        userAgent,
        resourceType,
        resourceSensitivity,
        methodCost,
        contentSizeFactor,
        isBlacklisted,
        isGoodBot,
        isBadBot,
        path,
        method,
        threatLevel,
        apiKey,
        metadata: {}
      };
    } catch (error) {
      log(`Error building rate limit context: ${error}`, 'security');
      
      // Return a default context
      return {
        ip: '0.0.0.0',
        subnet: '0.0.0.0',
        identifier: 'error',
        authenticated: false,
        roleWeight: 10,
        resourceType: 'error',
        resourceSensitivity: 3,
        methodCost: 1,
        contentSizeFactor: 1,
        isBlacklisted: false,
        isGoodBot: false,
        isBadBot: false,
        path: '/',
        method: 'GET',
        threatLevel: 0,
        metadata: {}
      };
    }
  }
  
  /**
   * Calculate request cost based on context
   * 
   * @param req Express request
   * @param context Rate limit context
   * @returns Cost in tokens
   */
  public calculateRequestCost(req: Request, context: RateLimitContext): number {
    try {
      // Base cost is 1 token
      let cost = 1;
      
      // Adjust for method
      cost *= context.methodCost;
      
      // Adjust for resource sensitivity
      cost *= Math.max(1, context.resourceSensitivity / 3);
      
      // Adjust for content size
      cost *= context.contentSizeFactor;
      
      // Adjust for threat level
      cost *= (1 + context.threatLevel * 2);
      
      // Reduce for authenticated users (except POST/PUT/DELETE)
      if (context.authenticated && !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        cost *= 0.8;
      }
      
      // Check for bulk operations
      const bulkCount = this.getBulkCount(req);
      if (bulkCount > 1) {
        // Each bulk item adds 50% of base cost
        cost += (bulkCount - 1) * (cost * 0.5);
      }
      
      // Check for search operations
      if (req.query.q || req.query.search || req.query.filter) {
        // Search operations are more expensive
        cost *= 1.5;
      }
      
      // Return the cost (minimum of 1)
      return Math.max(1, Math.ceil(cost));
    } catch (error) {
      log(`Error calculating request cost: ${error}`, 'security');
      
      // Return default cost
      return 1;
    }
  }
  
  /**
   * Determine resource type from path
   * 
   * @param path Request path
   * @returns Resource type
   */
  private determineResourceType(path: string): string {
    // Auth endpoints
    if (path.includes('/auth') || path.includes('/login') || path.includes('/logout') || path.includes('/register')) {
      return 'auth';
    }
    
    // Admin endpoints
    if (path.includes('/admin')) {
      return 'admin';
    }
    
    // Security endpoints
    if (path.includes('/security')) {
      return 'security';
    }
    
    // User endpoints
    if (path.includes('/user') || path.includes('/profile') || path.includes('/account')) {
      return 'user';
    }
    
    // Static assets
    if (
      path.includes('/static') || 
      path.includes('/assets') ||
      path.includes('/css') ||
      path.includes('/js') ||
      path.includes('/img') ||
      path.includes('/fonts') ||
      path.endsWith('.js') ||
      path.endsWith('.css') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.svg') ||
      path.endsWith('.ico')
    ) {
      return 'static';
    }
    
    // API endpoints
    if (path.includes('/api')) {
      return 'api';
    }
    
    // Default to public
    return 'public';
  }
  
  /**
   * Get method cost
   * 
   * @param method HTTP method
   * @returns Cost multiplier
   */
  private getMethodCost(method: string): number {
    switch (method.toUpperCase()) {
      case 'GET':
        return 1.0;
      case 'HEAD':
        return 0.5;
      case 'OPTIONS':
        return 0.5;
      case 'POST':
        return 2.0;
      case 'PUT':
        return 2.0;
      case 'PATCH':
        return 1.5;
      case 'DELETE':
        return 3.0;
      default:
        return 1.0;
    }
  }
  
  /**
   * Get content size factor
   * 
   * @param req Express request
   * @returns Size factor
   */
  private getContentSizeFactor(req: Request): number {
    try {
      // Get content size
      const contentLength = parseInt(req.headers['content-length'] as string, 10) || 0;
      
      // Calculate factor
      if (contentLength === 0) {
        return 1.0;
      } else if (contentLength < 1024) {
        return 1.0;
      } else if (contentLength < 10 * 1024) {
        return 1.2;
      } else if (contentLength < 100 * 1024) {
        return 1.5;
      } else if (contentLength < 1024 * 1024) {
        return 2.0;
      } else {
        return 3.0;
      }
    } catch (error) {
      log(`Error calculating content size factor: ${error}`, 'security');
      
      return 1.0;
    }
  }
  
  /**
   * Get role weight
   * 
   * @param role User role
   * @returns Role weight (lower = more privileged)
   */
  private getRoleWeight(role: string): number {
    switch (role.toLowerCase()) {
      case 'admin':
        return 1;
      case 'moderator':
        return 3;
      case 'staff':
        return 5;
      case 'premium':
        return 7;
      case 'user':
        return 8;
      case 'guest':
      default:
        return 10;
    }
  }
  
  /**
   * Check if request is from a good bot
   * 
   * @param userAgent User agent string
   * @returns Whether it's a good bot
   */
  private isGoodBot(userAgent?: string): boolean {
    if (!userAgent) {
      return false;
    }
    
    const lowercaseUserAgent = userAgent.toLowerCase();
    
    return this.config.goodBots!.some(bot => lowercaseUserAgent.includes(bot));
  }
  
  /**
   * Check if request is from a bad bot
   * 
   * @param userAgent User agent string
   * @returns Whether it's a bad bot
   */
  private isBadBot(userAgent?: string): boolean {
    if (!userAgent) {
      return false;
    }
    
    const lowercaseUserAgent = userAgent.toLowerCase();
    
    return this.config.badBots!.some(bot => lowercaseUserAgent.includes(bot));
  }
  
  /**
   * Get number of bulk items in request
   * 
   * @param req Express request
   * @returns Number of bulk items
   */
  private getBulkCount(req: Request): number {
    try {
      // Check for bulk operations in request body
      if (req.body) {
        // Check for arrays in common fields
        const fields = ['items', 'data', 'records', 'entities', 'objects', 'documents'];
        
        for (const field of fields) {
          if (Array.isArray(req.body[field])) {
            return req.body[field].length;
          }
        }
        
        // Check if the body itself is an array
        if (Array.isArray(req.body)) {
          return req.body.length;
        }
      }
      
      // No bulk operations found
      return 1;
    } catch (error) {
      log(`Error getting bulk count: ${error}`, 'security');
      
      return 1;
    }
  }
}