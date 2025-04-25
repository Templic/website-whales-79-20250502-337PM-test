#!/usr/bin/env node

/**
 * TypeScript ESLint Analyzer
 * 
 * This script runs ESLint with TypeScript-specific rules as a standalone utility,
 * analyzing TypeScript files for errors and generating a detailed report.
 * 
 * Usage:
 *   node typescript-eslint-analyzer.js [options]
 * 
 * Options:
 *   --path, -p       Directory or file to analyze (default: src)
 *   --config, -c     Path to ESLint config (default: .eslintrc.typescript.js)
 *   --output, -o     Output report file (default: typescript-eslint-report.json)
 *   --format, -f     Output format (default: json, options: json, html, markdown)
 *   --fix            Attempt to automatically fix problems
 *   --verbose, -v    Show detailed output
 *   --help, -h       Show help information
 */

const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Parse command line arguments
const args = process.argv.slice(2);
let targetPath = 'src';
let configPath = '.eslintrc.typescript.js';
let outputPath = 'typescript-eslint-report.json';
let format = 'json';
let fix = false;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--path' || arg === '-p') {
    targetPath = args[++i];
  } else if (arg === '--config' || arg === '-c') {
    configPath = args[++i];
  } else if (arg === '--output' || arg === '-o') {
    outputPath = args[++i];
  } else if (arg === '--format' || arg === '-f') {
    format = args[++i];
  } else if (arg === '--fix') {
    fix = true;
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Show help information
function showHelp() {
  console.log(`
TypeScript ESLint Analyzer
==========================

A standalone utility that runs ESLint with TypeScript-specific rules
to analyze TypeScript files for errors and generate detailed reports.

Usage:
  node typescript-eslint-analyzer.js [options]

Options:
  --path, -p       Directory or file to analyze (default: src)
  --config, -c     Path to ESLint config (default: .eslintrc.typescript.js)
  --output, -o     Output report file (default: typescript-eslint-report.json)
  --format, -f     Output format (default: json, options: json, html, markdown)
  --fix            Attempt to automatically fix problems
  --verbose, -v    Show detailed output
  --help, -h       Show help information

Examples:
  node typescript-eslint-analyzer.js --path src/components
  node typescript-eslint-analyzer.js --path src/app.ts --fix
  node typescript-eslint-analyzer.js --format html --output report.html
  `);
}

// Categorize ESLint messages
function categorizeMessage(message) {
  // TypeScript-specific categories
  if (message.ruleId && message.ruleId.startsWith('@typescript-eslint/')) {
    if (message.ruleId.includes('no-explicit-any')) {
      return 'IMPLICIT_ANY';
    } else if (message.ruleId.includes('no-unsafe')) {
      return 'TYPE_SAFETY';
    } else if (message.ruleId.includes('explicit-function-return-type')) {
      return 'MISSING_RETURN_TYPE';
    } else if (message.ruleId.includes('no-unused-vars')) {
      return 'UNUSED_VARIABLE';
    } else if (message.ruleId.includes('restrict-plus-operands')) {
      return 'TYPE_MISMATCH';
    } else if (message.ruleId.includes('no-floating-promises')) {
      return 'PROMISE_HANDLING';
    } else if (message.ruleId.includes('nullish-coalescing')) {
      return 'NULL_UNDEFINED';
    } else {
      return 'TYPESCRIPT';
    }
  }
  
  // General categories
  if (message.ruleId && message.ruleId.includes('no-unused-vars')) {
    return 'UNUSED_VARIABLE';
  } else if (message.ruleId && message.ruleId.includes('no-undef')) {
    return 'UNDEFINED_REFERENCE';
  } else {
    return 'GENERAL';
  }
}

// Determine severity level
function determineSeverity(message) {
  if (message.severity === 2) {
    return 'high';
  } else if (message.severity === 1) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Suggest a fix for the issue
function suggestFix(message) {
  if (!message.ruleId) {
    return 'Review the error message for details';
  }
  
  // TypeScript-specific suggestions
  if (message.ruleId.includes('no-explicit-any')) {
    return 'Replace "any" with a more specific type or use "unknown" if type is truly not known';
  } else if (message.ruleId.includes('no-unsafe-assignment')) {
    return 'Add type assertion or type guard before assigning the value';
  } else if (message.ruleId.includes('explicit-function-return-type')) {
    return 'Add an explicit return type annotation to the function';
  } else if (message.ruleId.includes('no-unused-vars')) {
    return 'Remove unused variable or prefix with underscore (_) if intentionally unused';
  } else if (message.ruleId.includes('restrict-plus-operands')) {
    return 'Ensure operands are of compatible types, consider using template literals for strings';
  } else if (message.ruleId.includes('no-floating-promises')) {
    return 'Add await or .catch() to handle the promise, or explicitly mark as void';
  } else if (message.ruleId.includes('nullish-coalescing')) {
    return 'Consider using ?? instead of || for null/undefined checks';
  } else if (message.ruleId.includes('no-unsafe-member-access')) {
    return 'Add a type guard before accessing the property';
  } else if (message.ruleId.includes('no-unsafe-call')) {
    return 'Add a type guard before calling the function';
  } else if (message.ruleId.includes('restrict-template-expressions')) {
    return 'Add type checking before using variable in template literal';
  } else {
    return `Review the rule documentation for ${message.ruleId}`;
  }
}

// Format results based on specified format
function formatResults(results, format) {
  if (format === 'json') {
    return JSON.stringify(results, null, 2);
  } else if (format === 'html') {
    return generateHtmlReport(results);
  } else if (format === 'markdown') {
    return generateMarkdownReport(results);
  } else {
    console.error(`Unsupported format: ${format}. Using JSON format instead.`);
    return JSON.stringify(results, null, 2);
  }
}

// Generate HTML report
function generateHtmlReport(results) {
  const totalIssues = results.reduce((total, file) => total + file.messages.length, 0);
  const categoryCounts = {};
  const severityCounts = { high: 0, medium: 0, low: 0 };
  
  // Count issues by category and severity
  results.forEach(file => {
    file.messages.forEach(message => {
      const category = message.category || 'UNKNOWN';
      const severity = message.severity || 'low';
      
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });
  });
  
  // Generate HTML content
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript ESLint Analysis Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      margin-bottom: 30px;
    }
    h1 {
      color: #2c3e50;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      flex: 1;
      min-width: 200px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .summary-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .high { color: #e74c3c; }
    .medium { color: #f39c12; }
    .low { color: #3498db; }
    .file-issues {
      margin-bottom: 30px;
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .file-path {
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    .issue {
      margin: 15px 0;
      padding: 12px;
      border-radius: 4px;
      background-color: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .issue-high {
      border-left: 4px solid #e74c3c;
    }
    .issue-medium {
      border-left: 4px solid #f39c12;
    }
    .issue-low {
      border-left: 4px solid #3498db;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .issue-location {
      font-family: monospace;
      color: #666;
    }
    .issue-message {
      margin-bottom: 8px;
    }
    .issue-rule {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    .issue-suggestion {
      background-color: #f8f9fa;
      padding: 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    .charts {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .chart {
      flex: 1;
      min-width: 300px;
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .category-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      background-color: #e5e5e5;
      margin-right: 5px;
    }
    .generated-info {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <header>
    <h1>TypeScript ESLint Analysis Report</h1>
    <p>Analysis of TypeScript code using ESLint with TypeScript-specific rules</p>
  </header>
  
  <div class="summary">
    <div class="summary-card">
      <div class="summary-value">${totalIssues}</div>
      <div>Total Issues</div>
    </div>
    <div class="summary-card">
      <div class="summary-value high">${severityCounts.high}</div>
      <div>High Severity</div>
    </div>
    <div class="summary-card">
      <div class="summary-value medium">${severityCounts.medium}</div>
      <div>Medium Severity</div>
    </div>
    <div class="summary-card">
      <div class="summary-value low">${severityCounts.low}</div>
      <div>Low Severity</div>
    </div>
  </div>
  
  <div class="charts">
    <div class="chart">
      <h2>Issues by Category</h2>
      <div id="categoryChart" style="height: 300px;"></div>
    </div>
    <div class="chart">
      <h2>Issues by Severity</h2>
      <div id="severityChart" style="height: 300px;"></div>
    </div>
  </div>
  
  <h2>Issues by File</h2>
  
  ${results.map(file => {
    if (file.messages.length === 0) return '';
    
    return `
    <div class="file-issues">
      <div class="file-path">${file.filePath}</div>
      ${file.messages.map(message => {
        const severityClass = message.severity === 'high' ? 'issue-high' : 
                              message.severity === 'medium' ? 'issue-medium' : 'issue-low';
        
        return `
        <div class="issue ${severityClass}">
          <div class="issue-header">
            <span class="category-tag">${message.category}</span>
            <span class="issue-location">Line ${message.line}, Column ${message.column}</span>
          </div>
          <div class="issue-message">${message.message}</div>
          <div class="issue-rule">Rule: ${message.ruleId || 'N/A'}</div>
          <div class="issue-suggestion">${message.suggestion}</div>
        </div>
        `;
      }).join('')}
    </div>
    `;
  }).join('')}
  
  <div class="generated-info">
    Generated on ${new Date().toLocaleString()} | TypeScript ESLint Analyzer
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Prepare data for charts
    const categoryData = ${JSON.stringify(Object.entries(categoryCounts).map(([category, count]) => ({ category, count })))};
    const severityData = [
      { severity: 'High', count: ${severityCounts.high} },
      { severity: 'Medium', count: ${severityCounts.medium} },
      { severity: 'Low', count: ${severityCounts.low} }
    ];
    
    // Category chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
      type: 'bar',
      data: {
        labels: categoryData.map(d => d.category),
        datasets: [{
          label: 'Number of Issues',
          data: categoryData.map(d => d.count),
          backgroundColor: '#3498db',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Severity chart
    const severityCtx = document.getElementById('severityChart').getContext('2d');
    new Chart(severityCtx, {
      type: 'pie',
      data: {
        labels: severityData.map(d => d.severity),
        datasets: [{
          data: severityData.map(d => d.count),
          backgroundColor: [
            '#e74c3c',  // High
            '#f39c12',  // Medium
            '#3498db'   // Low
          ],
          borderWidth: 1
        }]
      }
    });
  </script>
</body>
</html>`;
}

// Generate Markdown report
function generateMarkdownReport(results) {
  const totalIssues = results.reduce((total, file) => total + file.messages.length, 0);
  const categoryCounts = {};
  const severityCounts = { high: 0, medium: 0, low: 0 };
  
  // Count issues by category and severity
  results.forEach(file => {
    file.messages.forEach(message => {
      const category = message.category || 'UNKNOWN';
      const severity = message.severity || 'low';
      
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });
  });
  
  // Generate Markdown content
  let markdown = `# TypeScript ESLint Analysis Report

Analysis of TypeScript code using ESLint with TypeScript-specific rules.

## Summary

- **Total Issues**: ${totalIssues}
- **High Severity**: ${severityCounts.high}
- **Medium Severity**: ${severityCounts.medium}
- **Low Severity**: ${severityCounts.low}

## Issues by Category

${Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([category, count]) => `- **${category}**: ${count}`)
  .join('\n')}

## Issues by File

`;

  // Add file-specific issues
  results.forEach(file => {
    if (file.messages.length === 0) return;
    
    markdown += `### ${file.filePath}\n\n`;
    
    file.messages.forEach(message => {
      const severitySymbol = message.severity === 'high' ? '🔴' : 
                           message.severity === 'medium' ? '🟠' : '🔵';
      
      markdown += `${severitySymbol} **${message.category}** (Line ${message.line}, Column ${message.column})\n`;
      markdown += `- ${message.message}\n`;
      markdown += `- Rule: \`${message.ruleId || 'N/A'}\`\n`;
      markdown += `- Suggestion: ${message.suggestion}\n\n`;
    });
  });
  
  markdown += `\n\n---\n\nGenerated on ${new Date().toLocaleString()} | TypeScript ESLint Analyzer`;
  
  return markdown;
}

// Run ESLint analysis
async function runAnalysis() {
  try {
    if (verbose) {
      console.log('TypeScript ESLint Analyzer');
      console.log('=========================');
      console.log(`Target: ${targetPath}`);
      console.log(`Config: ${configPath}`);
      console.log(`Output: ${outputPath}`);
      console.log(`Format: ${format}`);
      console.log(`Fix: ${fix ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    // Initialize ESLint
    const eslint = new ESLint({
      overrideConfigFile: configPath,
      fix: fix,
      extensions: ['.ts', '.tsx'],
      useEslintrc: false
    });
    
    if (verbose) {
      console.log('Running ESLint analysis...');
    }
    
    // Run ESLint on target path
    const results = await eslint.lintFiles([targetPath]);
    
    // Apply fixes if requested
    if (fix) {
      if (verbose) {
        console.log('Applying automatic fixes...');
      }
      
      await ESLint.outputFixes(results);
    }
    
    // Process and enhance results
    const enhancedResults = results.map(result => {
      return {
        ...result,
        messages: result.messages.map(message => {
          return {
            ...message,
            category: categorizeMessage(message),
            severity: determineSeverity(message),
            suggestion: suggestFix(message)
          };
        })
      };
    });
    
    // Filter out files with no issues
    const filteredResults = enhancedResults.filter(result => result.messages.length > 0);
    
    // Format results
    const formattedResults = formatResults(filteredResults, format);
    
    // Save report
    fs.writeFileSync(outputPath, formattedResults);
    
    // Print summary
    const totalIssues = filteredResults.reduce((total, file) => total + file.messages.length, 0);
    const filesWithIssues = filteredResults.length;
    
    console.log(`✅ Analysis complete!`);
    console.log(`Found ${totalIssues} issues in ${filesWithIssues} files.`);
    console.log(`Report saved to: ${outputPath}`);
    
    // Show detailed summary if verbose
    if (verbose) {
      const categoryCounts = {};
      const severityCounts = { high: 0, medium: 0, low: 0 };
      
      filteredResults.forEach(file => {
        file.messages.forEach(message => {
          const category = message.category || 'UNKNOWN';
          const severity = message.severity || 'low';
          
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        });
      });
      
      console.log('\nIssues by Category:');
      Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count}`);
        });
      
      console.log('\nIssues by Severity:');
      console.log(`  High: ${severityCounts.high}`);
      console.log(`  Medium: ${severityCounts.medium}`);
      console.log(`  Low: ${severityCounts.low}`);
      
      console.log('\nTop 5 Files with Most Issues:');
      filteredResults
        .sort((a, b) => b.messages.length - a.messages.length)
        .slice(0, 5)
        .forEach(file => {
          console.log(`  ${file.filePath}: ${file.messages.length} issues`);
        });
    }
    
  } catch (error) {
    console.error('Error running analysis:', error);
    process.exit(1);
  }
}

// Create output directory if it doesn't exist
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Run the analysis
runAnalysis();