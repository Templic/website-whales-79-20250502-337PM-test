/**
 * TypeScript Error Fixer
 * 
 * This module provides utilities for automatically fixing TypeScript errors
 * using pattern-based solutions, AI-generated fixes, and best practices.
 */

import fs from 'fs';
import path from 'path';
import { TypeScriptError, ErrorFix, InsertErrorFix, ErrorFixHistory, InsertErrorFixHistory } from '../tsErrorStorage';
import { tsErrorStorage } from '../tsErrorStorage';
import { db } from '../db';
import { errorFixes, ErrorStatus, FixMethod } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Configuration options for the error fixer
 */
export interface ErrorFixerOptions {
  dryRun?: boolean;
  backupFiles?: boolean;
  maxConsecutiveFixes?: number;
  maxErrorsToFix?: number;
  skipErrorCodes?: string[];
  onlyErrorCodes?: string[];
  applyStrategy?: 'safe' | 'aggressive' | 'balanced';
  fixMethod?: FixMethod;
}

/**
 * Default configuration for the error fixer
 */
const DEFAULT_OPTIONS: ErrorFixerOptions = {
  dryRun: false,
  backupFiles: true,
  maxConsecutiveFixes: 5,
  maxErrorsToFix: 100,
  applyStrategy: 'balanced',
  fixMethod: FixMethod.AUTOMATIC
};

/**
 * Result of a fix attempt
 */
export interface FixResult {
  error: TypeScriptError;
  success: boolean;
  fixApplied: ErrorFix | null;
  message: string;
  originalCode?: string;
  fixedCode?: string;
}

/**
 * Create a backup of a file before modifying it
 * 
 * @param filePath Path to the file to backup
 * @returns Path to the backup file or null if backup failed
 */
function createFileBackup(filePath: string): string | null {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(path.dirname(filePath), '.ts-error-backups');
    const fileName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create the backup
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (err) {
    console.error(`Failed to create backup of ${filePath}:`, err);
    return null;
  }
}

/**
 * Find the best available fix for a TypeScript error
 * 
 * @param error The TypeScript error to fix
 * @param options Configuration options
 * @returns The best fix to apply, or null if no suitable fix is found
 */
export async function findBestFix(
  error: TypeScriptError,
  options: ErrorFixerOptions = {}
): Promise<ErrorFix | null> {
  try {
    // Check if there's a pattern-matched fix
    if (error.pattern_id) {
      const patternFixes = await tsErrorStorage.getFixesForPattern(error.pattern_id);
      if (patternFixes && patternFixes.length > 0) {
        // Sort by success rate and priority
        const bestPatternFix = patternFixes.sort((a, b) => {
          // Primary sort by success rate (highest first)
          if (b.success_rate !== a.success_rate) {
            return (b.success_rate || 0) - (a.success_rate || 0);
          }
          // Secondary sort by priority (highest first)
          return b.fix_priority - a.fix_priority;
        })[0];
        
        return bestPatternFix;
      }
    }
    
    // Check if there's an AI-generated fix from analysis
    const errorAnalysis = await tsErrorStorage.getAnalysisForError(error.id);
    if (errorAnalysis && errorAnalysis.suggested_fix) {
      // Create a fix object from the analysis
      const aiGeneratedFix: ErrorFix = {
        id: 0, // Temporary ID, will be replaced when saved
        fix_title: `AI-generated fix for ${error.error_code}`,
        fix_description: `Automatically generated fix for error in ${error.file_path}`,
        fix_code: errorAnalysis.suggested_fix,
        fix_type: 'code_replacement',
        fix_priority: 1,
        pattern_id: error.pattern_id || null,
        success_rate: errorAnalysis.confidence_score ? errorAnalysis.confidence_score / 100 : 0.5,
        created_at: new Date(),
        created_by: null
      };
      
      return aiGeneratedFix;
    }
    
    // Check for generic fixes based on error code
    const genericFixes = await tsErrorStorage.getFixesForErrorCode(error.error_code);
    if (genericFixes && genericFixes.length > 0) {
      // Sort by success rate and priority
      return genericFixes.sort((a, b) => {
        if (b.success_rate !== a.success_rate) {
          return (b.success_rate || 0) - (a.success_rate || 0);
        }
        return b.fix_priority - a.fix_priority;
      })[0];
    }
    
    return null;
  } catch (err) {
    console.error(`Failed to find best fix for error ${error.id}:`, err);
    return null;
  }
}

/**
 * Apply a fix to a TypeScript error
 * 
 * @param error The TypeScript error to fix
 * @param fix The fix to apply
 * @param options Configuration options
 * @returns The result of the fix attempt
 */
