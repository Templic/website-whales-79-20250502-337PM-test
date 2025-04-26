/**
 * @file tsErrorStorage.ts
 * @description Storage interface for TypeScript error management
 * 
 * This module provides a specialized storage interface for TypeScript errors,
 * separate from the main application storage to avoid conflicts.
 */

import { db } from './db';
import { eq, and, or, desc, asc, like, sql } from 'drizzle-orm';
import { 
  typescriptErrors, 
  errorPatterns,
  errorFixes,
  errorFixHistory,
  projectAnalyses
} from '../shared/schema';

import type { 
  TypeScriptError,
  InsertTypeScriptError,
  ErrorPattern,
  InsertErrorPattern,
  ErrorFix,
  InsertErrorFix,
  ErrorFixHistory,
  InsertErrorFixHistory,
  ProjectAnalysis,
  InsertProjectAnalysis,
  ErrorCategory,
  ErrorSeverity,
  ErrorStatus
} from './types/core/error-types';

/**
 * Get a TypeScript error by ID
 * @param id Error ID
 * @returns The TypeScript error or undefined if not found
 */
export async function getTypescriptError(id: number): Promise<TypeScriptError | undefined> {
  const [error] = await db.select().from(typescriptErrors).where(eq(typescriptErrors.id, id));
  return error as TypeScriptError | undefined;
}

/**
 * Get TypeScript errors by file path
 * @param filePath Path to the file
 * @returns Array of TypeScript errors in the file
 */
export async function getTypescriptErrorsByFile(filePath: string): Promise<TypeScriptError[]> {
  const errors = await db.select().from(typescriptErrors).where(eq(typescriptErrors.filePath, filePath));
  return errors as TypeScriptError[];
}

/**
 * Get TypeScript errors by status
 * @param status Error status to filter by
 * @returns Array of TypeScript errors with the specified status
 */
export async function getTypescriptErrorsByStatus(status: ErrorStatus): Promise<TypeScriptError[]> {
  const errors = await db.select().from(typescriptErrors).where(eq(typescriptErrors.status, status));
  return errors as TypeScriptError[];
}

/**
 * Get TypeScript errors by category
 * @param category Error category to filter by
 * @returns Array of TypeScript errors in the specified category
 */
export async function getTypescriptErrorsByCategory(category: ErrorCategory): Promise<TypeScriptError[]> {
  const errors = await db.select().from(typescriptErrors).where(eq(typescriptErrors.category, category));
  return errors as TypeScriptError[];
}

/**
 * Get TypeScript errors by severity
 * @param severity Error severity to filter by
 * @returns Array of TypeScript errors with the specified severity
 */
export async function getTypescriptErrorsBySeverity(severity: ErrorSeverity): Promise<TypeScriptError[]> {
  const errors = await db.select().from(typescriptErrors).where(eq(typescriptErrors.severity, severity));
  return errors as TypeScriptError[];
}

/**
 * Get TypeScript errors with flexible filtering options
 * @param filters Object containing filter options
 * @returns Array of TypeScript errors matching the filters
 */
export async function getTypescriptErrors(filters: {
  status?: ErrorStatus | ErrorStatus[];
  category?: ErrorCategory | ErrorCategory[];
  severity?: ErrorSeverity | ErrorSeverity[];
  filePath?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'detectedAt' | 'resolvedAt' | 'severity';
  order?: 'asc' | 'desc';
}): Promise<TypeScriptError[]> {
  let query = db.select().from(typescriptErrors);
  
  // Apply filters
  const conditions = [];
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(
        or(...filters.status.map(status => eq(typescriptErrors.status, status)))
      );
    } else {
      conditions.push(eq(typescriptErrors.status, filters.status));
    }
  }
  
  if (filters.category) {
    if (Array.isArray(filters.category)) {
      conditions.push(
        or(...filters.category.map(category => eq(typescriptErrors.category, category)))
      );
    } else {
      conditions.push(eq(typescriptErrors.category, filters.category));
    }
  }
  
  if (filters.severity) {
    if (Array.isArray(filters.severity)) {
      conditions.push(
        or(...filters.severity.map(severity => eq(typescriptErrors.severity, severity)))
      );
    } else {
      conditions.push(eq(typescriptErrors.severity, filters.severity));
    }
  }
  
  if (filters.filePath) {
    conditions.push(like(typescriptErrors.filePath, `%${filters.filePath}%`));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Apply ordering
  if (filters.orderBy) {
    const direction = filters.order === 'asc' ? asc : desc;
    switch (filters.orderBy) {
      case 'detectedAt':
        query = query.orderBy(direction(typescriptErrors.detectedAt));
        break;
      case 'resolvedAt':
        query = query.orderBy(direction(typescriptErrors.resolvedAt));
        break;
      case 'severity':
        query = query.orderBy(direction(typescriptErrors.severity));
        break;
    }
  } else {
    // Default sort by detection date (newest first)
    query = query.orderBy(desc(typescriptErrors.detectedAt));
  }
  
  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
  }
  
  const errors = await query;
  return errors as TypeScriptError[];
}

