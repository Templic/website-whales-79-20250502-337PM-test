/**
 * Security System
 * 
 * This module exports and initializes the security system.
 */

import chalk from 'chalk';

// Export components
export * from './rules';
export * from './services';
export * from './middleware';

// Export types
export { RuleType, RuleStatus } from './rules/RuleCache';
export { ContextPreparationType } from './services/RuleEvaluationService';

/**
 * Initialize the security system
 * 
 * @param options Initialization options
 */
export async function initializeSecuritySystem(
  options: {
    enableRuleCache?: boolean;
    enableRuleCompilation?: boolean;
    refreshCacheOnStart?: boolean;
  } = {}
) {
  // Default options
  const initOptions = {
    enableRuleCache: true,
    enableRuleCompilation: true,
    refreshCacheOnStart: true,
    ...options
  };
  
  console.log(chalk.blue('[Security] Initializing security system...'));
  
  try {
    // Import rule cache and service
    const { ruleCache } = await import('./rules');
    const { ruleEvaluationService } = await import('./services');
    
    // Initialize rule cache if enabled
    if (initOptions.enableRuleCache) {
      console.log(chalk.blue('[Security] Initializing rule cache...'));
      
      // Start auto refresh
      if (initOptions.refreshCacheOnStart) {
        try {
          await ruleCache.refresh({ full: true });
          console.log(chalk.green('[Security] Rule cache refreshed'));
        } catch (error) {
          console.error(chalk.yellow('[Security] Error refreshing rule cache:'), error);
          console.log(chalk.yellow('[Security] Continuing with empty cache, will populate as needed'));
        }
      }
    }
    
    console.log(chalk.green('[Security] Security system initialized successfully'));
    
    return {
      ruleCache,
      ruleEvaluationService
    };
  } catch (error) {
    console.error(chalk.red('[Security] Error initializing security system:'), error);
    throw new Error(`Failed to initialize security system: ${error.message}`);
  }
}

// Export default for convenience
export default {
  initializeSecuritySystem
};