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

const execPromise = promisify(exec);

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
    // Define patterns for different types of secrets with specific formats
    const secretPatterns = [
      // API Keys and Tokens
      {
        type: 'API Key',
        severity: 'critical',
        regex: '(api[_-]?key|api_token|api_secret)[\s]*=[\s]*[\"\']([a-zA-Z0-9_\\-]{16,})[\"\']',
        recommendation: 'Move API keys to environment variables and use a secret management system'
      },
      // Generic secrets
      {
        type: 'Secret key',
        severity: 'high',
        regex: '(secret|private_key|private[-_]token)[\s]*=[\s]*[\"\']([a-zA-Z0-9_\\-]{8,})[\"\']',
        recommendation: 'Store secrets in environment variables or a vault system'
      },
      // Authentication tokens
      {
        type: 'Authentication token',
        severity: 'high',
        regex: '(auth[-_]?token|access[-_]?token|bearer)[\s]*=[\s]*[\"\']([a-zA-Z0-9_\\-.]{8,})[\"\']',
        recommendation: 'Use a token management system and avoid hardcoding tokens'
      },
      // Cloud provider credentials (AWS, GCP, Azure)
      {
        type: 'Cloud credentials',
        severity: 'critical',
        regex: '(aws_access_key|aws_secret|AKIA[A-Z0-9]{16}|gcp_key|azure_key)[\s]*=[\s]*[\"\']([a-zA-Z0-9/+]{8,})[\"\']',
        recommendation: 'Use IAM roles or environment-based authentication instead of hardcoded credentials'
      },
      // Database credentials
      {
        type: 'Database credentials',
        severity: 'critical',
        regex: '(db_password|database_pass|mongodb+srv:|postgres://|mysql://)[\s]*[\"\'=]([^\"\']+)[\"\']',
        recommendation: 'Use environment variables for database connections and consider connection pooling for security'
      },
      // Private keys and certificates
      {
        type: 'Private key',
        severity: 'critical',
        regex: '-----BEGIN\\s+(?:RSA|OPENSSH|DSA|EC)\\s+PRIVATE\\s+KEY-----',
        recommendation: 'Store private keys in a secure key management system, never in code'
      },
      // OAuth credentials
      {
        type: 'OAuth credentials',
        severity: 'high',
        regex: '(client_secret|consumer_secret)[\s]*=[\s]*[\"\']([a-zA-Z0-9_\\-]{8,})[\"\']',
        recommendation: 'Use a secure credential management system for OAuth secrets'
      },
      // Webhooks and webhook secrets
      {
        type: 'Webhook secret',
        severity: 'high',
        regex: '(webhook[-_]?secret|webhook[-_]?token)[\s]*=[\s]*[\"\']([a-zA-Z0-9_\\-]{8,})[\"\']',
        recommendation: 'Store webhook secrets in environment variables'
      },
      // JWT secrets
      {
        type: 'JWT secret',
        severity: 'high',
        regex: '(jwt[-_]?secret|jwt[-_]?key)[\s]*=[\s]*[\"\']([a-zA-Z0-9_\\-]{8,})[\"\']',
        recommendation: 'Use environment variables for JWT secrets and consider using asymmetric keys'
      }
    ];
    
    // Excluded directories to avoid scanning
    const excludedDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'logs',
      'coverage',
      'tmp',
      'temp',
      '.next',
      '.nuxt',
      '__tests__'
    ].map(dir => `--exclude-dir="${dir}"`).join(' ');
    
    // File patterns to include in scan
    const includePatterns = [
      'js', 'ts', 'jsx', 'tsx', 'json', 'env', 'yaml', 'yml', 'config', 'ini', 'xml', 'pem', 'key'
    ].map(ext => `--include="*.${ext}"`).join(' ');
    
    // Find potential secrets for each pattern
    for (const pattern of secretPatterns) {
      try {
        const cmd = `grep -r -i -E '${pattern.regex}' ${includePatterns} ${excludedDirs} . || true`;
        const { stdout } = await execPromise(cmd);
        
        if (stdout.trim()) {
          const results = stdout.split('\n').filter(line => line.trim() !== '');
          
          // Add vulnerabilities for each result
          for (const result of results) {
            const [file, ...contentParts] = result.split(':');
            const content = contentParts.join(':');
            
            if (file && content) {
              // Check if this is in an example or test file (lower severity)
              const isExample = file.toLowerCase().includes('example') || 
                               file.toLowerCase().includes('test') || 
                               file.toLowerCase().includes('demo') ||
                               file.toLowerCase().includes('sample');
              
              // Determine actual content that matched (for better reporting)
              const matches = content.match(new RegExp(pattern.regex, 'i'));
              const matchedContent = matches ? matches[0] : 'Secret pattern detected';
              
              vulnerabilities.push({
                id: uuidv4(),
                severity: isExample ? 'low' : pattern.severity as 'low' | 'medium' | 'high' | 'critical',
                description: `${pattern.type} detected: ${matchedContent.substring(0, 30)}...`,
                location: file,
                recommendation: pattern.recommendation
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error checking for ${pattern.type}:`, error);
      }
    }
    
    // Special check for GitHub-specific tokens
    try {
      // GitHub tokens and PATs have specific formats
      const { stdout: githubTokens } = await execPromise(
        `grep -r -i -E 'github_token|gh[a-z0-9_]*token|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36}' ${includePatterns} ${excludedDirs} . || true`
      );
      
      if (githubTokens.trim()) {
        const results = githubTokens.split('\n').filter(line => line.trim() !== '');
        
        for (const result of results) {
          const [file, ...contentParts] = result.split(':');
          const content = contentParts.join(':');
          
          if (file && content) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: 'critical',
              description: 'GitHub token or Personal Access Token detected',
              location: file,
              recommendation: 'Remove GitHub tokens from code and use GitHub Actions secrets instead'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking for GitHub tokens:', error);
    }
    
  } catch (error) {
    console.error('Error checking for secrets:', error);
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'Error occurred while checking for hardcoded secrets',
      recommendation: 'Run a manual security audit to check for hardcoded secrets'
    });
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
  const serverFiles = [
    path.join(process.cwd(), 'server', 'routes.ts'),
    path.join(process.cwd(), 'server', 'routes'),  // Routes directory
    path.join(process.cwd(), 'server', 'controllers'), // Controllers directory, if present
    path.join(process.cwd(), 'server', 'api') // API directory, if present
  ];
  
  type FileInfo = {
    file: string;
    endpointCount: number;
  };
  
  let validationStats = {
    totalEndpoints: 0,
    validatedEndpoints: 0,
    validationFrameworks: {
      zod: false,
      joi: false,
      yup: false,
      expressValidator: false,
      classValidator: false,
      ajv: false,
      custom: false
    },
    routesWithoutValidation: [] as FileInfo[]
  };
  
  const validationPatterns = [
    { name: 'zod', regex: /\bz\.(object|string|number|boolean|array|date|any|enum|tuple)\(/i },
    { name: 'zod schema', regex: /\b\w+Schema\.safeParse\(|\b\w+Schema\.parse\(/i },
    { name: 'joi', regex: /\bJoi\.(object|string|number|boolean|array|date|any)\(/i },
    { name: 'yup', regex: /\byup\.(object|string|number|boolean|array|date|mixed)\(/i },
    { name: 'express-validator', regex: /\b(body|param|query)\((.*?)\)\.isLength|\b(body|param|query)\((.*?)\)\.isEmail|\bvalidationResult\(/i },
    { name: 'class-validator', regex: /@(IsString|IsNumber|IsEmail|IsOptional|IsDate|Min|Max|Length)\(/i },
    { name: 'ajv', regex: /\bajv\.validate\(|\bnew Ajv\(/i },
    { name: 'custom validation', regex: /\bvalidate[A-Z]\w+|\bvalidation\.\w+|\bisValid[A-Z]\w+|\bsanitize[A-Z]\w+/i }
  ];

  // Recursively check files in a directory
  async function checkDirectory(dirPath: string, isRootDir: boolean = false) {
    if (!fs.existsSync(dirPath)) return;
    
    if (fs.statSync(dirPath).isDirectory()) {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        
        if (fs.statSync(filePath).isDirectory()) {
          await checkDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          await checkFile(filePath, isRootDir && file === 'routes.ts');
        }
      }
    } else {
      await checkFile(dirPath, path.basename(dirPath) === 'routes.ts');
    }
  }
  
  // Check a single file for validation
  async function checkFile(filePath: string, isMainRouteFile: boolean = false) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Count potential API endpoints in this file
    const routeMatches = content.match(/\.(get|post|put|patch|delete)\s*\(/gi) || [];
    const endpointCount = routeMatches.length;
    validationStats.totalEndpoints += endpointCount;
    
    // Check if file contains validation
    let hasValidation = false;
    
    for (const pattern of validationPatterns) {
      if (pattern.regex.test(content)) {
        hasValidation = true;
        validationStats.validationFrameworks[pattern.name.split(' ')[0].toLowerCase() as keyof typeof validationStats.validationFrameworks] = true;
      }
    }
    
    if (hasValidation) {
      // Estimate how many endpoints might be validated
      // This is a rough estimation based on validation patterns proximity to route handlers
      const lines = content.split('\n');
      let validatedCount = 0;
      
      routeMatches.forEach(match => {
        const matchIndex = content.indexOf(match);
        const context = content.substring(Math.max(0, matchIndex - 500), Math.min(content.length, matchIndex + 500));
        
        // Check if there's validation near the route handler
        for (const pattern of validationPatterns) {
          if (pattern.regex.test(context)) {
            validatedCount++;
            break;
          }
        }
      });
      
      validationStats.validatedEndpoints += validatedCount;
    } else if (endpointCount > 0) {
      // Track files with routes but no validation
      validationStats.routesWithoutValidation.push({
        file: path.basename(filePath),
        endpointCount
      });
    }
  }
  
  // Check all server files
  for (const filePath of serverFiles) {
    if (fs.existsSync(filePath)) {
      await checkDirectory(filePath, true);
    }
  }
  
  // Add vulnerabilities based on findings
  if (validationStats.totalEndpoints === 0) {
    // Could not detect any endpoints - add a note about this
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'low',
      description: 'Could not detect API endpoints for input validation analysis',
      recommendation: 'Implement robust input validation for all API endpoints using a validation library like Zod, Joi, or express-validator'
    });
  } else {
    const validationRatio = validationStats.validatedEndpoints / validationStats.totalEndpoints;
    
    // No input validation found at all
    if (validationStats.validatedEndpoints === 0) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'high',
        description: `No input validation found for ${validationStats.totalEndpoints} detected API endpoints`,
        recommendation: 'Implement robust input validation for all API endpoints using a validation library like Zod, Joi, or express-validator'
      });
    } 
    // Partial input validation (less than 75%)
    else if (validationRatio < 0.75) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'medium',
        description: `Only ${Math.round(validationRatio * 100)}% of API endpoints appear to be validated (${validationStats.validatedEndpoints}/${validationStats.totalEndpoints})`,
        recommendation: 'Ensure all API endpoints validate input data to prevent injection attacks and unexpected behavior'
      });
      
      // Add specific entry for each unvalidated file
      if (validationStats.routesWithoutValidation.length > 0) {
        validationStats.routesWithoutValidation.forEach(fileInfo => {
          vulnerabilities.push({
            id: uuidv4(),
            severity: 'medium',
            description: `No validation detected in route file: ${fileInfo.file} (${fileInfo.endpointCount} endpoints)`,
            location: fileInfo.file,
            recommendation: 'Add input validation using Zod, Joi, or express-validator'
          });
        });
      }
    }
    
    // Make recommendations for improving validation if it exists but could be better
    if (validationStats.validatedEndpoints > 0 && validationRatio < 1.0) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'low',
        description: 'Input validation could be improved to cover all API endpoints',
        recommendation: 'Consider implementing a middleware that enforces validation for all routes'
      });
    }
  }
  
  // Check for proper error handling of validation failures
  await checkValidationErrorHandling(vulnerabilities);
}

/**
 * Check for proper error handling of validation failures
 */
async function checkValidationErrorHandling(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  const serverFiles = [
    path.join(process.cwd(), 'server', 'routes.ts'),
    path.join(process.cwd(), 'server', 'routes'),
    path.join(process.cwd(), 'server', 'middleware.ts'),
    path.join(process.cwd(), 'server', 'middlewares')
  ];
  
  let foundErrorHandling = false;
  let hasCentralizedValidation = false;
  
  // Patterns that indicate proper validation error handling
  const errorHandlingPatterns = [
    /catch\s*\([^)]*\)\s*\{[^}]*status\s*\(\s*4\d\d\s*\)/i,  // Try-catch with 4xx status
    /validation.*?fail.*?res\.status\s*\(\s*4\d\d\s*\)/i,    // Validation failure with 4xx status
    /\.error\s*\([^)]*\)\s*.*?status\s*\(\s*400\s*\)/i,      // Error method with 400 status
    /invalid.*?input.*?status\s*\(\s*400\s*\)/i,             // Invalid input with 400 status
    /if\s*\([^)]*valid[^)]*\)\s*\{[^}]*status\s*\(\s*4\d\d\s*\)/i, // If valid check with 4xx
    /!valid.*?status\s*\(\s*4\d\d\s*\)/i                    // Not valid with 4xx status
  ];
  
  // Patterns that indicate centralized validation
  const centralizedValidationPatterns = [
    /function\s+validate[A-Z]\w+\s*\([^)]*\)/i,              // Validation function
    /const\s+validate[A-Z]\w+\s*=\s*function/i,              // Validation const function
    /const\s+validate[A-Z]\w+\s*=\s*\([^)]*\)\s*=>/i,        // Validation arrow function
    /middleware.*?validation/i,                               // Validation middleware
    /app\.use\([^)]*valid[^)]*\)/i,                          // App-level validation middleware
    /router\.use\([^)]*valid[^)]*\)/i                        // Router-level validation middleware
  ];
  
  // Check files
  for (const filePath of serverFiles) {
    if (!fs.existsSync(filePath)) continue;
    
    if (fs.statSync(filePath).isDirectory()) {
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
        
        const content = fs.readFileSync(path.join(filePath, file), 'utf8');
        
        // Check for error handling patterns
        for (const pattern of errorHandlingPatterns) {
          if (pattern.test(content)) {
            foundErrorHandling = true;
            break;
          }
        }
        
        // Check for centralized validation patterns
        for (const pattern of centralizedValidationPatterns) {
          if (pattern.test(content)) {
            hasCentralizedValidation = true;
            break;
          }
        }
        
        if (foundErrorHandling && hasCentralizedValidation) break;
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for error handling patterns
      for (const pattern of errorHandlingPatterns) {
        if (pattern.test(content)) {
          foundErrorHandling = true;
          break;
        }
      }
      
      // Check for centralized validation patterns
      for (const pattern of centralizedValidationPatterns) {
        if (pattern.test(content)) {
          hasCentralizedValidation = true;
          break;
        }
      }
    }
    
    if (foundErrorHandling && hasCentralizedValidation) break;
  }
  
  // Report issues
  if (!foundErrorHandling) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      description: 'No proper validation error handling detected',
      recommendation: 'Implement consistent error handling for validation failures with appropriate HTTP status codes (400) and error messages'
    });
  }
  
  if (!hasCentralizedValidation) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'low',
      description: 'No centralized validation approach detected',
      recommendation: 'Consider implementing a centralized validation middleware or helper functions to ensure consistent validation across all endpoints'
    });
  }
}