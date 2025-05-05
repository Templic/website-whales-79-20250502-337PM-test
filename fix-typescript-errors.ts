/**
 * TypeScript Error Fixer with OpenAI Integration
 * 
 * This script provides an end-to-end solution for finding and fixing TypeScript errors
 * using both standard programmatic approaches and OpenAI-powered suggestions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { findTypeScriptErrors, TypeScriptErrorDetail } from './advanced-ts-error-finder';
import { analyzeTypeScriptErrors, ErrorSeverity, ErrorCategory } from './server/utils/ts-error-analyzer';
import { fixTypeScriptErrorsWithOpenAI, saveFixSuggestionsReport, generateFixSummary } from './server/utils/openai-enhanced-fixer';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Function to convert error format from the finder to what the OpenAI fixer expects
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

// Apply a fix to a file
function applyFix(filePath: string, lineNumber: number, newCode: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[Fix] File not found: ${filePath}`);
      return false;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Replace the line with the fixed code
    lines[lineNumber - 1] = newCode;
    
    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    
    console.log(`[Fix] Fixed error in ${filePath}:${lineNumber}`);
    return true;
  } catch (error: any) {
    console.error(`[Fix] Error applying fix to ${filePath}:${lineNumber}:`, error?.message || 'Unknown error');
    return false;
  }
}

// Create a user-friendly HTML report of fixes
function createHtmlReport(fixes: any[], outputPath: string = './typescript-fixes-report.html'): string {
  const reportDate = new Date().toLocaleString();
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript Error Fixes Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; }
    h1, h2, h3 { color: #2c3e50; }
    .fix { background-color: #f8f9fa; border-left: 4px solid #4299e1; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
    .fix.applied { border-left-color: #48bb78; }
    .fix.pending { border-left-color: #ed8936; }
    .file-path { color: #718096; font-family: monospace; font-size: 0.9em; }
    .code { background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
    .error-message { color: #e53e3e; }
    .confidence { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; }
    .confidence.high { background-color: #c6f6d5; color: #22543d; }
    .confidence.medium { background-color: #feebc8; color: #744210; }
    .confidence.low { background-color: #fed7d7; color: #822727; }
    .status { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px; }
    .status.applied { background-color: #c6f6d5; color: #22543d; }
    .status.pending { background-color: #feebc8; color: #744210; }
    .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .summary-card { background-color: #f8f9fa; padding: 15px; border-radius: 4px; }
    @media (max-width: 768px) {
      .summary { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <h1>TypeScript Error Fixes Report</h1>
  <p>Generated on ${reportDate}</p>
  
  <div class="summary">
    <div class="summary-card">
      <h3>Total Fixes</h3>
      <p>${fixes.length}</p>
    </div>
    <div class="summary-card">
      <h3>Applied Fixes</h3>
      <p>${fixes.filter(f => f.applied).length}</p>
    </div>
    <div class="summary-card">
      <h3>Pending Fixes</h3>
      <p>${fixes.filter(f => !f.applied).length}</p>
    </div>
  </div>
  
  <h2>Fixes</h2>
  `;
  
  fixes.forEach((fix, index) => {
    const confidenceClass = fix.confidence || 'medium';
    const statusClass = fix.applied ? 'applied' : 'pending';
    const statusText = fix.applied ? 'Applied' : 'Needs Review';
    
    html += `
    <div class="fix ${statusClass}">
      <h3>Fix ${index + 1}: 
        <span class="confidence ${confidenceClass}">${fix.confidence || 'Medium'}</span>
        <span class="status ${statusClass}">${statusText}</span>
      </h3>
      <p class="file-path">${fix.error.filePath}:${fix.error.lineNumber}</p>
      <p class="error-message">${fix.error.messageText}</p>
      
      <h4>Original Code</h4>
      <pre class="code">${fix.error.source || 'Code not available'}</pre>
      
      <h4>Fixed Code</h4>
      <pre class="code">${fix.fixedCode}</pre>
      `;
      
    if (fix.explanation) {
      html += `
      <h4>Explanation</h4>
      <p>${fix.explanation}</p>
      `;
    }
    
    html += `</div>`;
  });
  
  html += `
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath, html);
  return outputPath;
}

async function main() {
  try {
    console.log('TypeScript Error Fixer with OpenAI Integration');
    console.log('============================================\n');
    
    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.');
      console.log('You can add it to a .env file or set it in your environment.');
      process.exit(1);
    }
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const directoryToScan = args[0] || '.';
    const fullPath = path.resolve(process.cwd(), directoryToScan);
    
    console.log(`Scanning for TypeScript errors in: ${fullPath}`);
    
    // Step 1: Find errors
    console.log('\n📋 Finding TypeScript errors...');
    const errorResults = await findTypeScriptErrors({
      projectRoot: fullPath,
      outputFormat: 'json',
      includeWarnings: false,
      verbose: true,
      maxErrors: 100,
      sortBy: 'severity'
    });
    
    if (!errorResults.errors || errorResults.errors.length === 0) {
      console.log('✅ No TypeScript errors found!');
      return;
    }
    
    console.log(`Found ${errorResults.errors.length} TypeScript errors.`);
    
    // Step 2: Analyze errors
    console.log('\n🔍 Analyzing errors...');
    const analysisResults = await analyzeTypeScriptErrors(errorResults.errors, {
      includeFileContext: true,
      contextLines: 5
    });
    
    console.log(analysisResults.summary);
    
    // Step 3: Filter errors for OpenAI analysis
    console.log('\n🧠 Selecting errors for AI analysis...');
    const errorsForAI = errorResults.errors.filter(error => {
      // Skip errors related to missing modules or imports
      if (error.message.includes('Cannot find module') || 
          error.message.includes('Cannot find name') ||
          error.message.includes('has no exported member')) {
        return false;
      }
      
      // Focus on type-related errors, which are often subtle and good candidates for AI analysis
      const isTypeError = error.message.includes('Type') || 
                         error.code.startsWith('TS2') || 
                         error.category.includes('TYPE');
      
      // Filter out errors in node_modules or generated code
      const isInUserCode = !error.file.includes('node_modules') && 
                          !error.file.includes('.d.ts') &&
                          !error.file.includes('generated');
      
      return isTypeError && isInUserCode;
    });
    
    console.log(`Selected ${errorsForAI.length} errors for AI analysis.`);
    
    if (errorsForAI.length === 0) {
      console.log('No suitable errors for AI analysis. Exiting.');
      return;
    }
    
    // Limit to top 20 errors for processing
    const prioritizedErrors = errorsForAI.slice(0, 20);
    
    // Step 4: Process with OpenAI
    console.log('\n🤖 Processing errors with OpenAI...');
    const convertedErrors = prioritizedErrors.map(convertErrorFormat);
    
    // Get fix suggestions from OpenAI
    const fixes = await fixTypeScriptErrorsWithOpenAI(convertedErrors, {
      maxContextLines: 20,
      enableExplanation: true,
      maxErrorsPerBatch: 3
    });
    
    console.log(`Received ${fixes.length} fix suggestions from OpenAI.`);
    
    // Step 5: Apply high-confidence fixes
    console.log('\n🔧 Applying high-confidence fixes...');
    const highConfidenceFixes = fixes.filter(
      fix => fix.confidence === 'high' && !fix.requiresHumanReview
    );
    
    console.log(`Found ${highConfidenceFixes.length} high-confidence fixes.`);
    
    // Apply fixes and track results
    const fixResults = [];
    
    for (const fix of fixes) {
      const shouldAutoApply = fix.confidence === 'high' && !fix.requiresHumanReview;
      let applied = false;
      
      if (shouldAutoApply) {
        applied = applyFix(fix.error.filePath, fix.error.lineNumber, fix.fixedCode);
        console.log(`${applied ? '✅' : '❌'} ${fix.error.filePath}:${fix.error.lineNumber}`);
      }
      
      fixResults.push({
        ...fix,
        applied
      });
    }
    
    // Step 6: Generate reports
    console.log('\n📊 Generating reports...');
    
    // Generate and save a JSON report
    const jsonReportPath = saveFixSuggestionsReport(
      fixes, 
      './typescript-fixes-suggestions.json'
    );
    
    // Generate an HTML report
    const htmlReportPath = createHtmlReport(fixResults);
    
    // Display summary
    console.log(generateFixSummary(fixes));
    console.log(`\nReports saved to:
- JSON: ${jsonReportPath}
- HTML: ${htmlReportPath}
    `);
    
    console.log('\n✨ TypeScript error fixing process complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error running the fixer:', error?.message || 'Unknown error');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});