/**
 * Security Configuration System
 * 
 * This module provides a centralized configuration system for security features,
 * including validation, rate limiting, and CSRF protection.
 */

import secureLogger from '../../utils/secureLogger';

// Configure component name for logging
const logComponent = 'SecurityConfig';

// Security features interface
export interface SecurityFeatures {
  // Core security features
  validation: boolean | number; // Enable validation (number represents validation level)
  rateLimiting: boolean | number; // Enable rate limiting (number represents requests per minute)
  csrfProtection: boolean | number; // Enable CSRF protection (number represents token TTL in seconds)
  
  // Advanced features
  aiSecurity: boolean | number; // Enable AI-powered security (number represents sensitivity level)
  contentScanning: boolean | number; // Enable content scanning (number represents thoroughness level)
  
  // Middleware configuration
  securityHeaders: boolean; // Enable security headers
  xssProtection: boolean; // Enable XSS protection
  
  // Fallback features
  fallbackValidation: boolean; // Enable fallback validation
  performancePriority: boolean; // Prioritize performance over strict security
  
  // Logging and monitoring
  secureLogging: boolean; // Enable security logging
  auditTrail: boolean; // Enable audit trail
}

// Default security configuration
const defaultSecurityFeatures: SecurityFeatures = {
  validation: true,
  rateLimiting: 60, // 60 requests per minute
  csrfProtection: 3600, // 1 hour TTL
  
  aiSecurity: 50, // Medium sensitivity
  contentScanning: true,
  
  securityHeaders: true,
  xssProtection: true,
  
  fallbackValidation: true,
  performancePriority: false,
  
  secureLogging: true,
  auditTrail: true
};

// Detailed configuration settings
interface SecuritySettings {
  // General settings
  environmentMode: 'development' | 'test' | 'production' | 'custom';
  
  // Authentication settings
  authTokenTTL: number; // in seconds
  refreshTokenTTL: number; // in seconds
  passwordHashRounds: number;
  
  // Rate limiting settings
  rateLimitWindow: number; // in seconds
  rateLimitMaxRequests: number;
  rateLimitExemptIps: string[];
  
  // CSRF settings
  csrfTokenSecret: string;
  csrfTokenName: string;
  
  // Validation settings
  validationCacheTTL: number; // in seconds
  validationTimeoutMs: number; // in milliseconds
  validationErrorVerbosity: 'minimal' | 'standard' | 'detailed';
  
  // AI security settings
  securityAnalysisSensitivity: 'low' | 'medium' | 'high';
  securityAnalysisTimeout: number; // in milliseconds
  includeContextInAnalysis: boolean;
  
  // Logging settings
  securityLogLevel: 'debug' | 'info' | 'warn' | 'error';
  securityLogRetentionDays: number;
  
  // Fallback settings
  fallbackMaxSeverity: 'low' | 'medium' | 'high';
  fallbackRecoveryStrategy: 'strict' | 'permissive';
  
  // Other security settings
  allowedOrigins: string[];
  maxRequestBodySize: number; // in KB
  bruteForceProtection: boolean;
}

// Default security settings
const defaultSecuritySettings: SecuritySettings = {
  environmentMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  authTokenTTL: 3600, // 1 hour
  refreshTokenTTL: 604800, // 1 week
  passwordHashRounds: 12,
  
  rateLimitWindow: 60, // 1 minute
  rateLimitMaxRequests: 100,
  rateLimitExemptIps: ['127.0.0.1'],
  
  csrfTokenSecret: process.env.CSRF_TOKEN_SECRET || 'default-csrf-secret-change-in-production',
  csrfTokenName: 'csrf-token',
  
  validationCacheTTL: 300, // 5 minutes
  validationTimeoutMs: 5000, // 5 seconds
  validationErrorVerbosity: process.env.NODE_ENV === 'production' ? 'minimal' : 'detailed',
  
  securityAnalysisSensitivity: process.env.NODE_ENV === 'production' ? 'high' : 'medium',
  securityAnalysisTimeout: 3000, // 3 seconds
  includeContextInAnalysis: true,
  
  securityLogLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  securityLogRetentionDays: 30,
  
  fallbackMaxSeverity: 'medium',
  fallbackRecoveryStrategy: 'strict',
  
  allowedOrigins: ['http://localhost:3000'],
  maxRequestBodySize: 1024, // 1MB
  bruteForceProtection: true
};

/**
 * Security configuration class
 */
export class SecurityConfig {
  private features: SecurityFeatures;
  private settings: SecuritySettings;
  
