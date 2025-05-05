/**
 * TypeScript Error Fixer
 * 
 * This utility applies fixes to TypeScript errors based on patterns.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptErrorDetail } from './ts-error-finder';
import advancedErrorPatterns from './error-patterns/advanced-patterns';

/**
 * Fix result interface
 */
export interface FixResult {
  fixed: Array<{
    id: string;
    file: string;
    line: number;
    column: number;
    error: string;
    pattern: string;
    description: string;
  }>;
  notFixed: TypeScriptErrorDetail[];
  success: boolean;
}

/**
 * Apply pattern-based fixes to TypeScript errors
 */
export async function fixErrorsWithPattern(
  errors: TypeScriptErrorDetail[],
  patternId: string,
  projectRoot: string = process.cwd()
): Promise<FixResult> {
  console.log(`Applying fixes for pattern: ${patternId}`);
  
  // Find the error pattern
  const pattern = advancedErrorPatterns.find(p => p.id === patternId);
  
  if (!pattern) {
    console.error(`Pattern not found: ${patternId}`);
    return {
      fixed: [],
      notFixed: errors,
      success: false
    };
  }
  
  // Find errors that match the pattern
  const matchingErrors = errors.filter(error => {
    const regex = new RegExp(pattern.regex, 'i');
    const matches = regex.test(error.message);
    
    // Check context pattern if available
    if (matches && pattern.contextPattern && error.context) {
      const contextRegex = new RegExp(pattern.contextPattern, 'i');
      return contextRegex.test(error.context);
    }
    
    return matches;
  });
  
  console.log(`Found ${matchingErrors.length} errors matching pattern ${patternId}`);
  
  // Find automated fixes
  const automatedFixes = pattern.fixes.filter(fix => fix.automated);
  
  if (automatedFixes.length === 0) {
    console.log(`No automated fixes available for pattern ${patternId}`);
    return {
      fixed: [],
      notFixed: errors,
      success: false
    };
  }
  
  // Apply fixes
  const fixed: Array<{
    id: string;
    file: string;
    line: number;
    column: number;
    error: string;
    pattern: string;
    description: string;
  }> = [];
  
  const notFixed: TypeScriptErrorDetail[] = [...errors];
  
  for (const error of matchingErrors) {
    const filePath = path.resolve(projectRoot, error.file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    
    // Choose the first automated fix for the error
    const fix = automatedFixes[0];
    
    try {
      // Read file
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Get error line
      const errorLine = lines[error.line - 1];
      
      // Create a simple fix by applying a regex replacement
      // In a real implementation, this would be more sophisticated
      const regex = new RegExp(pattern.regex, 'i');
      let fixedLine = errorLine;
      
      // Use pattern examples to perform a replacement
      // This is a simple approach and would be more complex in real implementation
      const beforeExample = fix.example.before.split('\n')[0];
      const afterExample = fix.example.after.split('\n')[0];
      
      if (beforeExample && afterExample) {
        // Extract common patterns between error line and example
        const commonPattern = findCommonPattern(errorLine, beforeExample);
        
        if (commonPattern) {
          // Apply the same transformation from example to the error line
          fixedLine = applyTransformation(errorLine, beforeExample, afterExample, commonPattern);
        }
      }
      
      // If we couldn't create a transformed line, use a simple regex replacement
      if (fixedLine === errorLine) {
        fixedLine = errorLine.replace(regex, match => {
          // Simple fix logic - this would be much more sophisticated in practice
          if (pattern.id.includes('type-assertion')) {
            return match.replace('as any', 'as unknown');
          }
          
          if (pattern.id.includes('null-handling')) {
            return match.replace('.', '?.');
          }
          
          return match;
        });
      }
      
      // Don't apply fix if nothing changed
      if (fixedLine === errorLine) {
        continue;
      }
      
      // Update line
      lines[error.line - 1] = fixedLine;
      
      // Write file
      fs.writeFileSync(filePath, lines.join('\n'));
      
      // Record fix
      fixed.push({
        id: error.id,
        file: error.file,
        line: error.line,
        column: error.column,
        error: error.message,
        pattern: patternId,
        description: fix.description
      });
      
      // Remove from notFixed
      const index = notFixed.findIndex(e => e.id === error.id);
      if (index !== -1) {
        notFixed.splice(index, 1);
      }
      
      console.log(`Fixed ${error.file}:${error.line} with pattern ${patternId}`);
    } catch (error) {
      console.error(`Error applying fix to ${filePath}:${error.line}: ${error.message}`);
    }
  }
  
  return {
    fixed,
    notFixed,
    success: fixed.length > 0
  };
}

/**
 * Find a common pattern between two strings
 */
function findCommonPattern(str1: string, str2: string): string | null {
  // Simple pattern matching - would be more sophisticated in practice
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const minLength = Math.min(words1.length, words2.length);
  
  // Look for common word sequences
  for (let len = minLength; len > 0; len--) {
    for (let i = 0; i <= words1.length - len; i++) {
      const pattern = words1.slice(i, i + len).join(' ');
      
      if (str2.includes(pattern) && pattern.length > 5) {
        return pattern;
      }
    }
  }
  
  return null;
}

/**
 * Apply a transformation from example to target
 */
function applyTransformation(
  target: string, 
  beforeExample: string, 
  afterExample: string, 
  commonPattern: string
): string {
  // Find what changed in the example
  const beforeIndex = beforeExample.indexOf(commonPattern);
  const afterIndex = afterExample.indexOf(commonPattern);
  
  // If pattern is not in after example, can't transform
  if (afterIndex === -1) {
    return target;
  }
  
  // Analyze modifications: what was added before/after the pattern
  const beforePrefix = beforeExample.substring(0, beforeIndex);
  const afterPrefix = afterExample.substring(0, afterIndex);
  
  const beforeSuffix = beforeExample.substring(beforeIndex + commonPattern.length);
  const afterSuffix = afterExample.substring(afterIndex + commonPattern.length);
  
  // Apply same modifications to target
  const targetIndex = target.indexOf(commonPattern);
  
  if (targetIndex === -1) {
    return target;
  }
  
  const targetPrefix = target.substring(0, targetIndex);
  const targetSuffix = target.substring(targetIndex + commonPattern.length);
  
  // Calculate the new prefix and suffix
  let newPrefix = targetPrefix;
  if (beforePrefix !== afterPrefix) {
    newPrefix = targetPrefix.replace(beforePrefix, afterPrefix);
  }
  
  let newSuffix = targetSuffix;
  if (beforeSuffix !== afterSuffix) {
    newSuffix = targetSuffix.replace(beforeSuffix, afterSuffix);
  }
  
  return newPrefix + commonPattern + newSuffix;
}

/**
 * Build dependency graph between errors
 */
export function buildErrorDependencyGraph(
  errors: TypeScriptErrorDetail[]
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  
  // Initialize graph
  for (const error of errors) {
    const errorId = error.id;
    graph[errorId] = [];
  }
  
  // Build relationships (this would be more sophisticated in practice)
  for (const error of errors) {
    const errorId = error.id;
    const errorFile = error.file;
    
    // Find other errors in the same file
    const sameFileErrors = errors.filter(e => 
      e.id !== errorId && 
      e.file === errorFile &&
      e.line < error.line
    );
    
    // Add dependencies
    for (const dependency of sameFileErrors) {
      graph[errorId].push(dependency.id);
    }
  }
  
  return graph;
}

/**
 * Topological sort of errors to fix root causes first
 */
export function topologicalSortErrors(
  graph: Record<string, string[]>
): string[] {
  const result: string[] = [];
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  
  function visit(node: string) {
    // Skip if already in result
    if (visited[node]) {
      return;
    }
    
    // Check for cycles
    if (temp[node]) {
      return; // Skip cycles
    }
    
    temp[node] = true;
    
    // Visit dependencies
    for (const dependency of graph[node]) {
      visit(dependency);
    }
    
    temp[node] = false;
    visited[node] = true;
    result.push(node);
  }
  
  // Visit each node
  for (const node of Object.keys(graph)) {
    if (!visited[node]) {
      visit(node);
    }
  }
  
  return result;
}

export default {
  fixErrorsWithPattern,
  buildErrorDependencyGraph,
  topologicalSortErrors
};