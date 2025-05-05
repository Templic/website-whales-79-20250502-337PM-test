/**
 * Background Services Manager
 * 
 * Handles initialization and management of background tasks
 * that run periodically but are not critical to server startup.
 */

import { log } from './vite';
import { config } from './config';
import { runDeferredSecurityScan } from './securityScan';
import { scheduleIntelligentMaintenance } from './db-maintenance';
import { startContentScheduler, stopContentScheduler } from './services/backgroundServices';
import { 
  initializeSecurityScanQueue, 
  scheduleAllSecurityScans,
  enqueueSecurityScan,
  getQueueStatus
} from './security/securityScanQueue';
import { initializeSystemMonitor } from './lib/systemMonitor';
import { initializeMetricsScheduler, checkAndRunInitialMetrics } from './scheduled-tasks/ts-error-metrics-scheduler';

// Track active background services
interface ServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'failed';
  startTime?: number;
  lastRunTime?: number;
  interval?: number;
  error?: string;
}

const backgroundServices: Record<string, ServiceStatus> = {
  databaseMaintenance: { name: 'Database Maintenance', status: 'inactive' },
  securityScans: { name: 'Security Scanning', status: 'inactive' },
  metricsCollection: { name: 'Metrics Collection', status: 'inactive' },
  dataCleanup: { name: 'Data Cleanup', status: 'inactive' },
  contentScheduler: { name: 'Content Scheduler', status: 'inactive' },
};

/**
 * Initialize all background services based on configuration
 */
export async function initBackgroundServices(): Promise<void> {
  if (!config.features.enableBackgroundTasks) {
    log('Background services are disabled in configuration', 'background');
    return;
  }

  log('Initializing background services...', 'background');
  
  try {
    // Database Maintenance Service
    if (config.features.enableDatabaseOptimization) {
      await initDatabaseMaintenance();
    }
    
    // Security Scanning Service
    if (config.features.enableSecurityScans) {
      await initSecurityScanning();
    }
    
    // Content Scheduler Service
    if (config.features.enableContentScheduling) {
      await initContentScheduler();
    }
    
    // Data Cleanup Service
    await initDataCleanupServices();
    
    // Metrics Collection Service
    await initMetricsCollection();
    
    // Log active services
    const activeServices = Object.values(backgroundServices)
      .filter(service => service.status === 'active')
      .map(service => service.name);
    
    log(`Active background services: ${activeServices.join(', ')}`, 'background');
  } catch (error) {
    log(`Error initializing background services: ${error}`, 'background');
    console.error('Background services initialization error:', error);
  }
}

/**
 * Initialize database maintenance services
 */
async function initDatabaseMaintenance(): Promise<void> {
  try {
    log('Initializing database maintenance service...', 'background');
    
    // Schedule intelligent database maintenance
    await scheduleIntelligentMaintenance();
    
    // Update service status
    backgroundServices.databaseMaintenance = {
      name: 'Database Maintenance',
      status: 'active',
      startTime: Date.now(),
      interval: config.database.maintenanceInterval,
    };
    
    log('Database maintenance service initialized successfully', 'background');
  } catch (error) {
    log(`Failed to initialize database maintenance: ${error}`, 'background');
    backgroundServices.databaseMaintenance = {
      name: 'Database Maintenance',
      status: 'failed',
      error: String(error),
    };
  }
}

/**
 * Initialize security scanning services
 */
