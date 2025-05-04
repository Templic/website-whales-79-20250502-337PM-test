/**
 * PCI Compliance Test Script
 * 
 * This script demonstrates and tests the PCI compliance features implemented in the application.
 * It simulates payment transactions and verifies that proper security measures are in place.
 * 
 * Usage: node server/test-pci-compliance.js
 */

// Import required modules
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const paymentTransactionLogger = require('./security/paymentTransactionLogger').default;
const secureAuditTrail = require('./security/secureAuditTrail').default;
const { recordAuditEvent } = require('./security/secureAuditTrail');
const { redactSensitiveInfo, createSecureHash } = require('./utils/security');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

// Helper function to log test results
function logTest(name, passed, message) {
  const status = passed 
    ? `${colors.green}✓ PASSED${colors.reset}` 
    : `${colors.red}✗ FAILED${colors.reset}`;
  
  console.log(`${colors.bright}${name}${colors.reset}: ${status}`);
  if (message) {
    console.log(`  ${message}`);
  }
  console.log();
}

// Helper function to simulate a payment intent creation
function simulatePaymentIntent() {
  const paymentIntentId = `pi_${crypto.randomBytes(8).toString('hex')}`;
  
  // Log the transaction
  paymentTransactionLogger.logTransaction({
    timestamp: new Date().toISOString(),
    transaction_id: paymentIntentId,
    user_id: 'test_user_123',
    payment_gateway: 'stripe',
    transaction_type: 'intent_created',
    amount: 4999,
    currency: 'usd',
    status: 'created',
    message: 'Test payment intent created',
    meta: {
      test: true,
      product_id: 'prod_123456'
    }
  });
  
  return paymentIntentId;
}

// Helper function to simulate a successful payment
function simulateSuccessfulPayment(paymentIntentId) {
  // Log the successful payment
  paymentTransactionLogger.logSuccessfulPayment({
    transactionId: paymentIntentId,
    orderId: `order_${crypto.randomBytes(4).toString('hex')}`,
    userId: 'test_user_123',
    gateway: 'stripe',
    amount: 4999,
    currency: 'usd',
    last4: '4242',
    ipAddress: '192.168.1.1',
    meta: {
      email: 'test@example.com',
      product_name: 'Premium Subscription'
    }
  });
  
  // Also record in audit trail
  recordAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'PAYMENT_CAPTURED',
    resource: `payment:${paymentIntentId}`,
    userId: 'test_user_123',
    ipAddress: '192.168.1.1',
    result: 'success',
    severity: 'info',
    details: {
      amount: 4999,
      currency: 'usd',
      payment_method: 'card'
    }
  });
}

// Helper function to simulate a failed payment
function simulateFailedPayment() {
  const failedPaymentId = `failed_${Date.now()}`;
  
  // Log the failed payment
  paymentTransactionLogger.logFailedPayment({
    transactionId: failedPaymentId,
    gateway: 'stripe',
    amount: 4999,
    currency: 'usd',
    errorMessage: 'Card declined: insufficient funds',
    errorCode: 'card_declined',
    userId: 'test_user_123',
    ipAddress: '192.168.1.1',
    meta: {
      error_type: 'card_error',
      card_brand: 'visa'
    }
  });
  
  // Also record in audit trail
  recordAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'PAYMENT_FAILED',
    resource: `payment:${failedPaymentId}`,
    userId: 'test_user_123',
    ipAddress: '192.168.1.1',
    result: 'failure',
    severity: 'warning',
    details: {
      error: 'Card declined: insufficient funds',
      error_code: 'card_declined',
      amount: 4999,
      currency: 'usd'
    }
  });
  
  return failedPaymentId;
}

// Test PAN (credit card number) redaction
function testSensitiveDataRedaction() {
  const testData = {
    cardNumber: '4242424242424242',
    cvv: '123',
    expiryDate: '12/25',
    apiKey: 'sk_test_123456789012345678901234',
    notes: 'Customer called about their VISA card ending in 4242'
  };
  
  const stringifiedData = JSON.stringify(testData);
  const redactedString = redactSensitiveInfo(stringifiedData);
  
  // Check that the original card number is not in the redacted string
  const passed = !redactedString.includes('4242424242424242') && 
                 !redactedString.includes('123') &&
                 redactedString.includes('****');
  
  logTest('Sensitive Data Redaction', passed, 
    'Original: ' + stringifiedData + '\n  ' +
    'Redacted: ' + redactedString);
  
  return passed;
}

