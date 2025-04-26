/**
 * TypeScript Error Management System - Deep Scan & Fix
 * 
 * This script executes the three-phase approach to TypeScript error management:
 * 1. Detection Phase: Scan the codebase for TypeScript errors
 * 2. Analysis Phase: Analyze errors using dependency tracking and AI assistance
 * 3. Fix Phase: Apply fixes in batches with dependency awareness
 * 
 * Usage: ts-node scan-and-fix-typescript-errors.ts [options]
 * Options:
 *   --deep          Perform deep analysis (default: false)
 *   --fix           Apply fixes (default: false)
 *   --ai            Use AI for analysis (default: false)
 *   --dry-run       Simulate fixes without applying them (default: true)
 *   --max-errors    Maximum number of errors to fix (default: 50)
 *   --categories    Comma-separated list of error categories to focus on
 *   --exclude       Comma-separated list of directories or files to exclude
 */

import * as ts from 'typescript';
import * as path from 'path';
import { analyzeTypeScriptErrors } from './server/utils/ts-error-analyzer';
import { findTypeScriptErrors, createProjectAnalysis } from './server/utils/ts-error-finder';
import { buildErrorDependencyGraph, topologicalSortErrors, clusterErrorsByRootCause } from './server/utils/ts-batch-fixer';
import * as openAI from './server/utils/openai-integration';
import * as tsErrorStorage from './server/tsErrorStorage';
import * as tsErrorFixer from './server/utils/ts-error-fixer';
import * as fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  deep: args.includes('--deep'),
  fix: args.includes('--fix'),
  ai: args.includes('--ai'),
  dryRun: !args.includes('--apply'), // Default to dry run unless --apply is specified
  maxErrors: parseInt(getArgValue(args, '--max-errors') || '50'),
  categories: getArgValue(args, '--categories')?.split(',') || [],
  exclude: getArgValue(args, '--exclude')?.split(',') || [],
  projectRoot: '.',
  tsconfigPath: './tsconfig.json'
};

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

