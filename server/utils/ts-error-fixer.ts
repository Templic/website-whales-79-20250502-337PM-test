/**
 * TypeScript Error Fixer
 * 
 * This utility intelligently fixes TypeScript errors by analyzing
 * compiler output and applying targeted fixes based on error categories.
 * It works in conjunction with ts-error-analyzer.ts to provide a
 * comprehensive error fixing solution.
 */

import fs from 'fs';
import path from 'path';
import { analyzeTypeScriptErrors, TypeScriptError, ErrorCategory } from './ts-error-analyzer';

// Result of a fix operation
export interface FixResult {
  filePath: string;
  fixed: boolean;
  fixedErrors: TypeScriptError[];
  appliedFixes: number;
  errorsBefore: number;
  errorsAfter: number;
  changes: string[];
}

// Fix options
export interface FixOptions {
  createBackups: boolean;
  backupDir: string;
  categories?: ErrorCategory[];
  maxErrorsPerFile?: number;
  logLevel: 'silent' | 'minimal' | 'normal' | 'verbose';
  dryRun: boolean;
  generateTypeDefinitions: boolean;
  fixMissingInterfaces: boolean;
  fixImplicitAny: boolean;
  fixMissingProperties: boolean;
  prioritizeCriticalErrors: boolean;
}

// Default fix options
const DEFAULT_OPTIONS: FixOptions = {
  createBackups: true,
  backupDir: './ts-error-fixes-backup',
  logLevel: 'normal',
  dryRun: false,
  generateTypeDefinitions: true,
  fixMissingInterfaces: true,
  fixImplicitAny: true,
  fixMissingProperties: true,
  prioritizeCriticalErrors: true
};

/**
 * Logging utility
 */
const Logger = {
  error: (message: string) => {
    console.error('\x1b[31m[ERROR]\x1b[0m', message);
  },
  warn: (message: string, options: FixOptions) => {
    if (options.logLevel !== 'silent') {
      console.warn('\x1b[33m[WARN]\x1b[0m', message);
    }
  },
  info: (message: string, options: FixOptions) => {
    if (options.logLevel !== 'silent' && options.logLevel !== 'minimal') {
      console.info('\x1b[36m[INFO]\x1b[0m', message);
    }
  },
  verbose: (message: string, options: FixOptions) => {
    if (options.logLevel === 'verbose') {
      console.log('\x1b[90m[DEBUG]\x1b[0m', message);
    }
  },
  success: (message: string, options: FixOptions) => {
    if (options.logLevel !== 'silent') {
      console.log('\x1b[32m[SUCCESS]\x1b[0m', message);
    }
  },
  fixed: (file: string, count: number, options: FixOptions) => {
    if (options.logLevel !== 'silent') {
      console.log(`\x1b[32m✓\x1b[0m Fixed ${count} errors in ${file}`);
    }
  }
};

/**
 * Creates a backup of files before fixing
 */
