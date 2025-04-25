/**
 * @file ts-batch-fixer.ts
 * @description Batch processing utilities for TypeScript error management
 * 
 * This module provides functionality for intelligently fixing multiple TypeScript errors
 * in a batch, with dependency awareness and transaction-like rollback capabilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { TypeScriptError, ErrorFix } from '../types/core/error-types';
import { generateMissingInterfaces } from './ts-type-analyzer';
import { getTypescriptError, updateTypescriptError } from '../tsErrorStorage';

/**
 * Represents a group of related errors that should be fixed together
 */
interface ErrorGroup {
  id: string;
  errors: TypeScriptError[];
  commonRootCause: string;
  fixStrategy: string;
  priority: number;
}

/**
 * Represents the dependency relationship between errors
 */
interface ErrorDependencyGraph {
  graph: Record<string, string[]>; // Error ID -> Dependent error IDs
  fixOrder: string[];              // Optimal order to fix errors
}

/**
 * Result of a batch fix operation
 */
interface BatchFixResult {
  success: boolean;
  appliedFixes: {
    error: TypeScriptError;
    fix: ErrorFix;
    success: boolean;
  }[];
  rolledBackFixes: {
    error: TypeScriptError;
    fix: ErrorFix;
    reason: string;
  }[];
  newErrorsCount: number;
}

/**
 * Analyzes dependencies between TypeScript errors
 * 
 * @param errors Array of TypeScript errors to analyze
 * @returns Dependency graph and optimal fix order
 */
export function buildErrorDependencyGraph(errors: TypeScriptError[]): ErrorDependencyGraph {
  const graph: Record<string, string[]> = {};
  
  // Helper function to check if an error B depends on error A
  const doesErrorDependOn = (errorA: TypeScriptError, errorB: TypeScriptError): boolean => {
    // If they're in the same file, errors on earlier lines might affect later lines
    if (errorA.filePath === errorB.filePath) {
      if (errorA.lineNumber < errorB.lineNumber) {
        return true;
      }
      if (errorA.lineNumber === errorB.lineNumber && errorA.columnNumber < errorB.columnNumber) {
        return true;
      }
    }
    
    // Type definition errors affect usage errors
    if (errorA.category === 'missing_type' && errorB.category === 'type_mismatch') {
      // Simplified check - in a real implementation, we would check if the missing type
      // is actually used in the type mismatch error
      return true;
    }
    
    // Interface errors affect implementation errors
    if (errorA.category === 'interface_mismatch' && errorB.category === 'type_mismatch') {
      // Simplified check - in a real implementation, we would check the actual types
      return true;
    }
    
    // Import errors affect other errors in the same file
    if (errorA.category === 'import_error' && errorA.filePath === errorB.filePath) {
      return true;
    }
    
    return false;
  };
  
  // Build initial dependency graph
  for (const error of errors) {
    graph[error.id.toString()] = [];
    
    for (const otherError of errors) {
      if (error.id !== otherError.id && doesErrorDependOn(error, otherError)) {
        graph[error.id.toString()].push(otherError.id.toString());
      }
    }
  }
  
  // Topological sort to determine optimal fix order
  const fixOrder = topologicalSort(graph);
  
  return { graph, fixOrder };
}

/**
 * Groups related TypeScript errors based on common root causes
 * 
 * @param errors Array of TypeScript errors to group
 * @returns Array of error groups
 */
