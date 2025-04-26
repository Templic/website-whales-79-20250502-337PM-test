#!/usr/bin/env node
/**
 * TypeScript Intelligent Error Fixer
 * 
 * A comprehensive command-line tool that combines error analysis and automated fixing
 * to address TypeScript errors in a project. This tool uses semantic understanding
 * of TypeScript errors to apply targeted fixes that preserve code behavior.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

// Error categories for better organization
enum ErrorCategory {
  TypeMismatch = 'type_mismatch',
  MissingType = 'missing_type',
  ImportError = 'import_error',
  NullReference = 'null_reference',
  InterfaceMismatch = 'interface_mismatch',
  GenericConstraint = 'generic_constraint',
  DeclarationError = 'declaration_error',
  SyntaxError = 'syntax_error',
  Other = 'other'
}

// Error severity levels
enum ErrorSeverity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

// Error status tracking
enum ErrorStatus {
  Detected = 'detected',
  InProgress = 'in_progress',
  Fixed = 'fixed',
  Ignored = 'ignored',
  FalsePositive = 'false_positive'
}

// Fix methods
enum FixMethod {
  Manual = 'manual',
  Automated = 'automated',
  AIAssisted = 'ai_assisted',
  PatternBased = 'pattern_based'
}

// Interface for TypeScript errors
interface TypeScriptError {
  id?: number;
  errorCode: string;
  errorMessage: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  errorContext?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  status: ErrorStatus;
  occurrenceCount: number;
  detectedAt: Date;
  fixedAt?: Date;
  metadata?: any;
}

// Interface for error patterns
interface ErrorPattern {
  id?: number;
  name: string;
  description: string;
  regex?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  detectionRules?: any;
  autoFixable: boolean;
  fixCount: number;
  successRate: number;
}

// Interface for error fixes
interface ErrorFix {
  id?: number;
  patternId?: number;
  errorId?: number;
  fixTitle: string;
  fixDescription: string;
  fixType: string;
  fixTemplate?: string;
  fixCode?: string;
  beforeCode?: string;
  afterCode?: string;
  appliedCount: number;
  successCount: number;
  aiGenerated: boolean;
}

// Analysis results interface
interface AnalysisResults {
  totalErrors: number;
  errorsByFile: Record<string, TypeScriptError[]>;
  errorsBySeverity: Record<ErrorSeverity, TypeScriptError[]>;
  errorsByCategory: Record<ErrorCategory, TypeScriptError[]>;
  patterns: ErrorPattern[];
  fixPriorities: Array<{
    errorId: number;
    filePath: string;
    lineNumber: number;
    priority: number;
    reason: string;
  }>;
}

/**
 * Find the TypeScript configuration file
 */
function findTsConfig(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;
  
  // Traverse up to 5 levels up to find tsconfig.json
  for (let i = 0; i < 5; i++) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');
    
    if (fs.existsSync(tsConfigPath)) {
      return tsConfigPath;
    }
    
    const parentDir = path.dirname(currentDir);
    
    // Stop if we've reached the root
    if (parentDir === currentDir) {
      break;
    }
    
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * Parse the TypeScript configuration file
 */
function parseTsConfig(tsConfigPath: string): ts.ParsedCommandLine {
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  
  if (configFile.error) {
    throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
  }
  
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  
  if (parsedConfig.errors.length > 0) {
    throw new Error(`Error parsing tsconfig.json: ${parsedConfig.errors[0].messageText}`);
  }
  
  return parsedConfig;
}

/**
 * Create a TypeScript program from a configuration
 */
function createProgram(parsedConfig: ts.ParsedCommandLine): ts.Program {
  return ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
    projectReferences: parsedConfig.projectReferences
  });
}

/**
 * Get diagnostic messages from a TypeScript program
 */
function getDiagnostics(program: ts.Program): ts.Diagnostic[] {
  const diagnostics: ts.Diagnostic[] = [];
  
  // Get syntactic diagnostics
  diagnostics.push(...program.getSyntacticDiagnostics());
  
  // Get semantic diagnostics
  diagnostics.push(...program.getSemanticDiagnostics());
  
  // Get declaration diagnostics
  diagnostics.push(...program.getDeclarationDiagnostics());
  
  // Get global diagnostics
  diagnostics.push(...program.getGlobalDiagnostics());
  
  // Get configFile diagnostics
  const configFileParsingDiagnostics = program.getConfigFileParsingDiagnostics();
  diagnostics.push(...configFileParsingDiagnostics);
  
  return diagnostics;
}

