/**
 * @file ts-type-visualizer.ts
 * @description Type hierarchy visualization utilities for TypeScript error management
 * 
 * This module provides tools for visualizing the type hierarchy of a TypeScript project,
 * helping developers understand type relationships and identify problems.
 */

import { TypeHierarchy } from './ts-type-analyzer';

/**
 * Options for generating type hierarchy visualizations
 */
export interface VisualizationOptions {
  format: 'json' | 'dot' | 'mermaid' | 'svg';
  includeStandardTypes: boolean;
  filterByModule?: string;
  focusOnType?: string;
  maxDepth?: number;
  highlightCircularDependencies?: boolean;
  highlightMissingTypes?: boolean;
}

/**
 * Default visualization options
 */
const defaultOptions: VisualizationOptions = {
  format: 'json',
  includeStandardTypes: false,
  maxDepth: 5,
  highlightCircularDependencies: true,
  highlightMissingTypes: true
};

/**
 * Standard TypeScript types to optionally filter out
 */
const standardTypes = [
  'Array', 'ReadonlyArray', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Promise', 'Date', 'RegExp', 'Error', 'Function',
  'String', 'Number', 'Boolean', 'Object', 'Symbol',
  'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit',
  'Exclude', 'Extract', 'NonNullable', 'Parameters', 'ConstructorParameters',
  'ReturnType', 'InstanceType', 'ThisParameterType', 'OmitThisParameter',
  'ThisType'
];

/**
 * Generates a visualization of a type hierarchy
 * 
 * @param hierarchy Type hierarchy analysis results
 * @param options Visualization options
 * @returns Visualization in the requested format
 */
export function visualizeTypeHierarchy(
  hierarchy: TypeHierarchy,
  options: Partial<VisualizationOptions> = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  // Apply filtering
  const filteredHierarchy = filterHierarchy(hierarchy, opts);
  
  // Generate visualization in the requested format
  switch (opts.format) {
    case 'json':
      return generateJsonVisualization(filteredHierarchy, opts);
    case 'dot':
      return generateDotVisualization(filteredHierarchy, opts);
    case 'mermaid':
      return generateMermaidVisualization(filteredHierarchy, opts);
    case 'svg':
      return generateSvgVisualization(filteredHierarchy, opts);
    default:
      throw new Error(`Unsupported visualization format: ${opts.format}`);
  }
}

/**
 * Filters a type hierarchy based on visualization options
 */
