/**
 * Security Analysis Service
 * 
 * This service provides AI-powered security analysis of various data types including:
 * - API requests and responses
 * - Code for security vulnerabilities
 * - Configuration files for security misconfigurations
 * - Network traffic patterns for anomalies
 * - Database queries for injection vulnerabilities
 * 
 * It uses OpenAI's GPT-4o model to analyze inputs and identify security threats.
 */

import secureLogger from '../../utils/secureLogger';
import OpenAI from 'openai';

// Create secure logger
const logger = secureLogger.createLogger('security-analysis-service', {
  component: 'security',
  subcomponent: 'ai-analysis',
  redactKeys: ['password', 'token', 'secret', 'apiKey', 'authorization', 'x-api-key', 'sessionid']
});

// Service configuration
interface ServiceConfig {
  model: string;
  maxTokens: number;
  temperatureDefault: number;
  debugMode: boolean;
}

// Analysis context
interface AnalysisContext {
  dataType: 'code' | 'api' | 'config' | 'network' | 'database' | 'logs';
  data: string;
  requestContext?: {
    url?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  };
  detailedAnalysis?: boolean;
}

// Threat object
interface Threat {
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  location?: string;
  mitigation?: string;
}

// Code issue object
interface CodeIssue {
  line?: number;
  column?: number;
  code?: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cwe?: string;
  fix?: string;
}

// Analysis result
interface AnalysisResult {
  completed: boolean;
  error?: string;
  threats: Threat[];
  codeIssues?: CodeIssue[];
  analysis?: string;
  timeTakenMs?: number;
  riskScore?: number;
  model?: string;
}

/**
 * Security Analysis Service for AI-powered threat detection
 */
export class SecurityAnalysisService {
  private openai: OpenAI;
  private config: ServiceConfig;

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Default configuration (can be overridden)
    this.config = {
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      maxTokens: 2048,
      temperatureDefault: 0.1,
      debugMode: process.env.NODE_ENV !== 'production'
    };

