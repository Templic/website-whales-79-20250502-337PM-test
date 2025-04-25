/**
 * Advanced TypeScript Error Analyzer
 * 
 * This module provides sophisticated pattern recognition and analysis for TypeScript errors,
 * allowing for more intelligent error categorization and fixing strategies.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { 
  ErrorCategory,
  ErrorSeverity,
  categorizeError, 
  determineSeverity 
} from './ts-error-analyzer';

/**
 * Represents a TypeScript error with detailed information
 */
export interface TypeScriptError {
  filePath: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  relatedTypes: string[];
  contextCode?: string;
  fixStrategy?: FixStrategy;
  fixSuggestion?: string;
}

/**
 * Represents a file and its TypeScript errors
 */
export interface FileWithErrors {
  filePath: string;
  errors: TypeScriptError[];
  content: string;
  importStatements: string[];
  exportedTypes: string[];
  dependsOn: Set<string>;
}

/**
 * Represents different strategies for fixing TypeScript errors
 */
export type FixStrategy = 
  | 'ADD_TYPE_ANNOTATION'
  | 'CREATE_INTERFACE'
  | 'EXTEND_INTERFACE'
  | 'IMPORT_TYPE'
  | 'ADD_TYPE_GUARD'
  | 'ADD_OPTIONAL_CHAINING'
  | 'TYPE_ASSERTION'
  | 'REMOVE_UNUSED'
  | 'FIX_SYNTAX'
  | 'RENAME_SYMBOL'
  | 'OTHER';

/**
 * Represents an analysis of TypeScript errors in a project
 */
export interface TypeScriptErrorAnalysis {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, TypeScriptError[]>;
  errorsByFile: Record<string, TypeScriptError[]>;
  errorsBySeverity: Record<ErrorSeverity, TypeScriptError[]>;
  filesWithErrors: FileWithErrors[];
  dependencyGraph: Record<string, string[]>;
  errors: TypeScriptError[];
  rootCauses: TypeScriptError[];
  summary: AnalysisSummary;
}

/**
 * Summary of the error analysis
 */
export interface AnalysisSummary {
  totalErrors: number;
  criticalErrors: number;
  highSeverityErrors: number;
  mediumSeverityErrors: number;
  lowSeverityErrors: number;
  mostCommonCategory: ErrorCategory;
  mostAffectedFile: string;
  mostAffectedFileErrorCount: number;
  rootCausesCount: number;
  fixableErrorsCount: number;
  estimatedFixTimeMinutes: number;
}

/**
 * Extract a snippet of code around an error location
 */
