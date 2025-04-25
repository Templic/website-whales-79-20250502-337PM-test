/**
 * @file ts-type-analyzer.ts
 * @description Type foundation analysis utilities for TypeScript error management
 * 
 * This module provides tools for analyzing the type foundation of a TypeScript project,
 * identifying missing types, and generating type coverage metrics.
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Represents the type hierarchy of a TypeScript project
 */
export interface TypeHierarchy {
  interfaces: Record<string, string[]>;     // Interface name -> extended interfaces
  types: Record<string, string[]>;          // Type name -> dependent types
  missingTypes: string[];                   // Types referenced but not defined
  circularDependencies: string[][];         // Circular type dependencies
}

/**
 * Represents type coverage metrics for a TypeScript project
 */
export interface TypeCoverage {
  coverage: number;                         // Percentage of typed variables/parameters
  filesCovered: number;                     // Number of files with complete type coverage
  totalFiles: number;                       // Total number of TypeScript files
  missingCoverage: string[];                // Files with incomplete type coverage
  implicitAnyCount: number;                 // Number of implicit any types
  explicitTypeCount: number;                // Number of explicitly typed variables/parameters
  typeByFileMap: Record<string, number>;    // Type coverage percentage by file
}

/**
 * Represents a missing type interface that could be generated
 */
export interface MissingInterface {
  name: string;
  properties: {
    name: string;
    type: string;
    optional: boolean;
  }[];
  typeParams: string[];
  documentation: string;
}

/**
 * Analyzes the type hierarchy of a TypeScript project
 * 
 * @param projectPath Root path of the TypeScript project
 * @returns Type hierarchy analysis results
 */
export async function analyzeTypeHierarchy(projectPath: string): Promise<TypeHierarchy> {
  const tsConfigPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');
  
  if (!tsConfigPath) {
    throw new Error("Could not find tsconfig.json in the project path");
  }
  
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsConfigPath));
  
  // Create a program from the tsconfig.json
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
  });
  
  const typeChecker = program.getTypeChecker();
  
  // Initialize result objects
  const interfaces: Record<string, string[]> = {};
  const types: Record<string, string[]> = {};
  const missingTypes: Set<string> = new Set();
  const circularDeps: string[][] = [];
  
  // Helper function to check if a type exists
  const typeExists = (typeName: string): boolean => {
    return interfaces[typeName] !== undefined || types[typeName] !== undefined;
  };
  
  // Process each source file
  for (const sourceFile of program.getSourceFiles()) {
    // Skip declaration files and node_modules
    if (sourceFile.isDeclarationFile || sourceFile.fileName.includes('node_modules')) {
      continue;
    }
    
    // Visit each node in the source file
    ts.forEachChild(sourceFile, (node) => {
      // Process interface declarations
      if (ts.isInterfaceDeclaration(node) && node.name) {
        const interfaceName = node.name.text;
        interfaces[interfaceName] = [];
        
        // Find extended interfaces
        if (node.heritageClauses) {
          for (const heritage of node.heritageClauses) {
            for (const type of heritage.types) {
              if (ts.isIdentifier(type.expression)) {
                const extendedName = type.expression.text;
                interfaces[interfaceName].push(extendedName);
                
                // Check if extended interface exists
                if (!typeExists(extendedName)) {
                  missingTypes.add(extendedName);
                }
              }
            }
          }
        }
      }
      
      // Process type aliases
      if (ts.isTypeAliasDeclaration(node) && node.name) {
        const typeName = node.name.text;
        types[typeName] = [];
        
        // Find referenced types
        const addReferencedType = (n: ts.Node) => {
          if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName)) {
            const referencedType = n.typeName.text;
            if (!types[typeName].includes(referencedType)) {
              types[typeName].push(referencedType);
              
              // Check if referenced type exists
              if (!typeExists(referencedType)) {
                missingTypes.add(referencedType);
              }
            }
          }
          
          ts.forEachChild(n, addReferencedType);
        };
        
        addReferencedType(node.type);
      }
    });
  }
  
  // Detect circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function detectCircular(typeName: string, path: string[] = []): void {
    if (recursionStack.has(typeName)) {
      circularDeps.push([...path, typeName]);
      return;
    }
    
    if (visited.has(typeName)) {
      return;
    }
    
    visited.add(typeName);
    recursionStack.add(typeName);
    
    const deps = [...(interfaces[typeName] || []), ...(types[typeName] || [])];
    for (const dep of deps) {
      detectCircular(dep, [...path, typeName]);
    }
    
    recursionStack.delete(typeName);
  }
  
  // Check each type for circular dependencies
  for (const typeName of [...Object.keys(interfaces), ...Object.keys(types)]) {
    detectCircular(typeName);
  }
  
  return {
    interfaces,
    types,
    missingTypes: Array.from(missingTypes),
    circularDependencies: circularDeps
  };
}

