/**
 * @file openai-integration.ts
 * @description Enhanced OpenAI integration for TypeScript error analysis
 * 
 * This module provides utilities for analyzing and fixing TypeScript errors
 * using OpenAI's GPT models.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import type { TypeScriptError, ErrorCategory, ErrorFixSuggestion } from '../types/core/error-types';

// Initialize OpenAI client
// Note: API key is expected to be in the environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The model to use for error analysis and fix generation
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = 'gpt-4o';

/**
 * Interface for error analysis results
 */
export interface ErrorAnalysisResult {
  rootCause: string;
  explanation: string;
  category: ErrorCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cascading: boolean;
  suggestedApproach: string;
  confidence: number;
}

/**
 * Maximum number of tokens to generate in a response
 */
const MAX_TOKENS = 500;

/**
 * The maximum number of lines of context to include
 */
const MAX_CONTEXT_LINES = 100;

/**
 * Analyzes a TypeScript error using OpenAI
 * 
 * @param error TypeScript error to analyze
 * @returns Analysis result
 */
export async function analyzeError(error: TypeScriptError): Promise<ErrorAnalysisResult> {
  // Read the file content to get more context
  let fileContent = '';
  try {
    if (fs.existsSync(error.filePath)) {
      fileContent = fs.readFileSync(error.filePath, 'utf-8');
      
      // Limit the file content to avoid excessive tokens
      const lines = fileContent.split('\n');
      const contextStart = Math.max(0, error.lineNumber - MAX_CONTEXT_LINES / 2);
      const contextEnd = Math.min(lines.length, error.lineNumber + MAX_CONTEXT_LINES / 2);
      
      fileContent = lines.slice(contextStart, contextEnd).join('\n');
      
      if (contextStart > 0) {
        fileContent = `// ... (lines 1-${contextStart} omitted) ...\n` + fileContent;
      }
      
      if (contextEnd < lines.length) {
        fileContent = fileContent + `\n// ... (lines ${contextEnd + 1}-${lines.length} omitted) ...`;
      }
    }
  } catch (err) {
    console.error(`Error reading file ${error.filePath}: ${err instanceof Error ? err.message : String(err)}`);
    // Continue with analysis even if file reading fails
  }
  
  // Get imports from the file to understand dependencies
  const imports = extractImports(fileContent);
  
  // Prepare the prompt
  const prompt = `
You are an expert TypeScript developer and your task is to analyze a TypeScript error and provide detailed analysis. 
Here is the error information:

- Error code: ${error.errorCode}
- File path: ${error.filePath}
- Line number: ${error.lineNumber}
- Column number: ${error.columnNumber}
- Error message: ${error.errorMessage}

Relevant code context:
\`\`\`typescript
${error.errorContext || 'No context available'}
\`\`\`

${imports.length > 0 ? `File imports:\n${imports.map(imp => `- ${imp}`).join('\n')}` : 'No imports found.'}

Please analyze this error and provide:
1. The root cause of the error
2. A detailed explanation of why the error is occurring
3. Categorize the error (choose one): type_mismatch, missing_type, undefined_variable, null_reference, interface_mismatch, import_error, syntax_error, generic_constraint, declaration_error, other
4. Assign a severity level (choose one): low, medium, high, critical
5. Determine if this error is likely to cause cascading errors elsewhere
6. Suggest an approach to fix the error
7. Provide a confidence level (0.0 to 1.0) in your analysis

Format your response as JSON following this structure:
{
  "rootCause": "Brief description of the root cause",
  "explanation": "Detailed explanation of the error",
  "category": "one_of_the_categories_above",
  "severity": "low_medium_high_critical",
  "cascading": true_or_false,
  "suggestedApproach": "How to fix the error",
  "confidence": number_between_0_and_1
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });
    
    const analysisText = response.choices[0].message.content;
    
    if (!analysisText) {
      throw new Error('Empty response from OpenAI');
    }
    
    const analysis = JSON.parse(analysisText) as ErrorAnalysisResult;
    
    // Validate required fields
    if (!analysis.rootCause || !analysis.explanation || !analysis.category || !analysis.severity || analysis.cascading === undefined || !analysis.suggestedApproach || analysis.confidence === undefined) {
      throw new Error('Incomplete analysis from OpenAI');
    }
    
    return analysis;
  } catch (err) {
    console.error(`OpenAI analysis error: ${err instanceof Error ? err.message : String(err)}`);
    
    // Provide a fallback analysis
    return {
      rootCause: 'Failed to analyze with OpenAI',
      explanation: `Error analyzing with OpenAI: ${err instanceof Error ? err.message : String(err)}. Original error: ${error.errorMessage}`,
      category: mapToCategory(error.errorCode, error.errorMessage),
      severity: 'medium',
      cascading: false,
      suggestedApproach: 'Please fix the error based on the error message.',
      confidence: 0.1
    };
  }
}

/**
 * Generates a fix for a TypeScript error using OpenAI
 * 
 * @param error TypeScript error to fix
 * @returns Fix suggestion
 */
export async function generateErrorFix(error: TypeScriptError): Promise<ErrorFixSuggestion> {
  // Read the file content to get more context
  let fileContent = '';
  let fileSummary = '';
  try {
    if (fs.existsSync(error.filePath)) {
      const content = fs.readFileSync(error.filePath, 'utf-8');
      
      // Generate a summary of the file for context
      fileSummary = generateFileSummary(content);
      
      // Extract relevant portion of the file
      const lines = content.split('\n');
      const contextStart = Math.max(0, error.lineNumber - MAX_CONTEXT_LINES / 2);
      const contextEnd = Math.min(lines.length, error.lineNumber + MAX_CONTEXT_LINES / 2);
      
      fileContent = lines.slice(contextStart, contextEnd).join('\n');
      
      if (contextStart > 0) {
        fileContent = `// ... (lines 1-${contextStart} omitted) ...\n` + fileContent;
      }
      
      if (contextEnd < lines.length) {
        fileContent = fileContent + `\n// ... (lines ${contextEnd + 1}-${lines.length} omitted) ...`;
      }
    }
  } catch (err) {
    console.error(`Error reading file ${error.filePath}: ${err instanceof Error ? err.message : String(err)}`);
    // Continue with fix generation even if file reading fails
  }
  
  // Extract imports to understand dependencies
  const imports = extractImports(fileContent);
  
  // Get the line with the error
  const errorLine = error.errorContext?.split('\n')[error.lineNumber - 1] || 'Line not available';
  
  // Find related type declarations
  const relatedTypes = findRelatedTypes(error.errorMessage, fileContent);
  
  // Prepare the prompt
  const prompt = `
You are an expert TypeScript developer tasked with fixing a TypeScript error. 
Your task is to generate a fix for the error that maintains the original code's intent.

Here is the error information:
- Error code: ${error.errorCode}
- File path: ${error.filePath}
- Line number: ${error.lineNumber}
- Column number: ${error.columnNumber}
- Error message: ${error.errorMessage}

The line with the error:
\`\`\`typescript
${errorLine}
\`\`\`

Relevant code context:
\`\`\`typescript
${error.errorContext || 'No context available'}
\`\`\`

${imports.length > 0 ? `File imports:\n${imports.map(imp => `- ${imp}`).join('\n')}` : 'No imports found.'}

${relatedTypes.length > 0 ? `Related type declarations:\n${relatedTypes.map(type => `- ${type}`).join('\n')}` : ''}

File summary:
${fileSummary}

Please generate a fix for this error that:
1. Maintains the original functionality and code intent
2. Follows TypeScript best practices
3. Is minimal and focused on the specific error
4. Takes into account the imports and related types

Format your response as JSON following this structure:
{
  "fixExplanation": "Detailed explanation of the fix and why it works",
  "originalCode": "The exact code that needs to be replaced",
  "fixCode": "The corrected code that replaces the original",
  "fixScope": "line" | "token" | "custom",
  "confidence": number_between_0_and_1
}

Notes:
- For fixScope, use "line" if you're replacing the entire line, "token" if you're replacing just one token, or "custom" if it's more complex
- For originalCode, include enough context to uniquely identify the code to replace
- For fixCode, include the complete fixed version of the code
- The confidence score should reflect how confident you are that the fix will resolve the error
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });
    
    const fixText = response.choices[0].message.content;
    
    if (!fixText) {
      throw new Error('Empty response from OpenAI');
    }
    
    const fix = JSON.parse(fixText) as ErrorFixSuggestion;
    
    // Validate required fields
    if (!fix.fixExplanation || !fix.originalCode || !fix.fixCode || !fix.fixScope || fix.confidence === undefined) {
      throw new Error('Incomplete fix from OpenAI');
    }
    
    return fix;
  } catch (err) {
    console.error(`OpenAI fix generation error: ${err instanceof Error ? err.message : String(err)}`);
    
    // Provide a fallback fix suggestion
    return {
      fixExplanation: `Failed to generate fix with OpenAI: ${err instanceof Error ? err.message : String(err)}. Please fix the error based on the error message: ${error.errorMessage}`,
      originalCode: errorLine,
      fixCode: `// TODO: Fix error: ${error.errorMessage}\n${errorLine}`,
      fixScope: 'line',
      confidence: 0.1
    };
  }
}

