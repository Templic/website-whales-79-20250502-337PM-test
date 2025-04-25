#!/usr/bin/env node

/**
 * TypeScript Error Analysis Script
 * 
 * This script runs an advanced analysis of TypeScript errors in the project
 * and generates a comprehensive report with root cause analysis and fix suggestions.
 */

import { analyzeAndReportTypeScriptErrors } from '../server/utils/advanced-ts-analyzer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
let outputPath = path.join(projectRoot, 'typescript-error-analysis.md');
let tsConfigPath = path.join(projectRoot, 'tsconfig.json');
let includePaths = [];
let excludePaths = ['node_modules', 'dist', 'build'];
let maxErrors = 1000;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--output' || arg === '-o') {
    outputPath = args[++i];
  } else if (arg === '--tsconfig' || arg === '-t') {
    tsConfigPath = args[++i];
  } else if (arg === '--include' || arg === '-i') {
    includePaths = args[++i].split(',');
  } else if (arg === '--exclude' || arg === '-e') {
    excludePaths = args[++i].split(',');
  } else if (arg === '--max' || arg === '-m') {
    maxErrors = parseInt(args[++i], 10);
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Make sure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Display help
function showHelp() {
  console.log(`
TypeScript Error Analyzer
=========================

A tool to analyze TypeScript errors, identify root causes, and suggest fixes.

Usage:
  node analyze-typescript-errors.js [options]

Options:
  --output, -o    Output file path (default: typescript-error-analysis.md)
  --tsconfig, -t  Path to tsconfig.json (default: tsconfig.json)
  --include, -i   Comma-separated list of directories to include
  --exclude, -e   Comma-separated list of directories to exclude (default: node_modules,dist,build)
  --max, -m       Maximum number of errors to analyze (default: 1000)
  --help, -h      Show this help message

Examples:
  node analyze-typescript-errors.js
  node analyze-typescript-errors.js --output reports/error-analysis.md
  node analyze-typescript-errors.js --include server,client --max 500
  `);
}

// Run the analysis
async function main() {
  try {
    console.log('TypeScript Error Analyzer');
    console.log('========================');
    console.log(`Project: ${projectRoot}`);
    console.log(`Output: ${outputPath}`);
    console.log(`TSConfig: ${tsConfigPath}`);
    
    if (includePaths.length > 0) {
      console.log(`Include Paths: ${includePaths.join(', ')}`);
    }
    
    console.log(`Exclude Paths: ${excludePaths.join(', ')}`);
    console.log(`Max Errors: ${maxErrors}`);
    console.log('');
    
    await analyzeAndReportTypeScriptErrors(
      projectRoot,
      {
        outputPath,
        tsConfigPath,
        includePaths,
        excludePaths,
        maxErrors
      }
    );
    
    console.log('\nAnalysis complete!');
    console.log(`Report saved to: ${outputPath}`);
    console.log(`JSON data saved to: ${outputPath.replace(/\.\w+$/, '.json')}`);
    
  } catch (error) {
    console.error('Error running TypeScript error analysis:', error);
    process.exit(1);
  }
}

// Execute main function
main();