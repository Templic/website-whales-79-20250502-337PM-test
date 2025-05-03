/**
 * Secure Audit Trail System
 * 
 * This module implements a secure audit trail system to meet PCI-DSS Requirement 10.5:
 * Secure audit trails so they cannot be altered.
 * 
 * Features:
 * 1. Tamper-evident logging
 * 2. Cryptographic protections
 * 3. Audit access controls
 * 4. Integrity verification
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { log } from '../utils/logger';

// Types
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  resource: string;
  userId?: string;
  ipAddress?: string;
  result: 'success' | 'failure' | 'warning';
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
  hash?: string;
  previousHash?: string;
}

interface AuditChain {
  entries: AuditLogEntry[];
  latestHash: string;
  entryCount: number;
  chainIntact: boolean;
}

// Configuration
const AUDIT_DIR = path.join(process.cwd(), 'logs', 'audit');
const VERIFICATION_INTERVAL = 60 * 60 * 1000; // 1 hour
const HASH_ALGORITHM = 'sha256';
const HASH_ENCODING = 'hex';
const MAX_ENTRIES_PER_FILE = 10000;

// State
let isInitialized = false;
let currentChain: AuditChain;
let verificationInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the secure audit trail system
 */
export function initializeAuditTrail(): void {
  if (isInitialized) {
    log('Secure audit trail already initialized', 'audit');
    return;
  }

  try {
    log('Initializing secure audit trail...', 'audit');
    
    // Create audit directory if it doesn't exist
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
    
    // Load or create the current chain
    currentChain = loadLatestChain();
    
    // Schedule regular integrity verification
    verificationInterval = setInterval(() => {
      verifyAuditTrailIntegrity();
    }, VERIFICATION_INTERVAL);
    
    log('Secure audit trail initialized successfully', 'audit');
    isInitialized = true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to initialize secure audit trail: ${errorMessage}`, 'audit');
  }
}

/**
 * Record an event in the audit trail
 */
export function recordAuditEvent(entry: Omit<AuditLogEntry, 'hash' | 'previousHash'>): boolean {
  if (!isInitialized) {
    log('Secure audit trail not initialized', 'audit');
    return false;
  }

  try {
    // Create a complete entry with hash
    const completeEntry: AuditLogEntry = {
      ...entry,
      previousHash: currentChain.latestHash
    };
    
    // Calculate the hash for this entry
    completeEntry.hash = calculateEntryHash(completeEntry);
    
    // Add to the current chain
    currentChain.entries.push(completeEntry);
    currentChain.latestHash = completeEntry.hash;
    currentChain.entryCount++;
    
    // Save the entry to disk
    saveEntry(completeEntry);
    
    // If we've reached the max entries per file, start a new chain
    if (currentChain.entries.length >= MAX_ENTRIES_PER_FILE) {
      rotateChain();
    }
    
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to record audit event: ${errorMessage}`, 'audit');
    return false;
  }
}

/**
 * Get audit logs for a specific time period
 */
