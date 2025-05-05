/**
 * OpenAI Enhanced TypeScript Error Fixer
 * 
 * Uses OpenAI's GPT models to analyze and suggest fixes for complex TypeScript errors
 * that cannot be automatically fixed by standard approaches.
 */

import OpenAI from "openai";
import { TypeScriptError } from './ts-error-analyzer';
import * as fs from 'fs';
import * as path from 'path';

// Initialize OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interface for the enhanced fixer configuration
export interface OpenAIFixerConfig {
  maxContextLines: number;  // Number of lines to include before and after the error
  model: string;            // OpenAI model to use
  temperature: number;      // Temperature for generation (0-1)
  maxTokens: number;        // Maximum tokens to generate
  enableExplanation: boolean; // Whether to include explanations with fixes
  maxErrorsPerBatch: number;  // Maximum number of errors to process in a single OpenAI call
  skipUnsolvablePatterns: boolean; // Whether to skip errors matching patterns that are typically unsolvable
}

// Default configuration
export const DEFAULT_OPENAI_FIXER_CONFIG: OpenAIFixerConfig = {
  maxContextLines: 15,
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1000,
  enableExplanation: true,
  maxErrorsPerBatch: 3,
  skipUnsolvablePatterns: true
};

// Patterns of errors that are typically not solvable by this tool
const UNSOLVABLE_ERROR_PATTERNS = [
  /Cannot find module/,
  /Cannot find name/,
  /Property '.*' does not exist on type/,
  /Module not found/
];

// Interface for fix suggestions returned by OpenAI
export interface FixSuggestion {
  error: TypeScriptError;
  fixedCode: string;
  explanation: string | null;
  confidence: 'high' | 'medium' | 'low';
  requiresHumanReview: boolean;
}

/**
 * Get code context around an error
 */
function getCodeContext(filePath: string, lineNumber: number, contextLines: number): string {
  try {
    if (!fs.existsSync(filePath)) {
      return `[File not found: ${filePath}]`;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length - 1, lineNumber + contextLines - 1);
    
    let context = '';
    for (let i = startLine; i <= endLine; i++) {
      // Mark the error line with a pointer
      const prefix = i === lineNumber - 1 ? '> ' : '  ';
      context += `${prefix}${i + 1}: ${lines[i]}\n`;
    }
    
    return context;
  } catch (error: any) {
    console.error(`Error getting code context for ${filePath}:${lineNumber}:`, error?.message);
    return `[Error reading file: ${error?.message || 'Unknown error'}]`;
  }
}

/**
 * Check if an error matches any of the unsolvable patterns
 */
function isUnsolvableError(error: TypeScriptError): boolean {
  return UNSOLVABLE_ERROR_PATTERNS.some(pattern => 
    pattern.test(error.messageText)
  );
}

/**
 * Create a prompt for OpenAI to fix TypeScript errors
 */
function createErrorFixPrompt(errors: TypeScriptError[], config: OpenAIFixerConfig): string {
  let prompt = `You are an expert TypeScript developer. Analyze and fix the following TypeScript errors.\n\n`;
  
  errors.forEach((error, index) => {
    const context = getCodeContext(error.filePath, error.lineNumber, config.maxContextLines);
    
    prompt += `Error ${index + 1}:\n`;
    prompt += `File: ${error.filePath}\n`;
    prompt += `Line: ${error.lineNumber}, Column: ${error.columnNumber}\n`;
    prompt += `Error Code: ${error.errorCode}\n`;
    prompt += `Error Message: ${error.messageText}\n\n`;
    prompt += `Code Context:\n${context}\n\n`;
  });
  
  prompt += `For each error, provide:\n`;
  prompt += `1. The fixed code that resolves the issue\n`;
  if (config.enableExplanation) {
    prompt += `2. A brief explanation of what was wrong and how you fixed it\n`;
  }
  prompt += `3. Your confidence level (high, medium, low)\n`;
  prompt += `4. Whether this fix requires human review (true/false)\n\n`;
  
  prompt += `Return your answer in JSON format as follows:
{
  "fixes": [
    {
      "errorIndex": 0,
      "fixedCode": "// The corrected code here",
      "explanation": "Why the error occurred and how it was fixed",
      "confidence": "high|medium|low",
      "requiresHumanReview": false
    },
    // Additional fixes...
  ]
}`;
  
  return prompt;
}

/**
 * Process a batch of TypeScript errors and get fix suggestions
 */
