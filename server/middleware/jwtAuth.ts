/**
 * JWT Authentication Middleware
 * 
 * Provides middleware functions for handling JWT authentication
 * and authorization in the application.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, isTokenRevoked } from '../security/jwt';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logSecurityEvent } from '../security/security';

// Define JWT payload interface for better type safety
export interface JwtPayload {
  sub: string; // Subject (usually user ID)
  iat: number; // Issued at
  exp: number; // Expiry time
  jti?: string; // JWT ID (for token revocation)
  role?: string; // User role
  [key: string]: any; // Allow additional claims
}

// Extend Express Request to include decoded JWT payload
declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate requests with JWT
 * This can be used as an alternative to session-based authentication for API routes
 */
export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    res.status(401).json({ 
      success: false,
      message: 'Access token is required' 
    });
    return;
  }
  
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
    return;
  }
  
  // Check if token has been revoked (blacklisted)
  if (decoded.jti && isTokenRevoked(decoded.jti)) {
    logSecurityEvent({
      type: 'REVOKED_TOKEN_USAGE',
      userId: decoded.sub,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Attempt to use a revoked JWT token',
      severity: 'high'
    });
    
    res.status(401).json({ 
      success: false,
      message: 'Token has been revoked' 
    });
    return;
  }
  
  // Store the decoded payload in request for later use
  req.jwtPayload = decoded;
  
  next();
}

/**
 * Middleware to check JWT role authorization
 * Must be used after authenticateJwt middleware
 */
export function authorizeJwtRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.jwtPayload) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
      return;
    }
    
    const userId = req.jwtPayload.sub;
    
    try {
      // Verify user exists and has required role
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId, 10))
      });
      
      if (!user) {
        logSecurityEvent({
          type: 'JWT_INVALID_USER',
          userId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: 'JWT token references a non-existent user',
          severity: 'high'
        });
        
        res.status(401).json({ 
          success: false,
          message: 'Invalid user' 
        });
        return;
      }
      
      // Check user banning status
      if (user.isBanned) {
        logSecurityEvent({
          type: 'BANNED_USER_ACCESS_ATTEMPT',
          userId,
          username: user.username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: 'Banned user attempted to access resources',
          severity: 'medium'
        });
        
        res.status(403).json({ 
          success: false,
          message: 'Account has been suspended' 
        });
        return;
      }
      
      // Check if user has required role
      if (!roles.includes(user.role)) {
        logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          userId,
          username: user.username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: `User with role ${user.role} attempted to access resource requiring ${roles.join(', ')}`,
          severity: 'medium'
        });
        
        res.status(403).json({ 
          success: false,
          message: 'Insufficient permissions' 
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('JWT role authorization error:', error);
      
      res.status(500).json({ 
        success: false,
        message: 'An error occurred during authorization' 
      });
      return;
    }
  };
}

/**
 * Middleware to detect and respond to JWT algorithm confusion attacks
 * This middleware checks if 'none' algorithm is being attempted
 */
export function preventAlgorithmConfusionAttack(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  
  const token = authHeader.substring(7);
  
  // Check if token is using 'none' algorithm (basic check)
  try {
    const [headerBase64] = token.split('.');
    
    // Ensure headerBase64 is defined before decoding
    if (headerBase64) {
      const headerBuffer = Buffer.from(headerBase64, 'base64');
      const headerStr = headerBuffer.toString('utf-8');
      const header = JSON.parse(headerStr);
      
      if (header.alg === 'none') {
        logSecurityEvent({
          type: 'JWT_ALGORITHM_CONFUSION_ATTEMPT',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: 'Attempt to use JWT with "none" algorithm',
          severity: 'high'
        });
        
        res.status(400).json({ 
          success: false,
          message: 'Invalid token algorithm' 
        });
        return;
      }
    }
  } catch (e) {
    // If token cannot be parsed, let the actual JWT verification handle it
  }
  
  next();
}