/**
 * Analyze a TypeScript project and find errors
 */
function analyzeProject(projectPath: string = process.cwd()): AnalysisResults {
  console.log(chalk.blue('Analyzing TypeScript project...'));
  
  // Find tsconfig.json
  const tsConfigPath = findTsConfig(projectPath);
  
  if (!tsConfigPath) {
    throw new Error('Could not find tsconfig.json');
  }
  
  console.log(chalk.green(`Found tsconfig.json: ${tsConfigPath}`));
  
  // Parse the TypeScript configuration
  const parsedConfig = parseTsConfig(tsConfigPath);
  
  // Create the TypeScript program
  const program = createProgram(parsedConfig);
  
  // Get diagnostic messages
  const diagnostics = getDiagnostics(program);
  
  // Convert diagnostics to TypeScriptError objects
  const errors: TypeScriptError[] = [];
  
  for (const diagnostic of diagnostics) {
    if (!diagnostic.file) {
      // Skip diagnostics without a file location
      continue;
    }
    
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    const errorMessage = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const lineNumber = line + 1; // Convert to 1-based index
    const columnNumber = character + 1; // Convert to 1-based index
    const filePath = diagnostic.file.fileName;
    
    // Get error context (the line of code with the error)
    const lineStart = diagnostic.file.getPositionOfLineAndCharacter(line, 0);
    const nextLineStart = diagnostic.file.getPositionOfLineAndCharacter(line + 1, 0);
    const errorContext = diagnostic.file.text.substring(lineStart, nextLineStart).trim();
    
    // Determine error category based on message patterns
    let category = ErrorCategory.Other;
    let severity = ErrorSeverity.Medium;
    
    if (errorMessage.includes('Type') && (errorMessage.includes('is not assignable') || errorMessage.includes('is not compatible'))) {
      category = ErrorCategory.TypeMismatch;
      severity = ErrorSeverity.High;
    } else if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot find name')) {
      category = ErrorCategory.ImportError;
      severity = ErrorSeverity.Critical;
    } else if (errorMessage.includes('is possibly undefined') || errorMessage.includes('is possibly null')) {
      category = ErrorCategory.NullReference;
      severity = ErrorSeverity.Medium;
    } else if (errorMessage.includes('Property') && errorMessage.includes('does not exist on type')) {
      category = ErrorCategory.InterfaceMismatch;
      severity = ErrorSeverity.High;
    } else if (errorMessage.includes('Generic')) {
      category = ErrorCategory.GenericConstraint;
      severity = ErrorSeverity.Medium;
    } else if (errorMessage.includes('Declaration') || errorMessage.includes('already declared')) {
      category = ErrorCategory.DeclarationError;
      severity = ErrorSeverity.High;
    } else if (diagnostic.category === ts.DiagnosticCategory.Syntax) {
      category = ErrorCategory.SyntaxError;
      severity = ErrorSeverity.Critical;
    } else if (errorMessage.includes('Implicit')) {
      category = ErrorCategory.MissingType;
      severity = ErrorSeverity.Low;
    }
    
    errors.push({
      errorCode: `TS${diagnostic.code}`,
      errorMessage,
      filePath,
      lineNumber,
      columnNumber,
      errorContext,
      category,
      severity,
      status: ErrorStatus.Detected,
      occurrenceCount: 1,
      detectedAt: new Date()
    });
  }
  
  // Group errors by file
  const errorsByFile: Record<string, TypeScriptError[]> = {};
  
  for (const error of errors) {
    if (!errorsByFile[error.filePath]) {
      errorsByFile[error.filePath] = [];
    }
    
    errorsByFile[error.filePath].push(error);
  }
  
  // Group errors by severity
  const errorsBySeverity: Record<ErrorSeverity, TypeScriptError[]> = {
    [ErrorSeverity.Critical]: [],
    [ErrorSeverity.High]: [],
    [ErrorSeverity.Medium]: [],
    [ErrorSeverity.Low]: []
  };
  
  for (const error of errors) {
    errorsBySeverity[error.severity].push(error);
  }
  
  // Group errors by category
  const errorsByCategory: Record<ErrorCategory, TypeScriptError[]> = {
    [ErrorCategory.TypeMismatch]: [],
    [ErrorCategory.MissingType]: [],
    [ErrorCategory.ImportError]: [],
    [ErrorCategory.NullReference]: [],
    [ErrorCategory.InterfaceMismatch]: [],
    [ErrorCategory.GenericConstraint]: [],
    [ErrorCategory.DeclarationError]: [],
    [ErrorCategory.SyntaxError]: [],
    [ErrorCategory.Other]: []
  };
  
  for (const error of errors) {
    errorsByCategory[error.category].push(error);
  }
  
  // Detect error patterns
  const patterns = detectErrorPatterns(errors);
  
  // Calculate fix priorities
  const fixPriorities = calculateFixPriorities(errors, patterns);
  
  return {
    totalErrors: errors.length,
    errorsByFile,
    errorsBySeverity,
    errorsByCategory,
    patterns,
    fixPriorities
  };
}

