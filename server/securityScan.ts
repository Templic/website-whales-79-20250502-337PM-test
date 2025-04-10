import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './vite';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Set rules for security scanning
const securityRules = {
  packageJsonRules: {
    requiredDeps: ['helmet', 'express-rate-limit'],
    suspiciousDeps: ['eval', 'unsafe-eval', 'evil-script']
  },
  filePatterns: {
    // Patterns to look for within files (regex as strings)
    dangerous: [
      'eval\\(',
      'child_process.exec\\(',
      'fs.writeFileSync\\(',
      'dangerouslySetInnerHTML',
      '\\.innerHtml\\s*=',
      '\\.innerHTML\\s*=',
      'document\\.write\\(',
      'function\\s*\\(\\)\\s*\\{\\s*return\\s*eval',
      'setTimeout\\(\\s*[\'"`]',
      'setInterval\\(\\s*[\'"`]',
      'new\\s+Function\\s*\\(',
      '__proto__',
      '\\.constructor\\s*\\.',
      'Object\\.assign\\s*\\(\\s*Object\\.prototype',
    ]
  }
};

// List of special paths to ignore during scan
const ignoredPaths = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'logs',
  'temp',
  'test',
  'tests',
  '.next'
];

/**
 * Scan a specific file for security issues
 * @param filePath - Path to the file to scan
 */
async function scanFile(filePath: string): Promise<{ path: string, issues: string[] }> {
  // Return early for certain file types
  if (!/\.(js|ts|jsx|tsx|html|json)$/.test(filePath)) {
    return { path: filePath, issues: [] };
  }
  
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const issues: string[] = [];
    
    // Check for dangerous patterns
    for (const pattern of securityRules.filePatterns.dangerous) {
      const regex = new RegExp(pattern, 'g');
      if (regex.test(fileContent)) {
        issues.push(`Potentially unsafe pattern found: ${pattern}`);
      }
    }
    
    // Special checks for package.json
    if (path.basename(filePath) === 'package.json') {
      const packageJson = JSON.parse(fileContent);
      const dependencies = { 
        ...packageJson.dependencies || {}, 
        ...packageJson.devDependencies || {} 
      };
      
      // Check for missing required dependencies
      for (const dep of securityRules.packageJsonRules.requiredDeps) {
        if (!dependencies[dep]) {
          issues.push(`Missing recommended security dependency: ${dep}`);
        }
      }
      
      // Check for suspicious dependencies
      for (const dep of securityRules.packageJsonRules.suspiciousDeps) {
        if (dependencies[dep]) {
          issues.push(`Suspicious dependency detected: ${dep}`);
        }
      }
    }
    
    return { path: filePath, issues };
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
    return { path: filePath, issues: [`Error scanning file: ${error}`] };
  }
}

/**
 * Scan directories recursively for security issues
 * @param dirPath - Directory to scan
 */
async function scanDirectory(dirPath: string): Promise<{ path: string, issues: string[] }[]> {
  const results: { path: string, issues: string[] }[] = [];
  
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip ignored paths
      if (ignoredPaths.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Recursive scan for directories
        const dirResults = await scanDirectory(fullPath);
        results.push(...dirResults);
      } else {
        // Scan file
        const fileResult = await scanFile(fullPath);
        if (fileResult.issues.length > 0) {
          results.push(fileResult);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return results;
}

/**
 * Perform a comprehensive security scan of the project
 */
export async function runSecurityScan(): Promise<{
  issueCount: number;
  criticalIssues: number;
  results: { path: string, issues: string[] }[];
}> {
  log('Starting security scan...', 'security');
  const scanStartTime = Date.now();
  
  // Perform the scan
  const results = await scanDirectory(rootDir);
  
  // Filter out entries with no issues for the summary
  const issuesFound = results.filter(result => result.issues.length > 0);
  
  // Count critical issues (those containing keywords like 'unsafe' or 'dangerous')
  const criticalIssues = issuesFound.reduce((count, result) => {
    const critical = result.issues.filter(issue => 
      issue.toLowerCase().includes('unsafe') || 
      issue.toLowerCase().includes('dangerous') ||
      issue.toLowerCase().includes('suspicious')
    ).length;
    return count + critical;
  }, 0);
  
  // Calculate total issues
  const totalIssues = issuesFound.reduce((count, result) => count + result.issues.length, 0);
  
  // Log results
  const scanTime = Date.now() - scanStartTime;
  log(`Security scan completed in ${scanTime}ms`, 'security');
  log(`Found ${totalIssues} potential issues (${criticalIssues} critical)`, 'security');
  
  return {
    issueCount: totalIssues,
    criticalIssues,
    results: issuesFound
  };
}

/**
 * Run a deferred security scan (used for non-blocking scan)
 */
export async function runDeferredSecurityScan(): Promise<void> {
  try {
    log('Running deferred security scan...', 'security');
    const result = await runSecurityScan();
    
    // Log summary
    if (result.issueCount > 0) {
      log(`Security scan found ${result.issueCount} issues (${result.criticalIssues} critical)`, 'security');
      
      // Log critical issues
      result.results.forEach(file => {
        file.issues.forEach(issue => {
          if (issue.toLowerCase().includes('unsafe') || 
              issue.toLowerCase().includes('dangerous') ||
              issue.toLowerCase().includes('suspicious')) {
            log(`CRITICAL SECURITY ISSUE: ${file.path} - ${issue}`, 'security');
          }
        });
      });
    } else {
      log('Security scan completed with no issues found', 'security');
    }
  } catch (error) {
    console.error('Error during security scan:', error);
  }
}

// For backwards compatibility
export const scanProject = runSecurityScan;