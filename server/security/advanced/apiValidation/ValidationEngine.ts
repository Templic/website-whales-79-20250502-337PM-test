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
import secureLogger from '../../utils/secureLogger';
import { ValidationAIConnector } from '../ai/ValidationAIConnector';

// Create secure logger for validation events
const logger = secureLogger.createLogger('api-validation', {
  component: 'security',
  subcomponent: 'validation',
  redactKeys: ['password', 'token', 'secret', 'apiKey', 'authorization', 'x-api-key', 'sessionid']
});

// Validation options
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

// Validation rule
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

// Validation result (internal)
interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError | null;
  data?: any;
  context?: string;
  warnings?: any[];
}

// AI validation result (from external service)
interface AIValidationResult {
  valid: boolean;
  reason?: string;
  confidence?: number;
  threats?: {
    type: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    confidence: number;
    location?: string;
    mitigation?: string;
  }[];
  codeIssues?: {
    line?: number;
    column?: number;
    code?: string;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    fix?: string;
  }[];
  analysis?: string;
  debug?: any;
}

/**
 * The ValidationEngine is responsible for managing validation rules and performing validation.
 */
export class ValidationEngine {
  private static rules: Map<string, ValidationRule> = new Map();
  private static endpoints: Map<string, string[]> = new Map();
  private static aiConnector: ValidationAIConnector | null = null;

  /**
   * Register a validation rule
   */
  static registerRule(ruleId: string, rule: Omit<ValidationRule, 'id'>): void {
    const fullRule: ValidationRule = {
      id: ruleId,
      ...rule,
      isActive: rule.isActive !== false,
      priority: rule.priority || 0,
      createdAt: rule.createdAt || new Date(),
      updatedAt: rule.updatedAt || new Date()
    };

    this.rules.set(ruleId, fullRule);
    logger.log(`Registered validation rule: ${ruleId}`, 'info', { rule: fullRule.name });
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
    const existingRule = this.rules.get(ruleId);
    if (existingRule) {
      const updatedRule: ValidationRule = {
        ...existingRule,
        ...updates,
        updatedAt: new Date()
      };
      this.rules.set(ruleId, updatedRule);
      logger.log(`Updated validation rule: ${ruleId}`, 'info', { rule: updatedRule.name });
    } else {
      logger.log(`Attempted to update non-existent rule: ${ruleId}`, 'warning');
    }
  }

  /**
   * Apply validation rules to an endpoint
   */
  static applyRulesToEndpoint(endpoint: string, ruleIds: string[]): void {
    this.endpoints.set(endpoint, ruleIds);
    logger.log(`Applied rules to endpoint: ${endpoint}`, 'info', { rules: ruleIds.join(', ') });
  }

