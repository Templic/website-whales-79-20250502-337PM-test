/**
 * Security Analysis Service
 * 
 * This module provides AI-powered security analysis for API requests,
 * using OpenAI's GPT-4o model to detect potential security threats.
 */

import OpenAI from 'openai';
import secureLogger from '../../utils/secureLogger';
import { ValidationErrorCategory, ValidationErrorSeverity } from '../error/ValidationErrorCategory';
import { validationAlertSystem, AlertType } from '../notification/ValidationAlertSystem';
import { securityConfig } from '../config/SecurityConfig';
import { Request } from 'express';

// Configure component name for logging
const logComponent = 'SecurityAnalysisService';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Security analysis result interface
export interface SecurityAnalysisResult {
  safe: boolean;
  riskScore: number; // 0-100
  potentialThreats: PotentialThreat[];
  processingTimeMs: number;
  contextHash: string;
  confidence: number; // 0-1
}

// Potential threat interface
export interface PotentialThreat {
  type: string;
  description: string;
  severity: ValidationErrorSeverity;
  confidence: number; // 0-1
  relatedPattern?: string;
  suggestedAction?: string;
  category: ValidationErrorCategory;
}

// Security analysis options
export interface SecurityAnalysisOptions {
  sensitivityLevel?: 'low' | 'medium' | 'high';
  timeoutMs?: number;
  includeContext?: boolean;
  detectionModes?: ('injection' | 'xss' | 'authentication' | 'authorization' | 'data_exposure' | 'general')[];
  customInstructions?: string;
  maxTokens?: number;
}

// Default security analysis options
const defaultOptions: SecurityAnalysisOptions = {
  sensitivityLevel: 'medium',
  timeoutMs: 5000,
  includeContext: true,
  detectionModes: ['injection', 'xss', 'authentication', 'authorization', 'general'],
  maxTokens: 1000
};

/**
 * Security analysis service
 */
export class SecurityAnalysisService {
  private options: SecurityAnalysisOptions;
  private analysisCache: Map<string, {
    result: SecurityAnalysisResult;
    timestamp: number;
  }> = new Map();
  private cacheTTLMs: number = 5 * 60 * 1000; // 5 minutes
  
  constructor(options?: Partial<SecurityAnalysisOptions>) {
    this.options = { ...defaultOptions, ...options };
    
    secureLogger('info', logComponent, 'Security analysis service initialized', {
      metadata: {
        options: this.options
      }
    });
  }
  
  /**
   * Analyze request for security threats
   */
  public async analyzeRequest(
    req: Request,
    options?: Partial<SecurityAnalysisOptions>
  ): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Create context hash for caching
      const contextHash = this.createContextHash(req);
      
      // Check cache if available
      const cachedResult = this.analysisCache.get(contextHash);
      if (cachedResult && (Date.now() - cachedResult.timestamp) < this.cacheTTLMs) {
        secureLogger('info', logComponent, 'Using cached security analysis result', {
          metadata: {
            contextHash,
            cachedAt: new Date(cachedResult.timestamp).toISOString()
          }
        });
        
        return {
          ...cachedResult.result,
          processingTimeMs: Date.now() - startTime
        };
      }
      
      // Prepare request data for analysis
      const requestData = this.extractRequestData(req, mergedOptions.includeContext);
      
      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(requestData, mergedOptions);
      
