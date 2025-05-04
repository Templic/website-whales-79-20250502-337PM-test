/**
 * Vite Exempt Middleware
 * 
 * This middleware intercepts requests to Vite development resources and bypasses
 * CSRF protection for these resources. This ensures the frontend works properly
 * in development mode.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * A comprehensive set of patterns that identify Vite development resources
 */
const VITE_PATH_PATTERNS = [
  /^\/@vite\//,       // Vite internal modules
  /^\/@vite$/,        // Vite client entry
  /^\/@vite-client/,  // Vite client
  /^\/@react-refresh/, // React refresh runtime
  /^\/@fs\//,         // Vite file system access
  /^\/node_modules\//, // Node modules accessed by Vite
  /^\/src\//,         // Source files loaded by Vite
  /^\/assets\//,      // Assets loaded by Vite
  /^\/\?t=/,          // Timestamp query parameter often used by Vite
  /^\/favicon\.ico$/  // Favicon requests
];

/**
 * Check if a path matches any of the Vite resource patterns
 */
export function isViteResource(path: string): boolean {
  return VITE_PATH_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Middleware that exempts Vite resources from subsequent security middlewares
 */
export function viteExemptMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'production') {
    // Skip in production mode
    return next();
  }

  // Check if this is a Vite resource request
  if (isViteResource(req.path)) {
    // Set a flag to indicate this is a Vite resource
    (req as any).__isViteResource = true;
    console.log('[vite] Exempting Vite resource from security checks:', req.path);
  }

  next();
}

/**
 * Middleware that completely skips CSRF checks for Vite resources
 */
export function viteSkipCSRFMiddleware(req: Request, res: Response, next: NextFunction): void {
  // If this is a Vite resource, skip to the next middleware
  if ((req as any).__isViteResource) {
    return next();
  }

  // Otherwise, continue with CSRF protection
  next();
}

export default viteExemptMiddleware;