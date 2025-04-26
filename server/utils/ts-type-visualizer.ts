/**
 * @file ts-type-visualizer.ts
 * @description TypeScript type visualization utilities
 * 
 * This module provides utilities for visualizing TypeScript type hierarchies
 * and relationships between types.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TypeHierarchyAnalysis, TypeInfo } from './ts-type-analyzer';

/**
 * Visualization options
 */
export interface VisualizationOptions {
  format: 'dot' | 'mermaid' | 'json';
  includeOrphans: boolean;
  maxDepth: number;
  focusTypes?: string[];
  includeProperties: boolean;
  includeMethods: boolean;
  colorScheme: 'default' | 'colorblind' | 'monochrome';
  outputPath?: string;
}

/**
 * Default visualization options
 */
const defaultOptions: VisualizationOptions = {
  format: 'dot',
  includeOrphans: false,
  maxDepth: 3,
  includeProperties: true,
  includeMethods: false,
  colorScheme: 'default'
};

/**
 * Color schemes for different node types
 */
const colorSchemes = {
  default: {
    interface: 'lightblue',
    class: 'lightgreen',
    type: 'lightyellow',
    enum: 'lightgrey',
    orphan: 'lightpink',
    missing: 'lightsalmon',
    circular: 'lightcoral'
  },
  colorblind: {
    interface: '#DDDDDD',
    class: '#77AADD',
    type: '#99DDFF',
    enum: '#44BB99',
    orphan: '#BBCC33',
    missing: '#FFAE42',
    circular: '#EE8866'
  },
  monochrome: {
    interface: '#E0E0E0',
    class: '#C0C0C0',
    type: '#A0A0A0',
    enum: '#808080',
    orphan: '#606060',
    missing: '#404040',
    circular: '#202020'
  }
};

/**
 * Generates a visualization of a type hierarchy
 * 
 * @param hierarchy Type hierarchy analysis results
 * @param options Visualization options
 * @returns Visualization in the specified format
 */
export function visualizeTypeHierarchy(
  hierarchy: TypeHierarchyAnalysis,
  options?: Partial<VisualizationOptions>
): string {
  const opts = { ...defaultOptions, ...options };
  
  switch (opts.format) {
    case 'dot':
      return generateDotGraph(hierarchy, opts);
    case 'mermaid':
      return generateMermaidDiagram(hierarchy, opts);
    case 'json':
      return generateJSON(hierarchy, opts);
    default:
      throw new Error(`Unsupported format: ${opts.format}`);
  }
}

/**
 * Generates a DOT graph visualization
 * 
 * @param hierarchy Type hierarchy analysis
 * @param options Visualization options
 * @returns DOT graph representation
 */
