/**
 * Runtime Application Self-Protection (RASP)
 * 
 * Provides real-time application protection by monitoring and blocking
 * attacks against the application during execution.
 * 
 * Features:
 * - Memory protection
 * - Dangerous function monitoring
 * - Runtime code analysis
 * - Command injection prevention
 * - Prototype pollution detection
 * - Runtime integrity verification
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';

// Define protection levels
export enum ProtectionLevel {
  MINIMAL = 'minimal',
  BASIC = 'basic',
  STANDARD = 'standard',
  STRICT = 'strict',
  PARANOID = 'paranoid'
}

// Protection configuration
export interface RASPConfig {
  level: ProtectionLevel;
  enableCommandInjectionProtection: boolean;
  enableMemoryProtection: boolean;
  enableRuntimeCodeAnalysis: boolean;
  enablePrototypePollutionProtection: boolean;
  enableRuntimeIntegrityChecks: boolean;
  dangerousFunctions: string[];
  commandPatterns: RegExp[];
  memoryThresholdMB: number;
  integrityCheckInterval: number;
}

// Default configuration
const defaultConfig: RASPConfig = {
  level: ProtectionLevel.STANDARD,
  enableCommandInjectionProtection: true,
  enableMemoryProtection: true,
  enableRuntimeCodeAnalysis: true,
  enablePrototypePollutionProtection: true,
  enableRuntimeIntegrityChecks: true,
  dangerousFunctions: [
    'eval',
    'Function',
    'setTimeout',
    'setInterval',
    'execScript',
    'constructor.constructor',
    'constructor'
  ],
  commandPatterns: [
    /\s*;\s*(\w+)/i,                 // Command chaining with semicolon
    /\|\s*(\w+)/i,                   // Command piping
    /`([^`]*)`/,                     // Backtick execution
    /\$\(([^)]+)\)/,                 // Command substitution $(command)
    /\$\{([^}]+)\}/,                 // Command substitution ${command}
    /\/bin\/sh/i,                    // Direct shell reference
    /\/bin\/bash/i,                  // Direct bash reference
    /cmd\.exe/i,                     // Windows command prompt
    /powershell\.exe/i,              // PowerShell
    /system\s*\(/i,                  // system() calls
    /exec\s*\(/i,                    // exec() calls
    /child_process/i,                // Node.js child_process
    /spawn/i,                        // spawn calls
    /process\.exec/i,                // process.exec
    /Runtime\.exec/i                 // Java Runtime.exec
  ],
  memoryThresholdMB: 1024,           // 1GB
  integrityCheckInterval: 60000      // 1 minute
};

// Code integrity checksums
const integrityChecksums: Map<string, string> = new Map();

// Original function references for monitoring
const originalFunctions: Map<string, Function> = new Map();

// Dangerous function call counters
const functionCallCounters: Map<string, number> = new Map();

// Runtime memory stats
let lastMemoryUsage = {
  rss: 0,
  heapTotal: 0,
  heapUsed: 0,
  external: 0
};

/**
 * Initialize RASP protection with configuration
 */
export function initializeRASP(config: Partial<RASPConfig> = {}): void {
  const mergedConfig = { ...defaultConfig, ...config };
  
  logSecurityEvent({
    category: SecurityEventCategory.RUNTIME_PROTECTION,
    severity: SecurityEventSeverity.INFO,
    message: 'Runtime Application Self-Protection (RASP) initialized',
    data: {
      level: mergedConfig.level,
      enabledFeatures: {
        commandInjection: mergedConfig.enableCommandInjectionProtection,
        memoryProtection: mergedConfig.enableMemoryProtection,
        runtimeCodeAnalysis: mergedConfig.enableRuntimeCodeAnalysis,
        prototypePollution: mergedConfig.enablePrototypePollutionProtection,
        integrityChecks: mergedConfig.enableRuntimeIntegrityChecks
      }
    }
  });
  
  // Start memory monitoring if enabled
  if (mergedConfig.enableMemoryProtection) {
    startMemoryMonitoring(mergedConfig);
  }
  
  // Start function monitoring if enabled
  if (mergedConfig.enableRuntimeCodeAnalysis) {
    monitorDangerousFunctions(mergedConfig);
  }
  
  // Start integrity checks if enabled
  if (mergedConfig.enableRuntimeIntegrityChecks) {
    startIntegrityChecks(mergedConfig);
  }
  
  // Monitor for prototype pollution if enabled
  if (mergedConfig.enablePrototypePollutionProtection) {
    protectAgainstPrototypePollution();
  }
}

