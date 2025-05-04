/**
 * Authentication Middleware
 * 
 * Provides authentication middleware for securing routes
 * and validating user sessions.
 */

import { Request, Response, NextFunction } from 'express';

// Environment-specific configuration
const TEST_MODE = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const TEST_AUTH_SECRET = 'test-security-analysis-secret-key';

/**
 * Middleware to verify if a user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check for test authentication header in development
  if (TEST_MODE && req.headers['x-test-auth'] === TEST_AUTH_SECRET) {
    // Add a test user for development/testing
    (req as any).user = {
      id: 'test-user-id',
      username: 'test-user',
      role: 'tester',
      email: 'test@example.com'
    };
    console.log('[AUTH DEBUG] Test authentication bypass activated');
    return next();
  }

  // Normal authentication check
  if (!(req as any).user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  next();
}

/**
 * Middleware to verify if a user has admin role
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Must be authenticated first
  if (!(req as any).user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check for admin role
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  next();
}

/**
 * Middleware to verify that the user has one of the specified roles
 */
export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Must be authenticated first
    if (!(req as any).user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has any of the required roles
    const userRole = (req as any).user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Required role not found. Must have one of: ${roles.join(', ')}`
      });
    }

    next();
  };
}