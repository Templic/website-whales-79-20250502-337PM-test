/**
 * @file openai-integration.ts
 * @description OpenAI integration for TypeScript error analysis and fix generation
 * 
 * This module provides AI-powered analysis and fix generation for TypeScript errors
 * using OpenAI's language models with rich code context awareness.
 */

import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { TypeScriptError, ErrorCategory, ErrorSeverity, ErrorFix } from '../types/core/error-types';
import { findTypeScriptFiles } from './ts-type-analyzer';

// Use the newest "gpt-4o" model which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache for API responses to reduce API calls
const responseCache = new Map<string, any>();

/**
 * Analyzes a TypeScript error using OpenAI
 * @param error The TypeScript error to analyze
 * @returns An analysis of the error with root cause, category, severity, and whether it's likely to cause cascading errors
 */
export async function analyzeError(
  error: TypeScriptError
): Promise<{
  rootCause: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  cascading: boolean;
  explanation: string;
}> {
  try {
    // Check cache first
    const cacheKey = `analyze:${error.id}:${error.errorCode}:${error.filePath}:${error.lineNumber}:${error.columnNumber}`;
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }

    const errorContext = await generateErrorContext(error);
    const projectContext = await generateFileContext(error.filePath);

    const prompt = `
      You are a TypeScript expert analyzing a code error. Given the following error:

      ERROR:
      ${error.errorMessage}

      CODE CONTEXT:
      ${errorContext}

      PROJECT CONTEXT:
      ${projectContext}

      Analyze this error and provide:
      1. The root cause of the error
      2. The category of error (type_mismatch, missing_type, undefined_variable, null_reference, interface_mismatch, import_error, syntax_error, generic_constraint, declaration_error, other)
      3. The severity of the error (critical, high, medium, low)
      4. Whether this error is likely to cause cascading errors

      FORMAT YOUR RESPONSE AS JSON:
      {
        "rootCause": "string",
        "category": "string",
        "severity": "string",
        "cascading": boolean,
        "explanation": "string"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Store in cache
    responseCache.set(cacheKey, analysis);
    
    return {
      rootCause: analysis.rootCause,
      category: analysis.category as ErrorCategory,
      severity: analysis.severity as ErrorSeverity,
      cascading: analysis.cascading,
      explanation: analysis.explanation,
    };
  } catch (error) {
    console.error("Error analyzing TypeScript error with OpenAI:", error);
    
    // Fallback to simpler analysis
    return {
      rootCause: "Unknown - OpenAI analysis failed",
      category: "other",
      severity: "medium",
      cascading: false,
      explanation: "Analysis failed. Please try again or analyze manually.",
    };
  }
}

/**
 * Generates a fix for a TypeScript error using OpenAI
 * @param error The TypeScript error to fix
 * @returns A fix for the error with code, explanation, and confidence
 */
export async function generateErrorFix(
  error: TypeScriptError
): Promise<{
  fixCode: string;
  fixExplanation: string;
  fixScope: "line" | "token" | "custom";
  originalCode?: string;
  confidence: number;
  additionalRecommendations: string;
}> {
  try {
    // Check cache first
    const cacheKey = `fix:${error.id}:${error.errorCode}:${error.filePath}:${error.lineNumber}:${error.columnNumber}`;
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }
    
    const errorContext = await generateErrorContext(error, 20); // Get 20 lines of context
    const styleGuide = await getProjectStyleGuide();
    const fileImports = await getFileImports(error.filePath);
    const referencedTypes = await findReferencedTypes(error.filePath, errorContext);

    const prompt = `
      You are a TypeScript expert fixing a code error. Given the following error:

      ERROR:
      ${error.errorMessage}

      CODE TO FIX:
      ${errorContext}

      PROJECT STYLE GUIDE:
      ${styleGuide}

      FILE IMPORTS:
      ${fileImports}

      RELATED TYPES:
      ${referencedTypes}

      Generate a fix for this error that:
      1. Maintains the intended functionality
      2. Follows the project's style guide
      3. Uses existing imports where possible
      4. Explains the rationale for the fix

      Specify the scope of your fix (choose one):
      - "line": if your fix replaces the entire line with the error
      - "token": if your fix replaces just the token at the error position
      - "custom": if your fix requires replacing a specific code section

      If using "custom", include the exact code to replace in originalCode.

      FORMAT YOUR RESPONSE AS JSON:
      {
        "fixCode": "string",
        "fixExplanation": "string",
        "fixScope": "line" | "token" | "custom",
        "originalCode": "string (required for custom scope)",
        "confidence": number,
        "additionalRecommendations": "string"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const fix = JSON.parse(response.choices[0].message.content);
    
    // Store in cache
    responseCache.set(cacheKey, fix);
    
    return fix;
  } catch (error) {
    console.error("Error generating fix with OpenAI:", error);
    
    // Fallback to empty response
    return {
      fixCode: "",
      fixExplanation: "Fix generation failed. Please try again or fix manually.",
      fixScope: "line",
      confidence: 0,
      additionalRecommendations: "",
    };
  }
}

