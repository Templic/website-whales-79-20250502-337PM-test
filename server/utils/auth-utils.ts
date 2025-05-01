/**
 * Authentication Utilities
 * 
 * Centralized utilities for authentication and authorization.
 * These functions should be used across the application to ensure
 * consistent authentication behavior.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  UserRole, 
  roleHierarchy, 
  authErrorMessages 
} from './auth-config';
import { logSecurityEvent } from '../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() && !req.user) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.WARNING,
      message: 'Unauthenticated access attempt',
      data: {
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });
    
    res.status(401).json({ error: authErrorMessages.unauthorized });
    return;
  }
  
  next();
}

/**
 * Checks if the user has required role or higher
 */
export function hasRole(requiredRole: UserRole = UserRole.USER) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // First check if user is authenticated
    if (!req.isAuthenticated() && !req.user) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHORIZATION,
        severity: SecurityEventSeverity.WARNING,
        message: 'Unauthenticated role access attempt',
        data: {
          requiredRole,
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      });
      
      res.status(401).json({ error: authErrorMessages.unauthorized });
      return;
    }
    
    const userRole = req.user?.role as UserRole || UserRole.USER;
    const userRoleLevel = roleHierarchy[userRole];
    const requiredRoleLevel = roleHierarchy[requiredRole];
    
    if (userRoleLevel < requiredRoleLevel) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHORIZATION,
        severity: SecurityEventSeverity.WARNING,
        message: 'Insufficient privileges',
        data: {
          userRole,
          requiredRole,
          userId: req.user?.id,
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      });
      
      res.status(403).json({ error: authErrorMessages.forbidden });
      return;
    }
    
    next();
  };
}

/**
 * Shorthand middlewares for common role checks
 */
export const isUser = hasRole(UserRole.USER);
export const isAdmin = hasRole(UserRole.ADMIN);
export const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);

/**
 * Helper function to check if user has admin privileges (admin or super_admin)
 */
export function hasAdminPrivileges(req: Request): boolean {
  if (!req.isAuthenticated() && !req.user) return false;
  
  const userRole = req.user?.role as UserRole || UserRole.USER;
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
}

/**
 * Helper function to check if user has super admin privileges
 */
export function hasSuperAdminPrivileges(req: Request): boolean {
  if (!req.isAuthenticated() && !req.user) return false;
  
  const userRole = req.user?.role as UserRole || UserRole.USER;
  return userRole === UserRole.SUPER_ADMIN;
}

/**
 * Creates an appropriate error response based on authentication/authorization status
 */
export function createAuthErrorResponse(req: Request): { statusCode: number; message: string } {
  if (!req.isAuthenticated() && !req.user) {
    return {
      statusCode: 401,
      message: authErrorMessages.unauthorized
    };
  }
  
  return {
    statusCode: 403,
    message: authErrorMessages.forbidden
  };
}

/**
 * Helper function to validate JWT token
 */
export function validateJwtToken(token: string): Promise<any> {
  // Implement JWT validation logic here
  // This would typically verify the token signature, expiry, etc.
  return Promise.resolve(null); // Placeholder - replace with actual implementation
}

/**
 * Helper function to get user info from JWT token
 */
export function getUserFromToken(token: string): Promise<any> {
  // Extract user info from verified JWT token
  return Promise.resolve(null); // Placeholder - replace with actual implementation
}