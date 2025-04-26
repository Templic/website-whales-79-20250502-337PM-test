/**
 * Deep Scan Engine
 * 
 * This module provides comprehensive security scanning capabilities
 * that perform deep analysis of application code, configurations,
 * and runtime behavior to identify security vulnerabilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { securityFabric } from '../SecurityFabric';
import { securityBlockchain } from '../blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../blockchain/SecurityEventTypes';

/**
 * Deep scan types
 */
export enum DeepScanType {
  /**
   * Code scan
   */
  CODE = 'code',
  
  /**
   * Configuration scan
   */
  CONFIGURATION = 'configuration',
  
  /**
   * API security scan
   */
  API = 'api',
  
  /**
   * Full scan (all types)
   */
  FULL = 'full'
}

/**
 * Vulnerability severity
 */
export enum VulnerabilitySeverity {
  /**
   * Critical severity
   */
  CRITICAL = 'critical',
  
  /**
   * High severity
   */
  HIGH = 'high',
  
  /**
   * Medium severity
   */
  MEDIUM = 'medium',
  
  /**
   * Low severity
   */
  LOW = 'low',
  
  /**
   * Info severity
   */
  INFO = 'info'
}

/**
 * Vulnerability type
 */
export enum VulnerabilityType {
  /**
   * SQL injection
   */
  SQL_INJECTION = 'sql-injection',
  
  /**
   * Cross-site scripting (XSS)
   */
  XSS = 'xss',
  
  /**
   * Cross-site request forgery (CSRF)
   */
  CSRF = 'csrf',
  
  /**
   * Authentication bypass
   */
  AUTH_BYPASS = 'auth-bypass',
  
  /**
   * Insecure configuration
   */
  INSECURE_CONFIGURATION = 'insecure-configuration',
  
  /**
   * Sensitive data exposure
   */
  SENSITIVE_DATA_EXPOSURE = 'sensitive-data-exposure',
  
  /**
   * Using components with known vulnerabilities
   */
  KNOWN_VULNERABLE_COMPONENT = 'known-vulnerable-component',
  
  /**
   * Other vulnerability types
   */
  OTHER = 'other'
}

/**
 * Deep scan options
 */
export interface DeepScanOptions {
  /**
   * Scan types to perform
   */
  scanTypes?: DeepScanType[];
  
  /**
   * Files to include in the scan
   */
  includeFiles?: string[];
  
  /**
   * Files to exclude from the scan
   */
  excludeFiles?: string[];
  
  /**
   * Minimum severity level to report
   */
  minimumSeverity?: VulnerabilitySeverity;
  
  /**
   * Maximum depth for recursive scans
   */
  maxDepth?: number;
}

/**
 * Vulnerability finding interface
 */
export interface VulnerabilityFinding {
  /**
   * Finding ID
   */
  id: string;
  
  /**
   * Vulnerability type
   */
  type: VulnerabilityType;
  
  /**
   * Vulnerability severity
   */
  severity: VulnerabilitySeverity;
  
  /**
   * Description of the vulnerability
   */
  description: string;
  
  /**
   * Location of the vulnerability (file path, line number, etc.)
   */
  location?: string;
  
  /**
   * Code snippet where the vulnerability was found
   */
  code?: string;
  
  /**
   * Remediation steps
   */
  remediation?: string;
  
  /**
   * Confidence level (0-1)
   */
  confidence: number;
  
  /**
   * CWE ID if applicable
   */
  cweId?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Deep scan result interface
 */
export interface DeepScanResult {
  /**
   * Scan ID
   */
  scanId: string;
  
  /**
   * Scan types performed
   */
  scanTypes: DeepScanType[];
  
  /**
   * Timestamp when the scan started
   */
  startTime: Date;
  
  /**
   * Timestamp when the scan finished
   */
  endTime: Date;
  
  /**
   * Duration of the scan in milliseconds
   */
  duration: number;
  
