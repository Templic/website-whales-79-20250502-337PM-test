/**
 * @file ts-type-analyzer.ts
 * @description TypeScript type analyzer for code bases
 * 
 * This module provides utilities for analyzing TypeScript type hierarchies,
 * generating coverage reports, and identifying type-related hotspots in the codebase.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Type hierarchy analysis results
 */
export interface TypeHierarchyAnalysis {
  typeCount: number;
  interfaceCount: number;
  enumCount: number;
  typeAliasCount: number;
  genericTypeCount: number;
  typeMap: Record<string, TypeInfo>;
  inheritanceGraph: Record<string, string[]>;
  circularDependencies: string[][];
  orphanedTypes: string[];
  missingTypes: string[];
  largestTypes: {
    name: string;
    complexity: number;
  }[];
}

/**
 * Type coverage report
 */
export interface TypeCoverageReport {
  totalNodes: number;
  anyTypeCount: number;
  implicitAnyCount: number;
  unknownTypeCount: number;
  explicitTypeCount: number;
  coverage: number; // percentage of explicitly typed nodes
  filesCoverage: Record<string, {
    totalNodes: number;
    anyTypeCount: number;
    implicitAnyCount: number;
    coverage: number;
  }>;
  missingTypeDeclarations: {
    filePath: string;
    name: string;
    line: number;
    column: number;
  }[];
}

/**
 * Information about a type
 */
export interface TypeInfo {
  name: string;
  kind: 'interface' | 'type' | 'enum' | 'class' | 'unknown';
  filePath: string;
  line: number;
  column: number;
  properties: {
    name: string;
    type: string;
    isOptional: boolean;
  }[];
  methods: {
    name: string;
    returnType: string;
    parameters: {
      name: string;
      type: string;
    }[];
  }[];
  extendsTypes: string[];
  implementsTypes: string[];
  isGeneric: boolean;
  typeParameters: string[];
  isExported: boolean;
  usages: {
    filePath: string;
    line: number;
    column: number;
  }[];
  complexity: number; // Calculated based on number of properties, methods, inheritance, etc.
}

/**
 * Finds all TypeScript files in a directory
 * 
 * @param rootDir Root directory to start search from
 * @returns Array of file paths
 */
export async function findTypeScriptFiles(rootDir: string): Promise<string[]> {
  const tsFiles = await glob('**/*.ts', {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
  });
  
  const tsxFiles = await glob('**/*.tsx', {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
  });
  
  return [...tsFiles, ...tsxFiles];
}

/**
 * Analyzes a TypeScript project and generates a type hierarchy
 * 
 * @param projectPath Path to the TypeScript project
 * @returns Type hierarchy analysis
 */
