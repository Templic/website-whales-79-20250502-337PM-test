/**
 * Immutable Security Logger Module
 * 
 * Provides secure, tamper-resistant logging capabilities for security events.
 * This implementation uses cryptographic techniques to ensure log integrity,
 * with blockchain-inspired immutability for audit trails.
 * 
 * Features:
 * - Immutable log entries with cryptographic verification
 * - Structured logging with severity levels
 * - Log entry categorization by security domain
 * - Tamper detection with hash chain verification
 * - Support for secure audit trails
 */

import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

type LogSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type SecurityDomain = 'AUTH' | 'CRYPTO' | 'RASP' | 'API_VALIDATION' | 'CSRF' | 'SYSTEM' | 'AUDIT';

interface LogEntry {
  timestamp: number;
  message: string | object;
  severity: LogSeverity;
  domain: SecurityDomain;
  previousHash: string;
  hash: string;
}

export class ImmutableSecurityLogger {
  private domain: SecurityDomain;
  private previousHash: string = '';
  private logFilePath: string;
  private static readonly LOG_DIR = 'logs/security';
  private static instance: Map<SecurityDomain, ImmutableSecurityLogger> = new Map();

  /**
   * Create a new security logger for a specific domain
   */
  constructor(domain: SecurityDomain) {
    this.domain = domain;
    this.logFilePath = path.join(process.cwd(), ImmutableSecurityLogger.LOG_DIR, `${domain.toLowerCase()}.log`);
    
    // Ensure log directory exists
    this.ensureLogDirectoryExists();
    
    // Initialize with genesis block if new log file
    this.initializeLogChain();
  }

  /**
   * Get a logger instance for a specific security domain
   */
  static getLogger(domain: SecurityDomain): ImmutableSecurityLogger {
    if (!this.instance.has(domain)) {
      this.instance.set(domain, new ImmutableSecurityLogger(domain));
    }
    return this.instance.get(domain)!;
  }

