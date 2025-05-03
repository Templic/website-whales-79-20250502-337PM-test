/**
 * Advanced Security Scan Queue Manager
 * 
 * This module provides a robust mechanism for managing security scans
 * in a sequential, prioritized queue to ensure scans don't overwhelm system resources.
 * 
 * Enhanced features:
 * - Scan result persistence
 * - Historical scan tracking
 * - Advanced filtering and reporting
 * - Priority management system
 * - Scheduled scan capabilities
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { log } from '../vite';
import { getSystemLoad, hasAvailableResources } from '../lib/systemMonitor';

// Security scan types, in order of priority (lower number = higher priority)
export enum ScanType {
  CORE = 'CORE',            // Core Security Framework scan
  API = 'API',              // API Security scan
  AUTH = 'AUTH',            // Authentication Security scan
  DEPENDENCY = 'DEPENDENCY', // Dependency Scanner
  INPUT = 'INPUT',          // Input Validation scan
  COMPLIANCE = 'COMPLIANCE', // Security Compliance scan
  ML = 'ML',                // Machine Learning Security scan
  ADVANCED = 'ADVANCED'     // Advanced Security Features scan
}

// Source of the scan request
export enum ScanSource {
  MANUAL = 'manual',        // Manually triggered by a user
  API = 'api',              // Triggered via API call
  SCHEDULED = 'scheduled',  // Triggered by scheduler
  SYSTEM = 'system',        // Triggered by the system
  CI_CD = 'ci-cd',          // Triggered by CI/CD pipeline
  WEBHOOK = 'webhook'       // Triggered by webhook
}

// Scan schedule frequency
export enum ScanFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

// Scheduled scan configuration
export interface ScheduledScan {
  id: string;              // Unique identifier
  scanType: ScanType;      // Type of scan to run
  deep: boolean;           // Whether to perform a deep scan
  frequency: ScanFrequency; // How often to run
  customCron?: string;     // Custom cron expression (for CUSTOM frequency)
  lastRun?: Date;          // When it was last run
  nextRun: Date;           // When it should run next
  enabled: boolean;        // Whether the schedule is enabled
  tags?: string[];         // Tags for categorizing
  description?: string;    // Description of the scheduled scan
  priority?: number;       // Optional override for scan priority
  persistResults: boolean; // Whether to persist results
}

// Priority mapping for scan types
const ScanPriority: Record<ScanType, number> = {
  [ScanType.CORE]: 1,
  [ScanType.API]: 2,
  [ScanType.AUTH]: 3,
  [ScanType.DEPENDENCY]: 4,
  [ScanType.INPUT]: 5,
  [ScanType.COMPLIANCE]: 6,
  [ScanType.ML]: 7,
  [ScanType.ADVANCED]: 8
};

// Security scan task structure
export interface SecurityScanTask {
  id: string;               // Unique identifier for the scan
  type: ScanType;           // Type of security scan
  deep: boolean;            // Whether to perform a deep scan
  priority: number;         // Priority level (lower = higher priority)
  status: ScanStatus;       // Current status of the scan
  createdAt: Date;          // When the scan was created
  startedAt?: Date;         // When the scan was started (if it has started)
  completedAt?: Date;       // When the scan was completed (if it has completed)
  result?: ScanResult;      // Results of the scan (if completed)
  retryCount: number;       // Number of retry attempts
  error?: string;           // Error message (if failed)
  tags?: string[];          // Tags for categorizing and filtering scans
  source: ScanSource;       // Source of the scan request (manual, scheduled, api, etc.)
  scheduledFor?: Date;      // When the scan is scheduled to run (for scheduled scans)
  persistResults?: boolean; // Whether to persist results to disk
  notes?: string;           // Additional notes about the scan
  reportPath?: string;      // Path to the generated report file
}

// Scan status enumeration
export enum ScanStatus {
  QUEUED = 'queued',       // Waiting in queue
  RUNNING = 'running',     // Currently executing
  COMPLETED = 'completed', // Successfully completed
  FAILED = 'failed',       // Failed to complete
  CANCELED = 'canceled'    // Manually canceled
}

// Scan result structure
export interface ScanResult {
  issuesFound: number;     // Number of security issues identified
  criticalIssues: number;  // Number of critical security issues
  highIssues: number;      // Number of high-severity issues
  mediumIssues: number;    // Number of medium-severity issues
  lowIssues: number;       // Number of low-severity issues
  passedChecks: number;    // Number of security checks that passed
  totalChecks: number;     // Total number of security checks performed
  executionTimeMs: number; // Time taken to complete the scan
  details?: any;           // Detailed scan results (type depends on scan type)
}

// Queue status information
export interface QueueStatus {
  running: SecurityScanTask | null;  // Currently running scan
  queued: SecurityScanTask[];        // Queued scans
  recentlyCompleted: SecurityScanTask[]; // Recently completed scans
  stats: {
    totalCompleted: number;         // Total number of completed scans
    totalFailed: number;            // Total number of failed scans
    avgExecutionTimeMs: number;     // Average execution time
    lastScanCompletedAt?: Date;     // When the last scan completed
  };
  systemLoad: {
    cpuUsage: number;               // Current CPU usage
    memoryUsage: number;            // Current memory usage
  };
}

// Maximum retry attempts for failed scans
const MAX_RETRIES = 3;

// Maximum number of recently completed scans to keep
const MAX_RECENT_COMPLETED = 10;

// Resource thresholds for running scans
const RESOURCE_THRESHOLDS = {
  cpuThreshold: 80,      // Maximum CPU usage percentage
  memoryThreshold: 85,   // Maximum memory usage percentage
  minFreeMemoryMB: 512   // Minimum free memory in MB
};

// Path to store scan results
const REPORTS_DIR = './reports/security';
const HISTORY_DIR = './reports/security/history';

// Security scan queue state
let scanQueue: SecurityScanTask[] = [];
let currentScan: SecurityScanTask | null = null;
let completedScans: SecurityScanTask[] = [];
let scheduledScans: ScheduledScan[] = [];
let statistics = {
  totalCompleted: 0,
  totalFailed: 0,
  totalExecutionTimeMs: 0
};

// Queue processing state
let isProcessing = false;
let isInitialized = false;
let processingInterval: NodeJS.Timeout | null = null;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the security scan queue system
 */
