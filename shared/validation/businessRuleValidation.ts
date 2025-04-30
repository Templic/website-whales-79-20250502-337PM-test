/**
 * Business Rule Validation Module
 * 
 * This module provides a framework for implementing complex business rules
 * that go beyond simple field validation.
 */

import {
  ValidationContext,
  ValidationError,
  ValidationResult,
  ValidationSeverity,
  createValidationError,
  createValidationResult
} from './validationTypes';

/**
 * Business rule validation function type
 */
export type BusinessRuleValidator<T = any> = (
  data: T,
  context?: Record<string, any>
) => ValidationError | null;

/**
 * Business rule definition
 */
export interface BusinessRule<T = any> {
  name: string;              // Unique name for the rule
  description: string;       // Human-readable description
  validator: BusinessRuleValidator<T>; // Validation function
  errorCode: string;         // Error code for failure
  errorMessage: string;      // Default error message
  severity: ValidationSeverity; // Error severity
  dependencies?: Array<keyof T>; // Fields this rule depends on
  applyWhen?: (data: T) => boolean; // Optional condition for when to apply
  category?: string;         // Optional category for grouping
  metadata?: Record<string, any>; // Additional context
}

/**
 * Business rules validator
 */
export class BusinessRulesValidator<T extends object = any> {
  private rules: BusinessRule<T>[] = [];
  
  /**
   * Add a business rule
   */
  addRule(rule: BusinessRule<T>): this {
    this.rules.push(rule);
    return this;
  }
  
