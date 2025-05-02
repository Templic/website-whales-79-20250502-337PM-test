/**
 * Security Rules Middleware
 * 
 * This middleware evaluates security rules for incoming requests
 * using the rule evaluation service.
 */

import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

import { ruleEvaluationService, RuleType, RuleStatus } from '../services';
import { ContextPreparationType } from '../services/RuleEvaluationService';

/**
 * Security rules middleware options
 */
export interface SecurityRulesMiddlewareOptions {
  // Rule types to evaluate
  ruleTypes?: RuleType[];
  
  // Rule status to include
  ruleStatus?: RuleStatus;
  
  // Default action if no rules match
  defaultAction?: 'allow' | 'deny';
  
  // Whether to skip evaluation for certain paths
  excludePaths?: string[];
  
  // Whether to only evaluate for certain paths
  includePaths?: string[];
  
  // Cache results to improve performance
  cacheResults?: boolean;
  
  // Cache TTL in ms
  cacheTtl?: number;
  
  // Whether to log results
  logResults?: boolean;
  
  // Custom response handler for denied requests
  denyHandler?: (req: Request, res: Response, result: any) => void;
}

/**
 * Default middleware options
 */
const defaultOptions: SecurityRulesMiddlewareOptions = {
  ruleTypes: [
    RuleType.ACCESS_CONTROL,
    RuleType.RATE_LIMIT,
    RuleType.INPUT_VALIDATION,
    RuleType.THREAT_DETECTION
  ],
  ruleStatus: RuleStatus.ACTIVE,
  defaultAction: 'allow',
  excludePaths: [
    '/health',
    '/metrics',
    '/_next',
    '/static',
    '/api/health',
    '/api/metrics',
    '/favicon.ico'
  ],
  cacheResults: true,
  cacheTtl: 30 * 1000, // 30 seconds
  logResults: false
};

/**
 * Create security rules middleware
 * 
 * This middleware evaluates security rules for incoming requests.
 * 
 * @param options Middleware options
 * @returns Express middleware function
 */
export function createSecurityRulesMiddleware(
  options: SecurityRulesMiddlewareOptions = {}
) {
  // Merge options with defaults
  const middlewareOptions = {
    ...defaultOptions,
    ...options,
    excludePaths: [
      ...(defaultOptions.excludePaths || []),
      ...(options.excludePaths || [])
    ]
  };
  
  console.log(chalk.blue('[SecurityRulesMiddleware] Initialized with options:'), {
    ruleTypes: middlewareOptions.ruleTypes,
    defaultAction: middlewareOptions.defaultAction,
    cacheResults: middlewareOptions.cacheResults
  });
  
  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip excluded paths
      if (
        middlewareOptions.excludePaths && 
        middlewareOptions.excludePaths.some(path => 
          req.path === path || 
          req.path.startsWith(path + '/'))
      ) {
        return next();
      }
      
      // Skip if not included in includePaths (if specified)
      if (
        middlewareOptions.includePaths && 
        !middlewareOptions.includePaths.some(path => 
          req.path === path || 
          req.path.startsWith(path + '/'))
      ) {
        return next();
      }
      
      // Prepare context
      const context = {
        req,
        res,
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development'
      };
      
      // Evaluate rules
      const result = await ruleEvaluationService.evaluateRules(context, {
        ruleTypes: middlewareOptions.ruleTypes,
        ruleStatus: middlewareOptions.ruleStatus,
        defaultAction: middlewareOptions.defaultAction as 'allow' | 'deny',
        contextPreparationType: ContextPreparationType.REQUEST,
        cacheResult: middlewareOptions.cacheResults,
        cacheTtl: middlewareOptions.cacheTtl,
        evaluationOptions: {
          debug: middlewareOptions.logResults
        }
      });
      
      // Add result to request for downstream middleware
      req.securityRulesResult = result;
      
      // Process actions (e.g., set headers, add logs)
      for (const action of result.actions) {
        processAction(action, req, res);
      }
      
      // Log if enabled
      if (middlewareOptions.logResults) {
        console.log(chalk.blue(`[SecurityRulesMiddleware] ${req.method} ${req.path}`), {
          allowed: result.allowed,
          evaluatedRules: result.evaluatedRules,
          timing: result.timing
        });
      }
      
      // If allowed, continue to next middleware
      if (result.allowed) {
        return next();
      }
      
      // If not allowed and custom deny handler exists, use it
      if (middlewareOptions.denyHandler) {
        return middlewareOptions.denyHandler(req, res, result);
      }
      
      // Default deny response
      return res.status(403).json({
        error: 'Access denied by security rules',
        code: 'SECURITY_RULES_DENIED'
      });
      
    } catch (error) {
      console.error(chalk.red('[SecurityRulesMiddleware] Error:'), error);
      
      // Continue to next middleware in case of error
      return next();
    }
  };
}

/**
 * Process an action from rule evaluation
 * 
 * @param action The action to process
 * @param req The request object
 * @param res The response object
 */
function processAction(
  action: {
    type: string;
    parameters: Record<string, any>;
    source: string;
  },
  req: Request,
  res: Response
): void {
  // Process based on action type
  switch (action.type) {
    case 'set-header':
      // Set response header
      if (action.parameters.name && action.parameters.value) {
        res.setHeader(action.parameters.name, action.parameters.value);
      }
      break;
      
    case 'log':
      // Log message
      const level = action.parameters.level || 'info';
      const message = action.parameters.message || 'Security rule triggered';
      
      console[level](
        chalk.blue(`[SecurityRulesMiddleware:${action.source}] ${message}`),
        action.parameters.data || {}
      );
      break;
      
    case 'sanitize':
      // Sanitize request data (basic implementation)
      if (action.parameters.fields && Array.isArray(action.parameters.fields)) {
        for (const field of action.parameters.fields) {
          // Simple sanitization - remove script tags
          if (req.body && field.startsWith('request.body.')) {
            const bodyField = field.replace('request.body.', '');
            if (typeof req.body[bodyField] === 'string') {
              req.body[bodyField] = req.body[bodyField]
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, 'removed:');
            }
          }
        }
      }
      break;
      
    case 'block':
    case 'deny':
      // These are handled by the main middleware
      break;
      
    default:
      // Unknown action type
      console.warn(chalk.yellow(
        `[SecurityRulesMiddleware] Unknown action type: ${action.type}`
      ));
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      securityRulesResult?: any;
    }
  }
}

// Export default
export default createSecurityRulesMiddleware;