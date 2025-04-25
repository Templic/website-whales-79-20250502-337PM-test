#!/usr/bin/env node

/**
 * Test Script for TypeScript Error Management API
 * 
 * This script tests the various API endpoints of the TypeScript Error Management System
 * and displays the results in a readable format.
 */

const fetch = require('node-fetch');
const { resolve } = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api/typescript-simple';
const PROJECT_ROOT = resolve(__dirname, '..');
const TEST_FILE = 'server/routes/typescript-error-simple-routes.ts';

// ANSI color codes for prettier output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Format the output for better readability
 */
function formatOutput(data, title) {
  console.log(`\n${COLORS.bright}${COLORS.blue}=== ${title} ====${COLORS.reset}\n`);
  
  if (typeof data === 'object') {
    // Format based on endpoint
    if (title.includes('Compiler Info')) {
      console.log(`${COLORS.green}TypeScript Version:${COLORS.reset} ${data.version}`);
      console.log(`${COLORS.green}Target Options:${COLORS.reset} ${Object.keys(data.targetInfo).join(', ')}`);
      console.log(`${COLORS.green}Module Options:${COLORS.reset} ${Object.keys(data.moduleInfo).join(', ')}`);
    } 
    else if (title.includes('Analyze File')) {
      console.log(`${COLORS.green}File:${COLORS.reset} ${data.filePath}`);
      console.log(`${COLORS.green}Error Count:${COLORS.reset} ${data.errorCount}`);
      console.log(`${COLORS.green}Warning Count:${COLORS.reset} ${data.warningCount}`);
      
      console.log(`\n${COLORS.bright}Top 3 Diagnostics:${COLORS.reset}`);
      (data.diagnostics || []).slice(0, 3).forEach((diag, idx) => {
        const color = diag.category === 'error' ? COLORS.red : 
                      diag.category === 'warning' ? COLORS.yellow : COLORS.blue;
        
        console.log(`\n${idx + 1}. ${color}[${diag.category.toUpperCase()}]${COLORS.reset} ${diag.message}`);
        console.log(`   Line ${diag.line}, Char ${diag.character}: ${COLORS.magenta}${diag.lineText}${COLORS.reset}`);
        console.log(`   Fix: ${diag.fixSuggestion}`);
      });
      
      if ((data.diagnostics || []).length > 3) {
        console.log(`\n...and ${data.diagnostics.length - 3} more issues.`);
      }
    }
    else if (title.includes('Batch Analyze')) {
      console.log(`${COLORS.green}Total Files:${COLORS.reset} ${data.stats.totalFiles}`);
      console.log(`${COLORS.green}Files With Errors:${COLORS.reset} ${data.stats.filesWithErrors}`);
      console.log(`${COLORS.green}Total Issues:${COLORS.reset} ${data.stats.totalIssues}`);
      console.log(`${COLORS.green}Clean Files:${COLORS.reset} ${data.stats.percentClean}%`);
      
      if (data.hotspotFiles && data.hotspotFiles.length > 0) {
        console.log(`\n${COLORS.bright}Top Error Hotspots:${COLORS.reset}`);
        data.hotspotFiles.slice(0, 3).forEach((file, idx) => {
          console.log(`${idx + 1}. ${file.file}: ${file.totalIssues} issues ` +
                      `(${file.errorCount} errors, ${file.warningCount} warnings)`);
        });
      }
      
      if (data.recommendedFixes && data.recommendedFixes.length > 0) {
        console.log(`\n${COLORS.bright}Top Recommended Fixes:${COLORS.reset}`);
        data.recommendedFixes.slice(0, 2).forEach((fix, idx) => {
          console.log(`${idx + 1}. ${fix.message} (${fix.count} occurrences)`);
          console.log(`   Example: ${fix.fix.split('\n')[0]}${fix.fix.includes('\n') ? '...' : ''}`);
        });
      }
    }
    else if (title.includes('Type Foundation')) {
      console.log(`${COLORS.green}Type Health Score:${COLORS.reset} ${data.typeHealthScore}/100`);
      
      console.log(`\n${COLORS.bright}Type Definitions:${COLORS.reset}`);
      console.log(`- Interfaces: ${data.analysis.typeDefinitions.interfaceCount}`);
      console.log(`- Type Aliases: ${data.analysis.typeDefinitions.typeAliasCount}`);
      console.log(`- Enums: ${data.analysis.typeDefinitions.enumCount}`);
      
      console.log(`\n${COLORS.bright}Type Usage:${COLORS.reset}`);
      console.log(`- Any Types: ${data.analysis.typeUsage.anyTypeCount}`);
      console.log(`- Unknown Types: ${data.analysis.typeUsage.unknownTypeCount}`);
      
      console.log(`\n${COLORS.bright}Domain-Specific Types:${COLORS.reset}`);
      console.log(`- Whale Related: ${data.analysis.whaleAppSpecific.whaleRelatedTypes}`);
      console.log(`- Sound Related: ${data.analysis.whaleAppSpecific.soundRelatedTypes}`);
      
      console.log(`\n${COLORS.bright}Recommendations:${COLORS.reset}`);
      data.recommendations.forEach((rec, idx) => {
        console.log(`${idx + 1}. ${rec}`);
      });
    }
    else {
      // Generic object display
      console.log(JSON.stringify(data, null, 2));
    }
  } else {
    console.log(data);
  }
}

/**
 * Make an API request
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Unknown error');
    }
    
    return data;
  } catch (error) {
    console.error(`${COLORS.red}Error calling ${endpoint}:${COLORS.reset}`, error.message);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${COLORS.bright}${COLORS.green}Testing TypeScript Error Management API${COLORS.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Project Root: ${PROJECT_ROOT}`);
  console.log(`Test File: ${TEST_FILE}`);
  
  // Test 1: Get Compiler Info
  const compilerInfo = await makeRequest('/compiler-info');
  if (compilerInfo) {
    formatOutput(compilerInfo, 'Compiler Info');
  }
  
  // Test 2: Analyze File
  const fileAnalysis = await makeRequest('/analyze-file', 'POST', {
    filePath: TEST_FILE
  });
  if (fileAnalysis) {
    formatOutput(fileAnalysis, 'Analyze File');
  }
  
  // Test 3: Batch Analyze
  const batchAnalysis = await makeRequest('/batch-analyze', 'POST', {
    projectRoot: PROJECT_ROOT,
    maxFiles: 10
  });
  if (batchAnalysis) {
    formatOutput(batchAnalysis, 'Batch Analyze');
  }
  
  // Test 4: Type Foundation
  const typeFoundation = await makeRequest('/type-foundation', 'POST', {
    projectRoot: PROJECT_ROOT,
    maxFiles: 10
  });
  if (typeFoundation) {
    formatOutput(typeFoundation, 'Type Foundation');
  }
  
  console.log(`\n${COLORS.bright}${COLORS.green}Tests completed${COLORS.reset}\n`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${COLORS.red}Error running tests:${COLORS.reset}`, error);
});