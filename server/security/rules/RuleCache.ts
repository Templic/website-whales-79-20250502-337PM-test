/**
 * Rule Cache
 * 
 * This module implements a sophisticated multi-level caching system for security rules
 * to reduce database load and improve performance.
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';
import LRUCache from 'lru-cache';

/**
 * Cache store type
 */
export enum CacheStoreType {
  MEMORY = 'memory',
  PERSISTENT = 'persistent'
}

/**
 * Cache tier
 */
export enum CacheTier {
  L1 = 'l1', // Primary in-memory cache
  L2 = 'l2'  // Secondary persistent cache
}

/**
 * Rule type
 */
export enum RuleType {
  ACCESS_CONTROL = 'access_control',
  RATE_LIMIT = 'rate_limit',
  INPUT_VALIDATION = 'input_validation',
  THREAT_DETECTION = 'threat_detection',
  DATA_PROTECTION = 'data_protection',
  AUTHENTICATION = 'authentication'
}

/**
 * Rule status
 */
export enum RuleStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

/**
 * Rule object
 */
export interface Rule {
  id: string;
  type: RuleType;
  name: string;
  description: string;
  pattern: string;
  status: RuleStatus;
  priority: number;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  compiled?: any;
}

/**
 * Rule dependency
 */
export interface RuleDependency {
  ruleId: string;
  dependsOnRuleId: string;
  type: 'required' | 'optional' | 'conflicts';
}

/**
 * Rule compile options
 */
export interface RuleCompileOptions {
  optimize?: boolean;
  validateDependencies?: boolean;
  validatePattern?: boolean;
}

/**
 * Rule cache options
 */
export interface RuleCacheOptions {
  // L1 (memory) cache options
  l1Cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    updateAgeOnGet: boolean;
  };
  
  // L2 (persistent) cache options
  l2Cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  
  // Rule compile options
  compileOptions: RuleCompileOptions;
  
  // Whether to track dependencies
  trackDependencies: boolean;
  
  // Whether to precompile rules
  precompileRules: boolean;
  
  // Whether to validate rule patterns
  validatePatterns: boolean;
  
  // Auto refresh settings
  autoRefresh: {
    enabled: boolean;
    interval: number;
  };
}

/**
 * Cache statistics
 */
export interface CacheStats {
  // Hits by tier
  hits: {
    l1: number;
    l2: number;
    total: number;
  };
  
  // Misses by tier
  misses: {
    l1: number;
    l2: number;
    total: number;
  };
  
  // Set operations
  sets: {
    l1: number;
    l2: number;
    total: number;
  };
  
  // Delete operations
  deletes: number;
  
  // Rule compilations
  compilations: number;
  
  // Refresh operations
  refreshes: number;
  
  // Current cache size
  size: {
    l1: number;
    l2: number;
  };
  
  // Performance metrics
  performance: {
    averageGetTimeMs: number;
    averageSetTimeMs: number;
    averageCompileTimeMs: number;
  };
  
  // Individual rule stats
  ruleStats: Record<string, {
    hits: number;
    compilations: number;
    averageEvalTimeMs: number;
  }>;
}

/**
 * Default cache options
 */
const defaultOptions: RuleCacheOptions = {
  l1Cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 60 * 60 * 1000, // 1 hour
    updateAgeOnGet: true
  },
  l2Cache: {
    enabled: true,
    maxSize: 10000,
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  },
  compileOptions: {
    optimize: true,
    validateDependencies: true,
    validatePattern: true
  },
  trackDependencies: true,
  precompileRules: true,
  validatePatterns: true,
  autoRefresh: {
    enabled: true,
    interval: 5 * 60 * 1000 // 5 minutes
  }
};

/**
 * RuleCompiler interface
 */
export interface RuleCompiler {
  compile(rule: Rule, options?: RuleCompileOptions): Promise<any>;
  isValidPattern(pattern: string): boolean;
}

/**
 * RuleProvider interface
 */
