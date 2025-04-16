#!/usr/bin/env node

/**
 * Test Payment Security Scanner
 * 
 * This script runs the payment security scanner to test its functionality.
 * It executes the security scan using the TSX runtime.
 */

// Use the tsx command to run the typescript directly
import { execSync } from 'child_process';

console.log('Starting payment security scan test...');

try {
  // Run the scan using tsx
  const command = 'npx tsx -e "import { runPaymentSecurityScan } from \'./server/security/paymentSecurity\'; runPaymentSecurityScan().then(results => console.log(JSON.stringify(results, null, 2)));"';
  
  // Execute the command
  const output = execSync(command, { encoding: 'utf8' });
  
  // Parse the results
  console.log('Payment security scan complete.');
  
  // Try to extract and parse the JSON results
  try {
    const jsonStart = output.indexOf('[{');
    const jsonEnd = output.lastIndexOf('}]') + 2;
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonStr = output.substring(jsonStart, jsonEnd);
      const results = JSON.parse(jsonStr);
      
      // Count issues by severity
      const errors = results.filter(r => r.status === 'error').length;
      const warnings = results.filter(r => r.status === 'warning').length;
      const success = results.filter(r => r.status === 'success').length;
      
      console.log(`Summary: ${errors} errors, ${warnings} warnings, ${success} passed`);
      
      // Exit with code based on severity
      if (errors > 0) {
        process.exit(2); // Critical issues found
      } else if (warnings > 0) {
        process.exit(1); // High issues found
      } else {
        process.exit(0); // No critical or high issues
      }
    } else {
      console.log('Unable to parse results. Full output:');
      console.log(output);
      process.exit(1);
    }
  } catch (parseError) {
    console.error('Error parsing results:', parseError);
    console.log('Raw output:', output);
    process.exit(1);
  }
} catch (error) {
  console.error('Error running payment security scan:', error.message);
  process.exit(3);
}