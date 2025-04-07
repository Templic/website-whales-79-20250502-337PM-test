/**
 * Background database services and maintenance tasks
 */

import { pgPool } from './db';
import { executeWithCircuitBreaker } from './resilience';
import { logSecurityEvent } from './security/security';

// Track background services
const backgroundServices: {
  [serviceName: string]: {
    name: string;
    interval: NodeJS.Timeout | null;
    lastRun: number;
    status: 'running' | 'stopped' | 'error';
    errorCount: number;
  }
} = {};

/**
 * Initialize background database services
 */
export async function initBackgroundServices(): Promise<boolean> {
  console.log('Initializing background database services...');
  
  // Setup scheduled database maintenance
  setupDatabaseMaintenance();
  
  // Setup data cleanup
  setupDataCleanup();
  
  // Setup periodic stat refresh
  setupStatRefresh();
  
  console.log('Background database services initialized successfully');
  return true;
}

/**
 * Shutdown background services
 */
export async function shutdownBackgroundServices(): Promise<void> {
  console.log('Shutting down background database services...');
  
  // Stop all scheduled intervals
  Object.values(backgroundServices).forEach(service => {
    if (service.interval) {
      clearInterval(service.interval);
      service.interval = null;
      service.status = 'stopped';
    }
  });
  
  console.log('Background services shutdown complete');
}

/**
 * Setup database maintenance schedule
 */
