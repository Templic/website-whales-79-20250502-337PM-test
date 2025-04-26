/**
 * Shared database schema and types for TypeScript error management
 */
import { relations } from 'drizzle-orm';
import {
  serial,
  text,
  varchar,
  timestamp,
  pgTable,
  integer,
  boolean,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export enum ErrorCategory {
  TYPE_MISMATCH = 'type_mismatch',
  MISSING_TYPE = 'missing_type',
  IMPORT_ERROR = 'import_error',
  NULL_REFERENCE = 'null_reference',
  INTERFACE_MISMATCH = 'interface_mismatch',
  GENERIC_CONSTRAINT = 'generic_constraint',
  DECLARATION_ERROR = 'declaration_error',
  SYNTAX_ERROR = 'syntax_error',
  OTHER = 'other',
}

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ErrorStatus {
  PENDING = 'pending',
  FIXED = 'fixed',
  IGNORED = 'ignored',
}

export enum FixMethod {
  AUTOMATIC = 'automatic',
  AI = 'ai',
  PATTERN = 'pattern',
  MANUAL = 'manual',
}

// Create Postgres enums
export const errorCategoryEnum = pgEnum('error_category', Object.values(ErrorCategory));
export const errorSeverityEnum = pgEnum('error_severity', Object.values(ErrorSeverity));
export const errorStatusEnum = pgEnum('error_status', Object.values(ErrorStatus));
export const fixMethodEnum = pgEnum('fix_method', Object.values(FixMethod));

// Tables
export const typeScriptErrors = pgTable('typescript_errors', {
  id: serial('id').primaryKey(),
  hash: varchar('hash', { length: 64 }).notNull().unique(),
  code: integer('code').notNull(),
  message: text('message').notNull(),
  file: text('file').notNull(),
  line: integer('line').notNull(),
  column: integer('column').notNull(),
  lineContent: text('line_content'),
  category: errorCategoryEnum('category').notNull(),
  severity: errorSeverityEnum('severity').notNull(),
  status: errorStatusEnum('status').notNull().default(ErrorStatus.PENDING),
  suggestedFix: text('suggested_fix'),
  projectId: varchar('project_id', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const errorPatterns = pgTable('error_patterns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  pattern: text('pattern').notNull(),
  category: errorCategoryEnum('category').notNull(),
  severity: errorSeverityEnum('severity').notNull(),
  description: text('description').notNull(),
  suggestedFix: text('suggested_fix'),
  autoFixable: boolean('auto_fixable').notNull().default(false),
  occurrences: integer('occurrences').notNull().default(0),
  examples: json('examples').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const errorFixes = pgTable('error_fixes', {
  id: serial('id').primaryKey(),
  errorHash: varchar('error_hash', { length: 64 }).notNull(),
  file: text('file').notNull(),
  line: integer('line').notNull(),
  errorCode: integer('error_code').notNull(),
  errorMessage: text('error_message').notNull(),
  fixDescription: text('fix_description').notNull(),
  beforeFix: text('before_fix'),
  afterFix: text('after_fix'),
  fixMethod: fixMethodEnum('fix_method').notNull(),
  successful: boolean('successful').notNull().default(true),
  undoable: boolean('undoable').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const errorAnalysis = pgTable('error_analysis', {
  id: serial('id').primaryKey(),
  errorHash: varchar('error_hash', { length: 64 }).notNull(),
  rootCause: text('root_cause').notNull(),
  suggestedFix: text('suggested_fix').notNull(),
  confidence: integer('confidence').notNull(),
  relatedErrors: json('related_errors'),
  explanation: text('explanation').notNull(),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scanResults = pgTable('scan_results', {
  id: serial('id').primaryKey(),
  totalErrors: integer('total_errors').notNull(),
  criticalErrors: integer('critical_errors').notNull(),
  highSeverityErrors: integer('high_severity_errors').notNull(),
  mediumSeverityErrors: integer('medium_severity_errors').notNull(),
  lowSeverityErrors: integer('low_severity_errors').notNull(),
  duration: integer('duration').notNull(), // in milliseconds
  deepScan: boolean('deep_scan').notNull().default(false),
  aiEnhanced: boolean('ai_enhanced').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const typeScriptErrorsRelations = relations(typeScriptErrors, ({ many }) => ({
  fixes: many(errorFixes, { relationName: 'error_fixes' }),
  analysis: many(errorAnalysis, { relationName: 'error_analysis' }),
}));

export const errorFixesRelations = relations(errorFixes, ({ one }) => ({
  error: one(typeScriptErrors, {
    fields: [errorFixes.errorHash],
    references: [typeScriptErrors.hash],
    relationName: 'error_fixes',
  }),
}));

export const errorAnalysisRelations = relations(errorAnalysis, ({ one }) => ({
  error: one(typeScriptErrors, {
    fields: [errorAnalysis.errorHash],
    references: [typeScriptErrors.hash],
    relationName: 'error_analysis',
  }),
}));

// Schemas
export const insertTypeScriptErrorSchema = createInsertSchema(typeScriptErrors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorPatternSchema = createInsertSchema(errorPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorFixSchema = createInsertSchema(errorFixes).omit({
  id: true,
  createdAt: true,
});

export const insertErrorAnalysisSchema = createInsertSchema(errorAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertScanResultSchema = createInsertSchema(scanResults).omit({
  id: true,
  createdAt: true,
});

// Insert Types
export type InsertTypeScriptError = z.infer<typeof insertTypeScriptErrorSchema>;
export type InsertErrorPattern = z.infer<typeof insertErrorPatternSchema>;
export type InsertErrorFix = z.infer<typeof insertErrorFixSchema>;
export type InsertErrorAnalysis = z.infer<typeof insertErrorAnalysisSchema>;
export type InsertScanResult = z.infer<typeof insertScanResultSchema>;

// Select Types
export type TypeScriptError = typeof typeScriptErrors.$inferSelect;
export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type ErrorFix = typeof errorFixes.$inferSelect;
export type ErrorAnalysis = typeof errorAnalysis.$inferSelect;
export type ScanResult = typeof scanResults.$inferSelect;