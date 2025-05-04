/**
 * Test Script for OpenAI Security Analysis with Authentication
 * 
 * This script demonstrates how to authenticate and then use the OpenAI
 * security-analysis endpoint to analyze code for security vulnerabilities.
 * 
 * Usage: node test-security-analysis-with-auth.js
 */

import axios from 'axios';

// Sample vulnerable code to analyze
const vulnerableCode = `
// Example of an insecure Node.js Express application
const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql');

// Set up database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password123',
  database: 'user_data'
});

// Connect to the database
connection.connect();

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// User login endpoint - VULNERABLE to SQL Injection
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // WARNING: This is vulnerable to SQL injection
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  
  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      // User found, create session
      req.session.user = results[0];
      return res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});
`;

// Get the API URL from environment
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

// Function to test the security analysis endpoint
async function testSecurityAnalysis() {
  try {
    const apiUrl = getApiUrl();
    console.log(`Testing OpenAI Security Analysis Endpoint on ${apiUrl}...\n`);
    
    // Get authentication token
    const auth = await getAuthToken();
    console.log('Successfully obtained auth token');
    
    // Make the request to the security analysis endpoint
    const response = await axios.post(
      `${apiUrl}/api/openai/security-analysis`, 
      {
        content: vulnerableCode,
        contentType: 'code',
        context: 'This is a test Node.js Express application that needs security analysis.'
      },
      { 
        headers: auth.headers,
        withCredentials: true
      }
    );
    
    if (response.data && response.data.analysis) {
      const analysis = response.data.analysis;
      
      console.log('Security Analysis Results:');
      console.log('-------------------------');
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
      analysis.issues.forEach((issue, index) => {
        console.log(`[${index + 1}] ${issue.title} (${issue.severity.toUpperCase()})`);
        console.log(`    ${issue.description}`);
        console.log('');
      });
      
      console.log('Recommendations:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`[${index + 1}] ${rec}`);
      });
      
      console.log('\nUsage:');
      console.log(`- Tokens: ${response.data.usage?.total_tokens || 'N/A'}`);
      console.log(`- Model: ${response.data.model || 'N/A'}`);
      
    } else {
      console.log('Error: Invalid response format');
      console.log(response.data);
    }
  } catch (error) {
    console.error('Error testing security analysis endpoint:');
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