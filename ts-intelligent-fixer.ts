#!/usr/bin/env ts-node
/**
 * TypeScript Intelligent Fixer
 * 
 * A comprehensive command-line tool that combines error analysis and automated fixing
 * to address TypeScript errors in a project. This tool uses semantic understanding
 * of TypeScript errors to apply targeted fixes that preserve code behavior.
 * 
 * @version 1.0.0
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { analyzeTypeScriptErrors, AnalysisOptions } from './server/utils/ts-error-analyzer';
import { findErrorPatterns, PatternFinderOptions } from './server/utils/ts-pattern-finder';
import { fixTypeScriptErrors, FixOptions, FixResult } from './server/utils/ts-error-fixer';
import { isOpenAIAvailable, getOpenAIModel } from './server/utils/openai-integration';

// Setup command line interface
const program = new Command();

program
  .name('ts-intelligent-fixer')
  .description('Intelligent TypeScript error management tool')
  .version('1.0.0');

// Common options
const addCommonOptions = (command: Command) => {
  return command
    .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
    .option('-r, --root <path>', 'Project root directory', '.')
    .option('-v, --verbose', 'Enable verbose output');
};

// Analyze command
const analyzeCommand = program.command('analyze')
  .description('Analyze TypeScript errors without fixing them');

addCommonOptions(analyzeCommand);

analyzeCommand
  .option('-o, --output <path>', 'Output file for analysis results (JSON format)')
  .option('-d, --deep', 'Perform deep analysis with dependency tracking')
  .option('-a, --ai', 'Use OpenAI to enhance analysis')
  .option('-c, --categories <list>', 'Comma-separated list of error categories to analyze')
  .option('-e, --exclude <list>', 'Comma-separated list of files or directories to exclude')
  .option('--no-save', 'Don\'t save analysis results to the database')
  .action(async (options) => {
    try {
      // Check OpenAI availability if AI option is enabled
      if (options.ai && !isOpenAIAvailable()) {
        console.warn('OpenAI integration is not available. Set OPENAI_API_KEY environment variable to enable AI features.');
        console.warn('Continuing without AI assistance...');
      }
      
      // Prepare analysis options
      const analysisOptions: AnalysisOptions = {
        deep: options.deep || false,
        useAI: options.ai && isOpenAIAvailable(),
        categories: options.categories ? options.categories.split(',') : [],
        exclude: options.exclude ? options.exclude.split(',') : [],
        saveToDb: options.save
      };
      
      console.log('Analyzing TypeScript errors...');
      
      // Run analysis
      const startTime = new Date();
      const result = await analyzeTypeScriptErrors(options.root, options.project, analysisOptions);
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      // Display results
      console.log(`\nAnalysis completed in ${duration.toFixed(2)} seconds`);
      console.log(`Total errors: ${result.totalErrors}`);
      console.log(`Critical errors: ${result.criticalErrors}`);
      console.log(`High severity errors: ${result.highSeverityErrors}`);
      console.log(`Medium severity errors: ${result.mediumSeverityErrors}`);
      console.log(`Low severity errors: ${result.lowSeverityErrors}`);
      
      // Display errors by category
      console.log('\nErrors by category:');
      for (const [category, errors] of Object.entries(result.errorsByCategory)) {
        if (errors.length > 0) {
          console.log(`- ${category}: ${errors.length}`);
        }
      }
      
      // Display files with most errors
      console.log('\nTop 5 files with most errors:');
      const sortedFiles = Object.entries(result.errorsByFile)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);
      
      for (const [file, errors] of sortedFiles) {
        console.log(`- ${path.relative(options.root, file)}: ${errors.length} errors`);
      }
      
      // Write output to file if specified
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`\nAnalysis results written to ${outputPath}`);
      }
      
      // If deep analysis was performed, show dependency information
      if (options.deep && result.dependencyInfo) {
        console.log('\nRoot causes:');
        for (const rootCause of result.dependencyInfo.rootCauses.slice(0, 5)) {
          console.log(`- ${path.relative(options.root, rootCause.file)}:${rootCause.line} (impacts ${rootCause.impactedErrors.length} other errors)`);
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error during analysis:', error);
      process.exit(1);
    }
  });

// Fix command
const fixCommand = program.command('fix')
  .description('Automatically fix TypeScript errors');

addCommonOptions(fixCommand);

fixCommand
  .option('-b, --backup <dir>', 'Directory for backups', './ts-error-fixes-backup')
  .option('--no-backup', 'Disable file backups')
  .option('-c, --categories <list>', 'Comma-separated list of error categories to fix')
  .option('-m, --max-errors <number>', 'Maximum number of errors to fix per file')
  .option('-d, --dry-run', 'Show what would be fixed without making changes')
  .option('--no-interfaces', 'Disable generating interface definitions')
  .option('--no-props', 'Disable fixing missing properties')
  .option('--no-any', 'Disable fixing implicit any types')
  .option('--deep-fix', 'Enable fixing dependencies and cascading errors')
  .option('-a, --ai', 'Use OpenAI to enhance fixes')
  .option('--no-batch', 'Disable batch fixing (fix one at a time)')
  .option('-t, --target <files>', 'Comma-separated list of files to fix')
  .option('-e, --exclude <list>', 'Comma-separated list of files or directories to exclude')
  .option('--no-save', 'Don\'t save fix results to the database')
  .action(async (options) => {
    try {
      // Check OpenAI availability if AI option is enabled
      if (options.ai && !isOpenAIAvailable()) {
        console.warn('OpenAI integration is not available. Set OPENAI_API_KEY environment variable to enable AI features.');
        console.warn('Continuing without AI assistance...');
      }
      
      // Prepare fix options
      const fixOptions: Partial<FixOptions> = {
        createBackups: options.backup,
        backupDir: options.backup,
        categories: options.categories ? options.categories.split(',') : [],
        maxErrorsPerFile: options.maxErrors ? parseInt(options.maxErrors) : undefined,
        logLevel: options.verbose ? 'verbose' : 'normal',
        dryRun: options.dryRun || false,
        generateTypeDefinitions: options.interfaces,
        fixMissingInterfaces: options.interfaces,
        fixImplicitAny: options.any,
        fixMissingProperties: options.props,
        prioritizeCriticalErrors: true,
        fixDependencies: options.deepFix || false,
        useAI: options.ai && isOpenAIAvailable(),
        batchFix: options.batch,
        targetFiles: options.target ? options.target.split(',') : [],
        exclude: options.exclude ? options.exclude.split(',') : [],
        saveToDb: options.save
      };
      
      console.log(`${options.dryRun ? 'Simulating fixes' : 'Fixing'} for TypeScript errors...`);
      
      // Run fixer
      const result = await fixTypeScriptErrors(options.root, options.project, fixOptions);
      
      // Display results
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`\nFixing ${options.dryRun ? 'simulation ' : ''}completed in ${duration} seconds`);
      console.log(`Total errors: ${result.totalErrors}`);
      console.log(`Fixed errors: ${result.fixedErrors}`);
      console.log(`Unfixed errors: ${result.unfixedErrors}`);
      console.log(`Files fixed: ${result.fixedFiles.length}`);
      console.log(`Files not fixed: ${result.unfixableFiles.length}`);
      
      // Show detailed fix information if verbose
      if (options.verbose && result.fixDetails) {
        console.log('\nDetailed fix information:');
        for (const detail of result.fixDetails.slice(0, 10)) { // Limit to 10 for brevity
          console.log(`- ${path.relative(options.root, detail.file)}:${detail.line}: ${detail.fixDescription}`);
        }
        
        if (result.fixDetails.length > 10) {
          console.log(`... and ${result.fixDetails.length - 10} more fixes`);
        }
      }
      
      if (options.dryRun) {
        console.log('\nThis was a dry run. No files were modified.');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error during fix:', error);
      process.exit(1);
    }
  });

// Patterns command
const patternsCommand = program.command('patterns')
  .description('Find common error patterns in TypeScript code');

addCommonOptions(patternsCommand);

patternsCommand
  .option('-o, --output <path>', 'Output file for pattern results (JSON format)')
  .option('-m, --min-occurrences <number>', 'Minimum number of occurrences to consider a pattern', '3')
  .option('--no-save', 'Don\'t save patterns to the database')
  .action(async (options) => {
    try {
      // Prepare pattern finder options
      const patternOptions: PatternFinderOptions = {
        minOccurrences: parseInt(options.minOccurrences),
        saveToDb: options.save
      };
      
      console.log('Finding error patterns...');
      
      // Run pattern finder
      const startTime = new Date();
      const patterns = await findErrorPatterns(options.root, options.project, patternOptions);
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      // Display results
      console.log(`\nPattern analysis completed in ${duration.toFixed(2)} seconds`);
      console.log(`Found ${patterns.length} patterns`);
      
      if (patterns.length > 0) {
        console.log('\nTop patterns:');
        for (const pattern of patterns.slice(0, 5)) {
          console.log(`- ${pattern.name} (${pattern.occurrences} occurrences, ${pattern.autoFixable ? 'auto-fixable' : 'not auto-fixable'})`);
          if (options.verbose) {
            console.log(`  Description: ${pattern.description}`);
            console.log(`  Suggested fix: ${pattern.suggestedFix || 'None'}`);
            console.log('');
          }
        }
      }
      
      // Write output to file if specified
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
        console.log(`\nPattern results written to ${outputPath}`);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error during pattern analysis:', error);
      process.exit(1);
    }
  });

// Verify command
const verifyCommand = program.command('verify')
  .description('Verify that TypeScript errors were fixed correctly');

addCommonOptions(verifyCommand);

verifyCommand
  .action(async (options) => {
    try {
      console.log('Verifying fixes...');
      
      // Run analysis to check for remaining errors
      const result = await analyzeTypeScriptErrors(options.root, options.project, { saveToDb: false });
      
      console.log(`\nVerification completed`);
      console.log(`Remaining errors: ${result.totalErrors}`);
      console.log(`Critical errors: ${result.criticalErrors}`);
      console.log(`High severity errors: ${result.highSeverityErrors}`);
      console.log(`Medium severity errors: ${result.mediumSeverityErrors}`);
      console.log(`Low severity errors: ${result.lowSeverityErrors}`);
      
      if (options.verbose && result.totalErrors > 0) {
        console.log('\nErrors by category:');
        for (const [category, errors] of Object.entries(result.errorsByCategory)) {
          if (errors.length > 0) {
            console.log(`- ${category}: ${errors.length}`);
          }
        }
        
        console.log('\nTop 5 files with remaining errors:');
        const sortedFiles = Object.entries(result.errorsByFile)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 5);
        
        for (const [file, errors] of sortedFiles) {
          console.log(`- ${path.relative(options.root, file)}: ${errors.length} errors`);
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error during verification:', error);
      process.exit(1);
    }
  });

// Stats command
const statsCommand = program.command('stats')
  .description('Show statistics about TypeScript errors and fixes');

addCommonOptions(statsCommand);

statsCommand
  .option('-d, --days <number>', 'Number of days to include in stats', '30')
  .action(async (options) => {
    try {
      console.log('Collecting statistics...');
      console.log(`\nStatistics for the last ${options.days} days:`);
      console.log('Note: This feature requires database integration to be implemented');
      
      // TODO: Implement database integration for statistics
      console.log('Statistics functionality not yet implemented');
      
      process.exit(0);
    } catch (error) {
      console.error('Error collecting statistics:', error);
      process.exit(1);
    }
  });

// Fix-file command
const fixFileCommand = program.command('fix-file <file>')
  .description('Fix TypeScript errors in a specific file');

addCommonOptions(fixFileCommand);

fixFileCommand
  .option('-b, --backup <dir>', 'Directory for backups', './ts-error-fixes-backup')
  .option('--no-backup', 'Disable file backups')
  .option('-d, --dry-run', 'Show what would be fixed without making changes')
  .option('-a, --ai', 'Use OpenAI to enhance fixes')
  .action(async (file, options) => {
    try {
      // Check OpenAI availability if AI option is enabled
      if (options.ai && !isOpenAIAvailable()) {
        console.warn('OpenAI integration is not available. Set OPENAI_API_KEY environment variable to enable AI features.');
        console.warn('Continuing without AI assistance...');
      }
      
      // Resolve file path
      const filePath = path.resolve(options.root, file);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }
      
      // Prepare fix options targeting only this file
      const fixOptions: Partial<FixOptions> = {
        createBackups: options.backup,
        backupDir: options.backup,
        logLevel: options.verbose ? 'verbose' : 'normal',
        dryRun: options.dryRun || false,
        generateTypeDefinitions: true,
        fixMissingInterfaces: true,
        fixImplicitAny: true,
        fixMissingProperties: true,
        prioritizeCriticalErrors: true,
        useAI: options.ai && isOpenAIAvailable(),
        batchFix: true,
        targetFiles: [filePath]
      };
      
      console.log(`${options.dryRun ? 'Simulating fixes' : 'Fixing'} for: ${file}`);
      
      // Run fixer targeting only this file
      const result = await fixTypeScriptErrors(options.root, options.project, fixOptions);
      
      // Display results
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`\nFixing ${options.dryRun ? 'simulation ' : ''}completed in ${duration} seconds`);
      
      if (result.fixedFiles.includes(filePath)) {
        // Get the number of fixed errors in this file
        const fileFixDetails = result.fixDetails?.filter(d => d.file === filePath) || [];
        console.log(`Fixed ${fileFixDetails.length} errors in ${file}`);
        
        // Show detailed fix information if verbose
        if (options.verbose && fileFixDetails.length > 0) {
          console.log('\nDetailed fix information:');
          for (const detail of fileFixDetails) {
            console.log(`- Line ${detail.line}: ${detail.fixDescription}`);
            if (detail.beforeFix && detail.afterFix) {
              console.log(`  Before: ${detail.beforeFix}`);
              console.log(`  After:  ${detail.afterFix}`);
              console.log('');
            }
          }
        }
      } else {
        console.log(`No errors fixed in ${file}`);
      }
      
      if (options.dryRun) {
        console.log('\nThis was a dry run. No files were modified.');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error fixing file:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command is provided
if (!program.args.length) {
  program.help();
}