/**
 * Add a new TypeScript error
 * @param error The error to add
 * @returns The added error with its ID
 */
export async function addTypescriptError(error: InsertTypeScriptError): Promise<TypeScriptError> {
  const [added] = await db.insert(typescriptErrors).values({
    ...error,
    detectedAt: new Date()
  }).returning();
  
  return added as TypeScriptError;
}

/**
 * Update a TypeScript error
 * @param id Error ID
 * @param updates Fields to update
 * @returns The updated error
 */
export async function updateTypescriptError(
  id: number, 
  updates: Partial<Omit<TypeScriptError, 'id'>>
): Promise<TypeScriptError | undefined> {
  const [updated] = await db
    .update(typescriptErrors)
    .set(updates)
    .where(eq(typescriptErrors.id, id))
    .returning();
  
  return updated as TypeScriptError | undefined;
}

/**
 * Delete a TypeScript error
 * @param id Error ID
 * @returns Whether the deletion was successful
 */
export async function deleteTypescriptError(id: number): Promise<boolean> {
  const [deleted] = await db
    .delete(typescriptErrors)
    .where(eq(typescriptErrors.id, id))
    .returning();
  
  return !!deleted;
}

/**
 * Search for TypeScript errors with complex filters
 * @param filters Search filters
 * @returns Array of TypeScript errors matching the filters
 */
