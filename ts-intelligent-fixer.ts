#!/usr/bin/env node

/**
 * TypeScript Intelligent Error Fixer
 * 
 * A comprehensive command-line tool that combines error analysis and automated fixing
 * to address TypeScript errors in a project. This tool uses semantic understanding
 * of TypeScript errors to apply targeted fixes that preserve code behavior.
 * 
 * @version 1.1.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeTypeScriptErrors } from './server/utils/ts-error-analyzer';
import { fixTypeScriptErrors } from './server/utils/ts-error-fixer';
import { findErrorPatterns } from './server/utils/ts-pattern-finder';
import { initializeAnalysis, recordAnalysisResults } from './server/tsErrorStorage';
import { ErrorCategory, ErrorSeverity } from './shared/schema';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface definitions
interface AnalysisOptions {
  project: string;
  root: string;
  output?: string;
  verbose: boolean;
  deep: boolean;
  ai: boolean;
  categories?: string[];
  exclude?: string[];
  saveToDb: boolean;
}

interface FixOptions {
  project: string;
  root: string;
  backup: string | boolean;
  categories?: string[];
  maxErrors?: number;
  dryRun: boolean;
  verbose: boolean;
  interfaces: boolean;
  props: boolean;
  any: boolean;
  deepFix: boolean;
  ai: boolean;
  batch: boolean;
  exclude?: string[];
  saveToDb: boolean;
}

interface PatternOptions {
  project: string;
  root: string;
  output?: string;
  verbose: boolean;
  minOccurrences: number;
  saveToDb: boolean;
}

// Initialize commander
const program = new Command();

// Define the program
program
  .name('ts-intelligent-fixer')
  .description('Intelligent TypeScript error analysis and fixing tool')
  .version('1.1.0');

// Define analysis command
program
  .command('analyze')
  .description('Analyze TypeScript errors without fixing them')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-o, --output <path>', 'Output file for analysis results (JSON format)')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-d, --deep', 'Perform deep analysis with dependency tracking')
  .option('-a, --ai', 'Use OpenAI to enhance analysis (requires OPENAI_API_KEY)')
  .option('-c, --categories <list>', 'Comma-separated list of error categories to analyze')
  .option('-e, --exclude <list>', 'Comma-separated list of files or directories to exclude')
  .option('--no-save', 'Don\'t save analysis results to the database')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔍 Analyzing TypeScript errors...\n'));
      
      // Parse categories and exclusions if provided
      const categories = options.categories 
        ? options.categories.split(',').map(c => c.trim())
        : undefined;
      
      const exclude = options.exclude
        ? options.exclude.split(',').map(e => e.trim())
        : undefined;
      
      const analysisOptions: AnalysisOptions = {
        project: options.project,
        root: options.root,
        output: options.output,
        verbose: options.verbose || false,
        deep: options.deep || false,
        ai: options.ai || false,
        categories,
        exclude,
        saveToDb: options.save !== false
      };
      
      let analysisId: number | undefined;
      
      // Initialize analysis in database if saving is enabled
      if (analysisOptions.saveToDb) {
        analysisId = await initializeAnalysis({
          projectRoot: analysisOptions.root,
          startedAt: new Date(),
          status: 'in_progress',
          analysisType: analysisOptions.deep ? 'deep' : 'basic',
          totalFiles: 0,
          totalErrors: 0
        });
      }
      
      const analysis = await analyzeTypeScriptErrors(
        analysisOptions.root, 
        analysisOptions.project,
        {
          deep: analysisOptions.deep,
          useAI: analysisOptions.ai,
          categories: analysisOptions.categories,
          exclude: analysisOptions.exclude
        }
      );
      
      // Save analysis results to database if enabled
      if (analysisOptions.saveToDb && analysisId) {
        await recordAnalysisResults(analysisId, analysis);
      }
      
      // Print summary
      console.log(chalk.blue(`\n📊 Found ${chalk.yellow(analysis.totalErrors.toString())} TypeScript errors:`));
      console.log(`  ${chalk.red('🔴 Critical:')} ${analysis.criticalErrors}`);
      console.log(`  ${chalk.hex('#FF7700')('🟠 High:')} ${analysis.highSeverityErrors}`);
      console.log(`  ${chalk.yellow('🟡 Medium:')} ${analysis.mediumSeverityErrors}`);
      console.log(`  ${chalk.green('🟢 Low:')} ${analysis.lowSeverityErrors}`);
      
      // Print errors by category
      console.log(chalk.blue('\n📋 Errors by category:'));
      for (const category in analysis.errorsByCategory) {
        const count = analysis.errorsByCategory[category].length;
        if (count > 0) {
          console.log(`  ${category}: ${count}`);
        }
      }
      
      // Print files with errors
      console.log(chalk.blue('\n📁 Files with errors:'));
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
        console.log(chalk.blue('\n🔬 Detailed errors:'));
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
      
      // Print dependency information if deep analysis
      if (options.deep && analysis.dependencyInfo) {
        console.log(chalk.blue('\n🔄 Dependency Information:'));
        console.log(`  Root cause errors: ${analysis.dependencyInfo.rootCauses.length}`);
        console.log(`  Cascading errors: ${analysis.dependencyInfo.cascadingErrors.length}`);
        
        if (options.verbose) {
          console.log(chalk.blue('\n🌲 Root Cause Errors:'));
          for (const rootCause of analysis.dependencyInfo.rootCauses) {
            console.log(`  ${rootCause.file}:${rootCause.line} - ${rootCause.message}`);
            console.log(`    Impacts ${rootCause.impactedErrors.length} other errors`);
          }
        }
      }
      
      // Save to file if requested
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(analysis, null, 2));
        console.log(chalk.blue(`\n💾 Analysis saved to ${options.output}`));
      }
      
      console.log(chalk.green('\n✅ Analysis complete'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error analyzing TypeScript errors:`), error);
      process.exit(1);
    }
  });

// Define fix command
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
  .option('--deep-fix', 'Enable fixing dependencies and cascading errors')
  .option('-a, --ai', 'Use OpenAI to enhance fixes (requires OPENAI_API_KEY)')
  .option('--no-batch', 'Disable batch fixing (fix one at a time)')
  .option('-e, --exclude <list>', 'Comma-separated list of files or directories to exclude')
  .option('--no-save', 'Don\'t save fix results to the database')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔧 Fixing TypeScript errors...\n'));
      
      // Parse categories if provided
      const categories = options.categories 
        ? options.categories.split(',').map(c => c.trim())
        : undefined;
      
      const exclude = options.exclude
        ? options.exclude.split(',').map(e => e.trim())
        : undefined;
      
      const fixOptions: FixOptions = {
        project: options.project,
        root: options.root,
        backup: options.backup,
        categories,
        maxErrors: options.maxErrors ? parseInt(options.maxErrors, 10) : undefined,
        dryRun: options.dryRun || false,
        verbose: options.verbose || false,
        interfaces: options.interfaces !== false,
        props: options.props !== false,
        any: options.any !== false,
        deepFix: options.deepFix || false,
        ai: options.ai || false,
        batch: options.batch !== false,
        exclude,
        saveToDb: options.save !== false
      };
      
      // Convert options to the format expected by fixTypeScriptErrors
      const fixerOptions = {
        createBackups: fixOptions.backup !== false,
        backupDir: typeof fixOptions.backup === 'string' ? fixOptions.backup : './ts-error-fixes-backup',
        categories: fixOptions.categories,
        maxErrorsPerFile: fixOptions.maxErrors,
        logLevel: fixOptions.verbose ? 'verbose' : 'normal',
        dryRun: fixOptions.dryRun,
        generateTypeDefinitions: fixOptions.interfaces,
        fixMissingInterfaces: fixOptions.interfaces,
        fixImplicitAny: fixOptions.any,
        fixMissingProperties: fixOptions.props,
        prioritizeCriticalErrors: true,
        fixDependencies: fixOptions.deepFix,
        useAI: fixOptions.ai,
        batchFix: fixOptions.batch,
        exclude: fixOptions.exclude,
        saveToDb: fixOptions.saveToDb
      };
      
      const result = await fixTypeScriptErrors(fixOptions.root, fixOptions.project, fixerOptions);
      
      // Print summary
      console.log(chalk.blue(`\n📊 Fixed ${chalk.green(result.fixedErrors.toString())} of ${chalk.yellow(result.totalErrors.toString())} TypeScript errors`));
      console.log(`  ${chalk.green('✅ Fixed files:')} ${result.fixedFiles.length}`);
      console.log(`  ${chalk.yellow('⚠️ Files with remaining errors:')} ${result.unfixableFiles.length}`);
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n⚠️ This was a dry run. No files were modified.'));
      }
      
      // Print fixed files if verbose
      if (options.verbose) {
        console.log(chalk.blue('\n📄 Fixed files:'));
        for (const file of result.fixedFiles) {
          console.log(`  ${path.relative(options.root, file)}`);
        }
        
        if (result.unfixableFiles.length > 0) {
          console.log(chalk.blue('\n❌ Files with remaining errors:'));
          for (const file of result.unfixableFiles) {
            console.log(`  ${path.relative(options.root, file)}`);
          }
        }
        
        // Print fix details if available
        if (result.fixDetails && result.fixDetails.length > 0) {
          console.log(chalk.blue('\n🛠️ Fix details:'));
          for (const fix of result.fixDetails) {
            console.log(`  ${fix.file}:${fix.line} - ${fix.errorMessage}`);
            console.log(`    ${chalk.green('✓')} Applied fix: ${fix.fixDescription}`);
          }
        }
      }
      
      console.log(chalk.blue(`\n✅ Fix operation completed in ${chalk.yellow((result.duration / 1000).toFixed(2))}s`));
      
      if (result.unfixedErrors > 0) {
        console.log(chalk.yellow(`\n⚠️ ${result.unfixedErrors} errors could not be fixed automatically.`));
        console.log(chalk.yellow('   Run the analyze command for more details.'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error fixing TypeScript errors:`), error);
      process.exit(1);
    }
  });

// Define pattern finding command
program
  .command('patterns')
  .description('Find common error patterns in TypeScript code')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-o, --output <path>', 'Output file for pattern results (JSON format)')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-m, --min-occurrences <number>', 'Minimum number of occurrences to consider a pattern', '3')
  .option('--no-save', 'Don\'t save patterns to the database')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔍 Finding TypeScript error patterns...\n'));
      
      const patternOptions: PatternOptions = {
        project: options.project,
        root: options.root,
        output: options.output,
        verbose: options.verbose || false,
        minOccurrences: parseInt(options.minOccurrences, 10),
        saveToDb: options.save !== false
      };
      
      const patterns = await findErrorPatterns(
        patternOptions.root,
        patternOptions.project,
        {
          minOccurrences: patternOptions.minOccurrences,
          saveToDb: patternOptions.saveToDb
        }
      );
      
      // Print patterns
      console.log(chalk.blue(`\n📊 Found ${chalk.yellow(patterns.length.toString())} error patterns:`));
      
      for (const pattern of patterns) {
        console.log(`\n  ${chalk.underline(pattern.name)} (${pattern.occurrences} occurrences)`);
        console.log(`  Category: ${pattern.category}`);
        console.log(`  Severity: ${pattern.severity}`);
        console.log(`  Auto-fixable: ${pattern.autoFixable ? chalk.green('Yes') : chalk.red('No')}`);
        
        if (options.verbose) {
          console.log(`  Pattern: ${pattern.pattern}`);
          console.log(`  Description: ${pattern.description}`);
          
          if (pattern.suggestedFix) {
            console.log(`  Suggested fix: ${pattern.suggestedFix}`);
          }
          
          console.log(`  Example files:`);
          for (const example of pattern.examples.slice(0, 3)) {
            console.log(`    ${example.file}:${example.line}`);
          }
        }
      }
      
      // Save to file if requested
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(patterns, null, 2));
        console.log(chalk.blue(`\n💾 Patterns saved to ${options.output}`));
      }
      
      console.log(chalk.green('\n✅ Pattern analysis complete'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error finding TypeScript error patterns:`), error);
      process.exit(1);
    }
  });

// Define verify command
program
  .command('verify')
  .description('Verify that TypeScript errors were fixed correctly')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔍 Verifying TypeScript errors after fixing...\n'));
      
      // Run analysis again to verify fixes
      const analysis = await analyzeTypeScriptErrors(
        options.root, 
        options.project,
        { saveToDb: false }
      );
      
      if (analysis.totalErrors === 0) {
        console.log(chalk.green('✅ Great news! No TypeScript errors found.'));
        console.log(chalk.green('   Your codebase is now TypeScript error-free!'));
      } else {
        console.log(chalk.yellow(`⚠️ Found ${analysis.totalErrors} remaining TypeScript errors:`));
        console.log(`  ${chalk.red('🔴 Critical:')} ${analysis.criticalErrors}`);
        console.log(`  ${chalk.hex('#FF7700')('🟠 High:')} ${analysis.highSeverityErrors}`);
        console.log(`  ${chalk.yellow('🟡 Medium:')} ${analysis.mediumSeverityErrors}`);
        console.log(`  ${chalk.green('🟢 Low:')} ${analysis.lowSeverityErrors}`);
        
        console.log(chalk.blue('\n📋 Remaining errors by category:'));
        for (const category in analysis.errorsByCategory) {
          const count = analysis.errorsByCategory[category].length;
          if (count > 0) {
            console.log(`  ${category}: ${count}`);
          }
        }

        if (options.verbose) {
          console.log(chalk.blue('\n📁 Files with remaining errors:'));
          const sortedFiles = Object.entries(analysis.errorsByFile)
            .sort((a, b) => b[1].length - a[1].length);
          
          for (const [file, errors] of sortedFiles) {
            console.log(`  ${path.relative(options.root, file)}: ${errors.length} errors`);
          }
        }
        
        console.log(chalk.blue('\n💡 Suggestion: Run the fix command again to address more errors,'));
        console.log(chalk.blue('   or inspect errors using the analyze command.'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error verifying TypeScript errors:`), error);
      process.exit(1);
    }
  });

// Define stats command
program
  .command('stats')
  .description('Show statistics about TypeScript errors and fixes')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-d, --days <number>', 'Number of days to include in stats', '30')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n📊 TypeScript Error Statistics\n'));
      
      // Run analysis to get current state
      const analysis = await analyzeTypeScriptErrors(
        options.root, 
        options.project,
        { saveToDb: false }
      );

      // Print current stats
      console.log(chalk.blue('Current Status:'));
      console.log(`  Total errors: ${analysis.totalErrors}`);
      console.log(`  Files with errors: ${Object.keys(analysis.errorsByFile).length}`);
      console.log(`  Error distribution:`);
      console.log(`    Critical: ${analysis.criticalErrors}`);
      console.log(`    High: ${analysis.highSeverityErrors}`);
      console.log(`    Medium: ${analysis.mediumSeverityErrors}`);
      console.log(`    Low: ${analysis.lowSeverityErrors}`);
      
      // TODO: Add historical stats from database

      if (options.verbose) {
        console.log(chalk.blue('\nTop error categories:'));
        const categories = Object.entries(analysis.errorsByCategory)
          .sort((a, b) => b[1].length - a[1].length);
        
        for (const [category, errors] of categories) {
          console.log(`  ${category}: ${errors.length}`);
        }
        
        console.log(chalk.blue('\nTop error files:'));
        const files = Object.entries(analysis.errorsByFile)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 10);
        
        for (const [file, errors] of files) {
          console.log(`  ${path.relative(options.root, file)}: ${errors.length}`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error getting TypeScript statistics:`), error);
      process.exit(1);
    }
  });

// Define fix-file command
program
  .command('fix-file')
  .description('Fix TypeScript errors in a specific file')
  .argument('<file>', 'Path to the file to fix')
  .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('-b, --backup <dir>', 'Directory for backups', './ts-error-fixes-backup')
  .option('--no-backup', 'Disable file backups')
  .option('-d, --dry-run', 'Show what would be fixed without making changes')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-a, --ai', 'Use OpenAI to enhance fixes (requires OPENAI_API_KEY)')
  .action(async (file, options) => {
    try {
      const filePath = path.resolve(options.root, file);
      console.log(chalk.blue(`\n🔧 Fixing TypeScript errors in ${file}...\n`));
      
      // Convert options to the format expected by fixTypeScriptErrors
      const fixerOptions = {
        createBackups: options.backup !== false,
        backupDir: typeof options.backup === 'string' ? options.backup : './ts-error-fixes-backup',
        logLevel: options.verbose ? 'verbose' : 'normal',
        dryRun: options.dryRun || false,
        generateTypeDefinitions: true,
        fixMissingInterfaces: true,
        fixImplicitAny: true,
        fixMissingProperties: true,
        prioritizeCriticalErrors: true,
        useAI: options.ai || false,
        targetFiles: [filePath],
        saveToDb: true
      };
      
      const result = await fixTypeScriptErrors(options.root, options.project, fixerOptions);
      
      // Print summary
      if (result.fixedFiles.includes(filePath)) {
        console.log(chalk.green(`\n✅ Successfully fixed errors in ${file}`));
        
        if (options.verbose && result.fixDetails) {
          const fileFixDetails = result.fixDetails.filter(d => d.file === filePath);
          console.log(chalk.blue('\n🛠️ Fixes applied:'));
          for (const fix of fileFixDetails) {
            console.log(`  Line ${fix.line}: ${fix.errorMessage}`);
            console.log(`    ${chalk.green('✓')} ${fix.fixDescription}`);
          }
        }
      } else if (result.unfixableFiles.includes(filePath)) {
        console.log(chalk.yellow(`\n⚠️ Some errors in ${file} could not be fixed automatically`));
        console.log(chalk.yellow('   Run the analyze command for more details.'));
      } else {
        console.log(chalk.green(`\n✅ No errors found in ${file}`));
      }
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n⚠️ This was a dry run. No files were modified.'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error fixing TypeScript errors in file:`), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}