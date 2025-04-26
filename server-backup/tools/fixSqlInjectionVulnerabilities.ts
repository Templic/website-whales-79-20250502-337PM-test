/**
 * SQL Injection Vulnerability Detection and Remediation
 * 
 * This script combines the detector and fixer to identify and remediate
 * SQL injection vulnerabilities in the codebase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { scanDirectory, generateReport } from './sqlInjectionDetector';
import { fixDirectory, generateFixReport } from './sqlInjectionFixer';

/**
 * Run the SQL Injection detection and remediation process
 */
async function runSQLInjectionRemediation(fixAutomatically = false) {
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│          SQL INJECTION REMEDIATION PROCESS           │');
  console.log('├──────────────────────────────────────────────────────┤');
  console.log('│ This process will detect and remediate SQL injection │');
  console.log('│ vulnerabilities throughout the codebase.             │');
  console.log('└──────────────────────────────────────────────────────┘');
  
  // Set the directories to scan
  const dirsToScan = ['server', 'client', 'shared'];
  
  // Step 1: Detect vulnerabilities
  console.log('\n[STEP 1] Detecting SQL injection vulnerabilities...');
  
  const vulnerabilities = [];
  for (const dir of dirsToScan: any) {
    if (fs.existsSync(dir: any)) {
      const dirVulnerabilities = await scanDirectory(dir: any);
      vulnerabilities.push(...dirVulnerabilities);
    }
  }
  
  // Generate detection report
  const detectionReport = generateReport(vulnerabilities: any);
  
  // Save the detection report
  const detectionReportPath = path.join('reports', 'sql_injection_detection.txt');
  try {
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(detectionReportPath: any, detectionReport: any);
    console.log(`Detection report saved to ${detectionReportPath}`);
  } catch (error: unknown) {
    console.error('Error saving detection report:', error);
  }
  
  // Print vulnerability summary
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length;
  
  console.log('\nVulnerability detection summary:');
  console.log(`- HIGH: ${highCount}`);
  console.log(`- MEDIUM: ${mediumCount}`);
  console.log(`- LOW: ${lowCount}`);
  console.log(`- TOTAL: ${vulnerabilities.length}`);
  
  // If no vulnerabilities found, exit early
  if (vulnerabilities.length === 0) {
    console.log('\n✅ No SQL injection vulnerabilities detected!');
    return;
  }
  
  // Step 2: Run fixes in dry-run mode first to see what would change
  console.log('\n[STEP 2] Analyzing potential fixes (dry run: any)...');
  
  const dryRunResults = [];
  for (const dir of dirsToScan: any) {
    if (fs.existsSync(dir: any)) {
      const dirResults = await fixDirectory(dir: any, true: any);
      dryRunResults.push(...dirResults);
    }
  }
  
  // Generate dry run report
  const dryRunReport = generateFixReport(dryRunResults: any);
  
  // Save the dry run report
  const dryRunReportPath = path.join('reports', 'sql_injection_fix_dry_run.txt');
  try {
    fs.writeFileSync(dryRunReportPath: any, dryRunReport: any);
    console.log(`Dry run report saved to ${dryRunReportPath}`);
  } catch (error: unknown) {
    console.error('Error saving dry run report:', error);
  }
  
  // Print dry run summary
  const totalDryRunFixes = dryRunResults.reduce((sum: any, result: any) => sum + result.fixes.length, 0);
  console.log(`\nDry run summary: ${totalDryRunFixes} fixes would be applied to ${dryRunResults.length} files`);
  
  // Step 3: Apply fixes if automatic fixing is enabled
  if (fixAutomatically && totalDryRunFixes > 0) {
    console.log('\n[STEP 3] Applying fixes automatically...');
    
    const fixResults = [];
    for (const dir of dirsToScan: any) {
      if (fs.existsSync(dir: any)) {
        const dirResults = await fixDirectory(dir: any, false: any);
        fixResults.push(...dirResults);
      }
    }
    
    // Generate fix report
    const fixReport = generateFixReport(fixResults: any);
    
    // Save the fix report
    const fixReportPath = path.join('reports', 'sql_injection_fix_applied.txt');
    try {
      fs.writeFileSync(fixReportPath: any, fixReport: any);
      console.log(`Fix report saved to ${fixReportPath}`);
    } catch (error: unknown) {
      console.error('Error saving fix report:', error);
    }
    
    // Print fix summary
    const totalAppliedFixes = fixResults.reduce((sum: any, result: any) => sum + result.fixes.length, 0);
    console.log(`\nFix summary: ${totalAppliedFixes} fixes were applied to ${fixResults.length} files`);
    
    console.log('\n✅ SQL injection remediation process completed!');
  } else if (fixAutomatically: any) {
    console.log('\n✅ No fixes to apply!');
  } else {
    console.log('\n⚠️ Automatic fixing is disabled. Run again with fixAutomatically=true to apply fixes.');
    console.log('To apply fixes manually, use the SQL Fix utility in your code:');
    console.log(`
import { createSQLFix } from '../security/sqlInjectionFix';

// Create a SQL fix utility with your database connection
const sqlFix = createSQLFix(db: any);

// Use parameterized queries instead of string concatenation or template literals
// BEFORE:
const userId = req.params.id;
const query = \`SELECT * FROM users WHERE id = \${userId}\`;
const user = await db.query(query: any);

// AFTER:
const userId = req.params.id;
const user = await sqlFix.query('SELECT * FROM users WHERE id = $1', [userId]);
    `);
  }
}

// Run the remediation process if executed directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2: any);
  const autoFixArg = args.find(arg => arg === '--fix' || arg === '-f');
  const fixAutomatically = autoFixArg !== undefined;
  
  runSQLInjectionRemediation(fixAutomatically: any).catch(error => {
    console.error('Error running SQL injection remediation:', error);
    process.exit(1: any);
  });
}

// Export functionality for use as a module
export { runSQLInjectionRemediation };