  /**
   * Scan options
   */
  options: DeepScanOptions;
  
  /**
   * Vulnerability findings
   */
  findings: VulnerabilityFinding[];
  
  /**
   * Summary statistics
   */
  summary: {
    /**
     * Total number of findings
     */
    totalFindings: number;
    
    /**
     * Number of critical findings
     */
    criticalFindings: number;
    
    /**
     * Number of high findings
     */
    highFindings: number;
    
    /**
     * Number of medium findings
     */
    mediumFindings: number;
    
    /**
     * Number of low findings
     */
    lowFindings: number;
    
    /**
     * Number of info findings
     */
    infoFindings: number;
    
    /**
     * Files scanned
     */
    filesScanned: number;
    
    /**
     * Lines of code scanned
     */
    linesScanned: number;
  };
  
  /**
   * Errors encountered during the scan
   */
  errors: string[];
}

/**
 * Deep scan engine class
 */
export class DeepScanEngine {
  /**
   * Active scans
   */
  private activeScans: Map<string, DeepScanResult> = new Map();
  
  /**
   * Whether the engine is initialized
   */
  private initialized: boolean = false;
  
  /**
   * Initialize the deep scan engine
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Register the deep scan engine with the security fabric
    securityFabric.registerComponent('deepScanEngine', this);
    
    this.initialized = true;
    
    console.log('[DEEP-SCAN] Engine initialized');
  }
  
  /**
   * Start a deep scan
   */
  public async startScan(options: DeepScanOptions = {}): Promise<string> {
    await this.initialize();
    
    // Generate a scan ID
    const scanId = crypto.randomUUID();
    
    // Set default scan types if not provided
    const scanTypes = options.scanTypes || [DeepScanType.FULL];
    
    // Create scan result object
    const scanResult: DeepScanResult = {
      scanId,
      scanTypes,
      startTime: new Date(),
      endTime: new Date(), // Will be updated when scan is complete
      duration: 0, // Will be updated when scan is complete
      options,
      findings: [],
      summary: {
        totalFindings: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        infoFindings: 0,
        filesScanned: 0,
        linesScanned: 0
      },
      errors: []
    };
    
    // Save the scan in the active scans map
    this.activeScans.set(scanId, scanResult);
    
    // Emit scan start event
    securityFabric.emit('security:deep-scan:started', {
      scanId,
      scanTypes,
      options,
      timestamp: new Date()
    });
    
    // Log scan start
    securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as unknown,
      message: `Deep scan started: ${scanTypes.join(', ')}`,
      metadata: {
        scanId,
        scanTypes,
        options
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[DEEP-SCAN] Error logging scan start:', error);
    });
    
    console.log(`[DEEP-SCAN] Starting scan: ${scanId} (${scanTypes.join(', ')})`);
    
    // Start the scan asynchronously
    this.performScan(scanId).catch(error => {
      console.error(`[DEEP-SCAN] Error performing scan ${scanId}:`, error);
      
      // Update scan result with error
      const scan = this.activeScans.get(scanId);
      if (scan) {
        scan.errors.push(error.message || String(error));
        scan.endTime = new Date();
        scan.duration = scan.endTime.getTime() - scan.startTime.getTime();
      }
    });
    
    return scanId;
  }
  
