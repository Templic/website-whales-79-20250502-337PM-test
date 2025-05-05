/**
 * Generate Single Error Fix
 * 
 * This script generates a fix suggestion for a single TypeScript error using OpenAI.
 * It is designed to be run as a separate process from the server, with error details
 * passed via environment variables.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { TypeScriptError } from './server/utils/ts-error-analyzer';
import { db } from './server/db';
import { securityEvents } from './server/security/securityEvents';

// Load environment variables
dotenv.config();

// Constants
const MAX_CONTEXT_LINES = 20;
const OPENAI_MODEL = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const TYPESCRIPT_ERRORS_TABLE = 'typescript_errors';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    console.error(`Error getting code context for ${filePath}:${lineNumber}:`, error?.message || 'Unknown error');
    return `[Error reading file: ${error?.message || 'Unknown error'}]`;
  }
}

/**
 * Create a prompt for OpenAI to fix the TypeScript error
 */
function createFixPrompt(error: TypeScriptError, context: string): string {
  const prompt = `You are an expert TypeScript developer. Analyze and fix the following TypeScript error:

File: ${error.filePath}
Line: ${error.lineNumber}, Column: ${error.columnNumber}
Error Code: ${error.errorCode}
Error Message: ${error.messageText}

Code Context:
${context}

Please provide:
1. The fixed code for the error line only
2. A brief explanation of what was wrong and how you fixed it
3. Your confidence level (high, medium, low)

Return your answer in JSON format as follows:
{
  "fixedCode": "// The corrected line of code here",
  "explanation": "Why the error occurred and how it was fixed",
  "confidence": "high|medium|low"
}

Focus on providing a minimal fix that solves just this error. Do not rewrite unrelated code.`;

  return prompt;
}

/**
 * Generate a fix suggestion for the error
 */
async function generateFixSuggestion(error: TypeScriptError): Promise<{
  suggestion: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}> {
  try {
    const context = getCodeContext(error.filePath, error.lineNumber, MAX_CONTEXT_LINES);
    const prompt = createFixPrompt(error, context);
    
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    try {
      const result = JSON.parse(content);
      
      if (!result.fixedCode) {
        throw new Error('No fixedCode in response');
      }
      
      return {
        suggestion: result.fixedCode,
        explanation: result.explanation || 'No explanation provided',
        confidence: (result.confidence || 'medium') as 'high' | 'medium' | 'low'
      };
    } catch (err: any) {
      console.error('Error parsing OpenAI response:', err?.message, '\nResponse:', content);
      throw new Error(`Failed to parse OpenAI response: ${err?.message}`);
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error?.message);
    throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Save the fix suggestion to the database
 */
async function saveFix(errorId: string, fix: {
  suggestion: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}): Promise<void> {
  await db.execute(`
    UPDATE ${TYPESCRIPT_ERRORS_TABLE}
    SET 
      fix_details = $1::jsonb,
      status = CASE WHEN $2 = 'high' THEN 'FIXED' ELSE 'FIXING' END
    WHERE id = $3
  `, [
    JSON.stringify({
      suggestion: fix.suggestion,
      explanation: fix.explanation,
      confidence: fix.confidence,
      aiGenerated: true,
      generatedAt: new Date().toISOString()
    }),
    fix.confidence,
    errorId
  ]);
}

/**
 * Apply high-confidence fixes automatically
 */
async function applyFixToFile(
  filePath: string, 
  lineNumber: number, 
  fixedCode: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Replace the line with the fixed code
    lines[lineNumber - 1] = fixedCode;
    
    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    console.log(`Fixed error in ${filePath}:${lineNumber}`);
    return true;
  } catch (error: any) {
    console.error(`Error applying fix to ${filePath}:${lineNumber}:`, error?.message || 'Unknown error');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Get error details from environment variables
    const errorId = process.env.ERROR_ID;
    const scanId = process.env.SCAN_ID;
    const filePath = process.env.FILE_PATH;
    const errorLine = process.env.ERROR_LINE ? parseInt(process.env.ERROR_LINE) : 0;
    const errorColumn = process.env.ERROR_COLUMN ? parseInt(process.env.ERROR_COLUMN) : 0;
    const errorCode = process.env.ERROR_CODE;
    const errorMessage = process.env.ERROR_MESSAGE;
    
    if (!errorId || !scanId || !filePath || !errorLine || !errorCode || !errorMessage) {
      throw new Error('Missing required environment variables');
    }
    
    console.log(`Generating fix for error ${errorId} in ${filePath}:${errorLine}`);
    
    // Create TypeScriptError object
    const error: TypeScriptError = {
      errorCode,
      messageText: errorMessage,
      filePath,
      lineNumber: errorLine,
      columnNumber: errorColumn,
      category: 'TYPE_MISMATCH', // Default category
      severity: 'HIGH', // Default severity
      source: ''
    };
    
    // Generate fix suggestion
    const fix = await generateFixSuggestion(error);
    console.log(`Generated fix with confidence: ${fix.confidence}`);
    
    // Save fix to database
    await saveFix(errorId, fix);
    console.log(`Saved fix to database for error ${errorId}`);
    
    // Apply high-confidence fixes automatically
    if (fix.confidence === 'high') {
      const applied = await applyFixToFile(filePath, errorLine, fix.suggestion);
      
      // Log security event
      securityEvents.log({
        type: 'TYPESCRIPT_AI_FIX_APPLIED',
        severity: 'INFO',
        message: `AI fix automatically applied to ${filePath}:${errorLine}`,
        metadata: {
          scanId,
          errorId,
          file: filePath,
          line: errorLine,
          confidence: fix.confidence,
          success: applied
        }
      });
      
      console.log(`Fix ${applied ? 'successfully' : 'failed to be'} applied to file`);
    }
    
    console.log('Fix generation completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('Error generating fix:', error?.message || 'Unknown error');
    
    // Update error status to show generation failed
    try {
      const errorId = process.env.ERROR_ID;
      if (errorId) {
        await db.execute(`
          UPDATE ${TYPESCRIPT_ERRORS_TABLE}
          SET 
            status = 'NEW',
            fix_details = jsonb_set(
              COALESCE(fix_details, '{}'::jsonb),
              '{error}',
              $1::jsonb
            )
          WHERE id = $2
        `, [
          JSON.stringify(error?.message || 'Unknown error'),
          errorId
        ]);
      }
    } catch (dbError) {
      console.error('Failed to update error status:', dbError);
    }
    
    process.exit(1);
  }
}

// Run the script
main();