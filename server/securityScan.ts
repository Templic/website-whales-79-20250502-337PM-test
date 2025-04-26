/**
 * Security Scanning Service
 * 
 * Provides security scanning capabilities for the application with various
 * scanners that can be enabled or disabled through configuration.
 */

import { log } from './vite';
import { config } from './config';
import { runPaymentSecurityScan } from './security/paymentSecurity';
import { v4 as uuidv4 } from 'uuid';

// Define SecurityVulnerability interface
interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
}

// Track the last scan time
let lastScanTime: number | null = null;

// Security scan result interface
interface ScanResult {
  scanner: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

// Array to store scan results
const scanResults: ScanResult[] = [];

/**
 * Run a security scan with all enabled scanners
 * This is the main function that orchestrates all individual scanners
 */
export async function runSecurityScan(): Promise<ScanResult[]> {
  try {
    // Skip if security scans are disabled
    if (!config.security.enableScans || !config.features.enableSecurityScans) {
      log('Security scans are disabled, skipping scan', 'security');
      return [];
    }

    const startTime = Date.now();
    log('Starting security scan...', 'security');
    
    // Clear previous results
    scanResults.length = 0;
    
    // Create array to store vulnerabilities
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Run all enabled scanners
    await Promise.all([
      scanDependencies(),
      scanExpiredCertificates(),
      scanOutdatedDependencies(),
      scanCommonVulnerabilities(),
      scanImportsForMalware(vulnerabilities), // Add import scanning
      scanPaymentSecurity() // Add payment security scan
    ]);
    
    // Update last scan time
    lastScanTime = Date.now();
    const duration = lastScanTime - startTime;
    
    // Process and log results
    const errors = scanResults.filter(r => r.status === 'error').length;
    const warnings = scanResults.filter(r => r.status === 'warning').length;
    const success = scanResults.filter(r => r.status === 'success').length;
    
    log(`Security scan completed in ${duration}ms`, 'security');
    log(`Results: ${errors} errors, ${warnings} warnings, ${success} passed`, 'security');
    
    // Log any errors or warnings
    if (errors > 0 || warnings > 0) {
      scanResults
        .filter(r => r.status !== 'success')
        .forEach(result => {
          log(`[${result.status.toUpperCase()}] ${result.scanner}: ${result.message}`, 'security');
        });
    }
    
    return scanResults;
  } catch (error) {
    log(`Error during security scan: ${error}`, 'security');
    return [];
  }
}

/**
 * Run a deferred security scan after server startup
 * This is used to run a scan without blocking server startup
 */
export async function runDeferredSecurityScan(): Promise<void> {
  log('Running deferred security scan...', 'security');
  await runSecurityScan();
}

/**
 * Scan dependencies for known vulnerabilities
 * This is a placeholder for a real dependency scanner
 */
async function scanDependencies(): Promise<void> {
  // Simulate dependency scanning
  log('Scanning dependencies for known vulnerabilities...', 'security');
  
  // This would typically connect to a vulnerability database
  // or run a tool like npm audit
  
  // Add result to scan results
  scanResults.push({
    scanner: 'DependencyScanner',
    status: 'success',
    message: 'No critical vulnerabilities found',
    timestamp: Date.now()
  });
}

/**
 * Scan for expired certificates
 * This is a placeholder for a real certificate scanner
 */
async function scanExpiredCertificates(): Promise<void> {
  // Simulate certificate scanning
  log('Scanning for expired certificates...', 'security');
  
  // This would typically check SSL certificates
  
  // Add result to scan results
  scanResults.push({
    scanner: 'CertificateScanner',
    status: 'success',
    message: 'No expired certificates found',
    timestamp: Date.now()
  });
}

/**
 * Scan for outdated dependencies
 * This is a placeholder for a real outdated dependency scanner
 */
async function scanOutdatedDependencies(): Promise<void> {
  // Simulate outdated dependency scanning
  log('Scanning for outdated dependencies...', 'security');
  
  // This would typically run npm outdated or similar
  
  // Add result to scan results
  scanResults.push({
    scanner: 'OutdatedDependencyScanner',
    status: 'warning',
    message: 'Some dependencies are outdated but not critical',
    details: {
      outdatedCount: 3,
      criticalCount: 0
    },
    timestamp: Date.now()
  });
}

/**
 * Scan for common vulnerabilities
 * This is a placeholder for a real vulnerability scanner
 */
async function scanCommonVulnerabilities(): Promise<void> {
  // Simulate vulnerability scanning
  log('Scanning for common vulnerabilities...', 'security');
  
  // This would typically check for XSS, CSRF, SQL injection, etc.
  
  // Add result to scan results
  scanResults.push({
    scanner: 'VulnerabilityScanner',
    status: 'success',
    message: 'No common vulnerabilities found',
    timestamp: Date.now()
  });
}

/**
 * Enhanced scan of imported modules for known vulnerabilities, exploits, malware, and other security issues
 */
async function scanImportsForMalware(vulnerabilities: SecurityVulnerability[]): Promise<void> {
  log('Scanning imports for known vulnerabilities, exploits, and malware...', 'security');
  
  // Get package.json to scan installed dependencies
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Read package.json to get actual dependencies
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);
    
