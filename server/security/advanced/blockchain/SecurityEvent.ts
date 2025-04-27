/**
 * @file SecurityEvent.ts
 * @description Defines the structure of security events used throughout the system
 */

import { SecurityEventTypes } from './SecurityEventTypes';

/**
 * Security Event Interface
 * 
 * Defines the common structure for all security events in the system,
 * providing a standardized format for event correlation and analysis.
 */
export interface SecurityEvent {
    /**
     * Unique identifier for the event
     */
    id?: string;
    
    /**
     * Type of security event
     */
    type: SecurityEventTypes;
    
    /**
     * Timestamp when the event occurred (milliseconds since epoch)
     */
    timestamp?: number;
    
    /**
     * Source of the event (component, module, service)
     */
    source?: string;
    
    /**
     * Severity level of the event
     */
    severity?: 'low' | 'medium' | 'high' | 'critical';
    
    /**
     * Additional attributes specific to the event type
     */
    attributes?: Record<string, any>;
    
    /**
     * User ID associated with the event, if applicable
     */
    userId?: string;
    
    /**
     * Session ID associated with the event, if applicable
     */
    sessionId?: string;
    
    /**
     * Request ID associated with the event, if applicable
     */
    requestId?: string;
    
    /**
     * IP address associated with the event, if applicable
     */
    ipAddress?: string;
    
    /**
     * User agent associated with the event, if applicable
     */
    userAgent?: string;
    
    /**
     * Related events (IDs of events related to this event)
     */
    relatedEvents?: string[];
    
    /**
     * Message describing the event (for human readability)
     */
    message?: string;
}