/**
 * TypeScript Error Analyzer
 * 
 * A utility for analyzing TypeScript errors for patterns and relationships.
 * Part of the TypeScript error management system (Analysis phase).
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptErrorDetail, ErrorCategory, ErrorSeverity } from './ts-error-finder';

/**
 * Options for error analysis
 */
export interface ErrorAnalysisOptions {
  // Pattern detection options
  detectPatterns?: boolean;
  patternThreshold?: number;
  
  // Context options
  includeFileContext?: boolean;
  contextLines?: number;
  
  // Error relationship options
  findRelatedErrors?: boolean;
  maxRelatedErrors?: number;
  similarityThreshold?: number;
  
  // Code quality options
  suggestImprovements?: boolean;
  
  // Processing options
  verbose?: boolean;
}

/**
 * Pattern information
 */
export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  regex: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  occurrence: number;
  files: string[];
  exampleErrors: TypeScriptErrorDetail[];
  suggestedFix?: string;
  isAutoFixable: boolean;
}

/**
 * Detailed error analysis
 */
export interface ErrorAnalysisDetail {
  error: TypeScriptErrorDetail;
  context?: string;
  relatedErrors?: TypeScriptErrorDetail[];
  matchedPatterns?: ErrorPattern[];
  impact?: {
    criticalPaths: boolean;
    userFacing: boolean;
    securityImpact: boolean;
    dataHandling: boolean;
    complexity: 'low' | 'medium' | 'high';
  };
  fixPriority: 'low' | 'medium' | 'high' | 'critical';
  suggestedApproach?: string;
}

/**
 * Full analysis result
 */
export interface ErrorAnalysisResult {
  errors: ErrorAnalysisDetail[];
  patterns: ErrorPattern[];
  summary: {
    totalErrors: number;
    patternCount: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    highestImpactFiles: string[];
    recommendedFixOrder: TypeScriptErrorDetail[];
  };
}

// Default options for error analysis
const defaultOptions: ErrorAnalysisOptions = {
  detectPatterns: true,
  patternThreshold: 3,
  includeFileContext: true,
  contextLines: 5,
  findRelatedErrors: true,
  maxRelatedErrors: 5,
  similarityThreshold: 0.7,
  suggestImprovements: true,
  verbose: false
};

/**
 * Main function to analyze TypeScript errors
 */
export async function analyzeTypeScriptErrors(
  errors: TypeScriptErrorDetail[],
  options: ErrorAnalysisOptions = {}
): Promise<ErrorAnalysisResult> {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Initialize result
  const result: ErrorAnalysisResult = {
    errors: [],
    patterns: [],
    summary: {
      totalErrors: errors.length,
      patternCount: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      highestImpactFiles: [],
      recommendedFixOrder: []
    }
  };
  
  // Count errors by category and severity
  for (const error of errors) {
    result.summary.errorsByCategory[error.category] = 
      (result.summary.errorsByCategory[error.category] || 0) + 1;
    
    result.summary.errorsBySeverity[error.severity] = 
      (result.summary.errorsBySeverity[error.severity] || 0) + 1;
  }
  
  // Analyze file impact
  const fileImpact: Record<string, number> = {};
  for (const error of errors) {
    fileImpact[error.file] = (fileImpact[error.file] || 0) + getSeverityWeight(error.severity);
  }
  
  // Find highest impact files
  const fileImpactEntries = Object.entries(fileImpact);
  fileImpactEntries.sort((a, b) => b[1] - a[1]);
  result.summary.highestImpactFiles = fileImpactEntries
    .slice(0, 5)
    .map(([file]) => file);
  
  // Detect error patterns if enabled
  if (mergedOptions.detectPatterns) {
    result.patterns = detectErrorPatterns(errors, mergedOptions.patternThreshold || 3);
    result.summary.patternCount = result.patterns.length;
  }
  
  // Analyze each error in detail
  for (const error of errors) {
    const analysisDetail: ErrorAnalysisDetail = {
      error,
      fixPriority: 'medium'
    };
    
    // Get file context if enabled
    if (mergedOptions.includeFileContext) {
      analysisDetail.context = getFileContext(
        error.file, 
        error.line, 
        mergedOptions.contextLines || 5
      );
    }
    
    // Find related errors if enabled
    if (mergedOptions.findRelatedErrors) {
      analysisDetail.relatedErrors = findRelatedErrors(
        error, 
        errors, 
        mergedOptions.maxRelatedErrors || 5, 
        mergedOptions.similarityThreshold || 0.7
      );
    }
    
    // Match error to patterns
    if (result.patterns.length > 0) {
      analysisDetail.matchedPatterns = result.patterns.filter(pattern => 
        new RegExp(pattern.regex).test(error.message)
      );
    }
    
    // Determine error impact
    analysisDetail.impact = determineErrorImpact(error);
    
    // Determine fix priority
    analysisDetail.fixPriority = determineFixPriority(
      error, 
      analysisDetail.impact, 
      fileImpact[error.file] || 0
    );
    
    // Suggest an approach for fixing
    if (mergedOptions.suggestImprovements) {
      analysisDetail.suggestedApproach = suggestFixApproach(error, analysisDetail);
    }
    
    result.errors.push(analysisDetail);
  }
  
  // Determine recommended fix order
  result.summary.recommendedFixOrder = [...errors].sort((a, b) => {
    const aAnalysis = result.errors.find(e => 
      e.error.file === a.file && e.error.line === a.line
    );
    const bAnalysis = result.errors.find(e => 
      e.error.file === b.file && e.error.line === b.line
    );
    
    const aPriority = priorityWeight(aAnalysis?.fixPriority || 'medium');
    const bPriority = priorityWeight(bAnalysis?.fixPriority || 'medium');
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    // If same priority, sort by impact then severity
    const aImpact = fileImpact[a.file] || 0;
    const bImpact = fileImpact[b.file] || 0;
    
    if (aImpact !== bImpact) {
      return bImpact - aImpact; // Higher impact first
    }
    
    return getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
  });
  
  return result;
}

