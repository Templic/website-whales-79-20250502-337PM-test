/**
 * System and API monitoring utilities
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// We'll keep recent API metrics in memory
interface ApiMetric {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userId?: string | number;
}

// Circular buffer of recent API requests for performance metrics
const apiMetrics: ApiMetric[] = [];
const MAX_API_METRICS = 10000; // Keep up to 10K recent requests in memory

// System metrics interval reference
let systemMetricsInterval: NodeJS.Timeout | null = null;
const systemMetricsHistory: any[] = [];
const MAX_SYSTEM_METRICS = 1440; // Keep 24 hours at 1-minute intervals

/**
 * Initialize the monitoring system
 */
export function initialize(options: { 
  systemMetricsIntervalMs?: number 
} = {}): void {
  console.log('Initializing monitoring system...');
  
  const { systemMetricsIntervalMs = 60000 } = options; // Default to 1 minute
  
  // Start collecting system metrics periodically
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
  }
  
  // Collect system metrics at the specified interval
  systemMetricsInterval = setInterval(async () => {
    try {
      const metrics = await collectSystemMetrics();
      
      // Add to history
      systemMetricsHistory.push(metrics);
      
      // Trim history if needed
      if (systemMetricsHistory.length > MAX_SYSTEM_METRICS) {
        systemMetricsHistory.shift(); // Remove oldest
      }
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }, systemMetricsIntervalMs);
  
  // Collect initial metrics
  collectSystemMetrics()
    .then(metrics => {
      systemMetricsHistory.push(metrics);
      console.log('Initial system metrics collected');
    })
    .catch(error => {
      console.error('Error collecting initial system metrics:', error);
    });
  
  console.log('Monitoring system initialized');
}

/**
 * Shutdown the monitoring system
 */
export function shutdown(): void {
  console.log('Shutting down monitoring system...');
  
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
    systemMetricsInterval = null;
  }
  
  console.log('Monitoring system shut down');
}

/**
 * Record an API request for monitoring
 */
export function recordApiRequest(data: {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: string | number;
}): void {
  // Create metric record
  const metric: ApiMetric = {
    ...data,
    timestamp: Date.now()
  };
  
  // Add to metrics array
  apiMetrics.push(metric);
  
  // Trim if needed
  if (apiMetrics.length > MAX_API_METRICS) {
    apiMetrics.shift(); // Remove oldest
  }
}

/**
 * Get API metrics for monitoring
 */
export function getApiMetrics(options: {
  lastMinutes?: number;
  endpoint?: string;
  statusCode?: number;
  method?: string;
} = {}): any {
  const {
    lastMinutes = 60,
    endpoint,
    statusCode,
    method
  } = options;
  
  // Calculate cutoff time
  const cutoffTime = Date.now() - (lastMinutes * 60 * 1000);
  
  // Filter metrics based on options
  let filteredMetrics = apiMetrics.filter(m => m.timestamp >= cutoffTime);
  
  if (endpoint) {
    filteredMetrics = filteredMetrics.filter(m => m.path.includes(endpoint));
  }
  
  if (statusCode) {
    filteredMetrics = filteredMetrics.filter(m => m.statusCode === statusCode);
  }
  
  if (method) {
    filteredMetrics = filteredMetrics.filter(m => m.method === method);
  }
  
  // Group by path to get summaries
  const pathMetrics: {[path: string]: any} = {};
  
  for (const metric of filteredMetrics) {
    if (!pathMetrics[metric.path]) {
      pathMetrics[metric.path] = {
        path: metric.path,
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        statusCodes: {},
        methods: {}
      };
    }
    
    const pathMetric = pathMetrics[metric.path];
    pathMetric.count++;
    pathMetric.totalDuration += metric.duration;
    pathMetric.minDuration = Math.min(pathMetric.minDuration, metric.duration);
    pathMetric.maxDuration = Math.max(pathMetric.maxDuration, metric.duration);
    
    // Track status codes
    pathMetric.statusCodes[metric.statusCode] = 
      (pathMetric.statusCodes[metric.statusCode] || 0) + 1;
    
    // Track methods
    pathMetric.methods[metric.method] = 
      (pathMetric.methods[metric.method] || 0) + 1;
  }
  
  // Calculate averages and convert to array
  const pathMetricsArray = Object.values(pathMetrics).map((metric: any) => ({
    ...metric,
    avgDuration: metric.count > 0 ? metric.totalDuration / metric.count : 0
  }));
  
  // Sort by request count (descending)
  pathMetricsArray.sort((a: any, b: any) => b.count - a.count);
  
  // Also calculate error rate and other overall stats
  const totalRequests = filteredMetrics.length;
  const successRequests = filteredMetrics.filter(m => m.statusCode < 400).length;
  const clientErrorRequests = filteredMetrics.filter(m => m.statusCode >= 400 && m.statusCode < 500).length;
  const serverErrorRequests = filteredMetrics.filter(m => m.statusCode >= 500).length;
  
  return {
    totalRequests,
    timeRange: {
      minutes: lastMinutes,
      from: new Date(cutoffTime).toISOString(),
      to: new Date().toISOString()
    },
    summary: {
      successRate: totalRequests > 0 ? (successRequests / totalRequests) * 100 : 100,
      clientErrorRate: totalRequests > 0 ? (clientErrorRequests / totalRequests) * 100 : 0,
      serverErrorRate: totalRequests > 0 ? (serverErrorRequests / totalRequests) * 100 : 0,
      avgResponseTime: totalRequests > 0 
        ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
        : 0
    },
    endpoints: pathMetricsArray
  };
}

