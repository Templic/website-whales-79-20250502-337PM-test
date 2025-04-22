/**
 * Maximum Security Scanner
 * 
 * This module provides the most comprehensive security scanning available for the application.
 * It's designed to be extremely thorough at the expense of performance. 
 * This scanner will:
 * 
 * 1. Deep scan all dependencies for exploits, backdoors, and malicious code
 * 2. Perform static code analysis of all dependencies
 * 3. Check for obfuscated malicious code and hidden payloads
 * 4. Analyze network call patterns for data exfiltration
 * 5. Search for suspicious runtime behaviors
 * 6. Check for supply chain attack vectors
 * 7. Perform memory pattern analysis for known attack signatures
 * 8. Audit configuration files for security misconfigurations
 */

import { log } from '../vite';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import crypto from 'crypto';

// Define security vulnerability types with high granularity
export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'backdoor' | 'exploit' | 'vulnerability' | 'misconfiguration' | 'supplychain' | 'obfuscated' | 'dataexfiltration';
  description: string;
  details?: string;
  resource?: string; // File, package, endpoint that is affected
  cve?: string; // Related CVE if applicable
  recommendation: string;
  detectionMethod: string; // How was this vulnerability found
  confidence: 'low' | 'medium' | 'high'; // Confidence level in the finding
  falsePositiveRisk: 'low' | 'medium' | 'high'; // Risk of this being a false positive
}

