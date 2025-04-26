/**
 * TypeScript Error Management System - Three-Phase Executor
 * 
 * This script orchestrates the three-phase approach to TypeScript error management
 * using the existing utility functions:
 * 
 * Phase 1: Detection - Uses ts-error-finder.ts
 * Phase 2: Analysis - Uses ts-error-analyzer.ts and ts-type-analyzer.ts
 * Phase 3: Resolution - Uses ts-batch-fixer.ts and ts-error-fixer.ts
 * 
 * Usage: ts-node typescript-error-management.ts [command] [options]
 * 
 * Commands:
 *   scan              Scan for TypeScript errors (Phase 1)
 *   analyze           Analyze detected errors (Phase 2)
 *   fix               Apply fixes to errors (Phase 3)
 *   full              Execute all three phases in sequence
 * 
 * Global Options:
 *   --project <dir>   Project root directory
 *   --verbose         Show detailed output
 *   --help            Show help information
 */

import * as path from 'path';
import * as fs from 'fs';

// Import existing utilities
import { findTypeScriptErrors, createProjectAnalysis } from './server/utils/ts-error-finder';
import { analyzeTypeScriptErrors } from './server/utils/ts-error-analyzer';
import { buildErrorDependencyGraph, topologicalSortErrors, clusterErrorsByRootCause } from './server/utils/ts-batch-fixer';
import * as tsErrorStorage from './server/tsErrorStorage';
import * as tsErrorFixer from './server/utils/ts-error-fixer';
import * as openAI from './server/utils/openai-integration';
import * as tsTypeAnalyzer from './server/utils/ts-type-analyzer';

// Command-line argument parsing
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
const options: Record<string, any> = {
  projectRoot: '.',
  verbose: false,
  deep: false,
  ai: false,
  dryRun: true,
  maxErrors: 50
};

// Parse command-line arguments
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--project':
      options.projectRoot = args[++i] || '.';
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--deep':
      options.deep = true;
      break;
    case '--ai':
      options.ai = true;
      break;
    case '--apply':
      options.dryRun = false;
      break;
    case '--max-errors':
      options.maxErrors = parseInt(args[++i] || '50');
      break;
    case '--help':
      showHelp();
      process.exit(0);
      break;
  }
}

// Show help text
function showHelp() {
  console.log(`
TypeScript Error Management System - Three-Phase Executor

Usage: ts-node typescript-error-management.ts [command] [options]

Commands:
  scan              Scan for TypeScript errors (Phase 1)
  analyze           Analyze detected errors (Phase 2)
  fix               Apply fixes to errors (Phase 3)
  full              Execute all three phases in sequence

Global Options:
  --project <dir>   Project root directory
  --verbose         Show detailed output
  --deep            Perform deep analysis with dependency tracking
  --ai              Use AI for error analysis (requires OPENAI_API_KEY)
  --apply           Apply fixes (by default, runs in dry-run mode)
  --max-errors <n>  Maximum number of errors to process (default: 50)
  --help            Show this help information
  `);
}

// Phase 1: Error Detection
async function executeErrorDetection() {
  console.log('=== Phase 1: TypeScript Error Detection ===');
  console.time('Detection Phase');
  
  const scanResult = await findTypeScriptErrors({
    projectRoot: options.projectRoot,
    includeNodeModules: false,
    severity: 'high'
  });
  
  console.log(`\nDetection Results:`);
  console.log(`Found ${scanResult.errorCount} errors and ${scanResult.warningCount} warnings.`);
  console.log(`Errors found in ${Object.keys(scanResult.errorsByFile).length} files.`);
  
  if (options.verbose) {
    console.log('\nTop files with errors:');
    const topFiles = Object.entries(scanResult.errorsByFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [file, count] of topFiles) {
      const relativePath = path.relative(options.projectRoot, file);
      console.log(`  ${relativePath}: ${count} errors`);
    }
  }
  
  // Create project analysis record
  const analysisId = await createProjectAnalysis(scanResult);
  console.log(`\nProject analysis created with ID: ${analysisId}`);
  
  console.timeEnd('Detection Phase');
  return { scanResult, analysisId };
}

