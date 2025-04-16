#!/usr/bin/env node

/**
 * Test Security Tools
 * 
 * This script tests the security tools to ensure they're working correctly.
 * It runs a quick scan, checks the outputs, and generates a simple report.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Directories
const LOGS_DIR = path.join(process.cwd(), 'logs');
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const SCANS_DIR = path.join(LOGS_DIR, 'security-scans');

// Ensure directories exist
[LOGS_DIR, REPORTS_DIR, SCANS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('====================================');
console.log('Security Tools Test');
console.log('====================================');

// Test functions
async function runTests() {
  try {
    console.log('\n1. Testing Security Scanner...');
    testSecurityScanner();
    
    console.log('\n2. Testing Security Auditor...');
    testSecurityAuditor();
    
    console.log('\n3. Testing Report Generator...');
    testReportGenerator();
    
    console.log('\n====================================');
    console.log('All tests completed successfully!');
    console.log('====================================');
    
  } catch (error) {
    console.error('\n====================================');
    console.error('Test failed with error:', error);
    console.error('====================================');
    process.exit(1);
  }
}

function testSecurityScanner() {
  console.log('Running quick security scan...');
  
  try {
    // Run the security scanner with the quick option
    execSync('node scripts/security-scan.js --quick', { stdio: 'inherit' });
    
    // Check if scan results were created
    const files = fs.readdirSync(SCANS_DIR);
    const scanFiles = files.filter(file => file.startsWith('scan-') && file.endsWith('.json'));
    
    if (scanFiles.length === 0) {
      throw new Error('No scan result files were created');
    }
    
    console.log(`✅ Security scanner test passed! Found ${scanFiles.length} scan result files.`);
    
    // Return the path to the most recent scan file for further tests
    const mostRecentScan = scanFiles.sort().pop();
    return path.join(SCANS_DIR, mostRecentScan);
  } catch (error) {
    console.error('❌ Security scanner test failed:', error.message);
    throw error;
  }
}

function testSecurityAuditor() {
  console.log('Running quick security audit...');
  
  try {
    // Run the security auditor with the owasp option
    execSync('node scripts/security-audit.js --owasp', { stdio: 'inherit' });
    
    // Check if audit results were created
    const auditDir = path.join(REPORTS_DIR, 'audits');
    
    if (!fs.existsSync(auditDir)) {
      throw new Error('Audit directory was not created');
    }
    
    const files = fs.readdirSync(auditDir);
    const auditFiles = files.filter(file => file.startsWith('audit-') && file.endsWith('.json'));
    
    if (auditFiles.length === 0) {
      throw new Error('No audit result files were created');
    }
    
    console.log(`✅ Security auditor test passed! Found ${auditFiles.length} audit result files.`);
    
    // Return the path to the most recent audit file for further tests
    const mostRecentAudit = auditFiles.sort().pop();
    return path.join(auditDir, mostRecentAudit);
  } catch (error) {
    console.error('❌ Security auditor test failed:', error.message);
    throw error;
  }
}

function testReportGenerator() {
  console.log('Testing report generator...');
  
  try {
    // Run the report generator with the technical option
    execSync('node scripts/security-report-generator.js --technical', { stdio: 'inherit' });
    
    // Check if report files were created
    const files = fs.readdirSync(REPORTS_DIR);
    const reportFiles = files.filter(file => 
      file.startsWith('security-') && 
      file.endsWith('.md') && 
      (file.includes('report') || file.includes('summary'))
    );
    
    if (reportFiles.length === 0) {
      throw new Error('No report files were created');
    }
    
    console.log(`✅ Report generator test passed! Found ${reportFiles.length} report files.`);
    
    // Return the list of report files
    return reportFiles.map(file => path.join(REPORTS_DIR, file));
  } catch (error) {
    console.error('❌ Report generator test failed:', error.message);
    throw error;
  }
}

// Run all tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});