export function getAuditLogs(
  startDate: Date,
  endDate: Date,
  filter?: Partial<AuditLogEntry>
): AuditLogEntry[] {
  if (!isInitialized) {
    log('Secure audit trail not initialized', 'audit');
    return [];
  }

  try {
    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();
    
    // Find all audit files in the date range
    const auditFiles = fs.readdirSync(AUDIT_DIR)
      .filter(file => file.endsWith('.json'))
      .sort();
    
    let logs: AuditLogEntry[] = [];
    
    // Process each file
    for (const file of auditFiles) {
      const filePath = path.join(AUDIT_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        const chain = JSON.parse(fileContent) as AuditChain;
        
        // Filter entries by timestamp
        const filteredEntries = chain.entries.filter(entry => {
          // Check timestamp range
          if (entry.timestamp < startTimestamp || entry.timestamp > endTimestamp) {
            return false;
          }
          
          // Apply additional filters if provided
          if (filter) {
            for (const [key, value] of Object.entries(filter)) {
              if (entry[key] !== value) {
                return false;
              }
            }
          }
          
          return true;
        });
        
        logs = logs.concat(filteredEntries);
      } catch (error) {
        log(`Error parsing audit file ${file}: ${error}`, 'audit');
      }
    }
    
    // Sort by timestamp
    logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    return logs;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to get audit logs: ${errorMessage}`, 'audit');
    return [];
  }
}

/**
 * Generate a report of the audit trail for a specific time period
 */
export function generateAuditReport(
  startDate: Date,
  endDate: Date,
  options?: {
    includeDetails?: boolean;
    filter?: Partial<AuditLogEntry>;
    format?: 'text' | 'json' | 'csv';
    outputPath?: string;
  }
): string {
  const format = options?.format || 'text';
  const includeDetails = options?.includeDetails !== undefined ? options.includeDetails : true;
  
  try {
    const logs = getAuditLogs(startDate, endDate, options?.filter);
    
    if (logs.length === 0) {
      return 'No audit logs found for the specified period.';
    }
    
    let report = '';
    const outputPath = options?.outputPath || path.join(AUDIT_DIR, `audit-report-${new Date().toISOString().replace(/:/g, '-')}.${format}`);
    
    switch (format) {
      case 'json':
        report = JSON.stringify(logs, null, 2);
        fs.writeFileSync(outputPath, report);
        break;
        
      case 'csv':
        // CSV header
        report = 'Timestamp,Action,Resource,UserID,IPAddress,Result,Severity\n';
        
        // CSV rows
        for (const entry of logs) {
          report += `${entry.timestamp},${entry.action},${entry.resource},${entry.userId || ''},${entry.ipAddress || ''},${entry.result},${entry.severity}\n`;
        }
        
        fs.writeFileSync(outputPath, report);
        break;
        
      case 'text':
      default:
        // Text report
        report = `Audit Report: ${startDate.toISOString()} to ${endDate.toISOString()}\n`;
        report += `Generated: ${new Date().toISOString()}\n`;
        report += `Total Entries: ${logs.length}\n\n`;
        
        // Group by action
        const actionGroups: Record<string, AuditLogEntry[]> = {};
        for (const entry of logs) {
          if (!actionGroups[entry.action]) {
            actionGroups[entry.action] = [];
          }
          actionGroups[entry.action].push(entry);
        }
        
        // Group by severity
        const severityCounts = {
          info: logs.filter(e => e.severity === 'info').length,
          warning: logs.filter(e => e.severity === 'warning').length,
          critical: logs.filter(e => e.severity === 'critical').length
        };
        
        report += `Summary by Severity:\n`;
        report += `  Critical: ${severityCounts.critical}\n`;
        report += `  Warning: ${severityCounts.warning}\n`;
        report += `  Info: ${severityCounts.info}\n\n`;
        
        report += `Summary by Action:\n`;
        for (const [action, entries] of Object.entries(actionGroups)) {
          report += `  ${action}: ${entries.length} entries\n`;
        }
        report += '\n';
        
        // Detailed entries
        if (includeDetails) {
          report += 'Detailed Entries:\n';
          for (const entry of logs) {
            report += `[${entry.timestamp}] ${entry.action} - ${entry.resource}\n`;
            report += `  Severity: ${entry.severity}, Result: ${entry.result}\n`;
            
            if (entry.userId) report += `  User ID: ${entry.userId}\n`;
            if (entry.ipAddress) report += `  IP Address: ${entry.ipAddress}\n`;
            
            if (entry.details) {
              report += `  Details: ${JSON.stringify(entry.details, null, 2).replace(/\n/g, '\n  ')}\n`;
            }
            
            report += '\n';
          }
        }
        
        fs.writeFileSync(outputPath, report);
        break;
    }
    
    log(`Audit report generated: ${outputPath}`, 'audit');
    return outputPath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to generate audit report: ${errorMessage}`, 'audit');
    return '';
  }
}

/**
 * Verify the integrity of the entire audit trail
 */
