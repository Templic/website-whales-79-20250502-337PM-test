#!/usr/bin/env tsx

/**
 * TypeScript Error Analyzer CLI
 * 
 * A command-line interface for analyzing TypeScript errors in a project.
 * This tool provides commands for analyzing, finding patterns, and fixing errors.
 */

import * as fs from 'fs';
import * as path from 'path';
import { analyzeProject } from '../server/utils/ts-error-analyzer';
import { findErrorPatterns, saveErrorPattern } from '../server/utils/ts-pattern-finder';
import { runDeepScan, runAdvancedAnalysis } from '../server/utils/advanced-ts-analyzer';
import { tsErrorStorage } from '../server/tsErrorStorage';
import { isOpenAIConfigured } from '../server/utils/openai-integration';

// Define command-line arguments
const args = process.argv.slice(2);
const command = args[0];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to print a header
function printHeader(text: string): void {
  console.log(`\n${colors.bright}${colors.blue}======== ${text} ========${colors.reset}\n`);
}

// Helper function to print a section
function printSection(text: string): void {
  console.log(`\n${colors.bright}${colors.cyan}--- ${text} ---${colors.reset}\n`);
}

// Helper function to check if argument exists
function hasArg(flag: string): boolean {
  return args.includes(flag);
}

// Helper function to get argument value
function getArgValue(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index < args.length - 1) {
    return args[index + 1];
  }
  return undefined;
}

// Helper function to print help
function printHelp(): void {
  printHeader('TypeScript Error Analyzer CLI');
  
  console.log(`
${colors.bright}USAGE:${colors.reset}
  ts-analyzer-cli <command> [options]

${colors.bright}COMMANDS:${colors.reset}
  ${colors.green}analyze${colors.reset}             Analyze the project for TypeScript errors
  ${colors.green}patterns${colors.reset}            Find common error patterns
  ${colors.green}stats${colors.reset}               Show error statistics
  ${colors.green}fix${colors.reset}                 Fix errors (if possible)
  ${colors.green}fix-file <filepath>${colors.reset} Fix errors in a specific file
  ${colors.green}verify${colors.reset}              Verify that fixes were successful
  ${colors.green}help${colors.reset}                Show this help message

${colors.bright}OPTIONS:${colors.reset}
  ${colors.yellow}-o, --output <file>${colors.reset}    Output results to a file
  ${colors.yellow}-d, --deep${colors.reset}             Perform deep analysis
  ${colors.yellow}--trace${colors.reset}                Enable symbol tracing (deep scan only)
  ${colors.yellow}--ai${colors.reset}                   Use AI to assist in analysis/fixing
  ${colors.yellow}-i, --input <file>${colors.reset}     Use existing analysis results
  ${colors.yellow}--auto${colors.reset}                 Fix without confirmation
  ${colors.yellow}--dryRun${colors.reset}               Show fixes without applying

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.blue}ts-analyzer-cli analyze${colors.reset}
  ${colors.blue}ts-analyzer-cli analyze --deep --ai${colors.reset}
  ${colors.blue}ts-analyzer-cli patterns -i analysis-results.json${colors.reset}
  ${colors.blue}ts-analyzer-cli fix --auto${colors.reset}
  ${colors.blue}ts-analyzer-cli fix-file src/components/Button.tsx${colors.reset}
  `);
}

// Helper function to save results to a file
function saveResultsToFile(results: any, filename?: string): void {
  const outputFile = filename || 'ts-analysis-results.json';
  try {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`${colors.green}Results saved to ${outputFile}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error saving results: ${error.message}${colors.reset}`);
  }
}

