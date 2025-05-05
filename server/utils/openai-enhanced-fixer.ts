/**
 * OpenAI Enhanced TypeScript Error Fixer
 * 
 * This utility uses OpenAI's GPT models to analyze TypeScript errors and
 * suggest fixes with explanations. It provides intelligent error resolution
 * by understanding the context of the error and the surrounding code.
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { logSecurityEvent } from '../security';

// Types for our OpenAI fixer
export interface ErrorContext {
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: string;
  category: string;
  codeSnippet?: string;
  surroundingCode?: string;
}

export interface FixSuggestion {
  fixedCode: string;
  explanation: string;
  confidence: number;
  aiGenerated: boolean;
  alternativeFixes?: FixSuggestion[];
}

export interface FixerOptions {
  maxTokens?: number;
  temperature?: number;
  includeAlternatives?: boolean;
  maxAlternatives?: number;
  useCache?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// Default options
const defaultOptions: FixerOptions = {
  maxTokens: 1000,
  temperature: 0.2,  // Lower temperature for more deterministic outputs
  includeAlternatives: false,
  maxAlternatives: 2,
  useCache: true,
  maxRetries: 3,
  retryDelay: 1000,
};

// Simple in-memory cache for fix suggestions
const fixCache = new Map<string, FixSuggestion>();

/**
 * Creates an error context key for caching
 */
function createErrorContextKey(error: ErrorContext): string {
  return `${error.file}:${error.line}:${error.column}:${error.code}`;
}

/**
 * Gets code context surrounding an error location
 */
function getCodeContext(filePath: string, lineNumber: number, contextLines: number = 5): string {
  try {
    if (!fs.existsSync(filePath)) {
      return '';
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length - 1, lineNumber + contextLines);
    
    return lines.slice(startLine, endLine + 1)
      .map((line, index) => `${startLine + index + 1}${startLine + index + 1 === lineNumber ? ' >' : '  '} ${line}`)
      .join('\n');
  } catch (error) {
    console.error(`Error getting code context for ${filePath}:${lineNumber}`, error);
    return '';
  }
}

/**
 * OpenAI Enhanced TypeScript Error Fixer class
 */
export class OpenAIEnhancedFixer {
  private openai: OpenAI | null = null;
  private options: FixerOptions = { ...defaultOptions };
  private isReady: boolean = false;

  constructor(options: FixerOptions = {}) {
    // Ensure OPENAI_API_KEY is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      this.isReady = false;
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.options = { ...defaultOptions, ...options };
    this.isReady = true;
  }

  /**
   * Check if the fixer is ready to use
   */
  public isFixerReady(): boolean {
    return this.isReady;
  }

  /**
   * Generate a fix suggestion for a TypeScript error
   */
  public async generateFixSuggestion(error: ErrorContext): Promise<FixSuggestion | null> {
    if (!this.isReady) {
      console.error('OpenAI Enhanced Fixer is not ready (API key missing)');
      return null;
    }

    // Check cache if enabled
    const cacheKey = createErrorContextKey(error);
    if (this.options.useCache && fixCache.has(cacheKey)) {
      return fixCache.get(cacheKey)!;
    }

    try {
      // If the error context doesn't include surrounding code, fetch it
      if (!error.surroundingCode && error.file) {
        error.surroundingCode = getCodeContext(error.file, error.line);
      }

      // Create the prompt for OpenAI
      const prompt = this.createFixPrompt(error);
      
      // Call OpenAI with retries
      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt < (this.options.maxRetries || 1)) {
        try {
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          if (!this.openai) {
            throw new Error('OpenAI client is not initialized');
          }
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert TypeScript programmer specializing in fixing TypeScript errors with minimal, precise changes. Provide fixes that address the root cause without changing functionality. Keep fixes minimal and provide clear explanations of what went wrong."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: this.options.maxTokens,
            temperature: this.options.temperature,
            response_format: { type: "json_object" }
          });

          // Parse the response
          const content = response.choices[0].message.content;
          if (!content) {
            throw new Error('Empty response from OpenAI API');
          }

          try {
            const result = JSON.parse(content);
            
            // Create fix suggestion
            const fixSuggestion: FixSuggestion = {
              fixedCode: result.fixedCode || '',
              explanation: result.explanation || 'No explanation provided',
              confidence: result.confidence || 70,
              aiGenerated: true,
              alternativeFixes: result.alternatives || []
            };

            // Cache the result if caching is enabled
            if (this.options.useCache) {
              fixCache.set(cacheKey, fixSuggestion);
            }

            // Log success
            logSecurityEvent('AI TypeScript fix generated', 'info', { 
              file: error.file, 
              errorCode: error.code,
              line: String(error.line) 
            });

            return fixSuggestion;
          } catch (parseError) {
            console.error('Error parsing OpenAI response:', parseError);
            throw new Error('Invalid JSON response from OpenAI API');
          }
        } catch (callError) {
          lastError = callError as Error;
          attempt++;
          if (attempt < (this.options.maxRetries || 1)) {
            await new Promise(resolve => setTimeout(resolve, this.options.retryDelay || 1000));
          }
        }
      }

      // If we get here, all retries failed
      console.error(`Failed to generate fix suggestion after ${this.options.maxRetries} attempts:`, lastError);
      
      // Log error
      logSecurityEvent('AI TypeScript fix generation failed', 'error', { 
        file: error.file, 
        errorCode: error.code,
        errorMessage: lastError ? lastError.message : 'Unknown error'
      });
      
      return null;
    } catch (error) {
      console.error('Error generating fix suggestion:', error);
      return null;
    }
  }

  /**
   * Create a prompt for OpenAI to fix the TypeScript error
   */
  private createFixPrompt(error: ErrorContext): string {
    return `
I need help fixing a TypeScript error in my code:

Error Code: ${error.code}
Error Message: ${error.message}
File: ${error.file}
Line: ${error.line}
Column: ${error.column}
Severity: ${error.severity}
Category: ${error.category}

Here's the code with the error (the line with the error is marked with >):

\`\`\`typescript
${error.surroundingCode || 'No code context available'}
\`\`\`

Please analyze this error and provide a fix. Return your response in JSON format with the following fields:
1. "fixedCode" - Just the code for the corrected line without any line numbers or markers
2. "explanation" - A clear explanation of what caused the error and how your fix resolves it
3. "confidence" - A number between 0-100 representing your confidence in this fix
${this.options.includeAlternatives ? '4. "alternatives" - An array of alternative fixes if applicable (each with fixedCode, explanation, and confidence)' : ''}

Your goal is to fix the issue with minimal changes to maintain the original code's intent.
`;
  }

  /**
   * Apply a fix to a file
   */
  public async applyFixToFile(filePath: string, lineNumber: number, fixedCode: string): Promise<boolean> {
    try {
      // Ensure file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');

      // Ensure line number is valid
      if (lineNumber < 1 || lineNumber > lines.length) {
        throw new Error(`Invalid line number: ${lineNumber}`);
      }

      // Create backup of the file
      const backupPath = `${filePath}.bak`;
      fs.writeFileSync(backupPath, fileContent);

      // Replace the line
      lines[lineNumber - 1] = fixedCode;

      // Write the file back
      fs.writeFileSync(filePath, lines.join('\n'));

      // Log success
      logSecurityEvent('Applied TypeScript fix to file', 'info', { 
        file: filePath, 
        line: String(lineNumber)
      });

      return true;
    } catch (error) {
      console.error(`Failed to apply fix to ${filePath}:${lineNumber}:`, error);
      
      // Log error
      logSecurityEvent('Failed to apply TypeScript fix', 'error', { 
        file: filePath, 
        line: String(lineNumber),
        errorMessage: (error as Error).message
      });
      
      return false;
    }
  }

  /**
   * Clear the fix cache
   */
  public clearCache(): void {
    fixCache.clear();
  }
}

