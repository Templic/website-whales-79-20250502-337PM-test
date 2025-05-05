/**
 * OpenAI-Enhanced TypeScript Error Fixer
 * 
 * This utility uses OpenAI to enhance the TypeScript error fixing capabilities.
 * It analyzes complex errors and generates appropriate fixes that maintain code context.
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { TypeScriptErrorDetail } from './ts-error-analyzer';

// Initialize OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * OpenAI fix suggestion result
 */
interface OpenAIFixSuggestion {
  explanation: string;
  fixedCode: string;
  confidence: number; // 0-1 scale
  implementationNotes?: string;
  alternativeFixes?: Array<{
    explanation: string;
    fixedCode: string;
  }>;
}

/**
 * Get context around an error
 */
function getFileContext(filePath: string, line: number, contextLines: number = 10): { 
  before: string[]; 
  error: string; 
  after: string[];
  fullContext: string;
} {
  // Read the file and get lines around the error
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  
  // Calculate the range of lines to include
  const startLine = Math.max(0, line - contextLines - 1);
  const endLine = Math.min(lines.length - 1, line + contextLines - 1);
  
  const before = lines.slice(startLine, line - 1);
  const error = lines[line - 1];
  const after = lines.slice(line, endLine + 1);
  
  // Provide full context as a single string (will be sent to OpenAI)
  const fullContext = [
    ...before.map((l, i) => `${startLine + i + 1}: ${l}`),
    `${line} [ERROR]: ${error}`,
    ...after.map((l, i) => `${line + i + 1}: ${l}`)
  ].join('\n');
  
  return { before, error, after, fullContext };
}

/**
 * Analyze an error using OpenAI
 */
export async function analyzeErrorWithOpenAI(
  error: TypeScriptErrorDetail,
  projectRoot: string = process.cwd()
): Promise<OpenAIFixSuggestion | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found. Skipping AI analysis.');
      return null;
    }
    
    // Get the absolute file path
    const filePath = path.resolve(projectRoot, error.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    
    // Get context around the error
    const context = getFileContext(filePath, error.line);
    
    // Create the prompt for OpenAI
    const prompt = `
You are a senior TypeScript developer expert in fixing TypeScript errors.
You're helping fix a TypeScript error in a codebase.

FILE: ${error.file}
ERROR CODE: ${error.code}
ERROR MESSAGE: ${error.message}
ERROR LOCATION: Line ${error.line}, Column ${error.column}

Here's the context of the code with the error (the error line is marked with [ERROR]):

\`\`\`typescript
${context.fullContext}
\`\`\`

Please analyze this error and suggest a fix. Provide:
1. A brief explanation of what's causing the error
2. The corrected code snippet that fixes the issue
3. A confidence level (0-1) of your fix
4. Optional implementation notes if relevant
5. Alternative approaches if there are multiple ways to fix this

For complex fixes, ensure your solution preserves the original functionality and intention of the code.
Be especially careful with security-sensitive code and ensure you don't introduce security vulnerabilities.

Respond in JSON format:
{
  "explanation": "Explanation of the error",
  "fixedCode": "The fixed version of the error line",
  "confidence": 0.95,
  "implementationNotes": "Optional notes on implementation details",
  "alternativeFixes": [
    {
      "explanation": "Alternative approach",
      "fixedCode": "Alternative fixed code"
    }
  ]
}
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert TypeScript developer specializing in code analysis and error fixing."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse and return the result
    const response = completion.choices[0].message.content;
    if (!response) {
      console.error('No response from OpenAI');
      return null;
    }
    
    try {
      const result = JSON.parse(response);
      return result as OpenAIFixSuggestion;
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      console.log('Response:', response);
      return null;
    }
  } catch (error) {
    console.error('Error in OpenAI analysis:', error);
    return null;
  }
}

/**
 * Apply the fix suggested by OpenAI to the file
 */
export async function applyOpenAIFix(
  error: TypeScriptErrorDetail,
  fix: OpenAIFixSuggestion,
  projectRoot: string = process.cwd()
): Promise<boolean> {
  try {
    // Get the absolute file path
    const filePath = path.resolve(projectRoot, error.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Replace the error line with the fixed code
    lines[error.line - 1] = fix.fixedCode;
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    console.log(`Applied OpenAI fix to ${error.file}:${error.line}`);
    console.log(`- ${fix.explanation}`);
    
    return true;
  } catch (error) {
    console.error('Error applying OpenAI fix:', error);
    return false;
  }
}

/**
 * Analyze multiple errors with OpenAI and batch process them
 */
export async function batchAnalyzeWithOpenAI(
  errors: TypeScriptErrorDetail[],
  projectRoot: string = process.cwd()
): Promise<Map<string, OpenAIFixSuggestion>> {
  const results = new Map<string, OpenAIFixSuggestion>();
  
  // Process errors sequentially to avoid rate limiting issues
  for (const error of errors) {
    const errorKey = `${error.file}:${error.line}:${error.column}`;
    console.log(`Analyzing error: ${errorKey} - ${error.message}`);
    
    const suggestion = await analyzeErrorWithOpenAI(error, projectRoot);
    if (suggestion) {
      results.set(errorKey, suggestion);
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  
  return results;
}

/**
 * Main function to run OpenAI enhanced error fixing
 */
export async function fixErrorsWithOpenAI(
  errors: TypeScriptErrorDetail[],
  projectRoot: string = process.cwd(),
  autoApply: boolean = false
): Promise<{
  analyzed: number;
  fixed: number;
  suggestions: Map<string, OpenAIFixSuggestion>;
}> {
  console.log(`Analyzing ${errors.length} errors with OpenAI...`);
  
  const suggestions = await batchAnalyzeWithOpenAI(errors, projectRoot);
  
  console.log(`Analysis complete. Found fixes for ${suggestions.size} errors.`);
  
  let fixedCount = 0;
  
  if (autoApply) {
    console.log('Automatically applying fixes...');
    
    for (const [errorKey, suggestion] of suggestions.entries()) {
      const [file, line, column] = errorKey.split(':');
      const error = errors.find(e => 
        e.file === file && 
        e.line === parseInt(line) && 
        e.column === parseInt(column)
      );
      
      if (error && suggestion.confidence >= 0.7) { // Only apply high-confidence fixes
        const success = await applyOpenAIFix(error, suggestion, projectRoot);
        if (success) {
          fixedCount++;
        }
      }
    }
    
    console.log(`Applied ${fixedCount} fixes.`);
  } else {
    console.log('Fixes were not automatically applied. Use autoApply=true to apply fixes.');
  }
  
  return {
    analyzed: errors.length,
    fixed: fixedCount,
    suggestions
  };
}

export default {
  analyzeErrorWithOpenAI,
  applyOpenAIFix,
  batchAnalyzeWithOpenAI,
  fixErrorsWithOpenAI
};