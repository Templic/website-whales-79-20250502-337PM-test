/**
 * TypeScript Error Management System - Three-Phase Execution
 * 
 * This script coordinates the existing utilities to perform a complete
 * three-phase approach to TypeScript error management:
 * 
 * 1. Detection: Scan the codebase using ts-error-finder
 * 2. Analysis: Analyze errors using ts-error-analyzer and ts-type-analyzer
 * 3. Fix: Apply fixes using ts-batch-fixer and ts-error-fixer
 * 
 * Usage: ts-node run-typescript-error-system.ts [options]
 */

import * as path from 'path';
import { findTypeScriptErrors, createProjectAnalysis } from './server/utils/ts-error-finder';
import analyzeTypeScriptErrors from './server/utils/ts-error-analyzer';
import * as tsTypeAnalyzer from './server/utils/ts-type-analyzer';
import * as tsBatchFixer from './server/utils/ts-batch-fixer';
import * as openAI from './server/utils/openai-integration';
import * as tsErrorStorage from './server/tsErrorStorage';
import * as tsErrorFixer from './server/utils/ts-error-fixer';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  detectOnly: args.includes('--detect-only'),
  analyzeOnly: args.includes('--analyze-only'),
  fixOnly: args.includes('--fix-only'),
  dryRun: !args.includes('--apply'),
  deep: args.includes('--deep'),
  useAI: args.includes('--ai'),
  projectRoot: args.find(arg => !arg.startsWith('--')) || '.',
  tsconfigPath: path.join(args.find(arg => !arg.startsWith('--')) || '.', 'tsconfig.json')
};

async function runDetectionPhase() {
  console.log('\n=== Phase 1: Detection ===');
  console.time('Detection Phase');
  
  try {
    console.log('Scanning codebase for TypeScript errors...');
    const scanResult = await findTypeScriptErrors({
      projectRoot: options.projectRoot,
      tsconfigPath: options.tsconfigPath,
      includeNodeModules: false
    });
    
    console.log(`Found ${scanResult.errorCount} errors and ${scanResult.warningCount} warnings in ${scanResult.fileCount} files.`);
    console.log(`Top files with errors:`);
    
    // Display top 5 files with most errors
    const topErrorFiles = Object.entries(scanResult.errorsByFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [file, count] of topErrorFiles) {
      console.log(`  ${path.relative('.', file)}: ${count} errors`);
    }
    
    // Create project analysis record
    const analysisId = await createProjectAnalysis(scanResult);
    console.log(`Created project analysis with ID: ${analysisId}`);
    
    console.timeEnd('Detection Phase');
    return scanResult;
  } catch (error) {
    console.error('Error in detection phase:', error);
    throw error;
  }
}

async function runAnalysisPhase(scanResult: any) {
  console.log('\n=== Phase 2: Analysis ===');
  console.time('Analysis Phase');
  
  try {
    console.log('Retrieving errors from database...');
    const errors = await tsErrorStorage.getAllTypeScriptErrors({
      status: 'detected',
      limit: 100 // Limit to a reasonable number for analysis
    });
    
    console.log(`Analyzing ${errors.length} errors...`);
    
    // Perform deep analysis if requested
    if (options.deep) {
      console.log('Running type hierarchy analysis...');
      const typeHierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(options.projectRoot);
      
      console.log(`Type analysis results:`);
      console.log(`  Interfaces: ${Object.keys(typeHierarchy.interfaces || {}).length}`);
      console.log(`  Types: ${Object.keys(typeHierarchy.types || {}).length}`);
      
      if (typeHierarchy.missingTypes?.length > 0) {
        console.log(`  Missing types: ${typeHierarchy.missingTypes.length}`);
        console.log(`    Examples: ${typeHierarchy.missingTypes.slice(0, 3).join(', ')}...`);
      }
      
      if (typeHierarchy.circularDependencies?.length > 0) {
        console.log(`  Circular type dependencies: ${typeHierarchy.circularDependencies.length}`);
      }
    }
    
    // Build dependency graph for errors
    console.log('Building error dependency graph...');
    const dependencyGraph = tsBatchFixer.buildErrorDependencyGraph(errors);
    
    // Sort errors topologically
    console.log('Sorting errors by dependency...');
    const sortedErrorIds = tsBatchFixer.topologicalSortErrors(dependencyGraph);
    
    console.log('Clustering errors by root cause...');
    const clusters = tsBatchFixer.clusterErrorsByRootCause(errors);
    console.log(`Found ${clusters.length} error clusters with common root causes`);
    
    // Display top clusters
    if (clusters.length > 0) {
      console.log('\nTop error clusters:');
      for (let i = 0; i < Math.min(3, clusters.length); i++) {
        const cluster = clusters[i];
        console.log(`  Cluster ${i+1}: ${cluster.rootCause} (${cluster.errors.length} errors)`);
      }
    }
    
    // AI-assisted analysis if requested
    if (options.useAI) {
      if (!process.env.OPENAI_API_KEY) {
        console.log('\nOpenAI analysis requested but API key not found.');
        console.log('Set the OPENAI_API_KEY environment variable to enable AI-assisted analysis.');
      } else {
        console.log('\nRunning AI-assisted analysis on high-priority errors...');
        
        // Select top errors from each category for AI analysis
        const highPriorityErrorIds = sortedErrorIds.slice(0, 5);
        if (highPriorityErrorIds.length > 0) {
          try {
            const analyses = await openAI.batchAnalyzeErrors(highPriorityErrorIds);
            console.log(`Completed AI analysis for ${analyses.length} errors`);
          } catch (error) {
            console.error('Error in AI analysis:', error);
          }
        }
      }
    }
    
    console.timeEnd('Analysis Phase');
    return { sortedErrorIds, clusters };
  } catch (error) {
    console.error('Error in analysis phase:', error);
    throw error;
  }
}

