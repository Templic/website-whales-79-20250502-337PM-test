/**
 * Unified Security Service
 * 
 * This module integrates all three phases of PCI compliance implementation
 * into a single, cohesive security framework that works seamlessly with the application.
 */

import { log } from '../utils/logger';
import { recordAuditEvent } from './secureAuditTrail';
import { TransactionSecurityMonitor } from './TransactionSecurityMonitor';
import { PaymentValidationService } from '../validation/PaymentValidationService';
import { initializeSecurityMonitoring, eventAggregator, incidentManager, monitoringDashboard, breachDetection } from './monitoring';
import { SecurityEventType as EventCategory } from './monitoring/types';
import { IncidentSeverity, IncidentSource } from './monitoring/types';

/**
 * Unified security service that provides a simplified API for the application
 * to interact with all security components
 */
export class UnifiedSecurityService {
  private initialized = false;
  
  /**
   * Initialize the unified security service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      log('Initializing unified security service', 'security');
      
      // Initialize Phase 3 monitoring components
      await initializeSecurityMonitoring();
      
      // Register for application events to detect and respond to security incidents
      this.setupEventHandlers();
      
      log('Unified security service initialized successfully', 'security');
      this.initialized = true;
      
      // Record successful initialization
      recordAuditEvent({
        type: 'security',
        subtype: 'system',
        action: 'initialize',
        status: 'success',
        severity: 'info',
        userId: 'system',
        data: {
          component: 'unified-security-service',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      log(`Error initializing unified security service: ${error}`, 'error');
      
      // Record initialization failure
      recordAuditEvent({
        type: 'security',
        subtype: 'system',
        action: 'initialize',
        status: 'failure',
        severity: 'high',
        userId: 'system',
        data: {
          component: 'unified-security-service',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Set up event handlers to integrate security components
   */
  private setupEventHandlers(): void {
    // This would typically hook into application events
    log('Setting up security event handlers', 'security');
  }
  
