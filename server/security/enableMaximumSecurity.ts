/**
 * Enable Maximum Security
 * 
 * This module enables the maximum security features across the application,
 * activating all available security controls at their highest settings.
 */

import * as express from 'express';
import { initializeSecurity } from './index';
import { runMaximumSecurityScan } from './maximumSecurityScan';
import { RASPProtectionLevel } from './advanced/rasp/RASPManager';
import { securityBlockchain, SecurityEventSeverity, SecurityEventCategory } from './advanced/blockchain/ImmutableSecurityLogs';
import { securityFabric } from './advanced/SecurityFabric';

/**
 * Enable maximum security
 */
export async function enableMaximumSecurity(app: express.Application): Promise<void> {
  console.log('[Security] Enabling MAXIMUM security protection...');
  
  try {
    // Initialize security with maximum settings
    await initializeSecurity(app, {
      mode: 'maximum',
      advanced: true,
      logAllRequests: true,
      enableRASP: true,
      raspProtectionLevel: RASPProtectionLevel.PREVENTION
    });
    
    // Log maximum security activation
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.HIGH,
      category: SecurityEventCategory.SYSTEM,
      message: 'MAXIMUM security mode activated',
      metadata: {
        activationTime: new Date().toISOString(),
        activatedBy: 'system'
      }
    });
    
    // Register security components for maximum security
    securityFabric.registerComponent({
      name: 'MaximumSecurityMonitor',
      description: 'Monitors the system for security events in maximum security mode',
      async processEvent(event) {
        console.log(`[MaximumSecurity] Processing security event in MAXIMUM mode: ${event.message}`);
        
        // In a real implementation, would take additional actions based on events
      }
    });
    
    // Run initial security scan
    console.log('[Security] Running initial maximum security scan...');
    const scanResult = await runMaximumSecurityScan();
    
    console.log(`[Security] Initial scan complete: found ${scanResult.findings.length} security findings`);
    
    // Set up recurring scans
    const scanIntervalMinutes = 120; // 2 hours
    setInterval(async () => {
      try {
        console.log('[Security] Running scheduled maximum security scan...');
        await runMaximumSecurityScan();
      } catch (error) {
        console.error('[Security] Error in scheduled security scan:', error);
      }
    }, scanIntervalMinutes * 60 * 1000);
    
    console.log('[Security] MAXIMUM security protection enabled successfully');
  } catch (error) {
    console.error('[Security] Error enabling maximum security:', error);
    
    // Log failure
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.CRITICAL,
      category: SecurityEventCategory.SYSTEM,
      message: 'Failed to enable MAXIMUM security mode',
      metadata: { error: error instanceof Error ? error.message : String(error) }
    });
    
    throw error;
  }
}