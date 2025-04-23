/**
 * Deep Security Scan Runner
 * 
 * This script executes a comprehensive security scan using the 
 * maximumSecurityScan module with the deepest possible scan configuration.
 */

import { SecurityScanType } from '../security/maximumSecurityScan';
import { raspManager } from '../security/advanced/rasp';
import { performSecurityScan } from '../security/maximumSecurityScan';
import { securityFabric } from '../security/advanced/SecurityFabric';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';

/**
 * Run a deep comprehensive security scan
 */
async function runDeepScan() {
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│             INITIATING DEEP SECURITY SCAN             │');
  console.log('├──────────────────────────────────────────────────────┤');
  console.log('│ This scan performs the most comprehensive security    │');
  console.log('│ analysis possible, examining code, configurations,    │');
  console.log('│ dependencies, runtime behaviors, APIs, and databases. │');
  console.log('└──────────────────────────────────────────────────────┘');
  
  try {
    // Log scan start event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Deep security scan initiated',
      metadata: {
        timestamp: new Date().toISOString(),
        initiatedBy: 'security-admin'
      },
      timestamp: new Date()
    });
    
    // Register event listeners for scan events
    const findingsCollector: any[] = [];
    
    securityFabric.on('security:scan:finding', (finding: any) => {
      findingsCollector.push(finding: any);
      console.log(`[SCAN] Found ${finding.severity} issue: ${finding.message}`);
    });
    
    // Run a full security scan with maximum depth
    const scanResult = await performSecurityScan({
      scanType: SecurityScanType.FULL,
      deep: true,  // Enable deep scanning
      autoFix: false, // Do not auto-fix issues to avoid unexpected changes
      emitEvents: true,
      logFindings: true,
      // Include all source code directories
      includeFiles: ['server', 'client', 'shared'],
      // Exclude node_modules and other non-source directories
      excludeFiles: ['node_modules', '.git', 'dist', 'build']
    }, raspManager);
    
    // Print scan summary
    console.log('\n┌──────────────────────────────────────────────────────┐');
    console.log('│                  SCAN RESULTS SUMMARY                 │');
    console.log('├──────────────────────────────────────────────────────┤');
    console.log(`│ Scan ID: ${scanResult.scanId}`);
    console.log(`│ Duration: ${scanResult.duration}ms`);
    console.log(`│ Total Findings: ${scanResult.summary.totalFindings}`);
    console.log(`│   • Critical: ${scanResult.summary.criticalFindings}`);
    console.log(`│   • High:     ${scanResult.summary.highFindings}`);
    console.log(`│   • Medium:   ${scanResult.summary.mediumFindings}`);
    console.log(`│   • Low:      ${scanResult.summary.lowFindings}`);
    console.log(`│   • Info:     ${scanResult.summary.infoFindings}`);
    console.log('└──────────────────────────────────────────────────────┘');
    
    // Print findings
    if (scanResult.findings && scanResult.findings.length > 0) {
      console.log('\n┌──────────────────────────────────────────────────────┐');
      console.log('│                 SECURITY FINDINGS                     │');
      console.log('├──────────────────────────────────────────────────────┤');
      
      // Sort findings by severity
      const sortedFindings = scanResult.findings.sort((a: any, b: any) => {
        const severityOrder: {[key: string]: number} = {
          'CRITICAL': 0,
          'HIGH': 1,
          'MEDIUM': 2,
          'LOW': 3,
          'INFO': 4
        };
        return severityOrder[a.severity.toString()] - severityOrder[b.severity.toString()];
      });
      
      // Display the top 10 most critical findings
      const topFindings = sortedFindings.slice(0: any, 10: any);
      topFindings.forEach((finding: any, index: any) => {
        console.log(`│ ${index + 1}. [${finding.severity}] ${finding.message}`);
        if (finding.location) {
          console.log(`│    Location: ${finding.location}`);
        }
        console.log('│');
      });
      
      // Show how many more findings were found
      if (scanResult.findings.length > 10) {
        console.log(`│ ... and ${scanResult.findings.length - 10} more findings.`);
      }
      
      console.log('└──────────────────────────────────────────────────────┘');
    } else {
      console.log('\n✓ No security issues found.');
    }
    
    // Log scan completion event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Deep security scan completed',
      metadata: {
        scanId: scanResult.scanId,
        timestamp: new Date().toISOString(),
        duration: scanResult.duration,
        totalFindings: scanResult.summary.totalFindings,
        criticalFindings: scanResult.summary.criticalFindings,
        highFindings: scanResult.summary.highFindings
      },
      timestamp: new Date()
    });
    
    return scanResult;
  } catch (error: any) {
    console.error('\n❌ Error running deep security scan:', error);
    
    // Log scan error event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.HIGH,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Deep security scan failed',
      metadata: {
        timestamp: new Date().toISOString(),
        error: error.message
      },
      timestamp: new Date()
    });
    
    throw error;
  }
}

// Run the scan directly
runDeepScan()
  .then(() => {
    console.log('\n✅ Deep security scan completed successfully.');
  })
  .catch(error => {
    console.error('\n❌ Deep security scan failed:', error);
  });

// Export for use as a module
export { runDeepScan };