export interface RuleProvider {
  getRuleById(id: string): Promise<Rule | null>;
  getRulesByType(type: RuleType): Promise<Rule[]>;
  getAllRules(): Promise<Rule[]>;
  getRuleDependencies(ruleId: string): Promise<RuleDependency[]>;
  getRulesUpdatedSince(date: Date): Promise<Rule[]>;
}

/**
 * Rule Cache implements a multi-level caching system for security rules
 */
export class RuleCache extends EventEmitter {
  private options: RuleCacheOptions;
  private compiler: RuleCompiler;
  private provider: RuleProvider;
  
  // L1 memory cache
  private l1Cache: LRUCache<string, Rule>;
  
  // L2 persistent cache
  private l2Cache: Map<string, {
    rule: Rule;
    expiresAt: number;
  }>;
  
  // Compiled rules cache
  private compiledRulesCache: Map<string, {
    compiled: any;
    version: number;
    compiledAt: number;
  }> = new Map();
  
  // Dependencies tracking
  private dependencies: Map<string, Set<string>> = new Map();
  private reverseDependencies: Map<string, Set<string>> = new Map();
  
  // Auto refresh timer
  private refreshTimer: NodeJS.Timeout | null = null;
  
  // Last refresh timestamp
  private lastRefreshTime: number = 0;
  
  // Statistics
  private stats: CacheStats = {
    hits: {
      l1: 0,
      l2: 0,
      total: 0
    },
    misses: {
      l1: 0,
      l2: 0,
      total: 0
    },
    sets: {
      l1: 0,
      l2: 0,
      total: 0
    },
    deletes: 0,
    compilations: 0,
    refreshes: 0,
    size: {
      l1: 0,
      l2: 0
    },
    performance: {
      averageGetTimeMs: 0,
      averageSetTimeMs: 0,
      averageCompileTimeMs: 0
    },
    ruleStats: {}
  };
  
  // Performance tracking
  private getTimes: number[] = [];
  private setTimes: number[] = [];
  private compileTimes: number[] = [];
  
  /**
   * Create a new RuleCache
   * 
   * @param compiler The rule compiler
   * @param provider The rule provider
   * @param options Cache options
   */
  constructor(
    compiler: RuleCompiler,
    provider: RuleProvider,
    options: Partial<RuleCacheOptions> = {}
  ) {
    super();
    
    this.compiler = compiler;
    this.provider = provider;
    
    // Merge options with defaults
    this.options = {
      ...defaultOptions,
      ...options,
      l1Cache: {
        ...defaultOptions.l1Cache,
        ...options.l1Cache
      },
      l2Cache: {
        ...defaultOptions.l2Cache,
        ...options.l2Cache
      },
      compileOptions: {
        ...defaultOptions.compileOptions,
        ...options.compileOptions
      },
      autoRefresh: {
        ...defaultOptions.autoRefresh,
        ...options.autoRefresh
      }
    };
    
    // Create L1 cache
    this.l1Cache = new LRUCache<string, Rule>({
      max: this.options.l1Cache.maxSize,
      ttl: this.options.l1Cache.ttl,
      updateAgeOnGet: this.options.l1Cache.updateAgeOnGet,
      allowStale: false
    });
    
    // Create L2 cache
    this.l2Cache = new Map();
    
    // Log initialization
    console.log(chalk.blue('[RuleCache] Initialized with options:'), {
      l1CacheSize: this.options.l1Cache.maxSize,
      l2CacheEnabled: this.options.l2Cache.enabled,
      autoRefresh: this.options.autoRefresh.enabled
    });
    
    // Start auto refresh if enabled
    if (this.options.autoRefresh.enabled) {
      this.startAutoRefresh();
    }
  }
  
