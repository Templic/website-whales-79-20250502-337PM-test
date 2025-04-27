/**
 * TypeScript Error Analyzer
 * 
 * This module analyzes TypeScript errors to categorize them, identify patterns,
 * and suggest fixes based on common error patterns.
 */

/**
 * Severity level of TypeScript errors
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Category of TypeScript errors
 */
export enum ErrorCategory {
  TYPE_MISMATCH = 'type_mismatch',
  SYNTAX_ERROR = 'syntax_error',
  MISSING_PROPERTY = 'missing_property',
  UNDEFINED_VARIABLE = 'undefined_variable',
  NULL_REFERENCE = 'null_reference',
  IMPORT_ERROR = 'import_error',
  CONFIGURATION_ERROR = 'configuration_error',
  DECLARATION_ERROR = 'declaration_error',
  FUNCTION_ERROR = 'function_error',
  GENERIC_ERROR = 'generic_error',
  OTHER = 'other'
}

/**
 * Detailed representation of a TypeScript error
 */
export interface TypeScriptErrorDetail {
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: string;
  snippet?: string;
  suggestedFix?: string;
  relatedErrors?: number[];
}

/**
 * Suggestion for fixing a TypeScript error
 */
export interface FixSuggestion {
  explanation: string;
  suggestedFix: string;
  relatedErrors: string[];
  impact: string;
  confidence: number;
  alternatives: string[];
}

/**
 * Result of error analysis
 */
export interface ErrorAnalysisResult {
  analyzedErrors: string[];
  fixSuggestions: Record<string, FixSuggestion>;
  aiEnabled: boolean;
  processingTimeMs: number;
  summary: string;
}

/**
 * Analyze TypeScript errors to categorize them and identify patterns
 */
export function analyzeErrors(errors: TypeScriptErrorDetail[]): ErrorAnalysisResult {
  console.log(`Analyzing ${errors.length} TypeScript errors...`);
  
  const startTime = performance.now();
  const fixSuggestions: Record<string, FixSuggestion> = {};
  
  // Group errors by category
  const errorsByCategory: Record<string, TypeScriptErrorDetail[]> = {};
  errors.forEach(error => {
    const category = error.category;
    if (!errorsByCategory[category]) {
      errorsByCategory[category] = [];
    }
    errorsByCategory[category].push(error);
  });
  
  // Process each category
  Object.entries(errorsByCategory).forEach(([category, categoryErrors]) => {
    console.log(`Processing ${categoryErrors.length} errors in category: ${category}`);
    
    // Find patterns within category
    const patterns = findErrorPatterns(categoryErrors);
    
    // Generate fix suggestions for each pattern
    patterns.forEach(pattern => {
      pattern.errors.forEach(error => {
        const errorCode = error.code;
        fixSuggestions[errorCode] = {
          explanation: pattern.explanation,
          suggestedFix: pattern.suggestedFix,
          relatedErrors: pattern.relatedErrors,
          impact: pattern.impact,
          confidence: pattern.confidence,
          alternatives: pattern.alternatives
        };
      });
    });
  });
  
  const endTime = performance.now();
  const processingTimeMs = endTime - startTime;
  
  return {
    analyzedErrors: errors.map(error => error.code),
    fixSuggestions,
    aiEnabled: false,
    processingTimeMs,
    summary: `Analyzed ${errors.length} errors in ${processingTimeMs.toFixed(2)}ms`
  };
}

/**
 * Find patterns in TypeScript errors
 */
function findErrorPatterns(errors: TypeScriptErrorDetail[]): Array<{
  pattern: string;
  explanation: string;
  suggestedFix: string;
  errors: TypeScriptErrorDetail[];
  relatedErrors: string[];
  impact: string;
  confidence: number;
  alternatives: string[];
}> {
  // This is a simplified implementation
  // In a real system, this would use more sophisticated pattern matching
  
  const patterns: Array<{
    pattern: string;
    explanation: string;
    suggestedFix: string;
    errors: TypeScriptErrorDetail[];
    relatedErrors: string[];
    impact: string;
    confidence: number;
    alternatives: string[];
  }> = [];
  
  // Example pattern: Type 'any' is not assignable to...
  const anyTypeErrors = errors.filter(error => 
    error.message.includes("Type 'any'") && 
    error.message.includes("is not assignable to")
  );
  
  if (anyTypeErrors.length > 0) {
    patterns.push({
      pattern: "Type 'any' is not assignable",
      explanation: "Using 'any' type is not compatible with more specific types. TypeScript prevents implicit assignment from 'any' to specific types for type safety.",
      suggestedFix: "Replace 'any' with a more specific type or use 'unknown' and add type guards.",
      errors: anyTypeErrors,
      relatedErrors: ["TS2322", "TS2304"],
      impact: "type safety",
      confidence: 0.9,
      alternatives: [
        "Use a specific interface or type",
        "Use type guards with 'unknown'"
      ]
    });
  }
  
  // Example pattern: Property does not exist on type
  const missingPropertyErrors = errors.filter(error => 
    error.message.includes("Property") && 
    error.message.includes("does not exist on type")
  );
  
  if (missingPropertyErrors.length > 0) {
    patterns.push({
      pattern: "Property does not exist on type",
      explanation: "Accessing a property that doesn't exist on the type definition.",
      suggestedFix: "Add the property to the interface/type or fix the property name.",
      errors: missingPropertyErrors,
      relatedErrors: ["TS2339", "TS2551"],
      impact: "runtime error",
      confidence: 0.8,
      alternatives: [
        "Use optional chaining (?.)",
        "Add a type guard",
        "Update the interface definition"
      ]
    });
  }
  
  return patterns;
}

