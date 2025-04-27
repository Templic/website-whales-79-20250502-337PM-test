/**
 * SQL Injection Prevention Module
 * 
 * This module provides advanced protection against SQL injection attacks
 * by analyzing and sanitizing queries before execution and detecting
 * potential attacks at runtime.
 */

import { SecurityFabric } from '../SecurityFabric';
import { SecurityEventTypes } from '../blockchain/SecurityEventTypes';

/**
 * Types of SQL injection patterns to detect
 */
export enum SQLInjectionPatternType {
  // Basic SQL injection patterns
  UNION_BASED = 'union_based',
  ERROR_BASED = 'error_based',
  BOOLEAN_BASED = 'boolean_based',
  TIME_BASED = 'time_based',
  STACKED_QUERIES = 'stacked_queries',
  
  // Advanced SQL injection patterns
  COMMENT_EXPLOITATION = 'comment_exploitation',
  FUNCTION_EXPLOITATION = 'function_exploitation',
  TYPE_CONVERSION = 'type_conversion',
  OBFUSCATION = 'obfuscation',
  OPERATOR_ABUSE = 'operator_abuse'
}

/**
 * SQL injection detection pattern
 */
interface SQLInjectionPattern {
  /**
   * Pattern type
   */
  type: SQLInjectionPatternType;
  
  /**
   * Pattern name for identification
   */
  name: string;
  
  /**
   * Regular expression to match the pattern
   */
  regex: RegExp;
  
  /**
   * Pattern description
   */
  description: string;
  
  /**
   * Risk level of this pattern
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * SQL query analysis result
 */
export interface SQLAnalysisResult {
  /**
   * Original query
   */
  originalQuery: string;
  
  /**
   * Parameters used in the query
   */
  parameters: unknown[];
  
  /**
   * Whether the query is safe
   */
  isSafe: boolean;
  
  /**
   * Detected injection patterns
   */
  detectedPatterns: Array<{
    /**
     * Pattern that was detected
     */
    pattern: SQLInjectionPattern;
    
    /**
     * Matched text in the query
     */
    match: string;
    
    /**
     * Position in the query where the pattern was detected
     */
    position: number;
  }>;
  
  /**
   * Analysis timestamp
   */
  timestamp: Date;
  
  /**
   * Query hash for identification
   */
  queryHash: string;
}

/**
 * SQL injection prevention options
 */
export interface SQLInjectionPreventionOptions {
  /**
   * Whether to block queries with detected injection patterns
   */
  blockDetectedInjections?: boolean;
  
  /**
   * Whether to log all analyzed queries
   */
  logAllQueries?: boolean;
  
  /**
   * Maximum query length to analyze
   */
  maxQueryLength?: number;
  
