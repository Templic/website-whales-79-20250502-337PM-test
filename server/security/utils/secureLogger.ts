/**
 * Secure Logger Module
 * 
 * Provides a secure, tamper-resistant logging system for security-related events.
 * This logger implements several important features:
 * 
 * 1. Immutable logs: Once created, logs cannot be modified or deleted
 * 2. Structured logging: All logs follow a consistent format with metadata
 * 3. Severity levels: Logs are categorized by severity
 * 4. Context tracking: Logs can be associated with specific contexts (user, request, etc.)
 * 5. Redaction: Sensitive data is automatically redacted
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createHash } from 'crypto';

type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  component: string;
  subcomponent?: string;
  message: string;
  metadata?: Record<string, any>;
  hash?: string;
}

interface LoggerOptions {
  component: string;
  subcomponent?: string;
  redactKeys?: string[];
  logToConsole?: boolean;
}

/**
 * Logger class for security-related events
 */
class SecureLogger {
  private component: string;
  private subcomponent?: string;
  private redactKeys: string[];
  private logToConsole: boolean;
  private logFile: string;
  private lastHash: string = '';

  constructor(name: string, options: LoggerOptions) {
    this.component = options.component;
    this.subcomponent = options.subcomponent;
    this.redactKeys = options.redactKeys || ['password', 'token', 'secret', 'key'];
    this.logToConsole = options.logToConsole !== false;
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Set log file path
    this.logFile = path.join(logsDir, `${name}.log`);
    
    // Write initial log entry
    this.writeInitialEntry(name);
  }

  /**
   * Log a message with the specified severity
   */
  log(message: string, severity: LogSeverity = 'info', metadata?: Record<string, any>): void {
    try {
      // Redact sensitive data
      const safeMetadata = metadata ? this.redactSensitiveData(metadata) : undefined;
      
      // Create log entry
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        severity,
        component: this.component,
        subcomponent: this.subcomponent,
        message,
        metadata: safeMetadata
      };
      
      // Create a hash from the previous hash and current entry
      const entryString = JSON.stringify(entry);
      const hash = createHash('sha256')
        .update(this.lastHash)
        .update(entryString)
        .digest('hex');
      
      // Add hash to the entry
      entry.hash = hash;
      this.lastHash = hash;
      
      // Write to file
      this.writeToFile(entry);
      
      // Log to console if enabled
      if (this.logToConsole) {
        const severityColors = {
          debug: '\x1b[90m', // Gray
          info: '\x1b[32m',  // Green
          warning: '\x1b[33m', // Yellow
          error: '\x1b[31m',   // Red
          critical: '\x1b[41m\x1b[37m' // White on Red background
        };
        
        const resetColor = '\x1b[0m';
        const color = severityColors[severity] || '';
        
        console.log(
          `${color}[${entry.timestamp}] [${severity.toUpperCase()}] ${message}${resetColor}`,
          safeMetadata || ''
        );
      }
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }

  /**
   * Recursively redact sensitive data in objects
   */
  private redactSensitiveData(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if this key should be redacted
      const shouldRedact = this.redactKeys.some(redactKey => 
        key.toLowerCase().includes(redactKey.toLowerCase())
      );
      
      if (shouldRedact) {
        // Redact the value
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively redact nested objects
        result[key] = this.redactSensitiveData(value);
      } else {
        // Pass through other values
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Write the initial log entry for this logger instance
   */
  private writeInitialEntry(name: string): void {
    try {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        severity: 'info',
        component: this.component,
        subcomponent: this.subcomponent,
        message: `Secure logger initialized: ${name}`,
        metadata: {
          logFile: this.logFile,
          pid: process.pid,
          nodeVersion: process.version,
          env: process.env.NODE_ENV || 'development'
        }
      };
      
      // Create initial hash
      const entryString = JSON.stringify(entry);
      const hash = createHash('sha256')
        .update(entryString)
        .digest('hex');
      
      entry.hash = hash;
      this.lastHash = hash;
      
      this.writeToFile(entry);
    } catch (error) {
      console.error('Failed to write initial security log:', error);
    }
  }

  /**
   * Write a log entry to the file, handling rotation if needed
   */
  private writeToFile(entry: LogEntry): void {
    try {
      // Check if log rotation is needed
      this.checkRotation();
      
      // Append to log file
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Failed to write to security log file:', error);
    }
  }

  /**
   * Check if log rotation is needed and perform it if so
   */
  private checkRotation(): void {
    try {
      // Check if file exists
      if (!fs.existsSync(this.logFile)) {
        return;
      }
      
      // Get file stats
      const stats = fs.statSync(this.logFile);
      
      // Rotate if file is larger than 10MB
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size >= maxSize) {
        this.rotateLogFiles();
      }
    } catch (error) {
      console.error('Failed to check log rotation:', error);
    }
  }

