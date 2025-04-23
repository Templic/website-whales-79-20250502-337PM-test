/**
 * Security Findings Inspector
 */

import fs from 'fs';
import path from 'path';

// Define the location where security findings are stored
const FINDINGS_PATH = './reports/security/findings.json';

interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  location?: string;
  recommendation?: string;
  details?: string;
  cwe?: string;
  timestamp: number;
}

async function displaySecurityFindings() {
  try {
    console.log('Retrieving security findings...');
    
    // Check if findings file exists
    if (!fs.existsSync(FINDINGS_PATH)) {
      console.log(`Findings file not found at ${FINDINGS_PATH}`);
      
      // Directory paths
      console.log('\nAvailable directories:');
      const dirs = ['./reports', './reports/security', './logs', './docs/security'];
      
      dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          console.log(`Directory ${dir} exists. Contents:`);
          try {
            const files = fs.readdirSync(dir);
            files.forEach(file => console.log(`  - ${file}`));
          } catch (err) {
            console.log(`  Error reading directory: ${err.message}`);
          }
        } else {
          console.log(`Directory ${dir} does not exist.`);
        }
      });
      
      return;
    }
    
    // Read findings from file
    const rawData = fs.readFileSync(FINDINGS_PATH, 'utf8');
    const findings = JSON.parse(rawData) as SecurityFinding[];
    
    if (!findings || findings.length === 0) {
      console.log('No security findings available.');
      return;
    }
    
    console.log(`Total findings: ${findings.length}`);
    
    // Group findings by severity
    const severityGroups = {
      critical: [] as SecurityFinding[],
      high: [] as SecurityFinding[],
      medium: [] as SecurityFinding[],
      low: [] as SecurityFinding[],
      info: [] as SecurityFinding[]
    };
    
    findings.forEach(finding => {
      const severity = finding.severity.toLowerCase() as keyof typeof severityGroups;
      if (severityGroups[severity]) {
        severityGroups[severity].push(finding);
      } else {
        severityGroups.info.push(finding);
      }
    });
    
    // Display findings by severity (most severe first)
    ['critical', 'high', 'medium', 'low', 'info'].forEach(severity => {
      const severityFindings = severityGroups[severity as keyof typeof severityGroups];
      
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