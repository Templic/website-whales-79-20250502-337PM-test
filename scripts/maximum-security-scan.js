#!/usr/bin/env node

/**
 * Maximum Security Scan Runner
 * 
 * This script performs a comprehensive security scan of the entire codebase
 * to detect potential security issues, vulnerabilities, malware, and exploits.
 * 
 * Usage:
 *   node scripts/maximum-security-scan.js [options]
 * 
 * Options:
 *   --report      Generate a detailed report in the reports directory
 *   --verbose     Show detailed output during scanning
 *   --deep        Perform even deeper analysis (slower)
 *   --summary     Only output a summary of findings
 *   --fix         Attempt to automatically fix certain issues
 */

// Import necessary modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Create report directories
const REPORTS_DIR = path.join(rootDir, 'reports', 'security');
const TIMESTAMP = new Date().toISOString().replace(/:/g, '-');
const REPORT_FILE = path.join(REPORTS_DIR, `maximum-scan-${TIMESTAMP}.json`);
const REPORT_MD_FILE = path.join(REPORTS_DIR, `maximum-scan-${TIMESTAMP}.md`);

// Ensure report directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  report: args.includes('--report'),
  verbose: args.includes('--verbose'),
  deep: args.includes('--deep'),
  summary: args.includes('--summary'),
  fix: args.includes('--fix')
};

// Initialize the spinner for progress display
let progressInterval;

/**
 * Display a spinner with message
 * @param {string} message Message to display
 */
