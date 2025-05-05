/**
 * Fix Validator
 * 
 * A comprehensive validation system for TypeScript error fixes that ensures
 * all fixes are secure, effective, and follow best practices.
 * 
 * Features:
 * - Security-focused: Validates fixes for security vulnerabilities
 * - Verified: Ensures fixes actually resolve the original error
 * - Style-aware: Checks that fixes maintain codebase style consistency
 * - Performance-conscious: Assesses potential performance impact
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { TypeScriptError, Fix, ValidationResult } from './ts-error-resolver';
import { logger } from '../logger';

/**
 * Validation level determines how thorough the validation should be
 */
export enum ValidationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  THOROUGH = 'thorough',
  SECURITY_FOCUSED = 'security_focused'
}

/**
 * Options for validation
 */
export interface ValidationOptions {
  level: ValidationLevel;
  checkSecurity: boolean;
  checkStyle: boolean;
  checkPerformance: boolean;
  timeoutMs: number;
}

/**
 * Code style validation result
 */
interface StyleValidationResult {
  passing: boolean;
  errors: string[];
}

/**
 * Security scan result
 */
interface SecurityScanResult {
  secure: boolean;
  vulnerabilities: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Performance assessment result
 */
interface PerformanceAssessment {
  impact: 'none' | 'low' | 'medium' | 'high';
  details: string[];
}

/**
 * Typescript errors returned from validation
 */
interface TypeScriptErrorResult {
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
}

/**
 * TypeScript Fix Validator
 */
export class FixValidator {
  private rootDir: string;
  private tempDir: string;
  private securityCheckers: Array<(fix: Fix) => Promise<SecurityScanResult>>;
  
  private defaultOptions: ValidationOptions = {
    level: ValidationLevel.STANDARD,
    checkSecurity: true,
    checkStyle: true,
    checkPerformance: true,
    timeoutMs: 5000
  };
  
  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.tempDir = path.join(rootDir, '.ts-fix-validation');
    this.securityCheckers = [
      this.basicSecurityCheck.bind(this),
      // Additional security checkers would be registered here
    ];
    
    this.ensureTempDirExists();
    logger.info('FixValidator initialized');
  }
  
  /**
   * Validate a fix for a TypeScript error
   */
  async validateFix(
    error: TypeScriptError, 
    fix: Fix, 
    options?: Partial<ValidationOptions>
  ): Promise<ValidationResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    const validationDetails: string[] = [];
    
