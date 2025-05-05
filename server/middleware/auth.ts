/**
 * Authentication Middleware
 * 
 * This module provides middleware for ensuring users are authenticated
 * and authorized to access protected resources.
 */

import { Request, Response, NextFunction } from 'express';
import { immutableSecurityLogs as securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';

/**
 * Ensure user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Log unauthorized access attempt
  securityBlockchain.recordEvent({
    severity: SecurityEventSeverity.MEDIUM,
    category: SecurityEventCategory.AUTHORIZATION,
    title: 'Unauthorized Access Attempt',
    description: `Unauthorized attempt to access protected resource: ${req.originalUrl}`,
    sourceIp: req.ip,
    action: 'ACCESS_DENIED',
    resource: req.originalUrl,
    timestamp: new Date()
  });
  
  res.status(401).json({ 
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource' 
  });
}

/**
 * Legacy alias for isAuthenticated for backward compatibility
 */
export const requireAuth = isAuthenticated;

/**
 * Ensure user has admin role
 */
export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource' 
    });
    return;
  }
  
  // In a real app, we would check if the user has the admin role
  // For now, we'll assume all authenticated users are admins
  // Example check: if (req.user?.role !== 'admin')
  
  next();
}

/**
 * Ensure user has a specific role
 */
export function requireSpecificRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource' 
      });
      return;
    }
    
    // @ts-ignore - Accessing user.role
    const userRole = req.user?.role;
    
    // Check if user has the required role
    if (userRole !== role) {
      securityBlockchain.recordEvent({
        severity: SecurityEventSeverity.MEDIUM,
        category: SecurityEventCategory.AUTHORIZATION,
        title: 'Insufficient Permissions',
        description: `User tried to access resource requiring '${role}' role: ${req.originalUrl}`,
        sourceIp: req.ip,
        action: 'ACCESS_DENIED',
        userId: req.user?.id as string,
        resource: req.originalUrl,
        timestamp: new Date()
      });
      
      res.status(403).json({ 
        error: 'Forbidden',
        message: `You do not have the required role (${role}) to access this resource` 
      });
      return;
    }
    
    next();
  };
}

/**
 * Legacy alias for requireSpecificRole for backward compatibility
 */
export const requireRole = requireSpecificRole;

/**
 * For development only: bypass authentication for testing
 */
export function devBypassAuth(req: Request, res: Response, next: NextFunction): void {
  // This should ONLY be used in development
  if (process.env.NODE_ENV !== 'production') {
    // Set dummy user for development testing
    // @ts-ignore - Setting dummy user
    req.isAuthenticated = () => true;
    // @ts-ignore - Setting dummy user
    req.user = {
      id: 'dev-user-1',
      username: 'admin',
      role: 'admin'
    };
  }
  
  next();
}