export function initializeSecurityScanQueue(): void {
  if (isInitialized) {
    log('Security scan queue already initialized', 'security');
    return;
  }

  log('Initializing security scan queue system', 'security');
  
  // Ensure directories exist
  ensureReportsDirectory();
  
  // Start the queue processing interval
  processingInterval = setInterval(processQueue, 10000); // Check every 10 seconds
  
  // Start the scheduler interval (check every minute)
  schedulerInterval = setInterval(processScheduledScans, 60000);
  
  isInitialized = true;
  log('Security scan queue initialized and ready to process scans', 'security');
}

/**
 * Process scheduled scans that are due to run
 */
function processScheduledScans(): void {
  const now = new Date();
  
  // Check each scheduled scan
  scheduledScans.forEach(schedule => {
    if (!schedule.enabled) return;
    
    // Check if it's time to run this scan
    if (schedule.nextRun && schedule.nextRun <= now) {
      log(`Scheduled scan ${schedule.id} (${schedule.scanType}) is due to run`, 'security');
      
      // Queue the scan
      const scanId = enqueueSecurityScan(schedule.scanType, schedule.deep, {
        priority: schedule.priority,
        tags: schedule.tags,
        source: ScanSource.SCHEDULED,
        persistResults: schedule.persistResults,
        notes: `Scheduled scan: ${schedule.description || schedule.scanType}`
      });
      
      // Update last run time
      schedule.lastRun = new Date();
      
      // Calculate next run time based on frequency
      schedule.nextRun = calculateNextRunTime(schedule);
      
      log(`Scheduled scan ${schedule.id} queued with ID ${scanId}. Next run: ${schedule.nextRun.toISOString()}`, 'security');
    }
  });
}

