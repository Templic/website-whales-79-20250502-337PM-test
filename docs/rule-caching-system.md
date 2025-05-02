# Security Rule Caching System

This document provides an in-depth explanation of the security rule caching system implemented to improve performance and reduce database load.

## System Architecture

The rule caching system follows a multi-tier design:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rule Evaluation Service                   │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                            Rule Cache                            │
├─────────────────┬─────────────────────────────┬─────────────────┤
│   L1 Memory     │        L2 Persistent        │    Compiled     │
│     Cache       │           Cache             │   Rules Cache   │
└─────────┬───────┴──────────────┬──────────────┴────────┬────────┘
          │                      │                       │
          ▼                      ▼                       ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│  Database Rule    │  │    Rule Compiler  │  │  Rule Dependency  │
│     Provider      │  │                   │  │     Tracker       │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

## Components

### 1. Rule Cache

The core component that stores and retrieves security rules with minimal latency.

**Key Features:**
- Multi-level caching (L1/L2)
- Automatic cache expiration
- Cache statistics tracking
- Dependency-aware invalidation
- Auto-refresh capabilities

**Cache Tiers:**
- **L1 Cache:** Fast in-memory cache for frequently accessed rules
- **L2 Cache:** Longer-term storage for less frequently accessed rules
- **Compiled Rules Cache:** Stores pre-compiled rule evaluation functions

### 2. Rule Compiler

Transforms security rules into optimized executable functions.

**Capabilities:**
- Compiles different rule pattern types:
  - Regular expressions
  - JSONPath expressions
  - Templates with variables
  - Script-based rules
  - Composite rules (combinations of other patterns)
- Optimization techniques:
  - Pre-compilation of regex patterns
  - Fast-path implementations for common patterns
  - Conditional evaluation to skip unnecessary processing
  - Context-aware evaluation

### 3. Database Rule Provider

Retrieves rules from the database when they're not found in the cache.

**Features:**
- Lazy initialization to avoid blocking application startup
- Efficient batch loading of rules by type
- Detection of updated rules
- Dependency relationship management

### 4. Rule Evaluation Service

Uses the cached rules to evaluate security policies against requests.

**Capabilities:**
- Context preparation for different evaluation scenarios
- Rule filtering based on type, status, and other criteria
- Result caching for frequent evaluations
- Performance metrics collection
- Action processing

## Performance Optimizations

### 1. Cache Design Optimizations

- **TTL-based expiry:** Rules are valid in cache for a configurable time period
- **Auto-refresh:** Rules are refreshed in the background to avoid cache misses
- **LRU implementation:** Least recently used rules are evicted when cache reaches capacity
- **Tiered storage:** Frequently accessed rules stay in fast memory cache
- **Selective compilation:** Rules are compiled only when needed

### 2. Rule Compilation Optimizations

- **Pattern-specific compilation:** Different rule types use specialized compilation strategies
- **Fast paths:** Common evaluation patterns use optimized code paths
- **Pre-checks:** Quick checks determine if full evaluation is necessary
- **Context preparation optimization:** Only relevant context data is extracted

### 3. Evaluation Optimizations

- **Result caching:** Frequently performed evaluations are cached
- **Rule prioritization:** Rules are evaluated in priority order
- **Short-circuit evaluation:** Processing stops when a deterministic result is reached
- **Selective rule loading:** Only rules relevant to the evaluation context are loaded

## Database Schema

The system uses two primary tables:

### security_rules

Stores the security rules themselves:

| Column        | Type           | Description                               |
|---------------|----------------|-------------------------------------------|
| id            | VARCHAR(255)   | Primary key                               |
| type          | rule_type      | Type of rule (enum)                       |
| name          | VARCHAR(255)   | Human-readable name                       |
| description   | TEXT           | Detailed description                      |
| pattern       | TEXT           | Pattern to match against                  |
| status        | rule_status    | Active, disabled, pending, archived       |
| priority      | INTEGER        | Evaluation priority (higher = earlier)    |
| conditions    | JSONB          | Conditions for rule to apply              |
| actions       | JSONB          | Actions to take when rule matches         |
| metadata      | JSONB          | Additional information about the rule     |
| created_at    | TIMESTAMPTZ    | Creation timestamp                        |
| updated_at    | TIMESTAMPTZ    | Last update timestamp                     |
| created_by    | VARCHAR(255)   | Creator identifier                        |
| updated_by    | VARCHAR(255)   | Last updater identifier                   |
| version       | INTEGER        | Rule version number                       |

### rule_dependencies

Tracks dependencies between rules:

| Column           | Type                | Description                       |
|------------------|---------------------|-----------------------------------|
| id               | SERIAL              | Primary key                       |
| rule_id          | VARCHAR(255)        | The rule that has a dependency    |
| depends_on_rule_id | VARCHAR(255)      | The rule being depended on        |
| dependency_type  | rule_dependency_type| Type of dependency (enum)         |
| created_at       | TIMESTAMPTZ         | Creation timestamp                |

## Usage Examples

### Basic Express Integration

```typescript
import express from 'express';
import { createSecurityRulesMiddleware, RuleType } from './server/security';

const app = express();

// Create middleware
const securityRules = createSecurityRulesMiddleware({
  ruleTypes: [
    RuleType.ACCESS_CONTROL,
    RuleType.INPUT_VALIDATION
  ],
  logResults: true
});

// Apply to routes
app.use('/api', securityRules);
```

### Direct Rule Evaluation

```typescript
import { ruleEvaluationService, ContextPreparationType } from './server/security';

async function checkUserAccess(user, resource) {
  const context = {
    user,
    resource,
    timestamp: Date.now()
  };
  
  const result = await ruleEvaluationService.evaluateRules(context, {
    ruleTypes: ['access_control'],
    contextPreparationType: ContextPreparationType.USER,
    includeDetails: true
  });
  
  return result.allowed;
}
```

## Monitoring and Maintenance

The system provides detailed statistics for monitoring:

```typescript
import { ruleCache } from './server/security';

// Get cache statistics
const stats = ruleCache.getStats();
console.log(`Cache hit ratio: ${stats.hits.total / (stats.hits.total + stats.misses.total)}`);
console.log(`Average get time: ${stats.performance.averageGetTimeMs}ms`);
```

Regular maintenance should include:

1. Database index optimization
2. Cache size tuning based on hit/miss ratios
3. Rule cleanup (archiving unused rules)
4. Dependency graph analysis to identify circular dependencies

## Extending the System

The system can be extended in several ways:

1. **New Rule Types:** Add new entries to the `RuleType` enum and implement specialized evaluation logic
2. **Custom Pattern Types:** Extend the `RuleCompiler` to handle new pattern formats
3. **Additional Cache Levels:** Implement additional cache tiers for specific use cases
4. **Distributed Caching:** Replace the L2 cache with a distributed cache like Redis

## Troubleshooting

Common issues and solutions:

1. **High Cache Miss Rate:** Increase cache TTL or size, or pre-warm cache with common rules
2. **Slow Rule Evaluation:** Check rule complexity, optimize patterns, or add more fast paths
3. **Database Load:** Increase cache sizes and TTLs to reduce database queries
4. **Memory Usage:** Reduce L1 cache size or move more to L2 persistent cache
5. **Circular Dependencies:** Analyze dependency graph and restructure rule relationships