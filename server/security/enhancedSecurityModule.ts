/**
 * Enhanced Security Module
 * 
 * This module integrates all security components:
 * 1. Security scan queue system
 * 2. Secure audit trail
 * 3. Log review system
 * 4. Dependency update management
 */

import { initializeSecurityScanQueue, getQueueStatus, enqueueSecurityScan, ScanType, ScanFrequency, scheduleAllSecurityScans, createScheduledScan } from './securityScanQueue';
import { initializeAuditTrail, recordAuditEvent } from './secureAuditTrail';
import { initializeLogReviewer, reviewSecurityLogs } from './logReviewer';
import { scanDependencies, generateUpdatePlan, applySafeUpdates, applySecurityUpdates } from '../utils/dependencyUpdater';
import { log } from '../utils/logger';

// Track initialization state
let isInitialized = false;

/**
 * Initialize the enhanced security module
 */
export function initializeEnhancedSecurity(): void {
  if (isInitialized) {
    log('Enhanced security module already initialized', 'security');
    return;
  }

  try {
    log('Initializing enhanced security module...', 'security');
    
    // Initialize security scan queue
    initializeSecurityScanQueue();
    
    // Initialize secure audit trail
    initializeAuditTrail();
    
    // Initialize log review system (with 12-hour review interval)
    initializeLogReviewer(12);
    
    // Setup default scheduled scans
    setupDefaultScheduledScans();
    
    // Record the initialization in the audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'SECURITY_MODULE_INIT',
      resource: 'security-system',
      result: 'success',
      severity: 'info',
      details: {
        message: 'Enhanced security module initialized successfully'
      }
    });
    
    log('Enhanced security module initialized successfully', 'security');
    isInitialized = true;
    
    // Perform initial scans after a short delay to allow system to stabilize
    setTimeout(() => {
      performInitialScans();
    }, 5000);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to initialize enhanced security module: ${errorMessage}`, 'security');
  }
}

/**
 * Setup default scheduled scans
 */
function setupDefaultScheduledScans(): void {
  try {
    log('Setting up default scheduled security scans...', 'security');
    
    // Daily dependency scan
    createScheduledScan(
      ScanType.DEPENDENCY,
      ScanFrequency.DAILY,
      {
        deep: true,
        description: 'Daily dependency vulnerability scan',
        persistResults: true,
        tags: ['dependencies', 'daily']
      }
    );
    
    // Daily API security scan
    createScheduledScan(
      ScanType.API,
      ScanFrequency.DAILY,
      {
        deep: true,
        description: 'Daily API security scan',
        persistResults: true,
        tags: ['api', 'daily']
      }
    );
    
    // Weekly authentication scan
    createScheduledScan(
      ScanType.AUTH,
      ScanFrequency.WEEKLY,
      {
        deep: true,
        description: 'Weekly authentication security scan',
        persistResults: true,
        tags: ['auth', 'weekly']
      }
    );
    
    // Weekly compliance scan
    createScheduledScan(
      ScanType.COMPLIANCE,
      ScanFrequency.WEEKLY,
      {
        deep: true,
        description: 'Weekly compliance scan',
        persistResults: true,
        tags: ['compliance', 'weekly']
      }
    );
    
    // Monthly full security scan
    createScheduledScan(
      ScanType.CORE,
      ScanFrequency.MONTHLY,
      {
        deep: true,
        description: 'Monthly comprehensive security scan',
        persistResults: true,
        tags: ['comprehensive', 'monthly']
      }
    );
    
    log('Default scheduled security scans setup completed', 'security');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error setting up default scheduled scans: ${errorMessage}`, 'security');
  }
}

/**
 * Perform initial security scans
 */
async function performInitialScans(): Promise<void> {
  try {
    log('Performing initial security scans...', 'security');
    
    // Queue quick scans for immediate execution
    enqueueSecurityScan(ScanType.DEPENDENCY, false, {
      priority: 10,
      persistResults: true,
      tags: ['initial', 'quick']
    });
    
    enqueueSecurityScan(ScanType.CORE, false, {
      priority: 20,
      persistResults: true,
      tags: ['initial', 'quick']
    });
    
    // Check for dependency updates
    const packages = await scanDependencies();
    if (packages.length > 0) {
      const securityIssues = packages.filter(pkg => pkg.hasSecurityIssue).length;
      
      // Record in audit log
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'DEPENDENCY_SCAN',
        resource: 'dependencies',
        result: 'success',
        severity: securityIssues > 0 ? 'warning' : 'info',
        details: {
          packagesScanned: packages.length,
          outdatedPackages: packages.length,
          securityIssues
        }
      });
    }
    
    // Perform initial log review
    reviewSecurityLogs(24, true);
    
    log('Initial security scans completed', 'security');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error performing initial scans: ${errorMessage}`, 'security');
  }
}

/**
 * Run all security checks
 */
export async function runAllSecurityChecks(deep = false): Promise<void> {
  try {
    log(`Running comprehensive security checks (deep: ${deep})...`, 'security');
    
    // Schedule all scan types
    const scanIds = scheduleAllSecurityScans(deep);
    
    // Update dependencies scan
    const packages = await scanDependencies();
    
    // Review security logs
    const logReview = await reviewSecurityLogs(24, true);
    
    log(`Comprehensive security checks initiated: ${scanIds.length} scans scheduled`, 'security');
    
    // Record in audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'SECURITY_CHECKS',
      resource: 'security-system',
      result: 'success',
      severity: 'info',
      details: {
        scansScheduled: scanIds.length,
        deep,
        outdatedPackages: packages.length,
        logReviewAlerts: logReview.alerts
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error running security checks: ${errorMessage}`, 'security');
    
    // Record error in audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'SECURITY_CHECKS',
      resource: 'security-system',
      result: 'failure',
      severity: 'warning',
      details: {
        error: errorMessage
      }
    });
  }
}

/**
 * Update all dependencies with security issues
 */
export async function updateSecurityDependencies(): Promise<string[]> {
  try {
    log('Updating dependencies with security issues...', 'security');
    
    const updated = await applySecurityUpdates();
    
    // Record in audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'DEPENDENCY_UPDATE',
      resource: 'dependencies',
      result: updated.length > 0 ? 'success' : 'failure',
      severity: 'info',
      details: {
        updatedPackages: updated.length,
        packages: updated
      }
    });
    
    return updated;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error updating security dependencies: ${errorMessage}`, 'security');
    
    // Record error in audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'DEPENDENCY_UPDATE',
      resource: 'dependencies',
      result: 'failure',
      severity: 'warning',
      details: {
        error: errorMessage
      }
    });
    
    return [];
  }
}