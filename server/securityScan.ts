/**
 * securityScan.ts
 * 
 * Security vulnerability scanner for the application
 */

import { logSecurityEvent } from './security/security';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation?: string;
}

export interface SecurityScanResult {
  timestamp: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  vulnerabilities: SecurityVulnerability[];
}

/**
 * Scan the project for security vulnerabilities
 */
export async function scanProject(): Promise<SecurityScanResult> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // Initialize counters
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  let lowIssues = 0;
  
  try {
    // 1. Check for outdated dependencies (this is a simplified mock check)
    await checkDependencies(vulnerabilities);
    
    // 2. Check for secrets in code
    await checkForSecrets(vulnerabilities);
    
    // 3. Check for security headers in responses
    await checkSecurityHeaders(vulnerabilities);
    
    // 4. Check for proper CSRF protection
    await checkCSRFProtection(vulnerabilities);
    
    // 5. Check for input validation
    await checkInputValidation(vulnerabilities);
    
    // Count issues by severity
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          criticalIssues++;
          break;
        case 'high':
          highIssues++;
          break;
        case 'medium':
          mediumIssues++;
          break;
        case 'low':
          lowIssues++;
          break;
      }
    });
    
    // Return scan results
    return {
      timestamp: new Date().toISOString(),
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      vulnerabilities
    };
  } catch (error) {
    console.error('Error during security scan:', error);
    
    // Add an error about the scan itself
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Security scan encountered errors and may be incomplete',
      recommendation: 'Check server logs for details and run the scan again'
    });
    
    // Return partial results
    return {
      timestamp: new Date().toISOString(),
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues: mediumIssues + 1, // Add the scan error as medium severity
      lowIssues,
      vulnerabilities
    };
  }
}

/**
 * Check for outdated dependencies
 */
async function checkDependencies(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  const packageLockPath = path.join(process.cwd(), 'package-lock.json');
  
  if (fs.existsSync(packageLockPath)) {
    try {
      const packageLockContent = fs.readFileSync(packageLockPath, 'utf8');
      const packageLock = JSON.parse(packageLockContent);
      
      // This is a simplistic check - in a real implementation you would use a service like npm audit
      const dependencies = packageLock.dependencies || {};
      
      // For demonstration purposes, let's flag a few packages as having vulnerabilities
      // In a real implementation, this would come from npm audit or a security API
      const vulnerableDependencies = [
        { name: 'lodash', version: '<4.17.21', severity: 'high' as const, description: 'Prototype Pollution' },
        { name: 'axios', version: '<0.21.1', severity: 'medium' as const, description: 'Server-Side Request Forgery' },
        { name: 'minimist', version: '<1.2.6', severity: 'medium' as const, description: 'Prototype Pollution' }
      ];
      
      // Check for vulnerable dependencies
      Object.entries(dependencies).forEach(([depName, depInfo]: [string, any]) => {
        const vulnInfo = vulnerableDependencies.find(v => v.name === depName);
        if (vulnInfo) {
          const version = depInfo.version || '';
          
          // Very simple version check - would need a proper semver check in production
          if (version.replace(/[^0-9.]/g, '') < vulnInfo.version.replace(/[<>=^~]/g, '')) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: vulnInfo.severity,
              description: `Vulnerable dependency: ${depName}@${version} - ${vulnInfo.description}`,
              location: 'package-lock.json',
              recommendation: `Update ${depName} to a version matching ${vulnInfo.version}`
            });
          }
        }
      });
    } catch (error) {
      console.error('Error checking dependencies:', error);
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'low',
        description: 'Unable to analyze dependencies for vulnerabilities',
        recommendation: 'Run npm audit to check for vulnerable dependencies'
      });
    }
  }
}

/**
 * Check for hardcoded secrets in code
 */
