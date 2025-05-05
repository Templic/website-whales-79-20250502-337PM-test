/**
 * TypeScript Error Metrics
 * 
 * This utility tracks and analyzes TypeScript error trends over time,
 * providing insights into error patterns, fix success rates, and overall
 * code quality improvements.
 */

import { db } from '../db';
import { eq, sql, desc, count, and, gte, lte, gt, lt, not, isNull } from 'drizzle-orm';
import { errorAnalysis, errorFixes, errorPatterns, scanSecurityAudits, typeScriptErrors, typeScriptErrorMetrics } from '../../shared/schema';

export interface ErrorTrend {
  date: string;
  totalErrors: number;
  fixedErrors: number;
  newErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  fixRate: number;
  avgResolutionTimeHours: number;
}

export interface PatternStats {
  id: number;
  name: string;
  category: string;
  frequency: number;
  autoFixable: boolean;
  fixSuccessRate: number;
  avgFixConfidence: number;
  mostCommonFixId?: number;
  securityIssues: number;
}

export interface UserFixStats {
  userId: string;
  username: string;
  totalFixes: number;
  successfulFixes: number;
  aiAssistedFixes: number;
  manualFixes: number;
  securityReviews: number;
  fixSuccessRate: number;
}

export interface SecurityStats {
  totalIssuesFound: number;
  issuesByRisk: Record<string, number>;
  topCategories: Array<{ category: string; count: number }>;
  resolvedIssues: number;
  pendingReviews: number;
  avgTimeToResolveHours: number;
}

export interface GlobalMetrics {
  totalErrorsDetected: number;
  totalErrorsFixed: number;
  totalErrorsIgnored: number;
  totalPendingReview: number;
  overallFixRate: number;
  avgResolutionTimeHours: number;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  topErrorPatterns: Array<{ id: number; name: string; count: number }>;
  fixSuccessRate: number;
  aiSuccessRate: number;
  totalScans: number;
  recentScans: number;
  lastScanDate?: Date;
  errorTrend: ErrorTrend[];
}

/**
 * Get error trends over time
 */