/**
 * Get context lines from a file
 */
function getFileContext(filePath: string, lineNumber: number, contextLines: number): string {
  try {
    if (!fs.existsSync(filePath)) {
      return `[File not found: ${filePath}]`;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length - 1, lineNumber + contextLines - 1);
    
    let context = '';
    for (let i = startLine; i <= endLine; i++) {
      const prefix = i === lineNumber - 1 ? '> ' : '  ';
      context += `${prefix}${i + 1}: ${lines[i]}\n`;
    }
    
    return context;
  } catch (error) {
    return `[Error reading file: ${error.message || 'Unknown error'}]`;
  }
}

/**
 * Find errors related to the given error
 */
function findRelatedErrors(
  error: TypeScriptErrorDetail,
  allErrors: TypeScriptErrorDetail[],
  maxRelated: number,
  threshold: number
): TypeScriptErrorDetail[] {
  // Calculate similarity scores
  const similarities: Array<{ error: TypeScriptErrorDetail; score: number }> = [];
  
  for (const otherError of allErrors) {
    // Skip comparing to self
    if (
      otherError.file === error.file &&
      otherError.line === error.line &&
      otherError.column === error.column
    ) {
      continue;
    }
    
    // Calculate similarity score
    const score = calculateErrorSimilarity(error, otherError);
    
    if (score >= threshold) {
      similarities.push({ error: otherError, score });
    }
  }
  
  // Sort by similarity score
  similarities.sort((a, b) => b.score - a.score);
  
  // Return top N related errors
  return similarities.slice(0, maxRelated).map(s => s.error);
}

/**
 * Calculate similarity between two errors
 */
function calculateErrorSimilarity(a: TypeScriptErrorDetail, b: TypeScriptErrorDetail): number {
  let score = 0;
  
  // Same error code is a strong signal
  if (a.code === b.code) {
    score += 0.4;
  }
  
  // Same category is a moderate signal
  if (a.category === b.category) {
    score += 0.2;
  }
  
  // Same file is a weak signal
  if (a.file === b.file) {
    score += 0.1;
  }
  
  // Message similarity
  const messageSimilarity = calculateTextSimilarity(a.message, b.message);
  score += messageSimilarity * 0.3;
  
  return Math.min(1, score);
}

/**
 * Calculate text similarity (very simple implementation)
 */
function calculateTextSimilarity(a: string, b: string): number {
  // Normalize strings
  const normA = a.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const normB = b.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Get words
  const wordsA = normA.split(' ');
  const wordsB = normB.split(' ');
  
  // Count common words
  const commonWords = wordsA.filter(word => wordsB.includes(word));
  
  // Calculate Jaccard similarity
  const union = new Set([...wordsA, ...wordsB]);
  return commonWords.length / union.size;
}

/**
 * Detect common error patterns
 */
