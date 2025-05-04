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

// Use secure logger for validation events
const logComponent = 'ValidationEngine';

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
    contentType?: 'code' | 'api' | 'user-content' | 'database-query';
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
    secureLogger('info', logComponent, `Registered validation rule: ${ruleId}`, { metadata: { rule: fullRule.name } });
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
      secureLogger('info', logComponent, `Updated validation rule: ${ruleId}`, { metadata: { rule: updatedRule.name } });
    } else {
      secureLogger('warning', logComponent, `Attempted to update non-existent rule: ${ruleId}`);
    }
  }

  /**
   * Apply validation rules to an endpoint
   */
  static applyRulesToEndpoint(endpoint: string, ruleIds: string[]): void {
    this.endpoints.set(endpoint, ruleIds);
    secureLogger('info', logComponent, `Applied rules to endpoint: ${endpoint}`, { metadata: { rules: ruleIds.join(', ') } });
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
        secureLogger('info', logComponent, 'AI validation connector initialized');
      } catch (error) {
        secureLogger('error', logComponent, 'Failed to initialize AI validation connector', { 
          metadata: { error: error instanceof Error ? error.message : String(error) } 
        });
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
        secureLogger('warning', logComponent, 'AI validation skipped - connector not available');
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
        // Handle each target type explicitly to avoid TypeScript error
        if (target === 'body') {
          data = req.body;
        } else if (target === 'query') {
          data = req.query;
        } else if (target === 'params') {
          data = req.params;
        } else if (target === 'headers') {
          data = req.headers;
        } else if (target === 'cookies') {
          data = req.cookies;
        }
      }

      // Set the content type for analysis
      const contentType = options.aiOptions?.contentType || 'api';
      
      // Set the threshold for security validation
      const threshold = options.aiOptions?.threshold || 0.5;

      // Perform AI validation
      const result = await connector.validate(data, {
        contentType: contentType as any,
        threshold,
        detailedAnalysis: options.aiOptions?.detailedAnalysis || false
      });

      if (!result.passed) {
        const securityLevel = getSecurityThresholdFromOptions(options);
        secureLogger(
          securityLevel === 'critical' ? 'critical' : 
          securityLevel === 'high' ? 'error' : 
          securityLevel === 'medium' ? 'warning' : 'info',
          logComponent,
          `AI validation failed for ${req.method} ${req.path}`, 
          {
            metadata: {
              warnings: result.warnings,
              securityScore: result.securityScore,
              method: req.method,
              url: req.url
            }
          }
        );
      }

      return { 
        valid: result.passed,
        confidence: result.securityScore,
        reason: result.warnings.length > 0 ? result.warnings[0] : undefined,
        threats: result.warnings.map(w => {
          const match = w.match(/\[(.*?)\] (.*?) \((\d+)% confidence\)/);
          if (match) {
            return {
              type: 'security_threat',
              severity: match[1].toLowerCase() as 'critical' | 'high' | 'medium' | 'low' | 'info',
              description: match[2],
              confidence: parseInt(match[3], 10) / 100
            };
          }
          return {
            type: 'security_threat',
            severity: 'medium',
            description: w,
            confidence: 0.5
          };
        })
      };
    } catch (error) {
      secureLogger('error', logComponent, 'Error performing AI validation', { 
        metadata: {
          error: error instanceof Error ? error.message : String(error), 
          url: req.url, 
          method: req.method 
        }
      });
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
          
          // Skip if no schema
          if (!rule.schema) continue;
          
          // Check if target exists in request
          let targetData: any;
          if (ruleTarget === 'body') {
            targetData = req.body;
          } else if (ruleTarget === 'query') {
            targetData = req.query;
          } else if (ruleTarget === 'params') {
            targetData = req.params;
          } else if (ruleTarget === 'headers') {
            targetData = req.headers;
          } else if (ruleTarget === 'cookies') {
            targetData = req.cookies;
          } else {
            // Skip unsupported target
            secureLogger('warning', logComponent, `Skipping validation for unsupported target: ${ruleTarget}`);
            continue;
          }
          
          // Skip if target doesn't exist
          if (!targetData) continue;

          try {
            // Parse data with Zod using the target data we already retrieved
            const result = await rule.schema.safeParseAsync(targetData);
            
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
                
                secureLogger(
                  options.logSeverity === 'critical' ? 'critical' : 
                  options.logSeverity === 'high' ? 'error' : 
                  options.logSeverity === 'medium' ? 'warning' : 'info',
                  logComponent,
                  `Validation failed for ${req.method} ${req.path}`, 
                  {
                    metadata: {
                      rule: rule.name,
                      target: ruleTarget,
                      errors: result.error.format(),
                      method: req.method,
                      url: req.url
                    }
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
            secureLogger('error', logComponent, 'Error during schema validation', { 
              metadata: {
                error: error instanceof Error ? error.message : String(error), 
                rule: rule.name,
                target: ruleTarget,
                method: req.method,
                url: req.url
              }
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
          } catch (error) {
            secureLogger('error', logComponent, 'Error during AI validation', { 
              metadata: {
                error: error instanceof Error ? error.message : String(error), 
                method: req.method,
                url: req.url
              }
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
        secureLogger('error', logComponent, 'Unexpected error in validation middleware', { 
          metadata: {
            error: error instanceof Error ? error.message : String(error), 
            method: req.method,
            url: req.url
          }
        });
        
        next(error);
      }
    };
  }

  /**
   * Perform direct AI validation without middleware
   */
  static async validateWithAI(data: any, options: Omit<ValidationOptions, 'target'> & { 
    contentType: 'code' | 'api' | 'user-content' | 'database-query'
  }): Promise<AIValidationResult> {
    try {
      const connector = await this.getAIConnector();
      if (!connector) {
        return { valid: true };
      }
      
      const result = await connector.validate(data, {
        contentType: options.contentType,
        threshold: options.aiOptions?.threshold || 0.5,
        detailedAnalysis: options.aiOptions?.detailedAnalysis || false,
      });

      return { 
        valid: result.passed,
        confidence: result.securityScore,
        reason: result.warnings.length > 0 ? result.warnings[0] : undefined,
        threats: result.warnings.map(w => ({
          type: 'security_threat',
          severity: 'medium',
          description: w,
          confidence: 0.5
        })),
        analysis: result.recommendations?.join('\n')
      };
    } catch (error) {
      secureLogger('error', logComponent, 'Error performing direct AI validation', { 
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
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
      return JSON.stringify({
        rules,
        endpoints
      }, null, 2);
    } else if (format === 'html') {
      // Generate basic HTML documentation
      const html = `
        <html>
          <head>
            <title>API Validation Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0 auto; max-width: 800px; padding: 20px; }
              h1, h2, h3 { color: #333; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .rule-details { margin-left: 20px; }
            </style>
          </head>
          <body>
            <h1>API Validation Documentation</h1>
            
            <h2>Validation Rules</h2>
            <table>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Target</th>
                <th>Priority</th>
              </tr>
              ${rules.map(rule => `
                <tr>
                  <td>${rule.id}</td>
                  <td>${rule.name}</td>
                  <td>${rule.description || 'No description'}</td>
                  <td>${rule.target || 'Default'}</td>
                  <td>${rule.priority || 0}</td>
                </tr>
              `).join('')}
            </table>
            
            <h2>Endpoints with Validation</h2>
            <table>
              <tr>
                <th>Endpoint</th>
                <th>Applied Rules</th>
              </tr>
              ${endpoints.map(endpoint => `
                <tr>
                  <td>${endpoint.endpoint}</td>
                  <td>${endpoint.ruleIds.join(', ')}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;
      
      return html;
    } else {
      // Generate markdown documentation
      let markdown = '# API Validation Documentation\n\n';
      
      markdown += '## Validation Rules\n\n';
      markdown += '| ID | Name | Description | Target | Priority |\n';
      markdown += '|----|------|-------------|--------|----------|\n';
      
      rules.forEach(rule => {
        markdown += `| ${rule.id} | ${rule.name} | ${rule.description || 'No description'} | ${rule.target || 'Default'} | ${rule.priority || 0} |\n`;
      });
      
      markdown += '\n## Endpoints with Validation\n\n';
      markdown += '| Endpoint | Applied Rules |\n';
      markdown += '|----------|---------------|\n';
      
      endpoints.forEach(endpoint => {
        markdown += `| ${endpoint.endpoint} | ${endpoint.ruleIds.join(', ')} |\n`;
      });
      
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
    secureLogger('info', logComponent, 'ValidationEngine reset');
  }
}

/**
 * Helper function to map validation options to security threshold
 */
function getSecurityThresholdFromOptions(options: ValidationOptions): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (options.logSeverity) {
    return options.logSeverity as any;
  }
  
  // Default mapping based on validation mode
  switch (options.mode) {
    case 'strict': return 'high';
    case 'flexible': return 'medium';
    case 'permissive': return 'low';
    default: return 'medium';
  }
}

// Export default singleton instance
export default ValidationEngine;