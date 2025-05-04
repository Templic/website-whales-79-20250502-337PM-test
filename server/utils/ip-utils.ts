/**
 * IP Utilities
 *
 * Utilities for working with IP addresses and subnets.
 */

import { Request } from 'express';

/**
 * Get the client IP address from request
 * 
 * @param req Express request
 * @returns Client IP address
 */
export function getClientIp(req: Request): string {
  // Check x-forwarded-for header
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipString = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  
  if (ipString) {
    // Split by comma (multiple proxies)
    const ips = ipString.split(',').map(ip => ip.trim());
    
    // Get leftmost IP (original client)
    return ips[0] || req.ip || '127.0.0.1';
  }
  
  // Fallback to connection IP
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Get IP subnet (first 3 octets for IPv4, first 6 blocks for IPv6)
 * 
 * @param ip IP address
 * @returns IP subnet
 */
export function getIpSubnet(ip: string): string {
  try {
    if (!ip) {
      return '';
    }
    
    // Check if IPv4
    if (ip.includes('.')) {
      // Split by dots
      const parts = ip.split('.');
      
      // Get first 3 octets
      if (parts.length >= 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
    }
    
    // Check if IPv6
    if (ip.includes(':')) {
      // Split by colons
      const parts = ip.split(':');
      
      // Get first 6 blocks
      if (parts.length >= 6) {
        return parts.slice(0, 6).join(':');
      }
    }
    
    // Fallback to full IP
    return ip;
  } catch (error) {
    console.error(`Error getting IP subnet: ${error}`);
    
    // Fallback to full IP
    return ip;
  }
}

/**
 * Check if IP is in a range
 * 
 * @param ip IP to check
 * @param range IP range (CIDR notation)
 * @returns Whether IP is in range
 */
export function isIpInRange(ip: string, range: string): boolean {
  try {
    if (!ip || !range) {
      return false;
    }
    
    // Split CIDR into IP and prefix
    const [rangeIp, prefixStr] = range.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    // Check if IPv4
    if (ip.includes('.') && rangeIp.includes('.')) {
      return isIpv4InRange(ip, rangeIp, prefix);
    }
    
    // Check if IPv6
    if (ip.includes(':') && rangeIp.includes(':')) {
      return isIpv6InRange(ip, rangeIp, prefix);
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking IP range: ${error}`);
    return false;
  }
}

/**
 * Check if IPv4 is in range
 * 
 * @param ip IPv4 to check
 * @param rangeIp Range IPv4
 * @param prefix Prefix (1-32)
 * @returns Whether IPv4 is in range
 */
function isIpv4InRange(ip: string, rangeIp: string, prefix: number): boolean {
  // Convert IPs to numbers
  const ipNum = ipv4ToNumber(ip);
  const rangeIpNum = ipv4ToNumber(rangeIp);
  
  // Calculate mask
  const mask = ~(0xFFFFFFFF >>> prefix);
  
  // Apply mask and compare
  return (ipNum & mask) === (rangeIpNum & mask);
}

/**
 * Convert IPv4 to number
 * 
 * @param ip IPv4 address
 * @returns Number representation
 */
function ipv4ToNumber(ip: string): number {
  // Split by dots
  const parts = ip.split('.');
  
  // Convert to number
  return (
    (parseInt(parts[0], 10) << 24) |
    (parseInt(parts[1], 10) << 16) |
    (parseInt(parts[2], 10) << 8) |
    parseInt(parts[3], 10)
  );
}

/**
 * Check if IPv6 is in range
 * 
 * @param ip IPv6 to check
 * @param rangeIp Range IPv6
 * @param prefix Prefix (1-128)
 * @returns Whether IPv6 is in range
 */
function isIpv6InRange(ip: string, rangeIp: string, prefix: number): boolean {
  // Normalize IPv6 addresses
  const normalizedIp = normalizeIpv6(ip);
  const normalizedRangeIp = normalizeIpv6(rangeIp);
  
  // Ensure valid addresses
  if (!normalizedIp || !normalizedRangeIp) {
    return false;
  }
  
  // Convert to byte arrays
  const ipBytes = ipv6ToBytes(normalizedIp);
  const rangeIpBytes = ipv6ToBytes(normalizedRangeIp);
  
  // Calculate prefix bytes and bits
  const prefixBytes = Math.floor(prefix / 8);
  const prefixBits = prefix % 8;
  
  // Compare full bytes
  for (let i = 0; i < prefixBytes; i++) {
    if (ipBytes[i] !== rangeIpBytes[i]) {
      return false;
    }
  }
  
  // Compare remaining bits
  if (prefixBits > 0 && prefixBytes < 16) {
    const mask = 0xFF00 >> prefixBits;
    if ((ipBytes[prefixBytes] & mask) !== (rangeIpBytes[prefixBytes] & mask)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize IPv6 address
 * 
 * @param ip IPv6 address
 * @returns Normalized IPv6 address
 */
function normalizeIpv6(ip: string): string {
  try {
    // Handle IPv4-mapped IPv6 addresses
    if (ip.includes('.')) {
      if (ip.startsWith('::ffff:')) {
        // Extract IPv4 part
        const ipv4 = ip.slice(7);
        if (ipv4.includes('.')) {
          return `::ffff:${ipv4}`;
        }
      }
    }
    
    // Handle :: shorthand
    if (ip.includes('::')) {
      const parts = ip.split('::');
      
      if (parts.length !== 2) {
        return ip; // Invalid format
      }
      
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      
      // Calculate missing colons
      const missing = 8 - (left.length + right.length);
      
      if (missing <= 0) {
        return ip; // Invalid format
      }
      
      // Construct full address
      const full = [
        ...left,
        ...Array(missing).fill('0'),
        ...right
      ];
      
      return full.join(':');
    }
    
    // Already normalized
    return ip;
  } catch (error) {
    console.error(`Error normalizing IPv6 address: ${error}`);
    return ip;
  }
}

/**
 * Convert IPv6 to byte array
 * 
 * @param ip Normalized IPv6 address
 * @returns Byte array (16 bytes)
 */
function ipv6ToBytes(ip: string): Uint8Array {
  // Initialize result
  const bytes = new Uint8Array(16);
  
  // Split by colons
  const parts = ip.split(':');
  
  // Process each part
  for (let i = 0; i < parts.length; i++) {
    const value = parseInt(parts[i], 16);
    bytes[i * 2] = (value >> 8) & 0xFF;
    bytes[i * 2 + 1] = value & 0xFF;
  }
  
  return bytes;
}

/**
 * Check if IP is private
 * 
 * @param ip IP address
 * @returns Whether IP is private
 */
export function isPrivateIp(ip: string): boolean {
  // Private IPv4 ranges
  const privateIpv4Ranges = [
    '10.0.0.0/8',       // Private network
    '172.16.0.0/12',    // Private network
    '192.168.0.0/16',   // Private network
    '127.0.0.0/8',      // Localhost
    '169.254.0.0/16',   // Link-local
    '0.0.0.0/8',        // Current network
    '192.0.0.0/24',     // IETF Protocol Assignments
    '192.0.2.0/24',     // TEST-NET-1
    '198.51.100.0/24',  // TEST-NET-2
    '203.0.113.0/24',   // TEST-NET-3
    '224.0.0.0/4',      // Multicast
    '240.0.0.0/4'       // Reserved
  ];
  
  // Private IPv6 ranges
  const privateIpv6Ranges = [
    '::1/128',          // Localhost
    'fc00::/7',         // Unique local addresses
    'fe80::/10',        // Link-local
    'ff00::/8',         // Multicast
    '2001:db8::/32'     // Documentation
  ];
  
  // Check if IPv4
  if (ip.includes('.')) {
    return privateIpv4Ranges.some(range => isIpInRange(ip, range));
  }
  
  // Check if IPv6
  if (ip.includes(':')) {
    return privateIpv6Ranges.some(range => isIpInRange(ip, range));
  }
  
  // Special cases
  return ip === 'localhost' || ip === '::1';
}