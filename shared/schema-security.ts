/**
 * Security Rules Schema
 * 
 * This module defines the Drizzle schema for security rules.
 */

import { sql } from 'drizzle-orm';
import { pgTable, varchar, text, integer, jsonb, timestamp, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Rule types
export enum RuleType {
  ACCESS_CONTROL = 'access_control',
  RATE_LIMIT = 'rate_limit',
  INPUT_VALIDATION = 'input_validation',
  THREAT_DETECTION = 'threat_detection',
  DATA_PROTECTION = 'data_protection',
  AUTHENTICATION = 'authentication'
}

// Rule status types
export enum RuleStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

// Dependency types
export enum DependencyType {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  CONFLICTS = 'conflicts'
}

// Define security_rules table
export const securityRules = pgTable('security_rules', {
  id: varchar('id', { length: 255 }).primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  pattern: text('pattern').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  priority: integer('priority').notNull().default(0),
  conditions: jsonb('conditions').notNull().default({}),
  actions: jsonb('actions').notNull().default({}),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  createdBy: varchar('created_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
  version: integer('version').notNull().default(1)
});

// Define rule_dependencies table
export const ruleDependencies = pgTable('rule_dependencies', {
  id: serial('id').primaryKey(),
  ruleId: varchar('rule_id', { length: 255 })
    .notNull()
    .references(() => securityRules.id, { onDelete: 'cascade' }),
  dependsOnRuleId: varchar('depends_on_rule_id', { length: 255 })
    .notNull()
    .references(() => securityRules.id, { onDelete: 'cascade' }),
  dependencyType: varchar('dependency_type', { length: 50 }).notNull().default('required'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

// Types
export type SecurityRule = typeof securityRules.$inferSelect;
export type InsertSecurityRule = typeof securityRules.$inferInsert;

export type RuleDependency = typeof ruleDependencies.$inferSelect;
export type InsertRuleDependency = typeof ruleDependencies.$inferInsert;

// Zod schemas
export const insertSecurityRuleSchema = createInsertSchema(securityRules)
  .extend({
    type: z.nativeEnum(RuleType),
    status: z.nativeEnum(RuleStatus).default(RuleStatus.ACTIVE),
    pattern: z.string().min(1, 'Pattern is required'),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    conditions: z.record(z.any()).default({}),
    actions: z.record(z.any()).default({}),
    metadata: z.record(z.any()).default({})
  });

export const insertRuleDependencySchema = createInsertSchema(ruleDependencies)
  .extend({
    dependencyType: z.nativeEnum(DependencyType).default(DependencyType.REQUIRED)
  });

// Export default
export default {
  securityRules,
  ruleDependencies
};