export async function searchTypescriptErrors(filters: {
  query?: string;
  filePath?: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  status?: ErrorStatus;
  from?: Date;
  to?: Date;
  sort?: 'severity' | 'date' | 'file';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{
  errors: TypeScriptError[];
  total: number;
}> {
  let query = db.select().from(typescriptErrors);
  
  // Apply filters
  const conditions = [];
  
  if (filters.query) {
    conditions.push(
      or(
        like(typescriptErrors.errorMessage, `%${filters.query}%`),
        like(typescriptErrors.errorCode, `%${filters.query}%`),
        like(typescriptErrors.filePath, `%${filters.query}%`)
      )
    );
  }
  
  if (filters.filePath) {
    conditions.push(like(typescriptErrors.filePath, `%${filters.filePath}%`));
  }
  
  if (filters.category) {
    conditions.push(eq(typescriptErrors.category, filters.category));
  }
  
  if (filters.severity) {
    conditions.push(eq(typescriptErrors.severity, filters.severity));
  }
  
  if (filters.status) {
    conditions.push(eq(typescriptErrors.status, filters.status));
  }
  
  if (filters.from) {
    conditions.push(sql`${typescriptErrors.detectedAt} >= ${filters.from}`);
  }
  
  if (filters.to) {
    conditions.push(sql`${typescriptErrors.detectedAt} <= ${filters.to}`);
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Apply sorting
  if (filters.sort) {
    const direction = filters.sortDirection === 'asc' ? asc : desc;
    switch (filters.sort) {
      case 'severity':
        query = query.orderBy(direction(typescriptErrors.severity));
        break;
      case 'date':
        query = query.orderBy(direction(typescriptErrors.detectedAt));
        break;
      case 'file':
        query = query.orderBy(direction(typescriptErrors.filePath));
        break;
    }
  } else {
    // Default sort by detection date (newest first)
    query = query.orderBy(desc(typescriptErrors.detectedAt));
  }
  
  // Get total count for pagination
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(typescriptErrors)
    .where(and(...conditions));
  
  const total = countResult?.count || 0;
  
  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
  }
  
  const errors = await query;
  
  return {
    errors: errors as TypeScriptError[],
    total
  };
}

/**
 * Get TypeScript error statistics
 * @returns Statistics about TypeScript errors
 */
export async function getTypescriptErrorStats(): Promise<{
  total: number;
  fixed: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  byStatus: Record<ErrorStatus, number>;
  topFiles: { filePath: string; count: number }[];
}> {
  // Get total count
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(typescriptErrors);
  
  // Get fixed count
  const [fixedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(typescriptErrors)
    .where(eq(typescriptErrors.status, 'fixed'));
  
  // Get counts by severity
  const severityCounts = await db
    .select({
      severity: typescriptErrors.severity,
      count: sql<number>`count(*)`
    })
    .from(typescriptErrors)
    .groupBy(typescriptErrors.severity);
  
  // Get counts by category
  const categoryCounts = await db
    .select({
      category: typescriptErrors.category,
      count: sql<number>`count(*)`
    })
    .from(typescriptErrors)
    .groupBy(typescriptErrors.category);
  
  // Get counts by status
  const statusCounts = await db
    .select({
      status: typescriptErrors.status,
      count: sql<number>`count(*)`
    })
    .from(typescriptErrors)
    .groupBy(typescriptErrors.status);
  
  // Get top files with most errors
  const topFiles = await db
    .select({
      filePath: typescriptErrors.filePath,
      count: sql<number>`count(*)`
    })
    .from(typescriptErrors)
    .groupBy(typescriptErrors.filePath)
    .orderBy(desc(sql<number>`count(*)`))
    .limit(10);
  
  // Format results
  const bySeverity: Record<ErrorSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  for (const { severity, count } of severityCounts) {
    bySeverity[severity as ErrorSeverity] = count;
  }
  
  const byCategory: Record<ErrorCategory, number> = {
    type_mismatch: 0,
    missing_type: 0,
    undefined_variable: 0,
    null_reference: 0,
    interface_mismatch: 0,
    import_error: 0,
    syntax_error: 0,
    generic_constraint: 0,
    declaration_error: 0,
    other: 0
  };
  
  for (const { category, count } of categoryCounts) {
    byCategory[category as ErrorCategory] = count;
  }
  
  const byStatus: Record<ErrorStatus, number> = {
    detected: 0,
    analyzed: 0,
    in_progress: 0,
    fixed: 0,
    ignored: 0,
    recurring: 0
  };
  
  for (const { status, count } of statusCounts) {
    byStatus[status as ErrorStatus] = count;
  }
  
  return {
    total: totalResult?.count || 0,
    fixed: fixedResult?.count || 0,
    bySeverity,
    byCategory,
    byStatus,
    topFiles: topFiles.map(({ filePath, count }) => ({ filePath, count }))
  };
}

/**
 * Get a TypeScript error pattern by ID
 * @param id Pattern ID
 * @returns The error pattern or undefined if not found
 */
export async function getErrorPattern(id: number): Promise<ErrorPattern | undefined> {
  const [pattern] = await db.select().from(errorPatterns).where(eq(errorPatterns.id, id));
  return pattern as ErrorPattern | undefined;
}

/**
 * Get TypeScript error patterns by category
 * @param category Error category to filter by
 * @returns Array of error patterns in the specified category
 */
export async function getErrorPatternsByCategory(category: ErrorCategory): Promise<ErrorPattern[]> {
  const patterns = await db.select().from(errorPatterns).where(eq(errorPatterns.category, category));
  return patterns as ErrorPattern[];
}

/**
 * Add a new error pattern
 * @param pattern The pattern to add
 * @returns The added pattern with its ID
 */
export async function addErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
  const [added] = await db.insert(errorPatterns).values({
    ...pattern,
    createdAt: new Date()
  }).returning();
  
  return added as ErrorPattern;
}

/**
 * Update an error pattern
 * @param id Pattern ID
 * @param updates Fields to update
 * @returns The updated pattern
 */
export async function updateErrorPattern(
  id: number, 
  updates: Partial<Omit<ErrorPattern, 'id' | 'createdAt'>>
): Promise<ErrorPattern | undefined> {
  const [updated] = await db
    .update(errorPatterns)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(errorPatterns.id, id))
    .returning();
  
  return updated as ErrorPattern | undefined;
}

/**
 * Delete an error pattern
 * @param id Pattern ID
 * @returns Whether the deletion was successful
 */
export async function deleteErrorPattern(id: number): Promise<boolean> {
  const [deleted] = await db
    .delete(errorPatterns)
    .where(eq(errorPatterns.id, id))
    .returning();
  
  return !!deleted;
}

/**
 * Get a TypeScript error fix by ID
 * @param id Fix ID
 * @returns The error fix or undefined if not found
 */
export async function getErrorFix(id: number): Promise<ErrorFix | undefined> {
  const [fix] = await db.select().from(errorFixes).where(eq(errorFixes.id, id));
  return fix as ErrorFix | undefined;
}

/**
 * Get TypeScript error fixes by error ID
 * @param errorId Error ID
 * @returns Array of error fixes for the specified error
 */
export async function getErrorFixesByError(errorId: number): Promise<ErrorFix[]> {
  const fixes = await db.select().from(errorFixes).where(eq(errorFixes.errorId, errorId));
  return fixes as ErrorFix[];
}

/**
 * Get TypeScript error fixes by pattern ID
 * @param patternId Pattern ID
 * @returns Array of error fixes for the specified pattern
 */
export async function getErrorFixesByPattern(patternId: number): Promise<ErrorFix[]> {
  const fixes = await db.select().from(errorFixes).where(eq(errorFixes.patternId, patternId));
  return fixes as ErrorFix[];
}

/**
 * Add a new error fix
 * @param fix The fix to add
 * @returns The added fix with its ID
 */
export async function addErrorFix(fix: InsertErrorFix): Promise<ErrorFix> {
  const [added] = await db.insert(errorFixes).values({
    ...fix,
    createdAt: new Date()
  }).returning();
  
  return added as ErrorFix;
}

/**
 * Update an error fix
 * @param id Fix ID
 * @param updates Fields to update
 * @returns The updated fix
 */
export async function updateErrorFix(
  id: number, 
  updates: Partial<Omit<ErrorFix, 'id' | 'createdAt'>>
): Promise<ErrorFix | undefined> {
  const [updated] = await db
    .update(errorFixes)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(errorFixes.id, id))
    .returning();
  
  return updated as ErrorFix | undefined;
}

