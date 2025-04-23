/**
 * Safe User Middleware
 * 
 * This middleware sanitizes user data in responses to prevent exposure of sensitive data
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Create a sanitized user object without sensitive fields
 */
export function createSafeUser(user: any) {
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned || false,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || null
  };
}

/**
 * Middleware to modify response.json to sanitize user data
 */
export function safeUserMiddleware(req: Request, res: Response, next: NextFunction) {
  // Save the original res.json method
  const originalJson = res.json;
  
  // Override res.json to sanitize user data in responses
  res.json = function(data: any: any) {
    // Check if the response data contains user information and sanitize it
    if (data && typeof data === 'object') {
      // If it's a user object with sensitive fields
      if (data.password && data.username) {
        console.log(`Sanitizing direct user response: ${data.username}`);
        return originalJson.call(this, createSafeUser(data));
      }
      
      // If it's an array of users
      if (Array.isArray(data) && data.length > 0 && data[0]?.password && data[0]?.username) {
        console.log(`Sanitizing array of ${data.length} users`);
        return originalJson.call(this, data.map(user => createSafeUser(user)));
      }
      
      // For other complex objects that might contain user data
      if (!Array.isArray(data) && typeof data === 'object') {
        // Handle nested objects
        const sanitizedData = { ...data };
        
        // Sanitize user fields recursively in nested objects
        // Only scan the first level for performance
        Object.keys(data).forEach(key => {
          if (data[key] && typeof data[key] === 'object' && data[key].password && data[key].username) {
            console.log(`Sanitizing nested user at key ${key}: ${data[key].username}`);
            sanitizedData[key] = createSafeUser(data[key]);
          }
        });
        
        return originalJson.call(this, sanitizedData);
      }
    }
    
    // If no user data found, just pass through the original
    return originalJson.call(this, data);
  };
  
  next();
}