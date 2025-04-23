/**
 * XSS Vulnerability Automated Remediation Tool
 * 
 * This script scans the codebase for potential XSS vulnerabilities and
 * attempts to automatically remediate common issues.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { 
  scanDirectoryForXssVulnerabilities, 
  XssVulnerability,
  XssRiskLevel,
  XssVulnerabilityType
} from '../security/xss/XssDetector';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';

// Promisify filesystem operations
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Track files that have been modified
 */
const modifiedFiles = new Set<string>();

/**
 * Apply a fix to a specific file
 */
async function applyFix(
  filePath: string, 
  vulnerability: XssVulnerability,
  dryRun: boolean = false
): Promise<boolean> {
  try {
    // Read the file content
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Get the vulnerable line
    const line = lines[vulnerability.line - 1];
    
    // Skip if already fixed or the line doesn't match
    if (!line || !line.includes(vulnerability.code)) {
      return false;
    }
    
    // Apply the appropriate fix based on the vulnerability type
    let fixedLine = line;
    let fixApplied = false;
    
    switch (vulnerability.pattern.name) {
      case 'Unsafe innerHTML Assignment': {
        // Replace innerHTML with DOMPurify.sanitize
        const matchInnerHTML = /(\w+)\.innerHTML\s*=\s*([^;]+)/g;
        fixedLine = line.replace(matchInnerHTML, '$1.innerHTML = DOMPurify.sanitize($2)');
        
        // If we're not simply adding DOMPurify.sanitize, try to use textContent for plain text
        if (fixedLine === line) {
          const textContentReplacement = /(\w+)\.innerHTML\s*=\s*([^;]+)/g;
          fixedLine = line.replace(textContentReplacement, '$1.textContent = $2');
        }
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe document.write Usage': {
        // Replace document.write with safer DOM manipulation
        const matchDocWrite = /document\.(write|writeln)\((.*?)\)/g;
        fixedLine = line.replace(
          matchDocWrite, 
          'document.body.insertAdjacentHTML("beforeend", DOMPurify.sanitize($2))'
        );
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe Code Execution': {
        console.log(`WARNING: Manual fix required for ${vulnerability.pattern.name} at ${filePath}:${vulnerability.line}`);
        return false;
      }
      
      case 'Unsafe React dangerouslySetInnerHTML': {
        // Add DOMPurify.sanitize
        const matchDangerouslySetInnerHTML = /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*([^}]+)\s*\}\s*\}/g;
        fixedLine = line.replace(
          matchDangerouslySetInnerHTML, 
          'dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize($1) }}'
        );
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe Location Assignment': {
        // Add encodeURI
        const matchLocationAssignment = /(location\.(href|hash|search|pathname)\s*=\s*)([^;]+)/g;
        fixedLine = line.replace(matchLocationAssignment, '$1encodeURI($3)');
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe insertAdjacentHTML Usage': {
        // Add DOMPurify.sanitize
        const matchInsertAdjacentHTML = /(insertAdjacentHTML\s*\(\s*["'`].*["'`]\s*,\s*)([^)]+)\)/g;
        fixedLine = line.replace(matchInsertAdjacentHTML, '$1DOMPurify.sanitize($2))');
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe jQuery DOM Manipulation': {
        // Add DOMPurify.sanitize
        const matchJQuery = /(\$\(.*\)\.(html|append|prepend|after|before|replaceWith)\s*\(\s*)([^)]+)\)/g;
        fixedLine = line.replace(matchJQuery, '$1DOMPurify.sanitize($3))');
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe Express Response': {
        // Add escapeHtml or sanitize
        const matchExpressResponse = /(res\.(send|write|end)\s*\(\s*)([^)]+)\)/g;
        fixedLine = line.replace(matchExpressResponse, '$1escapeHtml($3))');
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Unsafe Attribute Setting': {
        // Add validation and sanitization
        const matchAttributeSetting = /(setAttribute\s*\(\s*["'`](?:on\w+|src|href|data|formaction)["'`]\s*,\s*)([^)]+)\)/g;
        
        // For URLs, encode them
        if (line.includes('src') || line.includes('href') || line.includes('data') || line.includes('formaction')) {
          fixedLine = line.replace(matchAttributeSetting, '$1encodeURI($2))');
        } else {
          // For event handlers, this is a security risk that should be manually reviewed
          console.log(`WARNING: Manual fix required for attribute setting at ${filePath}:${vulnerability.line}`);
          return false;
        }
        
        fixApplied = fixedLine !== line;
        break;
      }
      
      case 'Potential Template Injection': {
        console.log(`WARNING: Manual review required for template injection at ${filePath}:${vulnerability.line}`);
        return false;
      }
      
      case 'Unvalidated Request Data Usage': {
        console.log(`WARNING: Manual validation required for request data at ${filePath}:${vulnerability.line}`);
        return false;
      }
      
      case 'Unescaped Data in HTML Template': {
        console.log(`WARNING: Manual escaping required for HTML template at ${filePath}:${vulnerability.line}`);
        return false;
      }
      
      case 'Unescaped Data in JavaScript Context': {
        console.log(`WARNING: Manual encoding required for JavaScript context at ${filePath}:${vulnerability.line}`);
        return false;
      }
      
      default:
        console.log(`WARNING: No automated fix available for ${vulnerability.pattern.name}`);
        return false;
    }
    
    if (fixApplied) {
      // Update the lines array with the fixed line
      lines[vulnerability.line - 1] = fixedLine;
      
      // Only write the file if not a dry run
      if (!dryRun) {
        const updatedContent = lines.join('\n');
        await writeFile(filePath, updatedContent, 'utf-8');
        modifiedFiles.add(filePath);
      }
      
      return true;
    }
    
    return false;
  } catch (error: Error) {
    console.error(`Error applying fix to ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check if a file needs import statements for fixes
 */
async function addNeededImports(
  filePath: string,
  vulnerabilities: XssVulnerability[],
  dryRun: boolean = false
): Promise<boolean> {
  try {
    // Skip if no vulnerabilities were fixed
    if (!modifiedFiles.has(filePath)) {
      return false;
    }
    
    // Read the file content
    const content = await readFile(filePath, 'utf-8');
    
    // Check if we need to add imports
    const needsDOMPurify = vulnerabilities.some(v => 
      v.pattern.name === 'Unsafe innerHTML Assignment' ||
      v.pattern.name === 'Unsafe React dangerouslySetInnerHTML' ||
      v.pattern.name === 'Unsafe insertAdjacentHTML Usage' ||
      v.pattern.name === 'Unsafe jQuery DOM Manipulation' ||
      v.pattern.name === 'Unsafe document.write Usage'
    );
    
    const needsEscapeHtml = vulnerabilities.some(v => 
      v.pattern.name === 'Unsafe Express Response'
    );
    
    // Skip if no imports needed
    if (!needsDOMPurify && !needsEscapeHtml) {
      return false;
    }
    
    // File extension
    const ext = path.extname(filePath);
    
    // Prepare import statements
    let importStatements = '';
    
    if (needsDOMPurify) {
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        importStatements += "import DOMPurify from 'dompurify';\n";
      }
    }
    
    if (needsEscapeHtml) {
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        // Define escape HTML function if using it
        importStatements += `
// Function to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
`;
      }
    }
    
    // Skip if no import statements to add
    if (!importStatements) {
      return false;
    }
    
    // Add imports to the top of the file
    const updatedContent = importStatements + content;
    
    // Only write the file if not a dry run
    if (!dryRun) {
      await writeFile(filePath, updatedContent, 'utf-8');
    }
    
    return true;
  } catch (error: Error) {
    console.error(`Error adding imports to ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function to run the XSS vulnerability fixer
 */
async function main() {
  console.log('XSS Vulnerability Automated Remediation Tool');
  console.log('===========================================');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dirs = args.filter(arg => !arg.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const fixHighOnly = args.includes('--high-only');
  const fixCriticalOnly = args.includes('--critical-only');
  
  // Default directories to scan
  const dirsToScan = dirs.length > 0 ? dirs : ['server', 'client', 'shared'];
  
  // Exclude directories
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
  
  console.log('Scanning directories:', dirsToScan.join(', '));
  console.log('Excluding directories:', excludeDirs.join(', '));
  
  if (dryRun) {
    console.log('Dry run: No changes will be applied');
  }
  
  if (fixCriticalOnly) {
    console.log('Fixing critical vulnerabilities only');
  } else if (fixHighOnly) {
    console.log('Fixing high and critical vulnerabilities only');
  } else {
    console.log('Fixing all vulnerabilities');
  }
  
  try {
    // Log the scan start
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'XSS vulnerability remediation started',
      metadata: {
        directories: dirsToScan,
        excludedDirectories: excludeDirs,
        dryRun,
        fixCriticalOnly,
        fixHighOnly,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
    
    // Scan for vulnerabilities
    const vulnerabilities: XssVulnerability[] = [];
    
    for (const dir of dirsToScan) {
      if (fs.existsSync(dir)) {
        console.log(`Scanning ${dir}...`);
        const dirVulnerabilities = await scanDirectoryForXssVulnerabilities(dir, excludeDirs);
        vulnerabilities.push(...dirVulnerabilities);
      } else {
        console.warn(`Directory not found: ${dir}`);
      }
    }
    
    console.log(`Found ${vulnerabilities.length} potential XSS vulnerabilities`);
    
    // Filter vulnerabilities based on severity
    let vulnerabilitiesToFix = vulnerabilities;
    if (fixCriticalOnly) {
      vulnerabilitiesToFix = vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.CRITICAL);
    } else if (fixHighOnly) {
      vulnerabilitiesToFix = vulnerabilities.filter(v => 
        v.pattern.risk === XssRiskLevel.CRITICAL || v.pattern.risk === XssRiskLevel.HIGH
      );
    }
    
    console.log(`Attempting to fix ${vulnerabilitiesToFix.length} vulnerabilities...`);
    
    // Group vulnerabilities by file
    const vulnerabilitiesByFile = new Map<string, XssVulnerability[]>();
    
    for (const vuln of vulnerabilitiesToFix) {
      if (!vulnerabilitiesByFile.has(vuln.file)) {
        vulnerabilitiesByFile.set(vuln.file, []);
      }
      vulnerabilitiesByFile.get(vuln.file)!.push(vuln);
    }
    
    // Apply fixes
    let fixedCount = 0;
    let manualFixCount = 0;
    
    for (const [file, fileVulnerabilities] of vulnerabilitiesByFile.entries()) {
      console.log(`\nProcessing file: ${file}`);
      
      for (const vuln of fileVulnerabilities) {
        console.log(`  - ${vuln.pattern.risk} ${vuln.pattern.type}: ${vuln.pattern.name} at line ${vuln.line}`);
        
        const fixed = await applyFix(file, vuln, dryRun);
        if (fixed) {
          console.log(`    ✓ Fixed`);
          fixedCount++;
        } else {
          console.log(`    ✗ Manual fix required`);
          manualFixCount++;
        }
      }
      
      // Add needed imports
      if (!dryRun) {
        const importsAdded = await addNeededImports(file, fileVulnerabilities, dryRun);
        if (importsAdded) {
          console.log(`  ✓ Added necessary imports`);
        }
      }
    }
    
    // Print summary
    console.log('\nRemediation Summary:');
    console.log(`- Total vulnerabilities found: ${vulnerabilities.length}`);
    console.log(`- Vulnerabilities targeted for fixing: ${vulnerabilitiesToFix.length}`);
    console.log(`- Vulnerabilities automatically fixed: ${fixedCount}`);
    console.log(`- Vulnerabilities requiring manual fixes: ${manualFixCount}`);
    
    if (!dryRun) {
      console.log(`- Files modified: ${modifiedFiles.size}`);
    }
    
    // Log the completion
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'XSS vulnerability remediation completed',
      metadata: {
        totalVulnerabilities: vulnerabilities.length,
        vulnerabilitiesTargeted: vulnerabilitiesToFix.length,
        vulnerabilitiesFixed: fixedCount,
        vulnerabilitiesRequiringManualFixes: manualFixCount,
        filesModified: Array.from(modifiedFiles),
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
    
    // List manually required fixes
    if (manualFixCount > 0) {
      console.log('\nVulnerabilities requiring manual fixes:');
      
      let index = 1;
      for (const vuln of vulnerabilitiesToFix) {
        const fixed = modifiedFiles.has(vuln.file) && 
          await applyFix(vuln.file, vuln, true); // dry run to check if fixable
        
        if (!fixed) {
          console.log(`${index}. ${vuln.file}:${vuln.line} - ${vuln.pattern.name}`);
          console.log(`   Code: ${vuln.code}`);
          console.log(`   Remediation: ${vuln.pattern.remediation}`);
          console.log();
          index++;
        }
      }
    }
    
    return {
      totalVulnerabilities: vulnerabilities.length,
      fixedCount,
      manualFixCount,
      modifiedFiles: Array.from(modifiedFiles)
    };
  } catch (error: Error) {
    console.error('Error during XSS vulnerability remediation:', error);
    
    // Log the error
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.ERROR,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'XSS vulnerability remediation error',
      metadata: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
    
    throw error;
  }
}

// Run the fixer if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running XSS vulnerability remediation tool:', error);
    process.exit(1);
  });
}

// Export for use as a module
export { main as fixXssVulnerabilities };