/**
 * Payment Validation Framework
 * 
 * Implements PCI DSS requirements:
 * - 6.5.1 (Injection Flaws)
 * - 6.5.3 (Insecure Inputs)
 * - 6.5.5 (Improper Error Handling)
 */

import { z } from 'zod';
import { recordAuditEvent } from '../security/secureAuditTrail';

/**
 * Common validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  data?: any;
}

/**
 * Base validator interface for payment operations
 */
export interface PaymentValidator {
  validate(data: any): ValidationResult;
  getSchema(): z.ZodType<any>;
}

/**
 * Base class for all payment validators
 */
export abstract class BasePaymentValidator implements PaymentValidator {
  protected abstract schema: z.ZodType<any>;
  protected abstract operationType: string;
  
  /**
   * Validate data against the schema
   */
  validate(data: any): ValidationResult {
    try {
      const result = this.schema.safeParse(data);
      
      if (!result.success) {
        // Format and log validation errors
        const formattedErrors = this.formatZodErrors(result.error);
        
        // Log validation failure to audit trail for PCI compliance
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'PAYMENT_VALIDATION_FAILURE',
          resource: `payment:${this.operationType}`,
          result: 'failure',
          severity: 'warning',
          details: {
            errors: formattedErrors,
            operationType: this.operationType
          }
        });
        
        return {
          valid: false,
          errors: formattedErrors
        };
      }
      
      // Additional business logic validation if needed
      const businessValidation = this.validateBusinessRules(result.data);
      if (!businessValidation.valid) {
        // Log business rule validation failure
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'PAYMENT_BUSINESS_RULE_FAILURE',
          resource: `payment:${this.operationType}`,
          result: 'failure',
          severity: 'warning',
          details: {
            errors: businessValidation.errors,
            operationType: this.operationType
          }
        });
        
        return businessValidation;
      }
      
      return {
        valid: true,
        data: result.data
      };
    } catch (error) {
      // Log unexpected validation error
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_VALIDATION_ERROR',
        resource: `payment:${this.operationType}`,
        result: 'failure',
        severity: 'error',
        details: {
          error: error.message,
          operationType: this.operationType
        }
      });
      
      return {
        valid: false,
        errors: ['An unexpected error occurred during validation.']
      };
    }
  }
  
  /**
   * Get the schema for this validator
   */
  getSchema(): z.ZodType<any> {
    return this.schema;
  }
  
  /**
   * Format Zod errors into user-friendly messages
   * that don't reveal internal system details (PCI DSS 6.5.5)
   */
  protected formatZodErrors(error: z.ZodError): string[] {
    return error.errors.map(err => {
      // Create a PCI-compliant error message that doesn't reveal system details
      const path = err.path.join('.');
      return `Invalid value for ${path || 'field'}: ${this.sanitizeErrorMessage(err.message)}`;
    });
  }
  
  /**
   * Sanitize error messages to avoid leaking sensitive information
   */
  protected sanitizeErrorMessage(message: string): string {
    // Remove any potentially sensitive information from error messages
    return message
      .replace(/\d{13,19}/g, '[REDACTED CARD NUMBER]') // Redact potential card numbers
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED CARD NUMBER]') // Redact formatted card numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED EMAIL]') // Redact emails
      .replace(/\b(?:3[47]\d|(?:4\d|5[1-5]|65)\d{2}|6011)\d{12,15}\b/g, '[REDACTED CARD NUMBER]'); // Redact card patterns
  }
  
  /**
   * Validate business rules specific to each payment operation
   * Override in subclasses to implement specific business validations
   */
  protected validateBusinessRules(data: any): ValidationResult {
    // Default implementation passes all business rules
    // Subclasses should override this method to implement specific business validations
    return { valid: true, data };
  }

  /**
   * Luhn algorithm for card number validation
   */
  protected validateCardNumberWithLuhn(cardNumber: string): boolean {
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) {
      return false;
    }
    
    // Implementation of Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    // Loop from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
  }
}

/**
 * Payment intent creation validator
 */