export async function getErrorTrends(
  timeframe: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time' = 'last_30_days',
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<ErrorTrend[]> {
  try {
    // Calculate the start date based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'last_7_days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last_30_days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last_90_days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all_time':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    // Get metrics from the database, grouped by the specified interval
    const intervalSql = interval === 'day' 
      ? sql`date_trunc('day', date)`
      : interval === 'week'
        ? sql`date_trunc('week', date)`
        : sql`date_trunc('month', date)`;
    
    const metrics = await db.select({
      date: intervalSql.as('date'),
      total_errors: sql`SUM(total_errors)`.as('total_errors'),
      fixed_errors: sql`SUM(fixed_errors)`.as('fixed_errors'),
      new_errors: sql`SUM(new_errors)`.as('new_errors'),
      errors_critical: sql`SUM(errors_by_severity->>'CRITICAL')::int`.as('errors_critical'),
      errors_high: sql`SUM(errors_by_severity->>'HIGH')::int`.as('errors_high'),
      errors_medium: sql`SUM(errors_by_severity->>'MEDIUM')::int`.as('errors_medium'),
      errors_low: sql`SUM(errors_by_severity->>'LOW')::int`.as('errors_low'),
      errors_info: sql`SUM(errors_by_severity->>'INFO')::int`.as('errors_info'),
      errors_type_mismatch: sql`SUM(errors_by_category->>'TYPE_MISMATCH')::int`.as('errors_type_mismatch'),
      errors_missing_type: sql`SUM(errors_by_category->>'MISSING_TYPE')::int`.as('errors_missing_type'),
      errors_invalid_import: sql`SUM(errors_by_category->>'INVALID_IMPORT')::int`.as('errors_invalid_import'),
      errors_syntax: sql`SUM(errors_by_category->>'SYNTAX_ERROR')::int`.as('errors_syntax'),
      errors_module: sql`SUM(errors_by_category->>'MODULE_ERROR')::int`.as('errors_module'),
      errors_dependency: sql`SUM(errors_by_category->>'DEPENDENCY_ERROR')::int`.as('errors_dependency'),
      errors_compiler: sql`SUM(errors_by_category->>'COMPILER_CONFIG')::int`.as('errors_compiler'),
      errors_library: sql`SUM(errors_by_category->>'LIBRARY_ERROR')::int`.as('errors_library'),
      errors_security: sql`SUM(errors_by_category->>'SECURITY_CONCERN')::int`.as('errors_security'),
      errors_other: sql`SUM(errors_by_category->>'OTHER')::int`.as('errors_other'),
      resolution_time: sql`AVG(avg_resolution_time_hours)`.as('resolution_time'),
    })
    .from(typeScriptErrorMetrics)
    .where(gte(typeScriptErrorMetrics.date, startDate))
    .groupBy(intervalSql)
    .orderBy(intervalSql);
    
    // Transform the data for the front-end
    return metrics.map(m => {
      const totalErrors = m.total_errors || 0;
      const fixedErrors = m.fixed_errors || 0;
      
      return {
        date: new Date(m.date).toISOString().split('T')[0],
        totalErrors,
        fixedErrors,
        newErrors: m.new_errors || 0,
        errorsBySeverity: {
          CRITICAL: m.errors_critical || 0,
          HIGH: m.errors_high || 0,
          MEDIUM: m.errors_medium || 0,
          LOW: m.errors_low || 0,
          INFO: m.errors_info || 0
        },
        errorsByCategory: {
          TYPE_MISMATCH: m.errors_type_mismatch || 0,
          MISSING_TYPE: m.errors_missing_type || 0,
          INVALID_IMPORT: m.errors_invalid_import || 0,
          SYNTAX_ERROR: m.errors_syntax || 0,
          MODULE_ERROR: m.errors_module || 0,
          DEPENDENCY_ERROR: m.errors_dependency || 0,
          COMPILER_CONFIG: m.errors_compiler || 0,
          LIBRARY_ERROR: m.errors_library || 0,
          SECURITY_CONCERN: m.errors_security || 0,
          OTHER: m.errors_other || 0
        },
        fixRate: totalErrors > 0 ? (fixedErrors / totalErrors) * 100 : 0,
        avgResolutionTimeHours: m.resolution_time || 0
      };
    });
  } catch (error) {
    console.error('Error getting error trends:', error);
    return [];
  }
}

/**
 * Get statistics for error patterns
 */
export async function getPatternStats(): Promise<PatternStats[]> {
  try {
    // For each pattern, get its frequency and fix statistics
    const patternStatsQuery = await db.select({
      id: errorPatterns.id,
      name: errorPatterns.name,
      category: errorPatterns.category,
      auto_fixable: errorPatterns.auto_fixable,
    })
    .from(errorPatterns)
    .orderBy(desc(errorPatterns.id));
    
    // For each pattern, get additional metrics
    const results = await Promise.all(patternStatsQuery.map(async pattern => {
      // Get count of errors for this pattern
      const [errorCount] = await db.select({
        count: count()
      })
      .from(typeScriptErrors)
      .where(eq(typeScriptErrors.pattern_id, pattern.id));
      
      // Get fixes for this pattern
      const fixes = await db.select({
        id: errorFixes.id,
        success_rate: errorFixes.success_rate,
        confidence: errorFixes.confidence,
        security_approved: errorFixes.security_approved
      })
      .from(errorFixes)
      .where(eq(errorFixes.pattern_id, pattern.id));
      
      // Calculate average confidence and success rate
      const avgConfidence = fixes.reduce((sum, fix) => sum + (fix.confidence || 0), 0) / (fixes.length || 1);
      const avgSuccessRate = fixes.reduce((sum, fix) => sum + (fix.success_rate || 0), 0) / (fixes.length || 1);
      
      // Get the most common fix ID
      let mostCommonFixId: number | undefined;
      if (fixes.length > 0) {
        mostCommonFixId = fixes.sort((a, b) => 
          (b.success_rate || 0) - (a.success_rate || 0)
        )[0].id;
      }
      
      // Count security issues
      const securityIssues = fixes.filter(fix => fix.security_approved === false).length;
      
      return {
        id: pattern.id,
        name: pattern.name,
        category: pattern.category,
        frequency: errorCount?.count || 0,
        autoFixable: pattern.auto_fixable || false,
        fixSuccessRate: avgSuccessRate,
        avgFixConfidence: avgConfidence,
        mostCommonFixId,
        securityIssues
      };
    }));
    
    // Sort by frequency
    return results.sort((a, b) => b.frequency - a.frequency);
  } catch (error) {
    console.error('Error getting pattern stats:', error);
    return [];
  }
}

/**
 * Get fix statistics by user
 */
export async function getUserFixStats(): Promise<UserFixStats[]> {
  try {
    // Get a list of all users who have fixed errors
    const userIds = await db.select({
      user_id: sql<string>`DISTINCT ${typeScriptErrors.user_id}`
    })
    .from(typeScriptErrors)
    .where(not(isNull(typeScriptErrors.user_id)));
    
    const userStats = await Promise.all(userIds.map(async ({ user_id }) => {
      // Skip null or undefined user IDs
      if (!user_id) return null;
      
      // Get all fixes by this user
      const fixes = await db.select({
        id: typeScriptErrors.id,
        status: typeScriptErrors.status,
        fix_id: typeScriptErrors.fix_id,
      })
      .from(typeScriptErrors)
      .where(eq(typeScriptErrors.user_id, user_id));
      
      // Count different types of fixes
      const totalFixes = fixes.length;
      const successfulFixes = fixes.filter(fix => fix.status === 'fixed').length;
      
      // Get AI vs manual fixes ratio (need to join with fixes table)
      const aiFixesResult = await db.select({
        count: count()
      })
      .from(typeScriptErrors)
      .leftJoin(errorFixes, eq(typeScriptErrors.fix_id, errorFixes.id))
      .where(
        and(
          eq(typeScriptErrors.user_id, user_id),
          eq(errorFixes.ai_generated, true)
        )
      );
      
      const aiAssistedFixes = aiFixesResult[0]?.count || 0;
      const manualFixes = totalFixes - aiAssistedFixes;
      
      // Get security reviews
      const securityReviewsResult = await db.select({
        count: count()
      })
      .from(scanSecurityAudits)
      .where(eq(scanSecurityAudits.reviewer_id, user_id));
      
      const securityReviews = securityReviewsResult[0]?.count || 0;
      
      // Get user info (mock for now until we have user table integration)
      const username = user_id.includes('@') 
        ? user_id.split('@')[0] 
        : user_id;
      
      return {
        userId: user_id,
        username,
        totalFixes,
        successfulFixes,
        aiAssistedFixes,
        manualFixes,
        securityReviews,
        fixSuccessRate: totalFixes > 0 ? (successfulFixes / totalFixes) * 100 : 0
      };
    }));
    
    // Filter out null results and sort by total fixes
    return userStats
      .filter(Boolean)
      .sort((a, b) => b.totalFixes - a.totalFixes);
  } catch (error) {
    console.error('Error getting user fix stats:', error);
    return [];
  }
}

/**
 * Get security-related statistics
 */
export async function getSecurityStats(): Promise<SecurityStats> {
  try {
    // Get total security issues found
    const [totalIssuesResult] = await db.select({
      count: count()
    })
    .from(scanSecurityAudits);
    
    // Get issues by risk level (using issue_severity instead of risk_level)
    const issuesByRiskResult = await db.select({
      risk_level: scanSecurityAudits.issue_severity,
      count: count()
    })
    .from(scanSecurityAudits)
    .groupBy(scanSecurityAudits.issue_severity);
    
    // Get top issue categories
    const topCategoriesResult = await db.select({
      category: scanSecurityAudits.category,
      count: count()
    })
    .from(scanSecurityAudits)
    .groupBy(scanSecurityAudits.category)
    .orderBy(desc(count()));
    
    // Get resolved vs pending
    const [resolvedResult] = await db.select({
      count: count()
    })
    .from(scanSecurityAudits)
    .where(eq(scanSecurityAudits.status, 'resolved'));
    
    const [pendingResult] = await db.select({
      count: count()
    })
    .from(scanSecurityAudits)
    .where(eq(scanSecurityAudits.status, 'pending_review'));
    
    // Get average time to resolve
    const [avgTimeResult] = await db.select({
      avg_time: sql<number>`AVG(EXTRACT(EPOCH FROM (${scanSecurityAudits.resolved_at} - ${scanSecurityAudits.created_at})) / 3600)`
    })
    .from(scanSecurityAudits)
    .where(
      and(
        not(isNull(scanSecurityAudits.resolved_at)),
        eq(scanSecurityAudits.status, 'resolved')
      )
    );
    
    // Build issues by risk map
    const issuesByRisk: Record<string, number> = {};
    issuesByRiskResult.forEach(item => {
      issuesByRisk[item.risk_level] = item.count;
    });
    
    return {
      totalIssuesFound: totalIssuesResult?.count || 0,
      issuesByRisk,
      topCategories: topCategoriesResult.map(item => ({
        category: item.category,
        count: item.count
      })),
      resolvedIssues: resolvedResult?.count || 0,
      pendingReviews: pendingResult?.count || 0,
      avgTimeToResolveHours: avgTimeResult?.avg_time || 0
    };
  } catch (error) {
    console.error('Error getting security stats:', error);
    return {
      totalIssuesFound: 0,
      issuesByRisk: {},
      topCategories: [],
      resolvedIssues: 0,
      pendingReviews: 0,
      avgTimeToResolveHours: 0
    };
  }
}

/**
 * Get global error metrics across the project
 */
export async function getGlobalMetrics(): Promise<GlobalMetrics> {
  try {
    // Get total errors detected
    const [totalErrorsResult] = await db.select({
      count: count()
    })
    .from(typeScriptErrors);
    
    // Get errors by status
    const errorsByStatusResult = await db.select({
      status: typeScriptErrors.status,
      count: count()
    })
    .from(typeScriptErrors)
    .groupBy(typeScriptErrors.status);
    
    // Get errors by severity
    const errorsBySeverityResult = await db.select({
      severity: typeScriptErrors.severity,
      count: count()
    })
    .from(typeScriptErrors)
    .groupBy(typeScriptErrors.severity);
    
    // Get errors by category
    const errorsByCategoryResult = await db.select({
      category: typeScriptErrors.category,
      count: count()
    })
    .from(typeScriptErrors)
    .groupBy(typeScriptErrors.category);
    
    // Get top error patterns
    const topPatternsResult = await db.select({
      pattern_id: typeScriptErrors.pattern_id,
      count: count()
    })
    .from(typeScriptErrors)
    .where(not(isNull(typeScriptErrors.pattern_id)))
    .groupBy(typeScriptErrors.pattern_id)
    .orderBy(desc(count()))
    .limit(10);
    
    // Get pattern names
    const patternIds = topPatternsResult.map(item => item.pattern_id);
    const patterns = await db.select({
      id: errorPatterns.id,
      name: errorPatterns.name
    })
    .from(errorPatterns)
    .where(sql`${errorPatterns.id} = ANY(${patternIds})`);
    
    // Get total scans
    const [totalScansResult] = await db.select({
      count: count()
    })
    .from(sql`typescript_scan_results`);
    
    // Get recent scans (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    
    const [recentScansResult] = await db.select({
      count: count()
    })
    .from(sql`typescript_scan_results`)
    .where(sql`start_time >= ${recentDate}`);
    
    // Get last scan date
    const [lastScanResult] = await db.select({
      max_date: sql<Date>`MAX(start_time)`
    })
    .from(sql`typescript_scan_results`);
    
    // Get fix success rate
    const [fixRateResult] = await db.select({
      avg_rate: sql<number>`AVG(success_rate)`
    })
    .from(errorFixes);
    
    // Get AI success rate
    const [aiRateResult] = await db.select({
      avg_rate: sql<number>`AVG(success_rate)`
    })
    .from(errorFixes)
    .where(eq(errorFixes.ai_generated, true));
    
    // Get average resolution time
    const [avgResolutionResult] = await db.select({
      avg_time: sql<number>`AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 3600)`
    })
    .from(typeScriptErrors)
    .where(
      and(
        not(isNull(typeScriptErrors.resolved_at)),
        eq(typeScriptErrors.status, 'fixed')
      )
    );
    
    // Get error trends for the last 30 days
    const errorTrend = await getErrorTrends('last_30_days', 'day');
    
    // Count errors by status
    const countByStatus = (status: string) => {
      const result = errorsByStatusResult.find(item => item.status === status);
      return result?.count || 0;
    };
    
    // Build severity and category maps
    const errorsBySeverity: Record<string, number> = {};
    errorsBySeverityResult.forEach(item => {
      errorsBySeverity[item.severity] = item.count;
    });
    
    const errorsByCategory: Record<string, number> = {};
    errorsByCategoryResult.forEach(item => {
      errorsByCategory[item.category] = item.count;
    });
    
    // Build top patterns with names
    const topPatterns = topPatternsResult.map(item => {
      const pattern = patterns.find(p => p.id === item.pattern_id);
      return {
        id: item.pattern_id,
        name: pattern?.name || `Pattern #${item.pattern_id}`,
        count: item.count
      };
    });
    
    return {
      totalErrorsDetected: totalErrorsResult?.count || 0,
      totalErrorsFixed: countByStatus('fixed'),
      totalErrorsIgnored: countByStatus('ignored'),
      totalPendingReview: countByStatus('pending') + countByStatus('security_review'),
      overallFixRate: totalErrorsResult?.count > 0 
        ? (countByStatus('fixed') / totalErrorsResult.count) * 100 
        : 0,
      avgResolutionTimeHours: avgResolutionResult?.avg_time || 0,
      errorsBySeverity,
      errorsByCategory,
      topErrorPatterns: topPatterns,
      fixSuccessRate: fixRateResult?.avg_rate || 0,
      aiSuccessRate: aiRateResult?.avg_rate || 0,
      totalScans: totalScansResult?.count || 0,
      recentScans: recentScansResult?.count || 0,
      lastScanDate: lastScanResult?.max_date,
      errorTrend
    };
  } catch (error) {
    console.error('Error getting global metrics:', error);
    return {
      totalErrorsDetected: 0,
      totalErrorsFixed: 0,
      totalErrorsIgnored: 0,
      totalPendingReview: 0,
      overallFixRate: 0,
      avgResolutionTimeHours: 0,
      errorsBySeverity: {},
      errorsByCategory: {},
      topErrorPatterns: [],
      fixSuccessRate: 0,
      aiSuccessRate: 0,
      totalScans: 0,
      recentScans: 0,
      errorTrend: []
    };
  }
}

/**
 * Record daily error metrics for trend analysis
 */
export async function recordDailyMetrics(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if we already have metrics for today
    const [existingMetric] = await db.select()
      .from(typeScriptErrorMetrics)
      .where(eq(typeScriptErrorMetrics.date, today));
    
    if (existingMetric) {
      console.log('Daily metrics already recorded for today');
      return;
    }
    
    // Get total errors
    const [totalErrorsResult] = await db.select({
      count: count()
    })
    .from(typeScriptErrors);
    
    // Get fixed errors
    const [fixedErrorsResult] = await db.select({
      count: count()
    })
    .from(typeScriptErrors)
    .where(eq(typeScriptErrors.status, 'fixed'));
    
    // Get new errors in the last 24 hours
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [newErrorsResult] = await db.select({
      count: count()
    })
    .from(typeScriptErrors)
    .where(gte(typeScriptErrors.detected_at, yesterday));
    
    // Get errors by severity
    const errorsBySeverityResult = await db.select({
      severity: typeScriptErrors.severity,
      count: count()
    })
    .from(typeScriptErrors)
    .groupBy(typeScriptErrors.severity);
    
    // Get errors by category
    const errorsByCategoryResult = await db.select({
      category: typeScriptErrors.category,
      count: count()
    })
    .from(typeScriptErrors)
    .groupBy(typeScriptErrors.category);
    
    // Get average resolution time
    const [avgResolutionResult] = await db.select({
      avg_time: sql<number>`AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 3600)`
    })
    .from(typeScriptErrors)
    .where(
      and(
        not(isNull(typeScriptErrors.resolved_at)),
        eq(typeScriptErrors.status, 'fixed'),
        gte(typeScriptErrors.resolved_at, yesterday)
      )
    );
    
    // Build severity and category JSON objects
    const errorsBySeverity: Record<string, number> = {};
    errorsBySeverityResult.forEach(item => {
      errorsBySeverity[item.severity] = item.count;
    });
    
    const errorsByCategory: Record<string, number> = {};
    errorsByCategoryResult.forEach(item => {
      errorsByCategory[item.category] = item.count;
    });
    
    // Calculate severity counts based on severity distribution
    const criticalErrors = errorsBySeverity['CRITICAL'] || 0;
    const highErrors = errorsBySeverity['HIGH'] || 0;
    const mediumErrors = errorsBySeverity['MEDIUM'] || 0;
    const lowErrors = errorsBySeverity['LOW'] || 0;
    
    // Find the most common category
    let mostCommonCategory = 'unknown';
    let maxCount = 0;
    Object.entries(errorsByCategory).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count as number;
        mostCommonCategory = category;
      }
    });
    
    // Calculate AI fix success rate (placeholder - would need actual AI fix data)
    const aiFixSuccessRate = 0;
    
    // Placeholder for most error-prone file (would need file distribution data)
    const mostErrorProneFile = 'unknown';
    
    // Insert the daily metrics matching the actual database structure
    await db.insert(typeScriptErrorMetrics)
      .values({
        date: today,
        total_errors: totalErrorsResult?.count || 0,
        fixed_errors: fixedErrorsResult?.count || 0,
        critical_errors: criticalErrors,
        high_errors: highErrors,
        medium_errors: mediumErrors,
        low_errors: lowErrors,
        average_fix_time: Math.round(avgResolutionResult?.avg_time || 0),
        ai_fix_success_rate: aiFixSuccessRate,
        most_common_category: mostCommonCategory,
        most_error_prone_file: mostErrorProneFile,
        security_impact_score: 0, // Placeholder
        metadata: {
          errorsByCategory,
          errorsBySeverity,
          fixRate: totalErrorsResult?.count > 0 
            ? (fixedErrorsResult?.count || 0) / totalErrorsResult.count * 100 
            : 0
        }
        // scan_id is omitted since it doesn't exist in the database
      });
    
    console.log('Recorded daily TypeScript error metrics');
  } catch (error) {
    console.error('Error recording daily metrics:', error);
  }
}