/**
 * Common types for the security monitoring system
 */

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  FALSE_POSITIVE = 'false_positive'
}

export enum IncidentSource {
  SYSTEM_ALERT = 'system_alert',
  MANUAL_REPORT = 'manual_report',
  ANOMALY_DETECTION = 'anomaly_detection',
  FILE_INTEGRITY = 'file_integrity',
  SECURITY_SCAN = 'security_scan',
  EXTERNAL_REPORT = 'external_report'
}

export enum SecurityEventType {
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  ACCESS_CONTROL = 'access_control',
  DATA = 'data',
  SYSTEM = 'system',
  API = 'api'
}

// Map AuditEventSeverity to include high-priority levels
export type ExtendedAuditEventSeverity = 
  | 'error' 
  | 'security' 
  | 'info' 
  | 'audit' 
  | 'debug' 
  | 'warn' 
  | 'perf'
  | 'high'    // Added for critical security events
  | 'medium'  // Added for moderate security events
  | 'low';    // Added for low-risk security events

export interface SecurityMetricsSummary {
  riskScore: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number;
  activeIncidents: number;
  lastUpdateTime: string;
}

export interface ComplianceStatus {
  overall: {
    compliant: boolean;
    score: number;
    lastAssessment: string;
  };
  requirements: Record<string, {
    id: string;
    name: string;
    compliant: boolean;
    score: number;
    details?: string;
  }>;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: SecurityEventType;
  source: IncidentSource;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  tags: string[];
  relatedAssets?: string[];
  actions: IncidentAction[];
}

export interface IncidentAction {
  id: string;
  description: string;
  type: 'detection' | 'containment' | 'eradication' | 'recovery' | 'documentation';
  timestamp: string;
  performedBy: string;
  outcome: string;
  automaticAction: boolean;
}

export interface FileIntegrityResult {
  filePath: string;
  status: 'ok' | 'changed' | 'missing' | 'new';
  currentHash?: string;
  storedHash?: string;
  changeTime?: string;
  criticalFile: boolean;
}

export interface BehavioralAnomaly {
  id: string;
  type: string;
  description: string;
  severity: IncidentSeverity;
  confidence: number;
  detectedAt: string;
  relatedEvents: string[];
}

export interface DataLeakageIndicator {
  id: string;
  type: string;
  description: string;
  severity: IncidentSeverity;
  confidence: number;
  detectedAt: string;
  affectedData: string[];
  source?: string;
}

export interface StoredAuditEntry {
  id: string;
  timestamp: string;
  event: {
    type: string;
    subtype?: string;
    action: string;
    status: string;
    severity: ExtendedAuditEventSeverity;
    userId: string;
    data: Record<string, any>;
  };
  signature: string;
  verified: boolean;
}

// Sample extension interface for monitoring metrics
export interface SecurityMonitoringMetrics {
  overall: SecurityMetricsSummary;
  authentication: {
    totalAttempts: number;
    failureRate: number;
    suspiciousActivities: number;
  };
  payment: {
    transactionCount: number;
    averageAmount: number;
    failureRate: number;
    flaggedTransactions: number;
  };
  apiSecurity: {
    requestCount: number;
    validationFailureRate: number;
    rateLimit: {
      throttled: number;
      blocked: number;
    };
  };
  compliance: {
    pciDssScore: number;
    auditTrailIntegrity: number;
    vulnerabilities: {
      high: number;
      medium: number;
      low: number;
    };
  };
  system: {
    uptime: number;
    lastScanTime: string;
    fileIntegrityStatus: 'ok' | 'warning' | 'critical';
  };
  timestamp: string;
}

// Define response templates for different types of incidents
export interface IncidentResponseTemplate {
  id: string;
  name: string;
  description: string;
  applicableCategories: SecurityEventType[];
  applicableSeverities: IncidentSeverity[];
  steps: {
    order: number;
    description: string;
    type: 'detection' | 'containment' | 'eradication' | 'recovery' | 'documentation';
    automated: boolean;
    requiredRole?: string;
  }[];
  automationScripts?: string[];
}