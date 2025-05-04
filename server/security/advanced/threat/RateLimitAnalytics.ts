/**
 * Rate Limit Analytics
 *
 * This module tracks and analyzes rate limiting events.
 * It provides insights into rate limiting patterns and adjustments.
 */

import { Request, Response } from 'express';
import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';

/**
 * Rate limit event
 */
interface RateLimitEvent {
  /**
   * Timestamp of event
   */
  timestamp: number;
  
  /**
   * Client IP
   */
  ip: string;
  
  /**
   * User ID (if available)
   */
  userId?: string | number;
  
  /**
   * Request path
   */
  path: string;
  
  /**
   * HTTP method
   */
  method: string;
  
  /**
   * Resource type
   */
  resourceType: string;
  
  /**
   * Resource sensitivity
   */
  resourceSensitivity: number;
  
  /**
   * Whether user is authenticated
   */
  authenticated: boolean;
  
  /**
   * Rate limiter type
   */
  limiterType: string;
  
  /**
   * Tokens consumed
   */
  tokens: number;
  
  /**
   * Effective capacity
   */
  capacity: number;
  
  /**
   * Retry after (ms)
   */
  retryAfter: number;
  
  /**
   * User agent
   */
  userAgent?: string;
}

/**
 * Configuration for analytics
 */
export interface RateLimitAnalyticsConfig {
  /**
   * Time window for tracking (ms)
   */
  timeWindow?: number;
  
  /**
   * Report interval (ms)
   */
  reportInterval?: number;
  
  /**
   * Maximum events to store
   */
  maxEvents?: number;
}

/**
 * Analytics for rate limiting
 */
export class RateLimitAnalytics {
  // Configuration
  private config: Required<RateLimitAnalyticsConfig>;
  
  // Rate limit events
  private limitEvents: RateLimitEvent[] = [];
  
  // Request statistics
  private requestCounts: Record<string, number> = {};
  private requestCountsByPath: Record<string, number> = {};
  private requestCountsByMethod: Record<string, number> = {};
  private tokenCounts: Record<string, number> = {};
  
  // Reporting interval
  private reportInterval: NodeJS.Timeout | null = null;
  
  constructor(config: RateLimitAnalyticsConfig = {}) {
    // Set configuration with defaults
    this.config = {
      timeWindow: config.timeWindow || 60 * 60 * 1000, // 1 hour
      reportInterval: config.reportInterval || 15 * 60 * 1000, // 15 minutes
      maxEvents: config.maxEvents || 1000
    };
    
    // Start reporting interval
    if (this.config.reportInterval > 0) {
      this.reportInterval = setInterval(() => {
        this.generateReport();
      }, this.config.reportInterval);
    }
    
    log('Rate limit analytics initialized', 'security');
  }
  
  /**
   * Record a rate-limited request
   * 
   * @param req Express request
   * @param res Express response
   * @param context Rate limit context
   * @param tokens Tokens consumed
   * @param capacity Effective capacity
   * @param retryAfter Retry after time (ms)
   */
  public recordLimit(
    req: Request,
    res: Response,
    context: RateLimitContext,
    tokens: number,
    capacity: number,
    retryAfter: number
  ): void {
    try {
      // Create event
      const event: RateLimitEvent = {
        timestamp: Date.now(),
        ip: context.ip,
        userId: context.userId,
        path: req.path,
        method: req.method,
        resourceType: context.resourceType,
        resourceSensitivity: context.resourceSensitivity,
        authenticated: context.authenticated,
        limiterType: this.getLimiterType(req.path),
        tokens,
        capacity,
        retryAfter,
        userAgent: req.headers['user-agent'] as string
      };
      
      // Add to events
      this.limitEvents.push(event);
      
      // Update request counts
      const key = this.getClientKey(context);
      this.requestCounts[key] = (this.requestCounts[key] || 0) + 1;
      this.tokenCounts[key] = (this.tokenCounts[key] || 0) + tokens;
      
      // Update path and method counts
      this.requestCountsByPath[req.path] = (this.requestCountsByPath[req.path] || 0) + 1;
      this.requestCountsByMethod[req.method] = (this.requestCountsByMethod[req.method] || 0) + 1;
      
      // Trim events if needed
      if (this.limitEvents.length > this.config.maxEvents) {
        this.limitEvents = this.limitEvents.slice(-this.config.maxEvents);
      }
      
      // Clean up old events
      this.cleanupOldEvents();
    } catch (error) {
      log(`Error recording rate limit: ${error}`, 'error');
    }
  }
  
