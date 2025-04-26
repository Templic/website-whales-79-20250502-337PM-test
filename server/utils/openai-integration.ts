/**
 * OpenAI Integration Module for TypeScript Error Analysis
 * 
 * This module provides intelligent analysis of TypeScript errors using OpenAI's GPT models.
 * It helps with understanding complex errors, suggesting fixes, and providing context-aware explanations.
 */

import OpenAI from "openai";
import { TypeScriptError, ErrorAnalysis, InsertErrorAnalysis } from "../tsErrorStorage";
import { db } from "../db";
import { errorAnalysis } from "../../shared/schema";
import fs from 'fs';
import path from 'path';
import { tsErrorStorage } from "../tsErrorStorage";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Default system prompt for TypeScript error analysis
const DEFAULT_SYSTEM_PROMPT = `
You are an expert TypeScript developer specializing in error analysis and resolution.
Your task is to analyze TypeScript errors, explain them clearly, and suggest fixes.

For each error:
1. Explain the error in simple terms
2. Identify the root cause
3. Suggest a precise fix with code examples
4. Consider the broader context and potential side effects of the fix
5. Rate the severity and complexity of the error

Focus on providing accurate, practical solutions that follow TypeScript best practices.
`;

/**
 * Configuration options for OpenAI analysis
 */
export interface OpenAIAnalysisOptions {
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  includeProjectContext?: boolean;
  maxFilesToInclude?: number;
  maxTokens?: number;
}

/**
 * Default configuration for OpenAI analysis
 */
const DEFAULT_OPTIONS: OpenAIAnalysisOptions = {
  model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  temperature: 0.2,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  includeProjectContext: true,
  maxFilesToInclude: 3,
  maxTokens: 1000
};

/**
 * Analyze a TypeScript error using OpenAI
 * 
 * @param error The TypeScript error to analyze
 * @param options Configuration options for the analysis
 * @returns A structured analysis of the error
 */
