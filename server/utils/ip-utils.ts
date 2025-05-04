/**
 * IP Utility Functions
 *
 * This module provides utility functions for working with IP addresses,
 * including extraction from requests and validation.
 */

import { Request } from 'express';
import { log } from './logger';

/**
 * Get the client IP address from a request
 * 
 * @param req Express request
 * @returns Client IP address
 */
export function getClientIp(req: Request): string {
  try {
    // Try to get from X-Forwarded-For header (trusted proxies)
    // Format: X-Forwarded-For: client, proxy1, proxy2, ...
    const forwardedFor = req.headers['x-forwarded-for'];
    
    if (forwardedFor) {
      // If it's a string, split it and get the first (client) IP
      if (typeof forwardedFor === 'string') {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        if (ips.length > 0 && ips[0]) {
          return ips[0];
        }
      }
      // If it's an array, get the first element
      else if (Array.isArray(forwardedFor) && forwardedFor.length > 0 && forwardedFor[0]) {
        return forwardedFor[0];
      }
    }
    
    // Try to get from other common headers
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
      return realIp;
    }
    
    // Fall back to remoteAddress from the request
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    
    // If IPv6 localhost, convert to IPv4 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    
    // If IPv6 with embedded IPv4, extract the IPv4 part
    if (ip.startsWith('::ffff:') && ip.includes('.')) {
      return ip.substring(7);
    }
    
    return ip;
  } catch (error) {
    log(`Error getting client IP: ${error}`, 'security');
    
    // Return a safe default
    return '0.0.0.0';
  }
}

/**
 * Normalize an IP address (handle IPv6 mapped IPv4 addresses)
 * 
 * @param ip IP address to normalize
 * @returns Normalized IP address
 */
export function normalizeIp(ip: string): string {
  try {
    // If IPv6 localhost, convert to IPv4 localhost
    if (ip === '::1') {
      return '127.0.0.1';
    }
    
    // If IPv6 with embedded IPv4, extract the IPv4 part
    if (ip.startsWith('::ffff:') && ip.includes('.')) {
      return ip.substring(7);
    }
    
    return ip;
  } catch (error) {
    log(`Error normalizing IP: ${error}`, 'security');
    
    // Return the original IP
    return ip;
  }
}

/**
 * Check if an IP address is private
 * 
 * @param ip IP address to check
 * @returns True if the IP is private
 */
export function isPrivateIp(ip: string): boolean {
  try {
    // Normalize the IP first
    const normalizedIp = normalizeIp(ip);
    
    // Check for localhost
    if (normalizedIp === '127.0.0.1' || normalizedIp === 'localhost') {
      return true;
    }
    
    // Check for private IPv4 ranges
    if (normalizedIp.match(/^10\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/)) {
      return true;
    }
    
    if (normalizedIp.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/)) {
      return true;
    }
    
    if (normalizedIp.match(/^192\.168\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/)) {
      return true;
    }
    
    // Check for link-local addresses
    if (normalizedIp.match(/^169\.254\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/)) {
      return true;
    }
    
    // Check for IPv6 loopback
    if (normalizedIp === '::1') {
      return true;
    }
    
    // Check for IPv6 unique local addresses (ULA)
    if (normalizedIp.match(/^f[cd][0-9a-f]{2}:/i)) {
      return true;
    }
    
    // Not a private IP
    return false;
  } catch (error) {
    log(`Error checking if IP is private: ${error}`, 'security');
    
    // Assume it's not private
    return false;
  }
}

/**
 * Extract IP subnet (for partial matching)
 * 
 * @param ip IP address
 * @param cidr CIDR prefix length (defaults to 24 for IPv4)
 * @returns Subnet portion of the IP
 */
export function getIpSubnet(ip: string, cidr: number = 24): string {
  try {
    // Normalize the IP first
    const normalizedIp = normalizeIp(ip);
    
    // Handle IPv4
    if (normalizedIp.includes('.')) {
      // Split into octets
      const octets = normalizedIp.split('.');
      
      // Default to /24 subnet (first three octets)
      if (cidr === 24) {
        return `${octets[0]}.${octets[1]}.${octets[2]}`;
      }
      
      // Handle different prefix lengths
      if (cidr === 8) {
        return octets[0];
      } else if (cidr === 16) {
        return `${octets[0]}.${octets[1]}`;
      } else if (cidr === 32) {
        return normalizedIp;
      }
      
      // Default to /24 for any other CIDR value
      return `${octets[0]}.${octets[1]}.${octets[2]}`;
    }
    
    // Handle IPv6 (simplified)
    if (normalizedIp.includes(':')) {
      // Get the first four segments of the IPv6 address
      const segments = normalizedIp.split(':').slice(0, 4);
      return segments.join(':');
    }
    
    // Return the original IP if we can't parse it
    return normalizedIp;
  } catch (error) {
    log(`Error getting IP subnet: ${error}`, 'security');
    
    // Return the original IP
    return ip;
  }
}

/**
 * Validate an IP address
 * 
 * @param ip IP address to validate
 * @returns True if the IP is valid
 */
export function isValidIp(ip: string): boolean {
  try {
    // Check for IPv4
    if (/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip)) {
      const parts = ip.split('.').map(part => parseInt(part, 10));
      return parts.every(part => part >= 0 && part <= 255);
    }
    
    // Check for IPv6
    if (/^([0-9a-f]{1,4}:){7}([0-9a-f]{1,4})$/i.test(ip)) {
      return true;
    }
    
    // Check for compressed IPv6
    if (/^([0-9a-f]{1,4}:){0,6}:[0-9a-f]{1,4}$/i.test(ip)) {
      return true;
    }
    
    // Check for IPv6 with double colon
    if (/^([0-9a-f]{1,4}:){0,6}::([0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4}$/i.test(ip)) {
      return true;
    }
    
    // Check for IPv6 with embedded IPv4
    if (/^([0-9a-f]{1,4}:){0,6}:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.test(ip)) {
      const parts = ip.split(':').pop()?.split('.').map(part => parseInt(part, 10)) || [];
      return parts.every(part => part >= 0 && part <= 255);
    }
    
    // Not a valid IP
    return false;
  } catch (error) {
    log(`Error validating IP: ${error}`, 'security');
    
    // Assume it's not valid
    return false;
  }
}

/**
 * Compare two IPs for equality (accounting for different representations)
 * 
 * @param ip1 First IP address
 * @param ip2 Second IP address
 * @returns True if the IPs are equivalent
 */
export function isSameIp(ip1: string, ip2: string): boolean {
  try {
    // Normalize both IPs
    const normalizedIp1 = normalizeIp(ip1);
    const normalizedIp2 = normalizeIp(ip2);
    
    // Compare the normalized IPs
    return normalizedIp1 === normalizedIp2;
  } catch (error) {
    log(`Error comparing IPs: ${error}`, 'security');
    
    // Assume they're not the same
    return false;
  }
}