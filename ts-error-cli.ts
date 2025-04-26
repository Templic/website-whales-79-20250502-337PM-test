#!/usr/bin/env ts-node
/**
 * TypeScript Error Management System - CLI Tool
 * 
 * A command-line interface for running the three-phase TypeScript error management system.
 * This tool coordinates the existing utilities and provides a simple interface for users.
 * 
 * Usage:
 *   ts-node ts-error-cli.ts <command> [options]
 * 
 * Commands:
 *   scan           Scan the project for TypeScript errors
 *   analyze        Analyze detected errors
 *   fix            Apply fixes to detected errors
 *   run-all        Run the complete three-phase process
 *   stats          Show error statistics
 *   dashboard      Show error dashboard (console-based)
 * 
 * Global options:
 *   --project <dir>   Project directory (default: current directory)
 *   --config <file>   Path to tsconfig.json
 *   --help            Show help information
 * 
 * Examples:
 *   ts-node ts-error-cli.ts scan
 *   ts-node ts-error-cli.ts analyze --deep --ai
 *   ts-node ts-error-cli.ts fix --dry-run
 *   ts-node ts-error-cli.ts run-all --deep
 */

import { runDetectionPhase, runAnalysisPhase, runFixPhase } from './run-typescript-error-system';
import * as tsErrorStorage from './server/tsErrorStorage';
import path from 'path';
import fs from 'fs';

// Command-line argument parsing (simplified)
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
const options: Record<string, any> = {
  project: '.',
  config: undefined,
  dryRun: true,
  deep: false,
  ai: false,
  limit: 100,
  format: 'console'
};

// Parse options
for (let i = 1; i < args.length; i++) {
  const arg = args[i].toLowerCase();
  
  if (arg === '--project' && i + 1 < args.length) {
    options.project = args[++i];
  } else if (arg === '--config' && i + 1 < args.length) {
    options.config = args[++i];
  } else if (arg === '--apply') {
    options.dryRun = false;
  } else if (arg === '--deep') {
    options.deep = true;
  } else if (arg === '--ai') {
    options.ai = true;
  } else if (arg === '--limit' && i + 1 < args.length) {
    options.limit = parseInt(args[++i], 10);
  } else if (arg === '--format' && i + 1 < args.length) {
    options.format = args[++i];
  } else if (arg === '--help') {
    showHelp();
    process.exit(0);
  }
}

// If no config is specified, try to find it in the project directory
if (!options.config) {
  const defaultConfig = path.join(options.project, 'tsconfig.json');
  if (fs.existsSync(defaultConfig)) {
    options.config = defaultConfig;
  }
}

// Print banner
console.log('=================================================================');
console.log('TypeScript Error Management System - Three-Phase Error Resolution');
console.log('=================================================================');

async function main() {
  try {
    if (!command) {
      console.log('No command specified. Use --help for usage information.');
      process.exit(1);
    }
    
    switch (command) {
      case 'scan':
        await runScanCommand();
        break;
      case 'analyze':
        await runAnalyzeCommand();
        break;
      case 'fix':
        await runFixCommand();
        break;
      case 'run-all':
        await runAllCommand();
        break;
      case 'stats':
        await showStats();
        break;
      case 'dashboard':
        await showDashboard();
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Use --help for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error executing command:', error);
    process.exit(1);
  }
}

async function runScanCommand() {
  console.log(`Scanning project for TypeScript errors: ${options.project}`);
  console.log(`Using config: ${options.config || 'auto-detected'}`);
  
  const scanResult = await runDetectionPhase();
  
  console.log('\nScan completed successfully.');
  console.log('Run "analyze" command next to analyze the detected errors.');
}

async function runAnalyzeCommand() {
  console.log(`Analyzing TypeScript errors for project: ${options.project}`);
  console.log(`Using deep analysis: ${options.deep}`);
  console.log(`Using AI-assisted analysis: ${options.ai}`);
  
  const scanResult = {}; // Placeholder - analysis will load from database
  const analysisResult = await runAnalysisPhase(scanResult);
  
  console.log('\nAnalysis completed successfully.');
  console.log('Run "fix" command next to apply fixes for the analyzed errors.');
  
  return analysisResult;
}

async function runFixCommand() {
  console.log(`Fixing TypeScript errors for project: ${options.project}`);
  console.log(`Dry run mode: ${options.dryRun}`);
  
  // Get minimal analysis data to drive the fix phase
  const errors = await tsErrorStorage.getAllTypeScriptErrors({
    status: 'detected',
    limit: options.limit
  });
  
  if (errors.length === 0) {
    console.log('\nNo errors found to fix. Run "scan" command first to detect errors.');
    return;
  }
  
  console.log(`Found ${errors.length} errors to process.`);
  
  // Use existing functions from run-typescript-error-system.ts
  const analysisResult = await runAnalyzeCommand();
  const fixResults = await runFixPhase(analysisResult);
  
  console.log('\nFix process completed.');
  if (options.dryRun) {
    console.log('To apply the fixes, run the command again with --apply option.');
  } else {
    console.log('Fixes have been applied to the source files.');
  }
}

async function runAllCommand() {
  console.log(`Running complete TypeScript error management process:`);
  console.log(`Project: ${options.project}`);
  console.log(`Config: ${options.config || 'auto-detected'}`);
  console.log(`Deep analysis: ${options.deep}`);
  console.log(`AI-assisted: ${options.ai}`);
  console.log(`Apply fixes: ${!options.dryRun}`);
  
  // Run all three phases
  const scanResult = await runDetectionPhase();
  const analysisResult = await runAnalysisPhase(scanResult);
  const fixResults = await runFixPhase(analysisResult);
  
  console.log('\nComplete process finished successfully.');
  
  // Suggest next steps
  if (options.dryRun) {
    console.log('\nRecommended next steps:');
    console.log('1. Review the suggested fixes');
    console.log('2. Run the command again with --apply to apply the fixes');
  } else {
    console.log('\nRecommended next steps:');
    console.log('1. Compile the project: tsc --noEmit');
    console.log('2. Run tests to ensure fixes did not break functionality');
  }
}

async function showStats() {
  console.log('TypeScript Error Statistics');
  console.log('==========================');
  
  try {
    // Get error counts by status
    const errorCounts = await tsErrorStorage.getErrorCountsByStatus();
    console.log('\nError counts by status:');
    for (const [status, count] of Object.entries(errorCounts)) {
      console.log(`  ${status}: ${count}`);
    }
    
    // Get error counts by category
    const categoryCounts = await tsErrorStorage.getErrorCountsByCategory();
    console.log('\nError counts by category:');
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`  ${category}: ${count}`);
    }
    
    // Get error counts by severity
    const severityCounts = await tsErrorStorage.getErrorCountsBySeverity();
    console.log('\nError counts by severity:');
    for (const [severity, count] of Object.entries(severityCounts)) {
      console.log(`  ${severity}: ${count}`);
    }
    
    // Get top files with errors
    const topFiles = await tsErrorStorage.getTopFilesWithErrors(10);
    console.log('\nTop files with errors:');
    for (const [file, count] of Object.entries(topFiles)) {
      console.log(`  ${file}: ${count}`);
    }
    
    // Get recent analyses
    const recentAnalyses = await tsErrorStorage.getRecentProjectAnalyses(5);
    console.log('\nRecent project analyses:');
    for (const analysis of recentAnalyses) {
      console.log(`  ID: ${analysis.id}, Date: ${analysis.date}, Errors: ${analysis.errorCount}`);
    }
    
  } catch (error) {
    console.error('Error retrieving statistics:', error);
  }
}

