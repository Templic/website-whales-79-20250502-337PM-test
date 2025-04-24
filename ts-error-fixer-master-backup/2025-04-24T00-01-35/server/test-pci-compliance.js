// Test script for PCI DSS compliance checking
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock logging function to avoid dependencies
function log(message, level = 'info') {
  console.log(`[${level.toUpperCase()}] ${message}`);
}

// Test transaction logging check
function testTransactionLogging() {
  console.log('\n=== TESTING TRANSACTION LOGGING CHECK ===');
  
  const logFilePath = path.join(process.cwd(), 'logs', 'payment', 'transaction_log.txt');
  const logsExist = fs.existsSync(logFilePath);
  
  console.log(`Transaction log file exists: ${logsExist}`);
  
  if (logsExist) {
    try {
      const stats = fs.statSync(logFilePath);
      const fileModTime = stats.mtime.getTime();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      console.log(`Log file is recent: ${fileModTime > thirtyDaysAgo}`);
      
      const logContent = fs.readFileSync(logFilePath, 'utf8');
      
      // Basic content checks
      const hasTransactionId = logContent.includes('transactionId');
      const hasAmount = logContent.includes('amount') || logContent.includes('payment');
      const hasTimestamp = logContent.includes('timestamp');
      
      console.log(`Contains transaction ID references: ${hasTransactionId}`);
      console.log(`Contains amount/payment references: ${hasAmount}`);
      console.log(`Contains timestamp references: ${hasTimestamp}`);
      
      // Format checks
      const hasSufficientEntries = (logContent.match(/TRX/g) || []).length >= 5;
      const hasSeparatorsForParsing = logContent.includes('|');
      const hasFormatDocumentation = logContent.includes('# Format:');
      const hasRecentTimestamps = logContent.includes(new Date().getFullYear().toString());
      
      console.log(`Has sufficient TRX entries: ${hasSufficientEntries}`);
      console.log(`Has field separators: ${hasSeparatorsForParsing}`);
      console.log(`Has format documentation: ${hasFormatDocumentation}`);
      console.log(`Has recent timestamps: ${hasRecentTimestamps}`);
      
      // Line and format checks
      const logLines = logContent.split('\n').filter(line => 
        line.trim() && !line.startsWith('#')
      );
      
      console.log(`Total log entries: ${logLines.length}`);
      
      let hasEnoughEntries = false;
      let hasProperFieldCount = false;
      
      if (logLines.length > 0) {
        hasEnoughEntries = logLines.length >= 5;
        
        // Check fields
        const sampleEntry = logLines[0].split('|');
        hasProperFieldCount = sampleEntry.length >= 8;
        
        console.log(`Has enough entries: ${hasEnoughEntries}`);
        console.log(`Sample entry has ${sampleEntry.length} fields (expected ≥8): ${hasProperFieldCount}`);
      }
      
      // Final result
      const result = hasTransactionId && 
                    hasAmount && 
                    hasTimestamp && 
                    hasSufficientEntries && 
                    hasSeparatorsForParsing && 
                    hasFormatDocumentation && 
                    hasRecentTimestamps &&
                    hasEnoughEntries &&
                    hasProperFieldCount;
      
      console.log(`\nFinal transaction logging check result: ${result ? 'PASS' : 'FAIL'}`);
      return result;
      
    } catch (error) {
      console.error(`Error in test: ${error}`);
      return false;
    }
  }
  
  return false;
}

// Test secure audit trails check
function testSecureAuditTrails() {
  console.log('\n=== TESTING SECURE AUDIT TRAILS CHECK ===');
  
  const logIntegrityPath = path.join(process.cwd(), 'logs', 'integrity');
  const logHashFilePath = path.join(logIntegrityPath, 'log_hashes.json');
  
  const exists = fs.existsSync(logIntegrityPath) && fs.existsSync(logHashFilePath);
  console.log(`Log hash file exists: ${exists}`);
  
  let passed = false;
  
  if (exists) {
    try {
      const logHashes = JSON.parse(fs.readFileSync(logHashFilePath, 'utf8'));
      
      const isObjectWithEntries = logHashes && 
                               typeof logHashes === 'object' && 
                               Object.keys(logHashes).length > 0;
      
      console.log(`Log hashes is valid object with entries: ${isObjectWithEntries}`);
      
      if (isObjectWithEntries) {
        // Check tracked logs
        const trackedLogs = Object.keys(logHashes).length;
        const paymentLogsTracked = Object.keys(logHashes).some(key => key.includes('payment'));
        const securityLogsTracked = Object.keys(logHashes).some(key => key.includes('security'));
        
        console.log(`Number of tracked logs: ${trackedLogs}`);
        console.log(`Payment logs tracked: ${paymentLogsTracked}`);
        console.log(`Security logs tracked: ${securityLogsTracked}`);
        
        // Check entry format
        const entriesWithRequiredFields = Object.values(logHashes).filter(entry => 
          typeof entry === 'object' && 
          entry !== null &&
          'hash' in entry && 
          'timestamp' in entry &&
          'algorithm' in entry
        ).length;
        
        console.log(`Entries with all required fields: ${entriesWithRequiredFields}`);
        
        // Check hash format
        const validHashFormat = Object.values(logHashes).every(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'hash' in entry && 
          /^[a-f0-9]{64}$/.test(entry.hash)
        );
        
        console.log(`All hashes have valid SHA256 format: ${validHashFormat}`);
        
        // Check timestamp recency
        const recentEntries = Object.values(logHashes).some(entry => {
          if (typeof entry === 'object' && entry !== null && 'timestamp' in entry) {
            const entryTime = new Date(entry.timestamp).getTime();
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return entryTime > oneDayAgo;
          }
          return false;
        });
        
        console.log(`Has recent entries (within 24h): ${recentEntries}`);
        
        // Check verification status
        const hasVerificationStatus = Object.values(logHashes).every(entry => 
          typeof entry === 'object' && 
          entry !== null && 
          'verificationStatus' in entry
        );
        
        console.log(`All entries have verification status: ${hasVerificationStatus}`);
        
        // Final result
        passed = trackedLogs >= 3 && 
                paymentLogsTracked && 
                securityLogsTracked && 
                entriesWithRequiredFields === trackedLogs && 
                validHashFormat &&
                recentEntries &&
                hasVerificationStatus;
      }
    } catch (error) {
      console.error(`Error in test: ${error}`);
      passed = false;
    }
  }
  
  console.log(`\nFinal secure audit trails check result: ${passed ? 'PASS' : 'FAIL'}`);
  return passed;
}

