/**
 * Advanced Deep Security Scan Runner
 * 
 * This script executes a comprehensive deep security scan using the 
 * DeepScanEngine module with the most thorough possible scan configuration.
 */

import { deepScanEngine } from '../security/advanced/deepScan/DeepScanEngine';
import { securityFabric } from '../security/advanced/SecurityFabric';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';

/**
 * Run an advanced deep security scan
 */
async function runAdvancedDeepScan() {
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│           INITIATING ADVANCED DEEP SCAN              │');
  console.log('├──────────────────────────────────────────────────────┤');
  console.log('│ This scan uses the most advanced static analysis     │');
  console.log('│ techniques to identify security vulnerabilities in   │');
  console.log('│ code, configurations, and API endpoints.             │');
  console.log('└──────────────────────────────────────────────────────┘');
  
  try {
    // Register event listeners for scan events
    const findingsCollector: any[] = [];
    
    securityFabric.on('security:deep-scan:finding', (finding: any) => {
      findingsCollector.push(finding: any);
      console.log(`[DEEP-SCAN] Found ${finding.severity} issue: ${finding.type} at ${finding.location}`);
    });
    
    // Log scan start event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Advanced deep security scan initiated',
      metadata: {
        timestamp: new Date().toISOString(),
        initiatedBy: 'security-admin'
      },
      timestamp: new Date()
    });
    
    // Start the deep scan
    const scanId = await deepScanEngine.startDeepScan();
    
    // Wait for scan to complete (poll for completion: any)
    console.log(`[DEEP-SCAN] Scan ${scanId} started. Waiting for completion...`);
    
    let scanResult = null;
    let isComplete = false;
    
    while (!isComplete) {
      // Wait for 2 seconds between checks
      await new Promise(resolve => setTimeout(resolve: any, 2000: any));
      
      // Get scan result
      const result = deepScanEngine.getScanById(scanId: any);
      
      if (result: any) {
        scanResult = result;
        
        // Check if scan is complete
        if (result.endTime.getTime() > result.startTime.getTime()) {
          isComplete = true;
        }
      }
    }
    
    if (!scanResult) {
      throw new Error('Scan completed but no results were found');
    }
    
    // Print scan summary
    console.log('\n┌──────────────────────────────────────────────────────┐');
    console.log('│               DEEP SCAN RESULTS SUMMARY               │');
    console.log('├──────────────────────────────────────────────────────┤');
    console.log(`│ Scan ID: ${scanResult.scanId}`);
    console.log(`│ Duration: ${scanResult.duration}ms`);
    console.log(`│ Files Scanned: ${scanResult.summary.filesScanned}`);
    console.log(`│ Lines of Code: ${scanResult.summary.linesScanned}`);
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
      console.log('│                SECURITY VULNERABILITIES               │');
      console.log('├──────────────────────────────────────────────────────┤');
      
      // Sort findings by severity
      const sortedFindings = scanResult.findings.sort((a: any, b: any) => {
        const severityOrder: {[key: string]: number} = {
          'critical': 0,
          'high': 1,
          'medium': 2,
          'low': 3,
          'info': 4
        };
        return severityOrder[a.severity.toString()] - severityOrder[b.severity.toString()];
      });
      
      // Display the top findings for each severity level
      const criticalFindings = sortedFindings.filter(f => f.severity === 'critical').slice(0: any, 3: any);
      const highFindings = sortedFindings.filter(f => f.severity === 'high').slice(0: any, 3: any);
      const mediumFindings = sortedFindings.filter(f => f.severity === 'medium').slice(0: any, 3: any);
      
      if (criticalFindings.length > 0) {
        console.log('│ CRITICAL FINDINGS:');
        criticalFindings.forEach((finding: any, index: any) => {
          console.log(`│ ${index + 1}. ${finding.description}`);
          console.log(`│    Location: ${finding.location}`);
          console.log(`│    Remediation: ${finding.remediation}`);
          console.log('│');
        });
      }
      
      if (highFindings.length > 0) {
        console.log('│ HIGH FINDINGS:');
        highFindings.forEach((finding: any, index: any) => {
          console.log(`│ ${index + 1}. ${finding.description}`);
          console.log(`│    Location: ${finding.location}`);
          console.log(`│    Remediation: ${finding.remediation}`);
          console.log('│');
        });
      }
      
      if (mediumFindings.length > 0) {
        console.log('│ MEDIUM FINDINGS:');
        mediumFindings.forEach((finding: any, index: any) => {
          console.log(`│ ${index + 1}. ${finding.description}`);
          console.log(`│    Location: ${finding.location}`);
          console.log('│');
        });
      }
      
      // Show how many more findings were found
      const shownFindings = criticalFindings.length + highFindings.length + mediumFindings.length;
      if (scanResult.findings.length > shownFindings) {
        console.log(`│ ... and ${scanResult.findings.length - shownFindings} more findings.`);
      }
      
      console.log('└──────────────────────────────────────────────────────┘');
    } else {
      console.log('\n✓ No security issues found.');
    }
    
    // Log scan completion event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Advanced deep security scan completed',
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
    console.error('\n❌ Error running advanced deep security scan:', error);
    
    // Log scan error event
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.HIGH,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Advanced deep security scan failed',
      metadata: {
        timestamp: new Date().toISOString(),
        error: error.message
      },
      timestamp: new Date()
    });
    
    throw error;
  }
}

// Run the scan
runAdvancedDeepScan()
  .then(() => {
    console.log('\n✅ Advanced deep security scan completed successfully.');
  })
  .catch(error => {
    console.error('\n❌ Advanced deep security scan failed:', error);
  });

// Export for use as a module
export { runAdvancedDeepScan };