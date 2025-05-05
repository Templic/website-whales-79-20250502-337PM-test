/**
 * Run OpenAI Enhanced TypeScript Error Fixer
 * 
 * This script uses the OpenAI-powered error fixer to analyze and fix TypeScript errors.
 */

import { findTypeScriptErrors, TypeScriptErrorDetail } from './advanced-ts-error-finder';
import { fixTypeScriptErrorsWithOpenAI, applyFixToFile, generateFixSummary, saveFixSuggestionsReport } from './server/utils/openai-enhanced-fixer';
import { TypeScriptError } from './server/utils/ts-error-analyzer';
import * as path from 'path';
import * as fs from 'fs';

// We're using the TypeScriptError interface from ts-error-analyzer.ts
// This serves as a bridge between TypeScriptErrorDetail from advanced-ts-error-finder.ts
// and what fixTypeScriptErrorsWithOpenAI expects

// Convert TypeScriptErrorDetail to TypeScriptError format
function convertErrorFormat(error: TypeScriptErrorDetail): TypeScriptError {
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

async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const directoryToScan = args[0] || '.';
    const fullPath = path.resolve(process.cwd(), directoryToScan);
    
    console.log(`Scanning TypeScript files in ${fullPath}...`);
    
    // Find all TypeScript errors
    const errorResults = await findTypeScriptErrors({
      projectRoot: fullPath,
      outputFormat: 'json',
      includeWarnings: false,
      verbose: true,
      useColors: true,
      maxErrors: 100,
      sortBy: 'severity'
    });
    
    if (!errorResults.errors || errorResults.errors.length === 0) {
      console.log('No TypeScript errors found!');
      return;
    }
    
    console.log(`Found ${errorResults.errors.length} TypeScript errors.`);
    
    // Filter errors that are worth fixing with OpenAI
    // This is just an example - you might want to adjust these criteria
    const errorsToFix = errorResults.errors.filter(error => {
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
    
    console.log(`Filtered to ${errorsToFix.length} fixable errors.`);
    
    if (errorsToFix.length === 0) {
      console.log('No suitable errors to fix with OpenAI.');
      return;
    }
    
    // If we have more than 10 errors, just take the most severe ones
    const prioritizedErrors = errorsToFix.length > 10 
      ? errorsToFix.slice(0, 10) 
      : errorsToFix;
    
    console.log(`Processing ${prioritizedErrors.length} errors with OpenAI...`);
    
    // Convert error format
    const convertedErrors = prioritizedErrors.map(convertErrorFormat);
    
    // Get fix suggestions from OpenAI
    const fixSuggestions = await fixTypeScriptErrorsWithOpenAI(convertedErrors, {
      maxContextLines: 20,
      enableExplanation: true,
      maxErrorsPerBatch: 3
    });
    
    console.log(`Received ${fixSuggestions.length} fix suggestions from OpenAI.`);
    
    // Apply high-confidence fixes automatically
    const highConfidenceFixes = fixSuggestions.filter(
      fix => fix.confidence === 'high' && !fix.requiresHumanReview
    );
    
    console.log(`Applying ${highConfidenceFixes.length} high-confidence fixes automatically...`);
    
    let appliedFixCount = 0;
    for (const fix of highConfidenceFixes) {
      const success = applyFixToFile(fix);
      if (success) {
        appliedFixCount++;
      }
    }
    
    console.log(`Successfully applied ${appliedFixCount} fixes.`);
    
    // Generate and save a report of all suggestions
    const reportPath = saveFixSuggestionsReport(
      fixSuggestions, 
      './openai-fix-suggestions.json'
    );
    
    // Display a summary
    console.log(generateFixSummary(fixSuggestions));
    console.log(`Full report saved to: ${reportPath}`);
    
    // Create a markdown file with code changes that need human review
    const reviewFixes = fixSuggestions.filter(
      fix => fix.requiresHumanReview || fix.confidence !== 'high'
    );
    
    if (reviewFixes.length > 0) {
      const reviewPath = './openai-fixes-for-review.md';
      let reviewContent = '# TypeScript Fixes Requiring Review\n\n';
      reviewContent += 'The following TypeScript errors have suggested fixes that require human review.\n\n';
      
      reviewFixes.forEach((fix, index) => {
        reviewContent += `## Fix ${index + 1}: ${fix.error.filePath}:${fix.error.lineNumber}\n\n`;
        reviewContent += `**Error:** ${fix.error.messageText}\n\n`;
        reviewContent += `**Confidence:** ${fix.confidence}\n\n`;
        reviewContent += `**Current code:**\n\`\`\`typescript\n${fix.error.source || 'Code not available'}\n\`\`\`\n\n`;
        reviewContent += `**Suggested fix:**\n\`\`\`typescript\n${fix.fixedCode}\n\`\`\`\n\n`;
        
        if (fix.explanation) {
          reviewContent += `**Explanation:**\n${fix.explanation}\n\n`;
        }
        
        reviewContent += '---\n\n';
      });
      
      fs.writeFileSync(reviewPath, reviewContent);
      console.log(`Fixes requiring review saved to: ${reviewPath}`);
    }
    
  } catch (error: any) {
    console.error('Error running OpenAI enhanced fixer:', error?.message || 'Unknown error');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});