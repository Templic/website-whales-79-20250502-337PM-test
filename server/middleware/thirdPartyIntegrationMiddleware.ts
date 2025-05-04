/**
 * Third-Party Integration Middleware
 * 
 * This middleware facilitates integration with third-party services by:
 * 1. Modifying security headers to allow embedding of third-party content
 * 2. Setting CORS headers appropriately for third-party services
 * 3. Handling preflight requests for third-party integrations
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Check if the request is for a third-party resource
 */
function isThirdPartyIntegration(path: string): boolean {
  return path.includes('/integrations/') || 
         path.includes('/api/external/') || 
         path.includes('/api/taskade/') ||
         path.includes('/api/youtube/') ||
         path.includes('/api/maps/') ||
         path.includes('/api/openai/') ||
         path.includes('/taskade-embed') ||
         path.startsWith('/taskade-');
}

/**
 * Check if the request is specifically for Taskade integration
 */
function isTaskadeIntegration(path: string): boolean {
  return path.includes('/taskade/') || 
         path.includes('/api/taskade/') ||
         path.includes('taskade.com') ||
         path.includes('/taskade-embed') ||
         path.startsWith('/taskade-');
}

/**
 * Middleware to support third-party integrations
 * This sets appropriate headers for all third-party integrations
 */
export function thirdPartyIntegrationMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isThirdPartyIntegration(req.path)) {
    console.log(`[Integration] Setting third-party integration headers for: ${req.path}`);
    
    // Remove restrictive headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    
    // Set permissive CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
}

/**
 * Specific middleware for Taskade integration
 * Sets headers required specifically for Taskade embedding
 */
export function taskadeIntegrationMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isTaskadeIntegration(req.path)) {
    console.log(`[Taskade] Setting Taskade-specific headers for: ${req.path}`);
    
    // Remove frame restrictions
    res.removeHeader('X-Frame-Options');
    
    // Set a permissive Content-Security-Policy specifically for Taskade
    res.header(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.taskade.com https://assets.taskade.com; " +
      "style-src 'self' 'unsafe-inline' https://*.taskade.com; " +
      "img-src 'self' data: blob: https://*.taskade.com; " +
      "connect-src 'self' https://*.taskade.com wss://*.taskade.com; " +
      "font-src 'self' data: https://*.taskade.com; " +
      "frame-src 'self' https://*.taskade.com https://www.taskade.com; " +
      "worker-src 'self' blob: https://*.taskade.com; " +
      "frame-ancestors 'self' *;"
    );
    
    // Set additional headers to help with Taskade embedding
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  }
  
  next();
}