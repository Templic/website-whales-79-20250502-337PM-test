/**
 * Security Check Runner Script
 * 
 * This script triggers a comprehensive security scan to verify that
 * our PCI-DSS compliance warnings have been addressed.
 */

import { runAllSecurityChecks } from '../server/security/enhancedSecurityModule.js';

// Run a deep security scan
console.log('Running comprehensive security scan...');
runAllSecurityChecks(true)
  .then(() => {
    console.log('Security scan completed. Check logs for results.');
  })
  .catch(error => {
    console.error('Error running security scan:', error);
  });