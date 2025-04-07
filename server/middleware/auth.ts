/**
 * Authentication middleware for Express applications.
 * 
 * This middleware provides functions to verify authentication and role-based access.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated through Passport
  if (req.isAuthenticated()) {
    return next();
  }
  
  // User is not authenticated, return 401 Unauthorized
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

/**
 * Middleware to ensure user has completed 2FA if required
 */
export const require2FAComplete = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated but has pending 2FA
  if (req.session.twoFactorAuth?.twoFactorPending) {
    return res.status(403).json({
      success: false,
      message: 'Two-factor authentication required'
    });
  }
  
  // Either 2FA is not required, or it's been completed
  return next();
};

/**
 * Middleware to ensure user has the specified role
 * @param requiredRole The role required to access the resource
 */
export const requireRole = (requiredRole: 'user' | 'admin' | 'super_admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check that 2FA is complete if required
    if (req.session.twoFactorAuth?.twoFactorPending) {
      return res.status(403).json({
        success: false,
        message: 'Two-factor authentication required'
      });
    }
    
    // Get user from request (added by Passport)
    const user = req.user as { role: string };
    
    // Define role hierarchy for authorization checks
    const roleHierarchy = {
      'user': 0,
      'admin': 1,
      'super_admin': 2
    };
    
    // Check if user's role meets the required level
    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];
    
    if (userRoleLevel >= requiredRoleLevel) {
      return next();
    }
    
    // User doesn't have the required role
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  };
};

/**
 * Middleware to check if user is authenticated (without returning an error)
 * Useful for routes that can work with or without authentication
 */
export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  // Add isAuthenticated property to res.locals for use in routes
  res.locals.isAuthenticated = req.isAuthenticated();
  
  // Add user info to res.locals if authenticated
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  
  next();
};