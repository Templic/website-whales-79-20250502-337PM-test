/**
 * AI-Powered Security Analysis Service
 * 
 * This service provides integration with OpenAI's API to analyze security threats
 * in code, logs, network traffic, and configuration files.
 */

import OpenAI from 'openai';
import { log } from '../../../utils/logger';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// Do not change this unless explicitly requested by the user.
const DEFAULT_MODEL = 'gpt-4o';

/**
 * Type of content to analyze
 */
export type SecurityContentType = 'code' | 'logs' | 'network' | 'config' | 'api' | 'database';

/**
 * Security severity levels
 */
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Security issue details
 */
export interface SecurityIssue {
  id?: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  location?: string;
  codeSnippet?: string;
  potentialImpact?: string;
  remediation?: string;
  remediationCode?: string;
  references?: string[];
  cvss?: number;
  cwe?: string;
}

/**
 * Security analysis results
 */
export interface SecurityAnalysisResult {
  timestamp: string;
  summary: string;
  issues: SecurityIssue[];
  metrics: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    totalIssues: number;
    riskScore: number;
  };
  recommendations: string[];
  model: string;
  processingTimeMs: number;
}

/**
 * Security analysis options
 */
export interface SecurityAnalysisOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  detailedAnalysis?: boolean;
  includeReferences?: boolean;
  includeRemediationCode?: boolean;
  userId?: string | number;
}

/**
 * AI-powered security analysis service
 */
export class SecurityAnalysisService {
  private static instance: SecurityAnalysisService;

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityAnalysisService {
    if (!SecurityAnalysisService.instance) {
      SecurityAnalysisService.instance = new SecurityAnalysisService();
    }
    return SecurityAnalysisService.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    log('AI Security Analysis Service initialized', 'security');
  }

  /**
   * Analyze content for security threats
   * 
   * @param content Content to analyze
   * @param contentType Type of content
   * @param context Additional context about the environment
   * @param options Analysis options
   * @returns Analysis results
   */
  public async analyzeContent(
    content: string,
    contentType: SecurityContentType,
    context: string = '',
    options: SecurityAnalysisOptions = {}
  ): Promise<SecurityAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const {
        model = DEFAULT_MODEL,
        maxTokens = 1500,
        temperature = 0.2,
        detailedAnalysis = true,
        includeReferences = true,
        includeRemediationCode = true,
        userId
      } = options;

