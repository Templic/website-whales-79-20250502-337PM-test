/**
 * JWT Token Management Module
 * 
 * Provides utilities for generating, verifying, and managing JWT tokens
 * with strong security configurations.
 */

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { User } from '../../shared/schema';
import { logSecurityEvent } from './security';

// Default token expiration times
const DEFAULT_ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const DEFAULT_REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Secret keys
let JWT_SECRET: string;
let REFRESH_TOKEN_SECRET: string;

// Initialize secrets either from environment or generate securely
export function initJwtSecrets() {
  JWT_SECRET = process.env.JWT_SECRET || randomBytes(64).toString('hex');
  REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || randomBytes(64).toString('hex');
  
  // Log warning if using dynamically generated secrets (they'll change on restart)
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    console.warn('Warning: Using dynamically generated JWT secrets. Tokens will be invalidated on server restart.');
    console.warn('Set JWT_SECRET and REFRESH_TOKEN_SECRET environment variables for persistent tokens.');
  }
}

// Generate a JWT token for a user
export function generateAccessToken(user: Partial<User>, expiresIn = DEFAULT_ACCESS_TOKEN_EXPIRY): string {
  // Create payload with only the necessary user information
  // Avoid including sensitive data like password hash
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    // Add a unique JWT ID for revocation capability
    jti: randomBytes(16).toString('hex'),
  };

  // Sign with secret and configuration options
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS512' as jwt.Algorithm, // Use a strong algorithm
    audience: 'cosmic-app-api',
    issuer: 'cosmic-app',
  });
}

// Generate a refresh token for token renewal
export function generateRefreshToken(userId: number, expiresIn = DEFAULT_REFRESH_TOKEN_EXPIRY): string {
  const payload = {
    sub: userId,
    // Add unique token ID for targeted revocation
    tokenId: randomBytes(24).toString('hex'),
    type: 'refresh',
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS512' as jwt.Algorithm,
    audience: 'cosmic-app-refresh',
    issuer: 'cosmic-app',
  });
}

// Verify access token
export function verifyAccessToken(token: string): jwt.JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS512'],
      audience: 'cosmic-app-api',
      issuer: 'cosmic-app',
    });
    
    return typeof decoded === 'object' ? decoded : null;
  } catch (error) {
    // Log token verification failures
    logSecurityEvent({
      type: 'JWT_VERIFICATION_FAILURE',
      details: `JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'medium',
    });
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): jwt.JwtPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      algorithms: ['HS512'],
      audience: 'cosmic-app-refresh',
      issuer: 'cosmic-app',
    });
    
    return typeof decoded === 'object' ? decoded : null;
  } catch (error) {
    // Log refresh token verification failures
    logSecurityEvent({
      type: 'REFRESH_TOKEN_VERIFICATION_FAILURE',
      details: `Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'high',
    });
    return null;
  }
}

// Token blacklist for revoked tokens (in-memory store)
// In production, this should be moved to a persistent store like Redis
const tokenBlacklist = new Set<string>();

// Add a token to blacklist (for logout or compromise)
export function revokeToken(token: string): void {
  try {
    // Extract token ID or full token
    const decoded = jwt.decode(token);
    const jti = decoded && typeof decoded === 'object' && decoded.jti ? decoded.jti : token;
    
    // Add to blacklist
    tokenBlacklist.add(jti);
    
    // Log the token revocation
    logSecurityEvent({
      type: 'TOKEN_REVOKED',
      details: `JWT token revoked successfully`,
      severity: 'low',
    });
  } catch (error) {
    console.error('Failed to revoke token:', error);
  }
}

// Check if a token is blacklisted
export function isTokenRevoked(jti: string): boolean {
  return tokenBlacklist.has(jti);
}

// Extract token from authorization header
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}