async function initSecurityScanning(): Promise<void> {
  try {
    log('Initializing enhanced security scanning service...', 'background');
    
    // Initialize the system monitor for resource tracking
    initializeSystemMonitor();
    
    // Initialize the security scan queue
    initializeSecurityScanQueue();
    
    // Schedule periodic security scans using our queue system
    const scanInterval = config.security.scanInterval;
    
    // Initial scan after 5 minutes of server startup (allowing for initial load to stabilize)
    setTimeout(() => {
      log('Running initial complete security scan...', 'security');
      scheduleAllSecurityScans(true); // true = deep scan
      backgroundServices.securityScans.lastRunTime = Date.now();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Then schedule regular scans based on config interval
    setInterval(() => {
      log('Scheduling periodic complete security scan...', 'security');
      scheduleAllSecurityScans(true); // true = deep scan
      backgroundServices.securityScans.lastRunTime = Date.now();
      
      // Log the current scan queue status
      const queueStatus = getQueueStatus();
      log(`Security scan queue status: ${queueStatus.queued.length} scans in queue, ${queueStatus.running ? 'running scan: ' + queueStatus.running.type : 'no scan running'}`, 'security');
    }, scanInterval);
    
    // Update service status
    backgroundServices.securityScans = {
      name: 'Security Scanning',
      status: 'active',
      startTime: Date.now(),
      interval: scanInterval,
    };
    
    log(`Enhanced security scanning service initialized with ${scanInterval / (1000 * 60 * 60)} hour interval`, 'background');
    log('Security scans will run sequentially without overlapping', 'background');
    log('Deferring initial scan by 5 minutes to allow system to stabilize', 'background');
  } catch (error) {
    log(`Failed to initialize security scanning: ${error}`, 'background');
    backgroundServices.securityScans = {
      name: 'Security Scanning',
      status: 'failed',
      error: String(error),
    };
  }
}

/**
 * Initialize metrics collection
 */
async function initMetricsCollection(): Promise<void> {
  if (process.env.DISABLE_METRICS === 'true') {
    log('Metrics collection disabled by environment variable', 'background');
    backgroundServices.metricsCollection.status = 'inactive';
    return;
  }
  
  try {
    log('Initializing metrics collection service...', 'background');
    
    // Setup metrics collection interval (every 5 minutes)
    const metricsInterval = 5 * 60 * 1000;
    setInterval(() => {
      collectPerformanceMetrics();
      backgroundServices.metricsCollection.lastRunTime = Date.now();
    }, metricsInterval);
    
    // Initialize TypeScript error metrics scheduler
    if (config.features.enableTypeScriptErrorManagement) {
      try {
        log('Initializing TypeScript error metrics scheduler...', 'background');
        
        // Initialize the scheduler with daily collection at 3 AM
        initializeMetricsScheduler('0 3 * * *');
        
        // Run an initial metrics collection to establish baseline
        setTimeout(async () => {
          log('Running initial TypeScript error metrics collection...', 'background');
          await checkAndRunInitialMetrics();
        }, 2 * 60 * 1000); // Run after 2 minutes to let the system stabilize
        
        log('TypeScript error metrics scheduler initialized successfully', 'background');
      } catch (tsError) {
        log(`Failed to initialize TypeScript error metrics scheduler: ${tsError}`, 'background');
        console.error('TypeScript metrics scheduler error:', tsError);
      }
    }
    
    // Update service status
    backgroundServices.metricsCollection = {
      name: 'Metrics Collection',
      status: 'active',
      startTime: Date.now(),
      interval: metricsInterval,
    };
    
    log('Metrics collection service initialized successfully', 'background');
  } catch (error) {
    log(`Failed to initialize metrics collection: ${error}`, 'background');
    backgroundServices.metricsCollection = {
      name: 'Metrics Collection',
      status: 'failed',
      error: String(error),
    };
  }
}

/**
 * Initialize data cleanup services
 */
async function initDataCleanupServices(): Promise<void> {
  try {
    log('Initializing data cleanup service...', 'background');
    
    // Setup daily data cleanup (once per 24 hours)
    const cleanupInterval = 24 * 60 * 60 * 1000;
    setInterval(() => {
      cleanupExpiredData();
      backgroundServices.dataCleanup.lastRunTime = Date.now();
    }, cleanupInterval);
    
    // Update service status
    backgroundServices.dataCleanup = {
      name: 'Data Cleanup',
      status: 'active',
      startTime: Date.now(),
      interval: cleanupInterval,
    };
    
    log('Data cleanup service initialized successfully', 'background');
  } catch (error) {
    log(`Failed to initialize data cleanup: ${error}`, 'background');
    backgroundServices.dataCleanup = {
      name: 'Data Cleanup',
      status: 'failed',
      error: String(error),
    };
  }
}

/**
 * Collect various performance metrics
 * This is a placeholder for actual metrics collection
 */
function collectPerformanceMetrics(): void {
  if (config.features.enableExtraLogging) {
    log('Collecting performance metrics...', 'metrics');
  }
  
  // Memory usage metrics
  const memoryUsage = process.memoryUsage();
  const rss = Math.round(memoryUsage.rss / 1024 / 1024);
  const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  
  // CPU usage metrics (this is a simple way, in production you'd want more sophisticated monitoring)
  const cpuUsage = process.cpuUsage();
  
  if (config.features.enableExtraLogging) {
    log(`Memory Usage: RSS ${rss}MB, Heap Total ${heapTotal}MB, Heap Used ${heapUsed}MB`, 'metrics');
    log(`CPU Usage: User ${cpuUsage.user / 1000}ms, System ${cpuUsage.system / 1000}ms`, 'metrics');
  }
  
  // In a real implementation, you would send these metrics to a monitoring system
}

/**
 * Clean up expired data from the database
 * This is a placeholder for actual data cleanup
 */
function cleanupExpiredData(): void {
  log('Running scheduled data cleanup...', 'cleanup');
  
  // This would typically include tasks like:
  // - Removing expired sessions
  // - Deleting old logs
  // - Archiving old data
  // - Cleaning up temporary files
  
  // Example cleanup operations would be implemented here
  
  log('Data cleanup completed', 'cleanup');
}

/**
 * Initialize content scheduler service
 * This service automatically publishes scheduled content and archives expired content
 */
async function initContentScheduler(): Promise<void> {
  try {
    log('Initializing content scheduler service...', 'background');
    
    // Start the content scheduler service (5-minute interval)
    const intervalID = startContentScheduler(5);
    
    // Update service status
    backgroundServices.contentScheduler = {
      name: 'Content Scheduler',
      status: 'active',
      startTime: Date.now(),
      interval: 5 * 60 * 1000, // 5 minutes
    };
    
    log('Content scheduler service initialized with 5 minute interval', 'background');
  } catch (error) {
    log(`Failed to initialize content scheduler: ${error}`, 'background');
    backgroundServices.contentScheduler = {
      name: 'Content Scheduler',
      status: 'failed',
      error: String(error),
    };
  }
}

/**
 * Get the status of all background services
 */
export function getServicesStatus(): ServiceStatus[] {
  return Object.values(backgroundServices);
}

/**
 * Stop all background services gracefully
 * Used during server shutdown
 */
export async function stopBackgroundServices(): Promise<void> {
  log('Stopping background services...', 'background');
  
  // Stop content scheduler
  if (backgroundServices.contentScheduler.status === 'active') {
    try {
      stopContentScheduler();
      backgroundServices.contentScheduler.status = 'inactive';
      log('Content scheduler stopped', 'background');
    } catch (error) {
      log(`Error stopping content scheduler: ${error}`, 'background');
    }
  }
  
  // In a real implementation, you would stop each service gracefully
  // For example, by clearing intervals and completing any pending operations
  
  for (const key of Object.keys(backgroundServices)) {
    backgroundServices[key].status = 'inactive';
  }
  
  log('All background services stopped', 'background');
}