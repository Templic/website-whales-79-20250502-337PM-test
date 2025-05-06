/**
 * Demo Routes CSRF Exemption Configuration
 * 
 * This file defines routes that should be exempt from CSRF protection
 * specifically for demonstration purposes. These routes should generally
 * not modify state and are used for showcasing UI components and functionality.
 */

// Export the list of demo routes that should be exempt from CSRF protection
export const DEMO_EXEMPT_ROUTES = [
  // Demo pages for UI components and features
  '/header-demo',
  '/components',
  '/cosmic-components',
  '/test/cosmic',
  '/dynamic-content-demo',
  '/test/audio',
  '/responsive-demo',
  '/responsive-demo2',
  '/content-ai-demo',
  '/content-recommendations-demo',
  '/performance'
];

// Export a middleware that can be used to exempt routes from CSRF protection
export function exemptDemoRoutes(req: any, res: any, next: any) {
  // Check if the current path should be exempt from CSRF protection
  if (DEMO_EXEMPT_ROUTES.some(route => req.path === route)) {
    // Set the __skipCSRF flag to true to bypass CSRF protection
    req.__skipCSRF = true;
    
    console.log(`[CSRF Debug] Exempting demo route from CSRF: ${req.path}`);
  }
  
  // Continue to the next middleware
  next();
}