/**
 * Generates a type coverage report for a TypeScript project
 * 
 * @param projectPath Root path of the TypeScript project
 * @returns Type coverage metrics
 */
export async function generateTypeCoverageReport(projectPath: string): Promise<TypeCoverage> {
  const tsConfigPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');
  
  if (!tsConfigPath) {
    throw new Error("Could not find tsconfig.json in the project path");
  }
  
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsConfigPath));
  
  // Create a program from the tsconfig.json
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
  });
  
  let implicitAnyCount = 0;
  let explicitTypeCount = 0;
  const fileStats: Record<string, { implicitAnys: number; explicitTypes: number }> = {};
  const missingCoverage: string[] = [];
  
  // Process each source file
  for (const sourceFile of program.getSourceFiles()) {
    // Skip declaration files and node_modules
    if (sourceFile.isDeclarationFile || sourceFile.fileName.includes('node_modules')) {
      continue;
    }
    
    const fileName = path.relative(projectPath, sourceFile.fileName);
    fileStats[fileName] = { implicitAnys: 0, explicitTypes: 0 };
    
    // Visit each node in the source file
    const visitNode = (node: ts.Node) => {
      // Check variable declarations
      if (ts.isVariableDeclaration(node)) {
        if (node.type) {
          fileStats[fileName].explicitTypes++;
          explicitTypeCount++;
        } else {
          fileStats[fileName].implicitAnys++;
          implicitAnyCount++;
        }
      }
      
      // Check parameter declarations
      if (ts.isParameter(node)) {
        if (node.type) {
          fileStats[fileName].explicitTypes++;
          explicitTypeCount++;
        } else {
          fileStats[fileName].implicitAnys++;
          implicitAnyCount++;
        }
      }
      
      // Check function return types
      if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) 
          && !ts.isConstructorDeclaration(node)) {
        if (node.type) {
          fileStats[fileName].explicitTypes++;
          explicitTypeCount++;
        } else {
          fileStats[fileName].implicitAnys++;
          implicitAnyCount++;
        }
      }
      
      ts.forEachChild(node, visitNode);
    };
    
    visitNode(sourceFile);
    
    // Check if file has incomplete type coverage
    if (fileStats[fileName].implicitAnys > 0) {
      missingCoverage.push(fileName);
    }
  }
  
  // Calculate type coverage by file
  const typeByFileMap: Record<string, number> = {};
  for (const [file, stats] of Object.entries(fileStats)) {
    const total = stats.explicitTypes + stats.implicitAnys;
    typeByFileMap[file] = total > 0 ? (stats.explicitTypes / total) * 100 : 100;
  }
  
  // Calculate overall type coverage
  const totalTypes = implicitAnyCount + explicitTypeCount;
  const coverage = totalTypes > 0 ? (explicitTypeCount / totalTypes) * 100 : 100;
  
  return {
    coverage,
    filesCovered: Object.keys(fileStats).length - missingCoverage.length,
    totalFiles: Object.keys(fileStats).length,
    missingCoverage,
    implicitAnyCount,
    explicitTypeCount,
    typeByFileMap
  };
}

/**
 * Automatically generates missing interface definitions for a file
 * 
 * @param filePath Path to the TypeScript file
 * @param missingTypes Array of missing type names
 * @returns Record of type name to generated interface definition
 */
