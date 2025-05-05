/**
 * TypeScript Error Analyzer
 * 
 * This utility analyzes TypeScript errors, categorizes them, finds relationships
 * between errors, and provides insights to help prioritize and fix them effectively.
 */

import { 
  TypeScriptErrorDetail, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorFindingResult 
} from './ts-error-finder';
import { logSecurityEvent } from '../security';

// Types for our error analyzer
export interface ErrorAnalysisResult {
  rootCauses: RootCauseAnalysis[];
  errorGroups: ErrorGroup[];
  patternFrequency: Record<string, number>;
  suggestedFixOrder: TypeScriptErrorDetail[];
  impactAssessment: ImpactAssessment;
  summary: string;
}

export interface RootCauseAnalysis {
  category: ErrorCategory;
  pattern: string;
  affectedFiles: number;
  totalErrors: number;
  examples: TypeScriptErrorDetail[];
  suggestedFix?: string;
}

export interface ErrorGroup {
  id: string;
  name: string;
  description: string;
  errors: TypeScriptErrorDetail[];
  rootError?: TypeScriptErrorDetail;
  severity: ErrorSeverity;
  fixPriority: number;
}

export interface ImpactAssessment {
  criticalFiles: string[];
  errorDensity: Record<string, number>;
  highImpactErrors: TypeScriptErrorDetail[];
  blockerCount: number;
  estimatedFixTime: number; // in minutes
}

export interface ErrorAnalyzerOptions {
  maxGroupSize?: number;
  minPatternFrequency?: number;
  detailedAnalysis?: boolean;
  includeLowSeverity?: boolean;
  groupSimilarErrors?: boolean;
  similarityThreshold?: number;
  maxExamplesPerPattern?: number;
  verbose?: boolean;
  includeFileContext?: boolean;
  contextLines?: number;
}

// Default options
const defaultOptions: ErrorAnalyzerOptions = {
  maxGroupSize: 10,
  minPatternFrequency: 2,
  detailedAnalysis: true,
  includeLowSeverity: false,
  groupSimilarErrors: true,
  similarityThreshold: 0.7,
  maxExamplesPerPattern: 3,
  verbose: false
};

/**
 * Analyze TypeScript errors
 */
