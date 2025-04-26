/**
 * OpenAI Integration for TypeScript Error Management
 * 
 * This module provides functions to use OpenAI's API for analyzing and fixing TypeScript errors.
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { TypeScriptError } from './ts-error-analyzer';
import { ErrorPattern } from './ts-pattern-finder';

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY;
// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by user
const model = 'gpt-4o';

// Initialize OpenAI client if API key is available
let openai: OpenAI | undefined;
if (apiKey) {
  openai = new OpenAI({ apiKey });
}

// Interfaces
export interface AIAnalysisResult {
  error: TypeScriptError;
  rootCause: string;
  suggestedFix: string;
  confidence: number;
  relatedErrors?: string[];
  explanation: string;
}

export interface AIFixResult {
  error: TypeScriptError;
  fixedCode: string;
  explanation: string;
  confidence: number;
  alternativeFixes?: string[];
}

export interface AIPatternResult {
  pattern: ErrorPattern;
  enhancedDescription: string;
  enhancedSuggestedFix: string;
  generalSolution: string;
  exampleFix: string;
}

/**
 * Analyzes a TypeScript error using AI
 * 
 * @param error - TypeScript error to analyze
 * @param fileContent - Content of the file containing the error
 * @param projectContext - Additional context about the project
 * @returns AI analysis result
 */