/**
 * Categorize a TypeScript error based on its code and message
 */
export function categorizeError(code: string, message: string): ErrorCategory {
  if (message.includes("Type") && (message.includes("is not assignable") || message.includes("is not compatible"))) {
    return ErrorCategory.TYPE_MISMATCH;
  }
  
  if (message.includes("Property") && message.includes("does not exist on type")) {
    return ErrorCategory.MISSING_PROPERTY;
  }
  
  if (message.includes("Cannot find") || message.includes("not found")) {
    return ErrorCategory.UNDEFINED_VARIABLE;
  }
  
  if (message.includes("Object is possibly 'null'") || message.includes("Object is possibly 'undefined'")) {
    return ErrorCategory.NULL_REFERENCE;
  }
  
  if (message.includes("Cannot find module") || message.includes("No exported member")) {
    return ErrorCategory.IMPORT_ERROR;
  }
  
  if (message.includes("Declaration") || message.includes("declare")) {
    return ErrorCategory.DECLARATION_ERROR;
  }
  
  if (message.includes("function") || message.includes("method") || message.includes("parameter")) {
    return ErrorCategory.FUNCTION_ERROR;
  }
  
  if (message.includes("Expected") || message.includes("syntax")) {
    return ErrorCategory.SYNTAX_ERROR;
  }
  
  return ErrorCategory.OTHER;
}

/**
 * Determine the severity of a TypeScript error
 */
export function determineSeverity(code: string, message: string): ErrorSeverity {
  // Critical errors - likely to cause runtime failures
  if (
    message.includes("Object is possibly 'null'") || 
    message.includes("Object is possibly 'undefined'") ||
    message.includes("Cannot read property") ||
    message.includes("is not a function")
  ) {
    return ErrorSeverity.CRITICAL;
  }
  
  // High severity - type safety issues that could lead to bugs
  if (
    message.includes("Type") && 
    (message.includes("is not assignable") || message.includes("is not compatible"))
  ) {
    return ErrorSeverity.HIGH;
  }
  
  // Medium severity - missing declarations, imports
  if (
    message.includes("Cannot find") || 
    message.includes("not found") ||
    message.includes("No exported member")
  ) {
    return ErrorSeverity.MEDIUM;
  }
  
  // Low severity - everything else
  return ErrorSeverity.LOW;
}

/**
 * Analyze TypeScript error dependencies to find root causes
 */
export function analyzeErrorDependencies(errors: TypeScriptErrorDetail[]): {
  rootCauses: TypeScriptErrorDetail[];
  dependencyGraph: Record<string, string[]>;
} {
  const dependencyGraph: Record<string, string[]> = {};
  
  // Build a simple dependency graph based on files and line numbers
  errors.forEach(error => {
    const errorId = error.code;
    dependencyGraph[errorId] = [];
    
    // Find related errors in the same file
    const sameFileErrors = errors.filter(e => 
      e.file === error.file && 
      e.code !== error.code &&
      // Assume errors above this one might be dependencies
      e.line <= error.line
    );
    
    // Add to dependency graph
    dependencyGraph[errorId] = sameFileErrors.map(e => e.code);
  });
  
  // Find root causes (errors with no dependencies)
  const rootCauses = errors.filter(error => 
    dependencyGraph[error.code].length === 0
  );
  
  return {
    rootCauses,
    dependencyGraph
  };
}

export default {
  analyzeErrors,
  categorizeError,
  determineSeverity,
  analyzeErrorDependencies,
  ErrorCategory,
  ErrorSeverity
};