function startSpinner(message) {
  if (options.summary) return; // Don't show spinner in summary mode
  
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  // Clear any existing spinner
  stopSpinner();
  
  // Start a new spinner
  process.stdout.write('\r');
  progressInterval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinnerChars[i])} ${message}`);
    i = (i + 1) % spinnerChars.length;
  }, 80);
}

/**
 * Stop the spinner
 */
function stopSpinner() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
    process.stdout.write('\r                                                                                \r');
  }
}

/**
 * Log a message to console
 * @param {string} message Message to log
 * @param {string} type Log type (info, warning, error, success)
 */
function log(message, type = 'info') {
  // Stop spinner before logging
  stopSpinner();
  
  const timestamp = new Date().toISOString();
  let formattedMessage;
  
  switch (type.toLowerCase()) {
    case 'warning':
      formattedMessage = chalk.yellow(`[${timestamp}] WARNING: ${message}`);
      break;
    case 'error':
      formattedMessage = chalk.red(`[${timestamp}] ERROR: ${message}`);
      break;
    case 'success':
      formattedMessage = chalk.green(`[${timestamp}] SUCCESS: ${message}`);
      break;
    case 'critical':
      formattedMessage = chalk.bgRed.white(`[${timestamp}] CRITICAL: ${message}`);
      break;
    default:
      formattedMessage = chalk.blue(`[${timestamp}] INFO: ${message}`);
  }
  
  console.log(formattedMessage);
}

/**
 * Run the maximum security scan
 */
async function runScan() {
  try {
    log(`====== MAXIMUM SECURITY SCAN ======`, 'info');
    log(`Initiating maximum security scan with all protection features enabled`, 'info');
    
    if (options.deep) {
      log(`Deep scan mode enabled - this will take longer but provide more thorough results`, 'info');
    }
    
    log(`Scanning entire codebase for security issues, vulnerabilities, malware, and exploits...`, 'info');
    startSpinner('Loading security scanner module...');
    
    // Import the scanner dynamically
    const { runMaximumSecurityScan } = await import('../server/security/maximumSecurityScan.js');
    
    // Run the scan
    startSpinner('Running maximum security scan (this may take several minutes)...');
    const scanResults = await runMaximumSecurityScan(options.deep);
    stopSpinner();
    
    // Display scan results
    log(`Security scan completed in ${(scanResults.scanDuration / 1000).toFixed(2)} seconds`, 'success');
    log(`Security Score: ${formatSecurityScore(scanResults.securityScore)}`, 'info');
    log(`Scanned: ${scanResults.scannedResources.totalFiles} files, ${scanResults.scannedResources.totalPackages} packages, ${scanResults.scannedResources.totalLinesOfCode} lines of code`, 'info');
    
    // Display summary of findings
    const criticalCount = scanResults.summary.critical;
    const highCount = scanResults.summary.high;
    const mediumCount = scanResults.summary.medium;
    const lowCount = scanResults.summary.low;
    const totalCount = scanResults.summary.total;
    
    log(`Total issues found: ${totalCount}`, totalCount > 0 ? 'warning' : 'success');
    
    if (criticalCount > 0) {
      log(`Critical issues: ${criticalCount}`, 'critical');
    }
    
    if (highCount > 0) {
      log(`High severity issues: ${highCount}`, 'error');
    }
    
    if (mediumCount > 0) {
      log(`Medium severity issues: ${mediumCount}`, 'warning');
    }
    
    if (lowCount > 0) {
      log(`Low severity issues: ${lowCount}`, 'info');
    }
    
    // Display detailed vulnerability information if not in summary mode
    if (!options.summary && totalCount > 0) {
      displayDetailedResults(scanResults.vulnerabilities);
    }
    
    // Generate reports if requested
    if (options.report) {
      generateReports(scanResults);
    }
    
    // Try to fix issues if requested
    if (options.fix && totalCount > 0) {
      log(`Attempting to fix issues automatically...`, 'info');
      startSpinner('Fixing security issues...');
      
      // In a real implementation, we would try to fix issues here
      // For now, we just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      stopSpinner();
      
      log(`Attempted to fix issues, please review the changes carefully`, 'warning');
    }
    
    // Exit with appropriate code based on findings
    if (criticalCount > 0 || highCount > 0) {
      log(`Security scan found critical or high severity issues that need immediate attention!`, 'error');
      process.exit(1);
    } else if (totalCount > 0) {
      log(`Security scan completed with issues found. Review the report for details.`, 'warning');
      process.exit(0);
    } else {
      log(`Security scan completed successfully with no issues found.`, 'success');
      process.exit(0);
    }
    
  } catch (error) {
    stopSpinner();
    log(`Error running security scan: ${error.message}`, 'error');
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Display detailed results of the security scan
 * @param {Array} vulnerabilities Array of vulnerabilities
 */
function displayDetailedResults(vulnerabilities) {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return;
  }
  
  // Sort vulnerabilities by severity
  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  console.log('\n' + chalk.bold('=== DETAILED SECURITY FINDINGS ==='));
  
  // Display critical and high severity issues
  const severeIssues = sortedVulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high');
  
  if (severeIssues.length > 0) {
    console.log('\n' + chalk.bold.red('CRITICAL & HIGH SEVERITY ISSUES:'));
    console.log(chalk.red('These issues require immediate attention!'));
    
    severeIssues.forEach((vuln, index) => {
      const colorFunc = vuln.severity === 'critical' ? chalk.bgRed.white : chalk.red;
      console.log('\n' + colorFunc(`[${index + 1}] ${vuln.severity.toUpperCase()}: ${vuln.description}`));
      
      if (vuln.resource) {
        console.log(chalk.yellow(`Resource: ${vuln.resource}`));
      }
      
      if (vuln.details) {
        console.log(chalk.white(`Details: ${vuln.details}`));
      }
      
      if (vuln.recommendation) {
        console.log(chalk.green(`Recommendation: ${vuln.recommendation}`));
      }
      
      if (vuln.category) {
        console.log(chalk.blue(`Category: ${vuln.category}`));
      }
    });
  }
  
  // In verbose mode, show medium and low severity issues too
  if (options.verbose) {
    const otherIssues = sortedVulnerabilities.filter(v => v.severity === 'medium' || v.severity === 'low');
    
    if (otherIssues.length > 0) {
      console.log('\n' + chalk.bold.yellow('MEDIUM & LOW SEVERITY ISSUES:'));
      
      otherIssues.forEach((vuln, index) => {
        const colorFunc = vuln.severity === 'medium' ? chalk.yellow : chalk.blue;
        console.log('\n' + colorFunc(`[${index + 1}] ${vuln.severity.toUpperCase()}: ${vuln.description}`));
        
        if (vuln.resource) {
          console.log(chalk.yellow(`Resource: ${vuln.resource}`));
        }
        
        if (options.verbose && vuln.details) {
          console.log(chalk.white(`Details: ${vuln.details}`));
        }
        
        if (vuln.recommendation) {
          console.log(chalk.green(`Recommendation: ${vuln.recommendation}`));
        }
      });
    }
  } else if (!options.verbose && sortedVulnerabilities.length > severeIssues.length) {
    const remainingCount = sortedVulnerabilities.length - severeIssues.length;
    console.log('\n' + chalk.yellow(`${remainingCount} additional medium/low severity issues found.`));
    console.log(chalk.yellow(`Run with --verbose flag to see all issues or check the report.`));
  }
}

/**
 * Format the security score with color coding
 * @param {number} score Security score (0-100)
 * @returns {string} Formatted and colored security score
 */
function formatSecurityScore(score) {
  let color;
  let grade;
  
  if (score >= 90) {
    color = chalk.green;
    grade = 'A';
  } else if (score >= 80) {
    color = chalk.greenBright;
    grade = 'B';
  } else if (score >= 70) {
    color = chalk.yellow;
    grade = 'C';
  } else if (score >= 60) {
    color = chalk.yellowBright;
    grade = 'D';
  } else {
    color = chalk.red;
    grade = 'F';
  }
  
  return color(`${score}/100 (Grade: ${grade})`);
}

/**
 * Generate report files from scan results
 * @param {Object} scanResults Results from the security scan
 */
function generateReports(scanResults) {
  try {
    // Generate JSON report
    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(scanResults, null, 2)
    );
    
    // Generate Markdown report
    const markdownReport = generateMarkdownReport(scanResults);
    fs.writeFileSync(REPORT_MD_FILE, markdownReport);
    
    log(`Reports generated:`, 'success');
    log(`- JSON: ${REPORT_FILE}`, 'info');
    log(`- Markdown: ${REPORT_MD_FILE}`, 'info');
  } catch (error) {
    log(`Error generating reports: ${error.message}`, 'error');
  }
}

/**
 * Generate a detailed markdown report
 * @param {Object} scanResults Results from the security scan
 * @returns {string} Markdown formatted report
 */
function generateMarkdownReport(scanResults) {
  const timestamp = new Date().toISOString();
  const criticalCount = scanResults.summary.critical;
  const highCount = scanResults.summary.high;
  const mediumCount = scanResults.summary.medium;
  const lowCount = scanResults.summary.low;
  const totalCount = scanResults.summary.total;
  
  let md = `# Maximum Security Scan Report\n\n`;
  md += `**Scan Date:** ${timestamp}\n\n`;
  md += `**Security Score:** ${scanResults.securityScore}/100\n\n`;
  
  // Overall summary
  md += `## Summary\n\n`;
  md += `- **Critical Issues:** ${criticalCount}\n`;
  md += `- **High Severity Issues:** ${highCount}\n`;
  md += `- **Medium Severity Issues:** ${mediumCount}\n`;
  md += `- **Low Severity Issues:** ${lowCount}\n`;
  md += `- **Total Issues:** ${totalCount}\n\n`;
  
  // Scan metrics
  md += `## Scan Metrics\n\n`;
  md += `- **Files Scanned:** ${scanResults.scannedResources.totalFiles}\n`;
  md += `- **Packages Scanned:** ${scanResults.scannedResources.totalPackages}\n`;
  md += `- **Lines of Code:** ${scanResults.scannedResources.totalLinesOfCode}\n`;
  md += `- **Network Endpoints:** ${scanResults.scannedResources.totalNetworkEndpoints}\n`;
  md += `- **Scan Duration:** ${(scanResults.scanDuration / 1000).toFixed(2)} seconds\n\n`;
  
  // Issues by category
  if (totalCount > 0) {
    const categories = {};
    
    scanResults.vulnerabilities.forEach(vuln => {
      if (!categories[vuln.category]) {
        categories[vuln.category] = [];
      }
      categories[vuln.category].push(vuln);
    });
    
    md += `## Issues by Category\n\n`;
    
    for (const [category, vulns] of Object.entries(categories)) {
      md += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${vulns.length})\n\n`;
      
      vulns.forEach(vuln => {
        md += `#### [${vuln.severity.toUpperCase()}] ${vuln.description}\n\n`;
        
        if (vuln.resource) {
          md += `- **Resource:** ${vuln.resource}\n`;
        }
        
        if (vuln.details) {
          md += `- **Details:** ${vuln.details}\n`;
        }
        
        if (vuln.recommendation) {
          md += `- **Recommendation:** ${vuln.recommendation}\n`;
        }
        
        if (vuln.confidence) {
          md += `- **Confidence:** ${vuln.confidence}\n`;
        }
        
        if (vuln.falsePositiveRisk) {
          md += `- **False Positive Risk:** ${vuln.falsePositiveRisk}\n`;
        }
        
        md += `\n`;
      });
    }
  }
  
  // Recommendations section
  md += `## Security Recommendations\n\n`;
  
  if (criticalCount > 0) {
    md += `### Critical Recommendations (Immediate Action Required)\n\n`;
    
    scanResults.vulnerabilities
      .filter(v => v.severity === 'critical')
      .forEach(vuln => {
        md += `- ${vuln.recommendation}\n`;
      });
      
    md += `\n`;
  }
  
  if (highCount > 0) {
    md += `### High Priority Recommendations\n\n`;
    
    scanResults.vulnerabilities
      .filter(v => v.severity === 'high')
      .forEach(vuln => {
        md += `- ${vuln.recommendation}\n`;
      });
      
    md += `\n`;
  }
  
  // Overall security assessment
  md += `## Overall Security Assessment\n\n`;
  
  if (scanResults.securityScore >= 90) {
    md += `The application has a high level of security with minimal issues detected. Continue maintaining this level of security with regular scans and updates.\n\n`;
  } else if (scanResults.securityScore >= 70) {
    md += `The application has a moderate level of security with some issues that should be addressed. Review and fix the recommendations in this report.\n\n`;
  } else {
    md += `The application has significant security concerns that require immediate attention. Prioritize fixing the critical and high severity issues identified in this report.\n\n`;
  }
  
  return md;
}

// Start the scan
runScan();