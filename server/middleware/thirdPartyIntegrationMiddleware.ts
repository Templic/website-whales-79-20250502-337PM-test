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
         path.startsWith('/taskade-') ||
         path.includes('/a/embed/') ||
         path.includes('/a/agent/') ||
         path.includes('/a/widget/') ||
         path.includes('/a/chat/') ||
         path.includes('/agent-widget') ||
         path.includes('.taskade.com');
}

/**
 * Check if the request is specifically for Taskade integration
 */
function isTaskadeIntegration(path: string): boolean {
  return path.includes('/taskade/') || 
         path.includes('/api/taskade/') ||
         path.includes('taskade.com') ||
         path.includes('/taskade-embed') ||
         path.startsWith('/taskade-') ||
         path.includes('/a/embed/') ||
         path.includes('/a/agent/') ||
         path.includes('/a/widget/') ||
         path.includes('/a/chat/') ||
         path.includes('/agent-widget');
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
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Set permissive security headers for embedded content
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
    
    // Performance optimizations for third-party content
    // Cache static resources for 5 minutes, dynamic content for 1 minute
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?.*)?$/i)) {
      res.header('Cache-Control', 'public, max-age=300');  // 5 minutes for static resources
    } else {
      res.header('Cache-Control', 'public, max-age=60');  // 1 minute for dynamic content
    }
    
    // Set flag for CSRF bypass for all third-party integrations
    (req as any).__skipCSRF = true;
    
    // Handle preflight requests efficiently
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
    res.removeHeader('Content-Security-Policy');
    
    // Set a permissive Content-Security-Policy specifically for Taskade
    // This CSP is configured for all possible Taskade integration scenarios
    res.header(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval'; " +
      "script-src * 'unsafe-inline' 'unsafe-eval' https://*.taskade.com https://assets.taskade.com https://www.taskade.com; " +
      "style-src * 'unsafe-inline' https://*.taskade.com; " +
      "img-src * data: blob: https://*.taskade.com; " +
      "connect-src * https://*.taskade.com wss://*.taskade.com; " +
      "font-src * data: https://*.taskade.com; " +
      "frame-src * https://*.taskade.com https://www.taskade.com; " +
      "worker-src * blob: https://*.taskade.com; " +
      "frame-ancestors * https://*.taskade.com;"
    );
    
    // Set all required headers for Taskade embedding (based on Taskade docs)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
    
    // Performance optimizations for Taskade
    res.header('Cache-Control', 'public, max-age=60');  // Cache for 60 seconds
    
    // Set flag for CSRF bypass
    (req as any).__skipCSRF = true;
    
    // Handle preflight requests efficiently
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
}