/**
 * Start memory monitoring
 */
function startMemoryMonitoring(config: RASPConfig): void {
  // Save initial memory usage
  lastMemoryUsage = process.memoryUsage();
  
  // Check memory usage periodically
  const memoryMonitoringInterval = setInterval(() => {
    const currentMemoryUsage = process.memoryUsage();
    
    // Calculate relative change
    const heapUsedChange = currentMemoryUsage.heapUsed - lastMemoryUsage.heapUsed;
    const rssChange = currentMemoryUsage.rss - lastMemoryUsage.rss;
    
    // Check for memory leaks or excessive memory usage
    if (
      currentMemoryUsage.rss > config.memoryThresholdMB * 1024 * 1024 ||
      (heapUsedChange > 100 * 1024 * 1024 && currentMemoryUsage.heapUsed > lastMemoryUsage.heapUsed * 1.5)
    ) {
      logSecurityEvent({
        category: SecurityEventCategory.RUNTIME_PROTECTION,
        severity: SecurityEventSeverity.HIGH,
        message: 'Memory usage threshold exceeded',
        data: {
          currentRSS: Math.round(currentMemoryUsage.rss / (1024 * 1024)) + 'MB',
          currentHeapUsed: Math.round(currentMemoryUsage.heapUsed / (1024 * 1024)) + 'MB',
          threshold: config.memoryThresholdMB + 'MB',
          increase: {
            rss: Math.round(rssChange / (1024 * 1024)) + 'MB',
            heapUsed: Math.round(heapUsedChange / (1024 * 1024)) + 'MB'
          }
        }
      });
      
      // In paranoid mode, force garbage collection (if available)
      if (config.level === ProtectionLevel.PARANOID && global.gc) {
        try {
          global.gc();
          logSecurityEvent({
            category: SecurityEventCategory.RUNTIME_PROTECTION,
            severity: SecurityEventSeverity.INFO,
            message: 'Forced garbage collection due to memory threshold',
            data: {
              beforeHeapUsed: Math.round(currentMemoryUsage.heapUsed / (1024 * 1024)) + 'MB',
              afterHeapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)) + 'MB'
            }
          });
        } catch (error) {
          // Ignore errors in garbage collection
        }
      }
    }
    
    // Update last memory usage
    lastMemoryUsage = currentMemoryUsage;
  }, 15000); // Check every 15 seconds
  
  // Prevent the interval from keeping the process alive
  if (memoryMonitoringInterval.unref) {
    memoryMonitoringInterval.unref();
  }
}

/**
 * Monitor dangerous functions for potential abuse
 */
function monitorDangerousFunctions(config: RASPConfig): void {
  // Monitor eval usage
  if (global.eval && !originalFunctions.has('eval')) {
    originalFunctions.set('eval', global.eval);
    
    // @ts-ignore
    global.eval = function monitoredEval(code: string) {
      functionCallCounters.set('eval', (functionCallCounters.get('eval') || 0) + 1);
      
      logSecurityEvent({
        category: SecurityEventCategory.RUNTIME_PROTECTION,
        severity: SecurityEventSeverity.HIGH,
        message: 'Dangerous function called: eval',
        data: {
          codeLength: code?.length || 0,
          codePreview: code?.substring(0, 100)
        }
      });
      
      // In paranoid mode, block eval entirely
      if (config.level === ProtectionLevel.PARANOID) {
        throw new Error('RASP: eval() is not allowed in paranoid mode');
      }
      
      // In strict mode, analyze the code for dangerous patterns
      if (config.level === ProtectionLevel.STRICT) {
        for (const pattern of config.commandPatterns) {
          if (pattern.test(code)) {
            throw new Error('RASP: Potential command injection in eval() blocked');
          }
        }
      }
      
      // Otherwise allow with monitoring
      const originalEval = originalFunctions.get('eval');
      return originalEval!.call(this, code);
    };
  }
  
  // Monitor Function constructor usage
  if (global.Function && !originalFunctions.has('Function')) {
    originalFunctions.set('Function', global.Function);
    
    // @ts-ignore
    global.Function = function monitoredFunction(...args: any[]) {
      functionCallCounters.set('Function', (functionCallCounters.get('Function') || 0) + 1);
      
      logSecurityEvent({
        category: SecurityEventCategory.RUNTIME_PROTECTION,
        severity: SecurityEventSeverity.HIGH,
        message: 'Dangerous function called: Function constructor',
        data: {
          argCount: args.length
        }
      });
      
      // In paranoid or strict mode, block Function constructor
      if (config.level === ProtectionLevel.PARANOID || config.level === ProtectionLevel.STRICT) {
        throw new Error('RASP: Function constructor is not allowed in strict/paranoid mode');
      }
      
      // Otherwise allow with monitoring
      const originalFunction = originalFunctions.get('Function');
      return originalFunction!.apply(this, args);
    };
  }
  
  // Monitor setTimeout for code execution (more limited)
  if (global.setTimeout && !originalFunctions.has('setTimeout')) {
    originalFunctions.set('setTimeout', global.setTimeout);
    
    // @ts-ignore
    global.setTimeout = function monitoredSetTimeout(callback: Function | string, ...args: any[]) {
      // Only monitor string-based callbacks
      if (typeof callback === 'string') {
        functionCallCounters.set('setTimeout-string', (functionCallCounters.get('setTimeout-string') || 0) + 1);
        
        logSecurityEvent({
          category: SecurityEventCategory.RUNTIME_PROTECTION,
          severity: SecurityEventSeverity.MEDIUM,
          message: 'Dangerous function called: setTimeout with string callback',
          data: {
            codeLength: callback.length,
            codePreview: callback.substring(0, 100)
          }
        });
        
        // In strict or paranoid mode, block string-based setTimeout
        if (config.level === ProtectionLevel.PARANOID || config.level === ProtectionLevel.STRICT) {
          throw new Error('RASP: String-based setTimeout is not allowed in strict/paranoid mode');
        }
      }
      
      // Allow function-based setTimeout
      const originalSetTimeout = originalFunctions.get('setTimeout');
      return originalSetTimeout!.apply(this, [callback, ...args]);
    };
  }
}

