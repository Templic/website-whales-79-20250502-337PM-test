import { Request } from "express";

/**
 * Utility functions for authentication and authorization
 */

/**
 * Check if a user is authenticated
 * @param req Express Request object
 * @returns boolean indicating if user is authenticated
 */
export function isUserAuthenticated(req: Request): boolean {
  return typeof req.isAuthenticated === 'function' && req.isAuthenticated();
}

/**
 * Check if a user has admin privileges (admin or super_admin role)
 * @param req Express Request object
 * @returns boolean indicating if user has admin privileges
 */
export function hasAdminPrivileges(req: Request): boolean {
  return isUserAuthenticated(req) && 
         (req.user?.role === 'admin' || req.user?.role === 'super_admin');
}

/**
 * Check if a user has super admin privileges
 * @param req Express Request object
 * @returns boolean indicating if user has super admin privileges
 */
export function hasSuperAdminPrivileges(req: Request): boolean {
  return isUserAuthenticated(req) && req.user?.role === 'super_admin';
}

/**
 * Check if a user is the author of a resource or has admin privileges
 * @param req Express Request object
 * @param authorId The ID of the author of the resource
 * @returns boolean indicating if user is author or has admin privileges
 */
export function isAuthorOrAdmin(req: Request, authorId: string | number): boolean {
  if (!isUserAuthenticated(req)) {
    return false;
  }
  
  // Convert both to strings for comparison to handle numeric and string IDs
  const isAuthor = req.user?.id?.toString() === authorId?.toString();
  
  return isAuthor || hasAdminPrivileges(req);
}

/**
 * Get the role of the current user
 * @param req Express Request object
 * @returns The user's role or null if not authenticated
 */
export function getUserRole(req: Request): 'user' | 'admin' | 'super_admin' | null {
  if (!isUserAuthenticated(req) || !req.user?.role) {
    return null;
  }
  
  // Ensure role is one of the expected values
  const role = req.user.role;
  if (role === 'user' || role === 'admin' || role === 'super_admin') {
    return role;
  }
  
  return null;
}