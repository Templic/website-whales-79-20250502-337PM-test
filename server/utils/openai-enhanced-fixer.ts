/**
 * OpenAI Enhanced TypeScript Fixer
 * 
 * A utility that uses OpenAI to generate fix suggestions for TypeScript errors.
 * Part of the TypeScript error management system (Resolution phase).
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Error information to be sent to OpenAI
 */
export interface ErrorInfo {
  errorCode: string;
  messageText: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  category?: string;
  severity?: string;
  source?: string;
}

/**
 * Fix result from OpenAI
 */
export interface ErrorFixResult {
  error: ErrorInfo;
  fixedCode: string;
  explanation?: string;
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
  relatedFiles?: Array<{
    filePath: string;
    changes?: Array<{
      code: string;
      lineNumber: number;
    }>;
  }>;
}

/**
 * Options for error fixing
 */
export interface ErrorFixOptions {
  maxContextLines?: number;
  includeImports?: boolean;
  enableExplanation?: boolean;
  suggestRelatedChanges?: boolean;
  codeStyle?: 'maintainOriginal' | 'optimize' | 'improveReadability';
  verbose?: boolean;
}

// Default options
const defaultOptions: ErrorFixOptions = {
  maxContextLines: 10,
  includeImports: true,
  enableExplanation: true,
  suggestRelatedChanges: false,
  codeStyle: 'maintainOriginal',
  verbose: false,
};

/**
 * Fix TypeScript errors using OpenAI
 */
export async function fixTypeScriptErrorsWithOpenAI(
  errors: ErrorInfo[],
  options: ErrorFixOptions = {}
): Promise<ErrorFixResult[]> {
  const mergedOptions = { ...defaultOptions, ...options };
  const results: ErrorFixResult[] = [];

  for (const error of errors) {
    try {
      // Skip errors without file path or line number
      if (!error.filePath || !error.lineNumber) {
        console.warn('Skipping error with missing file path or line number:', error);
        continue;
      }

      // Verify the file exists
      if (!fs.existsSync(error.filePath)) {
        console.warn(`File not found: ${error.filePath}`);
        continue;
      }

      // Get code context
      const context = getCodeContext(
        error.filePath,
        error.lineNumber,
        mergedOptions.maxContextLines || 10,
        mergedOptions.includeImports || false
      );

      // Generate fix using OpenAI
      const fixResult = await generateFix(error, context, mergedOptions);
      results.push(fixResult);

      if (mergedOptions.verbose) {
        console.log(`Generated fix for error in ${error.filePath}:${error.lineNumber}`);
        console.log(`Original error: ${error.messageText}`);
        console.log(`Fix confidence: ${fixResult.confidence}`);
      }
    } catch (err) {
      console.error(`Error fixing TypeScript error in ${error.filePath}:${error.lineNumber}:`, err);
    }
  }

  return results;
}

/**
 * Get code context from the file
 */
function getCodeContext(
  filePath: string,
  lineNumber: number,
  contextLines: number,
  includeImports: boolean
): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let startLine = Math.max(0, lineNumber - contextLines - 1);
    let endLine = Math.min(lines.length - 1, lineNumber + contextLines - 1);
    
    // If includeImports is true, scan for imports at the top of the file
    if (includeImports && startLine > 0) {
      const importLines: number[] = [];
      
      // Find all import statements at the top of the file
      for (let i = 0; i < Math.min(50, startLine); i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('export ')) {
          importLines.push(i);
        } else if (lines[i].trim() !== '' && !lines[i].trim().startsWith('//')) {
          // Stop when we hit non-import code (excluding empty lines and comments)
          break;
        }
      }
      
      // If we found imports, include them in the context
      if (importLines.length > 0) {
        const importContext = importLines.map(i => `${i + 1}: ${lines[i]}`).join('\n');
        return `// Import statements\n${importContext}\n\n// Error context (line ${lineNumber} is the error location)\n` +
               lines.slice(startLine, endLine + 1).map((line, i) => 
                 `${startLine + i + 1}${startLine + i + 1 === lineNumber ? ' (ERROR) →' : ':'} ${line}`
               ).join('\n');
      }
    }
    
    // Return regular context
    return lines.slice(startLine, endLine + 1).map((line, i) => 
      `${startLine + i + 1}${startLine + i + 1 === lineNumber ? ' (ERROR) →' : ':'} ${line}`
    ).join('\n');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return '[Error reading file]';
  }
}

/**
 * Generate a fix using OpenAI
 */