/**
 * Start runtime integrity checks
 */
function startIntegrityChecks(config: RASPConfig): void {
  // Register key modules to monitor
  const modulesToMonitor = [
    'fs',
    'child_process',
    'http',
    'https',
    'net',
    'crypto',
    'express'
  ];
  
  // Generate initial checksums
  for (const moduleName of modulesToMonitor) {
    try {
      const module = require(moduleName);
      const checksum = calculateModuleChecksum(module);
      integrityChecksums.set(moduleName, checksum);
    } catch (error) {
      // Module might not be loaded yet, ignore
    }
  }
  
  // Periodically verify integrity
  const integrityCheckInterval = setInterval(() => {
    for (const [moduleName, originalChecksum] of integrityChecksums.entries()) {
      try {
        const module = require(moduleName);
        const currentChecksum = calculateModuleChecksum(module);
        
        if (currentChecksum !== originalChecksum) {
          logSecurityEvent({
            category: SecurityEventCategory.RUNTIME_PROTECTION,
            severity: SecurityEventSeverity.CRITICAL,
            message: 'Runtime integrity violation detected',
            data: {
              module: moduleName,
              originalChecksum,
              currentChecksum
            }
          });
          
          logAuditEvent(
            AuditAction.SECURITY_ALERT,
            AuditCategory.SECURITY,
            'runtime_integrity',
            {
              module: moduleName,
              action: 'violation-detected'
            }
          );
          
          // In paranoid mode, terminate the process
          if (config.level === ProtectionLevel.PARANOID) {
            process.exit(1);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }, config.integrityCheckInterval);
  
  // Prevent the interval from keeping the process alive
  if (integrityCheckInterval.unref) {
    integrityCheckInterval.unref();
  }
}

/**
 * Calculate a checksum for a module
 */
function calculateModuleChecksum(module: any): string {
  const hash = createHash('sha256');
  
  // Get all enumerable properties
  const properties = Object.keys(module).sort();
  
  for (const property of properties) {
    // Only include functions and non-circular references
    const value = module[property];
    if (typeof value === 'function') {
      // Use function toString as a representation
      hash.update(property + ':' + value.toString());
    } else if (typeof value === 'object' && value !== null && !isCircular(value)) {
      // For objects, use a simple stringification
      try {
        hash.update(property + ':' + JSON.stringify(value));
      } catch {
        hash.update(property + ':object');
      }
    }
  }
  
  return hash.digest('hex');
}

/**
 * Simple circular reference check
 */
function isCircular(obj: any, seen: Set<any> = new Set()): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  if (seen.has(obj)) {
    return true;
  }
  
  seen.add(obj);
  
  for (const key of Object.keys(obj)) {
    if (isCircular(obj[key], new Set(seen))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Protect against prototype pollution
 */
function protectAgainstPrototypePollution(): void {
  // Only apply if not already protected
  if (Object.prototype.__isProtected) {
    return;
  }
  
  // Mark as protected to avoid double protection
  Object.defineProperty(Object.prototype, '__isProtected', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });
  
  // Protect critical object properties
  const criticalProperties = [
    '__proto__',
    'constructor',
    'prototype'
  ];
  
  // Protect Object.prototype
  for (const prop of criticalProperties) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, prop);
    
    if (originalDescriptor && originalDescriptor.configurable) {
      // Store original descriptor
      const originalValue = originalDescriptor.value;
      const originalGetter = originalDescriptor.get;
      const originalSetter = originalDescriptor.set;
      
      Object.defineProperty(Object.prototype, prop, {
        configurable: false,
        get: function protectedGetter() {
          logSecurityEvent({
            category: SecurityEventCategory.RUNTIME_PROTECTION,
            severity: SecurityEventSeverity.HIGH,
            message: 'Prototype pollution attempt detected',
            data: {
              property: prop,
              operation: 'get'
            }
          });
          
          return originalGetter ? originalGetter.call(this) : originalValue;
        },
        set: function protectedSetter(value: any) {
          logSecurityEvent({
            category: SecurityEventCategory.RUNTIME_PROTECTION,
            severity: SecurityEventSeverity.CRITICAL,
            message: 'Prototype pollution attempt blocked',
            data: {
              property: prop,
              operation: 'set'
            }
          });
          
          logAuditEvent(
            AuditAction.SECURITY_ALERT,
            AuditCategory.SECURITY,
            'prototype_pollution',
            {
              property: prop,
              action: 'blocked'
            }
          );
          
          throw new Error(`RASP: Modification of ${prop} is not allowed`);
        }
      });
    }
  }
}

/**
 * Check command injection in string inputs
 */
export function checkCommandInjection(input: string, config: RASPConfig = defaultConfig): {
  safe: boolean;
  patterns: string[];
} {
  if (!input || typeof input !== 'string') {
    return { safe: true, patterns: [] };
  }
  
  const detectedPatterns: string[] = [];
  
  for (const pattern of config.commandPatterns) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.toString());
    }
  }
  
  return {
    safe: detectedPatterns.length === 0,
    patterns: detectedPatterns
  };
}