export function clusterErrorsByRootCause(errors: TypeScriptError[]): ErrorGroup[] {
  const groups: ErrorGroup[] = [];
  const processedErrors = new Set<number>();
  
  // Helper function to check if two errors are related
  const areErrorsRelated = (errorA: TypeScriptError, errorB: TypeScriptError): boolean => {
    // Same error code in the same file
    if (errorA.errorCode === errorB.errorCode && errorA.filePath === errorB.filePath) {
      return true;
    }
    
    // Same error category and similar error messages
    if (errorA.category === errorB.category && 
        similarityScore(errorA.errorMessage, errorB.errorMessage) > 0.7) {
      return true;
    }
    
    // Same pattern ID (if available)
    if (errorA.patternId && errorB.patternId && errorA.patternId === errorB.patternId) {
      return true;
    }
    
    return false;
  };
  
  // Group errors by similarity
  for (const error of errors) {
    if (processedErrors.has(error.id)) {
      continue;
    }
    
    const relatedErrors = [error];
    processedErrors.add(error.id);
    
    for (const otherError of errors) {
      if (!processedErrors.has(otherError.id) && areErrorsRelated(error, otherError)) {
        relatedErrors.push(otherError);
        processedErrors.add(otherError.id);
      }
    }
    
    if (relatedErrors.length > 0) {
      groups.push({
        id: `group_${groups.length + 1}`,
        errors: relatedErrors,
        commonRootCause: inferCommonRootCause(relatedErrors),
        fixStrategy: inferFixStrategy(relatedErrors),
        priority: calculateGroupPriority(relatedErrors)
      });
    }
  }
  
  // Sort groups by priority (higher first)
  return groups.sort((a, b) => b.priority - a.priority);
}

/**
 * Apply batch fixes to TypeScript errors with rollback capability
 * 
 * @param fixes Fixes to apply
 * @param errors Errors to fix
 * @returns Result of the batch fix operation
 */
export async function applyBatchFixesWithRollback(
  fixes: ErrorFix[],
  errors: TypeScriptError[]
): Promise<BatchFixResult> {
  // Create a map of file backup contents
  const fileBackups: Record<string, string> = {};
  const errorMap: Record<string, TypeScriptError> = {};
  errors.forEach(error => {
    errorMap[error.id.toString()] = error;
    
    // Backup file if not already backed up
    if (!fileBackups[error.filePath] && fs.existsSync(error.filePath)) {
      fileBackups[error.filePath] = fs.readFileSync(error.filePath, 'utf-8');
    }
  });
  
  const appliedFixes: {
    error: TypeScriptError;
    fix: ErrorFix;
    success: boolean;
  }[] = [];
  
  const rolledBackFixes: {
    error: TypeScriptError;
    fix: ErrorFix;
    reason: string;
  }[] = [];
  
  try {
    // Sort fixes by dependency order if available
    const fixOrder = buildErrorDependencyGraph(errors).fixOrder;
    const orderedFixes = fixOrder
      .map(errorId => {
        const error = errorMap[errorId];
        const fix = fixes.find(f => f.errorId === Number(errorId));
        return fix ? { error, fix } : null;
      })
      .filter((item): item is { error: TypeScriptError; fix: ErrorFix } => item !== null);
    
    // Apply each fix in order
    for (const { error, fix } of orderedFixes) {
      try {
        // Read current file content
        if (!fs.existsSync(error.filePath)) {
          rolledBackFixes.push({
            error,
            fix,
            reason: `File ${error.filePath} does not exist`
          });
          continue;
        }
        
        const fileContent = fs.readFileSync(error.filePath, 'utf-8');
        
        // Apply the fix
        const fixedContent = applyFixToFile(fileContent, error, fix);
        
        // Write the fixed content
        fs.writeFileSync(error.filePath, fixedContent);
        
        // Update error status
        await updateTypescriptError(error.id, {
          status: 'fixed',
          fixId: fix.id,
          resolvedAt: new Date()
        });
        
        appliedFixes.push({
          error,
          fix,
          success: true
        });
      } catch (err) {
        rolledBackFixes.push({
          error,
          fix,
          reason: `Failed to apply fix: ${err instanceof Error ? err.message : String(err)}`
        });
      }
    }
    
    // Check if applying the fixes introduced new errors
    const newErrorsCount = await checkForNewErrors();
    
    if (newErrorsCount > 0 && rolledBackFixes.length === 0) {
      // Rollback all changes if new errors were introduced and no other rollbacks occurred
      await rollbackChanges(fileBackups);
      
      // Move all applied fixes to rolled back fixes
      rolledBackFixes.push(
        ...appliedFixes.map(applied => ({
          error: applied.error,
          fix: applied.fix,
          reason: 'Rolled back due to new errors being introduced'
        }))
      );
      
      // Clear applied fixes
      appliedFixes.length = 0;
      
      return {
        success: false,
        appliedFixes,
        rolledBackFixes,
        newErrorsCount
      };
    }
    
    return {
      success: rolledBackFixes.length === 0,
      appliedFixes,
      rolledBackFixes,
      newErrorsCount
    };
  } catch (err) {
    // Rollback all changes on critical error
    await rollbackChanges(fileBackups);
    
    return {
      success: false,
      appliedFixes: [],
      rolledBackFixes: fixes.map(fix => ({
        error: errorMap[fix.errorId.toString()],
        fix,
        reason: `Critical error during batch fix: ${err instanceof Error ? err.message : String(err)}`
      })),
      newErrorsCount: 0
    };
  }
}

