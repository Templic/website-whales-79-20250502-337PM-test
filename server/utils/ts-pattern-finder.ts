/**
 * TypeScript Error Pattern Finder
 * 
 * This module analyzes TypeScript errors to find common patterns
 * and provides mechanisms for categorizing and fixing them.
 */

import * as fs from 'fs';
import * as path from 'path';
import { tsErrorStorage } from '../tsErrorStorage';
import { analyzePatternWithAI, isOpenAIConfigured } from './openai-integration';

// Interface for error pattern
interface ErrorPattern {
  name: string;
  description: string;
  category: string;
  severity: string;
  regex?: string;
  occurrences: number;
  autoFixable: boolean;
  examples: Array<{
    errorCode: string;
    errorMessage: string;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    errorContext: string;
  }>;
}

// Known error patterns that we can detect
const knownPatterns: Array<{
  name: string;
  description: string;
  category: string;
  severity: string;
  regex: RegExp;
  messageMatchers: string[];
  codeMatchers: string[];
  autoFixable: boolean;
}> = [
  {
    name: 'Missing Type Declaration',
    description: 'Variable or parameter is missing explicit type declaration',
    category: 'missing_type',
    severity: 'medium',
    regex: /Parameter '(\w+)' implicitly has an '(\w+)' type./,
    messageMatchers: [
      'implicitly has an',
      'implicit any',
      'type any'
    ],
    codeMatchers: [
      'TS7006'
    ],
    autoFixable: true
  },
  {
    name: 'Type Mismatch in Assignment',
    description: 'Value being assigned has a different type than the variable',
    category: 'type_mismatch',
    severity: 'high',
    regex: /Type '(.+)' is not assignable to type '(.+)'/,
    messageMatchers: [
      'is not assignable to type',
      'not assignable to parameter'
    ],
    codeMatchers: [
      'TS2322',
      'TS2345'
    ],
    autoFixable: true
  },
  {
    name: 'Property Does Not Exist',
    description: 'Trying to access a property that does not exist on an object',
    category: 'undefined_variable',
    severity: 'high',
    regex: /Property '(\w+)' does not exist on type '(.+)'/,
    messageMatchers: [
      'does not exist on type',
      'has no property'
    ],
    codeMatchers: [
      'TS2339'
    ],
    autoFixable: false
  },
  {
    name: 'Module Not Found',
    description: 'Import statement references a module that cannot be found',
    category: 'import_error',
    severity: 'critical',
    regex: /Cannot find module '(.+)' or its corresponding type declarations/,
    messageMatchers: [
      'Cannot find module',
      'Module not found'
    ],
    codeMatchers: [
      'TS2307'
    ],
    autoFixable: false
  },
  {
    name: 'Interface Implementation Missing',
    description: 'Class does not implement all members of an interface',
    category: 'interface_mismatch',
    severity: 'high',
    regex: /Class '(.+)' incorrectly implements interface '(.+)'/,
    messageMatchers: [
      'incorrectly implements interface',
      'missing the following properties'
    ],
    codeMatchers: [
      'TS2420'
    ],
    autoFixable: false
  },
  {
    name: 'Null/Undefined Reference',
    description: 'Attempting to use a value that could be null or undefined',
    category: 'null_reference',
    severity: 'high',
    regex: /Object is possibly '(null|undefined)'/,
    messageMatchers: [
      'possibly null',
      'possibly undefined',
      'Object is possibly'
    ],
    codeMatchers: [
      'TS2531',
      'TS2532'
    ],
    autoFixable: true
  },
  {
    name: 'Type Import Error',
    description: 'Error in type import statement or reference',
    category: 'import_error',
    severity: 'medium',
    regex: /Module '(.+)' has no exported member '(.+)'/,
    messageMatchers: [
      'has no exported member',
      'export declaration'
    ],
    codeMatchers: [
      'TS2305'
    ],
    autoFixable: true
  },
  {
    name: 'Function Signature Mismatch',
    description: 'Function called with incorrect parameter types or count',
    category: 'type_mismatch',
    severity: 'high',
    regex: /No overload matches this call/,
    messageMatchers: [
      'No overload matches this call',
      'Expected',
      'parameters'
    ],
    codeMatchers: [
      'TS2769'
    ],
    autoFixable: false
  },
  {
    name: 'Generic Type Constraint',
    description: 'Generic type parameter does not satisfy its constraints',
    category: 'generic_constraint',
    severity: 'medium',
    regex: /Type '(.+)' does not satisfy the constraint '(.+)'/,
    messageMatchers: [
      'does not satisfy the constraint',
      'Type argument'
    ],
    codeMatchers: [
      'TS2344'
    ],
    autoFixable: false
  },
  {
    name: 'Duplicate Identifier',
    description: 'Variable, function, or class name already declared',
    category: 'declaration_error',
    severity: 'medium',
    regex: /Duplicate identifier '(.+)'/,
    messageMatchers: [
      'Duplicate identifier',
      'already declared'
    ],
    codeMatchers: [
      'TS2300'
    ],
    autoFixable: true
  }
];

