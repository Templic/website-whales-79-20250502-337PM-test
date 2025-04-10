/**
 * Configuration Module
 * 
 * Provides a centralized configuration system with support for
 * environment-specific settings and feature toggles.
 */

// Environment types
export type Environment = 'development' | 'production' | 'staging' | 'test';

// Startup priority types
export type StartupPriority = 'balanced' | 'speed' | 'maintenance';

// Startup mode types
export type StartupMode = 'minimal' | 'standard' | 'full';

// Server features that can be toggled
export interface FeatureToggles {
  enableWebSockets: boolean;      // Enable WebSocket server
  enableBackgroundTasks: boolean; // Enable background processing tasks
  enableSecurityScans: boolean;   // Enable security scanning
  enableAnalytics: boolean;       // Enable analytics collection
  enableDatabaseOptimization: boolean; // Enable database optimization
  enableCaching: boolean;         // Enable response caching
  enableRateLimiting: boolean;    // Enable rate limiting
}

// Main configuration interface
export interface ServerConfig {
  // Environment settings
  nodeEnv: Environment;
  startupPriority: StartupPriority;
  startupMode: StartupMode;
  port: number;
  
  // Feature toggles
  features: FeatureToggles;
  
  // Database settings
  databaseUrl: string;
  poolSize: number;
  
  // Security settings
  enableHttps: boolean;
  corsOrigins: string[];
  csrfProtection: boolean;

  // Performance settings
  enableCompression: boolean;
  maxRequestBodySize: string;
  
  // Timing settings
  deferBackgroundServices: boolean;
  deferDatabaseMaintenance: boolean;
  deferSecurityScans: boolean;
  backgroundServicesDelay: number;
  maintenanceDelay: number;
  securityScanDelay: number;

  // Logging settings
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAccessLogs: boolean;
}

// Default configuration
const defaultConfig: ServerConfig = {
  // Environment settings
  nodeEnv: 'development',
  startupPriority: 'balanced',
  startupMode: 'standard',
  port: 5000,
  
  // Feature toggles
  features: {
    enableWebSockets: true,
    enableBackgroundTasks: true,
    enableSecurityScans: true,
    enableAnalytics: true,
    enableDatabaseOptimization: true,
    enableCaching: true,
    enableRateLimiting: true
  },
  
  // Database settings
  databaseUrl: process.env.DATABASE_URL || '',
  poolSize: 10,
  
  // Security settings
  enableHttps: false,
  corsOrigins: ['*'],
  csrfProtection: true,

  // Performance settings
  enableCompression: true,
  maxRequestBodySize: '50mb',
  
  // Timing settings
  deferBackgroundServices: true,
  deferDatabaseMaintenance: true,
  deferSecurityScans: true,
  backgroundServicesDelay: 10000, // 10 seconds
  maintenanceDelay: 30000,        // 30 seconds
  securityScanDelay: 60000,       // 60 seconds

  // Logging settings
  logLevel: 'info',
  enableAccessLogs: true
};

// Environment-specific configurations
const environmentConfigs: Record<Environment, Partial<ServerConfig>> = {
  development: {
    logLevel: 'debug',
    startupPriority: 'speed',
    poolSize: 5,
    features: {
      enableWebSockets: true,
      enableBackgroundTasks: true,
      enableSecurityScans: true,
      enableAnalytics: true,
      enableDatabaseOptimization: true,
      enableRateLimiting: false,
      enableCaching: false
    },
    deferSecurityScans: true,
    securityScanDelay: 30000 // 30 seconds in development
  },
  
  production: {
    logLevel: 'warn',
    startupPriority: 'balanced',
    startupMode: 'full',
    features: {
      enableWebSockets: true,
      enableBackgroundTasks: true,
      enableSecurityScans: true,
      enableAnalytics: true,
      enableDatabaseOptimization: true,
      enableRateLimiting: true,
      enableCaching: true
    },
    poolSize: 20,
    enableHttps: true,
    corsOrigins: [
      'https://daleloveswhales.com', 
      'https://www.daleloveswhales.com'
    ],
    deferBackgroundServices: true,
    backgroundServicesDelay: 5000 // 5 seconds in production
  },
  
  staging: {
    logLevel: 'info',
    startupPriority: 'balanced',
    features: {
      enableWebSockets: true,
      enableBackgroundTasks: true,
      enableSecurityScans: true,
      enableAnalytics: true,
      enableDatabaseOptimization: true,
      enableRateLimiting: true,
      enableCaching: true
    },
    poolSize: 10,
    enableHttps: true,
    corsOrigins: [
      'https://staging.daleloveswhales.com'
    ]
  },
  
  test: {
    logLevel: 'error',
    startupPriority: 'speed',
    startupMode: 'minimal',
    port: 5001,
    features: {
      enableWebSockets: false,
      enableBackgroundTasks: false,
      enableSecurityScans: false,
      enableAnalytics: false,
      enableDatabaseOptimization: false,
      enableCaching: false,
      enableRateLimiting: false
    },
    poolSize: 2,
    csrfProtection: false,
    enableCompression: false,
    deferBackgroundServices: false,
    deferDatabaseMaintenance: false,
    deferSecurityScans: false,
    enableAccessLogs: false
  }
};