function detectErrorPatterns(
  errors: TypeScriptErrorDetail[],
  threshold: number
): ErrorPattern[] {
  // Count error messages and group by similarity
  const messageGroups: Record<string, TypeScriptErrorDetail[]> = {};
  
  for (const error of errors) {
    // Generate a normalized key for the error message
    const key = normalizeErrorMessage(error.message, error.code);
    
    if (!messageGroups[key]) {
      messageGroups[key] = [];
    }
    
    messageGroups[key].push(error);
  }
  
  // Keep only groups that meet the threshold
  const patterns: ErrorPattern[] = [];
  let patternId = 1;
  
  for (const [key, errorGroup] of Object.entries(messageGroups)) {
    if (errorGroup.length >= threshold) {
      // Create a pattern for this group
      const firstError = errorGroup[0];
      
      // Get unique files containing this pattern
      const files = [...new Set(errorGroup.map(error => error.file))];
      
      // Create a regex from the normalized message
      const regex = createPatternRegex(key, firstError.code);
      
      // Take a few example errors (up to 3)
      const examples = errorGroup.slice(0, 3);
      
      // Determine if the pattern is auto-fixable
      const isAutoFixable = determineIfAutoFixable(firstError.code, firstError.message);
      
      patterns.push({
        id: `PATTERN-${patternId++}`,
        name: generatePatternName(key, firstError.category),
        description: generatePatternDescription(firstError, errorGroup.length),
        regex,
        category: firstError.category,
        severity: firstError.severity,
        occurrence: errorGroup.length,
        files,
        exampleErrors: examples,
        suggestedFix: firstError.suggestedFix,
        isAutoFixable
      });
    }
  }
  
  return patterns.sort((a, b) => b.occurrence - a.occurrence);
}

/**
 * Normalize error message for pattern detection
 */
