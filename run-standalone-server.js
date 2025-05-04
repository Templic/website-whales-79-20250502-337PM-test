/**
 * Standalone Express Server for Security Testing
 * 
 * This server runs independently from any Vite or React application,
 * providing a clean environment for API validation testing.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3333; // Use a port unlikely to conflict

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Import validation modules if they exist
let validationEngine;
let securityValidator;
try {
  validationEngine = require('./server/validation/ValidationEngine');
  securityValidator = require('./server/security/apiSecurityVerification');
} catch (err) {
  console.log('Validation modules not found, using simplified validation');
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schema validation endpoint
app.post('/validate/basic', (req, res) => {
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
  
  if (errors.length > 0) {
    return res.status(400).json({ valid: false, errors });
  }
  
  res.json({ 
    valid: true, 
    validatedData: { name, email, age },
    message: 'Input data is valid'
  });
});

// Security validation endpoint
app.post('/validate/security', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ 
      valid: false, 
      errors: ['Query is required']
    });
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
  
  res.json({
    valid: securityScore > 0.7,
    securityScore,
    threatAssessment: {
      input: query,
      score: securityScore,
      threats: threats.length > 0 ? threats : ['No threats detected'],
      recommendation: securityScore < 0.7 ? 'Reject' : 'Accept'
    }
  });
});

// Advanced validation if modules are available
if (validationEngine && securityValidator) {
  app.post('/validate/advanced', (req, res) => {
    const result = securityValidator.validateSecurity(req.body.input);
    res.json(result);
  });
}

// Serve the index.html file
app.get('/', (req, res) => {
  // Check if we have our custom HTML file
  const htmlPath = path.join(__dirname, 'standalone-test.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // Generate a simple HTML page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Validation Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .container { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        label { display: block; margin-bottom: 5px; }
        input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Standalone API Validation Test</h1>
      <div class="container">
        <h2>Health Check</h2>
        <button id="healthBtn">Check Health</button>
        <pre id="healthResult"></pre>
      </div>
      
      <div class="container">
        <h2>Basic Validation</h2>
        <label for="name">Name:</label>
        <input type="text" id="name" value="John Doe">
        <label for="email">Email:</label>
        <input type="text" id="email" value="john@example.com">
        <label for="age">Age:</label>
        <input type="number" id="age" value="30">
        <button id="basicBtn">Test Basic Validation</button>
        <pre id="basicResult"></pre>
      </div>
      
      <div class="container">
        <h2>Security Validation</h2>
        <label for="query">Query:</label>
        <textarea id="query" rows="4">normal user input</textarea>
        <button id="securityBtn">Test Security Validation</button>
        <button id="maliciousBtn" style="background-color: #ff9800;">Test Malicious Input</button>
        <pre id="securityResult"></pre>
      </div>
      
      <script>
        // Health check
        document.getElementById('healthBtn').addEventListener('click', async () => {
          try {
            const response = await fetch('/health');
            const data = await response.json();
            document.getElementById('healthResult').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('healthResult').textContent = 'Error: ' + error.message;
          }
        });
        
        // Basic validation
        document.getElementById('basicBtn').addEventListener('click', async () => {
          try {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const age = parseInt(document.getElementById('age').value);
            
            const response = await fetch('/validate/basic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, age })
            });
            
            const data = await response.json();
            document.getElementById('basicResult').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('basicResult').textContent = 'Error: ' + error.message;
          }
        });
        
        // Security validation
        document.getElementById('securityBtn').addEventListener('click', async () => {
          try {
            const query = document.getElementById('query').value;
            
            const response = await fetch('/validate/security', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            });
            
            const data = await response.json();
            document.getElementById('securityResult').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('securityResult').textContent = 'Error: ' + error.message;
          }
        });
        
        // Malicious input test
        document.getElementById('maliciousBtn').addEventListener('click', () => {
          document.getElementById('query').value = "' OR 1=1; DROP TABLE users; --";
          document.getElementById('securityBtn').click();
        });
      </script>
    </body>
    </html>
    `;
    res.send(html);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone server running at http://localhost:${PORT}`);
  console.log(`Access the app directly in your browser.`);
});