function generateDotGraph(
  hierarchy: TypeHierarchyAnalysis,
  options: VisualizationOptions
): string {
  const lines: string[] = [
    'digraph TypeHierarchy {',
    '  rankdir=LR;',
    '  node [shape=box, style=filled];'
  ];
  
  const colors = colorSchemes[options.colorScheme];
  const circularTypes = new Set(hierarchy.circularDependencies.flat());
  
  // Filter types if focusTypes is specified
  const typeMap = options.focusTypes
    ? filterTypesByFocus(hierarchy.typeMap, options.focusTypes, hierarchy.inheritanceGraph, options.maxDepth)
    : hierarchy.typeMap;
  
  // Add nodes
  for (const typeName in typeMap) {
    const type = typeMap[typeName];
    let label = `${type.name}\\n(${type.kind})`;
    
    if (options.includeProperties && type.properties.length > 0) {
      label += '\\n\\nProperties:\\n';
      for (const prop of type.properties.slice(0, 5)) {
        label += `${prop.name}${prop.isOptional ? '?' : ''}: ${truncateType(prop.type)}\\n`;
      }
      if (type.properties.length > 5) {
        label += `...and ${type.properties.length - 5} more\\n`;
      }
    }
    
    if (options.includeMethods && type.methods.length > 0) {
      label += '\\n\\nMethods:\\n';
      for (const method of type.methods.slice(0, 3)) {
        label += `${method.name}(): ${truncateType(method.returnType)}\\n`;
      }
      if (type.methods.length > 3) {
        label += `...and ${type.methods.length - 3} more\\n`;
      }
    }
    
    let color = colors[type.kind];
    
    // Check if this type is orphaned
    if (hierarchy.orphanedTypes.includes(typeName)) {
      if (!options.includeOrphans) continue;
      color = colors.orphan;
    }
    
    // Check if this type is part of a circular dependency
    if (circularTypes.has(typeName)) {
      color = colors.circular;
    }
    
    lines.push(`  "${typeName}" [label="${label}", fillcolor="${color}"];`);
  }
  
  // Add missing types if they are referenced by the filtered types
  if (options.focusTypes) {
    const referencedTypes = new Set<string>();
    
    for (const typeName in typeMap) {
      const type = typeMap[typeName];
      
      // Add extended types
      for (const extendedType of type.extendsTypes) {
        referencedTypes.add(extendedType);
      }
      
      // Add implemented types
      for (const implementedType of type.implementsTypes) {
        referencedTypes.add(implementedType);
      }
    }
    
    for (const typeName of referencedTypes) {
      if (!typeMap[typeName] && !hierarchy.typeMap[typeName]) {
        lines.push(`  "${typeName}" [label="${typeName}\\n(missing)", fillcolor="${colors.missing}"];`);
      }
    }
  }
  
  // Add edges
  for (const typeName in typeMap) {
    const type = typeMap[typeName];
    
    // Add edges for extended types
    for (const extendedType of type.extendsTypes) {
      lines.push(`  "${typeName}" -> "${extendedType}" [label="extends"];`);
    }
    
    // Add edges for implemented types
    for (const implementedType of type.implementsTypes) {
      lines.push(`  "${typeName}" -> "${implementedType}" [label="implements", style="dashed"];`);
    }
  }
  
  lines.push('}');
  
  const result = lines.join('\n');
  
  // Save to file if outputPath is provided
  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, result);
  }
  
  return result;
}

/**
 * Generates a Mermaid diagram visualization
 * 
 * @param hierarchy Type hierarchy analysis
 * @param options Visualization options
 * @returns Mermaid diagram representation
 */
function generateMermaidDiagram(
  hierarchy: TypeHierarchyAnalysis,
  options: VisualizationOptions
): string {
  const lines: string[] = [
    '```mermaid',
    'classDiagram'
  ];
  
  const circularTypes = new Set(hierarchy.circularDependencies.flat());
  
  // Filter types if focusTypes is specified
  const typeMap = options.focusTypes
    ? filterTypesByFocus(hierarchy.typeMap, options.focusTypes, hierarchy.inheritanceGraph, options.maxDepth)
    : hierarchy.typeMap;
  
  // Add class definitions
  for (const typeName in typeMap) {
    const type = typeMap[typeName];
    
    // Check if this type is orphaned
    if (hierarchy.orphanedTypes.includes(typeName) && !options.includeOrphans) {
      continue;
    }
    
    // Add class
    lines.push(`  class ${escapeTypeName(typeName)} {`);
    
    // Add properties
    if (options.includeProperties) {
      for (const prop of type.properties.slice(0, 5)) {
        lines.push(`    ${prop.isOptional ? '+?' : '+'} ${prop.name} ${truncateType(prop.type)}`);
      }
      if (type.properties.length > 5) {
        lines.push(`    ... ${type.properties.length - 5} more ...`);
      }
    }
    
    // Add methods
    if (options.includeMethods) {
      for (const method of type.methods.slice(0, 3)) {
        lines.push(`    + ${method.name}() ${truncateType(method.returnType)}`);
      }
      if (type.methods.length > 3) {
        lines.push(`    ... ${type.methods.length - 3} more ...`);
      }
    }
    
    lines.push('  }');
    
    // Add annotations
    if (type.kind !== 'class') {
      lines.push(`  <<${type.kind}>> ${escapeTypeName(typeName)}`);
    }
    
    if (circularTypes.has(typeName)) {
      lines.push(`  <<circular>> ${escapeTypeName(typeName)}`);
    }
    
    if (hierarchy.orphanedTypes.includes(typeName)) {
      lines.push(`  <<orphan>> ${escapeTypeName(typeName)}`);
    }
  }
  
  // Add missing types if they are referenced by the filtered types
  if (options.focusTypes) {
    const referencedTypes = new Set<string>();
    
    for (const typeName in typeMap) {
      const type = typeMap[typeName];
      
      // Add extended types
      for (const extendedType of type.extendsTypes) {
        referencedTypes.add(extendedType);
      }
      
      // Add implemented types
      for (const implementedType of type.implementsTypes) {
        referencedTypes.add(implementedType);
      }
    }
    
    for (const typeName of referencedTypes) {
      if (!typeMap[typeName] && !hierarchy.typeMap[typeName]) {
        lines.push(`  class ${escapeTypeName(typeName)} {`);
        lines.push('  }');
        lines.push(`  <<missing>> ${escapeTypeName(typeName)}`);
      }
    }
  }
  
  // Add relationships
  for (const typeName in typeMap) {
    const type = typeMap[typeName];
    
    // Add relationships for extended types
    for (const extendedType of type.extendsTypes) {
      lines.push(`  ${escapeTypeName(extendedType)} <|-- ${escapeTypeName(typeName)} : extends`);
    }
    
    // Add relationships for implemented types
    for (const implementedType of type.implementsTypes) {
      lines.push(`  ${escapeTypeName(implementedType)} <|.. ${escapeTypeName(typeName)} : implements`);
    }
  }
  
  lines.push('```');
  
  const result = lines.join('\n');
  
  // Save to file if outputPath is provided
  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, result);
  }
  
  return result;
}

