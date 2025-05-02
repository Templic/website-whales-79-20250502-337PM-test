/**
 * Rule Evaluation Service
 * 
 * This service provides functionality to evaluate security rules against
 * various contexts like requests, users, and other application data.
 */

import chalk from 'chalk';
import { performance } from 'perf_hooks';

import { ruleCache, Rule, RuleType, RuleStatus } from '../rules';
import { RuleEvaluationOptions, RuleEvaluationResult } from '../rules/RuleCompiler';

/**
 * Context preparation type
 */
export enum ContextPreparationType {
  REQUEST = 'request',
  USER = 'user',
  CONTENT = 'content',
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

/**
 * Rule evaluation context
 */
export interface RuleEvaluationContext {
  [key: string]: any;
}

/**
 * Rule evaluation service result
 */
export interface RuleEvaluationServiceResult {
  // Overall result
  allowed: boolean;
  
  // Details about the rules that were evaluated
  evaluatedRules: {
    totalCount: number;
    allowedCount: number;
    deniedCount: number;
    failedCount: number;
  };
  
  // Time metrics
  timing: {
    totalTimeMs: number;
    preparationTimeMs: number;
    evaluationTimeMs: number;
    averageRuleTimeMs: number;
  };
  
  // Actions to be performed
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
    source: string;
  }>;
  
  // Individual rule results
  details?: Array<{
    rule: Rule;
    result: RuleEvaluationResult;
  }>;
}

/**
 * Rule evaluation options
 */
export interface RuleEvaluationServiceOptions {
  // Types of rules to evaluate
  ruleTypes?: RuleType[];
  
  // Status of rules to evaluate
  ruleStatus?: RuleStatus;
  
  // Only include rules matching these criteria
  include?: {
    ids?: string[];
    priority?: {
      min?: number;
      max?: number;
    };
    metadata?: Record<string, any>;
  };
  
  // Exclude rules matching these criteria
  exclude?: {
    ids?: string[];
  };
  
  // Default action if no rules match
  defaultAction?: 'allow' | 'deny';
  
  // Whether to include detailed results
  includeDetails?: boolean;
  
  // Options for rule evaluation
  evaluationOptions?: RuleEvaluationOptions;
  
  // Type of context to prepare
  contextPreparationType?: ContextPreparationType;
  
  // Cache result for frequent evaluations
  cacheResult?: boolean;
  
  // Cache TTL in ms
  cacheTtl?: number;
}

// Default options
const defaultOptions: RuleEvaluationServiceOptions = {
  ruleStatus: RuleStatus.ACTIVE,
  defaultAction: 'allow',
  includeDetails: false,
  evaluationOptions: {
    debug: false,
    trace: false
  },
  contextPreparationType: ContextPreparationType.REQUEST,
  cacheResult: false,
  cacheTtl: 60 * 1000 // 1 minute
};

/**
 * Rule evaluation service
 * 
 * Evaluates security rules against various contexts
 */
export class RuleEvaluationService {
  // Results cache
  private resultCache: Map<string, {
    result: RuleEvaluationServiceResult;
    expiresAt: number;
  }> = new Map();
  
  /**
   * Create a new rule evaluation service
   */
  constructor() {}
  
