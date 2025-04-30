/**
 * Validation Framework Usage Examples
 * 
 * This file demonstrates how to use the validation framework in a real application.
 */

import { z } from 'zod';
import { 
  ValidationContext, 
  ValidationSeverity
} from '../shared/validation/validationTypes';
import { 
  BusinessRulesValidator, 
  createDateRangeValidator,
  createConditionalRequiredValidator,
  createMutualDependencyValidator
} from '../shared/validation/businessRuleValidation';
import { 
  IntegratedValidator
} from '../shared/validation/validationIntegration';
import {
  Patterns,
  Primitives,
  SchemaBuilders,
  ErrorMessages
} from '../shared/validation/validationPatterns';

// ========================
// EXAMPLE 1: User Schema
// ========================

// Define a user schema with Zod
const userSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: SchemaBuilders.pattern(
    Patterns.STRONG_PASSWORD,
    'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
  confirmPassword: z.string(),
  role: z.enum(['user', 'admin', 'editor']),
  age: z.number().int().positive().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Define the user type from the schema
type User = z.infer<typeof userSchema>;

// Create business rules for user validation
const userBusinessRules = new BusinessRulesValidator<User>()
  .addRule({
    name: 'adult_role_check',
    description: 'Administrators must be at least 18 years old',
    validator: (data) => {
      if (data.role === 'admin' && data.age !== undefined && data.age < 18) {
        return {
          field: 'age',
          message: 'Administrators must be at least 18 years old',
          code: 'MINIMUM_AGE_REQUIREMENT',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['age']
        };
      }
      return null;
    },
    errorCode: 'MINIMUM_AGE_REQUIREMENT',
    errorMessage: 'Administrators must be at least 18 years old',
    severity: ValidationSeverity.ERROR,
    dependencies: ['age', 'role'],
    applyWhen: (data) => data.role === 'admin'
  });

// Create integrated validator
const userValidator = new IntegratedValidator<User>(userSchema, userBusinessRules);

// Example: Client-side validation
async function validateUserOnClient(userData: any) {
  try {
    const result = await userValidator.validate(userData, {
      contexts: [ValidationContext.CLIENT]
    });
    
    if (result.valid) {
      console.log('User data is valid!', result.validatedData);
      return result.validatedData;
    } else {
      console.error('Validation errors:', result.errors);
      return null;
    }
  } catch (error) {
    console.error('Unexpected validation error:', error);
    return null;
  }
}

// Example: API validation
async function validateUserOnApi(userData: any) {
  try {
    const result = await userValidator.validate(userData, {
      contexts: [ValidationContext.CLIENT, ValidationContext.CUSTOM]
    });
    
    if (result.valid) {
      console.log('User data is valid for API!', result.validatedData);
      return result.validatedData;
    } else {
      console.error('API validation errors:', result.errors);
      return null;
    }
  } catch (error) {
    console.error('Unexpected API validation error:', error);
    return null;
  }
}

// ========================
// EXAMPLE 2: Order Schema
// ========================

// Define an order schema with Zod
const orderSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive()
  })).min(1, 'Order must have at least one item'),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: SchemaBuilders.pattern(Patterns.US_ZIP, 'Invalid zip code format'),
    country: z.string().min(1)
  }),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: SchemaBuilders.pattern(Patterns.US_ZIP, 'Invalid zip code format'),
    country: z.string().min(1)
  }).optional(),
  useShippingAsBilling: z.boolean().default(false),
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
  creditCardInfo: z.object({
    cardNumber: SchemaBuilders.pattern(Patterns.CREDIT_CARD, 'Invalid credit card number'),
    expiryMonth: SchemaBuilders.numericRange(1, 12, 'Invalid month', 'Invalid month'),
    expiryYear: z.number().int().min(new Date().getFullYear(), 'Card has expired'),
    cvv: SchemaBuilders.limitedString(3, 4, 'CVV must have 3-4 digits', 'CVV must have 3-4 digits')
  }).optional(),
  orderDate: z.date().default(() => new Date()),
  specialInstructions: z.string().optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending')
});