export async function applyFix(
  error: TypeScriptError,
  fix: ErrorFix,
  options: ErrorFixerOptions = {}
): Promise<FixResult> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const result: FixResult = {
    error,
    success: false,
    fixApplied: null,
    message: ''
  };
  
  try {
    // Check if file exists
    if (!fs.existsSync(error.file_path)) {
      result.message = `File not found: ${error.file_path}`;
      return result;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(error.file_path, 'utf8');
    result.originalCode = fileContent;
    
    // Create backup if enabled
    let backupPath: string | null = null;
    if (config.backupFiles && !config.dryRun) {
      backupPath = createFileBackup(error.file_path);
      if (!backupPath) {
        console.warn(`Failed to create backup for ${error.file_path}, continuing anyway`);
      }
    }
    
    let fixedContent = fileContent;
    const lineArray = fileContent.split('\n');
    
    // Determine the fix type and apply it
    if (fix.fix_type === 'code_replacement') {
      // Get the error context (a few lines around the error)
      const contextStart = Math.max(0, error.line_number - 3);
      const contextEnd = Math.min(lineArray.length, error.line_number + 3);
      const contextLines = lineArray.slice(contextStart, contextEnd).join('\n');
      
      // Apply the fix by replacing the context with the fixed code
      fixedContent = fileContent.replace(contextLines, fix.fix_code);
      
      if (fixedContent === fileContent) {
        // If direct replacement didn't work, try to replace just the error line
        const errorLine = lineArray[error.line_number - 1];
        fixedContent = fileContent.replace(errorLine, fix.fix_code);
      }
    } else if (fix.fix_type === 'line_replacement') {
      // Replace just the error line
      lineArray[error.line_number - 1] = fix.fix_code;
      fixedContent = lineArray.join('\n');
    } else if (fix.fix_type === 'insertion') {
      // Insert code at the error line
      lineArray.splice(error.line_number - 1, 0, fix.fix_code);
      fixedContent = lineArray.join('\n');
    } else if (fix.fix_type === 'deletion') {
      // Delete the error line
      lineArray.splice(error.line_number - 1, 1);
      fixedContent = lineArray.join('\n');
    }
    
    result.fixedCode = fixedContent;
    
    // If this is not a dry run, write the changes back to the file
    if (!config.dryRun) {
      fs.writeFileSync(error.file_path, fixedContent, 'utf8');
      
      // Update the error status in the database
      await tsErrorStorage.updateTypeScriptError(error.id, {
        status: ErrorStatus.FIXED,
        resolved_at: new Date(),
        fix_id: fix.id > 0 ? fix.id : null // Only set if we have a real fix ID
      });
      
      // Record the fix history
      const fixHistory: InsertErrorFixHistory = {
        error_id: error.id,
        fix_id: fix.id > 0 ? fix.id : null,
        fix_method: options.fixMethod || FixMethod.AUTOMATIC,
        applied_at: new Date(),
        success: true,
        fix_details: {
          fixType: fix.fix_type,
          errorLine: error.line_number,
          originalCode: result.originalCode,
          fixedCode: result.fixedCode
        }
      };
      
      await tsErrorStorage.createErrorFixHistory(fixHistory);
      
      // If this was an AI-generated fix that isn't already saved, save it
      if (fix.id <= 0) {
        const savedFix = await tsErrorStorage.createErrorFix({
          pattern_id: error.pattern_id,
          fix_title: fix.fix_title,
          fix_description: fix.fix_description,
          fix_code: fix.fix_code,
          fix_type: fix.fix_type,
          fix_priority: fix.fix_priority,
          success_rate: fix.success_rate
        });
        
        result.fixApplied = savedFix;
      } else {
        result.fixApplied = fix;
      }
    } else {
      // For dry runs, still record the applied fix
      result.fixApplied = fix;
    }
    
    result.success = true;
    result.message = config.dryRun 
      ? `Fix would be applied to ${error.file_path} (dry run)`
      : `Successfully applied fix to ${error.file_path}`;
    
    return result;
  } catch (err) {
    result.message = `Failed to apply fix: ${err.message}`;
    console.error(`Failed to apply fix for error ${error.id}:`, err);
    
    // Record the failed fix attempt
    if (!config.dryRun) {
      const fixHistory: InsertErrorFixHistory = {
        error_id: error.id,
        fix_id: fix.id > 0 ? fix.id : null,
        fix_method: options.fixMethod || FixMethod.AUTOMATIC,
        applied_at: new Date(),
        success: false,
        fix_details: {
          fixType: fix.fix_type,
          errorLine: error.line_number,
          error: err.message
        }
      };
      
      await tsErrorStorage.createErrorFixHistory(fixHistory);
    }
    
    return result;
  }
}

/**
 * Fix a single TypeScript error
 * 
 * @param errorId ID of the TypeScript error to fix
 * @param options Configuration options
 * @returns The result of the fix attempt
 */
