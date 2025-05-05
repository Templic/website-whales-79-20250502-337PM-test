/**
 * Server Configuration System
 * 
 * Provides a centralized configuration with environment-specific settings,
 * feature flags, and startup modes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration types
export type StartupPriority = 'quickstart' | 'minimal' | 'standard' | 'full';

export interface DatabaseConfig {
  enableOptimization: boolean;
  maintenanceInterval: number; // in milliseconds
  targetTables: string[];
  excludeTables: string[];
  vacuumThreshold: number; // in rows
  analyzeThreshold: number; // in rows
}

export interface SecurityConfig {
  enableScans: boolean;
  scanInterval: number; // in milliseconds
  enableRateLimiting: boolean;
  csrfProtection: boolean;
  maxPayloadSize: string;
  enableIntegratedSecurity?: boolean; // Controls integration between security components
}

export interface FeatureFlags {
  enableDatabaseOptimization: boolean;
  enableSecurityScans: boolean;
  enableBackgroundTasks: boolean;
  enableWebSockets: boolean;
  enableRateLimiting: boolean;
  enableExtraLogging: boolean;
  enableContentScheduling: boolean;
  enableTypeScriptErrorManagement: boolean;
}

export interface ServerConfig {
  port: number;
  host: string;
  startupPriority: StartupPriority;
  deferBackgroundServices: boolean;
  enableHttps: boolean;
  environment: string;
  enableCompression: boolean;
  csrfProtection: boolean;
  
  // Delay times for deferred initialization (in ms)
  maintenanceDelay: number;
  backgroundServicesDelay: number;
  securityScanDelay: number;
  
  // Feature flags
  features: FeatureFlags;
  
  // Specific configurations
  database: DatabaseConfig;
  security: SecurityConfig;
}

// Startup mode configurations
const startupModes = {
  quickstart: {
    deferBackgroundServices: true,
    features: {
      enableDatabaseOptimization: false,
      enableSecurityScans: false,
      enableBackgroundTasks: false,
      enableWebSockets: true,
      enableRateLimiting: false,
      enableExtraLogging: false,
      enableContentScheduling: false,
      enableTypeScriptErrorManagement: false
    },
    maintenanceDelay: 300000, // 5 minutes
    backgroundServicesDelay: 120000, // 2 minutes
    securityScanDelay: 900000, // 15 minutes
    enableCompression: false, // Disable compression initially for faster startup
    csrfProtection: true, // Always enable CSRF protection
  },
  minimal: {
    deferBackgroundServices: true,
    features: {
      enableDatabaseOptimization: false,
      enableSecurityScans: false,
      enableBackgroundTasks: false,
      enableWebSockets: true,
      enableRateLimiting: false,
      enableExtraLogging: false,
      enableContentScheduling: false,
      enableTypeScriptErrorManagement: false
    },
    maintenanceDelay: 60000, // 1 minute
    backgroundServicesDelay: 30000, // 30 seconds
    securityScanDelay: 120000 // 2 minutes
  },
  standard: {
    deferBackgroundServices: true,
    features: {
      enableDatabaseOptimization: true,
      enableSecurityScans: true,
      enableBackgroundTasks: true,
      enableWebSockets: true,
      enableRateLimiting: true,
      enableExtraLogging: false,
      enableContentScheduling: true
    },
    maintenanceDelay: 10000, // 10 seconds
    backgroundServicesDelay: 5000, // 5 seconds
    securityScanDelay: 30000 // 30 seconds
  },
  full: {
    deferBackgroundServices: false,
    features: {
      enableDatabaseOptimization: true,
      enableSecurityScans: true,
      enableBackgroundTasks: true,
      enableWebSockets: true,
      enableRateLimiting: true,
      enableExtraLogging: true,
      enableContentScheduling: true
    },
    maintenanceDelay: 0, // immediate
    backgroundServicesDelay: 0, // immediate
    securityScanDelay: 0 // immediate
  }
};

// Default configuration
const defaultConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: '0.0.0.0',
  startupPriority: (process.env.STARTUP_PRIORITY as StartupPriority) || 'full',
  deferBackgroundServices: true,
  enableHttps: process.env.ENABLE_HTTPS === 'true',
  environment: process.env.NODE_ENV || 'development',
  enableCompression: true,
  csrfProtection: true,
  
  // Delay times for deferred services
  maintenanceDelay: 10000, // 10 seconds
  backgroundServicesDelay: 5000, // 5 seconds
  securityScanDelay: 30000, // 30 seconds
  
  // Feature flags
  features: {
    enableDatabaseOptimization: true,
    enableSecurityScans: true,
    enableBackgroundTasks: true,
    enableWebSockets: true,
    enableRateLimiting: true,
    enableExtraLogging: process.env.EXTRA_LOGGING === 'true',
    enableContentScheduling: true,
    enableTypeScriptErrorManagement: true
  },
  
  // Database configuration
  database: {
    enableOptimization: true,
    maintenanceInterval: 24 * 60 * 60 * 1000, // 24 hours
    targetTables: [], // Empty array means all tables
    excludeTables: ['_migrations', 'pg_stat_statements'],
    vacuumThreshold: 1000, // rows
    analyzeThreshold: 500 // rows
  },
  
  // Security configuration
  security: {
    enableScans: true,
    scanInterval: 12 * 60 * 60 * 1000, // 12 hours
    enableRateLimiting: true,
    // Always enable CSRF protection unless explicitly disabled
    csrfProtection: process.env.SECURITY_CSRF !== 'false',
    maxPayloadSize: '50mb',
    enableIntegratedSecurity: true // Enable integration between security components
  }
};

/**
 * Load environment-specific configuration
 * This merges the default config with environment overrides
 */