/**
 * Generates a JSON visualization
 * 
 * @param hierarchy Type hierarchy analysis
 * @param options Visualization options
 * @returns JSON representation
 */
function generateJSON(
  hierarchy: TypeHierarchyAnalysis,
  options: VisualizationOptions
): string {
  // Filter types if focusTypes is specified
  const typeMap = options.focusTypes
    ? filterTypesByFocus(hierarchy.typeMap, options.focusTypes, hierarchy.inheritanceGraph, options.maxDepth)
    : hierarchy.typeMap;
  
  const nodes: unknown[] = [];
  const edges: unknown[] = [];
  
  const circularTypes = new Set(hierarchy.circularDependencies.flat());
  
  // Create nodes
  for (const typeName in typeMap) {
    const type = typeMap[typeName];
    
    // Check if this type is orphaned
    if (hierarchy.orphanedTypes.includes(typeName) && !options.includeOrphans) {
      continue;
    }
    
    const node: any = {
      id: typeName,
      name: type.name,
      kind: type.kind,
      isGeneric: type.isGeneric,
      isExported: type.isExported,
      isOrphan: hierarchy.orphanedTypes.includes(typeName),
      isCircular: circularTypes.has(typeName),
      file: path.basename(type.filePath),
      complexity: type.complexity
    };
    
    if (options.includeProperties) {
      node.properties = type.properties;
    }
    
    if (options.includeMethods) {
      node.methods = type.methods;
    }
    
    nodes.push(node);
  }
  
  // Create edges
  for (const typeName in typeMap) {
    const type = typeMap[typeName];
    
    // Add edges for extended types
    for (const extendedType of type.extendsTypes) {
      edges.push({
        source: typeName,
        target: extendedType,
        relationship: 'extends'
      });
    }
    
    // Add edges for implemented types
    for (const implementedType of type.implementsTypes) {
      edges.push({
        source: typeName,
        target: implementedType,
        relationship: 'implements'
      });
    }
  }
  
  const result = JSON.stringify({
    nodes,
    edges,
    statistics: {
      typeCount: Object.keys(typeMap).length,
      interfaceCount: Object.values(typeMap).filter(t => t.kind === 'interface').length,
      enumCount: Object.values(typeMap).filter(t => t.kind === 'enum').length,
      typeAliasCount: Object.values(typeMap).filter(t => t.kind === 'type').length,
      genericTypeCount: Object.values(typeMap).filter(t => t.isGeneric).length,
      orphanCount: hierarchy.orphanedTypes.filter(t => !!typeMap[t]).length,
      circularCount: Array.from(circularTypes).filter(t => !!typeMap[t]).length
    }
  }, null, 2);
  
  // Save to file if outputPath is provided
  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, result);
  }
  
  return result;
}

/**
 * Filters types by focus
 * 
 * @param typeMap Original type map
 * @param focusTypes Types to focus on
 * @param inheritanceGraph Graph of type inheritance
 * @param maxDepth Maximum depth to include related types
 * @returns Filtered type map
 */
