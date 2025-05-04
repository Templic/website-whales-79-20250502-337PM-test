/**
 * IP Utilities
 * 
 * This module provides utilities for working with IP addresses in Express requests.
 */
import { Request } from 'express';

/**
 * Get the client IP address from an Express request
 * 
 * Attempts to extract the real client IP address, even behind proxies,
 * by checking common headers and falling back to the connection's remote address.
 * 
 * @param req Express request
 * @returns The client's IP address
 */
export function getClientIp(req: Request): string {
  // Check for X-Forwarded-For header (common for proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0].split(',')[0].trim();
    } else {
      return forwardedFor.split(',')[0].trim();
    }
  }
  
  // Check for Cloudflare's CF-Connecting-IP header
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    if (Array.isArray(cfIp)) {
      return cfIp[0];
    }
    return cfIp;
  }
  
  // Check for True-Client-IP header
  const trueClientIp = req.headers['true-client-ip'];
  if (trueClientIp) {
    if (Array.isArray(trueClientIp)) {
      return trueClientIp[0];
    }
    return trueClientIp;
  }
  
  // Check for X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    if (Array.isArray(realIp)) {
      return realIp[0];
    }
    return realIp;
  }
  
  // Fall back to the remote address from the connection
  // if it exists and is not undefined
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  
  // If socket exists and has a remote address, use that
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  // Final fallback
  return '0.0.0.0';
}

/**
 * Normalize an IPv6 or IPv4 address
 * 
 * @param ip The IP address to normalize
 * @returns The normalized IP
 */
export function normalizeIp(ip: string): string {
  // Handle IPv4-mapped IPv6 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  
  // Return the IP as-is
  return ip;
}

/**
 * Check if an IP is in a private range
 * 
 * @param ip The IP address to check
 * @returns True if the IP is in a private range
 */
export function isPrivateIp(ip: string): boolean {
  // Normalize the IP first
  const normalizedIp = normalizeIp(ip);
  
  // Check for localhost
  if (normalizedIp === '127.0.0.1' || normalizedIp === 'localhost' || normalizedIp === '::1') {
    return true;
  }
  
  // Check for private IPv4 ranges
  if (normalizedIp.startsWith('10.') || 
      normalizedIp.startsWith('192.168.') || 
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalizedIp)) {
    return true;
  }
  
  // Check for link-local addresses
  if (normalizedIp.startsWith('169.254.')) {
    return true;
  }
  
  // Check for private IPv6 ranges
  if (normalizedIp.startsWith('fd') || normalizedIp.startsWith('fc')) {
    return true;
  }
  
  return false;
}

/**
 * Get the public IP address from a request, or a fallback if not available
 * 
 * @param req Express request
 * @param fallback Fallback IP to use if no public IP is found
 * @returns The public IP address or fallback
 */
export function getPublicIp(req: Request, fallback: string = '1.1.1.1'): string {
  const ip = getClientIp(req);
  
  // Return the fallback if the IP is private
  if (isPrivateIp(ip)) {
    return fallback;
  }
  
  return ip;
}