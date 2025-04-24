#!/usr/bin/env node

/**
 * TypeScript Intelligent Error Fixer
 * 
 * A comprehensive command-line tool that combines error analysis and automated fixing
 * to address TypeScript errors in a project. This tool uses semantic understanding
 * of TypeScript errors to apply targeted fixes that preserve code behavior.
 * 
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { analyzeTypeScriptErrors } from './server/utils/ts-error-analyzer.js';
import { fixTypeScriptErrors } from './server/utils/ts-error-fixer.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize commander
const program = new Command();

// Define the program
program
  .name('ts-intelligent-fixer')
  .description('Intelligent TypeScript error analysis and fixing tool')
  .version('1.0.0');

// Define commands
program
  .command('analyze')
  .description('Analyze TypeScript errors without fixing them')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-o, --output <path>', 'Output file for analysis results (JSON format)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    try {
      console.log('\n🔍 Analyzing TypeScript errors...\n');
      
      const analysis = await analyzeTypeScriptErrors(options.root, options.project);
      
      // Print summary
      console.log(`\n📊 Found ${analysis.totalErrors} TypeScript errors:`);
      console.log(`  🔴 Critical: ${analysis.criticalErrors}`);
      console.log(`  🟠 High: ${analysis.highSeverityErrors}`);
      console.log(`  🟡 Medium: ${analysis.mediumSeverityErrors}`);
      console.log(`  🟢 Low: ${analysis.lowSeverityErrors}`);
      
      // Print errors by category
      console.log('\n📋 Errors by category:');
      for (const category in analysis.errorsByCategory) {
        const count = analysis.errorsByCategory[category].length;
        if (count > 0) {
          console.log(`  ${category}: ${count}`);
        }
      }
      
      // Print files with errors
      console.log('\n📁 Files with errors:');
      const sortedFiles = Object.entries(analysis.errorsByFile)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);
      
      for (const [file, errors] of sortedFiles) {
        console.log(`  ${path.relative(options.root, file)}: ${errors.length} errors`);
      }
      
      if (sortedFiles.length < Object.keys(analysis.errorsByFile).length) {
        console.log(`  ... and ${Object.keys(analysis.errorsByFile).length - sortedFiles.length} more files`);
      }
      
      // Print detailed errors if verbose
      if (options.verbose) {
        console.log('\n🔬 Detailed errors:');
        for (const [file, errors] of Object.entries(analysis.errorsByFile)) {
          console.log(`\n  📄 ${path.relative(options.root, file)}:`);
          
          for (const error of errors) {
            console.log(`    Line ${error.line}: ${error.message}`);
            if (error.lineContent) {
              console.log(`      ${error.lineContent.trim()}`);
            }
            if (error.suggestedFix) {
              console.log(`      💡 Suggestion: ${error.suggestedFix}`);
            }
          }
        }
      }
      
      // Save to file if requested
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(analysis, null, 2));
        console.log(`\n💾 Analysis saved to ${options.output}`);
      }
      
      console.log('\n✅ Analysis complete');
    } catch (error) {
      console.error(`\n❌ Error analyzing TypeScript errors:`, error);
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Fix TypeScript errors automatically')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-b, --backup <dir>', 'Directory for backups', './ts-error-fixes-backup')
  .option('--no-backup', 'Disable file backups')
  .option('-c, --categories <list>', 'Comma-separated list of error categories to fix')
  .option('-m, --max-errors <number>', 'Maximum number of errors to fix per file')
  .option('-d, --dry-run', 'Show what would be fixed without making changes')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-interfaces', 'Disable generating interface definitions')
  .option('--no-props', 'Disable fixing missing properties')
  .option('--no-any', 'Disable fixing implicit any types')
  .action(async (options) => {
    try {
      console.log('\n🔧 Fixing TypeScript errors...\n');
      
      // Parse categories if provided
      const categories = options.categories 
        ? options.categories.split(',').map(c => c.trim().toUpperCase())
        : undefined;
      
      // Convert options to the format expected by fixTypeScriptErrors
      const fixOptions = {
        createBackups: options.backup !== false,
        backupDir: options.backup,
        categories,
        maxErrorsPerFile: options.maxErrors ? parseInt(options.maxErrors, 10) : undefined,
        logLevel: options.verbose ? 'verbose' : 'normal',
        dryRun: options.dryRun || false,
        generateTypeDefinitions: options.interfaces !== false,
        fixMissingInterfaces: options.interfaces !== false,
        fixImplicitAny: options.any !== false,
        fixMissingProperties: options.props !== false,
        prioritizeCriticalErrors: true
      };
      
      const result = await fixTypeScriptErrors(options.root, options.project, fixOptions);
      
      // Print summary
      console.log(`\n📊 Fixed ${result.fixedErrors} of ${result.totalErrors} TypeScript errors`);
      console.log(`  ✅ Fixed files: ${result.fixedFiles.length}`);
      console.log(`  ⚠️ Files with remaining errors: ${result.unfixableFiles.length}`);
      
      if (options.dryRun) {
        console.log('\n⚠️ This was a dry run. No files were modified.');
      }
      
      // Print fixed files if verbose
      if (options.verbose) {
        console.log('\n📄 Fixed files:');
        for (const file of result.fixedFiles) {
          console.log(`  ${path.relative(options.root, file)}`);
        }
        
        if (result.unfixableFiles.length > 0) {
          console.log('\n❌ Files with remaining errors:');
          for (const file of result.unfixableFiles) {
            console.log(`  ${path.relative(options.root, file)}`);
          }
        }
      }
      
      console.log(`\n✅ Fix operation completed in ${(result.duration / 1000).toFixed(2)}s`);
      
      if (result.unfixedErrors > 0) {
        console.log(`\n⚠️ ${result.unfixedErrors} errors could not be fixed automatically.`);
        console.log('   Run the analyze command for more details.');
      }
    } catch (error) {
      console.error(`\n❌ Error fixing TypeScript errors:`, error);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify that TypeScript errors were fixed correctly')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .action(async (options) => {
    try {
      console.log('\n🔍 Verifying TypeScript errors after fixing...\n');
      
      // Run analysis again to verify fixes
      const analysis = await analyzeTypeScriptErrors(options.root, options.project);
      
      if (analysis.totalErrors === 0) {
        console.log('✅ Great news! No TypeScript errors found.');
        console.log('   Your codebase is now TypeScript error-free!');
      } else {
        console.log(`⚠️ Found ${analysis.totalErrors} remaining TypeScript errors:`);
        console.log(`  🔴 Critical: ${analysis.criticalErrors}`);
        console.log(`  🟠 High: ${analysis.highSeverityErrors}`);
        console.log(`  🟡 Medium: ${analysis.mediumSeverityErrors}`);
        console.log(`  🟢 Low: ${analysis.lowSeverityErrors}`);
        
        console.log('\n📋 Remaining errors by category:');
        for (const category in analysis.errorsByCategory) {
          const count = analysis.errorsByCategory[category].length;
          if (count > 0) {
            console.log(`  ${category}: ${count}`);
          }
        }
        
        console.log('\n💡 Suggestion: Run the fix command again to address more errors,');
        console.log('   or inspect errors using the analyze command.');
      }
    } catch (error) {
      console.error(`\n❌ Error verifying TypeScript errors:`, error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}