// Load configuration based on environment and override options
export function loadConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  // Determine environment
  const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;
  
  // Load startup mode and priority from environment variables
  const startupPriority = process.env.STARTUP_PRIORITY as StartupPriority || defaultConfig.startupPriority;
  const startupMode = process.env.STARTUP_MODE as StartupMode || defaultConfig.startupMode;
  
  // Get environment-specific config
  const envConfig = environmentConfigs[nodeEnv] || {};
  
  // Merge configurations with precedence: 
  // default < environment-specific < explicit overrides < process.env
  let config = {
    ...defaultConfig,
    ...envConfig,
    startupPriority,
    startupMode,
    ...overrides
  };
  
  // Override from environment variables
  config.port = parseInt(process.env.PORT || config.port.toString(), 10);
  config.databaseUrl = process.env.DATABASE_URL || config.databaseUrl;
  
  // Parse feature toggles from environment
  if (process.env.ENABLE_WEBSOCKETS) {
    config.features.enableWebSockets = process.env.ENABLE_WEBSOCKETS === 'true';
  }
  
  if (process.env.ENABLE_BACKGROUND_TASKS) {
    config.features.enableBackgroundTasks = process.env.ENABLE_BACKGROUND_TASKS === 'true';
  }
  
  if (process.env.ENABLE_SECURITY_SCANS) {
    config.features.enableSecurityScans = process.env.ENABLE_SECURITY_SCANS === 'true';
  }
  
  if (process.env.ENABLE_ANALYTICS) {
    config.features.enableAnalytics = process.env.ENABLE_ANALYTICS === 'true';
  }
  
  if (process.env.ENABLE_DATABASE_OPTIMIZATION) {
    config.features.enableDatabaseOptimization = process.env.ENABLE_DATABASE_OPTIMIZATION === 'true';
  }

  // Apply startup mode settings
  applyStartupModeSettings(config);

  // Apply startup priority settings
  applyStartupPrioritySettings(config);
  
  return config;
}

/**
 * Apply settings based on startup mode
 */
function applyStartupModeSettings(config: ServerConfig): void {
  switch (config.startupMode) {
    case 'minimal':
      // Only enable essential features
      config.features.enableBackgroundTasks = false;
      config.features.enableSecurityScans = false;
      config.features.enableAnalytics = false;
      config.features.enableDatabaseOptimization = false;
      config.features.enableCaching = false;
      config.features.enableRateLimiting = false;
      break;
      
    case 'standard':
      // Default configuration with selective features
      config.features.enableBackgroundTasks = true;
      config.features.enableSecurityScans = true;
      config.features.enableAnalytics = true;
      config.features.enableDatabaseOptimization = true;
      break;
      
    case 'full':
      // Enable all features
      config.features.enableWebSockets = true;
      config.features.enableBackgroundTasks = true;
      config.features.enableSecurityScans = true;
      config.features.enableAnalytics = true;
      config.features.enableDatabaseOptimization = true;
      config.features.enableCaching = true;
      config.features.enableRateLimiting = true;
      break;
  }
}

/**
 * Apply settings based on startup priority
 */
function applyStartupPrioritySettings(config: ServerConfig): void {
  switch (config.startupPriority) {
    case 'speed':
      // Prioritize fast startup
      config.deferBackgroundServices = true;
      config.deferDatabaseMaintenance = true;
      config.deferSecurityScans = true;
      config.backgroundServicesDelay = 10000;  // 10 seconds
      config.maintenanceDelay = 30000;         // 30 seconds
      config.securityScanDelay = 60000;        // 60 seconds
      break;
      
    case 'balanced':
      // Balance startup speed and maintenance
      config.deferBackgroundServices = true;
      config.deferDatabaseMaintenance = true;
      config.deferSecurityScans = true;
      config.backgroundServicesDelay = 5000;   // 5 seconds
      config.maintenanceDelay = 15000;         // 15 seconds
      config.securityScanDelay = 30000;        // 30 seconds
      break;
      
    case 'maintenance':
      // Prioritize maintenance tasks
      config.deferBackgroundServices = false;
      config.deferDatabaseMaintenance = false;
      config.deferSecurityScans = true;
      config.backgroundServicesDelay = 0;      // Immediate
      config.maintenanceDelay = 0;             // Immediate
      config.securityScanDelay = 5000;         // 5 seconds
      break;
  }
}

// Get enabledFeatures object for telemetry/monitoring
export function getEnabledFeatures(config: ServerConfig): Record<string, boolean> {
  return {
    webSockets: config.features.enableWebSockets,
    backgroundTasks: config.features.enableBackgroundTasks,
    securityScans: config.features.enableSecurityScans,
    analytics: config.features.enableAnalytics,
    databaseOptimization: config.features.enableDatabaseOptimization,
    caching: config.features.enableCaching,
    rateLimiting: config.features.enableRateLimiting
  };
}

// Export a singleton configuration instance
export const config = loadConfig();