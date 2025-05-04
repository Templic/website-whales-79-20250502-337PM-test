/**
 * Rate Limit Context Builder
 *
 * This class is responsible for building the context information for each request,
 * which is used by the context-aware rate limiter to make intelligent limiting decisions.
 */

import { Request } from 'express';
import { ThreatDetectionService } from './ThreatDetectionService';
import { securityConfig } from '../../config/SecurityConfig';

// Define the shape of the rate limit context
export interface RateLimitContext {
  identifier: string;
  ip: string;
  userId?: string | number;
  userRole?: string;
  path: string;
  method: string;
  timestamp: number;
  resourceType: string;
  resourceSensitivity: number;
  systemLoad: number;
  threatLevel: number;
  requestSize: number;
  authenticated: boolean;
  userAgent?: string;
  referer?: string;
  origin?: string;
  customData?: Record<string, any>;
}

export class RateLimitContextBuilder {
  private threatDetectionService: ThreatDetectionService;
  
  constructor() {
    this.threatDetectionService = new ThreatDetectionService();
  }
  
  /**
   * Build a comprehensive context object from the request
   * 
   * @param req The Express request object
   * @returns A context object with all relevant information
   */
  public buildContext(req: Request): RateLimitContext {
    // Get the identifier (IP or user ID)
    const ip = this.getClientIp(req);
    const userId = this.getUserId(req);
    let identifier = userId ? `user:${userId}` : `ip:${ip}`;
    
    // For authenticated users, we can use a combined identifier that includes both user ID and IP
    if (userId) {
      identifier = `user:${userId}:${ip}`;
    }
    
    // Determine resource sensitivity based on the path
    const resourceType = this.determineResourceType(req.path);
    const resourceSensitivity = this.determineResourceSensitivity(resourceType, req.method);
    
    // Get system metrics
    const systemLoad = this.getSystemLoad();
    
    // Check threat level for this request/user
    const threatLevel = this.threatDetectionService.getThreatLevel(req, ip, userId);
    
    // Build the context object
    const context: RateLimitContext = {
      identifier,
      ip,
      userId: userId,
      userRole: this.getUserRole(req),
      path: req.path,
      method: req.method,
      timestamp: Date.now(),
      resourceType,
      resourceSensitivity,
      systemLoad,
      threatLevel,
      requestSize: this.calculateRequestSize(req),
      authenticated: !!userId,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      origin: req.headers.origin as string,
      customData: {}
    };
    
    return context;
  }
  
  /**
   * Calculate the cost of a request based on its context
   * 
   * @param req The Express request object
   * @param context The rate limit context
   * @returns The cost of the request (higher for more expensive operations)
   */
  public calculateRequestCost(req: Request, context: RateLimitContext): number {
    // Base cost for any request
    let cost = 1;
    
    // Adjust cost based on request method
    // Read operations are cheaper than write operations
    switch (req.method) {
      case 'GET':
      case 'HEAD':
        // Read operations are baseline cost
        break;
      case 'POST':
        // Creating new resources is moderately expensive
        cost *= 2;
        break;
      case 'PUT':
      case 'PATCH':
        // Updating resources is moderately expensive
        cost *= 1.5;
        break;
      case 'DELETE':
        // Deleting resources is expensive
        cost *= 3;
        break;
      default:
        // Other methods get baseline cost
        break;
    }
    
    // Adjust cost based on resource sensitivity
    cost *= (1 + context.resourceSensitivity * 0.5);
    
    // Adjust based on threat level
    if (context.threatLevel > 0) {
      // Exponentially increase cost as threat level increases
      cost *= (1 + Math.pow(context.threatLevel, 2));
    }
    
    // Adjust based on system load
    if (context.systemLoad > 0.7) {
      // Increase cost when system is under heavy load
      cost *= (1 + (context.systemLoad - 0.7) * 2);
    }
    
    // Adjust based on request size (for large uploads or payloads)
    if (context.requestSize > 10240) { // 10KB
      // Increase cost for large requests
      cost *= (1 + Math.min(context.requestSize / 102400, 5)); // Cap at 5x multiplier
    }
    
    // Authenticated users get a slight discount
    if (context.authenticated) {
      // 10% discount for authenticated users
      cost *= 0.9;
      
      // Further adjust based on user role
      if (context.userRole === 'admin') {
        // Admins get a further discount
        cost *= 0.8;
      }
    }
    
    // Ensure the cost is always at least 1
    return Math.max(1, cost);
  }
  