function filterTypesByFocus(
  typeMap: Record<string, TypeInfo>,
  focusTypes: string[],
  inheritanceGraph: Record<string, string[]>,
  maxDepth: number
): Record<string, TypeInfo> {
  const result: Record<string, TypeInfo> = {};
  const visited = new Set<string>();
  
  // Perform a breadth-first search from each focus type
  function bfs(typeName: string, depth: number) {
    if (depth > maxDepth || visited.has(typeName)) return;
    visited.add(typeName);
    
    // Add the type to the result
    if (typeMap[typeName]) {
      result[typeName] = typeMap[typeName];
      
      // Add related types
      if (depth < maxDepth) {
        // Add extended types
        for (const extendedType of typeMap[typeName].extendsTypes) {
          bfs(extendedType, depth + 1);
        }
        
        // Add implemented types
        for (const implementedType of typeMap[typeName].implementsTypes) {
          bfs(implementedType, depth + 1);
        }
        
        // Add types that extend this type
        for (const otherTypeName in inheritanceGraph) {
          if (inheritanceGraph[otherTypeName].includes(typeName)) {
            bfs(otherTypeName, depth + 1);
          }
        }
      }
    }
  }
  
  for (const focusType of focusTypes) {
    bfs(focusType, 0);
  }
  
  return result;
}

/**
 * Truncates a type name if it's too long
 * 
 * @param typeName Name of the type
 * @returns Truncated type name
 */
function truncateType(typeName: string): string {
  if (typeName.length <= 30) return typeName;
  return typeName.substring(0, 27) + '...';
}

/**
 * Escapes a type name for Mermaid diagrams
 * 
 * @param typeName Name of the type
 * @returns Escaped type name
 */
function escapeTypeName(typeName: string): string {
  // Replace characters that might cause issues in Mermaid diagrams
  return typeName
    .replace(/[<>]/g, '_')
    .replace(/\./g, '_')
    .replace(/\s/g, '_')
    .replace(/\[|\]/g, '_')
    .replace(/\{|\}/g, '_')
    .replace(/\(|\)/g, '_')
    .replace(/,/g, '_');
}

/**
 * Creates a visualization for the most complex types in a project
 * 
 * @param hierarchy Type hierarchy analysis
 * @param options Visualization options
 * @returns Visualization of the most complex types
 */
export function visualizeComplexTypes(
  hierarchy: TypeHierarchyAnalysis,
  options?: Partial<VisualizationOptions>
): string {
  // Get the 10 most complex types
  const complexTypes = hierarchy.largestTypes.map(t => t.name);
  
  return visualizeTypeHierarchy(hierarchy, {
    ...options,
    focusTypes: complexTypes,
    includeProperties: true,
    includeMethods: true
  });
}

/**
 * Creates a visualization of circular dependencies
 * 
 * @param hierarchy Type hierarchy analysis
 * @param options Visualization options
 * @returns Visualization of circular dependencies
 */
export function visualizeCircularDependencies(
  hierarchy: TypeHierarchyAnalysis,
  options?: Partial<VisualizationOptions>
): string {
  // Get all types involved in circular dependencies
  const circularTypes = Array.from(new Set(hierarchy.circularDependencies.flat()));
  
  return visualizeTypeHierarchy(hierarchy, {
    ...options,
    focusTypes: circularTypes,
    maxDepth: 1
  });
}

/**
 * Creates an HTML report with all visualizations
 * 
 * @param hierarchy Type hierarchy analysis
 * @param outputDir Directory to write the report to
 */