// Helper function to load results from a file
function loadResultsFromFile(filename: string): any {
  try {
    if (!fs.existsSync(filename)) {
      console.error(`${colors.red}File not found: ${filename}${colors.reset}`);
      process.exit(1);
    }
    
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`${colors.red}Error loading results: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Command: analyze
async function analyze(): Promise<void> {
  printHeader('Analyzing TypeScript Project');
  
  const isDeep = hasArg('--deep') || hasArg('-d');
  const useAI = hasArg('--ai');
  const traceSymbols = hasArg('--trace');
  const outputFile = getArgValue('--output') || getArgValue('-o');
  
  if (useAI && !isOpenAIConfigured()) {
    console.warn(`${colors.yellow}Warning: OPENAI_API_KEY is not set. AI features will be disabled.${colors.reset}`);
  }
  
  if (isDeep) {
    console.log(`${colors.yellow}Running deep analysis with dependency tracking...${colors.reset}`);
    
    const results = await runDeepScan({
      useAI,
      deepScan: true,
      traceSymbols
    });
    
    printSection('Analysis Results Summary');
    
    console.log(`Total Errors: ${colors.yellow}${results.basicResults.totalErrors}${colors.reset}`);
    console.log(`Root Cause Errors: ${colors.yellow}${results.advancedResults.rootCauseErrors}${colors.reset}`);
    console.log(`Cascading Errors: ${colors.yellow}${results.advancedResults.cascadingErrors}${colors.reset}`);
    console.log(`Independent Errors: ${colors.yellow}${results.advancedResults.independentErrors}${colors.reset}`);
    
    printSection('Errors by Category');
    
    for (const [category, count] of Object.entries(results.basicResults.errorsByCategory)) {
      console.log(`${category}: ${colors.yellow}${count}${colors.reset}`);
    }
    
    printSection('Errors by Severity');
    
    for (const [severity, count] of Object.entries(results.basicResults.errorsBySeverity)) {
      const color = severity === 'critical' ? colors.red :
                  severity === 'high' ? colors.yellow :
                  severity === 'medium' ? colors.blue :
                  colors.green;
      
      console.log(`${severity}: ${color}${count}${colors.reset}`);
    }
    
    printSection('Top Error Files');
    
    for (const { filePath, errorCount } of results.basicResults.topErrorFiles) {
      console.log(`${filePath}: ${colors.yellow}${errorCount}${colors.reset}`);
    }
    
    printSection('Error Patterns Found');
    
    if (results.patterns.length === 0) {
      console.log(`${colors.yellow}No patterns found.${colors.reset}`);
    } else {
      console.log(`Found ${colors.yellow}${results.patterns.length}${colors.reset} patterns.`);
      
      for (const pattern of results.patterns) {
        console.log(`\n${colors.bright}${pattern.name}${colors.reset} (${colors.cyan}${pattern.occurrences} occurrences${colors.reset})`);
        console.log(`${colors.dim}${pattern.description}${colors.reset}`);
        console.log(`Category: ${pattern.category}, Severity: ${pattern.severity}, Auto-fixable: ${pattern.autoFixable ? 'Yes' : 'No'}`);
      }
    }
    
    if (outputFile) {
      saveResultsToFile(results, outputFile);
    }
  } else {
    console.log(`${colors.yellow}Running basic analysis...${colors.reset}`);
    
    const results = await analyzeProject();
    
    printSection('Analysis Results Summary');
    
    console.log(`Total Errors: ${colors.yellow}${results.totalErrors}${colors.reset}`);
    
    printSection('Errors by Category');
    
    for (const [category, count] of Object.entries(results.errorsByCategory)) {
      console.log(`${category}: ${colors.yellow}${count}${colors.reset}`);
    }
    
    printSection('Errors by Severity');
    
    for (const [severity, count] of Object.entries(results.errorsBySeverity)) {
      const color = severity === 'critical' ? colors.red :
                  severity === 'high' ? colors.yellow :
                  severity === 'medium' ? colors.blue :
                  colors.green;
      
      console.log(`${severity}: ${color}${count}${colors.reset}`);
    }
    
    printSection('Top Error Files');
    
    for (const { filePath, errorCount } of results.topErrorFiles) {
      console.log(`${filePath}: ${colors.yellow}${errorCount}${colors.reset}`);
    }
    
    if (outputFile) {
      saveResultsToFile(results, outputFile);
    }
  }
}

// Command: patterns
async function findPatterns(): Promise<void> {
  printHeader('Finding Error Patterns');
  
  const inputFile = getArgValue('--input') || getArgValue('-i');
  const outputFile = getArgValue('--output') || getArgValue('-o');
  
  let analysisResults;
  
  if (inputFile) {
    analysisResults = loadResultsFromFile(inputFile);
  } else {
    console.log(`${colors.yellow}Running analysis to find patterns...${colors.reset}`);
    analysisResults = await analyzeProject();
  }
  
  console.log(`${colors.yellow}Finding patterns in ${analysisResults.totalErrors} errors...${colors.reset}`);
  
  const patterns = await findErrorPatterns(analysisResults);
  
  printSection('Error Patterns Found');
  
  if (patterns.length === 0) {
    console.log(`${colors.yellow}No patterns found.${colors.reset}`);
  } else {
    console.log(`Found ${colors.yellow}${patterns.length}${colors.reset} patterns.`);
    
    for (const pattern of patterns) {
      console.log(`\n${colors.bright}${pattern.name}${colors.reset} (${colors.cyan}${pattern.occurrences} occurrences${colors.reset})`);
      console.log(`${colors.dim}${pattern.description}${colors.reset}`);
      console.log(`Category: ${pattern.category}, Severity: ${pattern.severity}, Auto-fixable: ${pattern.autoFixable ? 'Yes' : 'No'}`);
      
      console.log('\nExample:');
      
      if (pattern.examples.length > 0) {
        const example = pattern.examples[0];
        console.log(`${colors.cyan}${example.filePath}:${example.lineNumber}${colors.reset} - ${example.errorMessage}`);
        if (example.errorContext) {
          console.log(`${colors.dim}${example.errorContext}${colors.reset}`);
        }
      }
      
      // Save pattern to database
      try {
        await saveErrorPattern(pattern);
      } catch (error) {
        console.error(`${colors.red}Error saving pattern: ${error.message}${colors.reset}`);
      }
    }
  }
  
  if (outputFile) {
    saveResultsToFile({ patterns }, outputFile);
  }
}

// Command: stats
async function showStats(): Promise<void> {
  printHeader('TypeScript Error Statistics');
  
  try {
    // Get error statistics
    const errorStats = await tsErrorStorage.getErrorStatistics();
    
    printSection('Error Counts');
    
    console.log(`Total Errors: ${colors.yellow}${errorStats.totalErrors}${colors.reset}`);
    console.log(`Active Errors: ${colors.yellow}${errorStats.activeErrors}${colors.reset}`);
    console.log(`Fixed Errors: ${colors.green}${errorStats.fixedErrors}${colors.reset}`);
    
    printSection('Errors by Category');
    
    for (const [category, count] of Object.entries(errorStats.errorsByCategory)) {
      console.log(`${category}: ${colors.yellow}${count}${colors.reset}`);
    }
    
    printSection('Errors by Severity');
    
    for (const [severity, count] of Object.entries(errorStats.errorsBySeverity)) {
      const color = severity === 'critical' ? colors.red :
                  severity === 'high' ? colors.yellow :
                  severity === 'medium' ? colors.blue :
                  colors.green;
      
      console.log(`${severity}: ${color}${count}${colors.reset}`);
    }
    
    printSection('Top Error Files');
    
    for (const { filePath, errorCount } of errorStats.topErrorFiles) {
      console.log(`${filePath}: ${colors.yellow}${errorCount}${colors.reset}`);
    }
    
    // Get pattern statistics
    const patternStats = await tsErrorStorage.getPatternStatistics();
    
    printSection('Pattern Statistics');
    
    console.log(`Total Patterns: ${colors.yellow}${patternStats.totalPatterns}${colors.reset}`);
    console.log(`Auto-fixable Patterns: ${colors.green}${patternStats.fixablePatterns}${colors.reset}`);
    console.log(`Patterns with Fixes: ${colors.green}${patternStats.patternsWithFixes}${colors.reset}`);
    
    printSection('Patterns by Category');
    
    for (const [category, count] of Object.entries(patternStats.patternsByCategory)) {
      console.log(`${category}: ${colors.yellow}${count}${colors.reset}`);
    }
    
    // Get fix statistics
    const fixStats = await tsErrorStorage.getFixStatistics();
    
    printSection('Fix Statistics');
    
    console.log(`Total Fixes Applied: ${colors.yellow}${fixStats.totalFixes}${colors.reset}`);
    console.log(`Successful Fixes: ${colors.green}${fixStats.successfulFixes}${colors.reset}`);
    console.log(`Failed Fixes: ${colors.red}${fixStats.failedFixes}${colors.reset}`);
    
    printSection('Fixes by Method');
    
    for (const [method, count] of Object.entries(fixStats.fixesByMethod)) {
      console.log(`${method}: ${colors.yellow}${count}${colors.reset}`);
    }
    
    const outputFile = getArgValue('--output') || getArgValue('-o');
    
    if (outputFile) {
      saveResultsToFile({
        errorStats,
        patternStats,
        fixStats
      }, outputFile);
    }
  } catch (error) {
    console.error(`${colors.red}Error getting statistics: ${error.message}${colors.reset}`);
  }
}

// Command: fix
async function fixErrors(): Promise<void> {
  printHeader('Fixing TypeScript Errors');
  
  const autoFix = hasArg('--auto');
  const dryRun = hasArg('--dryRun');
  const useAI = hasArg('--ai');
  const fixAll = hasArg('--all') || hasArg('-a');
  
  if (useAI && !isOpenAIConfigured()) {
    console.warn(`${colors.yellow}Warning: OPENAI_API_KEY is not set. AI features will be disabled.${colors.reset}`);
  }
  
  console.log(`${colors.yellow}Finding fixable errors...${colors.reset}`);
  
  try {
    const filter = fixAll ? {} : { status: 'detected' };
    const errors = await tsErrorStorage.getAllTypescriptErrors(filter);
    
    printSection('Errors to Fix');
    
    if (errors.length === 0) {
      console.log(`${colors.green}No errors to fix.${colors.reset}`);
      return;
    }
    
    console.log(`Found ${colors.yellow}${errors.length}${colors.reset} errors.`);
    
    // TODO: Add actual fixing logic here
    console.log(`\n${colors.yellow}Note: Fixing functionality is not fully implemented yet.${colors.reset}`);
    console.log(`This would fix errors ${dryRun ? 'in dry run mode' : 'in automatic mode'}.`);
    
    // If using AI, mention it
    if (useAI) {
      console.log(`Using AI assistance for ${colors.cyan}intelligent error fixing${colors.reset}.`);
    }
    
    // Mock fix process for now
    console.log(`\n${colors.dim}This would connect to the error fix functionality.${colors.reset}`);
    console.log(`${colors.dim}To implement in the future: automatic error fixing.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error fixing errors: ${error.message}${colors.reset}`);
  }
}

// Command: fix-file
async function fixFile(): Promise<void> {
  const filepath = args[1];
  
  if (!filepath) {
    console.error(`${colors.red}Error: File path is required${colors.reset}`);
    process.exit(1);
  }
  
  printHeader(`Fixing Errors in ${filepath}`);
  
  const dryRun = hasArg('--dryRun');
  const useAI = hasArg('--ai');
  
  if (useAI && !isOpenAIConfigured()) {
    console.warn(`${colors.yellow}Warning: OPENAI_API_KEY is not set. AI features will be disabled.${colors.reset}`);
  }
  
  if (!fs.existsSync(filepath)) {
    console.error(`${colors.red}Error: File not found: ${filepath}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.yellow}Finding errors in file...${colors.reset}`);
  
  try {
    // Get errors for this file
    const errors = await tsErrorStorage.getAllTypescriptErrors({
      filePath: filepath
    });
    
    if (errors.length === 0) {
      console.log(`${colors.green}No errors found in file.${colors.reset}`);
      return;
    }
    
    console.log(`Found ${colors.yellow}${errors.length}${colors.reset} errors in file.`);
    
    // TODO: Add actual fixing logic here
    console.log(`\n${colors.yellow}Note: Fixing functionality is not fully implemented yet.${colors.reset}`);
    console.log(`This would fix errors in ${colors.cyan}${filepath}${colors.reset} ${dryRun ? 'in dry run mode' : 'in automatic mode'}.`);
    
    // If using AI, mention it
    if (useAI) {
      console.log(`Using AI assistance for ${colors.cyan}intelligent error fixing${colors.reset}.`);
    }
    
    // Mock fix process for now
    console.log(`\n${colors.dim}This would connect to the error fix functionality.${colors.reset}`);
    console.log(`${colors.dim}To implement in the future: file-specific error fixing.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error fixing file: ${error.message}${colors.reset}`);
  }
}

// Command: verify
async function verifyFixes(): Promise<void> {
  printHeader('Verifying Fixes');
  
  console.log(`${colors.yellow}Running analysis to verify fixes...${colors.reset}`);
  
  try {
    // Get error statistics
    const errorStats = await tsErrorStorage.getErrorStatistics();
    
    printSection('Fix Status');
    
    console.log(`Total Errors: ${colors.yellow}${errorStats.totalErrors}${colors.reset}`);
    console.log(`Fixed Errors: ${colors.green}${errorStats.fixedErrors}${colors.reset}`);
    console.log(`Remaining Errors: ${colors.red}${errorStats.activeErrors}${colors.reset}`);
    
    // Get fix statistics
    const fixStats = await tsErrorStorage.getFixStatistics();
    
    console.log(`\nTotal Fixes Applied: ${colors.yellow}${fixStats.totalFixes}${colors.reset}`);
    console.log(`Successful Fixes: ${colors.green}${fixStats.successfulFixes}${colors.reset}`);
    console.log(`Failed Fixes: ${colors.red}${fixStats.failedFixes}${colors.reset}`);
    
    // Calculate success rate
    const successRate = fixStats.totalFixes > 0 
      ? (fixStats.successfulFixes / fixStats.totalFixes) * 100 
      : 0;
    
    console.log(`\nFix Success Rate: ${colors.yellow}${successRate.toFixed(2)}%${colors.reset}`);
    
    // Check for regressions
    printSection('Regression Check');
    
    console.log(`${colors.yellow}Checking for regressions...${colors.reset}`);
    
    const results = await analyzeProject();
    
    if (results.totalErrors === 0) {
      console.log(`${colors.green}No TypeScript errors found. All fixes are successful!${colors.reset}`);
    } else if (results.totalErrors < errorStats.totalErrors) {
      console.log(`${colors.green}Progress made!${colors.reset} Reduced from ${errorStats.totalErrors} to ${results.totalErrors} errors.`);
    } else if (results.totalErrors > errorStats.totalErrors) {
      console.log(`${colors.red}Regression detected!${colors.reset} Increased from ${errorStats.totalErrors} to ${results.totalErrors} errors.`);
    } else {
      console.log(`${colors.yellow}No change in error count.${colors.reset} Still have ${results.totalErrors} errors.`);
    }
  } catch (error) {
    console.error(`${colors.red}Error verifying fixes: ${error.message}${colors.reset}`);
  }
}

// Main function
async function main(): Promise<void> {
  switch (command) {
    case 'analyze':
      await analyze();
      break;
    case 'patterns':
      await findPatterns();
      break;
    case 'stats':
      await showStats();
      break;
    case 'fix':
      await fixErrors();
      break;
    case 'fix-file':
      await fixFile();
      break;
    case 'verify':
      await verifyFixes();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      printHelp();
      process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});