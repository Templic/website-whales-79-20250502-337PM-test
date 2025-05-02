/**
 * Security Component Registry
 * 
 * This module registers security components with the lazy loader
 * and provides a central registry for accessing them.
 */

import lazySecurityLoader from './LazySecurityLoader';
import chalk from 'chalk';

// Define components that can be lazily loaded
export enum SecurityComponentName {
  // Core components (required)
  CORE_CONFIG = 'core:config',
  CORE_EVENT_BUS = 'core:eventBus',
  CORE_MONITORING = 'core:monitoring',
  
  // Protection components
  PROTECTION_CSRFGUARD = 'protection:csrfGuard',
  PROTECTION_XSSGUARD = 'protection:xssGuard',
  PROTECTION_INJECTION_GUARD = 'protection:injectionGuard',
  PROTECTION_RATE_LIMITER = 'protection:rateLimiter',
  PROTECTION_BRUTE_FORCE = 'protection:bruteForceProtection',
  
  // Detection components
  DETECTION_THREAT_DETECTOR = 'detection:threatDetector',
  DETECTION_ANOMALY_DETECTOR = 'detection:anomalyDetector',
  DETECTION_INTEGRITY_CHECKER = 'detection:integrityChecker',
  
  // Monitoring components
  MONITORING_REAL_TIME = 'monitoring:realTime',
  MONITORING_METRICS = 'monitoring:metrics',
  MONITORING_API_USAGE = 'monitoring:apiUsage',
  
  // Advanced components
  ADVANCED_ML_DETECTOR = 'advanced:mlDetector',
  ADVANCED_BLOCKCHAIN_LOGGER = 'advanced:blockchainLogger',
  ADVANCED_QUANTUM_RESISTANCE = 'advanced:quantumResistance',
  
  // Database components
  DATABASE_SECURITY_SERVICE = 'database:securityService',
  DATABASE_THREAT_SERVICE = 'database:threatService',
  
  // API Security components
  API_VALIDATOR = 'api:validator',
  API_AUTH_GUARD = 'api:authGuard'
}

// Configure the lazy loader
export function initializeSecurityComponents(startupMode: 'deferred' | 'immediate' = 'deferred'): void {
  console.log(chalk.blue(`[SecurityComponentRegistry] Initializing security components in ${startupMode} mode...`));
  
  // Initialize the lazy loader
  lazySecurityLoader.initialize(startupMode);
  
  // Register core components (always required)
  registerCoreComponents();
  
  // Register protection components
  registerProtectionComponents();
  
  // Register detection components
  registerDetectionComponents();
  
  // Register monitoring components
  registerMonitoringComponents();
  
  // Register advanced components
  registerAdvancedComponents();
  
  // Register database components
  registerDatabaseComponents();
  
  // Register API components
  registerApiComponents();
  
  console.log(chalk.green(`[SecurityComponentRegistry] Registered ${lazySecurityLoader.getComponents().length} security components`));
  
  // Print component priority order
  const priorityOrder = lazySecurityLoader.getComponents()
    .sort((a, b) => a.priority - b.priority)
    .filter(c => c.isRequired)
    .map(c => `${c.name} (${c.priority})`);
  
  console.log(chalk.blue(`[SecurityComponentRegistry] Required components loading order: ${priorityOrder.join(', ')}`));
}

// Register core components
function registerCoreComponents(): void {
  // Security Configuration (Required, highest priority)
  lazySecurityLoader.register(
    SecurityComponentName.CORE_CONFIG,
    async () => {
      // Dynamic import for lazy loading
      const { securityConfig } = await import('./config/SecurityConfig');
      return securityConfig;
    },
    {
      dependencies: [],
      priority: 10, // Highest priority
      isRequired: true
    }
  );
  
  // Security Event Bus (Required)
  lazySecurityLoader.register(
    SecurityComponentName.CORE_EVENT_BUS,
    async () => {
      const { securityEventBus } = await import('./events/SecurityEventBus');
      return securityEventBus;
    },
    {
      dependencies: [SecurityComponentName.CORE_CONFIG],
      priority: 20,
      isRequired: true
    }
  );
  
  // Core Monitoring (Required)
  lazySecurityLoader.register(
    SecurityComponentName.CORE_MONITORING,
    async () => {
      const { coreMonitoring } = await import('./monitoring/CoreMonitoring');
      return coreMonitoring;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS
      ],
      priority: 30,
      isRequired: true
    }
  );
}

