/**
 * SecurityAnalysisService
 * 
 * This service uses OpenAI's GPT-4o model to perform advanced security
 * analysis on API requests, detecting potential threats and vulnerabilities.
 */

import OpenAI from "openai";
import { securityConfig } from '../config/SecurityConfig';
import secureLog from '../../utils/secureLogger';

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SecurityAnalysisOptions {
  contentType: 'api' | 'user-content' | 'code' | 'database-query';
  detailedAnalysis?: boolean;
  includeRecommendations?: boolean;
  includeContext?: boolean;
  maxResponseTime?: number; // ms
}

export interface SecurityAnalysisResult {
  securityScore: number; // 0 to 1, where 1 is completely safe
  pass: boolean;
  analysisId: string;
  timestamp: string;
  detectedThreats: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
  }>;
  recommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>;
  metadata?: {
    model: string;
    processingTime: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

/**
 * SecurityAnalysisService class
 */
export class SecurityAnalysisService {
  private isEnabled: boolean;
  private defaultModel: string;
  private fallbackEnabled: boolean;
  
  constructor() {
    // Get configuration from security config
    this.isEnabled = securityConfig.getSecurityFeatures().aiSecurityAnalysis;
    this.defaultModel = "gpt-4o"; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.fallbackEnabled = securityConfig.getSecurityFeatures().fallbackValidation;
    
    // Check if API key is configured
    if (this.isEnabled && !process.env.OPENAI_API_KEY) {
      console.warn('[SecurityAnalysis] OpenAI API key not found. AI security analysis will be disabled.');
      this.isEnabled = false;
    }
  }
  
  /**
   * Analyze content for security threats
   */
  public async analyzeContent(
    content: any,
    options: SecurityAnalysisOptions
  ): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();
    
    try {
      // Check if AI security analysis is enabled
      if (!this.isEnabled) {
        return this.generateFallbackResult(analysisId, content, options);
      }
      
      // Prepare content for analysis
      const preparedContent = this.prepareContentForAnalysis(content, options);
      
      // Create system prompt based on content type
      const systemPrompt = this.createSystemPrompt(options);
      
      // Perform analysis using OpenAI
      const response = await openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: preparedContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for more consistent responses
        max_tokens: options.detailedAnalysis ? 800 : 400,
      });
      
      // Parse the response
      const analysisText = response.choices[0].message.content;
      const analysis = JSON.parse(analysisText);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Check if we exceeded max response time
      if (options.maxResponseTime && processingTime > options.maxResponseTime) {
        secureLog('warning', 'SecurityAnalysisService', `Analysis exceeded max response time: ${processingTime}ms`);
      }
      
      // Create and return the result
      const result: SecurityAnalysisResult = {
        securityScore: analysis.securityScore,
        pass: analysis.securityScore >= 0.7, // Configurable threshold
        analysisId,
        timestamp: new Date().toISOString(),
        detectedThreats: analysis.detectedThreats || [],
        recommendations: options.includeRecommendations ? analysis.recommendations : undefined,
        metadata: {
          model: this.defaultModel,
          processingTime,
          tokens: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0
          }
        }
      };
      
      // Log the analysis result
      secureLog('info', 'SecurityAnalysisService', `Completed analysis ${analysisId}: score=${result.securityScore}, pass=${result.pass}`);
      
      return result;
    } catch (error) {
      // Log the error
      secureLog('error', 'SecurityAnalysisService', `Analysis failed: ${error.message}`);
      
      // Return fallback result if enabled
      if (this.fallbackEnabled) {
        return this.generateFallbackResult(analysisId, content, options);
      }
      
      // Otherwise, throw the error
      throw error;
    }
  }
  
  /**
   * Generate a fallback result when AI analysis is disabled or fails
   */
  private generateFallbackResult(
    analysisId: string,
    content: any,
    options: SecurityAnalysisOptions
  ): SecurityAnalysisResult {
    // Simple heuristic checks based on content type
    let securityScore = 0.8; // Default score is reasonably high
    const detectedThreats = [];
    
    // For API content, check for common malicious patterns
    if (options.contentType === 'api') {
      const stringContent = JSON.stringify(content).toLowerCase();
      
      // Check for SQL injection attempts
      if (
        stringContent.includes('select ') ||
        stringContent.includes('insert ') ||
        stringContent.includes('update ') ||
        stringContent.includes('delete ') ||
        stringContent.includes('drop ') ||
        stringContent.includes('alter ') ||
        stringContent.includes('union ') ||
        stringContent.includes(';') ||
        stringContent.includes('--')
      ) {
        securityScore -= 0.3;
        detectedThreats.push({
          type: 'sql_injection',
          severity: 'high',
          confidence: 0.7,
          description: 'Potential SQL injection attempt detected'
        });
      }
      
      // Check for XSS attempts
      if (
        stringContent.includes('<script') ||
        stringContent.includes('javascript:') ||
        stringContent.includes('onerror=') ||
        stringContent.includes('onload=')
      ) {
        securityScore -= 0.3;
        detectedThreats.push({
          type: 'xss',
          severity: 'high',
          confidence: 0.7,
          description: 'Potential XSS attack attempt detected'
        });
      }
      
      // Check for command injection
      if (
        stringContent.includes('&&') ||
        stringContent.includes('||') ||
        stringContent.includes(';') ||
        stringContent.includes('`') ||
        stringContent.includes('$(')
      ) {
        securityScore -= 0.2;
        detectedThreats.push({
          type: 'command_injection',
          severity: 'high',
          confidence: 0.6,
          description: 'Potential command injection attempt detected'
        });
      }
    }
    
    // For database queries, perform basic analysis
    if (options.contentType === 'database-query') {
      // Simple check for unsafe query patterns
      const query = typeof content === 'string' ? content.toLowerCase() : '';
      
      if (query.includes('drop ') || query.includes('truncate ')) {
        securityScore -= 0.5;
        detectedThreats.push({
          type: 'destructive_query',
          severity: 'critical',
          confidence: 0.8,
          description: 'Potentially destructive database operation detected'
        });
      }
    }
    
    // Ensure score stays in valid range
    securityScore = Math.max(0, Math.min(1, securityScore));
    
    // Generate the fallback result
    return {
      securityScore,
      pass: securityScore >= 0.7,
      analysisId,
      timestamp: new Date().toISOString(),
      detectedThreats,
      metadata: {
        model: 'fallback-heuristic',
        processingTime: 0,
        tokens: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      }
    };
  }
  
  /**
   * Generate a unique analysis ID
   */
  private generateAnalysisId(): string {
    return `sa_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Prepare content for analysis
   */
  private prepareContentForAnalysis(content: any, options: SecurityAnalysisOptions): string {
    // For API content, stringify the request body
    if (options.contentType === 'api') {
      if (typeof content === 'object') {
        return `API Request Body for Security Analysis:\n${JSON.stringify(content, null, 2)}`;
      }
      return `API Request Content for Security Analysis:\n${content}`;
    }
    
    // For user content, pass as is
    if (options.contentType === 'user-content') {
      return `User Content for Security Analysis:\n${content}`;
    }
    
    // For code, pass as is
    if (options.contentType === 'code') {
      return `Code for Security Analysis:\n${content}`;
    }
    
    // For database queries, pass as is
    if (options.contentType === 'database-query') {
      return `Database Query for Security Analysis:\n${content}`;
    }
    
    // Default fallback
    return `Content for Security Analysis:\n${JSON.stringify(content, null, 2)}`;
  }
  
  /**
   * Create an appropriate system prompt based on content type
   */
  private createSystemPrompt(options: SecurityAnalysisOptions): string {
    const basePrompt = `You are an expert security analyzer specializing in ${options.contentType} security. 
Analyze the provided content for security vulnerabilities, malicious code, or attacks.
Your task is to:
1. Identify any security threats or vulnerabilities
2. Rate the overall security risk on a scale from 0 (dangerous) to 1 (completely safe)
3. Provide a detailed analysis of potential problems${options.includeRecommendations ? '\n4. Suggest specific mitigations or fixes for the identified issues' : ''}

Respond with JSON in this format:
{
  "securityScore": number, // 0 to 1, higher is safer
  "detectedThreats": [
    {
      "type": string, // category of threat
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": number, // 0 to 1, your confidence in this detection
      "description": string // concise explanation
    }
  ]${options.includeRecommendations ? `,
  "recommendations": [
    {
      "action": string, // what should be done
      "priority": "low" | "medium" | "high",
      "description": string // concise explanation
    }
  ]` : ''}
}`;

    // Add content-specific instructions
    if (options.contentType === 'api') {
      return `${basePrompt}

When analyzing API requests, specifically look for:
- SQL injection attempts
- Cross-site scripting (XSS) payloads
- Command injection
- Path traversal
- Deserialization vulnerabilities
- Parameter tampering
- Data exfiltration attempts
- Rate limiting or DoS attempts`;
    }
    
    if (options.contentType === 'database-query') {
      return `${basePrompt}

When analyzing database queries, specifically look for:
- SQL injection vulnerabilities
- Destructive operations (DROP, TRUNCATE, etc.)
- Privilege escalation attempts
- Mass data access or exfiltration
- Malformed queries that could crash the database
- Performance issues that could lead to DoS`;
    }
    
    // Generic prompt for other content types
    return basePrompt;
  }
}

// Export a singleton instance
export const securityAnalysisService = new SecurityAnalysisService();