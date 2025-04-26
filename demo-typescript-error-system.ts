#!/usr/bin/env ts-node
/**
 * TypeScript Error Management System - Three-Phase Demo
 * 
 * This script demonstrates the three-phase approach to TypeScript error management
 * using the existing utility functions:
 * 
 * Phase 1: Detection - Uses ts-error-finder to scan for errors
 * Phase 2: Analysis - Uses ts-error-analyzer and ts-type-analyzer to analyze errors
 * Phase 3: Resolution - Uses ts-batch-fixer and ts-error-fixer to fix errors
 * 
 * Usage: ts-node demo-typescript-error-system.ts [options]
 * Options:
 *   --project <dir>  - Project directory to scan (default: current directory)
 *   --deep           - Perform deep analysis with dependency tracking
 *   --ai             - Use AI-assisted analysis if OpenAI API key is available
 *   --fix            - Apply fixes to errors (simulation mode by default)
 *   --apply          - Apply fixes for real (use with --fix)
 */

import * as path from 'path';
import * as fs from 'fs';
import { findTypeScriptErrors, createProjectAnalysis } from './server/utils/ts-error-finder';
import * as tsErrorStorage from './server/tsErrorStorage';
import * as tsBatchFixer from './server/utils/ts-batch-fixer';
import * as tsErrorFixer from './server/utils/ts-error-fixer';
import * as tsTypeAnalyzer from './server/utils/ts-type-analyzer';
import * as openAI from './server/utils/openai-integration';

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  project: '.',
  deep: args.includes('--deep'),
  ai: args.includes('--ai'),
  fix: args.includes('--fix'),
  apply: args.includes('--apply'),
  help: args.includes('--help'),
};

// Extract project directory if specified
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    options.project = args[i + 1];
    break;
  }
}

// Show help text
if (options.help) {
  console.log(`
TypeScript Error Management System - Three-Phase Demo

This script demonstrates the complete TypeScript error management system's three-phase approach:
1. Detection - Scan for TypeScript errors
2. Analysis - Analyze errors using dependency tracking and AI
3. Resolution - Apply fixes to errors

Usage: ts-node demo-typescript-error-system.ts [options]

Options:
  --project <dir>  Project directory to scan (default: current directory)
  --deep           Perform deep analysis with dependency tracking
  --ai             Use AI-assisted analysis if OpenAI API key is available
  --fix            Apply fixes to errors (simulation mode by default)
  --apply          Apply fixes for real (use with --fix)
  --help           Show this help message
  `);
  process.exit(0);
}