/**
 * Analyzes a group of TypeScript errors to determine optimal fix ordering and grouping
 * @param errors List of TypeScript errors to analyze
 * @returns Optimal fix order and error groupings
 */
export async function analyzeBatchErrors(
  errors: TypeScriptError[]
): Promise<{
  fixOrder: string[];
  errorGroups: string[][];
  sharedFixGroups: string[][];
}> {
  try {
    // Generate a cache key based on the error IDs
    const errorIds = errors.map(e => e.id).sort().join(',');
    const cacheKey = `batch:${errorIds}`;
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }
    
    const errorsList = errors.map(e => 
      `[${e.id}] ${e.filePath}:${e.lineNumber}:${e.columnNumber} - ${e.errorMessage}`
    ).join("\n");

    const fileDependencies = await generateFileDependencyGraph(
      [...new Set(errors.map(e => e.filePath))]
    );

    const prompt = `
      You are a TypeScript expert prioritizing errors. Given the following list of errors:

      ${errorsList}

      DEPENDENCIES BETWEEN FILES:
      ${fileDependencies}

      Analyze these errors and provide:
      1. The optimal order to fix them to minimize cascading issues
      2. Errors that likely share the same root cause
      3. Errors that can be fixed with the same solution

      FORMAT YOUR RESPONSE AS JSON:
      {
        "fixOrder": ["string"],
        "errorGroups": [["string"]],
        "sharedFixGroups": [["string"]]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Store in cache
    responseCache.set(cacheKey, analysis);
    
    return analysis;
  } catch (error) {
    console.error("Error analyzing batch errors with OpenAI:", error);
    
    // Fallback to sequential fix order
    return {
      fixOrder: errors.map(e => e.id.toString()),
      errorGroups: [],
      sharedFixGroups: [],
    };
  }
}

/**
 * Generates missing type definitions using OpenAI
 * @param filePath The file path
 * @param typeName The name of the missing type
 * @returns A type definition for the missing type
 */
export async function generateMissingTypeDefinition(
  filePath: string,
  typeName: string
): Promise<string> {
  try {
    // Check cache first
    const cacheKey = `type:${filePath}:${typeName}`;
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const usageExamples = extractTypeUsage(fileContent, typeName);

    const prompt = `
      You are a TypeScript expert creating a missing type definition. I need you to create a TypeScript interface or type for "${typeName}" based on how it's used in the code.

      FILE PATH:
      ${filePath}

      USAGE EXAMPLES:
      ${usageExamples}

      Create a comprehensive type definition that matches all the observed usages. Include JSDoc comments.

      FORMAT YOUR RESPONSE AS THE TYPE DEFINITION ONLY, WITHOUT ANY EXPLANATION OR MARKDOWN:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const typeDefinition = response.choices[0].message.content.trim();
    
    // Store in cache
    responseCache.set(cacheKey, typeDefinition);
    
    return typeDefinition;
  } catch (error) {
    console.error("Error generating type definition with OpenAI:", error);
    
    // Fallback to a basic interface
    return `/**
 * ${typeName} interface
 * TODO: Fill in the properties for this interface
 */
export interface ${typeName} {
  // Add properties here
}`;
  }
}

/**
 * Analyzes code style across the project
 * @returns A style guide extracted from the project
 */
export async function analyzeCodeStyle(): Promise<string> {
  try {
    // Check cache first
    const cacheKey = 'codeStyle';
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }
    
    // Find TypeScript files
    const files = await findTypeScriptFiles('.');
    
    // Sample a subset of files
    const sampleSize = Math.min(10, files.length);
    const sampledFiles = files
      .sort(() => 0.5 - Math.random()) // Shuffle array
      .slice(0, sampleSize);
    
    // Extract code samples
    const codeSamples = [];
    for (const file of sampledFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const sample = content.slice(0, 2000); // First 2000 characters
        codeSamples.push(sample);
      }
    }

    const prompt = `
      You are a TypeScript style analyzer. Analyze these code samples from a project and extract a style guide.

      CODE SAMPLES:
      ${codeSamples.join('\n\n--- Next Sample ---\n\n')}

      Extract style guidelines covering:
      1. Indentation (spaces vs tabs, amount)
      2. Naming conventions (camelCase, PascalCase, etc. for different types)
      3. Import style (single vs multiple imports, sorting)
      4. Type annotations (when used, format)
      5. Commenting style
      6. Use of semicolons
      7. Quote style (single vs double)
      8. Other notable patterns

      FORMAT YOUR RESPONSE AS MARKDOWN:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const styleGuide = response.choices[0].message.content.trim();
    
    // Store in cache
    responseCache.set(cacheKey, styleGuide);
    
    return styleGuide;
  } catch (error) {
    console.error("Error analyzing code style with OpenAI:", error);
    
    // Fallback to a basic style guide
    return `# TypeScript Style Guide