async function showDashboard() {
  console.log('TypeScript Error Dashboard');
  console.log('=========================');
  console.log('Fetching latest error data...');
  
  try {
    // Get error counts
    const errorCounts = await tsErrorStorage.getErrorCountsByStatus();
    const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + (count as number), 0);
    
    // Get errors by severity
    const severityCounts = await tsErrorStorage.getErrorCountsBySeverity();
    
    // Get errors by category
    const categoryCounts = await tsErrorStorage.getErrorCountsByCategory();
    
    // Display dashboard
    console.log(`\nTotal errors: ${totalErrors}`);
    
    // Display severity bars
    console.log('\nErrors by severity:');
    for (const [severity, count] of Object.entries(severityCounts)) {
      const percentage = totalErrors > 0 ? (count as number) / totalErrors * 100 : 0;
      const bar = '#'.repeat(Math.floor(percentage / 2));
      console.log(`  ${severity.padEnd(10)} [${bar.padEnd(50)}] ${count} (${percentage.toFixed(1)}%)`);
    }
    
    // Display category bars
    console.log('\nErrors by category:');
    for (const [category, count] of Object.entries(categoryCounts)) {
      const percentage = totalErrors > 0 ? (count as number) / totalErrors * 100 : 0;
      const bar = '#'.repeat(Math.floor(percentage / 2));
      console.log(`  ${category.padEnd(20)} [${bar.padEnd(50)}] ${count} (${percentage.toFixed(1)}%)`);
    }
    
    // Get fix rate
    const fixedCount = errorCounts['fixed'] || 0;
    const fixRate = totalErrors > 0 ? (fixedCount as number) / totalErrors * 100 : 0;
    
    console.log(`\nFix progress: ${fixedCount}/${totalErrors} (${fixRate.toFixed(1)}%)`);
    const progressBar = '='.repeat(Math.floor(fixRate / 2));
    console.log(`  [${'='.repeat(Math.floor(fixRate / 2)).padEnd(50)}]`);
    
    // Recommend next action
    console.log('\nRecommended actions:');
    if (fixRate < 100) {
      console.log('1. Run "ts-error-cli.ts fix" to fix remaining errors');
    } else {
      console.log('1. All errors fixed! Run a full TypeScript check to verify: tsc --noEmit');
    }
    
  } catch (error) {
    console.error('Error displaying dashboard:', error);
  }
}

function showHelp() {
  console.log(`
Usage: ts-node ts-error-cli.ts <command> [options]

Commands:
  scan           Scan the project for TypeScript errors
  analyze        Analyze detected errors
  fix            Apply fixes to detected errors
  run-all        Run the complete three-phase process
  stats          Show error statistics
  dashboard      Show error dashboard (console-based)
  help           Show this help information

Global options:
  --project <dir>   Project directory (default: current directory)
  --config <file>   Path to tsconfig.json (default: <project>/tsconfig.json)
  --apply           Apply fixes (default: dry-run mode)
  --deep            Perform deep analysis with dependency tracking
  --ai              Use AI-assisted analysis and fixes
  --limit <n>       Limit the number of errors to process (default: 100)
  --format <fmt>    Output format: console, json, markdown (default: console)
  --help            Show help information

Examples:
  ts-node ts-error-cli.ts scan --project ./my-project
  ts-node ts-error-cli.ts analyze --deep --ai
  ts-node ts-error-cli.ts fix --apply
  ts-node ts-error-cli.ts run-all --deep --apply
  `);
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});