// Define the order type from the schema
type Order = z.infer<typeof orderSchema>;

// Create business rules for order validation
const orderBusinessRules = new BusinessRulesValidator<Order>()
  // Rule 1: Credit card info is required when payment method is credit_card
  .addRule({
    name: 'credit_card_required',
    description: 'Credit card information is required when paying by credit card',
    validator: createConditionalRequiredValidator(
      'paymentMethod',
      'credit_card',
      ['creditCardInfo'] as Array<keyof Order>,
      'Credit card information is required',
      'CREDIT_CARD_INFO_REQUIRED'
    ),
    errorCode: 'CREDIT_CARD_INFO_REQUIRED',
    errorMessage: 'Credit card information is required',
    severity: ValidationSeverity.ERROR,
    dependencies: ['paymentMethod', 'creditCardInfo'],
    applyWhen: (data) => data.paymentMethod === 'credit_card'
  })
  // Rule 2: If useShippingAsBilling is true, billingAddress should be undefined
  .addRule({
    name: 'billing_address_consistency',
    description: 'Billing address should not be provided when using shipping address as billing',
    validator: (data) => {
      if (data.useShippingAsBilling && data.billingAddress) {
        return {
          field: 'billingAddress',
          message: 'Billing address should not be provided when using shipping address as billing',
          code: 'INCONSISTENT_BILLING_ADDRESS',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['billingAddress']
        };
      }
      return null;
    },
    errorCode: 'INCONSISTENT_BILLING_ADDRESS',
    errorMessage: 'Billing address should not be provided when using shipping address as billing',
    severity: ValidationSeverity.ERROR,
    dependencies: ['useShippingAsBilling', 'billingAddress'],
    applyWhen: (data) => data.useShippingAsBilling === true
  })
  // Rule 3: If useShippingAsBilling is false, billingAddress is required
  .addRule({
    name: 'require_billing_address',
    description: 'Billing address is required when not using shipping address as billing',
    validator: (data) => {
      if (data.useShippingAsBilling === false && !data.billingAddress) {
        return {
          field: 'billingAddress',
          message: 'Billing address is required',
          code: 'BILLING_ADDRESS_REQUIRED',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['billingAddress']
        };
      }
      return null;
    },
    errorCode: 'BILLING_ADDRESS_REQUIRED',
    errorMessage: 'Billing address is required',
    severity: ValidationSeverity.ERROR,
    dependencies: ['useShippingAsBilling', 'billingAddress'],
    applyWhen: (data) => data.useShippingAsBilling === false
  });

// Create integrated validator
const orderValidator = new IntegratedValidator<Order>(orderSchema, orderBusinessRules);

// Example: Validate complete order
async function validateOrder(orderData: any) {
  try {
    const result = await orderValidator.validate(orderData);
    
    if (result.valid) {
      console.log('Order is valid!', result.validatedData);
      return result.validatedData;
    } else {
      console.error('Order validation errors:', result.errors);
      return null;
    }
  } catch (error) {
    console.error('Unexpected order validation error:', error);
    return null;
  }
}

// Example: Validate specific fields on change
async function validateOrderFields(orderData: any, changedFields: Array<keyof Order>) {
  try {
    const result = await orderValidator.validate(orderData, {
      fields: changedFields as string[]
    });
    
    if (result.valid) {
      console.log('Changed fields are valid!');
      return true;
    } else {
      console.error('Field validation errors:', result.errors);
      return false;
    }
  } catch (error) {
    console.error('Unexpected field validation error:', error);
    return false;
  }
}

// ========================
// EXAMPLE 3: Event Schema
// ========================

// Define an event schema with Zod
const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.date(),
  endDate: z.date(),
  location: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: SchemaBuilders.pattern(Patterns.US_ZIP, 'Invalid zip code format'),
    country: z.string().min(1)
  }),
  isVirtual: z.boolean().default(false),
  virtualMeetingUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  registrationRequired: z.boolean().default(false),
  registrationDeadline: z.date().optional(),
  organizerId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'cancelled']).default('draft')
});

// Define the event type from the schema
type Event = z.infer<typeof eventSchema>;