/**
 * Generate and apply missing interface definitions for a file
 * 
 * @param filePath Path to the TypeScript file
 * @param missingTypes Array of missing type names
 * @returns Generated interface definitions
 */
export async function generateAndApplyMissingInterfaces(
  filePath: string,
  missingTypes: string[]
): Promise<Record<string, string>> {
  // Generate interfaces
  const interfaces = await generateMissingInterfaces(filePath, missingTypes);
  
  if (Object.keys(interfaces).length === 0) {
    return {};
  }
  
  // Read file content
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  
  let fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Find a good position to insert the interfaces
  // Either after imports or at the beginning of the file
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  let insertPosition = 0;
  let lastImportEnd = 0;
  
  // Find the end of the last import
  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      lastImportEnd = node.end;
    }
  });
  
  insertPosition = lastImportEnd > 0 ? lastImportEnd + 1 : 0;
  
  // Insert interfaces
  const interfaceText = '\n\n' + Object.values(interfaces).join('\n\n') + '\n';
  fileContent = fileContent.slice(0, insertPosition) + interfaceText + fileContent.slice(insertPosition);
  
  // Write the updated content
  fs.writeFileSync(filePath, fileContent);
  
  return interfaces;
}

/**
 * Apply multiple fixes to a file in a single operation
 * 
 * @param filePath Path to the TypeScript file
 * @param fixes Fixes to apply to the file
 * @returns Whether the operation was successful
 */
export async function applyMultipleFixesToFile(
  filePath: string,
  fixes: { error: TypeScriptError; fix: ErrorFix }[]
): Promise<boolean> {
  // Only process fixes for the specified file
  const fileSpecificFixes = fixes.filter(f => f.error.filePath === filePath);
  
  if (fileSpecificFixes.length === 0) {
    return true;
  }
  
  // Read file content
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  
  const originalContent = fs.readFileSync(filePath, 'utf-8');
  
  // Sort fixes by line number and column (reverse order to avoid position shifts)
  const sortedFixes = [...fileSpecificFixes].sort((a, b) => {
    if (a.error.lineNumber !== b.error.lineNumber) {
      return b.error.lineNumber - a.error.lineNumber;
    }
    return b.error.columnNumber - a.error.columnNumber;
  });
  
  let currentContent = originalContent;
  
  // Apply each fix
  for (const { error, fix } of sortedFixes) {
    try {
      currentContent = applyFixToFile(currentContent, error, fix);
      
      // Update error status
      await updateTypescriptError(error.id, {
        status: 'fixed',
        fixId: fix.id,
        resolvedAt: new Date()
      });
    } catch (err) {
      // Revert to original content on error
      fs.writeFileSync(filePath, originalContent);
      return false;
    }
  }
  
  // Write the fixed content
  fs.writeFileSync(filePath, currentContent);
  
  return true;
}

//
// Helper functions
//

/**
 * Apply a fix to a file
 */