export class PaymentIntentValidator extends BasePaymentValidator {
  protected operationType = 'create-intent';
  
  protected schema = z.object({
    amount: z.number()
      .int()
      .positive()
      .max(999999999, { message: "Amount exceeds maximum allowed value" }),
    currency: z.string()
      .length(3)
      .default('usd'),
    metadata: z.record(z.string()).optional(),
    paymentMethod: z.string().optional(),
    description: z.string().max(255).optional(),
  });
  
  /**
   * Additional business rule validation for payment intents
   * Implements PCI DSS 6.5.1 (Injection Flaws)
   */
  protected validateBusinessRules(data: any): ValidationResult {
    // Ensure amount is reasonable
    if (data.amount > 100000000) {
      return {
        valid: false,
        errors: ['Payment amount exceeds maximum allowed value.']
      };
    }
    
    // Validate currency codes against known list
    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy'];
    if (!validCurrencies.includes(data.currency.toLowerCase())) {
      return {
        valid: false,
        errors: [`Currency '${data.currency}' is not supported.`]
      };
    }
    
    // Check metadata for potential injection attacks
    if (data.metadata) {
      for (const [key, value] of Object.entries(data.metadata)) {
        // Check for SQL injection patterns
        if (typeof value === 'string' && 
            (value.includes('--') || 
             value.includes(';') || 
             /'\s*or\s*'1'='1/i.test(value))) {
          
          return {
            valid: false,
            errors: ['Invalid characters detected in metadata.']
          };
        }
      }
    }
    
    return { valid: true, data };
  }
}

/**
 * Payment confirmation validator
 */
export class PaymentConfirmationValidator extends BasePaymentValidator {
  protected operationType = 'confirm';
  
  protected schema = z.object({
    paymentMethodId: z.string().min(3),
    orderId: z.string().min(3),
    userId: z.string().optional(),
    amount: z.number().int().positive().optional(),
    currency: z.string().length(3).optional(),
    last4: z.string().length(4).optional(),
    email: z.string().email().optional(),
  });
  
  /**
   * Additional business rule validation for payment confirmation
   */
  protected validateBusinessRules(data: any): ValidationResult {
    // Validate payment method ID format
    if (!/^[a-zA-Z0-9_\-]{3,}$/.test(data.paymentMethodId)) {
      return {
        valid: false,
        errors: ['Invalid payment method ID format.']
      };
    }
    
    // Validate order ID format
    if (!/^[a-zA-Z0-9_\-]{3,}$/.test(data.orderId)) {
      return {
        valid: false,
        errors: ['Invalid order ID format.']
      };
    }
    
    // Validate last4 if present (should be 4 digits only)
    if (data.last4 && !/^\d{4}$/.test(data.last4)) {
      return {
        valid: false,
        errors: ['Invalid card last 4 digits format.']
      };
    }
    
    return { valid: true, data };
  }
}

/**
 * Generic payment validator for fallback situations
 */
export class GenericPaymentValidator extends BasePaymentValidator {
  protected operationType = 'generic';
  
  protected schema = z.object({
    // Accept any properties, will be validated with business rules
    // This is intentionally loose to handle unknown payment types
  }).passthrough();
  
  /**
   * Stricter business rules to compensate for loose schema
   */
  protected validateBusinessRules(data: any): ValidationResult {
    // Check for required fields in any payment operation
    if (!data.userId && !data.customerId && !data.anonymousId) {
      return {
        valid: false,
        errors: ['Payment requires a user identifier.']
      };
    }
    
    // Check for suspicious patterns in all string fields
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check for SQL injection patterns
        if (value.includes('--') || 
            value.includes(';') || 
            /'\s*or\s*'1'='1/i.test(value)) {
          
          return {
            valid: false,
            errors: [`Invalid characters detected in ${key}.`]
          };
        }
        
        // Check for potential card numbers and redact them
        if (/\b(?:\d[ -]*?){13,19}\b/.test(value)) {
          return {
            valid: false,
            errors: ['Card numbers should not be sent in plain text fields.']
          };
        }
      }
    }
    
    return { valid: true, data };
  }
}