/**
 * Calculate the next run time for a scheduled scan
 */
function calculateNextRunTime(schedule: ScheduledScan): Date {
  const now = new Date();
  const nextRun = new Date(now);
  
  switch (schedule.frequency) {
    case ScanFrequency.HOURLY:
      nextRun.setHours(nextRun.getHours() + 1);
      break;
    case ScanFrequency.DAILY:
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    case ScanFrequency.WEEKLY:
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case ScanFrequency.MONTHLY:
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case ScanFrequency.CUSTOM:
      // For custom schedules, we would use a cron parser library
      // For now, default to daily
      nextRun.setDate(nextRun.getDate() + 1);
      break;
  }
  
  return nextRun;
}

/**
 * Process the scan queue
 */
async function processQueue(): Promise<void> {
  // If already processing or queue is empty, do nothing
  if (isProcessing || scanQueue.length === 0 || currentScan !== null) {
    return;
  }

  // Check system resources
  const systemLoad = await getSystemLoad();
  const hasResources = hasAvailableResources(
    systemLoad,
    RESOURCE_THRESHOLDS.cpuThreshold,
    RESOURCE_THRESHOLDS.memoryThreshold,
    RESOURCE_THRESHOLDS.minFreeMemoryMB
  );

  // If system resources are constrained, wait until next interval
  if (!hasResources) {
    log(`Delaying security scan due to resource constraints - CPU: ${systemLoad.cpuUsage.toFixed(1)}%, Memory: ${systemLoad.memoryUsage.toFixed(1)}%`, 'security');
    return;
  }

  // Sort queue by priority
  scanQueue.sort((a, b) => a.priority - b.priority);

  // Get the next scan
  const nextScan = scanQueue.shift();
  if (!nextScan) return;

  // Mark as processing
  isProcessing = true;
  currentScan = nextScan;
  currentScan.status = ScanStatus.RUNNING;
  currentScan.startedAt = new Date();

  log(`Starting security scan: ${currentScan.type} (${currentScan.deep ? 'deep' : 'quick'})`, 'security');

  try {
    // Simulate scan execution
    const result = await executeSecurityScan(currentScan);
    
    // Mark as completed
    currentScan.status = ScanStatus.COMPLETED;
    currentScan.completedAt = new Date();
    currentScan.result = result;
    
    // Update statistics
    const executionTime = currentScan.completedAt.getTime() - currentScan.startedAt!.getTime();
    statistics.totalCompleted++;
    statistics.totalExecutionTimeMs += executionTime;
    
    // Persist scan result if requested
    if (currentScan.persistResults) {
      persistScanResult(currentScan);
    }
    
    // Add to completed scans
    completedScans.unshift(currentScan);
    if (completedScans.length > MAX_RECENT_COMPLETED) {
      completedScans.pop(); // Remove oldest
    }
    
    log(`Security scan completed: ${currentScan.type} - found ${result.issuesFound} issues (${result.criticalIssues} critical)`, 'security');
  } catch (error: unknown) {
    // Handle scan failure
    currentScan.retryCount++;
    
    // Safe error message extraction
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (currentScan.retryCount < MAX_RETRIES) {
      // Re-queue with same priority
      log(`Security scan failed: ${currentScan.type}, retrying (attempt ${currentScan.retryCount})`, 'security');
      currentScan.status = ScanStatus.QUEUED;
      currentScan.error = errorMessage;
      scanQueue.push(currentScan);
    } else {
      // Mark as failed after max retries
      currentScan.status = ScanStatus.FAILED;
      currentScan.completedAt = new Date();
      currentScan.error = errorMessage;
      
      // Update statistics
      statistics.totalFailed++;
      
      // Add to completed scans
      completedScans.unshift(currentScan);
      if (completedScans.length > MAX_RECENT_COMPLETED) {
        completedScans.pop(); // Remove oldest
      }
      
      log(`Security scan failed permanently: ${currentScan.type} after ${MAX_RETRIES} attempts: ${errorMessage}`, 'security');
    }
  } finally {
    // Reset processing state
    currentScan = null;
    isProcessing = false;
  }
}