/**
 * Collect current system metrics
 */
async function collectSystemMetrics(): Promise<any> {
  // Memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  // CPU load
  const cpuUsage = process.cpuUsage();
  const loadAvg = os.loadavg();
  
  // Disk usage (simplified)
  let diskUsage = {};
  try {
    // This would be replaced with actual disk usage check
    // For example, using the 'diskusage' npm package in production
    diskUsage = {
      total: 0,
      free: 0,
      usedPercent: 0
    };
  } catch (error) {
    console.error('Error getting disk usage:', error);
  }
  
  return {
    timestamp: Date.now(),
    memory: {
      total: totalMemory,
      free: freeMemory,
      usedPercent: ((totalMemory - freeMemory) / totalMemory) * 100,
      process: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      }
    },
    cpu: {
      load: loadAvg,
      processUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      cores: os.cpus().length
    },
    disk: diskUsage,
    uptime: {
      server: os.uptime(),
      process: process.uptime()
    },
    nodeEnv: process.env.NODE_ENV || 'development'
  };
}

/**
 * Get current system metrics
 */
export async function getSystemMetrics(): Promise<any> {
  // Get the current metrics
  const currentMetrics = await collectSystemMetrics();
  
  // Also return some history for trends
  return {
    current: currentMetrics,
    history: {
      lastHour: systemMetricsHistory.slice(-60), // Last hour (if 1-minute intervals)
      trend: calculateMetricsTrend()
    }
  };
}

/**
 * Calculate trend from metrics history
 */
function calculateMetricsTrend(): any {
  if (systemMetricsHistory.length < 2) {
    return { memoryTrend: 0, cpuTrend: 0 };
  }
  
  // Take the last 5 metrics for trend
  const recentMetrics = systemMetricsHistory.slice(-5);
  
  // Calculate memory trend (percent change)
  const firstMemUsage = recentMetrics[0].memory.usedPercent;
  const lastMemUsage = recentMetrics[recentMetrics.length - 1].memory.usedPercent;
  const memoryTrend = lastMemUsage - firstMemUsage;
  
  // Calculate CPU trend (change in load average)
  const firstCpuLoad = recentMetrics[0].cpu.load[0]; // 1-minute load
  const lastCpuLoad = recentMetrics[recentMetrics.length - 1].cpu.load[0];
  const cpuTrend = lastCpuLoad - firstCpuLoad;
  
  return {
    memoryTrend,
    cpuTrend
  };
}

export default {
  initialize,
  shutdown,
  recordApiRequest,
  getApiMetrics,
  getSystemMetrics
};