// Register protection components
function registerProtectionComponents(): void {
  // CSRF Protection
  lazySecurityLoader.register(
    SecurityComponentName.PROTECTION_CSRFGUARD,
    async () => {
      const { csrfGuard } = await import('./protection/CsrfGuard');
      return csrfGuard;
    },
    {
      dependencies: [SecurityComponentName.CORE_CONFIG],
      priority: 40,
      isRequired: true // Required for web security
    }
  );
  
  // XSS Protection
  lazySecurityLoader.register(
    SecurityComponentName.PROTECTION_XSSGUARD,
    async () => {
      const { xssGuard } = await import('./protection/XssGuard');
      return xssGuard;
    },
    {
      dependencies: [SecurityComponentName.CORE_CONFIG],
      priority: 50,
      isRequired: true // Required for web security
    }
  );
  
  // Injection Protection
  lazySecurityLoader.register(
    SecurityComponentName.PROTECTION_INJECTION_GUARD,
    async () => {
      const { injectionGuard } = await import('./protection/InjectionGuard');
      return injectionGuard;
    },
    {
      dependencies: [SecurityComponentName.CORE_CONFIG],
      priority: 60,
      isRequired: true // Required for database security
    }
  );
  
  // Rate Limiting
  lazySecurityLoader.register(
    SecurityComponentName.PROTECTION_RATE_LIMITER,
    async () => {
      const { rateLimiter } = await import('./protection/RateLimiter');
      return rateLimiter;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS
      ],
      priority: 70,
      isRequired: false // Optional, can be loaded on demand
    }
  );
  
  // Brute Force Protection
  lazySecurityLoader.register(
    SecurityComponentName.PROTECTION_BRUTE_FORCE,
    async () => {
      const { bruteForceProtection } = await import('./protection/BruteForceProtection');
      return bruteForceProtection;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.PROTECTION_RATE_LIMITER
      ],
      priority: 80,
      isRequired: false // Optional, can be loaded on demand
    }
  );
}

// Register detection components
function registerDetectionComponents(): void {
  // Threat Detection
  lazySecurityLoader.register(
    SecurityComponentName.DETECTION_THREAT_DETECTOR,
    async () => {
      const { threatDetector } = await import('./detection/ThreatDetector');
      return threatDetector;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS
      ],
      priority: 90,
      isRequired: true
    }
  );
  
  // Anomaly Detection (can be resource intensive)
  lazySecurityLoader.register(
    SecurityComponentName.DETECTION_ANOMALY_DETECTOR,
    async () => {
      const { anomalyDetector } = await import('./detection/AnomalyDetector');
      return anomalyDetector;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.DETECTION_THREAT_DETECTOR
      ],
      priority: 100,
      isRequired: false // Non-critical, can be loaded on demand
    }
  );
  
  // Integrity Checking
  lazySecurityLoader.register(
    SecurityComponentName.DETECTION_INTEGRITY_CHECKER,
    async () => {
      const { integrityChecker } = await import('./detection/IntegrityChecker');
      return integrityChecker;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS
      ],
      priority: 110,
      isRequired: false // Non-critical, can be loaded on demand
    }
  );
}

