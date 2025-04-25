import { db } from "./db";
import { 
  typescriptErrors, 
  errorPatterns, 
  errorFixes, 
  errorFixHistory, 
  projectAnalyses, 
  projectFiles,
  users,
  InsertTypescriptError,
  TypescriptError,
  InsertErrorPattern,
  ErrorPattern,
  InsertErrorFix,
  ErrorFix,
  InsertErrorFixHistory,
  ErrorFixHistory,
  InsertProjectAnalysis,
  ProjectAnalysis,
  InsertProjectFile,
  ProjectFile
} from "../shared/schema";
import { and, eq, gt, desc, count, sql } from "drizzle-orm";

/**
 * TypeScript Error Storage Manager
 * Handles all database operations related to TypeScript error tracking and management
 */
export class TSErrorStorage {
  // Error tracking methods
  async createTypescriptError(error: InsertTypescriptError): Promise<TypescriptError> {
    try {
      // Check if error already exists
      const existingErrors = await db.select()
        .from(typescriptErrors)
        .where(
          and(
            eq(typescriptErrors.errorCode, error.errorCode),
            eq(typescriptErrors.filePath, error.filePath),
            eq(typescriptErrors.lineNumber, error.lineNumber),
            eq(typescriptErrors.columnNumber, error.columnNumber)
          )
        );

      // If error already exists, increment the occurrence count
      if (existingErrors.length > 0) {
        const existingError = existingErrors[0];
        const [updatedError] = await db.update(typescriptErrors)
          .set({
            occurrenceCount: existingError.occurrenceCount + 1,
            lastOccurrenceAt: new Date(),
            // Update other fields if needed
            status: error.status || existingError.status,
            errorMessage: error.errorMessage || existingError.errorMessage,
            errorContext: error.errorContext || existingError.errorContext,
            category: error.category || existingError.category,
            severity: error.severity || existingError.severity,
            metadata: error.metadata || existingError.metadata
          })
          .where(eq(typescriptErrors.id, existingError.id))
          .returning();
        return updatedError;
      }

      // Otherwise, create a new error
      const [newError] = await db.insert(typescriptErrors)
        .values(error)
        .returning();
      return newError;
    } catch (err) {
      console.error("Error creating TypeScript error:", err);
      throw err;
    }
  }

  async getTypescriptErrorById(id: number): Promise<TypescriptError | null> {
    const result = await db.select().from(typescriptErrors).where(eq(typescriptErrors.id, id));
    return result[0] || null;
  }

  async updateTypescriptError(id: number, error: Partial<InsertTypescriptError>): Promise<TypescriptError> {
    const [updatedError] = await db.update(typescriptErrors)
      .set({ ...error })
      .where(eq(typescriptErrors.id, id))
      .returning();
    return updatedError;
  }

