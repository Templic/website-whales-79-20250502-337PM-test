import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if a user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated through session
  if (req.session && req.session.user) {
    return next();
  }

  // User is not authenticated
  return res.status(401).json({
    status: 'error',
    message: 'Authentication required'
  });
}

/**
 * Middleware to check if a user has admin role
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // First check if the user is authenticated
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  // Then check if user has admin role
  if (req.session.user.role === 'admin' || req.session.user.role === 'super_admin') {
    return next();
  }

  // User does not have admin privileges
  return res.status(403).json({
    status: 'error',
    message: 'Admin privileges required'
  });
}

/**
 * Middleware to check if a user has super admin role
 */
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  // First check if the user is authenticated
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  // Then check if user has super admin role
  if (req.session.user.role === 'super_admin') {
    return next();
  }

  // User does not have super admin privileges
  return res.status(403).json({
    status: 'error',
    message: 'Super admin privileges required'
  });
}

/**
 * Middleware to check if a user has a specific role
 */
export function hasRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if the user is authenticated
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userRole = req.session.user.role;
    
    // Check if user has one of the specified roles
    if (Array.isArray(role)) {
      if (role.includes(userRole)) {
        return next();
      }
    } else {
      // Check for a single role
      if (userRole === role) {
        return next();
      }
      
      // Special case: super_admin can access any role
      if (userRole === 'super_admin') {
        return next();
      }
    }

    // User does not have the required role
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: insufficient privileges'
    });
  };
}

/**
 * Helper function to check if a user has super admin privileges
 */
export function hasSuperAdminPrivileges(req: Request): boolean {
  return !!(req.session && 
           req.session.user && 
           req.session.user.role === 'super_admin');
}

/**
 * Helper to get current authenticated user from request
 */
export function getCurrentUser(req: Request) {
  if (req.session && req.session.user) {
    return req.session.user;
  }
  return null;
}