// Phase 2: Error Analysis
async function executeErrorAnalysis() {
  console.log('\n=== Phase 2: TypeScript Error Analysis ===');
  console.time('Analysis Phase');
  
  // Get all errors from database
  const allErrors = await tsErrorStorage.getAllTypeScriptErrors({ 
    status: 'detected',
    limit: options.maxErrors
  });
  
  console.log(`Analyzing ${allErrors.length} detected errors...`);
  
  // Dependency analysis
  if (options.deep) {
    console.log('\nPerforming deep dependency analysis...');
    
    const dependencyGraph = buildErrorDependencyGraph(allErrors);
    const sortedErrorIds = topologicalSortErrors(dependencyGraph);
    console.log(`✓ Errors sorted by dependency order. Root causes will be fixed first.`);
    
    // Cluster errors by root cause
    const errorGroups = clusterErrorsByRootCause(allErrors);
    console.log(`✓ Found ${errorGroups.length} error groups with similar root causes.`);
    
    // Display top error groups
    console.log('\nTop 5 error groups by priority:');
    for (let i = 0; i < Math.min(5, errorGroups.length); i++) {
      const group = errorGroups[i];
      console.log(`${i+1}. ${group.rootCause} (${group.errors.length} errors)`);
    }
    
    // Type hierarchy analysis
    console.log('\nAnalyzing TypeScript type hierarchy...');
    try {
      const typeHierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(options.projectRoot);
      console.log(`✓ Type analysis complete.`);
      
      if (options.verbose && typeHierarchy.missingTypes && typeHierarchy.missingTypes.length > 0) {
        console.log('\nMissing types detected:');
        for (let i = 0; i < Math.min(5, typeHierarchy.missingTypes.length); i++) {
          console.log(`  - ${typeHierarchy.missingTypes[i]}`);
        }
      }
    } catch (error) {
      console.error(`Failed to analyze type hierarchy: ${error.message}`);
    }
  }
  
  // AI-assisted analysis if requested
  if (options.ai) {
    if (!process.env.OPENAI_API_KEY) {
      console.log('\nOpenAI analysis requested but API key not found.');
      console.log('Please set the OPENAI_API_KEY environment variable to enable AI-assisted analysis.');
    } else {
      console.log('\nPerforming AI-assisted analysis on selected errors...');
      
      // Select a subset of errors for AI analysis to manage cost/time
      const errorsForAI = allErrors.slice(0, Math.min(10, allErrors.length));
      
      try {
        // Use batch analysis for efficiency
        await openAI.batchAnalyzeErrors(
          errorsForAI.map(err => err.id),
          { includeProjectContext: true }
        );
        console.log(`✓ AI analysis completed for ${errorsForAI.length} errors.`);
      } catch (error) {
        console.error(`AI analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  // Get error statistics
  const errorStats = await tsErrorStorage.getErrorStatistics();
  
  console.log('\nError Analysis Summary:');
  console.log(`Critical errors: ${errorStats.bySeverity.critical || 0}`);
  console.log(`High severity: ${errorStats.bySeverity.high || 0}`);
  console.log(`Medium severity: ${errorStats.bySeverity.medium || 0}`);
  console.log(`Low severity: ${errorStats.bySeverity.low || 0}`);
  
  console.log('\nErrors by category:');
  for (const category in errorStats.byCategory) {
    console.log(`${category}: ${errorStats.byCategory[category]}`);
  }
  
  console.timeEnd('Analysis Phase');
  return { errorStats, allErrors };
}

// Phase 3: Error Resolution
async function executeErrorResolution() {
  console.log('\n=== Phase 3: TypeScript Error Resolution ===');
  console.time('Resolution Phase');
  
  console.log(`${options.dryRun ? 'Simulating' : 'Applying'} fixes to TypeScript errors...`);
  
  // Create backup directory if actually fixing files
  if (!options.dryRun) {
    const backupDir = path.join(options.projectRoot, 'typescript-fixes-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    console.log(`Created backup directory: ${backupDir}`);
  }
  
  // Get all errors from database
  const errorsToFix = await tsErrorStorage.getAllTypeScriptErrors({ 
    status: 'detected',
    limit: options.maxErrors
  });
  
  // Sort errors for fixing
  let prioritizedErrors = errorsToFix;
  
  if (options.deep) {
    console.log('Using dependency-based prioritization...');
    // Create dependency graph
    const dependencyGraph = buildErrorDependencyGraph(errorsToFix);
    // Get topologically sorted errors
    const sortedIds = topologicalSortErrors(dependencyGraph);
    
    // Create a map of error IDs to errors
    const errorMap = new Map(errorsToFix.map(err => [err.id, err]));
    // Get errors in optimized order
    prioritizedErrors = sortedIds
      .map(id => errorMap.get(id))
      .filter(Boolean) as typeof errorsToFix;
    
    console.log(`✓ Errors sorted by dependency (${prioritizedErrors.length} errors).`);
  } else {
    console.log('Using severity-based prioritization...');
    // Sort by severity
    prioritizedErrors.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    console.log(`✓ Errors sorted by severity (${prioritizedErrors.length} errors).`);
  }
  
  // Fix errors in priority order
  const fixResults = {
    total: prioritizedErrors.length,
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  console.log(`\nApplying fixes to ${Math.min(options.maxErrors, prioritizedErrors.length)} errors in priority order...`);
  
  for (let i = 0; i < Math.min(options.maxErrors, prioritizedErrors.length); i++) {
    const error = prioritizedErrors[i];
    console.log(`\nFix ${i+1}/${Math.min(options.maxErrors, prioritizedErrors.length)}:`);
    console.log(`${error.file_path}:${error.line_number} - ${error.error_message}`);
    
    try {
      // Get analysis for this error if available
      let analysis = null;
      try {
        analysis = await tsErrorStorage.getAnalysisForError(error.id);
      } catch (err) {
        if (options.verbose) {
          console.log('No existing analysis found for this error.');
        }
      }
      
      // Apply or simulate fix
      const fixApplied = await tsErrorFixer.fixTypeScriptError(error, {
        dryRun: options.dryRun,
        createBackup: !options.dryRun,
        useAnalysis: !!analysis,
        analysisData: analysis?.analysis_data
      });
      
      if (fixApplied) {
        console.log(`✅ Fix ${options.dryRun ? 'simulated' : 'applied'} successfully.`);
        fixResults.success++;
        
        // Update error status if not in dry run mode
        if (!options.dryRun) {
          await tsErrorStorage.updateErrorStatus(error.id, 'fixed');
        }
      } else {
        console.log(`⚠️ No fix could be ${options.dryRun ? 'simulated' : 'applied'} for this error.`);
        fixResults.skipped++;
      }
    } catch (err) {
      console.error(`❌ Failed to fix error: ${err instanceof Error ? err.message : String(err)}`);
      fixResults.failed++;
    }
  }
  
  console.log('\nFix Results:');
  console.log(`Total Errors: ${fixResults.total}`);
  console.log(`Successfully ${options.dryRun ? 'Simulated' : 'Applied'}: ${fixResults.success}`);
  console.log(`Failed: ${fixResults.failed}`);
  console.log(`Skipped: ${fixResults.skipped}`);
  
  console.timeEnd('Resolution Phase');
  return fixResults;
}

// Execute all phases
async function executeFullWorkflow() {
  const detectionResult = await executeErrorDetection();
  const analysisResult = await executeErrorAnalysis();
  const fixResult = await executeErrorResolution();
  
  console.log('\n=== TypeScript Error Management Complete ===');
  console.log('Summary:');
  console.log(`Errors detected: ${detectionResult.scanResult.errorCount}`);
  console.log(`Errors analyzed: ${analysisResult.allErrors.length}`);
  console.log(`Fixes ${options.dryRun ? 'simulated' : 'applied'}: ${fixResult.success}`);
  
  console.log('\nNext steps:');
  if (options.dryRun) {
    console.log('1. Review the simulated fixes');
    console.log('2. Run with --apply flag to apply the fixes');
  } else {
    console.log('1. Compile the project to verify fixes');
    console.log('2. Run tests to ensure functionality is preserved');
  }
}

// Main execution
async function main() {
  try {
    if (!command) {
      showHelp();
      process.exit(1);
    }
    
    switch (command) {
      case 'scan':
        await executeErrorDetection();
        break;
      case 'analyze':
        await executeErrorAnalysis();
        break;
      case 'fix':
        await executeErrorResolution();
        break;
      case 'full':
        await executeFullWorkflow();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('\nError in TypeScript error management process:');
    console.error(error instanceof Error ? error.message : String(error));
    if (options.verbose && error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});