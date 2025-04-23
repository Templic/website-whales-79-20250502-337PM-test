// Import the Deep Scan Engine
import { deepScanEngine } from '../security/advanced/deepScan/DeepScanEngine.js';

/**
 * Run a comprehensive deep security scan
 */
async function runScan() {
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│             INITIATING DEEP SECURITY SCAN             │');
  console.log('└──────────────────────────────────────────────────────┘');
  
  try {
    // Start a deep scan with maximum settings
    const scanId = await deepScanEngine.startDeepScan();
    console.log(`Deep scan started with ID: ${scanId}`);
    
    // Wait for scan to complete - the scan runs asynchronously, 
    // but we can set up a mechanism to wait for completion
    await waitForScanCompletion(scanId);
    
    // Get scan results
    const scanResult = deepScanEngine.getScanById(scanId);
    
    if (!scanResult) {
      throw new Error(`Scan ${scanId} not found`);
    }
    
    // Print scan summary
    console.log('\n┌──────────────────────────────────────────────────────┐');
    console.log('│                  SCAN RESULTS SUMMARY                 │');
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
    if (scanResult.findings.length > 0) {
      console.log('\n┌──────────────────────────────────────────────────────┐');
      console.log('│                 SECURITY FINDINGS                     │');
      console.log('├──────────────────────────────────────────────────────┤');
      
      // Sort findings by severity
      const sortedFindings = [...scanResult.findings].sort((a, b) => {
        const severityOrder = {
          'critical': 0,
          'high': 1,
          'medium': 2,
          'low': 3,
          'info': 4
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      // Display the top critical findings
      const topFindings = sortedFindings.slice(0, 10);
      topFindings.forEach((finding, index) => {
        console.log(`│ ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.description}`);
        if (finding.location) {
          console.log(`│    Location: ${finding.location}`);
        }
        if (finding.remediation) {
          console.log(`│    Fix: ${finding.remediation}`);
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
    
    return scanResult;
  } catch (error) {
    console.error('\n❌ Error running deep security scan:', error);
    throw error;
  }
}

/**
 * Wait for a scan to complete by polling
 */
async function waitForScanCompletion(scanId, maxWaitTime = 300000, pollInterval = 1000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const scanResult = deepScanEngine.getScanById(scanId);
    
    if (!scanResult) {
      throw new Error(`Scan ${scanId} not found`);
    }
    
    // Check if scan is complete (start time != end time)
    if (scanResult.startTime.getTime() !== scanResult.endTime.getTime()) {
      return scanResult;
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    // Show progress indicator
    process.stdout.write('.');
  }
  
  throw new Error(`Scan timed out after ${maxWaitTime / 1000} seconds`);
}

// Run the scan
runScan()
  .then(() => {
    console.log('\n✅ Deep security scan completed successfully.');
  })
  .catch(error => {
    console.error('\n❌ Deep security scan failed:', error);
    process.exit(1);
  });