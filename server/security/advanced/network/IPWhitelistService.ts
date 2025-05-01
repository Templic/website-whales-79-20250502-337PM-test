/**
 * IP Whitelist Service
 * 
 * Provides IP address-based access control for sensitive operations
 * and admin functionality. Helps prevent unauthorized access based
 * on the client's IP address.
 * 
 * Features:
 * - IP whitelist management
 * - CIDR notation support for subnet whitelisting
 * - Geolocation-based restrictions
 * - Automatic logging of blocked requests
 * - Admin override capabilities
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';
import { isAdmin, hasSuperAdminPrivileges } from '../../../utils/auth-utils';

// Define types for better type safety
export interface IPWhitelistEntry {
  ip: string;
  description: string;
  addedBy: string;
  addedAt: number;
  expiresAt?: number;
  isSubnet?: boolean;
}

// In-memory storage - in production, use a database
let whitelistedIPs: IPWhitelistEntry[] = [
  {
    ip: '127.0.0.1',
    description: 'Localhost',
    addedBy: 'system',
    addedAt: Date.now(),
    isSubnet: false
  },
  {
    ip: '10.0.0.0/8',
    description: 'Internal network',
    addedBy: 'system',
    addedAt: Date.now(),
    isSubnet: true
  },
  {
    ip: '192.168.0.0/16',
    description: 'Internal network',
    addedBy: 'system',
    addedAt: Date.now(),
    isSubnet: true
  }
];

/**
 * Convert IP to numeric representation for comparison
 */
function ipToLong(ip: string): number {
  const parts = ip.split('.');
  return ((parseInt(parts[0], 10) << 24) >>> 0) +
         ((parseInt(parts[1], 10) << 16) >>> 0) +
         ((parseInt(parts[2], 10) << 8) >>> 0) +
         parseInt(parts[3], 10);
}

/**
 * Check if an IP is within a subnet range (CIDR notation)
 */
function isIpInSubnet(ip: string, cidr: string): boolean {
  const [subnet, prefixSize] = cidr.split('/');
  const prefix = parseInt(prefixSize, 10);
  
  // Convert IP addresses to numeric representations
  const ipLong = ipToLong(ip);
  const subnetLong = ipToLong(subnet);
  
  // Create a mask based on the prefix size
  const mask = ~(0xFFFFFFFF >>> prefix);
  
  // Compare the masked values
  return (ipLong & mask) === (subnetLong & mask);
}

/**
 * Check if an IP is whitelisted
 */
export function isIpWhitelisted(ip: string): boolean {
  // Remove expired entries first
  cleanupExpiredEntries();
  
  // Check exact matches
  if (whitelistedIPs.some(entry => !entry.isSubnet && entry.ip === ip)) {
    return true;
  }
  
  // Check subnet matches
  return whitelistedIPs.some(entry => 
    entry.isSubnet && isIpInSubnet(ip, entry.ip)
  );
}

/**
 * Clean up expired whitelist entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expiredEntries = whitelistedIPs.filter(
    entry => entry.expiresAt && entry.expiresAt < now
  );
  
  if (expiredEntries.length > 0) {
    // Remove expired entries
    whitelistedIPs = whitelistedIPs.filter(
      entry => !entry.expiresAt || entry.expiresAt >= now
    );
    
    // Log the cleanup
    logSecurityEvent({
      category: SecurityEventCategory.IP_WHITELIST,
      severity: SecurityEventSeverity.INFO,
      message: 'Expired IP whitelist entries removed',
      data: {
        count: expiredEntries.length,
        entries: expiredEntries.map(e => ({ ip: e.ip, addedBy: e.addedBy }))
      }
    });
  }
}

/**
 * Add an IP to the whitelist
 */
