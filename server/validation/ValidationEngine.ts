/**
 * Validation Engine
 * 
 * Core component for managing validation rules, mappings, and validation execution
 */

// Type definitions
export type ValidationRuleType = 'schema' | 'security' | 'ai' | 'custom';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: ValidationRuleType;
  validators?: any[];
  metadata?: Record<string, any>;
}

export interface ValidationMapping {
  endpoint: string;
  rules: string[];
  metadata?: Record<string, any>;
}

// Singleton class for ValidationEngine
export class ValidationEngine {
  private static instance: ValidationEngine;
  private rules: Record<string, ValidationRule> = {};
  private mappings: Record<string, ValidationMapping> = {};
  
  private constructor() {
    // Initialize with some default rules
    this.registerRule({
      id: 'api:contact:validation',
      name: 'Contact Form Validation',
      description: 'Validates contact form submissions',
      type: 'schema',
      metadata: {
        fields: ['name', 'email', 'message']
      }
    });
    
    this.registerRule({
      id: 'api:security:sql-injection',
      name: 'SQL Injection Protection',
      description: 'Detects and prevents SQL injection attempts',
      type: 'security',
      metadata: {
        severity: 'high',
        targets: ['query', 'search']
      }
    });
    
    this.registerRule({
      id: 'api:security:xss',
      name: 'XSS Protection',
      description: 'Detects and prevents cross-site scripting attacks',
      type: 'security',
      metadata: {
        severity: 'high',
        targets: ['content', 'html', 'message']
      }
    });
    
    this.registerRule({
      id: 'api:ai:content-safety',
      name: 'Content Safety',
      description: 'Uses AI to detect unsafe or inappropriate content',
      type: 'ai',
      metadata: {
        model: 'content-safety-v1',
        categories: ['hate', 'violence', 'self-harm', 'sexual', 'harassment']
      }
    });
    
    // Register default mappings
    this.registerMapping({
      endpoint: '/api/contact',
      rules: ['api:contact:validation', 'api:security:xss', 'api:ai:content-safety'],
      metadata: {
        priority: 'high'
      }
    });
    
    this.registerMapping({
      endpoint: '/api/search',
      rules: ['api:security:sql-injection'],
      metadata: {
        priority: 'critical'
      }
    });
    
    this.registerMapping({
      endpoint: '/api/content',
      rules: ['api:security:xss', 'api:ai:content-safety'],
      metadata: {
        priority: 'medium'
      }
    });
  }
  
  public static getInstance(): ValidationEngine {
    if (!ValidationEngine.instance) {
      ValidationEngine.instance = new ValidationEngine();
    }
    return ValidationEngine.instance;
  }
  
  public registerRule(rule: ValidationRule): void {
    this.rules[rule.id] = rule;
  }
  
  public registerMapping(mapping: ValidationMapping): void {
    this.mappings[mapping.endpoint] = mapping;
  }
  
  public getRules(): Record<string, ValidationRule> {
    return this.rules;
  }
  
  public getMappings(): Record<string, ValidationMapping> {
    return this.mappings;
  }
  
  public getRule(id: string): ValidationRule | undefined {
    return this.rules[id];
  }
  
  public getMapping(endpoint: string): ValidationMapping | undefined {
    return this.mappings[endpoint];
  }
  
  public getRulesForEndpoint(endpoint: string): ValidationRule[] {
    const mapping = this.mappings[endpoint];
    if (!mapping) return [];
    
    return mapping.rules
      .map(ruleId => this.rules[ruleId])
      .filter(rule => !!rule);
  }
}

// Export singleton instance getter
export default ValidationEngine.getInstance;