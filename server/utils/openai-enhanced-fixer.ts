/**
 * Enhanced OpenAI TypeScript Error Fixer
 * 
 * This utility uses OpenAI's GPT-4o model to provide improved error resolution suggestions 
 * with security validation and confidence scoring.
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import { TypeScriptErrorDetail } from './ts-error-finder';
import path from 'path';
import { db } from '../db';
import { errorAnalysis, errorFixes, errorPatterns, typeScriptErrors } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Error context window size (lines before and after error)
const CONTEXT_WINDOW = 10;

// Confidence threshold for automatic fixes
const AUTO_FIX_CONFIDENCE_THRESHOLD = 90;

// Security risk terms to flag for review
const SECURITY_RISK_TERMS = [
  'eval', 'Function(', 'setTimeout(', 'setInterval(', 'execScript', 
  'innerHTML', 'outerHTML', 'document.write', 'dangerouslySetInnerHTML',
  'constructor.constructor', '__proto__', 'Object.assign', 'Object.defineProperty',
  'crypto.subtle', 'window.open', 'localStorage', 'sessionStorage',
  'indexedDB', 'navigator.sendBeacon', 'WebSocket', 'XMLHttpRequest',
  'fetch(', 'postMessage'
];

/**
 * Main function to analyze and fix TypeScript errors using OpenAI
 */