  /**
   * Get a rule by ID
   * 
   * @param id Rule ID
   * @param options Get options
   * @returns The rule or null if not found
   */
  async getRule(
    id: string,
    options: {
      forceFresh?: boolean;
      compile?: boolean;
    } = {}
  ): Promise<Rule | null> {
    const startTime = performance.now();
    
    // Default options
    const getOptions = {
      forceFresh: false,
      compile: true,
      ...options
    };
    
    // Track rule stats
    if (!this.stats.ruleStats[id]) {
      this.stats.ruleStats[id] = {
        hits: 0,
        compilations: 0,
        averageEvalTimeMs: 0
      };
    }
    
    // If force fresh, bypass cache
    if (getOptions.forceFresh) {
      try {
        const rule = await this.provider.getRuleById(id);
        
        if (rule) {
          // Update caches
          this.setRule(rule);
          
          // Compile if needed
          if (getOptions.compile) {
            rule.compiled = await this.getCompiledRule(rule);
          }
          
          // Update stats
          this.stats.ruleStats[id].hits++;
          
          return rule;
        }
        
        return null;
      } catch (error) {
        console.error(chalk.red(`[RuleCache] Error fetching rule ${id}:`), error);
        throw error;
      }
    }
    
    // Try L1 cache first
    if (this.options.l1Cache.enabled) {
      const l1Rule = this.l1Cache.get(id);
      
      if (l1Rule) {
        // L1 cache hit
        this.stats.hits.l1++;
        this.stats.hits.total++;
        this.stats.ruleStats[id].hits++;
        
        // Compile if needed
        if (getOptions.compile && !l1Rule.compiled) {
          l1Rule.compiled = await this.getCompiledRule(l1Rule);
        }
        
        const endTime = performance.now();
        this.trackGetTime(endTime - startTime);
        
        return l1Rule;
      }
      
      // L1 cache miss
      this.stats.misses.l1++;
    }
    
    // Try L2 cache
    if (this.options.l2Cache.enabled) {
      const l2Entry = this.l2Cache.get(id);
      
      if (l2Entry && l2Entry.expiresAt > Date.now()) {
        // L2 cache hit
        this.stats.hits.l2++;
        this.stats.hits.total++;
        this.stats.ruleStats[id].hits++;
        
        const rule = l2Entry.rule;
        
        // Promote to L1 cache
        if (this.options.l1Cache.enabled) {
          this.l1Cache.set(id, rule);
          this.stats.sets.l1++;
        }
        
        // Compile if needed
        if (getOptions.compile && !rule.compiled) {
          rule.compiled = await this.getCompiledRule(rule);
        }
        
        const endTime = performance.now();
        this.trackGetTime(endTime - startTime);
        
        return rule;
      }
      
      // L2 cache miss
      this.stats.misses.l2++;
    }
    
    // Cache miss, fetch from provider
    this.stats.misses.total++;
    
    try {
      const rule = await this.provider.getRuleById(id);
      
      if (rule) {
        // Update caches
        this.setRule(rule);
        
        // Compile if needed
        if (getOptions.compile) {
          rule.compiled = await this.getCompiledRule(rule);
        }
        
        // Update stats
        this.stats.ruleStats[id].hits++;
        
        const endTime = performance.now();
        this.trackGetTime(endTime - startTime);
        
        return rule;
      }
      
      const endTime = performance.now();
      this.trackGetTime(endTime - startTime);
      
      return null;
    } catch (error) {
      console.error(chalk.red(`[RuleCache] Error fetching rule ${id}:`), error);
      
      const endTime = performance.now();
      this.trackGetTime(endTime - startTime);
      
      throw error;
    }
  }
  
