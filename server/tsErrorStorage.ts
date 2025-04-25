/**
 * TypeScript Error Storage
 * 
 * Dedicated storage class for managing TypeScript errors, patterns, fixes, and analysis results.
 * This is separated from the main storage to keep the codebase organized.
 */

import { db } from './db';
import { eq, and, gte, desc, asc, sql, count, like, isNull, not, or } from 'drizzle-orm';
import {
  typescriptErrors,
  errorPatterns,
  errorFixes,
  errorFixHistory,
  projectAnalyses,
  projectFiles,
  InsertTypescriptError,
  InsertErrorPattern,
  InsertErrorFix,
  InsertErrorFixHistory,
  InsertProjectAnalysis,
  InsertProjectFile,
  TypescriptError,
  ErrorPattern,
  ErrorFix,
  ErrorFixHistory,
  ProjectAnalysis,
  ProjectFile
} from '../shared/schema';

/**
 * Storage class for TypeScript error management
 */
export class TSErrorStorage {
  /**
   * Create a new TypeScript error
   */
  async createTypescriptError(error: InsertTypescriptError): Promise<TypescriptError> {
    // Check if this exact error already exists
    const existingErrors = await db
      .select()
      .from(typescriptErrors)
      .where(and(
        eq(typescriptErrors.filePath, error.filePath),
        eq(typescriptErrors.lineNumber, error.lineNumber),
        eq(typescriptErrors.columnNumber, error.columnNumber),
        eq(typescriptErrors.errorCode, error.errorCode)
      ));
    
    if (existingErrors.length > 0) {
      // Update the existing error
      const existingError = existingErrors[0];
      const [updatedError] = await db
        .update(typescriptErrors)
        .set({
          occurrenceCount: existingError.occurrenceCount + 1,
          lastOccurrenceAt: new Date(),
          metadata: {
            ...existingError.metadata,
            ...error.metadata
          }
        })
        .where(eq(typescriptErrors.id, existingError.id))
        .returning();
      
      return updatedError;
    }
    
    // Create a new error
    const [newError] = await db
      .insert(typescriptErrors)
      .values(error)
      .returning();
    
    return newError;
  }
  
  /**
   * Get all TypeScript errors with optional filtering
   */
  async getAllTypescriptErrors(filters?: {
    filePath?: string;
    errorCode?: string;
    category?: string;
    severity?: string;
    status?: string;
    userId?: number;
    patternId?: number;
    fixId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<TypescriptError[]> {
    let query = db.select().from(typescriptErrors);
    
    if (filters) {
      if (filters.filePath) {
        query = query.where(like(typescriptErrors.filePath, `%${filters.filePath}%`));
      }
      if (filters.errorCode) {
        query = query.where(eq(typescriptErrors.errorCode, filters.errorCode));
      }
      if (filters.category) {
        query = query.where(eq(typescriptErrors.category, filters.category as any));
      }
      if (filters.severity) {
        query = query.where(eq(typescriptErrors.severity, filters.severity as any));
      }
      if (filters.status) {
        query = query.where(eq(typescriptErrors.status, filters.status as any));
      }
      if (filters.userId) {
        query = query.where(eq(typescriptErrors.userId, filters.userId));
      }
      if (filters.patternId) {
        query = query.where(eq(typescriptErrors.patternId, filters.patternId));
      }
      if (filters.fromDate) {
        query = query.where(gte(typescriptErrors.detectedAt, filters.fromDate));
      }
      if (filters.toDate) {
        query = query.where(gte(typescriptErrors.detectedAt, filters.toDate));
      }
    }
    
    return await query.orderBy(desc(typescriptErrors.detectedAt));
  }
  
  /**
   * Get a specific TypeScript error by ID
   */
  async getTypescriptError(id: number): Promise<TypescriptError | undefined> {
    const [error] = await db
      .select()
      .from(typescriptErrors)
      .where(eq(typescriptErrors.id, id));
    
    return error;
  }
  
  /**
   * Update a TypeScript error
   */
  async updateTypescriptError(
    id: number, 
    updates: Partial<Omit<InsertTypescriptError, 'id'>>
  ): Promise<TypescriptError | undefined> {
    const [updatedError] = await db
      .update(typescriptErrors)
      .set(updates)
      .where(eq(typescriptErrors.id, id))
      .returning();
    
    return updatedError;
  }
  
  /**
   * Mark a TypeScript error as fixed
   */
  async markErrorAsFixed(
    id: number, 
    fixId: number,
    userId: number
  ): Promise<TypescriptError | undefined> {
    const [updatedError] = await db
      .update(typescriptErrors)
      .set({
        status: 'fixed',
        fixedAt: new Date(),
        fixedBy: userId,
        fixId
      })
      .where(eq(typescriptErrors.id, id))
      .returning();
    
    return updatedError;
  }
  
  /**
   * Create a new error pattern
   */
  async createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
    const [newPattern] = await db
      .insert(errorPatterns)
      .values(pattern)
      .returning();
    
    return newPattern;
  }
  
  /**
   * Get all error patterns
   */
  async getAllErrorPatterns(): Promise<ErrorPattern[]> {
    return await db
      .select()
      .from(errorPatterns)
      .orderBy(desc(errorPatterns.createdAt));
  }
  
  /**
   * Get error patterns by category
   */
  async getErrorPatternsByCategory(category: string): Promise<ErrorPattern[]> {
    return await db
      .select()
      .from(errorPatterns)
      .where(eq(errorPatterns.category, category as any))
      .orderBy(desc(errorPatterns.createdAt));
  }
  
  /**
   * Get a specific error pattern by ID
   */
  async getErrorPattern(id: number): Promise<ErrorPattern | undefined> {
    const [pattern] = await db
      .select()
      .from(errorPatterns)
      .where(eq(errorPatterns.id, id));
    
    return pattern;
  }
  
  /**
   * Create a new error fix
   */
  async createErrorFix(fix: InsertErrorFix): Promise<ErrorFix> {
    const [newFix] = await db
      .insert(errorFixes)
      .values(fix)
      .returning();
    
    return newFix;
  }
  
  /**
   * Get all error fixes
   */
  async getAllErrorFixes(): Promise<ErrorFix[]> {
    return await db
      .select()
      .from(errorFixes)
      .orderBy(desc(errorFixes.createdAt));
  }
  
  /**
   * Get fixes by pattern ID
   */
  async getFixesByPatternId(patternId: number): Promise<ErrorFix[]> {
    return await db
      .select()
      .from(errorFixes)
      .where(eq(errorFixes.patternId, patternId))
      .orderBy(desc(errorFixes.createdAt));
  }
  
  /**
   * Create a new fix history record
   */
  async createFixHistory(history: InsertErrorFixHistory): Promise<ErrorFixHistory> {
    const [newHistory] = await db
      .insert(errorFixHistory)
      .values(history)
      .returning();
    
    return newHistory;
  }
  
  /**
   * Get fix history for an error
   */
  async getFixHistoryForError(errorId: number): Promise<ErrorFixHistory[]> {
    return await db
      .select()
      .from(errorFixHistory)
      .where(eq(errorFixHistory.errorId, errorId))
      .orderBy(desc(errorFixHistory.fixedAt));
  }
  
  /**
   * Create a new project analysis record
   */
  async createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const [newAnalysis] = await db
      .insert(projectAnalyses)
      .values(analysis)
      .returning();
    
    return newAnalysis;
  }
  