function filterHierarchy(
  hierarchy: TypeHierarchy,
  options: VisualizationOptions
): TypeHierarchy {
  let interfaces = { ...hierarchy.interfaces };
  let types = { ...hierarchy.types };
  let missingTypes = [...hierarchy.missingTypes];
  let circularDependencies = [...hierarchy.circularDependencies];
  
  // Filter out standard types if requested
  if (!options.includeStandardTypes) {
    for (const stdType of standardTypes) {
      delete interfaces[stdType];
      delete types[stdType];
      missingTypes = missingTypes.filter(t => t !== stdType);
    }
    
    // Also filter out standard types from the dependencies
    for (const type in interfaces) {
      interfaces[type] = interfaces[type].filter(t => !standardTypes.includes(t));
    }
    for (const type in types) {
      types[type] = types[type].filter(t => !standardTypes.includes(t));
    }
    
    // Filter circular dependencies that include standard types
    circularDependencies = circularDependencies.filter(cycle => 
      !cycle.some(t => standardTypes.includes(t))
    );
  }
  
  // Filter by module if requested
  if (options.filterByModule) {
    // This would require module information from the analyzer
    // For now, we'll leave this as a placeholder
  }
  
  // Focus on a specific type if requested
  if (options.focusOnType) {
    const focusType = options.focusOnType;
    const typesToKeep = new Set<string>([focusType]);
    
    // Helper function to collect related types up to maxDepth
    const collectRelatedTypes = (
      typeName: string, 
      depth: number = 0, 
      visited: Set<string> = new Set()
    ) => {
      if (depth > (options.maxDepth || 5) || visited.has(typeName)) {
        return;
      }
      
      visited.add(typeName);
      typesToKeep.add(typeName);
      
      // Add dependencies
      const deps = [
        ...(interfaces[typeName] || []), 
        ...(types[typeName] || [])
      ];
      
      for (const dep of deps) {
        typesToKeep.add(dep);
        collectRelatedTypes(dep, depth + 1, visited);
      }
      
      // Add dependents (types that depend on this one)
      for (const [type, deps] of Object.entries(interfaces)) {
        if (deps.includes(typeName)) {
          typesToKeep.add(type);
          collectRelatedTypes(type, depth + 1, visited);
        }
      }
      
      for (const [type, deps] of Object.entries(types)) {
        if (deps.includes(typeName)) {
          typesToKeep.add(type);
          collectRelatedTypes(type, depth + 1, visited);
        }
      }
    };
    
    collectRelatedTypes(focusType);
    
    // Filter interfaces and types to only include the ones we want to keep
    interfaces = Object.entries(interfaces)
      .filter(([type]) => typesToKeep.has(type))
      .reduce((obj, [type, deps]) => {
        obj[type] = deps.filter(d => typesToKeep.has(d));
        return obj;
      }, {} as Record<string, string[]>);
    
    types = Object.entries(types)
      .filter(([type]) => typesToKeep.has(type))
      .reduce((obj, [type, deps]) => {
        obj[type] = deps.filter(d => typesToKeep.has(d));
        return obj;
      }, {} as Record<string, string[]>);
    
    // Filter missing types to only include the ones related to our focus
    missingTypes = missingTypes.filter(t => typesToKeep.has(t));
    
    // Filter circular dependencies to only include the ones that involve our focus
    circularDependencies = circularDependencies.filter(cycle => 
      cycle.some(t => typesToKeep.has(t))
    );
  }
  
  return {
    interfaces,
    types,
    missingTypes,
    circularDependencies
  };
}

/**
 * Generates a JSON visualization of a type hierarchy
 */
function generateJsonVisualization(
  hierarchy: TypeHierarchy,
  options: VisualizationOptions
): string {
  // Convert hierarchy to a more visualization-friendly structure
  const nodes: {
    id: string;
    type: 'interface' | 'type' | 'missing';
    dependencies: string[];
    isCircular: boolean;
  }[] = [];
  
  // Add interfaces
  for (const [name, deps] of Object.entries(hierarchy.interfaces)) {
    nodes.push({
      id: name,
      type: 'interface',
      dependencies: deps,
      isCircular: hierarchy.circularDependencies.some(cycle => cycle.includes(name))
    });
  }
  
  // Add types
  for (const [name, deps] of Object.entries(hierarchy.types)) {
    nodes.push({
      id: name,
      type: 'type',
      dependencies: deps,
      isCircular: hierarchy.circularDependencies.some(cycle => cycle.includes(name))
    });
  }
  
  // Add missing types
  for (const name of hierarchy.missingTypes) {
    // Avoid duplicates (missing types might already be added as types or interfaces)
    if (!nodes.some(n => n.id === name)) {
      nodes.push({
        id: name,
        type: 'missing',
        dependencies: [],
        isCircular: hierarchy.circularDependencies.some(cycle => cycle.includes(name))
      });
    }
  }
  
  // Generate links between nodes
  const links = nodes.flatMap(node => 
    node.dependencies.map(target => ({
      source: node.id,
      target,
      type: node.type === 'interface' ? 'extends' : 'references'
    }))
  );
  
  const result = {
    nodes,
    links,
    circularDependencies: hierarchy.circularDependencies
  };
  
  return JSON.stringify(result, null, 2);
}

/**
 * Generates a DOT language visualization (for Graphviz) of a type hierarchy
 */