/**
 * Extracts imports from a TypeScript file
 * 
 * @param fileContent Content of the TypeScript file
 * @returns Array of import statements
 */
function extractImports(fileContent: string): string[] {
  const imports: string[] = [];
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('import ')) {
      imports.push(trimmedLine);
    }
  }
  
  return imports;
}

/**
 * Finds related type declarations in the file
 * 
 * @param errorMessage Error message
 * @param fileContent Content of the TypeScript file
 * @returns Array of related type declarations
 */
function findRelatedTypes(errorMessage: string, fileContent: string): string[] {
  const relatedTypes: string[] = [];
  
  // Extract type names from error message
  const typeMatches = errorMessage.match(/['"]([^'"]+)['"]/g) || [];
  const typeNames = typeMatches.map(match => match.replace(/['"]/g, ''));
  
  if (typeNames.length === 0) {
    return relatedTypes;
  }
  
  // Look for type declarations in the file
  const lines = fileContent.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (
      trimmedLine.startsWith('interface ') ||
      trimmedLine.startsWith('type ') ||
      trimmedLine.startsWith('class ') ||
      trimmedLine.startsWith('enum ')
    ) {
      for (const typeName of typeNames) {
        if (trimmedLine.includes(typeName)) {
          relatedTypes.push(trimmedLine);
          break;
        }
      }
    }
  }
  
  return relatedTypes;
}

/**
 * Generates a summary of a TypeScript file
 * 
 * @param fileContent Content of the TypeScript file
 * @returns Summary of the file
 */
function generateFileSummary(fileContent: string): string {
  // Extract imports
  const imports = extractImports(fileContent);
  
  // Count type declarations
  const typeCount = {
    interface: 0,
    type: 0,
    class: 0,
    enum: 0,
    function: 0
  };
  
  const lines = fileContent.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('interface ')) {
      typeCount.interface++;
    } else if (trimmedLine.startsWith('type ')) {
      typeCount.type++;
    } else if (trimmedLine.startsWith('class ')) {
      typeCount.class++;
    } else if (trimmedLine.startsWith('enum ')) {
      typeCount.enum++;
    } else if (trimmedLine.startsWith('function ') || trimmedLine.match(/^[a-zA-Z0-9_]+\s*\([^)]*\)\s*:/)) {
      typeCount.function++;
    }
  }
  
  // Generate summary
  return `
File contains:
- ${imports.length} imports
- ${typeCount.interface} interfaces
- ${typeCount.type} type aliases
- ${typeCount.class} classes
- ${typeCount.enum} enums
- ${typeCount.function} functions
`;
}

