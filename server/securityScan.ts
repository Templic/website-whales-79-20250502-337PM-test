import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logSecurityEvent } from './security';

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
 * Scans the project for common security vulnerabilities 
 * using simple pattern matching and best practice checks
 */
export async function scanProject(): Promise<SecurityScanResult> {
  const timestamp = new Date().toISOString();
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // Check for .env files that might contain secrets
    if (fs.existsSync('.env')) {
      vulnerabilities.push({
        id: 'SEC001',
        severity: 'medium',
        description: 'Unprotected environment file (.env) detected',
        location: '.env',
        recommendation: 'Ensure .env is in .gitignore and not committed to version control'
      });
    }
    
    // Check if package.json dependencies have known vulnerabilities (simplified)
    if (fs.existsSync('package.json')) {
      try {
        // This is just a simulation - in a real scenario you'd use a tool like npm audit
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Example check - looking for insecure packages
        const riskyPackages = [
          'node-serialize', // Known for insecure deserialization issues
          'eval', // Dangerous eval usage
          'unsafe-eval', // Dangerous eval usage
          'unsafe-perm', // Insecure permissions
          'unsafe-regex' // Potential for regex DoS
        ];
        
        const dependencies = {
          ...packageJson.dependencies || {},
          ...packageJson.devDependencies || {}
        };
        
        for (const pkg of riskyPackages) {
          if (dependencies[pkg]) {
            vulnerabilities.push({
              id: 'SEC002',
              severity: 'high',
              description: `Potentially unsafe package detected: ${pkg}`,
              location: 'package.json',
              recommendation: `Consider removing or replacing the package: ${pkg}`
            });
          }
        }
      } catch (error) {
        console.error('Error checking package.json:', error);
      }
    }
    
    // Check for hardcoded secrets in files (simple pattern search)
    const potentialSecretPatterns = [
      /(['"])(?:api|jwt|db|secret|token|key|pass|auth).*?(['"])\s*[:=]\s*(['"])(?=(?:(?!\3).)*$)/gi,
      /(['"])(?:aws|firebase|stripe|twilio).*?(['"])\s*[:=]\s*(['"])(?=(?:(?!\3).)*$)/gi
    ];
    
    const filesToCheck = findFilesToCheck();
    
    for (const file of filesToCheck) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of potentialSecretPatterns) {
          const matches = content.match(pattern);
          
          if (matches && matches.length > 0) {
            vulnerabilities.push({
              id: 'SEC003',
              severity: 'critical',
              description: `Possible hardcoded credentials/secrets found`,
              location: file,
              recommendation: 'Move all secrets to environment variables or secure secret storage'
            });
            
            // Only report once per file to avoid spam
            break;
          }
        }
        
        // Check for eval usage
        if (/\beval\s*\(/gi.test(content)) {
          vulnerabilities.push({
            id: 'SEC004',
            severity: 'high',
            description: 'Use of eval() detected',
            location: file,
            recommendation: 'Avoid using eval() as it can lead to code injection vulnerabilities'
          });
        }
        
        // Check for innerHTML (potential XSS)
        if (/\.innerHTML\s*=/gi.test(content)) {
          vulnerabilities.push({
            id: 'SEC005',
            severity: 'medium',
            description: 'Usage of .innerHTML found',
            location: file,
            recommendation: 'Consider using safer alternatives like textContent or DOM manipulation methods'
          });
        }
      } catch (error) {
        console.error(`Error checking file ${file}:`, error);
      }
    }
    
    // Check for middleware security settings
    try {
      const serverFiles = findServerFiles();
      let helmetFound = false;
      let corsConfigured = false;
      let csrfProtection = false;
      
      for (const file of serverFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('helmet(') || content.includes('require(\'helmet\')') || content.includes('from \'helmet\'')) {
          helmetFound = true;
        }
        
        if (content.includes('cors(') || content.includes('require(\'cors\')') || content.includes('from \'cors\'')) {
          corsConfigured = true;
        }
        
        if (content.includes('csrf') || content.includes('csurf')) {
          csrfProtection = true;
        }
      }
      
      if (!helmetFound) {
        vulnerabilities.push({
          id: 'SEC006',
          severity: 'high',
          description: 'Helmet middleware not detected',
          recommendation: 'Use helmet middleware to set secure HTTP headers'
        });
      }
      
      if (!corsConfigured) {
        vulnerabilities.push({
          id: 'SEC007',
          severity: 'medium',
          description: 'CORS policy not explicitly configured',
          recommendation: 'Configure CORS policy to restrict resource sharing to trusted domains only'
        });
      }
      
      if (!csrfProtection) {
        vulnerabilities.push({
          id: 'SEC008',
          severity: 'high',
          description: 'CSRF protection not detected',
          recommendation: 'Implement CSRF protection using csurf or similar middleware'
        });
      }
    } catch (error) {
      console.error('Error checking server files:', error);
    }
    
    // Categorize issues by severity
    const criticalIssues = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highIssues = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumIssues = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowIssues = vulnerabilities.filter(v => v.severity === 'low').length;
    
    // Prepare scan result
    const result: SecurityScanResult = {
      timestamp,
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      vulnerabilities
    };
    
    // Log the security scan event
    logSecurityEvent({
      type: 'SECURITY_SCAN',
      timestamp,
      totalIssues: vulnerabilities.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues
    });
    
    return result;
  } catch (error) {
    console.error('Error during security scan:', error);
    
    // Return a minimal result in case of error
    return {
      timestamp,
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      vulnerabilities: [{
        id: 'SCAN_ERROR',
        severity: 'high',
        description: `Error during security scan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendation: 'Check server logs for more details'
      }]
    };
  }
}

/**
 * Find all relevant files to check for security issues
 */
function findFilesToCheck(): string[] {
  try {
    // Find JavaScript and TypeScript files, excluding node_modules and other irrelevant directories
    const command = "find . -type f \\( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \\) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/build/*'";
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding files to check:', error);
    return [];
  }
}

/**
 * Find server-side files to check for middleware security settings
 */
function findServerFiles(): string[] {
  try {
    // Find JavaScript and TypeScript files in server directory
    const command = "find ./server -type f \\( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \\) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/build/*'";
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding server files:', error);
    return [];
  }
}

/**
 * Run a security scan and schedule regular scans
 */
export function initializeSecurityScans(intervalHours = 24): void {
  // Run initial scan
  scanProject().then(result => {
    console.log(`Initial security scan complete. Found ${result.totalIssues} issues.`);
    console.log(`- Critical: ${result.criticalIssues}`);
    console.log(`- High: ${result.highIssues}`);
    console.log(`- Medium: ${result.mediumIssues}`);
    console.log(`- Low: ${result.lowIssues}`);
  });
  
  // Schedule regular scans
  const intervalMs = intervalHours * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const result = await scanProject();
      console.log(`Scheduled security scan complete. Found ${result.totalIssues} issues.`);
    } catch (error) {
      console.error('Error during scheduled security scan:', error);
    }
  }, intervalMs);
}