/**
 * Get runtime protection statistics
 */
export function getRuntimeStats(): Record<string, any> {
  return {
    memory: process.memoryUsage(),
    functionCalls: Object.fromEntries(functionCallCounters.entries()),
    moduleIntegrity: {
      monitoredModules: Array.from(integrityChecksums.keys()),
      checksumCount: integrityChecksums.size
    }
  };
}

/**
 * RASP middleware for Express
 */
export function raspMiddleware(
  options: Partial<RASPConfig> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const config = { ...defaultConfig, ...options };
  
  // Initialize RASP on first middleware use
  initializeRASP(config);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Add RASP flag to the request
    res.locals.rasp = {
      started: startTime,
      checks: {}
    };
    
    // Check for command injection in query parameters
    if (config.enableCommandInjectionProtection) {
      const queryParams = req.query;
      
      for (const param in queryParams) {
        const value = queryParams[param];
        
        if (typeof value === 'string') {
          const injectionCheck = checkCommandInjection(value, config);
          
          if (!injectionCheck.safe) {
            logSecurityEvent({
              category: SecurityEventCategory.RUNTIME_PROTECTION,
              severity: SecurityEventSeverity.CRITICAL,
              message: 'Command injection attempt detected in query parameter',
              data: {
                param,
                patterns: injectionCheck.patterns,
                valuePreview: value.substring(0, 100)
              }
            });
            
            logAuditEvent(
              AuditAction.SECURITY_BLOCKED,
              AuditCategory.SECURITY,
              'command_injection',
              {
                param,
                patterns: injectionCheck.patterns
              },
              req
            );
            
            if (config.level === ProtectionLevel.STRICT || config.level === ProtectionLevel.PARANOID) {
              return res.status(403).json({
                error: 'Security violation detected',
                code: 'COMMAND_INJECTION_ATTEMPT'
              });
            }
          }
        }
      }
      
      // Record command injection check
      res.locals.rasp.checks.commandInjection = true;
    }
    
    // Continue to next middleware
    next();
    
    // Track response time for RASP metrics
    res.on('finish', () => {
      res.locals.rasp.responseTime = Date.now() - startTime;
    });
  };
}

export default {
  ProtectionLevel,
  initializeRASP,
  checkCommandInjection,
  getRuntimeStats,
  raspMiddleware
};