export async function analyzeTypeHierarchy(projectPath: string): Promise<TypeHierarchyAnalysis> {
  const tsConfigPath = ts.findConfigFile(
    projectPath,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!tsConfigPath) {
    throw new Error(`Could not find tsconfig.json in ${projectPath}`);
  }
  
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  
  const program = ts.createProgram(
    parsedConfig.fileNames,
    parsedConfig.options
  );
  
  const typeChecker = program.getTypeChecker();
  
  const typeMap: Record<string, TypeInfo> = {};
  const inheritanceGraph: Record<string, string[]> = {};
  const usageMap: Record<string, { filePath: string; line: number; column: number; }[]> = {};
  
  // Visit all source files
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    if (sourceFile.fileName.includes('node_modules')) continue;
    
    visitNodeAndCollectTypes(sourceFile);
  }
  
  // Find circular dependencies
  const circularDependencies = findCircularDependencies(inheritanceGraph);
  
  // Find orphaned types (types not used anywhere)
  const orphanedTypes = Object.keys(typeMap).filter(typeName => 
    !usageMap[typeName] || usageMap[typeName].length === 0
  );
  
  // Find missing types (types used but not defined)
  const missingTypes = findMissingTypes(usageMap, typeMap);
  
  // Calculate type complexity
  for (const typeName in typeMap) {
    typeMap[typeName].complexity = calculateTypeComplexity(typeName, typeMap, inheritanceGraph);
  }
  
  // Get largest types by complexity
  const largestTypes = Object.values(typeMap)
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 10)
    .map(type => ({
      name: type.name,
      complexity: type.complexity
    }));
  
  return {
    typeCount: Object.keys(typeMap).length,
    interfaceCount: Object.values(typeMap).filter(t => t.kind === 'interface').length,
    enumCount: Object.values(typeMap).filter(t => t.kind === 'enum').length,
    typeAliasCount: Object.values(typeMap).filter(t => t.kind === 'type').length,
    genericTypeCount: Object.values(typeMap).filter(t => t.isGeneric).length,
    typeMap,
    inheritanceGraph,
    circularDependencies,
    orphanedTypes,
    missingTypes,
    largestTypes
  };
  
  /**
   * Visits a TypeScript node and collects type information
   */
  function visitNodeAndCollectTypes(node: ts.Node) {
    // Interface declaration
    if (ts.isInterfaceDeclaration(node)) {
      const symbol = typeChecker.getSymbolAtLocation(node.name);
      if (symbol) {
        const interfaceName = symbol.getName();
        const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.name.getStart());
        
        const properties: TypeInfo['properties'] = [];
        const methods: TypeInfo['methods'] = [];
        const extendsTypes: string[] = [];
        
        // Get extended types
        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
              for (const type of clause.types) {
                const extendedType = type.expression.getText();
                extendsTypes.push(extendedType);
                
                // Update inheritance graph
                if (!inheritanceGraph[interfaceName]) {
                  inheritanceGraph[interfaceName] = [];
                }
                inheritanceGraph[interfaceName].push(extendedType);
              }
            }
          }
        }
        
        // Get properties and methods
        if (symbol.members) {
          symbol.members.forEach((member, memberName) => {
            const memberDeclarations = member.getDeclarations();
            if (!memberDeclarations || memberDeclarations.length === 0) return;
            
            const memberDeclaration = memberDeclarations[0];
            
            if (ts.isPropertySignature(memberDeclaration)) {
              const type = memberDeclaration.type 
                ? memberDeclaration.type.getText() 
                : 'any';
              
              properties.push({
                name: memberName.toString(),
                type,
                isOptional: !!memberDeclaration.questionToken
              });
            } else if (ts.isMethodSignature(memberDeclaration)) {
              const returnType = memberDeclaration.type 
                ? memberDeclaration.type.getText() 
                : 'any';
              
              const parameters = memberDeclaration.parameters.map(param => ({
                name: param.name.getText(),
                type: param.type ? param.type.getText() : 'any'
              }));
              
              methods.push({
                name: memberName.toString(),
                returnType,
                parameters
              });
            }
          });
        }
        
        typeMap[interfaceName] = {
          name: interfaceName,
          kind: 'interface',
          filePath: node.getSourceFile().fileName,
          line: line + 1,
          column: character + 1,
          properties,
          methods,
          extendsTypes,
          implementsTypes: [],
          isGeneric: node.typeParameters !== undefined && node.typeParameters.length > 0,
          typeParameters: node.typeParameters 
            ? node.typeParameters.map(tp => tp.name.getText()) 
            : [],
          isExported: hasExportModifier(node),
          usages: [],
          complexity: 0
        };
      }
    }
    // Type alias
    else if (ts.isTypeAliasDeclaration(node)) {
      const symbol = typeChecker.getSymbolAtLocation(node.name);
      if (symbol) {
        const typeName = symbol.getName();
        const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.name.getStart());
        
        typeMap[typeName] = {
          name: typeName,
          kind: 'type',
          filePath: node.getSourceFile().fileName,
          line: line + 1,
          column: character + 1,
          properties: [],
          methods: [],
          extendsTypes: [],
          implementsTypes: [],
          isGeneric: node.typeParameters !== undefined && node.typeParameters.length > 0,
          typeParameters: node.typeParameters 
            ? node.typeParameters.map(tp => tp.name.getText()) 
            : [],
          isExported: hasExportModifier(node),
          usages: [],
          complexity: 0
        };
      }
    }
    // Enum declaration
    else if (ts.isEnumDeclaration(node)) {
      const symbol = typeChecker.getSymbolAtLocation(node.name);
      if (symbol) {
        const enumName = symbol.getName();
        const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.name.getStart());
        
        typeMap[enumName] = {
          name: enumName,
          kind: 'enum',
          filePath: node.getSourceFile().fileName,
          line: line + 1,
          column: character + 1,
          properties: node.members.map(member => ({
            name: member.name.getText(),
            type: 'enum member',
            isOptional: false
          })),
          methods: [],
          extendsTypes: [],
          implementsTypes: [],
          isGeneric: false,
          typeParameters: [],
          isExported: hasExportModifier(node),
          usages: [],
          complexity: 0
        };
      }
    }
    // Class declaration
    else if (ts.isClassDeclaration(node)) {
      const symbol = typeChecker.getSymbolAtLocation(node.name!);
      if (symbol) {
        const className = symbol.getName();
        const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.name!.getStart());
        
        const properties: TypeInfo['properties'] = [];
        const methods: TypeInfo['methods'] = [];
        const extendsTypes: string[] = [];
        const implementsTypes: string[] = [];
        
        // Get extended classes
        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
              for (const type of clause.types) {
                const extendedType = type.expression.getText();
                extendsTypes.push(extendedType);
                
                // Update inheritance graph
                if (!inheritanceGraph[className]) {
                  inheritanceGraph[className] = [];
                }
                inheritanceGraph[className].push(extendedType);
              }
            } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
              for (const type of clause.types) {
                const implementedType = type.expression.getText();
                implementsTypes.push(implementedType);
              }
            }
          }
        }
        
        // Get properties and methods
        for (const member of node.members) {
          if (ts.isPropertyDeclaration(member)) {
            const propertyName = member.name.getText();
            const type = member.type 
              ? member.type.getText() 
              : 'any';
            
            properties.push({
              name: propertyName,
              type,
              isOptional: !!member.questionToken
            });
          } else if (ts.isMethodDeclaration(member)) {
            const methodName = member.name.getText();
            const returnType = member.type 
              ? member.type.getText() 
              : 'any';
            
            const parameters = member.parameters.map(param => ({
              name: param.name.getText(),
              type: param.type ? param.type.getText() : 'any'
            }));
            
            methods.push({
              name: methodName,
              returnType,
              parameters
            });
          }
        }
        
        typeMap[className] = {
          name: className,
          kind: 'class',
          filePath: node.getSourceFile().fileName,
          line: line + 1,
          column: character + 1,
          properties,
          methods,
          extendsTypes,
          implementsTypes,
          isGeneric: node.typeParameters !== undefined && node.typeParameters.length > 0,
          typeParameters: node.typeParameters 
            ? node.typeParameters.map(tp => tp.name.getText()) 
            : [],
          isExported: hasExportModifier(node),
          usages: [],
          complexity: 0
        };
      }
    }
    // Type reference
    else if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.getText();
      const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.typeName.getStart());
      
      if (!usageMap[typeName]) {
        usageMap[typeName] = [];
      }
      
      usageMap[typeName].push({
        filePath: node.getSourceFile().fileName,
        line: line + 1,
        column: character + 1
      });
    }
    
    ts.forEachChild(node, visitNodeAndCollectTypes);
  }
  
  /**
   * Checks if a node has an export modifier
   */
  function hasExportModifier(node: ts.Node): boolean {
    return node.modifiers !== undefined && 
      node.modifiers.some(modifier => 
        modifier.kind === ts.SyntaxKind.ExportKeyword
      );
  }
}

