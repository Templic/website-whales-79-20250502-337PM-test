/**
 * TypeScript Error Fixer with OpenAI Integration
 * 
 * This script provides an end-to-end solution for finding and fixing TypeScript errors
 * using both standard programmatic approaches and OpenAI-powered suggestions.
 * 
 * Usage: ts-node fix-typescript-errors.ts [options]
 * 
 * Options:
 *   --project <dir>   Project directory to scan (default: current directory)
 *   --max <number>    Maximum number of errors to fix (default: 100)
 *   --fix             Apply fixes automatically when possible
 *   --ai              Use OpenAI to generate fix suggestions
 *   --report          Generate an HTML report of errors and fixes
 *   --verbose         Show detailed logs
 */

import { findTypeScriptErrors, TypeScriptErrorDetail } from './server/utils/ts-error-finder';
import { analyzeTypeScriptErrors } from './server/utils/ts-error-analyzer';
import { fixTypeScriptErrorsWithOpenAI, applyMultipleFixesToFiles } from './server/utils/openai-enhanced-fixer';
import fs from 'fs';
import path from 'path';

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  project: process.cwd(),
  maxErrors: 100,
  apply: false,
  ai: false,
  report: false,
  verbose: false
};

// Parse command-line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--project' && i + 1 < args.length) {
    options.project = args[++i];
  } else if (arg === '--max' && i + 1 < args.length) {
    options.maxErrors = parseInt(args[++i], 10);
  } else if (arg === '--fix') {
    options.apply = true;
  } else if (arg === '--ai') {
    options.ai = true;
  } else if (arg === '--report') {
    options.report = true;
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  }
}

// Print help message
function printHelp() {
  console.log(`
TypeScript Error Fixer with OpenAI Integration

Usage: ts-node fix-typescript-errors.ts [options]

Options:
  --project <dir>   Project directory to scan (default: current directory)
  --max <number>    Maximum number of errors to fix (default: 100)
  --fix             Apply fixes automatically when possible
  --ai              Use OpenAI to generate fix suggestions
  --report          Generate an HTML report of errors and fixes
  --verbose         Show detailed logs
  --help, -h        Show this help message
  `);
}

/**
 * Convert error format for OpenAI fixer
 */
function convertErrorFormat(error: TypeScriptErrorDetail): any {
  return {
    errorCode: error.code,
    messageText: error.message,
    filePath: error.file,
    lineNumber: error.line,
    columnNumber: error.column,
    category: error.category,
    severity: error.severity,
    source: error.snippet
  };
}

/**
 * Apply fix to a file
 */
function applyFix(filePath: string, lineNumber: number, newCode: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (lineNumber < 1 || lineNumber > lines.length) {
      console.error(`Invalid line number: ${lineNumber} (file has ${lines.length} lines)`);
      return false;
    }
    
    lines[lineNumber - 1] = newCode;
    fs.writeFileSync(filePath, lines.join('\n'));
    
    return true;
  } catch (error) {
    console.error(`Error applying fix to ${filePath}:${lineNumber}:`, error);
    return false;
  }
}

/**
 * Create an HTML report of errors and fixes
 */
