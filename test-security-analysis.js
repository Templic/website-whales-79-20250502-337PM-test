/**
 * Test Script for OpenAI Security Analysis Endpoint
 * 
 * This script tests the /api/openai/security-analysis endpoint
 * to verify that it can properly analyze code for security vulnerabilities.
 * 
 * Usage: node test-security-analysis.js
 */

const axios = require('axios');

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

// Get user data - VULNERABLE to Insecure Direct Object References
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // WARNING: No authorization check, vulnerable to IDOR
  connection.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(200).json(results[0]);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  });
});

// Create a new user - VULNERABLE to XSS
app.post('/api/users', (req, res) => {
  const { username, password, email, displayName } = req.body;
  
  // WARNING: No input validation or sanitization, vulnerable to XSS
  const user = {
    username,
    password, // WARNING: Storing password in plaintext
    email,
    display_name: displayName,
    created_at: new Date()
  };
  
  connection.query('INSERT INTO users SET ?', user, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    return res.status(201).json({ success: true, id: results.insertId });
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
`;

// Function to test the security analysis endpoint
// Get the replit URL from environment
const getApiUrl = () => {
  // Check if we have REPLIT_SLUG env variable
  if (process.env.REPLIT_SLUG) {
    return `https://${process.env.REPLIT_SLUG}.replit.dev`;
  }
  
  // Fallback to localhost (for local development)
  return 'http://localhost:3000';
};

async function testSecurityAnalysis() {
  try {
    const apiUrl = getApiUrl();
    console.log(`Testing OpenAI Security Analysis Endpoint on ${apiUrl}...\n`);
    
    const response = await axios.post(`${apiUrl}/api/openai/security-analysis`, {
      content: vulnerableCode,
      contentType: 'code',
      context: 'This is a test Node.js Express application that needs security analysis.'
    });
    
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