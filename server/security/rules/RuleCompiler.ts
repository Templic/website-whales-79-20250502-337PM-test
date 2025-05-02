/**
 * Rule Compiler
 * 
 * This module provides functionality to compile security rules into
 * optimized executable functions for faster evaluation.
 */

import chalk from 'chalk';
import { Rule, RuleCompileOptions, RuleCompiler } from './RuleCache';

/**
 * Compiled rule function
 */
export type CompiledRuleFunction = (
  context: Record<string, any>,
  options?: RuleEvaluationOptions
) => Promise<RuleEvaluationResult>;

/**
 * Rule evaluation options
 */
export interface RuleEvaluationOptions {
  timeout?: number;
  debug?: boolean;
  trace?: boolean;
  extraContext?: Record<string, any>;
}

/**
 * Rule evaluation result
 */
export interface RuleEvaluationResult {
  matched: boolean;
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  matchedConditions: string[];
  evaluationTimeMs: number;
  trace?: Array<{
    condition: string;
    result: boolean;
    timeMs: number;
  }>;
}

/**
 * Pattern validation result
 */
export interface PatternValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Default compile options
 */
const defaultCompileOptions: RuleCompileOptions = {
  optimize: true,
  validateDependencies: true,
  validatePattern: true
};

/**
 * Default evaluation options
 */
const defaultEvaluationOptions: RuleEvaluationOptions = {
  timeout: 1000, // 1 second
  debug: false,
  trace: false
};

/**
 * Security Rule Compiler
 * 
 * Compiles security rules into optimized functions for faster evaluation
 */
