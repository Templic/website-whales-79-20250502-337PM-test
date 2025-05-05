/**
 * OpenAI Enhanced Fix Generator
 * 
 * Leverages OpenAI's GPT-4o model to generate fixes for complex TypeScript errors.
 * This system is designed with security, privacy, and best practices in mind:
 * 
 * - Privacy-focused: Minimizes code transmission and uses secure API access
 * - Security-verified: Validates all generated fixes before application
 * - Context-aware: Provides relevant project context for accurate fixes
 * - Self-improving: Learns from successful fixes to improve future suggestions
 */

import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TypeScriptError, Fix } from './ts-error-resolver';
import { SourceFileEdit } from './code-transformer';
import { db } from '../db';
import { errorFixes, errorPatterns } from '@shared/schema';
import { logger } from '../logger';
import { eq, and, desc } from 'drizzle-orm';

// Types for OpenAI integration
interface FixGenerationContext {
  recentFiles?: string[];
  projectTsConfig?: any;
  additionalContext?: string;
  codeContext?: CodeContext;
}

interface CodeContext {
  fileContent: string;
  surroundingCode: string;
  imports: string[];
  dependencies: Record<string, string>;
  similarFixes?: PreviousFix[];
}

interface PreviousFix {
  errorCode: string;
  errorMessage: string;
  fixText: string;
  confidence: number;
  successRate: number;
}

/**
 * OpenAI-powered fix generator for TypeScript errors
 */
export class OpenAIFixGenerator {
  private openai: OpenAI;
  private model = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
  private maxContextWindow = 16000; // tokens
  private confidenceThreshold = 0.7;
  private securityScanEnabled = true;
  
