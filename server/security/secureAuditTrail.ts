/**
 * Secure Audit Trail Module
 * 
 * This module implements a tamper-evident, cryptographically secure audit logging system
 * for tracking security-relevant events in compliance with PCI DSS requirements:
 * - 10.2 (Implement automated audit trails)
 * - 10.3 (Record audit trail entries for all system components)
 * - 10.5 (Secure audit trails so they cannot be altered)
 * 
 * Key features:
 * - Tamper-evident audit log using hash chaining
 * - Digitally signed log entries
 * - Cryptographic verification of log integrity
 * - Separate storage for different event types
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Define log severity levels
export type AuditEventSeverity = 'info' | 'warning' | 'critical';

// Define audit event structure
export interface AuditEvent {
  // Required fields (PCI DSS 10.3.1-6)
  timestamp: string;           // When the event occurred
  action: string;              // What action was performed
  resource: string;            // What resource was affected
  
  // User identification (PCI DSS 10.3.1-2)
  userId?: string;             // Who performed the action
  ipAddress?: string;          // Source IP address
  
  // Result information (PCI DSS 10.3.3-5)
  result: 'success' | 'failure'; // Outcome of the action
  severity: AuditEventSeverity;  // Severity level
  
  // Additional details (PCI DSS 10.3.6)
  details?: Record<string, any>; // Additional context
}

// Internal structure for stored audit entries
interface StoredAuditEntry extends AuditEvent {
  entryId: string;             // Unique ID for this entry
  previousHash?: string;       // Hash of the previous entry (for tamper evidence)
  entryHash: string;           // Hash of this entry (for integrity verification)
  signature?: string;          // Digital signature (if key pair is available)
}

/**
 * Create a secure hash from a string using SHA-256
 */
function createSecureHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

class SecureAuditTrail {
  private auditLogDir: string;
  private generalLogFile: string;
  private paymentLogFile: string;
  private authLogFile: string;
  private adminLogFile: string;
  
  constructor() {
    this.auditLogDir = path.join(process.cwd(), 'logs', 'audit');
    this.generalLogFile = path.join(this.auditLogDir, 'general-audit.log');
    this.paymentLogFile = path.join(this.auditLogDir, 'payment-audit.log');
    this.authLogFile = path.join(this.auditLogDir, 'auth-audit.log');
    this.adminLogFile = path.join(this.auditLogDir, 'admin-audit.log');
    
    // Ensure audit log directory exists
    this.ensureLogDirectoryExists();
  }
  