/**
 * Finds circular dependencies in the inheritance graph
 * 
 * @param inheritanceGraph Graph of type inheritance
 * @returns List of circular dependencies
 */
function findCircularDependencies(inheritanceGraph: Record<string, string[]>): string[][] {
  const circularDependencies: string[][] = [];
  const visited = new Set<string>();
  const currentPath: string[] = [];
  
  function dfs(typeName: string) {
    if (currentPath.includes(typeName)) {
      const cycle = currentPath.slice(currentPath.indexOf(typeName));
      cycle.push(typeName);
      circularDependencies.push(cycle);
      return;
    }
    
    if (visited.has(typeName)) {
      return;
    }
    
    visited.add(typeName);
    currentPath.push(typeName);
    
    const dependencies = inheritanceGraph[typeName] || [];
    for (const dependency of dependencies) {
      dfs(dependency);
    }
    
    currentPath.pop();
  }
  
  for (const typeName in inheritanceGraph) {
    dfs(typeName);
  }
  
  return circularDependencies;
}

/**
 * Finds types that are used but not defined
 * 
 * @param usageMap Map of type usages
 * @param typeMap Map of defined types
 * @returns List of missing types
 */
function findMissingTypes(
  usageMap: Record<string, { filePath: string; line: number; column: number; }[]>,
  typeMap: Record<string, TypeInfo>
): string[] {
  const missingTypes: string[] = [];
  
  for (const typeName in usageMap) {
    if (!typeMap[typeName]) {
      missingTypes.push(typeName);
    }
  }
  
  return missingTypes;
}