// Register monitoring components
function registerMonitoringComponents(): void {
  // Real-time Monitoring
  lazySecurityLoader.register(
    SecurityComponentName.MONITORING_REAL_TIME,
    async () => {
      const { realTimeMonitoring } = await import('./monitoring/RealTimeMonitoring');
      return realTimeMonitoring;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.CORE_MONITORING
      ],
      priority: 120,
      isRequired: false // Non-critical, can be loaded on demand
    }
  );
  
  // Metrics Collection
  lazySecurityLoader.register(
    SecurityComponentName.MONITORING_METRICS,
    async () => {
      const { metricsCollector } = await import('./monitoring/MetricsCollector');
      return metricsCollector;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_MONITORING
      ],
      priority: 130,
      isRequired: false // Non-critical, can be loaded on demand
    }
  );
  
  // API Usage Monitoring
  lazySecurityLoader.register(
    SecurityComponentName.MONITORING_API_USAGE,
    async () => {
      const { apiUsageMonitor } = await import('./monitoring/ApiUsageMonitor');
      return apiUsageMonitor;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_MONITORING
      ],
      priority: 140,
      isRequired: false // Non-critical, can be loaded on demand
    }
  );
}

// Register advanced components (all non-critical, can be loaded on demand)
function registerAdvancedComponents(): void {
  // Machine Learning Detector (resource intensive)
  lazySecurityLoader.register(
    SecurityComponentName.ADVANCED_ML_DETECTOR,
    async () => {
      const { mlThreatDetector } = await import('./advanced/ml/MLThreatDetector');
      return mlThreatDetector;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.DETECTION_THREAT_DETECTOR
      ],
      priority: 200,
      isRequired: false // Non-critical, load on demand
    }
  );
  
  // Blockchain Logger (resource intensive)
  lazySecurityLoader.register(
    SecurityComponentName.ADVANCED_BLOCKCHAIN_LOGGER,
    async () => {
      const { blockchainLogger } = await import('./advanced/blockchain/BlockchainLogger');
      return blockchainLogger;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS
      ],
      priority: 210,
      isRequired: false // Non-critical, load on demand
    }
  );
  
  // Quantum Resistance (resource intensive)
  lazySecurityLoader.register(
    SecurityComponentName.ADVANCED_QUANTUM_RESISTANCE,
    async () => {
      const { quantumResistance } = await import('./advanced/quantum/QuantumResistance');
      return quantumResistance;
    },
    {
      dependencies: [SecurityComponentName.CORE_CONFIG],
      priority: 220,
      isRequired: false // Non-critical, load on demand
    }
  );
}

// Register database components
function registerDatabaseComponents(): void {
  // Database Security Service
  lazySecurityLoader.register(
    SecurityComponentName.DATABASE_SECURITY_SERVICE,
    async () => {
      const { databaseSecurity } = await import('./database/DatabaseSecurity');
      return databaseSecurity;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.PROTECTION_INJECTION_GUARD
      ],
      priority: 150,
      isRequired: true // Critical for database operations
    }
  );
  
  // Threat Database Service
  lazySecurityLoader.register(
    SecurityComponentName.DATABASE_THREAT_SERVICE,
    async () => {
      const { threatDatabaseService } = await import('./advanced/threat/ThreatDatabaseService');
      return threatDatabaseService;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.DATABASE_SECURITY_SERVICE
      ],
      priority: 160,
      isRequired: false // Load when needed
    }
  );
}

// Register API security components
function registerApiComponents(): void {
  // API Request Validator
  lazySecurityLoader.register(
    SecurityComponentName.API_VALIDATOR,
    async () => {
      const { apiValidator } = await import('./api/ApiValidator');
      return apiValidator;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS
      ],
      priority: 170,
      isRequired: true // Critical for API security
    }
  );
  
  // API Authentication Guard
  lazySecurityLoader.register(
    SecurityComponentName.API_AUTH_GUARD,
    async () => {
      const { apiAuthGuard } = await import('./api/ApiAuthGuard');
      return apiAuthGuard;
    },
    {
      dependencies: [
        SecurityComponentName.CORE_CONFIG,
        SecurityComponentName.CORE_EVENT_BUS,
        SecurityComponentName.API_VALIDATOR
      ],
      priority: 180,
      isRequired: true // Critical for API security
    }
  );
}