  /**
   * Process and secure a payment transaction
   * Integrates Phase 1 and Phase 2 components
   */
  public async securePaymentTransaction(transaction: any): Promise<{ valid: boolean; result: any }> {
    try {
      // Phase 1: Validate payment data
      const validator = new PaymentValidationService();
      const validationResult = await validator.validatePayment(transaction);
      
      if (!validationResult.valid) {
        // Record validation failure
        recordAuditEvent({
          type: 'payment',
          subtype: 'validation',
          action: 'validate',
          status: 'failure',
          severity: 'medium',
          userId: transaction.userId || 'anonymous',
          data: {
            transactionId: transaction.id,
            errors: validationResult.errors,
            timestamp: new Date().toISOString()
          }
        });
        
        // Add event for aggregation (Phase 3)
        eventAggregator.addEvent({
          type: 'payment',
          subtype: 'validation',
          status: 'failure',
          userId: transaction.userId || 'anonymous',
          data: {
            transactionId: transaction.id,
            ipAddress: transaction.ipAddress,
            errors: validationResult.errors.length
          }
        });
        
        return { valid: false, result: validationResult };
      }
      
      // Phase 2: Monitor transaction for anomalies
      const monitor = new TransactionSecurityMonitor();
      const monitoringResult = await monitor.analyzeTransaction(transaction);
      
      if (monitoringResult.flagged) {
        // Create security incident (Phase 3)
        incidentManager.createIncident(
          `Suspicious payment transaction flagged`,
          `Transaction ${transaction.id} flagged: ${monitoringResult.reason}`,
          IncidentSeverity.MEDIUM,
          EventCategory.PAYMENT,
          IncidentSource.SYSTEM_ALERT,
          ['payment', 'suspicious-activity'],
          []
        );
        
        // Record monitoring flag
        recordAuditEvent({
          type: 'payment',
          subtype: 'monitoring',
          action: 'flag',
          status: 'warning',
          severity: 'medium',
          userId: transaction.userId || 'anonymous',
          data: {
            transactionId: transaction.id,
            reason: monitoringResult.reason,
            timestamp: new Date().toISOString()
          }
        });
        
        // Add event for aggregation (Phase 3)
        eventAggregator.addEvent({
          type: 'payment',
          subtype: 'monitoring',
          status: 'flagged',
          userId: transaction.userId || 'anonymous',
          data: {
            transactionId: transaction.id,
            ipAddress: transaction.ipAddress,
            amount: transaction.amount,
            reason: monitoringResult.reason
          }
        });
      }
      
      // Record successful transaction processing
      recordAuditEvent({
        type: 'payment',
        subtype: 'processing',
        action: 'process',
        status: 'success',
        severity: 'info',
        userId: transaction.userId || 'anonymous',
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          timestamp: new Date().toISOString()
        }
      });
      
      // Add event for aggregation (Phase 3)
      eventAggregator.addEvent({
        type: 'payment',
        subtype: 'transaction',
        status: 'success',
        userId: transaction.userId || 'anonymous',
        data: {
          transactionId: transaction.id,
          ipAddress: transaction.ipAddress,
          amount: transaction.amount
        }
      });
      
      return { 
        valid: true, 
        result: { 
          ...monitoringResult,
          transaction: validationResult.data
        } 
      };
    } catch (error) {
      // Record error
      recordAuditEvent({
        type: 'payment',
        subtype: 'error',
        action: 'process',
        status: 'failure',
        severity: 'high',
        userId: transaction.userId || 'anonymous',
        data: {
          transactionId: transaction.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      });
      
      // Add event for aggregation (Phase 3)
      eventAggregator.addEvent({
        type: 'payment',
        subtype: 'error',
        status: 'failure',
        userId: transaction.userId || 'anonymous',
        data: {
          transactionId: transaction.id,
          ipAddress: transaction.ipAddress,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Create incident for critical errors
      incidentManager.createIncident(
        `Payment processing error`,
        `Error processing transaction ${transaction.id}: ${error instanceof Error ? error.message : String(error)}`,
        IncidentSeverity.HIGH,
        EventCategory.PAYMENT,
        IncidentSource.SYSTEM_ALERT,
        ['payment', 'error'],
        []
      );
      
      throw error;
    }
  }
  
  /**
   * Handle authentication events
   * Integrates all three phases
   */
  public async processAuthEvent(authEvent: any): Promise<void> {
    try {
      // Record the authentication event (Phase 1)
      recordAuditEvent({
        type: 'authentication',
        subtype: authEvent.type,
        action: authEvent.action,
        status: authEvent.status,
        severity: authEvent.status === 'failure' ? 'medium' : 'info',
        userId: authEvent.userId || 'anonymous',
        data: {
          ipAddress: authEvent.ipAddress,
          userAgent: authEvent.userAgent,
          timestamp: new Date().toISOString()
        }
      });
      
      // Add event for aggregation (Phase 3)
      eventAggregator.addEvent({
        type: 'authentication',
        subtype: authEvent.type,
        status: authEvent.status,
        userId: authEvent.userId || 'anonymous',
        data: {
          ipAddress: authEvent.ipAddress,
          userAgent: authEvent.userAgent
        }
      });
      
      // Check for suspicious authentication patterns (Phase 2 + 3)
      if (authEvent.status === 'failure') {
        // For demonstration purposes, force an aggregation to get latest metrics
        const metrics = eventAggregator.forceAggregation();
        
        // Check for excessive failures
        if (metrics?.authStats && metrics.authStats.failureRate > 0.3) {
          // Create incident for suspicious authentication activity
          incidentManager.createIncident(
            `Suspicious authentication activity`,
            `High authentication failure rate detected: ${(metrics.authStats.failureRate * 100).toFixed(1)}%`,
            IncidentSeverity.MEDIUM,
            EventCategory.AUTHENTICATION,
            IncidentSource.ANOMALY_DETECTION,
            ['authentication', 'brute-force'],
            []
          );
        }
      }
    } catch (error) {
      log(`Error processing authentication event: ${error}`, 'error');
    }
  }
  
  /**
   * Process API requests for security validation
   * Primarily uses Phase 2 components
   */
  public async validateApiRequest(request: any): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      // This would integrate with API validation middleware
      // For demonstration, we just record the event
      
      // Add event for aggregation (Phase 3)
      eventAggregator.addEvent({
        type: 'api',
        subtype: request.type || 'request',
        status: 'received',
        userId: request.userId || 'anonymous',
        data: {
          path: request.path,
          method: request.method,
          ipAddress: request.ipAddress
        }
      });
      
      return { valid: true };
    } catch (error) {
      log(`Error validating API request: ${error}`, 'error');
      return { valid: false, errors: [error instanceof Error ? error.message : String(error)] };
    }
  }
  
  /**
   * Get current security status summary
   * Primarily uses Phase 3 components
   */
  public getSecurityStatus(): any {
    try {
      // Get current security metrics
      const metrics = monitoringDashboard.getCurrentMetrics();
      
      // Get compliance status
      const complianceStatus = monitoringDashboard.getPciComplianceStatus();
      
      // Check for active incidents
      const activeIncidents = incidentManager.getIncidents().filter(
        incident => incident.status !== 'resolved' && incident.status !== 'closed'
      );
      
      return {
        securityMetrics: metrics,
        complianceStatus,
        activeIncidents: activeIncidents.length,
        riskScore: metrics.overall.riskScore,
        threatLevel: metrics.overall.threatLevel,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log(`Error getting security status: ${error}`, 'error');
      return {
        error: 'Unable to retrieve security status',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Perform a security scan of critical components
   * Uses Phase 3 components
   */
  public async performSecurityScan(): Promise<any> {
    try {
      // Perform file integrity scan
      const fileIntegrityResults = await breachDetection.performFileIntegrityScan();
      
      // Check for anomalies
      const anomalyResults = await breachDetection.checkForAnomalies();
      
      // Check for data leakage
      const dataLeakageResults = await breachDetection.checkForDataLeakage();
      
      // Force metrics aggregation
      eventAggregator.forceAggregation();
      
      return {
        fileIntegrity: {
          scanned: fileIntegrityResults.length,
          changed: fileIntegrityResults.filter(r => r.status === 'changed').length,
          missing: fileIntegrityResults.filter(r => r.status === 'missing').length,
          new: fileIntegrityResults.filter(r => r.status === 'new').length,
        },
        anomalies: anomalyResults.length,
        dataLeakage: dataLeakageResults.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log(`Error performing security scan: ${error}`, 'error');
      return {
        error: 'Unable to complete security scan',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Shutdown the security service
   */
  public async shutdown(): Promise<void> {
    try {
      log('Shutting down unified security service', 'security');
      
      // Final event aggregation
      eventAggregator.forceAggregation();
      
      // Record shutdown
      recordAuditEvent({
        type: 'security',
        subtype: 'system',
        action: 'shutdown',
        status: 'success',
        severity: 'info',
        userId: 'system',
        data: {
          component: 'unified-security-service',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      log(`Error shutting down unified security service: ${error}`, 'error');
    }
  }
}

// Create singleton instance
export const unifiedSecurity = new UnifiedSecurityService();

// Export initialization function
export async function initializeUnifiedSecurity(): Promise<void> {
  return unifiedSecurity.initialize();
}