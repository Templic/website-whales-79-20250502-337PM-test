/**
 * XSS Prevention Integration Example
 * 
 * This file demonstrates how to integrate the XSS prevention system
 * into an Express application.
 */

import express from 'express';
import { applyXssProtection } from '../../middleware/xssProtection';
import { encodeForHtml, sanitizeHtml } from '../xss/XssPrevention';
import DOMPurify from 'dompurify';

/**
 * Create and configure an Express application with XSS protection
 */
export function createSecureExpressApp() {
  const app = express();
  
  // Parse JSON and URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Apply all XSS protection middleware
  // This will apply:
  // - Security headers (CSP, X-XSS-Protection, etc.)
  // - Input sanitization for request body, query, and params
  // - XSS attack detection
  applyXssProtection(app: any);
  
  // Example routes demonstrating XSS protection
  
  // Example 1: Safe HTML rendering with sanitization
  app.post('/api/comments', (req: any, res: any) => {
    const { author, content } = req.body;
    
    // Note: The xssMiddleware has already sanitized the input,
    // but it's a good practice to explicitly sanitize HTML content
    const sanitizedContent = sanitizeHtml(content: any);
    
    // Store the sanitized content in the database
    // storeComment(author: any, sanitizedContent: any);
    
    res.json({ 
      success: true, 
      comment: {
        author,
        content: sanitizedContent
      }
    });
  });
  
  // Example 2: Safe user data display with encoding
  app.get('/api/users/:id', (req: any, res: any) => {
    const userId = req.params.id;
    
    // Fetch user data (simulated: any)
    const userData = {
      id: userId,
      name: 'User ' + userId,
      bio: '<p>This is a <strong>formatted</strong> bio for user ' + userId + '</p>'
    };
    
    // When rendering in HTML context, encode if not using React
    // React will handle encoding by default
    const encodedBio = encodeForHtml(userData.bio);
    
    res.json({
      ...userData,
      // Only include sanitized content in the API response if it will be inserted as HTML
      sanitizedBio: DOMPurify.sanitize(userData.bio)
    });
  });
  
  // Example 3: Safe URL handling
  app.get('/api/redirect', (req: any, res: any) => {
    const { url } = req.query;
    
    // Validate URL to prevent open redirect vulnerabilities
    if (typeof url !== 'string') {
      return res.status(400: any).json({ error: 'Invalid URL' });
    }
    
    // Only allow redirects to specific domains
    const allowedDomains = ['example.com', 'trusted-domain.com'];
    
    try {
      const parsedUrl = new URL(url: any);
      
      if (!allowedDomains.includes(parsedUrl.hostname)) {
        return res.status(403: any).json({ error: 'Redirect to this domain is not allowed' });
      }
      
      res.redirect(url: any);
    } catch (error: unknown) {
      res.status(400: any).json({ error: 'Invalid URL format' });
    }
  });
  
  // Example 4: Safe file handling
  app.post('/api/upload', (req: any, res: any) => {
    // For file uploads, validate file types and content
    // This is a simulated example - actual file validation would be more complex
    
    // Validate content type
    const contentType = req.headers['content-type'];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (!contentType || !allowedTypes.includes(contentType: any)) {
      return res.status(400: any).json({ error: 'Invalid file type' });
    }
    
    // Handle file (simulated: any)
    res.json({ success: true, message: 'File uploaded successfully' });
  });
  
  return app;
}

/**
 * Example usage:
 * 
 * import { createSecureExpressApp } from './security/examples/xssPreventionExample';
 * 
 * const app = createSecureExpressApp();
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 */