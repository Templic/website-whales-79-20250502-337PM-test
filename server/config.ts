/**
 * Server Configuration
 * 
 * Configuration settings for server initialization and feature toggles.
 * This allows for customizing behavior without code changes.
 */

export interface ServerConfig {
  // Database settings
  enableDatabaseOptimization: boolean;
  enableBackgroundServices: boolean;
  deferDatabaseMaintenance: boolean;
  
  // Security settings
  enableSecurityScans: boolean;
  securityScanInterval: number; // hours
  
  // Performance settings
  deferNonCriticalServices: boolean;
  startupPriority: 'speed' | 'maintenance' | 'balanced';
  enableFullLogging: boolean;
  
  // Timing settings (milliseconds)
  nonCriticalServicesDelay: number;
  securityScanDelay: number;
  maintenanceDelay: number;
}

// Default configuration for different environments
const developmentConfig: ServerConfig = {
  enableDatabaseOptimization: true,
  enableBackgroundServices: true,
  deferDatabaseMaintenance: true,
  enableSecurityScans: true,
  securityScanInterval: 24,
  deferNonCriticalServices: true,
  startupPriority: 'speed',
  enableFullLogging: true,
  nonCriticalServicesDelay: 5000,
  securityScanDelay: 10000, 
  maintenanceDelay: 15000
};

const productionConfig: ServerConfig = {
  enableDatabaseOptimization: true,
  enableBackgroundServices: true,
  deferDatabaseMaintenance: false,
  enableSecurityScans: true,
  securityScanInterval: 12,
  deferNonCriticalServices: false,
  startupPriority: 'balanced',
  enableFullLogging: false,
  nonCriticalServicesDelay: 1000,
  securityScanDelay: 5000,
  maintenanceDelay: 3000
};

const testConfig: ServerConfig = {
  enableDatabaseOptimization: false,
  enableBackgroundServices: false,
  deferDatabaseMaintenance: true,
  enableSecurityScans: false,
  securityScanInterval: 24,
  deferNonCriticalServices: true,
  startupPriority: 'speed',
  enableFullLogging: true,
  nonCriticalServicesDelay: 1000,
  securityScanDelay: 1000,
  maintenanceDelay: 1000
};

/**
 * Load configuration based on environment and any overrides
 */
export function loadConfig(): ServerConfig {
  // Determine environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Get base config for environment
  let config: ServerConfig;
  
  switch(nodeEnv) {
    case 'production':
      config = { ...productionConfig };
      break;
    case 'test':
      config = { ...testConfig };
      break;
    default:
      config = { ...developmentConfig };
  }
  
  // Override from environment variables
  if (process.env.ENABLE_DB_OPTIMIZATION === 'false') {
    config.enableDatabaseOptimization = false;
  }
  
  if (process.env.ENABLE_BACKGROUND_SERVICES === 'false') {
    config.enableBackgroundServices = false;
  }
  
  if (process.env.ENABLE_SECURITY_SCANS === 'false') {
    config.enableSecurityScans = false;
  }
  
  if (process.env.DEFER_NONCRITICAL_SERVICES === 'false') {
    config.deferNonCriticalServices = false;
  }
  
  if (process.env.STARTUP_PRIORITY) {
    if (['speed', 'maintenance', 'balanced'].includes(process.env.STARTUP_PRIORITY)) {
      config.startupPriority = process.env.STARTUP_PRIORITY as 'speed' | 'maintenance' | 'balanced';
    }
  }
  
  // Return the final configuration
  return config;
}

// Export default config for testing
export const defaultConfig = developmentConfig;