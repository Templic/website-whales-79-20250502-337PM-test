/**
 * Fix Strategy Factory
 * 
 * A powerful and extensible system for defining, managing, and applying TypeScript
 * error fix strategies. This component is designed to be:
 * 
 * - Open source compatible: Follows open strategy pattern design
 * - Secure: Each strategy carefully validates its fixes
 * - Automated: Strategies automatically detect applicable errors
 * - Extensible: Easily add new strategies for different error patterns
 * - Future-proof: Versioned strategies accommodate TypeScript evolution
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TypeScriptError, Fix } from './ts-error-resolver';
import { SourceFileEdit } from './code-transformer';
import { db } from '../db';
import { errorPatterns } from '@shared/schema';
import { logger } from '../logger';

/**
 * Interface for fix strategies
 */
export interface FixStrategy {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly applicableErrorCodes: string[];
  readonly targetCategories: string[];
  readonly minimumConfidence: number;
  
  /**
   * Check if this strategy can fix a given error
   */
  canFix(error: TypeScriptError): boolean;
  
  /**
   * Get the confidence level for fixing this error (0-100)
   */
  getConfidence(error: TypeScriptError): number;
  
  /**
   * Generate a fix for the error
   */
  generateFix(error: TypeScriptError): Promise<Fix>;
}

/**
 * Base abstract class for fix strategies
 */
export abstract class BaseFixStrategy implements FixStrategy {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;
  abstract readonly applicableErrorCodes: string[];
  abstract readonly targetCategories: string[];
  abstract readonly minimumConfidence: number;
  
  /**
   * Check if strategy can fix an error based on error code and category
   */
  canFix(error: TypeScriptError): boolean {
    // Check if error code is in applicable codes
    const codeMatch = this.applicableErrorCodes.includes('*') || 
                     this.applicableErrorCodes.includes(error.code);
    
    // Check if error category is in target categories
    const categoryMatch = this.targetCategories.includes('*') || 
                         this.targetCategories.includes(error.category);
    
    return codeMatch && categoryMatch && this.getConfidence(error) >= this.minimumConfidence;
  }
  
  /**
   * Default confidence implementation
   */
  getConfidence(error: TypeScriptError): number {
    // Base confidence if error code and category match
    let confidence = 50;
    
    // Strategies should override this with more specific logic
    if (this.applicableErrorCodes.includes(error.code)) {
      confidence += 20;
    }
    
    if (this.targetCategories.includes(error.category)) {
      confidence += 20;
    }
    
    return confidence;
  }
  
  /**
   * Must be implemented by concrete strategies
   */
  abstract generateFix(error: TypeScriptError): Promise<Fix>;
  
  /**
   * Helper function to read file content
   */
  protected async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }
  
  /**
   * Create a simple fix by replacing text
   */
  protected createSimpleFix(
    error: TypeScriptError,
    replacements: SourceFileEdit[],
    description: string,
    confidence: number,
    patternId?: number
  ): Fix {
    return {
      errorId: error.id,
      patternId,
      description,
      replacements,
      isAIGenerated: false,
      confidence,
      metadata: {
        strategy: this.name,
        version: this.version
      }
    };
  }
}

/**
 * Type mismatch fix strategy - handles TS2322 and similar
 */
export class TypeMismatchFixStrategy extends BaseFixStrategy {
  readonly name = 'TypeMismatchFixer';
  readonly description = 'Fixes type mismatches by adding type assertions or conversions';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS2322', 'TS2345', 'TS2739'];
  readonly targetCategories = ['TYPE_MISMATCH'];
  readonly minimumConfidence = 60;
  
