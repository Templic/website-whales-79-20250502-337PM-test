/**
 * TypeScript Security Scanner
 * 
 * Integrates the TypeScript Error Management System with the security scanning
 * infrastructure to detect and remediate security-relevant TypeScript errors.
 */

import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';

// Temporarily define the required types directly rather than importing them
// import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/SecurityFabric';
// import { ImmutableSecurityLogs } from '../advanced/blockchain/SecurityEventTypes';
// import { ScanResult, SecurityScanQueue } from '../advanced/scan/SecurityScanQueue';
// import { SecurityScanPriority, SecurityScanStatus } from '../advanced/scan/SecurityScanTypes';

// Security event categories
enum SecurityEventCategory {
  SYSTEM = 'SYSTEM',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  ANOMALY = 'ANOMALY',
  TYPE_CHECKING = 'TYPE_CHECKING',
  API = 'API'
}

// Security event severities
enum SecurityEventSeverity {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

// Scan result interface
interface ScanResult {
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

// Security scan status enum
enum SecurityScanStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Security scan priority enum
enum SecurityScanPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Mock SecurityScanQueue class
class SecurityScanQueue {
  constructor() {}
  
  registerScanner(name: string, scannerFn: (params: any) => Promise<ScanResult>): void {
    console.log(`[SecurityScanQueue] Registered scanner: ${name}`);
  }
  
  scheduleScan(schedule: {
    scanType: string;
    name: string;
    description: string;
    priority: SecurityScanPriority;
    schedule: string;
    params?: any;
  }): void {
    console.log(`[SecurityScanQueue] Scheduled scan: ${schedule.name}`);
  }
  
