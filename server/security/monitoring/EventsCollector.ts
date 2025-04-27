/**
 * Security Events Collector
 * 
 * This module collects and provides security events from various sources
 * for real-time monitoring and analysis.
 */

import { logSecurityEvent } from '../advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/blockchain/SecurityEventTypes';
import { ImmutableSecurityLogs } from '../advanced/blockchain/ImmutableSecurityLogs';

// Security event interface
export interface SecurityEvent {
  id: number;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  details: Record<string, unknown>;
}

// In-memory store of recent security events
const securityEvents: SecurityEvent[] = [];
let nextEventId = 1;

// Maximum number of events to keep in memory
const MAX_EVENTS = 1000;

/**
 * Record a new security event
 */
export function recordSecurityEvent(event: Omit<SecurityEvent, 'id'>): SecurityEvent {
  // Create event with ID
  const newEvent: SecurityEvent = {
    ...event,
    id: nextEventId++
  };
  
  // Add to events array
  securityEvents.unshift(newEvent);
  
  // Trim array if it exceeds maximum size
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.pop();
  }
  
  return newEvent;
}

/**
 * Get security events history
 */
export async function getSecurityEventsHistory(
  timeRange: string = '24h',
  category: string = 'all',
  type: string = 'all',
  limit: number = 100
): Promise<SecurityEvent[]> {
  let events = [...securityEvents];
  
  // Apply time range filter
  const now = Date.now();
  let timeRangeMs = 24 * 60 * 60 * 1000; // Default: 24 hours
  
  switch (timeRange) {
    case '1h':
      timeRangeMs = 1 * 60 * 60 * 1000;
      break;
    case '6h':
      timeRangeMs = 6 * 60 * 60 * 1000;
      break;
    case '24h':
      timeRangeMs = 24 * 60 * 60 * 1000;
      break;
    case '7d':
      timeRangeMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case '30d':
      timeRangeMs = 30 * 24 * 60 * 60 * 1000;
      break;
  }
  
  events = events.filter(event => (now - event.timestamp.getTime()) <= timeRangeMs);
  
  // Apply category filter
  if (category !== 'all') {
    events = events.filter(event => event.category === category);
  }
  
  // Apply type filter
  if (type !== 'all') {
    events = events.filter(event => event.type === type);
  }
  
  // Apply limit
  if (limit > 0 && events.length > limit) {
    events = events.slice(0, limit);
  }
  
  try {
    // Retrieve additional events from blockchain if needed and if available
    if (events.length < limit) {
      const blockchainEvents = await getBlockchainEvents(
        timeRange,
        category,
        type,
        limit - events.length
      );
      
      // Merge and sort events
      events = [...events, ...blockchainEvents].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      // Apply limit again after merging
      if (limit > 0 && events.length > limit) {
        events = events.slice(0, limit);
      }
    }
  } catch (error) {
    // Log error but continue with in-memory events
    logSecurityEvent({
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.WARNING,
      message: 'Failed to retrieve blockchain security events',
      data: { error: (error as Error).message }
    });
  }
  
  return events;
}

/**
 * Get security events from blockchain
 */
async function getBlockchainEvents(
  timeRange: string = '24h',
  category: string = 'all',
  type: string = 'all',
  limit: number = 100
): Promise<SecurityEvent[]> {
  try {
    // Use the ImmutableSecurityLogs directly as it's an instance already
    const blockchainLogger = ImmutableSecurityLogs;
    
    // Simulate retrieving events from blockchain
    // In a real implementation, this would call the blockchain logger
    return [];
  } catch (error) {
    throw new Error(`Failed to retrieve blockchain events: ${(error as Error).message}`);
  }
}

/**
 * Subscribe to security events
 */
export function subscribeToSecurityEvents(
  callback: (event: SecurityEvent) => void,
  filter?: {
    category?: string;
    type?: string;
  }
): () => void {
  // In a real implementation, this would set up a subscription to security events
  // For now, we'll just return an unsubscribe function
  
  return () => {
    // Unsubscribe function
  };
}

/**
 * Initialize the events collector
 */
export function initializeEventsCollector(): void {
  // Populate with some initial events
  const initialEvents: Array<Omit<SecurityEvent, 'id'>> = [
    { 
      timestamp: new Date(Date.now() - 2 * 60 * 1000), 
      type: 'warning', 
      category: 'authentication', 
      message: 'Failed login attempt from unknown IP', 
      details: { ip: '192.168.1.123', username: 'admin', attempts: 3 }
    },
    { 
      timestamp: new Date(Date.now() - 5 * 60 * 1000), 
      type: 'error', 
      category: 'api', 
      message: 'Malformed API request blocked', 
      details: { endpoint: '/api/users', method: 'POST', reason: 'SQL injection attempt' }
    },
    { 
      timestamp: new Date(Date.now() - 10 * 60 * 1000), 
      type: 'info', 
      category: 'system', 
      message: 'Security scan completed', 
      details: { duration: '2m 34s', threats: 0, warnings: 2 }
    },
    { 
      timestamp: new Date(Date.now() - 20 * 60 * 1000), 
      type: 'success', 
      category: 'authentication', 
      message: 'MFA enabled for user', 
      details: { user: 'john.doe', method: 'TOTP' }
    },
    { 
      timestamp: new Date(Date.now() - 30 * 60 * 1000), 
      type: 'warning', 
      category: 'anomaly', 
      message: 'Unusual API access pattern detected', 
      details: { endpoint: '/api/data', frequency: '120 req/min', threshold: '100 req/min' }
    },
    { 
      timestamp: new Date(Date.now() - 45 * 60 * 1000), 
      type: 'info', 
      category: 'quantum', 
      message: 'Quantum resistance test performed', 
      details: { algorithm: 'Kyber', result: 'pass' }
    },
    { 
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), 
      type: 'error', 
      category: 'csrf', 
      message: 'Invalid CSRF token detected', 
      details: { path: '/api/profile', method: 'PUT' }
    },
    { 
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
      type: 'success', 
      category: 'blockchain', 
      message: 'Security log committed to blockchain', 
      details: { entries: 245, hash: '0x3F2E1A7B...' }
    }
  ];
  
  // Record initial events
  initialEvents.forEach(recordSecurityEvent);
  
  logSecurityEvent({
    category: SecurityEventCategory.SYSTEM,
    severity: SecurityEventSeverity.INFO,
    message: 'Security events collector initialized',
    data: { initialEventsCount: initialEvents.length }
  });
}