async function main() {
  try {
    console.log('=== TypeScript Error Management System ===');
    console.log('Starting three-phase error detection and resolution...');
    console.log(`Options: ${JSON.stringify(options, null, 2)}`);
    
    // Phase 1: Error Detection
    console.log('\n=== Phase 1: Error Detection ===');
    console.time('Detection Phase');
    
    console.log('Scanning codebase for TypeScript errors...');
    const scanResult = await findTypeScriptErrors({
      projectRoot: options.projectRoot,
      tsconfigPath: options.tsconfigPath,
      includeNodeModules: false
    });
    
    console.log(`Found ${scanResult.errorCount} errors and ${scanResult.warningCount} warnings in ${scanResult.fileCount} files.`);
    console.log(`Processing time: ${scanResult.processingTimeMs}ms`);
    
    // Create project analysis
    const analysisId = await createProjectAnalysis(scanResult);
    console.log(`Created project analysis with ID: ${analysisId}`);
    
    console.timeEnd('Detection Phase');
    
    // Phase 2: Error Analysis
    console.log('\n=== Phase 2: Error Analysis ===');
    console.time('Analysis Phase');
    
    // Get all errors from database
    const allErrors = await tsErrorStorage.getAllTypeScriptErrors({
      status: 'detected',
      limit: options.maxErrors
    });
    
    console.log(`Analyzing ${allErrors.length} errors...`);
    
    if (options.deep) {
      console.log('Performing deep analysis with dependency tracking...');
      
      // Build dependency graph
      const dependencyGraph = buildErrorDependencyGraph(allErrors);
      console.log('Dependency graph created.');
      
      // Topological sort
      const sortedErrorIds = topologicalSortErrors(dependencyGraph);
      console.log(`Errors sorted by dependency order. Root causes will be fixed first.`);
      
      // Cluster errors by root cause
      const errorGroups = clusterErrorsByRootCause(allErrors);
      console.log(`Found ${errorGroups.length} error groups with similar root causes.`);
      
      // Show top error groups
      console.log('\nTop 5 error groups by priority:');
      for (let i = 0; i < Math.min(5, errorGroups.length); i++) {
        const group = errorGroups[i];
        console.log(`${i+1}. ${group.rootCause} (${group.errors.length} errors)`);
      }
    }
    
    // AI-assisted analysis if requested
    if (options.ai) {
      if (!process.env.OPENAI_API_KEY) {
        console.log('\nOpenAI analysis requested but API key not found.');
        console.log('Set the OPENAI_API_KEY environment variable to enable AI-assisted analysis.');
      } else {
        console.log('\nPerforming AI-assisted analysis on selected errors...');
        
        // Select a subset of errors for AI analysis to manage cost/time
        const errorsForAI = allErrors.slice(0, 10);
        
        try {
          // Use batch analysis for efficiency
          await openAI.batchAnalyzeErrors(
            errorsForAI.map(err => err.id),
            { includeProjectContext: true }
          );
          console.log(`AI analysis completed for ${errorsForAI.length} errors.`);
        } catch (error) {
          console.error(`AI analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    console.timeEnd('Analysis Phase');
    
    // Phase 3: Fix Application
    if (options.fix) {
      console.log('\n=== Phase 3: Fix Application ===');
      console.time('Fix Phase');
      
      console.log(`${options.dryRun ? 'Simulating' : 'Applying'} fixes to TypeScript errors...`);
      
      // Create backup directory if actually fixing files
      if (!options.dryRun) {
        const backupDir = path.join(options.projectRoot, 'typescript-fixes-backup');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        console.log(`Created backup directory: ${backupDir}`);
      }
      
      // Prioritized errors (from dependency analysis or by severity)
      let prioritizedErrors = allErrors;
      
      if (options.deep) {
        // Re-fetch the dependency-sorted errors from the database
        const dependencyGraph = buildErrorDependencyGraph(allErrors);
        const sortedIds = topologicalSortErrors(dependencyGraph);
        
        // Map sorted IDs back to errors
        const errorMap = new Map(allErrors.map(err => [err.id, err]));
        prioritizedErrors = sortedIds
          .map(id => errorMap.get(id))
          .filter(Boolean) as typeof allErrors;
      } else {
        // Sort by severity if not using dependency analysis
        prioritizedErrors.sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
      }
      
      // Filter by categories if specified
      if (options.categories.length > 0) {
        prioritizedErrors = prioritizedErrors.filter(
          error => options.categories.includes(error.category)
        );
      }
      
      // Limit number of errors to fix
      prioritizedErrors = prioritizedErrors.slice(0, options.maxErrors);
      
      console.log(`Preparing to fix ${prioritizedErrors.length} errors in priority order.`);
      
      // Fix errors in priority order
      const fixResults = {
        total: prioritizedErrors.length,
        success: 0,
        failed: 0,
        skipped: 0
      };
      
      for (let i = 0; i < prioritizedErrors.length; i++) {
        const error = prioritizedErrors[i];
        console.log(`\nFixing error ${i+1}/${prioritizedErrors.length}:`);
        console.log(`${error.file_path}:${error.line_number}:${error.column_number} - ${error.error_message}`);
        
        try {
          // Get analysis for this error
          let analysis = null;
          try {
            analysis = await tsErrorStorage.getAnalysisForError(error.id);
          } catch (err) {
            console.log('No existing analysis found for this error.');
          }
          
          // Apply or simulate fix
          const fixApplied = await tsErrorFixer.fixTypeScriptError(error, {
            dryRun: options.dryRun,
            createBackup: !options.dryRun,
            useAnalysis: !!analysis,
            analysisData: analysis?.analysis_data
          });
          
          if (fixApplied) {
            console.log(`✅ Error fix ${options.dryRun ? 'simulated' : 'applied'} successfully.`);
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
          
          // Stop on first error if not simulating
          if (!options.dryRun) {
            console.error('Stopping fix process due to error.');
            break;
          }
        }
      }
      
      console.log('\nFix Results:');
      console.log(`Total Errors: ${fixResults.total}`);
      console.log(`Successfully ${options.dryRun ? 'Simulated' : 'Applied'}: ${fixResults.success}`);
      console.log(`Failed: ${fixResults.failed}`);
      console.log(`Skipped: ${fixResults.skipped}`);
      
      console.timeEnd('Fix Phase');
    }
    
    console.log('\n=== Process Complete ===');
    console.log('TypeScript error management process completed successfully.');
    
    // Provide next steps
    if (options.dryRun && options.fix) {
      console.log('\nNext steps:');
      console.log('1. Review the simulated fixes');
      console.log('2. Run with --apply flag to apply the fixes: ts-node scan-and-fix-typescript-errors.ts --fix --apply');
    } else if (!options.fix) {
      console.log('\nNext steps:');
      console.log('1. Review the error analysis');
      console.log('2. Run with --fix flag to simulate fixes: ts-node scan-and-fix-typescript-errors.ts --fix');
    } else {
      console.log('\nNext steps:');
      console.log('1. Compile the project to verify fixes: tsc --noEmit');
      console.log('2. Run tests to ensure functionality is preserved');
    }
    
  } catch (error) {
    console.error('Error in TypeScript error management process:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});