  async runScan(scan: {
    scanType: string;
    name: string;
    description: string;
    priority: SecurityScanPriority;
    params?: any;
  }): Promise<ScanResult> {
    console.log(`[SecurityScanQueue] Running scan: ${scan.name}`);
    return {
      id: `mock-scan-${Date.now()}`,
      name: scan.name,
      status: SecurityScanStatus.COMPLETED,
      timestamp: new Date().toISOString(),
      duration: 0,
      summary: 'Mock scan completed',
      details: 'This is a mock scan result'
    };
  }
}

// Mock for ImmutableSecurityLogs
const ImmutableSecurityLogs = {
  addSecurityEvent: async (event: any) => {
    console.log(`[ImmutableSecurityLogs] Recording security event: ${event.message}`);
  }
};

/**
 * TypeScript security scan result
 */
interface TypeScriptSecurityScanResult extends ScanResult {
  securityIssues: {
    id: string;
    category: string;
    severity: string;
    description: string;
    location: {
      file: string;
      line: number;
      column: number;
    };
    cwe?: string;
    fix?: {
      description: string;
      automated: boolean;
    };
  }[];
  statistics: {
    totalFilesScanned: number;
    totalLinesScanned: number;
    totalIssuesFound: number;
    totalAutomatableIssues: number;
    scanDuration: number;
  };
}

/**
 * TypeScript security scan configuration
 */
interface TypeScriptSecurityScanConfig {
  includePatterns: string[];
  excludePatterns: string[];
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  maxIssues?: number;
  fixAutomatically?: boolean;
  securityCategoriesOnly?: boolean;
}

/**
 * Default configuration for TypeScript security scans
 */
const defaultScanConfig: TypeScriptSecurityScanConfig = {
  includePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  severityThreshold: 'medium',
  maxIssues: 100,
  fixAutomatically: false,
  securityCategoriesOnly: true
};

/**
 * Run a command asynchronously and return the output
 */
async function runCommand(command: string, args: string[], cwd = process.cwd()): Promise<string> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('error', (error) => {
      reject(new Error(`Failed to run command: ${error.message}`));
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command exited with code ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * Register the TypeScript security scanner with the security scan queue
 */
export function registerTypeScriptSecurityScanner(queue: SecurityScanQueue): void {
  console.log('[TypeScriptSecurity] Registering TypeScript security scanner with security scan queue');
  
  // Register scanner with the queue
  queue.registerScanner('typescript-security', async (params: any = {}): Promise<ScanResult> => {
    console.log('[TypeScriptSecurity] Starting TypeScript security scan');
    const startTime = Date.now();
    
    try {
      // Merge provided params with default config
      const config: TypeScriptSecurityScanConfig = {
        ...defaultScanConfig,
        ...params
      };
      
      // Create a temporary configuration file for the scan
      const configPath = path.join(process.cwd(), 'tmp', 'ts-security-scan-config.json');
      const configDir = path.dirname(configPath);
      
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      // Run the TypeScript security scan
      const args = [
        'run-typescript-error-system.ts',
        '--project', '.',
        '--config', configPath,
        '--security-only'
      ];
      
      if (config.fixAutomatically) {
        args.push('--fix');
      }
      
      const output = await runCommand('npx', ['ts-node', ...args]);
      
      // Parse the scan results
      const resultMatch = output.match(/\{[\s\S]*\}/);
      let securityIssues = [];
      let statistics = {
        totalFilesScanned: 0,
        totalLinesScanned: 0,
        totalIssuesFound: 0,
        totalAutomatableIssues: 0,
        scanDuration: 0
      };
      
      if (resultMatch) {
        try {
          const result = JSON.parse(resultMatch[0]);
          securityIssues = result.securityIssues || [];
          statistics = result.statistics || statistics;
        } catch (error) {
          console.error('[TypeScriptSecurity] Failed to parse scan result:', error);
        }
      }
      
      // Log security events for each security issue
      await Promise.all(securityIssues.map(async (issue: any) => {
        // Map severity to SecurityEventSeverity
        let severity: SecurityEventSeverity;
        switch (issue.severity) {
          case 'critical':
            severity = SecurityEventSeverity.CRITICAL;
            break;
          case 'high':
            severity = SecurityEventSeverity.ERROR;
            break;
          case 'medium':
            severity = SecurityEventSeverity.WARNING;
            break;
          default:
            severity = SecurityEventSeverity.INFO;
        }
        
        // Log the security event to the immutable log
        await securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.TYPE_CHECKING,
          severity,
          message: `TypeScript security issue: ${issue.description}`,
          timestamp: Date.now(),
          metadata: {
            issueId: issue.id,
            cwe: issue.cwe,
            file: issue.location.file,
            line: issue.location.line,
            column: issue.location.column,
            fixable: issue.fix?.automated || false,
            scanId: params.scanId || 'manual-scan'
          }
        });
      }));
      
      const scanDuration = Date.now() - startTime;
      
      // Clean up temporary config file
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      
      // Return scan result
      return {
        id: params.scanId || `ts-security-${Date.now()}`,
        name: 'TypeScript Security Scan',
        status: SecurityScanStatus.COMPLETED,
        timestamp: new Date().toISOString(),
        duration: scanDuration,
        summary: `Found ${securityIssues.length} TypeScript security issues`,
        details: `Scanned ${statistics.totalFilesScanned} files, ${statistics.totalLinesScanned} lines of code`,
        securityIssues,
        statistics: {
          ...statistics,
          scanDuration
        }
      };
    } catch (error: any) {
      console.error('[TypeScriptSecurity] Scan failed:', error);
      
      return {
        id: params.scanId || `ts-security-${Date.now()}`,
        name: 'TypeScript Security Scan',
        status: SecurityScanStatus.FAILED,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        summary: 'TypeScript security scan failed',
        details: `Error: ${error?.message || 'Unknown error'}`,
        error: error?.message || 'Unknown error'
      };
    }
  });
  
  // Schedule regular scans
  queue.scheduleScan({
    scanType: 'typescript-security',
    name: 'Scheduled TypeScript Security Scan',
    description: 'Regular scan for TypeScript security issues',
    priority: SecurityScanPriority.MEDIUM,
    schedule: '0 0 * * *', // Daily at midnight
    params: {
      severityThreshold: 'medium',
      fixAutomatically: false,
      securityCategoriesOnly: true
    }
  });
  
  console.log('[TypeScriptSecurity] TypeScript security scanner registered successfully');
}

/**
 * Perform an immediate TypeScript security scan
 */
export async function runTypeScriptSecurityScan(
  config: Partial<TypeScriptSecurityScanConfig> = {},
  scanQueue: SecurityScanQueue
): Promise<TypeScriptSecurityScanResult> {
  console.log('[TypeScriptSecurity] Initiating immediate TypeScript security scan');
  
  const scanId = `manual-ts-scan-${Date.now()}`;
  
  const result = await scanQueue.runScan({
    scanType: 'typescript-security',
    name: 'Manual TypeScript Security Scan',
    description: 'User-initiated TypeScript security scan',
    priority: SecurityScanPriority.HIGH,
    params: {
      ...config,
      scanId
    }
  });
  
  return result as TypeScriptSecurityScanResult;
}

// For internal security registry
const securityBlockchain = {
  addSecurityEvent: async (event: any) => {
    try {
      // Check if ImmutableSecurityLogs is available
      if (typeof ImmutableSecurityLogs?.addSecurityEvent === 'function') {
        await ImmutableSecurityLogs.addSecurityEvent(event);
      } else {
        console.log('[TypeScriptSecurity] Security event recorded:', event.message);
      }
    } catch (error: any) {
      console.error('[TypeScriptSecurity] Failed to record security event:', error?.message || 'Unknown error');
    }
  }
};