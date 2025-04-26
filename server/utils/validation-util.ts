/**
 * TypeScript Validation Utility
 * 
 * This utility provides functions for validating data against TypeScript types.
 * It uses runtime type checking to ensure data conforms to expected shapes.
 */

import { ValidationError } from '../types/core/error-types';
import { handleValidationError } from './error-handler';

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  value?: T;
  errors?: Record<string, string>;
}

/**
 * Validator options
 */
export interface ValidatorOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  messages?: Record<string, string>;
  context?: Record<string, unknown>;
}

/**
 * Type validator function
 */
export type TypeValidator<T> = (value: unknown, options?: ValidatorOptions) => ValidationResult<T>;

/**
 * Validates that a value is a string
 */
export function validateString(
  value: unknown, 
  options?: ValidatorOptions & {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    format?: 'email' | 'url' | 'uuid' | 'date';
    allowEmpty?: boolean;
  }
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be a string' 
      } 
    };
  }

  if (!options?.allowEmpty && value.trim() === '') {
    return { 
      isValid: false, 
      errors: { 
        _empty: options?.messages?._empty || 'Value cannot be empty' 
      } 
    };
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    return { 
      isValid: false, 
      errors: { 
        minLength: options?.messages?.minLength || 
          `Value must be at least ${options.minLength} characters` 
      } 
    };
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    return { 
      isValid: false, 
      errors: { 
        maxLength: options?.messages?.maxLength || 
          `Value cannot exceed ${options.maxLength} characters` 
      } 
    };
  }

  if (options?.pattern && !options.pattern.test(value)) {
    return { 
      isValid: false, 
      errors: { 
        pattern: options?.messages?.pattern || 
          'Value does not match required pattern' 
      } 
    };
  }

  if (options?.format) {
    switch (options.format) {
      case 'email': {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          return { 
            isValid: false, 
            errors: { 
              format: options?.messages?.format || 'Invalid email format' 
            } 
          };
        }
        break;
      }
      case 'url': {
        try {
          new URL(value);
        } catch {
          return { 
            isValid: false, 
            errors: { 
              format: options?.messages?.format || 'Invalid URL format' 
            } 
          };
        }
        break;
      }
      case 'uuid': {
        const uuidRegex = 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          return { 
            isValid: false, 
            errors: { 
              format: options?.messages?.format || 'Invalid UUID format' 
            } 
          };
        }
        break;
      }
      case 'date': {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { 
            isValid: false, 
            errors: { 
              format: options?.messages?.format || 'Invalid date format' 
            } 
          };
        }
        break;
      }
    }
  }

  return { isValid: true, value };
}

/**
 * Validates that a value is a number
 */
export function validateNumber(
  value: unknown, 
  options?: ValidatorOptions & {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    negative?: boolean;
  }
): ValidationResult<number> {
  // Handle string conversion
  let numValue: number;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return { 
        isValid: false, 
        errors: { 
          _type: options?.messages?._type || 'Value must be a valid number' 
        } 
      };
    }
    numValue = parsed;
  } else if (typeof value !== 'number' || isNaN(value)) {
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be a number' 
      } 
    };
  } else {
    numValue = value;
  }

  if (options?.integer && !Number.isInteger(numValue)) {
    return { 
      isValid: false, 
      errors: { 
        integer: options?.messages?.integer || 'Value must be an integer' 
      } 
    };
  }

  if (options?.min !== undefined && numValue < options.min) {
    return { 
      isValid: false, 
      errors: { 
        min: options?.messages?.min || `Value must be at least ${options.min}` 
      } 
    };
  }

  if (options?.max !== undefined && numValue > options.max) {
    return { 
      isValid: false, 
      errors: { 
        max: options?.messages?.max || `Value cannot exceed ${options.max}` 
      } 
    };
  }

  if (options?.positive && numValue <= 0) {
    return { 
      isValid: false, 
      errors: { 
        positive: options?.messages?.positive || 'Value must be positive' 
      } 
    };
  }

  if (options?.negative && numValue >= 0) {
    return { 
      isValid: false, 
      errors: { 
        negative: options?.messages?.negative || 'Value must be negative' 
      } 
    };
  }

  return { isValid: true, value: numValue };
}

/**
 * Validates that a value is a boolean
 */
export function validateBoolean(
  value: unknown, 
  options?: ValidatorOptions
): ValidationResult<boolean> {
  // Handle string conversion
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return { isValid: true, value: true };
    if (lowerValue === 'false') return { isValid: true, value: false };
    
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be a boolean' 
      } 
    };
  }
  
  if (typeof value !== 'boolean') {
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be a boolean' 
      } 
    };
  }

  return { isValid: true, value };
}