function createHtmlReport(fixes: any[], outputPath: string = './typescript-fixes-report.html'): string {
  // Basic HTML template
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript Errors Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #1a1a1a;
    }
    .summary {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .error-card {
      border: 1px solid #ddd;
      border-radius: 5px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .error-header {
      background-color: #f0f0f0;
      padding: 10px 15px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .error-body {
      padding: 15px;
    }
    .error-file {
      font-family: monospace;
      font-size: 14px;
      color: #0066cc;
    }
    .error-message {
      background-color: #fff0f0;
      padding: 10px;
      border-radius: 3px;
      margin: 10px 0;
      font-family: monospace;
    }
    .error-fix {
      background-color: #f0fff0;
      padding: 10px;
      border-radius: 3px;
      margin: 10px 0;
      font-family: monospace;
      white-space: pre-wrap;
    }
    .explanation {
      background-color: #f9f9f9;
      padding: 10px;
      border-radius: 3px;
      margin: 10px 0;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .badge-critical {
      background-color: #d9534f;
    }
    .badge-high {
      background-color: #f0ad4e;
    }
    .badge-medium {
      background-color: #5bc0de;
    }
    .badge-low {
      background-color: #5cb85c;
    }
    .code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .confidence {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      margin-left: 10px;
    }
    .confidence-high {
      background-color: #dff0d8;
      color: #3c763d;
    }
    .confidence-medium {
      background-color: #fcf8e3;
      color: #8a6d3b;
    }
    .confidence-low {
      background-color: #f2dede;
      color: #a94442;
    }
  </style>
</head>
<body>
  <h1>TypeScript Errors Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total errors: ${fixes.length}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <h2>Errors</h2>
  ${fixes.map((fix, index) => `
    <div class="error-card">
      <div class="error-header">
        <h3>Error #${index + 1}: ${fix.error.errorCode}</h3>
        <span class="badge badge-${fix.error.severity.toLowerCase()}">${fix.error.severity}</span>
      </div>
      <div class="error-body">
        <div class="error-file">${fix.error.filePath}:${fix.error.lineNumber}:${fix.error.columnNumber}</div>
        <div class="error-message">${fix.error.messageText}</div>
        
        ${fix.fixedCode ? `
          <h4>Suggested Fix <span class="confidence confidence-${fix.confidence}">${fix.confidence} confidence</span></h4>
          <div class="error-fix">${fix.fixedCode}</div>
        ` : '<p>No fix suggested</p>'}
        
        ${fix.explanation ? `
          <h4>Explanation</h4>
          <div class="explanation">${fix.explanation}</div>
        ` : ''}
        
        ${fix.error.source ? `
          <h4>Context</h4>
          <div class="code">${fix.error.source}</div>
        ` : ''}
      </div>
    </div>
  `).join('')}
</body>
</html>
  `;
  
  // Write to file
  fs.writeFileSync(outputPath, htmlContent);
  
  return outputPath;
}

/**
 * Main function
 */
async function main() {
  console.log('TypeScript Error Fixer');
  console.log('---------------------');
  console.log(`Project directory: ${options.project}`);
  console.log(`Max errors: ${options.maxErrors}`);
  console.log(`Apply fixes: ${options.apply}`);
  console.log(`Use OpenAI: ${options.ai}`);
  console.log(`Generate report: ${options.report}`);
  console.log(`Verbose: ${options.verbose}`);
  console.log('');
  
  // Check if OpenAI API key is set when AI is enabled
  if (options.ai && !process.env.OPENAI_API_KEY) {
    console.error('Error: OpenAI API key not found in environment. Set OPENAI_API_KEY environment variable.');
    process.exit(1);
  }
  
  try {
    // PHASE 1: DETECTION
    console.log('PHASE 1: Finding TypeScript errors...');
    const errorResults = await findTypeScriptErrors({
      projectRoot: options.project,
      maxErrors: options.maxErrors,
      verbose: options.verbose
    });
    
    console.log(`Found ${errorResults.totalErrors} errors.`);
    
    if (errorResults.totalErrors === 0) {
      console.log('No errors found! Your TypeScript code is clean.');
      return;
    }
    
    // Log error summary
    console.log('\nError Summary:');
    console.log(errorResults.summary);
    
    // PHASE 2: ANALYSIS
    console.log('\nPHASE 2: Analyzing TypeScript errors...');
    const analysisResults = await analyzeTypeScriptErrors(errorResults.errors, {
      includeFileContext: true,
      contextLines: 5,
      detectPatterns: true,
      suggestImprovements: true,
      verbose: options.verbose
    });
    
    console.log(`Analyzed ${analysisResults.errors.length} errors.`);
    console.log(`Detected ${analysisResults.patterns.length} error patterns.`);
    
    // Display top error patterns
    if (analysisResults.patterns.length > 0) {
      console.log('\nTop Error Patterns:');
      analysisResults.patterns.slice(0, 3).forEach((pattern, index) => {
        console.log(`${index + 1}. ${pattern.name} (${pattern.occurrence} occurrences)`);
        console.log(`   ${pattern.description}`);
        if (pattern.suggestedFix) {
          console.log(`   Suggested fix: ${pattern.suggestedFix}`);
        }
        console.log('');
      });
    }
    
    // PHASE 3: RESOLUTION
    console.log('\nPHASE 3: Generating fixes...');
    let fixes = [];
    
    if (options.ai) {
      // Use OpenAI enhanced fixer
      console.log('Using OpenAI to generate fix suggestions...');
      
      // Select priority errors to fix with AI
      // For example, focus on high severity errors in application code (not tests or third-party)
      const priorityErrors = analysisResults.errors
        .filter(err => {
          const isPriority = (
            err.fixPriority === 'critical' || 
            err.fixPriority === 'high'
          ) && (
            !err.error.file.includes('node_modules') &&
            !err.error.file.includes('test') &&
            !err.error.file.includes('.d.ts')
          );
          
          return isPriority;
        })
        .map(err => err.error)
        .slice(0, Math.min(20, options.maxErrors)); // Limit to 20 for OpenAI costs
      
      console.log(`Selected ${priorityErrors.length} priority errors for AI fixing.`);
      
      // Convert errors to the format expected by the OpenAI fixer
      const convertedErrors = priorityErrors.map(convertErrorFormat);
      
      // Generate fixes using OpenAI
      fixes = await fixTypeScriptErrorsWithOpenAI(convertedErrors, {
        maxContextLines: 15,
        includeImports: true,
        enableExplanation: true,
        verbose: options.verbose
      });
      
      console.log(`Generated ${fixes.length} fix suggestions.`);
    } else {
      // Use basic fixes from analysis
      console.log('Using basic fix suggestions from analysis...');
      
      fixes = analysisResults.errors.map(analysis => ({
        error: convertErrorFormat(analysis.error),
        fixedCode: analysis.suggestedApproach || analysis.error.suggestedFix || '',
        explanation: analysis.suggestedApproach,
        confidence: 'medium',
      }));
      
      console.log(`Generated ${fixes.length} basic fix suggestions.`);
    }
    
    // Apply fixes if requested
    if (options.apply && fixes.length > 0) {
      console.log('\nApplying fixes...');
      
      // Only apply high confidence fixes automatically
      const highConfidenceFixes = fixes.filter(fix => 
        fix.confidence === 'high' && fix.fixedCode
      );
      
      if (highConfidenceFixes.length > 0) {
        console.log(`Applying ${highConfidenceFixes.length} high-confidence fixes...`);
        
        const result = applyMultipleFixesToFiles(highConfidenceFixes);
        
        console.log(`Applied ${result.success} fixes successfully.`);
        console.log(`Failed to apply ${result.failed} fixes.`);
      } else {
        console.log('No high-confidence fixes to apply.');
      }
    }
    
    // Generate report if requested
    if (options.report) {
      console.log('\nGenerating HTML report...');
      const reportPath = createHtmlReport(fixes);
      console.log(`Report generated at: ${reportPath}`);
    }
    
    // Print final summary
    console.log('\nFinal Summary:');
    console.log(`Found ${errorResults.totalErrors} TypeScript errors.`);
    console.log(`Generated ${fixes.length} fix suggestions.`);
    if (options.apply) {
      const appliedCount = fixes.filter(fix => fix.confidence === 'high').length;
      console.log(`Applied ${appliedCount} high-confidence fixes.`);
    }
    
    console.log('\nNext Steps:');
    if (options.report) {
      console.log('1. Review the HTML report for fix suggestions.');
    } else {
      console.log('1. Run with --report to generate a detailed HTML report.');
    }
    if (!options.apply) {
      console.log('2. Run with --fix to apply high-confidence fixes.');
    }
    console.log('3. Fix remaining errors manually.');
    console.log('4. Run TypeScript compiler to verify all errors are fixed.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});