  async getAllTypescriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    filePath?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<TypescriptError[]> {
    let query = db.select().from(typescriptErrors);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(typescriptErrors.status, filters.status as any));
      }
      
      if (filters.severity) {
        conditions.push(eq(typescriptErrors.severity, filters.severity as any));
      }
      
      if (filters.category) {
        conditions.push(eq(typescriptErrors.category, filters.category as any));
      }
      
      if (filters.filePath) {
        conditions.push(eq(typescriptErrors.filePath, filters.filePath));
      }
      
      if (filters.fromDate) {
        conditions.push(sql`${typescriptErrors.detectedAt} >= ${filters.fromDate}`);
      }
      
      if (filters.toDate) {
        conditions.push(sql`${typescriptErrors.detectedAt} <= ${filters.toDate}`);
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    query = query.orderBy(
      desc(typescriptErrors.severity),
      desc(typescriptErrors.occurrenceCount),
      desc(typescriptErrors.lastOccurrenceAt)
    );
    
    return await query;
  }

  async getTypescriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
    fixRate: number;
  }> {
    // Create date filters if provided
    const dateFilters = [];
    if (fromDate) {
      dateFilters.push(sql`${typescriptErrors.detectedAt} >= ${fromDate}`);
    }
    if (toDate) {
      dateFilters.push(sql`${typescriptErrors.detectedAt} <= ${toDate}`);
    }
    
    // Get total errors
    const totalErrorsResult = await db.select({
      count: count()
    }).from(typescriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined);
    
    const totalErrors = Number(totalErrorsResult[0]?.count || 0);
    
    // Get errors by severity
    const bySeverityResult = await db.select({
      severity: typescriptErrors.severity,
      count: count()
    }).from(typescriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typescriptErrors.severity);
    
    const bySeverity: Record<string, number> = {};
    bySeverityResult.forEach(row => {
      bySeverity[row.severity] = Number(row.count);
    });
    
    // Get errors by category
    const byCategoryResult = await db.select({
      category: typescriptErrors.category,
      count: count()
    }).from(typescriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typescriptErrors.category);
    
    const byCategory: Record<string, number> = {};
    byCategoryResult.forEach(row => {
      byCategory[row.category] = Number(row.count);
    });
    
    // Get errors by status
    const byStatusResult = await db.select({
      status: typescriptErrors.status,
      count: count()
    }).from(typescriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typescriptErrors.status);
    
    const byStatus: Record<string, number> = {};
    byStatusResult.forEach(row => {
      byStatus[row.status] = Number(row.count);
    });
    
    // Get top files with errors
    const topFilesResult = await db.select({
      filePath: typescriptErrors.filePath,
      count: count()
    }).from(typescriptErrors)
    .where(dateFilters.length > 0 ? and(...dateFilters) : undefined)
    .groupBy(typescriptErrors.filePath)
    .orderBy(sql`count(*) desc`)
    .limit(10);
    
    const topFiles = topFilesResult.map(row => ({
      filePath: row.filePath,
      count: Number(row.count)
    }));
    
    // Calculate fix rate (fixed / total)
    const fixedCount = byStatus['fixed'] || 0;
    const fixRate = totalErrors > 0 ? (fixedCount / totalErrors) * 100 : 0;
    
    return {
      totalErrors,
      bySeverity,
      byCategory,
      byStatus,
      topFiles,
      fixRate
    };
  }

  async markErrorAsFixed(id: number, fixId: number, userId: number): Promise<TypescriptError> {
    const now = new Date();
    const [updatedError] = await db.update(typescriptErrors)
      .set({
        status: 'fixed',
        resolvedAt: now,
        fixId: fixId,
        userId: userId
      })
      .where(eq(typescriptErrors.id, id))
      .returning();
    return updatedError;
  }
  
  // Error pattern methods
  async createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
    const [newPattern] = await db.insert(errorPatterns)
      .values(pattern)
      .returning();
    return newPattern;
  }

  async getErrorPatternById(id: number): Promise<ErrorPattern | null> {
    const result = await db.select().from(errorPatterns).where(eq(errorPatterns.id, id));
    return result[0] || null;
  }

  async updateErrorPattern(id: number, pattern: Partial<InsertErrorPattern>): Promise<ErrorPattern> {
    const now = new Date();
    const [updatedPattern] = await db.update(errorPatterns)
      .set({
        ...pattern,
        updatedAt: now
      })
      .where(eq(errorPatterns.id, id))
      .returning();
    return updatedPattern;
  }

  async getAllErrorPatterns(): Promise<ErrorPattern[]> {
    return await db.select().from(errorPatterns);
  }

  async getErrorPatternsByCategory(category: string): Promise<ErrorPattern[]> {
    return await db.select()
      .from(errorPatterns)
      .where(eq(errorPatterns.category, category as any));
  }

  async getAutoFixablePatterns(): Promise<ErrorPattern[]> {
    return await db.select()
      .from(errorPatterns)
      .where(eq(errorPatterns.autoFixable, true));
  }
  
  // Fix methods
  async createErrorFix(fix: InsertErrorFix): Promise<ErrorFix> {
    const [newFix] = await db.insert(errorFixes)
      .values(fix)
      .returning();
    return newFix;
  }

  async getErrorFixById(id: number): Promise<ErrorFix | null> {
    const result = await db.select().from(errorFixes).where(eq(errorFixes.id, id));
    return result[0] || null;
  }

  async updateErrorFix(id: number, fix: Partial<InsertErrorFix>): Promise<ErrorFix> {
    const now = new Date();
    const [updatedFix] = await db.update(errorFixes)
      .set({
        ...fix,
        updatedAt: now
      })
      .where(eq(errorFixes.id, id))
      .returning();
    return updatedFix;
  }

  async getAllErrorFixes(): Promise<ErrorFix[]> {
    return await db.select().from(errorFixes);
  }

  async getFixesByPatternId(patternId: number): Promise<ErrorFix[]> {
    return await db.select()
      .from(errorFixes)
      .where(eq(errorFixes.patternId, patternId));
  }
  
  // Fix history methods
  async createFixHistory(fixHistory: InsertErrorFixHistory): Promise<ErrorFixHistory> {
    const [newFixHistory] = await db.insert(errorFixHistory)
      .values(fixHistory)
      .returning();
    return newFixHistory;
  }

  async getFixHistoryByErrorId(errorId: number): Promise<ErrorFixHistory[]> {
    return await db.select()
      .from(errorFixHistory)
      .where(eq(errorFixHistory.errorId, errorId))
      .orderBy(desc(errorFixHistory.fixedAt));
  }

  async getFixHistoryStats(userId?: number, fromDate?: Date, toDate?: Date): Promise<{
    totalFixes: number;
    byMethod: Record<string, number>;
    byResult: Record<string, number>;
    averageFixTime: number;
    topFixers: Array<{ userId: number; username: string; count: number }>;
  }> {
    // Create filters
    const filters = [];
    
    if (userId) {
      filters.push(eq(errorFixHistory.fixedBy, userId));
    }
    
    if (fromDate) {
      filters.push(sql`${errorFixHistory.fixedAt} >= ${fromDate}`);
    }
    
    if (toDate) {
      filters.push(sql`${errorFixHistory.fixedAt} <= ${toDate}`);
    }
    
    // Get total fixes
    const totalFixesResult = await db.select({
      count: count()
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined);
    
    const totalFixes = Number(totalFixesResult[0]?.count || 0);
    
    // Get fixes by method
    const byMethodResult = await db.select({
      method: errorFixHistory.fixMethod,
      count: count()
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(errorFixHistory.fixMethod);
    
    const byMethod: Record<string, number> = {};
    byMethodResult.forEach(row => {
      byMethod[row.method] = Number(row.count);
    });
    
    // Get fixes by result
    const byResultResult = await db.select({
      result: errorFixHistory.fixResult,
      count: count()
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(errorFixHistory.fixResult);
    
    const byResult: Record<string, number> = {};
    byResultResult.forEach(row => {
      byResult[row.result] = Number(row.count);
    });
    
    // Get average fix time
    const avgFixTimeResult = await db.select({
      avg: sql<number>`avg(${errorFixHistory.fixDuration})`
    }).from(errorFixHistory)
    .where(filters.length > 0 ? and(...filters) : undefined);
    
    const averageFixTime = Number(avgFixTimeResult[0]?.avg || 0);
    
    // Get top fixers
    const topFixersResult = await db
      .select({
        userId: errorFixHistory.fixedBy,
        username: users.username,
        count: count()
      })
      .from(errorFixHistory)
      .leftJoin(users, eq(errorFixHistory.fixedBy, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .groupBy(errorFixHistory.fixedBy, users.username)
      .orderBy(sql`count(*) desc`)
      .limit(10);
    
    const topFixers = topFixersResult.map(row => ({
      userId: row.userId as number,
      username: row.username as string,
      count: Number(row.count)
    }));
    
    return {
      totalFixes,
      byMethod,
      byResult,
      averageFixTime,
      topFixers
    };
  }
  
  // Project analysis methods
  async createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    const [newAnalysis] = await db.insert(projectAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getProjectAnalysisById(id: number): Promise<ProjectAnalysis | null> {
    const result = await db.select().from(projectAnalyses).where(eq(projectAnalyses.id, id));
    return result[0] || null;
  }

  async updateProjectAnalysis(id: number, analysis: Partial<InsertProjectAnalysis>): Promise<ProjectAnalysis> {
    const [updatedAnalysis] = await db.update(projectAnalyses)
      .set(analysis)
      .where(eq(projectAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }

  async getAllProjectAnalyses(limit?: number): Promise<ProjectAnalysis[]> {
    let query = db.select().from(projectAnalyses).orderBy(desc(projectAnalyses.startedAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async getLatestProjectAnalysis(): Promise<ProjectAnalysis | null> {
    const results = await db.select().from(projectAnalyses)
      .orderBy(desc(projectAnalyses.startedAt))
      .limit(1);
    return results[0] || null;
  }
  
  // Project file methods
  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db.insert(projectFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile> {
    const [updatedFile] = await db.update(projectFiles)
      .set(file)
      .where(eq(projectFiles.id, id))
      .returning();
    return updatedFile;
  }

  async getProjectFileByPath(filePath: string): Promise<ProjectFile | null> {
    const results = await db.select().from(projectFiles)
      .where(eq(projectFiles.filePath, filePath));
    return results[0] || null;
  }

  async getAllProjectFiles(): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles);
  }

  async getProjectFilesWithErrors(): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles)
      .where(gt(projectFiles.errorCount, 0))
      .orderBy(desc(projectFiles.errorCount));
  }
}

// Export an instance of TSErrorStorage
export const tsErrorStorage = new TSErrorStorage();