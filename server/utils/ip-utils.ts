/**
 * IP Utilities
 * 
 * This module provides utilities for working with IP addresses,
 * including extracting client IPs from requests, checking IP ranges,
 * and working with subnets.
 */

import { Request } from 'express';
import { log } from './logger';

/**
 * Get client IP address from a request
 * 
 * @param req Express request
 * @returns Client IP address
 */
export function getClientIp(req: Request): string {
  try {
    // Try Replit proxied IP first (for Replit deployments)
    if (req.headers['x-replit-user-ip']) {
      return req.headers['x-replit-user-ip'] as string;
    }

    // Try common proxy headers in order of reliability
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Extract first IP in case of multiple hops
      const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',');
      const clientIp = ips[0].trim();
      
      // Validate IP
      if (isValidIp(clientIp)) {
        return clientIp;
      }
    }
    
    // Try other common headers
    if (req.headers['cf-connecting-ip']) {
      return req.headers['cf-connecting-ip'] as string;
    }
    
    if (req.headers['true-client-ip']) {
      return req.headers['true-client-ip'] as string;
    }
    
    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip'] as string;
    }
    
    // Fall back to Express's remote address
    const remoteAddress = req.socket.remoteAddress;
    if (remoteAddress) {
      return remoteAddress;
    }
    
    // Ultimate fallback
    return req.ip || '0.0.0.0';
  } catch (error) {
    log(`Error getting client IP: ${error}`, 'security');
    
    // Fallback
    return '0.0.0.0';
  }
}

/**
 * Validate an IP address
 * 
 * @param ip IP address
 * @returns Whether the IP is valid
 */
export function isValidIp(ip: string): boolean {
  try {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^([0-9a-fA-F]{1,4}:){1,7}:|^::([0-9a-fA-F]{1,4}:){0,6}|^([0-9a-fA-F]{1,4}:){1,6}:|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|^([0-9a-fA-F]{1,4}:)(:[0-9a-fA-F]{1,4}){1,6}$/;
    
    // Check if IPv4
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.').map(Number);
      
      // Check each part is in range 0-255
      return parts.every(part => part >= 0 && part <= 255);
    }
    
    // Check if IPv6
    if (ipv6Pattern.test(ip)) {
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error validating IP: ${error}`, 'security');
    
    return false;
  }
}

/**
 * Get IP subnet (first three octets for IPv4)
 * 
 * @param ip IP address
 * @returns Subnet
 */
export function getIpSubnet(ip: string): string {
  try {
    // Special case for localhost and unknown
    if (ip === '::1' || ip === '127.0.0.1' || ip === '0.0.0.0') {
      return ip;
    }
    
    // Handle IPv4
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
    }
    
    // Handle IPv6 (simplified - keep first 4 segments)
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return `${parts.slice(0, 4).join(':')}:*`;
    }
    
    // Fallback
    return ip;
  } catch (error) {
    log(`Error getting IP subnet: ${error}`, 'security');
    
    return ip;
  }
}

/**
 * Check if an IP is in a CIDR range
 * 
 * @param ip IP address
 * @param cidr CIDR range (e.g., "192.168.1.0/24")
 * @returns Whether the IP is in the range
 */
export function isIpInCidrRange(ip: string, cidr: string): boolean {
  try {
    // Only support IPv4 for now
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipv4Pattern.test(ip)) {
      return false;
    }
    
    // Split CIDR into IP and prefix
    const [rangeIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    // Check if valid prefix
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }
    
    // Convert IP to long
    const ipLong = ipToLong(ip);
    const rangeIpLong = ipToLong(rangeIp);
    
    // Create mask
    const mask = -1 << (32 - prefix);
    
    // Check if IPs match within the mask
    return (ipLong & mask) === (rangeIpLong & mask);
  } catch (error) {
    log(`Error checking CIDR range: ${error}`, 'security');
    
    return false;
  }
}

/**
 * Convert IPv4 to long
 * 
 * @param ip IPv4 address
 * @returns Long representation
 */
function ipToLong(ip: string): number {
  try {
    const parts = ip.split('.').map(Number);
    
    return (parts[0] << 24) |
           (parts[1] << 16) |
           (parts[2] << 8) |
           parts[3];
  } catch (error) {
    log(`Error converting IP to long: ${error}`, 'security');
    
    return 0;
  }
}

/**
 * Convert long to IPv4
 * 
 * @param long Long representation
 * @returns IPv4 address
 */
export function longToIp(long: number): string {
  try {
    const a = (long >>> 24) & 0xff;
    const b = (long >>> 16) & 0xff;
    const c = (long >>> 8) & 0xff;
    const d = long & 0xff;
    
    return `${a}.${b}.${c}.${d}`;
  } catch (error) {
    log(`Error converting long to IP: ${error}`, 'security');
    
    return '0.0.0.0';
  }
}

/**
 * Anonymize an IP for logging (removes last octet for IPv4)
 * 
 * @param ip IP address
 * @returns Anonymized IP
 */
export function anonymizeIp(ip: string): string {
  try {
    // Handle IPv4
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    
    // Handle IPv6 (simplified)
    if (ip.includes(':')) {
      // Keep first half of address
      const parts = ip.split(':');
      const halfLength = Math.ceil(parts.length / 2);
      
      return `${parts.slice(0, halfLength).join(':')}:xxxx:xxxx`;
    }
    
    return ip;
  } catch (error) {
    log(`Error anonymizing IP: ${error}`, 'security');
    
    return ip;
  }
}