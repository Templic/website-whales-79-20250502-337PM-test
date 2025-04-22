/**
 * Security Configuration Interface
 * 
 * This module defines the configuration options for the advanced security architecture.
 */

export interface ThreatIntelligenceConfig {
  /**
   * Sources to use for threat intelligence
   */
  sources?: string[];
  
  /**
   * How often to update threat intelligence (in minutes)
   */
  updateInterval?: number;
  
  /**
   * API keys for external threat intelligence services
   */
  apiKeys?: Record<string, string>;
  
  /**
   * Whether to use simulated threat intelligence in development
   */
  useSimulation?: boolean;
}

export interface AnomalyDetectionConfig {
  /**
   * Whether to enable anomaly detection
   */
  enabled?: boolean;
  
  /**
   * Model parameters for anomaly detection
   */
  modelParams?: {
    /**
     * Learning rate for the model
     */
    learningRate?: number;
    
    /**
     * Time window for analysis (in minutes)
     */
    timeWindow?: number;
    
    /**
     * Threshold for anomaly detection (0-1)
     */
    anomalyThreshold?: number;
  };
  
  /**
   * How often to retrain the model (in hours)
   */
  retrainInterval?: number;
}

export interface CryptographicConfig {
  /**
   * Whether to use quantum-resistant algorithms
   */
  useQuantumResistant?: boolean;
  
  /**
   * Key size for cryptographic operations
   */
  keySize?: number;
  
  /**
   * How often to rotate keys (in days)
   */
  keyRotationDays?: number;
}

export interface SecurityConfig {
  /**
   * Global security mode
   */
  mode?: 'development' | 'testing' | 'production';
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Configuration for threat intelligence
   */
  threatIntelligence?: ThreatIntelligenceConfig;
  
  /**
   * Configuration for anomaly detection
   */
  anomalyDetection?: AnomalyDetectionConfig;
  
  /**
   * Configuration for cryptographic operations
   */
  cryptographic?: CryptographicConfig;
  
  /**
   * How frequently to perform security scans (in minutes)
   */
  scanInterval?: number;
  
  /**
   * Custom settings for specific security components
   */
  components?: Record<string, any>;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  debug: process.env.NODE_ENV !== 'production',
  threatIntelligence: {
    sources: ['internal', 'osint'],
    updateInterval: 60, // 1 hour
    useSimulation: process.env.NODE_ENV !== 'production'
  },
  anomalyDetection: {
    enabled: true,
    modelParams: {
      learningRate: 0.01,
      timeWindow: 60, // 1 hour
      anomalyThreshold: 0.85
    },
    retrainInterval: 24 // 24 hours
  },
  cryptographic: {
    useQuantumResistant: true,
    keySize: 4096,
    keyRotationDays: 30
  },
  scanInterval: 60 // 1 hour
};