  /**
   * Get multiple rules by type
   * 
   * @param type Rule type
   * @param options Get options
   * @returns Array of rules
   */
  async getRulesByType(
    type: RuleType,
    options: {
      forceFresh?: boolean;
      compile?: boolean;
      status?: RuleStatus;
    } = {}
  ): Promise<Rule[]> {
    // Default options
    const getOptions = {
      forceFresh: false,
      compile: true,
      status: RuleStatus.ACTIVE,
      ...options
    };
    
    // If force fresh, bypass cache
    if (getOptions.forceFresh) {
      try {
        const rules = await this.provider.getRulesByType(type);
        
        // Filter by status if specified
        const filteredRules = getOptions.status 
          ? rules.filter(rule => rule.status === getOptions.status)
          : rules;
        
        // Update caches
        for (const rule of filteredRules) {
          this.setRule(rule);
          
          // Compile if needed
          if (getOptions.compile) {
            rule.compiled = await this.getCompiledRule(rule);
          }
        }
        
        return filteredRules;
      } catch (error) {
        console.error(chalk.red(`[RuleCache] Error fetching rules of type ${type}:`), error);
        throw error;
      }
    }
    
    // Try to get from provider
    try {
      const rules = await this.provider.getRulesByType(type);
      
      // Filter by status if specified
      const filteredRules = getOptions.status 
        ? rules.filter(rule => rule.status === getOptions.status)
        : rules;
      
      // Update caches
      for (const rule of filteredRules) {
        this.setRule(rule);
        
        // Compile if needed
        if (getOptions.compile && !rule.compiled) {
          rule.compiled = await this.getCompiledRule(rule);
        }
      }
      
      return filteredRules;
    } catch (error) {
      console.error(chalk.red(`[RuleCache] Error fetching rules of type ${type}:`), error);
      throw error;
    }
  }
  
  /**
   * Get all rules
   * 
   * @param options Get options
   * @returns Array of all rules
   */
  async getAllRules(
    options: {
      forceFresh?: boolean;
      compile?: boolean;
      status?: RuleStatus;
    } = {}
  ): Promise<Rule[]> {
    // Default options
    const getOptions = {
      forceFresh: false,
      compile: false, // Default to false for all rules as it could be expensive
      status: undefined as RuleStatus | undefined,
      ...options
    };
    
    try {
      // Always fetch all rules from provider for consistency
      const rules = await this.provider.getAllRules();
      
      // Filter by status if specified
      const filteredRules = getOptions.status 
        ? rules.filter(rule => rule.status === getOptions.status)
        : rules;
      
      // Update caches
      for (const rule of filteredRules) {
        this.setRule(rule);
        
        // Compile if needed (but be careful, this could be expensive)
        if (getOptions.compile && !rule.compiled) {
          rule.compiled = await this.getCompiledRule(rule);
        }
      }
      
      return filteredRules;
    } catch (error) {
      console.error(chalk.red('[RuleCache] Error fetching all rules:'), error);
      throw error;
    }
  }
  
  /**
   * Set a rule in the cache
   * 
   * @param rule The rule to set
   */
  setRule(rule: Rule): void {
    const startTime = performance.now();
    
    if (!rule || !rule.id) {
      return;
    }
    
    // Set in L1 cache
    if (this.options.l1Cache.enabled) {
      this.l1Cache.set(rule.id, rule);
      this.stats.sets.l1++;
    }
    
    // Set in L2 cache
    if (this.options.l2Cache.enabled) {
      this.l2Cache.set(rule.id, {
        rule,
        expiresAt: Date.now() + this.options.l2Cache.ttl
      });
      this.stats.sets.l2++;
    }
    
    this.stats.sets.total++;
    
    // Update cache sizes
    this.updateCacheSizeStats();
    
    // If tracking dependencies, update them
    if (this.options.trackDependencies) {
      this.updateDependencies(rule.id).catch(err => {
        console.error(chalk.red(`[RuleCache] Error updating dependencies for rule ${rule.id}:`), err);
      });
    }
    
    // If precompiling rules, do it
    if (this.options.precompileRules) {
      this.getCompiledRule(rule).catch(err => {
        console.error(chalk.red(`[RuleCache] Error precompiling rule ${rule.id}:`), err);
      });
    }
    
    const endTime = performance.now();
    this.trackSetTime(endTime - startTime);
    
    // Emit event
    this.emit('rule:set', rule);
  }
  