/**
 * Maps an error code and message to a category
 * 
 * @param errorCode TypeScript error code
 * @param errorMessage Error message
 * @returns Error category
 */
function mapToCategory(errorCode: string, errorMessage: string): ErrorCategory {
  const code = parseInt(errorCode.replace('TS', ''));
  
  // Map error codes to categories
  if (code >= 2300 && code < 2400) {
    return 'syntax_error';
  } else if ([2307, 2304, 2503].includes(code)) {
    return 'missing_type';
  } else if ([2322, 2345, 2739, 2740, 2741].includes(code)) {
    return 'type_mismatch';
  } else if ([2339, 2551, 2552, 2553, 2554].includes(code)) {
    return 'undefined_variable';
  } else if ([2531, 2532, 2533].includes(code)) {
    return 'null_reference';
  } else if ([2420, 2559, 2741].includes(code)) {
    return 'interface_mismatch';
  } else if ([2306, 2792, 2849].includes(code)) {
    return 'import_error';
  } else if ([2313, 2314, 2315, 2316].includes(code)) {
    return 'generic_constraint';
  } else if ([2403, 2456, 2742, 2451, 2452].includes(code)) {
    return 'declaration_error';
  }
  
  // Check error message for specific patterns
  const message = errorMessage.toLowerCase();
  
  if (message.includes('does not exist on type')) {
    return 'interface_mismatch';
  } else if (message.includes('cannot find')) {
    return 'missing_type';
  } else if (message.includes('is not assignable to')) {
    return 'type_mismatch';
  } else if (message.includes('undefined')) {
    return 'undefined_variable';
  } else if (message.includes('null') || message.includes('undefined')) {
    return 'null_reference';
  } else if (message.includes('import')) {
    return 'import_error';
  } else if (message.includes('syntax')) {
    return 'syntax_error';
  } else if (message.includes('constraint')) {
    return 'generic_constraint';
  }
  
  return 'other';
}

