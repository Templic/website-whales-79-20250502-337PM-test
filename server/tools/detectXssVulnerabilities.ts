/**
 * XSS Vulnerability Detection Tool
 * 
 * This script scans the codebase for potential XSS vulnerabilities and
 * generates a detailed report.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { 
  scanDirectoryForXssVulnerabilities, 
  generateXssReport,
  XssVulnerability,
  XssRiskLevel
} from '../security/xss/XssDetector';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';

// Promisify filesystem operations
const writeFile = util.promisify(fs.writeFile);

/**
 * Generate a JSON report of XSS vulnerabilities
 */
function generateJsonReport(vulnerabilities: XssVulnerability[]): string {
  const report = {
    generatedAt: new Date().toISOString(),
    totalVulnerabilities: vulnerabilities.length,
    summary: {
      critical: vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.CRITICAL).length,
      high: vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.HIGH).length,
      medium: vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.MEDIUM).length,
      low: vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.LOW).length
    },
    vulnerabilitiesByType: {
      stored: vulnerabilities.filter(v => v.pattern.type === 'STORED').length,
      reflected: vulnerabilities.filter(v => v.pattern.type === 'REFLECTED').length,
      dom: vulnerabilities.filter(v => v.pattern.type === 'DOM').length
    },
    vulnerabilities: vulnerabilities.map(v => ({
      file: v.file,
      line: v.line,
      column: v.column,
      code: v.code,
      name: v.pattern.name,
      description: v.pattern.description,
      risk: v.pattern.risk,
      type: v.pattern.type,
      remediation: v.pattern.remediation
    }))
  };
  
  return JSON.stringify(report, null, 2);
}

/**
 * Main function to run the XSS vulnerability detector
 */
async function main() {
  console.log('XSS Vulnerability Detection Tool');
  console.log('===============================');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dirs = args.filter(arg => !arg.startsWith('--'));
  const jsonOutput = args.includes('--json');
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
  
  // Default directories to scan
  const dirsToScan = dirs.length > 0 ? dirs : ['server', 'client', 'shared'];
  
  // Exclude directories
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
  
  console.log('Scanning directories:', dirsToScan.join(', '));
  console.log('Excluding directories:', excludeDirs.join(', '));
  
  try {
    // Log the scan start
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as unknown,
      message: 'XSS vulnerability scan started',
      metadata: {
        directories: dirsToScan,
        excludedDirectories: excludeDirs,
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
    
    // Generate report
    const report = jsonOutput ? 
      generateJsonReport(vulnerabilities) : 
      generateXssReport(vulnerabilities);
    
    // Default output location
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const defaultOutputPath = path.join(
      'reports', 
      `xss_vulnerabilities_${timestamp}.${jsonOutput ? 'json' : 'txt'}`
    );
    
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    // Write report to file
    const outputPath = outputFile || defaultOutputPath;
    await writeFile(outputPath, report);
    
    // Print summary
    console.log('\nScan complete. Results:');
    console.log(`- Total vulnerabilities found: ${vulnerabilities.length}`);
    console.log(`- Critical: ${vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.CRITICAL).length}`);
    console.log(`- High: ${vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.HIGH).length}`);
    console.log(`- Medium: ${vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.MEDIUM).length}`);
    console.log(`- Low: ${vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.LOW).length}`);
    console.log(`\nReport saved to: ${outputPath}`);
    
    // Log the scan completion
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as unknown,
      message: 'XSS vulnerability scan completed',
      metadata: {
        vulnerabilitiesFound: vulnerabilities.length,
        criticalVulnerabilities: vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.CRITICAL).length,
        highVulnerabilities: vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.HIGH).length,
        reportPath: outputPath,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
    
    // Provide next steps
    console.log('\nNext steps:');
    console.log('1. Review the detailed report');
    console.log('2. Fix critical and high-risk vulnerabilities first');
    console.log('3. Use XSS prevention tools to remediate issues');
    console.log('4. Run the scan again to verify fixes');
    
    return vulnerabilities;
  } catch (error) {
    console.error('Error during XSS vulnerability scan:', error);
    
    // Log the error
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.ERROR,
      category: SecurityEventCategory.SECURITY_SCAN as unknown,
      message: 'XSS vulnerability scan error',
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

// Run the detector if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running XSS vulnerability detector:', error);
    process.exit(1);
  });
}

// Export for use as a module
export { main as detectXssVulnerabilities };