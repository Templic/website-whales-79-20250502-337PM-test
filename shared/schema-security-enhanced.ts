/**
 * Enhanced Security Rules Schema
 * 
 * This module provides an enhanced schema for security rules with
 * improved performance, privacy, and compliance features.
 */

import { sql } from 'drizzle-orm';
import { pgTable, pgSchema, varchar, text, integer, jsonb, timestamp, serial, index, pgEnum, uniqueIndex, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Create a security schema to isolate security tables
export const securitySchema = pgSchema('security');

// Enums for stronger type safety
export const ruleTypeEnum = pgEnum('rule_type', [
  'access_control',
  'rate_limit',
  'input_validation',
  'threat_detection',
  'data_protection',
  'authentication'
]);

export const ruleStatusEnum = pgEnum('rule_status', [
  'active',
  'disabled',
  'pending',
  'archived'
]);

export const ruleDependencyTypeEnum = pgEnum('rule_dependency_type', [
  'required',
  'optional',
  'conflicts'
]);

export const eventSeverityEnum = pgEnum('event_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

// Rule types for TypeScript
export enum RuleType {
  ACCESS_CONTROL = 'access_control',
  RATE_LIMIT = 'rate_limit',
  INPUT_VALIDATION = 'input_validation',
  THREAT_DETECTION = 'threat_detection',
  DATA_PROTECTION = 'data_protection',
  AUTHENTICATION = 'authentication'
}

export enum RuleStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

export enum DependencyType {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  CONFLICTS = 'conflicts'
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Define security_rules table
export const securityRules = securitySchema.table('security_rules', {
  id: varchar('id', { length: 255 }).primaryKey(),
  type: ruleTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  pattern: text('pattern').notNull(),
  status: ruleStatusEnum('status').notNull().default('active'),
  priority: integer('priority').notNull().default(0),
  conditions: jsonb('conditions').notNull().$defaultFn(() => ({})),
  actions: jsonb('actions').notNull().$defaultFn(() => ({})),
  metadata: jsonb('metadata').notNull().$defaultFn(() => ({})),
  dataCategory: varchar('data_category', { length: 100 }),
  privacyImpact: varchar('privacy_impact', { length: 50 }),
  securityClassification: varchar('security_classification', { length: 50 }).default('normal'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  lastEvaluatedAt: timestamp('last_evaluated_at', { withTimezone: true }),
  createdBy: varchar('created_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
  version: integer('version').notNull().default(1),
  hash: varchar('hash', { length: 64 }).notNull(), // Store hash for optimistic locking and change detection
  enabled: boolean('enabled').notNull().default(true) // Quick toggle separate from status
});

// Define rule_dependencies table with enhanced constraints
export const ruleDependencies = securitySchema.table('rule_dependencies', {
  id: serial('id').primaryKey(),
  ruleId: varchar('rule_id', { length: 255 })
    .notNull()
    .references(() => securityRules.id, { onDelete: 'cascade' }),
  dependsOnRuleId: varchar('depends_on_rule_id', { length: 255 })
    .notNull()
    .references(() => securityRules.id, { onDelete: 'cascade' }),
  dependencyType: ruleDependencyTypeEnum('dependency_type').notNull().default('required'),
  metadata: jsonb('metadata').notNull().$defaultFn(() => ({})),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

// Define security_events table with partitioning support
export const securityEvents = securitySchema.table('security_events', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(),
  sourceId: varchar('source_id', { length: 255 }),
  severity: eventSeverityEnum('severity').notNull().default('medium'),
  description: text('description'),
  data: jsonb('data').notNull().$defaultFn(() => ({})),
  metadata: jsonb('metadata').notNull().$defaultFn(() => ({})),
  userId: varchar('user_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  result: varchar('result', { length: 50 }),
  responseTime: integer('response_time'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

// Define rule_evaluations table to track rule performance
export const ruleEvaluations = securitySchema.table('rule_evaluations', {
  id: serial('id').primaryKey(),
  ruleId: varchar('rule_id', { length: 255 })
    .notNull()
    .references(() => securityRules.id, { onDelete: 'cascade' }),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  contextType: varchar('context_type', { length: 50 }).notNull(),
  result: boolean('result').notNull(),
  executionTimeMs: integer('execution_time_ms').notNull(),
  evaluationContext: jsonb('evaluation_context'),
  matchedConditions: jsonb('matched_conditions').$type<string[]>(),
  userId: varchar('user_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  eventId: integer('event_id').references(() => securityEvents.id)
});

// Define security_audit_log table
export const securityAuditLog = securitySchema.table('security_audit_log', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  userId: varchar('user_id', { length: 255 }),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  metadata: jsonb('metadata').notNull().$defaultFn(() => ({})),
  ipAddress: varchar('ip_address', { length: 45 })
});

// Create indexes for better performance
export const securityRulesTypeIdx = index('security_rules_type_idx', { columns: [securityRules.type] });
export const securityRulesStatusIdx = index('security_rules_status_idx', { columns: [securityRules.status] });
export const securityRulesUpdatedAtIdx = index('security_rules_updated_at_idx', { columns: [securityRules.updatedAt] });
export const securityRulesPriorityIdx = index('security_rules_priority_idx', { columns: [securityRules.priority] });
export const securityRulesEnabledIdx = index('security_rules_enabled_idx', { columns: [securityRules.enabled] });
export const securityRulesHashIdx = index('security_rules_hash_idx', { columns: [securityRules.hash] });
export const securityRulesDataCategoryIdx = index('security_rules_data_category_idx', { columns: [securityRules.dataCategory] });
export const securityRulesPrivacyImpactIdx = index('security_rules_privacy_impact_idx', { columns: [securityRules.privacyImpact] });
export const securityRulesClassificationIdx = index('security_rules_classification_idx', { columns: [securityRules.securityClassification] });

// Create unique constraint for rule dependencies
export const ruleDependenciesUniqueIdx = uniqueIndex('rule_dependencies_unique_idx', { columns: [ruleDependencies.ruleId, ruleDependencies.dependsOnRuleId] });

// Create indexes for security events
export const securityEventsTypeIdx = index('security_events_type_idx', { columns: [securityEvents.type] });
export const securityEventsSourceIdx = index('security_events_source_idx', { columns: [securityEvents.source] });
export const securityEventsSeverityIdx = index('security_events_severity_idx', { columns: [securityEvents.severity] });
export const securityEventsProcessedIdx = index('security_events_processed_idx', { columns: [securityEvents.processed] });
export const securityEventsCreatedAtIdx = index('security_events_created_at_idx', { columns: [securityEvents.createdAt] });
export const securityEventsUserIdIdx = index('security_events_user_id_idx', { columns: [securityEvents.userId] });

// Create indexes for rule evaluations
export const ruleEvaluationsRuleIdIdx = index('rule_evaluations_rule_id_idx', { columns: [ruleEvaluations.ruleId] });
export const ruleEvaluationsEvaluatedAtIdx = index('rule_evaluations_evaluated_at_idx', { columns: [ruleEvaluations.evaluatedAt] });
export const ruleEvaluationsContextTypeIdx = index('rule_evaluations_context_type_idx', { columns: [ruleEvaluations.contextType] });
export const ruleEvaluationsResultIdx = index('rule_evaluations_result_idx', { columns: [ruleEvaluations.result] });

// Create indexes for audit log
export const securityAuditLogEntityTypeIdx = index('security_audit_log_entity_type_idx', { columns: [securityAuditLog.entityType] });
export const securityAuditLogEntityIdIdx = index('security_audit_log_entity_id_idx', { columns: [securityAuditLog.entityId] });
export const securityAuditLogTimestampIdx = index('security_audit_log_timestamp_idx', { columns: [securityAuditLog.timestamp] });
export const securityAuditLogUserIdIdx = index('security_audit_log_user_id_idx', { columns: [securityAuditLog.userId] });

// Types
export type SecurityRule = typeof securityRules.$inferSelect;
export type InsertSecurityRule = typeof securityRules.$inferInsert;

export type RuleDependency = typeof ruleDependencies.$inferSelect;
export type InsertRuleDependency = typeof ruleDependencies.$inferInsert;

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

export type RuleEvaluation = typeof ruleEvaluations.$inferSelect;
export type InsertRuleEvaluation = typeof ruleEvaluations.$inferInsert;

export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditLog = typeof securityAuditLog.$inferInsert;

// Zod schemas with enhanced validation
export const insertSecurityRuleSchema = createInsertSchema(securityRules)
  .extend({
    type: z.nativeEnum(RuleType),
    status: z.nativeEnum(RuleStatus).default(RuleStatus.ACTIVE),
    pattern: z.string().min(1, 'Pattern is required'),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    conditions: z.record(z.any()).default({}),
    actions: z.record(z.any()).default({}),
    metadata: z.record(z.any()).default({}),
    privacyImpact: z.enum(['none', 'low', 'medium', 'high', 'critical']).optional(),
    securityClassification: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
    // Hash will be auto-generated
    hash: z.string().length(64)
  });

export const insertRuleDependencySchema = createInsertSchema(ruleDependencies)
  .extend({
    dependencyType: z.nativeEnum(DependencyType).default(DependencyType.REQUIRED),
    metadata: z.record(z.any()).default({})
  });

export const insertSecurityEventSchema = createInsertSchema(securityEvents)
  .extend({
    severity: z.nativeEnum(EventSeverity).default(EventSeverity.MEDIUM),
    data: z.record(z.any()).default({}),
    metadata: z.record(z.any()).default({}),
    ipAddress: z.string().ip().optional()
  });

export const insertRuleEvaluationSchema = createInsertSchema(ruleEvaluations)
  .extend({
    contextType: z.string().min(1),
    result: z.boolean(),
    executionTimeMs: z.number().int().min(0),
    matchedConditions: z.array(z.string()).optional(),
    ipAddress: z.string().ip().optional()
  });

export const insertSecurityAuditLogSchema = createInsertSchema(securityAuditLog)
  .extend({
    action: z.enum(['create', 'update', 'delete', 'enable', 'disable', 'evaluate']),
    metadata: z.record(z.any()).default({}),
    ipAddress: z.string().ip().optional()
  });

// Export default
export default {
  securityRules,
  ruleDependencies,
  securityEvents,
  ruleEvaluations,
  securityAuditLog
};