function setupDatabaseMaintenance(): void {
  // Register service
  backgroundServices.maintenance = {
    name: 'Database Maintenance',
    interval: null,
    lastRun: 0,
    status: 'stopped',
    errorCount: 0
  };
  
  // Run vacuum analyze daily
  const dailyMaintenanceInterval = 24 * 60 * 60 * 1000; // 24 hours
  
  // Set up interval for database maintenance
  const interval = setInterval(async () => {
    try {
      backgroundServices.maintenance.status = 'running';
      
      // Run with circuit breaker to prevent database overload
      await executeWithCircuitBreaker('maintenance', async () => {
        const client = await pgPool.connect();
        try {
          console.log('Running scheduled VACUUM ANALYZE...');
          await client.query('VACUUM ANALYZE');
          console.log('Scheduled VACUUM ANALYZE completed successfully');
          
          // Reset error count on success
          backgroundServices.maintenance.errorCount = 0;
        } finally {
          client.release();
        }
      });
      
      backgroundServices.maintenance.lastRun = Date.now();
      backgroundServices.maintenance.status = 'stopped';
    } catch (error) {
      console.error('Database maintenance error:', error);
      
      // Increment error count
      backgroundServices.maintenance.errorCount++;
      backgroundServices.maintenance.status = 'error';
      
      // Log security event
      logSecurityEvent({
        type: 'ERROR',
        details: 'Scheduled database maintenance failed',
        severity: 'medium',
        metadata: {
          errorCount: backgroundServices.maintenance.errorCount,
          error: (error as Error).message
        }
      });
      
      // Stop service if too many consecutive errors
      if (backgroundServices.maintenance.errorCount >= 5) {
        console.error('Too many database maintenance errors, stopping service');
        clearInterval(interval);
        backgroundServices.maintenance.interval = null;
        backgroundServices.maintenance.status = 'stopped';
        
        logSecurityEvent({
          type: 'ALERT',
          details: 'Database maintenance service stopped due to too many errors',
          severity: 'high'
        });
      }
    }
  }, dailyMaintenanceInterval);
  
  // Store the interval reference
  backgroundServices.maintenance.interval = interval;
  
  // Immediate first run (don't await)
  executeWithCircuitBreaker('maintenance', async () => {
    try {
      const client = await pgPool.connect();
      try {
        console.log('Running initial VACUUM ANALYZE...');
        await client.query('VACUUM ANALYZE');
        console.log('Initial VACUUM ANALYZE completed successfully');
        backgroundServices.maintenance.lastRun = Date.now();
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Initial database maintenance error:', error);
      backgroundServices.maintenance.errorCount++;
      backgroundServices.maintenance.status = 'error';
    }
  });
}

/**
 * Setup data cleanup schedule
 */
function setupDataCleanup(): void {
  // Register service
  backgroundServices.cleanup = {
    name: 'Data Cleanup',
    interval: null,
    lastRun: 0,
    status: 'stopped',
    errorCount: 0
  };
  
  // Run cleanup weekly
  const weeklyCleanupInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  // Set up interval for data cleanup
  const interval = setInterval(async () => {
    try {
      backgroundServices.cleanup.status = 'running';
      
      // Run with circuit breaker to prevent database overload
      await executeWithCircuitBreaker('cleanup', async () => {
        const client = await pgPool.connect();
        try {
          // Clean up expired tokens/sessions/temporary data
          console.log('Running scheduled data cleanup...');
          
          // Delete old audit logs (older than 90 days)
          const auditLogsResult = await client.query(`
            DELETE FROM audit_logs
            WHERE created_at < NOW() - INTERVAL '90 days'
          `).catch(err => {
            console.log('No audit_logs table found, skipping cleanup');
            return { rowCount: 0 };
          });
          
          // Clean other expired data...
          
          console.log(`Scheduled data cleanup completed successfully. Removed ${auditLogsResult.rowCount} old audit logs.`);
          
          // Reset error count on success
          backgroundServices.cleanup.errorCount = 0;
        } finally {
          client.release();
        }
      });
      
      backgroundServices.cleanup.lastRun = Date.now();
      backgroundServices.cleanup.status = 'stopped';
    } catch (error) {
      console.error('Data cleanup error:', error);
      
      // Increment error count
      backgroundServices.cleanup.errorCount++;
      backgroundServices.cleanup.status = 'error';
      
      // Log security event
      logSecurityEvent({
        type: 'ERROR',
        details: 'Scheduled data cleanup failed',
        severity: 'medium',
        metadata: {
          errorCount: backgroundServices.cleanup.errorCount,
          error: (error as Error).message
        }
      });
      
      // Stop service if too many consecutive errors
      if (backgroundServices.cleanup.errorCount >= 5) {
        console.error('Too many data cleanup errors, stopping service');
        clearInterval(interval);
        backgroundServices.cleanup.interval = null;
        backgroundServices.cleanup.status = 'stopped';
        
        logSecurityEvent({
          type: 'ALERT',
          details: 'Data cleanup service stopped due to too many errors',
          severity: 'high'
        });
      }
    }
  }, weeklyCleanupInterval);
  
  // Store the interval reference
  backgroundServices.cleanup.interval = interval;
}

/**
 * Setup database statistics refresh schedule
 */
function setupStatRefresh(): void {
  // Register service
  backgroundServices.statRefresh = {
    name: 'Stat Refresh',
    interval: null,
    lastRun: 0,
    status: 'stopped',
    errorCount: 0
  };
  
  // Run statistics refresh every 12 hours
  const statRefreshInterval = 12 * 60 * 60 * 1000; // 12 hours
  
  // Set up interval for statistics refresh
  const interval = setInterval(async () => {
    try {
      backgroundServices.statRefresh.status = 'running';
      
      // Run with circuit breaker to prevent database overload
      await executeWithCircuitBreaker('statRefresh', async () => {
        const client = await pgPool.connect();
        try {
          console.log('Running scheduled statistics refresh...');
          await client.query('ANALYZE');
          console.log('Statistics refresh completed successfully');
          
          // Reset error count on success
          backgroundServices.statRefresh.errorCount = 0;
        } finally {
          client.release();
        }
      });
      
      backgroundServices.statRefresh.lastRun = Date.now();
      backgroundServices.statRefresh.status = 'stopped';
    } catch (error) {
      console.error('Statistics refresh error:', error);
      
      // Increment error count
      backgroundServices.statRefresh.errorCount++;
      backgroundServices.statRefresh.status = 'error';
      
      // Log security event
      logSecurityEvent({
        type: 'ERROR',
        details: 'Scheduled statistics refresh failed',
        severity: 'low',
        metadata: {
          errorCount: backgroundServices.statRefresh.errorCount,
          error: (error as Error).message
        }
      });
      
      // Stop service if too many consecutive errors
      if (backgroundServices.statRefresh.errorCount >= 5) {
        console.error('Too many statistics refresh errors, stopping service');
        clearInterval(interval);
        backgroundServices.statRefresh.interval = null;
        backgroundServices.statRefresh.status = 'stopped';
        
        logSecurityEvent({
          type: 'WARNING',
          details: 'Statistics refresh service stopped due to too many errors',
          severity: 'medium'
        });
      }
    }
  }, statRefreshInterval);
  
  // Store the interval reference
  backgroundServices.statRefresh.interval = interval;
}

/**
 * Get status of all background services
 */
export function getBackgroundServicesStatus(): any {
  return Object.entries(backgroundServices).map(([id, service]) => ({
    id,
    name: service.name,
    status: service.status,
    lastRun: service.lastRun > 0 ? new Date(service.lastRun).toISOString() : null,
    errorCount: service.errorCount
  }));
}

/**
 * Manually run a specific background service
 */
export async function runBackgroundService(serviceId: string): Promise<any> {
  const service = backgroundServices[serviceId];
  
  if (!service) {
    throw new Error(`Background service '${serviceId}' not found`);
  }
  
  if (service.status === 'running') {
    throw new Error(`Background service '${serviceId}' is already running`);
  }
  
  // Implement custom logic based on service ID
  switch (serviceId) {
    case 'maintenance':
      return executeWithCircuitBreaker('maintenance', async () => {
        const client = await pgPool.connect();
        try {
          service.status = 'running';
          console.log('Running manual VACUUM ANALYZE...');
          await client.query('VACUUM ANALYZE');
          console.log('Manual VACUUM ANALYZE completed successfully');
          service.lastRun = Date.now();
          service.status = 'stopped';
          return { success: true, message: 'Maintenance completed successfully' };
        } finally {
          client.release();
        }
      });
      
    case 'cleanup':
      return executeWithCircuitBreaker('cleanup', async () => {
        const client = await pgPool.connect();
        try {
          service.status = 'running';
          console.log('Running manual data cleanup...');
          
          // Example: Delete old audit logs (older than 90 days)
          const auditLogsResult = await client.query(`
            DELETE FROM audit_logs
            WHERE created_at < NOW() - INTERVAL '90 days'
          `).catch(() => ({ rowCount: 0 }));
          
          console.log(`Manual data cleanup completed. Removed ${auditLogsResult.rowCount} old audit logs.`);
          service.lastRun = Date.now();
          service.status = 'stopped';
          return {
            success: true,
            message: 'Cleanup completed successfully',
            details: { removedAuditLogs: auditLogsResult.rowCount }
          };
        } finally {
          client.release();
        }
      });
      
    case 'statRefresh':
      return executeWithCircuitBreaker('statRefresh', async () => {
        const client = await pgPool.connect();
        try {
          service.status = 'running';
          console.log('Running manual statistics refresh...');
          await client.query('ANALYZE');
          console.log('Manual statistics refresh completed successfully');
          service.lastRun = Date.now();
          service.status = 'stopped';
          return { success: true, message: 'Statistics refresh completed successfully' };
        } finally {
          client.release();
        }
      });
      
    default:
      throw new Error(`Service '${serviceId}' does not support manual execution`);
  }
}

export default {
  initBackgroundServices,
  shutdownBackgroundServices,
  getBackgroundServicesStatus,
  runBackgroundService
};