  /**
   * Add multiple business rules
   */
  addRules(rules: BusinessRule<T>[]): this {
    this.rules.push(...rules);
    return this;
  }
  
  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): BusinessRule<T>[] {
    return this.rules.filter(rule => rule.category === category);
  }
  
  /**
   * Get rule by name
   */
  getRule(name: string): BusinessRule<T> | undefined {
    return this.rules.find(rule => rule.name === name);
  }
  
  /**
   * Remove a rule by name
   */
  removeRule(name: string): this {
    this.rules = this.rules.filter(rule => rule.name !== name);
    return this;
  }
  
  /**
   * Validate data against all business rules
   */
  validate(
    data: T, 
    context?: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Apply each rule
    for (const rule of this.rules) {
      // Skip if rule has a condition and it's not met
      if (rule.applyWhen && !rule.applyWhen(data)) {
        continue;
      }
      
      // Execute the validator
      const error = rule.validator(data, context);
      
      // If validation failed, add the error
      if (error) {
        errors.push(error);
      }
    }
    
    return createValidationResult(
      errors.length === 0,
      errors,
      ValidationContext.CUSTOM,
      errors.length === 0 ? data : undefined
    );
  }
  
  /**
   * Validate data against specific rules
   */
  validateRules(
    data: T, 
    ruleNames: string[],
    context?: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Filter rules by name
    const rulesToValidate = this.rules.filter(
      rule => ruleNames.includes(rule.name)
    );
    
    // Apply each rule
    for (const rule of rulesToValidate) {
      // Skip if rule has a condition and it's not met
      if (rule.applyWhen && !rule.applyWhen(data)) {
        continue;
      }
      
      // Execute the validator
      const error = rule.validator(data, context);
      
      // If validation failed, add the error
      if (error) {
        errors.push(error);
      }
    }
    
    return createValidationResult(
      errors.length === 0,
      errors,
      ValidationContext.CUSTOM,
      errors.length === 0 ? data : undefined
    );
  }
  
  /**
   * Validate data related to specific fields
   */
  validateFields(
    data: T, 
    fieldNames: Array<keyof T>,
    context?: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Filter rules that depend on the specified fields
    const rulesToValidate = this.rules.filter(rule => {
      if (!rule.dependencies || rule.dependencies.length === 0) {
        return false;
      }
      
      // Check if any of the rule's dependencies are in the field list
      return rule.dependencies.some(dep => fieldNames.includes(dep));
    });
    
    // Apply each rule
    for (const rule of rulesToValidate) {
      // Skip if rule has a condition and it's not met
      if (rule.applyWhen && !rule.applyWhen(data)) {
        continue;
      }
      
      // Execute the validator
      const error = rule.validator(data, context);
      
      // If validation failed, add the error
      if (error) {
        errors.push(error);
      }
    }
    
    return createValidationResult(
      errors.length === 0,
      errors,
      ValidationContext.CUSTOM,
      errors.length === 0 ? data : undefined
    );
  }
  
  /**
   * Create a business rule
   */
  static createRule<T>(
    name: string,
    description: string,
    validator: BusinessRuleValidator<T>,
    errorCode: string,
    errorMessage: string,
    severity: ValidationSeverity = ValidationSeverity.ERROR,
    dependencies?: Array<keyof T>,
    applyWhen?: (data: T) => boolean,
    category?: string,
    metadata?: Record<string, any>
  ): BusinessRule<T> {
    return {
      name,
      description,
      validator,
      errorCode,
      errorMessage,
      severity,
      dependencies,
      applyWhen,
      category,
      metadata
    };
  }
  
  /**
   * Create a rule validator function
   */
  static createValidator<T>(
    field: string,
    predicate: (data: T, context?: Record<string, any>) => boolean,
    errorMessage: string,
    errorCode: string,
    severity: ValidationSeverity = ValidationSeverity.ERROR
  ): BusinessRuleValidator<T> {
    return (data: T, context?: Record<string, any>) => {
      if (!predicate(data, context)) {
        return createValidationError(
          field,
          errorMessage,
          errorCode,
          severity,
          ValidationContext.CUSTOM
        );
      }
      return null;
    };
  }
  
  /**
   * Create a comparison rule validator
   */
  static createComparisonValidator<T>(
    field1: keyof T,
    field2: keyof T, 
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte',
    errorMessage: string,
    errorCode: string,
    severity: ValidationSeverity = ValidationSeverity.ERROR
  ): BusinessRuleValidator<T> {
    return (data: T) => {
      const value1 = data[field1];
      const value2 = data[field2];
      
      let isValid = true;
      
      switch (operator) {
        case 'eq':
          isValid = value1 === value2;
          break;
        case 'ne':
          isValid = value1 !== value2;
          break;
        case 'gt':
          isValid = value1 > value2;
          break;
        case 'lt':
          isValid = value1 < value2;
          break;
        case 'gte':
          isValid = value1 >= value2;
          break;
        case 'lte':
          isValid = value1 <= value2;
          break;
      }
      
      if (!isValid) {
        return createValidationError(
          String(field1),
          errorMessage,
          errorCode,
          severity,
          ValidationContext.CUSTOM,
          value1,
          [String(field1), String(field2)]
        );
      }
      
      return null;
    };
  }
  
  /**
   * Create a conditional validator
   */
  static createConditionalValidator<T>(
    condition: (data: T) => boolean,
    thenValidator: BusinessRuleValidator<T>,
    elseValidator?: BusinessRuleValidator<T>
  ): BusinessRuleValidator<T> {
    return (data: T, context?: Record<string, any>) => {
      if (condition(data)) {
        return thenValidator(data, context);
      } else if (elseValidator) {
        return elseValidator(data, context);
      }
      return null;
    };
  }
}

/**
 * Create common business rule validators
 */
export function createDateRangeValidator<T>(
  startDateField: keyof T,
  endDateField: keyof T,
  errorMessage: string = 'End date must be after start date',
  errorCode: string = 'DATE_RANGE_INVALID'
): BusinessRuleValidator<T> {
  return (data: T) => {
    const startDate = data[startDateField] as unknown as Date;
    const endDate = data[endDateField] as unknown as Date;
    
    if (startDate && endDate && startDate > endDate) {
      return createValidationError(
        String(endDateField),
        errorMessage,
        errorCode,
        ValidationSeverity.ERROR,
        ValidationContext.CUSTOM,
        endDate,
        [String(startDateField), String(endDateField)]
      );
    }
    
    return null;
  };
}

/**
 * Create a required fields validator when condition is met
 */
export function createConditionalRequiredValidator<T>(
  conditionField: keyof T,
  conditionValue: any,
  requiredFields: Array<keyof T>,
  errorMessage: string = 'This field is required',
  errorCode: string = 'CONDITIONAL_REQUIRED'
): BusinessRuleValidator<T> {
  return (data: T) => {
    // If condition is met, check required fields
    if (data[conditionField] === conditionValue) {
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          return createValidationError(
            String(field),
            errorMessage,
            errorCode,
            ValidationSeverity.ERROR,
            ValidationContext.CUSTOM,
            data[field],
            [String(field)]
          );
        }
      }
    }
    
    return null;
  };
}

