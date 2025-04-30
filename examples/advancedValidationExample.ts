/**
 * Advanced Validation Framework Integration Example
 * 
 * This example demonstrates how all components of the validation framework
 * work together to provide a comprehensive validation solution.
 */

import { z } from 'zod';
import { ValidationContext, ValidationSeverity, createValidationResult } from '../shared/validation/validationTypes';
import { BusinessRulesValidator, createDateRangeValidator } from '../shared/validation/businessRuleValidation';
import { IntegratedValidator } from '../shared/validation/validationIntegration';
import { createOptimizedValidator, DEFAULT_OPTIMIZATION_CONFIG } from '../shared/validation/optimizedValidation';
import { createLocalizationProvider, Locale } from '../shared/validation/localization';
import { ValidationAnalytics, LocalStoragePersistence, createAnalyticsHooks } from '../shared/validation/analytics';
import { visualizeSchema } from '../shared/validation/schemaGenerator';

// Define a complex user profile schema
const userProfileSchema = z.object({
  id: z.string().uuid().optional(),
  personalInfo: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    birthDate: z.date(),
    gender: z.enum(['male', 'female', 'non-binary', 'prefer_not_to_say']).optional(),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  }),
  accountSettings: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmPassword: z.string(),
    preferredLanguage: z.enum(['en', 'es', 'fr', 'de', 'ja', 'zh']).default('en'),
    receiveNotifications: z.boolean().default(true),
    twoFactorEnabled: z.boolean().default(false)
  }),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    colorBlindMode: z.boolean().default(false),
    highContrastMode: z.boolean().default(false)
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'friends', 'private']).default('public'),
    allowDataCollection: z.boolean().default(true),
    allowThirdPartySharing: z.boolean().default(false)
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).refine(data => data.accountSettings.password === data.accountSettings.confirmPassword, {
  message: 'Passwords do not match',
  path: ['accountSettings', 'confirmPassword']
});

// Define user profile type
type UserProfile = z.infer<typeof userProfileSchema>;

// Create business rules for user profile
const userProfileBusinessRules = new BusinessRulesValidator<UserProfile>()
  // Rule 1: User must be at least 18 years old
  .addRule({
    name: 'minimum_age',
    description: 'User must be at least 18 years old',
    validator: (data) => {
      const birthDate = data.personalInfo.birthDate;
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Not yet reached birthday this year
        const actualAge = age - 1;
        
        if (actualAge < 18) {
          return {
            field: 'personalInfo.birthDate',
            message: 'You must be at least 18 years old',
            code: 'MINIMUM_AGE',
            severity: ValidationSeverity.ERROR,
            context: ValidationContext.CUSTOM,
            path: ['personalInfo', 'birthDate']
          };
        }
      } else if (age < 18) {
        return {
          field: 'personalInfo.birthDate',
          message: 'You must be at least 18 years old',
          code: 'MINIMUM_AGE',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['personalInfo', 'birthDate']
        };
      }
      
      return null;
    },
    errorCode: 'MINIMUM_AGE',
    errorMessage: 'You must be at least 18 years old',
    severity: ValidationSeverity.ERROR,
    dependencies: ['personalInfo.birthDate']
  })
  // Rule 2: Two-factor authentication is recommended for privacy-conscious users
  .addRule({
    name: 'recommend_2fa',
    description: 'Two-factor authentication is recommended for privacy-conscious users',
    validator: (data) => {
      if (
        data.privacySettings?.profileVisibility === 'private' && 
        !data.accountSettings.twoFactorEnabled
      ) {
        return {
          field: 'accountSettings.twoFactorEnabled',
          message: 'Two-factor authentication is recommended for users with private profiles',
          code: 'RECOMMENDED_2FA',
          severity: ValidationSeverity.WARNING,
          context: ValidationContext.CUSTOM,
          path: ['accountSettings', 'twoFactorEnabled']
        };
      }
      
      return null;
    },
    errorCode: 'RECOMMENDED_2FA',
    errorMessage: 'Two-factor authentication is recommended for users with private profiles',
    severity: ValidationSeverity.WARNING,
    dependencies: ['privacySettings.profileVisibility', 'accountSettings.twoFactorEnabled'],
    applyWhen: (data) => !!data.privacySettings
  })
  // Rule 3: Data collection consent is required for notification opt-in
  .addRule({
    name: 'data_collection_consent',
    description: 'Data collection consent is required for notification opt-in',
    validator: (data) => {
      if (
        data.accountSettings.receiveNotifications && 
        data.privacySettings && 
        !data.privacySettings.allowDataCollection
      ) {
        return {
          field: 'privacySettings.allowDataCollection',
          message: 'Data collection consent is required for receiving notifications',
          code: 'DATA_COLLECTION_REQUIRED',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['privacySettings', 'allowDataCollection']
        };
      }
      
      return null;
    },
    errorCode: 'DATA_COLLECTION_REQUIRED',
    errorMessage: 'Data collection consent is required for receiving notifications',
    severity: ValidationSeverity.ERROR,
    dependencies: ['accountSettings.receiveNotifications', 'privacySettings.allowDataCollection'],
    applyWhen: (data) => !!data.privacySettings
  })
  // Rule 4: Address is required for users outside the US
  .addRule({
    name: 'address_required_international',
    description: 'Address is required for users outside the US',
    validator: (data) => {
      const phoneNumber = data.personalInfo.phoneNumber;
      
      // Check if phone number does not start with +1 (US country code)
      if (phoneNumber.startsWith('+') && !phoneNumber.startsWith('+1') && !data.address) {
        return {
          field: 'address',
          message: 'Address is required for users outside the United States',
          code: 'ADDRESS_REQUIRED',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['address']
        };
      }
      
      return null;
    },
    errorCode: 'ADDRESS_REQUIRED',
    errorMessage: 'Address is required for users outside the United States',
    severity: ValidationSeverity.ERROR,
    dependencies: ['personalInfo.phoneNumber', 'address']
  });

