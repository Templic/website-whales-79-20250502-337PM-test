/**
 * TypeScript Error Storage 
 * 
 * Provides storage interface implementations for the TypeScript error management system.
 */

import { IStorage } from "./storage";
import { DatabaseStorage } from "./DatabaseStorage";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  typeScriptErrors, type TypeScriptError, type InsertTypeScriptError,
  errorPatterns, type ErrorPattern, type InsertErrorPattern,
  errorFixes, type ErrorFix, type InsertErrorFix,
  errorAnalysis, type ErrorAnalysis, type InsertErrorAnalysis,
  scanResults, type ScanResult, type InsertScanResult 
} from "../shared/schema";

// Comprehensive interface for TypeScript error management
export interface ITypeScriptErrorStorage {
  // Error tracking methods
  createTypeScriptError(error: InsertTypeScriptError): Promise<TypeScriptError>;
  getTypeScriptErrorById(id: number): Promise<TypeScriptError | null>;
  updateTypeScriptError(id: number, error: Partial<InsertTypeScriptError>): Promise<TypeScriptError>;
  getAllTypeScriptErrors(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    file_path?: string;
    detected_after?: Date;
    detected_before?: Date;
  }): Promise<TypeScriptError[]>;
  getTypeScriptErrorStats(fromDate?: Date, toDate?: Date): Promise<{
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    topFiles: Array<{ filePath: string; count: number }>;
    fixRate: number;
  }>;
  markErrorAsFixed(id: number, fixId: number, userId: number): Promise<TypeScriptError>;
  
  // Error pattern methods
  createErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern>;
  getErrorPatternById(id: number): Promise<ErrorPattern | null>;
  updateErrorPattern(id: number, pattern: Partial<InsertErrorPattern>): Promise<ErrorPattern>;
  getAllErrorPatterns(): Promise<ErrorPattern[]>;
  getErrorPatternsByCategory(category: string): Promise<ErrorPattern[]>;
  getAutoFixablePatterns(): Promise<ErrorPattern[]>;
  
  // Error fix methods
  createErrorFix(fix: InsertErrorFix): Promise<ErrorFix>;
  getErrorFixById(id: number): Promise<ErrorFix | null>;
  updateErrorFix(id: number, fix: Partial<InsertErrorFix>): Promise<ErrorFix>;
  getAllErrorFixes(): Promise<ErrorFix[]>;
  getFixesByPatternId(patternId: number): Promise<ErrorFix[]>;
  
  // Error analysis methods
  createErrorAnalysis(analysis: InsertErrorAnalysis): Promise<ErrorAnalysis>;
  getErrorAnalysisById(id: number): Promise<ErrorAnalysis | null>;
  getAnalysisForError(errorId: number): Promise<ErrorAnalysis | null>;
  
  // Scan results methods
  createScanResult(result: InsertScanResult): Promise<ScanResult>;
  getScanResultById(id: number): Promise<ScanResult | null>;
  getLatestScanResults(limit: number): Promise<ScanResult[]>;
}

// Use the DatabaseStorage for persistent storage
export const tsErrorStorage: ITypeScriptErrorStorage = new DatabaseStorage();

// For convenience, re-export error-related types from schema
export {
  TypeScriptError, InsertTypeScriptError,
  ErrorPattern, InsertErrorPattern,
  ErrorFix, InsertErrorFix,
  ErrorAnalysis, InsertErrorAnalysis,
  ScanResult, InsertScanResult
};