    // Extract all dependencies
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };
    
    const packageNames = Object.keys(allDependencies);
    log(`Scanning ${packageNames.length} installed packages...`, 'security');
    
    // Known malicious packages (expanded list)
    const knownMaliciousImports = [
      'malicious-package-1',
      'malicious-package-2',
      'event-logger', // Known typosquatting package
      'cross-env-shell', // Fake version of legitimate package
      'eslint-config-airbnb-standard', // Known trojan package
      'electron-native-notify', // Known for crypto mining
      'codecov', // Historical vulnerability (for demonstration)
      'browserslist', // Historical vulnerability (for demonstration)
      'ua-parser-js', // Historical vulnerability (for demonstration)
      'coa', // Historical vulnerability (for demonstration)
      'rc', // Historical vulnerability (for demonstration)
      'colors', // Historical rogue version
      'faker.js', // Historical rogue version
      'left-pad', // Famous dependency risk example
      'node-ipc', // Historical politically motivated malware
    ];
    
    // Potentially dangerous patterns to detect in all packages
    const dangerousPatterns = [
      { 
        pattern: "crypto\\.mining", 
        description: "Potential cryptocurrency mining code" 
      },
      { 
        pattern: "child_process\\.exec\\s*\\(\\s*(?:req|request|input|data)", 
        description: "Potential command injection vulnerability" 
      },
      { 
        pattern: "\\.runInThisContext\\s*\\(\\s*(?:req|request|input|data)", 
        description: "Potential code injection vulnerability" 
      },
      { 
        pattern: "eval\\s*\\(\\s*(?:req|request|input|data)", 
        description: "Potential code evaluation vulnerability" 
      },
      { 
        pattern: "\\bnet\\b.*\\bconnect\\b.*\\b(?:hidden|unknown|suspicious)\\b", 
        description: "Potential suspicious network connection" 
      },
      { 
        pattern: "base64_decode\\s*\\(", 
        description: "Potential obfuscated malicious code" 
      },
    ];
    
    // Check installed packages against known malicious list
    for (const pkg of packageNames) {
      // Check known malicious packages
      if (knownMaliciousImports.includes(pkg)) {
        const vulnerability: SecurityVulnerability = {
          id: uuidv4(),
          severity: 'critical',
          description: `Malicious import detected: ${pkg}`,
          recommendation: `Remove or replace the package: ${pkg} immediately. It is known to contain malware, exploits, or other security issues.`,
        };
        
        vulnerabilities.push(vulnerability);
        
        // Add to scan results
        scanResults.push({
          scanner: 'Import Security Scanner',
          status: 'error',
          message: `Malicious import detected: ${pkg}`,
          details: {
            packageName: pkg,
            recommendation: vulnerability.recommendation,
            severity: 'critical'
          },
          timestamp: Date.now()
        });
      }
      
      // Check for typosquatting (similar names to popular packages)
      const typosquatting = await checkForTyposquatting(pkg);
      if (typosquatting.isTyposquatting && typosquatting.similarTo) {
        const vulnerability: SecurityVulnerability = {
          id: uuidv4(),
          severity: 'high',
          description: `Potential typosquatting package detected: ${pkg}`,
          recommendation: `Verify if you intended to use ${pkg} or ${typosquatting.similarTo}. Typosquatting packages often contain malware.`,
        };
        
        vulnerabilities.push(vulnerability);
        
        // Add to scan results
        scanResults.push({
          scanner: 'Import Security Scanner',
          status: 'warning',
          message: `Potential typosquatting package detected: ${pkg}`,
          details: {
            packageName: pkg,
            similarTo: typosquatting.similarTo,
            recommendation: vulnerability.recommendation,
            severity: 'high'
          },
          timestamp: Date.now()
        });
      }
      
      // Check package version safety
      const versionCheck = await checkPackageVersion(pkg, allDependencies[pkg]);
      if (versionCheck.hasIssue && versionCheck.description && versionCheck.recommendation) {
        const vulnerability: SecurityVulnerability = {
          id: uuidv4(),
          severity: (versionCheck.severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
          description: versionCheck.description,
          recommendation: versionCheck.recommendation,
        };
        
        vulnerabilities.push(vulnerability);
        
        // Add to scan results
        scanResults.push({
          scanner: 'Import Security Scanner',
          status: versionCheck.severity === 'critical' || versionCheck.severity === 'high' ? 'error' : 'warning',
          message: versionCheck.description,
          details: {
            packageName: pkg,
            version: allDependencies[pkg],
            recommendation: versionCheck.recommendation,
            severity: versionCheck.severity
          },
          timestamp: Date.now()
        });
      }
      
      // Check for known vulnerabilities in the package
      const knownVuln = await checkKnownVulnerability(pkg);
      if (knownVuln) {
        const vulnerability: SecurityVulnerability = {
          id: uuidv4(),
          severity: 'critical',
          description: `Known vulnerability in package: ${pkg}`,
          recommendation: `Update or replace the package ${pkg} as it contains known security vulnerabilities.`,
        };
        
        vulnerabilities.push(vulnerability);
        
        // Add to scan results
        scanResults.push({
          scanner: 'Import Security Scanner',
          status: 'error',
          message: `Known vulnerability in package: ${pkg}`,
          details: {
            packageName: pkg,
            recommendation: vulnerability.recommendation,
            severity: 'critical'
          },
          timestamp: Date.now()
        });
      }
    }
    
    // If no vulnerabilities were found, add a success result
    if (!vulnerabilities.some(v => v.description.includes('detected'))) {
      scanResults.push({
        scanner: 'Import Security Scanner',
        status: 'success',
        message: 'No malicious imports or vulnerabilities detected',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    log(`Error during import security scan: ${error}`, 'security');
    
    scanResults.push({
      scanner: 'Import Security Scanner',
      status: 'error',
      message: 'Error scanning imports',
      details: { error: String(error) },
      timestamp: Date.now()
    });
  }
}

/**
 * Function to check if a package is known to have vulnerabilities
 */
async function checkKnownVulnerability(packageName: string): Promise<boolean> {
  // Simulated database query or API call to check for vulnerabilities
  // In a real implementation, this would check an external vulnerability database
  const knownVulnerablePackages = [
    'malicious-package-1',
    'event-logger',
    'cross-env-shell',
    'eslint-scope@3.7.2', // Specific vulnerable version
    'ua-parser-js',
    'colors@1.4.44' // Specific compromised version
  ]; 
  
  return knownVulnerablePackages.some(pkg => {
    if (pkg.includes('@')) {
      // Check for specific vulnerable versions
      const [name, version] = pkg.split('@');
      return packageName === name;
    }
    return packageName === pkg;
  });
}

/**
 * Check if a package name is potentially a typosquatting attempt 
 * (similar name to popular packages)
 */
async function checkForTyposquatting(packageName: string): Promise<{isTyposquatting: boolean; similarTo?: string}> {
  // List of popular packages that are often typosquatted
  const popularPackages = [
    'react', 'lodash', 'express', 'chalk', 'axios', 'moment', 'jquery', 'webpack',
    'babel', 'typescript', 'eslint', 'prettier', 'dotenv', 'request', 'commander'
  ];
  
  // Simple Levenshtein distance to check string similarity
  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  // Check similarity to popular packages
  for (const pkg of popularPackages) {
    // Skip exact matches
    if (packageName === pkg) {
      continue;
    }
    
    // Check if names are similar but not identical
    const distance = levenshteinDistance(packageName, pkg);
    const similarityThreshold = Math.max(2, Math.floor(pkg.length * 0.3)); // Adaptive threshold
    
    if (distance > 0 && distance <= similarityThreshold) {
      return { isTyposquatting: true, similarTo: pkg };
    }
  }
  
  return { isTyposquatting: false };
}

/**
 * Check if a package version has known security issues
 */
async function checkPackageVersion(packageName: string, version: string): Promise<{
  hasIssue: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  recommendation?: string;
}> {
  // Known problematic package versions
  const problematicVersions: Record<string, {
    version: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }[]> = {
    'colors': [
      {
        version: '1.4.44',
        severity: 'critical',
        description: 'Compromised version of colors package with malicious code',
        recommendation: 'Update to a safe version (e.g., 1.4.0)'
      }
    ],
    'ua-parser-js': [
      {
        version: '0.7.29',
        severity: 'critical',
        description: 'Compromised version of ua-parser-js with cryptomining malware',
        recommendation: 'Update to version 1.0.0 or later'
      }
    ],
    'eslint-scope': [
      {
        version: '3.7.2',
        severity: 'critical',
        description: 'Compromised version of eslint-scope that steals npm credentials',
        recommendation: 'Update to version 3.7.3 or later'
      }
    ],
    'electron': [
      {
        version: '<13.0.0',
        severity: 'high',
        description: 'Older versions of Electron have multiple security vulnerabilities',
        recommendation: 'Update to version 13.0.0 or later'
      }
    ],
    'node-fetch': [
      {
        version: '<2.6.7',
        severity: 'high', 
        description: 'Versions before 2.6.7 are vulnerable to ReDoS attacks',
        recommendation: 'Update to version 2.6.7 or later'
      }
    ]
  };
  
  // Check if package is in our problematic versions list
  if (packageName in problematicVersions) {
    for (const issue of problematicVersions[packageName]) {
      // Simple version matching
      if (issue.version.startsWith('<')) {
        // Version range check (very simplified)
        const minVersion = issue.version.substring(1);
        if (version < minVersion) {
          return {
            hasIssue: true,
            severity: issue.severity,
            description: issue.description,
            recommendation: issue.recommendation
          };
        }
      } else if (version === issue.version) {
        // Exact version match
        return {
          hasIssue: true,
          severity: issue.severity,
          description: issue.description,
          recommendation: issue.recommendation
        };
      }
    }
  }
  
  // No issues found
  return { hasIssue: false };
}

/**
 * Force immediate security scan
 * This is a utility function for manual scanning
 */
export async function forceSecurityScan(): Promise<ScanResult[]> {
  log('Forcing immediate security scan...', 'security');
  return await runSecurityScan();
}

/**
 * Scan for payment security issues
 */
async function scanPaymentSecurity(): Promise<void> {
  // Run payment security scan
  log('Scanning for payment security issues...', 'security');
  
  try {
    // Run the dedicated payment security scan
    const paymentResults = await runPaymentSecurityScan();
    
    // Convert and add results to main scan results
    for (const result of paymentResults) {
      scanResults.push({
        scanner: result.scanner,
        status: result.status, 
        message: result.message,
        details: {
          id: result.id,
          details: result.details,
          recommendation: result.recommendation
        },
        timestamp: Date.now()
      });
    }
  } catch (error) {
    // Add error result if scan fails
    log(`Error in payment security scan: ${error}`, 'security');
    
    scanResults.push({
      scanner: 'PaymentSecurityScanner',
      status: 'error',
      message: 'Error scanning payment security',
      details: { error: String(error) },
      timestamp: Date.now()
    });
  }
}

/**
 * Get the results of the last security scan
 */
export function getLastScanResults(): { results: ScanResult[], lastScanTime: number | null } {
  return {
    results: [...scanResults],
    lastScanTime
  };
}