  /**
   * Get the client IP address from the request
   * 
   * @param req The Express request object
   * @returns The client IP address
   */
  private getClientIp(req: Request): string {
    // Check X-Forwarded-For header (when behind a proxy)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Extract the first IP in the list
      const ips = Array.isArray(forwardedFor) 
        ? forwardedFor[0] 
        : forwardedFor.split(',')[0].trim();
      return ips;
    }
    
    // If no X-Forwarded-For, use the remote address
    const remoteAddress = req.socket.remoteAddress;
    return remoteAddress || '0.0.0.0';
  }
  
  /**
   * Get the user ID from the request, if authenticated
   * 
   * @param req The Express request object
   * @returns The user ID or undefined
   */
  private getUserId(req: Request): string | number | undefined {
    // Check if user is authenticated and has an ID
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      return req.user.id;
    }
    
    // Check session for user ID
    if (req.session && req.session.userId) {
      return req.session.userId;
    }
    
    return undefined;
  }
  
  /**
   * Get the user role from the request, if authenticated
   * 
   * @param req The Express request object
   * @returns The user role or undefined
   */
  private getUserRole(req: Request): string | undefined {
    // Check if user is authenticated and has a role
    if (req.user && typeof req.user === 'object') {
      if ('role' in req.user) {
        return req.user.role as string;
      }
      
      if ('isAdmin' in req.user && req.user.isAdmin) {
        return 'admin';
      }
      
      return 'user';
    }
    
    return undefined;
  }
  
  /**
   * Determine the resource type based on the path
   * 
   * @param path The request path
   * @returns The resource type
   */
  private determineResourceType(path: string): string {
    // Extract resource type from the path
    if (path.startsWith('/api/auth')) {
      return 'auth';
    } else if (path.startsWith('/api/admin')) {
      return 'admin';
    } else if (path.startsWith('/api/security')) {
      return 'security';
    } else if (path.startsWith('/api/users')) {
      return 'users';
    } else if (path.startsWith('/api/content')) {
      return 'content';
    } else if (path.startsWith('/api/media')) {
      return 'media';
    } else if (path.startsWith('/api')) {
      return 'api';
    }
    
    return 'public';
  }
  
  /**
   * Determine the sensitivity level of a resource
   * 
   * @param resourceType The type of resource
   * @param method The HTTP method
   * @returns A sensitivity rating from 0 to 1
   */
  private determineResourceSensitivity(resourceType: string, method: string): number {
    // Different resource types have different sensitivity levels
    switch (resourceType) {
      case 'auth':
        return 0.9; // Authentication endpoints are highly sensitive
      case 'admin':
        return 0.8; // Admin endpoints are very sensitive
      case 'security':
        return 0.7; // Security endpoints are sensitive
      case 'users':
        return 0.6; // User data is moderately sensitive
      case 'content':
        return 0.4; // Content is less sensitive
      case 'media':
        return 0.3; // Media is less sensitive
      case 'api':
        return 0.5; // General API endpoints
      case 'public':
        return 0.1; // Public resources are least sensitive
      default:
        return 0.2;
    }
  }
  
  /**
   * Get the current system load
   * 
   * @returns A value between 0 and 1 representing system load
   */
  private getSystemLoad(): number {
    // In a real implementation, this would get the actual system load
    // For now, we'll use a simple random value weighted towards lower values
    // In production, this should be replaced with actual system metrics
    
    // Check if we have real metrics from the system monitor
    if (global.systemMetrics && typeof global.systemMetrics.cpuUsage === 'number') {
      return global.systemMetrics.cpuUsage / 100;
    }
    
    // Fallback to a random value
    return Math.pow(Math.random(), 2) * 0.7; // Weighted towards lower values
  }
  
  /**
   * Calculate the approximate size of the request
   * 
   * @param req The Express request object
   * @returns The size of the request in bytes
   */
  private calculateRequestSize(req: Request): number {
    // Start with the approximate size of the headers
    let size = JSON.stringify(req.headers).length;
    
    // Add the size of the URL path and query string
    size += req.url.length;
    
    // Add the size of the body, if available
    if (req.body && typeof req.body === 'object') {
      size += JSON.stringify(req.body).length;
    }
    
    // Add the size of any uploaded files
    if (req.files && typeof req.files === 'object') {
      // Handle Express FileUpload
      const files = req.files;
      if (files) {
        Object.keys(files).forEach(key => {
          const file = files[key];
          if (Array.isArray(file)) {
            file.forEach(f => {
              if (f.size) size += f.size;
            });
          } else {
            if (file.size) size += file.size;
          }
        });
      }
    }
    
    return size;
  }
}