async function processErrorBatch(
  errors: TypeScriptError[], 
  config: OpenAIFixerConfig
): Promise<FixSuggestion[]> {
  const prompt = createErrorFixPrompt(errors, config);
  
  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }
    
    try {
      const result = JSON.parse(content);
      if (!result.fixes || !Array.isArray(result.fixes)) {
        throw new Error("Invalid response format from OpenAI");
      }
      
      return result.fixes.map((fix: any, index: number) => {
        const errorIndex = typeof fix.errorIndex === 'number' ? fix.errorIndex : index;
        const correspondingError = errors[errorIndex];
        
        if (!correspondingError) {
          throw new Error(`No corresponding error found for fix at index ${errorIndex}`);
        }
        
        return {
          error: correspondingError,
          fixedCode: fix.fixedCode || '',
          explanation: fix.explanation || null,
          confidence: (fix.confidence || 'medium') as 'high' | 'medium' | 'low',
          requiresHumanReview: fix.requiresHumanReview === true
        };
      });
    } catch (err: any) {
      console.error("Error parsing OpenAI response:", err?.message, "\nResponse:", content);
      throw new Error(`Failed to parse OpenAI response: ${err?.message}`);
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error?.message);
    throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Split errors into batches for processing
 */
function splitErrorsIntoBatches(
  errors: TypeScriptError[], 
  batchSize: number,
  skipUnsolvable: boolean
): TypeScriptError[][] {
  const filteredErrors = skipUnsolvable 
    ? errors.filter(error => !isUnsolvableError(error))
    : errors;
  
  const batches: TypeScriptError[][] = [];
  for (let i = 0; i < filteredErrors.length; i += batchSize) {
    batches.push(filteredErrors.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Apply fixes to TypeScript errors using OpenAI
 */
export async function fixTypeScriptErrorsWithOpenAI(
  errors: TypeScriptError[],
  config: Partial<OpenAIFixerConfig> = {}
): Promise<FixSuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  
  // Merge with default config
  const fullConfig: OpenAIFixerConfig = {
    ...DEFAULT_OPENAI_FIXER_CONFIG,
    ...config
  };
  
  console.log(`[OpenAI Fixer] Processing ${errors.length} TypeScript errors...`);
  if (errors.length === 0) {
    return [];
  }
  
  // Split errors into batches
  const batches = splitErrorsIntoBatches(
    errors, 
    fullConfig.maxErrorsPerBatch,
    fullConfig.skipUnsolvablePatterns
  );
  
  console.log(`[OpenAI Fixer] Split into ${batches.length} batches for processing`);
  
  // Process each batch
  const suggestions: FixSuggestion[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[OpenAI Fixer] Processing batch ${i + 1}/${batches.length} (${batch.length} errors)...`);
    
    try {
      const batchSuggestions = await processErrorBatch(batch, fullConfig);
      suggestions.push(...batchSuggestions);
    } catch (error: any) {
      console.error(`[OpenAI Fixer] Error processing batch ${i + 1}:`, error?.message);
      // Continue with other batches even if one fails
    }
  }
  
  return suggestions;
}

/**
 * Apply a fix suggestion to a file
 */
export function applyFixToFile(suggestion: FixSuggestion): boolean {
  const { error, fixedCode } = suggestion;
  const { filePath, lineNumber } = error;
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[OpenAI Fixer] File not found: ${filePath}`);
      return false;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Replace the line with the fixed code
    lines[lineNumber - 1] = fixedCode;
    
    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    console.log(`[OpenAI Fixer] Fixed error in ${filePath}:${lineNumber}`);
    return true;
  } catch (error: any) {
    console.error(`[OpenAI Fixer] Error applying fix to ${filePath}:${lineNumber}:`, error?.message);
    return false;
  }
}

/**
 * Generate a summary report of OpenAI fixes
 */
export function generateFixSummary(suggestions: FixSuggestion[]): string {
  const totalFixes = suggestions.length;
  const highConfidence = suggestions.filter(s => s.confidence === 'high').length;
  const mediumConfidence = suggestions.filter(s => s.confidence === 'medium').length;
  const lowConfidence = suggestions.filter(s => s.confidence === 'low').length;
  const requiresReview = suggestions.filter(s => s.requiresHumanReview).length;
  
  return `
OpenAI TypeScript Error Fix Summary
===================================
Total fixes suggested: ${totalFixes}
High confidence fixes: ${highConfidence}
Medium confidence fixes: ${mediumConfidence}
Low confidence fixes: ${lowConfidence}
Fixes requiring human review: ${requiresReview}
  `;
}

/**
 * Save fix suggestions to a report file
 */
export function saveFixSuggestionsReport(
  suggestions: FixSuggestion[], 
  outputPath: string = './openai-fix-suggestions.json'
): string {
  const report = {
    timestamp: new Date().toISOString(),
    totalSuggestions: suggestions.length,
    suggestions: suggestions.map(s => ({
      file: s.error.filePath,
      line: s.error.lineNumber,
      column: s.error.columnNumber,
      errorCode: s.error.errorCode,
      errorMessage: s.error.messageText,
      fixedCode: s.fixedCode,
      explanation: s.explanation,
      confidence: s.confidence,
      requiresHumanReview: s.requiresHumanReview
    }))
  };
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`[OpenAI Fixer] Fix suggestions saved to: ${outputPath}`);
  
  return outputPath;
}