export async function analyzeErrorWithOpenAI(
  error: TypeScriptError,
  options: OpenAIAnalysisOptions = {}
): Promise<ErrorAnalysis> {
  // Merge provided options with defaults
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Check if the OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
  }
  
  try {
    // Read the file content for context
    let fileContent = "";
    try {
      if (fs.existsSync(error.file_path)) {
        fileContent = fs.readFileSync(error.file_path, 'utf8');
      }
    } catch (err) {
      console.warn(`Failed to read file ${error.file_path}: ${err}`);
    }
    
    // Build related file context if needed
    let projectContext = "";
    if (config.includeProjectContext) {
      projectContext = await buildProjectContext(error, config.maxFilesToInclude || 3);
    }
    
    // Prepare the prompt for OpenAI
    const prompt = `
    I'm analyzing a TypeScript error. Here are the details:
    
    Error Code: ${error.error_code}
    Error Message: ${error.error_message}
    File: ${error.file_path}
    Line: ${error.line_number}, Column: ${error.column_number}
    
    Error Context from the source code:
    \`\`\`typescript
    ${error.error_context}
    \`\`\`
    
    ${fileContent ? `Full file content:\n\`\`\`typescript\n${fileContent}\n\`\`\`` : ""}
    
    ${projectContext ? `Additional project context:\n${projectContext}` : ""}
    
    Please analyze this TypeScript error comprehensively:
    1. Provide a clear explanation of what's wrong
    2. Identify the root cause
    3. Suggest a specific fix with code examples
    4. Consider any side effects or broader implications of the fix
    5. Rate the error's severity and complexity on a scale of 1-10
    
    Format your response as a JSON object with these fields:
    {
      "explanation": "Detailed explanation of the error",
      "rootCause": "The fundamental issue causing the error",
      "suggestedFix": "Code example showing how to fix the error",
      "sideEffects": "Potential implications of applying the fix",
      "complexityRating": number,
      "severityRating": number,
      "additionalNotes": "Any other relevant information"
    }
    `;
    
    // Call OpenAI API for analysis
    const response = await openai.chat.completions.create({
      model: config.model || "gpt-4o",
      messages: [
        { role: "system", content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: config.temperature || 0.2,
      max_tokens: config.maxTokens || 1000,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const analysisContent = response.choices[0].message.content;
    if (!analysisContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    let analysisData;
    try {
      analysisData = JSON.parse(analysisContent);
    } catch (err) {
      console.error("Failed to parse OpenAI response as JSON:", err);
      console.log("Raw response:", analysisContent);
      analysisData = { explanation: "Failed to parse analysis response", rawResponse: analysisContent };
    }
    
    // Calculate confidence score (0-100) based on complexity and OpenAI's reported metrics
    const complexityRating = analysisData.complexityRating || 5;
    const confidenceScore = Math.max(0, Math.min(100, Math.round(100 - complexityRating * 10)));
    
    // Store the analysis in the database
    const insertAnalysis: InsertErrorAnalysis = {
      error_id: error.id,
      analysis_type: 'openai',
      analysis_data: analysisData,
      confidence_score: confidenceScore,
      suggested_fix: analysisData.suggestedFix || null,
      is_ai_generated: true
    };
    
    // Save the analysis to the database
    const savedAnalysis = await tsErrorStorage.createErrorAnalysis(insertAnalysis);
    
    return savedAnalysis;
  } catch (error) {
    console.error("OpenAI analysis failed:", error);
    throw error;
  }
}

/**
 * Build context from related project files that might be relevant to the error
 * 
 * @param error The TypeScript error to analyze
 * @param maxFiles Maximum number of related files to include
 * @returns A string with relevant context from related files
 */
async function buildProjectContext(error: TypeScriptError, maxFiles: number): Promise<string> {
  // Placeholder for project context building
  // In a real implementation, this would:
  // 1. Find imported files related to the error
  // 2. Identify dependent files
  // 3. Extract relevant snippets
  
  let context = "Related file context is not available.";
  
  // This is a placeholder implementation that would be expanded
  // based on the actual codebase structure and error types
  try {
    // Get the directory of the error file
    const errorDir = path.dirname(error.file_path);
    
    // Check for related files (importers and imports)
    // This would be replaced with actual dependency analysis
    
    // For now, we'll just look for files in the same directory
    // with similar names or related functionality
    const errorFileName = path.basename(error.file_path, '.ts');
    
    // Build context string
    context = "Related files will be analyzed here based on project dependencies.";
  } catch (err) {
    console.warn("Failed to build project context:", err);
  }
  
  return context;
}

/**
 * Get existing analysis for an error if available, or create a new one
 * 
 * @param errorId The ID of the error to analyze
 * @param forceRefresh Whether to force a new analysis even if one exists
 * @returns The error analysis
 */
export async function getOrCreateAnalysis(
  errorId: number,
  forceRefresh: boolean = false
): Promise<ErrorAnalysis> {
  // Check if analysis already exists
  let analysis = await tsErrorStorage.getAnalysisForError(errorId);
  
  // If no analysis exists or force refresh is enabled, create a new one
  if (!analysis || forceRefresh) {
    // Get the error details
    const error = await tsErrorStorage.getTypeScriptErrorById(errorId);
    if (!error) {
      throw new Error(`Error with ID ${errorId} not found`);
    }
    
    // Create a new analysis
    analysis = await analyzeErrorWithOpenAI(error);
  }
  
  return analysis;
}

/**
 * Batch analyze multiple errors to optimize API usage
 * 
 * @param errorIds Array of error IDs to analyze
 * @param options Configuration options for the analysis
 * @returns Array of error analyses
 */
export async function batchAnalyzeErrors(
  errorIds: number[],
  options: OpenAIAnalysisOptions = {}
): Promise<ErrorAnalysis[]> {
  const analyses: ErrorAnalysis[] = [];
  
  // Process in batches of 5 to avoid overloading the API
  const batchSize = 5;
  for (let i = 0; i < errorIds.length; i += batchSize) {
    const batch = errorIds.slice(i, i + batchSize);
    
    // Process each error in the batch concurrently
    const batchPromises = batch.map(async (errorId) => {
      try {
        const error = await tsErrorStorage.getTypeScriptErrorById(errorId);
        if (!error) {
          throw new Error(`Error with ID ${errorId} not found`);
        }
        
        return await analyzeErrorWithOpenAI(error, options);
      } catch (err) {
        console.error(`Failed to analyze error ${errorId}:`, err);
        return null;
      }
    });
    
    // Wait for all analyses in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    analyses.push(...batchResults.filter(Boolean) as ErrorAnalysis[]);
    
    // Slight delay between batches to respect API rate limits
    if (i + batchSize < errorIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return analyses;
}

// Export the module
export default {
  analyzeErrorWithOpenAI,
  getOrCreateAnalysis,
  batchAnalyzeErrors
};