/**
 * Execute a security scan based on its type
 * This is a placeholder that would call the actual scan implementation
 */
async function executeSecurityScan(scan: SecurityScanTask): Promise<ScanResult> {
  // This would call the actual scan implementation based on the scan type
  // For now, we'll simulate the scan with a delay proportional to the scan depth
  
  const baseDelay = scan.deep ? 2000 : 500;
  const scanDelay = baseDelay * (ScanPriority[scan.type] || 1);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate simulated scan results
      const result: ScanResult = {
        issuesFound: Math.floor(Math.random() * 10),
        criticalIssues: Math.floor(Math.random() * 3),
        highIssues: Math.floor(Math.random() * 5),
        mediumIssues: Math.floor(Math.random() * 7),
        lowIssues: Math.floor(Math.random() * 10),
        passedChecks: 20 + Math.floor(Math.random() * 30),
        totalChecks: 50 + Math.floor(Math.random() * 20),
        executionTimeMs: scanDelay
      };
      
      resolve(result);
    }, scanDelay);
  });
}

/**
 * Schedule all security scans to run sequentially in priority order
 * @param deep Whether to run deep scans
 * @returns Array of scan IDs that were scheduled
 */
export function scheduleAllSecurityScans(deep: boolean = true): string[] {
  const scanIds: string[] = [];
  
  // Schedule each scan type
  Object.values(ScanType).forEach(scanType => {
    const scanId = enqueueSecurityScan(scanType, deep);
    scanIds.push(scanId);
  });
  
  log(`Scheduled ${scanIds.length} security scans to run sequentially`, 'security');
  return scanIds;
}

/**
 * Add a security scan to the queue
 * @param scanType Type of security scan to run
 * @param deep Whether to run a deep scan
 * @param options Additional scan options
 * @returns ID of the scheduled scan
 */
export function enqueueSecurityScan(
  scanType: string, 
  deep: boolean = true,
  options: {
    priority?: number;
    tags?: string[];
    source?: ScanSource;
    scheduledFor?: Date;
    persistResults?: boolean;
    notes?: string;
  } = {}
): string {
  // Validate scan type
  const normalizedType = scanType.toUpperCase() as ScanType;
  if (!Object.values(ScanType).includes(normalizedType)) {
    throw new Error(`Invalid scan type: ${scanType}`);
  }
  
  // Create scan task
  const scanId = uuidv4();
  const scan: SecurityScanTask = {
    id: scanId,
    type: normalizedType,
    deep,
    priority: options.priority || ScanPriority[normalizedType] || 999, // Default to type-based priority
    status: ScanStatus.QUEUED,
    createdAt: new Date(),
    retryCount: 0,
    source: options.source || ScanSource.MANUAL, // Default to manual
    tags: options.tags || [],
    scheduledFor: options.scheduledFor,
    persistResults: options.persistResults || false,
    notes: options.notes
  };
  
  // Ensure reports directory exists
  if (scan.persistResults) {
    ensureReportsDirectory();
  }
  
  // Add to queue
  scanQueue.push(scan);
  log(`Security scan of type ${normalizedType} (${deep ? 'deep' : 'quick'}) queued with ID ${scanId}`, 'security');
  
  // Trigger queue processing if needed
  if (!isProcessing && !processingInterval) {
    processQueue();
  }
  
  return scanId;
}

/**
 * Ensure the reports directory exists
 */
