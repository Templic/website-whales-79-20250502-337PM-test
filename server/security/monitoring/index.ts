/**
 * Security Monitoring System - Main Entry Point
 * 
 * This file initializes and coordinates all components of the Phase 3 PCI compliance 
 * monitoring and incident response system.
 */

import { log } from '../../utils/logger';
import { eventAggregator, initializeEventAggregator } from './EventAggregator';
import { incidentManager, initializeIncidentManager } from './IncidentManager';
import { monitoringDashboard, initializeMonitoringDashboard } from './MonitoringDashboard';
import { breachDetection, initializeBreachDetection } from './BreachDetection';
import { recordAuditEvent } from '../secureAuditTrail';

/**
 * Initialize the entire security monitoring system
 */
export async function initializeSecurityMonitoring(): Promise<void> {
  try {
    log('Initializing security monitoring system (PCI Phase 3)', 'security');
    
    // Step 1: Initialize the event aggregator
    initializeEventAggregator();
    log('Event aggregator initialized', 'security');
    
    // Step 2: Initialize the incident manager
    await initializeIncidentManager();
    log('Incident manager initialized', 'security');
    
    // Step 3: Initialize the monitoring dashboard
    initializeMonitoringDashboard();
    log('Monitoring dashboard initialized', 'security');
    
    // Step 4: Initialize the breach detection system
    await initializeBreachDetection();
    log('Breach detection system initialized', 'security');
    
    // Log successful initialization
    recordAuditEvent({
      type: 'security',
      subtype: 'system',
      action: 'initialized',
      status: 'success',
      severity: 'medium',
      userId: 'system',
      data: {
        component: 'monitoring-system',
        pciPhase: 'phase-3',
        timestamp: new Date().toISOString()
      }
    });
    
    log('Security monitoring system fully initialized', 'security');
    return;
  } catch (error) {
    log(`Failed to initialize security monitoring system: ${error}`, 'error');
    
    // Log the failure
    recordAuditEvent({
      type: 'security',
      subtype: 'system',
      action: 'initialized',
      status: 'failure',
      severity: 'high',
      userId: 'system',
      data: {
        component: 'monitoring-system',
        pciPhase: 'phase-3',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    });
    
    throw error;
  }
}

/**
 * Shut down the security monitoring system
 */
export function shutdownSecurityMonitoring(): void {
  try {
    log('Shutting down security monitoring system', 'security');
    
    // Shutdown components in reverse order
    monitoringDashboard.shutdown();
    incidentManager.shutdown();
    eventAggregator.shutdown();
    
    log('Security monitoring system shut down successfully', 'security');
  } catch (error) {
    log(`Error shutting down security monitoring system: ${error}`, 'error');
  }
}

/**
 * Integrate with existing security systems
 */
export function integrateWithExistingSecurity(): void {
  try {
    // Add hooks to capture security events from existing components
    log('Integrating monitoring system with existing security components', 'security');
    
    // This will be expanded as needed to connect with other components
  } catch (error) {
    log(`Error integrating with existing security: ${error}`, 'error');
  }
}

// Export components for use in other modules
export {
  eventAggregator,
  incidentManager,
  monitoringDashboard
};