- Use 2 spaces for indentation
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use single quotes for strings
- Use semicolons at the end of statements
- Add type annotations for function parameters and return types
- Sort imports alphabetically
- Add JSDoc comments for public APIs`;
  }
}

/**
 * Generates context around a TypeScript error
 * @param error The TypeScript error
 * @param contextLines Number of context lines to include
 * @returns Context around the error
 */
export async function generateErrorContext(
  error: TypeScriptError,
  contextLines: number = 10
): Promise<string> {
  try {
    if (!fs.existsSync(error.filePath)) {
      return `File ${error.filePath} does not exist`;
    }
    
    const fileContent = fs.readFileSync(error.filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Calculate start and end lines for context
    const startLine = Math.max(0, error.lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length - 1, error.lineNumber + contextLines - 1);
    
    // Extract the context lines
    const contextLinesArr = lines.slice(startLine, endLine + 1);
    
    // Add line numbers and mark the error line
    const contextWithLineNumbers = contextLinesArr.map((line, index) => {
      const lineNumber = startLine + index + 1;
      const marker = lineNumber === error.lineNumber ? '> ' : '  ';
      return `${marker}${lineNumber}: ${line}`;
    }).join('\n');
    
    return contextWithLineNumbers;
  } catch (error) {
    console.error("Error generating error context:", error);
    return "Error generating context";
  }
}

/**
 * Generates context about a file from the project
 * @param filePath Path to the file
 * @returns Context about the file
 */
export async function generateFileContext(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      return `File ${filePath} does not exist`;
    }
    
    // Get import information
    const imports = await getFileImports(filePath);
    
    // Get file type information
    const fileInfo = await getFileTypeInfo(filePath);
    
    return `
File: ${path.basename(filePath)}
Path: ${filePath}

Imports:
${imports}

Type Information:
${fileInfo}
`.trim();
  } catch (error) {
    console.error("Error generating file context:", error);
    return "Error generating file context";
  }
}

/**
 * Gets import statements from a file
 * @param filePath Path to the file
 * @returns Import statements in the file
 */
export async function getFileImports(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      return `File ${filePath} does not exist`;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    const imports: string[] = [];
    
    // Find import declarations
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node)) {
        imports.push(node.getText(sourceFile));
      }
    });
    
    return imports.join('\n');
  } catch (error) {
    console.error("Error getting file imports:", error);
    return "Error getting import statements";
  }
}

/**
 * Gets type information from a file
 * @param filePath Path to the file
 * @returns Type information in the file
 */
async function getFileTypeInfo(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      return `File ${filePath} does not exist`;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    const typeInfo: string[] = [];
    
    // Find type declarations
    ts.forEachChild(sourceFile, node => {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        typeInfo.push(node.getText(sourceFile));
      }
    });
    
    return typeInfo.join('\n\n');
  } catch (error) {
    console.error("Error getting file type info:", error);
    return "Error getting type information";
  }
}

/**
 * Finds referenced types in code context
 * @param filePath Path to the file
 * @param context Code context
 * @returns Type definitions for referenced types
 */
async function findReferencedTypes(filePath: string, context: string): Promise<string> {
  try {
    // Simple regex-based extraction of potentially referenced types
    const typeRegex = /\b([A-Z][a-zA-Z0-9]*)(\[\])?(?=\s*[,>);\[\]\{\}])/g;
    const matches = context.match(typeRegex) || [];
    const typeNames = Array.from(new Set(matches)).filter(name => 
      // Exclude built-in types and likely non-types
      !['String', 'Number', 'Boolean', 'Array', 'Object', 'Function', 'Symbol', 'Map', 'Set', 'Promise', 'Date'].includes(name)
    );
    
    // Look for these types in the project files
    const typeDefinitions: string[] = [];
    const tsFiles = await findTypeScriptFiles(path.dirname(filePath));
    
    for (const tsFile of tsFiles) {
      if (fs.existsSync(tsFile)) {
        const fileContent = fs.readFileSync(tsFile, 'utf-8');
        const sourceFile = ts.createSourceFile(
          tsFile,
          fileContent,
          ts.ScriptTarget.Latest,
          true
        );
        
        // Check for type definitions
        ts.forEachChild(sourceFile, node => {
          if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.name) {
            const name = node.name.text;
            if (typeNames.includes(name)) {
              typeDefinitions.push(`// From ${tsFile}:\n${node.getText(sourceFile)}`);
            }
          }
        });
      }
    }
    
    return typeDefinitions.join('\n\n');
  } catch (error) {
    console.error("Error finding referenced types:", error);
    return "Error finding referenced types";
  }
}

