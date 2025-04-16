#!/usr/bin/env node

/**
 * Security Report Generator
 * 
 * Generates comprehensive security reports from scan results and security logs.
 * This tool can generate executive summaries, detailed technical reports,
 * and compliance documentation.
 * 
 * Usage:
 *   node scripts/security-report-generator.js [options]
 * 
 * Options:
 *   --executive    Generate an executive summary report
 *   --technical    Generate a detailed technical report
 *   --compliance   Generate a compliance report
 *   --trends       Include security trends analysis
 *   --period=<p>   Time period to include (day, week, month, quarter, year)
 *   --output=<dir> Output directory for reports (default: reports)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Constants
const SCAN_RESULTS_DIR = path.join(process.cwd(), 'logs', 'security-scans');
const SECURITY_LOG_FILE = path.join(process.cwd(), 'logs', 'security.log');
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const STATS_FILE = path.join(REPORTS_DIR, 'security-stats.json');

// Ensure directories exist
[SCAN_RESULTS_DIR, path.dirname(SECURITY_LOG_FILE), REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  executive: args.includes('--executive'),
  technical: args.includes('--technical'),
  compliance: args.includes('--compliance'),
  trends: args.includes('--trends'),
  period: 'month', // default
  output: REPORTS_DIR
};

// Parse period if specified
const periodArg = args.find(arg => arg.startsWith('--period='));
if (periodArg) {
  options.period = periodArg.split('=')[1];
}

// Parse output directory if specified
const outputArg = args.find(arg => arg.startsWith('--output='));
if (outputArg) {
  options.output = outputArg.split('=')[1];
  
  // Ensure output directory exists
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }
}

// If no report type specified, default to technical
if (!options.executive && !options.technical && !options.compliance) {
  options.technical = true;
}

// Logger
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logEntry);
}

/**
 * Main function to generate reports
 */
async function generateReports() {
  log('Starting security report generation...');
  
  try {
    // Get scan results
    const scanResults = getScanResults(options.period);
    log(`Found ${scanResults.length} scan results for the specified period`);
    
    // Get security logs
    const securityLogs = getSecurityLogs(options.period);
    log(`Found ${securityLogs.length} security log entries for the specified period`);
    
    // Get security stats if available
    const securityStats = getSecurityStats();
    
    // Generate requested reports
    if (options.executive) {
      generateExecutiveSummary(scanResults, securityLogs, securityStats);
    }
    
    if (options.technical) {
      generateTechnicalReport(scanResults, securityLogs, securityStats);
    }
    
    if (options.compliance) {
      generateComplianceReport(scanResults, securityLogs, securityStats);
    }
    
    if (options.trends) {
      generateTrendsReport(scanResults, securityLogs, securityStats);
    }
    
    log('Report generation completed successfully');
    
  } catch (error) {
    log(`Error generating reports: ${error}`, 'error');
    process.exit(1);
  }
}

/**
 * Get scan results from the specified period
 * @param {string} period - Time period (day, week, month, quarter, year)
 * @returns {Array} Scan results
 */
function getScanResults(period) {
  log(`Getting scan results for period: ${period}`);
  
  // Get all scan files
  const files = fs.readdirSync(SCAN_RESULTS_DIR)
    .filter(file => file.startsWith('scan-') && file.endsWith('.json'))
    .sort();
  
  if (files.length === 0) {
    return [];
  }
  
  // Calculate cutoff date
  const cutoffDate = getCutoffDate(period);
  
  // Filter and load scan results
  const scanResults = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(SCAN_RESULTS_DIR, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const scanResult = JSON.parse(data);
      
      // Check if scan is within the specified period
      const scanDate = new Date(scanResult.timestamp);
      
      if (scanDate >= cutoffDate) {
        scanResults.push(scanResult);
      }
    } catch (error) {
      log(`Error reading scan result file ${file}: ${error}`, 'warning');
    }
  }
  
  return scanResults;
}

/**
 * Get security logs from the specified period
 * @param {string} period - Time period (day, week, month, quarter, year)
 * @returns {Array} Security logs
 */
function getSecurityLogs(period) {
  log(`Getting security logs for period: ${period}`);
  
  if (!fs.existsSync(SECURITY_LOG_FILE)) {
    return [];
  }
  
  // Read security log file
  const logContent = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
  const logLines = logContent.split('\n').filter(line => line.trim() !== '');
  
  // Calculate cutoff date
  const cutoffDate = getCutoffDate(period);
  
  // Parse and filter log entries
  const logs = [];
  
  for (const line of logLines) {
    // Parse timestamp from log line, assuming format: [2023-04-01T12:00:00.000Z] [INFO] Message
    const timestampMatch = line.match(/\[(.*?)\]/);
    
    if (timestampMatch && timestampMatch[1]) {
      try {
        const timestamp = new Date(timestampMatch[1]);
        
        // Check if log is within the specified period
        if (timestamp >= cutoffDate) {
          // Parse log level/type
          const typeMatch = line.match(/\[.*?\]\s+\[(.*?)\]/);
          const type = typeMatch ? typeMatch[1] : 'UNKNOWN';
          
          // Parse message
          const messageMatch = line.match(/\[.*?\]\s+\[.*?\]\s+(.*)/);
          const message = messageMatch ? messageMatch[1] : line;
          
          logs.push({
            timestamp,
            type,
            message
          });
        }
      } catch (error) {
        // Skip lines with invalid timestamps
      }
    }
  }
  
  return logs;
}

/**
 * Get security statistics
 * @returns {Object} Security statistics
 */
function getSecurityStats() {
  if (!fs.existsSync(STATS_FILE)) {
    return null;
  }
  
  try {
    const statsData = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(statsData);
  } catch (error) {
    log(`Error reading security stats: ${error}`, 'warning');
    return null;
  }
}

/**
 * Generate an executive summary report
 * @param {Array} scanResults - Scan results
 * @param {Array} securityLogs - Security logs
 * @param {Object} securityStats - Security statistics
 */