// Test log integrity verification
async function testLogIntegrity() {
  console.log(`${colors.blue}Testing Log Integrity...${colors.reset}\n`);
  
  // Simulate a simple chain of transactions
  const intentId = simulatePaymentIntent();
  simulateSuccessfulPayment(intentId);
  simulateFailedPayment();
  
  // Verify the integrity of the transaction logs
  const integrityResult = paymentTransactionLogger.verifyTransactionLogIntegrity();
  
  logTest('Transaction Log Integrity', integrityResult.intact, 
    `Verified ${integrityResult.verifiedLogs} of ${integrityResult.totalLogs} transaction logs`);
  
  // Also test the audit trail integrity
  const auditIntegrityResult = secureAuditTrail.verifyLogIntegrity();
  
  logTest('Audit Trail Integrity', auditIntegrityResult.intact,
    `Verified ${auditIntegrityResult.verifiedEntries} of ${auditIntegrityResult.totalEntries} audit entries`);
  
  return integrityResult.intact && auditIntegrityResult.intact;
}

// Test tamper detection by manually modifying a log entry
async function testTamperDetection() {
  console.log(`${colors.blue}Testing Tamper Detection...${colors.reset}\n`);
  
  // Generate a test file
  const testLogDir = path.join(process.cwd(), 'logs', 'test');
  const testLogFile = path.join(testLogDir, 'tamper-test.log');
  
  // Ensure test directory exists
  if (!fs.existsSync(testLogDir)) {
    fs.mkdirSync(testLogDir, { recursive: true });
  }
  
  // Create test log entries with a hash chain
  const entry1 = {
    id: 'test1',
    timestamp: new Date().toISOString(),
    data: 'Original data',
    hash: null
  };
  entry1.hash = createSecureHash(JSON.stringify(entry1));
  
  const entry2 = {
    id: 'test2',
    timestamp: new Date(Date.now() + 1000).toISOString(),
    data: 'More data',
    previousHash: entry1.hash,
    hash: null
  };
  entry2.hash = createSecureHash(JSON.stringify(entry2));
  
  // Write them to the test file
  fs.writeFileSync(testLogFile, JSON.stringify(entry1) + '\n' + JSON.stringify(entry2));
  
  // First, verify integrity before tampering
  const beforeTamper = verifyTestLogIntegrity(testLogFile);
  logTest('Integrity Before Tampering', beforeTamper, 'Log file is intact before tampering');
  
  // Now tamper with the file by modifying entry1
  const tamperEntry = { ...entry1, data: 'TAMPERED DATA' };
  // Note: we don't update the hash
  
  // Read the current content
  const content = fs.readFileSync(testLogFile, 'utf-8').split('\n');
  // Replace the first line with our tampered entry
  content[0] = JSON.stringify(tamperEntry);
  
  // Write it back
  fs.writeFileSync(testLogFile, content.join('\n'));
  
  // Verify integrity after tampering
  const afterTamper = verifyTestLogIntegrity(testLogFile);
  
  // This should now fail
  logTest('Tamper Detection', !afterTamper, 
    'Tampered log file was correctly detected as compromised');
  
  // Clean up
  fs.unlinkSync(testLogFile);
  
  return !afterTamper; // Should be false (integrity check should fail)
}

// Helper to verify our test log file integrity
function verifyTestLogIntegrity(testLogFile) {
  // Read the log file
  const content = fs.readFileSync(testLogFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  let previousHash = null;
  
  // Simple integrity check
  for (let i = 0; i < lines.length; i++) {
    const entry = JSON.parse(lines[i]);
    
    // Verify hash chain
    if (i > 0 && entry.previousHash !== previousHash) {
      return false;
    }
    
    // Verify entry hash
    const { hash, ...entryData } = entry;
    const calculatedHash = createSecureHash(JSON.stringify(entryData));
    
    if (calculatedHash !== hash) {
      return false;
    }
    
    previousHash = hash;
  }
  
  return true;
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.blue}PCI COMPLIANCE TEST SCRIPT${colors.reset}\n`);
  
  const results = [];
  
  // Test 1: Sensitive Data Redaction
  console.log(`${colors.blue}Testing Sensitive Data Redaction...${colors.reset}\n`);
  results.push(testSensitiveDataRedaction());
  
  // Test 2: Log Integrity Verification
  results.push(await testLogIntegrity());
  
  // Test 3: Tamper Detection
  results.push(await testTamperDetection());
  
  // Summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r).length;
  
  console.log(`${colors.blue}${colors.bright}TEST SUMMARY:${colors.reset}`);
  console.log(`${passedTests} of ${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log(`${colors.green}${colors.bright}✓ ALL TESTS PASSED${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ SOME TESTS FAILED${colors.reset}`);
  }
}

// Run the tests
runTests().catch(err => {
  console.error(`${colors.red}ERROR:${colors.reset}`, err);
});