function applyFixToFile(
  fileContent: string,
  error: TypeScriptError,
  fix: ErrorFix
): string {
  // Convert line and column to character position
  const lines = fileContent.split('\n');
  
  // Ensure line and column are 0-based for internal calculations
  const lineIndex = error.lineNumber - 1;
  const columnIndex = error.columnNumber - 1;
  
  // Calculate start position
  let startPos = 0;
  for (let i = 0; i < lineIndex; i++) {
    startPos += lines[i].length + 1; // +1 for the newline character
  }
  startPos += columnIndex;
  
  // Get context around the error
  const contextLines = 3;
  const startLine = Math.max(0, lineIndex - contextLines);
  const endLine = Math.min(lines.length - 1, lineIndex + contextLines);
  const errorContext = lines.slice(startLine, endLine + 1).join('\n');
  
  // Determine the fix to apply
  if (fix.fixCode) {
    // If we have specific fix code, apply it directly
    
    // Determine the scope of the fix (line, token, or custom range)
    switch (fix.fixScope) {
      case 'line':
        // Replace the entire line
        lines[lineIndex] = fix.fixCode;
        break;
        
      case 'token':
        // Replace just the token at the error position
        // This is a simplified implementation - a real one would use the TypeScript compiler
        // to identify token boundaries
        const line = lines[lineIndex];
        const tokenStart = findTokenStart(line, columnIndex);
        const tokenEnd = findTokenEnd(line, columnIndex);
        lines[lineIndex] = line.substring(0, tokenStart) + fix.fixCode + line.substring(tokenEnd);
        break;
        
      case 'custom':
        // The fix specifies a custom replacement pattern
        if (fix.originalCode && errorContext.includes(fix.originalCode)) {
          // Replace the original code with the fix code
          const contextStartPos = startPos - (lineIndex - startLine) * (lines[0].length + 1) - columnIndex;
          const replaceStartPos = contextStartPos + errorContext.indexOf(fix.originalCode);
          const replaceEndPos = replaceStartPos + fix.originalCode.length;
          
          return fileContent.substring(0, replaceStartPos) + 
                 fix.fixCode + 
                 fileContent.substring(replaceEndPos);
        } else {
          // If we can't find the exact match, apply the fix to the error line
          lines[lineIndex] = fix.fixCode;
        }
        break;
        
      default:
        // Default to replacing the entire line
        lines[lineIndex] = fix.fixCode;
    }
    
    return lines.join('\n');
  } else {
    // No specific fix code provided
    throw new Error('No fix code provided for error');
  }
}

/**
 * Find the start position of a token in a line
 */
