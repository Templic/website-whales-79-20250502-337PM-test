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

// Create proxy middleware with better error handling and timeouts
const flaskProxy = createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  logLevel: 'warn',
  // Increase timeout for slow Flask startup
  proxyTimeout: 10000,   // 10 seconds for proxy timeouts
  timeout: 10000,        // 10 seconds for connection timeout
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
    
    // Handle the case when Flask is not ready yet
    if (err.code === 'ECONNREFUSED') {
      log('[Flask Proxy] Flask app not ready yet - serving fallback content', 'warn');
    }
    
    // Instead of showing an error, provide fallback content
    serveFallbackContent(req, res);
  }
});

/**
 * Setup Flask proxy middleware
 * 
 * @param app Express application
 */
/**
 * Serve fallback content for Flask routes when the Flask app is not available
 * 
 * @param req Request object
 * @param res Response object
 */
function serveFallbackContent(req: any, res: any): void {
  const path = req.path || req.url;
  
  log(`[Flask Fallback] Serving fallback content for: ${path}`, 'info');
  
  // Set content type
  res.setHeader('Content-Type', 'text/html');
  
  // Route-specific responses
  switch (path) {
    case '/':
      res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Dale the Whale - Home</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
    .container { width: 80%; margin: 0 auto; padding: 20px; }
    header { background: #0077cc; color: white; padding: 1rem; text-align: center; }
    footer { background: #333; color: white; text-align: center; padding: 1rem; margin-top: 2rem; }
    nav { display: flex; justify-content: center; background: #444; padding: 0.5rem; }
    nav a { color: white; text-decoration: none; padding: 0 1rem; }
    nav a:hover { text-decoration: underline; }
    .hero { background: #f4f4f4; padding: 2rem; text-align: center; margin: 1rem 0; }
    .content { padding: 2rem 0; }
  </style>
</head>
<body>
  <header>
    <h1>Dale the Whale</h1>
  </header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/new-music">New Music</a>
    <a href="/tour">Tour</a>
    <a href="/contact">Contact</a>
  </nav>
  <div class="container">
    <section class="hero">
      <h2>Welcome to Dale the Whale's Official Website</h2>
      <p>Music that resonates with the depths of the ocean.</p>
    </section>
    <section class="content">
      <h2>Latest News</h2>
      <p>New album "Ocean Echoes" is now available on all streaming platforms!</p>
      <p>Note: This is a static fallback version of the page.</p>
    </section>
  </div>
  <footer>
    <p>&copy; 2025 Dale the Whale. All rights reserved.</p>
  </footer>
</body>
</html>
      `);
      break;
    case '/about':
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>About Dale the Whale</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
    .container { width: 80%; margin: 0 auto; padding: 20px; }
    header { background: #0077cc; color: white; padding: 1rem; text-align: center; }
    nav { display: flex; justify-content: center; background: #444; padding: 0.5rem; }
    nav a { color: white; text-decoration: none; padding: 0 1rem; }
    footer { background: #333; color: white; text-align: center; padding: 1rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>About Dale the Whale</h1>
  </header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/new-music">New Music</a>
    <a href="/tour">Tour</a>
    <a href="/contact">Contact</a>
  </nav>
  <div class="container">
    <h2>Biography</h2>
    <p>Dale the Whale is a musician with a deep connection to the ocean. His music draws inspiration from marine environments, whale songs, and coastal sounds.</p>
    <p>After growing up near the Pacific coast, Dale developed a passion for ocean conservation that influences his musical style and themes.</p>
    <p>Note: This is a static fallback version of the page.</p>
  </div>
  <footer>
    <p>&copy; 2025 Dale the Whale. All rights reserved.</p>
  </footer>
</body>
</html>`);
      break;
    case '/tour':
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Tour Dates - Dale the Whale</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
    .container { width: 80%; margin: 0 auto; padding: 20px; }
    header { background: #0077cc; color: white; padding: 1rem; text-align: center; }
    nav { display: flex; justify-content: center; background: #444; padding: 0.5rem; }
    nav a { color: white; text-decoration: none; padding: 0 1rem; }
    footer { background: #333; color: white; text-align: center; padding: 1rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>Tour Dates</h1>
  </header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/new-music">New Music</a>
    <a href="/tour">Tour</a>
    <a href="/contact">Contact</a>
  </nav>
  <div class="container">
    <h2>Upcoming Shows</h2>
    <p>Check back soon for upcoming tour dates for Dale the Whale's "Ocean Echoes" tour.</p>
    <p>Note: This is a static fallback version of the page.</p>
  </div>
  <footer>
    <p>&copy; 2025 Dale the Whale. All rights reserved.</p>
  </footer>
</body>
</html>`);
      break;
    case '/contact':
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Contact - Dale the Whale</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
    .container { width: 80%; margin: 0 auto; padding: 20px; }
    header { background: #0077cc; color: white; padding: 1rem; text-align: center; }
    nav { display: flex; justify-content: center; background: #444; padding: 0.5rem; }
    nav a { color: white; text-decoration: none; padding: 0 1rem; }
    footer { background: #333; color: white; text-align: center; padding: 1rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>Contact Dale the Whale</h1>
  </header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/new-music">New Music</a>
    <a href="/tour">Tour</a>
    <a href="/contact">Contact</a>
  </nav>
  <div class="container">
    <h2>Get in Touch</h2>
    <p>Email: contact@dalethewhale.com</p>
    <p>Note: This is a static fallback version of the page.</p>
  </div>
  <footer>
    <p>&copy; 2025 Dale the Whale. All rights reserved.</p>
  </footer>
</body>
</html>`);
      break;
    case '/test':
      res.setHeader('Content-Type', 'text/plain');
      res.end('Flask fallback middleware is working!');
      break;
    default:
      // For other paths, provide a generic response
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Dale the Whale</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
    .container { width: 80%; margin: 0 auto; padding: 20px; }
    header { background: #0077cc; color: white; padding: 1rem; text-align: center; }
    nav { display: flex; justify-content: center; background: #444; padding: 0.5rem; }
    nav a { color: white; text-decoration: none; padding: 0 1rem; }
    footer { background: #333; color: white; text-align: center; padding: 1rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>Dale the Whale</h1>
  </header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/new-music">New Music</a>
    <a href="/tour">Tour</a>
    <a href="/contact">Contact</a>
  </nav>
  <div class="container">
    <h2>Page Not Found</h2>
    <p>Sorry, the page you're looking for is not available at this time.</p>
    <p><a href="/">Return to Home</a></p>
    <p>Note: This is a static fallback version of the page.</p>
  </div>
  <footer>
    <p>&copy; 2025 Dale the Whale. All rights reserved.</p>
  </footer>
</body>
</html>`);
  }
}

export function setupFlaskProxy(app: any): void {
  // Create a proxy for each Flask route pattern
  for (const route of FLASK_APP_ROUTES) {
    if (typeof route === 'string') {
      // For static folders, make them work with their full path
      if (route.startsWith('/static') || route.startsWith('/assets') || 
          route.startsWith('/images') || route.startsWith('/css') || 
          route.startsWith('/js')) {
        app.use(route, flaskProxy);
        log(`[Flask Proxy] Registered static proxy for: ${route}`, 'info');
      } 
      // For individual routes, create specific proxies
      else {
        app.get(route, (req, res, next) => {
          log(`[Flask Proxy] Handling Flask route: ${req.method} ${req.path}`, 'info');
          flaskProxy(req, res, next);
        });
        
        // For POST routes that need form submission (like contact, newsletter)
        if (route === '/contact' || route === '/newsletter') {
          app.post(route, (req, res, next) => {
            log(`[Flask Proxy] Handling Flask POST route: ${req.method} ${req.path}`, 'info');
            flaskProxy(req, res, next);
          });
        }
      }
    }
  }
  
  // Setup direct proxy for Flask API or admin routes if needed
  app.use('/api/flask', flaskProxy);
  
  // Catch-all for any other Flask routes we might have missed
  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    
    // Check if it's a Flask app route by more complex pattern matching
    // This helps with any routes we didn't explicitly register above
    const isFlaskRoute = FLASK_APP_ROUTES.some(route => {
      if (typeof route === 'string') {
        return path === route || path.startsWith(route + '/');
      }
      return false;
    });
    
    if (isFlaskRoute) {
      log(`[Flask Proxy] Forwarding through catch-all: ${req.method} ${path}`, 'info');
      flaskProxy(req, res, next);
    } else {
      // Not a Flask route, continue processing
      next();
    }
  });
  
  log('[Flask Proxy] Flask proxy middleware initialized', 'server');
}