function ensureReportsDirectory(): void {
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(HISTORY_DIR)) {
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error creating reports directory: ${errorMessage}`, 'security');
  }
}

/**
 * Get the current queue status
 * @returns Current queue status
 */
export function getQueueStatus(): QueueStatus {
  // Get current system load
  const systemLoad = getSystemLoad();
  
  // Calculate average execution time
  const avgExecutionTimeMs = statistics.totalCompleted > 0
    ? statistics.totalExecutionTimeMs / statistics.totalCompleted
    : 0;
  
  // Get the last scan completion time
  const lastScanCompletedAt = completedScans.length > 0
    ? completedScans[0].completedAt
    : undefined;
  
  return {
    running: currentScan,
    queued: [...scanQueue], // Create a copy to avoid mutation
    recentlyCompleted: [...completedScans], // Create a copy
    stats: {
      totalCompleted: statistics.totalCompleted,
      totalFailed: statistics.totalFailed,
      avgExecutionTimeMs,
      lastScanCompletedAt
    },
    systemLoad: {
      cpuUsage: systemLoad.cpuUsage,
      memoryUsage: systemLoad.memoryUsage
    }
  };
}

/**
 * Cancel a scheduled scan by ID
 * @param scanId ID of scan to cancel
 * @returns true if the scan was found and canceled, false otherwise
 */
export function cancelScan(scanId: string): boolean {
  // Check if it's the current scan
  if (currentScan && currentScan.id === scanId) {
    log(`Cannot cancel scan ${scanId} because it is already running`, 'security');
    return false;
  }
  
  // Find in queue
  const index = scanQueue.findIndex(scan => scan.id === scanId);
  if (index >= 0) {
    // Remove from queue and mark as canceled
    const canceledScan = scanQueue.splice(index, 1)[0];
    canceledScan.status = ScanStatus.CANCELED;
    
    // Add to completed scans
    completedScans.unshift(canceledScan);
    if (completedScans.length > MAX_RECENT_COMPLETED) {
      completedScans.pop(); // Remove oldest
    }
    
    log(`Security scan ${scanId} canceled`, 'security');
    return true;
  }
  
  log(`Security scan ${scanId} not found in queue`, 'security');
  return false;
}

/**
 * Clear the entire scan queue
 * @returns Number of scans removed from the queue
 */
export function clearQueue(): number {
  const count = scanQueue.length;
  
  // Mark all queued scans as canceled
  scanQueue.forEach(scan => {
    scan.status = ScanStatus.CANCELED;
    
    // Add to completed scans if we have room
    if (completedScans.length < MAX_RECENT_COMPLETED) {
      completedScans.push(scan);
    }
  });
  
  // Clear queue
  scanQueue = [];
  
  log(`Security scan queue cleared, ${count} scans removed`, 'security');
  return count;
}

/**
 * Create a new scheduled security scan
 */
export function createScheduledScan(
  scanType: ScanType,
  frequency: ScanFrequency,
  options: {
    deep?: boolean;
    customCron?: string;
    nextRun?: Date;
    enabled?: boolean;
    tags?: string[];
    description?: string;
    priority?: number;
    persistResults?: boolean;
  } = {}
): ScheduledScan {
  const id = uuidv4();
  
  // Set default next run time if not provided
  const nextRun = options.nextRun || calculateInitialNextRunTime(frequency, options.customCron);
  
  // Create scheduled scan
  const scheduledScan: ScheduledScan = {
    id,
    scanType,
    frequency,
    deep: options.deep !== undefined ? options.deep : true,
    customCron: options.customCron,
    nextRun,
    enabled: options.enabled !== undefined ? options.enabled : true,
    tags: options.tags || [],
    description: options.description,
    priority: options.priority,
    persistResults: options.persistResults !== undefined ? options.persistResults : true
  };
  
  // Add to scheduled scans
  scheduledScans.push(scheduledScan);
  
  log(`Created scheduled scan ${id} for ${scanType} with ${frequency} frequency`, 'security');
  
  return scheduledScan;
}

/**
 * Calculate initial next run time based on frequency
 */
function calculateInitialNextRunTime(frequency: ScanFrequency, customCron?: string): Date {
  const now = new Date();
  const nextRun = new Date(now);
  
  switch (frequency) {
    case ScanFrequency.HOURLY:
      nextRun.setHours(nextRun.getHours() + 1);
      nextRun.setMinutes(0, 0, 0); // At the start of the next hour
      break;
    case ScanFrequency.DAILY:
      // Run at midnight the next day
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
      break;
    case ScanFrequency.WEEKLY:
      // Run on next Monday at midnight
      const daysUntilMonday = 1 - nextRun.getDay();
      nextRun.setDate(nextRun.getDate() + (daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday));
      nextRun.setHours(0, 0, 0, 0);
      break;
    case ScanFrequency.MONTHLY:
      // Run on the 1st of next month
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(1);
      nextRun.setHours(0, 0, 0, 0);
      break;
    case ScanFrequency.CUSTOM:
      // For custom schedules - would normally use a cron parser
      // Default to tomorrow
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
      break;
  }
  
  return nextRun;
}

/**
 * Get all scheduled scans
 */
export function getScheduledScans(): ScheduledScan[] {
  return [...scheduledScans]; // Return a copy
}

/**
 * Update a scheduled scan
 */
export function updateScheduledScan(
  id: string,
  updates: Partial<Omit<ScheduledScan, 'id'>> & { recalculateNextRun?: boolean }
): ScheduledScan | null {
  const index = scheduledScans.findIndex(scan => scan.id === id);
  if (index === -1) {
    return null;
  }
  
  // Get existing scan
  const scan = scheduledScans[index];
  
  // Update fields (type-safe way)
  if (updates.scanType !== undefined) scan.scanType = updates.scanType;
  if (updates.deep !== undefined) scan.deep = updates.deep;
  if (updates.frequency !== undefined) scan.frequency = updates.frequency;
  if (updates.customCron !== undefined) scan.customCron = updates.customCron;
  if (updates.nextRun !== undefined) scan.nextRun = updates.nextRun;
  if (updates.enabled !== undefined) scan.enabled = updates.enabled;
  if (updates.tags !== undefined) scan.tags = updates.tags;
  if (updates.description !== undefined) scan.description = updates.description;
  if (updates.priority !== undefined) scan.priority = updates.priority;
  if (updates.persistResults !== undefined) scan.persistResults = updates.persistResults;
  if (updates.lastRun !== undefined) scan.lastRun = updates.lastRun;
  
  // If frequency changed, recalculate next run time
  const shouldRecalculate = updates.recalculateNextRun || 
    (updates.frequency && !updates.nextRun);
  
  if (shouldRecalculate) {
    scan.nextRun = calculateInitialNextRunTime(scan.frequency, scan.customCron);
  }
  
  log(`Updated scheduled scan ${id}`, 'security');
  
  return scan;
}

/**
 * Delete a scheduled scan
 */
export function deleteScheduledScan(id: string): boolean {
  const index = scheduledScans.findIndex(scan => scan.id === id);
  if (index === -1) {
    return false;
  }
  
  // Remove from array
  scheduledScans.splice(index, 1);
  
  log(`Deleted scheduled scan ${id}`, 'security');
  
  return true;
}

/**
 * Persist scan result to file
 */
function persistScanResult(scan: SecurityScanTask): void {
  if (!scan.persistResults || !scan.result) return;
  
  try {
    // Create filename with ISO date and scan type
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}-${scan.type.toLowerCase()}-${scan.id}.json`;
    const filepath = path.join(REPORTS_DIR, filename);
    
    // Create report object
    const report = {
      scan: {
        id: scan.id,
        type: scan.type,
        deep: scan.deep,
        createdAt: scan.createdAt,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        status: scan.status,
        source: scan.source,
        tags: scan.tags,
        notes: scan.notes
      },
      result: scan.result
    };
    
    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    // Update scan with report path
    scan.reportPath = filepath;
    
    log(`Persisted scan result to ${filepath}`, 'security');
    
    // Also save to history directory for long-term storage
    const historyPath = path.join(HISTORY_DIR, filename);
    fs.writeFileSync(historyPath, JSON.stringify(report, null, 2));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error persisting scan result: ${errorMessage}`, 'security');
  }
}

/**
 * Stop the security scan queue and clean up
 */
export function stopSecurityScanQueue(): void {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
  
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  
  // Clear state
  isProcessing = false;
  isInitialized = false;
  
  log('Security scan queue stopped', 'security');
}