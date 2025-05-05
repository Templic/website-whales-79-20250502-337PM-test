/**
 * Security Fabric
 * 
 * Core security enums and interfaces for the security integration system.
 */

/**
 * Security event categories
 */
export enum SecurityEventCategory {
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  CRYPTOGRAPHY = 'CRYPTOGRAPHY',
  INJECTION = 'INJECTION',
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  OUTPUT_ENCODING = 'OUTPUT_ENCODING',
  SENSITIVE_DATA = 'SENSITIVE_DATA',
  SESSION_MANAGEMENT = 'SESSION_MANAGEMENT',
  CONFIGURATION = 'CONFIGURATION',
  NETWORK_SECURITY = 'NETWORK_SECURITY',
  TYPE_CHECKING = 'TYPE_CHECKING', // Added for TypeScript security integration
  UNKNOWN = 'UNKNOWN'
}

/**
 * Security event severities
 */
export enum SecurityEventSeverity {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  id?: string;
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Security scan interface
 */
export interface SecurityScan {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  startTime?: number;
  endTime?: number;
  results?: any;
  metadata?: Record<string, any>;
}

/**
 * Security incident interface
 */
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: SecurityEventSeverity;
  status: 'open' | 'investigating' | 'mitigated' | 'resolved';
  createdAt: number;
  updatedAt: number;
  relatedEvents: string[];
  assignedTo?: string;
  resolution?: string;
  metadata?: Record<string, any>;
}

export default {
  SecurityEventCategory,
  SecurityEventSeverity
};