export async function analyzeErrorWithAI(
  error: TypeScriptError,
  fileContent: string,
  projectContext?: string
): Promise<AIAnalysisResult | undefined> {
  if (!openai) {
    console.warn('OpenAI API key not available. AI analysis skipped.');
    return undefined;
  }
  
  try {
    // Extract context around the error
    const errorContext = extractErrorContext(fileContent, error.line);
    
    // Prepare prompt
    const prompt = `
I need help analyzing a TypeScript error. Here are the details:

Error Code: TS${error.code}
Message: ${error.message}
File: ${error.file}
Line: ${error.line}
Column: ${error.column}

Here's the code context:
\`\`\`typescript
${errorContext}
\`\`\`

${projectContext ? `Additional project context:\n${projectContext}\n` : ''}

Please analyze this error and provide the following information in JSON format:
1. rootCause: What is the root cause of this error?
2. suggestedFix: How can I fix this error? Provide a specific code suggestion.
3. confidence: Your confidence in this analysis (0-1).
4. relatedErrors: Any related errors that might be caused by the same root issue.
5. explanation: A detailed explanation of why this error occurs and how the fix addresses it.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more deterministic results
    });

    // Parse and validate response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);
    
    // Return analysis result
    return {
      error,
      rootCause: result.rootCause || 'Unknown',
      suggestedFix: result.suggestedFix || 'No suggestion available',
      confidence: result.confidence || 0.5,
      relatedErrors: result.relatedErrors,
      explanation: result.explanation || 'No explanation available'
    };
  } catch (error) {
    console.error('Error analyzing with OpenAI:', error);
    return undefined;
  }
}

/**
 * Generates a fix for a TypeScript error using AI
 * 
 * @param error - TypeScript error to fix
 * @param fileContent - Content of the file containing the error
 * @param projectContext - Additional context about the project
 * @returns AI fix result
 */
export async function generateFixWithAI(
  error: TypeScriptError,
  fileContent: string,
  projectContext?: string
): Promise<AIFixResult | undefined> {
  if (!openai) {
    console.warn('OpenAI API key not available. AI fix generation skipped.');
    return undefined;
  }
  
  try {
    // Extract context around the error
    const errorContext = extractErrorContext(fileContent, error.line, 10);
    
    // Prepare prompt
    const prompt = `
I need help fixing a TypeScript error. Here are the details:

Error Code: TS${error.code}
Message: ${error.message}
Category: ${error.category}
Severity: ${error.severity}
File: ${error.file}
Line: ${error.line}
Column: ${error.column}

Here's the code context (the error occurs in this snippet, focus on this for the fix):
\`\`\`typescript
${errorContext}
\`\`\`

${projectContext ? `Additional project context:\n${projectContext}\n` : ''}

Please provide the following information in JSON format:
1. fixedCode: The complete fixed code snippet that replaces the given context.
2. explanation: A detailed explanation of the fix.
3. confidence: Your confidence in this fix (0-1).
4. alternativeFixes: Any alternative approaches to fix this error.

Important guidelines:
- Keep the fix minimal and focused on addressing this specific error.
- Preserve the original code's intent and style.
- Make sure the fixed code is valid TypeScript.
- The fixedCode should be a direct replacement for the given code context.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more deterministic results
    });

    // Parse and validate response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);
    
    // Return fix result
    return {
      error,
      fixedCode: result.fixedCode || errorContext,
      explanation: result.explanation || 'No explanation available',
      confidence: result.confidence || 0.5,
      alternativeFixes: result.alternativeFixes
    };
  } catch (error) {
    console.error('Error generating fix with OpenAI:', error);
    return undefined;
  }
}

/**
 * Analyzes an error pattern using AI
 * 
 * @param pattern - Error pattern to analyze
 * @param examples - Example errors in this pattern
 * @returns AI pattern result
 */
export async function analyzePatternWithAI(
  pattern: ErrorPattern,
  examples: TypeScriptError[]
): Promise<AIPatternResult | undefined> {
  if (!openai) {
    console.warn('OpenAI API key not available. AI pattern analysis skipped.');
    return undefined;
  }
  
  try {
    // Prepare examples
    const exampleText = examples.map(ex => 
      `Example ${ex.file}:${ex.line}: ${ex.message}\nCode: ${ex.lineContent || 'N/A'}`
    ).join('\n\n');
    
    // Prepare prompt
    const prompt = `
I need help analyzing a TypeScript error pattern. Here are the details:

Pattern Name: ${pattern.name}
Category: ${pattern.category}
Severity: ${pattern.severity}
Occurrences: ${pattern.occurrences}
Description: ${pattern.description}
Current Suggested Fix: ${pattern.suggestedFix || 'None'}
Auto-fixable: ${pattern.autoFixable}

Examples of this pattern:
${exampleText}

Please analyze this error pattern and provide the following information in JSON format:
1. enhancedDescription: A more detailed description of this error pattern.
2. enhancedSuggestedFix: An improved suggestion for fixing this error pattern.
3. generalSolution: A general approach to avoid this type of error in the future.
4. exampleFix: A concrete example of fixing one of the provided examples.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more deterministic results
    });

    // Parse and validate response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);
    
    // Return pattern result
    return {
      pattern,
      enhancedDescription: result.enhancedDescription || pattern.description,
      enhancedSuggestedFix: result.enhancedSuggestedFix || pattern.suggestedFix || 'No suggestion available',
      generalSolution: result.generalSolution || 'No general solution available',
      exampleFix: result.exampleFix || 'No example fix available'
    };
  } catch (error) {
    console.error('Error analyzing pattern with OpenAI:', error);
    return undefined;
  }
}

/**
 * Extracts context around an error
 * 
 * @param fileContent - Content of the file
 * @param line - Line number of the error
 * @param contextLines - Number of context lines to include around the error
 * @returns Code context around the error
 */
function extractErrorContext(
  fileContent: string,
  line: number,
  contextLines: number = 5
): string {
  const lines = fileContent.split('\n');
  const start = Math.max(0, line - contextLines - 1);
  const end = Math.min(lines.length, line + contextLines);
  
  return lines.slice(start, end).map((text, i) => {
    const lineNumber = start + i + 1;
    const marker = lineNumber === line ? '> ' : '  ';
    return `${marker}${lineNumber}: ${text}`;
  }).join('\n');
}

/**
 * Checks if OpenAI integration is available
 * 
 * @returns Whether OpenAI integration is available
 */
export function isOpenAIAvailable(): boolean {
  return !!openai;
}

/**
 * Returns the current OpenAI model being used
 * 
 * @returns The OpenAI model name
 */
export function getOpenAIModel(): string {
  return model;
}

export default {
  analyzeErrorWithAI,
  generateFixWithAI,
  analyzePatternWithAI,
  isOpenAIAvailable,
  getOpenAIModel
};