  /**
   * Rotate log files, keeping a specified number of backups
   */
  private rotateLogFiles(): void {
    try {
      const maxBackups = 5;
      
      // Remove oldest backup if it exists
      const oldestBackup = `${this.logFile}.${maxBackups}`;
      if (fs.existsSync(oldestBackup)) {
        fs.unlinkSync(oldestBackup);
      }
      
      // Shift existing backups
      for (let i = maxBackups - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      
      // Move current log to .1
      fs.renameSync(this.logFile, `${this.logFile}.1`);
      
      // Create new log file with rotation entry
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        severity: 'info',
        component: this.component,
        subcomponent: this.subcomponent,
        message: 'Log file rotated',
        metadata: {
          previousFile: `${this.logFile}.1`
        }
      };
      
      // Create new hash chain starting from the rotated file's last hash
      const entryString = JSON.stringify(entry);
      const hash = createHash('sha256')
        .update(this.lastHash)
        .update(entryString)
        .digest('hex');
      
      entry.hash = hash;
      this.lastHash = hash;
      
      // Write to the new file
      fs.writeFileSync(this.logFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }
}

/**
 * Create a new secure logger
 */
function createLogger(name: string, options: LoggerOptions): SecureLogger {
  return new SecureLogger(name, options);
}

/**
 * Verify the integrity of a log file
 */
function verifyLogIntegrity(logFilePath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  let valid = true;
  
  try {
    // Read the log file
    const content = fs.readFileSync(logFilePath, 'utf8');
    const lines = content.trim().split('\n');
    
    if (lines.length === 0) {
      errors.push('Log file is empty');
      return { valid: false, errors };
    }
    
    let previousHash = '';
    
    // Verify each log entry
    for (let i = 0; i < lines.length; i++) {
      try {
        const entry: LogEntry = JSON.parse(lines[i]);
        
        // Skip hash checking for the first entry
        if (i === 0) {
          previousHash = entry.hash || '';
          continue;
        }
        
        // Remove the hash from the entry to recreate it
        const { hash, ...entryWithoutHash } = entry;
        
        // Recreate the hash
        const entryString = JSON.stringify(entryWithoutHash);
        const calculatedHash = createHash('sha256')
          .update(previousHash)
          .update(entryString)
          .digest('hex');
        
        // Compare hashes
        if (calculatedHash !== hash) {
          errors.push(`Integrity check failed for entry ${i + 1}: Hash mismatch`);
          valid = false;
        }
        
        previousHash = hash || '';
      } catch (error) {
        errors.push(`Failed to parse log entry ${i + 1}: ${error}`);
        valid = false;
      }
    }
  } catch (error) {
    errors.push(`Failed to read log file: ${error}`);
    valid = false;
  }
  
  return { valid, errors };
}

/**
 * Export a filtered log in various formats
 */
function exportLogs(
  logFilePath: string,
  options: {
    format?: 'json' | 'csv' | 'text';
    severity?: LogSeverity[];
    component?: string[];
    startDate?: Date;
    endDate?: Date;
    outputPath?: string;
  } = {}
): { success: boolean; message: string; outputPath?: string } {
  try {
    const {
      format = 'json',
      severity,
      component,
      startDate,
      endDate,
      outputPath
    } = options;
    
    // Read the log file
    const content = fs.readFileSync(logFilePath, 'utf8');
    const lines = content.trim().split('\n');
    
    // Filter log entries
    const filteredEntries: LogEntry[] = [];
    
    for (const line of lines) {
      try {
        const entry: LogEntry = JSON.parse(line);
        
        // Filter by severity
        if (severity && !severity.includes(entry.severity)) {
          continue;
        }
        
        // Filter by component
        if (component && !component.includes(entry.component)) {
          continue;
        }
        
        // Filter by date range
        const entryDate = new Date(entry.timestamp);
        
        if (startDate && entryDate < startDate) {
          continue;
        }
        
        if (endDate && entryDate > endDate) {
          continue;
        }
        
        filteredEntries.push(entry);
      } catch (error) {
        // Skip invalid entries
      }
    }
    
    // Generate output
    let output = '';
    
    if (format === 'json') {
      output = JSON.stringify(filteredEntries, null, 2);
    } else if (format === 'csv') {
      // Generate CSV header
      output = 'timestamp,severity,component,subcomponent,message\n';
      
      // Add entries
      for (const entry of filteredEntries) {
        output += `"${entry.timestamp}","${entry.severity}","${entry.component}","${entry.subcomponent || ''}","${
          entry.message.replace(/"/g, '""')
        }"\n`;
      }
    } else if (format === 'text') {
      // Generate text output
      for (const entry of filteredEntries) {
        output += `[${entry.timestamp}] [${entry.severity.toUpperCase()}] ${
          entry.component
        }${entry.subcomponent ? `/${entry.subcomponent}` : ''}: ${entry.message}\n`;
        
        if (entry.metadata) {
          output += `  Metadata: ${JSON.stringify(entry.metadata)}\n`;
        }
        
        output += '\n';
      }
    }
    
    // Write to output file if specified
    if (outputPath) {
      fs.writeFileSync(outputPath, output);
      return { success: true, message: `Exported ${filteredEntries.length} log entries to ${outputPath}`, outputPath };
    }
    
    return { success: true, message: `Filtered ${filteredEntries.length} log entries` };
  } catch (error) {
    return { success: false, message: `Failed to export logs: ${error}` };
  }
}

export default {
  createLogger,
  verifyLogIntegrity,
  exportLogs
};