  /**
   * Ensure that the audit log directory exists
   */
  private ensureLogDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.auditLogDir)) {
        fs.mkdirSync(this.auditLogDir, { recursive: true, mode: 0o750 });
        console.log('[security] Created audit logs directory');
      }
    } catch (error) {
      console.error('[error] Failed to create audit logs directory:', error);
    }
  }
  
  /**
   * Determine which log file to use based on the action
   */
  private getLogFileForAction(action: string): string {
    // Payment-related actions go to payment log
    if (action.startsWith('PAYMENT_')) {
      return this.paymentLogFile;
    }
    
    // Authentication-related actions go to auth log
    if (action.startsWith('AUTH_') || action.includes('LOGIN') || action.includes('LOGOUT')) {
      return this.authLogFile;
    }
    
    // Admin-related actions go to admin log
    if (action.startsWith('ADMIN_')) {
      return this.adminLogFile;
    }
    
    // Default to general log
    return this.generalLogFile;
  }
  
  /**
   * Calculate hash for an audit entry to ensure integrity
   */
  private calculateEntryHash(entry: Omit<StoredAuditEntry, 'entryHash' | 'signature'>): string {
    // Create a deterministic string representation
    const dataString = JSON.stringify(entry, Object.keys(entry).sort());
    
    // Calculate SHA-256 hash using helper function
    return createSecureHash(dataString);
  }
  
  /**
   * Get the latest entry hash from a log file
   */
  private getLatestEntryHash(logFile: string): string | undefined {
    try {
      if (!fs.existsSync(logFile)) {
        return undefined;
      }
      
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0 || lines[0] === '') {
        return undefined;
      }
      
      const lastLine = lines[lines.length - 1];
      const lastEntry = JSON.parse(lastLine);
      
      return lastEntry.entryHash;
    } catch (error) {
      console.error(`[error] Error reading latest audit entry hash: ${error}`);
      return undefined;
    }
  }
  
  /**
   * Create a digital signature for an entry
   * Only used if a private key is available
   */
  private signEntry(data: string): string | undefined {
    try {
      // Check if a private key is available for signing
      const privateKeyPath = process.env.AUDIT_SIGNING_KEY_PATH;
      if (!privateKeyPath || !fs.existsSync(privateKeyPath)) {
        return undefined;
      }
      
      const privateKey = fs.readFileSync(privateKeyPath);
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      sign.end();
      
      return sign.sign(privateKey, 'base64');
    } catch (error) {
      console.error(`[error] Error signing audit entry: ${error}`);
      return undefined;
    }
  }
  
  /**
   * Record an audit event
   * Implements PCI DSS Requirements 10.2, 10.3, and 10.5
   */
  public recordEvent(event: AuditEvent): string {
    try {
      // Generate a unique ID for this entry
      const entryId = `audit_${crypto.randomBytes(8).toString('hex')}`;
      
      // Determine which log file to use
      const logFile = this.getLogFileForAction(event.action);
      
      // Get the hash of the previous entry (if any)
      const previousHash = this.getLatestEntryHash(logFile);
      
      // Prepare the entry to be stored
      const entryToStore: Omit<StoredAuditEntry, 'entryHash' | 'signature'> = {
        ...event,
        entryId,
        previousHash
      };
      
      // Calculate the hash for this entry
      const entryHash = this.calculateEntryHash(entryToStore);
      
      // Add the hash to the entry
      const entryWithHash: Omit<StoredAuditEntry, 'signature'> = {
        ...entryToStore,
        entryHash
      };
      
      // Sign the entry if possible
      const signature = this.signEntry(JSON.stringify(entryWithHash));
      
      // Create the final entry
      const finalEntry: StoredAuditEntry = {
        ...entryWithHash,
        signature
      };
      
      // Serialize the entry to JSON
      const serializedEntry = JSON.stringify(finalEntry);
      
      // Ensure log directory exists
      this.ensureLogDirectoryExists();
      
      // Append to the appropriate log file
      fs.appendFileSync(logFile, serializedEntry + '\n', {
        mode: 0o640 // Owner: read/write, Group: read, Others: none
      });
      
      // For critical events, also log to console (but redact sensitive details)
      if (event.severity === 'critical') {
        const { details, ...safeEvent } = event;
        console.log(`[security-critical] Audit event: ${JSON.stringify(safeEvent)}`);
      }
      
      return entryId;
    } catch (error) {
      console.error(`[error] Failed to record audit event: ${error}`);
      // Still return a generated ID even if logging failed
      return `error_${Date.now()}`;
    }
  }
  
  /**
   * Verify the integrity of an audit log file
   * Implements PCI DSS Requirement 10.5.5
   */
  public verifyLogIntegrity(logFile: string = this.generalLogFile): {
    intact: boolean;
    totalEntries: number;
    verifiedEntries: number;
    issues?: { entryId: string; reason: string }[];
  } {
    try {
      if (!fs.existsSync(logFile)) {
        return { intact: true, totalEntries: 0, verifiedEntries: 0 };
      }
      
      // Read all log entries
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return { intact: true, totalEntries: 0, verifiedEntries: 0 };
      }
      
      // Verify each entry and the hash chain
      let previousHash: string | undefined;
      const issues: { entryId: string; reason: string }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        try {
          const entry: StoredAuditEntry = JSON.parse(lines[i]);
          
          // Verify the hash chain (except for the first entry)
          if (i > 0 && entry.previousHash !== previousHash) {
            issues.push({
              entryId: entry.entryId,
              reason: 'Hash chain broken: previousHash does not match previous entry\'s hash'
            });
          }
          
          // Verify the entry's own hash
          const { entryHash, signature, ...entryData } = entry;
          const calculatedHash = this.calculateEntryHash(entryData as any);
          
          if (calculatedHash !== entryHash) {
            issues.push({
              entryId: entry.entryId,
              reason: 'Entry hash mismatch: content may have been tampered with'
            });
          }
          
          // TODO: Verify signature if present and public key is available
          
          // Update previous hash for next iteration
          previousHash = entry.entryHash;
        } catch (err) {
          issues.push({
            entryId: `line_${i + 1}`,
            reason: `Invalid audit entry format: ${err}`
          });
        }
      }
      
      return {
        intact: issues.length === 0,
        totalEntries: lines.length,
        verifiedEntries: lines.length - issues.length,
        issues: issues.length > 0 ? issues : undefined
      };
    } catch (error) {
      console.error(`[error] Error verifying audit log integrity: ${error}`);
      return {
        intact: false,
        totalEntries: 0,
        verifiedEntries: 0,
        issues: [{ entryId: 'overall', reason: `Verification error: ${error}` }]
      };
    }
  }
  
  /**
   * Rotate audit logs (useful for maintenance)
   */
  public rotateAuditLogs(maxSizeInMB = 10): void {
    try {
      const logFiles = [
        this.generalLogFile,
        this.paymentLogFile,
        this.authLogFile,
        this.adminLogFile
      ];
      
      for (const logFile of logFiles) {
        if (!fs.existsSync(logFile)) {
          continue;
        }
        
        // Check file size
        const stats = fs.statSync(logFile);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        // Rotate if file size exceeds the limit
        if (fileSizeInMB > maxSizeInMB) {
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const logName = path.basename(logFile, '.log');
          const rotatedLogFile = path.join(
            this.auditLogDir,
            `${logName}-${timestamp}.log`
          );
          
          // Rename current log file to archived log file
          fs.renameSync(logFile, rotatedLogFile);
          
          // Create a new empty log file
          fs.writeFileSync(logFile, '', {
            mode: 0o640 // Owner: read/write, Group: read, Others: none
          });
          
          // Log the rotation
          this.recordEvent({
            timestamp: new Date().toISOString(),
            action: 'AUDIT_LOG_ROTATION',
            resource: `file:${logFile}`,
            result: 'success',
            severity: 'info',
            details: {
              size_mb: fileSizeInMB.toFixed(2),
              old_path: logFile,
              archived_path: rotatedLogFile
            }
          });
          
          console.log(`[security] Rotated audit log ${logFile} to ${rotatedLogFile}`);
        }
      }
    } catch (error) {
      console.error(`[error] Error rotating audit logs: ${error}`);
    }
  }
}