// Create and export a singleton instance with default options
export const openAIEnhancedFixer = new OpenAIEnhancedFixer();

// Export a function to get a fixer instance with custom options
export function createOpenAIEnhancedFixer(options: FixerOptions = {}): OpenAIEnhancedFixer {
  return new OpenAIEnhancedFixer(options);
}

// Interface for the error input to fixTypeScriptErrorsWithOpenAI
export interface TypeScriptErrorInput {
  errorCode: string;
  messageText: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  category: string;
  severity: string;
  source?: string;
}

// Interface for the fix option parameters
export interface FixOptions {
  maxContextLines?: number;
  enableExplanation?: boolean;
  temperature?: number;
  maxRetries?: number;
}

// Interface for the fix result
export interface FixResult {
  error: TypeScriptErrorInput;
  fixedCode: string;
  explanation: string;
  confidence: number;
  success: boolean;
}

/**
 * Fix TypeScript errors using OpenAI
 * 
 * @param errors Array of TypeScript errors to fix
 * @param options Configuration options for the fix process
 * @returns Array of fixes with explanations
 */
export async function fixTypeScriptErrorsWithOpenAI(
  errors: TypeScriptErrorInput[],
  options: FixOptions = {}
): Promise<FixResult[]> {
  const fixes: FixResult[] = [];
  const fixer = openAIEnhancedFixer;
  
  // Check if fixer is ready
  if (!fixer.isFixerReady()) {
    console.error('OpenAI Enhanced Fixer is not ready (API key missing)');
    logSecurityEvent('OpenAI TypeScript fixer not ready', 'error', { 
      reason: 'API key missing'
    });
    return [];
  }
  
  // Get context lines
  const contextLines = options.maxContextLines || 10;
  
  // Process each error
  for (const error of errors) {
    try {
      // Skip if missing required fields
      if (!error.filePath || !error.lineNumber) {
        continue;
      }
      
      // Convert to our internal error context format
      const errorContext: ErrorContext = {
        code: error.errorCode,
        message: error.messageText,
        file: error.filePath,
        line: error.lineNumber,
        column: error.columnNumber,
        severity: error.severity,
        category: error.category,
        // If source is provided, use it, otherwise get context from file
        surroundingCode: error.source || getCodeContext(error.filePath, error.lineNumber, contextLines)
      };
      
      // Generate fix suggestion
      const fixSuggestion = await fixer.generateFixSuggestion(errorContext);
      
      if (fixSuggestion) {
        // Create fix result
        const fixResult: FixResult = {
          error,
          fixedCode: fixSuggestion.fixedCode,
          explanation: fixSuggestion.explanation,
          confidence: fixSuggestion.confidence,
          success: true
        };
        
        fixes.push(fixResult);
        
        // Log success
        logSecurityEvent('Generated TypeScript fix', 'info', { 
          file: error.filePath, 
          line: String(error.lineNumber),
          errorCode: error.errorCode
        });
      } else {
        // Log failure
        logSecurityEvent('Failed to generate TypeScript fix', 'error', { 
          file: error.filePath, 
          line: String(error.lineNumber),
          errorCode: error.errorCode
        });
      }
    } catch (err) {
      console.error(`Error fixing TypeScript error in ${error.filePath}:${error.lineNumber}:`, err);
      
      // Log error
      logSecurityEvent('Error fixing TypeScript code', 'error', { 
        file: error.filePath, 
        line: String(error.lineNumber),
        errorCode: error.errorCode,
        errorMessage: (err as Error).message
      });
    }
  }
  
  return fixes;
}