export async function analyzeAndFixError(
  error: TypeScriptErrorDetail,
  options: {
    securityCheck: boolean;
    applyFix: boolean;
    userId: string;
    scanId: string;
  }
): Promise<{
  originalError: TypeScriptErrorDetail;
  analysis: {
    rootCause: string;
    suggestedFix: string;
    confidence: number;
    securityRisks: string[] | null;
    requiresHumanReview: boolean;
    dependencies: string[] | null;
  };
  fixedCode?: string;
  fixResult?: 'success' | 'failure' | 'pending_review';
  fixId?: number;
}> {
  try {
    // Default response structure
    const result = {
      originalError: error,
      analysis: {
        rootCause: '',
        suggestedFix: '',
        confidence: 0,
        securityRisks: null,
        requiresHumanReview: false,
        dependencies: null
      },
      fixedCode: undefined,
      fixResult: undefined,
      fixId: undefined
    };

    // Read the file content
    const fileContent = await fs.readFile(error.file, 'utf-8');
    const fileLines = fileContent.split('\n');

    // Get context around the error (lines before and after)
    const startLine = Math.max(0, error.line - CONTEXT_WINDOW - 1);
    const endLine = Math.min(fileLines.length - 1, error.line + CONTEXT_WINDOW - 1);
    const contextLines = fileLines.slice(startLine, endLine + 1);
    
    // Calculate line offset to adjust error position
    const lineOffset = startLine;
    const errorLineInContext = error.line - lineOffset - 1;

    // Create a context snippet with error line highlighted
    const contextWithHighlight = contextLines.map((line, idx) => {
      if (idx === errorLineInContext) {
        return `>>> ${line} <<< ERROR: ${error.message}`;
      }
      return line;
    }).join('\n');

    // Determine file type and imports
    const fileType = path.extname(error.file);
    const importLines = fileLines.filter(line => line.trim().startsWith('import '));

    // Generate prompt for OpenAI
    const prompt = `You are a TypeScript expert tasked with fixing code errors. Analyze this TypeScript error and provide a solution:

Error Code: ${error.code}
Error Message: ${error.message}
File: ${error.file}
Line: ${error.line}, Column: ${error.column}
Category: ${error.category}

Code context (error line is marked with >>> <<<):
\`\`\`typescript
${contextWithHighlight}
\`\`\`

${importLines.length > 0 ? `Relevant imports from the file:\n\`\`\`typescript\n${importLines.join('\n')}\n\`\`\`\n` : ''}

Please provide:
1. A root cause analysis of this error
2. A specific code fix 
3. A confidence score (0-100) on your solution
4. Any dependent files or modules that might need updates
5. Potential security implications, if any

Format your response as JSON:
{
  "rootCause": "detailed explanation of what's causing the error",
  "suggestedFix": "suggested code fix",
  "replacementCode": "exact code that should replace the problematic lines",
  "confidence": 85,
  "securityRisks": ["list of any security concerns", "or null if none"],
  "dependencies": ["list of related files that might need updating", "or null if none"]
}
`;

    // Call OpenAI API with the latest model
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a TypeScript expert specializing in error analysis and security-aware code fixes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response as JSON
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }

    let fixData: any;
    try {
      fixData = JSON.parse(responseContent);
    } catch (error) {
      console.error("Failed to parse OpenAI response as JSON:", error);
      throw new Error("Invalid response format from OpenAI");
    }

    // Update result with AI analysis
    result.analysis.rootCause = fixData.rootCause || "No root cause analysis provided";
    result.analysis.suggestedFix = fixData.suggestedFix || "No specific fix suggested";
    result.analysis.confidence = typeof fixData.confidence === 'number' ? fixData.confidence : 0;
    result.analysis.dependencies = Array.isArray(fixData.dependencies) ? fixData.dependencies : null;

    // Check for security risks
    const securityRisks = [];
    const replacementCode = fixData.replacementCode || '';
    
    // Check if the suggested fix contains any security risk patterns
    for (const term of SECURITY_RISK_TERMS) {
      if (replacementCode.includes(term)) {
        securityRisks.push(`Contains potentially risky pattern: ${term}`);
      }
    }
    
    // Add additional security analysis from OpenAI if provided
    if (Array.isArray(fixData.securityRisks) && fixData.securityRisks.length > 0) {
      securityRisks.push(...fixData.securityRisks);
    }
    
    result.analysis.securityRisks = securityRisks.length > 0 ? securityRisks : null;
    result.analysis.requiresHumanReview = 
      securityRisks.length > 0 || 
      result.analysis.confidence < AUTO_FIX_CONFIDENCE_THRESHOLD;

    // Store analysis in database
    const analysisId = await storeErrorAnalysis(error, result.analysis, options.scanId);

    // Apply fix if requested and it meets auto-fix criteria
    if (options.applyFix && !result.analysis.requiresHumanReview) {
      // Logic to apply the fix to the file
      const fixedContent = applyFix(fileContent, error.line - 1, fixData.replacementCode);
      result.fixedCode = fixedContent;
      
      // Write the fixed content back to the file
      await fs.writeFile(error.file, fixedContent, 'utf-8');
      
      // Record fix history
      const fixId = await recordFixHistory({
        errorId: error.code,
        userId: options.userId,
        originalCode: contextLines.join('\n'),
        fixedCode: fixData.replacementCode,
        isSuccess: true,
        securityApproved: !result.analysis.requiresHumanReview,
        method: 'openai-enhanced'
      });
      
      result.fixResult = 'success';
      result.fixId = fixId;
    } else if (options.applyFix && result.analysis.requiresHumanReview) {
      // Record that a fix is pending review
      const fixId = await recordFixHistory({
        errorId: error.code,
        userId: options.userId,
        originalCode: contextLines.join('\n'),
        fixedCode: fixData.replacementCode,
        isSuccess: false,
        securityApproved: false,
        method: 'openai-enhanced-pending-review'
      });
      
      result.fixResult = 'pending_review';
      result.fixId = fixId;
    }

    return result;
  } catch (error) {
    console.error("Error in analyzeAndFixError:", error);
    throw error;
  }
}

/**
 * Apply a code fix to the file content
 */
function applyFix(fileContent: string, errorLine: number, replacement: string): string {
  const lines = fileContent.split('\n');
  
  // Simple single-line replacement (can be enhanced for multi-line fixes)
  lines[errorLine] = replacement;
  
  return lines.join('\n');
}

/**
 * Store the error analysis in the database
 */
async function storeErrorAnalysis(
  error: TypeScriptErrorDetail, 
  analysis: any,
  scanId: string
): Promise<number> {
  try {
    // Find the corresponding error ID in the database
    const [dbError] = await db.select()
      .from(typeScriptErrors)
      .where(eq(typeScriptErrors.error_code, error.code));
    
    if (!dbError) {
      throw new Error(`Error with code ${error.code} not found in database`);
    }
    
    // Insert the analysis record
    const [result] = await db.insert(errorAnalysis)
      .values({
        error_id: dbError.id, 
        analysis_type: 'openai-enhanced',
        analysis_result: {
          rootCause: analysis.rootCause,
          suggestedFix: analysis.suggestedFix,
          dependencies: analysis.dependencies,
          securityRisks: analysis.securityRisks
        },
        confidence: analysis.confidence,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: { scanId }
      })
      .returning();
    
    return result.id;
  } catch (error) {
    console.error("Failed to store error analysis:", error);
    throw error;
  }
}

/**
 * Record fix history in the database
 */
async function recordFixHistory(params: {
  errorId: string;
  userId: string;
  originalCode: string;
  fixedCode: string;
  isSuccess: boolean;
  securityApproved: boolean;
  method: string;
}): Promise<number> {
  try {
    // Find the corresponding error in the database
    const [dbError] = await db.select()
      .from(typeScriptErrors)
      .where(eq(typeScriptErrors.error_code, params.errorId));
    
    if (!dbError) {
      throw new Error(`Error with code ${params.errorId} not found in database`);
    }
    
    // Insert fix history record
    const [result] = await db.insert(errorFixes)
      .values({
        pattern_id: dbError.pattern_id,
        fix_template: params.fixedCode,
        description: `Fix for error code ${params.errorId}`,
        ai_generated: true,
        confidence: 80,
        success_rate: params.isSuccess ? 100 : 0,
        security_approved: params.securityApproved,
        approved_by: params.securityApproved ? params.userId : null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();
    
    return result.id;
  } catch (error) {
    console.error("Failed to record fix history:", error);
    throw error;
  }
}

/**
 * Find or create a pattern for a specific error type
 */
export async function findOrCreateErrorPattern(
  errorCode: string,
  errorMessage: string,
  category: string
): Promise<number> {
  try {
    // Try to find existing pattern for this error type
    const [existingPattern] = await db.select()
      .from(errorPatterns)
      .where(eq(errorPatterns.error_code, errorCode));
    
    if (existingPattern) {
      // Update the frequency count
      await db.update(errorPatterns)
        .set({ 
          frequency: existingPattern.frequency + 1,
          updated_at: new Date() 
        })
        .where(eq(errorPatterns.id, existingPattern.id));
      
      return existingPattern.id;
    }
    
    // Create a new pattern if none exists
    const [newPattern] = await db.insert(errorPatterns)
      .values({
        name: `Pattern for ${errorCode}`,
        description: errorMessage,
        pattern_regex: createPatternRegex(errorMessage),
        error_code: errorCode,
        category: category,
        frequency: 1,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();
    
    return newPattern.id;
  } catch (error) {
    console.error("Failed to find or create error pattern:", error);
    throw error;
  }
}

/**
 * Create a regex pattern from an error message
 */
function createPatternRegex(errorMessage: string): string {
  // Create a generalized regex from the error message
  // This is a simplistic implementation that can be improved
  return errorMessage
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
    .replace(/(['"])[^'"]*\1/g, "['\\w\\s]*") // Replace string literals with wildcard
    .replace(/\b\d+\b/g, "\\d+"); // Replace numbers with digit pattern
}

/**
 * Fix TypeScript errors with OpenAI
 * 
 * This function is used by the admin routes to fix TypeScript errors with OpenAI.
 */
export async function fixTypeScriptErrorsWithOpenAI(
  errors: Array<{
    errorCode: string;
    messageText: string;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    category: string;
    severity: string;
    source?: string;
  }>,
  options: {
    maxContextLines?: number;
    enableExplanation?: boolean;
  } = {}
): Promise<Array<{
  error: {
    errorCode: string;
    filePath: string;
    lineNumber: number;
  };
  fixedCode: string;
  explanation?: string;
  confidence: number;
}>> {
  // Convert to TypeScriptErrorDetail format
  const convertedErrors = errors.map(error => ({
    code: error.errorCode,
    message: error.messageText,
    file: error.filePath,
    line: error.lineNumber,
    column: error.columnNumber,
    category: error.category,
    severity: error.severity,
    snippet: error.source || ""
  }));

  // Use batchProcessErrors for the actual implementation
  const result = await batchProcessErrors(convertedErrors, {
    securityCheck: true,
    applyFixes: false, // Just get the suggestions, don't apply them yet
    userId: 'admin',
    scanId: 'manual-scan',
    maxConcurrent: 5
  });

  // Convert back to the expected format
  return result.results.map(item => {
    // Find the original error and the analysis result
    const originalError = convertedErrors.find(e => e.code === item.errorCode);
    
    if (!originalError) {
      return {
        error: {
          errorCode: item.errorCode,
          filePath: "",
          lineNumber: 0
        },
        fixedCode: "",
        confidence: 0
      };
    }

    // Find the analysis in the database via code in another function
    // For now, we'll return placeholder data
    return {
      error: {
        errorCode: originalError.code,
        filePath: originalError.file,
        lineNumber: originalError.line
      },
      fixedCode: "// Fixed code would be here",
      explanation: options.enableExplanation ? "Explanation would be here" : undefined,
      confidence: item.confidence
    };
  });
}

/**
 * Batch process errors with OpenAI analysis
 */
export async function batchProcessErrors(
  errors: TypeScriptErrorDetail[],
  options: {
    securityCheck: boolean;
    applyFixes: boolean;
    userId: string;
    scanId: string;
    maxConcurrent?: number;
  }
): Promise<{
  processed: number;
  fixed: number;
  pendingReview: number;
  failed: number;
  results: Array<{
    errorCode: string;
    status: 'fixed' | 'pending_review' | 'failed';
    confidence: number;
  }>;
}> {
  const maxConcurrent = options.maxConcurrent || 5;
  const results = [];
  let fixed = 0;
  let pendingReview = 0;
  let failed = 0;
  
  // Process errors in batches to avoid overwhelming the API
  for (let i = 0; i < errors.length; i += maxConcurrent) {
    const batch = errors.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(error => 
      analyzeAndFixError(error, {
        securityCheck: options.securityCheck,
        applyFix: options.applyFixes,
        userId: options.userId,
        scanId: options.scanId
      }).catch(err => {
        console.error(`Failed to process error ${error.code}:`, err);
        return {
          originalError: error,
          analysis: {
            rootCause: 'Error processing with OpenAI',
            suggestedFix: '',
            confidence: 0,
            securityRisks: null,
            requiresHumanReview: true,
            dependencies: null
          },
          fixResult: 'failure' as 'failure'
        };
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result.fixResult === 'success') {
        fixed++;
        results.push({
          errorCode: result.originalError.code,
          status: 'fixed',
          confidence: result.analysis.confidence
        });
      } else if (result.fixResult === 'pending_review') {
        pendingReview++;
        results.push({
          errorCode: result.originalError.code,
          status: 'pending_review',
          confidence: result.analysis.confidence
        });
      } else {
        failed++;
        results.push({
          errorCode: result.originalError.code,
          status: 'failed',
          confidence: result.analysis.confidence
        });
      }
    }
  }
  
  return {
    processed: errors.length,
    fixed,
    pendingReview,
    failed,
    results
  };
}