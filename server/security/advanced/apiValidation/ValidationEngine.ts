/**
 * Validation Engine Module
 * 
 * The core of the API validation system that provides schema registration,
 * validation, and rule management. Supports different validation modes and targets.
 * 
 * Enhanced with AI-powered security validation capabilities for advanced threat detection.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationErrorHandler } from './ValidationErrorHandler';

// Lazy-load AI dependencies to avoid circular references
let validationAIConnector: any = null;

// Define validation options interface
export interface ValidationOptions {
  mode?: 'strict' | 'flexible' | 'permissive';
  target?: 'body' | 'query' | 'params' | 'headers' | 'cookies' | 'all';
  includeDetails?: boolean;
  statusCode?: number;
  logSeverity?: 'low' | 'medium' | 'high' | 'critical';
  useCasing?: 'preserve' | 'camel' | 'snake' | 'pascal';
  useAI?: boolean;
  aiOptions?: {
    detailedAnalysis?: boolean;
    contentType?: 'code' | 'logs' | 'network' | 'config' | 'api' | 'database';
    threshold?: number;
    maxTokens?: number;
  };
}

// Map of validation rules for different endpoints
export type ValidationRule = {
  id: string;
  name: string;
  description?: string;
  schema: z.ZodTypeAny;
  target?: 'body' | 'query' | 'params' | 'headers' | 'cookies';
  isActive?: boolean;
  priority?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
};

/**
 * The ValidationEngine is responsible for managing validation rules and performing validation.
 */
export class ValidationEngine {
  // Maps rule IDs to validation rules
  private static rules: Map<string, ValidationRule> = new Map();
  
  // Maps endpoints to rule IDs
  private static endpoints: Map<string, string[]> = new Map();
  
