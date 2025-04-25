/**
 * @file ts-batch-fixer.ts
 * @description Batch processing and dependency-aware fixing for TypeScript errors
 * 
 * This module provides utilities for batch processing TypeScript errors, including
 * dependency analysis, error grouping, and prioritized fixing.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as tsErrorStorage from '../tsErrorStorage';
import * as openAI from './openai-integration';
import { TypeScriptError, ErrorFix, ErrorFixHistory, ErrorCategory, ErrorStatus } from '../types/core/error-types';

/**
 * Dependency relationship between errors
 */
export interface ErrorDependency {
  sourceErrorId: number;
  targetErrorId: number;
  dependencyType: 'same-file' | 'import' | 'extends' | 'implements' | 'uses' | 'unknown';
  weight: number; // Higher weight means stronger dependency
}

/**
 * Error group with shared root cause
 */
export interface ErrorGroup {
  id: string; // Generated ID for the group
  rootCause: string;
  category: ErrorCategory;
  errors: number[]; // Error IDs
  pattern?: number; // Pattern ID if available
  fixPriority: number;
  suggestedFix?: string;
}

/**
 * Options for batch fixing
 */
export interface BatchFixOptions {
  dryRun: boolean;
  autoCommit: boolean;
  useAI: boolean;
  groupSimilarErrors: boolean;
  stopOnError: boolean;
  maxErrorsToFix: number;
}

/**
 * Default batch fix options
 */
const defaultBatchFixOptions: BatchFixOptions = {
  dryRun: true,
  autoCommit: false,
  useAI: true,
  groupSimilarErrors: true,
  stopOnError: true,
  maxErrorsToFix: 50
};

/**
 * Build a dependency graph of TypeScript errors
 * 
 * @param errors List of TypeScript errors
 * @returns Dependency graph as an adjacency list
 */
export function buildErrorDependencyGraph(
  errors: TypeScriptError[]
): Record<number, ErrorDependency[]> {
  const graph: Record<number, ErrorDependency[]> = {};
  
  // Initialize the graph
  for (const error of errors) {
    graph[error.id] = [];
  }
  
  // Build the dependency graph
  for (const sourceError of errors) {
    for (const targetError of errors) {
      if (sourceError.id === targetError.id) continue;
      
      // Check for dependencies
      const dependency = findDependency(sourceError, targetError);
      if (dependency) {
        graph[sourceError.id].push(dependency);
      }
    }
  }
  
  return graph;
}

/**
 * Find dependency between two errors
 * 
 * @param sourceError Source error
 * @param targetError Target error
 * @returns Dependency if found, otherwise undefined
 */
function findDependency(
  sourceError: TypeScriptError,
  targetError: TypeScriptError
): ErrorDependency | undefined {
  // Same file dependency
  if (sourceError.filePath === targetError.filePath) {
    // Line number-based dependency (errors on later lines may depend on earlier ones)
    if (sourceError.lineNumber > targetError.lineNumber) {
      return {
        sourceErrorId: sourceError.id,
        targetErrorId: targetError.id,
        dependencyType: 'same-file',
        weight: 5 + (10 / (sourceError.lineNumber - targetError.lineNumber + 1))
      };
    }
  }
  
  // Import dependency
  if (isImportDependency(sourceError, targetError)) {
    return {
      sourceErrorId: sourceError.id,
      targetErrorId: targetError.id,
      dependencyType: 'import',
      weight: 10
    };
  }
  
  // Type hierarchy dependency (extends, implements)
  const typeRelation = findTypeHierarchyDependency(sourceError, targetError);
  if (typeRelation) {
    return {
      sourceErrorId: sourceError.id,
      targetErrorId: targetError.id,
      dependencyType: typeRelation,
      weight: typeRelation === 'extends' ? 8 : 6
    };
  }
  
  // Related by error category (e.g., missing_type and type_mismatch)
  if (hasCategoryDependency(sourceError.category, targetError.category)) {
    return {
      sourceErrorId: sourceError.id,
      targetErrorId: targetError.id,
      dependencyType: 'unknown',
      weight: 3
    };
  }
  
  return undefined;
}