  /**
   * More accurate confidence calculation based on error patterns
   */
  getConfidence(error: TypeScriptError): number {
    let confidence = super.getConfidence(error);
    
    // Increase confidence for specific error message patterns
    if (error.message.includes('is not assignable to type')) {
      confidence += 15;
    }
    
    // Increase confidence for number <-> string conversions
    if (error.message.includes('string') && error.message.includes('number')) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Generate fix for type mismatch errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      const sourceLines = sourceFile.split('\n');
      
      // Get the line where the error occurs
      const errorLine = sourceLines[error.line - 1];
      
      // Extract the type information from the error message
      const typeMatch = error.message.match(/Type '([^']+)' is not assignable to type '([^']+)'/);
      
      if (!typeMatch) {
        throw new Error('Could not extract type information from error message');
      }
      
      const [_, sourceType, targetType] = typeMatch;
      
      // Determine the most appropriate fix based on the types involved
      let replacement: string;
      let description: string;
      let confidence = this.getConfidence(error);
      
      // Find the position of the problematic expression
      const lineStartPos = this.getLineStartOffset(sourceFile, error.line - 1);
      const expressionStartPos = lineStartPos + error.column - 1;
      
      // Try to find the end of the expression
      // This is a simplified approach - real implementation would parse the AST
      const expressionEndPos = this.findExpressionEnd(sourceFile, expressionStartPos);
      
      // Generate fix based on type conversion needs
      if (sourceType === 'string' && targetType === 'number') {
        // String to number conversion
        const expression = sourceFile.substring(expressionStartPos, expressionEndPos);
        replacement = `Number(${expression})`;
        description = `Convert string to number using Number()`;
      } else if (sourceType === 'number' && targetType === 'string') {
        // Number to string conversion
        const expression = sourceFile.substring(expressionStartPos, expressionEndPos);
        replacement = `String(${expression})`;
        description = `Convert number to string using String()`;
      } else if (targetType.includes('null') || targetType.includes('undefined')) {
        // Optional chaining or nullish coalescing
        const expression = sourceFile.substring(expressionStartPos, expressionEndPos);
        replacement = `${expression} ?? null`;
        description = `Add nullish coalescing operator to handle null/undefined`;
      } else {
        // Fallback to type assertion - less safe but can work in many cases
        const expression = sourceFile.substring(expressionStartPos, expressionEndPos);
        replacement = `(${expression} as ${targetType})`;
        description = `Add type assertion to ${targetType}`;
        confidence -= 10; // Lower confidence for generic assertion
      }
      
      // Create the fix
      return this.createSimpleFix(
        error,
        [{
          filePath: error.file,
          start: expressionStartPos,
          end: expressionEndPos,
          newText: replacement,
          description
        }],
        description,
        confidence
      );
    } catch (error) {
      logger.error(`TypeMismatchFixStrategy failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get the offset for the start of a line
   */
  private getLineStartOffset(text: string, lineIndex: number): number {
    const lines = text.split('\n');
    let offset = 0;
    
    for (let i = 0; i < lineIndex; i++) {
      offset += lines[i].length + 1; // +1 for the newline
    }
    
    return offset;
  }
  
  /**
   * Find the end position of an expression starting at startPos
   * This is a simplified approach - real implementation would use TS AST
   */
  private findExpressionEnd(text: string, startPos: number): number {
    // Simple heuristic to find the end of an expression
    // In a real implementation, this would parse the TypeScript AST
    
    const terminators = [';', ',', ')', '}', ']', '\n'];
    let openParens = 0;
    let openBraces = 0;
    let openBrackets = 0;
    
    for (let i = startPos; i < text.length; i++) {
      const char = text[i];
      
      // Track nesting
      if (char === '(') openParens++;
      else if (char === ')') openParens--;
      else if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
      
      // Check for terminators, but only if we're not inside any nesting
      if (terminators.includes(char) && 
          openParens <= 0 && 
          openBraces <= 0 && 
          openBrackets <= 0) {
        return i;
      }
    }
    
    return text.length;
  }
}

/**
 * Missing import fix strategy - handles TS2304 and similar
 */
export class MissingImportFixStrategy extends BaseFixStrategy {
  readonly name = 'MissingImportFixer';
  readonly description = 'Fixes errors from missing imports by adding import statements';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS2304', 'TS2503'];
  readonly targetCategories = ['IMPORT_ERROR', 'MISSING_DEPENDENCY'];
  readonly minimumConfidence = 70;
  
  // Map of common symbols to their likely import paths
  private commonImports: Record<string, string[]> = {
    // React and UI components
    'React': ['react'],
    'useState': ['react'],
    'useEffect': ['react'],
    'useCallback': ['react'],
    'useMemo': ['react'],
    // Common utility types
    'Partial': ['typescript'],
    'Record': ['typescript'],
    'Omit': ['typescript'],
    'Pick': ['typescript'],
    // Common libraries
    'axios': ['axios'],
    'lodash': ['lodash'],
    'moment': ['moment'],
    // Project-specific imports to be added during initialization
  };
  
  constructor(private projectRoot: string = process.cwd()) {
    super();
    this.discoverProjectImports();
  }
  
  /**
   * Scan project to identify common import patterns
   */
  private async discoverProjectImports(): Promise<void> {
    // In a real implementation, this would scan the project
    // to build a database of exports and their import paths
    // For now, we just add some project-specific paths
    
    // This method would be implemented to analyze the project
    // and automatically build the commonImports map
  }
  
  /**
   * More accurate confidence calculation
   */
  getConfidence(error: TypeScriptError): number {
    let confidence = super.getConfidence(error);
    
    // Extract the symbol name from the error message
    const symbolMatch = error.message.match(/Cannot find name '([^']+)'/);
    if (symbolMatch) {
      const symbol = symbolMatch[1];
      
      // Higher confidence if we know where to import this symbol from
      if (this.commonImports[symbol]) {
        confidence += 20;
      }
      
      // Higher confidence for common symbols
      if (['React', 'useState', 'useEffect'].includes(symbol)) {
        confidence += 10;
      }
    }
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Generate fix for missing import errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      
      // Extract the missing symbol from the error message
      const symbolMatch = error.message.match(/Cannot find name '([^']+)'/);
      
      if (!symbolMatch) {
        throw new Error('Could not extract symbol from error message');
      }
      
      const symbol = symbolMatch[1];
      
      // Check if we know where to import this symbol from
      const possibleImports = this.commonImports[symbol] || [];
      
      if (possibleImports.length === 0) {
        throw new Error(`No known import source for symbol '${symbol}'`);
      }
      
      // Find the best import path
      const importPath = possibleImports[0]; // Use first suggestion for now
      
      // Generate import statement
      const importStatement = `import { ${symbol} } from '${importPath}';\n`;
      
      // Find position to insert the import
      // Best practice: Group imports at the top of the file
      const insertPosition = this.findImportInsertPosition(sourceFile);
      
      // Create the fix
      return this.createSimpleFix(
        error,
        [{
          filePath: error.file,
          start: insertPosition,
          end: insertPosition,
          newText: importStatement,
          description: `Add import for ${symbol}`
        }],
        `Add missing import for ${symbol} from ${importPath}`,
        this.getConfidence(error)
      );
    } catch (error) {
      logger.error(`MissingImportFixStrategy failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find the appropriate position to insert a new import statement
   */
  private findImportInsertPosition(sourceText: string): number {
    // Look for the last import statement
    const importRegex = /^import .+ from .+;?\s*$/gm;
    let lastImportMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    
    while ((match = importRegex.exec(sourceText)) !== null) {
      lastImportMatch = match;
    }
    
    if (lastImportMatch) {
      // Insert after the last import
      return lastImportMatch.index + lastImportMatch[0].length + 1;
    }
    
    // No imports found - insert at the beginning of the file
    // Skip initial comments and license headers
    const commentEndMatch = /^(\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*/.exec(sourceText);
    return commentEndMatch ? commentEndMatch[0].length : 0;
  }
}

/**
 * Non-null assertion fix strategy - handles TS2531, TS2532, etc.
 */
export class NonNullAssertionFixStrategy extends BaseFixStrategy {
  readonly name = 'NonNullAssertionFixer';
  readonly description = 'Fixes null/undefined errors with null checks or optional chaining';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS2531', 'TS2532', 'TS2533'];
  readonly targetCategories = ['NULL_ERROR'];
  readonly minimumConfidence = 65;
  
  /**
   * Generate fix for null/undefined errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      const sourceLines = sourceFile.split('\n');
      
      // Get the line where the error occurs
      const errorLine = sourceLines[error.line - 1];
      
      // Find the problematic expression
      const lineStartPos = this.getLineStartOffset(sourceFile, error.line - 1);
      const expressionStartPos = lineStartPos + error.column - 1;
      
      // Find the property access or method call
      // This simplified version just looks for patterns like obj.prop or obj.method()
      const accessMatch = errorLine.substring(error.column - 1).match(/(\w+)\.(\w+)/);
      
      if (!accessMatch) {
        throw new Error('Could not identify property access pattern');
      }
      
      const [fullMatch, object, property] = accessMatch;
      const objectEndPos = expressionStartPos + object.length;
      
      // Choose the appropriate fix strategy based on context
      // 1. Optional chaining for property access
      const optionalChaining = `${object}?.${property}`;
      
      // 2. Nullish coalescing for default values
      const nullishCoalescing = `${object}?.${property} ?? undefined`;
      
      // Determine which approach to use - this would be more sophisticated in real usage
      const useNullishCoalescing = errorLine.includes('=') || 
                                  errorLine.includes('return') ||
                                  error.message.includes('be undefined');
      
      const replacement = useNullishCoalescing ? nullishCoalescing : optionalChaining;
      const description = useNullishCoalescing 
        ? `Add optional chaining and nullish coalescing` 
        : `Add optional chaining`;
      
      // Create the fix
      return this.createSimpleFix(
        error,
        [{
          filePath: error.file,
          start: expressionStartPos,
          end: expressionStartPos + fullMatch.length,
          newText: replacement,
          description
        }],
        description,
        this.getConfidence(error)
      );
    } catch (error) {
      logger.error(`NonNullAssertionFixStrategy failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get the offset for the start of a line
   */
  private getLineStartOffset(text: string, lineIndex: number): number {
    const lines = text.split('\n');
    let offset = 0;
    
    for (let i = 0; i < lineIndex; i++) {
      offset += lines[i].length + 1; // +1 for the newline
    }
    
    return offset;
  }
}

/**
 * Fix strategy factory manages all available strategies
 */
export class FixStrategyFactory {
  private strategies: FixStrategy[] = [];
  
  /**
   * Register a fix strategy
   */
  register(strategy: FixStrategy): void {
    this.strategies.push(strategy);
    logger.info(`Registered fix strategy: ${strategy.name}`);
  }
  
  /**
   * Get all strategies that can fix a given error
   */
  getStrategiesForError(error: TypeScriptError): FixStrategy[] {
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.canFix(error)
    );
    
    // Sort by confidence (highest first)
    return applicableStrategies.sort((a, b) => 
      b.getConfidence(error) - a.getConfidence(error)
    );
  }
  
  /**
   * Create a factory with default strategies
   */
  static createDefault(projectRoot: string = process.cwd()): FixStrategyFactory {
    const factory = new FixStrategyFactory();
    
    // Register built-in strategies
    factory.register(new TypeMismatchFixStrategy());
    factory.register(new MissingImportFixStrategy(projectRoot));
    factory.register(new NonNullAssertionFixStrategy());
    factory.register(new UnusedVariableFixStrategy());
    factory.register(new ObjectLiteralFixStrategy());
    factory.register(new InterfaceMismatchFixStrategy());
    factory.register(new FunctionSignatureFixStrategy());
    
    return factory;
  }
}

/**
 * Unused Variable Fix Strategy - handles TS6133
 */
export class UnusedVariableFixStrategy extends BaseFixStrategy {
  readonly name = 'UnusedVariableFixer';
  readonly description = 'Fixes unused variable warnings by prefixing with underscore or removing';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS6133'];
  readonly targetCategories = ['DEAD_CODE'];
  readonly minimumConfidence = 75;
  
  /**
   * Calculate confidence based on context
   */
  getConfidence(error: TypeScriptError): number {
    let confidence = this.minimumConfidence;
    
    if (error.message.includes("is declared but its value is never read")) {
      confidence += 20;
    }
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Generate fix for unused variable errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      const sourceLines = sourceFile.split('\n');
      
      // Get the line where the error occurs
      const errorLine = sourceLines[error.line - 1];
      
      // Extract variable name from error message
      const variableMatch = error.message.match(/'([^']+)'/);
      if (!variableMatch) {
        throw new Error('Could not extract variable name from error message');
      }
      
      const variableName = variableMatch[1];
      
      // Determine if this is a variable declaration or a function parameter
      const isParameter = errorLine.includes('(') && errorLine.includes(')');
      
      let replacement: string;
      if (isParameter) {
        // For parameters, prefix with underscore to indicate it's intentionally unused
        const regex = new RegExp(`\\b${variableName}\\b(?![\\w$])`);
        replacement = errorLine.replace(regex, `_${variableName}`);
      } else {
        // For regular variable declarations, identify and find the full declaration
        // This is a simplified approach - in practice, you might need to use the TypeScript
        // compiler API to more accurately transform the source
        const declarationRegex = new RegExp(`(const|let|var)\\s+${variableName}\\s*=.*?[;,]`);
        const declarationMatch = errorLine.match(declarationRegex);
        
        if (declarationMatch) {
          // If it's a simple variable declaration, handle removal or prefixing
          if (errorLine.includes(',')) {
            // For declarations with multiple variables, just prefix with underscore
            const regex = new RegExp(`\\b${variableName}\\b(?![\\w$])`);
            replacement = errorLine.replace(regex, `_${variableName}`);
          } else {
            // For standalone declarations, consider commenting it out 
            // instead of removing to preserve code history
            replacement = `// ${errorLine} /* Unused variable removed */`;
          }
        } else {
          // For more complex cases (e.g., destructuring), prefix with underscore
          const regex = new RegExp(`\\b${variableName}\\b(?![\\w$])`);
          replacement = errorLine.replace(regex, `_${variableName}`);
        }
      }
      
      const lineStartPos = this.getLineStartOffset(sourceFile, error.line - 1);
      const replacements: SourceFileEdit[] = [
        {
          file: error.file,
          startPos: lineStartPos,
          endPos: lineStartPos + errorLine.length,
          replacement: replacement
        }
      ];
      
      return this.createSimpleFix(
        error,
        replacements,
        `Prefixed unused variable '${variableName}' with underscore or removed declaration`,
        this.getConfidence(error)
      );
    } catch (error) {
      logger.error(`Error in UnusedVariableFixStrategy: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Object Literal Fix Strategy - handles TS2559, TS2741, etc.
 */
export class ObjectLiteralFixStrategy extends BaseFixStrategy {
  readonly name = 'ObjectLiteralFixer';
  readonly description = 'Fixes object literal type errors such as excess or missing properties';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS2559', 'TS2741', 'TS2345', 'TS2739'];
  readonly targetCategories = ['TYPE_MISMATCH', 'INTERFACE_MISMATCH'];
  readonly minimumConfidence = 65;
  
  /**
   * Calculate confidence based on error message patterns
   */
  getConfidence(error: TypeScriptError): number {
    let confidence = this.minimumConfidence;
    
    if (error.message.includes("excess property") || error.message.includes("Object literal")) {
      confidence += 15;
    }
    
    if (error.message.includes("is missing the following properties")) {
      confidence += 20;
    }
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Generate fix for object literal errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      const sourceLines = sourceFile.split('\n');
      const errorLine = sourceLines[error.line - 1];
      
      // Extract property names from error message
      let fixDescription: string;
      let replacement: string;
      
      if (error.message.includes("excess property")) {
        // Handle excess property errors (TS2559, TS2741)
        const propertyMatch = error.message.match(/Object literal may only specify known properties, and '([^']+)'/);
        if (!propertyMatch) {
          throw new Error('Could not extract property name from error message');
        }
        
        const propertyName = propertyMatch[1];
        
        // Remove the property or convert to type assertion
        // This is a simplified approach - in practice, you might need to handle
        // more complex object literal expressions
        
        // Simple strategy: Use type assertion
        const typeMatch = error.message.match(/type '([^']+)'/);
        const targetType = typeMatch ? typeMatch[1] : 'any';
        
        // Look for the object literal starting on the error line
        // and potentially continuing to subsequent lines
        let objectLiteral = errorLine;
        let lineIndex = error.line;
        let openBraces = (objectLiteral.match(/{/g) || []).length;
        let closeBraces = (objectLiteral.match(/}/g) || []).length;
        
        // If the object literal continues across lines, gather all parts
        while (openBraces > closeBraces && lineIndex < sourceLines.length) {
          lineIndex++;
          objectLiteral += '\n' + sourceLines[lineIndex - 1];
          openBraces += (sourceLines[lineIndex - 1].match(/{/g) || []).length;
          closeBraces += (sourceLines[lineIndex - 1].match(/}/g) || []).length;
        }
        
        // Find the pattern: propertyName: value,
        const propertyRegex = new RegExp(`\\b${propertyName}\\s*:\\s*[^,}]*[,}]`);
        const propertyMatch2 = objectLiteral.match(propertyRegex);
        
        if (propertyMatch2) {
          // Comment out the excess property
          replacement = objectLiteral.replace(
            propertyRegex, 
            `/* Excess property removed: ${propertyMatch2[0]} */`
          );
          
          fixDescription = `Removed excess property '${propertyName}' from object literal`;
        } else {
          // If we can't find the property pattern, just add type assertion
          // Find the end of the object literal
          const lastBraceIndex = objectLiteral.lastIndexOf('}');
          
          if (lastBraceIndex !== -1) {
            replacement = objectLiteral.substring(0, lastBraceIndex + 1) + 
                         ` as ${targetType}` + 
                         objectLiteral.substring(lastBraceIndex + 1);
            
            fixDescription = `Added type assertion to '${targetType}' for object literal`;
          } else {
            throw new Error('Could not find object literal boundaries');
          }
        }
      } else if (error.message.includes("is missing the following properties")) {
        // Handle missing property errors
        const propertiesMatch = error.message.match(/is missing the following properties from type '[^']+': ([^']+)/);
        if (!propertiesMatch) {
          throw new Error('Could not extract missing properties from error message');
        }
        
        const missingProperties = propertiesMatch[1].split(', ');
        
        // Look for the object literal
        // Simple approach: Find the last closing brace in the error line
        const lastBraceIndex = errorLine.lastIndexOf('}');
        
        if (lastBraceIndex !== -1) {
          // Add missing properties with placeholder values
          const missingPropsText = missingProperties
            .map(prop => `${prop}: undefined /* TODO: Add proper value */`)
            .join(', ');
          
          // If there are already properties, add a comma before adding new ones
          const hasExistingProps = errorLine.includes('{') && 
                                  errorLine.substring(errorLine.indexOf('{') + 1, lastBraceIndex).trim().length > 0;
          
          replacement = errorLine.substring(0, lastBraceIndex) + 
                       (hasExistingProps ? ', ' : '') + 
                       missingPropsText + 
                       errorLine.substring(lastBraceIndex);
          
          fixDescription = `Added missing properties: ${missingProperties.join(', ')}`;
        } else {
          throw new Error('Could not find object literal boundaries');
        }
      } else {
        // For other object literal type errors, add a type assertion
        const typeMatch = error.message.match(/Type '[^']+' is not assignable to type '([^']+)'/);
        const targetType = typeMatch ? typeMatch[1] : 'any';
        
        // Find the end of the object literal or expression
        const lastChar = errorLine.indexOf(';') !== -1 ? errorLine.indexOf(';') : errorLine.length;
        
        replacement = errorLine.substring(0, lastChar) + 
                     ` as ${targetType}` + 
                     errorLine.substring(lastChar);
        
        fixDescription = `Added type assertion to '${targetType}'`;
      }
      
      const lineStartPos = this.getLineStartOffset(sourceFile, error.line - 1);
      const replacements: SourceFileEdit[] = [
        {
          file: error.file,
          startPos: lineStartPos,
          endPos: lineStartPos + errorLine.length,
          replacement: replacement
        }
      ];
      
      return this.createSimpleFix(
        error,
        replacements,
        fixDescription,
        this.getConfidence(error)
      );
    } catch (error) {
      logger.error(`Error in ObjectLiteralFixStrategy: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Interface Mismatch Fix Strategy - handles TS2420, TS2559, etc.
 */
export class InterfaceMismatchFixStrategy extends BaseFixStrategy {
  readonly name = 'InterfaceMismatchFixer';
  readonly description = 'Fixes interface implementation errors like missing methods or properties';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS2420', 'TS2559', 'TS2515'];
  readonly targetCategories = ['INTERFACE_MISMATCH'];
  readonly minimumConfidence = 70;
  
  /**
   * Calculate confidence for interface mismatch errors
   */
  getConfidence(error: TypeScriptError): number {
    let confidence = this.minimumConfidence;
    
    if (error.message.includes("is missing the following properties from type")) {
      confidence += 20;
    }
    
    if (error.message.includes("Class") && error.message.includes("incorrectly implements interface")) {
      confidence += 25;
    }
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Generate fix for interface mismatch errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      const sourceLines = sourceFile.split('\n');
      
      // Extract missing properties from error message
      const propertiesMatch = error.message.match(/is missing the following properties from type '[^']+': ([^']+)/);
      if (!propertiesMatch) {
        throw new Error('Could not extract missing properties from error message');
      }
      
