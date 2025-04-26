/**
 * Advanced TypeScript Error Analyzer
 * 
 * This module provides deep analysis capabilities for TypeScript errors,
 * including dependency tracking to identify root causes and cascading errors.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { analyzeProject } from './ts-error-analyzer';
import { findErrorPatterns } from './ts-pattern-finder';
import { analyzeErrorWithAI, isOpenAIConfigured } from './openai-integration';
import { tsErrorStorage } from '../tsErrorStorage';

// Interface for deep scan options
interface DeepScanOptions {
  useAI?: boolean;
  deepScan?: boolean;
  traceSymbols?: boolean;
  projectPath?: string;
  excludePaths?: string[];
  includePatterns?: string[];
  concurrency?: number;
}

// Interface for deep scan results
interface DeepScanResults {
  basicResults: unknown;
  advancedResults: {
    rootCauseErrors: number;
    cascadingErrors: number;
    independentErrors: number;
    errorDependencies: Array<{
      sourceError: {
        id: number;
        filePath: string;
        lineNumber: number;
        errorCode: string;
        errorMessage: string;
      };
      affectedErrors: Array<{
        id: number;
        filePath: string;
        lineNumber: number;
        errorCode: string;
        errorMessage: string;
      }>;
      impact: number;
    }>;
    fixPriorities: Array<{
      errorId: number;
      filePath: string;
      lineNumber: number;
      priority: number;
      reason: string;
    }>;
  };
  patterns: unknown[];
}

/**
 * Run a deep scan of TypeScript errors with dependency tracking
 * 
 * @param options Deep scan options
 * @returns Deep scan results
 */
export async function runDeepScan(options: DeepScanOptions = {}): Promise<DeepScanResults> {
  try {
    // Run basic analysis first
    console.log('Running basic TypeScript error analysis...');
    const basicResults = await analyzeProject();
    
    if (basicResults.totalErrors === 0) {
      console.log('No TypeScript errors found.');
      return {
        basicResults,
        advancedResults: {
          rootCauseErrors: 0,
          cascadingErrors: 0,
          independentErrors: 0,
          errorDependencies: [],
          fixPriorities: []
        },
        patterns: []
      };
    }
    
    console.log(`Found ${basicResults.totalErrors} TypeScript errors.`);
    
    // Run advanced analysis
    console.log('Running advanced error analysis with dependency tracking...');
    const advancedResults = await runAdvancedAnalysis(basicResults, options);
    
    // Find error patterns
    console.log('Identifying error patterns...');
    const patterns = await findErrorPatterns(basicResults);
    
    // Return combined results
    return {
      basicResults,
      advancedResults,
      patterns
    };
  } catch (error) {
    console.error('Error running deep scan:', error);
    throw error;
  }
}

/**
 * Run advanced analysis on TypeScript errors to identify dependencies
 * 
 * @param basicResults Results from basic analysis
 * @param options Analysis options
 * @returns Advanced analysis results
 */
