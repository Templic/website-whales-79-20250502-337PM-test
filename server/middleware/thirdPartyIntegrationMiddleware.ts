/**
 * Third-Party Integration Middleware
 * 
 * This middleware facilitates seamless integration with third-party services by:
 * 1. Adding appropriate CORS headers for trusted domains
 * 2. Providing special handling for embedded content
 * 3. Supporting cross-origin requests for specific services
 */

import { Request, Response, NextFunction } from 'express';

// List of trusted third-party domains that we integrate with
const TRUSTED_DOMAINS = [
  'taskade.com',
  'app.taskade.com',
  'www.taskade.com',
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'ytimg.com',
  'maps.google.com',
  'maps.googleapis.com',
  'googleapis.com',
  'googleusercontent.com',
  'openai.com',
  'api.openai.com',
  'stripe.com',
  'js.stripe.com',
  'checkout.stripe.com',
  'doubleclick.net',
  'googletagmanager.com'
];

/**
 * Middleware to enable CORS for cross-origin embedding scenarios
 */
export function thirdPartyIntegrationMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  // For preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // For Taskade-specific paths
  if (
    req.path.includes('taskade') || 
    req.path.includes('/widget/') || 
    req.path.includes('/embed/')
  ) {
    console.log(`[Third-Party] Allowing embedding for Taskade integration: ${req.path}`);
    
    // Enable content embedding across origins
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // X-Frame-Options for embedding
    res.removeHeader('X-Frame-Options');
    res.header('X-Frame-Options', 'ALLOWALL');
    
    // Content Security Policy for embedding
    res.removeHeader('Content-Security-Policy');
    res.header(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors *;"
    );
  }
  
  // For trusted domains
  else if (origin && TRUSTED_DOMAINS.some(domain => origin.includes(domain))) {
    console.log(`[Third-Party] Allowing cross-origin request from trusted domain: ${origin}`);
    
    // Set permissive headers for trusted domains
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Allow embedding in iframes from trusted domains
    res.removeHeader('X-Frame-Options');
    
    // Adjust CSP for trusted domains
    const csp = `default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors ${origin};`;
    res.removeHeader('Content-Security-Policy');
    res.header('Content-Security-Policy', csp);
  }
  
  next();
}

/**
 * Special handling for Taskade widget and embedded content
 */
export function taskadeIntegrationMiddleware(req: Request, res: Response, next: NextFunction) {
  if (
    req.path === '/taskade-widget.js' ||
    req.path.startsWith('/taskade/') ||
    req.path.startsWith('/taskade-embed/')
  ) {
    console.log(`[Taskade] Special handling for Taskade content: ${req.path}`);
    
    // Maximum permissive headers for Taskade content
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    
    // Allow in iframe
    res.removeHeader('X-Frame-Options');
    
    // Clear CSP to allow all content
    res.removeHeader('Content-Security-Policy');
    res.header(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors *; connect-src *;"
    );
  }
  
  next();
}