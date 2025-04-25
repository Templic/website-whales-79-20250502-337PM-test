/**
 * TypeScript Error Fixer
 * 
 * This utility provides automated fixes for common TypeScript errors.
 * It works with the ts-error-analyzer to provide an end-to-end error management solution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { tsErrorStorage } from '../tsErrorStorage';
import { ERROR_CATEGORIES, ERROR_SEVERITY, ERROR_STATUS, TypeScriptError } from './ts-error-analyzer';
import { InsertErrorFix, InsertErrorFixHistory } from '../../shared/schema';

// Fix application methods
export enum FixMethod {
  AUTOMATED = 'automated',
  SEMI_AUTOMATED = 'semi_automated', // Requires some user input/confirmation
  MANUAL = 'manual',                 // Guided manual fix
  PATTERN_BASED = 'pattern_based',   // Uses a known error pattern and fix
  AI_ASSISTED = 'ai_assisted'        // Uses ML to suggest fixes
}

// Fix result status
export enum FixResult {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
  NEEDS_REVIEW = 'needs_review'
}

// Fix type definitions
export interface Fix {
  id?: number;
  name: string;
  description: string;
  category: string;
  errorCode?: string;
  fixCode: string;
  method: FixMethod;
  patternMatch?: RegExp | string;
  replacementTemplate?: string;
  autoFixable: boolean;
}

/**
 * Applies a fix to a file
 */
export async function applyFix(
  filePath: string, 
  line: number, 
  column: number, 
  fix: Fix, 
  errorId: number,
  userId: number
): Promise<{
  success: boolean;
  result: FixResult;
  fixedContent?: string;
  message?: string;
}> {
  try {
    console.log(`Attempting to apply fix for error at ${filePath}:${line}:${column}`);
    
    // Read the file
    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        result: FixResult.FAILED,
        message: `File not found: ${filePath}` 
      };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Apply the appropriate fix based on the fix method
    let fixedContent: string;
    let result: FixResult;
    let fixDuration: number = 0;
    const startTime = Date.now();
    
    switch (fix.method) {
      case FixMethod.AUTOMATED:
        const fixResult = applyAutomatedFix(lines, line, column, fix);
        fixedContent = fixResult.content;
        result = fixResult.result;
        break;
        
      case FixMethod.PATTERN_BASED:
        const patternFixResult = applyPatternBasedFix(content, fix);
        fixedContent = patternFixResult.content;
        result = patternFixResult.result;
        break;
        
      case FixMethod.SEMI_AUTOMATED:
      case FixMethod.MANUAL:
      case FixMethod.AI_ASSISTED:
      default:
        // For now, these methods are not automatically applied
        // We just return guidance for manual fixing
        return {
          success: false,
          result: FixResult.NEEDS_REVIEW,
          message: `Fix method ${fix.method} requires manual intervention. Follow these steps:\n${fix.description}`
        };
    }
    
    // Calculate duration
    fixDuration = Date.now() - startTime;
    
    // Only write the file if we have a successful or partial fix
    if (result !== FixResult.FAILED) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      
      // Create fix history record
      const fixHistory: InsertErrorFixHistory = {
        errorId,
        fixId: fix.id || 0,
        fixedBy: userId,
        fixedAt: new Date(),
        fixMethod: fix.method,
        fixResult: result,
        fixDuration,
        previousContent: content,
        newContent: fixedContent,
        notes: `Applied ${fix.name} fix to ${filePath}:${line}:${column}`
      };
      
      try {
        await tsErrorStorage.createFixHistory(fixHistory);
        
        // If fix was successful, mark the error as fixed
        if (result === FixResult.SUCCESS) {
          await tsErrorStorage.markErrorAsFixed(errorId, fix.id || 0, userId);
        }
      } catch (dbError) {
        console.error('Failed to save fix history:', dbError);
      }
      
      return {
        success: true,
        result,
        fixedContent,
        message: result === FixResult.SUCCESS 
          ? `Successfully applied fix to ${filePath}` 
          : `Partially fixed ${filePath}, may need additional review`
      };
    }
    
    return {
      success: false,
      result: FixResult.FAILED,
      message: `Failed to apply fix to ${filePath}`
    };
  } catch (error) {
    console.error('Error applying fix:', error);
    return {
      success: false,
      result: FixResult.FAILED,
      message: `Error applying fix: ${error.message}`
    };
  }
}

/**
 * Apply an automated fix directly to code
 */