// Maximum security scan result interface
export interface MaximumScanResult {
  id: string;
  timestamp: number;
  scanDuration: number;
  vulnerabilities: SecurityVulnerability[];
  securityScore: number;
  completionStatus: 'complete' | 'partial' | 'failed';
  scannedResources: {
    totalPackages: number;
    totalFiles: number;
    totalLinesOfCode: number;
    totalNetworkEndpoints: number;
  };
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

// Malware detection patterns
const MALWARE_PATTERNS = [
  // Command execution
  { 
    pattern: /child_process\.exec\s*\(\s*(?:[^)]*\$\{|\$\{[^}]*\}\s*\))/i, 
    category: 'exploit',
    severity: 'critical', 
    description: 'Command injection vulnerability detected',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
  
  // Obfuscated eval
  { 
    pattern: /(?:eval|Function|setTimeout|setInterval)\s*\(\s*(?:atob\s*\(|base64|fromCharCode|decodeURI|String\.fromCharCode)/i, 
    category: 'obfuscated',
    severity: 'critical', 
    description: 'Obfuscated code execution detected',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
  
  // Data exfiltration
  { 
    pattern: /(?:fetch|XMLHttpRequest|http|https|net\.request|axios|got)\s*\(\s*(?:[^)]*\+\s*(?:localStorage|sessionStorage|document\.cookie)|base64)/i, 
    category: 'dataexfiltration',
    severity: 'critical', 
    description: 'Potential data exfiltration detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Cryptocurrency mining
  { 
    pattern: /(?:CryptoNight|coinhive|jsecoin|deepMiner|webmining|cryptonight|minero|miner\.start|cryptoloot)/i, 
    category: 'malware',
    severity: 'high', 
    description: 'Cryptocurrency mining code detected',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
  
  // Reverse shells
  { 
    pattern: /(?:\/bin\/(?:ba)?sh|cmd\.exe|powershell|nc|spawn\s*\([\s\S]*?(?:sh|bash|cmd|powershell))/i, 
    category: 'backdoor',
    severity: 'critical', 
    description: 'Potential reverse shell detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Base64 encoded payloads (large)
  { 
    pattern: /['"](?:[A-Za-z0-9+/]{4}){20,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?['"]/, 
    category: 'obfuscated',
    severity: 'medium', 
    description: 'Large base64 encoded data detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Web shells
  { 
    pattern: /(?:shell_exec|passthru|exec|popen|proc_open|system)\s*\(\s*(?:\$_GET|\$_POST|\$_REQUEST)/i, 
    category: 'backdoor',
    severity: 'critical', 
    description: 'Potential web shell detected',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
  
  // WebSockets to unknown endpoints
  { 
    pattern: /new\s+WebSocket\s*\(\s*(?!['"](?:wss?:\/\/localhost|wss?:\/\/127\.0\.0\.1|wss?:\/\/(?:[\w-]+\.)*[\w-]+\.(?:com|org|io|net)\/api))['"][^'"]+['"]/, 
    category: 'dataexfiltration',
    severity: 'high', 
    description: 'WebSocket connection to unknown endpoint',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Storage exfiltration
  { 
    pattern: /(?:localStorage|sessionStorage|indexedDB)\s*\.\s*(?:setItem|add)\s*\(\s*['"][^'"]*['"]\s*,\s*(?:[^;]*document\.cookie|window\.location|JSON\.stringify\(localStorage\)|document\.forms)/i, 
    category: 'dataexfiltration',
    severity: 'high', 
    description: 'Suspicious data storage operations detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Suspicious browser API usage
  { 
    pattern: /(?:navigator\.sendBeacon|document\.createElement\s*\(\s*['"]script['"][\s\S]*?(?:\.src|\.setAttribute\s*\(\s*['"]src['"]\))\s*=|document\.write)/i, 
    category: 'exploit',
    severity: 'high', 
    description: 'Suspicious browser API usage detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Process spawning 
  { 
    pattern: /(?:spawn|spawnSync|fork|exec|execSync)\s*\(\s*['"](?:curl|wget|nc|ncat|bash|sh|cmd|powershell)/, 
    category: 'backdoor',
    severity: 'critical', 
    description: 'Suspicious process execution',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
  
  // Service workers for interception
  { 
    pattern: /navigator\.serviceWorker\.register[\s\S]*?(?:fetch\s*\([\s\S]*?\.(?:then|catch)|addEventListener\s*\(\s*['"]fetch['"])/, 
    category: 'exploit',
    severity: 'high', 
    description: 'Service worker with network interception capabilities',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Persistent modules with auto-run
  { 
    pattern: /module\.exports\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?(?:exec|spawn|fork|http\.request|fetch|eval)/, 
    category: 'backdoor',
    severity: 'high', 
    description: 'Persistent module with automatic execution capabilities',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Dynamic code loading
  { 
    pattern: /(?:require\s*\(\s*(?:['"][^'"]*['"]\s*\+|JSON\.parse)|import\s*\(\s*(?:['"][^'"]*['"]\s*\+|JSON\.parse))/, 
    category: 'obfuscated',
    severity: 'high', 
    description: 'Dynamic code loading/importing detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Potential SQL injection
  { 
    pattern: /(?:query|execute|executeSql)\s*\(\s*(?:['"][^'"]*['"][\s\S]*?\+\s*(?:\$_GET|\$_POST|\$_REQUEST|req\.body|req\.query|req\.params)|['"][^'"]*\$\{)/, 
    category: 'exploit',
    severity: 'critical', 
    description: 'Potential SQL injection vulnerability',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // DOM-based XSS
  { 
    pattern: /(?:innerHTML|outerHTML|document\.write|document\.writeln|insertAdjacentHTML)\s*=\s*(?:[^;]*location|[^;]*\$\{|[^;]*\+)/, 
    category: 'exploit',
    severity: 'high', 
    description: 'Potential DOM-based XSS vulnerability',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Iframe injection
  { 
    pattern: /(?:document\.createElement\s*\(\s*['"]iframe['"]\)[\s\S]*?\.src\s*=|createElement\s*\(\s*['"]iframe['"]\)[\s\S]*?setAttribute\s*\(\s*['"]src['"])/, 
    category: 'exploit',
    severity: 'high', 
    description: 'Dynamic iframe creation detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Suspicious network requests
  { 
    pattern: /fetch\s*\(\s*['"](?:https?:\/\/(?:(?:\d{1,3}\.){3}\d{1,3}|[0-9a-f:]{3,39})\b|data:|ftp:|ws:|wss:)/, 
    category: 'dataexfiltration',
    severity: 'high', 
    description: 'Suspicious network request detected (IP address, data: URL)',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Prototype pollution
  { 
    pattern: /(?:Object\.prototype|__proto__|constructor\.prototype)\s*\.\s*(?:[^\s.()[\]]+)\s*=/, 
    category: 'exploit',
    severity: 'high', 
    description: 'Potential prototype pollution detected',
    confidence: 'medium',
    detectionMethod: 'pattern matching'
  },
  
  // Keyloggers
  { 
    pattern: /document\.addEventListener\s*\(\s*['"]keydown|['"]keyup|['"]keypress['"][\s\S]*?(?:fetch|XMLHttpRequest|WebSocket|navigator\.sendBeacon)/, 
    category: 'dataexfiltration',
    severity: 'critical', 
    description: 'Potential keylogger functionality detected',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
  
  // Code obfuscation techniques
  { 
    pattern: /(?:\[\s*['"][^\[\]'"]*['"]\s*\]\s*\[\s*['"][^\[\]'"]*['"]\s*\]|\([0-9]+\)\[['"]\\x[0-9a-f]{2}['"])/, 
    category: 'obfuscated',
    severity: 'high', 
    description: 'Code obfuscation techniques detected',
    confidence: 'high',
    detectionMethod: 'pattern matching'
  },
];

// Known malicious file hashes (SHA-256)
const KNOWN_MALICIOUS_HASHES = [
  // Example hashes - replace with real ones in production
  'd0d501a4e30a9d5cd8ea325df07c2d4a8e2f0ef98def8d76e462a3af7c2e3c28',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  '6b5916245eaa797de5a98aba34ec2bffec63547eecb5bafe0a1cc94f3fac4d31',
  'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646'
];

// Known vulnerable dependencies with versions
const KNOWN_VULNERABLE_DEPENDENCIES = [
  { name: 'colors', version: '1.4.44', cve: 'N/A', description: 'Compromised version with malicious code' },
  { name: 'ua-parser-js', version: '0.7.29', cve: 'CVE-2021-43307', description: 'Cryptocurrency mining code injected' },
  { name: 'coa', version: '2.0.3', cve: 'CVE-2021-43139', description: 'Cryptocurrency mining code injected' },
  { name: 'rc', version: '1.2.9', cve: 'CVE-2021-43120', description: 'Cryptocurrency mining code injected' },
  { name: 'eslint-scope', version: '3.7.2', cve: 'N/A', description: 'Compromised package that steals NPM credentials' },
  { name: 'event-stream', version: '3.3.6', cve: 'CVE-2018-16487', description: 'Cryptocurrency stealing code injected' },
  { name: 'electron', version: '<13.0.0', cve: 'Multiple', description: 'Multiple vulnerabilities in older versions' },
  { name: 'node-fetch', version: '<2.6.7', cve: 'CVE-2022-0235', description: 'ReDoS vulnerability' },
  { name: 'minimist', version: '<1.2.6', cve: 'CVE-2021-44906', description: 'Prototype pollution vulnerability' },
  { name: 'lodash', version: '<4.17.21', cve: 'CVE-2021-23337', description: 'Command injection vulnerability' },
  { name: 'log4js', version: '<6.4.0', cve: 'CVE-2021-44528', description: 'ReDoS vulnerability' },
  { name: 'tar', version: '<6.1.9', cve: 'CVE-2021-37701', description: 'Arbitrary file creation/overwrite' },
  { name: 'glob-parent', version: '<5.1.2', cve: 'CVE-2020-28469', description: 'Regular expression DoS' },
  { name: 'axios', version: '<0.21.3', cve: 'CVE-2021-3749', description: 'SSRF vulnerability' },
  { name: 'path-parse', version: '<1.0.7', cve: 'CVE-2021-23343', description: 'Regular expression DoS' },
  { name: 'ws', version: '<7.4.6', cve: 'CVE-2021-32640', description: 'ReDoS vulnerability' },
  { name: 'ansi-regex', version: '<5.0.1', cve: 'CVE-2021-3807', description: 'Regular expression DoS' },
  { name: 'node-forge', version: '<1.0.0', cve: 'CVE-2020-7720', description: 'Prototype pollution vulnerability' },
  { name: 'async', version: '<2.6.4', cve: 'CVE-2021-43138', description: 'ReDoS vulnerability' },
  { name: 'shelljs', version: '<0.8.5', cve: 'CVE-2022-0144', description: 'Command injection vulnerability' },
  { name: 'ajv', version: '<6.12.3', cve: 'CVE-2020-15366', description: 'Prototype pollution vulnerability' },
  { name: 'node-sass', version: '<7.0.0', cve: 'Multiple', description: 'Multiple vulnerabilities in dependencies' },
  { name: 'moment', version: '<2.29.2', cve: 'CVE-2022-24785', description: 'Regular expression DoS' },
  // Add more vulnerable packages as needed
];

/**
 * Run a maximum security scan on the entire project
 * This is a comprehensive scan that will check for various security issues
 */
export async function runMaximumSecurityScan(): Promise<MaximumScanResult> {
  const scanStartTime = Date.now();
  log('Starting MAXIMUM SECURITY SCAN - this may take some time...', 'security');
  
  // Initialize result 
  const result: MaximumScanResult = {
    id: uuidv4(),
    timestamp: scanStartTime,
    scanDuration: 0,
    vulnerabilities: [],
    securityScore: 100, // Start with perfect score and deduct as issues are found
    completionStatus: 'complete',
    scannedResources: {
      totalPackages: 0,
      totalFiles: 0,
      totalLinesOfCode: 0,
      totalNetworkEndpoints: 0
    },
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0
    }
  };
  
  try {
    // Run all scanners in parallel for maximum efficiency
    log('Running all security scanners in parallel...', 'security');
    
    const [
      packageResults,
      fileResults,
      configResults,
      networkResults
    ] = await Promise.all([
      scanPackageDependencies(),
      scanAllProjectFiles(),
      scanConfigurationFiles(),
      scanNetworkEndpoints()
    ]);
    
    // Combine all vulnerabilities
    result.vulnerabilities = [
      ...packageResults.vulnerabilities,
      ...fileResults.vulnerabilities,
      ...configResults.vulnerabilities,
      ...networkResults.vulnerabilities
    ];
    
    // Update scan resources
    result.scannedResources = {
      totalPackages: packageResults.totalPackages,
      totalFiles: fileResults.totalFiles,
      totalLinesOfCode: fileResults.totalLinesOfCode,
      totalNetworkEndpoints: networkResults.totalEndpoints
    };
    
    // Calculate summary
    result.summary.critical = result.vulnerabilities.filter(v => v.severity === 'critical').length;
    result.summary.high = result.vulnerabilities.filter(v => v.severity === 'high').length;
    result.summary.medium = result.vulnerabilities.filter(v => v.severity === 'medium').length;
    result.summary.low = result.vulnerabilities.filter(v => v.severity === 'low').length;
    result.summary.total = result.vulnerabilities.length;
    
    // Calculate security score
    // Deduct points based on severity: critical=-30, high=-10, medium=-5, low=-1
    const securityScore = Math.max(0, 100 - 
      (result.summary.critical * 30) - 
      (result.summary.high * 10) - 
      (result.summary.medium * 5) - 
      (result.summary.low * 1)
    );
    result.securityScore = securityScore;
    
    // Finish scan
    const scanEndTime = Date.now();
    result.scanDuration = scanEndTime - scanStartTime;
    
    log(`MAXIMUM SECURITY SCAN completed in ${result.scanDuration}ms`, 'security');
    log(`Found ${result.summary.total} potential security issues: ${result.summary.critical} critical, ${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low`, 'security');
    log(`Final security score: ${result.securityScore}/100`, 'security');
    
    // Log found vulnerabilities
    if (result.summary.total > 0) {
      // Log critical and high severity issues with details
      const severeBugs = result.vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');
      for (const bug of severeBugs) {
        log(`[${bug.severity.toUpperCase()}] ${bug.category.toUpperCase()}: ${bug.description}${bug.resource ? ' in ' + bug.resource : ''}`, 'security');
      }
    }
    
    return result;
    
  } catch (error) {
    log(`Error running maximum security scan: ${error}`, 'error');
    result.completionStatus = 'failed';
    result.scanDuration = Date.now() - scanStartTime;
    return result;
  }
}

/**
 * Scan package dependencies for vulnerabilities
 * @returns Scan result
 */
async function scanPackageDependencies(): Promise<{
  vulnerabilities: SecurityVulnerability[];
  totalPackages: number;
}> {
  log('Scanning package dependencies...', 'security');
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // Read package.json to get dependencies
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);
    
    // Combine all dependencies
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };
    
    const packageNames = Object.keys(allDependencies);
    const totalPackages = packageNames.length;
    
    log(`Scanning ${totalPackages} packages for vulnerabilities...`, 'security');
    
    // Check each package
    for (const packageName of packageNames) {
      const version = allDependencies[packageName];
      
      // Check for known vulnerable dependencies
      const knownVulnerability = KNOWN_VULNERABLE_DEPENDENCIES.find(vuln => {
        if (vuln.name === packageName) {
          if (vuln.version.startsWith('<')) {
            // Check if package version is less than the minimum secure version
            const minVersion = vuln.version.substring(1);
            return compareVersions(version, minVersion) < 0;
          } else {
            // Exact version match
            return version === vuln.version;
          }
        }
        return false;
      });
      
      if (knownVulnerability) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'critical',
          category: 'vulnerability',
          description: `Known vulnerable dependency: ${packageName}@${version}`,
          details: knownVulnerability.description,
          resource: `${packageName}@${version}`,
          cve: knownVulnerability.cve,
          recommendation: `Update ${packageName} to a secure version`,
          detectionMethod: 'known vulnerability database',
          confidence: 'high',
          falsePositiveRisk: 'low'
        });
      }
      
      // Check for typosquatting (similar names to popular packages)
      const typosquatResult = checkForTyposquatting(packageName);
      if (typosquatResult.isTyposquatting) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'high',
          category: 'supplychain',
          description: `Potential typosquatting package: ${packageName}`,
          details: `This package name is suspiciously similar to ${typosquatResult.similarTo}`,
          resource: packageName,
          recommendation: `Verify if you intended to use ${packageName} or ${typosquatResult.similarTo}`,
          detectionMethod: 'package name similarity analysis',
          confidence: 'medium',
          falsePositiveRisk: 'medium'
        });
      }
      
      // Attempt to scan the actual package content
      try {
        const packagePath = path.join(process.cwd(), 'node_modules', packageName);
        const packageScanResult = await scanNodePackage(packagePath, packageName, version);
        vulnerabilities.push(...packageScanResult);
      } catch (packageScanError) {
        log(`Error scanning package ${packageName}: ${packageScanError}`, 'security');
      }
    }
    
    return { vulnerabilities, totalPackages };
  } catch (error) {
    log(`Error scanning package dependencies: ${error}`, 'error');
    return { vulnerabilities, totalPackages: 0 };
  }
}

/**
 * Scan a specific node package for vulnerabilities
 * @param packagePath Path to the package
 * @param packageName Name of the package
 * @param version Version of the package
 * @returns Array of found vulnerabilities
 */
async function scanNodePackage(packagePath: string, packageName: string, version: string): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // Check if directory exists
    try {
      await fs.access(packagePath);
    } catch (err) {
      // Package not found, might be a peer dependency
      return vulnerabilities; 
    }
    
    // Get all JavaScript/TypeScript files
    const jsFiles = await getJsFilesRecursively(packagePath);
    
    // Check each file for malicious patterns
    for (const filePath of jsFiles) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        // Check file hash against known malicious hashes
        const fileHash = calculateSha256(fileContent);
        if (KNOWN_MALICIOUS_HASHES.includes(fileHash)) {
          vulnerabilities.push({
            id: uuidv4(),
            severity: 'critical',
            category: 'malware',
            description: `File matches known malicious hash signature`,
            details: `SHA-256: ${fileHash}`,
            resource: filePath.replace(process.cwd(), ''),
            recommendation: `Remove the package ${packageName} immediately`,
            detectionMethod: 'hash signature detection',
            confidence: 'high',
            falsePositiveRisk: 'low'
          });
          continue; // Skip further checks of this file
        }
        
        // Check for malicious patterns
        for (const pattern of MALWARE_PATTERNS) {
          if (pattern.pattern.test(fileContent)) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: pattern.severity as 'low' | 'medium' | 'high' | 'critical',
              category: pattern.category as any,
              description: pattern.description,
              details: `Detected in file: ${filePath.replace(process.cwd(), '')}`,
              resource: `${packageName}@${version}`,
              recommendation: `Review the file and consider removing the package or updating to a safer version`,
              detectionMethod: pattern.detectionMethod,
              confidence: pattern.confidence as 'low' | 'medium' | 'high',
              falsePositiveRisk: 'medium'
            });
          }
        }
        
        // Check for obfuscated code
        if (detectObfuscatedCode(fileContent)) {
          vulnerabilities.push({
            id: uuidv4(),
            severity: 'high',
            category: 'obfuscated',
            description: `Obfuscated code detected in ${packageName}`,
            details: `The file contains obfuscated JavaScript code that may hide malicious functionality`,
            resource: filePath.replace(process.cwd(), ''),
            recommendation: `Review the obfuscated code manually or replace the package with a trusted alternative`,
            detectionMethod: 'obfuscation detection',
            confidence: 'medium',
            falsePositiveRisk: 'medium'
          });
        }
      } catch (fileError) {
        // Skip binary files or files with encoding issues
        continue;
      }
    }
    
    return vulnerabilities;
  } catch (error) {
    log(`Error scanning package ${packageName}: ${error}`, 'error');
    return vulnerabilities;
  }
}

/**
 * Scan all project files for security issues
 * @returns Scan result
 */
async function scanAllProjectFiles(): Promise<{
  vulnerabilities: SecurityVulnerability[];
  totalFiles: number;
  totalLinesOfCode: number;
}> {
  log('Scanning all project files for security issues...', 'security');
  const vulnerabilities: SecurityVulnerability[] = [];
  let totalFiles = 0;
  let totalLinesOfCode = 0;
  
  try {
    // Get all relevant source files
    const sourceFiles = await getAllSourceFiles();
    totalFiles = sourceFiles.length;
    
    // Progress tracking
    let filesProcessed = 0;
    const reportProgress = () => {
      const percentage = Math.floor((filesProcessed / totalFiles) * 100);
      if (filesProcessed % 100 === 0 || filesProcessed === totalFiles) {
        log(`File scan progress: ${percentage}% (${filesProcessed}/${totalFiles} files)`, 'security');
      }
    };
    
    // Scan each file
    for (const filePath of sourceFiles) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        // Count lines of code
        const lineCount = fileContent.split('\n').length;
        totalLinesOfCode += lineCount;
        
        // Check for malicious patterns
        for (const pattern of MALWARE_PATTERNS) {
          if (pattern.pattern.test(fileContent)) {
            vulnerabilities.push({
              id: uuidv4(),
              severity: pattern.severity as 'low' | 'medium' | 'high' | 'critical',
              category: pattern.category as any,
              description: pattern.description,
              details: `Detected in project file: ${filePath.replace(process.cwd(), '')}`,
              resource: filePath.replace(process.cwd(), ''),
              recommendation: `Review the code at this location and fix the issue`,
              detectionMethod: pattern.detectionMethod,
              confidence: pattern.confidence as 'low' | 'medium' | 'high',
              falsePositiveRisk: 'medium'
            });
          }
        }
        
        // Check for secrets and API keys in source code
        const secretsResult = detectSecretsInCode(fileContent, filePath.replace(process.cwd(), ''));
        vulnerabilities.push(...secretsResult);
        
        // Update progress
        filesProcessed++;
        reportProgress();
      } catch (fileError) {
        // Skip binary files or files with encoding issues
        filesProcessed++;
        reportProgress();
        continue;
      }
    }
    
    return { vulnerabilities, totalFiles, totalLinesOfCode };
  } catch (error) {
    log(`Error scanning project files: ${error}`, 'error');
    return { vulnerabilities, totalFiles, totalLinesOfCode };
  }
}

/**
 * Scan configuration files for security misconfigurations
 * @returns Scan result
 */
async function scanConfigurationFiles(): Promise<{
  vulnerabilities: SecurityVulnerability[];
}> {
  log('Scanning configuration files for security misconfigurations...', 'security');
  const vulnerabilities: SecurityVulnerability[] = [];
  
  try {
    // List of configuration files to check
    const configFiles = [
      { path: 'package.json', parser: 'json' },
      { path: '.env', parser: 'env' },
      { path: '.env.local', parser: 'env' },
      { path: '.env.development', parser: 'env' },
      { path: '.env.production', parser: 'env' },
      { path: 'config/default.json', parser: 'json' },
      { path: 'config/production.json', parser: 'json' },
      { path: 'config/development.json', parser: 'json' },
      { path: 'nginx.conf', parser: 'text' },
      { path: '.npmrc', parser: 'text' },
      { path: '.yarnrc', parser: 'text' },
      { path: 'docker-compose.yml', parser: 'yaml' },
      { path: 'Dockerfile', parser: 'text' },
      { path: '.github/workflows', parser: 'yaml', isDirectory: true },
    ];
    
    // Check each config file
    for (const configFile of configFiles) {
      try {
        const filePath = path.join(process.cwd(), configFile.path);
        
        // Check if it's a directory
        if (configFile.isDirectory) {
          try {
            const dirStat = await fs.stat(filePath);
            if (dirStat.isDirectory()) {
              const dirFiles = await fs.readdir(filePath);
              for (const innerFile of dirFiles) {
                const innerFilePath = path.join(filePath, innerFile);
                await checkConfigFile(innerFilePath, configFile.parser, vulnerabilities);
              }
            }
          } catch (dirErr) {
            // Directory doesn't exist, skip
            continue;
          }
        } else {
          // It's a single file
          await checkConfigFile(filePath, configFile.parser, vulnerabilities);
        }
      } catch (fileError) {
        // File doesn't exist or can't be read, skip
        continue;
      }
    }
    
    return { vulnerabilities };
  } catch (error) {
    log(`Error scanning configuration files: ${error}`, 'error');
    return { vulnerabilities };
  }
}

/**
 * Check a configuration file for misconfigurations and secrets
 * @param filePath Path to the configuration file
 * @param parser Type of parser to use
 * @param vulnerabilities Array to append vulnerabilities to
 */
async function checkConfigFile(
  filePath: string, 
  parser: string, 
  vulnerabilities: SecurityVulnerability[]
): Promise<void> {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      return; // File doesn't exist
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check for secrets regardless of file type
    const secretsResult = detectSecretsInCode(content, filePath.replace(process.cwd(), ''));
    vulnerabilities.push(...secretsResult);
    
    // Specific checks based on file type
    if (parser === 'json') {
      try {
        const jsonData = JSON.parse(content);
        
        // Check for insecure dependency versions in package.json
        if (filePath.endsWith('package.json')) {
          checkPackageJsonSecurity(jsonData, filePath, vulnerabilities);
        }
        
        // Check for security misconfigurations in config files
        else if (filePath.includes('config/')) {
          checkJsonConfigSecurity(jsonData, filePath, vulnerabilities);
        }
      } catch (jsonError) {
        // Invalid JSON, skip parsing checks
      }
    }
    else if (parser === 'env') {
      checkEnvFileSecurity(content, filePath, vulnerabilities);
    }
    else if (parser === 'yaml' && (filePath.endsWith('.yml') || filePath.endsWith('.yaml'))) {
      // Check GitHub workflow files for security issues
      if (filePath.includes('.github/workflows')) {
        checkGitHubWorkflowSecurity(content, filePath, vulnerabilities);
      }
      // Check Docker Compose files
      else if (filePath.includes('docker-compose')) {
        checkDockerComposeSecurity(content, filePath, vulnerabilities);
      }
    }
    // Dockerfile check
    else if (filePath.endsWith('Dockerfile')) {
      checkDockerfileSecurity(content, filePath, vulnerabilities);
    }
    
  } catch (error) {
    log(`Error checking config file ${filePath}: ${error}`, 'security');
  }
}

/**
 * Check package.json for security issues
 * @param jsonData Parsed package.json data
 * @param filePath Path to package.json
 * @param vulnerabilities Array to append vulnerabilities to
 */
function checkPackageJsonSecurity(
  jsonData: any, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[]
): void {
  // Check script injection in pre/post hooks
  if (jsonData.scripts) {
    for (const [scriptName, scriptContent] of Object.entries(jsonData.scripts)) {
      if (typeof scriptContent === 'string') {
        // Check for potentially dangerous commands
        if (/curl\s+|wget\s+|eval\s+|base64|rm\s+-rf|>|\||\&\&/.test(scriptContent)) {
          vulnerabilities.push({
            id: uuidv4(),
            severity: 'high',
            category: 'misconfiguration',
            description: `Potentially dangerous script in package.json`,
            details: `The script '${scriptName}' contains potentially dangerous commands: ${scriptContent}`,
            resource: filePath.replace(process.cwd(), ''),
            recommendation: `Review the script content and ensure it doesn't execute unintended commands`,
            detectionMethod: 'pattern matching',
            confidence: 'medium',
            falsePositiveRisk: 'medium'
          });
        }
      }
    }
  }
  
  // Check for potentially malicious or deprecated package manager
  if (jsonData.packageManager) {
    const packageManager = jsonData.packageManager.toLowerCase();
    if (packageManager.includes('yarn:1.')) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'medium',
        category: 'misconfiguration',
        description: `Using older version of Yarn (v1)`,
        details: `Yarn v1 has security limitations compared to newer versions`,
        resource: filePath.replace(process.cwd(), ''),
        recommendation: `Consider upgrading to Yarn v2+ or npm 7+`,
        detectionMethod: 'configuration analysis',
        confidence: 'high',
        falsePositiveRisk: 'low'
      });
    }
  }
}

/**
 * Check JSON config files for security issues
 * @param jsonData Parsed JSON config data
 * @param filePath Path to config file
 * @param vulnerabilities Array to append vulnerabilities to
 */
function checkJsonConfigSecurity(
  jsonData: any, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[]
): void {
  // Check for insecure defaults
  if (jsonData.security) {
    // Check for disabled security features
    if (jsonData.security.enableScans === false) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'high',
        category: 'misconfiguration',
        description: `Security scans are disabled in configuration`,
        details: `Security scanning has been disabled in ${filePath.replace(process.cwd(), '')}`,
        resource: filePath.replace(process.cwd(), ''),
        recommendation: `Enable security scanning in production environments`,
        detectionMethod: 'configuration analysis',
        confidence: 'high',
        falsePositiveRisk: 'low'
      });
    }
    
    if (jsonData.security.csrfProtection === false) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'critical',
        category: 'misconfiguration',
        description: `CSRF protection is disabled in configuration`,
        details: `CSRF protection has been disabled in ${filePath.replace(process.cwd(), '')}`,
        resource: filePath.replace(process.cwd(), ''),
        recommendation: `Enable CSRF protection in all environments`,
        detectionMethod: 'configuration analysis',
        confidence: 'high',
        falsePositiveRisk: 'low'
      });
    }
  }
  
  // Check for hardcoded credentials
  recursivelyCheckForCredentials(jsonData, filePath, vulnerabilities, []);
}

/**
 * Recursively check for credentials in JSON objects
 * @param obj Object to check
 * @param filePath Path to the file
 * @param vulnerabilities Array to append vulnerabilities to
 * @param path Current path in the object
 */
function recursivelyCheckForCredentials(
  obj: any, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[],
  path: string[]
): void {
  if (!obj || typeof obj !== 'object') return;
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key];
    
    // Check if key suggests credentials
    const sensitiveKeyPattern = /password|secret|key|token|auth|credential|api[_-]?key/i;
    
    if (typeof value === 'string' && sensitiveKeyPattern.test(key) && value.length > 8) {
      vulnerabilities.push({
        id: uuidv4(),
        severity: 'critical',
        category: 'misconfiguration',
        description: `Hardcoded credential detected in configuration file`,
        details: `The field '${currentPath.join('.')}' appears to contain a hardcoded credential`,
        resource: filePath.replace(process.cwd(), ''),
        recommendation: `Remove hardcoded credentials from configuration files and use environment variables or a secure vault instead`,
        detectionMethod: 'configuration analysis',
        confidence: 'high',
        falsePositiveRisk: 'low'
      });
    }
    
    // Recurse if object or array
    if (value && typeof value === 'object') {
      recursivelyCheckForCredentials(value, filePath, vulnerabilities, currentPath);
    }
  }
}

/**
 * Check environment files for security issues
 * @param content File content
 * @param filePath Path to file
 * @param vulnerabilities Array to append vulnerabilities to
 */
function checkEnvFileSecurity(
  content: string, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[]
): void {
  const lines = content.split('\n');
  
  // Check for sensitive information in .env files
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) continue;
    
    // Check if line contains key=value format
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      
      // Skip if key or value is undefined
      if (!key || !value) continue;
      
      // Check if key suggests credentials and has a non-placeholder value
      const sensitiveKeyPattern = /password|secret|key|token|auth|credential|api[_-]?key/i;
      
      if (sensitiveKeyPattern.test(key) && 
          value.length > 8 && 
          !value.includes('${') && // Skip template vars
          !value.includes('${{') && // Skip template vars
          !/(your|change|placeholder|example)/i.test(value)) { // Skip placeholder values
        
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'critical',
          category: 'misconfiguration',
          description: `Hardcoded credential detected in environment file`,
          details: `The variable '${key}' appears to contain a hardcoded credential`,
          resource: filePath.replace(process.cwd(), ''),
          recommendation: `Remove hardcoded credentials from version control. Store them in a secure vault or inject at deployment time.`,
          detectionMethod: 'configuration analysis',
          confidence: 'high',
          falsePositiveRisk: 'low'
        });
      }
    }
  }
  
  // Check for tracked env files that shouldn't be in version control
  if (filePath.endsWith('.env') || 
      filePath.endsWith('.env.local') || 
      filePath.endsWith('.env.production')) {
    
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `Environment file may be tracked in version control`,
      details: `The file ${filePath.replace(process.cwd(), '')} contains environment variables and may be committed to version control`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Add this file to .gitignore and create a template file (e.g., .env.example) without sensitive values`,
      detectionMethod: 'configuration analysis',
      confidence: 'medium',
      falsePositiveRisk: 'medium'
    });
  }
}

/**
 * Check GitHub workflow files for security issues
 * @param content File content
 * @param filePath Path to file
 * @param vulnerabilities Array to append vulnerabilities to
 */
function checkGitHubWorkflowSecurity(
  content: string, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[]
): void {
  // Check for GitHub token with write permissions
  if (content.includes('permissions:') && 
      content.includes('write-all') || 
      /contents:\s+write/i.test(content)) {
    
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `GitHub workflow has excessive permissions`,
      details: `The workflow file grants write permissions, which could be exploited if the workflow is compromised`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Limit GitHub token permissions to the minimum required for the workflow`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
  
  // Check for unsafe usage of third-party actions
  if (/uses:\s+[^@]+@master|uses:\s+[^@]+@main/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `GitHub workflow uses actions with floating references`,
      details: `The workflow is using third-party actions with floating references (master/main), which can lead to supply chain attacks`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Pin all third-party actions to specific commit hashes`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
  
  // Check for script injection in workflow runs
  if (/run:\s*(curl|wget|eval|base64)/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `GitHub workflow contains potentially unsafe script execution`,
      details: `The workflow executes scripts that could be vulnerable to injection attacks`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Avoid executing scripts directly in workflows, especially ones that download and execute code`,
      detectionMethod: 'configuration analysis',
      confidence: 'medium',
      falsePositiveRisk: 'medium'
    });
  }
}

/**
 * Check Docker Compose files for security issues
 * @param content File content
 * @param filePath Path to file
 * @param vulnerabilities Array to append vulnerabilities to
 */
function checkDockerComposeSecurity(
  content: string, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[]
): void {
  // Check for privileged containers
  if (/privileged:\s*true/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'critical',
      category: 'misconfiguration',
      description: `Docker Compose file contains privileged containers`,
      details: `Running containers with privileged flag gives them extended privileges on the host system`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Remove the privileged flag or limit container capabilities to only what's needed`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
  
  // Check for root user
  if (!(/user:\s*[^\s]+/i.test(content))) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `Docker Compose file may use root user in containers`,
      details: `No user directive found, which means containers may run as root by default`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Add user directive with a non-root user ID to all services`,
      detectionMethod: 'configuration analysis',
      confidence: 'medium',
      falsePositiveRisk: 'medium'
    });
  }
  
  // Check for mounting sensitive directories
  if (/volumes:\s*[\s\S]*?-\s*\/(?:etc|var\/run\/docker\.sock|root|home)/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `Docker Compose mounts sensitive host directories`,
      details: `The compose file mounts sensitive host directories which could lead to privilege escalation`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Avoid mounting sensitive host directories. If necessary, use read-only mounts.`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
}

/**
 * Check Dockerfile for security issues
 * @param content File content
 * @param filePath Path to file
 * @param vulnerabilities Array to append vulnerabilities to
 */
function checkDockerfileSecurity(
  content: string, 
  filePath: string, 
  vulnerabilities: SecurityVulnerability[]
): void {
  // Check for running as root
  if (!(/USER\s+\d+/i.test(content))) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `Dockerfile may run container as root`,
      details: `No USER directive with numeric user ID found, which means containers may run as root by default`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Add USER directive with a non-root user ID (e.g., USER 1000)`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
  
  // Check for potential secrets in ENV or ARG
  if (/(?:ENV|ARG)\s+(?:.*PASSWORD|.*SECRET|.*KEY|.*TOKEN)=/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `Dockerfile contains potential secrets in ENV or ARG`,
      details: `Environment variables or build arguments appear to contain secrets`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Remove secrets from Dockerfile. Use build-time secrets or environment variables at runtime.`,
      detectionMethod: 'configuration analysis',
      confidence: 'medium',
      falsePositiveRisk: 'medium'
    });
  }
  
  // Check for curl/wget piped to sh
  if (/RUN\s+(?:curl|wget)[\s\S]*?\|\s*(?:bash|sh)/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'high',
      category: 'misconfiguration',
      description: `Dockerfile executes scripts directly from internet`,
      details: `The Dockerfile downloads and executes scripts directly, which is a security risk`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Download scripts first, verify their integrity, and then execute them`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
  
  // Check for using latest tag
  if (/FROM\s+[^:]+:latest/i.test(content) || /FROM\s+[^:\s]+$/i.test(content)) {
    vulnerabilities.push({
      id: uuidv4(),
      severity: 'medium',
      category: 'misconfiguration',
      description: `Dockerfile uses latest tag for base images`,
      details: `Using the 'latest' tag or no tag (which defaults to latest) can lead to unexpected changes`,
      resource: filePath.replace(process.cwd(), ''),
      recommendation: `Pin base images to specific versions using digest hashes (sha256)`,
      detectionMethod: 'configuration analysis',
      confidence: 'high',
      falsePositiveRisk: 'low'
    });
  }
}

/**
 * Scan network endpoints for security issues
 * @returns Scan result
 */
async function scanNetworkEndpoints(): Promise<{
  vulnerabilities: SecurityVulnerability[];
  totalEndpoints: number;
}> {
  log('Scanning network endpoints and API routes...', 'security');
  const vulnerabilities: SecurityVulnerability[] = [];
  let totalEndpoints = 0;
  
  try {
    // Look for route definitions in server code
    const routeFiles = await findAllRouteFiles();
    const endpointInfo = await extractAPIEndpoints(routeFiles);
    totalEndpoints = endpointInfo.length;
    
    log(`Found ${totalEndpoints} API endpoints to analyze`, 'security');
    
    // Analyze each endpoint
    for (const endpoint of endpointInfo) {
      // Check for missing input validation
      if (!endpoint.hasInputValidation) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'high',
          category: 'vulnerability',
          description: `Potential lack of input validation on API endpoint`,
          details: `The endpoint ${endpoint.method} ${endpoint.path} does not appear to validate input`,
          resource: endpoint.source,
          recommendation: `Add input validation using a validation library like express-validator, zod, or joi`,
          detectionMethod: 'static code analysis',
          confidence: 'medium',
          falsePositiveRisk: 'medium'
        });
      }
      
      // Check for unauthenticated sensitive operations
      if (isSensitiveOperation(endpoint.path, endpoint.method) && !endpoint.hasAuthCheck) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'critical',
          category: 'vulnerability',
          description: `Sensitive operation lacks authentication check`,
          details: `The endpoint ${endpoint.method} ${endpoint.path} performs a sensitive operation without authentication`,
          resource: endpoint.source,
          recommendation: `Add authentication middleware to protect sensitive operations`,
          detectionMethod: 'static code analysis',
          confidence: 'medium',
          falsePositiveRisk: 'medium'
        });
      }
      
      // Check for lack of rate limiting on auth endpoints
      if (isAuthEndpoint(endpoint.path) && !endpoint.hasRateLimiting) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'high',
          category: 'vulnerability',
          description: `Authentication endpoint lacks rate limiting`,
          details: `The endpoint ${endpoint.method} ${endpoint.path} is an authentication endpoint without rate limiting`,
          resource: endpoint.source,
          recommendation: `Add rate limiting middleware to prevent brute force attacks`,
          detectionMethod: 'static code analysis',
          confidence: 'high',
          falsePositiveRisk: 'low'
        });
      }
      
      // Check for SQL injection vulnerabilities
      if (endpoint.hasRawSqlQuery && !endpoint.hasQueryParameterization) {
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'critical',
          category: 'vulnerability',
          description: `Potential SQL injection vulnerability`,
          details: `The endpoint ${endpoint.method} ${endpoint.path} uses raw SQL queries without proper parameterization`,
          resource: endpoint.source,
          recommendation: `Use parameterized queries or an ORM with proper escaping`,
          detectionMethod: 'static code analysis',
          confidence: 'high',
          falsePositiveRisk: 'low'
        });
      }
    }
    
    return { vulnerabilities, totalEndpoints };
  } catch (error) {
    log(`Error scanning network endpoints: ${error}`, 'error');
    return { vulnerabilities, totalEndpoints };
  }
}

/**
 * Find all route files in the project
 * @returns Array of file paths
 */
async function findAllRouteFiles(): Promise<string[]> {
  const routeKeywords = [
    'routes', 'controllers', 'api', 'endpoints', 'handler', 'router'
  ];
  
  const allFiles = await getAllSourceFiles();
  return allFiles.filter(file => 
    routeKeywords.some(keyword => file.toLowerCase().includes(keyword)) ||
    file.endsWith('.route.js') || 
    file.endsWith('.route.ts') || 
    file.endsWith('.controller.js') || 
    file.endsWith('.controller.ts') ||
    file.endsWith('.api.js') ||
    file.endsWith('.api.ts')
  );
}

/**
 * Extract API endpoint information from route files
 * @param files Array of file paths
 * @returns Array of endpoint information
 */
async function extractAPIEndpoints(files: string[]): Promise<{
  method: string;
  path: string;
  source: string;
  hasInputValidation: boolean;
  hasAuthCheck: boolean;
  hasRateLimiting: boolean;
  hasRawSqlQuery: boolean;
  hasQueryParameterization: boolean;
}[]> {
  const endpoints: {
    method: string;
    path: string;
    source: string;
    hasInputValidation: boolean;
    hasAuthCheck: boolean;
    hasRateLimiting: boolean;
    hasRawSqlQuery: boolean;
    hasQueryParameterization: boolean;
  }[] = [];
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Look for Express-style routes
      // app.get('/path', ...
      const expressRoutes = content.match(/(?:app|router)\.(?:get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g) || [];
      
      for (const route of expressRoutes) {
        const methodMatch = route.match(/\.(\w+)\s*\(/);
        const pathMatch = route.match(/['"]([^'"]+)['"]/);
        
        if (methodMatch && pathMatch) {
          const method = methodMatch[1].toUpperCase();
          const path = pathMatch[1];
          
          // Look for patterns in the route handler
          const routeHandler = extractRouteHandler(content, method.toLowerCase(), path);
          
          endpoints.push({
            method,
            path,
            source: file,
            hasInputValidation: hasInputValidation(routeHandler),
            hasAuthCheck: hasAuthCheck(routeHandler, content),
            hasRateLimiting: hasRateLimiting(routeHandler, content),
            hasRawSqlQuery: hasRawSqlQuery(routeHandler),
            hasQueryParameterization: hasQueryParameterization(routeHandler)
          });
        }
      }
      
      // Look for Next.js API routes
      if (file.includes('/pages/api/') || file.includes('/app/api/')) {
        const apiPath = file
          .replace(/.*\/pages\/api\//, '/api/')
          .replace(/.*\/app\/api\//, '/api/')
          .replace(/\.[jt]sx?$/, '');
          
        // Check if it's a catch-all route
        const isCatchAll = file.includes('[...') || file.includes('[[...');
        const finalPath = isCatchAll ? `${apiPath}/*` : apiPath;
        
        // Next.js API handlers usually export a default function
        const hasDefaultExport = /export\s+default\s+(?:async\s+)?function/i.test(content);
        
        if (hasDefaultExport) {
          endpoints.push({
            method: 'ANY', // Next.js handlers can respond to any method unless filtered
            path: finalPath,
            source: file,
            hasInputValidation: /(?:body|query|params).*validate/i.test(content) || 
                               /(?:zod|yup|joi|validator)/i.test(content),
            hasAuthCheck: /getSession|authorize|isAuthenticated|verifyToken/i.test(content),
            hasRateLimiting: /rateLimit|throttle|cooldown/i.test(content),
            hasRawSqlQuery: /(?:executeQuery|query)\s*\(\s*[\`'"]/i.test(content),
            hasQueryParameterization: /\?\s*,\s*\[|executeQuery\s*\([^,]+,\s*\[/i.test(content)
          });
        }
      }
    } catch (error) {
      // Skip files with errors
      continue;
    }
  }
  
  return endpoints;
}

/**
 * Extract the route handler code from a file
 * @param content File content
 * @param method HTTP method
 * @param path API path
 * @returns Extracted route handler code
 */
function extractRouteHandler(content: string, method: string, path: string): string {
  // Try to extract the route handler function
  const routePattern = new RegExp(`(?:app|router)\\.${method}\\s*\\(\\s*['"]${escapeRegExp(path)}['"]\\s*,\\s*([\\s\\S]+?)\\);`, 'i');
  const routeMatch = content.match(routePattern);
  
  if (routeMatch && routeMatch[1]) {
    // If it's a reference to a function
    if (routeMatch[1].trim().match(/^[a-zA-Z0-9_]+$/)) {
      const funcName = routeMatch[1].trim();
      const funcPattern = new RegExp(`(?:function\\s+${funcName}|const\\s+${funcName}\\s*=\\s*(?:async\\s*)?(?:function)?\\s*\\()([\\s\\S]+?)(?:}\\s*;|})`, 'i');
      const funcMatch = content.match(funcPattern);
      
      if (funcMatch && funcMatch[1]) {
        return funcMatch[1];
      }
    }
    
    // If it's an inline function
    return routeMatch[1];
  }
  
  return '';
}

/**
 * Check if a route handler has input validation
 * @param handlerCode Route handler code
 * @returns True if input validation is detected, false otherwise
 */
function hasInputValidation(handlerCode: string): boolean {
  return /validate|sanitize|check\s*\(|body\s*\([^)]*\)\.isString|req\.body\.[a-zA-Z0-9]+\s*instanceof|typeof\s+req\.body|schema\.parse|Joi\.validate/i.test(handlerCode);
}

/**
 * Check if a route handler has authentication checks
 * @param handlerCode Route handler code
 * @param fullContent Full file content
 * @returns True if authentication check is detected, false otherwise
 */
function hasAuthCheck(handlerCode: string, fullContent: string): boolean {
  // Check for auth middleware
  if (/authenticate|isAuthenticated|requireAuth|isLoggedIn|checkAuth|auth\.protect|verifyToken|verifyJwt/i.test(fullContent)) {
    return true;
  }
  
  // Check for auth checks in the handler
  return /req\.isAuthenticated\(\)|req\.user|req\.session\.user|getSession|req\.headers\.authorization|req\.auth|verifyToken|jwt\.verify|auth\.check/i.test(handlerCode);
}

/**
 * Check if a route handler has rate limiting
 * @param handlerCode Route handler code
 * @param fullContent Full file content
 * @returns True if rate limiting is detected, false otherwise
 */
function hasRateLimiting(handlerCode: string, fullContent: string): boolean {
  return /rateLimit|throttle|rateLimiter\.check|limiter|cooldown|bruteforce/i.test(fullContent);
}

/**
 * Check if a route handler has raw SQL queries
 * @param handlerCode Route handler code
 * @returns True if raw SQL queries are detected, false otherwise
 */
function hasRawSqlQuery(handlerCode: string): boolean {
  return /(?:db|pool|connection|client)\.query\s*\(\s*[`'"]/i.test(handlerCode) || 
         /execute(?:Query|Sql)\s*\(\s*[`'"]/i.test(handlerCode) ||
         /SELECT|INSERT|UPDATE|DELETE|FROM|JOIN\s+/i.test(handlerCode);
}

/**
 * Check if a route handler uses parameterized queries
 * @param handlerCode Route handler code
 * @returns True if parameterized queries are detected, false otherwise
 */
function hasQueryParameterization(handlerCode: string): boolean {
  return /\?\s*,\s*\[|executeQuery\s*\([^,]+,\s*\[|\$\d+/i.test(handlerCode) || 
         /prepared\s*statement|parameterized/i.test(handlerCode);
}

/**
 * Check if a path and method combination is a sensitive operation
 * @param path API path
 * @param method HTTP method
 * @returns True if sensitive operation, false otherwise
 */
function isSensitiveOperation(path: string, method: string): boolean {
  // Check path for sensitive keywords
  const sensitivePaths = [
    'admin', 'config', 'setting', 'user', 'account', 'profile', 'password',
    'reset', 'delete', 'remove', 'payment', 'billing', 'invoice', 'card',
    'key', 'secret', 'token', 'auth', 'permission', 'role', 'privilege',
    'system', 'database', 'backup', 'restore', 'log', 'dashboard', 'private'
  ];
  
  // Check if path contains sensitive keywords
  const hasSensitivePath = sensitivePaths.some(keyword => 
    path.toLowerCase().includes(keyword)
  );
  
  // Check if it's a write operation
  const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  
  return hasSensitivePath || isWriteOperation;
}

/**
 * Check if a path is an authentication endpoint
 * @param path API path
 * @returns True if auth endpoint, false otherwise
 */
function isAuthEndpoint(path: string): boolean {
  const authPaths = [
    'login', 'signin', 'auth', 'authenticate', 'logout', 'signout', 
    'register', 'signup', 'reset', 'password', 'verify', 'token'
  ];
  
  return authPaths.some(keyword => 
    path.toLowerCase().includes(keyword)
  );
}

/**
 * Detect secrets and API keys in code
 * @param content Code content
 * @param source Source file path
 * @returns Array of found vulnerabilities
 */
function detectSecretsInCode(content: string, source: string): SecurityVulnerability[] {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // Array of secret patterns to check
  const secretPatterns = [
    // Generic API keys
    { 
      pattern: /(?:api[_-]?key|api[_-]?secret|app[_-]?key|app[_-]?secret|auth[_-]?key)[\s]*[=:][\s]*['"`]([a-zA-Z0-9_\-]{16,})['"`]/gi,
      name: 'API Key'
    },
    // Generic tokens
    { 
      pattern: /(?:token|secret|password)[\s]*[=:][\s]*['"`]([a-zA-Z0-9_\-/.+=]{8,})['"`]/gi,
      name: 'Secret Token' 
    },
    // AWS access key
    { 
      pattern: /(?:AKIA|aws[_-]?access[_-]?key[_-]?id)[\s]*[=:][\s]*['"`]([A-Z0-9]{20})['"`]/gi,
      name: 'AWS Access Key' 
    },
    // AWS secret key
    { 
      pattern: /aws[_-]?secret[_-]?access[_-]?key[\s]*[=:][\s]*['"`]([a-zA-Z0-9/+=]{40})['"`]/gi,
      name: 'AWS Secret Key' 
    },
    // GitHub token
    { 
      pattern: /(?:github|gh)[_-]?(?:token|key|secret)[\s]*[=:][\s]*['"`]([a-zA-Z0-9_\-]{35,45})['"`]/gi,
      name: 'GitHub Token' 
    },
    // Google API key
    { 
      pattern: /AIza[a-zA-Z0-9_\-]{35}/g,
      name: 'Google API Key'
    },
    // Stripe API key
    { 
      pattern: /(?:sk|pk)_(?:test|live)_[a-zA-Z0-9]{24,}/g,
      name: 'Stripe API Key'
    },
    // JWT token
    { 
      pattern: /eyJ[a-zA-Z0-9_\-\.]+/g,
      name: 'JWT Token'
    },
    // Generic URL with credentials
    { 
      pattern: /(?:https?|ftp|sftp):\/\/[^:]+:[^@]+@[a-zA-Z0-9\-\.]+/g,
      name: 'URL with Embedded Credentials'
    },
    // Database connection strings
    { 
      pattern: /(?:mongodb|postgresql|mysql|jdbc|redis):\/\/(?:[^:]+:[^@]+@)?[a-zA-Z0-9\-\.]+/g,
      name: 'Database Connection String'
    },
    // Private keys
    { 
      pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----[a-zA-Z0-9\s\+\/\=]+-----END (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
      name: 'Private Key'
    }
  ];
  
  // Check each pattern
  for (const { pattern, name } of secretPatterns) {
    const matches = content.match(pattern);
    
    if (matches) {
      for (const match of matches) {
        // Skip if in a comment or test file
        if (isInComment(content, match) || source.includes('test') || source.includes('spec')) {
          continue;
        }
        
        vulnerabilities.push({
          id: uuidv4(),
          severity: 'critical',
          category: 'misconfiguration',
          description: `Hardcoded ${name} detected in source code`,
          details: `A sensitive value that appears to be a ${name} was found in the code`,
          resource: source,
          recommendation: `Remove hardcoded secrets from the source code and use environment variables or a secure vault`,
          detectionMethod: 'pattern matching',
          confidence: 'high',
          falsePositiveRisk: 'medium'
        });
      }
    }
  }
  
  return vulnerabilities;
}

/**
 * Check if a string is in a comment in source code
 * @param content Full source code content
 * @param match The matched string to check
 * @returns True if in a comment, false otherwise
 */
function isInComment(content: string, match: string): boolean {
  const matchIndex = content.indexOf(match);
  if (matchIndex === -1) return false;
  
  // Find the line start
  const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
  const lineEnd = content.indexOf('\n', matchIndex);
  const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
  
  // Check if in a single-line comment
  if (line.trimStart().startsWith('//')) {
    return true;
  }
  
  // Check if in a multi-line comment
  const beforeMatch = content.substring(0, matchIndex);
  const lastCommentStart = beforeMatch.lastIndexOf('/*');
  const lastCommentEnd = beforeMatch.lastIndexOf('*/');
  
  return lastCommentStart !== -1 && (lastCommentEnd === -1 || lastCommentStart > lastCommentEnd);
}

/**
 * Check if a package name is potentially a typosquatting attempt
 * @param packageName Package name to check
 * @returns Result with isTyposquatting flag and the similar package
 */
function checkForTyposquatting(packageName: string): { isTyposquatting: boolean; similarTo?: string } {
  // List of popular packages that are often typosquatted
  const popularPackages = [
    'react', 'lodash', 'express', 'chalk', 'axios', 'moment', 'jquery', 'webpack',
    'babel', 'typescript', 'eslint', 'prettier', 'dotenv', 'request', 'commander',
    'react-dom', 'vue', 'angular', 'next', 'remix', 'gatsby', 'svelte', 'nuxt',
    'graphql', 'apollo', 'prisma', 'sequelize', 'mongoose', 'typeorm', 'passport',
    'socket.io', 'firebase', 'stripe', 'aws-sdk', 'googleapis', 'twilio', 'crypto-js'
  ];
  
  // Skip exact matches
  if (popularPackages.includes(packageName)) {
    return { isTyposquatting: false };
  }
  
  // Simple distance function to check string similarity
  function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix: number[][] = [];
    
    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            matrix[i][j - 1] + 1,     // Insertion
            matrix[i - 1][j] + 1      // Deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  // Check for similarity to popular packages
  for (const popularPackage of popularPackages) {
    // Determine threshold based on package name length
    const threshold = Math.max(2, Math.min(3, Math.floor(popularPackage.length * 0.25)));
    
    // If similar but not identical, it could be typosquatting
    const distance = levenshteinDistance(packageName, popularPackage);
    if (distance > 0 && distance <= threshold) {
      return { isTyposquatting: true, similarTo: popularPackage };
    }
  }
  
  return { isTyposquatting: false };
}

/**
 * Detect if code is obfuscated
 * @param code Code to check
 * @returns True if obfuscated, false otherwise
 */
function detectObfuscatedCode(code: string): boolean {
  // Signs of obfuscation
  const obfuscationSigns = [
    // Excessive use of eval
    /eval\s*\(/g,
    
    // String concatenation to hide function calls
    /['"`]\s*\+\s*['"`]/g,
    
    // Hex or unicode encoding
    /\\x[0-9a-f]{2}|\\u[0-9a-f]{4}/gi,
    
    // Long base64 strings
    /['"`](?:[A-Za-z0-9+/]{4}){20,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?['"`]/g,
    
    // Suspicious array access with string indexing
    /\[[0-9]+\]\[[0-9]+\]|\[\s*['"`][^'"]+['"`]\s*\]\[\s*['"`][^'"]+['"`]\s*\]/g,
    
    // Dynamic function creation
    /new\s+Function\s*\(/g,
    
    // String reversal or manipulation tricks
    /split\s*\(\s*['"]\s*['"]\s*\)\.reverse\(\)\.join/g,
    
    // Excessive character code manipulation
    /String\.fromCharCode\s*\(/g
  ];
  
  // Count matches for each sign
  let obfuscationScore = 0;
  
  for (const pattern of obfuscationSigns) {
    const matches = code.match(pattern);
    if (matches) {
      obfuscationScore += matches.length;
    }
  }
  
  // Additional checks
  
  // Check for variable names that are likely obfuscated (single letters or random strings)
  const varDeclarations = code.match(/(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=/g) || [];
  
  let singleCharVars = 0;
  for (const declaration of varDeclarations) {
    const varName = declaration.replace(/(?:var|let|const)\s+/, '').replace(/\s*=/, '');
    if (varName.length === 1 && varName !== 'i' && varName !== 'j' && varName !== 'k') {
      singleCharVars++;
    }
  }
  
  obfuscationScore += Math.min(10, singleCharVars);
  
  // Calculate code entropy (randomness)
  const entropy = calculateEntropy(code);
  if (entropy > 5.0) {
    obfuscationScore += 5;
  }
  
  // Code is likely obfuscated if the score is high enough
  return obfuscationScore >= 10;
}

/**
 * Calculate entropy (randomness) of a string
 * @param str String to analyze
 * @returns Entropy value
 */
function calculateEntropy(str: string): number {
  const charCount: Record<string, number> = {};
  
  // Count each character
  for (const char of str) {
    charCount[char] = (charCount[char] || 0) + 1;
  }
  
  // Calculate entropy
  let entropy = 0;
  const len = str.length;
  
  for (const char in charCount) {
    const probability = charCount[char] / len;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}

/**
 * Calculate SHA-256 hash of a string
 * @param content String to hash
 * @returns SHA-256 hash as hex string
 */
function calculateSha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compare two version strings
 * Returns:
 * - negative if v1 < v2
 * - 0 if v1 === v2
 * - positive if v1 > v2
 * @param v1 First version
 * @param v2 Second version
 * @returns Comparison result
 */
function compareVersions(v1: string, v2: string): number {
  const parseVersion = (v: string) => {
    // Remove leading chars like ^, ~, >=, etc.
    const cleanV = v.replace(/^[^0-9]*/, '');
    
    // Split into components
    return cleanV.split('.').map(part => {
      // Extract numeric portion
      const matches = part.match(/^([0-9]+)/);
      return matches ? parseInt(matches[1], 10) : 0;
    });
  };
  
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  
  // Compare each part
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 !== part2) {
      return part1 - part2;
    }
  }
  
  return 0;
}

/**
 * Get all JavaScript files recursively from a directory
 * @param dir Directory to search
 * @returns Array of file paths
 */
async function getJsFilesRecursively(dir: string): Promise<string[]> {
  const result: string[] = [];
  
  try {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      
      // Skip node_modules within node_modules
      if (dir.includes('node_modules') && item === 'node_modules') {
        continue;
      }
      
      try {
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          const subDirFiles = await getJsFilesRecursively(itemPath);
          result.push(...subDirFiles);
        } else if (itemPath.match(/\.(js|jsx|ts|tsx|mjs|cjs)$/i)) {
          result.push(itemPath);
        }
      } catch (err) {
        // Skip files with permission errors
        continue;
      }
    }
  } catch (err) {
    // Skip directories with permission errors
  }
  
  return result;
}

/**
 * Get all relevant source files in the project
 * @returns Array of file paths
 */
async function getAllSourceFiles(): Promise<string[]> {
  const baseDir = process.cwd();
  const sourcePatterns = [
    { dir: 'src', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'server', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'client', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'pages', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'app', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'api', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'lib', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'utils', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'routes', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'controllers', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'models', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'middleware', pattern: /\.(js|jsx|ts|tsx|mjs|cjs)$/i },
    { dir: 'config', pattern: /\.(js|jsx|ts|tsx|mjs|cjs|json|yaml|yml)$/i },
    { dir: '.', pattern: /^(?!node_modules).*\.(js|jsx|ts|tsx|mjs|cjs)$/i }
  ];
  
  const allFiles: string[] = [];
  
  for (const { dir, pattern } of sourcePatterns) {
    const dirPath = path.join(baseDir, dir);
    
    try {
      // Check if directory exists
      await fs.access(dirPath);
      
      // If it's the root directory, handle it differently
      if (dir === '.') {
        const rootFiles = await fs.readdir(dirPath);
        
        for (const file of rootFiles) {
          if (pattern.test(file)) {
            const filePath = path.join(dirPath, file);
            try {
              const stats = await fs.stat(filePath);
              if (stats.isFile()) {
                allFiles.push(filePath);
              }
            } catch (err) {
              // Skip files with errors
            }
          }
        }
      } else {
        // Get files recursively from subdirectories
        const files = await getFilesRecursively(dirPath, pattern);
        allFiles.push(...files);
      }
    } catch (err) {
      // Directory doesn't exist, skip
    }
  }
  
  return allFiles;
}

/**
 * Get all files recursively from a directory that match a pattern
 * @param dir Directory to search
 * @param pattern File pattern to match
 * @returns Array of file paths
 */
async function getFilesRecursively(dir: string, pattern: RegExp): Promise<string[]> {
  const result: string[] = [];
  
  try {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      
      // Skip node_modules and .git directories
      if (item === 'node_modules' || item === '.git') {
        continue;
      }
      
      try {
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          const subDirFiles = await getFilesRecursively(itemPath, pattern);
          result.push(...subDirFiles);
        } else if (pattern.test(item)) {
          result.push(itemPath);
        }
      } catch (err) {
        // Skip files with permission errors
        continue;
      }
    }
  } catch (err) {
    // Skip directories with permission errors
  }
  
  return result;
}

/**
 * Escape special characters in a string for use in a regular expression
 * @param str String to escape
 * @returns Escaped string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}