/**
 * Security Scan Queue
 * 
 * This file implements a queue for security scans with scheduling capabilities.
 */

import { ScanResult, ScanOptions, ScanSchedule, SecurityScanStatus, SecurityScanPriority } from './SecurityScanTypes';

/**
 * Scanner function type
 */
export type ScannerFunction = (params?: any) => Promise<ScanResult>;

/**
 * Security scan queue class
 */
export class SecurityScanQueue {
  private scanners: Map<string, ScannerFunction> = new Map();
  private schedules: ScanSchedule[] = [];
  private queue: Array<{
    options: ScanOptions;
    resolve: (result: ScanResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private running = false;
  
  /**
   * Register a scanner with the queue
   */
  registerScanner(type: string, scanner: ScannerFunction): void {
    this.scanners.set(type, scanner);
    console.log(`[SecurityScanQueue] Registered scanner for type: ${type}`);
  }
  
  /**
   * Schedule a regular scan
   */
  scheduleScan(schedule: ScanSchedule): string {
    const id = schedule.id || `scan-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const newSchedule: ScanSchedule = {
      ...schedule,
      id,
      enabled: schedule.enabled !== false // Default to enabled
    };
    
    this.schedules.push(newSchedule);
    console.log(`[SecurityScanQueue] Scheduled scan: ${newSchedule.name} (${id})`);
    
    return id;
  }
  
  /**
   * Run a scan immediately
   */
  async runScan(options: ScanOptions): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      // Check if scanner exists
      if (!this.scanners.has(options.scanType)) {
        reject(new Error(`Scanner not found for type: ${options.scanType}`));
        return;
      }
      
      // Add to queue
      this.queue.push({
        options,
        resolve,
        reject
      });
      
      console.log(`[SecurityScanQueue] Queued scan: ${options.name} (${options.scanType})`);
      
      // Start processing if not already running
      if (!this.running) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Process the scan queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.running) {
      return;
    }
    
    this.running = true;
    console.log(`[SecurityScanQueue] Processing queue with ${this.queue.length} items`);
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const { options, resolve, reject } = item;
      
      const scanner = this.scanners.get(options.scanType)!;
      
      try {
        console.log(`[SecurityScanQueue] Running scan: ${options.name} (${options.scanType})`);
        const result = await scanner(options.params || {});
        resolve(result);
        console.log(`[SecurityScanQueue] Scan completed: ${options.name} (${options.scanType})`);
      } catch (error) {
        console.error(`[SecurityScanQueue] Scan failed: ${options.name} (${options.scanType})`, error);
        reject(error);
      }
    }
    
    this.running = false;
  }
  
  /**
   * Get all scheduled scans
   */
  getSchedules(): ScanSchedule[] {
    return [...this.schedules];
  }
  
  /**
   * Get a specific scheduled scan
   */
  getSchedule(id: string): ScanSchedule | undefined {
    return this.schedules.find(s => s.id === id);
  }
  
  /**
   * Enable or disable a scheduled scan
   */
  setScheduleEnabled(id: string, enabled: boolean): boolean {
    const schedule = this.schedules.find(s => s.id === id);
    
    if (!schedule) {
      return false;
    }
    
    schedule.enabled = enabled;
    return true;
  }
  
  /**
   * Update a scheduled scan's last run status
   */
  updateScheduleLastRun(id: string, status: SecurityScanStatus, resultId?: string): boolean {
    const schedule = this.schedules.find(s => s.id === id);
    
    if (!schedule) {
      return false;
    }
    
    schedule.lastRun = {
      timestamp: new Date().toISOString(),
      status,
      resultId
    };
    
    return true;
  }
}

// Export a singleton instance
export const securityScanQueue = new SecurityScanQueue();

export default {
  SecurityScanQueue,
  securityScanQueue
};