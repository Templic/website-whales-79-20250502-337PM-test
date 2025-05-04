/**
 * Third-Party Integration Exemption Test
 * 
 * This script tests if the CSRF exemptions we've added for third-party services
 * like Taskade, YouTube, Google Maps, and OpenAI are functioning correctly.
 */

const http = require('http');
const https = require('https');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

const API_HOST = 'localhost';
const API_PORT = 5000;

// Color-coded logging
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m' // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

// Make a request to the specified path
async function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: contentType.includes('application/json') ? JSON.parse(data) : data
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
            error: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test a list of third-party integration paths
async function testThirdPartyIntegrations() {
  const integrationPaths = [
    // Taskade integrations
    '/api/taskade/widget',
    '/taskade-widget.js',
    '/taskade/embed',
    '/taskade-embed/widget',
    
    // YouTube integrations
    '/api/youtube/embed',
    '/youtube-embed/video',
    
    // Google Maps integrations
    '/api/maps/embed',
    '/maps-embed/location',
    
    // OpenAI integrations
    '/api/openai/completions',
    
    // General embed endpoints
    '/widget/generic',
    '/embed/content',
    '/iframe-content/embed'
  ];
  
  log('===== Testing Third-Party Integration CSRF Exemptions =====', 'info');
  
  for (const path of integrationPaths) {
    try {
      const response = await makeRequest(path);
      
      if (response.statusCode === 403 && 
          ((typeof response.data === 'object' && response.data.code === 'CSRF_ERROR') ||
           (typeof response.data === 'string' && response.data.includes('CSRF')))) {
        log(`❌ ${path} - CSRF check not bypassed (${response.statusCode})`, 'error');
      } else if (response.statusCode === 404) {
        // 404 is expected since these are test paths that don't actually exist,
        // but they shouldn't trigger CSRF errors
        log(`✅ ${path} - CSRF check bypassed (${response.statusCode})`, 'success');
      } else {
        log(`✅ ${path} - CSRF check bypassed (${response.statusCode})`, 'success');
      }
    } catch (error) {
      log(`❌ ${path} - Error: ${error.message}`, 'error');
    }
  }
}

// Main function
async function main() {
  try {
    await testThirdPartyIntegrations();
  } catch (error) {
    log(`Error running tests: ${error.message}`, 'error');
  }
}

// Run the main function
main();