/**
 * Validates that a value is an array
 */
export function validateArray<T>(
  value: unknown, 
  itemValidator?: TypeValidator<T>,
  options?: ValidatorOptions & {
    minLength?: number;
    maxLength?: number;
    unique?: boolean;
  }
): ValidationResult<T[]> {
  if (!Array.isArray(value)) {
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be an array' 
      } 
    };
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    return { 
      isValid: false, 
      errors: { 
        minLength: options?.messages?.minLength || 
          `Array must contain at least ${options.minLength} items` 
      } 
    };
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    return { 
      isValid: false, 
      errors: { 
        maxLength: options?.messages?.maxLength || 
          `Array cannot exceed ${options.maxLength} items` 
      } 
    };
  }

  if (options?.unique) {
    const uniqueItems = new Set(value);
    if (uniqueItems.size !== value.length) {
      return { 
        isValid: false, 
        errors: { 
          unique: options?.messages?.unique || 'Array items must be unique' 
        } 
      };
    }
  }

  if (itemValidator) {
    const errors: Record<string, string> = {};
    const validItems: T[] = [];
    let isValid = true;

    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const itemResult = itemValidator(item, options);
      
      if (!itemResult.isValid) {
        isValid = false;
        if (itemResult.errors) {
          for (const [errorKey, errorMessage] of Object.entries(itemResult.errors)) {
            errors[`${i}.${errorKey}`] = errorMessage;
          }
        }
        
        if (options?.abortEarly) {
          return { isValid: false, errors };
        }
      } else if (itemResult.value !== undefined) {
        validItems.push(itemResult.value as T);
      }
    }

    if (!isValid) {
      return { isValid: false, errors };
    }
    
    return { isValid: true, value: validItems };
  }

  return { isValid: true, value: value as T[] };
}

/**
 * Validates that a value is an object
 */
export function validateObject<T extends Record<string, any>>(
  value: unknown,
  shape?: {
    [K in keyof T]?: TypeValidator<T[K]>;
  },
  options?: ValidatorOptions & {
    requiredKeys?: Array<keyof T>;
    allowUnknown?: boolean;
  }
): ValidationResult<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be an object' 
      } 
    };
  }

  if (!shape) {
    return { isValid: true, value: value as T };
  }

  const errors: Record<string, string> = {};
  const validatedObject: Record<string, unknown> = {};
  let isValid = true;

  // Check if required keys are present
  if (options?.requiredKeys) {
    for (const key of options.requiredKeys) {
      if (!(key in value)) {
        isValid = false;
        errors[`${String(key)}.required`] = 
          options?.messages?.[`${String(key)}.required`] || 
          `Property '${String(key)}' is required`;
        
        if (options?.abortEarly) {
          return { isValid: false, errors };
        }
      }
    }
  }

  // Validate each property in the shape
  for (const [key, validator] of Object.entries(shape)) {
    if (validator) {
      if (key in value) {
        const propertyValue = (value as Record<string, any>)[key];
        const propertyResult = validator(propertyValue, options);
        
        if (!propertyResult.isValid) {
          isValid = false;
          if (propertyResult.errors) {
            for (const [errorKey, errorMessage] of Object.entries(propertyResult.errors)) {
              errors[`${key}.${errorKey}`] = errorMessage;
            }
          }
          
          if (options?.abortEarly) {
            return { isValid: false, errors };
          }
        } else if (propertyResult.value !== undefined) {
          validatedObject[key] = propertyResult.value;
        }
      }
    }
  }

  // Check for unknown keys
  if (!options?.allowUnknown && value !== null) {
    for (const key of Object.keys(value)) {
      if (!(key in shape)) {
        if (options?.stripUnknown) {
          continue;
        }
        
        isValid = false;
        errors[`${key}.unknown`] = 
          options?.messages?.[`${key}.unknown`] || 
          `Property '${key}' is not allowed`;
        
        if (options?.abortEarly) {
          return { isValid: false, errors };
        }
      }
    }
  }

  if (!isValid) {
    return { isValid: false, errors };
  }

  return { 
    isValid: true, 
    value: { ...value, ...validatedObject } as T 
  };
}

/**
 * Validates that a value matches at least one of the provided validators
 */
