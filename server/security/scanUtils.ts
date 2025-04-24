/**
 * Security Scanning Utilities
 * 
 * Contains helper functions for security scanning, vulnerability assessment,
 * and security report generation.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { SecurityVulnerability } from '../securityScan';

const execAsync = promisify(exec);

/**
 * Pattern to detect potential hardcoded secrets or credentials
 */
const SECRET_PATTERNS = [
  /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/i,
  /(?:api|access|secret)[\s-_]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /bearer\s+[a-zA-Z0-9_\-\.\/+]{20,}/i,
  /(?:auth|oauth|authorization)[\s-_]?token\s*[:=]\s*['"][^'"]+['"]/i,
  /-----BEGIN\s+(?:RSA|OPENSSH|DSA|EC)\s+PRIVATE\s+KEY-----/i,
  /\b(?:jdbc|mongodb|redis|mysql|postgres|jdbc):\/\/[^\s<>"']+/i,
  /[a-z0-9_\-]{20,}/i  // Generic long string that might be a token (higher false positive rate)
];

/**
 * List of common security middleware and packages
 */
const SECURITY_PACKAGES = [
  'helmet',
  'csurf',
  'cors',
  'express-rate-limit',
  'express-validator',
  'xss-clean',
  'hpp',
  'content-security-policy',
  '@hapi/joi',
  'zod',
  'yup',
  'class-validator',
  'ajv',
  'sanitize-html',
  'dompurify'
];

/**
 * Finds files in a directory recursively by extension
 * @param dir Directory to search
 * @param extensions File extensions to match (e.g., ['.js', '.ts'])
 * @returns Promise<string[]> List of matching file paths
 */
export async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const results: string[] = [];
  
  try {
    const fileList = await fs.promises.readdir(dir);
    
    for (const file of fileList) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        const nestedFiles = await findFiles(filePath, extensions);
        results.push(...nestedFiles);
      } else if (stat.isFile() && extensions.includes(path.extname(filePath))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return results;
}

/**
 * Searches for patterns in files
 * @param filePaths List of file paths to search
 * @param patterns List of RegExp patterns to search for
 * @returns Map<string, Map<RegExp, string[]>> Map of files to matched patterns and lines
 */
export async function searchPatternsInFiles(
  filePaths: string[], 
  patterns: RegExp[]
): Promise<Map<string, Map<RegExp, string[]>>> {
  const results = new Map<string, Map<RegExp, string[]>>();
  
  for (const filePath of filePaths) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      const fileMatches = new Map<RegExp, string[]>();
      
      for (const pattern of patterns) {
        const matchedLines: string[] = [];
        
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            // Add line number for reference
            matchedLines.push(`Line ${index + 1}: ${line.trim()}`);
          }
        });
        
        if (matchedLines.length > 0) {
          fileMatches.set(pattern, matchedLines);
        }
      }
      
      if (fileMatches.size > 0) {
        results.set(filePath, fileMatches);
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }
  
  return results;
}

/**
 * Check for secrets in codebase
 * @returns Object containing potential secrets found
 */
export async function findPotentialSecrets(): Promise<{ file: string, matches: string[] }[]> {
  const results: { file: string, matches: string[] }[] = [];
  
  try {
    // Find relevant code files
    const codeFiles = await findFiles('.', ['.js', '.ts', '.jsx', '.tsx', '.html', '.json', '.yml', '.yaml', '.env']);
    
    // Search for secret patterns
    const matches = await searchPatternsInFiles(codeFiles, SECRET_PATTERNS);
    
    // Format results
    for (const [file, patternMatches] of matches.entries()) {
      const fileMatches: string[] = [];
      
      for (const [_, lines] of patternMatches.entries()) {
        fileMatches.push(...lines);
      }
      
      if (fileMatches.length > 0) {
        results.push({
          file,
          matches: fileMatches
        });
      }
    }
  } catch (error) {
    console.error('Error finding potential secrets:', error);
  }
  
  return results;
}

/**
 * Detects installed security packages
 * @returns Object with details about detected and missing security packages
 */