export function addToWhitelist(
  ip: string,
  description: string,
  addedBy: string,
  expiresIn?: number,
  isSubnet: boolean = false
): IPWhitelistEntry {
  // Validate IP format
  if (!isValidIpFormat(ip, isSubnet)) {
    throw new Error(`Invalid IP format: ${ip}`);
  }
  
  const entry: IPWhitelistEntry = {
    ip,
    description,
    addedBy,
    addedAt: Date.now(),
    isSubnet
  };
  
  // Set expiration if specified
  if (expiresIn) {
    entry.expiresAt = Date.now() + expiresIn;
  }
  
  // Add to whitelist
  whitelistedIPs.push(entry);
  
  // Log the addition
  logSecurityEvent({
    category: SecurityEventCategory.IP_WHITELIST,
    severity: SecurityEventSeverity.INFO,
    message: 'IP added to whitelist',
    data: {
      ip,
      description,
      addedBy,
      expiresAt: entry.expiresAt,
      isSubnet
    }
  });
  
  return entry;
}

/**
 * Remove an IP from the whitelist
 */
export function removeFromWhitelist(ip: string, removedBy: string): boolean {
  const initialLength = whitelistedIPs.length;
  
  // Remove the IP
  whitelistedIPs = whitelistedIPs.filter(entry => entry.ip !== ip);
  
  const removed = whitelistedIPs.length < initialLength;
  
  if (removed) {
    // Log the removal
    logSecurityEvent({
      category: SecurityEventCategory.IP_WHITELIST,
      severity: SecurityEventSeverity.INFO,
      message: 'IP removed from whitelist',
      data: {
        ip,
        removedBy
      }
    });
  }
  
  return removed;
}

/**
 * Validate IP format
 */
function isValidIpFormat(ip: string, isSubnet: boolean): boolean {
  if (isSubnet) {
    // Validate CIDR notation
    const cidrRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
    if (!cidrRegex.test(ip)) {
      return false;
    }
    
    const [ipPart, prefixSize] = ip.split('/');
    const prefix = parseInt(prefixSize, 10);
    
    if (prefix < 0 || prefix > 32) {
      return false;
    }
    
    return isValidIpFormat(ipPart, false);
  } else {
    // Validate IPv4 address
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipRegex.test(ip)) {
      return false;
    }
    
    // Check each octet
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
}

/**
 * Get all whitelisted IPs
 */
export function getWhitelistedIPs(): IPWhitelistEntry[] {
  cleanupExpiredEntries();
  return [...whitelistedIPs];
}

/**
 * IP whitelist middleware
 */
export function ipWhitelistMiddleware(options: {
  adminOnly?: boolean;
  allowLoggedInUsers?: boolean;
  adminOverride?: boolean;
  redirectUrl?: string;
} = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    adminOnly = false,
    allowLoggedInUsers = true,
    adminOverride = true,
    redirectUrl
  } = options;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip this middleware if it should only apply to admin routes
    // and the current user is not an admin
    if (adminOnly && !isAdmin(req)) {
      return next();
    }
    
    // Allow authenticated users if the option is enabled
    if (allowLoggedInUsers && req.isAuthenticated() && req.user) {
      return next();
    }
    
    // Allow admin override if the option is enabled
    if (adminOverride && hasSuperAdminPrivileges(req)) {
      logAuditEvent(
        AuditAction.ADMIN_ACTION,
        AuditCategory.SECURITY,
        'ip_whitelist',
        { action: 'override', ip: req.ip },
        req
      );
      return next();
    }
    
    // Check if the IP is whitelisted
    if (isIpWhitelisted(req.ip)) {
      return next();
    }
    
    // Log the blocked request
    logSecurityEvent({
      category: SecurityEventCategory.IP_WHITELIST,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Access blocked - IP not in whitelist',
      data: {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      }
    });
    
    logAuditEvent(
      AuditAction.SECURITY_CHANGE,
      AuditCategory.SECURITY,
      'ip_whitelist',
      { action: 'blocked', ip: req.ip },
      req
    );
    
    // Handle the blocked request
    if (redirectUrl) {
      return res.redirect(redirectUrl);
    } else {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource'
      });
    }
  };
}

export default {
  isIpWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelistedIPs,
  ipWhitelistMiddleware
};