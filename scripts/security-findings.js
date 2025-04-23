/**
 * Security Findings Inspector
 * 
 * This script inspects and displays the security findings from the security scanner
 */

import { securityFabric } from '../server/security/advanced/SecurityFabric.js';
import { getSecurityFindings } from '../server/security/scanner/SecurityScanner.js';

async function displaySecurityFindings() {
  try {
    console.log('Retrieving security findings...');
    
    // Get security findings
    const findings = await getSecurityFindings();
    
    if (!findings || findings.length === 0) {
      console.log('No security findings available.');
      return;
    }
    
    console.log(`Total findings: ${findings.length}`);
    
    // Group findings by severity
    const severityGroups = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    
    findings.forEach(finding => {
      const severity = finding.severity.toLowerCase();
      if (severityGroups[severity]) {
        severityGroups[severity].push(finding);
      } else {
        severityGroups.info.push(finding);
      }
    });
    
    // Display findings by severity (most severe first)
    ['critical', 'high', 'medium', 'low', 'info'].forEach(severity => {
      const severityFindings = severityGroups[severity];
      
      if (severityFindings.length > 0) {
        console.log(`\n=== ${severity.toUpperCase()} SEVERITY (${severityFindings.length}) ===`);
        
        severityFindings.forEach((finding, index) => {
          console.log(`\n[${severity.toUpperCase()}] #${index + 1}: ${finding.title}`);
          console.log(`Description: ${finding.description}`);
          console.log(`Location: ${finding.location || 'N/A'}`);
          console.log(`Recommended Action: ${finding.recommendation || 'N/A'}`);
          
          if (finding.details) {
            console.log('Details:');
            console.log(finding.details);
          }
          
          if (finding.cwe) {
            console.log(`CWE: ${finding.cwe}`);
          }
          
          console.log('-'.repeat(50));
        });
      }
    });
    
  } catch (error) {
    console.error('Error retrieving security findings:', error);
  }
}

// Run the function
displaySecurityFindings();