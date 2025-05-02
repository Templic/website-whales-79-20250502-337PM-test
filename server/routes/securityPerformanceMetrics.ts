/**
 * Security Performance Metrics API
 * 
 * This module provides API endpoints for security performance monitoring.
 */

import { Router } from 'express';
import { ruleCache } from '../security/rules';
import { pool } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Get rule performance metrics
const getRuleMetrics = async () => {
  try {
    // Get cache statistics
    const cacheStats = ruleCache.getStats();
    
    // Get rule performance data from database
    const { rows: rulePerformance } = await pool.query(`
      SELECT 
        sr.id as rule_id,
        sr.name as rule_name,
        sr.type as rule_type,
        sr.status,
        sr.priority,
        COUNT(re.id) as total_evaluations,
        AVG(re.execution_time_ms) as avg_execution_time_ms,
        SUM(CASE WHEN re.result = true THEN 1 ELSE 0 END) as match_count,
        COALESCE(
          SUM(CASE WHEN re.result = true THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(re.id), 0),
          0
        ) as match_rate,
        MAX(re.evaluated_at) as last_evaluated
      FROM 
        security.security_rules sr
        LEFT JOIN security.rule_evaluations re ON sr.id = re.rule_id
      GROUP BY 
        sr.id, sr.name, sr.type, sr.status, sr.priority
      ORDER BY 
        sr.priority DESC;
    `);
    
    // Format rule metrics
    const ruleMetrics = rulePerformance.map(row => ({
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      ruleType: row.rule_type,
      totalEvaluations: parseInt(row.total_evaluations),
      avgExecutionTimeMs: parseFloat(row.avg_execution_time_ms) || 0,
      matchCount: parseInt(row.match_count) || 0,
      matchRate: parseFloat(row.match_rate) || 0,
      lastEvaluated: row.last_evaluated || new Date().toISOString(),
      status: row.status || 'active',
      priority: parseInt(row.priority) || 0
    }));
    
    // Format cache metrics
    const cacheMetrics = Object.entries(cacheStats.ruleStats).map(([cacheKey, stats]) => {
      const hitCount = stats.hits || 0;
      const missCount = cacheStats.misses.total || 0;
      const hitRate = missCount + hitCount > 0 ? (hitCount / (hitCount + missCount)) * 100 : 0;
      
      return {
        cacheKey,
        hitCount,
        missCount,
        hitRate,
        avgGetTimeMs: stats.averageEvalTimeMs || cacheStats.performance.averageGetTimeMs || 0,
        size: cacheStats.size.l1 + cacheStats.size.l2 || 0,
        lastUpdated: new Date().toISOString()
      };
    });
    
    return { ruleMetrics, cacheMetrics, cacheStats };
  } catch (error) {
    console.error('Error getting rule metrics:', error);
    throw error;
  }
};

// Get database query metrics
const getQueryMetrics = async () => {
  try {
    // Query for database performance metrics
    const { rows: queryPerformance } = await pool.query(`
      SELECT 
        queryid::text as query_id,
        left(query, 100) as query_text,
        calls as execution_count,
        round(mean_exec_time::numeric, 2) as avg_execution_time_ms,
        round(max_exec_time::numeric, 2) as max_execution_time_ms,
        rows as affected_rows,
        COALESCE(
          regexp_matches(query, 'FROM\\s+([a-zA-Z0-9_\\.]+)')[1], 
          'unknown'
        ) as main_table,
        CASE 
          WHEN query ILIKE '%security%' THEN 'security'
          WHEN query ILIKE '%users%' THEN 'user'
          ELSE 'other'
        END as query_category,
        now() as last_executed
      FROM 
        pg_stat_statements
      WHERE 
        query ILIKE '%security%' OR 
        query ILIKE '%rule%' OR
        query ILIKE '%cache%'
      ORDER BY 
        mean_exec_time DESC
      LIMIT 50;
    `).catch(() => ({ rows: [] }));
    
    // Format query metrics
    const queryMetrics = queryPerformance.map(row => {
      // Extract database name from the connection string
      const databaseMatch = process.env.DATABASE_URL?.match(/\/([^\/]+?)(\?|$)/);
      const database = databaseMatch ? databaseMatch[1] : 'unknown';
      
      // Extract table names from query
      const tablePattern = /(?:FROM|JOIN|UPDATE|INTO)\s+([a-zA-Z0-9_\.]+)/gi;
      const tables = [];
      let match;
      while ((match = tablePattern.exec(row.query_text)) !== null) {
        tables.push(match[1]);
      }
      
      return {
        queryId: row.query_id,
        queryText: row.query_text,
        executionCount: parseInt(row.execution_count) || 0,
        avgExecutionTimeMs: parseFloat(row.avg_execution_time_ms) || 0,
        maxExecutionTimeMs: parseFloat(row.max_execution_time_ms) || 0,
        lastExecuted: row.last_executed,
        database,
        tables: tables.length > 0 ? [...new Set(tables)] : ['unknown']
      };
    });
    
    return { queryMetrics };
  } catch (error) {
    console.error('Error getting query metrics:', error);
    return { queryMetrics: [] };
  }
};