function createBackups(files: string[], options: FixOptions): void {
  if (!options.createBackups) return;
  
  const backupDir = options.backupDir;
  
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy each file to the backup directory
    for (const file of files) {
      const relativePath = path.relative(process.cwd(), file);
      const backupPath = path.join(backupDir, relativePath);
      const backupDirPath = path.dirname(backupPath);
      
      // Create directory structure if it doesn't exist
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      
      // Copy file to backup location
      fs.copyFileSync(file, backupPath);
    }
    
    Logger.info(`Created backups of ${files.length} files in ${backupDir}`, options);
  } catch (error) {
    Logger.error(`Failed to create backups: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fix for missing properties on interfaces
 */
function fixMissingProperty(error: TypeScriptError, fileContent: string): string | null {
  // Extract property name and type name from error message
  const match = error.message.match(/Property ['"]([^'"]+)['"] does not exist on type ['"]([^'"]+)['"]/);
  if (!match) return null;
  
  const [_, propertyName, typeName] = match;
  
  // Find the interface or type declaration
  const typeRegex = new RegExp(`(interface|type)\\s+${typeName}\\s*(?:extends [^{]+)?\\s*\\{`, 'g');
  const typeMatch = typeRegex.exec(fileContent);
  if (!typeMatch) return null;
  
  // Find the closing brace of the interface
  const startIndex = typeMatch.index;
  let openBraces = 0;
  let closingBraceIndex = -1;
  
  for (let i = startIndex; i < fileContent.length; i++) {
    if (fileContent[i] === '{') {
      openBraces++;
    } else if (fileContent[i] === '}') {
      openBraces--;
      if (openBraces === 0) {
        closingBraceIndex = i;
        break;
      }
    }
  }
  
  if (closingBraceIndex === -1) return null;
  
  // Add the missing property to the interface
  const beforeInterface = fileContent.substring(0, closingBraceIndex);
  const afterInterface = fileContent.substring(closingBraceIndex);
  
  // Determine the indentation level
  const interfaceLines = beforeInterface.split('\n');
  const lastLine = interfaceLines[interfaceLines.length - 1];
  const indentation = lastLine.match(/^\s*/)?.[0] || '  ';
  
  // Determine property type (use 'any' as a fallback)
  let propertyType = 'any';
  
  // Try to infer property type based on usage
  const usageMatch = fileContent.match(new RegExp(`\\.${propertyName}\\s*=\\s*([^;]+)`, 'g'));
  if (usageMatch) {
    // Try to infer from assignment
    const assignmentMatch = usageMatch[0].match(/=\s*(['"][^'"]+['"]|\d+|true|false|null|\{|\[)/);
    if (assignmentMatch) {
      const value = assignmentMatch[1];
      if (value.startsWith('"') || value.startsWith("'")) {
        propertyType = 'string';
      } else if (/^\d+$/.test(value)) {
        propertyType = 'number';
      } else if (value === 'true' || value === 'false') {
        propertyType = 'boolean';
      } else if (value === 'null') {
        propertyType = 'null';
      } else if (value === '{') {
        propertyType = 'Record<string, any>';
      } else if (value === '[') {
        propertyType = 'any[]';
      }
    }
  }
  
  return beforeInterface + `\n${indentation}${propertyName}?: ${propertyType};` + afterInterface;
}

/**
 * Fix for implicit any errors
 */
function fixImplicitAny(error: TypeScriptError, fileContent: string): string | null {
  // Extract variable name from error message
  const match = error.message.match(/Parameter ['"]([^'"]+)['"] implicitly has an ['"]any['"] type/);
  if (!match) return null;
  
  const [_, paramName] = match;
  
  // Get the line with the error
  const lines = fileContent.split('\n');
  const errorLine = error.line - 1; // Convert to 0-based index
  
  if (errorLine < 0 || errorLine >= lines.length) return null;
  
  const line = lines[errorLine];
  
  // Function parameter pattern
  const functionParamRegex = new RegExp(`(\\(|,\\s*)${paramName}(\\)|,|\\s*=>|\\s*\\{)`, 'g');
  const functionParamMatch = functionParamRegex.exec(line);
  
  if (functionParamMatch) {
    const beforeParam = line.substring(0, functionParamMatch.index + functionParamMatch[1].length);
    const afterParam = line.substring(functionParamMatch.index + functionParamMatch[1].length + paramName.length);
    
    lines[errorLine] = `${beforeParam}${paramName}: any${afterParam}`;
    return lines.join('\n');
  }
  
  return null;
}

/**
 * Fix for type mismatch errors
 */
function fixTypeMismatch(error: TypeScriptError, fileContent: string): string | null {
  // Extract types from error message
  const match = error.message.match(/Type ['"]([^'"]+)['"] is not assignable to type ['"]([^'"]+)['"]/);
  if (!match) return null;
  
  const [_, sourceType, targetType] = match;
  
  // Get the line with the error
  const lines = fileContent.split('\n');
  const errorLine = error.line - 1; // Convert to 0-based index
  
  if (errorLine < 0 || errorLine >= lines.length) return null;
  
  // Only add type assertion if it's a simple expression
  if (error.lineContent && !error.lineContent.includes('as')) {
    // Try to find the variable or expression being assigned
    const assignmentRegex = /(\w+)\s*=\s*([^;]+)/;
    const assignmentMatch = error.lineContent.match(assignmentRegex);
    
    if (assignmentMatch) {
      const [_, variable, expression] = assignmentMatch;
      
      // Add a type assertion
      lines[errorLine] = error.lineContent.replace(
        expression,
        `(${expression} as ${targetType})`
      );
      
      return lines.join('\n');
    }
  }
  
  return null;
}

/**
 * Fix for errors in catch clauses
 */
function fixCatchClause(error: TypeScriptError, fileContent: string): string | null {
  // Check if it's related to a catch clause
  if (!error.message.includes('catch') && !error.lineContent?.includes('catch')) return null;
  
  // Get the line with the error
  const lines = fileContent.split('\n');
  const errorLine = error.line - 1; // Convert to 0-based index
  
  if (errorLine < 0 || errorLine >= lines.length) return null;
  
  // Try to match a catch clause without type annotation
  const catchRegex = /catch\s*\((\w+)\)\s*\{/;
  const catchMatch = lines[errorLine].match(catchRegex);
  
  if (catchMatch) {
    const [fullMatch, paramName] = catchMatch;
    
    // Replace with typed catch
    lines[errorLine] = lines[errorLine].replace(
      fullMatch,
      `catch (${paramName}: unknown) {`
    );
    
    // Check if we need to add type assertion for the error
    if (error.message.includes('Object is of type \'unknown\'')) {
      // Find where to insert the type assertion
      let inserted = false;
      
      // Look at next few lines for using the error variable
      for (let i = errorLine + 1; i < Math.min(errorLine + 5, lines.length); i++) {
        if (lines[i].includes(paramName) && !lines[i].includes(`const typed${paramName}`)) {
          // Insert a type assertion after the catch opening brace
          lines[errorLine] = lines[errorLine].replace(
            '{',
            `{\n    const typed${paramName} = ${paramName} as Error;`
          );
          inserted = true;
          break;
        }
      }
      
      if (!inserted) {
        // If no usage found, just add a comment
        lines[errorLine] = lines[errorLine].replace(
          '{',
          `{\n    // Suppress TS error: const typed${paramName} = ${paramName} as Error;`
        );
      }
    }
    
    return lines.join('\n');
  }
  
  return null;
}

/**
 * Fixes errors in a single file
 */
async function fixFile(filePath: string, errors: TypeScriptError[], options: FixOptions): Promise<FixResult> {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        filePath,
        fixed: false,
        fixedErrors: [],
        appliedFixes: 0,
        errorsBefore: errors.length,
        errorsAfter: errors.length,
        changes: []
      };
    }
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Sort errors to fix the most severe ones first
    let sortedErrors = [...errors];
    if (options.prioritizeCriticalErrors) {
      const severityOrder: Record<string, number> = {
        'critical': 0,
        'high': 1,
        'medium': 2,
        'low': 3
      };
      
      sortedErrors.sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    }
    
    // Limit number of errors to fix if specified
    if (options.maxErrorsPerFile && sortedErrors.length > options.maxErrorsPerFile) {
      sortedErrors = sortedErrors.slice(0, options.maxErrorsPerFile);
    }
    
    // Apply fixes
    const fixedErrors: TypeScriptError[] = [];
    const changes: string[] = [];
    
    for (const error of sortedErrors) {
      let fixed = false;
      
      // Skip categories that are disabled in options
      if (
        (error.category === 'MISSING_PROPERTY' && !options.fixMissingProperties) ||
        (error.category === 'IMPLICIT_ANY' && !options.fixImplicitAny) ||
        (options.categories && !options.categories.includes(error.category))
      ) {
        continue;
      }
      
      // Apply appropriate fix based on error category
      let newContent = content;
      
      switch (error.category) {
        case 'MISSING_PROPERTY':
          if (options.fixMissingProperties) {
            const result = fixMissingProperty(error, content);
            if (result) {
              newContent = result;
              fixed = true;
              changes.push(`Added property ${error.message.match(/['"]([^'"]+)['"]/)?.[1] || 'unknown'}`);
            }
          }
          break;
          
        case 'IMPLICIT_ANY':
          if (options.fixImplicitAny) {
            const result = fixImplicitAny(error, content);
            if (result) {
              newContent = result;
              fixed = true;
              changes.push(`Added type annotation for implicit any: ${error.line}`);
            }
          }
          break;
          
        case 'TYPE_MISMATCH':
          const mismatchResult = fixTypeMismatch(error, content);
          if (mismatchResult) {
            newContent = mismatchResult;
            fixed = true;
            changes.push(`Added type assertion for type mismatch: ${error.line}`);
          }
          break;
          
        case 'NULL_UNDEFINED':
          // Usually requires catch clause fixing or type assertion
          const catchResult = fixCatchClause(error, content);
          if (catchResult) {
            newContent = catchResult;
            fixed = true;
            changes.push(`Fixed catch clause: ${error.line}`);
          }
          break;
          
        default:
          // No automatic fix available
          break;
      }
      
      if (fixed) {
        content = newContent;
        fixedErrors.push(error);
      }
    }
    
    // Write fixed content to file if changes were made
    if (fixedErrors.length > 0 && !options.dryRun) {
      fs.writeFileSync(filePath, content);
    }
    
    // Calculate number of errors after fixes
    const errorsAfter = errors.length - fixedErrors.length;
    
    return {
      filePath,
      fixed: fixedErrors.length > 0,
      fixedErrors,
      appliedFixes: fixedErrors.length,
      errorsBefore: errors.length,
      errorsAfter,
      changes
    };
  } catch (error) {
    Logger.error(`Error fixing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      filePath,
      fixed: false,
      fixedErrors: [],
      appliedFixes: 0,
      errorsBefore: errors.length,
      errorsAfter: errors.length,
      changes: []
    };
  }
}

/**
 * Creates interface definition files for common error patterns
 */
function generateTypeDefinitions(
  errors: TypeScriptError[],
  projectRoot: string,
  options: FixOptions
): void {
  if (!options.generateTypeDefinitions) return;
  
  try {
    // Create types directory if it doesn't exist
    const typesDir = path.join(projectRoot, 'server/types');
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }
    
    // Collect missing properties
    const missingProps: Record<string, Set<string>> = {};
    
    for (const error of errors) {
      if (error.category === 'MISSING_PROPERTY') {
        const match = error.message.match(/Property ['"]([^'"]+)['"] does not exist on type ['"]([^'"]+)['"]/);
        if (match) {
          const [_, propertyName, typeName] = match;
          
          if (!missingProps[typeName]) {
            missingProps[typeName] = new Set();
          }
          
          missingProps[typeName].add(propertyName);
        }
      }
    }
    
    // Generate extension files for common interfaces
    const interfaceNames = Object.keys(missingProps);
    
    if (interfaceNames.length > 0) {
      const extensionsFile = path.join(typesDir, 'interface-extensions.d.ts');
      
      let content = `/**
 * Interface Extensions
 * 
 * This file extends interfaces with commonly missing properties
 * that were detected by the TypeScript error analyzer.
 * 
 * Generated automatically by ts-error-fixer.ts
 */

`;
      
      for (const interfaceName of interfaceNames) {
        const properties = Array.from(missingProps[interfaceName]);
        
        content += `// Extend ${interfaceName} with missing properties
interface ${interfaceName} {
${properties.map(prop => `  ${prop}?: any;`).join('\n')}
}

`;
      }
      
      if (!options.dryRun) {
        fs.writeFileSync(extensionsFile, content);
      }
      
      Logger.info(`Generated interface extensions for ${interfaceNames.length} types`, options);
    }
    
    // Create express extension file if needed
    const expressErrors = errors.filter(e => 
      e.message.includes('express') || 
      e.message.includes('Request') || 
      e.message.includes('Response')
    );
    
    if (expressErrors.length > 0) {
      const expressFile = path.join(typesDir, 'express-extensions.d.ts');
      
      const content = `/**
 * Express Extensions
 * 
 * This file extends Express Request and Response types
 * with commonly missing properties.
 * 
 * Generated automatically by ts-error-fixer.ts
 */

declare namespace Express {
  interface Request {
    // Common extensions
    user?: any;
    csrfToken?: () => string;
    session?: any;
    flash?: (type: string, message: string) => void;
    isAuthenticated?: () => boolean;
  }
  
  interface Response {
    // Type safe response methods
    json<T>(body: T): TypedResponse<T>;
    status(code: number): TypedResponse<any>;
  }
  
  // Add TypedResponse to fix express response typing issues
  interface TypedResponse<T> extends Response {
    json(body: T): TypedResponse<T>;
    status(code: number): TypedResponse<T>;
  }
}

// Need to export something to make it a module
export {};
`;
      
      if (!options.dryRun) {
        fs.writeFileSync(expressFile, content);
      }
      
      Logger.info('Generated Express type extensions', options);
    }
  } catch (error) {
    Logger.error(`Error generating type definitions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fixes TypeScript errors across a project
 */
export async function fixTypeScriptErrors(
  projectRoot: string = process.cwd(),
  tsConfigPath: string = 'tsconfig.json',
  options: Partial<FixOptions> = {}
): Promise<{
  totalErrors: number;
  fixedErrors: number;
  unfixedErrors: number;
  fixedFiles: string[];
  unfixableFiles: string[];
  duration: number;
}> {
  const startTime = Date.now();
  
  // Merge options with defaults
  const mergedOptions: FixOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  
  try {
    // Ensure paths are absolute
    projectRoot = path.resolve(projectRoot);
    tsConfigPath = path.isAbsolute(tsConfigPath)
      ? tsConfigPath
      : path.join(projectRoot, tsConfigPath);
    
    // Analyze TypeScript errors
    Logger.info(`Analyzing TypeScript errors in ${projectRoot}...`, mergedOptions);
    const analysis = await analyzeTypeScriptErrors(projectRoot, tsConfigPath);
    
    // Log analysis results
    Logger.info(`Found ${analysis.totalErrors} TypeScript errors:`, mergedOptions);
    Logger.info(`  Critical: ${analysis.criticalErrors}`, mergedOptions);
    Logger.info(`  High: ${analysis.highSeverityErrors}`, mergedOptions);
    Logger.info(`  Medium: ${analysis.mediumSeverityErrors}`, mergedOptions);
    Logger.info(`  Low: ${analysis.lowSeverityErrors}`, mergedOptions);
    
    if (analysis.totalErrors === 0) {
      Logger.success('No TypeScript errors found!', mergedOptions);
      return {
        totalErrors: 0,
        fixedErrors: 0,
        unfixedErrors: 0,
        fixedFiles: [],
        unfixableFiles: [],
        duration: Date.now() - startTime
      };
    }
    
    // Get unique list of files with errors
    const filePathsWithErrors = Object.keys(analysis.errorsByFile);
    
    // Create backups of files before fixing
    if (mergedOptions.createBackups && !mergedOptions.dryRun) {
      createBackups(filePathsWithErrors, mergedOptions);
    }
    
    // Generate type definitions if enabled
    if (mergedOptions.generateTypeDefinitions && !mergedOptions.dryRun) {
      generateTypeDefinitions(analysis.errors, projectRoot, mergedOptions);
    }
    
    // Fix errors in each file
    Logger.info(`Fixing errors in ${filePathsWithErrors.length} files...`, mergedOptions);
    
    const results: FixResult[] = [];
    
    for (const filePath of filePathsWithErrors) {
      const fileErrors = analysis.errorsByFile[filePath];
      const result = await fixFile(filePath, fileErrors, mergedOptions);
      results.push(result);
      
      if (result.fixed) {
        Logger.fixed(filePath, result.appliedFixes, mergedOptions);
        if (mergedOptions.logLevel === 'verbose') {
          for (const change of result.changes) {
            Logger.verbose(`  - ${change}`, mergedOptions);
          }
        }
      } else if (fileErrors.length > 0) {
        Logger.warn(`Could not fix all errors in ${filePath}`, mergedOptions);
      }
    }
    
    // Calculate results
    const fixedFiles = results.filter(r => r.fixed).map(r => r.filePath);
    const unfixableFiles = results.filter(r => !r.fixed && r.errorsBefore > 0).map(r => r.filePath);
    const fixedErrors = results.reduce((sum, r) => sum + r.appliedFixes, 0);
    const unfixedErrors = analysis.totalErrors - fixedErrors;
    
    // Log summary
    const duration = Date.now() - startTime;
    Logger.info(`\nFixed ${fixedErrors} of ${analysis.totalErrors} TypeScript errors in ${duration}ms`, mergedOptions);
    Logger.info(`  Fixed files: ${fixedFiles.length}`, mergedOptions);
    Logger.info(`  Files with remaining errors: ${unfixableFiles.length}`, mergedOptions);
    
    return {
      totalErrors: analysis.totalErrors,
      fixedErrors,
      unfixedErrors,
      fixedFiles,
      unfixableFiles,
      duration
    };
  } catch (error) {
    Logger.error(`Error fixing TypeScript errors: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      totalErrors: 0,
      fixedErrors: 0,
      unfixedErrors: 0,
      fixedFiles: [],
      unfixableFiles: [],
      duration: Date.now() - startTime
    };
  }
}

export default {
  fixTypeScriptErrors,
  fixMissingProperty,
  fixImplicitAny,
  fixTypeMismatch,
  fixCatchClause,
  createBackups,
  generateTypeDefinitions
};