export function loadConfig(): ServerConfig {
  try {
    // Get startup priority from env var or default to 'full'
    const startupPriority = (process.env.STARTUP_PRIORITY as StartupPriority) || 'full';
    
    // Apply the startup mode configurations
    let config = { 
      ...defaultConfig,
      ...(startupModes[startupPriority] || {}),
      startupPriority
    };
    
    // Try to load environment-specific config
    const envConfigPath = path.join(__dirname, '..', 'config', `${config.environment}.json`);
    
    // Check for speed mode configuration (highest priority)
    const speedModePath = path.join(__dirname, '..', 'config', 'speed_mode.json');
    
    // Try to load full security config
    const fullSecurityPath = path.join(__dirname, '..', 'config', 'full_security.json');
    
    // Speed mode has highest priority
    if (process.env.ENABLE_SPEED_MODE === 'true' && fs.existsSync(speedModePath)) {
      const speedConfig = JSON.parse(fs.readFileSync(speedModePath, 'utf8'));
      config = mergeConfigs(config, speedConfig);
      console.log('⚡ SPEED MODE ACTIVATED: Server starting with minimal features for fastest performance');
    }
    // Full security has second priority
    else if (process.env.ENABLE_FULL_SECURITY === 'true' && fs.existsSync(fullSecurityPath)) {
      const securityConfig = JSON.parse(fs.readFileSync(fullSecurityPath, 'utf8'));
      config = mergeConfigs(config, securityConfig);
      console.log('Loaded full security configuration with enhanced protection');
    }
    // Environment config has lowest priority
    else if (fs.existsSync(envConfigPath)) {
      const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
      config = mergeConfigs(config, envConfig);
      console.log(`Loaded environment-specific configuration for: ${config.environment}`);
    } else {
      console.log(`No environment-specific configuration found for: ${config.environment}, using defaults`);
    }
    
    // Environment variable overrides
    if (process.env.PORT) {
      config.port = parseInt(process.env.PORT, 10);
    }
    
    if (process.env.ENABLE_DB_OPTIMIZATION === 'false') {
      config.features.enableDatabaseOptimization = false;
    }
    
    if (process.env.ENABLE_SECURITY_SCANS === 'false') {
      config.features.enableSecurityScans = false;
    }
    
    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return defaultConfig;
  }
}

/**
 * Merge configuration objects with proper deep merging
 */
function mergeConfigs(baseConfig: ServerConfig, overrideConfig: Partial<ServerConfig>): ServerConfig {
  // Create a copy of the base config
  const result = { ...baseConfig } as ServerConfig;
  
  // Apply overrides
  for (const [key, value] of Object.entries(overrideConfig)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    // Handle nested objects with specific types
    if (key === 'features' && baseConfig.features && typeof value === 'object') {
      result.features = { ...baseConfig.features, ...(value as FeatureFlags) };
    } 
    else if (key === 'database' && baseConfig.database && typeof value === 'object') {
      result.database = { ...baseConfig.database, ...(value as DatabaseConfig) };
    } 
    else if (key === 'security' && baseConfig.security && typeof value === 'object') {
      result.security = { ...baseConfig.security, ...(value as SecurityConfig) };
    } 
    else {
      // For other properties, use type assertion with key-specific typing
      switch(key) {
        case 'port':
          result.port = value as number;
          break;
        case 'host':
          result.host = value as string;
          break;
        case 'startupPriority':
          result.startupPriority = value as StartupPriority;
          break;
        case 'deferBackgroundServices':
          result.deferBackgroundServices = value as boolean;
          break;
        case 'enableHttps':
          result.enableHttps = value as boolean;
          break;
        case 'environment':
          result.environment = value as string;
          break;
        case 'enableCompression':
          result.enableCompression = value as boolean;
          break;
        case 'csrfProtection':
          result.csrfProtection = value as boolean;
          break;
        case 'maintenanceDelay':
          result.maintenanceDelay = value as number;
          break;
        case 'backgroundServicesDelay':
          result.backgroundServicesDelay = value as number;
          break;
        case 'securityScanDelay':
          result.securityScanDelay = value as number;
          break;
        default:
          // For any other properties (from potentially extended config),
          // safely add them to the result
          (result as any)[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Get a simplified list of enabled features for logging
 */
export function getEnabledFeatures(config: ServerConfig): string[] {
  const enabledFeatures: string[] = [];
  
  for (const [feature, enabled] of Object.entries(config.features)) {
    if (enabled) {
      enabledFeatures.push(feature.replace('enable', ''));
    }
  }
  
  return enabledFeatures;
}

// Export the loaded configuration
export const config = loadConfig();