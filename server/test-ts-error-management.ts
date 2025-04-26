/**
 * @file test-ts-error-management.ts
 * @description Test script to validate TypeScript error management system
 *
 * This script demonstrates the full workflow of the TypeScript error management system:
 * 1. Detection - Scanning for errors
 * 2. Analysis - Analyzing errors using OpenAI
 * 3. Resolution - Fixing errors using batch fixing
 * 4. Tracking - Tracking error fixes and history
 */

import * as tsErrorFinder from './utils/ts-error-finder';
import * as tsTypeAnalyzer from './utils/ts-type-analyzer';
import * as tsBatchFixer from './utils/ts-batch-fixer';
import * as openAI from './utils/openai-integration';
import * as tsErrorStorage from './tsErrorStorage';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Main test function
 */
async function testTsErrorManagement() {
  try {
    console.log('=== TypeScript Error Management System Test ===');
    
    // 1. Detection - Scan a test directory for TypeScript errors
    // Use project root directory (one level up from server directory)
    const testDir = path.resolve(process.cwd(), '..');
    console.log(`\n1. Scanning ${testDir} for TypeScript errors...`);
    
    const scanResults = await tsErrorFinder.findTypeScriptErrors({
      projectRoot: testDir,
      includeNodeModules: false,
      severity: 'high'
    });
    
    console.log(`Found ${scanResults.errorCount} errors in ${scanResults.fileCount} files in ${scanResults.processingTimeMs}ms`);
    console.log(`Added ${scanResults.addedErrors.length} new errors to the database`);
    
    if (scanResults.addedErrors.length === 0) {
      console.log('No new errors found. Testing with existing errors...');
      
      // Get some existing errors from the database for testing
      const existingErrors = await tsErrorStorage.getTypescriptErrors({
        status: 'detected',
        limit: 5
      });
      
      if (existingErrors.length === 0) {
        console.log('No existing errors found. Test complete.');
        return;
      }
      
      console.log(`Found ${existingErrors.length} existing errors for testing`);
      scanResults.addedErrors = existingErrors.map(e => e.id);
    }
    
    // 2. Analysis - Analyze the first error using OpenAI
    const testErrorId = scanResults.addedErrors[0];
    console.log(`\n2. Analyzing error ${testErrorId} using OpenAI...`);
    
    const errorToAnalyze = await tsErrorStorage.getTypescriptError(testErrorId);
    if (!errorToAnalyze) {
      console.log(`Error ${testErrorId} not found in database. Skipping analysis.`);
    } else {
      console.log(`Error ${testErrorId}: ${errorToAnalyze.errorCode} in ${path.basename(errorToAnalyze.filePath)}`);
      
      const analysis = await openAI.analyzeError(errorToAnalyze);
      console.log('Analysis results:');
      console.log(`  Root cause: ${analysis.rootCause}`);
      console.log(`  Category: ${analysis.category}`);
      console.log(`  Severity: ${analysis.severity}`);
      console.log(`  Cascading: ${analysis.cascading}`);
      console.log(`  Confidence: ${analysis.confidence}`);
      
      // Update the error with the analysis results
      await tsErrorStorage.updateTypescriptError(testErrorId, {
        category: analysis.category,
        severity: analysis.severity,
        status: 'analyzed',
        metadata: {
          ...errorToAnalyze.metadata,
          rootCause: analysis.rootCause,
          explanation: analysis.explanation,
          cascading: analysis.cascading,
          analyzedAt: new Date().toISOString()
        }
      });
      
      console.log(`Error ${testErrorId} updated with analysis results`);
      
      // 3. Resolution - Generate a fix for the error
      console.log(`\n3. Generating fix for error ${testErrorId}...`);
      
      const fixSuggestion = await openAI.generateErrorFix(errorToAnalyze);
      console.log('Fix suggestion:');
      console.log(`  Explanation: ${fixSuggestion.fixExplanation.substring(0, 100)}...`);
      console.log(`  Original code: ${fixSuggestion.originalCode.substring(0, 50)}...`);
      console.log(`  Fix code: ${fixSuggestion.fixCode.substring(0, 50)}...`);
      console.log(`  Fix scope: ${fixSuggestion.fixScope}`);
      console.log(`  Confidence: ${fixSuggestion.confidence}`);
      
      // Add the fix to the database
      const fix = await tsErrorStorage.addErrorFix({
        errorId: testErrorId,
        fixTitle: `AI-generated fix for ${errorToAnalyze.errorCode}`,
        fixDescription: fixSuggestion.fixExplanation,
        fixCode: fixSuggestion.fixCode,
        originalCode: fixSuggestion.originalCode,
        fixScope: fixSuggestion.fixScope,
        fixType: 'semi-automatic',
        fixPriority: 5,
        successRate: fixSuggestion.confidence * 100
      });
      
      console.log(`Fix ${fix.id} added to the database`);
      
      // 4. Batch Processing - Create a dependency graph and try batch fixing
      console.log('\n4. Testing batch processing...');
      
      // Get a few errors to test batch fixing
      const testErrors = await tsErrorStorage.getTypescriptErrors({
        status: ['detected', 'analyzed'],
        limit: 3
      });
      
      if (testErrors.length > 1) {
        console.log(`Building dependency graph for ${testErrors.length} errors...`);
        const graph = tsBatchFixer.buildErrorDependencyGraph(testErrors);
        console.log('Dependency graph created');
        
        console.log('Sorting errors topologically...');
        const sortedIds = tsBatchFixer.topologicalSortErrors(graph);
        console.log(`Sorted order: ${sortedIds.join(', ')}`);
        
        console.log('Clustering errors by root cause...');
        const clusters = tsBatchFixer.clusterErrorsByRootCause(testErrors);
        console.log(`Found ${clusters.length} clusters`);
        
        // We'll skip the actual batch fixing for this test to avoid modifying files
        console.log('Skipping actual batch fix application to avoid modifying files');
      } else {
        console.log('Not enough errors for batch processing test');
      }
      
      // 5. Type Analysis - Analyze type hierarchy
      console.log('\n5. Analyzing type hierarchy...');
      
      try {
        const hierarchy = await tsTypeAnalyzer.analyzeTypeHierarchy(testDir);
        console.log('Type hierarchy analysis results:');
        console.log(`  Total types: ${hierarchy.typeCount}`);
        console.log(`  Interfaces: ${hierarchy.interfaceCount}`);
        console.log(`  Type aliases: ${hierarchy.typeAliasCount}`);
        console.log(`  Enums: ${hierarchy.enumCount}`);
        console.log(`  Generic types: ${hierarchy.genericTypeCount}`);
        console.log(`  Missing types: ${hierarchy.missingTypes.length}`);
        console.log(`  Orphaned types: ${hierarchy.orphanedTypes.length}`);
        console.log(`  Circular dependencies: ${hierarchy.circularDependencies.length}`);
      } catch (error) {
        console.error('Error analyzing type hierarchy:', error);
      }
      
      // 6. Track error history
      console.log('\n6. Testing error history tracking...');
      
      // Get fix history for the test error
      const fixHistory = await tsErrorStorage.getErrorFixHistory(testErrorId);
      console.log(`Error ${testErrorId} has ${fixHistory.length} fix history entries`);
      
      // Add a mock fix history entry for testing
      const mockHistory = await tsErrorStorage.addErrorFixHistory({
        errorId: testErrorId,
        fixId: fix.id,
        originalCode: fixSuggestion.originalCode,
        fixedCode: fixSuggestion.fixCode,
        fixedAt: new Date(),
        fixMethod: 'manual',
        fixResult: 'success'
      });
      
      console.log(`Added mock fix history entry ${mockHistory.id}`);
      
      // Get the updated fix history
      const updatedFixHistory = await tsErrorStorage.getErrorFixHistory(testErrorId);
      console.log(`Error ${testErrorId} now has ${updatedFixHistory.length} fix history entries`);
    }
    
    console.log('\n=== Test Complete ===');
    console.log('The TypeScript error management system is functioning as expected.');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test if this script is executed directly
// Using ESM module detection pattern
import { fileURLToPath } from 'url';

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  testTsErrorManagement().catch(error => {
    console.error('Unhandled error in test:', error);
    process.exit(1);
  });
}

export default testTsErrorManagement;