  /**
   * Get a project analysis by ID
   */
  async getProjectAnalysis(id: number): Promise<ProjectAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(projectAnalyses)
      .where(eq(projectAnalyses.id, id));
    
    return analysis;
  }
  
  /**
   * Get the latest project analysis
   */
  async getLatestProjectAnalysis(): Promise<ProjectAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(projectAnalyses)
      .orderBy(desc(projectAnalyses.completedAt))
      .limit(1);
    
    return analysis;
  }
  
  /**
   * Create a new project file record
   */
  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    // Check if file already exists
    const existingFiles = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.filePath, file.filePath));
    
    if (existingFiles.length > 0) {
      // Update the existing file
      const [updatedFile] = await db
        .update(projectFiles)
        .set({
          lastAnalyzedAt: new Date(),
          errorCount: file.errorCount,
          fixedErrorCount: file.fixedErrorCount,
          status: file.status
        })
        .where(eq(projectFiles.id, existingFiles[0].id))
        .returning();
      
      return updatedFile;
    }
    
    // Create a new file record
    const [newFile] = await db
      .insert(projectFiles)
      .values(file)
      .returning();
    
    return newFile;
  }
  
  /**
   * Get TypeScript error statistics
   */
  async getTypescriptErrorStats(fromDate: Date): Promise<{
    totalErrors: number;
    fixedErrors: number;
    fixRate: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
  }> {
    // Get total errors
    const [totalCount] = await db
      .select({ count: count() })
      .from(typescriptErrors)
      .where(gte(typescriptErrors.detectedAt, fromDate));
    
    // Get fixed errors
    const [fixedCount] = await db
      .select({ count: count() })
      .from(typescriptErrors)
      .where(and(
        gte(typescriptErrors.detectedAt, fromDate),
        eq(typescriptErrors.status, 'fixed')
      ));
    
    // Calculate fix rate
    const fixRate = totalCount.count > 0 
      ? (fixedCount.count / totalCount.count) * 100 
      : 0;
    
    // Get errors by severity
    const severityCounts = await db
      .select({
        severity: typescriptErrors.severity,
        count: count()
      })
      .from(typescriptErrors)
      .where(gte(typescriptErrors.detectedAt, fromDate))
      .groupBy(typescriptErrors.severity);
    
    // Get errors by category
    const categoryCounts = await db
      .select({
        category: typescriptErrors.category,
        count: count()
      })
      .from(typescriptErrors)
      .where(gte(typescriptErrors.detectedAt, fromDate))
      .groupBy(typescriptErrors.category);
    
    // Get errors by status
    const statusCounts = await db
      .select({
        status: typescriptErrors.status,
        count: count()
      })
      .from(typescriptErrors)
      .where(gte(typescriptErrors.detectedAt, fromDate))
      .groupBy(typescriptErrors.status);
    
    // Get top files with errors
    const topFiles = await db
      .select({
        filePath: typescriptErrors.filePath,
        count: count()
      })
      .from(typescriptErrors)
      .where(gte(typescriptErrors.detectedAt, fromDate))
      .groupBy(typescriptErrors.filePath)
      .orderBy(desc(count()))
      .limit(10);
    
    // Format results
    const bySeverity: Record<string, number> = {};
    severityCounts.forEach(item => {
      bySeverity[item.severity] = item.count;
    });
    
    const byCategory: Record<string, number> = {};
    categoryCounts.forEach(item => {
      byCategory[item.category] = item.count;
    });
    
    const byStatus: Record<string, number> = {};
    statusCounts.forEach(item => {
      byStatus[item.status] = item.count;
    });
    
    return {
      totalErrors: totalCount.count,
      fixedErrors: fixedCount.count,
      fixRate,
      bySeverity,
      byCategory,
      byStatus,
      topFiles
    };
  }
}

export const tsErrorStorage = new TSErrorStorage();