  /**
   * Whitelist of approved query patterns
   */
  queryWhitelist?: Array<{
    /**
     * Query pattern (can be a regular expression)
     */
    pattern: string | RegExp;
    
    /**
     * Description of the approved query pattern
     */
    description: string;
  }>;
}

/**
 * Default options for SQL injection prevention
 */
const DEFAULT_OPTIONS: SQLInjectionPreventionOptions = {
  blockDetectedInjections: true,
  logAllQueries: false,
  maxQueryLength: 10000,
  queryWhitelist: []
};

/**
 * SQL injection prevention patterns
 */
const SQL_INJECTION_PATTERNS: SQLInjectionPattern[] = [
  // UNION-based injections
  {
    type: SQLInjectionPatternType.UNION_BASED,
    name: 'basic_union_select',
    regex: /\bunion\s+(?:all\s+)?select\b/i,
    description: 'Basic UNION SELECT injection attempt',
    riskLevel: 'critical'
  },
  {
    type: SQLInjectionPatternType.UNION_BASED,
    name: 'union_select_with_comments',
    regex: /\bunion\s*?\/\*.*?\*\/\s*?(?:all\s*?\/\*.*?\*\/)?\s*?select\b/i,
    description: 'UNION SELECT with comment obfuscation',
    riskLevel: 'critical'
  },
  
  // Error-based injections
  {
    type: SQLInjectionPatternType.ERROR_BASED,
    name: 'error_based_extraction',
    regex: /\b(?:updatexml|extractvalue|floor\s*?\(.*?rand\s*?\(.*?\).*?\))/i,
    description: 'Error-based data extraction attempt',
    riskLevel: 'critical'
  },
  
  // Boolean-based injections
  {
    type: SQLInjectionPatternType.BOOLEAN_BASED,
    name: 'boolean_condition',
    regex: /\band\s+(?:1=1|1=2|true|false)\b/i,
    description: 'Boolean-based blind injection condition',
    riskLevel: 'high'
  },
  {
    type: SQLInjectionPatternType.BOOLEAN_BASED,
    name: 'boolean_subquery',
    regex: /\band\s+\(\s*?select\s+/i,
    description: 'Boolean-based subquery injection',
    riskLevel: 'high'
  },
  
  // Time-based injections
  {
    type: SQLInjectionPatternType.TIME_BASED,
    name: 'sleep_function',
    regex: /\b(?:sleep\s*?\(\s*?\d+\s*?\)|pg_sleep\s*?\(\s*?\d+\s*?\)|waitfor\s+delay\s+'\d+:\d+:\d+')/i,
    description: 'Time-based blind injection using sleep',
    riskLevel: 'critical'
  },
  {
    type: SQLInjectionPatternType.TIME_BASED,
    name: 'benchmark_function',
    regex: /\bbenchmark\s*?\(\s*?\d+\s*?,\s*?[^)]+\)/i,
    description: 'Time-based blind injection using benchmark',
    riskLevel: 'critical'
  },
  
  // Stacked queries
  {
    type: SQLInjectionPatternType.STACKED_QUERIES,
    name: 'multiple_statements',
    regex: /;\s*?(?:drop|delete|update|insert|alter|create)\s+/i,
    description: 'Multiple SQL statements with dangerous command',
    riskLevel: 'critical'
  },
  
  // Comment exploitation
  {
    type: SQLInjectionPatternType.COMMENT_EXPLOITATION,
    name: 'comment_termination',
    regex: /\-\-\s*?(?:$|[#;])/,
    description: 'SQL comment exploitation to terminate query',
    riskLevel: 'high'
  },
  {
    type: SQLInjectionPatternType.COMMENT_EXPLOITATION,
    name: 'comment_in_identifier',
    regex: /\/\*!?\d*?\s*?(?:union|select|join|from)\s*?\*\//i,
    description: 'SQL comment exploitation in identifier',
    riskLevel: 'high'
  },
  
  // Function exploitation
  {
    type: SQLInjectionPatternType.FUNCTION_EXPLOITATION,
    name: 'dangerous_functions',
    regex: /\b(?:load_file|into\s+outfile|into\s+dumpfile)\b/i,
    description: 'Dangerous SQL function usage',
    riskLevel: 'critical'
  },
  
  // Type conversion
  {
    type: SQLInjectionPatternType.TYPE_CONVERSION,
    name: 'type_conversion',
    regex: /\b(?:cast|convert)\s*?\(/i,
    description: 'Type conversion usage (may be legitimate but common in injections)',
    riskLevel: 'medium'
  },
  
  // Obfuscation techniques
  {
    type: SQLInjectionPatternType.OBFUSCATION,
    name: 'hex_encoding',
    regex: /\b(?:0x[0-9a-f]{2,})/i,
    description: 'Hexadecimal encoded string (may be legitimate but common in injections)',
    riskLevel: 'medium'
  },
  {
    type: SQLInjectionPatternType.OBFUSCATION,
    name: 'char_function',
    regex: /\bchar\s*?\(\s*?\d+(?:\s*?,\s*?\d+)*\s*?\)/i,
    description: 'CHAR function usage for obfuscation',
    riskLevel: 'high'
  },
  
  // Operator abuse
  {
    type: SQLInjectionPatternType.OPERATOR_ABUSE,
    name: 'conditional_operators',
    regex: /\bif\s*?\(\s*?.*?\s*?,\s*?.*?\s*?,\s*?.*?\s*?\)/i,
    description: 'Conditional operator usage (may be legitimate but common in injections)',
    riskLevel: 'medium'
  }
];

/**
 * Calculates a hash for a query string
 */
function calculateQueryHash(query: string, parameters: unknown[]): string {
  // In a real implementation, we would use a proper hash function
  // For simplicity, we'll use a basic string manipulation
  const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();
  const paramString = parameters.map(p => String(p)).join(',');
  return Buffer.from(`${normalized}|${paramString}`).toString('base64').substring(0, 16);
}

/**
 * SQL Injection Prevention
 */
export class SQLInjectionPrevention {
  private options: SQLInjectionPreventionOptions;
  private queryWhitelistRegexes: RegExp[] = [];
  
  /**
   * Create a new SQL injection prevention instance
   */
  constructor(options: SQLInjectionPreventionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Compile whitelist patterns
    if (this.options.queryWhitelist && this.options.queryWhitelist.length > 0) {
      for (const whitelist of this.options.queryWhitelist) {
        if (typeof whitelist.pattern === 'string') {
          // Convert string pattern to regex with exact match
          this.queryWhitelistRegexes.push(new RegExp(`^${whitelist.pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'));
        } else {
          this.queryWhitelistRegexes.push(whitelist.pattern);
        }
      }
    }
    
    console.log(`[SQLInjectionPrevention] Initialized with ${SQL_INJECTION_PATTERNS.length} detection patterns and ${this.queryWhitelistRegexes.length} whitelist patterns`);
  }
  
  /**
   * Analyze a SQL query for potential injection attacks
   */
  public analyzeQuery(query: string, parameters: unknown[] = []): SQLAnalysisResult {
    // Calculate query hash
    const queryHash = calculateQueryHash(query, parameters);
    
    // Initialize result
    const result: SQLAnalysisResult = {
      originalQuery: query,
      parameters,
      isSafe: true,
      detectedPatterns: [],
      timestamp: new Date(),
      queryHash
    };
    
    // Skip analysis if query is too long
    if (query.length > (this.options.maxQueryLength || DEFAULT_OPTIONS.maxQueryLength!)) {
      console.warn(`[SQLInjectionPrevention] Query exceeds maximum length (${query.length} chars), skipping analysis`);
      return result;
    }
    
    // Check if query matches whitelist
    for (const regex of this.queryWhitelistRegexes) {
      if (regex.test(query)) {
        // Query is whitelisted, consider it safe
        if (this.options.logAllQueries) {
          console.log(`[SQLInjectionPrevention] Query matched whitelist: ${queryHash}`);
        }
        return result;
      }
    }
    
    // Check query against injection patterns
    for (const pattern of SQL_INJECTION_PATTERNS) {
      const match = query.match(pattern.regex);
      if (match) {
        const matchText = match[0];
        const position = match.index || 0;
        
        // Add to detected patterns
        result.detectedPatterns.push({
          pattern,
          match: matchText,
          position
        });
        
        // Mark query as unsafe if any critical or high risk pattern is detected
        if (pattern.riskLevel === 'critical' || pattern.riskLevel === 'high') {
          result.isSafe = false;
        }
      }
    }
    
    // Log analysis result
    if (!result.isSafe || this.options.logAllQueries) {
      if (!result.isSafe) {
        console.warn(`[SQLInjectionPrevention] Potentially malicious query detected: ${queryHash}`);
        for (const detected of result.detectedPatterns) {
          console.warn(`[SQLInjectionPrevention] - ${detected.pattern.name} (${detected.pattern.riskLevel}): ${detected.match}`);
        }
      } else if (this.options.logAllQueries) {
        console.log(`[SQLInjectionPrevention] Query analyzed and deemed safe: ${queryHash}`);
      }
    }
    
    return result;
  }
  
  /**
   * Check if a query should be blocked based on analysis result
   */
  public shouldBlockQuery(result: SQLAnalysisResult): boolean {
    if (!this.options.blockDetectedInjections) {
      return false;
    }
    
    // Block if query is not safe and blocking is enabled
    return !result.isSafe;
  }
  
  /**
   * Add a query pattern to the whitelist
   */
  public addToWhitelist(pattern: string | RegExp, description: string): void {
    if (!this.options.queryWhitelist) {
      this.options.queryWhitelist = [];
    }
    
    this.options.queryWhitelist.push({ pattern, description });
    
    // Add to compiled regexes
    if (typeof pattern === 'string') {
      this.queryWhitelistRegexes.push(new RegExp(`^${pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'));
    } else {
      this.queryWhitelistRegexes.push(pattern);
    }
    
    console.log(`[SQLInjectionPrevention] Added pattern to whitelist: ${description}`);
  }
  
  /**
   * Update options
   */
  public updateOptions(options: Partial<SQLInjectionPreventionOptions>): void {
    this.options = { ...this.options, ...options };
    console.log('[SQLInjectionPrevention] Updated options');
  }
}

/**
 * Database query protection middleware factory
 */
export function createDatabaseProtectionMiddleware() {
  const sqlInjectionPrevention = new SQLInjectionPrevention({
    blockDetectedInjections: true,
    logAllQueries: false
  });
  
  // Add common ORM-generated queries to whitelist
  sqlInjectionPrevention.addToWhitelist('SELECT * FROM "users" WHERE "users"."id" = $1', 'User lookup by ID');
  sqlInjectionPrevention.addToWhitelist('SELECT * FROM "users" WHERE "users"."username" = $1', 'User lookup by username');
  sqlInjectionPrevention.addToWhitelist('INSERT INTO "users" (.*) VALUES (.*) RETURNING *', 'User insertion');
  sqlInjectionPrevention.addToWhitelist('UPDATE "users" SET (.*) WHERE "users"."id" = $1 RETURNING *', 'User update');
  
  /**
   * Middleware function to protect SQL queries
   */
  return (query: string, parameters: unknown[] = [], context?: any) => {
    // Analyze the query
    const analysisResult = sqlInjectionPrevention.analyzeQuery(query, parameters);
    
    // Check if query should be blocked
    if (sqlInjectionPrevention.shouldBlockQuery(analysisResult)) {
      // Log the blocked query
      console.error(`[Database] Blocked potentially malicious query: ${query}`);
      
      // Log security event
      const eventData = {
        type: 'SQL_INJECTION_BLOCKED',
        query: analysisResult.queryHash,
        detectedPatterns: analysisResult.detectedPatterns.map(d => d.pattern.name),
        ip: context?.ip || 'unknown',
        userId: context?.userId || 'unknown',
        timestamp: new Date()
      };
      
      // Log with security fabric if available
      try {
        SecurityFabric.logEvent({
          type: SecurityEventTypes.SQL_INJECTION_ATTEMPT,
          severity: 'high',
          message: 'SQL injection attempt detected and blocked',
          attributes: eventData
        });
      } catch (error) {
        // Fall back to console logging
        console.error('[Database] SQL injection attempt:', eventData);
      }
      
      // Throw error to prevent query execution
      throw new Error('Potential SQL injection attack detected and blocked');
    }
    
    // Return the original query and parameters if safe
    return { query, parameters };
  };
}

/**
 * Create an instance of SQL injection prevention with default options
 */
export const sqlInjectionPrevention = new SQLInjectionPrevention({
  blockDetectedInjections: true,
  logAllQueries: process.env.NODE_ENV !== 'production'
});