export async function analyzeTypeScriptErrors(
  errors: TypeScriptErrorDetail[] | ErrorFindingResult,
  options: ErrorAnalyzerOptions = {}
): Promise<ErrorAnalysisResult> {
  const startTime = Date.now();
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Convert errors array to ErrorFindingResult format if needed
    const result: ErrorFindingResult = Array.isArray(errors) 
      ? {
          totalErrors: errors.filter(e => e.severity === ErrorSeverity.Error).length,
          totalWarnings: errors.filter(e => e.severity === ErrorSeverity.Warning).length,
          errorsByFile: errors.reduce((acc, error) => {
            acc[error.file] = (acc[error.file] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          errorsByCategory: errors.reduce((acc, error) => {
            acc[error.category] = (acc[error.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          errorsByCode: errors.reduce((acc, error) => {
            acc[error.code] = (acc[error.code] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          errors: errors,
          fileCount: Object.keys(errors.reduce((acc, error) => {
            acc[error.file] = true;
            return acc;
          }, {} as Record<string, boolean>)).length,
          scannedLineCount: 0,
          processingTimeMs: 0,
          summary: `Analyzing ${errors.length} errors`
        }
      : errors;
    
    // Initialize analysis result
    const analysis: ErrorAnalysisResult = {
      rootCauses: [],
      errorGroups: [],
      patternFrequency: {},
      suggestedFixOrder: [],
      impactAssessment: {
        criticalFiles: [],
        errorDensity: {},
        highImpactErrors: [],
        blockerCount: 0,
        estimatedFixTime: 0
      },
      summary: ''
    };

    // Skip analysis if no errors
    if (result.errors.length === 0) {
      analysis.summary = 'No errors to analyze.';
      return analysis;
    }

    if (mergedOptions.verbose) {
      console.log(`Analyzing ${result.errors.length} TypeScript errors...`);
    }

    // Find error patterns and frequencies
    const patternFrequency = findErrorPatterns(result.errors);
    analysis.patternFrequency = patternFrequency;

    // Identify root causes
    analysis.rootCauses = identifyRootCauses(
      result.errors,
      patternFrequency,
      mergedOptions
    );

    // Group similar errors
    if (mergedOptions.groupSimilarErrors) {
      analysis.errorGroups = groupSimilarErrors(
        result.errors,
        mergedOptions.similarityThreshold!,
        mergedOptions.maxGroupSize!
      );
    }

    // Determine fix order
    analysis.suggestedFixOrder = determineSuggestedFixOrder(result.errors);

    // Assess impact
    analysis.impactAssessment = assessImpact(result);

    // Generate summary
    analysis.summary = generateAnalysisSummary(analysis, result);

    // Log success
    logSecurityEvent('TypeScript error analysis completed', 'info', { 
      errorCount: String(result.totalErrors),
      rootCauseCount: String(analysis.rootCauses.length),
      groupCount: String(analysis.errorGroups.length)
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing TypeScript errors:', error);
    
    // Log error
    logSecurityEvent('TypeScript error analysis failed', 'error', { 
      errorMessage: (error as Error).message
    });
    
    // Return partial result
    return {
      rootCauses: [],
      errorGroups: [],
      patternFrequency: {},
      suggestedFixOrder: [],
      impactAssessment: {
        criticalFiles: [],
        errorDensity: {},
        highImpactErrors: [],
        blockerCount: 0,
        estimatedFixTime: 0
      },
      summary: `Error during analysis: ${(error as Error).message}`
    };
  }
}

/**
 * Find error patterns and their frequencies
 */
function findErrorPatterns(errors: TypeScriptErrorDetail[]): Record<string, number> {
  const patterns: Record<string, number> = {};
  
  for (const error of errors) {
    // Extract pattern from error code and message
    const pattern = extractErrorPattern(error);
    
    // Increment pattern count
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  }
  
  return patterns;
}

/**
 * Extract a pattern from an error
 */
function extractErrorPattern(error: TypeScriptErrorDetail): string {
  // Extract error code
  const code = error.code;
  
  // Simplify error message to create a pattern
  let message = error.message;
  
  // Replace specific identifiers with placeholders
  message = message.replace(/'[^']+'/g, "'IDENTIFIER'")
                 .replace(/"[^"]+"/g, '"IDENTIFIER"')
                 .replace(/\b[A-Za-z0-9_]+\b/g, (match) => {
                    // Don't replace common keywords
                    const keywords = ['type', 'interface', 'class', 'function', 'const', 'let', 'var'];
                    return keywords.includes(match) ? match : 'IDENTIFIER';
                 })
                 .replace(/\d+/g, 'N');
  
  return `${code}: ${message}`;
}

/**
 * Identify root causes of errors
 */
function identifyRootCauses(
  errors: TypeScriptErrorDetail[],
  patternFrequency: Record<string, number>,
  options: ErrorAnalyzerOptions
): RootCauseAnalysis[] {
  const rootCauses: RootCauseAnalysis[] = [];
  const minFrequency = options.minPatternFrequency || 2;
  const maxExamples = options.maxExamplesPerPattern || 3;
  
  // Track files affected by each pattern
  const patternToFiles: Record<string, Set<string>> = {};
  
  // Map errors to patterns
  const patternToErrors: Record<string, TypeScriptErrorDetail[]> = {};
  
  for (const error of errors) {
    const pattern = extractErrorPattern(error);
    
    // Skip patterns below minimum frequency
    if (patternFrequency[pattern] < minFrequency) {
      continue;
    }
    
    // Track files
    if (!patternToFiles[pattern]) {
      patternToFiles[pattern] = new Set<string>();
    }
    patternToFiles[pattern].add(error.file);
    
    // Track errors
    if (!patternToErrors[pattern]) {
      patternToErrors[pattern] = [];
    }
    patternToErrors[pattern].push(error);
  }
  
  // Create root cause analysis for each significant pattern
  for (const pattern in patternToErrors) {
    const relatedErrors = patternToErrors[pattern];
    const affectedFiles = patternToFiles[pattern].size;
    
    // Skip patterns with only one affected file if not doing detailed analysis
    if (affectedFiles <= 1 && !options.detailedAnalysis) {
      continue;
    }
    
    // Get examples (limit to max)
    const examples = relatedErrors.slice(0, maxExamples);
    
    // Determine common category
    const categories = relatedErrors.map(e => e.category);
    const categoryCounts: Record<string, number> = {};
    
    for (const category of categories) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    
    const category = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as ErrorCategory;
    
    // Create root cause analysis
    rootCauses.push({
      category,
      pattern,
      affectedFiles,
      totalErrors: relatedErrors.length,
      examples,
      suggestedFix: examples[0].suggestedFix
    });
  }
  
  // Sort root causes by total errors (descending)
  rootCauses.sort((a, b) => b.totalErrors - a.totalErrors);
  
  return rootCauses;
}

/**
 * Group similar errors together
 */
function groupSimilarErrors(
  errors: TypeScriptErrorDetail[],
  similarityThreshold: number,
  maxGroupSize: number
): ErrorGroup[] {
  const groups: ErrorGroup[] = [];
  const processedErrors = new Set<string>();
  
  // Create a unique ID for an error
  function createErrorId(error: TypeScriptErrorDetail): string {
    return `${error.file}:${error.line}:${error.column}:${error.code}`;
  }
  
  // Check if two errors are similar
  function areSimilar(a: TypeScriptErrorDetail, b: TypeScriptErrorDetail): boolean {
    // Same code is a strong indicator
    if (a.code === b.code) {
      // If in same file, likely related
      if (a.file === b.file) {
        return true;
      }
      
      // Check message similarity
      const similarity = calculateStringSimilarity(a.message, b.message);
      return similarity >= similarityThreshold;
    }
    
    // Different codes, check if they're in the same file and close to each other
    if (a.file === b.file) {
      const lineDifference = Math.abs(a.line - b.line);
      if (lineDifference <= 5) {
        // Close proximity errors are often related
        return true;
      }
    }
    
    return false;
  }
  
  // For each error, find similar errors and create groups
  for (const error of errors) {
    const errorId = createErrorId(error);
    
    // Skip if already processed
    if (processedErrors.has(errorId)) {
      continue;
    }
    
    // Mark as processed
    processedErrors.add(errorId);
    
    // Find similar errors
    const similarErrors: TypeScriptErrorDetail[] = [error];
    
    for (const otherError of errors) {
      const otherId = createErrorId(otherError);
      
      // Skip if same error or already processed
      if (errorId === otherId || processedErrors.has(otherId)) {
        continue;
      }
      
      // Check similarity
      if (areSimilar(error, otherError)) {
        similarErrors.push(otherError);
        processedErrors.add(otherId);
        
        // Limit group size
        if (similarErrors.length >= maxGroupSize) {
          break;
        }
      }
    }
    
    // Only create groups with at least 2 errors
    if (similarErrors.length > 1) {
      // Determine root error (usually the one with the lowest line number)
      similarErrors.sort((a, b) => {
        // First sort by file
        if (a.file !== b.file) {
          return a.file.localeCompare(b.file);
        }
        // Then by line number
        return a.line - b.line;
      });
      
      const rootError = similarErrors[0];
      
      // Create group
      const group: ErrorGroup = {
        id: `group-${groups.length + 1}`,
        name: `Error Group: ${rootError.code}`,
        description: `Group of ${similarErrors.length} similar errors related to ${rootError.code}`,
        errors: similarErrors,
        rootError,
        severity: rootError.severity,
        fixPriority: calculateFixPriority(rootError)
      };
      
      groups.push(group);
    }
  }
  
  // Sort groups by fix priority (descending)
  groups.sort((a, b) => b.fixPriority - a.fixPriority);
  
  return groups;
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(a: string, b: string): number {
  // For long strings, just compare first 100 chars
  if (a.length > 100 || b.length > 100) {
    a = a.substring(0, 100);
    b = b.substring(0, 100);
  }
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Calculate similarity (0 to 1)
  const distance = matrix[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);
  
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Calculate fix priority for an error
 */
function calculateFixPriority(error: TypeScriptErrorDetail): number {
  // Base priority on severity
  let priority = 0;
  
  switch (error.severity) {
    case ErrorSeverity.Error:
      priority = 100;
      break;
    case ErrorSeverity.Warning:
      priority = 50;
      break;
    case ErrorSeverity.Suggestion:
      priority = 25;
      break;
    case ErrorSeverity.Message:
      priority = 10;
      break;
  }
  
  // Adjust based on category
  switch (error.category) {
    case ErrorCategory.Type:
      priority += 10;
      break;
    case ErrorCategory.Syntax:
      priority += 15;
      break;
    case ErrorCategory.Import:
      priority += 12;
      break;
    case ErrorCategory.Declaration:
      priority += 8;
      break;
    case ErrorCategory.Security:
      priority += 20;
      break;
    case ErrorCategory.Performance:
      priority += 5;
      break;
  }
  
  // Errors blocking other errors should be fixed first
  if (error.message.includes('cannot find') || 
      error.message.includes('undefined') ||
      error.message.includes('missing')) {
    priority += 15;
  }
  
  return priority;
}

/**
 * Determine suggested fix order for errors
 */
function determineSuggestedFixOrder(errors: TypeScriptErrorDetail[]): TypeScriptErrorDetail[] {
  // Clone errors to avoid modifying original
  const sortedErrors = [...errors];
  
  // Calculate priority for each error
  const errorPriorities = new Map<TypeScriptErrorDetail, number>();
  
  for (const error of sortedErrors) {
    const priority = calculateFixPriority(error);
    errorPriorities.set(error, priority);
  }
  
  // Sort by priority (descending)
  sortedErrors.sort((a, b) => {
    const priorityA = errorPriorities.get(a) || 0;
    const priorityB = errorPriorities.get(b) || 0;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    // If same priority, group by file
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file);
    }
    
    // Then by line number
    return a.line - b.line;
  });
  
  return sortedErrors;
}

/**
 * Assess impact of errors
 */
function assessImpact(result: ErrorFindingResult): ImpactAssessment {
  const assessment: ImpactAssessment = {
    criticalFiles: [],
    errorDensity: {},
    highImpactErrors: [],
    blockerCount: 0,
    estimatedFixTime: 0
  };
  
  // Calculate error density by file
  const fileErrors: Record<string, TypeScriptErrorDetail[]> = {};
  
  for (const error of result.errors) {
    if (!fileErrors[error.file]) {
      fileErrors[error.file] = [];
    }
    fileErrors[error.file].push(error);
  }
  
  // Calculate density
  for (const file in fileErrors) {
    const errors = fileErrors[file];
    assessment.errorDensity[file] = errors.length;
    
    // Identify critical files (high error density)
    if (errors.length >= 5) {
      assessment.criticalFiles.push(file);
    }
  }
  
  // Sort critical files by error count (descending)
  assessment.criticalFiles.sort((a, b) => 
    assessment.errorDensity[b] - assessment.errorDensity[a]
  );
  
  // Limit to top 10 critical files
  assessment.criticalFiles = assessment.criticalFiles.slice(0, 10);
  
  // Identify high impact errors
  for (const error of result.errors) {
    if (error.severity === ErrorSeverity.Error) {
      if (error.message.includes('cannot find') ||
          error.message.includes('undefined') ||
          error.message.includes('missing') ||
          error.message.includes('required') ||
          error.message.includes('expected')) {
        assessment.highImpactErrors.push(error);
        
        // Count blockers
        if (error.message.includes('cannot find') ||
            error.message.includes('undefined') ||
            error.message.includes('missing')) {
          assessment.blockerCount++;
        }
      }
    }
  }
  
  // Limit to top 20 high impact errors
  assessment.highImpactErrors = assessment.highImpactErrors.slice(0, 20);
  
  // Estimate fix time (very rough estimate)
  // Assume: 2 min for simple errors, 5 min for normal, 15 min for complex
  let totalTime = 0;
  
  for (const error of result.errors) {
    if (error.severity === ErrorSeverity.Error) {
      if (error.category === ErrorCategory.Syntax || 
          error.category === ErrorCategory.Import) {
        totalTime += 2; // Simple errors
      } else if (error.category === ErrorCategory.Type || 
                error.category === ErrorCategory.Declaration) {
        totalTime += 5; // Normal errors
      } else {
        totalTime += 15; // Complex errors
      }
    } else {
      totalTime += 2; // Warnings and suggestions
    }
  }
  
  // Cap at 8 hours (480 minutes) to avoid unrealistic estimates
  assessment.estimatedFixTime = Math.min(totalTime, 480);
  
  return assessment;
}

/**
 * Generate a summary of the analysis
 */
function generateAnalysisSummary(
  analysis: ErrorAnalysisResult,
  result: ErrorFindingResult
): string {
  const rootCauses = analysis.rootCauses.length;
  const errorGroups = analysis.errorGroups.length;
  const blockerCount = analysis.impactAssessment.blockerCount;
  const criticalFiles = analysis.impactAssessment.criticalFiles.length;
  const estimatedFixTime = analysis.impactAssessment.estimatedFixTime;
  
  let summary = `# TypeScript Error Analysis\n\n`;
  
  summary += `Found ${result.totalErrors} errors and ${result.totalWarnings} warnings.\n`;
  summary += `Identified ${rootCauses} root causes and ${errorGroups} error groups.\n\n`;
  
  if (rootCauses > 0) {
    summary += `## Top Root Causes:\n`;
    
    for (let i = 0; i < Math.min(3, analysis.rootCauses.length); i++) {
      const cause = analysis.rootCauses[i];
      summary += `${i + 1}. ${cause.pattern} (${cause.totalErrors} errors in ${cause.affectedFiles} files)\n`;
    }
    
    summary += `\n`;
  }
  
  summary += `## Impact Assessment:\n`;
  summary += `- Blocker errors: ${blockerCount}\n`;
  summary += `- Critical files: ${criticalFiles}\n`;
  summary += `- Estimated fix time: ${Math.round(estimatedFixTime / 60 * 10) / 10} hours\n\n`;
  
  if (criticalFiles > 0) {
    summary += `## Critical Files:\n`;
    
    for (let i = 0; i < Math.min(5, analysis.impactAssessment.criticalFiles.length); i++) {
      const file = analysis.impactAssessment.criticalFiles[i];
      const errorCount = analysis.impactAssessment.errorDensity[file];
      summary += `- ${file} (${errorCount} errors)\n`;
    }
    
    summary += `\n`;
  }
  
  if (analysis.suggestedFixOrder.length > 0) {
    summary += `## Suggested First Fixes:\n`;
    
    for (let i = 0; i < Math.min(5, analysis.suggestedFixOrder.length); i++) {
      const error = analysis.suggestedFixOrder[i];
      summary += `- ${error.file}:${error.line} - ${error.code}: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}\n`;
    }
  }
  
  return summary;
}

// Export a singleton instance
export const tsErrorAnalyzer = {
  analyzeErrors: (errors: TypeScriptErrorDetail[] | ErrorFindingResult, options: ErrorAnalyzerOptions = {}) => 
    analyzeTypeScriptErrors(errors, options)
};