/**
 * Check if there's an import dependency between two errors
 * 
 * @param sourceError Source error
 * @param targetError Target error
 * @returns Whether there's an import dependency
 */
function isImportDependency(
  sourceError: TypeScriptError,
  targetError: TypeScriptError
): boolean {
  // Simple heuristic: check if the source file imports the target file
  // In a more sophisticated implementation, we'd parse the imports
  
  try {
    const sourceContent = fs.readFileSync(sourceError.filePath, 'utf-8');
    const sourceDir = path.dirname(sourceError.filePath);
    const targetPath = path.relative(sourceDir, targetError.filePath);
    
    const normalizedTargetPath = targetPath
      .replace(/\\/g, '/')
      .replace(/\.tsx?$/, '');
    
    const importRegex = new RegExp(
      `import\\s+(?:.+\\s+from\\s+)?['"](.+?)['"]`, 'g'
    );
    
    let match;
    while ((match = importRegex.exec(sourceContent)) !== null) {
      const importPath = match[1];
      if (
        importPath === normalizedTargetPath ||
        importPath === './' + normalizedTargetPath ||
        importPath === '../' + normalizedTargetPath
      ) {
        return true;
      }
    }
  } catch (error) {
    // If there's any error reading the file, assume no dependency
    console.error(`Error checking import dependency: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return false;
}

/**
 * Find type hierarchy dependency between two errors
 * 
 * @param sourceError Source error
 * @param targetError Target error
 * @returns Type of dependency if found, otherwise undefined
 */
function findTypeHierarchyDependency(
  sourceError: TypeScriptError,
  targetError: TypeScriptError
): 'extends' | 'implements' | undefined {
  // Simple heuristic: check error messages for extends/implements keywords
  
  const sourceMsg = sourceError.errorMessage.toLowerCase();
  const targetMsg = targetError.errorMessage.toLowerCase();
  
  // Extract type names from error messages
  const sourceTypeMatch = sourceMsg.match(/['"]([^'"]+)['"]/);
  const targetTypeMatch = targetMsg.match(/['"]([^'"]+)['"]/);
  
  if (sourceTypeMatch && targetTypeMatch) {
    const sourceType = sourceTypeMatch[1];
    const targetType = targetTypeMatch[1];
    
    // Check for extends relationship
    if (
      sourceMsg.includes(`extends ${targetType}`) ||
      targetMsg.includes(`${sourceType} extends`)
    ) {
      return 'extends';
    }
    
    // Check for implements relationship
    if (
      sourceMsg.includes(`implements ${targetType}`) ||
      targetMsg.includes(`${sourceType} implements`)
    ) {
      return 'implements';
    }
  }
  
  return undefined;
}

/**
 * Check if there's a category dependency between two error categories
 * 
 * @param sourceCategory Source error category
 * @param targetCategory Target error category
 * @returns Whether there's a category dependency
 */
function hasCategoryDependency(
  sourceCategory: ErrorCategory,
  targetCategory: ErrorCategory
): boolean {
  // Define category dependencies
  const categoryDependencies: Record<ErrorCategory, ErrorCategory[]> = {
    'type_mismatch': ['missing_type', 'interface_mismatch'],
    'missing_type': [],
    'undefined_variable': ['missing_type', 'import_error'],
    'null_reference': [],
    'interface_mismatch': ['missing_type'],
    'import_error': [],
    'syntax_error': [],
    'generic_constraint': ['missing_type'],
    'declaration_error': ['missing_type', 'import_error'],
    'other': []
  };
  
  return categoryDependencies[sourceCategory]?.includes(targetCategory) || false;
}

/**
 * Group errors by similar root causes
 * 
 * @param errors List of TypeScript errors
 * @returns Groups of errors with similar root causes
 */
export function clusterErrorsByRootCause(errors: TypeScriptError[]): ErrorGroup[] {
  const groups: ErrorGroup[] = [];
  const processedErrors = new Set<number>();
  
  // Group by file path first
  const errorsByFile: Record<string, TypeScriptError[]> = {};
  for (const error of errors) {
    const filePath = error.filePath;
    if (!errorsByFile[filePath]) {
      errorsByFile[filePath] = [];
    }
    errorsByFile[filePath].push(error);
  }
  
  // Group by error category within each file
  for (const filePath in errorsByFile) {
    const fileErrors = errorsByFile[filePath];
    
    const errorsByCategory: Record<ErrorCategory, TypeScriptError[]> = {};
    for (const error of fileErrors) {
      if (!errorsByCategory[error.category]) {
        errorsByCategory[error.category] = [];
      }
      errorsByCategory[error.category].push(error);
    }
    
    // Create groups for each category
    for (const category in errorsByCategory) {
      const categoryErrors = errorsByCategory[category as ErrorCategory];
      
      // Skip if only one error in category
      if (categoryErrors.length <= 1) continue;
      
      // Group by error code
      const errorsByCode: Record<string, TypeScriptError[]> = {};
      for (const error of categoryErrors) {
        if (!errorsByCode[error.errorCode]) {
          errorsByCode[error.errorCode] = [];
        }
        errorsByCode[error.errorCode].push(error);
      }
      
      // Create groups for each error code
      for (const errorCode in errorsByCode) {
        const codeErrors = errorsByCode[errorCode];
        
        // Skip if only one error with this code
        if (codeErrors.length <= 1) continue;
        
        // Create a group
        const groupId = `group_${filePath}_${category}_${errorCode}`.replace(/[^a-zA-Z0-9_]/g, '_');
        
        groups.push({
          id: groupId,
          rootCause: `Multiple errors with code ${errorCode} in file ${path.basename(filePath)}`,
          category: category as ErrorCategory,
          errors: codeErrors.map(e => e.id),
          fixPriority: calculateFixPriority(category as ErrorCategory),
          suggestedFix: getSuggestedFix(codeErrors[0])
        });
        
        // Mark errors as processed
        for (const error of codeErrors) {
          processedErrors.add(error.id);
        }
      }
      
      // Group remaining errors by line proximity
      const remainingErrors = categoryErrors.filter(e => !processedErrors.has(e.id));
      if (remainingErrors.length > 1) {
        // Sort by line number
        remainingErrors.sort((a, b) => a.lineNumber - b.lineNumber);
        
        // Group errors that are close to each other
        const proximityGroups: TypeScriptError[][] = [];
        let currentGroup: TypeScriptError[] = [remainingErrors[0]];
        
        for (let i = 1; i < remainingErrors.length; i++) {
          const prevError = remainingErrors[i - 1];
          const currError = remainingErrors[i];
          
          // If the errors are within 5 lines of each other, add to current group
          if (currError.lineNumber - prevError.lineNumber <= 5) {
            currentGroup.push(currError);
          } else {
            // Start a new group
            proximityGroups.push(currentGroup);
            currentGroup = [currError];
          }
        }
        
        // Add the last group
        if (currentGroup.length > 0) {
          proximityGroups.push(currentGroup);
        }
        
        // Create groups for each proximity group
        for (let i = 0; i < proximityGroups.length; i++) {
          const proximityGroup = proximityGroups[i];
          
          // Skip if only one error in proximity group
          if (proximityGroup.length <= 1) continue;
          
          // Create a group
          const groupId = `group_${filePath}_${category}_proximity_${i}`.replace(/[^a-zA-Z0-9_]/g, '_');
          
          groups.push({
            id: groupId,
            rootCause: `Multiple ${category} errors around line ${proximityGroup[0].lineNumber} in file ${path.basename(filePath)}`,
            category: category as ErrorCategory,
            errors: proximityGroup.map(e => e.id),
            fixPriority: calculateFixPriority(category as ErrorCategory),
            suggestedFix: getSuggestedFix(proximityGroup[0])
          });
          
          // Mark errors as processed
          for (const error of proximityGroup) {
            processedErrors.add(error.id);
          }
        }
      }
    }
  }
  
  // Add remaining errors as individual groups
  for (const error of errors) {
    if (!processedErrors.has(error.id)) {
      const groupId = `group_error_${error.id}`;
      
      groups.push({
        id: groupId,
        rootCause: error.errorMessage,
        category: error.category,
        errors: [error.id],
        fixPriority: calculateFixPriority(error.category),
        suggestedFix: getSuggestedFix(error)
      });
    }
  }
  
  // Sort groups by fix priority
  groups.sort((a, b) => b.fixPriority - a.fixPriority);
  
  return groups;
}

/**
 * Calculate fix priority based on error category
 * 
 * @param category Error category
 * @returns Fix priority (higher is more important)
 */
function calculateFixPriority(category: ErrorCategory): number {
  // Prioritize fixing fundamental issues first
  const categoryPriorities: Record<ErrorCategory, number> = {
    'syntax_error': 10,
    'import_error': 9,
    'missing_type': 8,
    'declaration_error': 7,
    'interface_mismatch': 6,
    'generic_constraint': 5,
    'type_mismatch': 4,
    'undefined_variable': 3,
    'null_reference': 2,
    'other': 1
  };
  
  return categoryPriorities[category] || 1;
}

/**
 * Get suggested fix for an error
 * 
 * @param error TypeScript error
 * @returns Suggested fix if available
 */
function getSuggestedFix(error: TypeScriptError): string | undefined {
  // Extract suggested fix from error message if available
  const message = error.errorMessage;
  
  if (message.includes('Did you mean')) {
    const match = message.match(/Did you mean ['"]([^'"]+)['"]/);
    if (match) {
      return match[1];
    }
  }
  
  if (message.includes('Property') && message.includes('does not exist on type')) {
    // Missing property error
    const propMatch = message.match(/Property ['"]([^'"]+)['"]/);
    const typeMatch = message.match(/type ['"]([^'"]+)['"]/);
    
    if (propMatch && typeMatch) {
      return `Add the '${propMatch[1]}' property to the '${typeMatch[1]}' type`;
    }
  }
  
  if (message.includes('is not assignable to type')) {
    // Type mismatch error
    const sourceMatch = message.match(/Type ['"]([^'"]+)['"]/);
    const targetMatch = message.match(/to type ['"]([^'"]+)['"]/);
    
    if (sourceMatch && targetMatch) {
      return `Convert '${sourceMatch[1]}' to '${targetMatch[1]}'`;
    }
  }
  
  return undefined;
}

/**
 * Topologically sort errors based on dependencies
 * 
 * @param dependencyGraph Error dependency graph
 * @returns Sorted list of error IDs (from independent to dependent)
 */
export function topologicalSortErrors(
  dependencyGraph: Record<number, ErrorDependency[]>
): number[] {
  const visited = new Set<number>();
  const tempVisited = new Set<number>();
  const result: number[] = [];
  
  function visit(errorId: number) {
    if (tempVisited.has(errorId)) {
      // Cyclic dependency, but continue with the algorithm
      return;
    }
    
    if (visited.has(errorId)) {
      return;
    }
    
    tempVisited.add(errorId);
    
    // Visit dependencies
    for (const dependency of dependencyGraph[errorId] || []) {
      visit(dependency.targetErrorId);
    }
    
    tempVisited.delete(errorId);
    visited.add(errorId);
    result.push(errorId);
  }
  
  // Visit all errors
  for (const errorId in dependencyGraph) {
    if (!visited.has(parseInt(errorId))) {
      visit(parseInt(errorId));
    }
  }
  
  // Reverse to get the correct order
  return result.reverse();
}

/**
 * Apply fixes to a batch of errors
 * 
 * @param errorIds List of error IDs to fix
 * @param options Batch fix options
 * @returns Results of the batch fix operation
 */
export async function applyBatchFixes(
  errorIds: number[],
  options: Partial<BatchFixOptions> = {}
): Promise<{
  success: boolean;
  fixedErrors: number[];
  failedErrors: number[];
  errorMessages: Record<number, string>;
}> {
  const opts = { ...defaultBatchFixOptions, ...options };
  const result = {
    success: true,
    fixedErrors: [] as number[],
    failedErrors: [] as number[],
    errorMessages: {} as Record<number, string>
  };
  
  // Limit the number of errors to fix
  const limitedErrorIds = errorIds.slice(0, opts.maxErrorsToFix);
  
  try {
    // Load errors
    const errors = await Promise.all(
      limitedErrorIds.map(async id => {
        const error = await tsErrorStorage.getTypescriptError(id);
        if (!error) {
          throw new Error(`Error not found: ${id}`);
        }
        return error;
      })
    );
    
    // Build dependency graph
    const dependencyGraph = buildErrorDependencyGraph(errors);
    
    // Get topologically sorted errors
    const sortedErrorIds = topologicalSortErrors(dependencyGraph);
    
    // Group similar errors if enabled
    let errorGroups: ErrorGroup[] = [];
    if (opts.groupSimilarErrors) {
      errorGroups = clusterErrorsByRootCause(errors);
      
      // Re-sort based on topological order and priority
      const errorIdToGroupIdx: Record<number, number> = {};
      for (let i = 0; i < errorGroups.length; i++) {
        for (const errorId of errorGroups[i].errors) {
          errorIdToGroupIdx[errorId] = i;
        }
      }
      
      // Sort groups based on the topological order of their first error
      errorGroups.sort((a, b) => {
        const aIndex = Math.min(...a.errors.map(id => sortedErrorIds.indexOf(id)));
        const bIndex = Math.min(...b.errors.map(id => sortedErrorIds.indexOf(id)));
        
        if (aIndex === bIndex) {
          // If same topological position, use fix priority
          return b.fixPriority - a.fixPriority;
        }
        
        return aIndex - bIndex;
      });
    } else {
      // Create individual groups for each error
      errorGroups = errors.map(error => ({
        id: `group_error_${error.id}`,
        rootCause: error.errorMessage,
        category: error.category,
        errors: [error.id],
        fixPriority: calculateFixPriority(error.category)
      }));
      
      // Sort groups based on topological order
      errorGroups.sort((a, b) => {
        const aIndex = sortedErrorIds.indexOf(a.errors[0]);
        const bIndex = sortedErrorIds.indexOf(b.errors[0]);
        return aIndex - bIndex;
      });
    }
    
    // Process each group
    for (const group of errorGroups) {
      try {
        // Get the pattern for the group if available
        const pattern = group.pattern 
          ? await tsErrorStorage.getErrorPattern(group.pattern) 
          : undefined;
        
        // Track modified files to avoid redundant reads/writes
        const modifiedFiles: Record<string, string> = {};
        
        // Process each error in the group
        for (const errorId of group.errors) {
          try {
            const error = errors.find(e => e.id === errorId);
            if (!error) continue;
            
            // Skip if already fixed
            if (error.status === 'fixed') {
              result.fixedErrors.push(errorId);
              continue;
            }
            
            // Get fixes for this error
            let fixes: ErrorFix[] = await tsErrorStorage.getErrorFixesByError(errorId);
            
            // If no fixes available and AI is enabled, generate a fix
            if (fixes.length === 0 && opts.useAI) {
              try {
                const fixSuggestion = await openAI.generateErrorFix(error);
                
                // Add the fix to the database
                const fix = await tsErrorStorage.addErrorFix({
                  errorId: error.id,
                  fixTitle: `AI-generated fix for ${error.errorCode}`,
                  fixDescription: fixSuggestion.fixExplanation,
                  fixCode: fixSuggestion.fixCode,
                  originalCode: fixSuggestion.originalCode,
                  fixScope: fixSuggestion.fixScope,
                  fixType: 'semi-automatic',
                  fixPriority: 5,
                  successRate: fixSuggestion.confidence * 100
                });
                
                fixes = [fix as ErrorFix];
              } catch (err) {
                console.error(`Failed to generate AI fix for error ${errorId}: ${err instanceof Error ? err.message : String(err)}`);
                
                // Try to get a pattern-based fix if available
                if (pattern) {
                  const patternFixes = await tsErrorStorage.getErrorFixesByPattern(pattern.id);
                  if (patternFixes.length > 0) {
                    fixes = patternFixes as ErrorFix[];
                  }
                }
              }
            }
            
            // If still no fixes, skip this error
            if (fixes.length === 0) {
              result.failedErrors.push(errorId);
              result.errorMessages[errorId] = 'No fixes available';
              continue;
            }
            
            // Sort fixes by success rate and priority
            fixes.sort((a, b) => {
              if (a.successRate !== b.successRate) {
                return (b.successRate || 0) - (a.successRate || 0);
              }
              return b.fixPriority - a.fixPriority;
            });
            
            // Get the best fix
            const fix = fixes[0];
            
            // Get or read the file content
            let fileContent: string;
            if (modifiedFiles[error.filePath] !== undefined) {
              fileContent = modifiedFiles[error.filePath];
            } else {
              try {
                if (!fs.existsSync(error.filePath)) {
                  result.failedErrors.push(errorId);
                  result.errorMessages[errorId] = `File not found: ${error.filePath}`;
                  continue;
                }
                
                fileContent = fs.readFileSync(error.filePath, 'utf-8');
                modifiedFiles[error.filePath] = fileContent;
              } catch (err) {
                result.failedErrors.push(errorId);
                result.errorMessages[errorId] = `Failed to read file: ${err instanceof Error ? err.message : String(err)}`;
                continue;
              }
            }
            
            // Apply the fix
            let fixedContent: string = fileContent;
            
            try {
              const lines = fileContent.split('\n');
              
              switch (fix.fixScope) {
                case 'line':
                  // Replace the entire line
                  lines[error.lineNumber - 1] = fix.fixCode;
                  fixedContent = lines.join('\n');
                  break;
                  
                case 'token':
                  // Replace just the token at the error position
                  const line = lines[error.lineNumber - 1];
                  const tokenStart = error.columnNumber - 1;
                  let tokenEnd = tokenStart;
                  
                  // Find token boundaries
                  while (tokenEnd < line.length && 
                        !/[\s\(\)\[\]\{\}\:\;\,\.\<\>\=\+\-\*\/\&\|\^\!\~\?\@\#\%]/.test(line[tokenEnd])) {
                    tokenEnd++;
                  }
                  
                  const newLine = line.substring(0, tokenStart) + fix.fixCode + line.substring(tokenEnd);
                  lines[error.lineNumber - 1] = newLine;
                  fixedContent = lines.join('\n');
                  break;
                  
                case 'custom':
                  // Replace the exact code specified in originalCode
                  if (fix.originalCode && fileContent.includes(fix.originalCode)) {
                    fixedContent = fileContent.replace(fix.originalCode, fix.fixCode);
                  } else {
                    result.failedErrors.push(errorId);
                    result.errorMessages[errorId] = 'Cannot apply custom fix: originalCode not found in file';
                    continue;
                  }
                  break;
              }
              
              // Update the modified file cache
              modifiedFiles[error.filePath] = fixedContent;
              
              // If not a dry run, write the fixed content back to the file
              if (!opts.dryRun) {
                fs.writeFileSync(error.filePath, fixedContent);
                
                // Add fix history entry
                await tsErrorStorage.addErrorFixHistory({
                  errorId: error.id,
                  fixId: fix.id,
                  originalCode: fileContent,
                  fixedCode: fixedContent,
                  fixedAt: new Date(),
                  fixMethod: 'assisted',
                  fixResult: 'success'
                });
                
                // Update error status
                await tsErrorStorage.updateTypescriptError(error.id, {
                  status: 'fixed',
                  fixId: fix.id,
                  resolvedAt: new Date()
                });
              }
              
              result.fixedErrors.push(errorId);
            } catch (err) {
              result.failedErrors.push(errorId);
              result.errorMessages[errorId] = `Failed to apply fix: ${err instanceof Error ? err.message : String(err)}`;
              
              if (opts.stopOnError) {
                throw err;
              }
            }
          } catch (err) {
            if (opts.stopOnError) {
              throw err;
            }
            
            result.failedErrors.push(errorId);
            result.errorMessages[errorId] = `Error processing error ${errorId}: ${err instanceof Error ? err.message : String(err)}`;
          }
        }
      } catch (err) {
        if (opts.stopOnError) {
          throw err;
        }
        
        // Mark all errors in this group as failed
        for (const errorId of group.errors) {
          if (!result.fixedErrors.includes(errorId)) {
            result.failedErrors.push(errorId);
            result.errorMessages[errorId] = `Error processing group ${group.id}: ${err instanceof Error ? err.message : String(err)}`;
          }
        }
      }
    }
  } catch (err) {
    result.success = false;
    console.error('Error in batch fix process:', err);
    
    // Mark all remaining errors as failed
    for (const errorId of limitedErrorIds) {
      if (!result.fixedErrors.includes(errorId) && !result.failedErrors.includes(errorId)) {
        result.failedErrors.push(errorId);
        result.errorMessages[errorId] = `Batch processing error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
  }
  
  // Update overall success flag
  result.success = result.failedErrors.length === 0;
  
  return result;
}

/**
 * Create a transaction for batch fixing
 * 
 * @param errorIds List of error IDs to fix
 * @returns Transaction object
 */
export async function createFixTransaction(
  errorIds: number[]
): Promise<{
  id: string;
  errorIds: number[];
  backupFiles: Record<string, string>;
  createdAt: Date;
}> {
  const id = `fix_transaction_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const transaction = {
    id,
    errorIds,
    backupFiles: {} as Record<string, string>,
    createdAt: new Date()
  };
  
  try {
    // Load errors
    const errors = await Promise.all(
      errorIds.map(async id => {
        const error = await tsErrorStorage.getTypescriptError(id);
        if (!error) {
          throw new Error(`Error not found: ${id}`);
        }
        return error;
      })
    );
    
    // Create unique list of files to back up
    const filePaths = Array.from(new Set(errors.map(e => e.filePath)));
    
    // Back up each file
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          transaction.backupFiles[filePath] = content;
        }
      } catch (err) {
        console.error(`Failed to back up file ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
        // Continue with other files
      }
    }
    
    // Save transaction to disk
    const backupDir = path.join('.', 'tmp', 'ts-fix-backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const transactionPath = path.join(backupDir, `${id}.json`);
    fs.writeFileSync(transactionPath, JSON.stringify({
      id,
      errorIds,
      filePaths,
      createdAt: transaction.createdAt.toISOString()
    }));
    
    // Save backups to separate files
    for (const filePath in transaction.backupFiles) {
      const backupPath = path.join(backupDir, `${id}_${path.basename(filePath)}.bak`);
      fs.writeFileSync(backupPath, transaction.backupFiles[filePath]);
    }
  } catch (err) {
    console.error('Failed to create fix transaction:', err);
    throw err;
  }
  
  return transaction;
}

