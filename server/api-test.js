// API Test Utility - ES Module version

import http from 'http';

// Simple Callback Test
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/typescript/public/status',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing TypeScript Error Management API...');
console.log(`Making POST request to ${options.path}`);

const data = JSON.stringify({
  projectRoot: process.cwd()
});

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received');
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (err) {
      console.log('Response (raw):', responseData);
    }
    console.log('API Test Complete');
  });
});

req.on('error', (error) => {
  console.error(`Request failed: ${error.message}`);
});

req.write(data);
req.end();