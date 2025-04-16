/**
 * Payment Security Module
 * 
 * This module provides payment-specific security checks and integrates
 * with the main security scanning system.
 */

import fs from 'fs';
import path from 'path';
import { log } from '../vite';
import { runPCIDSSComplianceScan, generateComplianceReport } from './pciComplianceChecker';

// Security scan result type
export interface PaymentSecurityResult {
  id: string;
  timestamp: string;
  scanner: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  recommendation?: string;
}

/**
 * Run payment security scan
 * @returns Array of security scan results
 */
export async function runPaymentSecurityScan(): Promise<PaymentSecurityResult[]> {
  log('Running payment security scan...', 'security');
  
  const startTime = Date.now();
  const results: PaymentSecurityResult[] = [];
  
  try {
    // Run PCI DSS compliance scan
    const complianceScanResults = await runPCIDSSComplianceScan();
    
    // Generate compliance report
    if (complianceScanResults.failedChecks > 0) {
      const reportPath = generateComplianceReport(complianceScanResults);
      
      if (complianceScanResults.criticalIssues > 0) {
        results.push({
          id: `pci-compliance-critical-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'PaymentSecurityScanner',
          status: 'error',
          message: `Critical PCI DSS compliance issues found (${complianceScanResults.criticalIssues})`,
          details: `Critical compliance issues require immediate attention. Check the report at ${reportPath}`,
          recommendation: 'Review and fix critical issues immediately'
        });
      } else if (complianceScanResults.highIssues > 0) {
        results.push({
          id: `pci-compliance-high-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'PaymentSecurityScanner',
          status: 'warning',
          message: `High severity PCI DSS compliance issues found (${complianceScanResults.highIssues})`,
          details: `High severity compliance issues should be addressed soon. Check the report at ${reportPath}`,
          recommendation: 'Review and fix high severity issues soon'
        });
      } else if (complianceScanResults.mediumIssues > 0) {
        results.push({
          id: `pci-compliance-medium-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'PaymentSecurityScanner',
          status: 'warning',
          message: `Medium severity PCI DSS compliance issues found (${complianceScanResults.mediumIssues})`,
          details: `Medium severity compliance issues. Check the report at ${reportPath}`,
          recommendation: 'Review and fix medium severity issues'
        });
      } else {
        results.push({
          id: `pci-compliance-low-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'PaymentSecurityScanner',
          status: 'success',
          message: `Only low severity PCI DSS compliance issues found (${complianceScanResults.lowIssues})`,
          details: `Low severity compliance issues. Check the report at ${reportPath}`,
          recommendation: 'Review low severity issues when convenient'
        });
      }
    } else {
      results.push({
        id: `pci-compliance-pass-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scanner: 'PaymentSecurityScanner',
        status: 'success',
        message: 'PCI DSS compliance check passed',
        details: `All ${complianceScanResults.totalChecks} PCI DSS compliance checks passed`,
      });
    }
    
    // Run Stripe implementation check
    await checkStripeImplementation(results);
    
    // Run credit card data leakage check
    await checkCreditCardDataLeakage(results);
    
    // Log summary
    const duration = Date.now() - startTime;
    log(`Payment security scan completed in ${duration}ms`, 'security');
    
    const errors = results.filter(r => r.status === 'error').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const success = results.filter(r => r.status === 'success').length;
    
    log(`Payment security results: ${errors} errors, ${warnings} warnings, ${success} passed`, 'security');
    
    return results;
  } catch (error) {
    log(`Error in payment security scan: ${error}`, 'error');
    
    results.push({
      id: `payment-scan-error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scanner: 'PaymentSecurityScanner',
      status: 'error',
      message: 'Error during payment security scan',
      details: `An error occurred during the payment security scan: ${error}`,
      recommendation: 'Check the logs for more details and try again'
    });
    
    return results;
  }
}

/**
 * Check Stripe implementation for security issues
 * @param results Results array to add to
 */
async function checkStripeImplementation(results: PaymentSecurityResult[]): Promise<void> {
  try {
    // Check for Stripe Elements usage
    const hasStripeElements = checkFileExistence([
      'client/src/components/shop/payment/StripeElements.tsx',
      'client/src/components/shop/payment/StripeProvider.tsx'
    ]);
    
    if (!hasStripeElements) {
      results.push({
        id: `stripe-elements-missing-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scanner: 'StripeImplementationScanner',
        status: 'warning',
        message: 'Stripe Elements implementation not found',
        details: 'Could not find Stripe Elements implementation files',
        recommendation: 'Implement Stripe Elements for secure payment processing'
      });
      return;
    }
    
    // Check Stripe Elements implementation
    const elementsPath = 'client/src/components/shop/payment/StripeElements.tsx';
    
    if (fs.existsSync(elementsPath)) {
      const content = fs.readFileSync(elementsPath, 'utf8');
      
      // Check for direct element usage instead of Elements
      if (
        content.includes('CardElement') && 
        !content.includes('PaymentElement') && 
        !content.includes('<Elements')
      ) {
        results.push({
          id: `stripe-elements-outdated-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'StripeImplementationScanner',
          status: 'warning',
          message: 'Using outdated Stripe Elements implementation',
          details: 'Using individual card elements instead of the newer PaymentElement',
          recommendation: 'Update to use the newer PaymentElement for improved security and compliance'
        });
      }
      
      // Check for error handling
      if (!content.includes('setError') || !content.includes('catch')) {
        results.push({
          id: `stripe-error-handling-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'StripeImplementationScanner',
          status: 'warning',
          message: 'Missing proper error handling in Stripe integration',
          details: 'Proper error handling is essential for payment processing',
          recommendation: 'Implement comprehensive error handling for payment processing'
        });
      }
      
      // Good implementation found
      results.push({
        id: `stripe-implementation-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scanner: 'StripeImplementationScanner',
        status: 'success',
        message: 'Stripe implementation found',
        details: 'Stripe Elements implementation detected',
      });
    }
    
    // Check Stripe provider
    const providerPath = 'client/src/components/shop/payment/StripeProvider.tsx';
    
    if (fs.existsSync(providerPath)) {
      const content = fs.readFileSync(providerPath, 'utf8');
      
      // Check for API key handling
      if (content.includes('VITE_STRIPE_PUBLISHABLE_KEY')) {
        results.push({
          id: `stripe-api-key-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'StripeImplementationScanner',
          status: 'success',
          message: 'Stripe API key handling is secure',
          details: 'Stripe publishable key is properly loaded from environment variables',
        });
      } else if (content.includes('pk_test_') || content.includes('pk_live_')) {
        results.push({
          id: `stripe-api-key-hardcoded-${Date.now()}`,
          timestamp: new Date().toISOString(),
          scanner: 'StripeImplementationScanner',
          status: 'error',
          message: 'Hardcoded Stripe publishable key detected',
          details: 'Hardcoded API keys should be moved to environment variables',
          recommendation: 'Move Stripe publishable key to environment variables'
        });
      }
    }
  } catch (error) {
    log(`Error checking Stripe implementation: ${error}`, 'error');
    
    results.push({
      id: `stripe-check-error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scanner: 'StripeImplementationScanner',
      status: 'error',
      message: 'Error checking Stripe implementation',
      details: `An error occurred during Stripe implementation check: ${error}`,
      recommendation: 'Check the logs for more details'
    });
  }
}

/**
 * Check for credit card data leakage
 * @param results Results array to add to
 */
async function checkCreditCardDataLeakage(results: PaymentSecurityResult[]): Promise<void> {
  try {
    // Paths to search
    const paths = [
      'client/src',
      'server'
    ];
    
    // Credit card data patterns
    const ccPatterns = [
      // Credit card number formats
      /\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g,
      // Variable names suggesting credit card storage
      /\b(?:cardNumber|creditCard|ccNumber|card_number)\b/g,
      // CVV storage
      /\b(?:cvv|cvc|securityCode|securityNumber|card_code)\b/g
    ];
    
    // Check for card leakage in code files
    let ccLeakFound = false;
    
    for (const dirPath of paths) {
      if (!fs.existsSync(dirPath)) {
        continue;
      }
      
      const files = getCodeFiles(dirPath);
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const pattern of ccPatterns) {
            if (pattern.test(content)) {
              // Don't report if in specific contexts
              if (
                file.includes('stripe') || 
                file.includes('payment') || 
                file.includes('test') || 
                file.includes('mock')
              ) {
                // These are expected in payment components
                continue;
              }
              
              ccLeakFound = true;
              
              results.push({
                id: `cc-data-leak-${Date.now()}`,
                timestamp: new Date().toISOString(),
                scanner: 'CreditCardDataScanner',
                status: 'error',
                message: 'Potential credit card data detected',
                details: `Found potential credit card data in ${file}`,
                recommendation: 'Remove any direct handling of credit card data and use tokenization'
              });
              
              // Only report one instance per file
              break;
            }
          }
          
          // Check for logging of card data
          if (
            content.includes('console.log') && 
            (
              content.includes('card') || 
              content.includes('payment') || 
              content.includes('stripe')
            )
          ) {
            results.push({
              id: `cc-data-logging-${Date.now()}`,
              timestamp: new Date().toISOString(),
              scanner: 'CreditCardDataScanner',
              status: 'warning',
              message: 'Potential logging of payment information',
              details: `Found potential logging of payment information in ${file}`,
              recommendation: 'Remove any logging of payment information'
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
    
    if (!ccLeakFound) {
      results.push({
        id: `cc-data-check-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scanner: 'CreditCardDataScanner',
        status: 'success',
        message: 'No credit card data leakage detected',
        details: 'No evidence of credit card data handling outside of payment components',
      });
    }
  } catch (error) {
    log(`Error checking for credit card data leakage: ${error}`, 'error');
    
    results.push({
      id: `cc-check-error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scanner: 'CreditCardDataScanner',
      status: 'error',
      message: 'Error checking for credit card data leakage',
      details: `An error occurred during credit card data check: ${error}`,
      recommendation: 'Check the logs for more details'
    });
  }
}

/**
 * Check if any of the files exist
 * @param filePaths Array of file paths
 * @returns True if any file exists
 */
function checkFileExistence(filePaths: string[]): boolean {
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all code files in a directory recursively
 * @param dirPath Directory path
 * @returns Array of file paths
 */
function getCodeFiles(dirPath: string): string[] {
  let files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (
          !entry.name.startsWith('.') && 
          entry.name !== 'node_modules' && 
          entry.name !== 'dist' && 
          entry.name !== 'build' && 
          entry.name !== 'coverage'
        ) {
          files = [...files, ...getCodeFiles(fullPath)];
        }
      } else {
        // Only include code files
        if (
          fullPath.endsWith('.js') || 
          fullPath.endsWith('.ts') || 
          fullPath.endsWith('.jsx') || 
          fullPath.endsWith('.tsx')
        ) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}