async function generateFix(
  error: ErrorInfo,
  context: string,
  options: ErrorFixOptions
): Promise<ErrorFixResult> {
  // Construct a prompt for OpenAI
  const prompt = createFixPrompt(error, context, options);
  
  try {
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert TypeScript developer specializing in fixing TypeScript errors.
Your task is to fix the TypeScript error described and provide explanations.
Focus ONLY on fixing the specific error described. Do not modify code style or make unrelated changes.
Always respond with JSON in the specified format.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // Ensure the response has the expected structure
      const fixResult: ErrorFixResult = {
        error,
        fixedCode: parsedResponse.fixedCode || '',
        explanation: parsedResponse.explanation,
        confidence: parsedResponse.confidence || 'medium',
        warnings: parsedResponse.warnings,
        relatedFiles: parsedResponse.relatedFiles
      };
      
      return fixResult;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Response content:', responseContent);
      
      // Fallback to a simple result
      return {
        error,
        fixedCode: '',
        explanation: 'Failed to parse OpenAI response.',
        confidence: 'low'
      };
    }
  } catch (openAiError) {
    console.error('Error calling OpenAI API:', openAiError);
    
    // Return error result
    return {
      error,
      fixedCode: '',
      explanation: `Error calling OpenAI API: ${openAiError.message || 'Unknown error'}`,
      confidence: 'low'
    };
  }
}

/**
 * Create a prompt for OpenAI to fix the error
 */
function createFixPrompt(
  error: ErrorInfo,
  context: string,
  options: ErrorFixOptions
): string {
  const promptParts = [
    `# TypeScript Error Fix Request`,
    
    `## Error Details`,
    `- Error Code: ${error.errorCode}`,
    `- Message: ${error.messageText}`,
    `- File: ${path.basename(error.filePath)}`,
    `- Line: ${error.lineNumber}`,
    `- Column: ${error.columnNumber}`,
    error.category ? `- Category: ${error.category}` : '',
    error.severity ? `- Severity: ${error.severity}` : '',
    
    `## Code Context`,
    `\`\`\`typescript`,
    context,
    `\`\`\``,
    
    `## Instructions`,
    `1. Analyze the error and the code context.`,
    `2. Provide a fixed version of the code.`,
    `3. Focus ONLY on fixing the specific error on line ${error.lineNumber}.`,
    `4. Maintain the original code style and formatting.`,
    `5. Do not make unrelated changes.`,
    
    options.enableExplanation ? 
      `6. Explain why the error occurred and how your fix resolves it.` : '',
    
    options.suggestRelatedChanges ? 
      `7. If fixing this error requires changes in other files, specify those changes.` : '',
    
    `## Response Format`,
    `Respond with a JSON object with the following structure:`,
    `\`\`\`json`,
    `{`,
    `  "fixedCode": "string", // The fixed code for the error line ONLY`,
    `  "explanation": "string", // Explanation of the error and fix`,
    `  "confidence": "high|medium|low", // Your confidence in this fix`,
    `  "warnings": ["string"], // Optional array of warnings about the fix`,
    `  "relatedFiles": [ // Optional array of related files that need changes`,
    `    {`,
    `      "filePath": "string",`,
    `      "changes": [`,
    `        {`,
    `          "code": "string",`,
    `          "lineNumber": number`,
    `        }`,
    `      ]`,
    `    }`,
    `  ]`,
    `}`,
    `\`\`\``,
    
    `Focus specifically on the error line. Your fixedCode should ONLY include the fixed line of code, not the entire file.`
  ].filter(Boolean).join('\n\n');
  
  return promptParts;
}

/**
 * Apply a fix to a file
 */
export function applyFixToFile(
  filePath: string,
  lineNumber: number,
  fixedCode: string
): boolean {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Validate line number
    if (lineNumber < 1 || lineNumber > lines.length) {
      console.error(`Invalid line number ${lineNumber} for file ${filePath} (1-${lines.length})`);
      return false;
    }
    
    // Replace the line
    lines[lineNumber - 1] = fixedCode;
    
    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    return true;
  } catch (err) {
    console.error(`Error applying fix to ${filePath}:${lineNumber}:`, err);
    return false;
  }
}

/**
 * Apply fixes to multiple files
 */
export function applyMultipleFixesToFiles(
  fixes: ErrorFixResult[]
): { success: number; failed: number } {
  let success = 0;
  let failed = 0;
  
  for (const fix of fixes) {
    if (!fix.fixedCode) {
      failed++;
      continue;
    }
    
    const result = applyFixToFile(
      fix.error.filePath,
      fix.error.lineNumber,
      fix.fixedCode
    );
    
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Apply related file changes if present
    if (fix.relatedFiles) {
      for (const relatedFile of fix.relatedFiles) {
        if (!relatedFile.filePath || !relatedFile.changes) continue;
        
        for (const change of relatedFile.changes) {
          if (!change.code || !change.lineNumber) continue;
          
          const relatedResult = applyFixToFile(
            relatedFile.filePath,
            change.lineNumber,
            change.code
          );
          
          if (relatedResult) {
            success++;
          } else {
            failed++;
          }
        }
      }
    }
  }
  
  return { success, failed };
}