function generateDotVisualization(
  hierarchy: TypeHierarchy,
  options: VisualizationOptions
): string {
  // Create sets for faster lookups
  const interfaceSet = new Set(Object.keys(hierarchy.interfaces));
  const typeSet = new Set(Object.keys(hierarchy.types));
  const missingSet = new Set(hierarchy.missingTypes);
  const circularSet = new Set(
    hierarchy.circularDependencies.flatMap(cycle => cycle)
  );
  
  let dot = 'digraph TypeHierarchy {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style=filled, fontname="Arial"];\n';
  dot += '  edge [fontname="Arial", fontsize=10];\n\n';
  
  // Add nodes
  for (const interfaceName of interfaceSet) {
    const isCircular = circularSet.has(interfaceName);
    const color = isCircular && options.highlightCircularDependencies ? 'lightpink' : 'lightblue';
    dot += `  "${interfaceName}" [label="${interfaceName}", fillcolor="${color}"];\n`;
  }
  
  for (const typeName of typeSet) {
    const isCircular = circularSet.has(typeName);
    const color = isCircular && options.highlightCircularDependencies ? 'lightpink' : 'lightgreen';
    dot += `  "${typeName}" [label="${typeName}", fillcolor="${color}"];\n`;
  }
  
  for (const missingName of missingSet) {
    // Skip if it's already added as an interface or type
    if (interfaceSet.has(missingName) || typeSet.has(missingName)) {
      continue;
    }
    
    const color = options.highlightMissingTypes ? 'lightsalmon' : 'lightgrey';
    dot += `  "${missingName}" [label="${missingName}", fillcolor="${color}", style="filled,dashed"];\n`;
  }
  
  // Add edges
  for (const [interfaceName, extendedInterfaces] of Object.entries(hierarchy.interfaces)) {
    for (const extended of extendedInterfaces) {
      dot += `  "${interfaceName}" -> "${extended}" [label="extends"];\n`;
    }
  }
  
  for (const [typeName, referencedTypes] of Object.entries(hierarchy.types)) {
    for (const referenced of referencedTypes) {
      dot += `  "${typeName}" -> "${referenced}" [label="references"];\n`;
    }
  }
  
  // Highlight circular dependencies
  if (options.highlightCircularDependencies) {
    for (const cycle of hierarchy.circularDependencies) {
      for (let i = 0; i < cycle.length; i++) {
        const source = cycle[i];
        const target = cycle[(i + 1) % cycle.length];
        dot += `  "${source}" -> "${target}" [color="red", penwidth=2.0];\n`;
      }
    }
  }
  
  dot += '}';
  return dot;
}

/**
 * Generates a Mermaid diagram visualization of a type hierarchy
 */
function generateMermaidVisualization(
  hierarchy: TypeHierarchy,
  options: VisualizationOptions
): string {
  let mermaid = 'graph LR\n';
  
  // Create sets for faster lookups
  const interfaceSet = new Set(Object.keys(hierarchy.interfaces));
  const typeSet = new Set(Object.keys(hierarchy.types));
  const missingSet = new Set(hierarchy.missingTypes);
  const circularSet = new Set(
    hierarchy.circularDependencies.flatMap(cycle => cycle)
  );
  
  // Add nodes
  for (const interfaceName of interfaceSet) {
    const isCircular = circularSet.has(interfaceName);
    const style = isCircular && options.highlightCircularDependencies ? 
      'fill:#faa,stroke:#f66' : 'fill:#acf,stroke:#36c';
    mermaid += `  ${sanitizeMermaidId(interfaceName)}["${interfaceName}"]:::interface\n`;
  }
  
  for (const typeName of typeSet) {
    const isCircular = circularSet.has(typeName);
    const style = isCircular && options.highlightCircularDependencies ? 
      'fill:#faa,stroke:#f66' : 'fill:#afa,stroke:#3a3';
    mermaid += `  ${sanitizeMermaidId(typeName)}["${typeName}"]:::type\n`;
  }
  
  for (const missingName of missingSet) {
    // Skip if it's already added as an interface or type
    if (interfaceSet.has(missingName) || typeSet.has(missingName)) {
      continue;
    }
    
    mermaid += `  ${sanitizeMermaidId(missingName)}["${missingName}"]:::missing\n`;
  }
  
  // Add edges
  for (const [interfaceName, extendedInterfaces] of Object.entries(hierarchy.interfaces)) {
    for (const extended of extendedInterfaces) {
      mermaid += `  ${sanitizeMermaidId(interfaceName)} -->|extends| ${sanitizeMermaidId(extended)}\n`;
    }
  }
  
  for (const [typeName, referencedTypes] of Object.entries(hierarchy.types)) {
    for (const referenced of referencedTypes) {
      mermaid += `  ${sanitizeMermaidId(typeName)} -->|uses| ${sanitizeMermaidId(referenced)}\n`;
    }
  }
  
  // Add class definitions
  mermaid += '\n  classDef interface fill:#acf,stroke:#36c,stroke-width:1px\n';
  mermaid += '  classDef type fill:#afa,stroke:#3a3,stroke-width:1px\n';
  mermaid += '  classDef missing fill:#fda,stroke:#a73,stroke-width:1px,stroke-dasharray: 5 5\n';
  
  if (options.highlightCircularDependencies) {
    mermaid += '  classDef circular fill:#faa,stroke:#f66,stroke-width:2px\n';
    
    // Apply circular class to circular nodes
    const circularNodes = Array.from(circularSet).map(sanitizeMermaidId).join(',');
    if (circularNodes) {
      mermaid += `  class ${circularNodes} circular\n`;
    }
  }
  
  return mermaid;
}