  /**
   * Perform the scan
   */
  private async performScan(scanId: string): Promise<void> {
    const scan = this.activeScans.get(scanId);
    if (!scan) {
      throw new Error(`Scan not found: ${scanId}`);
    }
    
    try {
      // If full scan, expand to all scan types
      if (scan.scanTypes.includes(DeepScanType.FULL)) {
        scan.scanTypes = Object.values(DeepScanType).filter(type => type !== DeepScanType.FULL);
      }
      
      // Perform each scan type
      for (const scanType of scan.scanTypes) {
        await this.performScanType(scan, scanType);
      }
      
      // Update scan completion time and duration
      scan.endTime = new Date();
      scan.duration = scan.endTime.getTime() - scan.startTime.getTime();
      
      // Emit scan completion event
      securityFabric.emit('security:deep-scan:completed', {
        scanId,
        scanTypes: scan.scanTypes,
        findings: scan.findings.length,
        duration: scan.duration,
        timestamp: new Date()
      });
      
      // Log scan completion
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.INFO,
        category: SecurityEventCategory.SECURITY_SCAN as unknown,
        message: `Deep scan completed: ${scan.scanTypes.join(', ')}`,
        metadata: {
          scanId,
          scanTypes: scan.scanTypes,
          findings: scan.findings.length,
          duration: scan.duration,
          summary: scan.summary
        },
        timestamp: new Date()
      }).catch(error => {
        console.error('[DEEP-SCAN] Error logging scan completion:', error);
      });
      