  /**
   * Get all rules for an endpoint
   */
  static getRulesForEndpoint(endpoint: string): ValidationRule[] {
    const ruleIds = this.endpoints.get(endpoint) || [];
    return ruleIds
      .map(id => this.rules.get(id))
      .filter((rule): rule is ValidationRule => !!rule && rule.isActive !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get the AI validation connector (lazy-loaded)
   */
  private static async getAIConnector() {
    if (!this.aiConnector) {
      try {
        // Dynamic import to avoid circular dependencies
        const { ValidationAIConnector } = await import('../ai/ValidationAIConnector');
        this.aiConnector = new ValidationAIConnector();
        logger.log('AI validation connector initialized', 'info');
      } catch (error) {
        logger.log('Failed to initialize AI validation connector', 'error', { error });
        return null;
      }
    }
    return this.aiConnector;
  }

  /**
   * Perform AI-powered validation on request data
   */
  private static async performAIValidation(
    req: Request,
    target: 'body' | 'query' | 'params' | 'headers' | 'cookies' | 'all' = 'body',
    options: ValidationOptions
  ): Promise<AIValidationResult> {
    try {
      const connector = await this.getAIConnector();
      if (!connector) {
        logger.log('AI validation skipped - connector not available', 'warning');
        return { valid: true };
      }

      // Get the data to validate based on target
      let data: any;
      if (target === 'all') {
        data = {
          body: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          url: req.url,
          method: req.method
        };
      } else {
        data = req[target];
      }

      // Set the content type for analysis
      const contentType = options.aiOptions?.contentType || 'api';
      
      // Set the threshold for security validation
      const threshold = options.aiOptions?.threshold || 0.5;

      // Perform AI validation
      const result = await connector.validateData(
        data, 
        {
          contentType,
          threshold,
          detailedAnalysis: options.aiOptions?.detailedAnalysis || false,
          maxTokens: options.aiOptions?.maxTokens,
          requestContext: {
            url: req.url,
            method: req.method,
            ip: req.ip
          }
        }
      );

      if (!result.valid) {
        const securityLevel = getSecurityThresholdFromOptions(options);
        logger.log(
          `AI validation failed for ${req.method} ${req.path}`, 
          securityLevel === 'critical' ? 'critical' : 
          securityLevel === 'high' ? 'error' : 
          securityLevel === 'medium' ? 'warning' : 'info',
          {
            threats: result.threats,
            reason: result.reason,
            confidence: result.confidence,
            method: req.method,
            url: req.url
          }
        );
      }

      return result;
    } catch (error) {
      logger.log('Error performing AI validation', 'error', { error, url: req.url, method: req.method });
      // Still return valid=true in case of errors to not block requests due to internal errors
      return { valid: true };
    }
  }

  /**
   * Create validation middleware for an API endpoint
   */
  static createValidationMiddleware(ruleIds: string[], options: ValidationOptions = {}) {
    const {
      mode = 'strict',
      target = 'body',
      includeDetails = false,
      statusCode = 400,
      useAI = false
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validationPromises: Promise<ValidationResult>[] = [];
        const validatedData: Record<string, any> = {};

        // Get active rules
        const rules = ruleIds
          .map(id => this.rules.get(id))
          .filter((rule): rule is ValidationRule => !!rule && rule.isActive !== false)
          .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Validate against schemas
        for (const rule of rules) {
          const ruleTarget = rule.target || target;
          
          // Skip if no schema or irrelevant target
          if (!rule.schema || !req[ruleTarget]) continue;

          try {
            // Parse data with Zod
            const result = await rule.schema.safeParseAsync(req[ruleTarget]);
            
            if (result.success) {
              // Store validated data by target
              validatedData[ruleTarget] = result.data;
            } else {
              if (mode === 'strict') {
                // In strict mode, fail immediately on first error
                const errorResponse = {
                  success: false,
                  message: `Validation failed for ${ruleTarget}`,
                  rule: rule.name,
                  errors: includeDetails ? result.error.format() : undefined
                };
                
                logger.log(
                  `Validation failed for ${req.method} ${req.path}`, 
                  options.logSeverity === 'critical' ? 'critical' : 
                  options.logSeverity === 'high' ? 'error' : 
                  options.logSeverity === 'medium' ? 'warning' : 'info',
                  {
                    rule: rule.name,
                    target: ruleTarget,
                    errors: result.error.format(),
                    method: req.method,
                    url: req.url
                  }
                );
                
                return res.status(statusCode).json(errorResponse);
              } else {
                // In other modes, collect errors and continue
                validationPromises.push(Promise.resolve({
                  valid: false,
                  errors: result.error,
                  context: rule.name
                }));
              }
            }
          } catch (error) {
            logger.log('Error during schema validation', 'error', { 
              error, 
              rule: rule.name,
              target: ruleTarget,
              method: req.method,
              url: req.url
            });
            
            if (mode === 'strict') {
              return res.status(500).json({
                success: false,
                message: 'Internal validation error'
              });
            }
          }
        }

        // Perform AI validation if enabled
        if (useAI) {
          try {
            const aiResult = await this.performAIValidation(req, target, options);
            
            if (!aiResult.valid) {
              // AI found security issues
              if (mode === 'strict' || 
                  (aiResult.threats && aiResult.threats.some(t => 
                    t.severity === 'critical' || 
                    (t.severity === 'high' && t.confidence > 0.8)
                  ))) {
                
                // For critical or high confidence threats, fail request in strict mode
                const errorResponse = {
                  success: false,
                  message: aiResult.reason || 'Security validation failed',
                  details: includeDetails ? {
                    threats: aiResult.threats,
                    analysis: aiResult.analysis
                  } : undefined
                };
                
                return res.status(statusCode).json(errorResponse);
              }
              
              // In non-strict modes, add results but don't block
              validationPromises.push(Promise.resolve({
                valid: false,
                errors: null,
                context: 'AI Security Analysis',
                data: aiResult
              }));
            }
          } catch (aiError) {
            logger.log('Error during AI validation', 'error', { 
              error: aiError, 
              method: req.method,
              url: req.url
            });
            
            // Don't block in case of AI validation errors
          }
        }

        // Collect all validation results in non-strict mode
        if (mode !== 'strict' && validationPromises.length > 0) {
          const results = await Promise.all(validationPromises);
          const invalidResults = results.filter(r => !r.valid);
          
          if (invalidResults.length > 0 && mode === 'flexible') {
            // In flexible mode, still fail if any validation failed
            const errorResponse = {
              success: false,
              message: 'Validation failed',
              errors: includeDetails ? invalidResults.map(r => ({
                context: r.context,
                errors: r.errors ? r.errors.format() : undefined,
                data: r.data
              })) : undefined
            };
            
            return res.status(statusCode).json(errorResponse);
          }
        }

        // If we got here, validation passed (or we're in permissive mode)
        // Attach validated data to request
        (req as any).validatedData = validatedData;
        
        next();
      } catch (error) {
        logger.log('Unexpected error in validation middleware', 'error', { 
          error, 
          method: req.method,
          url: req.url
        });
        
        next(error);
      }
    };
  }

  /**
   * Perform direct AI validation without middleware
   */
  static async validateWithAI(data: any, options: Omit<ValidationOptions, 'target'> & { 
    contentType: 'code' | 'logs' | 'network' | 'config' | 'api' | 'database'
  }): Promise<AIValidationResult> {
    try {
      const connector = await this.getAIConnector();
      if (!connector) {
        return { valid: true };
      }
      
      return await connector.validateData(data, {
        contentType: options.contentType,
        threshold: options.aiOptions?.threshold || 0.5,
        detailedAnalysis: options.aiOptions?.detailedAnalysis || false,
        maxTokens: options.aiOptions?.maxTokens
      });
    } catch (error) {
      logger.log('Error performing direct AI validation', 'error', { error });
      return { valid: true };
    }
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
    const rules = this.getAllRules();
    const endpoints = this.getAllEndpoints();
    
    if (format === 'json') {
      return JSON.stringify({ rules, endpoints }, null, 2);
    } else if (format === 'html') {
      // Simple HTML documentation
      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Validation Documentation</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #0055aa; }
    .rule { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .rule h3 { margin-top: 0; }
    .endpoint { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .tag { display: inline-block; background: #e0e0e0; border-radius: 3px; padding: 2px 6px; margin-right: 5px; font-size: 0.8rem; }
    .priority { font-weight: bold; }
    .inactive { color: #888; font-style: italic; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    tr:hover { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>API Validation Documentation</h1>
  
  <h2>Validation Rules</h2>
  ${rules.map(rule => `
  <div class="rule ${rule.isActive === false ? 'inactive' : ''}">
    <h3>${rule.name} <span class="rule-id">(${rule.id})</span></h3>
    ${rule.description ? `<p>${rule.description}</p>` : ''}
    <p><strong>Target:</strong> ${rule.target || 'body'}</p>
    <p><strong>Priority:</strong> <span class="priority">${rule.priority || 0}</span></p>
    <p><strong>Status:</strong> ${rule.isActive === false ? 'Inactive' : 'Active'}</p>
    ${rule.tags && rule.tags.length ? `<p><strong>Tags:</strong> ${rule.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</p>` : ''}
    <p><strong>Created:</strong> ${rule.createdAt?.toISOString()}</p>
    <p><strong>Updated:</strong> ${rule.updatedAt?.toISOString()}</p>
  </div>
  `).join('')}

  <h2>Endpoint Mappings</h2>
  <table>
    <tr>
      <th>Endpoint</th>
      <th>Rules</th>
    </tr>
    ${endpoints.map(({ endpoint, ruleIds }) => `
    <tr>
      <td>${endpoint}</td>
      <td>${ruleIds.map(id => {
        const rule = this.getRule(id);
        return rule ? `<span class="tag">${rule.name}</span>` : id;
      }).join(' ')}</td>
    </tr>
    `).join('')}
  </table>
</body>
</html>`;
      
      return html;
    } else {
      // Markdown documentation
      let markdown = '# API Validation Documentation\n\n';
      
      markdown += '## Validation Rules\n\n';
      
      for (const rule of rules) {
        markdown += `### ${rule.name} (${rule.id})\n\n`;
        if (rule.description) {
          markdown += `${rule.description}\n\n`;
        }
        markdown += `- **Target:** ${rule.target || 'body'}\n`;
        markdown += `- **Priority:** ${rule.priority || 0}\n`;
        markdown += `- **Status:** ${rule.isActive === false ? 'Inactive' : 'Active'}\n`;
        if (rule.tags && rule.tags.length) {
          markdown += `- **Tags:** ${rule.tags.join(', ')}\n`;
        }
        markdown += `- **Created:** ${rule.createdAt?.toISOString()}\n`;
        markdown += `- **Updated:** ${rule.updatedAt?.toISOString()}\n\n`;
      }
      
      markdown += '## Endpoint Mappings\n\n';
      markdown += '| Endpoint | Rules |\n|----------|-------|\n';
      
      for (const { endpoint, ruleIds } of endpoints) {
        const ruleNames = ruleIds.map(id => {
          const rule = this.getRule(id);
          return rule ? rule.name : id;
        }).join(', ');
        
        markdown += `| ${endpoint} | ${ruleNames} |\n`;
      }
      
      return markdown;
    }
  }

  /**
   * Clear all validation rules and endpoint associations
   * (Typically used in testing)
   */
  static reset(): void {
    this.rules.clear();
    this.endpoints.clear();
    this.aiConnector = null;
    logger.log('ValidationEngine reset', 'info');
  }
}

/**
 * Helper function to map validation options to security threshold
 */
function getSecurityThresholdFromOptions(options: ValidationOptions): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (options.logSeverity === 'critical') return 'critical';
  if (options.logSeverity === 'high') return 'high';
  if (options.logSeverity === 'medium') return 'medium';
  if (options.logSeverity === 'low') return 'low';
  
  // Default based on mode
  if (options.mode === 'strict') return 'high';
  if (options.mode === 'flexible') return 'medium';
  return 'low';
}