/**
 * Sanitizes a string to be used as a Mermaid node ID
 */
function sanitizeMermaidId(id: string): string {
  // Remove problematic characters and replace with underscores
  return 'id_' + id.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Generates an SVG visualization of a type hierarchy
 * 
 * Note: This is a simplified version that creates a basic SVG.
 * A real implementation might use a library like D3.js.
 */
function generateSvgVisualization(
  hierarchy: TypeHierarchy,
  options: VisualizationOptions
): string {
  // For the SVG format, we'll generate a simplified force-directed graph
  
  // Convert hierarchy to nodes and links
  const nodes: {
    id: string;
    type: 'interface' | 'type' | 'missing';
    x?: number;
    y?: number;
  }[] = [];
  
  const links: {
    source: string;
    target: string;
    type: 'extends' | 'references';
  }[] = [];
  
  // Create sets for faster lookups
  const interfaceSet = new Set(Object.keys(hierarchy.interfaces));
  const typeSet = new Set(Object.keys(hierarchy.types));
  const missingSet = new Set(hierarchy.missingTypes);
  const circularSet = new Set(
    hierarchy.circularDependencies.flatMap(cycle => cycle)
  );
  
  // Add interface nodes
  for (const interfaceName of interfaceSet) {
    nodes.push({
      id: interfaceName,
      type: 'interface'
    });
  }
  
  // Add type nodes
  for (const typeName of typeSet) {
    nodes.push({
      id: typeName,
      type: 'type'
    });
  }
  
  // Add missing type nodes
  for (const missingName of missingSet) {
    // Skip if it's already added as an interface or type
    if (interfaceSet.has(missingName) || typeSet.has(missingName)) {
      continue;
    }
    
    nodes.push({
      id: missingName,
      type: 'missing'
    });
  }
  
  // Add links
  for (const [interfaceName, extendedInterfaces] of Object.entries(hierarchy.interfaces)) {
    for (const extended of extendedInterfaces) {
      links.push({
        source: interfaceName,
        target: extended,
        type: 'extends'
      });
    }
  }
  
  for (const [typeName, referencedTypes] of Object.entries(hierarchy.types)) {
    for (const referenced of referencedTypes) {
      links.push({
        source: typeName,
        target: referenced,
        type: 'references'
      });
    }
  }
  
  // Very basic layout - a real implementation would use a force-directed layout algorithm
  const width = 1200;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  
  // Position nodes in a circle
  const angleStep = (2 * Math.PI) / nodes.length;
  for (let i = 0; i < nodes.length; i++) {
    const angle = i * angleStep;
    nodes[i].x = centerX + radius * Math.cos(angle);
    nodes[i].y = centerY + radius * Math.sin(angle);
  }
  
  // Generate SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += '  <defs>\n';
  svg += '    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">\n';
  svg += '      <polygon points="0 0, 10 3.5, 0 7" fill="#999" />\n';
  svg += '    </marker>\n';
  svg += '  </defs>\n';
  
  // Draw links
  for (const link of links) {
    const source = nodes.find(n => n.id === link.source);
    const target = nodes.find(n => n.id === link.target);
    
    if (source && target && source.x !== undefined && source.y !== undefined && 
        target.x !== undefined && target.y !== undefined) {
      
      const isCircular = options.highlightCircularDependencies && 
        hierarchy.circularDependencies.some(cycle => 
          cycle.includes(link.source) && cycle.includes(link.target)
        );
      
      const strokeColor = isCircular ? '#f66' : '#999';
      const strokeWidth = isCircular ? 2 : 1;
      
      svg += `  <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" `;
      svg += `stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="url(#arrowhead)" />\n`;
    }
  }
  
  // Draw nodes
  for (const node of nodes) {
    if (node.x === undefined || node.y === undefined) continue;
    
    const isCircular = circularSet.has(node.id);
    
    let fillColor = '#ccc';
    let strokeColor = '#999';
    let strokeWidth = 1;
    let strokeDasharray = '';
    
    switch (node.type) {
      case 'interface':
        fillColor = isCircular && options.highlightCircularDependencies ? '#faa' : '#acf';
        strokeColor = isCircular && options.highlightCircularDependencies ? '#f66' : '#36c';
        strokeWidth = isCircular && options.highlightCircularDependencies ? 2 : 1;
        break;
      case 'type':
        fillColor = isCircular && options.highlightCircularDependencies ? '#faa' : '#afa';
        strokeColor = isCircular && options.highlightCircularDependencies ? '#f66' : '#3a3';
        strokeWidth = isCircular && options.highlightCircularDependencies ? 2 : 1;
        break;
      case 'missing':
        fillColor = options.highlightMissingTypes ? '#fda' : '#ddd';
        strokeColor = options.highlightMissingTypes ? '#a73' : '#999';
        strokeDasharray = '5,5';
        break;
    }
    
    // Draw node
    svg += `  <rect x="${node.x - 60}" y="${node.y - 20}" width="120" height="40" rx="5" ry="5" `;
    svg += `fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
    
    if (strokeDasharray) {
      svg += ` stroke-dasharray="${strokeDasharray}"`;
    }
    
    svg += ' />\n';
    
    // Draw node label
    svg += `  <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-family="Arial" font-size="12">${node.id}</text>\n`;
  }
  
  // Add legend
  svg += `  <rect x="20" y="${height - 140}" width="180" height="120" fill="white" stroke="#999" />\n`;
  svg += `  <text x="110" y="${height - 115}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">Legend</text>\n`;
  
  // Legend items
  const legendItems = [
    { type: 'interface', label: 'Interface', fill: '#acf', stroke: '#36c' },
    { type: 'type', label: 'Type', fill: '#afa', stroke: '#3a3' },
    { type: 'missing', label: 'Missing Type', fill: '#fda', stroke: '#a73', dasharray: '5,5' }
  ];
  
  if (options.highlightCircularDependencies) {
    legendItems.push({ type: 'circular', label: 'Circular Dependency', fill: '#faa', stroke: '#f66' });
  }
  
  for (let i = 0; i < legendItems.length; i++) {
    const item = legendItems[i];
    const y = height - 90 + i * 25;
    
    svg += `  <rect x="30" y="${y - 10}" width="20" height="20" fill="${item.fill}" stroke="${item.stroke}"`;
    
    if (item.dasharray) {
      svg += ` stroke-dasharray="${item.dasharray}"`;
    }
    
    svg += ' />\n';
    svg += `  <text x="60" y="${y + 5}" font-family="Arial" font-size="12" text-anchor="start">${item.label}</text>\n`;
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Generates a visualization of type coverage metrics
 * 
 * @param coverage Type coverage metrics
 * @param options Visualization options
 * @returns Visualization in the requested format
 */
export function visualizeTypeCoverage(
  coverage: {
    coverage: number;
    filesCovered: number;
    totalFiles: number;
    missingCoverage: string[];
    implicitAnyCount: number;
    explicitTypeCount: number;
    typeByFileMap: Record<string, number>;
  },
  format: 'json' | 'svg' = 'json'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(coverage, null, 2);
      
    case 'svg':
      // Generate a simple SVG bar chart of type coverage by file
      const width = 1000;
      const height = 600;
      const margin = { top: 60, right: 20, bottom: 120, left: 60 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      
      // Get top files by coverage (lowest first)
      const sortedFiles = Object.entries(coverage.typeByFileMap)
        .sort(([, a], [, b]) => a - b)
        .slice(0, 20); // Show top 20 worst files
      
      const barWidth = Math.min(40, chartWidth / sortedFiles.length - 5);
      
      let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
      
      // Add title
      svg += `  <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold">TypeScript Type Coverage by File</text>\n`;
      svg += `  <text x="${width / 2}" y="50" text-anchor="middle" font-family="Arial" font-size="14">Overall Coverage: ${coverage.coverage.toFixed(1)}%</text>\n`;
      
      // Add axes
      svg += `  <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="black" />\n`;
      svg += `  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="black" />\n`;
      
      // Add y-axis labels
      for (let i = 0; i <= 10; i++) {
        const y = margin.top + (chartHeight - chartHeight * i / 10);
        svg += `  <line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="black" />\n`;
        svg += `  <text x="${margin.left - 10}" y="${y + 5}" text-anchor="end" font-family="Arial" font-size="12">${i * 10}%</text>\n`;
      }
      
      // Add bars
      sortedFiles.forEach(([file, coverageValue], index) => {
        const x = margin.left + index * (chartWidth / sortedFiles.length) + (chartWidth / sortedFiles.length - barWidth) / 2;
        const barHeight = (coverageValue / 100) * chartHeight;
        const y = height - margin.bottom - barHeight;
        
        // Calculate color based on coverage (red to green)
        const red = Math.round(255 * (1 - coverageValue / 100));
        const green = Math.round(255 * (coverageValue / 100));
        const color = `rgb(${red}, ${green}, 100)`;
        
        svg += `  <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="#333" />\n`;
        svg += `  <text x="${x + barWidth / 2}" y="${height - margin.bottom + 15}" text-anchor="middle" font-family="Arial" font-size="10" transform="rotate(45, ${x + barWidth / 2}, ${height - margin.bottom + 15})">${trimFileName(file)}</text>\n`;
        svg += `  <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-family="Arial" font-size="10">${coverageValue.toFixed(0)}%</text>\n`;
      });
      
      // Add legend
      svg += `  <rect x="${width - 220}" y="${margin.top}" width="180" height="100" fill="white" stroke="#999" />\n`;
      svg += `  <text x="${width - 130}" y="${margin.top + 25}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">Legend</text>\n`;
      
      svg += `  <rect x="${width - 200}" y="${margin.top + 40}" width="20" height="20" fill="rgb(0, 255, 100)" stroke="#333" />\n`;
      svg += `  <text x="${width - 170}" y="${margin.top + 55}" font-family="Arial" font-size="12" text-anchor="start">100% Coverage</text>\n`;
      
      svg += `  <rect x="${width - 200}" y="${margin.top + 70}" width="20" height="20" fill="rgb(255, 0, 100)" stroke="#333" />\n`;
      svg += `  <text x="${width - 170}" y="${margin.top + 85}" font-family="Arial" font-size="12" text-anchor="start">0% Coverage</text>\n`;
      
      svg += '</svg>';
      return svg;
      
    default:
      throw new Error(`Unsupported visualization format: ${format}`);
  }
}

/**
 * Trims a file name for display in visualizations
 */
function trimFileName(file: string): string {
  // Get the file name without the path
  const parts = file.split(/[\/\\]/);
  const fileName = parts[parts.length - 1];
  
  // If the file name is too long, truncate it
  return fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
}