      // Call OpenAI API with timeout
      const result = await Promise.race([
        this.callOpenAI(analysisPrompt, mergedOptions),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Security analysis timed out after ${mergedOptions.timeoutMs}ms`)), 
            mergedOptions.timeoutMs);
        })
      ]) as SecurityAnalysisResult;
      
      // Complete result
      result.processingTimeMs = Date.now() - startTime;
      result.contextHash = contextHash;
      
      // Cache the result
      this.analysisCache.set(contextHash, {
        result,
        timestamp: Date.now()
      });
      
      // Send alerts for high-risk threats
      this.sendThreatAlerts(result, req);
      
      secureLogger('info', logComponent, `Security analysis completed in ${result.processingTimeMs}ms`, {
        metadata: {
          safe: result.safe,
          riskScore: result.riskScore,
          threatCount: result.potentialThreats.length,
          requestMethod: req.method,
          requestPath: req.path
        }
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      secureLogger('error', logComponent, `Security analysis error: ${errorMessage}`, {
        metadata: {
          requestMethod: req.method,
          requestPath: req.path,
          error: errorMessage,
          processingTimeMs: Date.now() - startTime
        }
      });
      
      // Return safe fallback result on error
      return {
        safe: true, // Assume safe on error to avoid blocking legitimate requests
        riskScore: 0,
        potentialThreats: [],
        processingTimeMs: Date.now() - startTime,
        contextHash: this.createContextHash(req),
        confidence: 0
      };
    }
  }
  
  /**
   * Analyze raw data for security threats
   */
  public async analyzeData(
    data: any,
    context?: {
      path?: string;
      method?: string;
      userId?: string | number;
      metadata?: Record<string, any>;
    },
    options?: Partial<SecurityAnalysisOptions>
  ): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Create context hash for caching
      const contextHash = this.createDataContextHash(data, context);
      
      // Check cache if available
      const cachedResult = this.analysisCache.get(contextHash);
      if (cachedResult && (Date.now() - cachedResult.timestamp) < this.cacheTTLMs) {
        secureLogger('info', logComponent, 'Using cached security analysis result', {
          metadata: {
            contextHash,
            cachedAt: new Date(cachedResult.timestamp).toISOString()
          }
        });
        
        return {
          ...cachedResult.result,
          processingTimeMs: Date.now() - startTime
        };
      }
      
      // Prepare data for analysis
      const analysisData = {
        data,
        context: mergedOptions.includeContext ? context : undefined
      };
      
      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(analysisData, mergedOptions);
      
      // Call OpenAI API with timeout
      const result = await Promise.race([
        this.callOpenAI(analysisPrompt, mergedOptions),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Security analysis timed out after ${mergedOptions.timeoutMs}ms`)), 
            mergedOptions.timeoutMs);
        })
      ]) as SecurityAnalysisResult;
      
      // Complete result
      result.processingTimeMs = Date.now() - startTime;
      result.contextHash = contextHash;
      
      // Cache the result
      this.analysisCache.set(contextHash, {
        result,
        timestamp: Date.now()
      });
      
      secureLogger('info', logComponent, `Security analysis completed in ${result.processingTimeMs}ms`, {
        metadata: {
          safe: result.safe,
          riskScore: result.riskScore,
          threatCount: result.potentialThreats.length,
          context
        }
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      secureLogger('error', logComponent, `Security analysis error: ${errorMessage}`, {
        metadata: {
          context,
          error: errorMessage,
          processingTimeMs: Date.now() - startTime
        }
      });
      
      // Return safe fallback result on error
      return {
        safe: true, // Assume safe on error to avoid blocking legitimate requests
        riskScore: 0,
        potentialThreats: [],
        processingTimeMs: Date.now() - startTime,
        contextHash: this.createDataContextHash(data, context),
        confidence: 0
      };
    }
  }
  
  /**
   * Extract relevant data from request
   */
  private extractRequestData(req: Request, includeContext: boolean = true): any {
    const data: any = {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params
    };
    
    if (includeContext) {
      data.context = {
        headers: {
          ...req.headers,
          // Remove sensitive headers
          authorization: req.headers.authorization ? '[REDACTED]' : undefined,
          cookie: req.headers.cookie ? '[REDACTED]' : undefined
        },
        ip: req.ip,
        userId: (req as any).user?.id,
        timestamp: new Date().toISOString()
      };
    }
    
    return data;
  }
  
  /**
   * Create a hash from request context for caching
   */
  private createContextHash(req: Request): string {
    const hashComponents = [
      req.method,
      req.path,
      JSON.stringify(req.body || {}),
      JSON.stringify(req.query || {}),
      JSON.stringify(req.params || {})
    ];
    
    return Buffer.from(hashComponents.join('|')).toString('base64');
  }
  
  /**
   * Create a hash from data and context for caching
   */
  private createDataContextHash(data: any, context?: any): string {
    const hashComponents = [
      JSON.stringify(data || {}),
      JSON.stringify(context || {})
    ];
    
    return Buffer.from(hashComponents.join('|')).toString('base64');
  }
  
  /**
   * Create analysis prompt based on options
   */
  private createAnalysisPrompt(data: any, options: SecurityAnalysisOptions): string {
    const sensitivityLevelDescription = {
      low: 'Focus only on critical security threats with high confidence.',
      medium: 'Balance between security sensitivity and avoiding false positives.',
      high: 'Prioritize security with higher sensitivity that might increase false positives.'
    }[options.sensitivityLevel || 'medium'];
    
    const detectionModesText = options.detectionModes?.map(mode => {
      switch (mode) {
        case 'injection': return 'SQL/NoSQL/Command injection attacks';
        case 'xss': return 'Cross-site scripting (XSS) attacks';
        case 'authentication': return 'Authentication bypass attempts';
        case 'authorization': return 'Authorization/permission issues';
        case 'data_exposure': return 'Sensitive data exposure';
        case 'general': return 'General security issues';
        default: return mode;
      }
    }).join(', ');
    
    return `
You are an advanced security analysis system. Analyze the following request/data for security threats.
${sensitivityLevelDescription}

Detection focus: ${detectionModesText}

${options.customInstructions || ''}

The response MUST be a valid JSON object with the following structure:
{
  "safe": boolean,
  "riskScore": number, // 0-100, higher means more risky
  "potentialThreats": [
    {
      "type": string, // e.g., "SQL Injection", "XSS", etc.
      "description": string, // Detailed description of the threat
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": number, // 0-1, how confident the system is about this threat
      "relatedPattern": string, // Optional pattern or part of input related to the threat
      "suggestedAction": string, // Suggested mitigation
      "category": string // Must be one of the ValidationErrorCategory enum values
    }
  ],
  "confidence": number // 0-1, overall confidence in the analysis
}

DATA TO ANALYZE:
${JSON.stringify(data, null, 2)}
`;
  }
  
  /**
   * Call OpenAI API for security analysis
   */
  private async callOpenAI(prompt: string, options: SecurityAnalysisOptions): Promise<SecurityAnalysisResult> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an API security analysis expert. Analyze input for security threats and respond with JSON only." },
          { role: "user", content: prompt }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: 0.2, // Low temperature for more deterministic security analysis
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }
      
      try {
        const result = JSON.parse(content) as SecurityAnalysisResult;
        
        // Ensure potentialThreats is an array
        if (!Array.isArray(result.potentialThreats)) {
          result.potentialThreats = [];
        }
        
        // Map threat categories to ValidationErrorCategory
        result.potentialThreats = result.potentialThreats.map(threat => {
          // Set default category if not provided
          if (!threat.category) {
            switch (threat.type.toLowerCase()) {
              case 'sql injection':
              case 'command injection':
              case 'nosql injection':
                threat.category = ValidationErrorCategory.SECURITY_INJECTION;
                break;
              case 'xss':
              case 'cross-site scripting':
                threat.category = ValidationErrorCategory.SECURITY_XSS;
                break;
              case 'csrf':
              case 'cross-site request forgery':
                threat.category = ValidationErrorCategory.SECURITY_CSRF;
                break;
              case 'authentication bypass':
              case 'weak authentication':
                threat.category = ValidationErrorCategory.SECURITY_AUTH;
                break;
              case 'authorization bypass':
              case 'privilege escalation':
                threat.category = ValidationErrorCategory.SECURITY_ACCESS;
                break;
              default:
                threat.category = ValidationErrorCategory.AI_THREAT_DETECTED;
            }
          }
          
          return threat;
        });
        
        return result;
      } catch (parseError) {
        secureLogger('error', logComponent, 'Failed to parse OpenAI response as JSON', {
          metadata: {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            response: content
          }
        });
        
        throw new Error('Invalid JSON response from OpenAI API');
      }
    } catch (error) {
      secureLogger('error', logComponent, 'OpenAI API call error', {
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Send alerts for detected threats
   */
  private sendThreatAlerts(result: SecurityAnalysisResult, req: Request): void {
    // Only send alerts for high-risk threats
    const criticalThreats = result.potentialThreats.filter(threat => 
      threat.severity === ValidationErrorSeverity.CRITICAL || 
      (threat.severity === ValidationErrorSeverity.HIGH && threat.confidence > 0.8)
    );
    
    if (criticalThreats.length === 0) {
      return;
    }
    
    validationAlertSystem.sendAlert(
      AlertType.SECURITY_THREAT,
      `Security threats detected in ${req.method} ${req.path}`,
      {
        requestPath: req.path,
        requestMethod: req.method,
        riskScore: result.riskScore,
        threats: criticalThreats.map(t => ({
          type: t.type,
          severity: t.severity,
          confidence: t.confidence,
          description: t.description
        }))
      },
      ValidationErrorCategory.AI_THREAT_DETECTED,
      ValidationErrorSeverity.CRITICAL
    );
  }
  
  /**
   * Update service options
   */
  public updateOptions(options: Partial<SecurityAnalysisOptions>): void {
    this.options = { ...this.options, ...options };
    
    secureLogger('info', logComponent, 'Security analysis service options updated', {
      metadata: {
        options: this.options
      }
    });
  }
  
  /**
   * Set cache TTL (time to live) in milliseconds
   */
  public setCacheTTL(ttlMs: number): void {
    this.cacheTTLMs = ttlMs;
    
    secureLogger('info', logComponent, `Security analysis cache TTL set to ${ttlMs}ms`);
  }
  
  /**
   * Clear analysis cache
   */
  public clearCache(): void {
    const cacheSize = this.analysisCache.size;
    this.analysisCache.clear();
    
    secureLogger('info', logComponent, `Security analysis cache cleared (${cacheSize} entries)`);
  }
}

// Export singleton instance
export const securityAnalysisService = new SecurityAnalysisService({
  sensitivityLevel: securityConfig.getValueAsString('securityAnalysisSensitivity', 'medium') as 'low' | 'medium' | 'high',
  includeContext: securityConfig.isFeatureEnabled('includeContextInAnalysis')
});