async function runFixPhase(analysisResult: { sortedErrorIds: number[], clusters: any[] }) {
  console.log('\n=== Phase 3: Fix ===');
  console.time('Fix Phase');
  
  try {
    const { sortedErrorIds, clusters } = analysisResult;
    
    if (options.dryRun) {
      console.log('Running in dry-run mode. No changes will be applied.');
    } else {
      console.log('Running in application mode. Changes will be applied to files.');
    }
    
    // Get errors by ID in dependency order
    const errorsToFix = [];
    for (const errorId of sortedErrorIds) {
      try {
        const error = await tsErrorStorage.getTypeScriptErrorById(errorId);
        if (error && error.status !== 'fixed') {
          errorsToFix.push(error);
        }
      } catch (err) {
        console.warn(`Could not retrieve error ${errorId}:`, err);
      }
    }
    
    console.log(`Preparing to fix ${errorsToFix.length} errors in dependency order`);
    
    // Fix errors one by one in dependency order
    const results = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    };
    
    for (let i = 0; i < errorsToFix.length; i++) {
      const error = errorsToFix[i];
      console.log(`\nFix attempt ${i+1}/${errorsToFix.length}:`);
      console.log(`  File: ${path.relative('.', error.file_path)}`);
      console.log(`  Line ${error.line_number}, Column ${error.column_number}`);
      console.log(`  Error code: ${error.error_code}`);
      console.log(`  Message: ${error.error_message}`);
      
      results.attempted++;
      
      try {
        // Get analysis for this error if it exists
        let analysis = null;
        try {
          analysis = await tsErrorStorage.getAnalysisForError(error.id);
        } catch (err) {
          // No analysis found, continue without it
        }
        
        // Apply the fix
        const fixResult = await tsErrorFixer.fixTypeScriptError(error, {
          dryRun: options.dryRun,
          createBackup: true,
          useAnalysis: !!analysis,
          analysisData: analysis?.analysis_data || null
        });
        
        if (fixResult) {
          console.log('  ✅ Fix applied successfully');
          results.successful++;
          
          // Update error status if not in dry run
          if (!options.dryRun) {
            await tsErrorStorage.updateErrorStatus(error.id, 'fixed');
          }
        } else {
          console.log('  ⚠️ No fix could be determined');
          results.skipped++;
        }
      } catch (err) {
        console.error('  ❌ Fix failed:', err);
        results.failed++;
      }
      
      // Limit to 10 fixes to avoid potential issues
      if (i >= 9) {
        console.log('\nStopping after 10 fix attempts to avoid potential issues');
        console.log('Run again to continue fixing more errors');
        break;
      }
    }
    
    console.log('\nFix phase results:');
    console.log(`  Attempted: ${results.attempted}`);
    console.log(`  Successful: ${results.successful}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Skipped: ${results.skipped}`);
    
    console.timeEnd('Fix Phase');
    return results;
  } catch (error) {
    console.error('Error in fix phase:', error);
    throw error;
  }
}

async function main() {
  console.log('=== TypeScript Error Management System ===');
  console.log('Executing three-phase approach to error management');
  console.log(`Options: ${JSON.stringify(options, null, 2)}`);
  
  try {
    let scanResult, analysisResult;
    
    // Detection phase
    if (!options.analyzeOnly && !options.fixOnly) {
      scanResult = await runDetectionPhase();
    }
    
    // Analysis phase
    if (!options.detectOnly && !options.fixOnly) {
      if (!scanResult) {
        // If we skipped detection, we need to get scan results from database
        console.log('Loading previous scan results...');
        // This is simplified - in reality you might want to load the most recent analysis
      }
      
      analysisResult = await runAnalysisPhase(scanResult);
    }
    
    // Fix phase
    if (!options.detectOnly && !options.analyzeOnly) {
      if (!analysisResult) {
        // If we skipped analysis, we need minimal analysis results
        console.log('Preparing minimal analysis for fix phase...');
        const errors = await tsErrorStorage.getAllTypeScriptErrors({
          status: 'detected',
          limit: 100
        });
        
        const dependencyGraph = tsBatchFixer.buildErrorDependencyGraph(errors);
        const sortedErrorIds = tsBatchFixer.topologicalSortErrors(dependencyGraph);
        analysisResult = { sortedErrorIds, clusters: [] };
      }
      
      await runFixPhase(analysisResult);
    }
    
    console.log('\n=== Process Complete ===');
    
    // Suggest next steps
    console.log('\nNext steps:');
    if (options.detectOnly) {
      console.log('1. Run analysis phase: ts-node run-typescript-error-system.ts --analyze-only');
    } else if (options.analyzeOnly) {
      console.log('1. Run fix phase: ts-node run-typescript-error-system.ts --fix-only');
    } else if (options.dryRun && !options.detectOnly && !options.analyzeOnly) {
      console.log('1. Apply fixes: ts-node run-typescript-error-system.ts --apply');
    } else {
      console.log('1. Verify fixes by running TypeScript compiler: tsc --noEmit');
      console.log('2. Run tests to ensure functionality is preserved');
    }
    
  } catch (error) {
    console.error('\nFatal error in TypeScript error management process:');
    console.error(error);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { runDetectionPhase, runAnalysisPhase, runFixPhase };