      console.log(`[DEEP-SCAN] Scan completed: ${scanId} - ${scan.findings.length} findings (${scan.duration}ms)`);
    } catch (error) {
      // Log scan error
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.HIGH,
        category: SecurityEventCategory.SECURITY_SCAN as unknown,
        message: `Deep scan error: ${scan.scanTypes.join(', ')}`,
        metadata: {
          scanId,
          scanTypes: scan.scanTypes,
          error: error.message || String(error)
        },
        timestamp: new Date()
      }).catch(logError => {
        console.error('[DEEP-SCAN] Error logging scan error:', logError);
      });
      
      // Emit scan error event
      securityFabric.emit('security:deep-scan:error', {
        scanId,
        scanTypes: scan.scanTypes,
        error: error.message || String(error),
        timestamp: new Date()
      });
      
      console.error(`[DEEP-SCAN] Scan error: ${scanId}`, error);
      
      throw error;
    }
  }
  
  /**
   * Perform a specific scan type
   */
  private async performScanType(scan: DeepScanResult, scanType: DeepScanType): Promise<void> {
    console.log(`[DEEP-SCAN] Performing ${scanType} scan for scan ${scan.scanId}`);
    
    switch (scanType) {
      case DeepScanType.CODE:
        await this.performCodeScan(scan);
        break;
      case DeepScanType.CONFIGURATION:
        await this.performConfigurationScan(scan);
        break;
      case DeepScanType.API:
        await this.performApiScan(scan);
        break;
      default:
        throw new Error(`Unknown scan type: ${scanType}`);
    }
  }
  
  /**
   * Perform a code scan
   */
  private async performCodeScan(scan: DeepScanResult): Promise<void> {
    // Get code files to scan
    const files = await this.getFilesToScan(scan, ['.js', '.ts', '.tsx', '.jsx']);
    
    console.log(`[DEEP-SCAN] Found ${files.length} code files to scan`);
    
    // Update the summary with the number of files scanned
    scan.summary.filesScanned += files.length;
    
    // Scan each file
    for (const file of files) {
      await this.scanCodeFile(scan, file);
    }
  }
  
  /**
   * Get files to scan based on scan options
   */
  private async getFilesToScan(scan: DeepScanResult, extensions?: string[]): Promise<string[]> {
    const files: string[] = [];
    
    // Default directories to scan
    const includeDirectories = ['server', 'client', 'shared'];
    
    // Get exclude directories, default to node_modules and .git
    const excludeDirectories = ['node_modules', '.git', 'dist', 'build', 'coverage'];
    
    // Get max depth, default to 10
    const maxDepth = scan.options.maxDepth || 10;
    
    // Recursively scan directories
    const scanDir = async (dir: string, depth: number): Promise<void> => {
      if (depth > maxDepth) {
        return;
      }
      
      if (excludeDirectories.some(exclude => dir.includes(exclude))) {
        return;
      }
      
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            // Check file extension if extensions are provided
            if (extensions) {
              const fileExt = path.extname(entry.name).toLowerCase();
              if (!extensions.includes(fileExt)) {
                continue;
              }
            }
            
            // Check if file should be excluded
            if (scan.options.excludeFiles && scan.options.excludeFiles.some(exclude => fullPath.includes(exclude))) {
              continue;
            }
            
            // Add file to list
            files.push(fullPath);
          }
        }
      } catch (error) {
        scan.errors.push(`Error scanning directory ${dir}: ${error}`);
      }
    };
    
    // Scan each include directory
    for (const dir of includeDirectories) {
      if (await this.directoryExists(dir)) {
        await scanDir(dir, 0);
      }
    }
    
    return files;
  }
  
  /**
   * Check if a directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(dirPath);
      return stat.isDirectory();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Scan a code file for vulnerabilities
   */
  private async scanCodeFile(scan: DeepScanResult, filePath: string): Promise<void> {
    try {
      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Count lines of code
      const lines = content.split('\n');
      scan.summary.linesScanned += lines.length;
      
      // Scan for vulnerabilities based on file extension
      const fileExt = path.extname(filePath).toLowerCase();
      
      if (fileExt === '.js' || fileExt === '.ts' || fileExt === '.jsx' || fileExt === '.tsx') {
        await this.scanJavaScriptCode(scan, filePath, content, lines);
      }
      
    } catch (error) {
      scan.errors.push(`Error scanning file ${filePath}: ${error.message}`);
    }
  }
  
  /**
   * Scan JavaScript/TypeScript code for vulnerabilities
   */
  private async scanJavaScriptCode(scan: DeepScanResult, filePath: string, content: string, lines: string[]): Promise<void> {
    // Define vulnerability patterns
    const patterns = [
      {
        type: VulnerabilityType.SQL_INJECTION,
        severity: VulnerabilitySeverity.HIGH,
        pattern: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b.*\$\{.*\}/i,
        description: 'Potential SQL injection vulnerability due to unparameterized queries with template literals',
        remediation: 'Use parameterized queries or an ORM like Sequelize or TypeORM',
        cweId: 'CWE-89'
      },
      {
        type: VulnerabilityType.XSS,
        severity: VulnerabilitySeverity.HIGH,
        pattern: /\b(innerHTML|outerHTML|document\.write|eval)\b/i,
        description: 'Potential XSS vulnerability due to unsafe DOM manipulation',
        remediation: 'Use textContent or innerText instead, or use a sanitization library',
        cweId: 'CWE-79'
      },
      {
        type: VulnerabilityType.SENSITIVE_DATA_EXPOSURE,
        severity: VulnerabilitySeverity.HIGH,
        pattern: /(password|secret|key|token|credential)s?\s*=\s*['"`][^'"`]*['"`]/i,
        description: 'Potential sensitive data exposure due to hardcoded secrets',
        remediation: 'Use environment variables or a secrets management system',
        cweId: 'CWE-798'
      }
    ];
    
    // Scan each line for patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      for (const pattern of patterns) {
        if (pattern.pattern.test(line)) {
          // Check if finding should be included based on minimum severity
          if (scan.options.minimumSeverity) {
            const severities = Object.values(VulnerabilitySeverity);
            const patternSeverityIndex = severities.indexOf(pattern.severity);
            const minimumSeverityIndex = severities.indexOf(scan.options.minimumSeverity);
            
            if (patternSeverityIndex > minimumSeverityIndex) {
              continue;
            }
          }
          
          // Add finding
          const findingId = crypto.randomUUID();
          const finding: VulnerabilityFinding = {
            id: findingId,
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            location: `${filePath}:${lineNumber}`,
            code: line.trim(),
            remediation: pattern.remediation,
            confidence: 0.8,
            cweId: pattern.cweId
          };
          
          // Add the finding
          this.addFinding(scan, finding);
          
          // Break to avoid duplicate findings for the same line
          break;
        }
      }
    }
  }
  
  /**
   * Perform a configuration scan
   */
  private async performConfigurationScan(scan: DeepScanResult): Promise<void> {
    // Get configuration files to scan
    const files = await this.getFilesToScan(scan, ['.json', '.yml', '.yaml', '.env']);
    
    console.log(`[DEEP-SCAN] Found ${files.length} configuration files to scan`);
    
    // Update the summary with the number of files scanned
    scan.summary.filesScanned += files.length;
    
    // Scan each file
    for (const file of files) {
      try {
        // Read file content
        const content = await fs.promises.readFile(file, 'utf-8');
        
        // Count lines of code
        const lines = content.split('\n');
        scan.summary.linesScanned += lines.length;
        
        // Scan based on file type
        const fileExt = path.extname(file).toLowerCase();
        const fileName = path.basename(file).toLowerCase();
        
        if (fileName === 'package.json') {
          await this.scanPackageJson(scan, file, content);
        } else if (fileName === '.env' || fileName.endsWith('.env')) {
          await this.scanEnvFile(scan, file, content, lines);
        } else if (fileExt === '.json') {
          await this.scanJsonConfig(scan, file, content, lines);
        }
      } catch (error) {
        scan.errors.push(`Error scanning configuration file ${file}: ${error.message}`);
      }
    }
  }
  
  /**
   * Scan package.json for vulnerabilities
   */
  private async scanPackageJson(scan: DeepScanResult, filePath: string, content: string): Promise<void> {
    try {
      const packageJson = JSON.parse(content);
      
      // Check for outdated dependencies
      if (packageJson.dependencies) {
        for (const dependency in packageJson.dependencies) {
          const version = packageJson.dependencies[dependency];
          
          // Check for insecure version patterns (using ^ or ~ with security-critical packages)
          if ((version.startsWith('^') || version.startsWith('~')) && this.isSecurityCriticalPackage(dependency)) {
            const findingId = crypto.randomUUID();
            const finding: VulnerabilityFinding = {
              id: findingId,
              type: VulnerabilityType.INSECURE_CONFIGURATION,
              severity: VulnerabilitySeverity.MEDIUM,
              description: `Using a flexible version specifier (${version}) for security-critical package: ${dependency}`,
              location: filePath,
              code: `"${dependency}": "${version}"`,
              remediation: 'Use exact versions for security-critical dependencies',
              confidence: 0.7,
              cweId: 'CWE-1104'
            };
            
            this.addFinding(scan, finding);
          }
        }
      }
    } catch (error) {
      scan.errors.push(`Error parsing package.json: ${error.message}`);
    }
  }
  
  /**
   * Check if a package is security-critical
   */
  private isSecurityCriticalPackage(name: string): boolean {
    const securityCriticalPackages = [
      'express',
      'helmet',
      'passport',
      'jsonwebtoken',
      'bcrypt',
      'crypto',
      'express-session',
      'cors',
      'csurf',
      'stripe'
    ];
    
    return securityCriticalPackages.includes(name);
  }
  
  /**
   * Scan .env file for vulnerabilities
   */
  private async scanEnvFile(scan: DeepScanResult, filePath: string, content: string, lines: string[]): Promise<void> {
    // Scan each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }
      
      // Check for sensitive keys in environment variables
      const sensitiveKeyPattern = /(PRIVATE|SECRET|KEY|TOKEN|PASSWORD|CREDENTIAL|API.?KEY)/i;
      const variableMatch = line.match(/^(.+?)=/);
      
      if (variableMatch && sensitiveKeyPattern.test(variableMatch[1])) {
        const findingId = crypto.randomUUID();
        const finding: VulnerabilityFinding = {
          id: findingId,
          type: VulnerabilityType.SENSITIVE_DATA_EXPOSURE,
          severity: VulnerabilitySeverity.MEDIUM,
          description: `Sensitive environment variable detected: ${variableMatch[1]}`,
          location: `${filePath}:${lineNumber}`,
          code: line,
          remediation: 'Ensure .env files are not committed to source control',
          confidence: 0.7,
          cweId: 'CWE-312'
        };
        
        this.addFinding(scan, finding);
      }
    }
  }
  
  /**
   * Scan JSON configuration file for vulnerabilities
   */
  private async scanJsonConfig(scan: DeepScanResult, filePath: string, content: string, lines: string[]): Promise<void> {
    // Define vulnerability patterns for JSON files
    const patterns = [
      {
        type: VulnerabilityType.SENSITIVE_DATA_EXPOSURE,
        severity: VulnerabilitySeverity.HIGH,
        pattern: /(api[_-]?key|token|secret|password|credential)[_-]?\w*\s*[:=]\s*["'](?!process|env|config|{{)[a-zA-Z0-9_\-\.]{8,}["']/i,
        description: 'Potential sensitive data exposure due to hardcoded API keys, tokens, or credentials',
        remediation: 'Use environment variables or a secrets management system',
        cweId: 'CWE-798'
      },
      {
        type: VulnerabilityType.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.MEDIUM,
        pattern: /(ssl[_-]?verify|verify[_-]?ssl|check[_-]?ssl|validate[_-]?cert)\s*[:=]\s*(false|0|"false"|'false')/i,
        description: 'Potential security vulnerability due to disabled SSL certificate validation',
        remediation: 'Enable SSL certificate validation',
        cweId: 'CWE-295'
      }
    ];
    
    // Scan each line for patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      for (const pattern of patterns) {
        if (pattern.pattern.test(line)) {
          const findingId = crypto.randomUUID();
          const finding: VulnerabilityFinding = {
            id: findingId,
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            location: `${filePath}:${lineNumber}`,
            code: line.trim(),
            remediation: pattern.remediation,
            confidence: 0.8,
            cweId: pattern.cweId
          };
          
          this.addFinding(scan, finding);
          
          // Break to avoid duplicate findings for the same line
          break;
        }
      }
    }
  }
  
  /**
   * Perform an API scan
   */
  private async performApiScan(scan: DeepScanResult): Promise<void> {
    // Since we don't have direct access to API, scan code for API-related issues
    console.log('[DEEP-SCAN] Performing API security scan');
    
    // Get files to scan
    const files = await this.getFilesToScan(scan, ['.js', '.ts', '.tsx', '.jsx']);
    
    console.log(`[DEEP-SCAN] Found ${files.length} files to scan for API issues`);
    
    // Update the summary with the number of files scanned
    scan.summary.filesScanned += files.length;
    
    // Scan each file
    for (const file of files) {
      try {
        // Read file content
        const content = await fs.promises.readFile(file, 'utf-8');
        
        // Count lines of code
        const lines = content.split('\n');
        scan.summary.linesScanned += lines.length;
        
        // Scan for API security issues
        await this.scanApiCode(scan, file, content, lines);
      } catch (error) {
        scan.errors.push(`Error scanning file ${file} for API issues: ${error.message}`);
      }
    }
  }
  
  /**
   * Scan code for API security issues
   */
  private async scanApiCode(scan: DeepScanResult, filePath: string, content: string, lines: string[]): Promise<void> {
    // Define vulnerability patterns
    const patterns = [
      {
        type: VulnerabilityType.AUTH_BYPASS,
        severity: VulnerabilitySeverity.HIGH,
        pattern: /\bapp\.(get|post|put|delete|patch)\s*\(\s*["'`][^"'`]*["`']\s*,\s*(?!auth|authenticate|authorize|checkAuth|isAuthenticated|validateToken|requireAuth|checkPermission)/i,
        description: 'API endpoint without authentication middleware',
        remediation: 'Add authentication middleware to API routes',
        cweId: 'CWE-306'
      },
      {
        type: VulnerabilityType.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.MEDIUM,
        pattern: /\bcors\s*\(\s*\{\s*origin\s*:\s*["'`]\*["'`]\s*\}\s*\)/i,
        description: 'CORS configured to allow all origins',
        remediation: 'Restrict CORS to specific origins',
        cweId: 'CWE-346'
      }
    ];
    
    // Scan each line for patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      for (const pattern of patterns) {
        if (pattern.pattern.test(line)) {
          // Skip if the line doesn't look like an API route definition
          if (!line.includes('app.') && !line.includes('router.')) {
            continue;
          }
          
          // Add finding
          const findingId = crypto.randomUUID();
          const finding: VulnerabilityFinding = {
            id: findingId,
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            location: `${filePath}:${lineNumber}`,
            code: line.trim(),
            remediation: pattern.remediation,
            confidence: 0.7,
            cweId: pattern.cweId
          };
          
          // Add the finding
          this.addFinding(scan, finding);
          
          // Break to avoid duplicate findings for the same line
          break;
        }
      }
    }
  }
  
  /**
   * Add a finding to a scan result
   */
  private addFinding(scan: DeepScanResult, finding: VulnerabilityFinding): void {
    // Add the finding to the list
    scan.findings.push(finding);
    
    // Update summary statistics
    scan.summary.totalFindings++;
    
    // Update summary based on severity
    switch (finding.severity) {
      case VulnerabilitySeverity.CRITICAL:
        scan.summary.criticalFindings++;
        break;
      case VulnerabilitySeverity.HIGH:
        scan.summary.highFindings++;
        break;
      case VulnerabilitySeverity.MEDIUM:
        scan.summary.mediumFindings++;
        break;
      case VulnerabilitySeverity.LOW:
        scan.summary.lowFindings++;
        break;
      case VulnerabilitySeverity.INFO:
        scan.summary.infoFindings++;
        break;
    }
    
    // Emit finding event
    securityFabric.emit('security:deep-scan:finding', {
      scanId: scan.scanId,
      findingId: finding.id,
      type: finding.type,
      severity: finding.severity,
      location: finding.location,
      timestamp: new Date()
    });
    
    // Log finding
    securityBlockchain.addSecurityEvent({
      severity: this.mapVulnerabilitySeverityToEventSeverity(finding.severity),
      category: SecurityEventCategory.VULNERABILITY_FOUND as unknown,
      message: `Deep scan found ${finding.severity} ${finding.type} vulnerability`,
      metadata: {
        scanId: scan.scanId,
        findingId: finding.id,
        type: finding.type,
        location: finding.location,
        description: finding.description,
        remediation: finding.remediation
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[DEEP-SCAN] Error logging finding:', error);
    });
  }
  
  /**
   * Map vulnerability severity to security event severity
   */
  private mapVulnerabilitySeverityToEventSeverity(severity: VulnerabilitySeverity): SecurityEventSeverity {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL:
        return SecurityEventSeverity.CRITICAL;
      case VulnerabilitySeverity.HIGH:
        return SecurityEventSeverity.HIGH;
      case VulnerabilitySeverity.MEDIUM:
        return SecurityEventSeverity.MEDIUM;
      case VulnerabilitySeverity.LOW:
        return SecurityEventSeverity.LOW;
      case VulnerabilitySeverity.INFO:
        return SecurityEventSeverity.INFO;
      default:
        return SecurityEventSeverity.MEDIUM;
    }
  }
  
  /**
   * Get a scan result by ID
   */
  public getScanById(scanId: string): DeepScanResult | null {
    return this.activeScans.get(scanId) || null;
  }
  
  /**
   * Get all active scans
   */
  public getAllScans(): DeepScanResult[] {
    return Array.from(this.activeScans.values());
  }
  
  /**
   * Start a deep scan with maximum settings
   */
  public async startDeepScan(): Promise<string> {
    return this.startScan({
      scanTypes: [DeepScanType.FULL],
      maxDepth: 15
    });
  }
}

/**
 * Global deep scan engine instance
 */
export const deepScanEngine = new DeepScanEngine();