function applyAutomatedFix(
  lines: string[], 
  line: number, 
  column: number, 
  fix: Fix
): { content: string; result: FixResult } {
  // Convert to 0-based indexing
  const lineIndex = line - 1;
  const columnIndex = column - 1;
  
  // Get the current line
  const currentLine = lines[lineIndex];
  
  // Based on the error category, apply different fixes
  switch (fix.category) {
    case ERROR_CATEGORIES.MISSING_TYPE:
      // Insert type annotation
      const fixedLine = insertTypeAnnotation(currentLine, columnIndex, fix.fixCode);
      lines[lineIndex] = fixedLine;
      break;
      
    case ERROR_CATEGORIES.NULL_UNDEFINED:
      // Add null checks or optional chaining
      const nullFixedLine = addNullChecks(currentLine, columnIndex, fix.fixCode);
      lines[lineIndex] = nullFixedLine;
      break;
      
    case ERROR_CATEGORIES.SYNTAX_ERROR:
      // Fix syntax errors like missing semicolons, parentheses, etc.
      const syntaxFixedLine = fixSyntaxError(currentLine, columnIndex, fix.fixCode);
      lines[lineIndex] = syntaxFixedLine;
      break;
      
    default:
      // If we don't have a specific fix, return as-is
      return { content: lines.join('\n'), result: FixResult.FAILED };
  }
  
  return { content: lines.join('\n'), result: FixResult.SUCCESS };
}

/**
 * Apply a pattern-based fix to the entire content
 */
function applyPatternBasedFix(
  content: string, 
  fix: Fix
): { content: string; result: FixResult } {
  if (!fix.patternMatch || !fix.replacementTemplate) {
    return { content, result: FixResult.FAILED };
  }
  
  try {
    // Apply regex replacement if patternMatch is a regex
    if (fix.patternMatch instanceof RegExp) {
      const newContent = content.replace(fix.patternMatch, fix.replacementTemplate);
      
      // Check if any replacements were made
      if (newContent === content) {
        return { content, result: FixResult.FAILED };
      }
      
      return { content: newContent, result: FixResult.SUCCESS };
    }
    
    // Otherwise, treat as a string pattern
    const stringPattern = fix.patternMatch.toString();
    if (content.includes(stringPattern)) {
      const newContent = content.replace(stringPattern, fix.replacementTemplate);
      return { content: newContent, result: FixResult.SUCCESS };
    }
    
    return { content, result: FixResult.FAILED };
  } catch (error) {
    console.error('Error applying pattern-based fix:', error);
    return { content, result: FixResult.FAILED };
  }
}

/**
 * Insert type annotation at the specified position
 */
function insertTypeAnnotation(line: string, column: number, typeAnnotation: string): string {
  // Find the variable declaration before the column
  // This is a simplified approach and might need to be more sophisticated
  const beforeColumn = line.substring(0, column);
  const afterColumn = line.substring(column);
  
  // Add the type annotation
  return `${beforeColumn}${typeAnnotation}${afterColumn}`;
}

/**
 * Add null checks or optional chaining
 */
function addNullChecks(line: string, column: number, fixCode: string): string {
  // Simple replacement - in a real implementation, this would be more sophisticated
  // based on the specific null/undefined error
  return line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
}

/**
 * Fix common syntax errors
 */
function fixSyntaxError(line: string, column: number, fixCode: string): string {
  // This is a simplified implementation
  // In reality, this would be much more sophisticated and handle various syntax errors
  
  // Check for missing semicolon
  if (!line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
    return `${line};`;
  }
  
  // Check for missing closing parenthesis
  const openParens = (line.match(/\(/g) || []).length;
  const closeParens = (line.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    return `${line}${''.padEnd(openParens - closeParens, ')')}`;
  }
  
  // Check for missing closing braces
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    return `${line}${''.padEnd(openBraces - closeBraces, '}')}`;
  }
  
  // If we can't identify the issue, return the original line
  return line;
}

/**
 * Find appropriate fixes for a given error
 */
