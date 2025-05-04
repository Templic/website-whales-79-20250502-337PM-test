/**
 * Simplified API Validation Server
 * 
 * A standalone, simplified version of the API validation server that works
 * in any environment, including Replit.
 */

// We're using CommonJS here for maximum compatibility
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 8080;

// Simple routing middleware
const routes = {
  'GET': {},
  'POST': {}
};

// Register routes
function get(path, handler) {
  routes['GET'][path] = handler;
}

function post(path, handler) {
  routes['POST'][path] = handler;
}

// Simple HTML page for testing
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Validation Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1, h2 {
      color: #333;
    }
    .container {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #45a049;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .result {
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <h1>API Validation Test</h1>
  <p>This page allows you to test the API validation functionality.</p>
  
  <div class="container">
    <h2>Health Check</h2>
    <button onclick="checkHealth()">Check API Health</button>
    <div class="result" id="health-result"></div>
  </div>
  
  <div class="container">
    <h2>Basic Validation</h2>
    <div>
      <label for="name">Name:</label>
      <input type="text" id="name" value="John Doe">
    </div>
    <div>
      <label for="email">Email:</label>
      <input type="text" id="email" value="john@example.com">
    </div>
    <div>
      <label for="age">Age:</label>
      <input type="number" id="age" value="30">
    </div>
    <button onclick="testBasicValidation()">Test Basic Validation</button>
    <div class="result" id="basic-result"></div>
  </div>
  
  <div class="container">
    <h2>Security Validation</h2>
    <div>
      <label for="query">Query:</label>
      <textarea id="query" rows="4">normal user input</textarea>
    </div>
    <button onclick="testSecurityValidation()">Test Security Validation</button>
    <button onclick="testMaliciousInput()" style="background-color: #ff9800;">Test Malicious Input</button>
    <div class="result" id="security-result"></div>
  </div>
  
  <script>
    // Format JSON for display
    function formatJSON(json) {
      if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
      }
      return json;
    }
    
    // Display result
    function displayResult(elementId, data, isError = false) {
      const element = document.getElementById(elementId);
      if (isError) {
        element.innerHTML = '<p style="color: red;">Error: ' + data + '</p>';
      } else {
        element.innerHTML = '<pre>' + formatJSON(data) + '</pre>';
      }
    }
    
    // Health check
    async function checkHealth() {
      try {
        const response = await fetch('/health');
        const data = await response.json();
        displayResult('health-result', data);
      } catch (error) {
        displayResult('health-result', error.message, true);
      }
    }
    
    // Basic validation
    async function testBasicValidation() {
      try {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const age = parseInt(document.getElementById('age').value);
        
        const response = await fetch('/validate/basic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, age })
        });
        
        const data = await response.json();
        displayResult('basic-result', data);
      } catch (error) {
        displayResult('basic-result', error.message, true);
      }
    }
    
    // Security validation
    async function testSecurityValidation() {
      try {
        const query = document.getElementById('query').value;
        
        const response = await fetch('/validate/security', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        displayResult('security-result', data);
      } catch (error) {
        displayResult('security-result', error.message, true);
      }
    }
    
    // Test malicious input
    function testMaliciousInput() {
      document.getElementById('query').value = "' OR 1=1; DROP TABLE users; --";
      testSecurityValidation();
    }
  </script>
</body>
</html>
`;

// Register routes
get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(HTML_PAGE);
});

get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
});

post('/validate/basic', (req, res) => {
  const { name, email, age } = req.body;
  
  const errors = [];
  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  if (!age || age < 18 || age > 120) {
    errors.push('Age must be between 18 and 120');
  }
  
  res.setHeader('Content-Type', 'application/json');
  
  if (errors.length > 0) {
    return res.end(JSON.stringify({ 
      valid: false, 
      errors 
    }));
  }
  
  res.end(JSON.stringify({ 
    valid: true, 
    validatedData: { name, email, age },
    message: 'Input data is valid'
  }));
});

post('/validate/security', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ 
      valid: false, 
      errors: ['Query is required']
    }));
  }
  
  // Check for SQL injection patterns
  const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|@@|@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|exec|execute|fetch|insert|kill|open|select|sys|sysobjects|syscolumns|table|update)/i;
  
  // Check for XSS patterns
  const xssPattern = /(<script|javascript:|on\w+\s*=|alert\s*\(|eval\s*\(|document\.cookie|document\.write)/i;
  
  // Calculate security score
  let securityScore = 1.0;
  let threats = [];
  
  if (sqlInjectionPattern.test(query)) {
    securityScore -= 0.5;
    threats.push('Potential SQL injection detected');
  }
  
  if (xssPattern.test(query)) {
    securityScore -= 0.3;
    threats.push('Potential XSS attack detected');
  }
  
  // Clamp score between 0 and 1
  securityScore = Math.max(0, Math.min(1, securityScore));
  
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    valid: securityScore > 0.7,
    securityScore,
    threatAssessment: {
      input: query,
      score: securityScore,
      threats: threats.length > 0 ? threats : ['No threats detected'],
      recommendation: securityScore < 0.7 ? 'Reject' : 'Accept'
    }
  }));
});

// Create server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Handle POST data
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
        
        // Route to handler
        const handler = routes[req.method][pathname];
        
        if (handler) {
          handler(req, res);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } 
  // Handle GET requests
  else if (req.method === 'GET') {
    const handler = routes[req.method][pathname];
    
    if (handler) {
      handler(req, res);
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }
  // Handle unsupported methods
  else {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Simplified validation server running on port ${PORT}`);
  console.log(`Access the server at: http://localhost:${PORT}/`);
});