  /**
   * Record a successful (non-limited) request
   * 
   * @param req Express request
   * @param context Rate limit context
   */
  public recordPass(req: Request, context: RateLimitContext): void {
    try {
      // Update request counts (just for tracking successful requests)
      const key = this.getClientKey(context);
      this.requestCounts[key] = (this.requestCounts[key] || 0) + 1;
      
      // Update path and method counts
      this.requestCountsByPath[req.path] = (this.requestCountsByPath[req.path] || 0) + 1;
      this.requestCountsByMethod[req.method] = (this.requestCountsByMethod[req.method] || 0) + 1;
    } catch (error) {
      log(`Error recording rate limit pass: ${error}`, 'error');
    }
  }
  
  /**
   * Get client key for tracking
   * 
   * @param context Rate limit context
   * @returns Client key
   */
  private getClientKey(context: RateLimitContext): string {
    // Use identifier from context if available
    if (context.identifier) {
      return context.identifier;
    }
    
    // Otherwise, use userId or IP
    return context.userId ? `user:${context.userId}` : `ip:${context.ip}`;
  }
  
  /**
   * Get limiter type based on path
   * 
   * @param path Request path
   * @returns Limiter type
   */
  private getLimiterType(path: string): string {
    const lcPath = path.toLowerCase();
    
    if (lcPath.includes('/api/auth') || lcPath.includes('/login') || lcPath.includes('/logout')) {
      return 'auth';
    }
    
    if (lcPath.includes('/api/admin') || lcPath.includes('/admin')) {
      return 'admin';
    }
    
    if (lcPath.includes('/api/security') || lcPath.includes('/security')) {
      return 'security';
    }
    
    if (lcPath.includes('/api/')) {
      return 'api';
    }
    
    if (
      lcPath === '/' || 
      lcPath.includes('/public') || 
      lcPath.includes('/static') || 
      lcPath.includes('/assets')
    ) {
      return 'public';
    }
    
    return 'global';
  }
  
  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Filter events
      this.limitEvents = this.limitEvents.filter(
        event => now - event.timestamp < this.config.timeWindow
      );
    } catch (error) {
      log(`Error cleaning up old rate limit events: ${error}`, 'error');
    }
  }
  
  /**
   * Generate analytics report
   * 
   * @returns Analytics report
   */
  public generateReport(): any {
    try {
      // Clean up old events
      this.cleanupOldEvents();
      
      // Get current time window
      const now = Date.now();
      const timeWindow = this.config.timeWindow;
      const timeWindowStart = now - timeWindow;
      
      // Filter recent events
      const recentEvents = this.limitEvents.filter(
        event => event.timestamp >= timeWindowStart
      );
      
      // Count events by client
      const clientCounts: Record<string, number> = {};
      const clientOverLimit: Record<string, { count: number; lastEvent: RateLimitEvent }> = {};
      
      // Get average retry after
      let totalRetryAfter = 0;
      let maxRetryAfter = 0;
      
      // Process events
      for (const event of recentEvents) {
        // Client key is either user ID or IP
        const key = event.userId ? `user:${event.userId}` : `ip:${event.ip}`;
        
        // Count per client
        clientCounts[key] = (clientCounts[key] || 0) + 1;
        
        // If client has multiple events, track as potentially over limit
        if (clientCounts[key] > 3) {
          if (!clientOverLimit[key] || event.timestamp > clientOverLimit[key].lastEvent.timestamp) {
            clientOverLimit[key] = {
              count: clientCounts[key],
              lastEvent: event
            };
          }
        }
        
        // Track retry after
        totalRetryAfter += event.retryAfter;
        if (event.retryAfter > maxRetryAfter) {
          maxRetryAfter = event.retryAfter;
        }
      }
      
      // Calculate averages
      const avgRetryAfter = recentEvents.length > 0 ? totalRetryAfter / recentEvents.length : 0;
      
      // Get most rate-limited paths
      const pathCounts: Record<string, number> = {};
      for (const event of recentEvents) {
        pathCounts[event.path] = (pathCounts[event.path] || 0) + 1;
      }
      
      // Sort paths by count
      const sortedPaths = Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      // Generate report
      const report = {
        timeWindow: this.config.timeWindow / 1000, // seconds
        totalEvents: recentEvents.length,
        uniqueClients: Object.keys(clientCounts).length,
        topClients: Object.entries(clientCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key, count]) => ({ key, count })),
        potentialAbusers: Object.entries(clientOverLimit)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([key, data]) => ({
            key,
            count: data.count,
            lastPath: data.lastEvent.path,
            lastMethod: data.lastEvent.method,
            lastTimestamp: new Date(data.lastEvent.timestamp).toISOString()
          })),
        topPaths: sortedPaths.map(([path, count]) => ({ path, count })),
        avgRetryAfter: avgRetryAfter / 1000, // seconds
        maxRetryAfter: maxRetryAfter / 1000, // seconds
        timestamp: new Date().toISOString()
      };
      
      // Log report
      log(`Rate limit analytics report generated: ${recentEvents.length} events in the last ${this.config.timeWindow / 60000} minutes`, 'info');
      
      return report;
    } catch (error) {
      log(`Error generating rate limit analytics report: ${error}`, 'error');
      
      return {
        error: 'Failed to generate report',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get recent rate limit events
   * 
   * @param limit Max events to return
   * @returns Recent events
   */
  public getRecentEvents(limit = 100): RateLimitEvent[] {
    try {
      // Limit number of events
      return this.limitEvents.slice(-limit);
    } catch (error) {
      log(`Error getting recent rate limit events: ${error}`, 'error');
      
      return [];
    }
  }
  
  /**
   * Get events for a specific client
   * 
   * @param clientKey Client key (user ID or IP)
   * @param limit Max events to return
   * @returns Client events
   */
  public getClientEvents(clientKey: string, limit = 50): RateLimitEvent[] {
    try {
      // Filter and limit events
      return this.limitEvents
        .filter(event => {
          if (clientKey.startsWith('user:')) {
            const userId = clientKey.substring(5);
            return event.userId?.toString() === userId;
          } else if (clientKey.startsWith('ip:')) {
            const ip = clientKey.substring(3);
            return event.ip === ip;
          }
          return false;
        })
        .slice(-limit);
    } catch (error) {
      log(`Error getting client rate limit events: ${error}`, 'error');
      
      return [];
    }
  }
  
  /**
   * Get top rate-limited paths
   * 
   * @param limit Max paths to return
   * @returns Top paths
   */
  public getTopLimitedPaths(limit = 10): { path: string; count: number }[] {
    try {
      // Count events by path
      const pathCounts: Record<string, number> = {};
      
      for (const event of this.limitEvents) {
        pathCounts[event.path] = (pathCounts[event.path] || 0) + 1;
      }
      
      // Sort and limit results
      return Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([path, count]) => ({ path, count }));
    } catch (error) {
      log(`Error getting top rate-limited paths: ${error}`, 'error');
      
      return [];
    }
  }
  
  /**
   * Get top rate-limited clients
   * 
   * @param limit Max clients to return
   * @returns Top clients
   */
  public getTopLimitedClients(limit = 10): { key: string; count: number }[] {
    try {
      // Count events by client
      const clientCounts: Record<string, number> = {};
      
      for (const event of this.limitEvents) {
        const key = event.userId ? `user:${event.userId}` : `ip:${event.ip}`;
        clientCounts[key] = (clientCounts[key] || 0) + 1;
      }
      
      // Sort and limit results
      return Object.entries(clientCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([key, count]) => ({ key, count }));
    } catch (error) {
      log(`Error getting top rate-limited clients: ${error}`, 'error');
      
      return [];
    }
  }
  
  /**
   * Dispose of analytics
   */
  public dispose(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }
}