/**
 * Delete an error fix
 * @param id Fix ID
 * @returns Whether the deletion was successful
 */
export async function deleteErrorFix(id: number): Promise<boolean> {
  const [deleted] = await db
    .delete(errorFixes)
    .where(eq(errorFixes.id, id))
    .returning();
  
  return !!deleted;
}

/**
 * Add a new error fix history entry
 * @param history The fix history to add
 * @returns The added fix history entry with its ID
 */
export async function addErrorFixHistory(history: InsertErrorFixHistory): Promise<ErrorFixHistory> {
  const [added] = await db.insert(errorFixHistory).values(history).returning();
  return added as ErrorFixHistory;
}

/**
 * Get error fix history by error ID
 * @param errorId Error ID
 * @returns Array of fix history entries for the specified error
 */
export async function getErrorFixHistoryByError(errorId: number): Promise<ErrorFixHistory[]> {
  const history = await db
    .select()
    .from(errorFixHistory)
    .where(eq(errorFixHistory.errorId, errorId))
    .orderBy(desc(errorFixHistory.fixedAt));
  
  return history as ErrorFixHistory[];
}

/**
 * Get error fix history by error ID (alias for getErrorFixHistoryByError)
 * @param errorId Error ID
 * @returns Array of fix history entries for the specified error
 */
export async function getErrorFixHistory(errorId: number): Promise<ErrorFixHistory[]> {
  return getErrorFixHistoryByError(errorId);
}

/**
 * Get fix success rate for a pattern
 * @param patternId Pattern ID
 * @returns Success rate statistics
 */
export async function getFixSuccessRateForPattern(patternId: number): Promise<{
  total: number;
  success: number;
  partial: number;
  failure: number;
  successRate: number;
}> {
  // Get fixes for the pattern
  const fixes = await getErrorFixesByPattern(patternId);
  const fixIds = fixes.map(fix => fix.id);
  
  if (fixIds.length === 0) {
    return {
      total: 0,
      success: 0,
      partial: 0,
      failure: 0,
      successRate: 0
    };
  }
  
  // Get fix history entries for these fixes
  const history = await db
    .select()
    .from(errorFixHistory)
    .where(sql`${errorFixHistory.fixId} IN (${fixIds.join(', ')})`);
  
  const total = history.length;
  const success = history.filter(h => h.fixResult === 'success').length;
  const partial = history.filter(h => h.fixResult === 'partial').length;
  const failure = history.filter(h => h.fixResult === 'failure').length;
  
  const successRate = total > 0 ? (success + partial * 0.5) / total : 0;
  
  return {
    total,
    success,
    partial,
    failure,
    successRate
  };
}

