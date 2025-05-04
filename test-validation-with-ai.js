/**
 * Test Script for API Validation with AI Security Analysis
 * 
 * This script demonstrates how to use the enhanced ValidationEngine
 * with AI-powered security analysis capabilities for API validation.
 * 
 * Usage: node test-validation-with-ai.js
 */

import axios from 'axios';

// Sample secure code (example of an API handler)
const secureCode = `
// Example of a secure Express route handler
app.post('/api/user', (req, res) => {
  const { username, email, age } = req.body;
  
  // Input validation
  if (!username || typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  
  if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (age !== undefined && (typeof age !== 'number' || age < 18 || age > 120)) {
    return res.status(400).json({ error: 'Invalid age' });
  }
  
  // Sanitize input (example with DOMPurify if needed)
  const sanitizedUsername = DOMPurify.sanitize(username);
  
  // Create user with parameterized query (prevents SQL injection)
  db.query('INSERT INTO users (username, email, age) VALUES (?, ?, ?)', 
    [sanitizedUsername, email, age], 
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      return res.status(201).json({ 
        id: result.insertId,
        message: 'User created successfully'
      });
    }
  );
});
`;

// Sample vulnerable code (example of an API handler with security issues)
const vulnerableCode = `
// Example of a vulnerable Express route handler
app.post('/api/user', (req, res) => {
  const { username, email, age } = req.body;
  
  // No input validation or sanitization
  
  // SQL Injection vulnerability
  const query = "INSERT INTO users (username, email, age) VALUES ('" + 
    username + "', '" + email + "', " + age + ")";
  
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // XSS vulnerability (directly injecting user input into HTML)
    res.send('<h1>User created: ' + username + '</h1><p>Email: ' + email + '</p>');
  });
});
`;

// Test function for secure code
async function testSecureCode() {
  try {
    console.log('Testing AI Security Analysis with Secure Code...\n');
    
    const response = await axios.post('https://' + process.env.REPLIT_SLUG + '.replit.dev/api/openai/security-analysis', {
      content: secureCode,
      contentType: 'code',
      context: 'This is a secure Node.js Express API handler that should have minimal security issues.'
    });
    
    displayResults(response.data.analysis, 'Secure Code Analysis');
  } catch (error) {
    handleError(error);
  }
}

// Test function for vulnerable code
async function testVulnerableCode() {
  try {
    console.log('\nTesting AI Security Analysis with Vulnerable Code...\n');
    
    const response = await axios.post('https://' + process.env.REPLIT_SLUG + '.replit.dev/api/openai/security-analysis', {
      content: vulnerableCode,
      contentType: 'code',
      context: 'This is a vulnerable Node.js Express API handler that should have multiple security issues.'
    });
    
    displayResults(response.data.analysis, 'Vulnerable Code Analysis');
  } catch (error) {
    handleError(error);
  }
}

// Helper function to display results
function displayResults(analysis, title) {
  console.log('='.repeat(50));
  console.log(title);
  console.log('='.repeat(50));
  console.log(`Summary: ${analysis.summary}`);
  console.log('');
  
  console.log('Metrics:');
  console.log(`- Critical Issues: ${analysis.metrics.criticalCount}`);
  console.log(`- High Issues: ${analysis.metrics.highCount}`);
  console.log(`- Medium Issues: ${analysis.metrics.mediumCount}`);
  console.log(`- Low Issues: ${analysis.metrics.lowCount}`);
  console.log(`- Info Issues: ${analysis.metrics.infoCount}`);
  console.log(`- Total Issues: ${analysis.metrics.totalIssues}`);
  console.log(`- Risk Score: ${analysis.metrics.riskScore}`);
  console.log('');
  
  console.log('Issues:');
  if (analysis.issues.length === 0) {
    console.log('No issues found!');
  } else {
    analysis.issues.forEach((issue, index) => {
      console.log(`[${index + 1}] ${issue.title} (${issue.severity.toUpperCase()})`);
      console.log(`    ${issue.description}`);
      if (issue.remediation) {
        console.log(`    Remediation: ${issue.remediation}`);
      }
      console.log('');
    });
  }
  
  console.log('Recommendations:');
  analysis.recommendations.forEach((rec, index) => {
    console.log(`[${index + 1}] ${rec}`);
  });
  
  console.log('-'.repeat(50));
}

// Helper function to handle errors
function handleError(error) {
  console.error('Error testing security analysis endpoint:');
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error('Response:', error.response.data);
  } else {
    console.error(error.message);
  }
}

// Get the replit URL from environment
const getApiUrl = () => {
  // Check if we have REPLIT_SLUG env variable
  if (process.env.REPLIT_SLUG) {
    return `https://${process.env.REPLIT_SLUG}.replit.dev`;
  }
  
  // Fallback to localhost (for local development)
  return 'http://localhost:3000';
};

// Authentication function - get a token from the auth endpoint
// Note: For testing purposes only. In a real application, this would use your actual auth system
async function getAuthToken() {
  try {
    const apiUrl = getApiUrl();
    console.log(`Getting auth token from ${apiUrl}/api/csrf-token`);
    
    // First get a CSRF token
    const csrfResponse = await axios.get(`${apiUrl}/api/csrf-token`);
    const csrfToken = csrfResponse.data.csrfToken;
    
    console.log(`Got CSRF token: ${csrfToken.substring(0, 10)}...`);
    
    // Create cookies jar to maintain session
    const cookies = csrfResponse.headers['set-cookie'] || [];
    
    // Use the CSRF token to make authenticated requests
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    };
    
    // For our test, we'll use the CSRF token as auth
    return { csrfToken, cookies, headers };
  } catch (error) {
    console.error('Error getting auth token:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Run the tests
async function runTests() {
  const apiUrl = getApiUrl();
  console.log(`Starting API Validation with AI Security Analysis Tests on ${apiUrl}...\n`);
  
  try {
    // Replace the URLs in the test functions with the correct API URL
    const originalTestSecureCode = testSecureCode;
    const originalTestVulnerableCode = testVulnerableCode;
    
    testSecureCode = async () => {
      try {
        console.log('Testing AI Security Analysis with Secure Code...\n');
        
        const response = await axios.post(`${apiUrl}/api/openai/security-analysis`, {
          content: secureCode,
          contentType: 'code',
          context: 'This is a secure Node.js Express API handler that should have minimal security issues.'
        });
        
        displayResults(response.data.analysis, 'Secure Code Analysis');
      } catch (error) {
        handleError(error);
      }
    };
    
    testVulnerableCode = async () => {
      try {
        console.log('\nTesting AI Security Analysis with Vulnerable Code...\n');
        
        const response = await axios.post(`${apiUrl}/api/openai/security-analysis`, {
          content: vulnerableCode,
          contentType: 'code',
          context: 'This is a vulnerable Node.js Express API handler that should have multiple security issues.'
        });
        
        displayResults(response.data.analysis, 'Vulnerable Code Analysis');
      } catch (error) {
        handleError(error);
      }
    };
    
    // First test with secure code
    await testSecureCode();
    
    // Then test with vulnerable code
    await testVulnerableCode();
    
    // Restore original functions
    testSecureCode = originalTestSecureCode;
    testVulnerableCode = originalTestVulnerableCode;
    
    console.log('\nTests complete!');
    console.log('This demonstrates how the ValidationEngine can use AI to identify security issues.');
    console.log('In a real application, the ValidationEngine would reject requests with high risk scores.');
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Run all tests
runTests();