/**
 * @file SecurityFabric.ts
 * @description Core security foundation that integrates multiple security components
 */

import { v4 as uuidv4 } from 'uuid';
import { SecurityEvent } from './blockchain/SecurityEvent';
import { SecurityEventTypes } from './blockchain/SecurityEventTypes';
import { immutableSecurityLogs } from './blockchain/ImmutableSecurityLogs';
import { Logger } from '../../utils/Logger';

/**
 * The SecurityFabric integrates all security mechanisms into a unified entity.
 * It provides centralized management of security events, logging, monitoring, 
 * and responses across the system.
 */
class SecurityFabricImpl {
  private initialized: boolean = false;
  private systemId: string = '';
  private startTime: number = 0;
  
  /**
   * Initialize the security fabric
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    this.systemId = uuidv4();
    this.startTime = Date.now();
    
    // Initialize the immutable security logs
    immutableSecurityLogs.initialize();
    
    // Log initialization
    this.logEvent({
      type: SecurityEventTypes.SECURITY_INITIALIZATION,
      message: 'Security fabric initialization',
      source: 'SecurityFabric',
      attributes: {
        systemId: this.systemId,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`[SECURITY-FABRIC] Security fabric initialized with ID ${this.systemId}`);
    this.initialized = true;
  }
  
  /**
   * Log a security event
   * 
   * @param event Security event to log
   * @returns Promise resolving to the event ID
   */
  public logEvent(event: SecurityEvent): string {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Ensure required properties
    const eventWithDefaults: SecurityEvent = {
      ...event,
      id: event.id || uuidv4(),
      timestamp: event.timestamp || Date.now()
    };
    
    // Log to immutable storage
    const logId = immutableSecurityLogs.addLog({
      type: eventWithDefaults.type.toString(),
      details: {
        event: eventWithDefaults
      }
    });
    
    // Also log to system logs for real-time monitoring
    const severity = eventWithDefaults.severity || 'low';
    const logLevel = severity === 'critical' || severity === 'high' ? 'error' 
                   : severity === 'medium' ? 'warn' : 'info';
    
    Logger[logLevel](`[SECURITY-EVENT] ${eventWithDefaults.message || eventWithDefaults.type}`, {
      eventId: eventWithDefaults.id,
      type: eventWithDefaults.type,
      source: eventWithDefaults.source,
      severity
    });
    
    return logId;
  }
  
  /**
   * Retrieve security events with filtering and paging
   */
  public getEvents(options: {
    type?: SecurityEventTypes;
    source?: string;
    severity?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
  }): any[] {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Form the search options for immutable logs
    const searchOptions: any = {
      types: options.type ? [options.type.toString()] : undefined,
      startTime: options.startTime,
      endTime: options.endTime,
      limit: options.limit,
      offset: options.offset
    };
    
    // Search for logs matching criteria
    const logs = immutableSecurityLogs.searchLogs(searchOptions);
    
    // Extract and further filter events
    return logs
      .map(log => log.details?.event as SecurityEvent)
      .filter(event => {
        // Apply additional filters that couldn't be applied in the search
        if (options.source && event.source !== options.source) {
          return false;
        }
        if (options.severity && event.severity !== options.severity) {
          return false;
        }
        return true;
      });
  }
  
  /**
   * Get statistics about security events
   */
  public getStats(): any {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Get blockchain stats
    const blockchainStats = immutableSecurityLogs.getStats();
    
    // Add our own stats
    return {
      ...blockchainStats,
      uptime: Date.now() - this.startTime,
      systemId: this.systemId
    };
  }
  
  /**
   * Verify the integrity of the security logs
   */
  public verifyIntegrity(): { valid: boolean; issues?: any[] } {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Check blockchain integrity
    const integrityResult = immutableSecurityLogs.verifyIntegrity();
    
    return {
      valid: integrityResult.valid,
      issues: integrityResult.invalidBlocks.length > 0 ? 
        integrityResult.invalidBlocks.map(index => ({ blockIndex: index })) : undefined
    };
  }
  
  /**
   * Shutdown the security fabric
   */
  public shutdown(): void {
    if (!this.initialized) {
      return;
    }
    
    // Log shutdown event
    this.logEvent({
      type: SecurityEventTypes.SECURITY_SHUTDOWN,
      message: 'Security fabric shutdown',
      source: 'SecurityFabric',
      attributes: {
        systemId: this.systemId,
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clean up resources
    immutableSecurityLogs.cleanup();
    
    this.initialized = false;
    console.log('[SECURITY-FABRIC] Security fabric shutdown completed');
  }
}

// Export singleton instance
export const SecurityFabric = new SecurityFabricImpl();