export async function generateMissingInterfaces(
  filePath: string, 
  missingTypes: string[]
): Promise<Record<string, string>> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  const interfaces: Record<string, MissingInterface> = {};
  
  // Find usage of missing types to infer properties
  const findTypeUsage = (node: ts.Node) => {
    // Check property access expressions that might use the missing type
    if (ts.isPropertyAccessExpression(node)) {
      const objectType = getTypeOfExpressionWithFallback(node.expression, fileContent);
      
      if (missingTypes.includes(objectType)) {
        // This property access is on a missing type
        if (ts.isIdentifier(node.name)) {
          if (!interfaces[objectType]) {
            interfaces[objectType] = {
              name: objectType,
              properties: [],
              typeParams: [],
              documentation: `Interface for ${objectType} auto-generated by the TypeScript error management system`
            };
          }
          
          // Add property if it doesn't exist
          if (!interfaces[objectType].properties.some(p => p.name === node.name.text)) {
            interfaces[objectType].properties.push({
              name: node.name.text,
              type: 'any', // Default to any, will refine later
              optional: false // Default to required
            });
          }
        }
      }
    }
    
    // Recursively examine children
    ts.forEachChild(node, findTypeUsage);
  };
  
  findTypeUsage(sourceFile);
  
  // Refine property types based on usage
  // This is a simplified version - a full implementation would analyze how properties are used
  const refinePropertyTypes = (node: ts.Node) => {
    // If property is used in a comparison with a string
    if (ts.isBinaryExpression(node) && 
        (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken || 
         node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken)) {
      
      if (ts.isPropertyAccessExpression(node.left)) {
        const objectType = getTypeOfExpressionWithFallback(node.left.expression, fileContent);
        
        if (missingTypes.includes(objectType) && ts.isIdentifier(node.left.name)) {
          const propName = node.left.name.text;
          const prop = interfaces[objectType]?.properties.find(p => p.name === propName);
          
          if (prop) {
            // If compared with a string literal, likely a string
            if (ts.isStringLiteral(node.right)) {
              prop.type = 'string';
            }
            // If compared with a number literal, likely a number
            else if (ts.isNumericLiteral(node.right)) {
              prop.type = 'number';
            }
            // If compared with true/false, likely a boolean
            else if (node.right.kind === ts.SyntaxKind.TrueKeyword || 
                    node.right.kind === ts.SyntaxKind.FalseKeyword) {
              prop.type = 'boolean';
            }
          }
        }
      }
    }
    
    // Recursively examine children
    ts.forEachChild(node, refinePropertyTypes);
  };
  
  refinePropertyTypes(sourceFile);
  
  // Generate interface definitions
  const result: Record<string, string> = {};
  
  for (const [name, interfaceInfo] of Object.entries(interfaces)) {
    let interfaceDef = `/**\n * ${interfaceInfo.documentation}\n */\nexport interface ${name}`;
    
    // Add type parameters if any
    if (interfaceInfo.typeParams.length > 0) {
      interfaceDef += `<${interfaceInfo.typeParams.join(', ')}>`;
    }
    
    interfaceDef += ` {\n`;
    
    // Add properties
    for (const prop of interfaceInfo.properties) {
      interfaceDef += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};\n`;
    }
    
    interfaceDef += `}\n`;
    result[name] = interfaceDef;
  }
  
  return result;
}

/**
 * Helper function to get the type name of an expression with fallback to textual analysis
 */
function getTypeOfExpressionWithFallback(expression: ts.Expression, fileContent: string): string {
  // This is a simplified version - ideally we would use the TypeChecker from a Program
  // As a fallback, we'll use the text representation
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  
  // This is very simplified - a real implementation would use the TypeChecker
  return 'unknown';
}

/**
 * Find all TypeScript files in a project
 * 
 * @param projectPath Root path of the TypeScript project
 * @returns Array of TypeScript file paths
 */
export async function findTypeScriptFiles(projectPath: string): Promise<string[]> {
  return glob('**/*.{ts,tsx}', {
    cwd: projectPath,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    absolute: true
  });
}

/**
 * Identifies files with the most type issues
 * 
 * @param coverage Type coverage report
 * @param limit Maximum number of files to return
 * @returns Array of file paths ordered by most type issues
 */
export function identifyTypeHotspots(coverage: TypeCoverage, limit = 10): string[] {
  return Object.entries(coverage.typeByFileMap)
    .sort(([, coverageA], [, coverageB]) => coverageA - coverageB)
    .map(([file]) => file)
    .slice(0, limit);
}