/**
 * Enhances code context with type information using OpenAI
 * 
 * @param filePath Path to the TypeScript file
 * @param codeSnippet Code snippet to enhance
 * @returns Enhanced code with type information
 */
export async function enhanceCodeContext(filePath: string, codeSnippet: string): Promise<string> {
  // Read the file content
  let fileContent = '';
  try {
    if (fs.existsSync(filePath)) {
      fileContent = fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    return codeSnippet;
  }
  
  // Prepare the prompt
  const prompt = `
You are an expert TypeScript developer tasked with enhancing code with type information. 
Your task is to analyze the given code snippet and add TypeScript type information.

File path: ${filePath}

Original code snippet:
\`\`\`typescript
${codeSnippet}
\`\`\`

Full file content:
\`\`\`typescript
${fileContent}
\`\`\`

Please add TypeScript type information to the code snippet, including:
1. Add explicit type annotations for variables, parameters, and return types
2. Add interface or type definitions where appropriate
3. Add JSDoc comments to explain complex types

Focus on enhancing the code snippet, not the entire file.
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS * 3, // Allow longer responses for code enhancement
      temperature: 0.1
    });
    
    const enhancedText = response.choices[0].message.content;
    
    if (!enhancedText) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Extract code from the response
    const codeMatch = enhancedText.match(/```(?:typescript|ts)\n([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1].trim();
    }
    
    return enhancedText;
  } catch (err) {
    console.error(`OpenAI code enhancement error: ${err instanceof Error ? err.message : String(err)}`);
    return codeSnippet;
  }
}

/**
 * Generates missing type definitions using OpenAI
 * 
 * @param typeName Name of the type to generate
 * @param usages Array of code snippets where the type is used
 * @returns Generated type definition
 */
export async function generateMissingType(typeName: string, usages: string[]): Promise<string> {
  // Prepare the prompt
  const prompt = `
You are an expert TypeScript developer tasked with generating type definitions. 
Your task is to generate a TypeScript type definition for a missing type based on its usages.

Missing type name: ${typeName}

Usages of the type:
${usages.map(usage => '```typescript\n' + usage + '\n```').join('\n\n')}

Please generate a comprehensive TypeScript type definition for ${typeName} that:
1. Covers all properties and methods indicated by the usages
2. Uses appropriate TypeScript features (interfaces, generics, etc.)
3. Includes JSDoc comments to explain the type's purpose and properties
4. Is consistent with TypeScript best practices

Your response should only include the type definition, not explanations.
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS * 2, // Allow longer responses for type generation
      temperature: 0.2
    });
    
    const typeDefinition = response.choices[0].message.content;
    
    if (!typeDefinition) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Extract code from the response
    const codeMatch = typeDefinition.match(/```(?:typescript|ts)\n([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1].trim();
    }
    
    return typeDefinition;
  } catch (err) {
    console.error(`OpenAI type generation error: ${err instanceof Error ? err.message : String(err)}`);
    
    // Provide a fallback type definition
    return `/**
 * Auto-generated type definition for ${typeName}
 * TODO: Replace with a proper type definition
 */
export type ${typeName} = any;
`;
  }
}