// Create business rules for event validation
const eventBusinessRules = new BusinessRulesValidator<Event>()
  // Rule 1: End date must be after start date
  .addRule({
    name: 'end_date_after_start',
    description: 'End date must be after start date',
    validator: createDateRangeValidator(
      'startDate',
      'endDate',
      'End date must be after start date',
      'END_DATE_BEFORE_START'
    ),
    errorCode: 'END_DATE_BEFORE_START',
    errorMessage: 'End date must be after start date',
    severity: ValidationSeverity.ERROR,
    dependencies: ['startDate', 'endDate']
  })
  // Rule 2: Virtual meeting URL is required for virtual events
  .addRule({
    name: 'virtual_meeting_url_required',
    description: 'Virtual meeting URL is required for virtual events',
    validator: createConditionalRequiredValidator(
      'isVirtual',
      true,
      ['virtualMeetingUrl'] as Array<keyof Event>,
      'Virtual meeting URL is required for virtual events',
      'VIRTUAL_URL_REQUIRED'
    ),
    errorCode: 'VIRTUAL_URL_REQUIRED',
    errorMessage: 'Virtual meeting URL is required for virtual events',
    severity: ValidationSeverity.ERROR,
    dependencies: ['isVirtual', 'virtualMeetingUrl'],
    applyWhen: (data) => data.isVirtual === true
  })
  // Rule 3: Registration deadline must be before start date
  .addRule({
    name: 'registration_deadline_before_start',
    description: 'Registration deadline must be before event start date',
    validator: (data) => {
      if (data.registrationRequired && 
          data.registrationDeadline && 
          data.startDate && 
          data.registrationDeadline > data.startDate) {
        return {
          field: 'registrationDeadline',
          message: 'Registration deadline must be before event start date',
          code: 'REGISTRATION_DEADLINE_AFTER_START',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM,
          path: ['registrationDeadline']
        };
      }
      return null;
    },
    errorCode: 'REGISTRATION_DEADLINE_AFTER_START',
    errorMessage: 'Registration deadline must be before event start date',
    severity: ValidationSeverity.ERROR,
    dependencies: ['registrationRequired', 'registrationDeadline', 'startDate'],
    applyWhen: (data) => data.registrationRequired === true
  })
  // Rule 4: Registration deadline is required if registration is required
  .addRule({
    name: 'registration_deadline_required',
    description: 'Registration deadline is required when registration is required',
    validator: createConditionalRequiredValidator(
      'registrationRequired',
      true,
      ['registrationDeadline'] as Array<keyof Event>,
      'Registration deadline is required',
      'REGISTRATION_DEADLINE_REQUIRED'
    ),
    errorCode: 'REGISTRATION_DEADLINE_REQUIRED',
    errorMessage: 'Registration deadline is required',
    severity: ValidationSeverity.ERROR,
    dependencies: ['registrationRequired', 'registrationDeadline'],
    applyWhen: (data) => data.registrationRequired === true
  });

// Create integrated validator
const eventValidator = new IntegratedValidator<Event>(eventSchema, eventBusinessRules);

// Example: Validate event on database insertion
async function validateEventForDatabase(eventData: any) {
  try {
    const result = await eventValidator.validate(eventData, {
      contexts: [ValidationContext.CLIENT, ValidationContext.CUSTOM, ValidationContext.DATABASE]
    });
    
    if (result.valid) {
      console.log('Event is valid for database insertion!', result.validatedData);
      return result.validatedData;
    } else {
      console.error('Event database validation errors:', result.errors);
      return null;
    }
  } catch (error) {
    console.error('Unexpected event validation error:', error);
    return null;
  }
}

// ========================
// Export examples
// ========================

export {
  // Schemas
  userSchema,
  orderSchema,
  eventSchema,
  
  // Types
  User,
  Order,
  Event,
  
  // Validators
  userValidator,
  orderValidator,
  eventValidator,
  
  // Example functions
  validateUserOnClient,
  validateUserOnApi,
  validateOrder,
  validateOrderFields,
  validateEventForDatabase
};