// Test log review check
function testLogReview() {
  console.log('\n=== TESTING LOG REVIEW CHECK ===');
  
  const logReviewPath = path.join(process.cwd(), 'logs', 'reviews');
  const logReviewFilePath = path.join(logReviewPath, 'log_review_history.json');
  
  const exists = fs.existsSync(logReviewPath) && fs.existsSync(logReviewFilePath);
  console.log(`Log review file exists: ${exists}`);
  
  let passed = false;
  
  if (exists) {
    try {
      const logReviews = JSON.parse(fs.readFileSync(logReviewFilePath, 'utf8'));
      
      const isArrayWithEntries = Array.isArray(logReviews) && logReviews.length > 0;
      console.log(`Log reviews is valid array with entries: ${isArrayWithEntries}`);
      
      if (isArrayWithEntries) {
        // Check minimum entries
        const hasMinimumEntries = logReviews.length >= 2;
        console.log(`Has minimum entries (≥2): ${hasMinimumEntries}`);
        
        // Check recency
        const sortedReviews = [...logReviews].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const latestReview = sortedReviews[0];
        const reviewDate = new Date(latestReview.timestamp).getTime();
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const isRecent = reviewDate > sevenDaysAgo;
        
        console.log(`Most recent review: ${latestReview.timestamp}`);
        console.log(`Review is recent (within 7 days): ${isRecent}`);
        
        // Check critical logs
        const criticalLogTypes = ['payment', 'security', 'api', 'admin'];
        const reviewsPaymentLogs = logReviews.some(review => 
          review.logFiles && review.logFiles.some(file => 
            criticalLogTypes.some(type => file.includes(type))
          )
        );
        
        console.log(`Reviews include critical log types: ${reviewsPaymentLogs}`);
        
        // Check structure
        const hasProperStructure = logReviews.every(review => 
          review.timestamp && 
          review.reviewer && 
          review.reviewType && 
          review.logFiles && 
          Array.isArray(review.logFiles) &&
          review.findings !== undefined && 
          Array.isArray(review.findings) &&
          review.conclusion
        );
        
        console.log(`All reviews have proper structure: ${hasProperStructure}`);
        
        // Check findings
        const hasProperFindings = logReviews.every(review => {
          if (review.findings.length === 0) return true;
          return review.findings.every(finding => 
            finding.severity && 
            finding.description && 
            finding.logFile
          );
        });
        
        console.log(`All findings are properly documented: ${hasProperFindings}`);
        
        // Check next review scheduling
        const hasScheduledNextReview = latestReview.nextScheduledReview !== undefined;
        console.log(`Latest review has scheduled next review: ${hasScheduledNextReview}`);
        
        // Check hash verification
        const includesHashVerification = logReviews.some(review => 
          review.verifiedHashIntegrity === true
        );
        
        console.log(`Reviews include hash integrity verification: ${includesHashVerification}`);
        
        // Final result
        passed = hasMinimumEntries && 
                isRecent && 
                reviewsPaymentLogs && 
                hasProperStructure && 
                hasProperFindings && 
                hasScheduledNextReview && 
                includesHashVerification;
      }
    } catch (error) {
      console.error(`Error in test: ${error}`);
      passed = false;
    }
  }
  
  console.log(`\nFinal log review check result: ${passed ? 'PASS' : 'FAIL'}`);
  return passed;
}

// Run the tests
const transactionLoggingPassed = testTransactionLogging();
const secureAuditTrailsPassed = testSecureAuditTrails();
const logReviewPassed = testLogReview();

// Show overall results
console.log('\n=== OVERALL PCI DSS LOGGING COMPLIANCE TEST RESULTS ===');
console.log(`Transaction Logging (Req 10.2): ${transactionLoggingPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Secure Audit Trails (Req 10.5): ${secureAuditTrailsPassed ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Log Review (Req 10.6): ${logReviewPassed ? '✅ PASS' : '❌ FAIL'}`);

const allPassed = transactionLoggingPassed && secureAuditTrailsPassed && logReviewPassed;
console.log(`\nFinal Compliance Status: ${allPassed ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);