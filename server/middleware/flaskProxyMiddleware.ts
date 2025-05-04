/**
 * Flask App Proxy Middleware
 * 
 * This middleware acts as a reverse proxy for the Flask app.
 * It forwards requests for Flask app routes to the Flask server running on port 5001.
 */

import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { log } from '../utils/logger';

// List of Flask app routes to proxy
const FLASK_APP_ROUTES = [
  '/',
  '/index.html',
  '/about',
  '/new-music',
  '/archived-music',
  '/tour',
  '/engage',
  '/newsletter',
  '/blog',
  '/collaboration',
  '/contact',
  '/test',
  // Also include static files for the Flask app
  '/static',
  '/assets',
  '/images',
  '/css',
  '/js',
  '/favicon.ico'
];

// Create proxy middleware
const flaskProxy = createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  logLevel: 'warn',
  pathRewrite: {
    '^/api/flask': '/' // Rewrite /api/flask/something to /something
  },
  onProxyReq: (proxyReq, req, res) => {
    log(`[Flask Proxy] Proxying request: ${req.method} ${req.url}`, 'debug');
  },
  onProxyRes: (proxyRes, req, res) => {
    log(`[Flask Proxy] Received response: ${proxyRes.statusCode} for ${req.url}`, 'debug');
  },
  onError: (err, req, res) => {
    log(`[Flask Proxy] Proxy error: ${err.message}`, 'error');
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Flask server proxy error');
  }
});

/**
 * Setup Flask proxy middleware
 * 
 * @param app Express application
 */
export function setupFlaskProxy(app: any): void {
  // Setup direct proxy for /api/flask path
  app.use('/api/flask', flaskProxy);
  
  // For Flask app routes, check if it's a Flask route and proxy it
  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    
    // Check if it's a Flask app route
    const isFlaskRoute = FLASK_APP_ROUTES.some(route => {
      if (typeof route === 'string') {
        return path === route || path.startsWith(route + '/');
      }
      return false;
    });
    
    if (isFlaskRoute) {
      // Rewrite the URL to use our proxy path
      // This is needed to avoid conflicts with the Node.js routes
      log(`[Flask Proxy] Forwarding Flask route: ${req.method} ${path}`, 'debug');
      
      // Forward to Flask server
      flaskProxy(req, res, next);
    } else {
      // Not a Flask route, continue processing
      next();
    }
  });
  
  log('[Flask Proxy] Flask proxy middleware initialized', 'server');
}