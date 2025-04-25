#!/usr/bin/env tsx

/**
 * TypeScript Analyzer CLI
 * 
 * Command-line interface for analyzing and fixing TypeScript errors in a project.
 * 
 * Usage:
 *   npx tsx scripts/ts-analyzer-cli.ts analyze              - Analyze project for TypeScript errors
 *   npx tsx scripts/ts-analyzer-cli.ts fix                  - Fix all auto-fixable errors
 *   npx tsx scripts/ts-analyzer-cli.ts stats                - Show error statistics
 *   npx tsx scripts/ts-analyzer-cli.ts fix-file [filepath]  - Fix errors in a specific file
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeProject } from '../server/utils/ts-error-analyzer';
import { fixAllErrors } from '../server/utils/ts-error-fixer';
import { tsErrorStorage } from '../server/tsErrorStorage';
import { TypescriptError } from '../shared/schema';

// Create a new program
const program = new Command();

// Set version and description
program
  .name('ts-analyzer')
  .description('TypeScript error analyzer and fixer')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze project for TypeScript errors')
  .action(async () => {
    const spinner = ora('Analyzing TypeScript project...').start();
    
    try {
      const result = await analyzeProject();
      spinner.succeed(`Analysis complete. Found ${result.totalErrors} errors.`);
      
      // Display error categories
      console.log('\nErrors by category:');
      Object.entries(result.errorsByCategory).forEach(([category, count]) => {
        console.log(`  ${chalk.yellow(category)}: ${count}`);
      });
      
      // Display error severity
      console.log('\nErrors by severity:');
      Object.entries(result.errorsBySeverity).forEach(([severity, count]) => {
        const color = 
          severity === 'critical' ? chalk.red :
          severity === 'high' ? chalk.magenta :
          severity === 'medium' ? chalk.yellow :
          chalk.blue;
        
        console.log(`  ${color(severity)}: ${count}`);
      });
      
      // Display files with errors
      console.log('\nFiles with errors:');
      result.filesWithErrors.forEach(file => {
        console.log(`  ${chalk.cyan(file)}`);
      });
      
      console.log(`\n${chalk.green('✓')} Errors stored in database for tracking and fixing.`);
      console.log(`${chalk.green('i')} Run 'ts-analyzer fix' to automatically fix supported errors.`);
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red('Error during analysis:'), error);
    }
  });

// Fix command
program
  .command('fix')
  .description('Fix all auto-fixable errors')
  .option('-a, --all', 'Include errors that are not marked as auto-fixable')
  .action(async (options) => {
    const spinner = ora('Applying fixes to TypeScript errors...').start();
    
    try {
      // Use userId 1 for system-automated fixes
      const result = await fixAllErrors(1, !options.all);
      
      spinner.succeed(`Fixing complete. Fixed ${result.fixed} errors.`);
      
      console.log('\nFix results:');
      console.log(`  ${chalk.green('Fixed')}: ${result.fixed}`);
      console.log(`  ${chalk.yellow('Partially Fixed')}: ${result.partiallyFixed}`);
      console.log(`  ${chalk.red('Failed')}: ${result.failed}`);
      console.log(`  ${chalk.blue('Needs Review')}: ${result.needsReview}`);
      
      if (result.fixedByCategory && Object.keys(result.fixedByCategory).length > 0) {
        console.log('\nFixed by category:');
        Object.entries(result.fixedByCategory).forEach(([category, count]) => {
          console.log(`  ${chalk.yellow(category)}: ${count}`);
        });
      }
      
      console.log(`\n${chalk.green('✓')} Run 'ts-analyzer analyze' to check for remaining errors.`);
    } catch (error) {
      spinner.fail('Fixing failed');
      console.error(chalk.red('Error during fixing:'), error);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show error statistics')
  .option('-d, --days <days>', 'Stats for the last N days', '30')
  .action(async (options) => {
    const spinner = ora('Fetching TypeScript error statistics...').start();
    
    try {
      // Calculate date range
      const days = parseInt(options.days);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const stats = await tsErrorStorage.getTypescriptErrorStats(fromDate);
      
      spinner.succeed(`Statistics for the last ${days} days:`);
      
      console.log(`\n${chalk.bold('Overall:')}`)
      console.log(`  ${chalk.blue('Total Errors')}: ${stats.totalErrors}`);
      console.log(`  ${chalk.green('Fix Rate')}: ${stats.fixRate.toFixed(2)}%`);
      
      console.log(`\n${chalk.bold('By Severity:')}`)
      Object.entries(stats.bySeverity).forEach(([severity, count]) => {
        const color = 
          severity === 'critical' ? chalk.red :
          severity === 'high' ? chalk.magenta :
          severity === 'medium' ? chalk.yellow :
          chalk.blue;
        
        console.log(`  ${color(severity)}: ${count}`);
      });
      
      console.log(`\n${chalk.bold('By Category:')}`)
      Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`  ${chalk.yellow(category)}: ${count}`);
      });
      
      console.log(`\n${chalk.bold('By Status:')}`)
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        const color = 
          status === 'fixed' ? chalk.green :
          status === 'detected' ? chalk.red :
          status === 'analyzing' ? chalk.yellow :
          status === 'fix_available' ? chalk.blue :
          chalk.white;
        
        console.log(`  ${color(status)}: ${count}`);
      });
      
      console.log(`\n${chalk.bold('Top Files with Errors:')}`)
      stats.topFiles.forEach(({ filePath, count }) => {
        console.log(`  ${chalk.cyan(filePath)}: ${count}`);
      });
    } catch (error) {
      spinner.fail('Failed to fetch statistics');
      console.error(chalk.red('Error fetching statistics:'), error);
    }
  });

// Fix file command
program
  .command('fix-file')
  .description('Fix errors in a specific file')
  .argument('<filepath>', 'Path to the file to fix')
  .action(async (filepath) => {
    const spinner = ora(`Fixing errors in ${filepath}...`).start();
    
    try {
      // Get errors for this file
      const errors = await tsErrorStorage.getAllTypescriptErrors({
        filePath: filepath,
        status: 'detected'
      });
      
      if (errors.length === 0) {
        spinner.info(`No unfixed errors found in ${filepath}`);
        return;
      }
      
      spinner.text = `Found ${errors.length} errors. Applying fixes...`;
      
      // Track results
      let fixed = 0;
      let partiallyFixed = 0;
      let failed = 0;
      let needsReview = 0;
      
      // We will use userId 1 for system-automated fixes
      const userId = 1;
      
      // Import the fixer dynamically to avoid circular dependencies
      const { findFixesForError, applyFix, FixResult } = await import('../server/utils/ts-error-fixer');
      
      // Process each error
      for (const error of errors) {
        // Convert to the TypeScriptError format expected by findFixesForError
        const tsError = {
          filePath: error.filePath,
          line: error.lineNumber,
          column: error.columnNumber,
          code: error.errorCode.replace(/^TS/, ''),
          message: error.errorMessage,
          category: error.category,
          severity: error.severity,
          context: error.errorContext
        };
        
        // Find fixes
        const fixes = await findFixesForError(tsError);
        
        // Apply the first auto-fixable fix
        for (const fix of fixes) {
          if (fix.autoFixable) {
            const result = await applyFix(
              error.filePath,
              error.lineNumber,
              error.columnNumber,
              fix,
              error.id,
              userId
            );
            
            if (result.success) {
              if (result.result === FixResult.SUCCESS) {
                fixed++;
              } else if (result.result === FixResult.PARTIAL) {
                partiallyFixed++;
              } else if (result.result === FixResult.NEEDS_REVIEW) {
                needsReview++;
              }
              break;
            } else {
              failed++;
            }
          } else {
            needsReview++;
          }
        }
      }
      
      spinner.succeed(`Applied fixes to ${filepath}`);
      
      console.log('\nFix results:');
      console.log(`  ${chalk.green('Fixed')}: ${fixed}`);
      console.log(`  ${chalk.yellow('Partially Fixed')}: ${partiallyFixed}`);
      console.log(`  ${chalk.red('Failed')}: ${failed}`);
      console.log(`  ${chalk.blue('Needs Review')}: ${needsReview}`);
      
      console.log(`\n${chalk.green('✓')} Run 'ts-analyzer analyze' to check for remaining errors.`);
    } catch (error) {
      spinner.fail(`Failed to fix errors in ${filepath}`);
      console.error(chalk.red('Error:'), error);
    }
  });

// Unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command'));
  console.error(`See ${chalk.cyan('ts-analyzer --help')} for a list of available commands.`);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}