/**
 * System Resource Monitor
 * 
 * This module provides utilities to monitor system resources
 * such as CPU and memory usage to ensure background tasks
 * don't overwhelm the system.
 */

import os from 'os';
import { log } from '../vite';

// System load information structure
export interface SystemLoad {
  cpuUsage: number;        // CPU usage as percentage (0-100)
  memoryUsage: number;     // Memory usage as percentage (0-100)
  freeMemoryMB: number;    // Free memory in MB
  totalMemoryMB: number;   // Total system memory in MB
  loadAverage: number[];   // System load averages (1, 5, 15 min)
  timestamp: number;       // Timestamp of the measurement
}

// Last CPU usage metrics for calculation
let lastCpuInfo: os.CpuInfo[] | null = null;
let lastCpuTimes: { idle: number; total: number } | null = null;

/**
 * Get current system resource usage
 * @returns System load information
 */
export function getSystemLoad(): SystemLoad {
  // Get memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  
  // Get CPU usage
  const cpuInfo = os.cpus();
  const cpuUsage = calculateCpuUsage(cpuInfo);
  
  // Get load average
  const loadAverage = os.loadavg();
  
  // Create system load object
  const systemLoad: SystemLoad = {
    cpuUsage,
    memoryUsage,
    freeMemoryMB: Math.floor(freeMemory / (1024 * 1024)),
    totalMemoryMB: Math.floor(totalMemory / (1024 * 1024)),
    loadAverage,
    timestamp: Date.now()
  };
  
  return systemLoad;
}

/**
 * Calculate CPU usage percentage based on current and previous CPU info
 * @param cpuInfo Current CPU information
 * @returns CPU usage percentage
 */
function calculateCpuUsage(cpuInfo: os.CpuInfo[]): number {
  if (!cpuInfo || cpuInfo.length === 0) {
    return 0;
  }
  
  // Calculate total and idle times across all cores
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpuInfo) {
    const { idle, user, nice, sys, irq } = cpu.times;
    const total = idle + user + nice + sys + irq;
    totalIdle += idle;
    totalTick += total;
  }
  
  // First call - just store values
  if (lastCpuInfo === null || lastCpuTimes === null) {
    lastCpuInfo = cpuInfo;
    lastCpuTimes = { idle: totalIdle, total: totalTick };
    return 0;
  }
  
  // Calculate difference
  const idleDiff = totalIdle - lastCpuTimes.idle;
  const totalDiff = totalTick - lastCpuTimes.total;
  
  // Calculate CPU usage percentage
  const cpuUsage = 100 - (100 * idleDiff / totalDiff);
  
  // Update last values
  lastCpuInfo = cpuInfo;
  lastCpuTimes = { idle: totalIdle, total: totalTick };
  
  return cpuUsage;
}

/**
 * Check if the system has enough resources available for a task
 * @param systemLoad Current system load information
 * @param cpuThreshold Maximum acceptable CPU usage percentage
 * @param memoryThreshold Maximum acceptable memory usage percentage
 * @param minFreeMem Minimum acceptable free memory in MB
 * @returns Whether the system has sufficient resources
 */
export function hasAvailableResources(
  systemLoad: SystemLoad,
  cpuThreshold: number = 80,
  memoryThreshold: number = 85,
  minFreeMem: number = 512
): boolean {
  // Check CPU usage
  if (systemLoad.cpuUsage > cpuThreshold) {
    log(`CPU usage too high for task: ${systemLoad.cpuUsage.toFixed(1)}% (threshold: ${cpuThreshold}%)`, 'system');
    return false;
  }
  
  // Check memory usage
  if (systemLoad.memoryUsage > memoryThreshold) {
    log(`Memory usage too high for task: ${systemLoad.memoryUsage.toFixed(1)}% (threshold: ${memoryThreshold}%)`, 'system');
    return false;
  }
  
  // Check free memory
  if (systemLoad.freeMemoryMB < minFreeMem) {
    log(`Free memory too low for task: ${systemLoad.freeMemoryMB} MB (minimum: ${minFreeMem} MB)`, 'system');
    return false;
  }
  
  return true;
}

/**
 * Log current system resource usage
 */
export function logSystemResources(): void {
  const systemLoad = getSystemLoad();
  log(`System resources - CPU: ${systemLoad.cpuUsage.toFixed(1)}%, Memory: ${systemLoad.memoryUsage.toFixed(1)}%, Free: ${systemLoad.freeMemoryMB} MB`, 'system');
}

/**
 * Initialize the system monitor
 * @param logInterval Interval for logging system resources (in ms)
 */
export function initializeSystemMonitor(logInterval: number = 300000): void {
  // Log initial system resources
  logSystemResources();
  
  // Set up interval for periodic logging
  setInterval(logSystemResources, logInterval);
  
  log(`System monitor initialized with ${logInterval}ms logging interval`, 'system');
}