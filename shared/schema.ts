/**
 * Database schema for the TypeScript Error Management System
 */

import { pgTable, serial, text, timestamp, integer, jsonb, boolean, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============== User-related Enums ==============
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'admin',
  'super_admin'
]);

// ============== Error Management Enums ==============
export const errorSeverityEnum = pgEnum('error_severity', [
  'critical',
  'high',
  'medium',
  'low'
]);

export const errorStatusEnum = pgEnum('error_status', [
  'detected',
  'in_progress',
  'fixed',
  'ignored',
  'false_positive'
]);

export const errorCategoryEnum = pgEnum('error_category', [
  'type_mismatch',
  'missing_type',
  'import_error',
  'null_reference',
  'interface_mismatch',
  'generic_constraint',
  'declaration_error',
  'syntax_error',
  'other'
]);

export const fixResultEnum = pgEnum('fix_result', [
  'success',
  'partial',
  'failure'
]);

export const fixMethodEnum = pgEnum('fix_method', [
  'manual',
  'automated',
  'ai_assisted',
  'pattern_based'
]);

export const analysisStatusEnum = pgEnum('analysis_status', [
  'in_progress',
  'completed',
  'failed'
]);

// ============== User Tables ==============
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  isBanned: boolean('is_banned').notNull().default(false),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  passwordUpdatedAt: timestamp('password_updated_at'),
  lastLoginAt: timestamp('last_login_at'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// ============== Error Management Tables ==============
export const typescriptErrors = pgTable('typescript_errors', {
  id: serial('id').primaryKey(),
  errorCode: text('error_code').notNull(),
  errorMessage: text('error_message').notNull(),
  filePath: text('file_path').notNull(),
  lineNumber: integer('line_number').notNull(),
  columnNumber: integer('column_number').notNull(),
  errorContext: text('error_context'),
  category: errorCategoryEnum('category').notNull().default('other'),
  severity: errorSeverityEnum('severity').notNull().default('medium'),
  status: errorStatusEnum('status').notNull().default('detected'),
  patternId: integer('pattern_id'),
  occurrenceCount: integer('occurrence_count').notNull().default(1),
  lastFixId: integer('last_fix_id'),
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  firstDetectedAt: timestamp('first_detected_at').notNull().defaultNow(),
  lastOccurrenceAt: timestamp('last_occurrence_at').notNull().defaultNow(),
  fixedAt: timestamp('fixed_at'),
  metadata: jsonb('metadata')
});

export const errorPatterns = pgTable('error_patterns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  regex: text('regex'),
  category: errorCategoryEnum('category').notNull().default('other'),
  severity: errorSeverityEnum('severity').notNull().default('medium'),
  detectionRules: jsonb('detection_rules'),
  autoFixable: boolean('auto_fixable').notNull().default(false),
  fixCount: integer('fix_count').notNull().default(0),
  successRate: integer('success_rate').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const errorFixes = pgTable('error_fixes', {
  id: serial('id').primaryKey(),
  patternId: integer('pattern_id'),
  errorId: integer('error_id'),
  fixTitle: text('fix_title').notNull(),
  fixDescription: text('fix_description').notNull(),
  fixType: text('fix_type').notNull().default('code_change'),
  fixTemplate: text('fix_template'),
  fixCode: text('fix_code'),
  beforeCode: text('before_code'),
  afterCode: text('after_code'),
  appliedCount: integer('applied_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by'),
  metadata: jsonb('metadata')
});

export const errorFixHistory = pgTable('error_fix_history', {
  id: serial('id').primaryKey(),
  errorId: integer('error_id').notNull(),
  fixId: integer('fix_id'),
  fixedBy: text('fixed_by'),
  fixMethod: fixMethodEnum('fix_method').notNull().default('manual'),
  fixResult: fixResultEnum('fix_result').notNull().default('success'),
  beforeCode: text('before_code'),
  afterCode: text('after_code'),
  fixNotes: text('fix_notes'),
  fixedAt: timestamp('fixed_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

export const projectAnalyses = pgTable('project_analyses', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id'),
  projectName: text('project_name'),
  status: analysisStatusEnum('status').notNull().default('in_progress'),
  totalErrors: integer('total_errors').notNull().default(0),
  criticalErrors: integer('critical_errors').notNull().default(0),
  highErrors: integer('high_errors').notNull().default(0),
  mediumErrors: integer('medium_errors').notNull().default(0),
  lowErrors: integer('low_errors').notNull().default(0),
  errorsByCategory: jsonb('errors_by_category'),
  errorsByFile: jsonb('errors_by_file'),
  rootCauseErrors: integer('root_cause_errors').notNull().default(0),
  cascadingErrors: integer('cascading_errors').notNull().default(0),
  patternsDetected: integer('patterns_detected').notNull().default(0),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  executedBy: text('executed_by'),
  analysisOptions: jsonb('analysis_options'),
  analysisResults: jsonb('analysis_results'),
  metadata: jsonb('metadata')
});

// ============== Types ==============
// User Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Error Management Types
export type TypeScriptError = typeof typescriptErrors.$inferSelect;
export type InsertTypeScriptError = typeof typescriptErrors.$inferInsert;

export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type InsertErrorPattern = typeof errorPatterns.$inferInsert;

export type ErrorFix = typeof errorFixes.$inferSelect;
export type InsertErrorFix = typeof errorFixes.$inferInsert;

export type ErrorFixHistory = typeof errorFixHistory.$inferSelect;
export type InsertErrorFixHistory = typeof errorFixHistory.$inferInsert;

export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;
export type InsertProjectAnalysis = typeof projectAnalyses.$inferInsert;

// ============== Zod Schemas ==============
// User Schemas
export const insertUserSchema = createInsertSchema(users);

// Error Management Schemas
export const insertTypeScriptErrorSchema = createInsertSchema(typescriptErrors);
export const insertErrorPatternSchema = createInsertSchema(errorPatterns);
export const insertErrorFixSchema = createInsertSchema(errorFixes);
export const insertErrorFixHistorySchema = createInsertSchema(errorFixHistory);
export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses);

// Export all schema elements
export default {
  users,
  typescriptErrors,
  errorPatterns,
  errorFixes,
  errorFixHistory,
  projectAnalyses,
  userRoleEnum,
  errorSeverityEnum,
  errorStatusEnum,
  errorCategoryEnum,
  fixResultEnum,
  fixMethodEnum,
  analysisStatusEnum
};