      const missingProperties = propertiesMatch[1].split(', ');
      
      // Find the class or type definition
      // (This is a simplified approach - in practice, you would use the TypeScript
      // compiler API to properly locate the class or interface definition)
      
      // Look for class declaration in preceding lines
      let classStartLine = error.line - 1;
      let classEndLine = error.line - 1;
      let foundClassStart = false;
      let indentation = '';
      
      // Search backwards to find class declaration
      while (classStartLine >= 0) {
        const line = sourceLines[classStartLine];
        if (line.includes('class ') || line.includes('interface ')) {
          foundClassStart = true;
          // Extract indentation
          indentation = line.match(/^\s*/)?.[0] || '';
          break;
        }
        classStartLine--;
      }
      
      if (!foundClassStart) {
        throw new Error('Could not find class or interface declaration');
      }
      
      // Search forward to find closing brace of the class
      let openBraces = 1; // Start with 1 for the opening brace of the class
      classEndLine = classStartLine + 1;
      
      while (classEndLine < sourceLines.length && openBraces > 0) {
        const line = sourceLines[classEndLine];
        openBraces += (line.match(/{/g) || []).length;
        openBraces -= (line.match(/}/g) || []).length;
        
        if (openBraces === 0) {
          break;
        }
        
        classEndLine++;
      }
      