async function runDemo() {
  console.log('=== TypeScript Error Management System Demo ===');
  console.log(`Project directory: ${path.resolve(options.project)}`);
  console.log(`Deep analysis: ${options.deep}`);
  console.log(`AI assistance: ${options.ai}`);
  console.log(`Fix errors: ${options.fix}`);
  console.log(`Apply fixes: ${options.apply}`);
  console.log('==============================================\n');

  try {
    // Phase 1: Detection
    console.log('Phase 1: Error Detection');
    console.log('------------------------');
    
    console.log('Scanning project for TypeScript errors...');
    const scanResult = await findTypeScriptErrors({
      projectRoot: options.project,
      includeNodeModules: false,
      severity: 'high'
    });
    
    console.log(`Scan complete. Found ${scanResult.errorCount} errors and ${scanResult.warningCount} warnings.`);
    
    if (scanResult.errorCount === 0 && scanResult.warningCount === 0) {
      console.log('No errors found. Your TypeScript code is clean!');
      return;
    }
    
    console.log('\nTop files with errors:');
    const topFiles = Object.entries(scanResult.errorsByFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [file, count] of topFiles) {
      console.log(`  ${path.relative(options.project, file)}: ${count} errors`);
    }
    
    // Create project analysis record
    const analysisId = await createProjectAnalysis(scanResult);
    console.log(`Project analysis created with ID: ${analysisId}`);
    
    // Phase 2: Analysis
    console.log('\nPhase 2: Error Analysis');
    console.log('----------------------');
    
    // Get all errors from database
    const allErrors = await tsErrorStorage.getAllTypeScriptErrors({ 
      status: 'detected',
      limit: 50
    });
    
    console.log(`Analyzing ${allErrors.length} detected errors...`);
    
    // Dependency analysis if requested
    if (options.deep) {
      console.log('\nRunning dependency analysis...');
      
      // Build dependency graph
      const dependencyGraph = tsBatchFixer.buildErrorDependencyGraph(allErrors);
      
      // Get topologically sorted errors
      const sortedIds = tsBatchFixer.topologicalSortErrors(dependencyGraph);
      console.log(`Errors sorted by dependency order (total: ${sortedIds.length}).`);
      
      // Cluster errors by root cause
      const clusters = tsBatchFixer.clusterErrorsByRootCause(allErrors);
      console.log(`Found ${clusters.length} error clusters with common root causes.`);
      
      // Display top error clusters
      if (clusters.length > 0) {
        console.log('\nTop error clusters:');
        const topClusters = clusters.slice(0, 3);
        for (let i = 0; i < topClusters.length; i++) {
          const cluster = topClusters[i];
          console.log(`  Cluster ${i+1}: ${cluster.rootCause} (${cluster.errors.length} errors)`);
          if (cluster.suggestedFix) {
            console.log(`    Suggested fix: ${cluster.suggestedFix}`);
          }
        }
      }
      
      // Type hierarchy analysis
      console.log('\nAnalyzing TypeScript type hierarchy...');
      try {
        const typeHierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(options.project);
        
        if (typeHierarchy.missingTypes && typeHierarchy.missingTypes.length > 0) {
          console.log('\nMissing types found:');
          const sampleMissingTypes = typeHierarchy.missingTypes.slice(0, 5);
          for (const type of sampleMissingTypes) {
            console.log(`  - ${type}`);
          }
          if (typeHierarchy.missingTypes.length > 5) {
            console.log(`  ...and ${typeHierarchy.missingTypes.length - 5} more.`);
          }
        }
        
        if (typeHierarchy.circularDependencies && typeHierarchy.circularDependencies.length > 0) {
          console.log('\nCircular type dependencies found:');
          const sampleCircular = typeHierarchy.circularDependencies.slice(0, 3);
          for (const cycle of sampleCircular) {
            console.log(`  - ${cycle.join(' -> ')} -> ${cycle[0]}`);
          }
        }
      } catch (error) {
        console.error('Error analyzing type hierarchy:', error);
      }
    }
    
    // AI-assisted analysis if requested
    if (options.ai) {
      if (!process.env.OPENAI_API_KEY) {
        console.log('\nOpenAI analysis requested but API key not found.');
        console.log('Please set the OPENAI_API_KEY environment variable to enable AI-assisted analysis.');
      } else {
        console.log('\nPerforming AI-assisted analysis on selected errors...');
        
        // Select a subset of errors for AI analysis (to manage cost/time)
        const errorsForAI = allErrors.slice(0, Math.min(3, allErrors.length));
        
        try {
          // Use batch analysis for efficiency
          await openAI.batchAnalyzeErrors(
            errorsForAI.map(err => err.id),
            { includeProjectContext: true }
          );
          console.log(`AI analysis completed for ${errorsForAI.length} errors.`);
          
          // Display AI analysis results
          for (const error of errorsForAI) {
            const analysis = await tsErrorStorage.getAnalysisForError(error.id);
            if (analysis) {
              console.log(`\nAI analysis for error "${error.error_message.substring(0, 50)}..."`);
              console.log(`  Root cause: ${analysis.analysis_data.rootCause || 'Not available'}`);
              console.log(`  Suggested fix: ${analysis.analysis_data.suggestedFix || 'Not available'}`);
            }
          }
        } catch (error) {
          console.error(`AI analysis failed: ${error.message}`);
        }
      }
    }
    
    // Phase 3: Resolution
    if (options.fix) {
      console.log('\nPhase 3: Error Resolution');
      console.log('------------------------');
      
      console.log(`${options.apply ? 'Applying' : 'Simulating'} fixes to TypeScript errors...`);
      
      // Create backup directory if actually fixing files
      if (options.apply) {
        const backupDir = path.join(options.project, 'typescript-fixes-backup');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        console.log(`Created backup directory: ${backupDir}`);
      }
      
      // Sort errors for fixing
      let prioritizedErrors = allErrors;
      
      if (options.deep) {
        console.log('Using dependency-based prioritization...');
        // Create dependency graph and sort errors topologically
        const dependencyGraph = tsBatchFixer.buildErrorDependencyGraph(allErrors);
        const sortedIds = tsBatchFixer.topologicalSortErrors(dependencyGraph);
        
        // Create a map of error IDs to errors
        const errorMap = new Map(allErrors.map(err => [err.id, err]));
        
        // Reorder errors based on dependency sort
        prioritizedErrors = sortedIds
          .map(id => errorMap.get(id))
          .filter(Boolean) as typeof allErrors;
      } else {
        console.log('Using severity-based prioritization...');
        // Sort by severity
        prioritizedErrors.sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
      }
      
      console.log(`\nApplying fixes to ${Math.min(10, prioritizedErrors.length)} errors in priority order...`);
      
      // Fix errors in priority order
      const fixResults = {
        attempted: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      };
      
      for (let i = 0; i < Math.min(10, prioritizedErrors.length); i++) {
        const error = prioritizedErrors[i];
        console.log(`\nFix ${i+1}/${Math.min(10, prioritizedErrors.length)}:`);
        console.log(`File: ${path.relative(options.project, error.file_path)}`);
        console.log(`Line ${error.line_number}, Column ${error.column_number}`);
        console.log(`Error: ${error.error_message}`);
        
        fixResults.attempted++;
        
        try {
          // Get analysis for this error if available
          let analysis = null;
          try {
            analysis = await tsErrorStorage.getAnalysisForError(error.id);
          } catch (err) {
            // No analysis found, continue without it
          }
          
          // Apply or simulate fix
          const fixApplied = await tsErrorFixer.fixTypeScriptError(error, {
            dryRun: !options.apply,
            createBackup: options.apply,
            useAnalysis: !!analysis,
            analysisData: analysis?.analysis_data
          });
          
          if (fixApplied) {
            console.log(`✅ Fix ${options.apply ? 'applied' : 'simulated'} successfully.`);
            fixResults.successful++;
            
            // Update error status if not in dry run mode
            if (options.apply) {
              await tsErrorStorage.updateErrorStatus(error.id, 'fixed');
            }
          } else {
            console.log(`⚠️ No fix could be ${options.apply ? 'applied' : 'simulated'} for this error.`);
            fixResults.skipped++;
          }
        } catch (err) {
          console.error(`❌ Failed to fix error: ${err.message}`);
          fixResults.failed++;
        }
      }
      
      console.log('\nFix Results:');
      console.log(`Total Errors: ${fixResults.attempted}`);
      console.log(`Successfully ${options.apply ? 'Applied' : 'Simulated'}: ${fixResults.successful}`);
      console.log(`Failed: ${fixResults.failed}`);
      console.log(`Skipped: ${fixResults.skipped}`);
    }
    
    console.log('\n=== TypeScript Error Management Demo Complete ===');
    
    // Suggest next steps
    console.log('\nSuggested next steps:');
    if (!options.deep) {
      console.log('1. Run with --deep flag for deeper analysis.');
    }
    if (!options.ai && !process.env.OPENAI_API_KEY) {
      console.log('2. Set OPENAI_API_KEY and use --ai for AI-assisted analysis.');
    }
    if (!options.fix) {
      console.log('3. Run with --fix to simulate fixes.');
    } else if (!options.apply) {
      console.log('3. Run with --fix --apply to apply the fixes.');
    } else {
      console.log('3. Compile and test your project to verify the fixes.');
    }
    
  } catch (error) {
    console.error('\nError in demo:', error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});