export async function detectSecurityPackages(): Promise<{
  installed: string[];
  missing: string[];
  recommendations: string[];
}> {
  const installed: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Read package.json to check for security packages
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
      const dependencies = { 
        ...packageJson.dependencies || {}, 
        ...packageJson.devDependencies || {} 
      };
      
      // Check for each security package
      for (const pkg of SECURITY_PACKAGES) {
        if (dependencies[pkg]) {
          installed.push(pkg);
        } else {
          missing.push(pkg);
        }
      }
      
      // Generate recommendations based on missing packages
      if (!installed.includes('helmet')) {
        recommendations.push('Install helmet to set various HTTP headers for security');
      }
      
      if (!installed.includes('csurf')) {
        recommendations.push('Install csurf for CSRF protection');
      }
      
      if (!installed.includes('express-rate-limit') && !installed.includes('rate-limiter-flexible')) {
        recommendations.push('Add rate limiting to prevent brute force attacks');
      }
      
      if (!installed.some(pkg => ['express-validator', '@hapi/joi', 'zod', 'yup', 'class-validator', 'ajv'].includes(pkg))) {
        recommendations.push('Add a validation library for input validation');
      }
      
      if (!installed.some(pkg => ['sanitize-html', 'dompurify'].includes(pkg))) {
        recommendations.push('Add HTML sanitization for user-generated content');
      }
    }
  } catch (error) {
    console.error('Error detecting security packages:', error);
  }
  
  return { installed, missing, recommendations };
}

/**
 * Checks for common security issues in code
 * @returns List of potential security issues found
 */