export async function fixError(
  errorId: number,
  options: ErrorFixerOptions = {}
): Promise<FixResult> {
  try {
    // Get the error details
    const error = await tsErrorStorage.getTypeScriptErrorById(errorId);
    if (!error) {
      return {
        error: null,
        success: false,
        fixApplied: null,
        message: `Error with ID ${errorId} not found`
      };
    }
    
    // Check if error is already fixed
    if (error.status === ErrorStatus.FIXED) {
      return {
        error,
        success: false,
        fixApplied: null,
        message: `Error ${errorId} is already fixed`
      };
    }
    
    // Check if error is ignored
    if (error.status === ErrorStatus.IGNORED) {
      return {
        error,
        success: false,
        fixApplied: null,
        message: `Error ${errorId} is marked as ignored`
      };
    }
    
    // Find the best fix for this error
    const bestFix = await findBestFix(error, options);
    if (!bestFix) {
      return {
        error,
        success: false,
        fixApplied: null,
        message: `No suitable fix found for error ${errorId}`
      };
    }
    
    // Apply the fix
    return await applyFix(error, bestFix, options);
  } catch (err) {
    console.error(`Failed to fix error ${errorId}:`, err);
    return {
      error: null,
      success: false,
      fixApplied: null,
      message: `Failed to fix error ${errorId}: ${err.message}`
    };
  }
}

/**
 * Fix multiple TypeScript errors
 * 
 * @param errorIds IDs of the TypeScript errors to fix
 * @param options Configuration options
 * @returns The results of the fix attempts
 */
export async function fixErrors(
  errorIds: number[],
  options: ErrorFixerOptions = {}
): Promise<FixResult[]> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const results: FixResult[] = [];
  
  // Limit the number of errors to fix
  const limitedErrorIds = errorIds.slice(0, config.maxErrorsToFix);
  
  for (const errorId of limitedErrorIds) {
    const result = await fixError(errorId, config);
    results.push(result);
    
    // If we've had too many consecutive failures, stop
    const recentResults = results.slice(-config.maxConsecutiveFixes);
    if (recentResults.length === config.maxConsecutiveFixes && 
        recentResults.every(r => !r.success)) {
      console.warn(`Stopping after ${config.maxConsecutiveFixes} consecutive failures`);
      break;
    }
  }
  
  return results;
}

/**
 * Fix all pending TypeScript errors of a specific type
 * 
 * @param errorCode TypeScript error code to fix (e.g., 'TS2322')
 * @param options Configuration options
 * @returns The results of the fix attempts
 */
export async function fixErrorsByCode(
  errorCode: string,
  options: ErrorFixerOptions = {}
): Promise<FixResult[]> {
  // Find all pending errors with this code
  const errors = await tsErrorStorage.getTypeScriptErrorsByCode(errorCode, ErrorStatus.PENDING);
  
  // Extract the error IDs
  const errorIds = errors.map(error => error.id);
  
  // Fix the errors
  return await fixErrors(errorIds, options);
}

/**
 * Fix all pending TypeScript errors in a specific file
 * 
 * @param filePath Path to the file to fix
 * @param options Configuration options
 * @returns The results of the fix attempts
 */
export async function fixErrorsInFile(
  filePath: string,
  options: ErrorFixerOptions = {}
): Promise<FixResult[]> {
  // Find all pending errors in this file
  const errors = await tsErrorStorage.getTypeScriptErrorsByFile(filePath, ErrorStatus.PENDING);
  
  // Extract the error IDs
  const errorIds = errors.map(error => error.id);
  
  // Fix the errors
  return await fixErrors(errorIds, options);
}

/**
 * Fix all pending TypeScript errors of a specific severity
 * 
 * @param severity Severity level to fix
 * @param options Configuration options
 * @returns The results of the fix attempts
 */
export async function fixErrorsBySeverity(
  severity: string,
  options: ErrorFixerOptions = {}
): Promise<FixResult[]> {
  // Find all pending errors with this severity
  const errors = await tsErrorStorage.getTypeScriptErrorsBySeverity(severity, ErrorStatus.PENDING);
  
  // Extract the error IDs
  const errorIds = errors.map(error => error.id);
  
  // Fix the errors
  return await fixErrors(errorIds, options);
}

/**
 * Fix all pending TypeScript errors in batch mode
 * 
 * @param options Configuration options
 * @returns The results of the fix attempts
 */
export async function fixAllErrors(
  options: ErrorFixerOptions = {}
): Promise<FixResult[]> {
  // Find all pending errors
  const errors = await tsErrorStorage.getAllTypeScriptErrors({ status: ErrorStatus.PENDING });
  
  // Extract the error IDs
  const errorIds = errors.map(error => error.id);
  
  // Fix the errors
  return await fixErrors(errorIds, options);
}

// Export the module
export default {
  fixError,
  fixErrors,
  fixErrorsByCode,
  fixErrorsInFile,
  fixErrorsBySeverity,
  fixAllErrors,
  findBestFix,
  applyFix
};