  /**
   * Delete a rule from the cache
   * 
   * @param id Rule ID
   */
  deleteRule(id: string): void {
    // Delete from L1 cache
    if (this.options.l1Cache.enabled) {
      this.l1Cache.delete(id);
    }
    
    // Delete from L2 cache
    if (this.options.l2Cache.enabled) {
      this.l2Cache.delete(id);
    }
    
    // Delete from compiled rules cache
    this.compiledRulesCache.delete(id);
    
    // Update cache sizes
    this.updateCacheSizeStats();
    
    this.stats.deletes++;
    
    // If tracking dependencies, invalidate dependent rules
    if (this.options.trackDependencies) {
      this.invalidateDependentRules(id);
    }
    
    // Emit event
    this.emit('rule:delete', id);
  }
  
  /**
   * Refresh the cache to update stale entries
   * 
   * @param options Refresh options
   */
  async refresh(
    options: {
      full?: boolean;
      types?: RuleType[];
      olderThan?: number;
    } = {}
  ): Promise<{
    refreshed: number;
    errors: number;
  }> {
    // Default options
    const refreshOptions = {
      full: false,
      types: undefined as RuleType[] | undefined,
      olderThan: undefined as number | undefined,
      ...options
    };
    
    console.log(chalk.blue('[RuleCache] Starting refresh:'), refreshOptions);
    
    // Track metrics
    this.stats.refreshes++;
    this.lastRefreshTime = Date.now();
    
    try {
      // Full refresh - get all rules
      if (refreshOptions.full) {
        try {
          const rules = await this.provider.getAllRules();
          
          // Filter by type if specified
          const filteredRules = refreshOptions.types 
            ? rules.filter(rule => refreshOptions.types!.includes(rule.type))
            : rules;
          
          // Update cache
          for (const rule of filteredRules) {
            this.setRule(rule);
          }
          
          // Update dependencies for all rules
          if (this.options.trackDependencies) {
            await this.updateAllDependencies();
          }
          
          console.log(chalk.green(`[RuleCache] Full refresh completed, updated ${filteredRules.length} rules`));
          
          // Emit event
          this.emit('refresh:complete', { full: true, count: filteredRules.length });
          
          return { refreshed: filteredRules.length, errors: 0 };
        } catch (error) {
          console.error(chalk.red('[RuleCache] Error during full refresh:'), error);
          
          // Emit event
          this.emit('refresh:error', { full: true, error });
          
          throw error;
        }
      }
      
      // Partial refresh - get rules updated since last refresh
      const cutoffDate = new Date(refreshOptions.olderThan || (Date.now() - 60 * 60 * 1000)); // Default to 1 hour
      
      try {
        const updatedRules = await this.provider.getRulesUpdatedSince(cutoffDate);
        
        // Filter by type if specified
        const filteredRules = refreshOptions.types 
          ? updatedRules.filter(rule => refreshOptions.types!.includes(rule.type))
          : updatedRules;
        
        // Update cache
        for (const rule of filteredRules) {
          this.setRule(rule);
          
          // If tracking dependencies, update them
          if (this.options.trackDependencies) {
            await this.updateDependencies(rule.id);
          }
        }
        
        console.log(chalk.green(`[RuleCache] Partial refresh completed, updated ${filteredRules.length} rules`));
        
        // Emit event
        this.emit('refresh:complete', { full: false, count: filteredRules.length });
        
        return { refreshed: filteredRules.length, errors: 0 };
      } catch (error) {
        console.error(chalk.red('[RuleCache] Error during partial refresh:'), error);
        
        // Emit event
        this.emit('refresh:error', { full: false, error });
        
        throw error;
      }
    } catch (error) {
      console.error(chalk.red('[RuleCache] Error during refresh:'), error);
      return { refreshed: 0, errors: 1 };
    }
  }
  