/**
 * Detect common error patterns
 */
function detectErrorPatterns(errors: TypeScriptError[]): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];
  
  // Pattern 1: Missing module imports
  const missingModuleRegex = /Cannot find module '(.+)'/;
  const missingModuleErrors = errors.filter(
    error => error.category === ErrorCategory.ImportError && 
    missingModuleRegex.test(error.errorMessage)
  );
  
  if (missingModuleErrors.length > 0) {
    patterns.push({
      name: 'Missing Module Imports',
      description: 'Modules that are referenced but not properly imported',
      regex: missingModuleRegex.source,
      category: ErrorCategory.ImportError,
      severity: ErrorSeverity.Critical,
      autoFixable: true,
      fixCount: 0,
      successRate: 0
    });
  }
  
  // Pattern 2: Missing type annotations
  const implicitAnyRegex = /Parameter '(.+)' implicitly has an 'any' type/;
  const implicitAnyErrors = errors.filter(
    error => error.category === ErrorCategory.MissingType && 
    implicitAnyRegex.test(error.errorMessage)
  );
  
  if (implicitAnyErrors.length > 0) {
    patterns.push({
      name: 'Missing Type Annotations',
      description: 'Parameters or variables that need explicit type annotations',
      regex: implicitAnyRegex.source,
      category: ErrorCategory.MissingType,
      severity: ErrorSeverity.Low,
      autoFixable: true,
      fixCount: 0,
      successRate: 0
    });
  }
  
  // Pattern 3: Type compatibility issues
  const typeMismatchRegex = /Type '(.+)' is not assignable to type '(.+)'/;
  const typeMismatchErrors = errors.filter(
    error => error.category === ErrorCategory.TypeMismatch && 
    typeMismatchRegex.test(error.errorMessage)
  );
  
  if (typeMismatchErrors.length > 0) {
    patterns.push({
      name: 'Type Compatibility Issues',
      description: 'Types that are incompatible with their expected types',
      regex: typeMismatchRegex.source,
      category: ErrorCategory.TypeMismatch,
      severity: ErrorSeverity.High,
      autoFixable: false,
      fixCount: 0,
      successRate: 0
    });
  }
  
  // Pattern 4: Null/undefined handling
  const nullReferenceRegex = /Object is possibly '(undefined|null)'/;
  const nullReferenceErrors = errors.filter(
    error => error.category === ErrorCategory.NullReference && 
    nullReferenceRegex.test(error.errorMessage)
  );
  
  if (nullReferenceErrors.length > 0) {
    patterns.push({
      name: 'Null/Undefined References',
      description: 'References to objects that might be null or undefined',
      regex: nullReferenceRegex.source,
      category: ErrorCategory.NullReference,
      severity: ErrorSeverity.Medium,
      autoFixable: true,
      fixCount: 0,
      successRate: 0
    });
  }
  
  // Pattern 5: Missing properties
  const missingPropertyRegex = /Property '(.+)' does not exist on type '(.+)'/;
  const missingPropertyErrors = errors.filter(
    error => error.category === ErrorCategory.InterfaceMismatch && 
    missingPropertyRegex.test(error.errorMessage)
  );
  
  if (missingPropertyErrors.length > 0) {
    patterns.push({
      name: 'Missing Properties',
      description: 'Properties that are accessed but do not exist on their types',
      regex: missingPropertyRegex.source,
      category: ErrorCategory.InterfaceMismatch,
      severity: ErrorSeverity.High,
      autoFixable: false,
      fixCount: 0,
      successRate: 0
    });
  }
  
  return patterns;
}

/**
 * Calculate fix priorities
 */
