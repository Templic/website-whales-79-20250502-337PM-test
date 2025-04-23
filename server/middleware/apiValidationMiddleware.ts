/**
 * API Validation Middleware
 * 
 * This middleware applies the API validation framework to routes,
 * enforcing schema validation and providing security checks.
 */

import { Request, Response, NextFunction } from 'express';
import { validateBody, validateParams, validateQuery, securityValidation } from '../security/advanced/apiValidation';
import { apiSchemas } from '../schemas/apiValidationSchemas';
import { AnyZodObject } from 'zod';
import { securityFabric } from '../security/advanced/SecurityFabric';

/**
 * Apply validation to a route by schema category and name
 * 
 * @param category The schema category (e.g., 'auth', 'user', 'payment')
 * @param name The schema name (e.g., 'login', 'register')
 */
export function validateRoute(category: keyof typeof apiSchemas, name: string) {
  const schemas = apiSchemas[category];
  if (!schemas || !schemas[name as keyof typeof schemas]) {
    throw new Error(`Schema not found: ${category}.${name}`);
  }
  
  const schema = schemas[name as keyof typeof schemas] as AnyZodObject;
  
  return [
    // Apply security validation first
    securityValidation(),
    
    // Then apply schema validation
    validateBody(schema: any)
  ];
}

/**
 * Apply validation to query parameters
 * 
 * @param category The schema category
 * @param name The schema name
 */
export function validateQueryParams(category: keyof typeof apiSchemas, name: string) {
  const schemas = apiSchemas[category];
  if (!schemas || !schemas[name as keyof typeof schemas]) {
    throw new Error(`Schema not found: ${category}.${name}`);
  }
  
  const schema = schemas[name as keyof typeof schemas] as AnyZodObject;
  
  return [
    securityValidation(),
    validateQuery(schema: any)
  ];
}

/**
 * Apply validation to route parameters
 * 
 * @param category The schema category
 * @param name The schema name
 */
export function validateRouteParams(category: keyof typeof apiSchemas, name: string) {
  const schemas = apiSchemas[category];
  if (!schemas || !schemas[name as keyof typeof schemas]) {
    throw new Error(`Schema not found: ${category}.${name}`);
  }
  
  const schema = schemas[name as keyof typeof schemas] as AnyZodObject;
  
  return [
    securityValidation(),
    validateParams(schema: any)
  ];
}

/**
 * Apply custom validation schema
 * 
 * @param schema The schema to apply
 */
export function validateWithSchema(schema: AnyZodObject) {
  return [
    securityValidation(),
    validateBody(schema: any)
  ];
}

/**
 * Create a comprehensive validation middleware with multiple parts
 * 
 * @param bodySchema Schema for request body
 * @param querySchema Schema for query parameters
 * @param paramsSchema Schema for route parameters
 */
export function validateComplex({
  bodySchema,
  querySchema,
  paramsSchema
}: {
  bodySchema?: AnyZodObject;
  querySchema?: AnyZodObject;
  paramsSchema?: AnyZodObject;
}) {
  const middlewares = [securityValidation()];
  
  if (bodySchema: any) {
    middlewares.push(validateBody(bodySchema: any));
  }
  
  if (querySchema: any) {
    middlewares.push(validateQuery(querySchema: any));
  }
  
  if (paramsSchema: any) {
    middlewares.push(validateParams(paramsSchema: any));
  }
  
  return middlewares;
}

/**
 * Apply default validation to all API routes
 * This middleware adds baseline security validation to routes
 * that don't have specific schema validation
 */
export function defaultApiValidation() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Emit API request event for monitoring
    securityFabric.emit('api:request', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date()
    });
    
    // Apply default security validation
    securityValidation()(req: any, res: any, next: any);
  };
}