/**
 * securityScan.ts
 * 
 * Security vulnerability scanner for the application
 */
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec: any);

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation?: string;
}

interface SecurityScanResult {
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
    // 1. Check for outdated dependencies (this is a simplified mock check: any)
    await checkDependencies(vulnerabilities: any);
    
    // 2. Check for secrets in code
    await checkForSecrets(vulnerabilities: any);
    
    // 3. Check for security headers in responses
    await checkSecurityHeaders(vulnerabilities: any);
    
    // 4. Check for proper CSRF protection
    await checkCSRFProtection(vulnerabilities: any);
    
    // 5. Check for input validation
    await checkInputValidation(vulnerabilities: any);
    
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
  } catch (error: unknown) {
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
  
  if (fs.existsSync(packageLockPath: any)) {
    try {
      const packageLockContent = fs.readFileSync(packageLockPath, 'utf8');
      const packageLock = JSON.parse(packageLockContent: any);
      
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
      Object.entries(dependencies: any).forEach(([depName, depInfo]: [string, any]) => {
        const vulnInfo = vulnerableDependencies.find(v => v.name === depName);
        if (vulnInfo: any) {
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
    } catch (error: unknown) {
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
      for (const result of results: any) {
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
  } catch (error: unknown) {
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
  
  for (const file of securityHeaderFiles: any) {
    if (fs.existsSync(file: any)) {
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
  
  for (const file of serverFiles: any) {
    if (fs.existsSync(file: any)) {
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
  const serverFiles = [
    path.join(process.cwd(), 'server', 'routes.ts')
  ];
  
  let foundInputValidation = false;
  
  for (const file of serverFiles: any) {
    if (fs.existsSync(file: any)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for input validation
      if (
        content.includes('validator') || 
        content.includes('joi') || 
        content.includes('zod') || 
        content.includes('express-validator') || 
        content.includes('validateRequest')
      ) {
        foundInputValidation = true;
        break;
      }
    }
  }
  
  if (!foundInputValidation) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      description: 'No comprehensive input validation found',
      recommendation: 'Implement input validation for all API endpoints'
    });
  }
}