export async function findFixesForError(error: TypeScriptError): Promise<Fix[]> {
  // Try to find pattern-based fixes first
  let fixes: Fix[] = [];
  
  // Check if we have a pattern in the database that matches this error
  try {
    const errorPatterns = await tsErrorStorage.getErrorPatternsByCategory(error.category);
    
    for (const pattern of errorPatterns) {
      // For this simplified version, we'll just check the error code and category
      if (pattern.errorCodes?.includes(`TS${error.code}`)) {
        // Get fixes for this pattern
        const patternFixes = await tsErrorStorage.getFixesByPatternId(pattern.id);
        
        fixes.push(...patternFixes.map(fix => ({
          id: fix.id,
          name: fix.name,
          description: fix.description,
          category: error.category,
          errorCode: `TS${error.code}`,
          fixCode: fix.fixCode,
          method: fix.method as FixMethod,
          patternMatch: fix.patternMatch ? new RegExp(fix.patternMatch) : undefined,
          replacementTemplate: fix.replacementTemplate,
          autoFixable: fix.autoFixable
        })));
      }
    }
  } catch (dbError) {
    console.error('Error fetching fixes from database:', dbError);
  }
  
  // If we don't have any fixes from the database, add some default fixes based on error category
  if (fixes.length === 0) {
    // Add default fixes based on error category
    switch (error.category) {
      case ERROR_CATEGORIES.MISSING_TYPE:
        fixes.push({
          name: 'Add any type',
          description: 'Add ": any" type annotation to silence the error',
          category: error.category,
          errorCode: `TS${error.code}`,
          fixCode: ': any',
          method: FixMethod.AUTOMATED,
          autoFixable: true
        });
        break;
        
      case ERROR_CATEGORIES.NULL_UNDEFINED:
        fixes.push({
          name: 'Add optional chaining',
          description: 'Convert property access to use optional chaining (?.) to handle null/undefined values',
          category: error.category,
          errorCode: `TS${error.code}`,
          fixCode: '?.',
          method: FixMethod.AUTOMATED,
          patternMatch: /(\w+)\.(\w+)/g,
          replacementTemplate: '$1?.$2',
          autoFixable: true
        });
        break;
        
      case ERROR_CATEGORIES.SYNTAX_ERROR:
        fixes.push({
          name: 'Add missing semicolon',
          description: 'Add missing semicolon at the end of the line',
          category: error.category,
          errorCode: `TS${error.code}`,
          fixCode: ';',
          method: FixMethod.AUTOMATED,
          autoFixable: true
        });
        break;
        
      default:
        fixes.push({
          name: 'Manual fix required',
          description: `This error type (${error.category}) requires manual intervention`,
          category: error.category,
          errorCode: `TS${error.code}`,
          fixCode: '',
          method: FixMethod.MANUAL,
          autoFixable: false
        });
    }
  }
  
  return fixes;
}

/**
 * Store a new error fix in the database
 */
export async function storeErrorFix(fix: Fix, patternId?: number): Promise<number> {
  try {
    const fixRecord: InsertErrorFix = {
      name: fix.name,
      description: fix.description,
      patternId: patternId,
      fixCode: fix.fixCode,
      method: fix.method as any,
      patternMatch: fix.patternMatch?.toString(),
      replacementTemplate: fix.replacementTemplate,
      autoFixable: fix.autoFixable,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newFix = await tsErrorStorage.createErrorFix(fixRecord);
    return newFix.id;
  } catch (error) {
    console.error('Failed to store error fix:', error);
    throw error;
  }
}

/**
 * Process and fix all detected TypeScript errors
 */
export async function fixAllErrors(userId: number, autoFixOnly: boolean = true): Promise<{
  total: number;
  fixed: number;
  partiallyFixed: number;
  failed: number;
  needsReview: number;
  fixedByCategory: Record<string, number>;
}> {
  try {
    // Get all errors from the database that need fixing
    const errors = await tsErrorStorage.getAllTypescriptErrors({
      status: autoFixOnly ? 'fix_available' : undefined
    });
    
    console.log(`Found ${errors.length} errors to fix`);
    
    // Track statistics
    const stats = {
      total: errors.length,
      fixed: 0,
      partiallyFixed: 0,
      failed: 0,
      needsReview: 0,
      fixedByCategory: {} as Record<string, number>
    };
    
    // Process each error
    for (const error of errors) {
      try {
        // Convert database error to TypeScriptError format
        const tsError: TypeScriptError = {
          filePath: error.filePath,
          line: error.lineNumber,
          column: error.columnNumber,
          code: error.errorCode.replace(/^TS/, ''),
          message: error.errorMessage,
          category: error.category,
          severity: error.severity,
          context: error.errorContext
        };
        
        // Find fixes for this error
        const fixes = await findFixesForError(tsError);
        
        // Skip if no auto-fixable fixes are available and we're only doing auto-fixes
        if (autoFixOnly && !fixes.some(fix => fix.autoFixable)) {
          stats.needsReview++;
          continue;
        }
        
        // Apply the first auto-fixable fix we find
        let fixApplied = false;
        for (const fix of fixes) {
          if (fix.autoFixable) {
            const fixResult = await applyFix(
              error.filePath,
              error.lineNumber,
              error.columnNumber,
              fix,
              error.id,
              userId
            );
            
            if (fixResult.success) {
              // Count by result
              if (fixResult.result === FixResult.SUCCESS) {
                stats.fixed++;
                // Track by category
                stats.fixedByCategory[error.category] = (stats.fixedByCategory[error.category] || 0) + 1;
              } else if (fixResult.result === FixResult.PARTIAL) {
                stats.partiallyFixed++;
              } else if (fixResult.result === FixResult.NEEDS_REVIEW) {
                stats.needsReview++;
              }
              
              fixApplied = true;
              break;
            }
          }
        }
        
        if (!fixApplied) {
          stats.failed++;
        }
      } catch (errorProcessingError) {
        console.error(`Failed to process error ${error.id}:`, errorProcessingError);
        stats.failed++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to fix all errors:', error);
    throw error;
  }
}

export default {
  applyFix,
  findFixesForError,
  storeErrorFix,
  fixAllErrors,
  FixMethod,
  FixResult
};