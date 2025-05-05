/**
 * Preventative TypeScript Error Analyzer
 * 
 * This module provides proactive analysis of code to detect potential TypeScript errors
 * before they occur. It's a key component of Phase 4 of the TypeScript Error Management System.
 * 
 * Features:
 * - Code pattern detection for error-prone constructs
 * - Static analysis to identify potential type issues
 * - Risk scoring for different code patterns
 * - Refactoring suggestions to improve type safety
 * - Pre-commit integration capabilities
 * 
 * @module preventative-analyzer
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';
import { typeScriptErrors, errorPatterns } from '@shared/schema';
import { eq, sql, desc, count } from 'drizzle-orm';
import { logger } from '../logger';

// Types for preventative analysis

export interface CodePatternRisk {
  pattern: string;
  risk: 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
  examples: string[];
  frequency: number;
  detectionRegex?: string;
  astPatternType?: string;
}

export interface RiskDetectionResult {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  riskPattern: CodePatternRisk;
  context: string;
  suggestedFix: string;
  confidenceScore: number;
}

export interface FileRiskAnalysis {
  filePath: string;
  overallRiskScore: number;
  detectedRisks: RiskDetectionResult[];
  summary: string;
}

export interface AnalysisOptions {
  includeDirs: string[];
  excludeDirs: string[];
  extensionPatterns?: string[];
  maxFilesToAnalyze?: number;
  onlyHighRisks?: boolean;
  includeExamples?: boolean;
  minConfidence?: number;
}

/**
 * The Preventative Analyzer class
 */
export class PreventativeAnalyzer {
  private riskPatterns: CodePatternRisk[] = [];
  private historicalErrorMap: Map<string, Map<string, number>> = new Map();
  private initialized: boolean = false;
  private defaultCompilerOptions: ts.CompilerOptions;