export function extractContextCode(filePath: string, line: number, column: number): string {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Get a few lines before and after the error line for context
    const startLine = Math.max(0, line - 3);
    const endLine = Math.min(lines.length - 1, line + 3);
    
    const contextLines = [];
    for (let i = startLine; i <= endLine; i++) {
      const lineContent = lines[i] || '';
      const linePrefix = i + 1 === line ? '> ' : '  ';
      const lineNumber = `${i + 1}`.padStart(4, ' ');
      
      if (i + 1 === line) {
        // Highlight the error position with a caret
        const highlightLine = ' '.repeat(column + 7) + '^';
        contextLines.push(`${linePrefix}${lineNumber}: ${lineContent}`);
        contextLines.push(highlightLine);
      } else {
        contextLines.push(`${linePrefix}${lineNumber}: ${lineContent}`);
      }
    }
    
    return contextLines.join('\n');
  } catch (error) {
    return `Could not extract context: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Extract import statements from a file
 */
export function extractImports(fileContent: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(fileContent)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }
  
  return imports;
}

/**
 * Extract exported types from a file
 */
export function extractExportedTypes(fileContent: string): string[] {
  const exportedTypes: string[] = [];
  
  // Match export declarations like: export interface User {...}
  const exportInterfaceRegex = /export\s+(?:interface|type|class|enum)\s+(\w+)/g;
  
  let match: RegExpExecArray | null;
  while ((match = exportInterfaceRegex.exec(fileContent)) !== null) {
    if (match[1]) {
      exportedTypes.push(match[1]);
    }
  }
  
  // Match named exports like: export { User, Profile }
  const namedExportRegex = /export\s+{([^}]+)}/g;
  while ((match = namedExportRegex.exec(fileContent)) !== null) {
    if (match[1]) {
      const namedExports = match[1].split(',')
        .map(e => e.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      exportedTypes.push(...namedExports);
    }
  }
  
  return exportedTypes;
}

/**
 * Build a dependency graph of TypeScript files
 */
export function buildDependencyGraph(files: FileWithErrors[]): Record<string, string[]> {
  const dependencyGraph: Record<string, string[]> = {};
  
  for (const file of files) {
    if (!dependencyGraph[file.filePath]) {
      dependencyGraph[file.filePath] = [];
    }
    
    for (const importPath of file.importStatements) {
      // Convert relative paths to absolute
      let absolutePath = importPath;
      if (importPath.startsWith('.')) {
        const basePath = path.dirname(file.filePath);
        absolutePath = path.resolve(basePath, importPath);
      }
      
      // Add file extension if missing
      if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) {
        const withTs = `${absolutePath}.ts`;
        const withTsx = `${absolutePath}.tsx`;
        
        if (fs.existsSync(withTs)) {
          absolutePath = withTs;
        } else if (fs.existsSync(withTsx)) {
          absolutePath = withTsx;
        }
      }
      
      dependencyGraph[file.filePath].push(absolutePath);
      file.dependsOn.add(absolutePath);
    }
  }
  
  return dependencyGraph;
}

/**
 * Identify potential root causes of cascading errors
 */
export function identifyRootCauses(analysis: Omit<TypeScriptErrorAnalysis, 'rootCauses' | 'summary'>): TypeScriptError[] {
  const { filesWithErrors, dependencyGraph } = analysis;
  const rootCauses: TypeScriptError[] = [];
  
  // Build a reverse dependency graph
  const reverseDependencyGraph: Record<string, string[]> = {};
  for (const file in dependencyGraph) {
    const dependencies = dependencyGraph[file];
    for (const dependency of dependencies) {
      if (!reverseDependencyGraph[dependency]) {
        reverseDependencyGraph[dependency] = [];
      }
      reverseDependencyGraph[dependency].push(file);
    }
  }
  
  // Sort files by dependency chain length
  const sortedFiles = [...filesWithErrors].sort((a, b) => {
    const aDeps = reverseDependencyGraph[a.filePath]?.length || 0;
    const bDeps = reverseDependencyGraph[b.filePath]?.length || 0;
    return bDeps - aDeps; // Files with more dependents come first
  });
  
  // Identify errors that are likely root causes
  for (const file of sortedFiles) {
    // Look for high severity errors in files with many dependents
    const criticalErrors = file.errors.filter(error => 
      error.severity === 'critical' || error.severity === 'high'
    );
    
    // Look for type definition or export errors, which cascade down the dependency chain
    const typeErrors = file.errors.filter(error => 
      error.category === 'INTERFACE_ERROR' || 
      error.category === 'TYPE_MISMATCH' ||
      error.category === 'MISSING_PROPERTY' ||
      error.message.includes('exported')
    );
    
    const potentialRootCauses = [...new Set([...criticalErrors, ...typeErrors])];
    rootCauses.push(...potentialRootCauses);
  }
  
  // If there are too many root causes, prioritize by severity and number of dependent files
  if (rootCauses.length > 10) {
    return rootCauses
      .sort((a, b) => {
        // Sort by severity first
        const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        
        // Then by number of dependents
        const aDeps = reverseDependencyGraph[a.filePath]?.length || 0;
        const bDeps = reverseDependencyGraph[b.filePath]?.length || 0;
        return bDeps - aDeps;
      })
      .slice(0, 10);
  }
  
  return rootCauses;
}

/**
 * Suggest a fix strategy based on the error type and context
 */
export function suggestFixStrategy(error: Omit<TypeScriptError, 'fixStrategy' | 'fixSuggestion'>): { strategy: FixStrategy, suggestion: string } {
  const { category, message, relatedTypes, contextCode } = error;
  
  // Determine the most appropriate fix strategy based on error category
  switch (category) {
    case 'TYPE_MISMATCH':
      if (message.includes('null') || message.includes('undefined')) {
        return {
          strategy: 'ADD_OPTIONAL_CHAINING',
          suggestion: 'Use optional chaining or nullish coalescing to handle potential null/undefined values.'
        };
      }
      return {
        strategy: 'TYPE_ASSERTION',
        suggestion: `Add a type guard or type assertion to handle the type mismatch between ${relatedTypes.join(' and ')}.`
      };
      
    case 'MISSING_PROPERTY':
      return {
        strategy: 'EXTEND_INTERFACE',
        suggestion: `Extend the interface to include the missing property, or use optional chaining.`
      };
      
    case 'IMPLICIT_ANY':
      return {
        strategy: 'ADD_TYPE_ANNOTATION',
        suggestion: 'Add explicit type annotation to avoid implicit any type.'
      };
      
    case 'MODULE_NOT_FOUND':
      return {
        strategy: 'IMPORT_TYPE',
        suggestion: 'Ensure the module exists and is properly imported.'
      };
      
    case 'SYNTAX_ERROR':
      return {
        strategy: 'FIX_SYNTAX',
        suggestion: 'Fix the syntax error, possibly a missing closing bracket or semicolon.'
      };
      
    case 'INTERFACE_ERROR':
      return {
        strategy: 'CREATE_INTERFACE',
        suggestion: 'Define or update the interface to match the implementation.'
      };
      
    case 'TYPE_ARGUMENT':
      return {
        strategy: 'ADD_TYPE_ANNOTATION',
        suggestion: 'Add type argument to the generic type or function.'
      };
      
    case 'CIRCULAR_REFERENCE':
      return {
        strategy: 'RENAME_SYMBOL',
        suggestion: 'Break the circular reference by restructuring the type definitions.'
      };
      
    case 'UNUSED_VARIABLE':
      return {
        strategy: 'REMOVE_UNUSED',
        suggestion: 'Remove the unused variable or mark it with an underscore prefix (_variableName).'
      };
      
    case 'NULL_UNDEFINED':
      return {
        strategy: 'ADD_TYPE_GUARD',
        suggestion: 'Add a null check or use optional chaining to guard against null/undefined values.'
      };
      
    default:
      return {
        strategy: 'OTHER',
        suggestion: 'Review the error message and context to determine the appropriate fix.'
      };
  }
}

/**
 * Calculate summary statistics from analysis
 */
export function calculateSummary(analysis: Omit<TypeScriptErrorAnalysis, 'summary'>): AnalysisSummary {
  const { totalErrors, errorsByCategory, errorsBySeverity, errorsByFile, rootCauses } = analysis;
  
  // Find most common category
  let mostCommonCategory: ErrorCategory = 'OTHER';
  let maxCategoryCount = 0;
  
  for (const category in errorsByCategory) {
    const count = errorsByCategory[category as ErrorCategory]?.length || 0;
    if (count > maxCategoryCount) {
      maxCategoryCount = count;
      mostCommonCategory = category as ErrorCategory;
    }
  }
  
  // Find most affected file
  let mostAffectedFile = '';
  let mostAffectedFileErrorCount = 0;
  
  for (const file in errorsByFile) {
    const count = errorsByFile[file]?.length || 0;
    if (count > mostAffectedFileErrorCount) {
      mostAffectedFileErrorCount = count;
      mostAffectedFile = file;
    }
  }
  
  // Count fixable errors
  const fixableErrorsCount = analysis.errors.filter(error => 
    error.fixStrategy !== 'OTHER'
  ).length;
  
  // Estimate fix time (rough estimate: 2 min for low, 5 min for medium, 10 min for high, 15 min for critical)
  const timePerSeverity = {
    low: 2,
    medium: 5,
    high: 10,
    critical: 15
  };
  
  let estimatedFixTimeMinutes = 0;
  for (const severity in errorsBySeverity) {
    const count = errorsBySeverity[severity as ErrorSeverity]?.length || 0;
    estimatedFixTimeMinutes += count * timePerSeverity[severity as keyof typeof timePerSeverity];
  }
  
  return {
    totalErrors,
    criticalErrors: errorsBySeverity.critical?.length || 0,
    highSeverityErrors: errorsBySeverity.high?.length || 0,
    mediumSeverityErrors: errorsBySeverity.medium?.length || 0,
    lowSeverityErrors: errorsBySeverity.low?.length || 0,
    mostCommonCategory,
    mostAffectedFile,
    mostAffectedFileErrorCount,
    rootCausesCount: rootCauses.length,
    fixableErrorsCount,
    estimatedFixTimeMinutes
  };
}

/**
 * Run a comprehensive analysis of TypeScript errors in a project
 */
export async function analyzeTypeScriptProject(
  projectPath: string, 
  options: { 
    tsConfigPath?: string, 
    includePaths?: string[],
    excludePaths?: string[],
    maxErrors?: number
  } = {}
): Promise<TypeScriptErrorAnalysis> {
  const {
    tsConfigPath = 'tsconfig.json',
    includePaths = [],
    excludePaths = ['node_modules', 'dist', 'build'],
    maxErrors = 1000
  } = options;
  
  console.log('Running TypeScript compiler to detect errors...');
  
  // Run TypeScript compiler to get errors
  let tscOutput = '';
  try {
    const tsConfigOption = tsConfigPath ? `--project ${tsConfigPath}` : '';
    tscOutput = execSync(`npx tsc ${tsConfigOption} --noEmit`, { stdio: 'pipe' }).toString();
  } catch (error: any) {
    tscOutput = error.stdout?.toString() || error.stderr?.toString() || '';
  }
  
  console.log('Parsing compiler output and collecting errors...');
  
  // Parse errors into structured format
  const errors: TypeScriptError[] = [];
  const lines = tscOutput.split('\n');
  
  for (const line of lines) {
    const fileMatch = line.match(/^([^(]+)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
    if (fileMatch) {
      const [_, filePath, lineNum, colNum, errorCode, message] = fileMatch;
      
      // Convert to absolute path if not already
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectPath, filePath.trim());
      
      // Skip excluded paths
      const isExcluded = excludePaths.some(excludePath => absolutePath.includes(excludePath));
      if (isExcluded) continue;
      
      // Only include specific paths if provided
      if (includePaths.length > 0) {
        const isIncluded = includePaths.some(includePath => absolutePath.includes(includePath));
        if (!isIncluded) continue;
      }
      
      const category = categorizeError(message);
      const severity = determineSeverity(category, message);
      const relatedTypes = extractRelatedTypes(message);
      const contextCode = extractContextCode(absolutePath, parseInt(lineNum), parseInt(colNum));
      
      errors.push({
        filePath: absolutePath,
        line: parseInt(lineNum),
        column: parseInt(colNum),
        code: `TS${errorCode}`,
        message: message.trim(),
        category,
        severity,
        relatedTypes,
        contextCode
      });
      
      // Limit the number of errors to process
      if (errors.length >= maxErrors) {
        console.log(`Reached maximum limit of ${maxErrors} errors. Stopping collection.`);
        break;
      }
    }
  }
  
  console.log(`Collected ${errors.length} TypeScript errors for analysis.`);
  
  // Group errors by various criteria
  const errorsByCategory: Record<ErrorCategory, TypeScriptError[]> = {} as Record<ErrorCategory, TypeScriptError[]>;
  const errorsBySeverity: Record<ErrorSeverity, TypeScriptError[]> = {} as Record<ErrorSeverity, TypeScriptError[]>;
  const errorsByFile: Record<string, TypeScriptError[]> = {};
  
  // Initialize categories and severities
  const allCategories: ErrorCategory[] = [
    'TYPE_MISMATCH', 'MISSING_PROPERTY', 'IMPLICIT_ANY', 'UNUSED_VARIABLE',
    'NULL_UNDEFINED', 'MODULE_NOT_FOUND', 'SYNTAX_ERROR', 'INTERFACE_ERROR',
    'TYPE_ARGUMENT', 'CIRCULAR_REFERENCE', 'OTHER'
  ];
  
  const allSeverities: ErrorSeverity[] = ['critical', 'high', 'medium', 'low'];
  
  allCategories.forEach(category => {
    errorsByCategory[category] = [];
  });
  
  allSeverities.forEach(severity => {
    errorsBySeverity[severity] = [];
  });
  
  // Group errors
  for (const error of errors) {
    // Group by category
    errorsByCategory[error.category].push(error);
    
    // Group by severity
    errorsBySeverity[error.severity].push(error);
    
    // Group by file
    if (!errorsByFile[error.filePath]) {
      errorsByFile[error.filePath] = [];
    }
    errorsByFile[error.filePath].push(error);
  }
  
  console.log('Building file dependency graph and context information...');
  
  // Create file objects with content and dependencies
  const filesWithErrors: FileWithErrors[] = [];
  
  for (const filePath in errorsByFile) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const importStatements = extractImports(content);
        const exportedTypes = extractExportedTypes(content);
        
        filesWithErrors.push({
          filePath,
          errors: errorsByFile[filePath],
          content,
          importStatements,
          exportedTypes,
          dependsOn: new Set<string>()
        });
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
  }
  
  console.log('Building dependency graph...');
  
  // Build dependency graph
  const dependencyGraph = buildDependencyGraph(filesWithErrors);
  
  // Prepare the analysis object
  const partialAnalysis = {
    totalErrors: errors.length,
    errorsByCategory,
    errorsByFile,
    errorsBySeverity,
    filesWithErrors,
    dependencyGraph,
    errors,
  };
  
  console.log('Identifying root causes...');
  
  // Identify root causes
  const rootCauses = identifyRootCauses(partialAnalysis);
  
  console.log('Suggesting fix strategies...');
  
  // Suggest fix strategies for each error
  const errorsWithFixStrategies = errors.map(error => {
    const { strategy, suggestion } = suggestFixStrategy(error);
    return {
      ...error,
      fixStrategy: strategy,
      fixSuggestion: suggestion
    };
  });
  
  // Calculate summary statistics
  const analysisWithRootCauses = {
    ...partialAnalysis,
    errors: errorsWithFixStrategies,
    rootCauses
  };
  
  console.log('Calculating summary statistics...');
  
  const summary = calculateSummary(analysisWithRootCauses);
  
  console.log('TypeScript error analysis complete!');
  
  const finalAnalysis: TypeScriptErrorAnalysis = {
    ...analysisWithRootCauses,
    summary
  };
  
  return finalAnalysis;
}

/**
 * Generate a detailed report from the error analysis
 */
export function generateErrorReport(analysis: TypeScriptErrorAnalysis): string {
  const { summary, rootCauses, errorsByCategory, errorsBySeverity } = analysis;
  
  // Create a nicely formatted report
  let report = `# TypeScript Error Analysis Report\n\n`;
  
  // Add summary section
  report += `## Summary\n\n`;
  report += `- **Total Errors**: ${summary.totalErrors}\n`;
  report += `- **Critical Errors**: ${summary.criticalErrors}\n`;
  report += `- **High Severity Errors**: ${summary.highSeverityErrors}\n`;
  report += `- **Medium Severity Errors**: ${summary.mediumSeverityErrors}\n`;
  report += `- **Low Severity Errors**: ${summary.lowSeverityErrors}\n`;
  report += `- **Most Common Error Type**: ${summary.mostCommonCategory}\n`;
  report += `- **Most Affected File**: ${summary.mostAffectedFile} (${summary.mostAffectedFileErrorCount} errors)\n`;
  report += `- **Identified Root Causes**: ${summary.rootCausesCount}\n`;
  report += `- **Automatically Fixable Errors**: ${summary.fixableErrorsCount} (${Math.round(summary.fixableErrorsCount / summary.totalErrors * 100)}%)\n`;
  report += `- **Estimated Fix Time**: ${Math.round(summary.estimatedFixTimeMinutes / 60)} hours ${summary.estimatedFixTimeMinutes % 60} minutes\n\n`;
  
  // Add root causes section
  report += `## Root Causes\n\n`;
  report += `These errors are likely causing cascading issues throughout the codebase:\n\n`;
  
  rootCauses.forEach((error, index) => {
    report += `### ${index + 1}. ${error.code}: ${error.message}\n\n`;
    report += `- **File**: ${path.relative(process.cwd(), error.filePath)}\n`;
    report += `- **Location**: Line ${error.line}, Column ${error.column}\n`;
    report += `- **Severity**: ${error.severity}\n`;
    report += `- **Category**: ${error.category}\n`;
    report += `- **Fix Strategy**: ${error.fixStrategy}\n`;
    report += `- **Suggestion**: ${error.fixSuggestion}\n\n`;
    report += `\`\`\`typescript\n${error.contextCode}\n\`\`\`\n\n`;
  });
  
  // Add errors by category
  report += `## Errors by Category\n\n`;
  
  for (const category in errorsByCategory) {
    const errors = errorsByCategory[category as ErrorCategory];
    if (errors.length > 0) {
      report += `### ${category} (${errors.length})\n\n`;
      
      // Just list the top 5 errors of this category
      const topErrors = errors.slice(0, 5);
      topErrors.forEach((error, index) => {
        report += `${index + 1}. **${error.code}**: ${error.message} - ${path.relative(process.cwd(), error.filePath)}:${error.line}\n`;
      });
      
      if (errors.length > 5) {
        report += `... and ${errors.length - 5} more\n`;
      }
      
      report += `\n`;
    }
  }
  
  // Add errors by severity
  report += `## Errors by Severity\n\n`;
  
  // Order by severity: critical, high, medium, low
  const severityOrder: ErrorSeverity[] = ['critical', 'high', 'medium', 'low'];
  
  for (const severity of severityOrder) {
    const errors = errorsBySeverity[severity];
    if (errors && errors.length > 0) {
      report += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${errors.length})\n\n`;
      
      // Just list the top 5 errors of this severity
      const topErrors = errors.slice(0, 5);
      topErrors.forEach((error, index) => {
        report += `${index + 1}. **${error.code}**: ${error.message} - ${path.relative(process.cwd(), error.filePath)}:${error.line}\n`;
      });
      
      if (errors.length > 5) {
        report += `... and ${errors.length - 5} more\n`;
      }
      
      report += `\n`;
    }
  }
  
  // Add execution information
  report += `## Report Information\n\n`;
  report += `- **Generated**: ${new Date().toISOString()}\n`;
  report += `- **TypeScript Version**: ${execSync('npx tsc --version').toString().trim()}\n`;
  
  return report;
}

/**
 * Save the error analysis to a file
 */
export function saveAnalysisToFile(analysis: TypeScriptErrorAnalysis, outputPath: string): void {
  const report = generateErrorReport(analysis);
  fs.writeFileSync(outputPath, report);
  console.log(`Error analysis report saved to ${outputPath}`);
  
  // Also save the raw analysis data for potential further processing
  const jsonOutputPath = outputPath.replace(/\.\w+$/, '.json');
  
  // Convert Sets to Arrays for JSON serialization
  const jsonSafeAnalysis = JSON.stringify(analysis, (key, value) => {
    if (value instanceof Set) {
      return Array.from(value);
    }
    return value;
  }, 2);
  
  fs.writeFileSync(jsonOutputPath, jsonSafeAnalysis);
  console.log(`Raw analysis data saved to ${jsonOutputPath}`);
}

/**
 * Main function to analyze a TypeScript project and generate a report
 */
export async function analyzeAndReportTypeScriptErrors(
  projectPath: string,
  options: {
    outputPath?: string,
    tsConfigPath?: string,
    includePaths?: string[],
    excludePaths?: string[],
    maxErrors?: number
  } = {}
): Promise<void> {
  const {
    outputPath = 'typescript-error-analysis.md',
    tsConfigPath,
    includePaths,
    excludePaths,
    maxErrors
  } = options;
  
  console.log('Starting TypeScript error analysis...');
  
  const analysis = await analyzeTypeScriptProject(projectPath, {
    tsConfigPath,
    includePaths,
    excludePaths,
    maxErrors
  });
  
  console.log('Generating error report...');
  
  saveAnalysisToFile(analysis, outputPath);
  
  console.log('Analysis complete!');
  console.log(`Found ${analysis.totalErrors} errors, ${analysis.summary.rootCausesCount} root causes identified.`);
  console.log(`Report saved to ${outputPath}`);
}

// Export all utility functions for use in other modules
export {
  categorizeError,
  determineSeverity,
  extractRelatedTypes
} from './ts-error-analyzer';