      // Construct a specialized system prompt for security analysis
      const systemPrompt = `You are an expert security analyst specializing in detecting vulnerabilities, weaknesses, and potential threats in ${contentType}. 
Focus on identifying security issues like:
- SQL injection vulnerabilities
- Cross-site scripting (XSS) opportunities
- Insecure direct object references
- Authentication weaknesses
- Authorization flaws
- Sensitive data exposure
- Missing security headers
- Cross-site request forgery vectors
- Insecure cryptographic storage
- Insufficient input validation
- Insecure configurations

${detailedAnalysis ? 'Provide a detailed, comprehensive analysis.' : 'Provide a concise, focused analysis.'}
${includeReferences ? 'Include references to security standards and best practices.' : ''}
${includeRemediationCode ? 'Include code examples for remediation when applicable.' : ''}

IMPORTANT: Analyze all security issues and return your findings as JSON data. 
You must respond with properly formatted JSON data.
The response must be in JSON format.

Return your analysis in the following JSON format:
{
  "summary": "Brief overview of all findings",
  "issues": [
    {
      "title": "Issue title",
      "description": "Detailed description of the issue",
      "severity": "critical|high|medium|low|info",
      "location": "Where in the content the issue was found",
      "codeSnippet": "Relevant code snippet if applicable",
      "potentialImpact": "Description of potential exploitation or impact",
      "remediation": "How to fix this issue",
      "remediationCode": "Example code showing the fix",
      "references": ["Relevant references to standards, articles, etc."],
      "cvss": "CVSS score if applicable",
      "cwe": "CWE identifier if applicable"
    }
  ],
  "metrics": {
    "criticalCount": 0,
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0,
    "infoCount": 0,
    "totalIssues": 0,
    "riskScore": 0
  },
  "recommendations": [
    "Overall recommendation 1",
    "Overall recommendation 2"
  ]
}`;

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze the following ${contentType} and return the results in JSON format:\n\n${content}\n\nAdditional context: ${context}` }
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: "json_object" }
      });

      const analysisText = response.choices[0].message.content;
      let analysis = JSON.parse(analysisText);

      // Process and enhance the analysis
      analysis = this.processAnalysisResults(analysis);

      // Log the analysis request (without the full content)
      log(`AI security analysis performed on ${contentType}${userId ? ` by user ${userId}` : ''}`, 'security');

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Return enhanced results
      return {
        ...analysis,
        timestamp: new Date().toISOString(),
        model: response.model,
        processingTimeMs: processingTime
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      log(`Error in AI security analysis: ${error.message}`, 'error');
      
      // Return an error result
      return {
        timestamp: new Date().toISOString(),
        summary: "Error performing security analysis",
        issues: [],
        metrics: {
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          totalIssues: 0,
          riskScore: 0
        },
        recommendations: ["Please try again with different content or check the API key."],
        model: DEFAULT_MODEL,
        processingTimeMs: processingTime
      };
    }
  }

  /**
   * Analyze a file for security threats
   * 
   * @param filePath Path to the file to analyze
   * @param contentType Type of content
   * @param context Additional context about the environment
   * @param options Analysis options
   * @returns Analysis results
   */
  public async analyzeFile(
    filePath: string,
    contentType?: SecurityContentType,
    context: string = '',
    options: SecurityAnalysisOptions = {}
  ): Promise<SecurityAnalysisResult> {
    try {
      // Determine content type from file extension if not provided
      if (!contentType) {
        contentType = this.detectContentTypeFromFile(filePath);
      }

      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Add file information to context
      const fileInfo = `Filename: ${path.basename(filePath)}
File path: ${filePath}
File size: ${content.length} bytes`;
      
      const enhancedContext = context ? `${context}\n\n${fileInfo}` : fileInfo;
      
      // Analyze content
      return this.analyzeContent(content, contentType, enhancedContext, options);
    } catch (error: any) {
      log(`Error analyzing file ${filePath}: ${error.message}`, 'error');
      
      // Return an error result
      return {
        timestamp: new Date().toISOString(),
        summary: `Error analyzing file ${filePath}: ${error.message}`,
        issues: [],
        metrics: {
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          totalIssues: 0,
          riskScore: 0
        },
        recommendations: ["Please check if the file exists and is readable."],
        model: DEFAULT_MODEL,
        processingTimeMs: 0
      };
    }
  }

  /**
   * Detect content type from file extension
   * 
   * @param filePath Path to the file
   * @returns Content type
   */
  private detectContentTypeFromFile(filePath: string): SecurityContentType {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
      case '.py':
      case '.php':
      case '.java':
      case '.c':
      case '.cpp':
      case '.cs':
      case '.go':
      case '.rb':
      case '.rust':
      case '.swift':
        return 'code';
        
      case '.log':
      case '.txt':
        return 'logs';
        
      case '.json':
      case '.yml':
      case '.yaml':
      case '.ini':
      case '.conf':
      case '.config':
      case '.env':
        return 'config';
        
      case '.sql':
        return 'database';
        
      case '.http':
      case '.har':
      case '.pcap':
        return 'network';
        
      default:
        // Default to code
        return 'code';
    }
  }

  /**
   * Process and enhance analysis results
   * 
   * @param analysis Raw analysis from OpenAI
   * @returns Enhanced analysis
   */
  private processAnalysisResults(analysis: any): SecurityAnalysisResult {
    try {
      // Generate metrics if not present
      if (!analysis.metrics) {
        analysis.metrics = {
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          totalIssues: 0,
          riskScore: 0
        };
      }

      // Calculate metrics based on issues
      if (analysis.issues && Array.isArray(analysis.issues)) {
        // Count issues by severity
        analysis.metrics.criticalCount = analysis.issues.filter((issue: SecurityIssue) => issue.severity === 'critical').length;
        analysis.metrics.highCount = analysis.issues.filter((issue: SecurityIssue) => issue.severity === 'high').length;
        analysis.metrics.mediumCount = analysis.issues.filter((issue: SecurityIssue) => issue.severity === 'medium').length;
        analysis.metrics.lowCount = analysis.issues.filter((issue: SecurityIssue) => issue.severity === 'low').length;
        analysis.metrics.infoCount = analysis.issues.filter((issue: SecurityIssue) => issue.severity === 'info').length;
        
        // Calculate total issues
        analysis.metrics.totalIssues = analysis.issues.length;
        
        // Calculate risk score (weighted based on severity)
        analysis.metrics.riskScore = 
          analysis.metrics.criticalCount * 10 +
          analysis.metrics.highCount * 5 +
          analysis.metrics.mediumCount * 2 +
          analysis.metrics.lowCount * 1;
          
        // Add unique IDs to issues if not present
        analysis.issues = analysis.issues.map((issue: SecurityIssue, index: number) => {
          if (!issue.id) {
            issue.id = `SEC-${Date.now()}-${index}`;
          }
          return issue;
        });
      }

      // Ensure recommendations array exists
      if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
        analysis.recommendations = [];
      }
      
      // Add default recommendation if none provided
      if (analysis.recommendations.length === 0) {
        analysis.recommendations.push("Review and address identified security issues according to their severity.");
      }

      return analysis;
    } catch (error) {
      log(`Error processing analysis results: ${error}`, 'error');
      return analysis; // Return original if processing fails
    }
  }
}

// Export singleton instance
export const securityAnalysisService = SecurityAnalysisService.getInstance();