/**
 * Payment Validation Service
 * 
 * Implements PCI DSS requirements:
 * - 6.5.1 (Injection Flaws)
 * - 6.5.3 (Insecure Inputs)
 * - 6.5.5 (Improper Error Handling)
 */

import { PaymentValidator, PaymentIntentValidator, PaymentConfirmationValidator, GenericPaymentValidator, ValidationResult } from './PaymentValidator';
import { recordAuditEvent } from '../security/secureAuditTrail';

/**
 * Payment validation service for centralized validation of all payment operations
 */
export class PaymentValidationService {
  private validators: Map<string, PaymentValidator> = new Map();
  
  constructor() {
    // Register default validators
    this.registerValidator('/payment/create-intent', new PaymentIntentValidator());
    this.registerValidator('/payment/confirm', new PaymentConfirmationValidator());
    
    // Additional validators can be registered during service initialization
  }
  
  /**
   * Register a validator for a specific endpoint
   */
  registerValidator(endpoint: string, validator: PaymentValidator): void {
    this.validators.set(endpoint, validator);
    
    // Log validator registration for audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_VALIDATOR_REGISTERED',
      resource: `validator:${endpoint}`,
      result: 'success',
      severity: 'info',
      details: {
        endpoint,
        validatorType: validator.constructor.name
      }
    });
  }
  
  /**
   * Validate a payment request for a specific endpoint
   */
  validatePaymentRequest(endpoint: string, data: any): ValidationResult {
    try {
      // Get the appropriate validator for this endpoint
      const validator = this.getValidator(endpoint);
      
      // Validate the data
      const result = validator.validate(data);
      
      // Log validation result for audit trail if it was successful
      if (result.valid) {
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'PAYMENT_VALIDATION_SUCCESS',
          resource: `payment:${endpoint}`,
          result: 'success',
          severity: 'info',
          details: {
            endpoint
          }
        });
      }
      
      return result;
    } catch (error) {
      // Log unexpected validation error
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_VALIDATION_SERVICE_ERROR',
        resource: `payment:${endpoint}`,
        result: 'failure',
        severity: 'error',
        details: {
          endpoint,
          error: error.message
        }
      });
      
      // Return a generic error that doesn't expose internal details
      return {
        valid: false,
        errors: ['An unexpected error occurred during validation. Please try again later.']
      };
    }
  }
  
  /**
   * Validate and sanitize response data
   */
  validateResponse(endpoint: string, data: any): ValidationResult {
    try {
      // For security: ensure no sensitive data is leaked in responses
      const sanitizedData = this.sanitizeResponseData(data);
      
      return {
        valid: true,
        data: sanitizedData
      };
    } catch (error) {
      // Log response validation error
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_RESPONSE_VALIDATION_ERROR',
        resource: `payment:${endpoint}`,
        result: 'failure',
        severity: 'error',
        details: {
          endpoint,
          error: error.message
        }
      });
      
      // Return the original data as fallback, but log the error
      return {
        valid: true,
        data,
        errors: ['Response validation encountered an error but continued.']
      };
    }
  }
  
  /**
   * Get the appropriate validator for an endpoint
   */
  private getValidator(endpoint: string): PaymentValidator {
    // Look for an exact match first
    if (this.validators.has(endpoint)) {
      return this.validators.get(endpoint);
    }
    
    // Try to find a match with a wildcard
    for (const [pattern, validator] of this.validators.entries()) {
      if (endpoint.includes(pattern)) {
        return validator;
      }
    }
    
    // Log the use of a generic validator (potential security concern)
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'GENERIC_VALIDATOR_USED',
      resource: `payment:${endpoint}`,
      result: 'warning',
      severity: 'warning',
      details: {
        endpoint,
        message: 'No specific validator found for endpoint, using generic validator'
      }
    });
    
    // Return a generic validator as fallback
    return new GenericPaymentValidator();
  }
  
  /**
   * Sanitize response data to ensure no sensitive information is leaked
   */
  private sanitizeResponseData(data: any): any {
    if (!data) return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }
    
    // Handle objects
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(data)) {
        // List of fields that might contain sensitive data
        const sensitiveFields = [
          'cardNumber', 'card_number', 'pan', 'cvv', 'cvc', 'securityCode', 'security_code',
          'password', 'secret', 'token', 'key', 'ssn', 'taxId', 'tax_id'
        ];
        
        // Check if this is a sensitive field
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        } else if (key === 'card') {
          // Special handling for 'card' objects with potential PCI data
          sanitized[key] = this.sanitizeCardData(value);
        } else {
          // For all other fields, recursively process them
          sanitized[key] = this.sanitizeResponseData(value);
        }
      }
      
      return sanitized;
    }
    
    // For all other types (number, boolean, etc.), return as is
    return data;
  }
  
  /**
   * Sanitize card data to ensure PCI compliance
   */
  private sanitizeCardData(cardData: any): any {
    if (!cardData || typeof cardData !== 'object') return cardData;
    
    const sanitized = { ...cardData };
    
    // Redact sensitive card fields
    if (sanitized.number) sanitized.number = `****-****-****-${sanitized.number.slice(-4)}`;
    if (sanitized.cvc) sanitized.cvc = '***';
    if (sanitized.cvv) sanitized.cvv = '***';
    if (sanitized.securityCode) sanitized.securityCode = '***';
    
    // Preserve non-sensitive fields
    return sanitized;
  }
}

// Create and export singleton instance
const paymentValidationService = new PaymentValidationService();
export default paymentValidationService;