  /**
   * Clear the cache
   * 
   * @param options Clear options
   */
  clear(
    options: {
      l1?: boolean;
      l2?: boolean;
      compiled?: boolean;
      dependencies?: boolean;
    } = {}
  ): void {
    // Default options
    const clearOptions = {
      l1: true,
      l2: true,
      compiled: true,
      dependencies: true,
      ...options
    };
    
    // Clear L1 cache
    if (clearOptions.l1 && this.options.l1Cache.enabled) {
      this.l1Cache.clear();
    }
    
    // Clear L2 cache
    if (clearOptions.l2 && this.options.l2Cache.enabled) {
      this.l2Cache.clear();
    }
    
    // Clear compiled rules cache
    if (clearOptions.compiled) {
      this.compiledRulesCache.clear();
    }
    
    // Clear dependencies
    if (clearOptions.dependencies && this.options.trackDependencies) {
      this.dependencies.clear();
      this.reverseDependencies.clear();
    }
    
    // Update cache sizes
    this.updateCacheSizeStats();
    
    console.log(chalk.green('[RuleCache] Cache cleared:'), clearOptions);
    
    // Emit event
    this.emit('cache:clear', clearOptions);
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    // Update cache sizes
    this.updateCacheSizeStats();
    
    return { ...this.stats };
  }
  
  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: {
        l1: 0,
        l2: 0,
        total: 0
      },
      misses: {
        l1: 0,
        l2: 0,
        total: 0
      },
      sets: {
        l1: 0,
        l2: 0,
        total: 0
      },
      deletes: 0,
      compilations: 0,
      refreshes: 0,
      size: {
        l1: this.l1Cache.size,
        l2: this.l2Cache.size
      },
      performance: {
        averageGetTimeMs: 0,
        averageSetTimeMs: 0,
        averageCompileTimeMs: 0
      },
      ruleStats: {}
    };
    
    // Reset performance tracking arrays
    this.getTimes = [];
    this.setTimes = [];
    this.compileTimes = [];
  }
  
  /**
   * Start auto refresh
   */
  startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refresh().catch(err => {
        console.error(chalk.red('[RuleCache] Auto refresh error:'), err);
      });
    }, this.options.autoRefresh.interval);
    
    console.log(chalk.blue(`[RuleCache] Auto refresh started with interval ${this.options.autoRefresh.interval}ms`));
  }
  
  /**
   * Stop auto refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      
      console.log(chalk.blue('[RuleCache] Auto refresh stopped'));
    }
  }
  
  /**
   * Dispose the cache
   */
  dispose(): void {
    // Stop auto refresh
    this.stopAutoRefresh();
    
    // Clear the cache
    this.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    console.log(chalk.green('[RuleCache] Disposed'));
  }
  
  /**
   * Get a compiled rule
   * 
   * @param rule The rule to compile
   * @returns The compiled rule
   * @private
   */
  private async getCompiledRule(rule: Rule): Promise<any> {
    // Check if already compiled with current version
    const cachedCompiled = this.compiledRulesCache.get(rule.id);
    
    if (cachedCompiled && cachedCompiled.version === rule.version) {
      return cachedCompiled.compiled;
    }
    
    // Track compilation time
    const startTime = performance.now();
    
    try {
      // Compile the rule
      const compiled = await this.compiler.compile(rule, this.options.compileOptions);
      
      // Update compiled rules cache
      this.compiledRulesCache.set(rule.id, {
        compiled,
        version: rule.version,
        compiledAt: Date.now()
      });
      
      // Update stats
      this.stats.compilations++;
      if (this.stats.ruleStats[rule.id]) {
        this.stats.ruleStats[rule.id].compilations++;
      }
      
      const endTime = performance.now();
      this.trackCompileTime(endTime - startTime);
      
      return compiled;
    } catch (error) {
      console.error(chalk.red(`[RuleCache] Error compiling rule ${rule.id}:`), error);
      
      const endTime = performance.now();
      this.trackCompileTime(endTime - startTime);
      
      throw error;
    }
  }
  
  /**
   * Update rule dependencies
   * 
   * @param ruleId Rule ID
   * @private
   */
  private async updateDependencies(ruleId: string): Promise<void> {
    if (!this.options.trackDependencies) {
      return;
    }
    
    try {
      // Get dependencies
      const dependencies = await this.provider.getRuleDependencies(ruleId);
      
      // Create dependency set if it doesn't exist
      if (!this.dependencies.has(ruleId)) {
        this.dependencies.set(ruleId, new Set());
      }
      
      // Clear existing dependencies
      this.dependencies.get(ruleId)!.clear();
      
      // Add new dependencies
      for (const dependency of dependencies) {
        // Skip conflicts
        if (dependency.type === 'conflicts') {
          continue;
        }
        
        this.dependencies.get(ruleId)!.add(dependency.dependsOnRuleId);
        
        // Update reverse dependencies
        if (!this.reverseDependencies.has(dependency.dependsOnRuleId)) {
          this.reverseDependencies.set(dependency.dependsOnRuleId, new Set());
        }
        
        this.reverseDependencies.get(dependency.dependsOnRuleId)!.add(ruleId);
      }
    } catch (error) {
      console.error(chalk.red(`[RuleCache] Error updating dependencies for rule ${ruleId}:`), error);
      throw error;
    }
  }
  
  /**
   * Update all dependencies
   * 
   * @private
   */
  private async updateAllDependencies(): Promise<void> {
    if (!this.options.trackDependencies) {
      return;
    }
    
    try {
      // Clear existing dependencies
      this.dependencies.clear();
      this.reverseDependencies.clear();
      
      // Get all rules
      const rules = await this.provider.getAllRules();
      
      // Update dependencies for each rule
      for (const rule of rules) {
        await this.updateDependencies(rule.id);
      }
    } catch (error) {
      console.error(chalk.red('[RuleCache] Error updating all dependencies:'), error);
      throw error;
    }
  }
  
  /**
   * Invalidate dependent rules
   * 
   * @param ruleId Rule ID
   * @private
   */
  private invalidateDependentRules(ruleId: string): void {
    if (!this.options.trackDependencies) {
      return;
    }
    
    // Get reverse dependencies
    const dependentRules = this.reverseDependencies.get(ruleId);
    
    if (!dependentRules) {
      return;
    }
    
    // Invalidate each dependent rule
    for (const dependentRuleId of dependentRules) {
      // Delete from compiled rules cache
      this.compiledRulesCache.delete(dependentRuleId);
      
      // Emit event
      this.emit('rule:invalidate', dependentRuleId, ruleId);
      
      // Recursively invalidate dependent rules
      this.invalidateDependentRules(dependentRuleId);
    }
  }
  
  /**
   * Update cache size statistics
   * 
   * @private
   */
  private updateCacheSizeStats(): void {
    this.stats.size.l1 = this.options.l1Cache.enabled ? this.l1Cache.size : 0;
    this.stats.size.l2 = this.options.l2Cache.enabled ? this.l2Cache.size : 0;
  }
  
  /**
   * Track get time
   * 
   * @param time The time to track
   * @private
   */
  private trackGetTime(time: number): void {
    this.getTimes.push(time);
    
    if (this.getTimes.length > 100) {
      this.getTimes.shift();
    }
    
    this.stats.performance.averageGetTimeMs = this.getTimes.reduce((a, b) => a + b, 0) / this.getTimes.length;
  }
  
  /**
   * Track set time
   * 
   * @param time The time to track
   * @private
   */
  private trackSetTime(time: number): void {
    this.setTimes.push(time);
    
    if (this.setTimes.length > 100) {
      this.setTimes.shift();
    }
    
    this.stats.performance.averageSetTimeMs = this.setTimes.reduce((a, b) => a + b, 0) / this.setTimes.length;
  }
  
  /**
   * Track compile time
   * 
   * @param time The time to track
   * @private
   */
  private trackCompileTime(time: number): void {
    this.compileTimes.push(time);
    
    if (this.compileTimes.length > 100) {
      this.compileTimes.shift();
    }
    
    this.stats.performance.averageCompileTimeMs = this.compileTimes.reduce((a, b) => a + b, 0) / this.compileTimes.length;
  }
}

// Export interfaces and enums
export {
  RuleCompiler,
  RuleProvider
};