/**
 * ValidationAIConnector
 * 
 * This module connects the validation system to AI capabilities for enhanced security analysis.
 * It uses OpenAI's API to analyze requests, detect potential security threats, and provide
 * detailed validation responses.
 */

import secureLogger from '../../utils/secureLogger';
import { SecurityAnalysisService } from './SecurityAnalysisService';

// Create secure logger for AI validation
const logger = secureLogger.createLogger('validation-ai-connector', {
  component: 'security',
  subcomponent: 'ai',
  redactKeys: ['password', 'token', 'secret', 'apiKey', 'authorization', 'x-api-key', 'sessionid']
});

// Interface for validation results
interface AIValidationResult {
  valid: boolean;
  reason?: string;
  confidence?: number;
  threats?: {
    type: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    confidence: number;
    location?: string;
    mitigation?: string;
  }[];
  codeIssues?: {
    line?: number;
    column?: number;
    code?: string;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    fix?: string;
  }[];
  analysis?: string;
  debug?: any;
}

// Options for validation
interface ValidationOptions {
  contentType: 'code' | 'logs' | 'network' | 'config' | 'api' | 'database';
  threshold?: number;
  detailedAnalysis?: boolean;
  maxTokens?: number;
  requestContext?: {
    url?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * ValidationAIConnector connects the ValidationEngine to AI-powered analysis.
 */
export class ValidationAIConnector {
  private securityAnalysisService: SecurityAnalysisService;
  
  constructor() {
    this.securityAnalysisService = new SecurityAnalysisService();
    logger.log('ValidationAIConnector initialized', 'info');
  }
  
  /**
   * Validate data using AI-powered analysis
   */
  async validateData(data: any, options: ValidationOptions): Promise<AIValidationResult> {
    try {
      logger.log('Starting AI validation', 'info', { contentType: options.contentType });
      
      // Convert API data to format expected by security analysis
      const contextForAnalysis = {
        dataType: options.contentType,
        data: JSON.stringify(data),
        requestContext: options.requestContext || {},
        detailedAnalysis: options.detailedAnalysis || false
      };
      
      // Perform security analysis
      const securityAnalysis = await this.securityAnalysisService.analyzeData(contextForAnalysis);
      
      // Extract threats above threshold
      const threshold = options.threshold || 0.5;
      const significantThreats = (securityAnalysis.threats || []).filter(
        threat => threat.confidence >= threshold
      );
      
      // If no significant threats or analysis not possible, return valid
      if (!securityAnalysis.completed) {
        logger.log('Security analysis failed to complete', 'warning', { 
          error: securityAnalysis.error 
        });
        return { valid: true };
      }
      
      // If no threats found, return valid
      if (significantThreats.length === 0) {
        logger.log('No significant threats found in AI validation', 'info');
        return { valid: true };
      }
      
      // Create validation result with threat details
      const result: AIValidationResult = {
        valid: false,
        reason: "Security issues detected in request data",
        confidence: Math.max(...significantThreats.map(t => t.confidence)),
        threats: significantThreats.map(threat => ({
          type: threat.type,
          description: threat.description,
          severity: threat.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
          confidence: threat.confidence,
          location: threat.location,
          mitigation: threat.mitigation
        }))
      };
      
      // Add detailed analysis if requested
      if (options.detailedAnalysis) {
        result.analysis = securityAnalysis.analysis;
        
        // Add any code issues
        if (securityAnalysis.codeIssues && securityAnalysis.codeIssues.length > 0) {
          result.codeIssues = securityAnalysis.codeIssues.map(issue => ({
            line: issue.line,
            column: issue.column,
            code: issue.code,
            issue: issue.description,
            severity: issue.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
            fix: issue.fix
          }));
        }
      }
      
      // Log validation result
      const hasHighSeverity = significantThreats.some(
        t => t.severity === 'critical' || t.severity === 'high'
      );
      
      logger.log(
        `AI validation found ${significantThreats.length} significant threats`, 
        hasHighSeverity ? 'error' : 'warning', 
        { 
          threatCount: significantThreats.length,
          highSeverityCount: significantThreats.filter(
            t => t.severity === 'critical' || t.severity === 'high'
          ).length
        }
      );
      
      return result;
    } catch (error) {
      logger.log('Error in AI validation', 'error', { error });
      
      // On error, we don't want to block valid requests, so we return valid
      // and let the calling code decide how to handle service disruptions
      return { valid: true };
    }
  }
  
  /**
   * Get status of the AI validation service
   */
  async getStatus(): Promise<{ available: boolean; latency?: number; model?: string; }> {
    try {
      const start = Date.now();
      const statusResult = await this.securityAnalysisService.checkStatus();
      const latency = Date.now() - start;
      
      return {
        available: statusResult.available,
        latency,
        model: statusResult.model
      };
    } catch (error) {
      logger.log('Error checking AI validation status', 'error', { error });
      return { available: false };
    }
  }
}