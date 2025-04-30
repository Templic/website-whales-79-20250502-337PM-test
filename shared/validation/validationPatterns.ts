/**
 * Validation Patterns Module
 * 
 * This module provides reusable validation patterns for common use cases,
 * ensuring consistency throughout the application.
 */

import { z } from 'zod';
import { 
  ValidationContext,
  ValidationError,
  ValidationSeverity
} from './validationTypes';

/**
 * Common regex patterns
 */
export const Patterns = {
  // Email with reasonable validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone number - international format
  PHONE: /^\+?[1-9]\d{1,14}$/,
  
  // URL with protocol (http, https, ftp)
  URL: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
  
  // Date in ISO format (YYYY-MM-DD)
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  // Time in 24-hour format (HH:MM:SS)
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
  
  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Strong password (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special)
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Alpha only (letters only)
  ALPHA: /^[a-zA-Z]+$/,
  
  // Alphanumeric (letters and numbers)
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  
  // Credit card
  CREDIT_CARD: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/,
  
  // Zip/Postal code (US format)
  US_ZIP: /^\d{5}(?:-\d{4})?$/,
  
  // IP address (IPv4)
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  
  // IP address (IPv6)
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  
  // Hexadecimal color
  HEX_COLOR: /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  
  // Semantic version
  SEMVER: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
};

/**
 * Commonly used Zod schemas for primitive types
 */
export const Primitives = {
  // String schemas
  STRING: z.string(),
  NON_EMPTY_STRING: z.string().min(1, { message: 'Value cannot be empty' }),
  TRIMMED_STRING: z.string().trim().min(1, { message: 'Value cannot be empty or just whitespace' }),
  
  // Number schemas
  NUMBER: z.number(),
  POSITIVE_NUMBER: z.number().positive({ message: 'Value must be positive' }),
  NON_NEGATIVE_NUMBER: z.number().nonnegative({ message: 'Value must be zero or positive' }),
  INT: z.number().int({ message: 'Value must be an integer' }),
  POSITIVE_INT: z.number().int().positive({ message: 'Value must be a positive integer' }),
  
  // Boolean schemas
  BOOLEAN: z.boolean(),
  
  // Date schemas
  DATE: z.date(),
  FUTURE_DATE: z.date().min(new Date(), { message: 'Date must be in the future' }),
  PAST_DATE: z.date().max(new Date(), { message: 'Date must be in the past' }),
  
  // Array schemas
  ARRAY: z.array(z.any()),
  NON_EMPTY_ARRAY: z.array(z.any()).nonempty({ message: 'Array cannot be empty' }),
  
  // Object schemas
  OBJECT: z.object({}),
  
  // UUID schema
  UUID: z.string().uuid({ message: 'Value must be a valid UUID' }),
  
  // Email schema
  EMAIL: z.string().email({ message: 'Value must be a valid email address' }),
  
  // URL schema
  URL: z.string().url({ message: 'Value must be a valid URL' }),
  
  // Optional schemas
  OPTIONAL_STRING: z.string().optional(),
  OPTIONAL_NUMBER: z.number().optional(),
  OPTIONAL_BOOLEAN: z.boolean().optional(),
  OPTIONAL_DATE: z.date().optional(),
  
  // Default schemas
  DEFAULT_STRING: z.string().default(''),
  DEFAULT_NUMBER: z.number().default(0),
  DEFAULT_BOOLEAN: z.boolean().default(false),
  DEFAULT_DATE: z.date().default(() => new Date()),
  DEFAULT_ARRAY: z.array(z.any()).default([]),
  DEFAULT_OBJECT: z.object({}).default({})
};

/**
 * Zod schema builders for custom types
 */