/**
 * Calculates the complexity of a type
 * 
 * @param typeName Name of the type
 * @param typeMap Map of all types
 * @param inheritanceGraph Inheritance graph
 * @returns Complexity score
 */
function calculateTypeComplexity(
  typeName: string,
  typeMap: Record<string, TypeInfo>,
  inheritanceGraph: Record<string, string[]>
): number {
  const type = typeMap[typeName];
  if (!type) return 0;
  
  // Base complexity: properties + methods
  let complexity = type.properties.length + type.methods.length;
  
  // Add complexity for generic parameters
  complexity += type.typeParameters.length * 2;
  
  // Add complexity for inheritance
  const inheritedTypes = inheritanceGraph[typeName] || [];
  complexity += inheritedTypes.length * 3;
  
  // Add complexity for method parameters
  for (const method of type.methods) {
    complexity += method.parameters.length;
  }
  
  return complexity;
}

/**
 * Generates a coverage report for TypeScript types in a project
 * 
 * @param projectPath Path to the TypeScript project
 * @returns Coverage report
 */
export async function generateTypeCoverageReport(projectPath: string): Promise<TypeCoverageReport> {
  const tsConfigPath = ts.findConfigFile(
    projectPath,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!tsConfigPath) {
    throw new Error(`Could not find tsconfig.json in ${projectPath}`);
  }
  
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  
  const program = ts.createProgram(
    parsedConfig.fileNames,
    parsedConfig.options
  );
  
  const typeChecker = program.getTypeChecker();
  
  let totalNodes = 0;
  let anyTypeCount = 0;
  let implicitAnyCount = 0;
  let unknownTypeCount = 0;
  let explicitTypeCount = 0;
  
  const filesCoverage: Record<string, {
    totalNodes: number;
    anyTypeCount: number;
    implicitAnyCount: number;
    coverage: number;
  }> = {};
  
  const missingTypeDeclarations: {
    filePath: string;
    name: string;
    line: number;
    column: number;
  }[] = [];
  
  // Visit all source files
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    if (sourceFile.fileName.includes('node_modules')) continue;
    
    const filePath = sourceFile.fileName;
    
    filesCoverage[filePath] = {
      totalNodes: 0,
      anyTypeCount: 0,
      implicitAnyCount: 0,
      coverage: 0
    };
    
    // Get type coverage for the file
    analyzeCoverage(sourceFile, filePath);
    
    // Calculate coverage percentage
    if (filesCoverage[filePath].totalNodes > 0) {
      const fileCoverage = 100 * (1 - filesCoverage[filePath].anyTypeCount / filesCoverage[filePath].totalNodes);
      filesCoverage[filePath].coverage = Math.round(fileCoverage * 100) / 100;
    }
  }
  
  // Calculate overall coverage
  const coverage = totalNodes > 0 
    ? Math.round(100 * (1 - (anyTypeCount + implicitAnyCount) / totalNodes) * 100) / 100
    : 0;
  
  return {
    totalNodes,
    anyTypeCount,
    implicitAnyCount,
    unknownTypeCount,
    explicitTypeCount,
    coverage,
    filesCoverage,
    missingTypeDeclarations
  };
  
  /**
   * Analyzes type coverage in a file
   * 
   * @param node Current node to analyze
   * @param filePath Path to the file
   */
  function analyzeCoverage(node: ts.Node, filePath: string) {
    // Variables, parameters, and properties with types
    if (
      ts.isVariableDeclaration(node) ||
      ts.isParameter(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isPropertySignature(node)
    ) {
      totalNodes++;
      filesCoverage[filePath].totalNodes++;
      
      // Has explicit type annotation
      if (node.type) {
        const typeText = node.type.getText();
        
        if (typeText === 'any') {
          anyTypeCount++;
          filesCoverage[filePath].anyTypeCount++;
        } else if (typeText === 'unknown') {
          unknownTypeCount++;
        } else {
          explicitTypeCount++;
        }
      }
      // No explicit type (implicit any)
      else {
        implicitAnyCount++;
        filesCoverage[filePath].implicitAnyCount++;
        
        if (ts.isIdentifier(node.name)) {
          const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.name.getStart());
          
          missingTypeDeclarations.push({
            filePath,
            name: node.name.getText(),
            line: line + 1,
            column: character + 1
          });
        }
      }
    }
    // Function with return type
    else if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isMethodSignature(node)
    ) {
      totalNodes++;
      filesCoverage[filePath].totalNodes++;
      
      // Has explicit return type
      if (node.type) {
        const typeText = node.type.getText();
        
        if (typeText === 'any') {
          anyTypeCount++;
          filesCoverage[filePath].anyTypeCount++;
        } else if (typeText === 'unknown') {
          unknownTypeCount++;
        } else {
          explicitTypeCount++;
        }
      }
      // No explicit return type (implicit any)
      else {
        implicitAnyCount++;
        filesCoverage[filePath].implicitAnyCount++;
        
        if (node.name && ts.isIdentifier(node.name)) {
          const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.name.getStart());
          
          missingTypeDeclarations.push({
            filePath,
            name: `${node.name.getText()} (return type)`,
            line: line + 1,
            column: character + 1
          });
        }
      }
    }
    
    ts.forEachChild(node, n => analyzeCoverage(n, filePath));
  }
}

