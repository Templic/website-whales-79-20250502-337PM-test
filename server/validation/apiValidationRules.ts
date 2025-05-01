/**
 * API Validation Rules
 * 
 * This file defines validation rules for API endpoints using the ValidationEngine.
 * Rules are registered with the engine and can be applied to specific endpoints.
 */

import { z } from 'zod';
import { ValidationEngine, createValidationRule } from '../security/advanced/apiValidation/ValidationEngine';
import { applyValidationRules } from '../middleware/apiValidationMiddleware';
import { ImmutableSecurityLogger } from '../utils/security/SecurityLogger';

const logger = new ImmutableSecurityLogger('API_VALIDATION');

/**
 * Register common validation rules
 */
export function registerCommonValidationRules() {
  try {
    // Define pagination schema
    const paginationSchema = z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      sortBy: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional().default('asc')
    });

    // Define common ID parameter schema
    const idParamSchema = z.object({
      id: z.coerce.number().int().positive()
    });

    // Define UUID parameter schema
    const uuidParamSchema = z.object({
      id: z.string().uuid()
    });

    // Define search query schema
    const searchQuerySchema = z.object({
      q: z.string().min(1).max(100),
      filter: z.string().optional(),
      category: z.string().optional()
    });

    // Define common user schema
    const userSchema = z.object({
      username: z.string().min(3).max(30),
      email: z.string().email(),
      password: z.string().min(8).max(100),
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional()
    });

    // Define API key schema
    const apiKeySchema = z.object({
      apiKey: z.string().min(30).max(100)
    });

    // Register common validation rules
    ValidationEngine.registerRule(
      createValidationRule(
        'pagination',
        'Pagination Parameters',
        paginationSchema,
        ['query'],
        {
          description: 'Validates and normalizes pagination parameters',
          transform: (data) => ({
            ...data,
            page: Number(data.page),
            limit: Number(data.limit)
          })
        }
      )
    );

    ValidationEngine.registerRule(
      createValidationRule(
        'id-param',
        'ID Parameter',
        idParamSchema,
        ['params'],
        {
          description: 'Validates that ID parameters are positive integers'
        }
      )
    );

    ValidationEngine.registerRule(
      createValidationRule(
        'uuid-param',
        'UUID Parameter',
        uuidParamSchema,
        ['params'],
        {
          description: 'Validates that ID parameters are valid UUIDs'
        }
      )
    );

    ValidationEngine.registerRule(
      createValidationRule(
        'search-query',
        'Search Query Parameters',
        searchQuerySchema,
        ['query'],
        {
          description: 'Validates search query parameters'
        }
      )
    );

    ValidationEngine.registerRule(
      createValidationRule(
        'user-data',
        'User Data Validation',
        userSchema,
        ['body'],
        {
          description: 'Validates user registration and profile update data'
        }
      )
    );

    ValidationEngine.registerRule(
      createValidationRule(
        'api-key',
        'API Key Validation',
        apiKeySchema,
        ['headers'],
        {
          description: 'Validates API key in request headers'
        }
      )
    );

    // Apply rules to specific endpoints
    applyValidationRules('/api/search', ['search-query', 'pagination']);
    applyValidationRules('/api/users', ['pagination']);
    applyValidationRules('/api/users/:id', ['id-param']);
    applyValidationRules('/api/register', ['user-data']);
    applyValidationRules('/api/login', ['user-data']);
    applyValidationRules('/api/secure/public', ['pagination']);
    applyValidationRules('/api/admin', ['api-key']);

    // Add contact form validation
    const contactFormSchema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      subject: z.string().min(3).max(200),
      message: z.string().min(10).max(2000)
    });

    ValidationEngine.registerRule(
      createValidationRule(
        'contact-form',
        'Contact Form Validation',
        contactFormSchema,
        ['body'],
        {
          description: 'Validates contact form submissions'
        }
      )
    );

    applyValidationRules('/api/contact', ['contact-form']);

    // Add comment validation
    const commentSchema = z.object({
      content: z.string().min(1).max(1000),
      postId: z.number().int().positive()
    });

    ValidationEngine.registerRule(
      createValidationRule(
        'comment',
        'Comment Validation',
        commentSchema,
        ['body'],
        {
          description: 'Validates comment submissions'
        }
      )
    );

    applyValidationRules('/api/comments', ['comment']);

    logger.info({
      action: 'COMMON_VALIDATION_RULES_REGISTERED',
      timestamp: Date.now()
    }, 'API_VALIDATION');

    return true;
  } catch (error) {
    logger.error({
      action: 'COMMON_VALIDATION_RULES_ERROR',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, 'API_VALIDATION');

    return false;
  }
}

/**
 * Register custom validation rules for specific endpoints
 */
export function registerCustomValidationRules() {
  try {
    // Product validation
    const productSchema = z.object({
      name: z.string().min(2).max(100),
      description: z.string().min(10).max(5000),
      price: z.number().positive(),
      category: z.string().min(1).max(50),
      tags: z.array(z.string()).optional(),
      inStock: z.boolean().optional().default(true)
    });

    ValidationEngine.registerRule(
      createValidationRule(
        'product',
        'Product Validation',
        productSchema,
        ['body'],
        {
          description: 'Validates product data'
        }
      )
    );

    applyValidationRules('/api/products', ['product', 'pagination']);
    applyValidationRules('/api/products/:id', ['id-param']);

    // Order validation
    const orderSchema = z.object({
      products: z.array(z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().positive()
      })).min(1),
      shippingAddress: z.object({
        street: z.string().min(3).max(100),
        city: z.string().min(2).max(50),
        state: z.string().min(2).max(50),
        zip: z.string().min(3).max(20),
        country: z.string().min(2).max(50)
      }),
      paymentMethod: z.enum(['credit_card', 'paypal', 'stripe'])
    });

    ValidationEngine.registerRule(
      createValidationRule(
        'order',
        'Order Validation',
        orderSchema,
        ['body'],
        {
          description: 'Validates order submissions'
        }
      )
    );

    applyValidationRules('/api/orders', ['order']);
    applyValidationRules('/api/orders/:id', ['id-param']);

    logger.info({
      action: 'CUSTOM_VALIDATION_RULES_REGISTERED',
      timestamp: Date.now()
    }, 'API_VALIDATION');

    return true;
  } catch (error) {
    logger.error({
      action: 'CUSTOM_VALIDATION_RULES_ERROR',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, 'API_VALIDATION');

    return false;
  }
}

export default {
  registerCommonValidationRules,
  registerCustomValidationRules
};