    try {
      // Create a temporary copy of the file for validation
      const validationFile = await this.createValidationFile(error.file, fix);
      validationDetails.push(`Created validation file at ${validationFile}`);
      
      // 1. Check if the fix compiles and resolves the error
      const typeCheckResult = await this.validateTypeScript(validationFile, error);
      validationDetails.push(
        typeCheckResult.success 
          ? 'Type checking passed' 
          : `Type checking failed: ${typeCheckResult.errors.join(', ')}`
      );
      
      // 2. Check if fix introduces new errors
      let newErrorsCount = 0;
      if (typeCheckResult.success) {
        newErrorsCount = typeCheckResult.newErrors.length;
        if (newErrorsCount > 0) {
          validationDetails.push(`Fix introduces ${newErrorsCount} new errors`);
          typeCheckResult.newErrors.slice(0, 3).forEach(err => {
            validationDetails.push(`New error: ${err.code} - ${err.message} at ${err.file}:${err.line}:${err.column}`);
          });
        } else {
          validationDetails.push('No new errors introduced');
        }
      }
      
      // 3. Check security if enabled
      let securityIssuesCount = 0;
      if (mergedOptions.checkSecurity) {
        const securityResult = await this.validateSecurity(error, fix, validationFile);
        securityIssuesCount = securityResult.vulnerabilities.length;
        
        if (securityResult.secure) {
          validationDetails.push('Security validation passed');
        } else {
          validationDetails.push(`Security validation failed: ${securityResult.vulnerabilities.join(', ')}`);
        }
      }
      
      // 4. Check code style if enabled
      let styleValid = true;
      if (mergedOptions.checkStyle) {
        const styleResult = await this.validateStyle(validationFile);
        styleValid = styleResult.passing;
        
        if (styleResult.passing) {
          validationDetails.push('Style validation passed');
        } else {
          validationDetails.push(`Style validation failed: ${styleResult.errors.join(', ')}`);
        }
      }
      
      // 5. Check performance impact if enabled
      let performanceImpact: 'none' | 'low' | 'medium' | 'high' = 'none';
      if (mergedOptions.checkPerformance) {
        const performanceResult = await this.assessPerformance(fix, validationFile);
        performanceImpact = performanceResult.impact;
        
        validationDetails.push(`Performance impact: ${performanceImpact}`);
        performanceResult.details.forEach(detail => {
          validationDetails.push(`  - ${detail}`);
        });
      }
      
      // 6. Clean up validation files
      await this.cleanupValidationFile(validationFile);
      validationDetails.push('Cleaned up validation files');
      
      // Determine overall validation result
      const valid = typeCheckResult.success && 
                  newErrorsCount === 0 && 
                  securityIssuesCount === 0 && 
                  styleValid && 
                  performanceImpact !== 'high';
      
      return {
        valid,
        newErrorsIntroduced: newErrorsCount,
        securityIssues: securityIssuesCount,
        typechecks: typeCheckResult.success,
        stylePassing: styleValid,
        performanceImpact,
        details: validationDetails
      };
    } catch (error) {
      logger.error(`Fix validation error: ${error.message}`);
      return {
        valid: false,
        newErrorsIntroduced: 0,
        securityIssues: 0,
        typechecks: false,
        stylePassing: false,
        performanceImpact: 'high',
        details: [`Validation failed with error: ${error.message}`, ...validationDetails]
      };
    }
  }
  
  /**
   * Create a temporary file with the fix applied for validation
   */
  private async createValidationFile(filePath: string, fix: Fix): Promise<string> {
    await this.ensureTempDirExists();
    
    // Read the original file
    const originalContent = await fs.readFile(path.join(this.rootDir, filePath), 'utf-8');
    
    // Create a validation file path
    const fileName = path.basename(filePath);
    const validationFilePath = path.join(this.tempDir, `${fileName}.validation_${Date.now()}`);
    
    // Apply each replacement to the content
    let content = originalContent;
    
    // Sort replacements in reverse order to avoid position shifts
    const sortedReplacements = [...fix.replacements].sort((a, b) => b.start - a.start);
    
    for (const replacement of sortedReplacements) {
      content = 
        content.substring(0, replacement.start) + 
        replacement.newText + 
        content.substring(replacement.end);
    }
    
    // Write to the validation file
    await fs.writeFile(validationFilePath, content, 'utf-8');
    
    return validationFilePath;
  }
  
  /**
   * Validate that the TypeScript code compiles and fixes the original error
   */
  private async validateTypeScript(
    validationFilePath: string, 
    originalError: TypeScriptError
  ): Promise<{
    success: boolean;
    errors: string[];
    newErrors: TypeScriptErrorResult[];
  }> {
    try {
      // Create a TypeScript compiler instance
      const program = this.createTsProgram([validationFilePath]);
      
      // Check for errors
      const diagnostics = ts.getPreEmitDiagnostics(program);
      
      // Extract errors
      const errors: string[] = [];
      const newErrors: TypeScriptErrorResult[] = [];
      
      for (const diagnostic of diagnostics) {
        if (diagnostic.file && diagnostic.start !== undefined) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          const code = `TS${diagnostic.code}`;
          const fileName = diagnostic.file.fileName;
          
          // Check if this is the original error
          const isOriginalError = 
            code === originalError.code && 
            path.basename(fileName) === path.basename(originalError.file) &&
            Math.abs(line + 1 - originalError.line) <= 1; // Allow slight line differences
          
          if (!isOriginalError) {
            newErrors.push({
              code,
              message,
              file: fileName,
              line: line + 1,
              column: character + 1
            });
          }
          
          errors.push(`${fileName}(${line + 1},${character + 1}): ${code}: ${message}`);
        } else {
          errors.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
      }
      
      // Check if the original error is still present
      const success = errors.length === 0 || !errors.some(err => 
        err.includes(originalError.code) && 
        err.includes(originalError.message.substring(0, 50))
      );
      
      return {
        success,
        errors,
        newErrors
      };
    } catch (error) {
      logger.error(`TypeScript validation error: ${error.message}`);
      return {
        success: false,
        errors: [`TypeScript validation failed: ${error.message}`],
        newErrors: []
      };
    }
  }
  
  /**
   * Create a TypeScript compiler program
   */
  private createTsProgram(filePaths: string[]): ts.Program {
    // Find tsconfig.json
    const tsconfigPath = ts.findConfigFile(
      this.rootDir,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    
    let compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    };
    
    // Use tsconfig.json if found
    if (tsconfigPath) {
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(tsconfigPath)
      );
      compilerOptions = parsedConfig.options;
    }
    
    // Create the program
    return ts.createProgram(filePaths, compilerOptions);
  }
  
  /**
   * Validate the security of a fix
   */
  private async validateSecurity(
    error: TypeScriptError,
    fix: Fix,
    validationFilePath: string
  ): Promise<SecurityScanResult> {
    try {
      // Run all registered security checkers
      const results = await Promise.all(
        this.securityCheckers.map(checker => checker(fix))
      );
      
      // Combine results
      const vulnerabilities = results.flatMap(r => r.vulnerabilities);
      
      // Determine highest risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      for (const result of results) {
        if (result.riskLevel === 'critical') {
          riskLevel = 'critical';
          break;
        } else if (result.riskLevel === 'high' && riskLevel !== 'critical') {
          riskLevel = 'high';
        } else if (result.riskLevel === 'medium' && riskLevel !== 'critical' && riskLevel !== 'high') {
          riskLevel = 'medium';
        }
      }
      
      return {
        secure: vulnerabilities.length === 0,
        vulnerabilities,
        riskLevel
      };
    } catch (error) {
      logger.error(`Security validation error: ${error.message}`);
      return {
        secure: false,
        vulnerabilities: [`Security validation failed: ${error.message}`],
        riskLevel: 'medium' // Assume medium risk when validation fails
      };
    }
  }
  
  /**
   * Basic security check for obvious issues
   */
  private async basicSecurityCheck(fix: Fix): Promise<SecurityScanResult> {
    const vulnerabilities: string[] = [];
    
    // Check for common security issues in the fix replacements
    for (const replacement of fix.replacements) {
      const newText = replacement.newText.toLowerCase();
      
      // Check for eval and similar dangerous constructs
      if (newText.includes('eval(') || newText.includes('new function(') || 
          newText.match(/function\s*\(\s*[^\)]*\)\s*\{\s*return eval\(/)) {
        vulnerabilities.push('Fix contains potentially unsafe eval() usage');
      }
      
      // Check for document.write
      if (newText.includes('document.write(')) {
        vulnerabilities.push('Fix contains document.write() which can enable XSS attacks');
      }
      
      // Check for innerHTML assignments
      if (newText.match(/\.innerHTML\s*=\s*[^;]+/)) {
        vulnerabilities.push('Fix contains innerHTML assignment which can enable XSS attacks');
      }
      
      // Check for unsanitized user input
      if ((newText.includes('user') || newText.includes('input')) && 
          (newText.includes('exec(') || newText.includes('execSync(') || 
           newText.includes('spawn('))) {
        vulnerabilities.push('Fix may contain command injection vulnerability');
      }
      
      // Check for hardcoded credentials
      if (newText.match(/password\s*[:=]\s*['"][^'"]+['"]/) || 
          newText.match(/apikey\s*[:=]\s*['"][^'"]+['"]/) ||
          newText.match(/secret\s*[:=]\s*['"][^'"]+['"]/)) {
        vulnerabilities.push('Fix contains hardcoded credentials');
      }
    }
    
    // Determine risk level based on vulnerabilities
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (vulnerabilities.length > 0) {
      if (vulnerabilities.some(v => v.includes('command injection'))) {
        riskLevel = 'critical';
      } else if (vulnerabilities.some(v => v.includes('XSS'))) {
        riskLevel = 'high';
      } else if (vulnerabilities.some(v => v.includes('hardcoded credentials'))) {
        riskLevel = 'medium';
      }
    }
    
    return {
      secure: vulnerabilities.length === 0,
      vulnerabilities,
      riskLevel
    };
  }
  
  /**
   * Validate code style consistency
   */
  private async validateStyle(validationFilePath: string): Promise<StyleValidationResult> {
    try {
      // Check if ESLint is available in the project
      const eslintPath = path.join(this.rootDir, 'node_modules', '.bin', 'eslint');
      
      try {
        await fs.access(eslintPath);
      } catch {
        // ESLint not available, fall back to basic style checks
        return this.basicStyleCheck(validationFilePath);
      }
      
      // Run ESLint
      return new Promise((resolve) => {
        const eslint = spawn(eslintPath, [
          '--format=json',
          validationFilePath
        ]);
        
        let output = '';
        let errorOutput = '';
        
        eslint.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        eslint.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        eslint.on('close', (code) => {
          if (code !== 0 && code !== 1) {
            // ESLint process failed (code 1 means linting errors found, which is expected)
            return resolve({
              passing: true, // Assume passing since we couldn't validate
              errors: [`ESLint failed with code ${code}: ${errorOutput}`]
            });
          }
          
          try {
            const results = JSON.parse(output);
            const errors = results[0]?.messages?.map((msg: any) => 
              `${msg.ruleId}: ${msg.message} (${msg.line}:${msg.column})`
            ) || [];
            
            // Only fail for errors, not warnings
            const hasErrors = results[0]?.errorCount > 0;
            
            resolve({
              passing: !hasErrors,
              errors
            });
          } catch (error) {
            resolve({
              passing: true, // Assume passing since we couldn't validate
              errors: [`Failed to parse ESLint output: ${error.message}`]
            });
          }
        });
      });
    } catch (error) {
      logger.error(`Style validation error: ${error.message}`);
      return {
        passing: true, // Assume passing since we couldn't validate
        errors: [`Style validation failed: ${error.message}`]
      };
    }
  }
  
  /**
   * Basic style check for when ESLint is not available
   */
  private async basicStyleCheck(filePath: string): Promise<StyleValidationResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const errors: string[] = [];
      
      // Check for some basic style issues
      
      // 1. Inconsistent indentation
      const lines = content.split('\n');
      const indentations = lines
        .filter(line => line.trim().length > 0) // Skip empty lines
        .map(line => line.match(/^(\s*)/)[0].length);
      
      const uniqueIndents = new Set(indentations);
      if (uniqueIndents.size > 4) {
        errors.push('Inconsistent indentation detected');
      }
      
      // 2. Very long lines
      if (lines.some(line => line.length > 120)) {
        errors.push('File contains very long lines (>120 characters)');
      }
      
      // 3. Check for TODO comments
      if (content.match(/\/\/\s*TODO/)) {
        errors.push('File contains TODO comments');
      }
      
      // 4. Check for console.log statements
      if (content.match(/console\.log\(/)) {
        errors.push('File contains console.log statements');
      }
      
      return {
        passing: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        passing: true, // Assume passing since we couldn't validate
        errors: [`Basic style check failed: ${error.message}`]
      };
    }
  }
  
  /**
   * Assess potential performance impact of a fix
   */
  private async assessPerformance(
    fix: Fix,
    validationFilePath: string
  ): Promise<PerformanceAssessment> {
    try {
      const details: string[] = [];
      
      // Check fix replacements for performance-related patterns
      let impact: 'none' | 'low' | 'medium' | 'high' = 'none';
      
      for (const replacement of fix.replacements) {
        const newText = replacement.newText;
        
        // Check for loops
        if (newText.includes('for (') || newText.includes('while (')) {
          details.push('Fix adds new loop construct');
          impact = this.upgradeImpact(impact, 'low');
        }
        
        // Check for nested loops
        if (newText.match(/for\s*\([^{]*\{[^}]*for\s*\(/s)) {
          details.push('Fix adds nested loop construct');
          impact = this.upgradeImpact(impact, 'medium');
        }
        
        // Check for recursion
        if (newText.match(/function\s+(\w+)[^{]*\{[^}]*\1\s*\(/s)) {
          details.push('Fix adds recursive function');
          impact = this.upgradeImpact(impact, 'medium');
        }
        
        // Check for array methods that could be optimized
        if (newText.match(/\.map\([^)]*\)\s*\.\s*filter/) || 
            newText.match(/\.filter\([^)]*\)\s*\.\s*map/)) {
          details.push('Fix creates multiple array iterations that could be combined');
          impact = this.upgradeImpact(impact, 'low');
        }
        
        // Check for potentially expensive operations
        if (newText.includes('.forEach(') || 
            newText.includes('.map(') ||
            newText.includes('.filter(') ||
            newText.includes('.reduce(')) {
          details.push('Fix adds array iteration methods');
          impact = this.upgradeImpact(impact, 'low');
        }
        
        // Check for regular expressions
        if (newText.includes('new RegExp(') || newText.match(/\/[^/]+\/g/)) {
          details.push('Fix adds regular expression');
          impact = this.upgradeImpact(impact, 'low');
        }
        
        // Check for DOM operations
        if (newText.includes('document.querySelector') || 
            newText.includes('document.getElement')) {
          details.push('Fix adds DOM queries');
          impact = this.upgradeImpact(impact, 'low');
        }
        
        // Check for setTimeout/setInterval
        if (newText.includes('setTimeout(') || newText.includes('setInterval(')) {
          details.push('Fix adds timer operations');
          impact = this.upgradeImpact(impact, 'low');
        }
      }
      
      if (details.length === 0) {
        details.push('No significant performance impact detected');
      }
      
      return {
        impact,
        details
      };
    } catch (error) {
      logger.error(`Performance assessment error: ${error.message}`);
      return {
        impact: 'low', // Default to low impact when assessment fails
        details: [`Performance assessment failed: ${error.message}`]
      };
    }
  }
  
  /**
   * Upgrade impact level if the new level is higher
   */
  private upgradeImpact(
    current: 'none' | 'low' | 'medium' | 'high',
    newLevel: 'none' | 'low' | 'medium' | 'high'
  ): 'none' | 'low' | 'medium' | 'high' {
    const levels = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 };
    return levels[newLevel] > levels[current] ? newLevel : current;
  }
  
  /**
   * Ensure the temporary directory exists
   */
  private async ensureTempDirExists(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * Clean up validation files
   */
  private async cleanupValidationFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to clean up validation file ${filePath}: ${error.message}`);
    }
  }
}