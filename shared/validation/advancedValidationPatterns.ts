/**
 * Advanced Validation Patterns Module
 * 
 * Extends the basic validation patterns with more sophisticated validation capabilities,
 * including context-aware validation, security-focused validation, and relational validation.
 */

import { z } from 'zod';
import { Patterns, Primitives, SchemaBuilders } from './validationPatterns';

/**
 * Context-aware validation patterns
 */
export const ContextualValidation = {
  /**
   * Create a schema that conditionally applies validation based on another field
   */
  conditionalField: <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
    schema: T,
    dependsOn: string,
    condition: (value: unknown) => boolean,
    thenUse: U
  ) => schema.superRefine((data, ctx) => {
    const dependentValue = (data as any)[dependsOn];
    if (condition(dependentValue)) {
      try {
        const result = thenUse.safeParse((data as any));
        if (!result.success) {
          result.error.errors.forEach(issue => {
            ctx.addIssue(issue);
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conditional validation failed',
          path: [dependsOn]
        });
      }
    }
  }),

  /**
   * Create a schema with dynamic validation based on request context
   */
  contextual: <T extends z.ZodTypeAny>(
    schema: T,
    contextValidator: (data: z.infer<T>, additionalContext?: any) => z.ZodIssue[] | null
  ) => schema.superRefine((data, ctx) => {
    // Pass undefined as the context since ctx.data doesn't exist on RefinementCtx
    // Any additional context would need to be passed when creating the validator
    const issues = contextValidator(data, undefined);
    if (issues) {
      issues.forEach(issue => {
        ctx.addIssue(issue);
      });
    }
  }),

  /**
   * Create a schema that validates arrays of objects with contextual relationship checks
   */
  relationalArray: <T extends z.ZodTypeAny>(
    itemSchema: T,
    validateRelations: (items: z.infer<T>[]) => z.ZodIssue[] | null
  ) => z.array(itemSchema).superRefine((items, ctx) => {
    const issues = validateRelations(items);
    if (issues) {
      issues.forEach(issue => {
        ctx.addIssue(issue);
      });
    }
  }),

  /**
   * Create a schema for validating against reference data
   */
  referenceData: <T extends z.ZodTypeAny>(
    schema: T,
    referenceLookup: (value: z.infer<T>) => Promise<boolean> | boolean,
    errorMessage: string = 'Value does not match reference data'
  ) => schema.superRefine(async (value, ctx) => {
    const exists = await Promise.resolve(referenceLookup(value));
    if (!exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: errorMessage,
        path: []
      });
    }
  })
};

/**
 * Security-focused validation patterns
 */
export const SecurityValidation = {
  /**
   * Schema for validating against common injection attacks
   */
  sanitizedString: (options: {
    minLength?: number;
    maxLength?: number;
    disallowHtml?: boolean;
    disallowSql?: boolean;
  } = {}) => {
    // Base validation
    let schema = z.string();
    
    // Apply length constraints if specified
    if (options.minLength !== undefined) {
      schema = schema.min(options.minLength, 
        { message: `Value must be at least ${options.minLength} characters` });
    }
    
    if (options.maxLength !== undefined) {
      schema = schema.max(options.maxLength, 
        { message: `Value cannot exceed ${options.maxLength} characters` });
    }
    
    // Apply security refinements
    return schema.superRefine((value, ctx) => {
      // Check for HTML if disallowed
      if (options.disallowHtml && /<[^>]*>/g.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'HTML tags are not allowed in this field',
          path: []
        });
      }
      
      // Check for SQL injection patterns if disallowed
      if (options.disallowSql && /('|"|--|\/\*|\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b)/gi.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Potentially unsafe SQL patterns are not allowed',
          path: []
        });
      }
    });
  },

  /**
   * Schema for API keys and security tokens validation
   */
  securityToken: (options: {
    type: 'api-key' | 'jwt' | 'oauth' | 'session';
    format?: RegExp;
  }) => {
    // Base validation
    let schema = z.string().min(1, { message: 'Security token is required' });
    
    // Apply format validation based on token type
    switch (options.type) {
      case 'api-key':
        schema = schema.regex(options.format || /^[A-Za-z0-9_\-]{8,}$/,
          { message: 'Invalid API key format' });
        break;
      case 'jwt':
        schema = schema.regex(options.format || /^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/,
          { message: 'Invalid JWT format' });
        break;
      case 'oauth':
        schema = schema.regex(options.format || /^[A-Za-z0-9_\-]{20,}$/,
          { message: 'Invalid OAuth token format' });
        break;
      case 'session':
        schema = schema.regex(options.format || /^[A-Za-z0-9]{16,64}$/,
          { message: 'Invalid session token format' });
        break;
    }
    
    return schema;
  },

  /**
   * Schema for validating file uploads (mime type, size, etc.)
   */
  fileUpload: (options: {
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
  } = {}) => {
    return z.object({
      size: options.maxSizeBytes 
        ? z.number().max(options.maxSizeBytes, 
            { message: `File size cannot exceed ${options.maxSizeBytes} bytes` })
        : z.number(),
      mimetype: options.allowedMimeTypes
        ? z.string().refine(
            type => options.allowedMimeTypes?.includes(type),
            { message: `File type must be one of: ${options.allowedMimeTypes?.join(', ')}` }
          )
        : z.string()
    });
  }
};

/**
 * Business rule validation patterns
 */
export const BusinessRuleValidation = {
  /**
   * Create a schema that applies complex business rules beyond simple field validation
   */
  businessRule: <T extends z.ZodTypeAny>(
    schema: T,
    rules: Array<{
      name: string;
      validate: (data: z.infer<T>) => { valid: boolean; message?: string } | boolean;
      message?: string;
    }>
  ) => schema.superRefine((data, ctx) => {
    for (const rule of rules) {
      const result = rule.validate(data);
      
      if (typeof result === 'boolean') {
        if (!result) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: rule.message || `Business rule '${rule.name}' validation failed`,
            path: []
          });
        }
      } else if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.message || rule.message || `Business rule '${rule.name}' validation failed`,
          path: []
        });
      }
    }
  })
};

/**
 * Integration validation patterns for third-party services
 */
export const IntegrationValidation = {
  /**
   * Schema for validating against external API service
   */
  externalApiValidation: <T extends z.ZodTypeAny>(
    schema: T,
    validateFn: (data: z.infer<T>) => Promise<{ valid: boolean; message?: string }>
  ) => schema.superRefine(async (data, ctx) => {
    try {
      const result = await validateFn(data);
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.message || 'External API validation failed',
          path: []
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : 'External API validation failed',
        path: []
      });
    }
  })
};

// Export all validation patterns in one object
export const AdvancedValidation = {
  ...Patterns,
  ...Primitives,
  ...SchemaBuilders,
  Contextual: ContextualValidation,
  Security: SecurityValidation,
  BusinessRule: BusinessRuleValidation,
  Integration: IntegrationValidation
};