/**
 * Extracts usage examples of a type from code
 * @param fileContent Content of the file
 * @param typeName Name of the type
 * @returns Usage examples of the type
 */
function extractTypeUsage(fileContent: string, typeName: string): string {
  try {
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    const usage: string[] = [];
    
    // Helper function to check if a node might be using the type
    const checkNode = (node: ts.Node) => {
      // Check for variable declarations with the type
      if (ts.isVariableDeclaration(node) && node.type && 
          node.type.getText(sourceFile).includes(typeName)) {
        usage.push(node.getText(sourceFile));
      }
      
      // Check for property access on the type
      if (ts.isPropertyAccessExpression(node) && 
          node.expression.getText(sourceFile) === typeName) {
        // Get the containing statement
        let parent = node.parent;
        while (parent && !ts.isExpressionStatement(parent) && 
               !ts.isVariableStatement(parent) && 
               !ts.isReturnStatement(parent)) {
          parent = parent.parent;
        }
        if (parent) {
          usage.push(parent.getText(sourceFile));
        }
      }
      
      // Check for function parameters with the type
      if (ts.isParameter(node) && node.type && 
          node.type.getText(sourceFile).includes(typeName)) {
        const functionNode = node.parent;
        if (functionNode) {
          usage.push(functionNode.getText(sourceFile));
        }
      }
      
      ts.forEachChild(node, checkNode);
    };
    
    ts.forEachChild(sourceFile, checkNode);
    
    return usage.join('\n\n');
  } catch (error) {
    console.error("Error extracting type usage:", error);
    return "Error extracting type usage";
  }
}

/**
 * Generates a dependency graph for files
 * @param filePaths List of file paths
 * @returns Dependency graph as text
 */
async function generateFileDependencyGraph(filePaths: string[]): Promise<string> {
  try {
    const graph: Record<string, string[]> = {};
    
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        continue;
      }
      
      graph[filePath] = [];
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Find import declarations
      ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node) && node.moduleSpecifier && 
            ts.isStringLiteral(node.moduleSpecifier)) {
          const importPath = node.moduleSpecifier.text;
          
          // Handle relative imports
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolvedPath = path.resolve(path.dirname(filePath), importPath);
            
            // Add file extensions if missing
            let fullPath = resolvedPath;
            if (!path.extname(resolvedPath)) {
              for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
                if (fs.existsSync(resolvedPath + ext)) {
                  fullPath = resolvedPath + ext;
                  break;
                }
              }
            }
            
            if (filePaths.includes(fullPath)) {
              graph[filePath].push(fullPath);
            }
          }
        }
      });
    }
    
    // Convert to text representation
    return Object.entries(graph)
      .map(([file, deps]) => {
        const fileName = path.basename(file);
        const depNames = deps.map(dep => path.basename(dep));
        return `${fileName} -> ${depNames.join(', ') || 'No dependencies'}`;
      })
      .join('\n');
  } catch (error) {
    console.error("Error generating file dependency graph:", error);
    return "Error generating file dependencies";
  }
}

/**
 * Gets the project style guide
 * @returns The project style guide
 */
export async function getProjectStyleGuide(): Promise<string> {
  try {
    // Check cache first
    const cacheKey = 'styleGuide';
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey);
    }
    
    // Check if there's a pre-defined style guide
    const styleGuidePaths = [
      './.eslintrc.js',
      './.eslintrc.json',
      './.prettierrc',
      './tslint.json',
    ];
    
    for (const guidePath of styleGuidePaths) {
      if (fs.existsSync(guidePath)) {
        const content = fs.readFileSync(guidePath, 'utf-8');
        responseCache.set(cacheKey, content);
        return content;
      }
    }
    
    // If no pre-defined style guide, analyze the code style
    const styleGuide = await analyzeCodeStyle();
    responseCache.set(cacheKey, styleGuide);
    return styleGuide;
  } catch (error) {
    console.error("Error getting project style guide:", error);
    return "Error getting style guide";
  }
}

/**
 * Clears the response cache
 */
export function clearResponseCache(): void {
  responseCache.clear();
}

/**
 * Gets the size of the response cache
 * @returns The number of cached responses
 */
export function getResponseCacheSize(): number {
  return responseCache.size;
}