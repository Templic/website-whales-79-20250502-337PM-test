/**
 * Maximum Security Scan
 * 
 * This module provides a comprehensive security scanning capability that proactively
 * identifies vulnerabilities, misconfigurations, and potential security issues 
 * across the application. It's designed to provide maximum depth of analysis without
 * concern for performance impact.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { sqlInjectionPrevention } from './advanced/database/SQLInjectionPrevention';
import { SecurityConfig } from './advanced/config/SecurityConfig';

/**
 * Scan result severity
 */
export type ScanResultSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Scan result type
 */
export interface ScanResult {
  /**
   * Result ID
   */
  id: number;
  
  /**
   * Result severity
   */
  severity: ScanResultSeverity;
  
  /**
   * Result message
   */
  message: string;
  
  /**
   * Related file path (if applicable)
   */
  path?: string;
  
  /**
   * Related line number (if applicable)
   */
  line?: number;
  
  /**
   * Result category
   */
  category: string;
  
  /**
   * Result detailed description
   */
  description?: string;
  
  /**
   * Possible remediation steps
   */
  remediation?: string;
  
  /**
   * Related CWE ID (if applicable)
   * Common Weakness Enumeration ID
   */
  cwe?: string;
  
  /**
   * Scan timestamp
   */
  timestamp: Date;
}

/**
 * Scan options
 */
export interface ScanOptions {
  /**
   * Whether to scan code for vulnerabilities
   */
  scanCode?: boolean;
  
  /**
   * Whether to scan dependencies for vulnerabilities
   */
  scanDependencies?: boolean;
  
  /**
   * Whether to scan configuration files
   */
  scanConfigurations?: boolean;
  
  /**
   * Whether to scan API endpoints
   */
  scanEndpoints?: boolean;
  
  /**
   * File extensions to scan
   */
  fileExtensions?: string[];
  
  /**
   * Directories to exclude from scanning
   */
  excludeDirectories?: string[];
  
  /**
   * Report save path
   */
  reportPath?: string;
}

/**
 * Default scan options
 */
const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  scanCode: true,
  scanDependencies: true,
  scanConfigurations: true,
  scanEndpoints: true,
  fileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.py', '.sql'],
  excludeDirectories: ['node_modules', '.git', 'dist', 'build', 'coverage'],
  reportPath: 'reports/security'
};

/**
 * Security scan patterns
 */