function generateExecutiveSummary(scanResults, securityLogs, securityStats) {
  log('Generating executive summary report...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(options.output, `security-executive-summary-${timestamp}.md`);
  
  // Calculate summary statistics
  const stats = calculateSummaryStats(scanResults, securityLogs);
  
  // Calculate current security posture score
  const securityScore = calculateSecurityScore(stats);
  
  let reportContent = `# Security Executive Summary
  
**Report Date**: ${new Date().toLocaleString()}
**Period**: ${options.period}
**Security Posture Score**: ${securityScore.score}/100 (${securityScore.rating})

## Executive Overview

This security executive summary provides an overview of the application's security posture for the specified period. The security score is calculated based on the number and severity of detected vulnerabilities, security incidents, and remediation efforts.

## Summary Metrics

- **Security Scans Conducted**: ${stats.scanCount}
- **Total Vulnerabilities**: ${stats.totalVulnerabilities}
  - Critical: ${stats.criticalVulnerabilities}
  - High: ${stats.highVulnerabilities}
  - Medium: ${stats.mediumVulnerabilities}
  - Low: ${stats.lowVulnerabilities}
- **Security Incidents**: ${stats.securityIncidents}
- **Remediated Issues**: ${stats.remediatedIssues}

## Risk Assessment

The current security risk level is **${securityScore.riskLevel}**.

${getSecurityRecommendations(stats, securityScore)}

## Compliance Status

${getComplianceStatus(scanResults)}

## Trends

`;

  // Add trend information if available
  if (securityStats && securityStats.trends) {
    reportContent += `Security vulnerability trends over time:\n\n`;
    
    if (securityStats.trends.total.length > 1) {
      const oldestCount = securityStats.trends.total[0].count;
      const newestCount = securityStats.trends.total[securityStats.trends.total.length - 1].count;
      const trend = newestCount > oldestCount ? 'increasing' : newestCount < oldestCount ? 'decreasing' : 'stable';
      
      reportContent += `- Total vulnerabilities are **${trend}**\n`;
    }
    
    // Add critical/high trends
    if (securityStats.trends.critical.length > 1) {
      const oldestCount = securityStats.trends.critical[0].count;
      const newestCount = securityStats.trends.critical[securityStats.trends.critical.length - 1].count;
      const trend = newestCount > oldestCount ? 'increasing' : newestCount < oldestCount ? 'decreasing' : 'stable';
      
      reportContent += `- Critical vulnerabilities are **${trend}**\n`;
    }
    
    if (securityStats.trends.high.length > 1) {
      const oldestCount = securityStats.trends.high[0].count;
      const newestCount = securityStats.trends.high[securityStats.trends.high.length - 1].count;
      const trend = newestCount > oldestCount ? 'increasing' : newestCount < oldestCount ? 'decreasing' : 'stable';
      
      reportContent += `- High vulnerabilities are **${trend}**\n`;
    }
  } else {
    reportContent += `Insufficient data available for trend analysis.\n`;
  }
  
  // Add next steps
  reportContent += `
## Next Steps and Recommendations

1. **Address Critical Vulnerabilities**: ${stats.criticalVulnerabilities > 0 ? `Immediately remediate the ${stats.criticalVulnerabilities} critical vulnerabilities` : 'Continue maintaining zero critical vulnerabilities'}
2. **Security Testing**: Schedule regular security testing and scans
3. **Training**: Ensure development team is trained on secure coding practices
4. **Policy Review**: Review and update security policies and procedures
5. **Automated Scanning**: Implement automated security scanning in the CI/CD pipeline

## Conclusion

${getExecutiveSummaryConclusion(stats, securityScore)}
`;

  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  log(`Executive summary report generated: ${reportPath}`);
}

/**
 * Generate a detailed technical report
 * @param {Array} scanResults - Scan results
 * @param {Array} securityLogs - Security logs
 * @param {Object} securityStats - Security statistics
 */
function generateTechnicalReport(scanResults, securityLogs, securityStats) {
  log('Generating technical report...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(options.output, `security-technical-report-${timestamp}.md`);
  
  // Get most recent scan result
  const latestScan = scanResults.length > 0 ? 
    scanResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : 
    null;
  
  let reportContent = `# Security Technical Report
  
**Report Date**: ${new Date().toLocaleString()}
**Period**: ${options.period}
**Latest Scan Date**: ${latestScan ? new Date(latestScan.timestamp).toLocaleString() : 'No recent scans'}

## Overview

This technical security report provides detailed information about the security vulnerabilities, incidents, and recommendations for the application.

`;

  // Add scan results section
  reportContent += `## Scan Results\n\n`;
  
  if (scanResults.length === 0) {
    reportContent += `No security scans were conducted during the specified period.\n\n`;
  } else {
    reportContent += `${scanResults.length} security scans were conducted during the specified period.\n\n`;
    
    // Add details from the latest scan
    if (latestScan) {
      reportContent += `### Latest Scan Summary (${new Date(latestScan.timestamp).toLocaleString()})\n\n`;
      reportContent += `- **Total Issues**: ${latestScan.totalIssues || 0}\n`;
      reportContent += `- **Critical Issues**: ${latestScan.criticalIssues || 0}\n`;
      reportContent += `- **High Issues**: ${latestScan.highIssues || 0}\n`;
      reportContent += `- **Medium Issues**: ${latestScan.mediumIssues || 0}\n`;
      reportContent += `- **Low Issues**: ${latestScan.lowIssues || 0}\n\n`;
      
      // Add vulnerability details
      if (latestScan.vulnerabilities && latestScan.vulnerabilities.length > 0) {
        reportContent += `### Vulnerabilities\n\n`;
        
        // Group by severity
        const bySeverity = {
          critical: [],
          high: [],
          medium: [],
          low: []
        };
        
        latestScan.vulnerabilities.forEach(vuln => {
          if (!bySeverity[vuln.severity]) {
            bySeverity[vuln.severity] = [];
          }
          bySeverity[vuln.severity].push(vuln);
        });
        
        // Add each severity section
        ['critical', 'high', 'medium', 'low'].forEach(severity => {
          const vulns = bySeverity[severity];
          if (vulns && vulns.length > 0) {
            reportContent += `#### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues (${vulns.length})\n\n`;
            
            vulns.forEach((vuln, i) => {
              reportContent += `${i + 1}. **${vuln.description}**\n`;
              if (vuln.location) {
                reportContent += `   - **Location**: \`${vuln.location}\`\n`;
              }
              if (vuln.recommendation) {
                reportContent += `   - **Recommendation**: ${vuln.recommendation}\n`;
              }
              reportContent += '\n';
            });
          }
        });
      }
    }
  }
  
  // Add security logs section
  reportContent += `## Security Logs\n\n`;
  
  if (securityLogs.length === 0) {
    reportContent += `No security logs were recorded during the specified period.\n\n`;
  } else {
    reportContent += `${securityLogs.length} security log entries were recorded during the specified period.\n\n`;
    
    // Group logs by type
    const logsByType = {};
    
    securityLogs.forEach(log => {
      if (!logsByType[log.type]) {
        logsByType[log.type] = [];
      }
      logsByType[log.type].push(log);
    });
    
    // Add each log type section
    for (const [type, logs] of Object.entries(logsByType)) {
      reportContent += `### ${type} Logs (${logs.length})\n\n`;
      
      // Show up to 10 most recent logs of each type
      const recentLogs = logs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      recentLogs.forEach((log, i) => {
        reportContent += `${i + 1}. **[${log.timestamp.toLocaleString()}]** ${log.message}\n\n`;
      });
      
      if (logs.length > 10) {
        reportContent += `*...and ${logs.length - 10} more ${type} logs*\n\n`;
      }
    }
  }
  
  // Add security statistics section
  reportContent += `## Security Statistics\n\n`;
  
  if (securityStats) {
    reportContent += `Last Updated: ${new Date(securityStats.lastUpdated).toLocaleString()}\n\n`;
    
    if (securityStats.scans && securityStats.scans.length > 0) {
      // Calculate statistics
      const scanStats = {
        total: securityStats.scans.length,
        avgCritical: average(securityStats.scans.map(s => s.criticalIssues || 0)),
        avgHigh: average(securityStats.scans.map(s => s.highIssues || 0)),
        avgMedium: average(securityStats.scans.map(s => s.mediumIssues || 0)),
        avgLow: average(securityStats.scans.map(s => s.lowIssues || 0)),
        avgTotal: average(securityStats.scans.map(s => s.totalIssues || 0))
      };
      
      reportContent += `### Scan Statistics\n\n`;
      reportContent += `- **Total Scans**: ${scanStats.total}\n`;
      reportContent += `- **Average Issues per Scan**:\n`;
      reportContent += `  - Critical: ${scanStats.avgCritical.toFixed(1)}\n`;
      reportContent += `  - High: ${scanStats.avgHigh.toFixed(1)}\n`;
      reportContent += `  - Medium: ${scanStats.avgMedium.toFixed(1)}\n`;
      reportContent += `  - Low: ${scanStats.avgLow.toFixed(1)}\n`;
      reportContent += `  - Total: ${scanStats.avgTotal.toFixed(1)}\n\n`;
    }
    
    // Add trend information
    if (securityStats.trends) {
      reportContent += `### Security Trends\n\n`;
      
      reportContent += `The following trends are based on the last ${securityStats.trends.total.length} scans:\n\n`;
      
      // Function to describe trend
      function describeTrend(trend) {
        if (trend.length < 2) return 'Insufficient data';
        
        const first = trend[0].count;
        const last = trend[trend.length - 1].count;
        const diff = last - first;
        const percent = first === 0 ? 'N/A' : `${Math.abs((diff / first) * 100).toFixed(1)}%`;
        
        if (diff > 0) {
          return `Increasing by ${percent}`;
        } else if (diff < 0) {
          return `Decreasing by ${percent}`;
        } else {
          return 'Stable';
        }
      }
      
      reportContent += `- **Critical Issues**: ${describeTrend(securityStats.trends.critical)}\n`;
      reportContent += `- **High Issues**: ${describeTrend(securityStats.trends.high)}\n`;
      reportContent += `- **Medium Issues**: ${describeTrend(securityStats.trends.medium)}\n`;
      reportContent += `- **Low Issues**: ${describeTrend(securityStats.trends.low)}\n`;
      reportContent += `- **Total Issues**: ${describeTrend(securityStats.trends.total)}\n\n`;
    }
  } else {
    reportContent += `No security statistics available.\n\n`;
  }
  
  // Add recommendations section
  reportContent += `## Technical Recommendations\n\n`;
  
  // Gather all recommendations from vulnerabilities
  const recommendations = new Map();
  
  if (latestScan && latestScan.vulnerabilities) {
    latestScan.vulnerabilities.forEach(vuln => {
      if (vuln.recommendation) {
        const key = vuln.recommendation.trim();
        const existing = recommendations.get(key) || { count: 0, severity: vuln.severity };
        existing.count += 1;
        
        // Upgrade severity if needed
        const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityRank[vuln.severity] > severityRank[existing.severity]) {
          existing.severity = vuln.severity;
        }
        
        recommendations.set(key, existing);
      }
    });
  }
  
  // Sort recommendations by severity then count
  const sortedRecommendations = Array.from(recommendations.entries())
    .sort((a, b) => {
      const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
      const severityDiff = severityRank[b[1].severity] - severityRank[a[1].severity];
      
      if (severityDiff !== 0) {
        return severityDiff;
      }
      
      return b[1].count - a[1].count;
    });
  
  if (sortedRecommendations.length > 0) {
    sortedRecommendations.forEach(([recommendation, details], i) => {
      reportContent += `${i + 1}. **${recommendation}** [${details.severity.toUpperCase()}, ${details.count} issues]\n\n`;
    });
  } else {
    reportContent += `No specific recommendations available based on the latest scan.\n\n`;
    
    // Add general recommendations
    reportContent += `### General Security Recommendations\n\n`;
    reportContent += `1. Implement regular security scanning in the CI/CD pipeline\n`;
    reportContent += `2. Update dependencies regularly to avoid security vulnerabilities\n`;
    reportContent += `3. Validate all user input to prevent injection attacks\n`;
    reportContent += `4. Use HTTPS for all communications\n`;
    reportContent += `5. Implement proper error handling to avoid leaking sensitive information\n`;
    reportContent += `6. Enable security headers using helmet middleware\n`;
    reportContent += `7. Implement rate limiting to prevent brute force attacks\n`;
    reportContent += `8. Use content security policy (CSP) to prevent XSS attacks\n`;
    reportContent += `9. Securely store and manage credentials and secrets\n`;
    reportContent += `10. Regularly back up data and test restoration procedures\n\n`;
  }
  
  // Add conclusion
  reportContent += `## Conclusion\n\n`;
  reportContent += `This technical security report provides a comprehensive overview of the application's security posture. It is recommended to address all identified vulnerabilities according to their severity, with critical and high severity issues being prioritized for immediate remediation.\n\n`;
  reportContent += `Regular security scanning and monitoring should be part of the development and deployment processes to maintain a strong security posture over time.\n`;
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  log(`Technical report generated: ${reportPath}`);
}

/**
 * Generate a compliance report
 * @param {Array} scanResults - Scan results
 * @param {Array} securityLogs - Security logs
 * @param {Object} securityStats - Security statistics
 */
function generateComplianceReport(scanResults, securityLogs, securityStats) {
  log('Generating compliance report...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(options.output, `security-compliance-report-${timestamp}.md`);
  
  // Get latest scan
  const latestScan = scanResults.length > 0 ? 
    scanResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : 
    null;
  
  let reportContent = `# Security Compliance Report
  
**Report Date**: ${new Date().toLocaleString()}
**Period**: ${options.period}
**Latest Assessment Date**: ${latestScan ? new Date(latestScan.timestamp).toLocaleString() : 'No recent assessments'}

## Overview

This security compliance report assesses the application's adherence to industry security standards and best practices. It covers various compliance requirements and provides recommendations for addressing any gaps.

## Compliance Status

`;

  // Compliance frameworks
  const complianceFrameworks = [
    {
      name: 'OWASP Top 10',
      description: 'The OWASP Top 10 is a standard awareness document for developers and web application security.',
      requirements: [
        { id: 'A01', name: 'Broken Access Control', description: 'Restrictions on what authenticated users are allowed to do are often not properly enforced.' },
        { id: 'A02', name: 'Cryptographic Failures', description: 'Failures related to cryptography which often lead to sensitive data exposure or system compromise.' },
        { id: 'A03', name: 'Injection', description: 'Injection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query.' },
        { id: 'A04', name: 'Insecure Design', description: 'Insecure design refers to risks related to design and architectural flaws, with a call for more use of threat modeling, secure design patterns, and reference architectures.' },
        { id: 'A05', name: 'Security Misconfiguration', description: 'Security misconfiguration is the most commonly seen issue. This is commonly a result of insecure default configurations, incomplete or ad hoc configurations, open cloud storage, misconfigured HTTP headers, and verbose error messages containing sensitive information.' },
        { id: 'A06', name: 'Vulnerable and Outdated Components', description: 'Components, such as libraries, frameworks, and other software modules, run with the same privileges as the application. If a vulnerable component is exploited, such an attack can facilitate serious data loss or server takeover.' },
        { id: 'A07', name: 'Identification and Authentication Failures', description: 'Application functions related to authentication and session management are often implemented incorrectly, allowing attackers to compromise passwords, keys, or session tokens, or to exploit other implementation flaws to assume other users identities temporarily or permanently.' },
        { id: 'A08', name: 'Software and Data Integrity Failures', description: 'Software and data integrity failures relate to code and infrastructure that does not protect against integrity violations.' },
        { id: 'A09', name: 'Security Logging and Monitoring Failures', description: 'This category is to help detect, escalate, and respond to active breaches. Without logging and monitoring, breaches cannot be detected.' },
        { id: 'A10', name: 'Server-Side Request Forgery (SSRF)', description: 'SSRF flaws occur whenever a web application is fetching a remote resource without validating the user-supplied URL.' }
      ]
    }
  ];
  
  // Evaluate compliance for each framework
  complianceFrameworks.forEach(framework => {
    reportContent += `### ${framework.name}\n\n`;
    reportContent += `${framework.description}\n\n`;
    
    // Create compliance checklist
    reportContent += `| ID | Requirement | Status | Notes |\n`;
    reportContent += `|----|------------|--------|-------|\n`;
    
    framework.requirements.forEach(req => {
      // Determine status based on scan results
      let status = 'Unknown';
      let notes = 'Not assessed';
      
      if (latestScan && latestScan.vulnerabilities) {
        // Try to match vulnerabilities to this requirement
        const matchingVulns = latestScan.vulnerabilities.filter(vuln => {
          const lowerDesc = vuln.description.toLowerCase();
          const lowerReq = req.name.toLowerCase();
          
          return lowerDesc.includes(lowerReq) || 
                 (req.id === 'A01' && (lowerDesc.includes('access control') || lowerDesc.includes('authorization'))) ||
                 (req.id === 'A02' && (lowerDesc.includes('crypto') || lowerDesc.includes('encryption'))) ||
                 (req.id === 'A03' && (lowerDesc.includes('injection') || lowerDesc.includes('sql'))) ||
                 (req.id === 'A05' && (lowerDesc.includes('configuration') || lowerDesc.includes('header'))) ||
                 (req.id === 'A06' && (lowerDesc.includes('outdated') || lowerDesc.includes('dependency'))) ||
                 (req.id === 'A07' && (lowerDesc.includes('auth') || lowerDesc.includes('password'))) ||
                 (req.id === 'A09' && (lowerDesc.includes('log') || lowerDesc.includes('monitor')))
        });
        
        if (matchingVulns.length > 0) {
          status = '❌ Non-Compliant';
          notes = `${matchingVulns.length} related vulnerabilities detected`;
        } else {
          status = '✅ Compliant';
          notes = 'No related vulnerabilities detected';
        }
      }
      
      reportContent += `| ${req.id} | ${req.name} | ${status} | ${notes} |\n`;
    });
    
    reportContent += '\n';
  });
  
  // Additional compliance recommendations
  reportContent += `## Compliance Recommendations\n\n`;
  reportContent += `Based on the compliance assessment, the following recommendations are provided:\n\n`;
  
  if (latestScan && latestScan.vulnerabilities && latestScan.vulnerabilities.length > 0) {
    // Group recommendations by requirement area
    const areas = {
      'Access Control': [],
      'Cryptography': [],
      'Injection Prevention': [],
      'Configuration': [],
      'Dependencies': [],
      'Authentication': [],
      'Integrity': [],
      'Logging': [],
      'Other': []
    };
    
    latestScan.vulnerabilities.forEach(vuln => {
      if (!vuln.recommendation) return;
      
      const lowerDesc = vuln.description.toLowerCase();
      
      if (lowerDesc.includes('access control') || lowerDesc.includes('authorization')) {
        areas['Access Control'].push(vuln);
      } else if (lowerDesc.includes('crypto') || lowerDesc.includes('encryption')) {
        areas['Cryptography'].push(vuln);
      } else if (lowerDesc.includes('injection') || lowerDesc.includes('sql')) {
        areas['Injection Prevention'].push(vuln);
      } else if (lowerDesc.includes('configuration') || lowerDesc.includes('header')) {
        areas['Configuration'].push(vuln);
      } else if (lowerDesc.includes('outdated') || lowerDesc.includes('dependency')) {
        areas['Dependencies'].push(vuln);
      } else if (lowerDesc.includes('auth') || lowerDesc.includes('password')) {
        areas['Authentication'].push(vuln);
      } else if (lowerDesc.includes('integrity')) {
        areas['Integrity'].push(vuln);
      } else if (lowerDesc.includes('log') || lowerDesc.includes('monitor')) {
        areas['Logging'].push(vuln);
      } else {
        areas['Other'].push(vuln);
      }
    });
    
    // Add recommendations for each area
    for (const [area, vulns] of Object.entries(areas)) {
      if (vulns.length === 0) continue;
      
      reportContent += `### ${area} Recommendations\n\n`;
      
      vulns.forEach((vuln, i) => {
        reportContent += `${i + 1}. **${vuln.recommendation}** (${vuln.severity})\n`;
        reportContent += `   - Related to: ${vuln.description}\n`;
        if (vuln.location) {
          reportContent += `   - Location: ${vuln.location}\n`;
        }
        reportContent += '\n';
      });
    }
  } else {
    reportContent += `No specific compliance recommendations available based on the latest scan.\n\n`;
    
    // Add general compliance recommendations
    reportContent += `### General Compliance Recommendations\n\n`;
    reportContent += `1. **Regular Security Assessments**: Conduct regular security assessments and penetration testing\n`;
    reportContent += `2. **Security Training**: Provide security awareness training for all developers\n`;
    reportContent += `3. **Policy Documentation**: Maintain up-to-date security policies and procedures\n`;
    reportContent += `4. **Incident Response**: Develop and test an incident response plan\n`;
    reportContent += `5. **Change Management**: Implement a secure change management process\n`;
    reportContent += `6. **Risk Assessment**: Conduct regular risk assessments\n`;
    reportContent += `7. **Vendor Management**: Evaluate the security of third-party vendors and services\n\n`;
  }
  
  // Add compliance frameworks section
  reportContent += `## Compliance Frameworks\n\n`;
  reportContent += `The application should adhere to relevant compliance frameworks based on its purpose and the data it handles. Consider evaluating compliance with the following frameworks as appropriate:\n\n`;
  reportContent += `- **GDPR**: For applications handling personal data of EU residents\n`;
  reportContent += `- **HIPAA**: For applications handling protected health information in the US\n`;
  reportContent += `- **PCI DSS**: For applications processing, storing or transmitting credit card data\n`;
  reportContent += `- **SOC 2**: For service organizations handling customer data\n`;
  reportContent += `- **ISO 27001**: For organizations implementing information security management systems\n`;
  reportContent += `- **NIST 800-53**: For federal information systems and organizations\n\n`;
  
  // Add conclusion
  reportContent += `## Conclusion\n\n`;
  reportContent += `This compliance report provides an assessment of the application's adherence to security best practices and standards. Regular compliance assessments should be conducted to ensure ongoing security posture improvement.\n\n`;
  reportContent += `The recommendations provided should be implemented according to their risk level and business impact, with high-risk issues being prioritized for immediate remediation.\n`;
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  log(`Compliance report generated: ${reportPath}`);
}

/**
 * Generate a security trends report
 * @param {Array} scanResults - Scan results
 * @param {Array} securityLogs - Security logs
 * @param {Object} securityStats - Security statistics
 */
function generateTrendsReport(scanResults, securityLogs, securityStats) {
  log('Generating trends report...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(options.output, `security-trends-report-${timestamp}.md`);
  
  let reportContent = `# Security Trends Report
  
**Report Date**: ${new Date().toLocaleString()}
**Period**: ${options.period}

## Overview

This report analyzes security trends over the specified time period, identifying patterns and changes in the application's security posture.

`;

  // Check if we have enough data for trends
  if (scanResults.length < 2) {
    reportContent += `Insufficient scan data available for trend analysis. At least two scans are required.\n\n`;
  } else {
    // Sort scan results by timestamp
    const sortedScans = scanResults.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate trends
    reportContent += `## Vulnerability Trends\n\n`;
    reportContent += `Based on ${sortedScans.length} scans conducted during the period:\n\n`;
    
    // Create a table of scan results
    reportContent += `| Scan Date | Critical | High | Medium | Low | Total |\n`;
    reportContent += `|-----------|----------|------|--------|-----|-------|\n`;
    
    sortedScans.forEach(scan => {
      const date = new Date(scan.timestamp).toLocaleDateString();
      reportContent += `| ${date} | ${scan.criticalIssues || 0} | ${scan.highIssues || 0} | ${scan.mediumIssues || 0} | ${scan.lowIssues || 0} | ${scan.totalIssues || 0} |\n`;
    });
    
    reportContent += '\n';
    
    // Calculate and display trend direction
    const firstScan = sortedScans[0];
    const lastScan = sortedScans[sortedScans.length - 1];
    
    const trendDirections = {
      critical: getTrendDirection(firstScan.criticalIssues || 0, lastScan.criticalIssues || 0),
      high: getTrendDirection(firstScan.highIssues || 0, lastScan.highIssues || 0),
      medium: getTrendDirection(firstScan.mediumIssues || 0, lastScan.mediumIssues || 0),
      low: getTrendDirection(firstScan.lowIssues || 0, lastScan.lowIssues || 0),
      total: getTrendDirection(firstScan.totalIssues || 0, lastScan.totalIssues || 0)
    };
    
    reportContent += `### Trend Analysis\n\n`;
    reportContent += `- **Critical Issues**: ${trendDirections.critical.emoji} ${trendDirections.critical.description}\n`;
    reportContent += `- **High Issues**: ${trendDirections.high.emoji} ${trendDirections.high.description}\n`;
    reportContent += `- **Medium Issues**: ${trendDirections.medium.emoji} ${trendDirections.medium.description}\n`;
    reportContent += `- **Low Issues**: ${trendDirections.low.emoji} ${trendDirections.low.description}\n`;
    reportContent += `- **Total Issues**: ${trendDirections.total.emoji} ${trendDirections.total.description}\n\n`;
    
    // Add security score trend
    const firstScore = calculateSecurityScore({
      criticalVulnerabilities: firstScan.criticalIssues || 0,
      highVulnerabilities: firstScan.highIssues || 0,
      mediumVulnerabilities: firstScan.mediumIssues || 0,
      lowVulnerabilities: firstScan.lowIssues || 0
    });
    
    const lastScore = calculateSecurityScore({
      criticalVulnerabilities: lastScan.criticalIssues || 0,
      highVulnerabilities: lastScan.highIssues || 0,
      mediumVulnerabilities: lastScan.mediumIssues || 0,
      lowVulnerabilities: lastScan.lowIssues || 0
    });
    
    const scoreTrend = getTrendDirection(firstScore.score, lastScore.score);
    
    reportContent += `### Security Score Trend\n\n`;
    reportContent += `- **Initial Security Score**: ${firstScore.score}/100 (${firstScore.rating})\n`;
    reportContent += `- **Current Security Score**: ${lastScore.score}/100 (${lastScore.rating})\n`;
    reportContent += `- **Trend**: ${scoreTrend.emoji} ${scoreTrend.description}\n\n`;
  }
  
  // Add security log trends
  if (securityLogs.length > 0) {
    reportContent += `## Security Event Trends\n\n`;
    
    // Group logs by day
    const logsByDay = {};
    securityLogs.forEach(log => {
      const day = log.timestamp.toISOString().split('T')[0];
      if (!logsByDay[day]) {
        logsByDay[day] = [];
      }
      logsByDay[day].push(log);
    });
    
    // Count logs by type and day
    const countsByTypeAndDay = {};
    Object.entries(logsByDay).forEach(([day, logs]) => {
      logs.forEach(log => {
        if (!countsByTypeAndDay[log.type]) {
          countsByTypeAndDay[log.type] = {};
        }
        countsByTypeAndDay[log.type][day] = (countsByTypeAndDay[log.type][day] || 0) + 1;
      });
    });
    
    // Create a table of log counts by day and type
    reportContent += `### Security Events by Day\n\n`;
    
    const days = Object.keys(logsByDay).sort();
    const types = Object.keys(countsByTypeAndDay).sort();
    
    if (days.length > 0 && types.length > 0) {
      reportContent += `| Day | ${types.join(' | ')} | Total |\n`;
      reportContent += `|-----|${types.map(() => '-----').join('|')}|-------|\n`;
      
      days.forEach(day => {
        const typeCounts = types.map(type => countsByTypeAndDay[type][day] || 0);
        const totalCount = typeCounts.reduce((sum, count) => sum + count, 0);
        reportContent += `| ${day} | ${typeCounts.join(' | ')} | ${totalCount} |\n`;
      });
      
      reportContent += '\n';
      
      // Analyze trends in security events
      reportContent += `### Security Event Analysis\n\n`;
      
      // Calculate average events per day
      const totalDays = days.length;
      const typeAverages = {};
      
      types.forEach(type => {
        const totalEvents = Object.values(countsByTypeAndDay[type]).reduce((sum, count) => sum + count, 0);
        typeAverages[type] = totalEvents / totalDays;
      });
      
      // Report on each type
      types.forEach(type => {
        const events = Object.entries(countsByTypeAndDay[type])
          .sort(([dayA], [dayB]) => dayA.localeCompare(dayB));
        
        if (events.length >= 2) {
          const firstDay = events[0][0];
          const firstCount = events[0][1];
          const lastDay = events[events.length - 1][0];
          const lastCount = events[events.length - 1][1];
          
          const trend = getTrendDirection(firstCount, lastCount);
          
          reportContent += `- **${type} Events**: ${trend.emoji} ${trend.description}, averaging ${typeAverages[type].toFixed(1)} per day\n`;
        } else {
          reportContent += `- **${type} Events**: Insufficient data for trend analysis, averaging ${typeAverages[type].toFixed(1)} per day\n`;
        }
      });
      
      reportContent += '\n';
    } else {
      reportContent += `No security events recorded during the specified period.\n\n`;
    }
  } else {
    reportContent += `## Security Event Trends\n\n`;
    reportContent += `No security event logs available for trend analysis.\n\n`;
  }
  
  // Add security stats trends if available
  if (securityStats && securityStats.trends) {
    reportContent += `## Long-Term Security Trends\n\n`;
    
    if (Object.values(securityStats.trends).some(trend => trend.length >= 2)) {
      reportContent += `Based on historical security data:\n\n`;
      
      ['Critical', 'High', 'Medium', 'Low', 'Total'].forEach(severity => {
        const key = severity.toLowerCase();
        
        if (securityStats.trends[key] && securityStats.trends[key].length >= 2) {
          const trend = securityStats.trends[key];
          const firstPoint = trend[0];
          const lastPoint = trend[trend.length - 1];
          
          const trendDir = getTrendDirection(firstPoint.count, lastPoint.count);
          
          reportContent += `- **${severity} Issues**: ${trendDir.emoji} ${trendDir.description} over the last ${trend.length} scans\n`;
        }
      });
      
      reportContent += '\n';
    } else {
      reportContent += `Insufficient historical data for long-term trend analysis.\n\n`;
    }
  }
  
  // Add recommendations based on trends
  reportContent += `## Recommendations Based on Trends\n\n`;
  
  if (scanResults.length >= 2) {
    const sortedScans = scanResults.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const firstScan = sortedScans[0];
    const lastScan = sortedScans[sortedScans.length - 1];
    
    const trendDirections = {
      critical: getTrendDirection(firstScan.criticalIssues || 0, lastScan.criticalIssues || 0),
      high: getTrendDirection(firstScan.highIssues || 0, lastScan.highIssues || 0),
      medium: getTrendDirection(firstScan.mediumIssues || 0, lastScan.mediumIssues || 0),
      low: getTrendDirection(firstScan.lowIssues || 0, lastScan.lowIssues || 0),
      total: getTrendDirection(firstScan.totalIssues || 0, lastScan.totalIssues || 0)
    };
    
    // Generate recommendations based on trends
    if (trendDirections.critical.trend === 'increasing' || trendDirections.high.trend === 'increasing') {
      reportContent += `1. **Urgent Security Review**: The ${trendDirections.critical.trend === 'increasing' ? 'critical' : 'high'} severity issues are increasing. Conduct an urgent security review.\n`;
      reportContent += `2. **Security Training**: Provide additional security training for the development team.\n`;
      reportContent += `3. **Code Review Process**: Strengthen the code review process to catch security issues earlier.\n`;
    } else if (trendDirections.critical.trend === 'decreasing' && trendDirections.high.trend === 'decreasing') {
      reportContent += `1. **Maintain Progress**: Continue the current security practices as they are effectively reducing critical and high issues.\n`;
      reportContent += `2. **Focus on Medium Issues**: Shift focus to addressing medium severity issues next.\n`;
      reportContent += `3. **Document Success**: Document the successful strategies for future reference.\n`;
    } else {
      reportContent += `1. **Balanced Approach**: Address both new and existing security issues with a balanced approach.\n`;
      reportContent += `2. **Regular Scanning**: Continue regular security scanning and monitoring.\n`;
      reportContent += `3. **Preventive Measures**: Implement preventive measures to avoid introduction of new security issues.\n`;
    }
    
    reportContent += `4. **Security Metrics**: Track security metrics over time to measure progress.\n`;
    reportContent += `5. **Automated Testing**: Implement automated security testing in the CI/CD pipeline.\n\n`;
  } else {
    reportContent += `Insufficient data for trend-based recommendations. Consider implementing the following general security best practices:\n\n`;
    reportContent += `1. **Regular Security Scanning**: Establish a regular schedule for security scanning.\n`;
    reportContent += `2. **Security Metrics**: Define and track security metrics over time.\n`;
    reportContent += `3. **Automated Testing**: Implement automated security testing in the CI/CD pipeline.\n`;
    reportContent += `4. **Security Training**: Provide security awareness training for all developers.\n`;
    reportContent += `5. **Code Review**: Include security considerations in code reviews.\n\n`;
  }
  
  // Add conclusion
  reportContent += `## Conclusion\n\n`;
  reportContent += `This security trends report provides an analysis of security patterns over time. Regular monitoring of security trends is essential for maintaining and improving the application's security posture.\n\n`;
  reportContent += `By tracking these trends, the team can identify areas of improvement and measure the effectiveness of security initiatives over time.\n`;
  
  // Write report to file
  fs.writeFileSync(reportPath, reportContent);
  log(`Trends report generated: ${reportPath}`);
}

/**
 * Calculate summary statistics from scan results and logs
 * @param {Array} scanResults - Scan results
 * @param {Array} securityLogs - Security logs
 * @returns {Object} Summary statistics
 */
function calculateSummaryStats(scanResults, securityLogs) {
  const stats = {
    scanCount: scanResults.length,
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    mediumVulnerabilities: 0,
    lowVulnerabilities: 0,
    securityIncidents: 0,
    remediatedIssues: 0
  };
  
  // Get latest scan result
  const latestScan = scanResults.length > 0 ? 
    scanResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : 
    null;
  
  if (latestScan) {
    stats.totalVulnerabilities = latestScan.totalIssues || 0;
    stats.criticalVulnerabilities = latestScan.criticalIssues || 0;
    stats.highVulnerabilities = latestScan.highIssues || 0;
    stats.mediumVulnerabilities = latestScan.mediumIssues || 0;
    stats.lowVulnerabilities = latestScan.lowIssues || 0;
  }
  
  // Count security incidents from logs
  if (securityLogs.length > 0) {
    stats.securityIncidents = securityLogs.filter(log => {
      const type = log.type.toLowerCase();
      return type.includes('incident') || 
             type.includes('attack') || 
             type.includes('critical') || 
             type.includes('breach');
    }).length;
  }
  
  // Calculate remediated issues if we have multiple scans
  if (scanResults.length >= 2) {
    const sortedScans = scanResults.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const firstScan = sortedScans[0];
    const lastScan = sortedScans[sortedScans.length - 1];
    
    const firstTotal = firstScan.totalIssues || 0;
    const lastTotal = lastScan.totalIssues || 0;
    
    if (firstTotal > lastTotal) {
      stats.remediatedIssues = firstTotal - lastTotal;
    }
  }
  
  return stats;
}

/**
 * Calculate security score based on vulnerabilities
 * @param {Object} stats - Summary statistics
 * @returns {Object} Security score and rating
 */
function calculateSecurityScore(stats) {
  // Calculate score (100 - weighted vulnerabilities)
  let score = 100;
  
  // Deduct points based on severity
  score -= stats.criticalVulnerabilities * 15;
  score -= stats.highVulnerabilities * 8;
  score -= stats.mediumVulnerabilities * 3;
  score -= stats.lowVulnerabilities * 1;
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  // Determine rating and risk level
  let rating, riskLevel;
  
  if (score >= 90) {
    rating = 'Excellent';
    riskLevel = 'Low';
  } else if (score >= 80) {
    rating = 'Good';
    riskLevel = 'Low to Medium';
  } else if (score >= 70) {
    rating = 'Fair';
    riskLevel = 'Medium';
  } else if (score >= 60) {
    rating = 'Poor';
    riskLevel = 'Medium to High';
  } else if (score >= 40) {
    rating = 'Bad';
    riskLevel = 'High';
  } else {
    rating = 'Critical';
    riskLevel = 'Critical';
  }
  
  return {
    score: Math.round(score),
    rating,
    riskLevel
  };
}

/**
 * Get security recommendations based on stats and score
 * @param {Object} stats - Summary statistics
 * @param {Object} score - Security score
 * @returns {string} Recommendations
 */
function getSecurityRecommendations(stats, score) {
  let recommendations = '### Key Recommendations\n\n';
  
  if (stats.criticalVulnerabilities > 0) {
    recommendations += `1. **Address Critical Vulnerabilities**: Immediately address the ${stats.criticalVulnerabilities} critical vulnerabilities\n`;
  }
  
  if (stats.highVulnerabilities > 0) {
    recommendations += `${stats.criticalVulnerabilities > 0 ? '2' : '1'}. **Address High Vulnerabilities**: Prioritize fixing the ${stats.highVulnerabilities} high severity vulnerabilities\n`;
  }
  
  if (stats.securityIncidents > 0) {
    recommendations += `- **Incident Review**: Review the ${stats.securityIncidents} security incidents to identify patterns and improve defenses\n`;
  }
  
  if (score.score < 70) {
    recommendations += `- **Security Audit**: Conduct a comprehensive security audit to identify all vulnerabilities\n`;
    recommendations += `- **Security Training**: Provide security training for the development team\n`;
  }
  
  recommendations += `- **Regular Scanning**: Implement regular security scanning as part of the development process\n`;
  recommendations += `- **Automation**: Automate security testing in the CI/CD pipeline\n`;
  
  return recommendations;
}

/**
 * Get compliance status text
 * @param {Array} scanResults - Scan results
 * @returns {string} Compliance status text
 */
function getComplianceStatus(scanResults) {
  // Get latest scan
  const latestScan = scanResults.length > 0 ? 
    scanResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : 
    null;
  
  if (!latestScan) {
    return 'Compliance status cannot be determined due to lack of security scan data.';
  }
  
  const criticalIssues = latestScan.criticalIssues || 0;
  const highIssues = latestScan.highIssues || 0;
  
  if (criticalIssues > 0) {
    return `The application is **non-compliant** with security best practices due to ${criticalIssues} critical vulnerabilities.`;
  }
  
  if (highIssues > 0) {
    return `The application has **partial compliance** with security best practices, but needs to address ${highIssues} high severity vulnerabilities.`;
  }
  
  return 'The application appears to be **compliant** with core security best practices.';
}

/**
 * Get executive summary conclusion
 * @param {Object} stats - Summary statistics
 * @param {Object} score - Security score
 * @returns {string} Conclusion text
 */
function getExecutiveSummaryConclusion(stats, score) {
  if (score.score >= 90) {
    return 'The application currently maintains a strong security posture. Continue regular security assessments to maintain this level.';
  }
  
  if (score.score >= 70) {
    return 'The application has a reasonable security posture, but there is room for improvement. Address the identified vulnerabilities to strengthen security.';
  }
  
  return 'The application has significant security weaknesses that require immediate attention. Prioritize the remediation of critical and high severity vulnerabilities.';
}

/**
 * Get trend direction from before and after values
 * @param {number} before - Before value
 * @param {number} after - After value
 * @returns {Object} Trend direction, description and emoji
 */
function getTrendDirection(before, after) {
  const diff = after - before;
  const percentage = before === 0 ? 100 : Math.round((Math.abs(diff) / before) * 100);
  
  if (diff === 0) {
    return {
      trend: 'stable',
      description: 'Stable (no change)',
      emoji: '➡️'
    };
  }
  
  if (diff > 0) {
    return {
      trend: 'increasing',
      description: `Increasing by ${percentage}%`,
      emoji: '⬆️'
    };
  }
  
  return {
    trend: 'decreasing',
    description: `Decreasing by ${percentage}%`,
    emoji: '⬇️'
  };
}

/**
 * Calculate cutoff date based on period
 * @param {string} period - Time period (day, week, month, quarter, year)
 * @returns {Date} Cutoff date
 */
function getCutoffDate(period) {
  const now = new Date();
  
  switch (period.toLowerCase()) {
    case 'day':
      return new Date(now.setDate(now.getDate() - 1));
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1)); // Default to month
  }
}

/**
 * Calculate average of an array of numbers
 * @param {Array} numbers - Array of numbers
 * @returns {number} Average
 */
function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

// Generate reports
generateReports();