export async function runAdvancedAnalysis(basicResults: unknown,
  options: DeepScanOptions = {}
): Promise<{
  rootCauseErrors: number;
  cascadingErrors: number;
  independentErrors: number;
  errorDependencies: Array<{
    sourceError: {
      id: number;
      filePath: string;
      lineNumber: number;
      errorCode: string;
      errorMessage: string;
    };
    affectedErrors: Array<{
      id: number;
      filePath: string;
      lineNumber: number;
      errorCode: string;
      errorMessage: string;
    }>;
    impact: number;
  }>;
  fixPriorities: Array<{
    errorId: number;
    filePath: string;
    lineNumber: number;
    priority: number;
    reason: string;
  }>;
}> {
  try {
    const errors = basicResults.errors || [];
    
    if (errors.length === 0) {
      return {
        rootCauseErrors: 0,
        cascadingErrors: 0,
        independentErrors: 0,
        errorDependencies: [],
        fixPriorities: []
      };
    }
    
    // Group errors by file
    const errorsByFile: Record<string, any[]> = {};
    
    for (const error of errors) {
      if (!errorsByFile[error.filePath]) {
        errorsByFile[error.filePath] = [];
      }
      
      errorsByFile[error.filePath].push(error);
    }
    
    // Build dependency graph
    console.log('Building error dependency graph...');
    const dependencies: Array<{
      sourceError: unknown;
      affectedErrors: unknown[];
      impact: number;
    }> = [];
    
    // Set of errors that are affected by other errors
    const cascadingErrorIds = new Set<number>();
    
    // For each file with errors
    for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
      // Sort errors by line number
      fileErrors.sort((a, b) => a.lineNumber - b.lineNumber);
      
      // For each error in the file
      for (let i = 0; i < fileErrors.length; i++) {
        const error = fileErrors[i];
        
        // Skip if this is already identified as a cascading error
        if (cascadingErrorIds.has(error.id)) {
          continue;
        }
        
        // Find potential dependent errors
        const potentialDependents = findPotentialDependents(error, fileErrors, errorsByFile);
        
        // If this error affects others
        if (potentialDependents.length > 0) {
          // Add to dependencies
          dependencies.push({
            sourceError: {
              id: error.id,
              filePath: error.filePath,
              lineNumber: error.lineNumber,
              errorCode: error.errorCode,
              errorMessage: error.errorMessage
            },
            affectedErrors: potentialDependents.map(e => ({
              id: e.id,
              filePath: e.filePath,
              lineNumber: e.lineNumber,
              errorCode: e.errorCode,
              errorMessage: e.errorMessage
            })),
            impact: potentialDependents.length
          });
          
          // Mark dependent errors as cascading
          for (const dependent of potentialDependents) {
            cascadingErrorIds.add(dependent.id);
          }
        }
      }
    }
    
    // Identify root cause errors and independent errors
    const rootCauseErrorIds = new Set(
      dependencies.map(dep => dep.sourceError.id)
    );
    
    const independentErrorIds = new Set(
      errors
        .filter(error => !cascadingErrorIds.has(error.id) && !rootCauseErrorIds.has(error.id))
        .map(error => error.id)
    );
    
    // Calculate fix priorities
    console.log('Calculating fix priorities...');
    const fixPriorities = calculateFixPriorities(errors, dependencies, rootCauseErrorIds, independentErrorIds);
    
    // Use AI to enhance analysis if requested
    if (options.useAI && isOpenAIConfigured()) {
      console.log('Enhancing analysis with AI...');
      await enhanceWithAI(dependencies, errors);
    }
    
    return {
      rootCauseErrors: rootCauseErrorIds.size,
      cascadingErrors: cascadingErrorIds.size,
      independentErrors: independentErrorIds.size,
      errorDependencies: dependencies,
      fixPriorities
    };
  } catch (error) {
    console.error('Error running advanced analysis:', error);
    throw error;
  }
}

/**
 * Find potential dependent errors for a given error
 * 
 * @param error Source error
 * @param fileErrors Other errors in the same file
 * @param errorsByFile Errors grouped by file
 * @returns Array of potential dependent errors
 */
