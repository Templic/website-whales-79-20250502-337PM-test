/**
 * Resolution Metrics Service
 * 
 * A comprehensive metrics collection system for tracking TypeScript error resolutions.
 * This service helps measure the effectiveness of different fix strategies,
 * provides insights for improvement, and enables data-driven decision making.
 * 
 * Features:
 * - Transparent: All metrics are clearly documented and accessible
 * - Privacy-focused: No sensitive code snippets are stored
 * - Educational: Metrics help improve fix strategies over time
 * - Automated: Metrics collection happens automatically during fix application
 */

import { db } from '../db';
import { 
  typeScriptErrors, 
  errorFixes, 
  errorPatterns, 
  fixApplicationLogs,
  fixFeedback
} from '@shared/schema';
import { ValidationResult } from './ts-error-resolver';
import { logger } from '../logger';
import { eq, and, not, isNull, sql, desc, count } from 'drizzle-orm';

/**
 * Fix application record
 */
export interface FixApplicationRecord {
  errorId: number;
  fixId?: number;
  strategyName: string;
  success: boolean;
  validationResult?: ValidationResult;
  timeMs: number;
  feedback?: {
    rating: number;
    comment?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Fix success rate by strategy
 */
export interface StrategySuccessRate {
  strategyName: string;
  successRate: number;
  totalApplications: number;
  averageTimeMs: number;
}

/**
 * Fix success rate by error type
 */
export interface ErrorTypeSuccessRate {
  errorCode: string;
  category: string;
  successRate: number;
  totalErrors: number;
  fixCount: number;
}

/**
 * Fix trend data
 */
export interface FixTrend {
  date: string;
  totalFixes: number;
  successfulFixes: number;
  aiGeneratedFixes: number;
  averageConfidence: number;
  averageSuccessRate: number;
}

/**
 * Service that collects and analyzes metrics about TypeScript error resolution
 */
export class ResolutionMetricsService {
  /**
   * Record a fix application (successful or not)
   */
  async recordFixApplication(record: FixApplicationRecord): Promise<void> {
    try {
      // Insert into fix application logs
      await db.insert(fixApplicationLogs)
        .values({
          error_id: record.errorId,
          fix_id: record.fixId || null,
          strategy_name: record.strategyName,
          success: record.success,
          validation_result: record.validationResult 
            ? JSON.stringify(record.validationResult) 
            : null,
          application_time_ms: record.timeMs,
          metadata: record.metadata ? JSON.stringify(record.metadata) : null,
          created_at: new Date()
        });
      
      // Update fix success rate if applicable
      if (record.fixId) {
        await this.updateFixSuccessRate(record.fixId, record.success);
      }
      
      // Update strategy success metrics
      await this.updateStrategyMetrics(record.strategyName, record.success, record.timeMs);
      
      logger.info(`Recorded fix application for error ${record.errorId}, fix ${record.fixId || 'N/A'}`);
    } catch (error) {
      logger.error(`Error recording fix application: ${error.message}`);
    }
  }
  
  /**
   * Record user feedback about a fix
   */
  async recordFixFeedback(
    fixId: number, 
    userId: string, 
    rating: number, 
    comment?: string
  ): Promise<void> {
    try {
      // Insert feedback
      await db.insert(fixFeedback)
        .values({
          fix_id: fixId,
          user_id: userId,
          rating,
          comment: comment || null,
          created_at: new Date()
        });
      
      logger.info(`Recorded feedback for fix ${fixId} from user ${userId}: ${rating}/5`);
      
      // Update fix confidence based on feedback
      await this.updateFixConfidenceFromFeedback(fixId);
    } catch (error) {
      logger.error(`Error recording fix feedback: ${error.message}`);
    }
  }
  
  /**
   * Get success rates for different fix strategies
   */
  async getStrategySuccessRates(): Promise<StrategySuccessRate[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          strategy_name,
          COUNT(*) as total_applications,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
          AVG(application_time_ms) as average_time_ms
        FROM fix_application_logs
        GROUP BY strategy_name
        ORDER BY success_rate DESC
      `);
      
      return result.rows.map(row => ({
        strategyName: row.strategy_name,
        successRate: Number(row.success_rate) || 0,
        totalApplications: Number(row.total_applications) || 0,
        averageTimeMs: Number(row.average_time_ms) || 0
      }));
    } catch (error) {
      logger.error(`Error getting strategy success rates: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get success rates for different error types
   */
  async getErrorTypeSuccessRates(): Promise<ErrorTypeSuccessRate[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          ep.error_code,
          ep.category,
          COUNT(DISTINCT tse.id) as total_errors,
          COUNT(DISTINCT CASE WHEN tse.status = 'fixed' THEN tse.id ELSE NULL END) as fix_count,
          COUNT(DISTINCT CASE WHEN tse.status = 'fixed' THEN tse.id ELSE NULL END)::float / 
            NULLIF(COUNT(DISTINCT tse.id), 0) as success_rate
        FROM typescript_errors tse
        JOIN error_patterns ep ON tse.pattern_id = ep.id
        GROUP BY ep.error_code, ep.category
        ORDER BY success_rate DESC
      `);
      
      return result.rows.map(row => ({
        errorCode: row.error_code,
        category: row.category,
        successRate: Number(row.success_rate) || 0,
        totalErrors: Number(row.total_errors) || 0,
        fixCount: Number(row.fix_count) || 0
      }));
    } catch (error) {
      logger.error(`Error getting error type success rates: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get fix trends over time
   */
  async getFixTrends(
    timeRange: 'last_week' | 'last_month' | 'last_year' = 'last_month'
  ): Promise<FixTrend[]> {
    try {
      // Determine the date range
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeRange === 'last_week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === 'last_month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }
      
      // Query for fix trend data
      const result = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_fixes,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_fixes,
          SUM(CASE WHEN ef.is_ai_generated = true THEN 1 ELSE 0 END) as ai_generated_fixes,
          AVG(ef.confidence_score) as average_confidence,
          AVG(ef.success_rate) as average_success_rate
        FROM fix_application_logs fal
        LEFT JOIN error_fixes ef ON fal.fix_id = ef.id
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      
      return result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        totalFixes: Number(row.total_fixes) || 0,
        successfulFixes: Number(row.successful_fixes) || 0,
        aiGeneratedFixes: Number(row.ai_generated_fixes) || 0,
        averageConfidence: Number(row.average_confidence) || 0,
        averageSuccessRate: Number(row.average_success_rate) || 0
      }));
    } catch (error) {
      logger.error(`Error getting fix trends: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Find similar error patterns that have been successfully fixed
   */
  async findSimilarSuccessfulFixes(
    errorCode: string, 
    errorMessage: string,
    limit: number = 5
  ): Promise<Array<{
    fixId: number;
    errorId: number;
    replacements: any;
    confidence: number;
    successRate: number;
  }>> {
    try {
      // Find patterns with the same error code
      const patterns = await db.select({
        id: errorPatterns.id
      })
      .from(errorPatterns)
      .where(eq(errorPatterns.error_code, errorCode))
      .limit(10);
      
      const patternIds = patterns.map(p => p.id);
      
      if (patternIds.length === 0) {
        return [];
      }
      
      // Find successful fixes for these patterns
      const fixes = await db.select({
        id: errorFixes.id,
        error_id: errorFixes.error_id,
        fix_text: errorFixes.fix_text,
        confidence_score: errorFixes.confidence_score,
        success_rate: errorFixes.success_rate
      })
      .from(errorFixes)
      .where(
        and(
          sql`${errorFixes.pattern_id} = ANY(${patternIds})`,
          // Only include fixes with good success rate
          sql`${errorFixes.success_rate} >= 0.7`
        )
      )
      .orderBy(desc(errorFixes.success_rate))
      .limit(limit);
      
      return fixes.map(fix => ({
        fixId: fix.id,
        errorId: fix.error_id,
        replacements: fix.fix_text ? JSON.parse(fix.fix_text) : [],
        confidence: fix.confidence_score || 0,
        successRate: fix.success_rate || 0
      }));
    } catch (error) {
      logger.error(`Error finding similar fixes: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get the success rate for a specific error code
   */
  async getErrorCodeSuccessRate(errorCode: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT 
          SUM(CASE WHEN tse.status = 'fixed' THEN 1 ELSE 0 END)::float / 
            NULLIF(COUNT(*), 0) as success_rate
        FROM typescript_errors tse
        JOIN error_patterns ep ON tse.pattern_id = ep.id
        WHERE ep.error_code = ${errorCode}
      `);
      
      return Number(result.rows[0]?.success_rate) || 0;
    } catch (error) {
      logger.error(`Error getting error code success rate: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Get metrics for AI-generated fixes
   */
  async getAIFixMetrics(): Promise<{
    totalFixes: number;
    successRate: number;
    averageConfidence: number;
    averageUserRating: number;
    fixesByModel: Record<string, number>;
  }> {
    try {
      // Get overall metrics
      const overallResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_fixes,
          SUM(CASE WHEN tse.status = 'fixed' THEN 1 ELSE 0 END)::float / 
            NULLIF(COUNT(*), 0) as success_rate,
          AVG(ef.confidence_score) as average_confidence
        FROM error_fixes ef
        JOIN typescript_errors tse ON ef.error_id = tse.id
        WHERE ef.is_ai_generated = true
      `);
      
      // Get average user ratings
      const ratingResult = await db.execute(sql`
        SELECT AVG(ff.rating) as average_rating
        FROM fix_feedback ff
        JOIN error_fixes ef ON ff.fix_id = ef.id
        WHERE ef.is_ai_generated = true
      `);
      
      // Get fixes by model
      const modelResult = await db.execute(sql`
        SELECT 
          COALESCE(metadata->>'model', 'unknown') as model,
          COUNT(*) as count
        FROM error_fixes
        WHERE is_ai_generated = true
        GROUP BY COALESCE(metadata->>'model', 'unknown')
      `);
      
      const fixesByModel: Record<string, number> = {};
      for (const row of modelResult.rows) {
        fixesByModel[row.model] = Number(row.count) || 0;
      }
      
      return {
        totalFixes: Number(overallResult.rows[0]?.total_fixes) || 0,
        successRate: Number(overallResult.rows[0]?.success_rate) || 0,
        averageConfidence: Number(overallResult.rows[0]?.average_confidence) || 0,
        averageUserRating: Number(ratingResult.rows[0]?.average_rating) || 0,
        fixesByModel
      };
    } catch (error) {
      logger.error(`Error getting AI fix metrics: ${error.message}`);
      return {
        totalFixes: 0,
        successRate: 0,
        averageConfidence: 0,
        averageUserRating: 0,
        fixesByModel: {}
      };
    }
  }
  
  /**
   * Update the success rate for a fix
   */
  private async updateFixSuccessRate(fixId: number, success: boolean): Promise<void> {
    try {
      // Get current success rate and application count
      const [currentFix] = await db.select({
        success_rate: errorFixes.success_rate,
        application_count: errorFixes.application_count
      })
      .from(errorFixes)
      .where(eq(errorFixes.id, fixId));
      
      if (!currentFix) {
        return;
      }
      
      // Calculate new success rate
      const applicationCount = (currentFix.application_count || 0) + 1;
      const successfulApplications = (currentFix.success_rate || 0) * (currentFix.application_count || 0) + (success ? 1 : 0);
      const newSuccessRate = successfulApplications / applicationCount;
      
      // Update the fix
      await db.update(errorFixes)
        .set({
          success_rate: newSuccessRate,
          application_count: applicationCount,
          updated_at: new Date()
        })
        .where(eq(errorFixes.id, fixId));
    } catch (error) {
      logger.error(`Error updating fix success rate: ${error.message}`);
    }
  }
  
  /**
   * Update strategy success metrics
   */
  private async updateStrategyMetrics(
    strategyName: string, 
    success: boolean, 
    timeMs: number
  ): Promise<void> {
    // In a full implementation, this would update a separate strategy metrics table
    // For now, we just log the information
    logger.info(`Strategy ${strategyName} ${success ? 'succeeded' : 'failed'} in ${timeMs}ms`);
  }
  
  /**
   * Update fix confidence based on user feedback
   */
  private async updateFixConfidenceFromFeedback(fixId: number): Promise<void> {
    try {
      // Get average rating for this fix
      const [avgRating] = await db.select({
        avg_rating: sql<number>`AVG(rating)`
      })
      .from(fixFeedback)
      .where(eq(fixFeedback.fix_id, fixId));
      
      if (!avgRating || !avgRating.avg_rating) {
        return;
      }
      
      // Scale rating (1-5) to confidence (0-1)
      const ratingBasedConfidence = avgRating.avg_rating / 5;
      
      // Get current confidence
      const [currentFix] = await db.select({
        confidence_score: errorFixes.confidence_score
      })
      .from(errorFixes)
      .where(eq(errorFixes.id, fixId));
      
      if (!currentFix) {
        return;
      }
      
      // Blend current confidence with user feedback (70% algorithm, 30% user feedback)
      const newConfidence = currentFix.confidence_score * 0.7 + ratingBasedConfidence * 0.3;
      
      // Update the fix
      await db.update(errorFixes)
        .set({
          confidence_score: newConfidence,
          updated_at: new Date()
        })
        .where(eq(errorFixes.id, fixId));
    } catch (error) {
      logger.error(`Error updating fix confidence from feedback: ${error.message}`);
    }
  }
}