/**
 * Identifies files with type issues (hotspots)
 * 
 * @param coverage Type coverage report
 * @returns List of file paths with type issues
 */
export function identifyTypeHotspots(coverage: TypeCoverageReport): string[] {
  const hotspots: string[] = [];
  
  // Files with lowest coverage
  const sortedFiles = Object.entries(coverage.filesCoverage)
    .sort(([, a], [, b]) => a.coverage - b.coverage)
    .filter(([, stats]) => stats.totalNodes > 10) // Only consider files with significant size
    .slice(0, 20) // Top 20 worst files
    .map(([filePath]) => filePath);
  
  // Files with most missing type declarations
  const missingTypesByFile: Record<string, number> = {};
  for (const missing of coverage.missingTypeDeclarations) {
    missingTypesByFile[missing.filePath] = (missingTypesByFile[missing.filePath] || 0) + 1;
  }
  
  const filesMissingTypes = Object.entries(missingTypesByFile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20) // Top 20 worst files
    .map(([filePath]) => filePath);
  
  // Combine both lists
  return [...new Set([...sortedFiles, ...filesMissingTypes])];
}

/**
 * Generates a missing type definition
 * 
 * @param missingType Name of the missing type
 * @param usages List of usages of the type
 * @param codeContext Code context where the type is used
 * @returns Suggested type definition
 */