    logger.log('SecurityAnalysisService initialized', 'info');
  }

  /**
   * Analyze data for security threats
   */
  async analyzeData(context: AnalysisContext): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      logger.log(`Starting security analysis of ${context.dataType} data`, 'info');

      // Create an appropriate system prompt based on data type
      const systemPrompt = this.createSystemPrompt(context.dataType, context.detailedAnalysis);

      // Build the messages array
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            `Please analyze the following ${context.dataType} data for security vulnerabilities:`,
            `\`\`\`${context.dataType}`,
            context.data,
            '```',
            context.requestContext ? `Additional context: ${JSON.stringify(context.requestContext)}` : ''
          ].join('\n')
        }
      ];

      // Call OpenAI for analysis
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperatureDefault,
        response_format: { type: 'json_object' }
      });

      // Parse the AI response
      let analysisOutput;
      try {
        const responseText = response.choices[0].message.content || '{}';
        analysisOutput = JSON.parse(responseText);
      } catch (parseError) {
        logger.log('Error parsing AI response', 'error', { error: parseError });
        return {
          completed: false,
          error: 'Failed to parse AI response',
          threats: []
        };
      }

      // Build the result
      const threats: Threat[] = analysisOutput.threats?.map((threat: any) => ({
        type: threat.type || 'Unknown',
        description: threat.description || 'No description provided',
        severity: threat.severity || 'medium',
        confidence: typeof threat.confidence === 'number' ? threat.confidence : 0.5,
        location: threat.location,
        mitigation: threat.mitigation
      })) || [];

      const codeIssues: CodeIssue[] = analysisOutput.code_issues?.map((issue: any) => ({
        line: issue.line,
        column: issue.column,
        code: issue.code,
        description: issue.description || 'No description provided',
        severity: issue.severity || 'medium',
        cwe: issue.cwe,
        fix: issue.fix
      })) || [];

      const result: AnalysisResult = {
        completed: true,
        threats,
        codeIssues,
        analysis: analysisOutput.analysis,
        timeTakenMs: Date.now() - startTime,
        riskScore: analysisOutput.risk_score,
        model: response.model
      };

      // Log results
      const securityLevel = threats.some(t => t.severity === 'critical') ? 'critical' :
        threats.some(t => t.severity === 'high') ? 'error' :
          threats.some(t => t.severity === 'medium') ? 'warning' : 'info';

      logger.log(
        `Security analysis completed with ${threats.length} threats identified`,
        securityLevel as any,
        {
          threatCount: threats.length,
          highSeverityCount: threats.filter(t => 
            t.severity === 'critical' || t.severity === 'high'
          ).length,
          timeTakenMs: result.timeTakenMs
        }
      );

      return result;
    } catch (error) {
      logger.log('Error during security analysis', 'error', { error });
      return {
        completed: false,
        error: error instanceof Error ? error.message : 'Unknown error during analysis',
        threats: []
      };
    }
  }

  /**
   * Check the status of the security analysis service
   */
  async checkStatus(): Promise<{ available: boolean; model?: string }> {
    try {
      // Send a minimal request to OpenAI to check API status
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: 'Please respond with just the text "OK".' },
          { role: 'user', content: 'Status check' }
        ],
        max_tokens: 10
      });

      return {
        available: true,
        model: response.model
      };
    } catch (error) {
      logger.log('Security analysis service status check failed', 'error', { error });
      return { available: false };
    }
  }

  /**
   * Create an appropriate system prompt based on data type
   */
  private createSystemPrompt(dataType: string, detailed = false): string {
    const basePrompt = `You are an expert security analyst with deep knowledge of cybersecurity, secure coding practices, and threat detection.
Your task is to analyze the provided ${dataType} for security vulnerabilities, weaknesses, and potential threats.
Focus on identifying concrete security issues rather than general best practices.

Provide your analysis in JSON format with the following structure:
{
  "threats": [
    {
      "type": "string", // e.g., "SQL Injection", "XSS", "CSRF", etc.
      "description": "string", // Detailed description of the threat
      "severity": "critical" | "high" | "medium" | "low" | "info", // Severity rating
      "confidence": number, // Confidence score from 0 to 1
      "location": "string", // Where the issue was found (if applicable)
      "mitigation": "string" // Recommended fix or mitigation
    }
  ],
  "risk_score": number, // Overall risk score from 0 to 10
  "analysis": "string" // Brief summary of your overall analysis
}`;

    // For detailed analysis, add code_issues to the JSON structure
    const detailedAddition = detailed ? `
For code analysis, also include code_issues:
"code_issues": [
  {
    "line": number, // Line number where the issue was found
    "column": number, // Column number (if applicable)
    "code": "string", // The specific code with the issue
    "description": "string", // Description of the issue
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "cwe": "string", // Common Weakness Enumeration ID if applicable
    "fix": "string" // Suggested fix for the issue
  }
]` : '';

    // Additional instructions based on data type
    let specificInstructions = '';
    
    switch(dataType) {
      case 'code':
        specificInstructions = `
For code analysis, look for:
- Insecure coding patterns
- Input validation issues
- Authentication/authorization flaws
- Hardcoded credentials or secrets
- Memory safety issues
- Race conditions
- Business logic flaws with security implications`;
        break;
        
      case 'api':
        specificInstructions = `
For API analysis, look for:
- Missing or improper authentication
- Parameter manipulation vulnerabilities
- Injection vulnerabilities
- Data exposure risks
- Insecure direct object references
- Rate limiting issues
- CSRF vulnerabilities`;
        break;
        
      case 'config':
        specificInstructions = `
For configuration analysis, look for:
- Insecure default settings
- Overly permissive access controls
- Missing security headers
- Exposed credentials or secrets
- Unnecessary services or features enabled
- Outdated components or versions
- Logging or monitoring gaps`;
        break;
        
      case 'network':
        specificInstructions = `
For network data analysis, look for:
- Unusual traffic patterns
- Potential data exfiltration
- Command and control communication
- Suspicious authentication attempts
- Protocol vulnerabilities
- Unencrypted sensitive data
- Signs of lateral movement`;
        break;
        
      case 'database':
        specificInstructions = `
For database analysis, look for:
- SQL injection vulnerabilities
- Excessive privileges
- Unencrypted sensitive data
- Missing access controls
- Insecure database configuration
- Improper error handling
- Race conditions`;
        break;
        
      case 'logs':
        specificInstructions = `
For log analysis, look for:
- Signs of intrusion or unauthorized access
- Suspicious authentication patterns
- Error messages that expose sensitive information
- Unusual behavior from users or systems
- Failed security controls
- Potential privilege escalation
- Indicators of compromise`;
        break;
    }

    return `${basePrompt}${detailedAddition}${specificInstructions}

Your response should be valid JSON only, with no additional text before or after the JSON object.`;
  }
}