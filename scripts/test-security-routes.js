/**
 * Test script for security performance routes
 * 
 * This script tests if the security performance routes are accessible
 * and returning the expected data.
 */

const http = require('http');

// Base URL for the API
const BASE_URL = 'http://localhost:3000/api/security';

// Endpoints to test
const ENDPOINTS = [
  '/performance-metrics',
  '/health',
  '/metrics?timeRange=24h&component=all'
];

/**
 * Make a GET request to a URL and return the response
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Test all endpoints
 */
async function testEndpoints() {
  console.log('Testing security performance routes...');
  console.log('======================================');
  
  for (const endpoint of ENDPOINTS) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`Testing ${url}...`);
    
    try {
      const response = await makeRequest(url);
      
      if (response.statusCode === 200) {
        console.log(`✅ Success: ${endpoint}`);
        
        // Print a summary of the response structure
        if (endpoint === '/performance-metrics') {
          const {summary, cacheMetrics, ruleMetrics, queryMetrics, storageMetrics, timeSeriesData} = response.data;
          console.log(`  - Summary data: ${summary ? 'present' : 'missing'}`);
          console.log(`  - Cache metrics: ${cacheMetrics ? `${cacheMetrics.length} entries` : 'missing'}`);
          console.log(`  - Rule metrics: ${ruleMetrics ? `${ruleMetrics.length} entries` : 'missing'}`);
          console.log(`  - Query metrics: ${queryMetrics ? `${queryMetrics.length} entries` : 'missing'}`);
          console.log(`  - Storage metrics: ${storageMetrics ? `${storageMetrics.length} entries` : 'missing'}`);
          console.log(`  - Time series data: ${timeSeriesData ? `${timeSeriesData.length} entries` : 'missing'}`);
        } else if (endpoint === '/health') {
          const {status, components} = response.data;
          console.log(`  - Status: ${status}`);
          console.log(`  - Components: ${Object.keys(components).join(', ')}`);
        }
      } else {
        console.log(`❌ Failed with status code ${response.statusCode}: ${endpoint}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${endpoint}: ${error.message}`);
    }
    
    console.log('--------------------------------------');
  }
  
  console.log('All tests completed.');
}

// Run the tests
testEndpoints().catch(error => {
  console.error('Error running tests:', error);
});