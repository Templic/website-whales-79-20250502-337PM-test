/**
 * OpenAI Integration for TypeScript Error Management
 * 
 * This utility integrates OpenAI's API to provide AI-assisted error analysis and fix generation.
 */

import OpenAI from 'openai';
import { TypeScriptError } from './ts-error-analyzer';
import { Fix, FixMethod } from './ts-error-fixer';
import * as fs from 'fs';
import * as path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Error context to analyze TypeScript errors
 */
interface ErrorContext {
  sourceCode: string;
  filePath: string;
  error: TypeScriptError;
  projectContext?: {
    tsConfigPath?: string;
    dependencies?: Record<string, string>;
  };
}

/**
 * Generate fix using AI
 */
export async function generateAIFix(error: TypeScriptError, fileContent: string): Promise<Fix | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found. AI-assisted fixes are disabled.");
      return null;
    }

    const contextLines = getContextLines(fileContent, error.lineNumber, 5);
    
    const prompt = `
You are a TypeScript expert. Analyze this TypeScript error and provide a fix:

Error: ${error.errorMessage} (${error.errorCode})
File: ${error.filePath}
Line: ${error.lineNumber}, Column: ${error.columnNumber}

Code context:
\`\`\`typescript
${contextLines}
\`\`\`

Think about the root cause of the error, considering:
1. Type compatibility issues
2. Undefined or null values
3. Incorrect imports or module issues
4. Missing or incorrect type declarations
5. Syntax errors

Now, provide a fix for this specific error that addresses the root cause.
Return ONLY a JSON object with the following structure:
{
  "analysis": "Brief analysis of the root cause",
  "fix": "The exact replacement code that would fix the issue",
  "explanation": "Explanation of why this fix works",
  "linesToReplace": [starting line number, ending line number],
  "category": "Error category (one of: type_mismatch, missing_type, undefined_variable, null_undefined, syntax_error, import_error, declaration_error, module_error, configuration_error, other)",
  "autoFixable": boolean
}
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a TypeScript expert that generates precise fixes for TypeScript errors." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    const fixData = JSON.parse(content);

    return {
      name: `AI Fix for ${error.errorCode}`,
      description: fixData.explanation,
      category: fixData.category,
      errorCode: error.errorCode,
      fixCode: fixData.fix,
      method: FixMethod.AI_ASSISTED,
      autoFixable: fixData.autoFixable,
      patternMatch: contextLines,
      replacementTemplate: fixData.fix
    };
  } catch (error) {
    console.error('Error generating AI fix:', error);
    return null;
  }
}

/**
 * Analyze a TypeScript error using AI
 */
export async function analyzeErrorWithAI(error: TypeScriptError, fileContent: string): Promise<{
  category: string;
  severity: string;
  rootCause: string;
  suggestedFixes: string[];
} | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found. AI-assisted analysis is disabled.");
      return null;
    }

    const contextLines = getContextLines(fileContent, error.lineNumber, 10);
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a TypeScript expert that analyzes code errors." },
        { role: "user", content: `
Analyze this TypeScript error and categorize it:

Error: ${error.errorMessage} (${error.errorCode})
File: ${error.filePath}
Line: ${error.lineNumber}, Column: ${error.columnNumber}

Code context:
\`\`\`typescript
${contextLines}
\`\`\`

Provide a deep technical analysis of this error and respond with a JSON object:
` }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    const analysis = JSON.parse(content);

    return {
      category: analysis.category || error.category,
      severity: analysis.severity || error.severity,
      rootCause: analysis.rootCause || "Unknown",
      suggestedFixes: analysis.suggestedFixes || []
    };
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    return null;
  }
}

/**
 * Get lines of code around a specific line for context
 */
function getContextLines(fileContent: string, lineNumber: number, contextSize: number = 5): string {
  const lines = fileContent.split('\n');
  const startLine = Math.max(0, lineNumber - contextSize - 1);
  const endLine = Math.min(lines.length, lineNumber + contextSize);
  
  return lines.slice(startLine, endLine).join('\n');
}

/**
 * Find patterns in errors using AI
 */
export async function findErrorPatterns(errors: TypeScriptError[]): Promise<{
  patternName: string;
  patternDescription: string;
  affectedFiles: string[];
  suggestedFix: string;
  autoFixable: boolean;
}[]> {
  try {
    if (!process.env.OPENAI_API_KEY || errors.length === 0) {
      return [];
    }

    // Prepare a sample of errors for analysis
    const sampleSize = Math.min(10, errors.length);
    const errorSample = errors.slice(0, sampleSize).map(err => ({
      code: err.errorCode,
      message: err.errorMessage,
      file: err.filePath,
      line: err.lineNumber,
      column: err.columnNumber
    }));

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a TypeScript expert that identifies error patterns." },
        { role: "user", content: `
Analyze these TypeScript errors and identify common patterns:

${JSON.stringify(errorSample, null, 2)}

Look for common patterns in these errors. Are they related? Do they share common root causes?
Return a JSON array of identified patterns, with each pattern having these fields:
patternName, patternDescription, affectedFiles, suggestedFix, autoFixable
` }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return [];

    const patterns = JSON.parse(content);
    return Array.isArray(patterns.patterns) ? patterns.patterns : [];
  } catch (error) {
    console.error('Error finding patterns with AI:', error);
    return [];
  }
}

/**
 * Check if an OPENAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}