  constructor(
    initialFeatures?: Partial<SecurityFeatures>,
    initialSettings?: Partial<SecuritySettings>
  ) {
    this.features = { ...defaultSecurityFeatures, ...initialFeatures };
    this.settings = { ...defaultSecuritySettings, ...initialSettings };
    
    // Apply environment variables if any
    this.applyEnvironmentVariables();
    
    // Log initialization
    secureLogger('info', logComponent, 'Security configuration initialized', {
      metadata: {
        environmentMode: this.settings.environmentMode,
        features: this.features
      }
    });
  }
  
  /**
   * Apply environment variables to configuration
   */
  private applyEnvironmentVariables(): void {
    // Check for environment-based overrides
    if (process.env.SECURITY_VALIDATION === 'false') {
      this.features.validation = false;
    }
    
    if (process.env.SECURITY_RATE_LIMITING && !isNaN(Number(process.env.SECURITY_RATE_LIMITING))) {
      this.features.rateLimiting = Number(process.env.SECURITY_RATE_LIMITING);
    }
    
    if (process.env.SECURITY_CSRF === 'false') {
      this.features.csrfProtection = false;
    }
    
    if (process.env.SECURITY_AI === 'false') {
      this.features.aiSecurity = false;
    }
    
    if (process.env.SECURITY_CONTENT_SCANNING === 'false') {
      this.features.contentScanning = false;
    }
    
    if (process.env.SECURITY_HEADERS === 'false') {
      this.features.securityHeaders = false;
    }
    
    if (process.env.SECURITY_XSS === 'false') {
      this.features.xssProtection = false;
    }
    
    if (process.env.SECURITY_FALLBACK === 'false') {
      this.features.fallbackValidation = false;
    }
    
    if (process.env.SECURITY_PERFORMANCE_PRIORITY === 'true') {
      this.features.performancePriority = true;
    }
    
    if (process.env.SECURITY_LOGGING === 'false') {
      this.features.secureLogging = false;
    }
    
    if (process.env.SECURITY_AUDIT === 'false') {
      this.features.auditTrail = false;
    }
    
    // Apply settings from environment
    if (process.env.AUTH_TOKEN_TTL && !isNaN(Number(process.env.AUTH_TOKEN_TTL))) {
      this.settings.authTokenTTL = Number(process.env.AUTH_TOKEN_TTL);
    }
    
    if (process.env.RATE_LIMIT_MAX_REQUESTS && !isNaN(Number(process.env.RATE_LIMIT_MAX_REQUESTS))) {
      this.settings.rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
    }
    
    if (process.env.CSRF_TOKEN_SECRET) {
      this.settings.csrfTokenSecret = process.env.CSRF_TOKEN_SECRET;
    }
    
    if (process.env.SECURITY_LOG_LEVEL && ['debug', 'info', 'warn', 'error'].includes(process.env.SECURITY_LOG_LEVEL)) {
      this.settings.securityLogLevel = process.env.SECURITY_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      try {
        this.settings.allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS);
      } catch (error) {
        secureLogger('error', logComponent, 'Failed to parse ALLOWED_ORIGINS from environment', {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            value: process.env.ALLOWED_ORIGINS
          }
        });
      }
    }
  }
  
  /**
   * Check if a security feature is enabled
   */
  public isFeatureEnabled(feature: keyof SecurityFeatures): boolean {
    const value = this.features[feature];
    return typeof value === 'boolean' ? value : (value > 0);
  }
  
  /**
   * Get value for a security feature (raw value, which may be boolean or number)
   */
  public getFeatureValue<T extends keyof SecurityFeatures>(feature: T): SecurityFeatures[T] {
    return this.features[feature];
  }
  
  /**
   * Get value for a security feature as a number
   * If the feature is boolean, returns 1 for true and 0 for false
   */
  public getFeatureValueAsNumber(feature: keyof SecurityFeatures): number {
    const value = this.features[feature];
    return typeof value === 'boolean' ? (value ? 1 : 0) : value;
  }
  
  /**
   * Get a security setting
   */
  public getSetting<T extends keyof SecuritySettings>(setting: T): SecuritySettings[T] {
    return this.settings[setting];
  }
  
  /**
   * Get a string value from security settings or features
   * This is a helper method that handles type conversion
   */
  public getValueAsString(key: keyof SecuritySettings | keyof SecurityFeatures, defaultValue: string): string {
    // Check if the key exists in settings
    if (key in this.settings) {
      const value = this.settings[key as keyof SecuritySettings];
      return String(value);
    }
    
    // Check if the key exists in features
    if (key in this.features) {
      const value = this.features[key as keyof SecurityFeatures];
      return String(value);
    }
    
    return defaultValue;
  }
  
  /**
   * Update security features
   */
  public updateFeatures(features: Partial<SecurityFeatures>): void {
    this.features = { ...this.features, ...features };
    
    secureLogger('info', logComponent, 'Security features updated', {
      metadata: {
        updatedFeatures: features,
        currentFeatures: this.features
      }
    });
  }
  
  /**
   * Update security settings
   */
  public updateSettings(settings: Partial<SecuritySettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    secureLogger('info', logComponent, 'Security settings updated', {
      metadata: {
        updatedSettings: settings
      }
    });
  }
  
  /**
   * Get CORS options for Express app
   */
  public getCorsOptions(): {
    origin: string[] | boolean;
    methods?: string[];
    credentials?: boolean;
  } {
    return {
      origin: this.settings.allowedOrigins.length > 0 ? this.settings.allowedOrigins : true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true
    };
  }
  
  /**
   * Get security headers for Helmet middleware
   */
  public getSecurityHeaders(): Record<string, boolean | string | string[] | { policy: string }> {
    if (!this.features.securityHeaders) {
      return {};
    }
    
    return {
      contentSecurityPolicy: this.settings.environmentMode === 'production',
      xssFilter: this.features.xssProtection,
      noSniff: true,
      frameguard: true,
      hsts: this.settings.environmentMode === 'production',
      referrerPolicy: { policy: 'same-origin' }
    };
  }
  
  /**
   * Get rate limiting options
   */
  public getRateLimitOptions(): {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skip?: (req: any) => boolean;
  } {
    if (!this.isFeatureEnabled('rateLimiting')) {
      return {
        windowMs: 60000,
        max: 0, // Disabled (0 means unlimited)
        skipSuccessfulRequests: true
      };
    }
    
    return {
      windowMs: this.settings.rateLimitWindow * 1000,
      max: typeof this.features.rateLimiting === 'number' ? 
        this.features.rateLimiting : 
        this.settings.rateLimitMaxRequests,
      skipSuccessfulRequests: false,
      skip: (req: any) => {
        const clientIp = req.ip || req.connection.remoteAddress;
        return this.settings.rateLimitExemptIps.includes(clientIp);
      }
    };
  }
  
  /**
   * Create a safe copy of the configuration (without secrets)
   */
  public getSafeConfig(): {
    features: SecurityFeatures;
    settings: Omit<SecuritySettings, 'csrfTokenSecret'>;
  } {
    const { csrfTokenSecret, ...safeSettings } = this.settings;
    
    return {
      features: { ...this.features },
      settings: safeSettings
    };
  }
  
  /**
   * Set configuration mode
   */
  public setMode(mode: 'development' | 'test' | 'production' | 'custom'): void {
    this.settings.environmentMode = mode;
    
    // Adjust configuration based on mode
    if (mode === 'production') {
      this.updateFeatures({
        validation: true,
        rateLimiting: 100, // More restrictive rate limiting
        csrfProtection: true,
        aiSecurity: 75, // Higher sensitivity
        contentScanning: true,
        securityHeaders: true,
        xssProtection: true,
        fallbackValidation: true,
        performancePriority: false, // Security over performance
        secureLogging: true,
        auditTrail: true
      });
      
      this.updateSettings({
        validationErrorVerbosity: 'minimal',
        securityLogLevel: 'warn',
        securityAnalysisSensitivity: 'high'
      });
    } else if (mode === 'development') {
      this.updateFeatures({
        validation: true,
        rateLimiting: 300, // Less restrictive rate limiting
        csrfProtection: true,
        aiSecurity: 50, // Medium sensitivity
        contentScanning: true,
        securityHeaders: true,
        xssProtection: true,
        fallbackValidation: true,
        performancePriority: true, // Performance over security
        secureLogging: true,
        auditTrail: false
      });
      
      this.updateSettings({
        validationErrorVerbosity: 'detailed',
        securityLogLevel: 'debug',
        securityAnalysisSensitivity: 'medium'
      });
    } else if (mode === 'test') {
      this.updateFeatures({
        validation: true,
        rateLimiting: false, // Disable rate limiting in tests
        csrfProtection: false, // Disable CSRF in tests
        aiSecurity: false, // Disable AI in tests
        contentScanning: false, // Disable content scanning in tests
        securityHeaders: false, // Disable security headers in tests
        xssProtection: true,
        fallbackValidation: true,
        performancePriority: true, // Performance over security
        secureLogging: false, // Disable logging in tests
        auditTrail: false
      });
      
      this.updateSettings({
        validationErrorVerbosity: 'detailed',
        securityLogLevel: 'debug'
      });
    }
    
    secureLogger('info', logComponent, `Security configuration mode set to ${mode}`, {
      metadata: {
        mode,
        features: this.features
      }
    });
  }
}

// Export singleton instance
export const securityConfig = new SecurityConfig();