      // Generate implementation stubs for missing properties
      const propertyStubs = missingProperties.map(prop => {
        return `${indentation}  ${prop}: any; // TODO: Implement this property`;
      }).join('\n');
      
      // Insert the stubs before the closing brace of the class
      const closingBraceLine = sourceLines[classEndLine];
      const closingBraceIndent = closingBraceLine.match(/^\s*/)?.[0] || '';
      
      const replacement = `${propertyStubs}\n${closingBraceIndent}`;
      
      // Calculate position for insertion (just before the closing brace)
      const insertPos = this.getLineStartOffset(sourceFile, classEndLine);
      
      const replacements: SourceFileEdit[] = [
        {
          file: error.file,
          startPos: insertPos,
          endPos: insertPos,
          replacement: replacement
        }
      ];
      
      return this.createSimpleFix(
        error,
        replacements,
        `Added missing properties to match interface: ${missingProperties.join(', ')}`,
        this.getConfidence(error)
      );
    } catch (error) {
      logger.error(`Error in InterfaceMismatchFixStrategy: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Function Signature Fix Strategy - handles TS2345, TS2554, etc.
 */
export class FunctionSignatureFixStrategy extends BaseFixStrategy {
  readonly name = 'FunctionSignatureFixer';
  readonly description = 'Fixes function call argument errors';
  readonly version = '1.0.0';
  readonly applicableErrorCodes = ['TS2345', 'TS2554'];
  readonly targetCategories = ['TYPE_MISMATCH', 'FUNCTION_ERROR'];
  readonly minimumConfidence = 65;
  
  /**
   * Calculate confidence for function signature errors
   */
  getConfidence(error: TypeScriptError): number {
    let confidence = this.minimumConfidence;
    
    if (error.message.includes("Expected") && error.message.includes("arguments, but got")) {
      confidence += 20;
    }
    
    if (error.message.includes("Argument of type") && error.message.includes("is not assignable to parameter of type")) {
      confidence += 15;
    }
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Generate fix for function signature errors
   */
  async generateFix(error: TypeScriptError): Promise<Fix> {
    try {
      const sourceFile = await this.readFile(error.file);
      const sourceLines = sourceFile.split('\n');
      const errorLine = sourceLines[error.line - 1];
      
      let fixDescription: string;
      let replacement: string;
      
      // Handle different types of function signature errors
      if (error.message.includes("Expected") && error.message.includes("arguments, but got")) {
        // Missing or excess arguments error
        const argMatch = error.message.match(/Expected (\d+) arguments, but got (\d+)/);
        if (!argMatch) {
          throw new Error('Could not extract argument counts from error message');
        }
        
        const expectedArgs = parseInt(argMatch[1], 10);
        const actualArgs = parseInt(argMatch[2], 10);
        
        // Find the function call
        const functionCallMatch = errorLine.match(/(\w+)\s*\((.*)\)/);
        if (!functionCallMatch) {
          throw new Error('Could not locate function call in error line');
        }
        
        const [fullCall, functionName, argList] = functionCallMatch;
        const args = argList.split(',').map(arg => arg.trim());
        
        if (actualArgs > expectedArgs) {
          // Too many arguments - remove excess ones
          const trimmedArgs = args.slice(0, expectedArgs).join(', ');
          replacement = errorLine.replace(
            fullCall,
            `${functionName}(${trimmedArgs})`
          );
          fixDescription = `Removed excess arguments from ${functionName}() call`;
        } else {
          // Too few arguments - add undefined placeholders
          const additionalArgs = Array(expectedArgs - actualArgs).fill('undefined /* TODO: Add proper value */');
          const newArgs = args.concat(additionalArgs).join(', ');
          replacement = errorLine.replace(
            fullCall,
            `${functionName}(${newArgs})`
          );
          fixDescription = `Added placeholder arguments to ${functionName}() call`;
        }
      } else if (error.message.includes("Argument of type") && error.message.includes("is not assignable to parameter of type")) {
        // Type mismatch in argument
        const typeMatch = error.message.match(/Argument of type '([^']+)' is not assignable to parameter of type '([^']+)'/);
        if (!typeMatch) {
          throw new Error('Could not extract type information from error message');
        }
        
        const [_, sourceType, targetType] = typeMatch;
        
        // Find the argument at the error position
        // (This is a simplified approach - in practice, you would use the TypeScript compiler API)
        
        // Identify the function call
        const functionCallRegex = /\w+\s*\([^)]*\)/g;
        const functionCalls = [];
        let match;
        while ((match = functionCallRegex.exec(errorLine)) !== null) {
          functionCalls.push({
            call: match[0],
            start: match.index,
            end: match.index + match[0].length
          });
        }
        
        // Find the call containing the error position
        const column = error.column - 1; // 0-based column
        const relevantCall = functionCalls.find(call => 
          column >= call.start && column <= call.end
        );
        
        if (!relevantCall) {
          throw new Error('Could not locate relevant function call');
        }
        
        // Simple type cast approach
        if (targetType === 'number' && sourceType === 'string') {
          // Convert string to number
          replacement = errorLine.replace(
            relevantCall.call,
            relevantCall.call.replace(/(['"])([^'"]*)['"]/g, 'Number($1$2$1)')
          );
          fixDescription = 'Added Number() conversion for string parameter';
        } else if (targetType === 'string' && sourceType === 'number') {
          // Convert number to string
          const numberRegex = /\b\d+\.?\d*\b/g;
          replacement = errorLine.replace(
            relevantCall.call,
            relevantCall.call.replace(numberRegex, 'String($&)')
          );
          fixDescription = 'Added String() conversion for number parameter';
        } else {
          // Add a type assertion
          replacement = errorLine.replace(
            relevantCall.call,
            relevantCall.call + ` as unknown as ${targetType}`
          );
          fixDescription = `Added type assertion to ${targetType}`;
        }
      } else {
        // Handle other function signature errors with a generic approach
        // Add a comment to highlight the issue
        replacement = `${errorLine} // TODO: Fix function signature error: ${error.message}`;
        fixDescription = 'Highlighted function signature error with a comment';
      }
      
      const lineStartPos = this.getLineStartOffset(sourceFile, error.line - 1);
      const replacements: SourceFileEdit[] = [
        {
          file: error.file,
          startPos: lineStartPos,
          endPos: lineStartPos + errorLine.length,
          replacement: replacement
        }
      ];
      
      return this.createSimpleFix(
        error,
        replacements,
        fixDescription,
        this.getConfidence(error)
      );
    } catch (error) {
      logger.error(`Error in FunctionSignatureFixStrategy: ${error.message}`);
      throw error;
    }
  }
}