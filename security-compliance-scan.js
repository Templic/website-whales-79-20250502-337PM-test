/**
 * Open Source and Privacy Security Compliance Scanner
 * 
 * This script performs a comprehensive scan of the codebase to ensure
 * compliance with open source licensing requirements and privacy regulations.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  scanRoot: './',
  excludePaths: ['node_modules', '.git', 'dist', 'build'],
  licenseScanEnabled: true,
  privacyScanEnabled: true,
  securityScanEnabled: true,
  outputPath: './logs/compliance-scan.json'
};

// Vulnerability patterns to look for
const vulnerabilityPatterns = [
  { pattern: /eval\s*\(\s*(?:.*req|.*request|.*input|.*data|.*param)/i, description: 'Potential code injection vulnerability' },
  { pattern: /document\.write\s*\(/i, description: 'Potential XSS vulnerability' },
  { pattern: /exec\s*\(\s*(?:.*req|.*request|.*input|.*data|.*param)/i, description: 'Potential command injection vulnerability' },
  { pattern: /innerHTML\s*=\s*(?:.*req|.*request|.*input|.*data|.*param)/i, description: 'Potential XSS vulnerability' },
  { pattern: /dangerouslySetInnerHTML/i, description: 'Potential XSS vulnerability with React' },
  { pattern: /\$\s*\(\s*(?:.*req|.*request|.*input|.*data|.*param).*\)/i, description: 'Potential DOM-based XSS vulnerability' },
  { pattern: /{{.*}}/i, description: 'Potential template injection vulnerability' },
  { pattern: /password.*=.*['"](?!.*\$)/i, description: 'Potential hardcoded credential' },
  { pattern: /api[_-]?key.*=.*['"](?!.*\$)/i, description: 'Potential hardcoded API key' },
  { pattern: /secret.*=.*['"](?!.*\$)/i, description: 'Potential hardcoded secret' },
  { pattern: /\.\.\/|\.\.\\|\.\//i, description: 'Potential path traversal vulnerability' },
  { pattern: /cors\s*\(\s*{\s*origin\s*:\s*['"]?\*/i, description: 'Potentially insecure CORS configuration' },
  { pattern: /helmet\s*\(\s*false/i, description: 'Disabled security headers' },
  { pattern: /sql\s*=.*(req|request|input|data|param)/i, description: 'Potential SQL injection vulnerability' },
  { pattern: /cookie.*\{\s*(?!.*secure)(?!.*httpOnly)/i, description: 'Potentially insecure cookie settings' },
  { pattern: /CSRF.*false/i, description: 'CSRF protection disabled' },
  { pattern: /Content-Security-Policy.*none/i, description: 'Weak Content Security Policy' },
  { pattern: /setHeader\s*\(\s*['"]X-Powered-By/i, description: 'Unnecessary information disclosure' },
  { pattern: /createHash\s*\(\s*['"]md5['"]/i, description: 'Use of weak cryptographic hash function' },
  { pattern: /createHash\s*\(\s*['"]sha1['"]/i, description: 'Use of weak cryptographic hash function' }
];

// Privacy data patterns to look for
const privacyDataPatterns = [
  { pattern: /var\s+email|let\s+email|const\s+email/i, description: 'Email data handling' },
  { pattern: /var\s+phone|let\s+phone|const\s+phone/i, description: 'Phone number data handling' },
  { pattern: /var\s+address|let\s+address|const\s+address/i, description: 'Address data handling' },
  { pattern: /var\s+ssn|let\s+ssn|const\s+ssn/i, description: 'Social Security Number data handling' },
  { pattern: /var\s+dob|let\s+dob|const\s+dob/i, description: 'Date of Birth data handling' },
  { pattern: /var\s+creditCard|let\s+creditCard|const\s+creditCard/i, description: 'Credit Card data handling' },
  { pattern: /var\s+passport|let\s+passport|const\s+passport/i, description: 'Passport data handling' },
  { pattern: /localStorage\.setItem/i, description: 'Data stored in localStorage' },
  { pattern: /sessionStorage\.setItem/i, description: 'Data stored in sessionStorage' },
  { pattern: /document\.cookie/i, description: 'Cookie manipulation' },
  { pattern: /navigator\.geolocation/i, description: 'Geolocation access' },
  { pattern: /getUserMedia/i, description: 'Camera/Microphone access' }
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  licenseFindings: [],
  privacyFindings: [],
  securityFindings: [],
  summary: {
    totalFiles: 0,
    licenseIssues: 0,
    privacyIssues: 0,
    securityIssues: 0,
    compliance: true
  }
};

// Find all code files
async function findCodeFiles() {
  try {
    // Get all files in the codebase excluding specified directories
    const excludePatterns = config.excludePaths.map(p => `! -path "*/${p}/*"`).join(' ');
    const command = `find ${config.scanRoot} -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.py" -o -name "*.java" -o -name "*.php" \\) ${excludePatterns}`;
    
    const output = execSync(command).toString().trim();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding code files:', error);
    return [];
  }
}

// Scan for license compliance
async function scanLicenseCompliance(files) {
  console.log('Scanning for license compliance...');
  
  try {
    // Check package.json for license
    let packageJsonPath = path.join(config.scanRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.license) {
        results.licenseFindings.push({
          file: 'package.json',
          line: 0,
          description: 'No license specified in package.json',
          severity: 'high',
          recommendation: 'Add a valid license field to package.json'
        });
        results.summary.licenseIssues++;
      }
    }
    
    // Check for LICENSE file
    let licenseFilePath = path.join(config.scanRoot, 'LICENSE');
    let licenseExists = fs.existsSync(licenseFilePath);
    if (!licenseExists) {
      licenseFilePath = path.join(config.scanRoot, 'LICENSE.md');
      licenseExists = fs.existsSync(licenseFilePath);
    }
    
    if (!licenseExists) {
      results.licenseFindings.push({
        file: 'LICENSE',
        line: 0,
        description: 'No LICENSE file found',
        severity: 'high',
        recommendation: 'Add a LICENSE file with appropriate open source license'
      });
      results.summary.licenseIssues++;
    }
    
    // Check for license headers in source files
    const sampleFiles = files.slice(0, 10); // Check a sample of files
    for (const file of sampleFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const hasLicenseHeader = content.includes('Copyright') || 
                              content.includes('License') || 
                              content.includes('MIT') || 
                              content.includes('Apache') || 
                              content.includes('GPL');
      
      if (!hasLicenseHeader) {
        results.licenseFindings.push({
          file,
          line: 1,
          description: 'No license header found in source file',
          severity: 'medium',
          recommendation: 'Add appropriate license header to source files'
        });
        results.summary.licenseIssues++;
      }
    }
  } catch (error) {
    console.error('Error scanning license compliance:', error);
  }
}

// Scan for privacy compliance
async function scanPrivacyCompliance(files) {
  console.log('Scanning for privacy compliance...');
  
  try {
    // Check for privacy policy file
    let privacyPolicyExists = fs.existsSync(path.join(config.scanRoot, 'PRIVACY.md')) || 
                             fs.existsSync(path.join(config.scanRoot, 'PRIVACY_POLICY.md')) ||
                             fs.existsSync(path.join(config.scanRoot, 'privacy-policy.md'));
    
    if (!privacyPolicyExists) {
      results.privacyFindings.push({
        file: 'PRIVACY.md',
        line: 0,
        description: 'No privacy policy file found',
        severity: 'high',
        recommendation: 'Add a privacy policy file'
      });
      results.summary.privacyIssues++;
    }
    
    // Check for privacy data handling
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of privacyDataPatterns) {
          if (pattern.pattern.test(line)) {
            // Check for lack of data protection
            const surroundingContext = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
            const hasDataProtection = surroundingContext.includes('encrypt') || 
                                     surroundingContext.includes('hash') || 
                                     surroundingContext.includes('sanitize') || 
                                     surroundingContext.includes('validate') ||
                                     surroundingContext.includes('redact');
            
            if (!hasDataProtection) {
              results.privacyFindings.push({
                file,
                line: i + 1,
                description: `${pattern.description} with potential inadequate protection`,
                severity: 'medium',
                recommendation: 'Ensure sensitive data is properly protected with encryption, hashing, or redaction'
              });
              results.summary.privacyIssues++;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning privacy compliance:', error);
  }
}

// Scan for security vulnerabilities
async function scanSecurityVulnerabilities(files) {
  console.log('Scanning for security vulnerabilities...');
  
  try {
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of vulnerabilityPatterns) {
          if (pattern.pattern.test(line)) {
            results.securityFindings.push({
              file,
              line: i + 1,
              description: pattern.description,
              code: line.trim(),
              severity: 'high',
              recommendation: 'Review and fix the potential security vulnerability'
            });
            results.summary.securityIssues++;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning for security vulnerabilities:', error);
  }
}

// Check for specific headers in web servers
async function checkSecurityHeaders() {
  console.log('Checking for security headers...');
  
  try {
    const serverFiles = [
      path.join(config.scanRoot, 'server', 'index.ts'),
      path.join(config.scanRoot, 'server', 'index.js'),
      path.join(config.scanRoot, 'server', 'app.ts'),
      path.join(config.scanRoot, 'server', 'app.js'),
      path.join(config.scanRoot, 'server', 'middleware.ts'),
      path.join(config.scanRoot, 'server', 'middleware.js')
    ];
    
    for (const file of serverFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for important security headers
        const missingHeaders = [];
        
        if (!content.includes('Content-Security-Policy') && !content.includes('contentSecurityPolicy')) {
          missingHeaders.push('Content-Security-Policy');
        }
        
        if (!content.includes('X-Frame-Options') && !content.includes('frameGuard')) {
          missingHeaders.push('X-Frame-Options');
        }
        
        if (!content.includes('X-Content-Type-Options') && !content.includes('noSniff')) {
          missingHeaders.push('X-Content-Type-Options');
        }
        
        if (!content.includes('Strict-Transport-Security') && !content.includes('hsts')) {
          missingHeaders.push('Strict-Transport-Security');
        }
        
        if (missingHeaders.length > 0) {
          results.securityFindings.push({
            file,
            line: 0,
            description: `Missing security headers: ${missingHeaders.join(', ')}`,
            severity: 'medium',
            recommendation: 'Implement the missing security headers or use helmet middleware'
          });
          results.summary.securityIssues++;
        }
      }
    }
  } catch (error) {
    console.error('Error checking security headers:', error);
  }
}

// Generate summary
function generateSummary() {
  results.summary.compliance = (
    results.summary.licenseIssues === 0 &&
    results.summary.privacyIssues === 0 &&
    results.summary.securityIssues === 0
  );
  
  console.log('\nCompliance Scan Summary:');
  console.log(`Total files scanned: ${results.summary.totalFiles}`);
  console.log(`License issues found: ${results.summary.licenseIssues}`);
  console.log(`Privacy issues found: ${results.summary.privacyIssues}`);
  console.log(`Security issues found: ${results.summary.securityIssues}`);
  console.log(`Overall compliance: ${results.summary.compliance ? 'PASS' : 'FAIL'}`);
  
  // Save results to file
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(config.outputPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${config.outputPath}`);
}

// Main function
async function main() {
  console.log('Starting Open Source and Privacy Security Compliance Scan...');
  
  // Find all code files
  const files = await findCodeFiles();
  results.summary.totalFiles = files.length;
  
  console.log(`Found ${files.length} code files to scan`);
  
  // Run compliance scans
  if (config.licenseScanEnabled) {
    await scanLicenseCompliance(files);
  }
  
  if (config.privacyScanEnabled) {
    await scanPrivacyCompliance(files);
  }
  
  if (config.securityScanEnabled) {
    await scanSecurityVulnerabilities(files);
    await checkSecurityHeaders();
  }
  
  // Generate summary
  generateSummary();
}

// Run the main function
main().catch(error => {
  console.error('Error running compliance scan:', error);
  process.exit(1);
});