  constructor() {
    // Set default compiler options for TypeScript parsing
    this.defaultCompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    };
  }

  /**
   * Initialize the analyzer with risk patterns
   */
  public async initialize(): Promise<void> {
    try {
      if (this.initialized) return;
      
      // Load risk patterns
      await this.loadRiskPatterns();
      
      // Load historical error data
      await this.loadHistoricalErrorData();
      
      this.initialized = true;
      logger.info('Preventative Analyzer initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Preventative Analyzer: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Load risk patterns from the database and built-in patterns
   */
  private async loadRiskPatterns(): Promise<void> {
    try {
      // Start with built-in patterns
      this.riskPatterns = this.getBuiltInRiskPatterns();
      
      // Load patterns from database
      const dbPatterns = await db.select({
        id: errorPatterns.id,
        name: errorPatterns.name,
        category: errorPatterns.category,
        errorCode: errorPatterns.error_code,
        description: errorPatterns.description,
        regex: errorPatterns.pattern_match,
        autoFixable: errorPatterns.auto_fixable,
        frequency: sql<number>`(
          SELECT COUNT(*) FROM typescript_errors 
          WHERE pattern_id = ${errorPatterns.id}
        )`
      })
      .from(errorPatterns)
      .where(sql`${errorPatterns.auto_fixable} = true`); // Only fixable patterns are useful for prevention
      
      // Convert database patterns to risk patterns
      for (const pattern of dbPatterns) {
        if (!pattern.regex || !pattern.errorCode) continue;
        
        const risk: 'high' | 'medium' | 'low' = 
          Number(pattern.frequency) > 10 ? 'high' : 
          Number(pattern.frequency) > 5 ? 'medium' : 'low';
        
        this.riskPatterns.push({
          pattern: pattern.name || `Pattern for ${pattern.errorCode}`,
          risk,
          description: pattern.description || `Prevents errors of type ${pattern.errorCode}`,
          suggestedFix: `Apply the fix for ${pattern.errorCode} pattern`,
          examples: [],
          frequency: Number(pattern.frequency),
          detectionRegex: pattern.regex
        });
      }
      
      logger.info(`Loaded ${this.riskPatterns.length} risk patterns`);
    } catch (error) {
      logger.error(`Failed to load risk patterns: ${error instanceof Error ? error.message : String(error)}`);
      this.riskPatterns = this.getBuiltInRiskPatterns(); // Fallback to built-in patterns
    }
  }

  /**
   * Load historical error data to improve risk detection
   */
  private async loadHistoricalErrorData(): Promise<void> {
    try {
      // Clear existing map
      this.historicalErrorMap.clear();
      
      // Get error frequency by file and error code
      const errorFrequency = await db.select({
        filePath: typeScriptErrors.file_path,
        errorCode: typeScriptErrors.code,
        count: sql<number>`COUNT(*)`
      })
      .from(typeScriptErrors)
      .groupBy(typeScriptErrors.file_path, typeScriptErrors.code);
      
      // Build map of file -> error code -> count
      for (const row of errorFrequency) {
        if (!row.filePath || !row.errorCode) continue;
        
        if (!this.historicalErrorMap.has(row.filePath)) {
          this.historicalErrorMap.set(row.filePath, new Map<string, number>());
        }
        
        const fileMap = this.historicalErrorMap.get(row.filePath)!;
        fileMap.set(row.errorCode, Number(row.count));
      }
      
      logger.info(`Loaded historical error data for ${this.historicalErrorMap.size} files`);
    } catch (error) {
      logger.error(`Failed to load historical error data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get built-in risk patterns based on common TypeScript errors
   */
  private getBuiltInRiskPatterns(): CodePatternRisk[] {
    return [
      // Type assertion risks
      {
        pattern: 'Unsafe Type Assertion',
        risk: 'high',
        description: 'Type assertions (using "as") without validation can lead to runtime errors',
        suggestedFix: 'Add type guard or validation before using type assertion',
        examples: [
          'const value = input as string; // Unsafe',
          'const user = data as User; // Without validation'
        ],
        frequency: 25,
        detectionRegex: '\\s+as\\s+\\w+',
        astPatternType: 'AsExpression'
      },
      
      // Null/undefined access risks
      {
        pattern: 'Potential Null Reference',
        risk: 'high',
        description: 'Accessing properties of a potentially null or undefined object',
        suggestedFix: 'Use optional chaining (obj?.prop) or nullish coalescing (obj ?? defaultObj)',
        examples: [
          'const name = user.name; // user might be null',
          'const items = data.items.map(i => i.id); // items might be undefined'
        ],
        frequency: 42,
        detectionRegex: '\\w+\\.(\\w+)(\\.|\\[|\\()',
        astPatternType: 'PropertyAccessExpression'
      },
      
      // Type mismatch risks
      {
        pattern: 'Implicit Any Usage',
        risk: 'medium',
        description: 'Using variables without type annotations can lead to implicit "any" type',
        suggestedFix: 'Add explicit type annotations to variables and function parameters',
        examples: [
          'function process(data) { return data.id; } // data is implicit any',
          'let items = []; // items is implicit any[]'
        ],
        frequency: 33,
        astPatternType: 'VariableDeclaration'
      },
      
      // Interface implementation risks
      {
        pattern: 'Incomplete Interface Implementation',
        risk: 'high',
        description: 'Class implementations missing required interface properties',
        suggestedFix: 'Implement all required properties from the interface',
        examples: [
          'class UserService implements IUserService { /* missing methods */ }',
          'class Component implements IComponent { render() { } /* missing props */ }'
        ],
        frequency: 18,
        astPatternType: 'ClassDeclaration'
      },
      
      // Array access risks
      {
        pattern: 'Unsafe Array Access',
        risk: 'medium',
        description: 'Accessing array elements without checking bounds',
        suggestedFix: 'Check array length before accessing elements or use optional chaining',
        examples: [
          'const firstItem = items[0]; // items might be empty',
          'const value = array[index]; // index might be out of bounds'
        ],
        frequency: 21,
        detectionRegex: '\\w+\\[\\d+\\]',
        astPatternType: 'ElementAccessExpression'
      },
      
      // Promise handling risks
      {
        pattern: 'Unhandled Promise Rejection',
        risk: 'high',
        description: 'Promises without proper error handling can cause silent failures',
        suggestedFix: 'Add .catch() handlers to promises or use try/catch with async/await',
        examples: [
          'fetchData().then(process); // No catch handler',
          'Promise.all(promises).then(handleResults); // No error handling'
        ],
        frequency: 27,
        detectionRegex: '\\.then\\(.*?\\)(?!\\.catch)',
        astPatternType: 'CallExpression'
      },
      
      // Generic risks
      {
        pattern: 'Non-Exhaustive Switch',
        risk: 'medium',
        description: 'Switch statements not handling all enum cases can break when new values are added',
        suggestedFix: 'Add a default case or handle all possible enum values',
        examples: [
          'switch (status) { case "active": /* ... */ case "inactive": /* ... */ } // Missing cases',
          'switch (type) { /* incomplete cases */ }'
        ],
        frequency: 15,
        astPatternType: 'SwitchStatement'
      },
      
      // Event handler risks
      {
        pattern: 'Untyped Event Handlers',
        risk: 'medium',
        description: 'Event handlers without proper typing can lead to errors',
        suggestedFix: 'Add proper type annotations for event parameters',
        examples: [
          'element.addEventListener("click", (e) => { /* e is untyped */ });',
          'function handleChange(e) { const value = e.target.value; /* e is untyped */ }'
        ],
        frequency: 19,
        detectionRegex: '\\((e|event|evt)\\)\\s*=>',
        astPatternType: 'ArrowFunction'
      },
      
      // Type guard risks
      {
        pattern: 'Missing Type Guards',
        risk: 'high',
        description: 'Using type-specific operations without verifying the type first',
        suggestedFix: 'Add type guards before performing operations that expect a specific type',
        examples: [
          'const length = value.length; // value might not have length property',
          'const id = entity.id; // entity might not have id property'
        ],
        frequency: 31,
        astPatternType: 'PropertyAccessExpression'
      },
      
      // Object literal risks
      {
        pattern: 'Object Literal Mismatch',
        risk: 'medium',
        description: 'Object literals not matching their expected interface or type',
        suggestedFix: 'Explicitly type object literals or ensure all required properties are present',
        examples: [
          'const user = { name: "John" }; // Missing required properties?',
          'return { success: true }; // Incomplete return type?'
        ],
        frequency: 24,
        astPatternType: 'ObjectLiteralExpression'
      }
    ];
  }

  /**
   * Analyze files for potential TypeScript errors
   */
  public async analyzeFiles(options: AnalysisOptions): Promise<FileRiskAnalysis[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Find TypeScript files to analyze
      const filePaths = await this.findFilesToAnalyze(
        options.includeDirs, 
        options.excludeDirs, 
        options.extensionPatterns || ['.ts', '.tsx']
      );
      
      logger.info(`Found ${filePaths.length} files to analyze`);
      
      // Apply max files limit if specified
      const filesToAnalyze = options.maxFilesToAnalyze ? 
        filePaths.slice(0, options.maxFilesToAnalyze) : filePaths;
      
      // Analyze each file
      const results: FileRiskAnalysis[] = [];
      
      for (const filePath of filesToAnalyze) {
        try {
          const result = await this.analyzeFile(
            filePath, 
            options.onlyHighRisks || false, 
            options.minConfidence || 0.5
          );
          
          if (result.detectedRisks.length > 0) {
            results.push(result);
          }
        } catch (error) {
          logger.warn(`Failed to analyze file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      logger.info(`Completed analysis of ${filesToAnalyze.length} files. Found risks in ${results.length} files.`);
      
      return results;
    } catch (error) {
      logger.error(`File analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Find TypeScript files to analyze
   */
  private async findFilesToAnalyze(
    includeDirs: string[], 
    excludeDirs: string[], 
    extensions: string[]
  ): Promise<string[]> {
    const filePaths: string[] = [];
    
    // Helper function to check if path should be excluded
    const shouldExclude = (filePath: string): boolean => {
      return excludeDirs.some(dir => filePath.includes(dir)) || 
        filePath.includes('node_modules') || 
        filePath.includes('dist') || 
        filePath.includes('.git');
    };
    
    // Helper function to check file extension
    const hasValidExtension = (filePath: string): boolean => {
      return extensions.some(ext => filePath.endsWith(ext));
    };
    
    // Recursive function to find files
    const findInDir = async (dir: string): Promise<void> => {
      if (shouldExclude(dir)) return;
      
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        
        if (shouldExclude(entryPath)) continue;
        
        if (entry.isDirectory()) {
          await findInDir(entryPath);
        } else if (entry.isFile() && hasValidExtension(entryPath)) {
          filePaths.push(entryPath);
        }
      }
    };
    
    // Search in all include directories
    for (const dir of includeDirs) {
      if (fs.existsSync(dir)) {
        await findInDir(dir);
      }
    }
    
    return filePaths;
  }

  /**
   * Analyze a single file for potential TypeScript errors
   */
  private async analyzeFile(
    filePath: string, 
    onlyHighRisks: boolean, 
    minConfidence: number
  ): Promise<FileRiskAnalysis> {
    try {
      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Parse the file with TypeScript compiler
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        this.defaultCompilerOptions.target || ts.ScriptTarget.ES2020,
        true
      );
      
      // Detect risks using regex-based and AST-based approaches
      const regexRisks = this.detectRegexBasedRisks(filePath, content, minConfidence);
      const astRisks = this.detectAstBasedRisks(filePath, sourceFile, content, minConfidence);
      
      // Merge results
      let allRisks = [...regexRisks, ...astRisks];
      
      // Filter by risk level if required
      if (onlyHighRisks) {
        allRisks = allRisks.filter(risk => risk.riskPattern.risk === 'high');
      }
      
      // Filter by confidence
      allRisks = allRisks.filter(risk => risk.confidenceScore >= minConfidence);
      
      // Sort risks by confidence (highest first)
      allRisks.sort((a, b) => b.confidenceScore - a.confidenceScore);
      
      // Calculate overall risk score (weighted average of risk levels)
      const riskWeights = { high: 1.0, medium: 0.6, low: 0.3 };
      const weightedRiskSum = allRisks.reduce((sum, risk) => {
        const weight = riskWeights[risk.riskPattern.risk];
        return sum + (weight * risk.confidenceScore);
      }, 0);
      
      const overallRiskScore = allRisks.length > 0 ? 
        weightedRiskSum / allRisks.length : 0;
      
      // Generate summary
      const highRisks = allRisks.filter(r => r.riskPattern.risk === 'high').length;
      const mediumRisks = allRisks.filter(r => r.riskPattern.risk === 'medium').length;
      const lowRisks = allRisks.filter(r => r.riskPattern.risk === 'low').length;
      
      const summary = allRisks.length > 0 ?
        `Found ${allRisks.length} potential issues (${highRisks} high, ${mediumRisks} medium, ${lowRisks} low risk).` :
        'No potential issues detected.';
      
      return {
        filePath,
        overallRiskScore,
        detectedRisks: allRisks,
        summary
      };
    } catch (error) {
      logger.error(`Error analyzing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        filePath,
        overallRiskScore: 0,
        detectedRisks: [],
        summary: 'Analysis failed due to error.'
      };
    }
  }

  /**
   * Detect risks using regex patterns
   */
  private detectRegexBasedRisks(
    filePath: string, 
    content: string, 
    minConfidence: number
  ): RiskDetectionResult[] {
    const risks: RiskDetectionResult[] = [];
    const lines = content.split('\n');
    
    // Get risks with regex patterns
    for (const riskPattern of this.riskPatterns) {
      if (!riskPattern.detectionRegex) continue;
      
      try {
        const regex = new RegExp(riskPattern.detectionRegex, 'g');
        
        // Check each line
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let match;
          
          while ((match = regex.exec(line)) !== null) {
            // Skip commented lines
            if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
              continue;
            }
            
            // Get context (surrounding lines)
            const startLine = Math.max(0, i - 1);
            const endLine = Math.min(lines.length - 1, i + 1);
            const context = lines.slice(startLine, endLine + 1).join('\n');
            
            // Calculate confidence score
            const baseConfidence = 0.7; // Base confidence for regex matches
            
            // Adjust confidence based on historical data
            let historyBoost = 0;
            const fileMap = this.historicalErrorMap.get(filePath);
            if (fileMap) {
              // If this file had errors in the past, boost confidence
              historyBoost = 0.1;
              
              // If this file had errors related to this pattern, boost more
              if (riskPattern.pattern.includes('Type Assertion') && fileMap.has('TS2352')) {
                historyBoost += 0.1;
              } else if (riskPattern.pattern.includes('Null Reference') && 
                         (fileMap.has('TS2531') || fileMap.has('TS2532'))) {
                historyBoost += 0.1;
              }
              // Add more pattern-specific boosts as needed
            }
            
            const confidenceScore = Math.min(0.95, baseConfidence + historyBoost);
            
            if (confidenceScore >= minConfidence) {
              risks.push({
                filePath,
                lineNumber: i + 1,
                columnNumber: match.index + 1,
                riskPattern,
                context,
                suggestedFix: riskPattern.suggestedFix,
                confidenceScore
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`Error with regex pattern ${riskPattern.detectionRegex}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return risks;
  }

  /**
   * Detect risks using AST-based analysis
   */
  private detectAstBasedRisks(
    filePath: string, 
    sourceFile: ts.SourceFile, 
    content: string, 
    minConfidence: number
  ): RiskDetectionResult[] {
    const risks: RiskDetectionResult[] = [];
    
    // Get risks with AST patterns
    for (const riskPattern of this.riskPatterns) {
      if (!riskPattern.astPatternType) continue;
      
      try {
        // Visitor function to analyze AST nodes
        const visit = (node: ts.Node) => {
          // Check node type against risk pattern
          if (this.matchesAstPattern(node, riskPattern)) {
            // Get line and column
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            
            // Get context (node text)
            const nodeText = node.getText(sourceFile);
            
            // Calculate confidence based on pattern specifics
            let confidence = 0.6; // Base confidence
            
            // Adjust confidence based on pattern type and node details
            confidence = this.calculateAstPatternConfidence(node, riskPattern, confidence);
            
            // Adjust confidence based on historical data
            const fileMap = this.historicalErrorMap.get(filePath);
            if (fileMap) {
              confidence += 0.1; // Boost if file had errors before
            }
            
            // Cap confidence
            const confidenceScore = Math.min(0.95, confidence);
            
            if (confidenceScore >= minConfidence) {
              // Find the lines for context
              const lines = content.split('\n');
              const startLine = Math.max(0, line - 1);
              const endLine = Math.min(lines.length - 1, line + 1);
              const context = lines.slice(startLine, endLine + 1).join('\n');
              
              risks.push({
                filePath,
                lineNumber: line + 1,
                columnNumber: character + 1,
                riskPattern,
                context,
                suggestedFix: this.generateAstSpecificFix(node, riskPattern, sourceFile),
                confidenceScore
              });
            }
          }
          
          // Continue traversing the AST
          ts.forEachChild(node, visit);
        };
        
        // Start visiting from root
        visit(sourceFile);
      } catch (error) {
        logger.warn(`Error with AST pattern ${riskPattern.astPatternType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return risks;
  }

  /**
   * Check if a node matches an AST pattern
   */
  private matchesAstPattern(node: ts.Node, pattern: CodePatternRisk): boolean {
    switch (pattern.astPatternType) {
      case 'AsExpression':
        return ts.isAsExpression(node);
        
      case 'PropertyAccessExpression':
        if (ts.isPropertyAccessExpression(node)) {
          // Check for potential null reference
          if (pattern.pattern === 'Potential Null Reference') {
            return !this.hasNullCheck(node);
          }
          // Check for missing type guards
          if (pattern.pattern === 'Missing Type Guards') {
            return !this.hasTypeGuard(node);
          }
          return true;
        }
        return false;
        
      case 'VariableDeclaration':
        if (ts.isVariableDeclaration(node)) {
          // Check for implicit any
          return !node.type && pattern.pattern === 'Implicit Any Usage';
        }
        return false;
        
      case 'ClassDeclaration':
        if (ts.isClassDeclaration(node) && node.heritageClauses) {
          // Check for incomplete interface implementation
          return node.heritageClauses.some(clause => 
            clause.token === ts.SyntaxKind.ImplementsKeyword);
        }
        return false;
        
      case 'ElementAccessExpression':
        if (ts.isElementAccessExpression(node)) {
          // Check for unsafe array access
          return !this.hasArrayBoundsCheck(node);
        }
        return false;
        
      case 'CallExpression':
        if (ts.isCallExpression(node)) {
          // Check for unhandled promises
          if (pattern.pattern === 'Unhandled Promise Rejection') {
            return this.isPotentiallyUnhandledPromise(node);
          }
          return false;
        }
        return false;
        
      case 'SwitchStatement':
        if (ts.isSwitchStatement(node)) {
          // Check for non-exhaustive switch
          return this.isPotentiallyNonExhaustiveSwitch(node);
        }
        return false;
        
      case 'ArrowFunction':
        if (ts.isArrowFunction(node)) {
          // Check for untyped event handlers
          return this.isPotentiallyUntypedEventHandler(node);
        }
        return false;
        
      case 'ObjectLiteralExpression':
        if (ts.isObjectLiteralExpression(node)) {
          // Check for object literal mismatch
          return this.isPotentialObjectLiteralMismatch(node);
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Check if a property access has null checking
   */
  private hasNullCheck(node: ts.PropertyAccessExpression): boolean {
    // Check if this is already an optional chain
    if (node.questionDotToken) {
      return true;
    }
    
    // Check for parent nodes that might be doing null checks
    let current: ts.Node = node;
    let parent = current.parent;
    
    while (parent) {
      // Check for conditionals that might be null checks
      if (ts.isBinaryExpression(parent) && 
         (parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          parent.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken ||
          parent.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
          parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
          parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken)) {
        // Check if the expression is comparing the left side of the property access
        if (this.nodeContains(parent.left, node.expression)) {
          return true;
        }
      }
      
      // Check for if statement that might be null checking
      if (ts.isIfStatement(parent) && this.nodeContains(parent.expression, node.expression)) {
        return true;
      }
      
      current = parent;
      parent = current.parent;
    }
    
    return false;
  }

  /**
   * Check if a node contains another node
   */
  private nodeContains(container: ts.Node, target: ts.Node): boolean {
    if (container === target) {
      return true;
    }
    
    let contains = false;
    container.forEachChild(child => {
      if (contains || child === target) {
        contains = true;
      } else {
        contains = contains || this.nodeContains(child, target);
      }
    });
    
    return contains;
  }

  /**
   * Check if a property access has a type guard
   */
  private hasTypeGuard(node: ts.PropertyAccessExpression): boolean {
    // Look for instanceof, typeof, or property checks in parent nodes
    let current: ts.Node = node;
    let parent = current.parent;
    
    while (parent) {
      // Check for instanceof checks
      if (ts.isBinaryExpression(parent) && 
          parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
          this.nodeContains(parent.left, node.expression)) {
        return true;
      }
      
      // Check for typeof checks
      if (ts.isBinaryExpression(parent) && 
          ts.isTypeOfExpression(parent.left) &&
          this.nodeContains(parent.left.expression, node.expression)) {
        return true;
      }
      
      // Check for 'in' property checks
      if (ts.isBinaryExpression(parent) && 
          parent.operatorToken.kind === ts.SyntaxKind.InKeyword &&
          ts.isStringLiteral(parent.right) &&
          this.nodeContains(parent.left, node.expression)) {
        return true;
      }
      
      current = parent;
      parent = current.parent;
    }
    
    return false;
  }

  /**
   * Check if an array access has bounds checking
   */
  private hasArrayBoundsCheck(node: ts.ElementAccessExpression): boolean {
    // Look for length checks before access
    let current: ts.Node = node;
    let parent = current.parent;
    
    while (parent) {
      // Check for binary expressions that might check array length
      if (ts.isBinaryExpression(parent) && 
         (parent.operatorToken.kind === ts.SyntaxKind.LessThanToken ||
          parent.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken) &&
          ts.isPropertyAccessExpression(parent.right) &&
          parent.right.name.text === 'length' &&
          this.nodeContains(parent.right.expression, node.expression)) {
        return true;
      }
      
      // Check for if statement that might check array length
      if (ts.isIfStatement(parent)) {
        // Look for patterns like if (array.length > index)
        if (ts.isBinaryExpression(parent.expression) &&
            ts.isPropertyAccessExpression(parent.expression.left) &&
            parent.expression.left.name.text === 'length' &&
            this.nodeContains(parent.expression.left.expression, node.expression)) {
          return true;
        }
      }
      
      current = parent;
      parent = current.parent;
    }
    
    return false;
  }

  /**
   * Check if a promise might be unhandled
   */
  private isPotentiallyUnhandledPromise(node: ts.CallExpression): boolean {
    // Check if this is a then() call without a catch
    if (ts.isPropertyAccessExpression(node.expression) && 
        node.expression.name.text === 'then') {
      
      // Look for a catch() call after this then()
      let current: ts.Node = node;
      let parent = current.parent;
      let foundCatch = false;
      
      while (parent && !foundCatch) {
        if (ts.isPropertyAccessExpression(parent) && 
            parent.name.text === 'catch' &&
            ts.isCallExpression(parent.parent)) {
          foundCatch = true;
        }
        
        current = parent;
        parent = current.parent;
      }
      
      return !foundCatch;
    }
    
    return false;
  }

  /**
   * Check if a switch statement might be non-exhaustive
   */
  private isPotentiallyNonExhaustiveSwitch(node: ts.SwitchStatement): boolean {
    // Check if there's a default case
    const hasDefault = node.caseBlock.clauses.some(clause => 
      clause.kind === ts.SyntaxKind.DefaultClause);
    
    // If there's a default case, it's exhaustive
    if (hasDefault) {
      return false;
    }
    
    // Otherwise, it might be non-exhaustive
    return true;
  }

  /**
   * Check if an arrow function might be an untyped event handler
   */
  private isPotentiallyUntypedEventHandler(node: ts.ArrowFunction): boolean {
    // Check if this is potentially an event handler
    if (node.parameters.length === 1) {
      const param = node.parameters[0];
      
      // Check if the parameter has a name like e, event, evt but no type annotation
      if (!param.type && 
          ts.isIdentifier(param.name) && 
          ['e', 'event', 'evt'].includes(param.name.text)) {
        
        // Check if it's used as an event parameter in the function body
        let usedAsEvent = false;
        
        const checkBody = (bodyNode: ts.Node) => {
          if (ts.isPropertyAccessExpression(bodyNode) && 
              ts.isIdentifier(bodyNode.expression) && 
              bodyNode.expression.text === param.name.text && 
              ['target', 'currentTarget', 'preventDefault', 'stopPropagation'].includes(bodyNode.name.text)) {
            usedAsEvent = true;
          }
          
          ts.forEachChild(bodyNode, checkBody);
        };
        
        if (node.body) {
          checkBody(node.body);
        }
        
        return usedAsEvent;
      }
    }
    
    return false;
  }

  /**
   * Check if an object literal might have type mismatches
   */
  private isPotentialObjectLiteralMismatch(node: ts.ObjectLiteralExpression): boolean {
    // Check if this object literal is being assigned to a variable or returned
    const parent = node.parent;
    
    // Object literal in variable declaration without explicit type
    if (ts.isVariableDeclaration(parent) && !parent.type) {
      // Object with very few properties is likely incomplete
      return node.properties.length <= 2;
    }
    
    // Object literal in return statement
    if (ts.isReturnStatement(parent)) {
      // Return statement with just a simple object literal might be incomplete
      return true;
    }
    
    // Object literal as argument (might be incomplete for the expected parameter type)
    if (ts.isCallExpression(parent) && parent.arguments.includes(node as ts.Expression)) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate confidence score for AST-based patterns
   */
  private calculateAstPatternConfidence(node: ts.Node, pattern: CodePatternRisk, baseConfidence: number): number {
    let confidence = baseConfidence;
    
    switch (pattern.astPatternType) {
      case 'AsExpression':
        if (ts.isAsExpression(node)) {
          // Higher confidence if casting to a complex type like interface or class
          if (ts.isTypeReferenceNode(node.type) && 
              !['string', 'number', 'boolean', 'any'].includes(node.type.getText())) {
            confidence += 0.2;
          }
        }
        break;
        
      case 'PropertyAccessExpression':
        if (ts.isPropertyAccessExpression(node)) {
          // Higher confidence if accessing nested properties
          if (ts.isPropertyAccessExpression(node.expression)) {
            confidence += 0.1;
          }
        }
        break;
        
      case 'VariableDeclaration':
        if (ts.isVariableDeclaration(node)) {
          // Higher confidence if initializing with a complex expression
          if (node.initializer && (
              ts.isCallExpression(node.initializer) || 
              ts.isObjectLiteralExpression(node.initializer) ||
              ts.isArrayLiteralExpression(node.initializer))) {
            confidence += 0.15;
          }
        }
        break;
        
      case 'ClassDeclaration':
        if (ts.isClassDeclaration(node) && node.heritageClauses) {
          // Higher confidence if implementing multiple interfaces
          const implementsClauses = node.heritageClauses.filter(clause => 
            clause.token === ts.SyntaxKind.ImplementsKeyword);
            
          if (implementsClauses.length > 0 && 
              implementsClauses[0].types.length > 1) {
            confidence += 0.1;
          }
        }
        break;
        
      case 'ElementAccessExpression':
        if (ts.isElementAccessExpression(node)) {
          // Higher confidence if using variable as index
          if (!ts.isNumericLiteral(node.argumentExpression)) {
            confidence += 0.2;
          }
        }
        break;
        
      case 'CallExpression':
        if (ts.isCallExpression(node) && 
            ts.isPropertyAccessExpression(node.expression) && 
            node.expression.name.text === 'then') {
          // Higher confidence for promises with complex chains
          confidence += 0.1;
        }
        break;
        
      case 'SwitchStatement':
        if (ts.isSwitchStatement(node)) {
          // Higher confidence if there are few cases compared to potential enum values
          const caseCount = node.caseBlock.clauses.filter(clause => 
            clause.kind === ts.SyntaxKind.CaseClause).length;
            
          if (caseCount <= 2) {
            confidence += 0.2;
          }
        }
        break;
        
      case 'ArrowFunction':
        if (ts.isArrowFunction(node) && node.parameters.length === 1) {
          // Higher confidence if parameter is used as event in the body
          confidence += 0.1;
        }
        break;
        
      case 'ObjectLiteralExpression':
        if (ts.isObjectLiteralExpression(node)) {
          // Higher confidence if used in assignment context
          if (ts.isVariableDeclaration(node.parent) || 
              ts.isPropertyAssignment(node.parent)) {
            confidence += 0.1;
          }
        }
        break;
    }
    
    return confidence;
  }

  /**
   * Generate a specific fix suggestion based on the AST node and risk pattern
   */
  private generateAstSpecificFix(node: ts.Node, pattern: CodePatternRisk, sourceFile: ts.SourceFile): string {
    let specificFix = pattern.suggestedFix;
    
    switch (pattern.astPatternType) {
      case 'AsExpression':
        if (ts.isAsExpression(node)) {
          const expr = node.expression.getText(sourceFile);
          const type = node.type.getText(sourceFile);
          specificFix = `Use type guard: if (is${type}(${expr})) { /* use ${expr} as ${type} */ }`;
        }
        break;
        
      case 'PropertyAccessExpression':
        if (ts.isPropertyAccessExpression(node)) {
          const obj = node.expression.getText(sourceFile);
          const prop = node.name.text;
          
          if (pattern.pattern === 'Potential Null Reference') {
            specificFix = `Use optional chaining: ${obj}?.${prop}`;
          } else if (pattern.pattern === 'Missing Type Guards') {
            specificFix = `Add type guard: if (${obj} && typeof ${obj}.${prop} !== 'undefined') { /* use ${obj}.${prop} */ }`;
          }
        }
        break;
        
      case 'VariableDeclaration':
        if (ts.isVariableDeclaration(node)) {
          const name = node.name.getText(sourceFile);
          let type = 'any';
          
          if (node.initializer) {
            if (ts.isStringLiteral(node.initializer)) {
              type = 'string';
            } else if (ts.isNumericLiteral(node.initializer)) {
              type = 'number';
            } else if (node.initializer.kind === ts.SyntaxKind.TrueKeyword || 
                      node.initializer.kind === ts.SyntaxKind.FalseKeyword) {
              type = 'boolean';
            } else if (ts.isArrayLiteralExpression(node.initializer)) {
              type = 'any[]';
            } else if (ts.isObjectLiteralExpression(node.initializer)) {
              type = 'Record<string, unknown>';
            }
          }
          
          specificFix = `Add type annotation: const ${name}: ${type} = ...`;
        }
        break;
        
      case 'ElementAccessExpression':
        if (ts.isElementAccessExpression(node)) {
          const arr = node.expression.getText(sourceFile);
          const idx = node.argumentExpression.getText(sourceFile);
          specificFix = `Add bounds check: if (${idx} < ${arr}.length) { /* use ${arr}[${idx}] */ }`;
        }
        break;
        
      case 'CallExpression':
        if (ts.isCallExpression(node) && 
            ts.isPropertyAccessExpression(node.expression) && 
            node.expression.name.text === 'then') {
          const promise = node.expression.expression.getText(sourceFile);
          specificFix = `Add catch handler: ${promise}.then(...).catch(error => { /* handle error */ })`;
        }
        break;
        
      case 'SwitchStatement':
        if (ts.isSwitchStatement(node)) {
          specificFix = `Add default case: switch (...) { /* cases */ default: { /* handle unexpected values */ } }`;
        }
        break;
        
      case 'ArrowFunction':
        if (ts.isArrowFunction(node) && node.parameters.length === 1) {
          const param = node.parameters[0].getText(sourceFile);
          specificFix = `Add event type: (${param}: React.MouseEvent<HTMLElement>) => { ... }`;
        }
        break;
        
      case 'ObjectLiteralExpression':
        if (ts.isObjectLiteralExpression(node)) {
          specificFix = `Add explicit type: const obj: YourType = { /* properties */ }`;
        }
        break;
    }
    
    return specificFix;
  }

  /**
   * Analyze a specific file outside the bulk analysis
   */
  public async analyzeSpecificFile(filePath: string): Promise<FileRiskAnalysis> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      return await this.analyzeFile(filePath, false, 0.5);
    } catch (error) {
      logger.error(`Error analyzing specific file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        filePath,
        overallRiskScore: 0,
        detectedRisks: [],
        summary: 'Analysis failed due to error.'
      };
    }
  }

  /**
   * Generate refactoring suggestions to improve code quality
   */
  public generateRefactoringSuggestions(analysis: FileRiskAnalysis): string[] {
    const suggestions: string[] = [];
    
    // Group risks by pattern
    const risksByPattern: Record<string, RiskDetectionResult[]> = {};
    
    for (const risk of analysis.detectedRisks) {
      const pattern = risk.riskPattern.pattern;
      if (!risksByPattern[pattern]) {
        risksByPattern[pattern] = [];
      }
      risksByPattern[pattern].push(risk);
    }
    
    // Generate suggestions based on risk patterns
    for (const [pattern, risks] of Object.entries(risksByPattern)) {
      if (risks.length > 0) {
        const firstRisk = risks[0];
        
        // Add pattern-specific suggestions
        switch (firstRisk.riskPattern.pattern) {
          case 'Unsafe Type Assertion':
            suggestions.push('Replace type assertions with proper type guards');
            if (risks.length > 2) {
              suggestions.push('Consider creating reusable type guards for common types');
            }
            break;
            
          case 'Potential Null Reference':
            suggestions.push('Use optional chaining (?.) throughout the codebase');
            if (risks.length > 3) {
              suggestions.push('Add null checks at function boundaries');
            }
            break;
            
          case 'Implicit Any Usage':
            suggestions.push('Enable strict mode in tsconfig.json');
            suggestions.push('Add explicit type annotations to all variables and function parameters');
            break;
            
          case 'Incomplete Interface Implementation':
            suggestions.push('Implement all required methods and properties from interfaces');
            suggestions.push('Consider using abstract classes instead of interfaces for complex implementations');
            break;
            
          case 'Unsafe Array Access':
            suggestions.push('Add array bounds checks before accessing elements');
            suggestions.push('Use array methods like .find() or .filter() instead of direct indexing');
            break;
            
          case 'Unhandled Promise Rejection':
            suggestions.push('Add catch handlers to all promise chains');
            suggestions.push('Consider using async/await with try/catch for better error handling');
            break;
            
          case 'Non-Exhaustive Switch':
            suggestions.push('Add default cases to all switch statements');
            suggestions.push('Consider using TypeScript\'s exhaustiveness checking with never type');
            break;
            
          case 'Untyped Event Handlers':
            suggestions.push('Add proper type annotations for all event handlers');
            suggestions.push('Create type definitions for common event types in your application');
            break;
            
          case 'Missing Type Guards':
            suggestions.push('Add type guards before performing operations on objects of uncertain type');
            if (risks.length > 2) {
              suggestions.push('Create reusable type guard functions for common types');
            }
            break;
            
          case 'Object Literal Mismatch':
            suggestions.push('Add explicit type annotations for object literals');
            suggestions.push('Create interfaces or type aliases for common object structures');
            break;
            
          default:
            suggestions.push(`Address ${risks.length} instances of ${pattern}`);
        }
      }
    }
    
    // Add general suggestions based on overall risk score
    if (analysis.overallRiskScore > 0.7) {
      suggestions.unshift('Consider a comprehensive refactoring of this file to improve type safety');
    } else if (analysis.overallRiskScore > 0.4) {
      suggestions.unshift('Address high-risk issues in this file as a priority');
    }
    
    // If there are too many risks, suggest breaking down the file
    if (analysis.detectedRisks.length > 10) {
      suggestions.push('Consider breaking this file into smaller, more focused modules');
    }
    
    return suggestions;
  }
}

// Export a singleton instance
export const preventativeAnalyzer = new PreventativeAnalyzer();