// Create integrated validator
const userProfileValidator = new IntegratedValidator<UserProfile>(
  userProfileSchema, 
  userProfileBusinessRules
);

// Create optimized validator
const optimizedValidator = createOptimizedValidator(
  userProfileSchema,
  userProfileValidator.validate.bind(userProfileValidator),
  DEFAULT_OPTIMIZATION_CONFIG
);

// Create localization provider
const localizationProvider = createLocalizationProvider();

// Create analytics service
const analyticsService = new ValidationAnalytics(
  { enabled: true },
  typeof window !== 'undefined' ? new LocalStoragePersistence() : null
);

// Create analytics hooks
const {
  trackFormSubmission,
  trackFieldInteraction,
  trackValidation,
  startSession,
  endSession,
  getAnalytics
} = createAnalyticsHooks(analyticsService);

/**
 * Validate user profile with all features
 */
async function validateUserProfile(
  userData: any,
  locale: Locale = 'en',
  trackAnalytics: boolean = true
): Promise<{ 
  valid: boolean; 
  errors: string[]; 
  data?: UserProfile;
  analytics?: ReturnType<typeof getAnalytics>;
}> {
  let sessionId: string | undefined;
  
  // Start analytics session if tracking is enabled
  if (trackAnalytics) {
    sessionId = startSession('user_profile_form');
    
    // Track validation start
    trackValidation('user_profile_form', true);
  }
  
  try {
    // Start timing validation
    const startTime = Date.now();
    
    // Perform validation
    const result = await optimizedValidator.validateData(userData);
    
    // End timing validation
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Track validation result if tracking is enabled
    if (trackAnalytics) {
      trackValidation(
        'user_profile_form',
        result.valid,
        undefined,
        result.errors,
        duration
      );
      
      // Track form submission
      trackFormSubmission(
        'user_profile_form',
        result.valid,
        result.errors
      );
      
      // End session
      if (sessionId) {
        endSession(sessionId, result.valid ? 'completed' : 'abandoned');
      }
    }
    
    // Localize errors if not valid
    let errors: string[] = [];
    
    if (!result.valid) {
      // Get localized errors
      const localizedErrors = result.errors.map(error => 
        localizationProvider.getMessage(
          `validation.${error.code}`, 
          locale, 
          { field: error.field, value: error.value }
        )
      );
      
      errors = localizedErrors;
    }
    
    // Return result
    return {
      valid: result.valid,
      errors,
      data: result.validatedData as UserProfile,
      analytics: trackAnalytics ? getAnalytics() : undefined
    };
  } catch (error) {
    // Track error if tracking is enabled
    if (trackAnalytics && sessionId) {
      trackFormSubmission(
        'user_profile_form',
        false,
        [{
          field: 'form',
          message: error instanceof Error ? error.message : 'Unexpected error',
          code: 'UNEXPECTED_ERROR',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CLIENT
        }]
      );
      
      // End session
      endSession(sessionId, 'abandoned');
    }
    
    // Return error
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unexpected error']
    };
  }
}

/**
 * Generate schema documentation
 */
function generateUserProfileDocs(format: 'markdown' | 'json' | 'html' = 'markdown'): string {
  return visualizeSchema(
    userProfileSchema,
    'UserProfile',
    userProfileBusinessRules,
    {
      includeDescriptions: true,
      includeValidators: true,
      includeBusinessRules: true,
      includeDefaults: true,
      format
    }
  );
}

// Export example functions
export {
  userProfileSchema,
  userProfileBusinessRules,
  userProfileValidator,
  optimizedValidator,
  validateUserProfile,
  generateUserProfileDocs,
  getAnalytics,
  localizationProvider,
  UserProfile
};