  /**
   * Evaluate rules against a context
   * 
   * @param context The context to evaluate against
   * @param options Evaluation options
   * @returns Promise resolving to evaluation result
   */
  async evaluateRules(
    context: RuleEvaluationContext,
    options: RuleEvaluationServiceOptions = {}
  ): Promise<RuleEvaluationServiceResult> {
    const startTime = performance.now();
    
    // Merge options with defaults
    const evalOptions = {
      ...defaultOptions,
      ...options,
      evaluationOptions: {
        ...defaultOptions.evaluationOptions,
        ...options.evaluationOptions
      }
    };
    
    // Check cache if enabled
    if (evalOptions.cacheResult) {
      const cacheKey = this.generateCacheKey(context, evalOptions);
      const cachedResult = this.resultCache.get(cacheKey);
      
      if (cachedResult && cachedResult.expiresAt > Date.now()) {
        return cachedResult.result;
      }
    }
    
    try {
      // 1. Prepare the context
      const preparationStartTime = performance.now();
      const preparedContext = await this.prepareContext(
        context,
        evalOptions.contextPreparationType || ContextPreparationType.REQUEST
      );
      const preparationEndTime = performance.now();
      
      // 2. Get rules to evaluate
      const rules = await this.getRulesToEvaluate(evalOptions);
      
      // 3. Evaluate each rule
      const evaluationStartTime = performance.now();
      const ruleResults: Array<{ rule: Rule; result: RuleEvaluationResult }> = [];
      
      for (const rule of rules) {
        try {
          // Evaluate the rule
          const result = await this.evaluateRule(rule, preparedContext, evalOptions.evaluationOptions);
          
          // Store result
          ruleResults.push({ rule, result });
        } catch (error) {
          console.error(chalk.red(`[RuleEvaluationService] Error evaluating rule ${rule.id}:`), error);
          
          // Add failed rule result
          ruleResults.push({
            rule,
            result: {
              matched: false,
              actions: [],
              matchedConditions: [],
              evaluationTimeMs: 0,
              error: error.message
            }
          });
        }
      }
      
      const evaluationEndTime = performance.now();
      
      // 4. Process results
      const processedResult = this.processRuleResults(ruleResults, evalOptions);
      
      // 5. Add timing information
      const endTime = performance.now();
      
      processedResult.timing = {
        totalTimeMs: endTime - startTime,
        preparationTimeMs: preparationEndTime - preparationStartTime,
        evaluationTimeMs: evaluationEndTime - evaluationStartTime,
        averageRuleTimeMs: rules.length > 0 
          ? (evaluationEndTime - evaluationStartTime) / rules.length 
          : 0
      };
      
      // 6. Cache result if enabled
      if (evalOptions.cacheResult) {
        const cacheKey = this.generateCacheKey(context, evalOptions);
        this.resultCache.set(cacheKey, {
          result: processedResult,
          expiresAt: Date.now() + (evalOptions.cacheTtl || defaultOptions.cacheTtl!)
        });
      }
      
      return processedResult;
    } catch (error) {
      console.error(chalk.red('[RuleEvaluationService] Error evaluating rules:'), error);
      
      // Return fallback result
      return {
        allowed: evalOptions.defaultAction === 'allow',
        evaluatedRules: {
          totalCount: 0,
          allowedCount: 0,
          deniedCount: 0,
          failedCount: 0
        },
        timing: {
          totalTimeMs: performance.now() - startTime,
          preparationTimeMs: 0,
          evaluationTimeMs: 0,
          averageRuleTimeMs: 0
        },
        actions: [],
        error: error.message
      };
    }
  }
  
  /**
   * Clear the result cache
   */
  clearCache(): void {
    this.resultCache.clear();
  }
  
  /**
   * Get the number of cached results
   * 
   * @returns Number of cached results
   */
  getCacheSize(): number {
    return this.resultCache.size;
  }
  