/**
 * Find common error patterns in a set of TypeScript errors
 * 
 * @param analysisResults Results from error analysis
 * @returns Array of identified patterns
 */
export async function findErrorPatterns(analysisResults: any): Promise<ErrorPattern[]> {
  try {
    const errors = analysisResults.errors || [];
    
    if (errors.length === 0) {
      return [];
    }
    
    // Group errors by message pattern
    const errorGroups: Record<string, any[]> = {};
    
    // First pass: group by error code
    for (const error of errors) {
      if (!errorGroups[error.errorCode]) {
        errorGroups[error.errorCode] = [];
      }
      
      errorGroups[error.errorCode].push(error);
    }
    
    // Find patterns from the groups
    const patterns: ErrorPattern[] = [];
    
    // Process each error group
    for (const [errorCode, codeErrors] of Object.entries(errorGroups)) {
      // Skip groups with only one error
      if (codeErrors.length < 2) {
        continue;
      }
      
      // Try to match against known patterns
      const matchedPattern = matchKnownPattern(errorCode, codeErrors);
      
      if (matchedPattern) {
        patterns.push(matchedPattern);
      } else {
        // Try to create a new pattern
        const newPattern = await createNewPattern(errorCode, codeErrors);
        
        if (newPattern) {
          patterns.push(newPattern);
        }
      }
    }
    
    // Second pass: group by similarity in error messages
    const messageGroups: Record<string, any[]> = {};
    
    for (const error of errors) {
      // Skip errors already processed
      if (patterns.some(p => p.examples.some(e => e.errorCode === error.errorCode && e.errorMessage === error.errorMessage))) {
        continue;
      }
      
      // Extract the first 5 words of the error message as a key
      const messageKey = error.errorMessage.split(' ').slice(0, 5).join(' ');
      
      if (!messageGroups[messageKey]) {
        messageGroups[messageKey] = [];
      }
      
      messageGroups[messageKey].push(error);
    }
    
    // Process message groups
    for (const [messageKey, messageErrors] of Object.entries(messageGroups)) {
      // Skip groups with only one error
      if (messageErrors.length < 2) {
        continue;
      }
      
      // Try to create a new pattern
      const newPattern = await createNewPattern(messageErrors[0].errorCode, messageErrors);
      
      if (newPattern) {
        patterns.push(newPattern);
      }
    }
    
    return patterns;
  } catch (error) {
    console.error('Error finding error patterns:', error);
    return [];
  }
}

/**
 * Match errors against known patterns
 * 
 * @param errorCode Error code
 * @param errors Array of errors with the same code
 * @returns Matched pattern or null
 */
function matchKnownPattern(errorCode: string, errors: any[]): ErrorPattern | null {
  try {
    // Find matching known pattern
    const matchingPatterns = knownPatterns.filter(
      knownPattern => 
        knownPattern.codeMatchers.includes(errorCode) ||
        errors.some(error => 
          knownPattern.messageMatchers.some(matcher => 
            error.errorMessage.includes(matcher)
          )
        )
    );
    
    if (matchingPatterns.length === 0) {
      return null;
    }
    
    // Use the first matching pattern
    const pattern = matchingPatterns[0];
    
    // Extract examples (up to 5)
    const examples = errors.slice(0, 5).map(error => ({
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      filePath: error.filePath,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      errorContext: error.errorContext || ''
    }));
    
    // Create pattern object
    return {
      name: pattern.name,
      description: pattern.description,
      category: pattern.category,
      severity: pattern.severity,
      regex: pattern.regex.source,
      occurrences: errors.length,
      autoFixable: pattern.autoFixable,
      examples
    };
  } catch (error) {
    console.error('Error matching known pattern:', error);
    return null;
  }
}

/**
 * Create a new pattern from a group of errors
 * 
 * @param errorCode Error code
 * @param errors Array of errors with the same code
 * @returns New pattern or null
 */
