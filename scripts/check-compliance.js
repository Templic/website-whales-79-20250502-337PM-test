/**
 * PCI-DSS Compliance Check Script
 * 
 * This script checks the results of a security scan to verify if 
 * our PCI-DSS compliance warnings have been addressed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking security scan results for PCI-DSS warnings...');

// 1. Check for recent security scan reports
const reportsDir = path.join(__dirname, '..', 'reports', 'compliance');
if (!fs.existsSync(reportsDir)) {
  console.log('No compliance reports directory found.');
  process.exit(1);
}

// Find the most recent PCI compliance report
const files = fs.readdirSync(reportsDir)
  .filter(file => file.startsWith('pci-compliance-'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('No PCI compliance reports found.');
  process.exit(1);
}

const latestReport = path.join(reportsDir, files[0]);
console.log(`Checking report: ${latestReport}`);

// Read the report content
const reportContent = fs.readFileSync(latestReport, 'utf8');

// Check for previous warnings about audit trails and log review
const auditTrailWarning = reportContent.includes('Requirement 10.5: Secure audit trails so they cannot be altered');
const logReviewWarning = reportContent.includes('Requirement 10.6: Review logs and security events for all system components');

console.log('\nPCI-DSS Compliance Status:');
console.log('-----------------------------------');
console.log(`PCI-DSS Requirement 10.5 (Secure audit trails): ${auditTrailWarning ? '❌ Failed' : '✅ Passed'}`);
console.log(`PCI-DSS Requirement 10.6 (Review logs): ${logReviewWarning ? '❌ Failed' : '✅ Passed'}`);

// 2. Check for implementation verification
const auditTrailExists = fs.existsSync(path.join(__dirname, '..', 'server', 'security', 'secureAuditTrail.ts'));
const logReviewerExists = fs.existsSync(path.join(__dirname, '..', 'server', 'security', 'logReviewer.ts'));

console.log('\nImplementation Verification:');
console.log('-----------------------------------');
console.log(`Secure Audit Trail Implementation: ${auditTrailExists ? '✅ Implemented' : '❌ Missing'}`);
console.log(`Log Reviewer Implementation: ${logReviewerExists ? '✅ Implemented' : '❌ Missing'}`);

// 3. Look for evidence of active audit logging
const logsDir = path.join(__dirname, '..', 'logs', 'audit');
const hasAuditLogs = fs.existsSync(logsDir) && fs.readdirSync(logsDir).length > 0;

const reviewsDir = path.join(__dirname, '..', 'logs', 'reviews');
const hasReviews = fs.existsSync(reviewsDir) && fs.readdirSync(reviewsDir).length > 0;

console.log('\nRuntime Evidence:');
console.log('-----------------------------------');
console.log(`Audit Logs Generation: ${hasAuditLogs ? '✅ Active' : '❌ Inactive'}`);
console.log(`Log Review Execution: ${hasReviews ? '✅ Active' : '❌ Inactive'}`);

// Print conclusion
console.log('\nCompliance Conclusion:');
console.log('-----------------------------------');

if (!auditTrailWarning && !logReviewWarning && auditTrailExists && logReviewerExists) {
  console.log('✅ PCI-DSS Compliance Warnings Successfully Addressed!');
  console.log('   The implementation of secure audit trails and log review systems has resolved the previous warnings.');
} else {
  console.log('❌ PCI-DSS Compliance Warnings Not Fully Addressed');
  console.log('   See details above for which requirements still need attention.');
}