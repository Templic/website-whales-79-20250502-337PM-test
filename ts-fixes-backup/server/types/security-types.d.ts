/**
 * Security type definitions
 */

interface SecurityEvent {
  type: string;
  message: string;
  timestamp: string | number;
  severity?: string;
  data?: any;
}

interface ImmutableSecurityLogs {
  addSecurityEvent(event: SecurityEvent): void;
  getEvents(): SecurityEvent[];
  clear(): void;
}