async function createNewPattern(errorCode: string, errors: any[]): Promise<ErrorPattern | null> {
  try {
    if (errors.length < 2) {
      return null;
    }
    
    // Get the first error for reference
    const firstError = errors[0];
    
    // Extract common words from error messages
    const commonWords = extractCommonWords(errors.map(e => e.errorMessage));
    
    // Create pattern name
    let name = `Unknown Error ${errorCode}`;
    
    if (commonWords.length > 0) {
      name = commonWords.slice(0, 4).join(' ');
      // Capitalize first letter
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    // Get file context for a better description
    let description = errors[0].errorMessage;
    
    // Try to use AI for a better description if available
    if (isOpenAIConfigured() && errors.length >= 3) {
      try {
        const aiAnalysis = await analyzePatternWithAI(
          {
            name,
            description,
            category: 'other',
            severity: 'medium',
            occurrences: errors.length
          },
          errors.slice(0, 3).map(e => ({
            errorCode: e.errorCode,
            errorMessage: e.errorMessage,
            errorContext: e.errorContext || ''
          }))
        );
        
        if (aiAnalysis.patternRootCause) {
          description = aiAnalysis.patternRootCause;
        }
      } catch (error) {
        console.error('Error using AI for pattern analysis:', error);
      }
    }
    
    // Determine category
    let category = 'other';
    
    if (firstError.errorMessage.includes('type')) {
      category = 'type_mismatch';
    } else if (firstError.errorMessage.includes('import') || firstError.errorMessage.includes('module')) {
      category = 'import_error';
    } else if (firstError.errorMessage.includes('undefined') || firstError.errorMessage.includes('null')) {
      category = 'null_reference';
    } else if (firstError.errorMessage.includes('interface')) {
      category = 'interface_mismatch';
    }
    
    // Determine severity
    let severity = 'medium';
    
    if (
      firstError.errorMessage.includes('cannot') ||
      firstError.errorMessage.includes('undefined') ||
      errors.length > 10
    ) {
      severity = 'high';
    } else if (
      firstError.errorMessage.includes('warning') ||
      errors.length < 3
    ) {
      severity = 'low';
    }
    
    // Extract examples (up to 5)
    const examples = errors.slice(0, 5).map(error => ({
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      filePath: error.filePath,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      errorContext: error.errorContext || ''
    }));
    
    // Create pattern object
    return {
      name,
      description,
      category,
      severity,
      occurrences: errors.length,
      autoFixable: false, // Default to false for new patterns
      examples
    };
  } catch (error) {
    console.error('Error creating new pattern:', error);
    return null;
  }
}

/**
 * Extract common words from a list of strings
 * 
 * @param strings Array of strings
 * @returns Array of common words
 */
function extractCommonWords(strings: string[]): string[] {
  try {
    // Tokenize all strings
    const tokenizedStrings = strings.map(str => 
      str.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
    );
    
    // Count word occurrences
    const wordCounts: Record<string, number> = {};
    
    for (const tokens of tokenizedStrings) {
      const uniqueTokens = [...new Set(tokens)];
      
      for (const token of uniqueTokens) {
        wordCounts[token] = (wordCounts[token] || 0) + 1;
      }
    }
    
    // Find common words (appearing in at least half of the strings)
    const threshold = Math.max(2, Math.floor(strings.length / 2));
    const commonWords = Object.entries(wordCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([word]) => word)
      // Skip common words that aren't informative
      .filter(word => !['the', 'and', 'this', 'that', 'with', 'from'].includes(word));
    
    return commonWords;
  } catch (error) {
    console.error('Error extracting common words:', error);
    return [];
  }
}

/**
 * Save an error pattern to the database
 * 
 * @param pattern Error pattern
 */
export async function saveErrorPattern(pattern: ErrorPattern): Promise<void> {
  try {
    // Check if pattern already exists
    const existingPatterns = await tsErrorStorage.getErrorPatterns({
      name: pattern.name
    });
    
    if (existingPatterns.length > 0) {
      // Update existing pattern
      await tsErrorStorage.updateErrorPattern(existingPatterns[0].id, {
        description: pattern.description,
        category: pattern.category,
        severity: pattern.severity,
        detectionRules: {
          regex: pattern.regex || null,
          examples: pattern.examples.slice(0, 2).map(e => ({
            errorCode: e.errorCode,
            errorMessage: e.errorMessage
          }))
        },
        autoFixable: pattern.autoFixable
      });
      
      console.log(`Updated existing pattern: ${pattern.name}`);
    } else {
      // Create new pattern
      const newPattern = await tsErrorStorage.createErrorPattern({
        name: pattern.name,
        description: pattern.description,
        regex: pattern.regex || null,
        category: pattern.category,
        severity: pattern.severity,
        detectionRules: {
          examples: pattern.examples.slice(0, 2).map(e => ({
            errorCode: e.errorCode,
            errorMessage: e.errorMessage
          }))
        },
        autoFixable: pattern.autoFixable
      });
      
      console.log(`Created new pattern: ${pattern.name} (ID: ${newPattern.id})`);
      
      // Update typescript errors with the pattern ID
      for (const example of pattern.examples) {
        const errors = await tsErrorStorage.getAllTypescriptErrors({
          errorCode: example.errorCode,
          filePath: example.filePath,
          lineNumber: example.lineNumber,
          columnNumber: example.columnNumber,
          limit: 1
        });
        
        if (errors.length > 0) {
          await tsErrorStorage.updateTypescriptError(errors[0].id, {
            patternId: newPattern.id
          });
        }
      }
    }
  } catch (error) {
    console.error('Error saving error pattern:', error);
    throw error;
  }
}

export default {
  findErrorPatterns,
  saveErrorPattern
};