export async function detectCommonSecurityIssues(): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // Find JS/TS files
    const codeFiles = await findFiles('.', ['.js', '.ts', '.jsx', '.tsx']);
    
    // Patterns to look for
    const patterns = [
      // Insecure direct object references
      {
        pattern: /(?:\.findById\(req\.params|\.findOne\(\{[^}]*req\.params)/,
        severity: 'medium' as const,
        description: 'Potential Insecure Direct Object Reference (IDOR)',
        recommendation: 'Validate user authorization before accessing objects by ID'
      },
      // SQL Injection
      {
        pattern: /\bexecute\s*\(\s*['"]\s*SELECT.+\$\{/,
        severity: 'high' as const,
        description: 'Potential SQL Injection',
        recommendation: 'Use parameterized queries or an ORM instead of string concatenation'
      },
      // Insecure cookie settings
      {
        pattern: /cookie\s*\(\s*(?![^)]*secure)(?![^)]*httpOnly)/,
        severity: 'medium' as const,
        description: 'Cookies without secure or httpOnly flags',
        recommendation: 'Set secure and httpOnly flags on sensitive cookies'
      },
      // Weak encryption
      {
        pattern: /crypto\.createCipher\s*\(/,
        severity: 'high' as const,
        description: 'Use of deprecated weak crypto method',
        recommendation: 'Use crypto.createCipheriv with appropriate IV instead'
      },
      // Path traversal
      {
        pattern: /(?:fs|require\(["']fs["']\))\.(?:readFile|writeFile|appendFile|readdir)\s*\(\s*(?:[^,)]*req\.[^,)]*|path\.join\s*\([^)]*req\.[^)]*\))/,
        severity: 'high' as const,
        description: 'Potential path traversal vulnerability',
        recommendation: 'Validate and sanitize file paths from user input'
      },
      // Eval or similar
      {
        pattern: /\b(?:eval|new Function|setTimeout\s*\(\s*['"`][^)]+['"`]\s*,|\setFunction\s*\()/,
        severity: 'critical' as const,
        description: 'Use of eval() or similar dynamic code execution',
        recommendation: 'Avoid eval() and similar functions that execute strings as code'
      },
      // JWT without verification
      {
        pattern: /jwt\.(?:sign|verify)\s*\([^,)]*,\s*['"`][^'"`]+['"`]/,
        severity: 'high' as const,
        description: 'Potential hardcoded JWT secret',
        recommendation: 'Store JWT secrets in environment variables'
      },
      // Insufficient input validation
      {
        pattern: /app\.(?:get|post|put|delete|patch)\s*\([^,]+,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{(?![^}]*(?:validate|sanitize|check\())/,
        severity: 'medium' as const,
        description: 'Endpoint without apparent input validation',
        recommendation: 'Validate all user input using a validation library'
      }
    ];
    
    // Search files for patterns
    for (const file of codeFiles) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        
        for (const { pattern, severity, description, recommendation } of patterns) {
          if (pattern.test(content)) {
            vulnerabilities.push({
              id: `code-pattern-${pattern.toString().slice(1, 20).replace(/[^\w-]/g, '-')}`,
              severity,
              description,
              location: file,
              recommendation
            });
          }
        }
      } catch (error) {
        console.error(`Error analyzing file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error detecting common security issues:', error);
  }
  
  return vulnerabilities;
}

/**
 * Formats a security vulnerability for display
 * @param vulnerability The vulnerability to format
 * @returns Formatted vulnerability string
 */
export function formatVulnerability(vulnerability: SecurityVulnerability): string {
  const severityColor = {
    low: '\x1b[34m', // Blue
    medium: '\x1b[33m', // Yellow
    high: '\x1b[31m', // Red
    critical: '\x1b[41m\x1b[37m' // White on Red background
  }[vulnerability.severity] || '';
  const resetColor = '\x1b[0m';
  
  let formattedOutput = `${severityColor}[${vulnerability.severity.toUpperCase()}]${resetColor} ${vulnerability.description}\n`;
  
  if (vulnerability.location) {
    formattedOutput += `  Location: ${vulnerability.location}\n`;
  }
  
  if (vulnerability.recommendation) {
    formattedOutput += `  Recommendation: ${vulnerability.recommendation}\n`;
  }
  
  return formattedOutput;
}

/**
 * Generate a security report file
 * @param vulnerabilities List of vulnerabilities
 * @param outputPath Path to save the report
 */
export async function generateSecurityReport(
  vulnerabilities: SecurityVulnerability[],
  outputPath: string = 'security-report.md'
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;
    
    let report = `# Security Scan Report\n\n`;
    report += `**Scan Date:** ${timestamp}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total issues found: ${vulnerabilities.length}\n`;
    report += `- Critical: ${criticalCount}\n`;
    report += `- High: ${highCount}\n`;
    report += `- Medium: ${mediumCount}\n`;
    report += `- Low: ${lowCount}\n\n`;
    
    // Get security package info
    const { installed, missing, recommendations } = await detectSecurityPackages();
    
    report += `## Security Packages\n\n`;
    report += `### Installed Security Packages\n\n`;
    
    if (installed.length > 0) {
      for (const pkg of installed) {
        report += `- ${pkg}\n`;
      }
    } else {
      report += `No security packages detected.\n`;
    }
    
    report += `\n### Missing Security Packages\n\n`;
    
    if (missing.length > 0) {
      for (const pkg of missing) {
        report += `- ${pkg}\n`;
      }
    } else {
      report += `All common security packages are installed.\n`;
    }
    
    report += `\n### Recommendations\n\n`;
    
    if (recommendations.length > 0) {
      for (const rec of recommendations) {
        report += `- ${rec}\n`;
      }
    } else {
      report += `No package recommendations at this time.\n`;
    }
    
    report += `\n## Vulnerabilities\n\n`;
    
    if (vulnerabilities.length > 0) {
      // Group by severity
      for (const severity of ['critical', 'high', 'medium', 'low']) {
        const severityVulns = vulnerabilities.filter(v => v.severity === severity);
        
        if (severityVulns.length > 0) {
          report += `### ${severity.toUpperCase()} Severity Issues\n\n`;
          
          for (const vuln of severityVulns) {
            report += `#### ${vuln.description}\n\n`;
            
            if (vuln.location) {
              report += `**Location:** ${vuln.location}\n\n`;
            }
            
            if (vuln.recommendation) {
              report += `**Recommendation:** ${vuln.recommendation}\n\n`;
            }
          }
        }
      }
    } else {
      report += `No vulnerabilities detected.\n`;
    }
    
    // Check for potential secrets
    const secrets = await findPotentialSecrets();
    
    if (secrets.length > 0) {
      report += `\n## Potential Hardcoded Secrets\n\n`;
      report += `**Warning:** The following files may contain hardcoded secrets or credentials:\n\n`;
      
      for (const { file, matches } of secrets) {
        report += `### ${file}\n\n`;
        report += `\`\`\`\n`;
        
        for (const match of matches) {
          report += `${match}\n`;
        }
        
        report += `\`\`\`\n\n`;
      }
      
      report += `**Recommendation:** Store secrets in environment variables instead of hardcoding them in source code.\n\n`;
    }
    
    // Write the report to a file
    await fs.promises.writeFile(outputPath, report);
    console.log(`Security report generated: ${outputPath}`);
  } catch (error) {
    console.error('Error generating security report:', error);
  }
}

/**
 * Run npm audit to detect vulnerable dependencies
 * @returns Details about vulnerable dependencies
 */
export async function runNpmAudit(): Promise<{
  vulnerablePackages: number;
  highSeverity: number;
  criticalSeverity: number;
  details: string;
}> {
  try {
    const { stdout } = await execAsync('npm audit --json');
    const auditData = JSON.parse(stdout);
    
    // Extract vulnerability counts
    const vulnerablePackages = Object.keys(auditData.vulnerabilities || {}).length;
    let highSeverity = 0;
    let criticalSeverity = 0;
    let details = '';
    
    // Process each vulnerability
    for (const [name, info] of Object.entries(auditData.vulnerabilities || {})) {
      const vulnInfo = info as any;
      
      if (vulnInfo.severity === 'high') {
        highSeverity++;
      } else if (vulnInfo.severity === 'critical') {
        criticalSeverity++;
      }
      
      details += `Package: ${name}\n`;
      details += `Severity: ${vulnInfo.severity}\n`;
      details += `Vulnerable Versions: ${vulnInfo.range}\n`;
      
      if (vulnInfo.via && vulnInfo.via.length > 0) {
        details += 'Vulnerabilities:\n';
        
        for (const via of vulnInfo.via) {
          if (typeof via === 'string') {
            details += `- ${via}\n`;
          } else if (via.title) {
            details += `- ${via.title} (${via.url || 'No URL provided'})\n`;
          }
        }
      }
      
      details += `Recommendation: ${vulnInfo.recommendation || 'Update to latest version'}\n\n`;
    }
    
    return {
      vulnerablePackages,
      highSeverity,
      criticalSeverity,
      details
    };
  } catch (error) {
    console.error('Error running npm audit:', error);
    return {
      vulnerablePackages: 0,
      highSeverity: 0,
      criticalSeverity: 0,
      details: `Error running npm audit: ${(error as any).message}`
    };
  }
}

/**
 * Checks if a file contains appropriate input validation
 * @param filePath Path to the file to check
 * @returns Whether the file contains validation
 */
export async function checkFileForValidation(filePath: string): Promise<boolean> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Check for common validation patterns
    const validationPatterns = [
      // Express Validator
      /(?:body|param|query|header|cookie)(?:\([^)]*\))?\.(?:isLength|isEmail|isNumeric|isAlphanumeric|isDate|isBoolean|custom|notEmpty|optional|isString|matches)/,
      // Zod
      /z\.(?:object|string|number|boolean|array|date|enum|union|intersection|record|map|tuple|function|lazy|promise|any|unknown|void|never|null|undefined|nullable|optional)/,
      // Joi
      /Joi\.(?:object|string|number|boolean|array|date|func|alternatives|any)/,
      // Yup
      /yup\.(?:object|string|number|boolean|array|date|ref|lazy)/,
      // Class Validator
      /(?:@IsString|@IsNumber|@IsBoolean|@IsDate|@IsArray|@IsEnum|@IsEmail|@MinLength|@MaxLength|@IsNotEmpty|@IsOptional|@Matches|@IsUrl|@IsUUID)/,
      // AJV
      /(?:validate|ajv\.validate|ajv\.compile)/,
      // General validation
      /\.(?:validate|validateSync|validateAsync|check|sanitize|escape|trim)\(/
    ];
    
    return validationPatterns.some(pattern => pattern.test(content));
  } catch (error) {
    console.error(`Error checking file for validation: ${filePath}`, error);
    return false;
  }
}

/**
 * Enhance a security scan result with additional risk metrics
 * @param vulnerabilities List of vulnerabilities
 * @returns Object containing risk metrics
 */
export function calculateRiskMetrics(vulnerabilities: SecurityVulnerability[]): {
  overallRiskScore: number;
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  priorityIssues: SecurityVulnerability[];
} {
  // Calculate risk score based on vulnerability severity
  const severityScores = {
    low: 1,
    medium: 3,
    high: 7,
    critical: 10
  };
  
  // Calculate total score
  let totalScore = 0;
  let maxPossibleScore = 100;
  
  for (const vuln of vulnerabilities) {
    totalScore += severityScores[vuln.severity];
  }
  
  // Normalization to ensure scores are from 0-100
  // More vulnerabilities = exponentially higher risk
  const overallRiskScore = Math.min(
    100, 
    Math.round((totalScore / (maxPossibleScore * 0.1)) * 100) / 100
  );
  
  // Security score is inverse of risk (100 = perfect security)
  const securityScore = Math.max(0, 100 - overallRiskScore);
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  if (overallRiskScore < 20) {
    riskLevel = 'low';
  } else if (overallRiskScore < 50) {
    riskLevel = 'medium';
  } else if (overallRiskScore < 75) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  // Identify priority issues (critical and high severity)
  const priorityIssues = vulnerabilities.filter(
    v => v.severity === 'critical' || v.severity === 'high'
  );
  
  return {
    overallRiskScore,
    securityScore,
    riskLevel,
    priorityIssues
  };
}