/**
 * Update fix success rates for all patterns
 */
export async function updateFixSuccessRates(): Promise<void> {
  // Get all patterns
  const patterns = await db.select().from(errorPatterns);
  
  // Update success rate for each pattern
  for (const pattern of patterns) {
    const { successRate } = await getFixSuccessRateForPattern(pattern.id);
    
    // Update fixes for this pattern
    await db
      .update(errorFixes)
      .set({ successRate })
      .where(eq(errorFixes.patternId, pattern.id));
  }
}

/**
 * Add a new project analysis
 * @param analysis The project analysis to add
 * @returns The added project analysis with its ID
 */
export async function addProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
  const [added] = await db.insert(projectAnalyses).values({
    ...analysis,
    startedAt: new Date()
  }).returning();
  
  return added as ProjectAnalysis;
}

/**
 * Update a project analysis
 * @param id Analysis ID
 * @param updates Fields to update
 * @returns The updated project analysis
 */
export async function updateProjectAnalysis(
  id: number, 
  updates: Partial<Omit<ProjectAnalysis, 'id' | 'startedAt'>>
): Promise<ProjectAnalysis | undefined> {
  const [updated] = await db
    .update(projectAnalyses)
    .set(updates)
    .where(eq(projectAnalyses.id, id))
    .returning();
  
  return updated as ProjectAnalysis | undefined;
}

/**
 * Get the latest project analysis
 * @returns The latest project analysis or undefined if none exists
 */
export async function getLatestProjectAnalysis(): Promise<ProjectAnalysis | undefined> {
  const [analysis] = await db
    .select()
    .from(projectAnalyses)
    .orderBy(desc(projectAnalyses.startedAt))
    .limit(1);
  
  return analysis as ProjectAnalysis | undefined;
}

/**
 * Get error trends over time
 * @param timeRange Time range in days (default: 30)
 * @returns Error trends data
 */
export async function getErrorTrends(timeRange: number = 30): Promise<{
  dates: string[];
  detected: number[];
  fixed: number[];
  active: number[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  // Calculate date range
  const dateRange: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= new Date()) {
    dateRange.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Get errors detected by day
  const detectedByDay = await db
    .select({
      date: sql<string>`DATE(${typescriptErrors.detectedAt})`,
      count: sql<number>`count(*)`
    })
    .from(typescriptErrors)
    .where(sql`${typescriptErrors.detectedAt} >= ${startDate}`)
    .groupBy(sql`DATE(${typescriptErrors.detectedAt})`)
    .orderBy(asc(sql`DATE(${typescriptErrors.detectedAt})`));
  
  // Get errors fixed by day
  const fixedByDay = await db
    .select({
      date: sql<string>`DATE(${typescriptErrors.resolvedAt})`,
      count: sql<number>`count(*)`
    })
    .from(typescriptErrors)
    .where(
      and(
        sql`${typescriptErrors.resolvedAt} IS NOT NULL`,
        sql`${typescriptErrors.resolvedAt} >= ${startDate}`
      )
    )
    .groupBy(sql`DATE(${typescriptErrors.resolvedAt})`)
    .orderBy(asc(sql`DATE(${typescriptErrors.resolvedAt})`));
  
  // Format results
  const detectedMap: Record<string, number> = {};
  for (const { date, count } of detectedByDay) {
    detectedMap[date] = count;
  }
  
  const fixedMap: Record<string, number> = {};
  for (const { date, count } of fixedByDay) {
    fixedMap[date] = count;
  }
  
  // Calculate active errors (cumulative detected - fixed)
  let runningTotal = 0;
  const detected: number[] = [];
  const fixed: number[] = [];
  const active: number[] = [];
  
  for (const date of dateRange) {
    const detectedCount = detectedMap[date] || 0;
    const fixedCount = fixedMap[date] || 0;
    
    runningTotal += detectedCount - fixedCount;
    
    detected.push(detectedCount);
    fixed.push(fixedCount);
    active.push(runningTotal);
  }
  
  return {
    dates: dateRange,
    detected,
    fixed,
    active
  };
}