/**
 * @file SecurityLogger.ts
 * @description Security-specific logging with event emission
 */

import { SecurityFabric } from './SecurityFabric';
import { SecurityEventTypes, SecurityEventCategory, SecurityEventSeverity } from './blockchain/SecurityEventTypes';
import { Logger } from '../../utils/Logger';

/**
 * Interface for security logging events
 */
export interface SecurityLogEvent {
    category: SecurityEventCategory;
    severity: SecurityEventSeverity;
    message: string;
    data?: Record<string, any>;
}

/**
 * Log a security event and emit it through the Security Fabric
 */
export function logSecurityEvent(event: SecurityLogEvent): void {
    const { category, severity, message, data = {} } = event;
    
    // Map severity to event type
    let eventType: SecurityEventTypes;
    switch (severity) {
        case SecurityEventSeverity.CRITICAL:
            eventType = SecurityEventTypes.SYSTEM_ERROR;
            break;
        case SecurityEventSeverity.ERROR:
            eventType = SecurityEventTypes.SYSTEM_ERROR;
            break;
        case SecurityEventSeverity.WARN:
            eventType = SecurityEventTypes.SYSTEM_WARNING;
            break;
        case SecurityEventSeverity.INFO:
            if (category === SecurityEventCategory.AUTHENTICATION) {
                eventType = SecurityEventTypes.AUTH_SUCCESS;
            } else {
                eventType = SecurityEventTypes.SYSTEM_STARTUP;
            }
            break;
        default:
            eventType = SecurityEventTypes.SYSTEM_STARTUP;
    }
    
    // Log the event
    const logMethod = severity === SecurityEventSeverity.DEBUG ? 'debug' :
                       severity === SecurityEventSeverity.INFO ? 'info' :
                       severity === SecurityEventSeverity.WARN ? 'warn' :
                       'error';
    
    Logger[logMethod](`[Security:${category}] ${message}`, data);
    
    // Emit the event through the security fabric
    SecurityFabric.getInstance().emitSecurityEvent({
        type: eventType,
        source: 'security_logger',
        severity: severity === SecurityEventSeverity.DEBUG ? 'low' :
                  severity === SecurityEventSeverity.INFO ? 'low' :
                  severity === SecurityEventSeverity.WARN ? 'medium' :
                  severity === SecurityEventSeverity.ERROR ? 'high' :
                  'critical',
        timestamp: Date.now(),
        attributes: {
            category,
            message,
            ...data
        }
    });
}