  /**
   * Register a validation rule
   */
  static registerRule(ruleId: string, rule: Omit<ValidationRule, 'id'>): void {
    if (this.rules.has(ruleId)) {
      throw new Error(`Validation rule with ID '${ruleId}' already exists`);
    }
    
    this.rules.set(ruleId, {
      id: ruleId,
      ...rule,
      isActive: rule.isActive !== false, // Default to active
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  /**
   * Get a validation rule by ID
   */
  static getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }
  
  /**
   * Update a validation rule
   */
  static updateRule(ruleId: string, updates: Partial<Omit<ValidationRule, 'id' | 'createdAt'>>): void {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      throw new Error(`Validation rule with ID '${ruleId}' not found`);
    }
    
    this.rules.set(ruleId, {
      ...rule,
      ...updates,
      updatedAt: new Date()
    });
  }
  
  /**
   * Apply validation rules to an endpoint
   */
  static applyRulesToEndpoint(endpoint: string, ruleIds: string[]): void {
    // Validate that all rules exist
    for (const ruleId of ruleIds) {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Validation rule with ID '${ruleId}' not found`);
      }
    }
    
    this.endpoints.set(endpoint, ruleIds);
  }
  
  /**
   * Get all rules for an endpoint
   */
  static getRulesForEndpoint(endpoint: string): ValidationRule[] {
    const ruleIds = this.endpoints.get(endpoint) || [];
    
    return ruleIds
      .map(id => this.rules.get(id))
      .filter(rule => rule && rule.isActive) as ValidationRule[];
  }
  
  /**
   * Get the AI validation connector (lazy-loaded)
   */
  private static async getAIConnector() {
    if (!validationAIConnector) {
      try {
        // Dynamic import to avoid circular references
        const module = await import('../ai/ValidationAIConnector');
        validationAIConnector = module.validationAIConnector;
      } catch (error) {
        console.error('[VALIDATION_ENGINE] Error loading AI connector:', error);
        throw new Error('Failed to load AI validation connector');
      }
    }
    return validationAIConnector;
  }
  
  /**
   * Perform AI-powered validation on request data
   */
  private static async performAIValidation(
    req: Request,
    content: string,
    contentType: 'code' | 'logs' | 'network' | 'config' | 'api' | 'database',
    aiOptions: Record<string, any> = {}
  ) {
    try {
      const connector = await this.getAIConnector();
      
      // Create validation context from request
      const context = {
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id || (req as any).user?.claims?.sub,
        ip: req.ip,
        isAuthenticated: !!(req as any).user,
        roles: (req as any).user?.roles || [],
        permissions: (req as any).user?.permissions || [],
        sessionId: (req as any).sessionID,
        timestamp: Date.now(),
        additionalContext: {
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer || req.headers.referrer,
          host: req.headers.host
        }
      };
      
      // Run AI validation
      return await connector.validateWithAI(content, context, {
        contentType,
        ...aiOptions
      });
    } catch (error) {
      console.error('[VALIDATION_ENGINE] AI validation error:', error);
      throw error;
    }
  }

  /**
   * Create validation middleware for an API endpoint
   */
  static createValidationMiddleware(ruleIds: string[], options: ValidationOptions = {}) {
    const defaultOptions = {
      mode: 'strict',
      target: 'all',
      includeDetails: process.env.NODE_ENV !== 'production',
      statusCode: 400,
      logSeverity: 'medium',
      useCasing: 'preserve',
      useAI: false,
      aiOptions: {
        detailedAnalysis: false,
        contentType: 'api',
        threshold: 5,
        maxTokens: 1000
      },
      ...options
    };
    
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Collect all rules by ID
        const rules = ruleIds.map(id => {
          const rule = this.rules.get(id);
          
          if (!rule) {
            throw new Error(`Validation rule with ID '${id}' not found`);
          }
          
          if (!rule.isActive) {
            throw new Error(`Validation rule with ID '${id}' is inactive`);
          }
          
          return rule;
        });
        
        // Validate each target area based on the rule's target or the global target
        for (const rule of rules) {
          const target = rule.target || defaultOptions.target;
          
          // Skip if target is 'all' - we'll handle this later
          if (target === 'all') continue;
          
          const data = req[target as keyof Request];
          
          // Apply the validation schema
          const result = rule.schema.safeParse(data);
          
          if (!result.success) {
            return ValidationErrorHandler.handleZodError(
              res,
              result.error,
              {
                includeDetails: defaultOptions.includeDetails as boolean,
                statusCode: defaultOptions.statusCode as number,
                logSeverity: defaultOptions.logSeverity as 'low' | 'medium' | 'high' | 'critical'
              }
            );
          }
          
          // Update the request data with parsed values if validation succeeds
          if (defaultOptions.mode === 'strict') {
            (req as any)[target] = result.data;
          }
        }
        
        // Handle 'all' target validation by combining all target areas
        const allTargetRules = rules.filter(rule => 
          // Check if the rule's target is 'all' 
          (rule.target as string) === 'all' || 
          // Or if the default target is 'all' and the rule doesn't specify a target
          defaultOptions.target === 'all');
        
        if (allTargetRules.length > 0) {
          const combinedData = {
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers,
            cookies: req.cookies
          };
          
          for (const rule of allTargetRules) {
            const result = rule.schema.safeParse(combinedData);
            
            if (!result.success) {
              return ValidationErrorHandler.handleZodError(
                res,
                result.error,
                {
                  includeDetails: defaultOptions.includeDetails as boolean,
                  statusCode: defaultOptions.statusCode as number,
                  logSeverity: defaultOptions.logSeverity as 'low' | 'medium' | 'high' | 'critical'
                }
              );
            }
          }
        }
        
        // If AI validation is enabled, check for security threats
        if (defaultOptions.useAI && process.env.OPENAI_API_KEY) {
          try {
            // Get the content to analyze (typically the request body)
            let contentToAnalyze = '';
            const contentType = defaultOptions.aiOptions.contentType || 'api' as const;
            
            if (contentType === 'api') {
              // For API validation, serialize the request data
              contentToAnalyze = JSON.stringify({
                method: req.method,
                path: req.path,
                query: req.query,
                params: req.params,
                body: req.body,
                headers: { 
                  ...req.headers,
                  // Remove sensitive headers
                  authorization: req.headers.authorization ? '[REDACTED]' : undefined,
                  cookie: req.headers.cookie ? '[REDACTED]' : undefined
                }
              }, null, 2);
            } else if (req.body && typeof req.body === 'object') {
              // For other content types, use the request body
              contentToAnalyze = JSON.stringify(req.body, null, 2);
            } else if (req.body && typeof req.body === 'string') {
              contentToAnalyze = req.body;
            }
            
            // Skip AI validation if no content to analyze
            if (contentToAnalyze) {
              const aiResult = await this.performAIValidation(
                req, 
                contentToAnalyze, 
                contentType, 
                defaultOptions.aiOptions
              );
              
              // If AI validation fails, return error
              if (!aiResult.success) {
                console.warn(`[VALIDATION_ENGINE] AI validation failed for ${req.path}:`, aiResult.errors);
                
                return ValidationErrorHandler.handleCustomError(
                  res,
                  'Security validation failed',
                  { 
                    errors: aiResult.errors,
                    message: 'The request contains potentially malicious patterns' 
                  },
                  {
                    includeDetails: defaultOptions.includeDetails as boolean,
                    statusCode: 403,
                    logSeverity: 'high'
                  }
                );
              }
              
              // Attach AI validation result to request for later use
              (req as any).aiValidationResult = aiResult;
            }
          } catch (aiError) {
            console.error('[VALIDATION_ENGINE] AI validation error:', aiError);
            // Continue despite AI validation error - don't block request
          }
        }
        
        // If we get here, all validations have passed
        next();
      } catch (error) {
        // Handle unexpected errors
        console.error('[VALIDATION_ENGINE] Error during validation:', error);
        
        return ValidationErrorHandler.handleCustomError(
          res,
          'Validation system error',
          { error: error instanceof Error ? error.message : String(error) },
          {
            includeDetails: defaultOptions.includeDetails as boolean,
            statusCode: 500,
            logSeverity: 'high'
          }
        );
      }
    };
  }
  
  /**
   * Get all registered validation rules
   */
  static getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Get all endpoints with their associated rule IDs
   */
  static getAllEndpoints(): { endpoint: string; ruleIds: string[] }[] {
    return Array.from(this.endpoints.entries()).map(([endpoint, ruleIds]) => ({
      endpoint,
      ruleIds
    }));
  }
  
  /**
   * Generate validation documentation
   */
  static async generateDocumentation(format: 'markdown' | 'json' | 'html' = 'markdown'): Promise<string> {
    try {
      // Dynamically import the doc generator to avoid circular dependencies
      const { ValidationDocGenerator } = require('./ValidationDocGenerator');
      
      return await ValidationDocGenerator.generateDocs({
        outputDir: './docs/validation',
        format,
        includeExamples: true,
        includePatterns: true,
        includeSchema: true,
        title: 'API Validation Documentation'
      });
    } catch (error) {
      console.error('[VALIDATION_ENGINE] Error generating documentation:', error);
      return `Error generating documentation: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * Clear all validation rules and endpoint associations
   * (Typically used in testing)
   */
  static reset(): void {
    this.rules.clear();
    this.endpoints.clear();
  }
}