function findTokenStart(line: string, position: number): number {
  const tokenDelimiters = /[ \t\n\r\(\)\[\]\{\}\:\;\,\.\<\>\=\+\-\*\/\&\|\^\!\~\?\@\#\%]/;
  let start = position;
  
  while (start > 0 && !tokenDelimiters.test(line[start - 1])) {
    start--;
  }
  
  return start;
}

/**
 * Find the end position of a token in a line
 */
function findTokenEnd(line: string, position: number): number {
  const tokenDelimiters = /[ \t\n\r\(\)\[\]\{\}\:\;\,\.\<\>\=\+\-\*\/\&\|\^\!\~\?\@\#\%]/;
  let end = position;
  
  while (end < line.length && !tokenDelimiters.test(line[end])) {
    end++;
  }
  
  return end;
}

/**
 * Rollback changes to files
 */
async function rollbackChanges(fileBackups: Record<string, string>): Promise<void> {
  for (const [filePath, content] of Object.entries(fileBackups)) {
    fs.writeFileSync(filePath, content);
  }
}

/**
 * Check if applying fixes introduced new errors
 */
async function checkForNewErrors(): Promise<number> {
  // This is a placeholder implementation
  // In a real implementation, we would run the TypeScript compiler
  // and check for new errors
  return 0;
}

/**
 * Calculate the similarity between two strings
 */
function similarityScore(a: string, b: string): number {
  // Simple implementation of Levenshtein distance
  const m = a.length;
  const n = b.length;
  
  // Fast path for equality
  if (a === b) return 1;
  if (m === 0) return 0;
  if (n === 0) return 0;
  
  const matrix: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const maxLength = Math.max(m, n);
  const distance = matrix[m][n];
  return 1 - distance / maxLength;
}

/**
 * Infer the common root cause of a group of errors
 */
function inferCommonRootCause(errors: TypeScriptError[]): string {
  // Check for common error codes
  const errorCodes = new Set(errors.map(e => e.errorCode));
  if (errorCodes.size === 1) {
    return `Common error code: ${Array.from(errorCodes)[0]}`;
  }
  
  // Check for common categories
  const categories = new Set(errors.map(e => e.category));
  if (categories.size === 1) {
    return `Common error category: ${Array.from(categories)[0]}`;
  }
  
  // Check for common patterns
  const patterns = new Set(errors.map(e => e.patternId).filter(Boolean));
  if (patterns.size === 1) {
    return `Common error pattern: ${Array.from(patterns)[0]}`;
  }
  
  // Default to a generic description
  return 'Related errors based on analysis';
}

/**
 * Infer the best fix strategy for a group of errors
 */
function inferFixStrategy(errors: TypeScriptError[]): string {
  // Check if all errors are in the same file
  const files = new Set(errors.map(e => e.filePath));
  if (files.size === 1) {
    return 'Apply fixes to single file';
  }
  
  // Check if all errors are of the same category
  const categories = new Set(errors.map(e => e.category));
  if (categories.size === 1) {
    const category = Array.from(categories)[0];
    
    switch (category) {
      case 'missing_type':
        return 'Generate and add missing types';
        
      case 'interface_mismatch':
        return 'Update interface definitions';
        
      case 'import_error':
        return 'Fix import statements';
        
      case 'type_mismatch':
        return 'Apply type conversions';
        
      default:
        return `Fix ${category} errors`;
    }
  }
  
  // Default strategy
  return 'Apply individual fixes in dependency order';
}

/**
 * Calculate priority for an error group
 */
function calculateGroupPriority(errors: TypeScriptError[]): number {
  let priority = 0;
  
  // Count errors by severity
  const severityCounts: Record<string, number> = {};
  for (const error of errors) {
    severityCounts[error.severity] = (severityCounts[error.severity] || 0) + 1;
  }
  
  // Assign priority based on severity
  priority += (severityCounts['critical'] || 0) * 100;
  priority += (severityCounts['high'] || 0) * 10;
  priority += (severityCounts['medium'] || 0) * 3;
  priority += (severityCounts['low'] || 0) * 1;
  
  // Prioritize certain categories
  const categories = new Set(errors.map(e => e.category));
  if (categories.has('missing_type')) priority += 50;
  if (categories.has('interface_mismatch')) priority += 40;
  if (categories.has('import_error')) priority += 30;
  
  // Prioritize errors that affect multiple files
  const files = new Set(errors.map(e => e.filePath));
  priority += files.size * 5;
  
  return priority;
}

/**
 * Perform a topological sort on a dependency graph
 */
function topologicalSort(graph: Record<string, string[]>): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();
  
  // Helper function for depth-first search
  const visit = (node: string): void => {
    // Skip if already visited
    if (visited.has(node)) {
      return;
    }
    
    // Check for cycles
    if (temp.has(node)) {
      // In case of a cycle, we'll just continue and accept that the sort won't be perfect
      return;
    }
    
    temp.add(node);
    
    // Visit dependencies
    for (const dep of graph[node] || []) {
      visit(dep);
    }
    
    temp.delete(node);
    visited.add(node);
    result.unshift(node); // Add to the beginning of the result
  };
  
  // Visit each node
  for (const node of Object.keys(graph)) {
    visit(node);
  }
  
  return result;
}