  constructor(apiKey?: string) {
    // Use the provided API key or the environment variable
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
    
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not provided. AI fix generation will not work.');
    } else {
      logger.info('OpenAI Fix Generator initialized');
    }
  }
  
  /**
   * Generate a fix for a TypeScript error using OpenAI
   */
  async generateFix(error: TypeScriptError, context?: FixGenerationContext): Promise<Fix> {
    try {
      // Validate API key is available
      if (!this.openai.apiKey) {
        throw new Error('OpenAI API key not available');
      }
      
      // Prepare context for fix generation
      const codeContext = await this.prepareCodeContext(error, context);
      
      // Generate a system prompt with guidelines
      const systemPrompt = this.createSystemPrompt();
      
      // Create a user prompt with error details and context
      const userPrompt = this.createUserPrompt(error, codeContext);
      
      // Generate fix using OpenAI
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Low temperature for more deterministic output
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });
      
      // Parse the response
      const fixSuggestion = JSON.parse(response.choices[0].message.content);
      
      // Calculate confidence based on model's response
      const confidence = this.calculateConfidence(fixSuggestion, error);
      
      // Transform the fix suggestion into our format
      const fix: Fix = {
        errorId: error.id,
        patternId: await this.findOrCreatePattern(error),
        description: fixSuggestion.description || `Fix for ${error.message}`,
        replacements: this.transformReplacements(fixSuggestion.changes, error.file),
        isAIGenerated: true,
        confidence,
        metadata: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          model: this.model,
          reasoning: fixSuggestion.reasoning,
          alternatives: fixSuggestion.alternatives
        }
      };
      
      // If confidence is high enough, store the fix
      if (confidence >= this.confidenceThreshold) {
        const fixId = await this.storeFix(fix);
        fix.id = fixId;
      }
      
      return fix;
    } catch (error) {
      logger.error(`AI fix generation error: ${error.message}`);
      throw new Error(`Failed to generate AI fix: ${error.message}`);
    }
  }
  
  /**
   * Create the system prompt for the OpenAI model
   */
  private createSystemPrompt(): string {
    return `You are an expert TypeScript developer specializing in fixing TypeScript errors. 
Your task is to analyze the provided TypeScript error and generate a fix that addresses the root cause.

Follow these guidelines:
1. Analyze the error message and code context thoroughly
2. Identify the root cause of the TypeScript error
3. Generate the smallest possible fix that properly addresses the issue
4. Do not add or change any functionality beyond what's necessary to fix the error
5. Ensure your fix follows TypeScript best practices
6. Maintain the code's existing style and naming conventions
7. Consider the broader implications of your changes to avoid introducing new errors
8. Provide clear reasoning for your approach

Return your response in the following JSON format:
{
  "description": "Brief description of the fix",
  "changes": [
    {
      "start": <start position in file>,
      "end": <end position in file>,
      "newText": "replacement text"
    }
  ],
  "reasoning": "Explanation of why this is the best fix",
  "confidence": <number between 0 and 1>,
  "alternatives": [
    {
      "description": "Alternative approach",
      "reason": "Why this might be considered"
    }
  ]
}`;
  }
  
  /**
   * Create the user prompt with error details and context
   */
  private createUserPrompt(error: TypeScriptError, context: CodeContext): string {
    return `## TypeScript Error
Code: ${error.code}
Message: ${error.message}
File: ${error.file}
Line: ${error.line}
Column: ${error.column}

## File Content Around Error
\`\`\`typescript
${context.surroundingCode}
\`\`\`

## Current Imports
\`\`\`typescript
${context.imports.join('\n')}
\`\`\`

## Project Dependencies
\`\`\`json
${JSON.stringify(context.dependencies, null, 2)}
\`\`\`

${context.similarFixes ? this.formatSimilarFixes(context.similarFixes) : ''}

Please analyze this TypeScript error and provide a fix in the JSON format described in your instructions.`;
  }
  
  /**
   * Format similar fixes for inclusion in the prompt
   */
  private formatSimilarFixes(fixes: PreviousFix[]): string {
    if (fixes.length === 0) return '';
    
    return `## Similar Fixes That Worked Before
${fixes.map((fix, index) => `
### Fix ${index + 1}
Error Code: ${fix.errorCode}
Error Message: ${fix.errorMessage}
Fix:
\`\`\`typescript
${fix.fixText}
\`\`\`
Confidence: ${fix.confidence}
Success Rate: ${fix.successRate}
`).join('\n')}`;
  }
  
  /**
   * Prepare the code context for the fix
   */
  private async prepareCodeContext(
    error: TypeScriptError, 
    context?: FixGenerationContext
  ): Promise<CodeContext> {
    try {
      // Read the file content
      const fileContent = await fs.readFile(error.file, 'utf-8');
      
      // Extract imports
      const imports = this.extractImports(fileContent);
      
      // Extract the code around the error location
      const surroundingCode = this.extractCodeAroundError(
        fileContent, 
        error.line, 
        error.column,
        10 // Context lines before and after
      );
      
      // Get package.json to extract dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const dependencies = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };
      
      // Find similar fixes that worked before
      const similarFixes = await this.findSimilarFixes(error);
      
      return {
        fileContent,
        surroundingCode,
        imports,
        dependencies,
        similarFixes
      };
    } catch (error) {
      logger.error(`Error preparing code context: ${error.message}`);
      return {
        fileContent: '',
        surroundingCode: '',
        imports: [],
        dependencies: {}
      };
    }
  }
  
  /**
   * Extract import statements from file content
   */
  private extractImports(fileContent: string): string[] {
    const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;
    return Array.from(fileContent.matchAll(importRegex), m => m[0]);
  }
  
  /**
   * Extract code from around the error location
   */
  private extractCodeAroundError(
    fileContent: string, 
    line: number, 
    column: number, 
    contextLines: number
  ): string {
    const lines = fileContent.split('\n');
    
    const startLine = Math.max(0, line - contextLines - 1);
    const endLine = Math.min(lines.length - 1, line + contextLines - 1);
    
    // Add line numbers and highlight the error line
    const codeLines = lines.slice(startLine, endLine + 1).map((text, idx) => {
      const lineNumber = startLine + idx + 1;
      if (lineNumber === line) {
        // Highlight the error position
        const beforeError = text.substring(0, column - 1);
        const afterError = text.substring(column - 1);
        return `${lineNumber}: ${beforeError}👉${afterError} // ERROR HERE`;
      }
      return `${lineNumber}: ${text}`;
    });
    
    return codeLines.join('\n');
  }
  
  /**
   * Find similar fixes that worked before
   */
  private async findSimilarFixes(error: TypeScriptError): Promise<PreviousFix[]> {
    try {
      // Find fixes with the same error code or similar error message
      const similarFixes = await db.select({
        id: errorFixes.id,
        error_id: errorFixes.error_id,
        fix_text: errorFixes.fix_text,
        description: errorFixes.description,
        confidence_score: errorFixes.confidence_score,
        success_rate: errorFixes.success_rate
      })
      .from(errorFixes)
      .innerJoin(
        errorPatterns,
        eq(errorFixes.pattern_id, errorPatterns.id)
      )
      .where(
        and(
          eq(errorPatterns.error_code, error.code),
          eq(errorFixes.is_ai_generated, true),
          // Only include fixes with good success rate
          // commented out as the field might not exist in all schemas
          // gte(errorFixes.success_rate, 0.7)
        )
      )
      .orderBy(desc(errorFixes.success_rate))
      .limit(3);
      
      // Get the error messages for each fix
      const result: PreviousFix[] = await Promise.all(
        similarFixes.map(async fix => {
          const errorDetails = await db.select({
            message: typeScriptErrors.message
          })
          .from(typeScriptErrors)
          .where(eq(typeScriptErrors.id, fix.error_id))
          .limit(1);
          
          return {
            errorCode: error.code,
            errorMessage: errorDetails[0]?.message || '',
            fixText: fix.fix_text || '',
            confidence: fix.confidence_score || 0,
            successRate: fix.success_rate || 0
          };
        })
      );
      
      return result;
    } catch (error) {
      logger.error(`Error finding similar fixes: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Calculate confidence score for the generated fix
   */
  private calculateConfidence(fixSuggestion: any, error: TypeScriptError): number {
    // Start with the model's own confidence if provided
    let confidence = fixSuggestion.confidence || 0.5;
    
    // Adjust based on various factors
    
    // 1. Complexity of the fix - simpler is usually better
    const changeCount = fixSuggestion.changes?.length || 0;
    if (changeCount > 3) {
      confidence -= 0.1; // Complex changes are riskier
    } else if (changeCount === 1) {
      confidence += 0.1; // Single changes are often safer
    }
    
    // 2. Length of new text - large blocks of new code are riskier
    const newTextLength = fixSuggestion.changes?.reduce(
      (sum: number, change: any) => sum + change.newText.length, 
      0
    ) || 0;
    
    if (newTextLength > 200) {
      confidence -= 0.1;
    } else if (newTextLength < 50) {
      confidence += 0.05;
    }
    
    // 3. Quality of reasoning - better explanation suggests better understanding
    if (fixSuggestion.reasoning) {
      const reasoningLength = fixSuggestion.reasoning.length;
      if (reasoningLength > 100) {
        confidence += 0.05;
      }
    } else {
      confidence -= 0.1; // No reasoning is a red flag
    }
    
    // 4. Error type adjustment - some errors are easier to fix reliably
    if (error.code === 'TS2322' || error.code === 'TS2345') {
      // Type assignment errors are often straightforward
      confidence += 0.05;
    } else if (error.code === 'TS2532' || error.code === 'TS2533') {
      // Null/undefined errors usually have clear solutions
      confidence += 0.05;
    } else if (error.code === 'TS2554') {
      // Function call parameter issues can be complex
      confidence -= 0.05;
    }
    
    // Ensure result is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Transform the fix suggestion into our SourceFileEdit format
   */
  private transformReplacements(
    changes: Array<{ start: number; end: number; newText: string }>,
    filePath: string
  ): SourceFileEdit[] {
    if (!changes || !Array.isArray(changes)) {
      return [];
    }
    
    return changes.map(change => ({
      filePath,
      start: change.start,
      end: change.end,
      newText: change.newText,
      description: 'AI-generated fix'
    }));
  }
  
  /**
   * Find an existing pattern or create a new one for this error
   */
  private async findOrCreatePattern(error: TypeScriptError): Promise<number> {
    try {
      // Check if a pattern exists for this error code
      const existingPatterns = await db.select({
        id: errorPatterns.id
      })
      .from(errorPatterns)
      .where(eq(errorPatterns.error_code, error.code))
      .limit(1);
      
      if (existingPatterns.length > 0) {
        return existingPatterns[0].id;
      }
      
      // Create a new pattern
      const [newPattern] = await db.insert(errorPatterns)
        .values({
          name: `${error.code} - ${this.shortenErrorMessage(error.message)}`,
          description: error.message,
          category: error.category,
          error_code: error.code,
          auto_fixable: true,
          created_at: new Date()
        })
        .returning({ id: errorPatterns.id });
      
      return newPattern.id;
    } catch (error) {
      logger.error(`Error finding/creating pattern: ${error.message}`);
      return 0; // Default to 0 when pattern creation fails
    }
  }
  
  /**
   * Store the generated fix in the database
   */
  private async storeFix(fix: Fix): Promise<number> {
    try {
      // Insert the fix
      const [newFix] = await db.insert(errorFixes)
        .values({
          error_id: fix.errorId,
          pattern_id: fix.patternId || null,
          fix_text: JSON.stringify(fix.replacements),
          description: fix.description,
          is_ai_generated: true,
          confidence_score: fix.confidence,
          success_rate: 0, // Initial success rate (updated after application)
          created_at: new Date()
        })
        .returning({ id: errorFixes.id });
      
      return newFix.id;
    } catch (error) {
      logger.error(`Error storing fix: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Create a shortened version of the error message for pattern names
   */
  private shortenErrorMessage(message: string): string {
    // Get first sentence or limit to 50 characters
    const firstSentence = message.split('.')[0];
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...' 
      : firstSentence;
  }
}