  /**
   * Prepare the context for rule evaluation
   * 
   * @param context The raw context
   * @param type The type of context to prepare
   * @returns Prepared context
   * @private
   */
  private async prepareContext(
    context: RuleEvaluationContext,
    type: ContextPreparationType
  ): Promise<RuleEvaluationContext> {
    // Create a new context to avoid modifying the original
    const preparedContext = { ...context };
    
    // Add standard properties based on type
    switch (type) {
      case ContextPreparationType.REQUEST:
        preparedContext.timestamp = Date.now();
        preparedContext.environment = process.env.NODE_ENV || 'development';
        
        // Extract request information if available
        if (context.req) {
          preparedContext.request = preparedContext.request || {};
          preparedContext.request.method = context.req.method;
          preparedContext.request.path = context.req.path || context.req.url;
          preparedContext.request.query = context.req.query;
          preparedContext.request.body = context.req.body;
          preparedContext.request.ip = 
            context.req.ip || 
            context.req.headers['x-forwarded-for'] || 
            'unknown';
          preparedContext.request.headers = context.req.headers;
        }
        
        // Extract user information if available
        if (context.req && context.req.user) {
          preparedContext.user = preparedContext.user || {};
          preparedContext.user.id = context.req.user.id;
          preparedContext.user.role = context.req.user.role;
          preparedContext.user.permissions = context.req.user.permissions;
        }
        break;
        
      case ContextPreparationType.USER:
        preparedContext.timestamp = Date.now();
        preparedContext.environment = process.env.NODE_ENV || 'development';
        
        // Ensure user object exists
        preparedContext.user = preparedContext.user || context.user || {};
        break;
        
      case ContextPreparationType.CONTENT:
        preparedContext.timestamp = Date.now();
        preparedContext.environment = process.env.NODE_ENV || 'development';
        
        // Ensure content object exists
        preparedContext.content = preparedContext.content || context.content || {};
        break;
        
      case ContextPreparationType.SYSTEM:
        preparedContext.timestamp = Date.now();
        preparedContext.environment = process.env.NODE_ENV || 'development';
        preparedContext.system = {
          hostname: require('os').hostname(),
          platform: process.platform,
          nodeVersion: process.version,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        };
        break;
        
      case ContextPreparationType.CUSTOM:
        // Don't modify the context for custom type
        break;
    }
    
    return preparedContext;
  }
  
  /**
   * Get rules to evaluate based on options
   * 
   * @param options Evaluation options
   * @returns Promise resolving to array of rules
   * @private
   */
  private async getRulesToEvaluate(
    options: RuleEvaluationServiceOptions
  ): Promise<Rule[]> {
    let rules: Rule[] = [];
    
    // Get rules by type if specified
    if (options.ruleTypes && options.ruleTypes.length > 0) {
      for (const type of options.ruleTypes) {
        const typeRules = await ruleCache.getRulesByType(type, {
          status: options.ruleStatus
        });
        rules = [...rules, ...typeRules];
      }
    } else {
      // Get all active rules
      rules = await ruleCache.getAllRules({
        status: options.ruleStatus
      });
    }
    
    // Apply inclusion filters
    if (options.include) {
      if (options.include.ids && options.include.ids.length > 0) {
        rules = rules.filter(rule => options.include!.ids!.includes(rule.id));
      }
      
      if (options.include.priority) {
        if (options.include.priority.min !== undefined) {
          rules = rules.filter(rule => rule.priority >= options.include!.priority!.min!);
        }
        
        if (options.include.priority.max !== undefined) {
          rules = rules.filter(rule => rule.priority <= options.include!.priority!.max!);
        }
      }
      
      if (options.include.metadata) {
        for (const [key, value] of Object.entries(options.include.metadata)) {
          rules = rules.filter(rule => rule.metadata[key] === value);
        }
      }
    }
    
    // Apply exclusion filters
    if (options.exclude) {
      if (options.exclude.ids && options.exclude.ids.length > 0) {
        rules = rules.filter(rule => !options.exclude!.ids!.includes(rule.id));
      }
    }
    
    // Sort rules by priority (higher priority first)
    rules.sort((a, b) => b.priority - a.priority);
    
    return rules;
  }
  
  /**
   * Evaluate a single rule
   * 
   * @param rule The rule to evaluate
   * @param context The context to evaluate against
   * @param options Evaluation options
   * @returns Promise resolving to evaluation result
   * @private
   */
  private async evaluateRule(
    rule: Rule,
    context: RuleEvaluationContext,
    options?: RuleEvaluationOptions
  ): Promise<RuleEvaluationResult> {
    // Ensure rule is compiled
    if (!rule.compiled) {
      // Get a fresh copy of the rule with compilation
      rule = await ruleCache.getRule(rule.id, { compile: true }) || rule;
    }
    
    // If still no compiled function, return no match
    if (!rule.compiled) {
      return {
        matched: false,
        actions: [],
        matchedConditions: [],
        evaluationTimeMs: 0,
        error: 'Rule has no compiled function'
      };
    }
    
    // Evaluate the rule
    return rule.compiled(context, options);
  }
  