export function verifyAuditTrailIntegrity(): boolean {
  if (!isInitialized) {
    log('Secure audit trail not initialized', 'audit');
    return false;
  }

  try {
    log('Verifying audit trail integrity...', 'audit');
    
    // Find all audit files
    const auditFiles = fs.readdirSync(AUDIT_DIR)
      .filter(file => file.endsWith('.json'))
      .sort();
    
    let previousHash = '';
    let isIntact = true;
    
    // Process each file
    for (const file of auditFiles) {
      const filePath = path.join(AUDIT_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        const chain = JSON.parse(fileContent) as AuditChain;
        
        // Verify the chain
        const verificationResult = verifyChain(chain, previousHash);
        isIntact = isIntact && verificationResult.intact;
        
        if (!verificationResult.intact) {
          log(`Integrity violation detected in audit file: ${file}`, 'audit');
          log(`First integrity error at entry ${verificationResult.firstErrorIndex}`, 'audit');
          
          // Record the integrity violation in the audit log
          recordAuditEvent({
            timestamp: new Date().toISOString(),
            action: 'AUDIT_INTEGRITY_VIOLATION',
            resource: file,
            result: 'failure',
            severity: 'critical',
            details: {
              file,
              errorIndex: verificationResult.firstErrorIndex,
              expectedHash: verificationResult.expectedHash,
              actualHash: verificationResult.actualHash
            }
          });
        }
        
        // Update previous hash for next file
        if (chain.entries.length > 0) {
          previousHash = chain.entries[chain.entries.length - 1].hash || '';
        }
      } catch (error) {
        log(`Error verifying audit file ${file}: ${error}`, 'audit');
        isIntact = false;
      }
    }
    
    // Log verification result
    if (isIntact) {
      log('Audit trail integrity verification passed', 'audit');
      
      // Record successful verification
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'AUDIT_INTEGRITY_VERIFICATION',
        resource: 'audit_trail',
        result: 'success',
        severity: 'info',
        details: {
          filesVerified: auditFiles.length
        }
      });
    } else {
      log('Audit trail integrity verification failed', 'audit');
    }
    
    return isIntact;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to verify audit trail integrity: ${errorMessage}`, 'audit');
    return false;
  }
}

/**
 * Load the latest audit chain or create a new one
 */
function loadLatestChain(): AuditChain {
  // Find all audit files
  const auditFiles = fs.readdirSync(AUDIT_DIR)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  if (auditFiles.length === 0) {
    // No existing chain, create a new one
    return createNewChain();
  }
  
  // Load the latest file
  const latestFile = auditFiles[auditFiles.length - 1];
  const filePath = path.join(AUDIT_DIR, latestFile);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const chain = JSON.parse(fileContent) as AuditChain;
    
    // If the chain is full, create a new one
    if (chain.entries.length >= MAX_ENTRIES_PER_FILE) {
      return createNewChain(chain.latestHash);
    }
    
    // Verify the chain's integrity
    const verificationResult = verifyChain(chain);
    
    if (!verificationResult.intact) {
      log(`Integrity violation detected in latest audit file. Creating new chain.`, 'audit');
      
      // Record the integrity violation
      const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        action: 'AUDIT_INTEGRITY_VIOLATION',
        resource: latestFile,
        result: 'failure',
        severity: 'critical',
        details: {
          file: latestFile,
          errorIndex: verificationResult.firstErrorIndex,
          expectedHash: verificationResult.expectedHash,
          actualHash: verificationResult.actualHash
        },
        hash: '',
        previousHash: ''
      };
      
      // Create a new chain with this violation as the first entry
      const newChain = createNewChain();
      
      // Calculate hash for the entry
      entry.hash = calculateEntryHash(entry);
      newChain.entries.push(entry);
      newChain.latestHash = entry.hash;
      newChain.entryCount = 1;
      
      // Save the new chain
      saveChain(newChain);
      
      return newChain;
    }
    
    return chain;
  } catch (error) {
    log(`Error loading latest audit chain: ${error}. Creating new chain.`, 'audit');
    return createNewChain();
  }
}

/**
 * Create a new audit chain
 */
function createNewChain(previousHash: string = ''): AuditChain {
  return {
    entries: [],
    latestHash: previousHash,
    entryCount: 0,
    chainIntact: true
  };
}

/**
 * Calculate the hash for an audit entry
 */
function calculateEntryHash(entry: AuditLogEntry): string {
  // Create a copy of the entry without the hash field
  const hashableEntry = { ...entry };
  delete hashableEntry.hash;
  
  // Serialize and hash
  const entryString = JSON.stringify(hashableEntry);
  return crypto.createHash(HASH_ALGORITHM).update(entryString).digest(HASH_ENCODING as crypto.BinaryToTextEncoding);
}

/**
 * Save an audit entry to the current chain file
 */
function saveEntry(entry: AuditLogEntry): void {
  // Get the current chain file path
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const chainFile = `audit-${timestamp}-${currentChain.entryCount}.json`;
  const filePath = path.join(AUDIT_DIR, chainFile);
  
  // Update the chain's entry count
  currentChain.entryCount = currentChain.entries.length;
  
  // Save the updated chain
  saveChain(currentChain, filePath);
}

/**
 * Save the entire chain to a file
 */
function saveChain(chain: AuditChain, filePath?: string): void {
  if (!filePath) {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    filePath = path.join(AUDIT_DIR, `audit-${timestamp}-${chain.entryCount}.json`);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(chain, null, 2));
}

/**
 * Rotate to a new chain when the current one is full
 */
function rotateChain(): void {
  const previousHash = currentChain.latestHash;
  
  // Create a new chain
  currentChain = createNewChain(previousHash);
  
  log(`Audit chain rotated. New chain created with previous hash: ${previousHash.substring(0, 10)}...`, 'audit');
}

/**
 * Verify the integrity of a chain
 */
function verifyChain(
  chain: AuditChain,
  initialPreviousHash: string = ''
): {
  intact: boolean;
  firstErrorIndex: number;
  expectedHash: string;
  actualHash: string;
} {
  if (chain.entries.length === 0) {
    return {
      intact: true,
      firstErrorIndex: -1,
      expectedHash: '',
      actualHash: ''
    };
  }
  
  let previousHash = initialPreviousHash;
  
  for (let i = 0; i < chain.entries.length; i++) {
    const entry = chain.entries[i];
    
    // Check previous hash
    if (entry.previousHash !== previousHash) {
      return {
        intact: false,
        firstErrorIndex: i,
        expectedHash: previousHash,
        actualHash: entry.previousHash || ''
      };
    }
    
    // Recalculate hash
    const calculatedHash = calculateEntryHash(entry);
    
    // Check hash
    if (entry.hash !== calculatedHash) {
      return {
        intact: false,
        firstErrorIndex: i,
        expectedHash: calculatedHash,
        actualHash: entry.hash || ''
      };
    }
    
    // Update previous hash for next entry
    previousHash = entry.hash || '';
  }
  
  return {
    intact: true,
    firstErrorIndex: -1,
    expectedHash: '',
    actualHash: ''
  };
}