export function validateUnion<T extends any[]>(
  value: unknown,
  validators: { [K in keyof T]: TypeValidator<T[K]> },
  options?: ValidatorOptions
): ValidationResult<T[number]> {
  for (const validator of validators) {
    const result = validator(value, options);
    if (result.isValid) {
      return result as ValidationResult<T[number]>;
    }
  }

  return { 
    isValid: false, 
    errors: { 
      _type: options?.messages?._type || 'Value does not match any of the allowed types' 
    } 
  };
}

/**
 * Validates that a value is a date
 */
export function validateDate(
  value: unknown,
  options?: ValidatorOptions & {
    min?: Date;
    max?: Date;
    format?: string;
  }
): ValidationResult<Date> {
  let dateValue: Date;

  if (value instanceof Date) {
    dateValue = value;
  } else if (typeof value === 'string') {
    dateValue = new Date(value);
  } else if (typeof value === 'number') {
    dateValue = new Date(value);
  } else {
    return { 
      isValid: false, 
      errors: { 
        _type: options?.messages?._type || 'Value must be a valid date' 
      } 
    };
  }

  if (isNaN(dateValue.getTime())) {
    return { 
      isValid: false, 
      errors: { 
        _invalid: options?.messages?._invalid || 'Invalid date format' 
      } 
    };
  }

  if (options?.min && dateValue < options.min) {
    return { 
      isValid: false, 
      errors: { 
        min: options?.messages?.min || 
          `Date must be after ${options.min.toISOString()}` 
      } 
    };
  }

  if (options?.max && dateValue > options.max) {
    return { 
      isValid: false, 
      errors: { 
        max: options?.messages?.max || 
          `Date must be before ${options.max.toISOString()}` 
      } 
    };
  }

  return { isValid: true, value: dateValue };
}

/**
 * Generic validate function that accepts a schema
 */
export function validate<T>(
  value: unknown,
  schema: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'union';
    [key: string]: any;
  },
  options?: ValidatorOptions
): ValidationResult<T> {
  switch (schema.type) {
    case 'string':
      return validateString(value, {
        ...options,
        minLength: schema.minLength,
        maxLength: schema.maxLength,
        pattern: schema.pattern,
        format: schema.format,
        allowEmpty: schema.allowEmpty
      }) as ValidationResult<T>;
      
    case 'number':
      return validateNumber(value, {
        ...options,
        min: schema.min,
        max: schema.max,
        integer: schema.integer,
        positive: schema.positive,
        negative: schema.negative
      }) as ValidationResult<T>;
      
    case 'boolean':
      return validateBoolean(value, options) as ValidationResult<T>;
      
    case 'array':
      return validateArray(
        value,
        schema.items ? (v: unknown) => validate(v, schema.items, options) : undefined,
        {
          ...options,
          minLength: schema.minLength,
          maxLength: schema.maxLength,
          unique: schema.unique
        }
      ) as ValidationResult<T>;
      
    case 'object':
      const shapeValidators: Record<string, TypeValidator<any>> = {};
      
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          shapeValidators[key] = (v: unknown) => validate(v, propSchema, options);
        }
      }
      
      return validateObject(
        value,
        shapeValidators,
        {
          ...options,
          requiredKeys: schema.required,
          allowUnknown: schema.allowUnknown
        }
      ) as ValidationResult<T>;
      
    case 'date':
      return validateDate(value, {
        ...options,
        min: schema.min,
        max: schema.max,
        format: schema.format
      }) as ValidationResult<T>;
      
    case 'union':
      if (!schema.oneOf || !Array.isArray(schema.oneOf)) {
        throw new Error('Union schema must specify oneOf array');
      }
      
      const validators: TypeValidator<any>[] = 
        schema.oneOf.map((s: any) => (v: unknown) => validate(v, s, options));
      
      return validateUnion(value, validators, options) as ValidationResult<T>;
      
    default:
      throw new Error(`Unsupported schema type: ${schema.type}`);
  }
}

/**
 * Validate a value and throw a ValidationError if invalid
 */
export function validateOrThrow<T>(
  value: unknown,
  schema: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'union';
    [key: string]: any;
  },
  options?: ValidatorOptions & {
    errorMessage?: string;
  }
): T {
  const result = validate<T>(value, schema, options);
  
  if (!result.isValid) {
    throw handleValidationError(
      new Error(options?.errorMessage || 'Validation failed'),
      result.errors
    );
  }
  
  return result.value as T;
}

export default {
  validateString,
  validateNumber,
  validateBoolean,
  validateArray,
  validateObject,
  validateUnion,
  validateDate,
  validate,
  validateOrThrow
};