// Get storage metrics
const getStorageMetrics = async () => {
  try {
    // Query for storage metrics
    const { rows: storageData } = await pool.query(`
      SELECT 
        t.table_schema as schema,
        t.table_name as table,
        COALESCE(s.n_live_tup, 0) as row_count,
        pg_total_relation_size(t.table_schema || '.' || t.table_name) as total_size_bytes,
        pg_indexes_size(t.table_schema || '.' || t.table_name) as index_size_bytes,
        COALESCE(s.last_vacuum, now()) as last_vacuumed,
        COALESCE(s.n_tup_ins - s.n_tup_del, 0) as net_row_changes,
        CASE
          WHEN s.n_live_tup > 0 THEN
            round(((s.n_tup_ins - s.n_tup_del)::float / GREATEST(s.n_live_tup, 1)) * 100, 2)
          ELSE 0
        END as daily_growth_rate
      FROM 
        information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON t.table_schema = s.schemaname AND t.table_name = s.relname
      WHERE 
        t.table_schema = 'security' OR
        t.table_name ILIKE '%security%' OR
        t.table_name ILIKE '%rule%'
      ORDER BY 
        total_size_bytes DESC;
    `).catch(() => ({ rows: [] }));
    
    // Format storage metrics
    const storageMetrics = storageData.map(row => ({
      table: row.table,
      rowCount: parseInt(row.row_count) || 0,
      totalSizeBytes: parseInt(row.total_size_bytes) || 0,
      indexSizeBytes: parseInt(row.index_size_bytes) || 0,
      schema: row.schema,
      lastVacuumed: row.last_vacuumed,
      dailyGrowthRate: parseFloat(row.daily_growth_rate) || 0
    }));
    
    return { storageMetrics };
  } catch (error) {
    console.error('Error getting storage metrics:', error);
    return { storageMetrics: [] };
  }
};

// Generate time series data
const generateTimeSeriesData = () => {
  // Helper to generate time series data points
  const generatePoints = (count: number, min: number, max: number, trend: 'up' | 'down' | 'stable' = 'stable') => {
    const points = [];
    let lastValue = Math.random() * (max - min) + min;
    const now = new Date();
    
    for (let i = count; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60000); // 5 minute intervals
      
      // Add some randomness with trend
      let change = (Math.random() - 0.5) * (max - min) * 0.05;
      if (trend === 'up') {
        change += Math.random() * 0.02 * (max - min);
      } else if (trend === 'down') {
        change -= Math.random() * 0.02 * (max - min);
      }
      
      lastValue = Math.max(min, Math.min(max, lastValue + change));
      
      points.push({
        timestamp: timestamp.toISOString(),
        value: lastValue
      });
    }
    
    return points;
  };
  
  // Generate sample time series data
  const timeSeriesMetrics = {
    cacheHitRates: {
      metricName: 'Cache Hit Rate',
      data: generatePoints(60, 60, 95, 'up')
    },
    ruleExecutionTimes: {
      metricName: 'Rule Execution Time',
      data: generatePoints(60, 0.5, 10, 'down')
    },
    queryExecutionTimes: {
      metricName: 'Query Execution Time',
      data: generatePoints(60, 1, 20, 'down')
    },
    totalSecurityEvents: {
      metricName: 'Security Events',
      data: generatePoints(60, 5, 50, 'stable')
    }
  };
  
  return { timeSeriesMetrics };
};

// API endpoint to get all performance metrics
router.get('/performance-metrics', async (req, res) => {
  try {
    // Get all metrics
    const [ruleData, queryData, storageData] = await Promise.all([
      getRuleMetrics(),
      getQueryMetrics(),
      getStorageMetrics()
    ]);
    
    const { timeSeriesMetrics } = generateTimeSeriesData();
    
    // Combine all metrics
    const { ruleMetrics, cacheMetrics, cacheStats } = ruleData;
    const { queryMetrics } = queryData;
    const { storageMetrics } = storageData;
    
    // Calculate summary metrics
    const totalCacheHitRate = cacheStats.hits.total / (cacheStats.hits.total + cacheStats.misses.total) * 100 || 0;
    const totalRules = ruleMetrics.length;
    const activeRules = ruleMetrics.filter(rule => rule.status === 'active').length;
    const avgRuleExecutionTimeMs = ruleMetrics.reduce((sum, rule) => sum + rule.avgExecutionTimeMs, 0) / totalRules || 0;
    const avgQueryExecutionTimeMs = queryMetrics.reduce((sum, query) => sum + query.avgExecutionTimeMs, 0) / queryMetrics.length || 0;
    const totalStorageSizeBytes = storageMetrics.reduce((sum, table) => sum + table.totalSizeBytes, 0);
    
    const summary = {
      totalCacheHitRate,
      totalRules,
      activeRules,
      avgRuleExecutionTimeMs,
      avgQueryExecutionTimeMs,
      totalStorageSizeBytes
    };
    
    // Send response
    res.json({
      cacheMetrics,
      ruleMetrics,
      queryMetrics,
      storageMetrics,
      timeSeriesMetrics,
      summary
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

export default router;