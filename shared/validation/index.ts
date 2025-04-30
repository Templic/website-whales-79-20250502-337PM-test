/**
 * Validation Framework Entrypoint
 * 
 * This module exports all validation components and provides a convenient API
 * for using the entire validation framework.
 */

// Export all modules
export * from './validationTypes';
export * from './businessRuleValidation';
export * from './validationIntegration';
export * from './validationPatterns';
export * from './schemaGenerator';
export * from './optimizedValidation';
export * from './localization';
export * from './analytics';

// Re-export zod for convenience
import { z } from 'zod';
export { z };

import { 
  ValidationContext, 
  ValidationSeverity,
  createValidationResult
} from './validationTypes';

import {
  BusinessRulesValidator
} from './businessRuleValidation';

import {
  IntegratedValidator
} from './validationIntegration';

import {
  createOptimizedValidator,
  DEFAULT_OPTIMIZATION_CONFIG
} from './optimizedValidation';

import {
  createLocalizationProvider,
  Locale
} from './localization';

import {
  ValidationAnalytics,
  LocalStoragePersistence,
  createAnalyticsHooks
} from './analytics';

/**
 * Validation Framework Configuration
 */
export interface ValidationFrameworkConfig {
  enableOptimizations?: boolean;
  enableLocalization?: boolean;
  enableAnalytics?: boolean;
  defaultLocale?: Locale;
  openAiApiKey?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ValidationFrameworkConfig = {
  enableOptimizations: true,
  enableLocalization: true,
  enableAnalytics: true,
  defaultLocale: 'en'
};

/**
 * Create a validation framework instance
 */
export function createValidationFramework<T>(
  schema: z.ZodType<T>,
  businessRules?: BusinessRulesValidator<T>,
  config: ValidationFrameworkConfig = DEFAULT_CONFIG
) {
  // Configuration
  const {
    enableOptimizations = true,
    enableLocalization = true,
    enableAnalytics = true,
    defaultLocale = 'en',
    openAiApiKey
  } = config;
  
  // Create base validator
  const baseValidator = new IntegratedValidator<T>(schema, businessRules);
  
  // Create optimized validator if enabled
  const validator = enableOptimizations
    ? createOptimizedValidator(
        schema,
        baseValidator.validate.bind(baseValidator),
        DEFAULT_OPTIMIZATION_CONFIG
      )
    : {
        validateData: baseValidator.validate.bind(baseValidator),
        validateField: (field: keyof T, data: T) => baseValidator.validate(data, {
          fields: [field as string]
        }),
        invalidateCache: () => {},
        clearCache: () => {}
      };
  
  // Create localization provider if enabled
  const localization = enableLocalization
    ? createLocalizationProvider(openAiApiKey)
    : null;
  
  // Create analytics service if enabled
  const analytics = enableAnalytics
    ? new ValidationAnalytics(
        { enabled: true },
        typeof window !== 'undefined' ? new LocalStoragePersistence() : null
      )
    : null;
  
  // Create analytics hooks if enabled
  const analyticsHooks = analytics
    ? createAnalyticsHooks(analytics)
    : null;
  
  // Return framework API
  return {
    // Validators
    validate: validator.validateData,
    validateField: validator.validateField,
    
    // Cache control
    invalidateCache: validator.invalidateCache,
    clearCache: validator.clearCache,
    
    // Localization
    localize: localization
      ? (key: string, locale: Locale = defaultLocale, params?: Record<string, any>) => 
          localization.getMessage(key, locale, params)
      : null,
    
    // Analytics
    startSession: analyticsHooks?.startSession,
    endSession: analyticsHooks?.endSession,
    trackFormSubmission: analyticsHooks?.trackFormSubmission,
    trackFieldInteraction: analyticsHooks?.trackFieldInteraction,
    trackValidation: analyticsHooks?.trackValidation,
    getAnalytics: analyticsHooks?.getAnalytics,
    
    // Underlying components
    components: {
      baseValidator,
      optimizedValidator: validator,
      localizationProvider: localization,
      analyticsService: analytics,
      analyticsHooks
    }
  };
}