async function checkForSecrets(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  try {
    // Use grep to search for potential API keys and secrets
    // Note: This might produce false positives
    const { stdout } = await execPromise(
      'grep -r -i -E "(api[_-]?key|secret|password|token|auth[_-]?token|access[_-]?token)[ ]*=[ ]*[\\"\\\'][a-zA-Z0-9_\\-]{16,}[\\"\\\']" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir="node_modules" --exclude-dir=".git" ./server ./client ./shared 2>/dev/null || true'
    );
    
    if (stdout.trim()) {
      const results = stdout.split('\n').filter(line => line.trim() !== '');
      
      // Create a vulnerability for each detected secret
      for (const result of results) {
        const [file, ...contentParts] = result.split(':');
        const content = contentParts.join(':');
        
        if (file && content) {
          // Check if this is in an example file or test code
          const isExample = file.includes('example') || file.includes('test') || file.includes('demo');
          
          vulnerabilities.push({
            id: uuidv4(),
            severity: isExample ? 'low' : 'high',
            description: 'Potential hardcoded secret or API key detected',
            location: file,
            recommendation: 'Move secrets to environment variables or a secure secret management system'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking for secrets:', error);
  }
}

/**
 * Check for security headers configuration
 */
async function checkSecurityHeaders(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  const securityHeaderFiles = [
    path.join(process.cwd(), 'server', 'index.ts'),
    path.join(process.cwd(), 'server', 'middleware.ts'),
    path.join(process.cwd(), 'server', 'routes.ts')
  ];
  
  let foundCSP = false;
  let foundXFrameOptions = false;
  let foundXContentTypeOptions = false;
  let foundHSTS = false;
  
  for (const file of securityHeaderFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for Content-Security-Policy header
      if (content.includes('Content-Security-Policy') || content.includes('contentSecurityPolicy')) {
        foundCSP = true;
      }
      
      // Check for X-Frame-Options header
      if (content.includes('X-Frame-Options') || content.includes('frameGuard') || content.includes('frameguard')) {
        foundXFrameOptions = true;
      }
      
      // Check for X-Content-Type-Options header
      if (content.includes('X-Content-Type-Options') || content.includes('noSniff')) {
        foundXContentTypeOptions = true;
      }
      
      // Check for Strict-Transport-Security header
      if (content.includes('Strict-Transport-Security') || content.includes('hsts')) {
        foundHSTS = true;
      }
    }
  }
  
  // Add vulnerabilities for missing security headers
  if (!foundCSP) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Content-Security-Policy header not found',
      recommendation: 'Implement Content-Security-Policy header to prevent XSS attacks'
    });
  }
  
  if (!foundXFrameOptions) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'X-Frame-Options header not found',
      recommendation: 'Implement X-Frame-Options header to prevent clickjacking attacks'
    });
  }
  
  if (!foundXContentTypeOptions) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'low',
      description: 'X-Content-Type-Options header not found',
      recommendation: 'Implement X-Content-Type-Options: nosniff header to prevent MIME type sniffing'
    });
  }
  
  if (!foundHSTS) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Strict-Transport-Security header not found',
      recommendation: 'Implement HSTS header to enforce HTTPS connections'
    });
  }
}

/**
 * Check for CSRF protection
 */
async function checkCSRFProtection(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  const serverFiles = [
    path.join(process.cwd(), 'server', 'index.ts'),
    path.join(process.cwd(), 'server', 'middleware.ts'),
    path.join(process.cwd(), 'server', 'routes.ts')
  ];
  
  let foundCSRFProtection = false;
  
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for CSRF protection
      if (
        content.includes('csrf') || 
        content.includes('CSRF') || 
        content.includes('csurf') || 
        content.includes('XSRF') || 
        content.includes('xsrf')
      ) {
        foundCSRFProtection = true;
        break;
      }
    }
  }
  
  if (!foundCSRFProtection) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No CSRF protection found',
      recommendation: 'Implement CSRF protection for all state-changing endpoints'
    });
  }
}

/**
 * Check for input validation
 */
async function checkInputValidation(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  // Expand the list of files to check for input validation
  const serverFiles = [
    path.join(process.cwd(), 'server', 'routes.ts'),
    path.join(process.cwd(), 'server', 'securityRoutes.ts'),
    path.join(process.cwd(), 'server', 'auth.ts'),
    path.join(process.cwd(), 'server', 'validation.ts'),
    ...findAllControllers()
  ];
  
  let foundInputValidation = false;
  let validationPatterns = 0;
  const validationLibraries = new Set<string>();
  const filesWithValidation = new Set<string>();
  let totalApiEndpoints = 0;
  let endpointsWithValidation = 0;
  
  // Enhanced validation pattern detection
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      totalApiEndpoints += countAPIEndpoints(content);
      
      // Check for various validation libraries and patterns
      const validationChecks = [
        { pattern: 'validator', name: 'validator' },
        { pattern: 'joi', name: 'joi' },
        { pattern: 'zod', name: 'zod' },
        { pattern: 'express-validator', name: 'express-validator' },
        { pattern: 'validateRequest', name: 'custom validation' },
        { pattern: 'check(', name: 'express-validator check' },
        { pattern: 'body(', name: 'express-validator body' },
        { pattern: 'param(', name: 'express-validator param' },
        { pattern: 'query(', name: 'express-validator query' },
        { pattern: 'validationResult', name: 'express-validator result' },
        { pattern: 'sanitize', name: 'sanitization' },
        { pattern: 'escape', name: 'content escaping' },
        { pattern: 'isValid', name: 'validation check' },
        { pattern: 'schema.validate', name: 'schema validation' },
        { pattern: 'typeof', name: 'type checking' }
      ];
      
      for (const check of validationChecks) {
        if (content.includes(check.pattern)) {
          validationLibraries.add(check.name);
          filesWithValidation.add(file);
          validationPatterns++;
          
          // Count endpoints with validation by looking for validation near route handlers
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (isRouteDefinition(lines[i])) {
              // Check if any validation patterns exist in nearby lines
              const surroundingLines = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
              if (validationChecks.some(c => surroundingLines.includes(c.pattern))) {
                endpointsWithValidation++;
              }
            }
          }
        }
      }
    }
  }
  
  // Determine if validation coverage is sufficient
  foundInputValidation = validationPatterns >= 3;
  const validationCoverage = totalApiEndpoints > 0 ? (endpointsWithValidation / totalApiEndpoints) * 100 : 0;
  
  // Add vulnerabilities based on analysis
  if (!foundInputValidation) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No comprehensive input validation found',
      recommendation: 'Implement input validation for all API endpoints using express-validator, zod, or similar libraries'
    });
  } else if (validationCoverage < 70) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: `Inconsistent input validation (only ${validationCoverage.toFixed(0)}% of endpoints protected)`,
      recommendation: 'Extend input validation to all API endpoints that accept user input'
    });
  } else if (validationLibraries.size < 2) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'low',
      description: 'Limited validation approach detected',
      recommendation: 'Consider using multiple validation strategies for critical endpoints'
    });
  }
  
  // Check for SQL injection protection specifically
  const sqlInjectionVulnerable = await checkForSQLInjectionVulnerabilities();
  if (sqlInjectionVulnerable.length > 0) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'critical',
      description: 'Potential SQL injection vulnerabilities detected',
      location: sqlInjectionVulnerable.join(', '),
      recommendation: 'Use parameterized queries or an ORM consistently for all database operations'
    });
  }
}