/**
 * Create a mutual dependency validator
 */
export function createMutualDependencyValidator<T>(
  fields: Array<keyof T>,
  errorMessage: string = 'These fields must be provided together',
  errorCode: string = 'MUTUAL_DEPENDENCY'
): BusinessRuleValidator<T> {
  return (data: T) => {
    const providedFields = fields.filter(field => 
      data[field] !== undefined && 
      data[field] !== null && 
      data[field] !== ''
    );
    
    // If any fields are provided, all must be provided
    if (providedFields.length > 0 && providedFields.length !== fields.length) {
      const missingField = fields.find(field => 
        !providedFields.includes(field)
      );
      
      if (missingField) {
        return createValidationError(
          String(missingField),
          errorMessage,
          errorCode,
          ValidationSeverity.ERROR,
          ValidationContext.CUSTOM,
          undefined,
          fields.map(field => String(field))
        );
      }
    }
    
    return null;
  };
}

/**
 * Create a mutually exclusive validator
 */
export function createMutuallyExclusiveValidator<T>(
  fields: Array<keyof T>,
  errorMessage: string = 'Only one of these fields can be provided',
  errorCode: string = 'MUTUALLY_EXCLUSIVE'
): BusinessRuleValidator<T> {
  return (data: T) => {
    const providedFields = fields.filter(field => 
      data[field] !== undefined && 
      data[field] !== null && 
      data[field] !== ''
    );
    
    if (providedFields.length > 1) {
      return createValidationError(
        String(providedFields[0]),
        errorMessage,
        errorCode,
        ValidationSeverity.ERROR,
        ValidationContext.CUSTOM,
        data[providedFields[0]],
        providedFields.map(field => String(field))
      );
    }
    
    return null;
  };
}

/**
 * Create a numerical range validator
 */
export function createNumericRangeValidator<T>(
  minField: keyof T,
  maxField: keyof T,
  errorMessage: string = 'Maximum value must be greater than minimum value',
  errorCode: string = 'NUMERIC_RANGE_INVALID'
): BusinessRuleValidator<T> {
  return (data: T) => {
    const minValue = data[minField] as unknown as number;
    const maxValue = data[maxField] as unknown as number;
    
    if (minValue !== undefined && 
        maxValue !== undefined && 
        minValue > maxValue) {
      return createValidationError(
        String(maxField),
        errorMessage,
        errorCode,
        ValidationSeverity.ERROR,
        ValidationContext.CUSTOM,
        maxValue,
        [String(minField), String(maxField)]
      );
    }
    
    return null;
  };
}

/**
 * Create a field dependency validator
 */
export function createFieldDependencyValidator<T>(
  dependentField: keyof T,
  dependsOnField: keyof T,
  errorMessage: string = 'This field depends on another field',
  errorCode: string = 'FIELD_DEPENDENCY'
): BusinessRuleValidator<T> {
  return (data: T) => {
    const dependentValue = data[dependentField];
    const dependsOnValue = data[dependsOnField];
    
    if (dependentValue !== undefined && 
        dependentValue !== null && 
        dependentValue !== '' &&
        (dependsOnValue === undefined || 
         dependsOnValue === null || 
         dependsOnValue === '')) {
      return createValidationError(
        String(dependentField),
        errorMessage,
        errorCode,
        ValidationSeverity.ERROR,
        ValidationContext.CUSTOM,
        dependentValue,
        [String(dependentField), String(dependsOnField)]
      );
    }
    
    return null;
  };
}

/**
 * Create a custom assertion validator
 */
export function createAssertionValidator<T>(
  assertion: (data: T) => boolean,
  errorField: keyof T | string,
  errorMessage: string,
  errorCode: string,
  severity: ValidationSeverity = ValidationSeverity.ERROR
): BusinessRuleValidator<T> {
  return (data: T) => {
    if (!assertion(data)) {
      return createValidationError(
        String(errorField),
        errorMessage,
        errorCode,
        severity,
        ValidationContext.CUSTOM,
        data[errorField as keyof T]
      );
    }
    
    return null;
  };
}