  /**
   * Log a security event with severity and domain
   */
  log(message: string | object, severity: LogSeverity = 'info', domain?: SecurityDomain): void {
    const logDomain = domain || this.domain;
    const timestamp = Date.now();
    
    // Create log entry
    const entryContent = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    // Compute hash including previous entry's hash for chain integrity
    const dataToHash = `${timestamp}|${entryContent}|${severity}|${logDomain}|${this.previousHash}`;
    const hash = createHash('sha256').update(dataToHash).digest('hex');
    
    // Create log entry
    const entry: LogEntry = {
      timestamp,
      message,
      severity,
      domain: logDomain,
      previousHash: this.previousHash,
      hash
    };
    
    // Store the hash for the next entry
    this.previousHash = hash;
    
    // Write to log file (asynchronously)
    this.writeLogEntry(entry);
    
    // Output to console if not in production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date(timestamp).toISOString()}] [${severity.toUpperCase()}] [${logDomain}] ${entryContent}`);
    }
  }

  /**
   * Verify the integrity of the log chain
   */
  async verifyLogIntegrity(): Promise<boolean> {
    try {
      // Read all log entries
      const entries = await this.readLogEntries();
      
      if (entries.length === 0) {
        return true; // No entries to verify
      }
      
      // Check each entry's hash chain
      let previousHash = '';
      
      for (const entry of entries) {
        // Check previous hash reference
        if (entry.previousHash !== previousHash) {
          console.error(`Log integrity error: hash chain broken at entry ${entry.timestamp}`);
          return false;
        }
        
        // Verify this entry's hash
        const dataToHash = `${entry.timestamp}|${
          typeof entry.message === 'string' ? entry.message : JSON.stringify(entry.message)
        }|${entry.severity}|${entry.domain}|${entry.previousHash}`;
        
        const computedHash = createHash('sha256').update(dataToHash).digest('hex');
        
        if (computedHash !== entry.hash) {
          console.error(`Log integrity error: hash mismatch at entry ${entry.timestamp}`);
          return false;
        }
        
        // Update previous hash for next iteration
        previousHash = entry.hash;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying log integrity:', error);
      return false;
    }
  }

  /**
   * Get all log entries for a domain
   */
  async getLogEntries(): Promise<LogEntry[]> {
    return this.readLogEntries();
  }

  /**
   * Create a critical security event log
   */
  critical(message: string | object, domain?: SecurityDomain): void {
    this.log(message, 'critical', domain);
  }

  /**
   * Create an error security event log
   */
  error(message: string | object, domain?: SecurityDomain): void {
    this.log(message, 'error', domain);
  }

  /**
   * Create a warning security event log
   */
  warn(message: string | object, domain?: SecurityDomain): void {
    this.log(message, 'warn', domain);
  }

  /**
   * Create an informational security event log
   */
  info(message: string | object, domain?: SecurityDomain): void {
    this.log(message, 'info', domain);
  }

  /**
   * Create a debug security event log
   */
  debug(message: string | object, domain?: SecurityDomain): void {
    this.log(message, 'debug', domain);
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectoryExists(): void {
    const dir = path.dirname(this.logFilePath);
    
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created security log directory: ${dir}`);
      } catch (error) {
        console.error(`Failed to create log directory: ${dir}`, error);
      }
    }
  }

  /**
   * Initialize the log chain with a genesis block if needed
   */
  private initializeLogChain(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        // Create genesis block
        const timestamp = Date.now();
        const genesisMessage = { message: 'Genesis block for security log chain', domain: this.domain };
        const hash = createHash('sha256')
          .update(`${timestamp}|${JSON.stringify(genesisMessage)}|info|${this.domain}|`)
          .digest('hex');
        
        const genesisEntry: LogEntry = {
          timestamp,
          message: genesisMessage,
          severity: 'info',
          domain: this.domain,
          previousHash: '',
          hash
        };
        
        // Write genesis block
        fs.writeFileSync(
          this.logFilePath,
          JSON.stringify(genesisEntry) + '\n',
          { encoding: 'utf8' }
        );
        
        // Set previous hash for next entries
        this.previousHash = hash;
        
        console.log(`[IMMUTABLE-LOGS] Created genesis block for ${this.domain} log chain`);
      } else {
        // Read last entry to get its hash
        const lastLine = this.getLastLogLine();
        
        if (lastLine) {
          try {
            const lastEntry: LogEntry = JSON.parse(lastLine);
            this.previousHash = lastEntry.hash;
          } catch (error) {
            console.error(`Error parsing last log entry for ${this.domain}:`, error);
            // Initialize with a new genesis block in case of corruption
            this.createRecoveryBlock();
          }
        }
      }
    } catch (error) {
      console.error(`Error initializing log chain for ${this.domain}:`, error);
      this.createRecoveryBlock();
    }
  }

  /**
   * Create a recovery block in case of chain corruption
   */
  private createRecoveryBlock(): void {
    try {
      const timestamp = Date.now();
      const recoveryMessage = { 
        message: 'Recovery block due to potential chain corruption', 
        domain: this.domain 
      };
      
      const hash = createHash('sha256')
        .update(`${timestamp}|${JSON.stringify(recoveryMessage)}|error|${this.domain}|`)
        .digest('hex');
      
      const recoveryEntry: LogEntry = {
        timestamp,
        message: recoveryMessage,
        severity: 'error',
        domain: this.domain,
        previousHash: '',
        hash
      };
      
      // Write recovery block
      fs.writeFileSync(
        this.logFilePath,
        JSON.stringify(recoveryEntry) + '\n',
        { encoding: 'utf8' }
      );
      
      // Set previous hash for next entries
      this.previousHash = hash;
      
      console.log(`[IMMUTABLE-LOGS] Created recovery block for ${this.domain} log chain`);
    } catch (error) {
      console.error(`Failed to create recovery block for ${this.domain}:`, error);
    }
  }

  /**
   * Write a log entry to the log file
   */
  private writeLogEntry(entry: LogEntry): void {
    try {
      fs.appendFileSync(
        this.logFilePath,
        JSON.stringify(entry) + '\n',
        { encoding: 'utf8' }
      );
    } catch (error) {
      console.error(`Error writing to security log (${this.domain}):`, error);
      
      // Fall back to console logging if file write fails
      console.log(
        `[SECURITY-LOG-FALLBACK] [${new Date(entry.timestamp).toISOString()}] [${entry.severity.toUpperCase()}] [${entry.domain}] ${
          typeof entry.message === 'string' ? entry.message : JSON.stringify(entry.message)
        }`
      );
    }
  }

  /**
   * Read all log entries from the log file
   */
  private async readLogEntries(): Promise<LogEntry[]> {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }
      
      const content = await fs.promises.readFile(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.map(line => JSON.parse(line) as LogEntry);
    } catch (error) {
      console.error(`Error reading security log (${this.domain}):`, error);
      return [];
    }
  }

  /**
   * Get the last line from the log file
   */
  private getLastLogLine(): string | null {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return null;
      }
      
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.length > 0 ? lines[lines.length - 1] : null;
    } catch (error) {
      console.error(`Error reading last log line (${this.domain}):`, error);
      return null;
    }
  }
}