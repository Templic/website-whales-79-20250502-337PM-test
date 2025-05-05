/**
 * Security Scan Types
 * 
 * This file defines types and interfaces for the security scanning system.
 */

/**
 * Security scan status enum
 */
export enum SecurityScanStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Security scan priority enum
 */
export enum SecurityScanPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Security scan type enum
 */
export enum SecurityScanType {
  CORE = 'CORE',
  API = 'API',
  AUTH = 'AUTH',
  DEPENDENCY = 'DEPENDENCY',
  INPUT = 'INPUT',
  COMPLIANCE = 'COMPLIANCE',
  ML = 'ML',
  ADVANCED = 'ADVANCED',
  TYPESCRIPT = 'TYPESCRIPT'
}

/**
 * Security scan result interface
 */
export interface ScanResult {
  id: string;
  name: string;
  status: SecurityScanStatus;
  timestamp: string;
  duration: number;
  summary: string;
  details?: string;
  error?: string;
  [key: string]: any;
}

/**
 * Security scan schedule interface
 */
export interface ScanSchedule {
  id?: string;
  scanType: string;
  name: string;
  description?: string;
  priority: SecurityScanPriority;
  schedule: string; // Cron-style schedule
  params?: Record<string, any>;
  enabled?: boolean;
  lastRun?: {
    timestamp: string;
    status: SecurityScanStatus;
    resultId?: string;
  };
}

/**
 * Security scan options interface
 */
export interface ScanOptions {
  scanType: string;
  name: string;
  description?: string;
  priority?: SecurityScanPriority;
  params?: Record<string, any>;
}

export default {
  SecurityScanStatus,
  SecurityScanPriority,
  SecurityScanType
};