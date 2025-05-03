/**
 * Security Module Entry Point
 * 
 * This file serves as the main entry point for all security-related functionality.
 * It exports components and functionality from the various security submodules.
 */

// Export from enhanced security module
export { 
  initializeEnhancedSecurity,
  runAllSecurityChecks,
  updateSecurityDependencies
} from './enhancedSecurityModule';

// Export from security scan queue
export {
  initializeSecurityScanQueue,
  scheduleAllSecurityScans,
  enqueueSecurityScan,
  getQueueStatus,
  cancelScan,
  clearQueue,
  createScheduledScan,
  getScheduledScans,
  updateScheduledScan,
  deleteScheduledScan,
  ScanType,
  ScanFrequency,
  ScanSource,
  ScanStatus
} from './securityScanQueue';

// Export from secure audit trail
export {
  initializeAuditTrail,
  recordAuditEvent,
  getAuditLogs,
  generateAuditReport
} from './secureAuditTrail';

// Export from log reviewer
export {
  initializeLogReviewer,
  reviewSecurityLogs,
  stopLogReviewer
} from './logReviewer';

// Re-export dependency updater
export {
  scanDependencies,
  generateUpdatePlan,
  applySafeUpdates,
  applySecurityUpdates
} from '../utils/dependencyUpdater';

/**
 * Initialize all security components
 * This is the main function to initialize all security-related functionality
 */
export function initializeSecurity(): void {
  // Use the enhanced security module which initializes all components
  // Import directly from the enhancedSecurityModule to avoid circular dependencies
  import('./enhancedSecurityModule').then(({ initializeEnhancedSecurity }) => {
    initializeEnhancedSecurity();
  }).catch(error => {
    console.error('Failed to initialize enhanced security:', error);
  });
}