/**
 * Security Rules
 * 
 * This module exports the security rule cache and related components.
 */

import { RuleCache } from './RuleCache';
import { securityRuleCompiler } from './RuleCompiler';
import { databaseRuleProvider } from './DatabaseRuleProvider';

// Create rule cache instance
const ruleCache = new RuleCache(
  securityRuleCompiler,
  databaseRuleProvider,
  {
    // Custom options can be provided here
    l1Cache: {
      maxSize: 2000, // Increased cache size
      ttl: 30 * 60 * 1000 // 30 minutes
    },
    autoRefresh: {
      interval: 3 * 60 * 1000 // 3 minutes
    }
  }
);

// Export components
export {
  RuleCache,
  ruleCache,
  securityRuleCompiler,
  databaseRuleProvider
};

// Re-export types and interfaces
export * from './RuleCache';
export * from './RuleCompiler';

// Export default for convenience
export default ruleCache;