function normalizeErrorMessage(message: string, code: string): string {
  // Remove variable parts
  let normalized = message
    .replace(/['"]\w+['"]/g, 'IDENTIFIER')  // Replace quoted identifiers
    .replace(/\b\d+\b/g, 'NUMBER')          // Replace numbers
    .replace(/\b(\/[^\s]+)\b/g, 'PATH');    // Replace paths
  
  // Handle specific error codes differently
  if (code.startsWith('TS2')) {
    // Type errors - keep more structure
    normalized = normalized
      .replace(/Type '[^']+'/g, "Type 'TYPE'")
      .replace(/type '[^']+'/g, "type 'TYPE'");
  }
  
  return normalized.trim();
}

/**
 * Create a pattern regex from a normalized message
 */
function createPatternRegex(normalizedMessage: string, code: string): string {
  // Escape regex special characters
  let regex = normalizedMessage
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/IDENTIFIER/g, '[\'"][\\w-]+[\'"]')
    .replace(/NUMBER/g, '\\d+')
    .replace(/PATH/g, '(?:\\/[\\w\\.-]+)+')
    .replace(/TYPE/g, '[\\w\\.<>\\[\\]\\(\\),\\s\\|]+');
  
  return `^${regex}$`;
}

/**
 * Generate a name for the error pattern
 */
function generatePatternName(normalizedMessage: string, category: ErrorCategory): string {
  // Create a short name based on category and key parts of the message
  const key = normalizedMessage.slice(0, 40).trim();
  const words = key.split(' ').slice(0, 6).join(' ');
  return `${category}: ${words}...`;
}

/**
 * Generate a description for the error pattern
 */
function generatePatternDescription(
  error: TypeScriptErrorDetail,
  count: number
): string {
  return `This pattern appears ${count} times across the codebase. It's a ${error.severity.toLowerCase()} severity ${error.category.toLowerCase()} issue. The error is: ${error.message}`;
}

/**
 * Determine if an error is likely auto-fixable
 */
function determineIfAutoFixable(code: string, message: string): boolean {
  // Simple check for auto-fixable errors
  const simpleFixes = [
    // Missing semicolons, parentheses, brackets
    message.includes('Expected'),
    message.includes('Missing'),
    
    // Import errors that can be auto-fixed
    code === 'TS2307' && message.includes('Cannot find module'),
    
    // Unused variables
    code === 'TS6133' && message.includes('is declared but its value is never read'),
    
    // Missing properties in object literals
    code === 'TS2739' && message.includes('Missing required properties'),
    
    // Type assertion errors that can be corrected
    code === 'TS2352' && message.includes('Type')
  ];
  
  return simpleFixes.some(Boolean);
}

/**
 * Determine the impact of an error
 */
function determineErrorImpact(error: TypeScriptErrorDetail): ErrorAnalysisDetail['impact'] {
  // Analyze the file path to determine if it's a critical path
  const isCriticalPath = 
    error.file.includes('/server/') ||
    error.file.includes('/core/') ||
    error.file.includes('/shared/') ||
    error.file.includes('/api/') ||
    error.file.includes('/auth/') ||
    error.file.includes('/security/');
  
  // Analyze if the error might affect user-facing components
  const isUserFacing = 
    error.file.includes('/components/') ||
    error.file.includes('/pages/') ||
    error.file.includes('/views/') ||
    error.file.includes('/ui/');
  
  // Analyze if the error might have security implications
  const hasSecurityImpact = 
    error.file.includes('/auth/') ||
    error.file.includes('/security/') ||
    error.message.toLowerCase().includes('null') ||
    error.message.toLowerCase().includes('undefined') ||
    error.category === ErrorCategory.TYPE_MISMATCH;
  
  // Analyze if the error is in code that handles data
  const involvesDataHandling = 
    error.file.includes('/data/') ||
    error.file.includes('/models/') ||
    error.file.includes('/schema/') ||
    error.file.includes('/store/') ||
    error.file.includes('/storage/') ||
    error.file.includes('/db/');
  
  // Determine complexity based on error type and location
  let complexity: 'low' | 'medium' | 'high' = 'medium';
  
  if (
    error.severity === ErrorSeverity.CRITICAL ||
    (error.severity === ErrorSeverity.HIGH && hasSecurityImpact)
  ) {
    complexity = 'high';
  } else if (
    error.severity === ErrorSeverity.LOW &&
    error.category !== ErrorCategory.TYPE_MISMATCH
  ) {
    complexity = 'low';
  }
  
  return {
    criticalPaths: isCriticalPath,
    userFacing: isUserFacing,
    securityImpact: hasSecurityImpact,
    dataHandling: involvesDataHandling,
    complexity
  };
}

/**
 * Determine the priority for fixing an error
 */
function determineFixPriority(
  error: TypeScriptErrorDetail,
  impact: ErrorAnalysisDetail['impact'],
  fileImpact: number
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical priority errors
  if (
    error.severity === ErrorSeverity.CRITICAL ||
    (impact.securityImpact && impact.criticalPaths) ||
    (error.severity === ErrorSeverity.HIGH && impact.dataHandling && impact.criticalPaths)
  ) {
    return 'critical';
  }
  
  // High priority errors
  if (
    error.severity === ErrorSeverity.HIGH ||
    (error.severity === ErrorSeverity.MEDIUM && impact.userFacing) ||
    (impact.criticalPaths && fileImpact > 10) ||
    (impact.complexity === 'high')
  ) {
    return 'high';
  }
  
  // Low priority errors
  if (
    error.severity === ErrorSeverity.LOW &&
    !impact.criticalPaths &&
    !impact.userFacing &&
    !impact.securityImpact &&
    !impact.dataHandling
  ) {
    return 'low';
  }
  
  // Default to medium priority
  return 'medium';
}

/**
 * Suggest an approach for fixing the error
 */
function suggestFixApproach(
  error: TypeScriptErrorDetail,
  analysis: ErrorAnalysisDetail
): string {
  // Different suggestions based on error category
  switch (error.category) {
    case ErrorCategory.TYPE_MISMATCH:
      return "Examine the type definitions and ensure they match. Consider using type assertions or modifying function parameters to match expected types.";
    
    case ErrorCategory.SYNTAX_ERROR:
      return "Fix the syntax error by carefully examining the code against TypeScript syntax rules. Check for missing or misplaced brackets, parentheses, or semicolons.";
    
    case ErrorCategory.MODULE_RESOLUTION:
      return "Ensure the module path is correct and the module is installed. Check import statements and tsconfig.json configuration for proper path resolution.";
    
    case ErrorCategory.IMPORT_ERROR:
      return "Verify that the import statement matches the export from the module. Check for case sensitivity and ensure the export actually exists in the imported file.";
    
    case ErrorCategory.PROPERTY_ERROR:
      return "Check the object type definition to ensure the property exists. You may need to update the interface or type definition, or use optional chaining (?) for potentially undefined properties.";
    
    case ErrorCategory.REACT_ERROR:
      return "Review the React component props and ensure all required props are provided. Check JSX syntax and component usage against React guidelines.";
    
    case ErrorCategory.HOOK_ERROR:
      return "Ensure hooks are called at the top level of your component and follow React's rules of hooks. Check the order and conditions around hook calls.";
    
    default:
      // Consider the matched patterns if available
      if (analysis.matchedPatterns && analysis.matchedPatterns.length > 0) {
        return analysis.matchedPatterns[0].suggestedFix || 
          "Use the suggested fix for this common error pattern.";
      }
      
      return error.suggestedFix || 
        "Review the error message carefully and address the specific issue mentioned.";
  }
}

/**
 * Convert severity to numeric weight
 */
function getSeverityWeight(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.CRITICAL: return 4;
    case ErrorSeverity.HIGH: return 3;
    case ErrorSeverity.MEDIUM: return 2;
    case ErrorSeverity.LOW: return 1;
    default: return 0;
  }
}

/**
 * Convert priority to numeric weight
 */
function priorityWeight(priority: 'low' | 'medium' | 'high' | 'critical'): number {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}