/**
 * Roll back a batch fix transaction
 * 
 * @param transactionId Transaction ID
 * @returns Whether the rollback was successful
 */
export async function rollbackFixTransaction(
  transactionId: string
): Promise<{
  success: boolean;
  restoredFiles: string[];
  errorMessage?: string;
}> {
  const result = {
    success: true,
    restoredFiles: [] as string[]
  };
  
  try {
    // Load transaction metadata
    const backupDir = path.join('.', 'tmp', 'ts-fix-backups');
    const transactionPath = path.join(backupDir, `${transactionId}.json`);
    
    if (!fs.existsSync(transactionPath)) {
      return {
        success: false,
        restoredFiles: [],
        errorMessage: `Transaction not found: ${transactionId}`
      };
    }
    
    const transaction = JSON.parse(fs.readFileSync(transactionPath, 'utf-8'));
    
    // Restore each file
    for (const filePath of transaction.filePaths) {
      const backupPath = path.join(backupDir, `${transactionId}_${path.basename(filePath)}.bak`);
      
      if (fs.existsSync(backupPath)) {
        const content = fs.readFileSync(backupPath, 'utf-8');
        fs.writeFileSync(filePath, content);
        result.restoredFiles.push(filePath);
      }
    }
    
    // Update error statuses
    for (const errorId of transaction.errorIds) {
      await tsErrorStorage.updateTypescriptError(errorId, {
        status: 'detected',
        fixId: undefined,
        resolvedAt: undefined
      });
    }
  } catch (err) {
    result.success = false;
    result.errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Failed to roll back fix transaction:', err);
  }
  
  return result;
}