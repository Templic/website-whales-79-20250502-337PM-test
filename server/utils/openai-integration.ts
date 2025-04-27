/**
 * OpenAI Integration for TypeScript Error Management
 *
 * This module provides AI-powered analysis of TypeScript errors using OpenAI.
 * It can generate suggested fixes, explain errors, and provide context for complex type issues.
 */

import OpenAI from "openai";
import { 
  TypeScriptErrorDetail, 
  ErrorAnalysisResult,
  ErrorSeverity,
  ErrorCategory,
  FixSuggestion
} from "./ts-error-analyzer";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Options for the AI analysis process
 */
export interface AIAnalysisOptions {
  maximumErrorsToAnalyze?: number;
  includeCodeContext?: boolean;
  useDetailedExplanations?: boolean;
  generateFixSuggestions?: boolean;
  maxTokensPerResponse?: number;
  temperature?: number;
  customInstructions?: string;
}

/**
 * Default options for AI analysis
 */
const defaultOptions: AIAnalysisOptions = {
  maximumErrorsToAnalyze: 25,
  includeCodeContext: true,
  useDetailedExplanations: true,
  generateFixSuggestions: true,
  maxTokensPerResponse: 2048,
  temperature: 0.1,
  customInstructions: ""
};

/**
 * The main function to analyze TypeScript errors using OpenAI
 */
export async function analyzeErrorsWithAI(
  errors: TypeScriptErrorDetail[],
  options: AIAnalysisOptions = {}
): Promise<ErrorAnalysisResult> {
  // Merge with default options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Limit the number of errors to analyze
  const limitedErrors = errors.slice(0, mergedOptions.maximumErrorsToAnalyze);
  
  // Group similar errors to reduce API calls
  const groupedErrors = groupSimilarErrors(limitedErrors);
  
  console.log(`Analyzing ${limitedErrors.length} errors grouped into ${groupedErrors.length} categories using OpenAI...`);
  
  // Process each group of errors
  const analysisPromises = groupedErrors.map(errorGroup => 
    analyzeErrorGroup(errorGroup, mergedOptions)
  );
  
  // Wait for all analyses to complete
  const analysisResults = await Promise.all(analysisPromises);
  
  // Flatten and map the results back to the original errors
  const errorAnalysis = new Map<number, FixSuggestion>();
  
  analysisResults.forEach(result => {
    if (result.fixes) {
      result.errors.forEach(errorId => {
        errorAnalysis.set(errorId, result.fixes);
      });
    }
  });
  
  return {
    analyzedErrors: errors.map(error => error.code),
    fixSuggestions: Object.fromEntries(errorAnalysis),
    aiEnabled: true,
    processingTimeMs: 0, // This will be set by the caller
    summary: `AI analysis completed for ${limitedErrors.length} errors`
  };
}

/**
 * Group similar errors to reduce API calls
 */
function groupSimilarErrors(errors: TypeScriptErrorDetail[]): Array<{
  representative: TypeScriptErrorDetail;
  errors: TypeScriptErrorDetail[];
  errorIds: number[];
}> {
  const groups: Record<string, TypeScriptErrorDetail[]> = {};
  
  // Group by error code and category
  errors.forEach(error => {
    const key = `${error.code}-${error.category}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(error);
  });
  
  // Convert to array format
  return Object.values(groups).map(group => ({
    representative: group[0],
    errors: group,
    errorIds: group.map(error => Number(error.code.replace(/[^\d]/g, '')))
  }));
}

/**
 * Analyze a group of similar errors using OpenAI
 */
async function analyzeErrorGroup(
  errorGroup: {
    representative: TypeScriptErrorDetail;
    errors: TypeScriptErrorDetail[];
    errorIds: number[];
  },
  options: AIAnalysisOptions
): Promise<{
  errors: number[];
  fixes: FixSuggestion;
}> {
  const { representative, errorIds } = errorGroup;
  
  // Prepare the context for the API request
  const context = prepareErrorContext(representative, options);
  
  try {
    // Make the API request to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: `You are an expert TypeScript developer specializing in analyzing and fixing TypeScript errors. 
                   ${options.customInstructions || ""}` 
        },
        { 
          role: "user", 
          content: context 
        }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokensPerResponse,
      response_format: { type: "json_object" }
    });
    
    // Extract and parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    let fixData: any;
    try {
      fixData = JSON.parse(responseContent);
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", responseContent.substring(0, 100) + "...");
      fixData = { explanation: "Error parsing AI response" };
    }
    
    // Create a fix suggestion
    const fixSuggestion: FixSuggestion = {
      explanation: fixData.explanation || "No explanation provided",
      suggestedFix: fixData.suggestedFix || "No fix suggested",
      relatedErrors: fixData.relatedErrors || [],
      impact: fixData.impact || "unknown",
      confidence: fixData.confidence || 0.5,
      alternatives: fixData.alternatives || []
    };
    
    return {
      errors: errorIds,
      fixes: fixSuggestion
    };
    
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    
    // Return a basic suggestion on error
    return {
      errors: errorIds,
      fixes: {
        explanation: `Error analyzing with AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: "Please check the error message and try again",
        relatedErrors: [],
        impact: "unknown",
        confidence: 0,
        alternatives: []
      }
    };
  }
}

/**
 * Prepare the error context for the API request
 */
function prepareErrorContext(
  error: TypeScriptErrorDetail,
  options: AIAnalysisOptions
): string {
  let context = `
Please analyze the following TypeScript error and provide a detailed solution:

Error code: ${error.code}
Error message: ${error.message}
File: ${error.file}
Line: ${error.line}, Column: ${error.column}
Severity: ${error.severity}
Category: ${error.category}
`;

  if (options.includeCodeContext && error.snippet) {
    context += `
Code snippet:
\`\`\`typescript
${error.snippet}
\`\`\`
`;
  }

  context += `
Based on this information, provide a JSON response with the following fields:
- explanation: A clear explanation of what causes this error and why it's a problem
- suggestedFix: Code that shows how to fix the issue
- relatedErrors: An array of error types that might be related or caused by the same issue
- impact: The potential impact if this error is not fixed (e.g., "runtime error", "type safety issue", "build failure")
- confidence: A number between 0 and 1 indicating confidence in the suggested fix
- alternatives: An array of alternative approaches to fixing the issue

Please ensure your response is valid JSON.
`;

  return context;
}

/**
 * Batched analysis to efficiently use API credits
 */
export async function batchAnalyzeErrors(
  errors: TypeScriptErrorDetail[],
  options: AIAnalysisOptions = {}
): Promise<ErrorAnalysisResult> {
  // Implement batching logic here
  return analyzeErrorsWithAI(errors, options);
}

/**
 * Check if OpenAI API is available and properly configured
 */
export async function checkOpenAIAvailability(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not found in environment variables");
    return false;
  }
  
  try {
    // Make a simple API call to check if the key is valid
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "user", content: "TypeScript" }
      ],
      max_tokens: 5
    });
    
    return !!response.choices[0].message.content;
  } catch (error) {
    console.error("Failed to connect to OpenAI API:", error);
    return false;
  }
}