  /**
   * Process rule evaluation results
   * 
   * @param ruleResults Array of rule results
   * @param options Evaluation options
   * @returns Processed result
   * @private
   */
  private processRuleResults(
    ruleResults: Array<{ rule: Rule; result: RuleEvaluationResult }>,
    options: RuleEvaluationServiceOptions
  ): RuleEvaluationServiceResult {
    // Count statistics
    const totalCount = ruleResults.length;
    const matchedResults = ruleResults.filter(r => r.result.matched);
    const failedResults = ruleResults.filter(r => r.result.error);
    
    const allowedCount = matchedResults.length;
    const deniedCount = totalCount - allowedCount - failedResults.length;
    const failedCount = failedResults.length;
    
    // Determine if allowed based on matched rules and default action
    const allowed = matchedResults.length > 0 
      ? true 
      : options.defaultAction === 'allow';
    
    // Collect actions
    const actions: RuleEvaluationServiceResult['actions'] = [];
    
    for (const { rule, result } of ruleResults) {
      if (result.matched) {
        for (const action of result.actions) {
          actions.push({
            ...action,
            source: rule.id
          });
        }
      }
    }
    
    // Build result
    const serviceResult: RuleEvaluationServiceResult = {
      allowed,
      evaluatedRules: {
        totalCount,
        allowedCount,
        deniedCount,
        failedCount
      },
      timing: {
        totalTimeMs: 0, // Will be filled in by caller
        preparationTimeMs: 0, // Will be filled in by caller
        evaluationTimeMs: 0, // Will be filled in by caller
        averageRuleTimeMs: 0 // Will be filled in by caller
      },
      actions
    };
    
    // Include details if requested
    if (options.includeDetails) {
      serviceResult.details = ruleResults;
    }
    
    return serviceResult;
  }
  
  /**
   * Generate a cache key for a context and options
   * 
   * @param context The context
   * @param options The options
   * @returns Cache key
   * @private
   */
  private generateCacheKey(
    context: RuleEvaluationContext,
    options: RuleEvaluationServiceOptions
  ): string {
    // Create a simple hash of the context
    const contextHash = this.simpleHash(JSON.stringify({
      context: this.pruneContext(context),
      options: {
        ruleTypes: options.ruleTypes,
        ruleStatus: options.ruleStatus,
        include: options.include,
        exclude: options.exclude,
        defaultAction: options.defaultAction
      }
    }));
    
    return `rule-eval:${contextHash}`;
  }
  
  /**
   * Prune a context to only include relevant parts for caching
   * 
   * @param context The context to prune
   * @returns Pruned context
   * @private
   */
  private pruneContext(context: RuleEvaluationContext): any {
    // Create a simpler version of the context for caching
    const pruned: any = {};
    
    // Include only the most relevant parts
    if (context.request) {
      pruned.request = {
        method: context.request.method,
        path: context.request.path,
        ip: context.request.ip
      };
    }
    
    if (context.user) {
      pruned.user = {
        id: context.user.id,
        role: context.user.role
      };
    }
    
    if (context.content) {
      pruned.content = {
        id: context.content.id,
        type: context.content.type
      };
    }
    
    return pruned;
  }
  
  /**
   * Create a simple hash for a string
   * 
   * @param str The string to hash
   * @returns Hashed string
   * @private
   */
  private simpleHash(str: string): string {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(36);
  }
}

// Create singleton instance
export const ruleEvaluationService = new RuleEvaluationService();

// Export default for convenience
export default ruleEvaluationService;