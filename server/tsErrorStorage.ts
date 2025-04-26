/**
 * TypeScript Error Storage
 * 
 * This module provides database access for storing and retrieving TypeScript errors.
 */

import { eq, and, or, like, sql, desc } from 'drizzle-orm';
import { 
  typescriptErrors, errorPatterns, errorFixes, errorFixHistory, projectAnalyses,
  TypeScriptError, InsertTypeScriptError, ErrorPattern, InsertErrorPattern,
  ErrorFix, InsertErrorFix, ErrorFixHistory, InsertErrorFixHistory,
  ProjectAnalysis, InsertProjectAnalysis
} from '../shared/schema';
import { db } from './db';

/**
 * TypeScript Error Storage class
 * 
 * Provides methods for storing and retrieving TypeScript errors.
 */
export class TypescriptErrorStorage {
  /**
   * Get all TypeScript errors matching the filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of TypeScript errors
   */
  async getAllTypescriptErrors(filter: {
    errorCode?: string;
    filePath?: string;
    lineNumber?: number;
    columnNumber?: number;
    category?: string;
    severity?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<TypeScriptError[]> {
    try {
      let query = db.select().from(typescriptErrors);
      
      // Apply filters
      const conditions = [];
      
      if (filter.errorCode) {
        conditions.push(eq(typescriptErrors.errorCode, filter.errorCode));
      }
      
      if (filter.filePath) {
        conditions.push(eq(typescriptErrors.filePath, filter.filePath));
      }
      
      if (filter.lineNumber) {
        conditions.push(eq(typescriptErrors.lineNumber, filter.lineNumber));
      }
      
      if (filter.columnNumber) {
        conditions.push(eq(typescriptErrors.columnNumber, filter.columnNumber));
      }
      
      if (filter.category) {
        conditions.push(eq(typescriptErrors.category, filter.category));
      }
      
      if (filter.severity) {
        conditions.push(eq(typescriptErrors.severity, filter.severity));
      }
      
      if (filter.status) {
        conditions.push(eq(typescriptErrors.status, filter.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply limit
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      // Sort by most recent detection
      query = query.orderBy(desc(typescriptErrors.lastOccurrenceAt));
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting TypeScript errors:', error);
      throw error;
    }
  }
  
  /**
   * Get TypeScript error by ID
   * 
   * @param id Error ID
   * @returns TypeScript error or undefined
   */
  async getTypescriptError(id: number): Promise<TypeScriptError | undefined> {
    try {
      const [error] = await db
        .select()
        .from(typescriptErrors)
        .where(eq(typescriptErrors.id, id));
      
      return error;
    } catch (error) {
      console.error('Error getting TypeScript error:', error);
      throw error;
    }
  }
  
  /**
   * Create a new TypeScript error
   * 
   * @param error TypeScript error data
   * @returns Created TypeScript error
   */
  async createTypescriptError(error: InsertTypeScriptError): Promise<TypeScriptError> {
    try {
      const [result] = await db
        .insert(typescriptErrors)
        .values(error)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating TypeScript error:', error);
      throw error;
    }
  }
  
  /**
   * Update a TypeScript error
   * 
   * @param id Error ID
   * @param data Updated error data
   * @returns Updated TypeScript error
   */
  async updateTypescriptError(
    id: number,
    data: Partial<TypeScriptError>
  ): Promise<TypeScriptError> {
    try {
      const [updated] = await db
        .update(typescriptErrors)
        .set(data)
        .where(eq(typescriptErrors.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating TypeScript error:', error);
      throw error;
    }
  }
  
  /**
   * Search for TypeScript errors
   * 
   * @param query Search query
   * @returns Array of TypeScript errors
   */
  async searchTypescriptErrors(query: {
    searchText?: string;
    codePatterns?: string[];
    messagePatterns?: string[];
    contextClues?: string[];
  } = {}): Promise<TypeScriptError[]> {
    try {
      let dbQuery = db.select().from(typescriptErrors);
      const conditions = [];
      
      // Search by text
      if (query.searchText) {
        conditions.push(
          or(
            like(typescriptErrors.errorMessage, `%${query.searchText}%`),
            like(typescriptErrors.errorContext, `%${query.searchText}%`),
            like(typescriptErrors.filePath, `%${query.searchText}%`)
          )
        );
      }
      
      // Search by code patterns
      if (query.codePatterns && query.codePatterns.length > 0) {
        const codeConditions = query.codePatterns.map(pattern => 
          like(typescriptErrors.errorCode, `%${pattern}%`)
        );
        
        conditions.push(or(...codeConditions));
      }
      
      // Search by message patterns
      if (query.messagePatterns && query.messagePatterns.length > 0) {
        const messageConditions = query.messagePatterns.map(pattern => 
          like(typescriptErrors.errorMessage, `%${pattern}%`)
        );
        
        conditions.push(or(...messageConditions));
      }
      
      // Search by context clues
      if (query.contextClues && query.contextClues.length > 0) {
        const contextConditions = query.contextClues.map(clue => 
          like(typescriptErrors.errorContext, `%${clue}%`)
        );
        
        conditions.push(or(...contextConditions));
      }
      
      // Apply conditions
      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions));
      }
      
      // Sort by most recent
      dbQuery = dbQuery.orderBy(desc(typescriptErrors.lastOccurrenceAt));
      
      // Limit to 100 results
      dbQuery = dbQuery.limit(100);
      
      const results = await dbQuery;
      return results;
    } catch (error) {
      console.error('Error searching TypeScript errors:', error);
      throw error;
    }
  }
  
  /**
   * Get error patterns matching the filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of error patterns
   */
  async getErrorPatterns(filter: {
    name?: string;
    category?: string;
    severity?: string;
    autoFixable?: boolean;
    limit?: number;
  } = {}): Promise<ErrorPattern[]> {
    try {
      let query = db.select().from(errorPatterns);
      
      // Apply filters
      const conditions = [];
      
      if (filter.name) {
        conditions.push(eq(errorPatterns.name, filter.name));
      }
      
      if (filter.category) {
        conditions.push(eq(errorPatterns.category, filter.category));
      }
      
      if (filter.severity) {
        conditions.push(eq(errorPatterns.severity, filter.severity));
      }
      
      if (filter.autoFixable !== undefined) {
        conditions.push(eq(errorPatterns.autoFixable, filter.autoFixable));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply limit
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting error patterns:', error);
      throw error;
    }
  }
  
  /**
   * Get error pattern by ID
   * 
   * @param id Pattern ID
   * @returns Error pattern or undefined
   */
  async getErrorPattern(id: number): Promise<ErrorPattern | undefined> {
    try {
      const [pattern] = await db
        .select()
        .from(errorPatterns)
        .where(eq(errorPatterns.id, id));
      
      return pattern;
    } catch (error) {
      console.error('Error getting error pattern:', error);
      throw error;
    }
  }
  
  /**
   * Create a new error pattern
   * 
   * @param pattern Error pattern data
   * @returns Created error pattern
   */
  async createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
    try {
      const [result] = await db
        .insert(errorPatterns)
        .values(pattern)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating error pattern:', error);
      throw error;
    }
  }
  
  /**
   * Update an error pattern
   * 
   * @param id Pattern ID
   * @param data Updated pattern data
   * @returns Updated error pattern
   */
  async updateErrorPattern(
    id: number,
    data: Partial<ErrorPattern>
  ): Promise<ErrorPattern> {
    try {
      const [updated] = await db
        .update(errorPatterns)
        .set(data)
        .where(eq(errorPatterns.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating error pattern:', error);
      throw error;
    }
  }
  
  /**
   * Get error fixes matching the filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of error fixes
   */
  async getErrorFixes(filter: {
    patternId?: number;
    fixTitle?: string;
    fixType?: string;
    limit?: number;
  } = {}): Promise<ErrorFix[]> {
    try {
      let query = db.select().from(errorFixes);
      
      // Apply filters
      const conditions = [];
      
      if (filter.patternId) {
        conditions.push(eq(errorFixes.patternId, filter.patternId));
      }
      
      if (filter.fixTitle) {
        conditions.push(eq(errorFixes.fixTitle, filter.fixTitle));
      }
      
      if (filter.fixType) {
        conditions.push(eq(errorFixes.fixType, filter.fixType));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply limit
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting error fixes:', error);
      throw error;
    }
  }
  
  /**
   * Get error fix by ID
   * 
   * @param id Fix ID
   * @returns Error fix or undefined
   */
  async getErrorFix(id: number): Promise<ErrorFix | undefined> {
    try {
      const [fix] = await db
        .select()
        .from(errorFixes)
        .where(eq(errorFixes.id, id));
      
      return fix;
    } catch (error) {
      console.error('Error getting error fix:', error);
      throw error;
    }
  }
  
  /**
   * Create a new error fix
   * 
   * @param fix Error fix data
   * @returns Created error fix
   */
  async createErrorFix(fix: InsertErrorFix): Promise<ErrorFix> {
    try {
      const [result] = await db
        .insert(errorFixes)
        .values(fix)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating error fix:', error);
      throw error;
    }
  }
  
  /**
   * Update an error fix
   * 
   * @param id Fix ID
   * @param data Updated fix data
   * @returns Updated error fix
   */
  async updateErrorFix(
    id: number,
    data: Partial<ErrorFix>
  ): Promise<ErrorFix> {
    try {
      const [updated] = await db
        .update(errorFixes)
        .set(data)
        .where(eq(errorFixes.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating error fix:', error);
      throw error;
    }
  }
  
  /**
   * Get error fix history matching the filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of error fix history
   */
  async getErrorFixHistory(filter: {
    errorId?: number;
    fixId?: number;
    fixedBy?: string;
    fixMethod?: string;
    fixResult?: string;
    limit?: number;
  } = {}): Promise<ErrorFixHistory[]> {
    try {
      let query = db.select().from(errorFixHistory);
      
      // Apply filters
      const conditions = [];
      
      if (filter.errorId) {
        conditions.push(eq(errorFixHistory.errorId, filter.errorId));
      }
      
      if (filter.fixId) {
        conditions.push(eq(errorFixHistory.fixId, filter.fixId));
      }
      
      if (filter.fixedBy) {
        conditions.push(eq(errorFixHistory.fixedBy, filter.fixedBy));
      }
      
      if (filter.fixMethod) {
        conditions.push(eq(errorFixHistory.fixMethod, filter.fixMethod));
      }
      
      if (filter.fixResult) {
        conditions.push(eq(errorFixHistory.fixResult, filter.fixResult));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply limit
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      // Sort by most recent
      query = query.orderBy(desc(errorFixHistory.fixedAt));
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting error fix history:', error);
      throw error;
    }
  }
  
  /**
   * Create a new error fix history
   * 
   * @param history Error fix history data
   * @returns Created error fix history
   */
  async createErrorFixHistory(history: InsertErrorFixHistory): Promise<ErrorFixHistory> {
    try {
      const [result] = await db
        .insert(errorFixHistory)
        .values(history)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating error fix history:', error);
      throw error;
    }
  }
  
  /**
   * Get project analyses matching the filter criteria
   * 
   * @param filter Filter criteria
   * @returns Array of project analyses
   */
  async getProjectAnalyses(filter: {
    projectId?: number;
    status?: string;
    executedBy?: string;
    limit?: number;
  } = {}): Promise<ProjectAnalysis[]> {
    try {
      let query = db.select().from(projectAnalyses);
      
      // Apply filters
      const conditions = [];
      
      if (filter.projectId) {
        conditions.push(eq(projectAnalyses.projectId, filter.projectId));
      }
      
      if (filter.status) {
        conditions.push(eq(projectAnalyses.status, filter.status));
      }
      
      if (filter.executedBy) {
        conditions.push(eq(projectAnalyses.executedBy, filter.executedBy));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply limit
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      
      // Sort by most recent
      query = query.orderBy(desc(projectAnalyses.startedAt));
      
      const results = await query;
      return results;
    } catch (error) {
      console.error('Error getting project analyses:', error);
      throw error;
    }
  }
  
  /**
   * Create a new project analysis
   * 
   * @param analysis Project analysis data
   * @returns Created project analysis
   */
  async createProjectAnalysis(analysis: InsertProjectAnalysis): Promise<ProjectAnalysis> {
    try {
      const [result] = await db
        .insert(projectAnalyses)
        .values(analysis)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating project analysis:', error);
      throw error;
    }
  }
  
  /**
   * Update a project analysis
   * 
   * @param id Analysis ID
   * @param data Updated analysis data
   * @returns Updated project analysis
   */
  async updateProjectAnalysis(
    id: number,
    data: Partial<ProjectAnalysis>
  ): Promise<ProjectAnalysis> {
    try {
      const [updated] = await db
        .update(projectAnalyses)
        .set(data)
        .where(eq(projectAnalyses.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error updating project analysis:', error);
      throw error;
    }
  }
  
  /**
   * Get error statistics
   * 
   * @returns Error statistics
   */
  async getErrorStatistics(): Promise<{
    totalErrors: number;
    activeErrors: number;
    fixedErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    topErrorFiles: Array<{ filePath: string; errorCount: number }>;
  }> {
    try {
      // Total errors
      const [{ count: totalErrors }] = await db
        .select({ count: sql`count(*)` })
        .from(typescriptErrors);
      
      // Active errors
      const [{ count: activeErrors }] = await db
        .select({ count: sql`count(*)` })
        .from(typescriptErrors)
        .where(eq(typescriptErrors.status, 'detected'));
      
      // Fixed errors
      const [{ count: fixedErrors }] = await db
        .select({ count: sql`count(*)` })
        .from(typescriptErrors)
        .where(eq(typescriptErrors.status, 'fixed'));
      
      // Errors by category
      const errorsByCategory = await db
        .select({
          category: typescriptErrors.category,
          count: sql`count(*)`
        })
        .from(typescriptErrors)
        .groupBy(typescriptErrors.category);
      
      // Errors by severity
      const errorsBySeverity = await db
        .select({
          severity: typescriptErrors.severity,
          count: sql`count(*)`
        })
        .from(typescriptErrors)
        .groupBy(typescriptErrors.severity);
      
      // Top error files
      const topErrorFiles = await db
        .select({
          filePath: typescriptErrors.filePath,
          errorCount: sql`count(*)`
        })
        .from(typescriptErrors)
        .groupBy(typescriptErrors.filePath)
        .orderBy(sql`count(*)`, 'desc')
        .limit(10);
      
      // Format results
      const categoryMap: Record<string, number> = {};
      const severityMap: Record<string, number> = {};
      
      for (const { category, count } of errorsByCategory) {
        categoryMap[category] = Number(count);
      }
      
      for (const { severity, count } of errorsBySeverity) {
        severityMap[severity] = Number(count);
      }
      
      return {
        totalErrors: Number(totalErrors),
        activeErrors: Number(activeErrors),
        fixedErrors: Number(fixedErrors),
        errorsByCategory: categoryMap,
        errorsBySeverity: severityMap,
        topErrorFiles: topErrorFiles.map(({ filePath, errorCount }) => ({
          filePath,
          errorCount: Number(errorCount)
        }))
      };
    } catch (error) {
      console.error('Error getting error statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get pattern statistics
   * 
   * @returns Pattern statistics
   */
  async getPatternStatistics(): Promise<{
    totalPatterns: number;
    fixablePatterns: number;
    patternsWithFixes: number;
    patternsByCategory: Record<string, number>;
  }> {
    try {
      // Total patterns
      const [{ count: totalPatterns }] = await db
        .select({ count: sql`count(*)` })
        .from(errorPatterns);
      
      // Fixable patterns
      const [{ count: fixablePatterns }] = await db
        .select({ count: sql`count(*)` })
        .from(errorPatterns)
        .where(eq(errorPatterns.autoFixable, true));
      
      // Patterns with fixes
      const patternsWithFixes = await db
        .select({ patternId: errorFixes.patternId })
        .from(errorFixes)
        .groupBy(errorFixes.patternId);
      
      // Patterns by category
      const patternsByCategory = await db
        .select({
          category: errorPatterns.category,
          count: sql`count(*)`
        })
        .from(errorPatterns)
        .groupBy(errorPatterns.category);
      
      // Format results
      const categoryMap: Record<string, number> = {};
      
      for (const { category, count } of patternsByCategory) {
        categoryMap[category] = Number(count);
      }
      
      return {
        totalPatterns: Number(totalPatterns),
        fixablePatterns: Number(fixablePatterns),
        patternsWithFixes: patternsWithFixes.length,
        patternsByCategory: categoryMap
      };
    } catch (error) {
      console.error('Error getting pattern statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get fix statistics
   * 
   * @returns Fix statistics
   */
  async getFixStatistics(): Promise<{
    totalFixes: number;
    successfulFixes: number;
    failedFixes: number;
    fixesByMethod: Record<string, number>;
  }> {
    try {
      // Total fixes
      const [{ count: totalFixes }] = await db
        .select({ count: sql`count(*)` })
        .from(errorFixHistory);
      
      // Successful fixes
      const [{ count: successfulFixes }] = await db
        .select({ count: sql`count(*)` })
        .from(errorFixHistory)
        .where(eq(errorFixHistory.fixResult, 'success'));
      
      // Failed fixes
      const [{ count: failedFixes }] = await db
        .select({ count: sql`count(*)` })
        .from(errorFixHistory)
        .where(eq(errorFixHistory.fixResult, 'failure'));
      
      // Fixes by method
      const fixesByMethod = await db
        .select({
          method: errorFixHistory.fixMethod,
          count: sql`count(*)`
        })
        .from(errorFixHistory)
        .groupBy(errorFixHistory.fixMethod);
      
      // Format results
      const methodMap: Record<string, number> = {};
      
      for (const { method, count } of fixesByMethod) {
        methodMap[method] = Number(count);
      }
      
      return {
        totalFixes: Number(totalFixes),
        successfulFixes: Number(successfulFixes),
        failedFixes: Number(failedFixes),
        fixesByMethod: methodMap
      };
    } catch (error) {
      console.error('Error getting fix statistics:', error);
      throw error;
    }
  }
}

export const tsErrorStorage = new TypescriptErrorStorage();