/**
 * IP Utilities
 * 
 * This module provides helper functions for working with IP addresses.
 */

import { Request } from 'express';

/**
 * Get client IP address
 * 
 * @param req Express request
 * @returns Client IP address
 */
export function getClientIp(req: Request): string {
  // Check for X-Forwarded-For header
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (forwardedFor) {
    // Get first IP from X-Forwarded-For
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0].trim();
    
    return ips || req.socket.remoteAddress || '0.0.0.0';
  }
  
  // Check for X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Use socket remote address
  return req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Get IP subnet (for rate limiting by network)
 * 
 * @param ip IP address
 * @returns IP subnet
 */
export function getIpSubnet(ip: string): string {
  try {
    // Check if IPv6
    if (ip.includes(':')) {
      // Get first 4 segments of IPv6
      const segments = ip.split(':');
      return segments.slice(0, 4).join(':');
    }
    
    // Get first 3 segments of IPv4
    const segments = ip.split('.');
    return segments.slice(0, 3).join('.');
  } catch (error) {
    // Return original IP on error
    return ip;
  }
}

/**
 * Check if IP is in CIDR range
 * 
 * @param ip IP address to check
 * @param cidr CIDR range
 * @returns Whether IP is in range
 */
export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    // Split CIDR into IP and mask
    const [cidrIp, cidrMaskStr] = cidr.split('/');
    
    // Get mask bits
    const cidrMask = parseInt(cidrMaskStr, 10);
    
    // Handle invalid CIDR
    if (isNaN(cidrMask) || cidrMask < 0 || cidrMask > 32) {
      return false;
    }
    
    // Convert IPs to integers
    const ipInt = ipToInt(ip);
    const cidrIpInt = ipToInt(cidrIp);
    
    // Invalid IPs
    if (ipInt === null || cidrIpInt === null) {
      return false;
    }
    
    // Calculate subnet mask
    const mask = ~(0xffffffff >>> cidrMask);
    
    // Compare masked IPs
    return (ipInt & mask) === (cidrIpInt & mask);
  } catch (error) {
    // Return false on error
    return false;
  }
}

/**
 * Convert IP to integer
 * 
 * @param ip IP address to convert
 * @returns Integer representation or null if invalid
 */
function ipToInt(ip: string): number | null {
  try {
    // Split IP into octets
    const octets = ip.split('.');
    
    // Check valid IPv4
    if (octets.length !== 4) {
      return null;
    }
    
    // Convert to integer
    return ((parseInt(octets[0], 10) << 24) |
           (parseInt(octets[1], 10) << 16) |
           (parseInt(octets[2], 10) << 8) |
           (parseInt(octets[3], 10)));
  } catch (error) {
    // Return null on error
    return null;
  }
}

/**
 * Check if IP is private
 * 
 * @param ip IP address to check
 * @returns Whether IP is private
 */
export function isPrivateIp(ip: string): boolean {
  return (
    isIpInCidr(ip, '10.0.0.0/8') ||      // Class A private network
    isIpInCidr(ip, '172.16.0.0/12') ||   // Class B private networks
    isIpInCidr(ip, '192.168.0.0/16') ||  // Class C private networks
    isIpInCidr(ip, '127.0.0.0/8') ||     // Localhost
    isIpInCidr(ip, '169.254.0.0/16') ||  // Link-local
    isIpInCidr(ip, '0.0.0.0/8') ||       // "This" network
    isIpInCidr(ip, '240.0.0.0/4') ||     // Reserved
    ip === '::1' || ip === 'localhost'   // IPv6 localhost
  );
}