// Create and export a singleton instance
const secureAuditTrail = new SecureAuditTrail();

/**
 * Convenience function to record an audit event
 */
export function recordAuditEvent(event: AuditEvent): string {
  return secureAuditTrail.recordEvent(event);
}

/**
 * Retrieve audit logs from a specific log file
 * @param logType Optional: The type of log to retrieve (payment, auth, admin, or general)
 * @param startTime Optional: The start timestamp to filter logs (ISO date string)
 * @param endTime Optional: The end timestamp to filter logs (ISO date string)
 */
export function getAuditLogs(
  logType?: 'payment' | 'auth' | 'admin' | 'general',
  startTime?: string,
  endTime?: string
): StoredAuditEntry[] {
  try {
    const auditLogDir = path.join(process.cwd(), 'logs', 'audit');
    let logFile: string;
    
    // Determine which log file to use
    switch(logType) {
      case 'payment':
        logFile = path.join(auditLogDir, 'payment-audit.log');
        break;
      case 'auth':
        logFile = path.join(auditLogDir, 'auth-audit.log');
        break;
      case 'admin':
        logFile = path.join(auditLogDir, 'admin-audit.log');
        break;
      default:
        logFile = path.join(auditLogDir, 'general-audit.log');
        break;
    }
    
    // Check if log file exists
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    // Read and parse log file
    const logs = fs.readFileSync(logFile, 'utf-8')
      .trim()
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line) as StoredAuditEntry);
    
    // Filter by time range if provided
    if (startTime || endTime) {
      return logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        const start = startTime ? new Date(startTime).getTime() : 0;
        const end = endTime ? new Date(endTime).getTime() : Infinity;
        
        return logTime >= start && logTime <= end;
      });
    }
    
    return logs;
  } catch (error) {
    console.error(`Error retrieving audit logs: ${error}`);
    return [];
  }
}

export default secureAuditTrail;