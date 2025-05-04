/**
 * Simple Security Analysis Test
 * 
 * A simplified version of the security analysis test with a longer timeout.
 */

import axios from 'axios';

// Very simple code snippet for testing
const testCode = `
function insecureLogin(username, password) {
  if(username === 'admin' && password === 'password123') {
    return true;
  }
  return false;
}
`;

// Get the auth token
async function getAuthToken() {
  try {
    const csrfResponse = await axios.get('http://localhost:5000/api/csrf-token');
    const csrfToken = csrfResponse.data.csrfToken;
    console.log(`Got CSRF token: ${csrfToken.substring(0, 10)}...`);
    
    return { 
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Test-Auth': 'test-security-analysis-secret-key'
    };
  } catch (error) {
    console.error('Error getting auth token:', error.message);
    throw error;
  }
}

// Test security analysis with simpler code
async function testSecurityAnalysis() {
  try {
    console.log('Testing security analysis with simple code...');
    
    // Get auth
    const headers = await getAuthToken();
    
    console.log('Sending request to security analysis endpoint...');
    console.log('This may take up to 30 seconds with the OpenAI API...');
    
    // Set a longer timeout for the request (30 seconds)
    const response = await axios.post(
      'http://localhost:5000/api/openai/security-analysis',
      {
        content: testCode,
        contentType: 'code',
        context: 'This is a simple login function.'
      },
      { 
        headers,
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('\nSecurity Analysis Results:');
    console.log('-------------------------');
    
    // Check if we have valid analysis data
    if (response.data && response.data.analysis) {
      const analysis = response.data.analysis;
      
      // Display summary
      console.log(`Summary: ${analysis.summary || 'No summary provided'}`);
      console.log('');
      
      // Display metrics if they exist
      if (analysis.metrics) {
        console.log('Metrics:');
        console.log(`- Critical Issues: ${analysis.metrics.criticalCount || 0}`);
        console.log(`- High Issues: ${analysis.metrics.highCount || 0}`);
        console.log(`- Medium Issues: ${analysis.metrics.mediumCount || 0}`);
        console.log(`- Low Issues: ${analysis.metrics.lowCount || 0}`);
        console.log(`- Info Issues: ${analysis.metrics.infoCount || 0}`);
        console.log(`- Total Issues: ${analysis.metrics.totalIssues || 0}`);
        console.log('');
      }
      
      // Display issues if they exist
      if (analysis.issues && analysis.issues.length > 0) {
        console.log(`Found ${analysis.issues.length} issues:`);
        analysis.issues.forEach((issue, i) => {
          console.log(`[${i+1}] ${issue.title} (${issue.severity})`);
          console.log(`    ${issue.description}`);
          console.log('');
        });
      } else {
        console.log('No issues found (or issues array is empty)');
      }
      
      // Display usage information
      console.log('\nAPI Usage:');
      console.log(`- Model: ${response.data.model || 'unknown'}`);
      if (response.data.usage) {
        console.log(`- Total Tokens: ${response.data.usage.total_tokens || 'N/A'}`);
      }
    } else {
      console.log('Error: Invalid or empty response');
      console.log(response.data);
    }
  } catch (error) {
    console.error('Error in security analysis test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testSecurityAnalysis();