export function createTypeVisualizationReport(
  hierarchy: TypeHierarchyAnalysis,
  outputDir: string
): void {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate visualizations
  const fullGraph = visualizeTypeHierarchy(hierarchy, {
    format: 'dot',
    includeOrphans: false,
    includeProperties: false,
    includeMethods: false,
    outputPath: path.join(outputDir, 'full-graph.dot')
  });
  
  const complexTypesGraph = visualizeComplexTypes(hierarchy, {
    format: 'dot',
    includeProperties: true,
    includeMethods: true,
    outputPath: path.join(outputDir, 'complex-types.dot')
  });
  
  const circularDependenciesGraph = visualizeCircularDependencies(hierarchy, {
    format: 'dot',
    outputPath: path.join(outputDir, 'circular-dependencies.dot')
  });
  
  const mermaidDiagram = visualizeTypeHierarchy(hierarchy, {
    format: 'mermaid',
    includeOrphans: false,
    maxDepth: 2,
    includeProperties: false,
    includeMethods: false,
    outputPath: path.join(outputDir, 'type-hierarchy.md')
  });
  
  const jsonData = visualizeTypeHierarchy(hierarchy, {
    format: 'json',
    includeOrphans: true,
    includeProperties: true,
    includeMethods: true,
    outputPath: path.join(outputDir, 'type-data.json')
  });
  
  // Create HTML report
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Type Visualization Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #1a73e8;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .number {
      font-size: 2rem;
      font-weight: bold;
      color: #1a73e8;
      margin: 10px 0;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .download-links {
      margin-top: 20px;
    }
    .download-links a {
      display: inline-block;
      margin-right: 15px;
      margin-bottom: 10px;
      padding: 8px 15px;
      background-color: #1a73e8;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }
    .warning {
      background-color: #feefe3;
      border-left: 4px solid #f6a54c;
      padding: 15px;
      margin: 15px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>TypeScript Type Foundation Report</h1>
    
    <div class="section">
      <h2>Overview</h2>
      <div class="stats">
        <div class="stat-card">
          <div>Total Types</div>
          <div class="number">${hierarchy.typeCount}</div>
        </div>
        <div class="stat-card">
          <div>Interfaces</div>
          <div class="number">${hierarchy.interfaceCount}</div>
        </div>
        <div class="stat-card">
          <div>Type Aliases</div>
          <div class="number">${hierarchy.typeAliasCount}</div>
        </div>
        <div class="stat-card">
          <div>Enums</div>
          <div class="number">${hierarchy.enumCount}</div>
        </div>
        <div class="stat-card">
          <div>Generic Types</div>
          <div class="number">${hierarchy.genericTypeCount}</div>
        </div>
        <div class="stat-card">
          <div>Orphaned Types</div>
          <div class="number">${hierarchy.orphanedTypes.length}</div>
        </div>
        <div class="stat-card">
          <div>Missing Types</div>
          <div class="number">${hierarchy.missingTypes.length}</div>
        </div>
        <div class="stat-card">
          <div>Circular Dependencies</div>
          <div class="number">${hierarchy.circularDependencies.length}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>Most Complex Types</h2>
      <p>These types have the highest complexity scores based on properties, methods, and inheritance.</p>
      <table>
        <tr>
          <th>Type Name</th>
          <th>Complexity Score</th>
        </tr>
        ${hierarchy.largestTypes.map(type => `
        <tr>
          <td>${type.name}</td>
          <td>${type.complexity}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    
    ${hierarchy.circularDependencies.length > 0 ? `
    <div class="section">
      <h2>Circular Dependencies</h2>
      <div class="warning">
        <strong>Warning:</strong> Circular dependencies can lead to harder-to-maintain code and potential runtime issues.
      </div>
      <ul>
        ${hierarchy.circularDependencies.map(cycle => `
        <li>${cycle.join(' → ')} → ${cycle[0]}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${hierarchy.missingTypes.length > 0 ? `
    <div class="section">
      <h2>Missing Types</h2>
      <p>These types are referenced in the codebase but not defined.</p>
      <ul>
        ${hierarchy.missingTypes.slice(0, 20).map(type => `<li>${type}</li>`).join('')}
        ${hierarchy.missingTypes.length > 20 ? `<li>...and ${hierarchy.missingTypes.length - 20} more</li>` : ''}
      </ul>
    </div>
    ` : ''}
    
    <div class="section">
      <h2>Download Visualizations</h2>
      <p>You can use GraphViz to render .dot files into visual diagrams. For Mermaid diagrams, you can use the Mermaid Live Editor or any markdown previewer that supports Mermaid.</p>
      <div class="download-links">
        <a href="full-graph.dot" download>Full Type Graph (DOT)</a>
        <a href="complex-types.dot" download>Complex Types (DOT)</a>
        <a href="circular-dependencies.dot" download>Circular Dependencies (DOT)</a>
        <a href="type-hierarchy.md" download>Type Hierarchy (Mermaid)</a>
        <a href="type-data.json" download>Type Data (JSON)</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
}