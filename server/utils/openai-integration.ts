/**
 * OpenAI Integration for TypeScript Error Management
 * 
 * This module provides AI-powered analysis and fixing of TypeScript errors
 * using the OpenAI API.
 */

import OpenAI from 'openai';

// Initialize OpenAI client 
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Check if OpenAI is configured
 * 
 * @returns Whether the OpenAI API key is set
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Analyze an error using AI
 * 
 * @param error Error to analyze
 * @param fileContent Content of the file with the error
 * @returns AI analysis
 */
export async function analyzeErrorWithAI(
  error: {
    errorCode: string;
    errorMessage: string;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    errorContext: string;
    category?: string;
    severity?: string;
  },
  fileContent: string
): Promise<{
  rootCause: string;
  suggestedFix: string;
  codeSnippet: string;
  confidence: number;
  relatedErrors?: string[];
}> {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Build the prompt for AI
    const prompt = `
You are a TypeScript expert tasked with analyzing and fixing TypeScript errors. 
Please analyze the following TypeScript error:

File: ${error.filePath}
Line: ${error.lineNumber}, Column: ${error.columnNumber}
Error Code: ${error.errorCode}
Error Message: ${error.errorMessage}
Error Category: ${error.category || 'Unknown'}
Error Severity: ${error.severity || 'Unknown'}

Context around the error:
\`\`\`typescript
${error.errorContext}
\`\`\`

Full file content:
\`\`\`typescript
${fileContent}
\`\`\`

Analyze this error and provide the following information in JSON format:
1. rootCause: A detailed explanation of what is causing this error
2. suggestedFix: A precise description of how to fix this error
3. codeSnippet: The corrected code that fixes the error
4. confidence: Your confidence level in this fix (0.0 to 1.0)
5. relatedErrors: Any other errors that might be related or caused by this one

Focus on TypeScript-specific issues like type compatibility, interface implementations, 
null/undefined handling, etc. Be very precise about the root cause.

JSON Response:`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1500
    });

    // Parse the response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      rootCause: result.rootCause || 'Unable to determine root cause',
      suggestedFix: result.suggestedFix || 'No fix suggested',
      codeSnippet: result.codeSnippet || '',
      confidence: typeof result.confidence === 'number' ? result.confidence : 0,
      relatedErrors: Array.isArray(result.relatedErrors) ? result.relatedErrors : []
    };
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    return {
      rootCause: 'AI analysis failed',
      suggestedFix: 'Could not generate a fix',
      codeSnippet: '',
      confidence: 0
    };
  }
}

/**
 * Analyze an error pattern using AI
 * 
 * @param pattern Error pattern to analyze
 * @param examples Examples of errors in this pattern
 * @returns AI analysis
 */
export async function analyzePatternWithAI(
  pattern: {
    name: string;
    description: string;
    category: string;
    severity: string;
    occurrences: number;
  },
  examples: Array<{
    errorCode: string;
    errorMessage: string;
    errorContext?: string;
  }>
): Promise<{
  patternRootCause: string;
  patternFixStrategy: string;
  isAutoFixable: boolean;
  confidence: number;
}> {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Build the prompt for AI
    const prompt = `
You are a TypeScript expert tasked with analyzing patterns in TypeScript errors.
Please analyze the following error pattern:

Pattern Name: ${pattern.name}
Description: ${pattern.description}
Category: ${pattern.category}
Severity: ${pattern.severity}
Occurrences: ${pattern.occurrences}

Examples:
${examples.map((example, index) => `
Example ${index + 1}:
Error Code: ${example.errorCode}
Error Message: ${example.errorMessage}
${example.errorContext ? `Context:\n\`\`\`typescript\n${example.errorContext}\n\`\`\`` : ''}
`).join('\n')}

Analyze this error pattern and provide the following information in JSON format:
1. patternRootCause: A detailed explanation of the common root cause behind this pattern
2. patternFixStrategy: A generic strategy for fixing errors of this pattern
3. isAutoFixable: Whether this pattern could be automatically fixed (boolean)
4. confidence: Your confidence level in this analysis (0.0 to 1.0)

Focus on identifying common themes across these errors and propose a general
approach that would work for most or all instances of this pattern.

JSON Response:`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000
    });

    // Parse the response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      patternRootCause: result.patternRootCause || 'Unable to determine pattern root cause',
      patternFixStrategy: result.patternFixStrategy || 'No fix strategy suggested',
      isAutoFixable: !!result.isAutoFixable,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0
    };
  } catch (error) {
    console.error('Error analyzing pattern with AI:', error);
    return {
      patternRootCause: 'AI analysis failed',
      patternFixStrategy: 'Could not generate a fix strategy',
      isAutoFixable: false,
      confidence: 0
    };
  }
}

/**
 * Generate a fix for an error using AI
 * 
 * @param error Error to fix
 * @param fileContent Content of the file with the error
 * @param pattern Optional pattern information for this error
 * @returns Generated fix
 */
export async function generateAIFix(
  error: {
    errorCode: string;
    errorMessage: string;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    errorContext: string;
    category?: string;
    severity?: string;
  },
  fileContent: string,
  pattern?: {
    name: string;
    description: string;
    fixStrategy?: string;
  }
): Promise<{
  fixedCode: string;
  changes: Array<{
    startLine: number;
    endLine: number;
    originalCode: string;
    newCode: string;
  }>;
  explanation: string;
  confidence: number;
}> {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Build the prompt for AI
    const prompt = `
You are a TypeScript expert tasked with fixing TypeScript errors in code.
Please generate a fix for the following TypeScript error:

File: ${error.filePath}
Line: ${error.lineNumber}, Column: ${error.columnNumber}
Error Code: ${error.errorCode}
Error Message: ${error.errorMessage}
Error Category: ${error.category || 'Unknown'}
Error Severity: ${error.severity || 'Unknown'}
${pattern ? `
This error matches pattern: ${pattern.name}
Pattern description: ${pattern.description}
${pattern.fixStrategy ? `Pattern fix strategy: ${pattern.fixStrategy}` : ''}
` : ''}

Context around the error:
\`\`\`typescript
${error.errorContext}
\`\`\`

Full file content:
\`\`\`typescript
${fileContent}
\`\`\`

Generate a precise fix for this error. Your changes should be minimal, focused only on fixing the error.
Do not refactor unrelated code. Follow TypeScript best practices and maintain the existing coding style.

Provide your response in JSON format with the following fields:
1. fixedCode: The complete fixed code for the entire file
2. changes: An array of changes made, each with:
   - startLine: Line number where the change starts (1-indexed)
   - endLine: Line number where the change ends (1-indexed)
   - originalCode: The original code snippet that was changed
   - newCode: The new code that replaces the original
3. explanation: A clear explanation of the fix and why it resolves the error
4. confidence: Your confidence level in this fix (0.0 to 1.0)

JSON Response:`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2500
    });

    // Parse the response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      fixedCode: result.fixedCode || fileContent,
      changes: Array.isArray(result.changes) ? result.changes : [],
      explanation: result.explanation || 'No explanation provided',
      confidence: typeof result.confidence === 'number' ? result.confidence : 0
    };
  } catch (error) {
    console.error('Error generating fix with AI:', error);
    return {
      fixedCode: fileContent,
      changes: [],
      explanation: 'AI fix generation failed',
      confidence: 0
    };
  }
}

export default {
  isOpenAIConfigured,
  analyzeErrorWithAI,
  analyzePatternWithAI,
  generateAIFix
};