/**
 * Find all controller files in the server directory
 */
function findAllControllers(): string[] {
  const controllers: string[] = [];
  const serverDir = path.join(process.cwd(), 'server');
  
  if (fs.existsSync(serverDir)) {
    const processDir = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          processDir(itemPath);
        } else if (
          stat.isFile() && 
          (item.includes('Controller') || item.includes('Routes') || item.includes('router')) &&
          (item.endsWith('.ts') || item.endsWith('.js'))
        ) {
          controllers.push(itemPath);
        }
      }
    };
    
    processDir(serverDir);
  }
  
  return controllers;
}

/**
 * Count API endpoints in a file
 */
function countAPIEndpoints(content: string): number {
  const lines = content.split('\n');
  let count = 0;
  
  for (const line of lines) {
    if (isRouteDefinition(line)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Check if a line contains a route definition
 */
function isRouteDefinition(line: string): boolean {
  const routePatterns = [
    /\.(get|post|put|delete|patch|options)\s*\(/i,
    /router\.(get|post|put|delete|patch|options)\s*\(/i,
    /app\.(get|post|put|delete|patch|options)\s*\(/i,
    /route\.(get|post|put|delete|patch|options)\s*\(/i
  ];
  
  return routePatterns.some(pattern => pattern.test(line));
}

/**
 * Check for potential SQL injection vulnerabilities
 */
async function checkForSQLInjectionVulnerabilities(): Promise<string[]> {
  const vulnerableFiles: string[] = [];
  
  try {
    const { stdout } = await execPromise(
      'grep -r -i -E "(executeQuery|query\\().*\\$\\{|sql.*\\+|query.*concat" --include="*.ts" --include="*.js" --exclude-dir="node_modules" --exclude-dir=".git" ./server 2>/dev/null || true'
    );
    
    if (stdout.trim()) {
      const results = stdout.split('\n').filter(line => line.trim() !== '');
      
      for (const result of results) {
        const [file] = result.split(':');
        if (file && !vulnerableFiles.includes(file)) {
          vulnerableFiles.push(file);
        }
      }
    }
  } catch (error) {
    console.error('Error checking for SQL injection vulnerabilities:', error);
  }
  
  return vulnerableFiles;
}

/**
 * Initialize the security scanning service
 * @param intervalHours The interval in hours at which to run scans (default: 24)
 */
export function initializeSecurityScans(intervalHours: number = 24): NodeJS.Timeout {
  console.log(`Initializing security scans with ${intervalHours} hour interval`);
  
  // Run an initial scan
  scanProject().then(result => {
    console.log(`Initial security scan completed: ${result.totalIssues} issues found`);
    
    // Log the event
    logSecurityEvent({
      type: 'SECURITY_SCAN',
      details: `Automated security scan completed with ${result.totalIssues} issues found`,
      severity: result.criticalIssues > 0 ? 'critical' : 
                result.highIssues > 0 ? 'high' : 
                result.mediumIssues > 0 ? 'medium' : 'low'
    });
  }).catch(error => {
    console.error('Initial security scan failed:', error);
  });
  
  // Set up periodic scans
  const intervalMilliseconds = intervalHours * 60 * 60 * 1000;
  return setInterval(() => {
    console.log('Running scheduled security scan...');
    scanProject().then(result => {
      console.log(`Scheduled security scan completed: ${result.totalIssues} issues found`);
      
      // Log the event
      logSecurityEvent({
        type: 'SECURITY_SCAN',
        details: `Automated security scan completed with ${result.totalIssues} issues found`,
        severity: result.criticalIssues > 0 ? 'critical' : 
                  result.highIssues > 0 ? 'high' : 
                  result.mediumIssues > 0 ? 'medium' : 'low'
      });
    }).catch(error => {
      console.error('Scheduled security scan failed:', error);
    });
  }, intervalMilliseconds);
}