function findPotentialDependents(error: unknown,
  fileErrors: unknown[],
  errorsByFile: Record<string, any[]>
): unknown[] {
  const dependents: unknown[] = [];
  
  // Check for potential dependents in the same file
  for (const otherError of fileErrors) {
    // Skip the error itself
    if (otherError.id === error.id) {
      continue;
    }
    
    // If the error is on a later line in the same file
    if (otherError.lineNumber > error.lineNumber) {
      // For type errors, check if they are related
      if (
        error.category === 'type_mismatch' ||
        error.category === 'missing_type' ||
        error.category === 'null_reference'
      ) {
        // Add as a potential dependent
        dependents.push(otherError);
      }
      
      // For import errors, check if they affect other errors
      if (error.category === 'import_error') {
        // All subsequent errors in the file could be affected
        dependents.push(otherError);
      }
    }
  }
  
  // For import errors, check for potential dependents in other files
  if (error.category === 'import_error') {
    // Extract the import path from the error message
    const importMatch = error.errorMessage.match(/Cannot find module '(.+)'/);
    
    if (importMatch && importMatch[1]) {
      const importPath = importMatch[1];
      
      // Check if there are errors in the imported file
      for (const [otherFilePath, otherFileErrors] of Object.entries(errorsByFile)) {
        // Skip the same file
        if (otherFilePath === error.filePath) {
          continue;
        }
        
        // If the file path includes the import path
        if (
          otherFilePath.includes(importPath) ||
          path.basename(otherFilePath, path.extname(otherFilePath)) === importPath
        ) {
          // All errors in the imported file could be affected
          dependents.push(...otherFileErrors);
        }
      }
    }
  }
  
  return dependents;
}

/**
 * Calculate fix priorities for errors
 * 
 * @param errors All errors
 * @param dependencies Error dependencies
 * @param rootCauseErrorIds Set of root cause error IDs
 * @param independentErrorIds Set of independent error IDs
 * @returns Array of fix priorities
 */
function calculateFixPriorities(errors: unknown[],
  dependencies: Array<{
    sourceError: unknown;
    affectedErrors: unknown[];
    impact: number;
  }>,
  rootCauseErrorIds: Set<number>,
  independentErrorIds: Set<number>
): Array<{
  errorId: number;
  filePath: string;
  lineNumber: number;
  priority: number;
  reason: string;
}> {
  const priorities: Array<{
    errorId: number;
    filePath: string;
    lineNumber: number;
    priority: number;
    reason: string;
  }> = [];
  
  // Prioritize root cause errors by impact
  dependencies
    .sort((a, b) => b.impact - a.impact)
    .forEach((dep, index) => {
      priorities.push({
        errorId: dep.sourceError.id,
        filePath: dep.sourceError.filePath,
        lineNumber: dep.sourceError.lineNumber,
        priority: 100 - index,
        reason: `Root cause error affecting ${dep.impact} other errors`
      });
    });
  
  // Add independent errors with medium priority
  errors
    .filter(error => independentErrorIds.has(error.id))
    .forEach((error, index) => {
      priorities.push({
        errorId: error.id,
        filePath: error.filePath,
        lineNumber: error.lineNumber,
        priority: 50 - index * 0.1,
        reason: 'Independent error'
      });
    });
  
  // Sort by priority (highest first)
  return priorities.sort((a, b) => b.priority - a.priority);
}

/**
 * Enhance analysis with AI
 * 
 * @param dependencies Error dependencies
 * @param errors All errors
 */
async function enhanceWithAI(
  dependencies: Array<{
    sourceError: unknown;
    affectedErrors: unknown[];
    impact: number;
  }>,
  errors: unknown[]
): Promise<void> {
  // Only analyze the top 5 root cause errors
  const topRootCauses = dependencies
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);
  
  for (const dep of topRootCauses) {
    try {
      // Find the full error information
      const error = errors.find(e => e.id === dep.sourceError.id);
      
      if (!error) {
        continue;
      }
      
      // Get the file content
      const filePath = error.filePath;
      
      if (!fs.existsSync(filePath)) {
        continue;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Analyze with AI
      const analysis = await analyzeErrorWithAI(error, fileContent);
      
      // Store AI insights in the database
      await tsErrorStorage.updateTypescriptError(error.id, {
        metadata: {
          ...error.metadata,
          aiAnalysis: {
            rootCause: analysis.rootCause,
            suggestedFix: analysis.suggestedFix,
            confidence: analysis.confidence,
            relatedErrors: analysis.relatedErrors
          }
        }
      });
      
      console.log(`AI analysis completed for error ${error.id}`);
    } catch (error) {
      console.error('Error enhancing with AI:', error);
    }
  }
}

export default {
  runDeepScan,
  runAdvancedAnalysis
};