/**
 * Helper function to get a component (with automatic loading if needed)
 */
export async function getSecurityComponent<T = any>(
  componentName: SecurityComponentName,
  options: { autoLoad?: boolean } = {}
): Promise<T | undefined> {
  const autoLoad = options.autoLoad !== undefined ? options.autoLoad : true;
  
  // If component is already loaded, return it
  const instance = lazySecurityLoader.get(componentName);
  if (instance) {
    return instance as T;
  }
  
  // If auto-loading is disabled, return undefined
  if (!autoLoad) {
    return undefined;
  }
  
  // Load the component
  try {
    const loadedInstance = await lazySecurityLoader.load(componentName);
    return loadedInstance as T;
  } catch (error) {
    console.error(chalk.red(`[SecurityComponentRegistry] Error loading component "${componentName}":`), error);
    return undefined;
  }
}

/**
 * Helper function to get a component synchronously (no auto-loading)
 */
export function getSecurityComponentSync<T = any>(componentName: SecurityComponentName): T | undefined {
  return lazySecurityLoader.get(componentName) as T | undefined;
}

/**
 * Get a list of all components that need to be loaded for maximum security
 */
export function getMaximumSecurityComponents(): SecurityComponentName[] {
  // In maximum security, load all components
  return Object.values(SecurityComponentName);
}

/**
 * Get a list of components that need to be loaded for standard security
 */
export function getStandardSecurityComponents(): SecurityComponentName[] {
  // For standard security, only load the required components plus some additional ones
  return [
    // All required components
    ...lazySecurityLoader.getComponents()
      .filter(c => c.isRequired)
      .map(c => c.name as SecurityComponentName),
    
    // Add some optional components for standard security
    SecurityComponentName.PROTECTION_RATE_LIMITER,
    SecurityComponentName.PROTECTION_BRUTE_FORCE,
    SecurityComponentName.MONITORING_METRICS,
    SecurityComponentName.DATABASE_THREAT_SERVICE
  ];
}

/**
 * Load components needed for a specific security level
 */
export async function loadSecurityLevel(
  level: 'minimum' | 'standard' | 'maximum'
): Promise<void> {
  let componentsToLoad: SecurityComponentName[];
  
  switch (level) {
    case 'maximum':
      componentsToLoad = getMaximumSecurityComponents();
      break;
    case 'standard':
      componentsToLoad = getStandardSecurityComponents();
      break;
    case 'minimum':
    default:
      // For minimum, just load required components
      componentsToLoad = lazySecurityLoader.getComponents()
        .filter(c => c.isRequired)
        .map(c => c.name as SecurityComponentName);
      break;
  }
  
  console.log(chalk.blue(`[SecurityComponentRegistry] Loading ${level} security level with ${componentsToLoad.length} components...`));
  
  // Sort components by priority before loading
  const sortedComponents = componentsToLoad
    .map(name => lazySecurityLoader.getComponents().find(c => c.name === name))
    .filter(c => c !== undefined)
    .sort((a, b) => a!.priority - b!.priority)
    .map(c => c!.name as SecurityComponentName);
  
  // Load all components in sequence
  for (const componentName of sortedComponents) {
    try {
      await lazySecurityLoader.load(componentName);
    } catch (error) {
      console.error(chalk.red(`[SecurityComponentRegistry] Failed to load component "${componentName}" for ${level} security level:`), error);
      
      // If it's a required component, throw the error
      const component = lazySecurityLoader.getComponents().find(c => c.name === componentName);
      if (component?.isRequired) {
        throw error;
      }
    }
  }
  
  console.log(chalk.green(`[SecurityComponentRegistry] Loaded ${level} security level successfully`));
}

// Export default for convenience
export default {
  initializeSecurityComponents,
  getSecurityComponent,
  getSecurityComponentSync,
  loadSecurityLevel,
  SecurityComponentName
};