/**
 * Learns from fix history to improve error resolution
 * 
 * @param errorCode TypeScript error code
 * @param fixHistories Array of fix history entries
 * @returns Insights on what fixes work best for this error
 */
export async function learnFromFixHistory(
  errorCode: string, 
  fixHistories: Array<{
    originalCode: string;
    fixedCode: string;
    fixMethod: string;
    fixResult: 'success' | 'failure';
  }>
): Promise<{
  patterns: string[];
  bestApproaches: string[];
  commonMistakes: string[];
}> {
  // Filter successful fixes
  const successfulFixes = fixHistories.filter(h => h.fixResult === 'success');
  
  if (successfulFixes.length === 0) {
    return {
      patterns: [],
      bestApproaches: [],
      commonMistakes: []
    };
  }
  
  // Prepare the prompt
  const prompt = `
You are an expert TypeScript developer tasked with improving error resolution.
Your task is to analyze the history of fixes for a specific TypeScript error code and identify patterns.

Error code: ${errorCode}

Fix history (${successfulFixes.length} successful fixes):
${successfulFixes.map((fix, i) => `
Fix ${i + 1}:
- Original code:
\`\`\`typescript
${fix.originalCode}
\`\`\`

- Fixed code:
\`\`\`typescript
${fix.fixedCode}
\`\`\`

- Fix method: ${fix.fixMethod}
`).join('\n')}

Please analyze these fixes and provide:
1. Common patterns in the original code that lead to this error
2. The best approaches to fix this error based on the successful fixes
3. Common mistakes or anti-patterns to avoid

Format your response as JSON following this structure:
{
  "patterns": ["pattern1", "pattern2", ...],
  "bestApproaches": ["approach1", "approach2", ...],
  "commonMistakes": ["mistake1", "mistake2", ...]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });
    
    const analysisText = response.choices[0].message.content;
    
    if (!analysisText) {
      throw new Error('Empty response from OpenAI');
    }
    
    const analysis = JSON.parse(analysisText) as {
      patterns: string[];
      bestApproaches: string[];
      commonMistakes: string[];
    };
    
    return analysis;
  } catch (err) {
    console.error(`OpenAI learning error: ${err instanceof Error ? err.message : String(err)}`);
    
    // Provide fallback insights
    return {
      patterns: ['Unknown patterns'],
      bestApproaches: [`Fix errors with code ${errorCode} based on the error message`],
      commonMistakes: ['Unknown mistakes']
    };
  }
}

/**
 * Generates documentation for a TypeScript type
 * 
 * @param typeName Name of the type to document
 * @param typeDefinition Type definition code
 * @returns Detailed documentation
 */
export async function generateTypeDocumentation(typeName: string, typeDefinition: string): Promise<string> {
  // Prepare the prompt
  const prompt = `
You are an expert TypeScript developer tasked with documenting types.
Your task is to generate comprehensive documentation for a TypeScript type.

Type name: ${typeName}

Type definition:
\`\`\`typescript
${typeDefinition}
\`\`\`

Please generate detailed documentation for this type that includes:
1. A clear description of the type's purpose and usage
2. Explanations of all properties and methods
3. Examples of how to use the type
4. Any constraints or considerations when using this type

Format the documentation in Markdown.
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS * 2, // Allow longer responses for documentation
      temperature: 0.3
    });
    
    const documentation = response.choices[0].message.content;
    
    if (!documentation) {
      throw new Error('Empty response from OpenAI');
    }
    
    return documentation;
  } catch (err) {
    console.error(`OpenAI documentation error: ${err instanceof Error ? err.message : String(err)}`);
    
    // Provide fallback documentation
    return `# ${typeName}

## Description
Auto-generated documentation for the \`${typeName}\` type.

## Type Definition
\`\`\`typescript
${typeDefinition}
\`\`\`

## Usage
TODO: Add usage examples for this type.
`;
  }
}