function calculateFixPriorities(
  errors: TypeScriptError[], 
  patterns: ErrorPattern[]
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
  
  // Add all errors with priorities based on severity and category
  errors.forEach((error, index) => {
    let priority = 50; // Default priority (medium)
    
    // Adjust priority based on severity
    switch (error.severity) {
      case ErrorSeverity.Critical:
        priority += 40;
        break;
      case ErrorSeverity.High:
        priority += 30;
        break;
      case ErrorSeverity.Medium:
        priority += 20;
        break;
      case ErrorSeverity.Low:
        priority += 10;
        break;
    }
    
    // Adjust priority based on category
    switch (error.category) {
      case ErrorCategory.SyntaxError:
      case ErrorCategory.ImportError:
        priority += 10;
        break;
      case ErrorCategory.TypeMismatch:
      case ErrorCategory.InterfaceMismatch:
        priority += 5;
        break;
    }
    
    // Check if the error matches an auto-fixable pattern
    const matchesFixablePattern = patterns.some(
      pattern => pattern.autoFixable && new RegExp(pattern.regex || '').test(error.errorMessage)
    );
    
    if (matchesFixablePattern) {
      priority += 15;
    }
    
    // Create a reason for this priority
    let reason = `${error.severity} severity ${error.category} error`;
    
    if (matchesFixablePattern) {
      reason += ' (auto-fixable)';
    }
    
    priorities.push({
      errorId: index,
      filePath: error.filePath,
      lineNumber: error.lineNumber,
      priority,
      reason
    });
  });
  
  // Sort by priority (highest first)
  return priorities.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate fixes for common TypeScript errors
 */
function generateFixes(
  error: TypeScriptError, 
  fileContent: string
): ErrorFix | null {
  // Fix for missing type annotations
  if (
    error.category === ErrorCategory.MissingType &&
    error.errorMessage.includes("implicitly has an 'any' type")
  ) {
    const match = error.errorMessage.match(/Parameter '(.+)' implicitly/);
    
    if (match && match[1]) {
      const paramName = match[1];
      const lines = fileContent.split('\n');
      const errorLine = lines[error.lineNumber - 1];
      
      // Find the parameter in the line
      const paramRegex = new RegExp(`(${paramName})(?![:\\w])`, 'g');
      const newLine = errorLine.replace(paramRegex, '$1: any');
      
      if (newLine !== errorLine) {
        return {
          fixTitle: 'Add missing type annotation',
          fixDescription: `Add 'any' type annotation to parameter '${paramName}'`,
          fixType: 'code_change',
          beforeCode: errorLine,
          afterCode: newLine,
          appliedCount: 0,
          successCount: 0,
          aiGenerated: false
        };
      }
    }
  }
  
  // Fix for null/undefined handling
  if (
    error.category === ErrorCategory.NullReference &&
    (error.errorMessage.includes('is possibly undefined') || error.errorMessage.includes('is possibly null'))
  ) {
    const lines = fileContent.split('\n');
    const errorLine = lines[error.lineNumber - 1];
    
    // Extract the object access pattern (typically something like obj.prop or obj?.prop)
    const match = error.errorMessage.match(/Object is possibly '(undefined|null)'./);
    
    if (match) {
      // Find the last non-whitespace character before the column number
      const beforeColumn = errorLine.substring(0, error.columnNumber - 1);
      
      // Find alphanumeric sequences that might be object references
      const objMatches = beforeColumn.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/);
      
      if (objMatches) {
        const objectRef = objMatches[1];
        const propertyRef = objMatches[2];
        
        // Replace the direct property access with optional chaining
        const newLine = errorLine.replace(
          `${objectRef}.${propertyRef}`,
          `${objectRef}?.${propertyRef}`
        );
        
        if (newLine !== errorLine) {
          return {
            fixTitle: 'Add optional chaining',
            fixDescription: `Add optional chaining operator to handle possibly ${match[1]} value`,
            fixType: 'code_change',
            beforeCode: errorLine,
            afterCode: newLine,
            appliedCount: 0,
            successCount: 0,
            aiGenerated: false
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Apply a fix to a file
 */
function applyFix(
  error: TypeScriptError, 
  fix: ErrorFix
): boolean {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(error.filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Apply the fix
    if (fix.beforeCode && fix.afterCode) {
      const lineToFix = error.lineNumber - 1;
      
      if (lines[lineToFix] === fix.beforeCode) {
        lines[lineToFix] = fix.afterCode;
        
        // Write the updated content back to the file
        fs.writeFileSync(error.filePath, lines.join('\n'));
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`Error applying fix: ${error.message}`));
    return false;
  }
}

/**
 * Fix TypeScript errors in a project
 */
function fixErrors(
  projectPath: string = process.cwd(),
  options: {
    fixAll?: boolean;
    fixPriority?: boolean;
    fixTypes?: boolean;
    dryRun?: boolean;
  } = {}
): void {
  console.log(chalk.blue('Fixing TypeScript errors...'));
  
  // Analyze the project
  const analysis = analyzeProject(projectPath);
  
  if (analysis.totalErrors === 0) {
    console.log(chalk.green('No TypeScript errors found!'));
    return;
  }
  
  console.log(chalk.yellow(`Found ${analysis.totalErrors} TypeScript errors.`));
  
  // Determine which errors to fix
  let errorsToFix: TypeScriptError[] = [];
  
  if (options.fixTypes) {
    // Fix only type-related errors
    errorsToFix = [
      ...analysis.errorsByCategory[ErrorCategory.MissingType],
      ...analysis.errorsByCategory[ErrorCategory.TypeMismatch]
    ];
    
    console.log(chalk.blue(`Attempting to fix ${errorsToFix.length} type-related errors.`));
  } else if (options.fixPriority) {
    // Fix errors in priority order (top 10)
    const topPriorities = analysis.fixPriorities.slice(0, 10);
    
    errorsToFix = topPriorities.map(
      priority => Object.values(analysis.errorsByFile)
        .flat()
        .find((_, index) => index === priority.errorId)!
    );
    
    console.log(chalk.blue(`Attempting to fix top ${errorsToFix.length} priority errors.`));
  } else if (options.fixAll) {
    // Fix all errors
    errorsToFix = Object.values(analysis.errorsByFile).flat();
    console.log(chalk.blue(`Attempting to fix all ${errorsToFix.length} errors.`));
  } else {
    // Default: fix auto-fixable errors
    const fixablePatterns = analysis.patterns.filter(pattern => pattern.autoFixable);
    
    for (const pattern of fixablePatterns) {
      const regex = new RegExp(pattern.regex || '');
      
      const matchingErrors = Object.values(analysis.errorsByFile)
        .flat()
        .filter(error => regex.test(error.errorMessage));
      
      errorsToFix.push(...matchingErrors);
    }
    
    console.log(chalk.blue(`Attempting to fix ${errorsToFix.length} auto-fixable errors.`));
  }
  
  if (errorsToFix.length === 0) {
    console.log(chalk.yellow('No errors to fix with the current options.'));
    return;
  }
  
  // Apply fixes
  let fixedCount = 0;
  
  for (const error of errorsToFix) {
    try {
      // Read the file content
      const fileContent = fs.readFileSync(error.filePath, 'utf-8');
      
      // Generate a fix
      const fix = generateFixes(error, fileContent);
      
      if (fix) {
        console.log(chalk.blue(`\nGenerating fix for error in ${error.filePath}:${error.lineNumber}`));
        console.log(chalk.red(`Error: ${error.errorMessage}`));
        
        console.log(chalk.yellow('Before:'));
        console.log(chalk.yellow(fix.beforeCode));
        
        console.log(chalk.green('After:'));
        console.log(chalk.green(fix.afterCode));
        
        if (!options.dryRun) {
          // Apply the fix
          const success = applyFix(error, fix);
          
          if (success) {
            console.log(chalk.green('Fix applied successfully!'));
            fixedCount++;
          } else {
            console.log(chalk.red('Failed to apply fix.'));
          }
        } else {
          console.log(chalk.blue('(Dry run: not applying fix)'));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error fixing error: ${error.message}`));
    }
  }
  
  if (options.dryRun) {
    console.log(chalk.blue(`\nDry run completed. ${fixedCount} fixes would be applied.`));
  } else {
    console.log(chalk.green(`\nFixed ${fixedCount} errors.`));
    
    if (fixedCount > 0) {
      // Re-analyze to see if we fixed all errors
      const newAnalysis = analyzeProject(projectPath);
      
      console.log(chalk.blue(`\nAfter fixing: ${newAnalysis.totalErrors} errors remain.`));
      
      if (newAnalysis.totalErrors < analysis.totalErrors) {
        console.log(chalk.green(`Reduced error count by ${analysis.totalErrors - newAnalysis.totalErrors}.`));
      }
      
      // Check if new errors were introduced
      if (newAnalysis.totalErrors > analysis.totalErrors - fixedCount) {
        console.log(chalk.yellow(`Warning: ${newAnalysis.totalErrors - (analysis.totalErrors - fixedCount)} new errors might have been introduced.`));
      }
    }
  }
}

/**
 * Print analysis results to the console
 */
function printAnalysisResults(analysis: AnalysisResults): void {
  console.log(chalk.blue(`\nTotal errors: ${analysis.totalErrors}`));
  
  // Print errors by severity
  console.log(chalk.blue('\nErrors by severity:'));
  
  for (const severity in analysis.errorsBySeverity) {
    const count = analysis.errorsBySeverity[severity as ErrorSeverity].length;
    
    if (count > 0) {
      let color = chalk.blue;
      
      switch (severity) {
        case ErrorSeverity.Critical:
          color = chalk.red;
          break;
        case ErrorSeverity.High:
          color = chalk.yellow;
          break;
        case ErrorSeverity.Medium:
          color = chalk.blue;
          break;
        case ErrorSeverity.Low:
          color = chalk.green;
          break;
      }
      
      console.log(color(`  ${severity}: ${count}`));
    }
  }
  
  // Print errors by category
  console.log(chalk.blue('\nErrors by category:'));
  
  for (const category in analysis.errorsByCategory) {
    const count = analysis.errorsByCategory[category as ErrorCategory].length;
    
    if (count > 0) {
      console.log(chalk.blue(`  ${category}: ${count}`));
    }
  }
  
  // Print top 5 files with most errors
  console.log(chalk.blue('\nTop 5 files with most errors:'));
  
  const topFiles = Object.entries(analysis.errorsByFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);
  
  for (const [filePath, errors] of topFiles) {
    console.log(chalk.blue(`  ${filePath}: ${errors.length} errors`));
  }
  
  // Print detected patterns
  if (analysis.patterns.length > 0) {
    console.log(chalk.blue('\nDetected error patterns:'));
    
    for (const pattern of analysis.patterns) {
      console.log(chalk.blue(`  ${pattern.name}: ${pattern.description}`));
      
      // Count errors matching this pattern
      const regex = new RegExp(pattern.regex || '');
      const matchingErrors = Object.values(analysis.errorsByFile)
        .flat()
        .filter(error => regex.test(error.errorMessage));
      
      console.log(chalk.blue(`    Matching errors: ${matchingErrors.length}`));
      console.log(chalk.blue(`    Auto-fixable: ${pattern.autoFixable ? 'Yes' : 'No'}`));
    }
  }
  
  // Print top 5 fix priorities
  console.log(chalk.blue('\nTop 5 errors to fix first:'));
  
  for (const priority of analysis.fixPriorities.slice(0, 5)) {
    console.log(chalk.blue(`  ${priority.filePath}:${priority.lineNumber} (Priority: ${priority.priority})`));
    console.log(chalk.blue(`    Reason: ${priority.reason}`));
  }
}

/**
 * Main function
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .command('analyze', 'Analyze a TypeScript project and find errors', (yargs) => {
      return yargs.option('project', {
        alias: 'p',
        describe: 'Path to the TypeScript project',
        type: 'string',
        default: process.cwd()
      });
    })
    .command('fix', 'Fix TypeScript errors in a project', (yargs) => {
      return yargs
        .option('project', {
          alias: 'p',
          describe: 'Path to the TypeScript project',
          type: 'string',
          default: process.cwd()
        })
        .option('all', {
          alias: 'a',
          describe: 'Fix all errors',
          type: 'boolean',
          default: false
        })
        .option('priority', {
          alias: 'r',
          describe: 'Fix errors in priority order',
          type: 'boolean',
          default: false
        })
        .option('types', {
          alias: 't',
          describe: 'Fix only type-related errors',
          type: 'boolean',
          default: false
        })
        .option('dry-run', {
          alias: 'd',
          describe: 'Do not apply fixes, just show what would be done',
          type: 'boolean',
          default: false
        });
    })
    .demandCommand(1, 'You must provide a valid command')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .argv as any;

  const command = argv._[0];

  try {
    if (command === 'analyze') {
      const analysis = analyzeProject(argv.project);
      printAnalysisResults(analysis);
    } else if (command === 'fix') {
      fixErrors(argv.project, {
        fixAll: argv.all,
        fixPriority: argv.priority,
        fixTypes: argv.types,
        dryRun: argv['dry-run']
      });
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);