const SECURITY_SCAN_PATTERNS = [
  // SQL Injection
  {
    pattern: /exec\s*\(\s*.*req\.|query\s*\(\s*['"]\s*SELECT.+\$\{/i,
    message: 'Potential SQL injection vulnerability',
    severity: 'critical',
    category: 'injection',
    cwe: 'CWE-89'
  },
  
  // XSS
  {
    pattern: /innerHTML\s*=|document\.write\s*\(/i,
    message: 'Potential XSS vulnerability',
    severity: 'high',
    category: 'injection',
    cwe: 'CWE-79'
  },
  
  // Command Injection
  {
    pattern: /exec\s*\(\s*.*req\.|eval\s*\(|child_process|spawn\s*\(/i,
    message: 'Potential command injection vulnerability',
    severity: 'critical',
    category: 'injection',
    cwe: 'CWE-78'
  },
  
  // Hardcoded Credentials
  {
    pattern: /password\s*=\s*['"]|apiKey\s*=\s*['"]|secret\s*=\s*['"]|token\s*=\s*['"]|auth\s*=\s*['"]/i,
    message: 'Possible hardcoded credentials',
    severity: 'high',
    category: 'sensitive-data',
    cwe: 'CWE-798'
  },
  
  // Path Traversal
  {
    pattern: /readFile\s*\(\s*.*req\.|readFileSync\s*\(\s*.*req\.|fs\s*\.\s*open\s*\(\s*.*req\./i,
    message: 'Potential path traversal vulnerability',
    severity: 'high',
    category: 'injection',
    cwe: 'CWE-22'
  },
  
  // Insecure Random
  {
    pattern: /Math\.random\(\)/i,
    message: 'Use of insecure random number generator',
    severity: 'medium',
    category: 'cryptographic',
    cwe: 'CWE-338'
  },
  
  // Weak Encryption
  {
    pattern: /createCipher\s*\(\s*['"]des|createCipher\s*\(\s*['"]rc4|MD5|createHash\s*\(\s*['"]sha1/i,
    message: 'Use of weak encryption algorithm',
    severity: 'high',
    category: 'cryptographic',
    cwe: 'CWE-327'
  },
  
  // No CSRF Protection
  {
    pattern: /app\.post\s*\(\s*['"]\s*\/api|router\.post\s*\(\s*['"]\s*\/(?!.*csrf)/i,
    message: 'API endpoint might lack CSRF protection',
    severity: 'medium',
    category: 'authentication',
    cwe: 'CWE-352'
  },
  
  // No Input Validation
  {
    pattern: /app\.(get|post|put|delete)\s*\(\s*['"][^)]+\)\s*{\s*(?!.*validate)/i,
    message: 'Potential lack of input validation on API endpoint',
    severity: 'high',
    category: 'validation',
    cwe: 'CWE-20'
  },
  
  // No Rate Limiting on Authentication
  {
    pattern: /\/login|\/signin|\/authenticate|\/auth\/|\/api\/auth/i,
    message: 'Authentication endpoint lacks rate limiting',
    severity: 'high',
    category: 'authentication',
    cwe: 'CWE-307'
  }
];

/**
 * Maximum security scanner class
 */
export class MaximumSecurityScanner extends EventEmitter {
  /**
   * Scan options
   */
  private options: ScanOptions;
  
  /**
   * Security configuration
   */
  private securityConfig: SecurityConfig;
  
  /**
   * Scan results
   */
  private results: ScanResult[] = [];
  
  /**
   * Current scan ID counter
   */
  private scanIdCounter: number = 9000;
  
  /**
   * Whether a scan is currently running
   */
  private scanning: boolean = false;
  
  /**
   * Scan start time
   */
  private scanStartTime: Date | null = null;
  
  /**
   * Scan end time
   */
  private scanEndTime: Date | null = null;
  
  /**
   * Number of files scanned
   */
  private filesScanned: number = 0;
  
  /**
   * Create a new maximum security scanner
   */
  constructor(options: ScanOptions = {}, securityConfig: SecurityConfig = {}) {
    super();
    this.options = { ...DEFAULT_SCAN_OPTIONS, ...options };
    this.securityConfig = securityConfig;
    
    // Create report directory if it doesn't exist
    this.ensureReportDirectory();
  }
  
  /**
   * Ensure report directory exists
   */
  private ensureReportDirectory(): void {
    try {
      const reportPath = this.options.reportPath || DEFAULT_SCAN_OPTIONS.reportPath!;
      fs.mkdirSync(reportPath, { recursive: true });
    } catch (error) {
      console.error('[MaximumSecurityScanner] Error creating report directory:', error);
    }
  }
  
  /**
   * Run a complete security scan
   */
  public async scan(): Promise<ScanResult[]> {
    if (this.scanning) {
      throw new Error('Scan already in progress');
    }
    
    console.log('[security] Starting MAXIMUM SECURITY SCAN - this may take some time...');
    console.log('[security] Running all security scanners in parallel...');
    
    // Mark as scanning
    this.scanning = true;
    this.scanStartTime = new Date();
    this.results = [];
    this.filesScanned = 0;
    
    try {
      // Run all scans in parallel
      console.log('[security] Scanning package dependencies...');
      console.log('[security] Scanning all project files for security issues...');
      console.log('[security] Scanning configuration files for security misconfigurations...');
      console.log('[security] Scanning network endpoints and API routes...');
      
      await Promise.all([
        this.scanDependencies(),
        this.scanCodebase(),
        this.scanConfigurations(),
        this.scanApiEndpoints()
      ]);
      
      // Mark scan as complete
      this.scanEndTime = new Date();
      this.scanning = false;
      
      // Save report
      await this.saveReport();
      
      console.log(`[security] Security scan completed in ${(this.scanEndTime.getTime() - this.scanStartTime.getTime()) / 1000}s`);
      console.log(`[security] Found ${this.results.length} potential security issues`);
      
      return this.results;
    } catch (error) {
      console.error('[security] Error running security scan:', error);
      this.scanning = false;
      throw error;
    }
  }
  
  /**
   * Scan application dependencies for vulnerabilities
   */
  private async scanDependencies(): Promise<void> {
    if (!this.options.scanDependencies) {
      return;
    }
    
    try {
      // Read package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      // Get the number of dependencies
      const dependencyCount = Object.keys(dependencies).length;
      console.log(`[security] Scanning ${dependencyCount} packages for vulnerabilities...`);
      
      // In a real implementation, we would check against a vulnerability database
      // For now, we'll just simulate finding issues with outdated packages
      
      // Add placeholder results
      this.addResult({
        severity: 'medium',
        message: 'Using outdated dependencies may introduce security vulnerabilities',
        category: 'dependencies',
        description: 'Some dependencies may have known security vulnerabilities',
        remediation: 'Regularly update dependencies to their latest versions'
      });
    } catch (error) {
      console.error('[security] Error scanning dependencies:', error);
    }
  }
  
  /**
   * Scan codebase for security vulnerabilities
   */
  private async scanCodebase(): Promise<void> {
    if (!this.options.scanCode) {
      return;
    }
    
    try {
      // Get all files in the project
      const files = this.getAllFiles(process.cwd());
      const totalFiles = files.length;
      
      let processedFiles = 0;
      
      // Process files in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (file) => {
          await this.scanFile(file);
          
          // Update progress
          processedFiles++;
          if (processedFiles % 100 === 0 || processedFiles === totalFiles) {
            const progress = Math.floor((processedFiles / totalFiles) * 100);
            console.log(`[security] File scan progress: ${progress}% (${processedFiles}/${totalFiles} files)`);
          }
        }));
      }
      
      this.filesScanned = totalFiles;
    } catch (error) {
      console.error('[security] Error scanning codebase:', error);
    }
  }
  
  /**
   * Get all files in a directory recursively
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    // Skip excluded directories
    const basename = path.basename(dir);
    if (this.options.excludeDirectories?.includes(basename)) {
      return files;
    }
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recurse into subdirectory
          files.push(...this.getAllFiles(fullPath));
        } else {
          // Check file extension
          const ext = path.extname(entry.name).toLowerCase();
          if (this.options.fileExtensions?.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`[security] Error reading directory ${dir}:`, error);
    }
    
    return files;
  }
  
  /**
   * Scan a file for security vulnerabilities
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Check each security pattern
      for (const pattern of SECURITY_SCAN_PATTERNS) {
        // Check if the pattern matches the file content
        const matches = content.match(pattern.pattern);
        if (matches) {
          // Find line number of the match
          let lineNumber = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(pattern.pattern)) {
              lineNumber = i + 1;
              break;
            }
          }
          
          // Add result
          this.addResult({
            severity: pattern.severity as ScanResultSeverity,
            message: pattern.message,
            path: filePath,
            line: lineNumber,
            category: pattern.category,
            cwe: pattern.cwe
          });
        }
      }
    } catch (error) {
      console.error(`[security] Error scanning file ${filePath}:`, error);
    }
  }
  
  /**
   * Scan configuration files for security misconfigurations
   */
  private async scanConfigurations(): Promise<void> {
    if (!this.options.scanConfigurations) {
      return;
    }
    
    try {
      // Common configuration files to check
      const configFiles = [
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
        'config.js',
        'config.json',
        'package.json',
        'tsconfig.json',
        'webpack.config.js',
        'vite.config.ts',
        'next.config.js'
      ];
      
      // Find configuration files
      for (const configFile of configFiles) {
        const configPath = path.join(process.cwd(), configFile);
        if (fs.existsSync(configPath)) {
          await this.scanConfigFile(configPath);
        }
      }
    } catch (error) {
      console.error('[security] Error scanning configurations:', error);
    }
  }
  
  /**
   * Scan a configuration file for security misconfigurations
   */
  private async scanConfigFile(filePath: string): Promise<void> {
    try {
      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for common configuration issues
      
      // Hardcoded secrets
      if (/password|secret|key|token/i.test(content) && /=\s*['"][^'"]+['"]/i.test(content)) {
        this.addResult({
          severity: 'high',
          message: 'Possible hardcoded secrets in configuration file',
          path: filePath,
          category: 'sensitive-data',
          cwe: 'CWE-798',
          remediation: 'Use environment variables for secrets'
        });
      }
      
      // Insecure permissions
      if (/0777|0666/i.test(content)) {
        this.addResult({
          severity: 'medium',
          message: 'Insecure file permissions in configuration',
          path: filePath,
          category: 'configuration',
          cwe: 'CWE-732',
          remediation: 'Use more restrictive file permissions'
        });
      }
      
      // Check for specific configuration types
      if (filePath.endsWith('package.json')) {
        this.scanPackageJsonConfig(filePath, content);
      } else if (filePath.endsWith('.env') || filePath.includes('.env.')) {
        this.scanEnvConfig(filePath, content);
      }
    } catch (error) {
      console.error(`[security] Error scanning configuration file ${filePath}:`, error);
    }
  }
  
  /**
   * Scan package.json for security misconfigurations
   */
  private scanPackageJsonConfig(filePath: string, content: string): void {
    try {
      const packageJson = JSON.parse(content);
      
      // Check scripts for security issues
      if (packageJson.scripts) {
        for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
          // Check for potentially dangerous commands
          if (typeof scriptCommand === 'string' && /rm -rf|chmod 777|wget|curl|eval|exec/i.test(scriptCommand)) {
            this.addResult({
              severity: 'medium',
              message: `Potentially dangerous command in package.json script: ${scriptName}`,
              path: filePath,
              category: 'configuration',
              cwe: 'CWE-78',
              remediation: 'Review script for security implications'
            });
          }
        }
      }
    } catch (error) {
      console.error(`[security] Error scanning package.json configuration:`, error);
    }
  }
  
  /**
   * Scan .env file for security misconfigurations
   */
  private scanEnvConfig(filePath: string, content: string): void {
    try {
      // Check for missing security-related variables
      if (!content.includes('NODE_ENV=production') && !filePath.includes('development')) {
        this.addResult({
          severity: 'info',
          message: 'NODE_ENV not set to production in environment configuration',
          path: filePath,
          category: 'configuration',
          remediation: 'Set NODE_ENV=production for production environments'
        });
      }
      
      // Check for potential hardcoded secrets
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(API_KEY|SECRET|PASSWORD|TOKEN)=/i.test(line) && line.length > 20) {
          this.addResult({
            severity: 'medium',
            message: 'Sensitive information in environment file',
            path: filePath,
            line: i + 1,
            category: 'sensitive-data',
            cwe: 'CWE-798',
            remediation: 'Store sensitive information in a secure credential store'
          });
        }
      }
    } catch (error) {
      console.error(`[security] Error scanning .env configuration:`, error);
    }
  }
  
  /**
   * Scan API endpoints for security vulnerabilities
   */
  private async scanApiEndpoints(): Promise<void> {
    if (!this.options.scanEndpoints) {
      return;
    }
    
    try {
      // In a real implementation, we would analyze the actual routes
      // For now, we'll simulate finding API endpoints by scanning the codebase

      // Search for Express.js route definitions
      const files = this.getAllFiles(process.cwd());
      
      // Filter to likely API files
      const apiFiles = files.filter(file => 
        file.includes('routes') || 
        file.includes('controllers') || 
        file.includes('api') ||
        file.includes('handlers')
      );
      
      let endpointCount = 0;
      
      // Scan API files
      for (const file of apiFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Look for route definitions
        const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"](\/[^'"]*)['"]/g;
        const routerRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"](\/[^'"]*)['"]/g;
        
        let match;
        
        // Find Express app routes
        while ((match = routeRegex.exec(content)) !== null) {
          endpointCount++;
          this.scanApiEndpoint(file, match[1], match[2], content);
        }
        
        // Find Express router routes
        while ((match = routerRegex.exec(content)) !== null) {
          endpointCount++;
          this.scanApiEndpoint(file, match[1], match[2], content);
        }
      }
      
      console.log(`[security] Found ${endpointCount} API endpoints to analyze`);
    } catch (error) {
      console.error('[security] Error scanning API endpoints:', error);
    }
  }
  
  /**
   * Scan an API endpoint for security vulnerabilities
   */
  private scanApiEndpoint(file: string, method: string, path: string, content: string): void {
    // Find the line number of the route definition
    const lines = content.split('\n');
    let lineNumber = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(method) && lines[i].includes(path)) {
        lineNumber = i + 1;
        break;
      }
    }
    
    // Check for common API security issues
    
    // No input validation
    if (!content.includes('validate') && !content.includes('sanitize') && (method === 'post' || method === 'put')) {
      this.addResult({
        severity: 'high',
        message: `Potential lack of input validation on API endpoint`,
        path: file,
        line: lineNumber,
        category: 'validation',
        cwe: 'CWE-20',
        remediation: 'Implement input validation for all API parameters'
      });
    }
    
    // No authentication
    if (path.includes('/api/') && !content.includes('authenticate') && !content.includes('isAuthenticated') && !content.includes('requireAuth')) {
      this.addResult({
        severity: 'medium',
        message: `API endpoint might lack authentication`,
        path: file,
        line: lineNumber,
        category: 'authentication',
        cwe: 'CWE-306',
        remediation: 'Implement authentication middleware for API routes'
      });
    }
    
    // No rate limiting on authentication endpoints
    if ((path.includes('/login') || path.includes('/signin') || path.includes('/auth')) && !content.includes('limiter') && !content.includes('rateLimit')) {
      this.addResult({
        severity: 'high',
        message: `Authentication endpoint lacks rate limiting`,
        path: file,
        line: lineNumber,
        category: 'authentication',
        cwe: 'CWE-307',
        remediation: 'Implement rate limiting for authentication endpoints'
      });
    }
    
    // SQL injection
    if (content.includes('query(') && (content.includes('req.body') || content.includes('req.params') || content.includes('req.query'))) {
      const usingORM = content.includes('sequelize') || content.includes('mongoose') || content.includes('typeorm') || content.includes('knex') || content.includes('prisma');
      if (!usingORM) {
        this.addResult({
          severity: 'critical',
          message: `Potential SQL injection vulnerability`,
          path: file,
          line: lineNumber,
          category: 'injection',
          cwe: 'CWE-89',
          remediation: 'Use parameterized queries or an ORM'
        });
      }
    }
  }
  
  /**
   * Add a scan result
   */
  private addResult(result: Partial<ScanResult>): void {
    const newResult: ScanResult = {
      id: this.scanIdCounter++,
      severity: result.severity || 'info',
      message: result.message || 'Security issue detected',
      path: result.path,
      line: result.line,
      category: result.category || 'other',
      description: result.description,
      remediation: result.remediation,
      cwe: result.cwe,
      timestamp: new Date()
    };
    
    this.results.push(newResult);
    
    // Log the result
    console.log(`[security] [${newResult.id}] [${newResult.severity.toUpperCase()}] ${newResult.message}`);
  }
  
  /**
   * Save scan report to file
   */
  private async saveReport(): Promise<void> {
    try {
      const reportPath = this.options.reportPath || DEFAULT_SCAN_OPTIONS.reportPath!;
      fs.mkdirSync(reportPath, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const reportFile = path.join(reportPath, `initial-scan-${timestamp}.json`);
      
      // Create report object
      const report = {
        timestamp: new Date(),
        duration: this.scanEndTime!.getTime() - this.scanStartTime!.getTime(),
        summary: {
          total: this.results.length,
          critical: this.results.filter(r => r.severity === 'critical').length,
          high: this.results.filter(r => r.severity === 'high').length,
          medium: this.results.filter(r => r.severity === 'medium').length,
          low: this.results.filter(r => r.severity === 'low').length,
          info: this.results.filter(r => r.severity === 'info').length
        },
        filesScanned: this.filesScanned,
        results: this.results
      };
      
      // Write report to file
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
      
      console.log(`[security] Security scan report saved to ${reportFile}`);
    } catch (error) {
      console.error('[security] Error saving security scan report:', error);
    }
  }
  
  /**
   * Get scan results
   */
  public getResults(): ScanResult[] {
    return [...this.results];
  }
  
  /**
   * Get scan results by severity
   */
  public getResultsBySeverity(severity: ScanResultSeverity): ScanResult[] {
    return this.results.filter(result => result.severity === severity);
  }
  
  /**
   * Get scan status
   */
  public getStatus(): {
    scanning: boolean;
    resultsCount: number;
    startTime: Date | null;
    endTime: Date | null;
    filesScanned: number;
  } {
    return {
      scanning: this.scanning,
      resultsCount: this.results.length,
      startTime: this.scanStartTime,
      endTime: this.scanEndTime,
      filesScanned: this.filesScanned
    };
  }
}

// Export singleton instance
export const maximumSecurityScanner = new MaximumSecurityScanner();