export const SchemaBuilders = {
  // Create a schema for a limited string length
  limitedString: (
    min: number,
    max: number,
    minMessage: string = `Value must be at least ${min} characters`,
    maxMessage: string = `Value cannot exceed ${max} characters`
  ) => z.string().min(min, { message: minMessage }).max(max, { message: maxMessage }),
  
  // Create a schema for a regex pattern
  pattern: (
    pattern: RegExp,
    message: string = 'Value does not match the required pattern'
  ) => z.string().regex(pattern, { message }),
  
  // Create a schema for an enum
  enum: <T extends [string, ...string[]]>(
    values: T,
    message: string = `Value must be one of: ${values.join(', ')}`
  ) => z.enum(values, { errorMap: () => ({ message }) }),
  
  // Create a schema for numeric range
  numericRange: (
    min: number,
    max: number,
    minMessage: string = `Value must be at least ${min}`,
    maxMessage: string = `Value cannot exceed ${max}`
  ) => z.number().min(min, { message: minMessage }).max(max, { message: maxMessage }),
  
  // Create a schema for a positive integer with maximum value
  positiveIntMax: (
    max: number,
    maxMessage: string = `Value cannot exceed ${max}`
  ) => z.number().int().positive().max(max, { message: maxMessage }),
  
  // Create a schema for a date range
  dateRange: (
    min: Date,
    max: Date,
    minMessage: string = 'Date is too early',
    maxMessage: string = 'Date is too late'
  ) => z.date().min(min, { message: minMessage }).max(max, { message: maxMessage }),
  
  // Create a schema for a string with exact length
  exactLength: (
    length: number,
    message: string = `Value must be exactly ${length} characters`
  ) => z.string().length(length, { message }),
  
  // Create a schema for one of multiple types
  oneOf: <T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
    schemas: T,
    message: string = 'Value does not match any of the allowed types'
  ) => z.union(schemas, { errorMap: () => ({ message }) }),
  
  // Create a schema for a record with validated values
  record: <T extends z.ZodTypeAny>(
    valueSchema: T,
    message: string = 'Invalid value in record'
  ) => z.record(z.string(), valueSchema, { errorMap: () => ({ message }) }),
  
  // Create a schema for a limited array length
  limitedArray: <T extends z.ZodTypeAny>(
    itemSchema: T,
    min: number,
    max: number,
    minMessage: string = `Array must contain at least ${min} items`,
    maxMessage: string = `Array cannot contain more than ${max} items`
  ) => z.array(itemSchema).min(min, { message: minMessage }).max(max, { message: maxMessage }),
  
  // Create a schema with custom validation
  custom: <T extends z.ZodTypeAny>(
    baseSchema: T,
    validator: (value: z.infer<T>) => boolean,
    message: string = 'Value does not meet the required criteria'
  ) => baseSchema.refine(validator, { message })
};

/**
 * Common validation error messages
 */
export const ErrorMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_DATE: 'Please enter a valid date in YYYY-MM-DD format',
  INVALID_TIME: 'Please enter a valid time in HH:MM:SS format',
  INVALID_PASSWORD: 'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character',
  INVALID_CARD: 'Please enter a valid credit card number',
  INVALID_ZIP: 'Please enter a valid zip code',
  TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
  TOO_LONG: (max: number) => `Cannot exceed ${max} characters`,
  NOT_MATCHING: 'Values do not match',
  NOT_UNIQUE: 'This value already exists',
  INVALID_FORMAT: 'Please enter a value in the correct format',
  OUT_OF_RANGE: 'Value is outside the acceptable range',
  ALPHANUMERIC_ONLY: 'Only letters and numbers are allowed',
  LETTERS_ONLY: 'Only letters are allowed',
  NUMBERS_ONLY: 'Only numbers are allowed',
  NOT_GREATER_THAN: (field: string) => `Must be greater than ${field}`,
  NOT_LESS_THAN: (field: string) => `Must be less than ${field}`,
  FUTURE_DATE: 'Date must be in the future',
  PAST_DATE: 'Date must be in the past',
  FILE_TOO_LARGE: (size: string) => `File size cannot exceed ${size}`,
  INVALID_FILE_TYPE: (types: string) => `File must be one of these types: ${types}`,
  SERVER_ERROR: 'An error occurred while validating this field'
};

/**
 * Create a validation error with consistent format
 */
export function createValidationErrorFromPattern(
  field: string,
  errorKey: keyof typeof ErrorMessages,
  errorParams?: any[],
  severity: ValidationSeverity = ValidationSeverity.ERROR,
  context: ValidationContext = ValidationContext.CLIENT
): ValidationError {
  let message: string;
  
  // Get message by key
  const messageTemplate = ErrorMessages[errorKey];
  
  // Apply parameters if function
  if (typeof messageTemplate === 'function' && errorParams) {
    message = messageTemplate(...errorParams);
  } else {
    message = messageTemplate as string;
  }
  
  return {
    field,
    message,
    code: errorKey,
    severity,
    context,
    path: [field]
  };
}

/**
 * Create a custom validator function
 */
export function createCustomValidator<T>(
  validator: (value: T) => boolean,
  errorKey: keyof typeof ErrorMessages,
  errorParams?: any[],
  severity: ValidationSeverity = ValidationSeverity.ERROR
): (value: T) => ValidationError | null {
  return (value: T) => {
    if (!validator(value)) {
      return createValidationErrorFromPattern(
        'field', // This will be overridden when used
        errorKey,
        errorParams,
        severity
      );
    }
    return null;
  };
}