export class SecurityRuleCompiler implements RuleCompiler {
  /**
   * Compile a rule into an executable function
   * 
   * @param rule The rule to compile
   * @param options Compilation options
   * @returns Promise resolving to the compiled rule function
   */
  async compile(
    rule: Rule,
    options: RuleCompileOptions = {}
  ): Promise<CompiledRuleFunction> {
    const startTime = performance.now();
    
    // Merge options with defaults
    const compileOptions = {
      ...defaultCompileOptions,
      ...options
    };
    
    try {
      // Validate pattern if needed
      if (compileOptions.validatePattern) {
        const validationResult = this.validatePattern(rule.pattern);
        
        if (!validationResult.valid) {
          throw new Error(`Invalid rule pattern: ${validationResult.errors.join(', ')}`);
        }
      }
      
      // Pattern types:
      // - regex: Regular expression pattern
      // - json-path: JSONPath expression
      // - template: Template with variables
      // - script: JavaScript or similar script
      // - composite: Composite of multiple patterns
      
      // Create the compiled function based on pattern type
      let compiledFunction: CompiledRuleFunction;
      
      if (rule.pattern.startsWith('regex:')) {
        // Regex pattern
        compiledFunction = this.compileRegexPattern(rule);
      } else if (rule.pattern.startsWith('json-path:')) {
        // JSONPath pattern
        compiledFunction = this.compileJsonPathPattern(rule);
      } else if (rule.pattern.startsWith('template:')) {
        // Template pattern
        compiledFunction = this.compileTemplatePattern(rule);
      } else if (rule.pattern.startsWith('script:')) {
        // Script pattern
        compiledFunction = this.compileScriptPattern(rule);
      } else if (rule.pattern.startsWith('composite:')) {
        // Composite pattern
        compiledFunction = this.compileCompositePattern(rule);
      } else {
        // Default to regex pattern
        compiledFunction = this.compileRegexPattern(rule);
      }
      
      // Apply optimizations if requested
      if (compileOptions.optimize) {
        compiledFunction = this.optimizeCompiledFunction(
          rule,
          compiledFunction,
          compileOptions
        );
      }
      
      const endTime = performance.now();
      console.log(chalk.blue(
        `[RuleCompiler] Compiled rule ${rule.id} in ${(endTime - startTime).toFixed(2)}ms`
      ));
      
      return compiledFunction;
    } catch (error) {
      const endTime = performance.now();
      console.error(chalk.red(
        `[RuleCompiler] Error compiling rule ${rule.id}: ${error}`
      ));
      
      // Return a function that always returns false
      return async (context: Record<string, any>, options: RuleEvaluationOptions = {}) => {
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: 0
        };
      };
    }
  }
  
  /**
   * Validate a rule pattern
   * 
   * @param pattern The pattern to validate
   * @returns Validation result
   */
  validatePattern(pattern: string): PatternValidationResult {
    const errors: string[] = [];
    
    try {
      // Extract pattern type
      const patternType = pattern.includes(':') 
        ? pattern.split(':', 1)[0] 
        : 'regex';
      
      // Extract actual pattern
      const actualPattern = pattern.includes(':') 
        ? pattern.substring(pattern.indexOf(':') + 1) 
        : pattern;
      
      // Validate based on pattern type
      switch (patternType) {
        case 'regex':
          try {
            // Try to create a regex from the pattern
            new RegExp(actualPattern);
          } catch (error) {
            errors.push(`Invalid regex: ${error.message}`);
          }
          break;
          
        case 'json-path':
          // Basic validation for JSONPath
          if (!actualPattern.startsWith('$')) {
            errors.push('JSONPath must start with $');
          }
          break;
          
        case 'template':
          // Check for balanced {{ and }}
          const openBraces = (actualPattern.match(/{{/g) || []).length;
          const closeBraces = (actualPattern.match(/}}/g) || []).length;
          
          if (openBraces !== closeBraces) {
            errors.push('Template has unbalanced {{ and }}');
          }
          break;
          
        case 'script':
          // Basic validation for script - just check it's not empty
          if (!actualPattern.trim()) {
            errors.push('Script cannot be empty');
          }
          break;
          
        case 'composite':
          // Composite patterns should be valid JSON
          try {
            const composite = JSON.parse(actualPattern);
            
            if (!Array.isArray(composite)) {
              errors.push('Composite pattern must be an array');
            } else if (composite.length === 0) {
              errors.push('Composite pattern cannot be empty');
            } else {
              for (const subPattern of composite) {
                if (typeof subPattern !== 'string') {
                  errors.push('Each pattern in a composite must be a string');
                  break;
                }
                
                // Validate each sub-pattern
                const subResult = this.validatePattern(subPattern);
                if (!subResult.valid) {
                  errors.push(`Invalid sub-pattern "${subPattern}": ${subResult.errors.join(', ')}`);
                }
              }
            }
          } catch (error) {
            errors.push(`Invalid composite pattern JSON: ${error.message}`);
          }
          break;
          
        default:
          errors.push(`Unknown pattern type: ${patternType}`);
      }
    } catch (error) {
      errors.push(`Error validating pattern: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if a pattern is valid
   * 
   * @param pattern The pattern to check
   * @returns True if valid, false otherwise
   */
  isValidPattern(pattern: string): boolean {
    return this.validatePattern(pattern).valid;
  }
  
  /**
   * Compile a regex pattern
   * 
   * @param rule The rule containing a regex pattern
   * @returns Compiled rule function
   * @private
   */
  private compileRegexPattern(rule: Rule): CompiledRuleFunction {
    // Extract actual pattern
    const pattern = rule.pattern.startsWith('regex:')
      ? rule.pattern.substring(6)
      : rule.pattern;
    
    // Try to compile the regex
    const regex = new RegExp(pattern, 'i');
    
    // Create the compiled function
    return async (
      context: Record<string, any>,
      options: RuleEvaluationOptions = {}
    ): Promise<RuleEvaluationResult> => {
      const startTime = performance.now();
      const evalOptions = { ...defaultEvaluationOptions, ...options };
      const trace: RuleEvaluationResult['trace'] = evalOptions.trace ? [] : undefined;
      
      // Target to match against - default to data
      const target = context.data || '';
      
      // Test the regex against the target
      const matched = regex.test(target);
      
      // Prepare result
      const result: RuleEvaluationResult = {
        matched,
        actions: matched ? this.getActions(rule, context) : [],
        matchedConditions: matched ? ['regex-match'] : [],
        evaluationTimeMs: performance.now() - startTime,
        trace
      };
      
      // Add trace if enabled
      if (evalOptions.trace) {
        trace!.push({
          condition: `regex:${pattern}`,
          result: matched,
          timeMs: result.evaluationTimeMs
        });
      }
      
      return result;
    };
  }
  
  /**
   * Compile a JSONPath pattern
   * 
   * @param rule The rule containing a JSONPath pattern
   * @returns Compiled rule function
   * @private
   */
  private compileJsonPathPattern(rule: Rule): CompiledRuleFunction {
    // Extract actual pattern
    const pattern = rule.pattern.substring(10); // Remove 'json-path:'
    
    // Create the compiled function
    return async (
      context: Record<string, any>,
      options: RuleEvaluationOptions = {}
    ): Promise<RuleEvaluationResult> => {
      const startTime = performance.now();
      const evalOptions = { ...defaultEvaluationOptions, ...options };
      const trace: RuleEvaluationResult['trace'] = evalOptions.trace ? [] : undefined;
      
      try {
        // For true JSONPath evaluation, we'd use a library like 'jsonpath-plus'
        // But for demonstration purposes, we'll do a simple check
        // In a real implementation, import and use a proper JSONPath library
        
        // Simulate JSONPath evaluation
        let matched = false;
        const matchedPaths: string[] = [];
        
        // Simple cases - exact path
        if (pattern === '$.user.role' && context.user?.role) {
          matched = true;
          matchedPaths.push('user.role');
        } else if (pattern === '$.request.path' && context.request?.path) {
          matched = true;
          matchedPaths.push('request.path');
        }
        
        // Prepare result
        const result: RuleEvaluationResult = {
          matched,
          actions: matched ? this.getActions(rule, context) : [],
          matchedConditions: matched ? matchedPaths : [],
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
        
        // Add trace if enabled
        if (evalOptions.trace) {
          trace!.push({
            condition: `json-path:${pattern}`,
            result: matched,
            timeMs: result.evaluationTimeMs
          });
        }
        
        return result;
      } catch (error) {
        // Log error and return no match
        console.error(chalk.red(`[RuleCompiler] Error evaluating JSONPath: ${error}`));
        
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
      }
    };
  }
  
  /**
   * Compile a template pattern
   * 
   * @param rule The rule containing a template pattern
   * @returns Compiled rule function
   * @private
   */
  private compileTemplatePattern(rule: Rule): CompiledRuleFunction {
    // Extract actual pattern
    const pattern = rule.pattern.substring(9); // Remove 'template:'
    
    // Create the compiled function
    return async (
      context: Record<string, any>,
      options: RuleEvaluationOptions = {}
    ): Promise<RuleEvaluationResult> => {
      const startTime = performance.now();
      const evalOptions = { ...defaultEvaluationOptions, ...options };
      const trace: RuleEvaluationResult['trace'] = evalOptions.trace ? [] : undefined;
      
      try {
        // For template evaluation, we'd use a library like 'handlebars'
        // But for demonstration purposes, we'll do a simple variables replacement
        // In a real implementation, import and use a proper template library
        
        // Replace variables in template
        let rendered = pattern;
        const varRegex = /{{([^{}]+)}}/g;
        const matches = pattern.match(varRegex) || [];
        
        for (const match of matches) {
          const varName = match.substring(2, match.length - 2).trim();
          const varPath = varName.split('.');
          
          // Get variable value from context
          let value = context;
          for (const path of varPath) {
            if (value === undefined || value === null) {
              break;
            }
            value = value[path];
          }
          
          // Replace in template
          rendered = rendered.replace(match, value !== undefined ? String(value) : '');
        }
        
        // Check if the rendered template matches the target
        const target = context.target || '';
        const matched = rendered === target;
        
        // Prepare result
        const result: RuleEvaluationResult = {
          matched,
          actions: matched ? this.getActions(rule, context) : [],
          matchedConditions: matched ? ['template-match'] : [],
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
        
        // Add trace if enabled
        if (evalOptions.trace) {
          trace!.push({
            condition: `template:${pattern}`,
            result: matched,
            timeMs: result.evaluationTimeMs
          });
        }
        
        return result;
      } catch (error) {
        // Log error and return no match
        console.error(chalk.red(`[RuleCompiler] Error evaluating template: ${error}`));
        
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
      }
    };
  }
  
  /**
   * Compile a script pattern
   * 
   * @param rule The rule containing a script pattern
   * @returns Compiled rule function
   * @private
   */
  private compileScriptPattern(rule: Rule): CompiledRuleFunction {
    // Extract actual pattern
    const scriptCode = rule.pattern.substring(7); // Remove 'script:'
    
    // Create the compiled function - carefully handle potential security issues
    return async (
      context: Record<string, any>,
      options: RuleEvaluationOptions = {}
    ): Promise<RuleEvaluationResult> => {
      const startTime = performance.now();
      const evalOptions = { ...defaultEvaluationOptions, ...options };
      const trace: RuleEvaluationResult['trace'] = evalOptions.trace ? [] : undefined;
      
      // Security warning: Direct eval is dangerous! 
      // In a real implementation, use a proper sandboxed evaluation library
      // like vm2 or isolated-vm
      try {
        // Create a safety wrapper to minimize risk
        // DO NOT use this approach in production!
        const evalContext = { ...context, result: false };
        const safeFunction = new Function('context', 'console', `
          with (context) {
            try {
              ${scriptCode}
            } catch (error) {
              console.error("Script evaluation error:", error);
            }
          }
        `);
        
        // Execute with timeout
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Script execution timed out')), evalOptions.timeout);
        });
        
        await Promise.race([
          new Promise<void>(resolve => {
            safeFunction(evalContext, {
              log: (...args: any[]) => {
                if (evalOptions.debug) {
                  console.log(chalk.gray(`[Rule ${rule.id}]`), ...args);
                }
              },
              error: (...args: any[]) => {
                console.error(chalk.red(`[Rule ${rule.id}]`), ...args);
              }
            });
            resolve();
          }),
          timeoutPromise
        ]);
        
        // Get the result
        const matched = !!evalContext.result;
        
        // Prepare result
        const result: RuleEvaluationResult = {
          matched,
          actions: matched ? this.getActions(rule, context) : [],
          matchedConditions: matched ? ['script-match'] : [],
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
        
        // Add trace if enabled
        if (evalOptions.trace) {
          trace!.push({
            condition: 'script-evaluation',
            result: matched,
            timeMs: result.evaluationTimeMs
          });
        }
        
        return result;
      } catch (error) {
        // Log error and return no match
        console.error(chalk.red(`[RuleCompiler] Error evaluating script: ${error}`));
        
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
      }
    };
  }
  
  /**
   * Compile a composite pattern
   * 
   * @param rule The rule containing a composite pattern
   * @returns Compiled rule function
   * @private
   */
  private compileCompositePattern(rule: Rule): CompiledRuleFunction {
    try {
      // Extract actual pattern
      const patternJson = rule.pattern.substring(10); // Remove 'composite:'
      const patterns = JSON.parse(patternJson) as string[];
      
      // Compile each sub-pattern
      const subRules = patterns.map(pattern => {
        const subRule = { ...rule, pattern, id: `${rule.id}:${patterns.indexOf(pattern)}` };
        return this.compile(subRule);
      });
      
      // Create the compiled function
      return async (
        context: Record<string, any>,
        options: RuleEvaluationOptions = {}
      ): Promise<RuleEvaluationResult> => {
        const startTime = performance.now();
        const evalOptions = { ...defaultEvaluationOptions, ...options };
        const trace: RuleEvaluationResult['trace'] = evalOptions.trace ? [] : undefined;
        
        // Evaluate all sub-patterns
        const subResults = await Promise.all(
          subRules.map(subRule => subRule(context, evalOptions))
        );
        
        // Combine results - match if any sub-pattern matches
        const matched = subResults.some(result => result.matched);
        
        // Combine matched conditions
        const matchedConditions = subResults.reduce(
          (conditions, result) => [...conditions, ...result.matchedConditions],
          [] as string[]
        );
        
        // Combine actions (deduplicating by type)
        const actionsMap = new Map<string, { type: string; parameters: Record<string, any> }>();
        
        for (const result of subResults) {
          for (const action of result.actions) {
            actionsMap.set(action.type, action);
          }
        }
        
        const actions = Array.from(actionsMap.values());
        
        // Prepare result
        const result: RuleEvaluationResult = {
          matched,
          actions: matched ? actions : [],
          matchedConditions,
          evaluationTimeMs: performance.now() - startTime,
          trace
        };
        
        // Add trace if enabled
        if (evalOptions.trace) {
          result.trace = subResults.reduce(
            (traces, result) => [...(traces || []), ...(result.trace || [])],
            [] as RuleEvaluationResult['trace']
          );
        }
        
        return result;
      };
    } catch (error) {
      console.error(chalk.red(`[RuleCompiler] Error compiling composite pattern: ${error}`));
      
      // Return a function that always returns false
      return async (context: Record<string, any>, options: RuleEvaluationOptions = {}) => {
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: 0
        };
      };
    }
  }
  
  /**
   * Apply optimizations to a compiled function
   * 
   * @param rule The rule
   * @param compiledFunction The compiled function
   * @param options Compilation options
   * @returns Optimized compiled function
   * @private
   */
  private optimizeCompiledFunction(
    rule: Rule,
    compiledFunction: CompiledRuleFunction,
    options: RuleCompileOptions
  ): CompiledRuleFunction {
    // Apply optimizations:
    // 1. Fast paths for common patterns
    // 2. Condition caching
    // 3. Context preparation optimization
    
    return async (
      context: Record<string, any>,
      evalOptions: RuleEvaluationOptions = {}
    ): Promise<RuleEvaluationResult> => {
      const startTime = performance.now();
      
      // Fast path for disabled rules
      if (rule.status !== 'active') {
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: performance.now() - startTime
        };
      }
      
      // Fast path for rules with empty patterns
      if (!rule.pattern || rule.pattern === '') {
        return {
          matched: false,
          actions: [],
          matchedConditions: [],
          evaluationTimeMs: performance.now() - startTime
        };
      }
      
      // Fast path for missing context that the rule requires
      if (rule.conditions.requiredContextKeys) {
        for (const key of rule.conditions.requiredContextKeys) {
          // Check if the key exists in context using path notation
          const keyParts = key.split('.');
          let current = context;
          
          for (const part of keyParts) {
            if (current === undefined || current === null) {
              return {
                matched: false,
                actions: [],
                matchedConditions: [],
                evaluationTimeMs: performance.now() - startTime
              };
            }
            
            current = current[part];
          }
          
          if (current === undefined || current === null) {
            return {
              matched: false,
              actions: [],
              matchedConditions: [],
              evaluationTimeMs: performance.now() - startTime
            };
          }
        }
      }
      
      // Call the original function
      return compiledFunction(context, evalOptions);
    };
  }
  
  /**
   * Get actions for a rule
   * 
   * @param rule The rule
   * @param context The evaluation context
   * @returns Array of actions
   * @private
   */
  private getActions(
    rule: Rule,
    context: Record<string, any>
  ): Array<{ type: string; parameters: Record<string, any> }> {
    const actions = [];
    
    // Get actions from rule
    for (const actionType of Object.keys(rule.actions)) {
      const parameters = { ...rule.actions[actionType] };
      
      // Replace variable references in parameters
      for (const [key, value] of Object.entries(parameters)) {
        if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
          const varName = value.substring(2, value.length - 1);
          const varPath = varName.split('.');
          
          // Get variable value from context
          let varValue = context;
          for (const path of varPath) {
            if (varValue === undefined || varValue === null) {
              break;
            }
            varValue = varValue[path];
          }
          
          parameters[key] = varValue !== undefined ? varValue : value;
        }
      }
      
      actions.push({
        type: actionType,
        parameters
      });
    }
    
    return actions;
  }
}

// Create singleton instance
export const securityRuleCompiler = new SecurityRuleCompiler();

// Export default for convenience
export default securityRuleCompiler;