export function generateMissingTypeDefinition(
  missingType: string,
  usages: { filePath: string; line: number; column: number; }[],
  codeContext: string
): string {
  // Simple heuristic for now - in a more advanced version, we could
  // use OpenAI to generate type definitions based on usage
  return `/**
 * Auto-generated type definition for ${missingType}
 * This type was used but not defined in the codebase.
 * Consider replacing this with a proper type definition.
 */
export type ${missingType} = any;
`;
}

/**
 * Generates a visualization of type relationships
 * 
 * @param hierarchy Type hierarchy analysis
 * @returns DOT graph representation
 */
export function visualizeTypeHierarchy(hierarchy: TypeHierarchyAnalysis): string {
  const lines: string[] = [
    'digraph TypeHierarchy {',
    '  rankdir=LR;',
    '  node [shape=box, style=filled, fillcolor=lightblue];'
  ];
  
  // Add nodes
  for (const typeName in hierarchy.typeMap) {
    const type = hierarchy.typeMap[typeName];
    const label = `${type.name}\\n(${type.kind})\\n${type.properties.length} props, ${type.methods.length} methods`;
    const color = type.kind === 'interface' ? 'lightblue' : 
                 type.kind === 'class' ? 'lightgreen' : 
                 type.kind === 'type' ? 'lightyellow' : 'lightgrey';
    
    lines.push(`  "${typeName}" [label="${label}", fillcolor="${color}"];`);
  }
  
  // Add edges
  for (const typeName in hierarchy.inheritanceGraph) {
    for (const dependency of hierarchy.inheritanceGraph[typeName]) {
      lines.push(`  "${typeName}" -> "${dependency}";`);
    }
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Gets a list of files with missing types
 * 
 * @param coverage Type coverage report
 * @returns List of files with missing types
 */
export function getFilesWithMissingTypes(coverage: TypeCoverageReport): string[] {
  const fileSet = new Set<string>();
  
  for (const missingType of coverage.missingTypeDeclarations) {
    fileSet.add(missingType.filePath);
  }
  
  return Array.from(fileSet);
}

/**
 * Exports type definitions to a file
 * 
 * @param hierarchy Type hierarchy analysis
 * @param outputPath Path to save the exported types
 */
export function exportTypeDefinitions(
  hierarchy: TypeHierarchyAnalysis,
  outputPath: string
): void {
  const lines: string[] = ['/**\n * Auto-generated type definitions\n */\n'];
  
  for (const typeName in hierarchy.typeMap) {
    const type = hierarchy.typeMap[typeName];
    
    if (type.kind === 'interface') {
      lines.push(`export interface ${type.name}${
        type.typeParameters.length > 0 ? `<${type.typeParameters.join(', ')}>` : ''
      }${
        type.extendsTypes.length > 0 ? ` extends ${type.extendsTypes.join(', ')}` : ''
      } {`);
      
      for (const prop of type.properties) {
        lines.push(`  ${prop.name}${prop.isOptional ? '?' : ''}: ${prop.type};`);
      }
      
      for (const method of type.methods) {
        const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        lines.push(`  ${method.name}(${params}): ${method.returnType};`);
      }
      
      lines.push('}\n');
    } else if (type.kind === 'type') {
      // Simple placeholder - we would need more context to recreate the actual type
      lines.push(`export type ${type.name}${
        type.typeParameters.length > 0 ? `<${type.typeParameters.join(', ')}>` : ''
      } = any; // Auto-generated, please replace with actual type\n`);
    } else if (type.kind === 'enum') {
      lines.push(`export enum ${type.name} {`);
      
      for (const prop of type.properties) {
        lines.push(`  ${prop.name},`);
      }
      
      lines.push('}\n');
    }
  }
  
  fs.writeFileSync(outputPath, lines.join('\n'));
}