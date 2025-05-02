/**
 * Simple script to test the security performance metrics API
 */

const fetch = require('node-fetch');

// Define the API endpoint
const apiEndpoint = 'http://localhost:3000/api/security/performance-metrics';

// Function to test the API
async function testApi() {
  console.log(`Testing API endpoint: ${apiEndpoint}`);
  
  try {
    const response = await fetch(apiEndpoint);
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    // Print summary data
    console.log('\n=== Summary ===');
    console.log(`Total Cache Hit Rate: ${data.summary.totalCacheHitRate.toFixed(1)}%`);
    console.log(`Active Rules: ${data.summary.activeRules} of ${data.summary.totalRules}`);
    console.log(`Avg Rule Execution Time: ${data.summary.avgRuleExecutionTimeMs.toFixed(2)} ms`);
    console.log(`Avg Query Execution Time: ${data.summary.avgQueryExecutionTimeMs.toFixed(2)} ms`);
    console.log(`Total Storage Size: ${formatBytes(data.summary.totalStorageSizeBytes)}`);
    
    // Print cache metrics
    console.log('\n=== Cache Metrics ===');
    console.log(`Total cache entries: ${data.cacheMetrics.length}`);
    
    if (data.cacheMetrics.length > 0) {
      console.log('\nTop 3 cache entries by hit rate:');
      const topCacheEntries = [...data.cacheMetrics]
        .sort((a, b) => b.hitRate - a.hitRate)
        .slice(0, 3);
      
      topCacheEntries.forEach(entry => {
        console.log(`- ${entry.cacheKey}: ${entry.hitRate.toFixed(1)}% hit rate, ${entry.avgGetTimeMs.toFixed(2)} ms avg response time`);
      });
    }
    
    // Print rule metrics
    console.log('\n=== Rule Metrics ===');
    console.log(`Total rules: ${data.ruleMetrics.length}`);
    
    if (data.ruleMetrics.length > 0) {
      console.log('\nTop 3 rules by execution time:');
      const topRules = [...data.ruleMetrics]
        .sort((a, b) => b.avgExecutionTimeMs - a.avgExecutionTimeMs)
        .slice(0, 3);
      
      topRules.forEach(rule => {
        console.log(`- ${rule.ruleName} (${rule.ruleType}): ${rule.avgExecutionTimeMs.toFixed(2)} ms avg execution time, ${rule.matchRate.toFixed(1)}% match rate`);
      });
    }
    
    // Print query metrics
    console.log('\n=== Query Metrics ===');
    console.log(`Total queries: ${data.queryMetrics.length}`);
    
    if (data.queryMetrics.length > 0) {
      console.log('\nTop 3 queries by execution time:');
      const topQueries = [...data.queryMetrics]
        .sort((a, b) => b.avgExecutionTimeMs - a.avgExecutionTimeMs)
        .slice(0, 3);
      
      topQueries.forEach(query => {
        console.log(`- Query ${query.queryId}: ${query.avgExecutionTimeMs.toFixed(2)} ms avg execution time, ${query.executionCount} executions`);
        console.log(`  ${query.queryText.substring(0, 50)}${query.queryText.length > 50 ? '...' : ''}`);
      });
    }
    
    // Print storage metrics
    console.log('\n=== Storage Metrics ===');
    console.log(`Total tables: ${data.storageMetrics.length}`);
    
    if (data.storageMetrics.length > 0) {
      console.log('\nTop 3 tables by size:');
      const topTables = [...data.storageMetrics]
        .sort((a, b) => b.totalSizeBytes - a.totalSizeBytes)
        .slice(0, 3);
      
      topTables.forEach(table => {
        console.log(`- ${table.schema}.${table.table}: ${formatBytes(table.totalSizeBytes)}, ${table.rowCount.toLocaleString()} rows, ${table.dailyGrowthRate.toFixed(2)}% daily growth`);
      });
    }
    
    console.log('\nAPI test completed successfully!');
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the test
testApi();