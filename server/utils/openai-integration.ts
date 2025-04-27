/**
 * OpenAI Integration for TypeScript Error Management
 * 
 * This module provides AI-powered error analysis and fix suggestions
 * for TypeScript errors in the codebase.
 */

import OpenAI from "openai";
import { TypeScriptErrorDetail } from "../types/ts-error-types";
import fs from "fs";
import path from "path";

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export interface ErrorAnalysisResult {
  originalError: TypeScriptErrorDetail;
  suggestedFix: string;
  explanation: string;
  confidence: number;
  fixStrategy: FixStrategy;
  dependentFiles?: string[];
  codeSnippet?: string;
}

export type FixStrategy = 
  | "type-assertion"
  | "type-guard" 
  | "null-check"
  | "interface-update"
  | "import-fix"
  | "function-signature"
  | "refactor"
  | "no-fix-needed"
  | "unknown";

/**
 * Analyze a TypeScript error and suggest a fix
 * 
 * @param error The TypeScript error to analyze
 * @param filePath Path to the file with the error
 * @returns A detailed analysis with suggested fix
 */
export async function analyzeError(
  error: TypeScriptErrorDetail,
  filePath: string
): Promise<ErrorAnalysisResult> {
  // Get file content for context
  const fileContent = fs.existsSync(filePath) 
    ? fs.readFileSync(filePath, "utf-8")
    : "";
  
  // Extract relevant code context
  const codeContext = extractCodeContext(fileContent, error.line);
  
  // Prepare prompt for OpenAI
  const prompt = `
    I need help fixing a TypeScript error:
    
    Error Code: ${error.code}
    Error Message: ${error.message}
    File: ${error.file}
    Line: ${error.line}, Column: ${error.column}
    Error Category: ${error.category}
    
    Here's the relevant code context:
    \`\`\`typescript
    ${codeContext}
    \`\`\`
    
    Please analyze this error and provide:
    1. A suggested fix (the exact code to replace the problematic section)
    2. An explanation of why the error occurred
    3. A confidence score (0-1) for your suggested fix
    4. The fix strategy that best describes your approach
    5. Any dependencies this fix might have on other files
    
    Respond with JSON in this exact format:
    {
      "suggestedFix": "string (the exact code to use as replacement)",
      "explanation": "string (why the error occurred and how the fix works)",
      "confidence": number (between 0 and 1),
      "fixStrategy": "one of: type-assertion, type-guard, null-check, interface-update, import-fix, function-signature, refactor, no-fix-needed, unknown",
      "dependentFiles": ["array of file paths that might need updates"],
      "codeSnippet": "string (the exact code section to be replaced)"
    }
  `;

  try {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert TypeScript developer with deep knowledge of type systems. Your specialty is analyzing and fixing TypeScript errors."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content || "";
    const result = JSON.parse(content);
    
    return {
      originalError: error,
      suggestedFix: result.suggestedFix,
      explanation: result.explanation,
      confidence: result.confidence,
      fixStrategy: result.fixStrategy,
      dependentFiles: result.dependentFiles || [],
      codeSnippet: result.codeSnippet
    };
  } catch (err) {
    console.error("Error calling OpenAI API:", err);
    
    // Return fallback result
    return {
      originalError: error,
      suggestedFix: "",
      explanation: "Failed to get AI-powered suggestions due to API error.",
      confidence: 0,
      fixStrategy: "unknown"
    };
  }
}

/**
 * Generate educational content about a TypeScript error pattern
 * 
 * @param errorCode The TypeScript error code
 * @param errorPattern Description of the error pattern
 * @returns Educational content about the error
 */
export async function generateErrorEducation(
  errorCode: string,
  errorPattern: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert TypeScript educator. Your goal is to explain TypeScript error patterns in a way that helps developers learn and improve."
        },
        {
          role: "user",
          content: `
            Please provide educational content about this TypeScript error pattern:
            
            Error Code: ${errorCode}
            Pattern: ${errorPattern}
            
            Include:
            1. A clear explanation of what causes this error
            2. Best practices to avoid it
            3. Examples of both incorrect and correct code
            4. Any TypeScript-specific nuances to be aware of
          `
        }
      ]
    });

    return response.choices[0].message.content || "No content available";
  } catch (err) {
    console.error("Error generating educational content:", err);
    return "Failed to generate educational content due to API error.";
  }
}

/**
 * Analyze multiple related errors to find root causes
 * 
 * @param errors Array of related TypeScript errors
 * @returns Analysis of root causes with suggested fixes
 */
export async function analyzeErrorGroup(
  errors: TypeScriptErrorDetail[]
): Promise<{
  rootCause: string;
  fixApproach: string;
  dependencyOrder: number[];
}> {
  try {
    // Format errors for the prompt
    const errorsText = errors.map((e, i) => `
      Error ${i+1}:
      Code: ${e.code}
      Message: ${e.message}
      File: ${e.file}
      Line: ${e.line}, Column: ${e.column}
    `).join("\n");
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying root causes in groups of related TypeScript errors."
        },
        {
          role: "user",
          content: `
            I have a group of related TypeScript errors:
            
            ${errorsText}
            
            Please analyze these errors and identify:
            1. The root cause that is likely creating these errors
            2. A systematic approach to fix them
            3. The optimal order to fix the errors (by their index numbers)
            
            Respond with JSON in this format:
            {
              "rootCause": "string (description of the underlying issue)",
              "fixApproach": "string (systematic approach to fix the errors)",
              "dependencyOrder": [array of indices in the order they should be fixed]
            }
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    // Use a non-null assertion with a default value for safety
    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === 'string' ? messageContent : "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("Error analyzing error group:", err);
    return {
      rootCause: "Failed to analyze error group due to API error.",
      fixApproach: "Manual analysis required.",
      dependencyOrder: errors.map((_, i) => i)
    };
  }
}

/**
 * Extract code context from file content around the error line
 * 
 * @param fileContent The content of the file
 * @param errorLine The line number where the error occurred
 * @param contextLines Number of lines to include before and after
 * @returns Code context as a string
 */
function extractCodeContext(
  fileContent: string,
  errorLine: number,
  contextLines: number = 10
): string {
  if (!fileContent) return "";
  
  const lines = fileContent.split("\n");
  const startLine = Math.max(0, errorLine - contextLines - 1);
  const endLine = Math.min(lines.length, errorLine + contextLines);
  
  return lines.slice(startLine, endLine)
    .map((line, i) => `${startLine + i + 1}${startLine + i + 1 === errorLine ? " →" : "  "}: ${line}`)
    .join("\n");
}