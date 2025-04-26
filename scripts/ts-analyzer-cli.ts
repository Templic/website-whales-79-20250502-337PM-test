#!/usr/bin/env node

/**
 * TypeScript Error Management CLI
 * 
 * This command-line utility provides a comprehensive interface for managing TypeScript errors
 * in a project. It includes scanning, analysis, and fixing capabilities.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as scanner from '../server/utils/ts-scanner';
import * as analyzer from '../server/utils/openai-integration';
import * as fixer from '../server/utils/ts-error-fixer';
import { tsErrorStorage } from '../server/tsErrorStorage';
import { ErrorStatus, ErrorSeverity, ErrorCategory } from '../shared/schema';
import path from 'path';
import fs from 'fs';

// Initialize the CLI
const program = new Command();

program
  .name('ts-analyzer')
  .description('Advanced TypeScript error management utility')
  .version('1.0.0');

// Helper for displaying error counts by category
function displayErrorCounts(categories: Record<string, number>) {
  console.log(chalk.bold('\nErrors by category:'));
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
}

// Helper for displaying error counts by file
function displayErrorsByFile(files: Record<string, number>) {
  console.log(chalk.bold('\nTop files with errors:'));
  Object.entries(files)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([file, count]) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`  ${relativePath}: ${count}`);
    });
}

// Helper for displaying scan summary
function displayScanSummary(result: scanner.ScanResult) {
  console.log(chalk.bold('\nScan Summary:'));
  console.log(`Total errors: ${chalk.red(result.totalErrors.toString())}`);
  console.log(`  Critical: ${chalk.red(result.criticalErrors.toString())}`);
  console.log(`  High: ${chalk.yellow(result.highErrors.toString())}`);
  console.log(`  Medium: ${chalk.blue(result.mediumErrors.toString())}`);
  console.log(`  Low: ${chalk.green(result.lowErrors.toString())}`);
  console.log(`New errors found: ${result.newErrorsFound}`);
  console.log(`Scan duration: ${result.scanDurationMs}ms`);
  
  if (Object.keys(result.errorsByCategory).length > 0) {
    displayErrorCounts(result.errorsByCategory);
  }
  
  if (Object.keys(result.errorsByFile).length > 0) {
    displayErrorsByFile(result.errorsByFile);
  }
}

// Helper for generating an error report
async function generateErrorReport(outputFile: string) {
  try {
    // Get error statistics
    const stats = await tsErrorStorage.getTypeScriptErrorStats();
    
    // Get recent scans
    const recentScans = await tsErrorStorage.getRecentScanResults(5);
    
    // Get critical errors
    const criticalErrors = await tsErrorStorage.getTypeScriptErrorsBySeverity(ErrorSeverity.CRITICAL);
    
    // Generate the report
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      recentScans,
      criticalErrors: criticalErrors.map(error => ({
        id: error.id,
        code: error.error_code,
        file: error.file_path,
        line: error.line_number,
        message: error.error_message
      }))
    };
    
    // Write the report to a file
    fs.writeFileSync(
      outputFile,
      JSON.stringify(report, null, 2),
      'utf8'
    );
    
    console.log(chalk.green(`Error report saved to ${outputFile}`));
    return true;
  } catch (err) {
    console.error(chalk.red('Failed to generate error report:'), err);
    return false;
  }
}

// === SCAN COMMANDS ===

// Scan command
program
  .command('scan')
  .description('Scan the project for TypeScript errors')
  .option('-p, --project <path>', 'Project root directory', '.')
  .option('-t, --tsconfig <path>', 'Path to tsconfig.json', './tsconfig.json')
  .option('-d, --deep', 'Perform a deep scan')
  .option('-a, --ai', 'Use AI to enhance error analysis')
  .option('-i, --incremental', 'Only store new errors')
  .option('-v, --verbose', 'Verbose output')
  .option('-m, --max-errors <number>', 'Maximum number of errors to process', '500')
  .option('-e, --exclude <patterns...>', 'Directories or files to exclude')
  .option('-f, --files <patterns...>', 'Specific files to scan')
  .option('--report <file>', 'Generate a JSON report file')
  .action(async (options) => {
    const spinner = ora('Scanning project for TypeScript errors...').start();
    
    try {
      // Configure scan options
      const scanOptions: scanner.ScannerOptions = {
        project: options.project,
        tsconfig: options.tsconfig,
        deepScan: options.deep,
        aiEnhanced: options.ai,
        incremental: options.incremental !== false,
        verbose: options.verbose,
        maxErrors: parseInt(options.maxErrors, 10)
      };
      
      if (options.exclude) {
        scanOptions.exclude = options.exclude;
      }
      
      if (options.files) {
        scanOptions.include = options.files;
      }
      
      // Run the scan
      let scanFn = options.deep
        ? scanner.deepScan
        : options.incremental
          ? scanner.incrementalScan
          : scanner.scanForErrors;
          
      if (options.ai) {
        scanFn = scanner.aiEnhancedScan;
      }
      
      const result = await scanFn(scanOptions);
      
      // Display the results
      spinner.succeed(`Scan completed. Found ${result.totalErrors} errors (${result.newErrorsFound} new).`);
      displayScanSummary(result);
      
      // Generate a report if requested
      if (options.report) {
        await generateErrorReport(options.report);
      }
    } catch (err) {
      spinner.fail('Scan failed');
      console.error(chalk.red('Error:'), err);
    }
  });

// Scan file command
program
  .command('scan-file <file>')
  .description('Scan a specific file for TypeScript errors')
  .option('-v, --verbose', 'Verbose output')
  .option('-a, --ai', 'Use AI to enhance error analysis')
  .action(async (file, options) => {
    const spinner = ora(`Scanning ${file} for TypeScript errors...`).start();
    
    try {
      const result = await scanner.scanFile(file, {
        verbose: options.verbose,
        aiEnhanced: options.ai
      });
      
      spinner.succeed(`Scan completed. Found ${result.totalErrors} errors in ${file}.`);
      displayScanSummary(result);
    } catch (err) {
      spinner.fail(`Failed to scan ${file}`);
      console.error(chalk.red('Error:'), err);
    }
  });

// === ANALYZE COMMANDS ===

// Analyze command
program
  .command('analyze')
  .description('Analyze TypeScript errors using AI')
  .option('-e, --error <id>', 'Analyze a specific error by ID')
  .option('-c, --code <code>', 'Analyze errors with a specific error code', '')
  .option('-s, --severity <severity>', 'Analyze errors with a specific severity', '')
  .option('-f, --file <path>', 'Analyze errors in a specific file', '')
  .option('-l, --limit <number>', 'Maximum number of errors to analyze', '10')
  .option('-m, --model <model>', 'OpenAI model to use', 'gpt-4o')
  .option('-t, --temp <temperature>', 'Model temperature (0-1)', '0.2')
  .option('--force', 'Force re-analysis of already analyzed errors')
  .option('--dry-run', 'Show what would be analyzed without doing it')
  .option('--report <file>', 'Generate a JSON report file')
  .action(async (options) => {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error(chalk.red('Error:'), 'OPENAI_API_KEY environment variable is not set');
      return;
    }
    
    const spinner = ora('Analyzing TypeScript errors...').start();
    
    try {
      // Configure the analysis options
      const analysisOptions = {
        model: options.model,
        temperature: parseFloat(options.temp)
      };
      
      // Get the errors to analyze
      let errors = [];
      
      if (options.error) {
        // Analyze a specific error
        const error = await tsErrorStorage.getTypeScriptErrorById(parseInt(options.error, 10));
        if (error) {
          errors = [error];
        } else {
          spinner.fail(`Error with ID ${options.error} not found`);
          return;
        }
      } else if (options.code) {
        // Analyze errors with a specific code
        errors = await tsErrorStorage.getTypeScriptErrorsByCode(options.code);
      } else if (options.severity) {
        // Analyze errors with a specific severity
        errors = await tsErrorStorage.getTypeScriptErrorsBySeverity(options.severity);
      } else if (options.file) {
        // Analyze errors in a specific file
        errors = await tsErrorStorage.getTypeScriptErrorsByFile(options.file);
      } else {
        // Get all pending errors
        errors = await tsErrorStorage.getAllTypeScriptErrors({ status: ErrorStatus.PENDING });
      }
      
      // Limit the number of errors
      errors = errors.slice(0, parseInt(options.limit, 10));
      
      if (errors.length === 0) {
        spinner.info('No matching errors found to analyze');
        return;
      }
      
      spinner.text = `Analyzing ${errors.length} TypeScript errors...`;
      
      if (options.dryRun) {
        spinner.succeed(`Would analyze ${errors.length} errors (dry run)`);
        errors.forEach(error => {
          console.log(`  [${error.id}] ${error.file_path}:${error.line_number} - ${error.error_code}: ${error.error_message.substring(0, 100)}...`);
        });
        return;
      }
      
      // Analyze the errors
      const errorIds = errors.map(error => error.id);
      const analyses = await analyzer.batchAnalyzeErrors(errorIds, analysisOptions);
      
      spinner.succeed(`Analyzed ${analyses.length} TypeScript errors`);
      
      // Display the results
      analyses.forEach((analysis, index) => {
        const error = errors[index];
        console.log(chalk.bold(`\nError #${error.id} (${error.error_code}):`));
        console.log(`File: ${error.file_path}:${error.line_number}:${error.column_number}`);
        console.log(`Message: ${error.error_message}`);
        console.log(chalk.cyan('Analysis:'));
        
        const data = analysis.analysis_data;
        if (data.explanation) {
          console.log(`  ${chalk.yellow('Explanation:')} ${data.explanation.substring(0, 200)}...`);
        }
        if (data.rootCause) {
          console.log(`  ${chalk.yellow('Root Cause:')} ${data.rootCause.substring(0, 200)}...`);
        }
        if (data.suggestedFix) {
          console.log(`  ${chalk.yellow('Suggested Fix:')} ${data.suggestedFix.substring(0, 200)}...`);
        }
        if (data.complexityRating) {
          console.log(`  ${chalk.yellow('Complexity:')} ${data.complexityRating}/10`);
        }
        if (data.severityRating) {
          console.log(`  ${chalk.yellow('Severity:')} ${data.severityRating}/10`);
        }
      });
      
      // Generate a report if requested
      if (options.report) {
        fs.writeFileSync(
          options.report,
          JSON.stringify({ errors, analyses }, null, 2),
          'utf8'
        );
        console.log(chalk.green(`Analysis report saved to ${options.report}`));
      }
    } catch (err) {
      spinner.fail('Analysis failed');
      console.error(chalk.red('Error:'), err);
    }
  });

// === FIX COMMANDS ===

// Fix command
program
  .command('fix')
  .description('Automatically fix TypeScript errors')
  .option('-e, --error <id>', 'Fix a specific error by ID')
  .option('-c, --code <code>', 'Fix errors with a specific error code', '')
  .option('-s, --severity <severity>', 'Fix errors with a specific severity', '')
  .option('-f, --file <path>', 'Fix errors in a specific file', '')
  .option('-l, --limit <number>', 'Maximum number of errors to fix', '10')
  .option('--strategy <strategy>', 'Fix strategy (safe, balanced, aggressive)', 'balanced')
  .option('--no-backup', 'Do not create backups of modified files')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--report <file>', 'Generate a JSON report file')
  .action(async (options) => {
    const spinner = ora('Finding TypeScript errors to fix...').start();
    
    try {
      // Configure fix options
      const fixOptions: fixer.ErrorFixerOptions = {
        dryRun: options.dryRun,
        backupFiles: options.backup !== false,
        applyStrategy: options.strategy as any,
        maxErrorsToFix: parseInt(options.limit, 10)
      };
      
      // Get the errors to fix
      let errors = [];
      
      if (options.error) {
        // Fix a specific error
        const error = await tsErrorStorage.getTypeScriptErrorById(parseInt(options.error, 10));
        if (error) {
          errors = [error];
        } else {
          spinner.fail(`Error with ID ${options.error} not found`);
          return;
        }
      } else if (options.code) {
        // Fix errors with a specific code
        errors = await tsErrorStorage.getTypeScriptErrorsByCode(options.code, ErrorStatus.PENDING);
      } else if (options.severity) {
        // Fix errors with a specific severity
        errors = await tsErrorStorage.getTypeScriptErrorsBySeverity(options.severity, ErrorStatus.PENDING);
      } else if (options.file) {
        // Fix errors in a specific file
        errors = await tsErrorStorage.getTypeScriptErrorsByFile(options.file, ErrorStatus.PENDING);
      } else {
        // Get all pending errors
        errors = await tsErrorStorage.getAllTypeScriptErrors({ status: ErrorStatus.PENDING });
      }
      
      // Limit the number of errors
      errors = errors.slice(0, fixOptions.maxErrorsToFix);
      
      if (errors.length === 0) {
        spinner.info('No matching errors found to fix');
        return;
      }
      
      spinner.text = `Attempting to fix ${errors.length} TypeScript errors...`;
      
      if (options.dryRun) {
        spinner.succeed(`Would attempt to fix ${errors.length} errors (dry run)`);
        errors.forEach(error => {
          console.log(`  [${error.id}] ${error.file_path}:${error.line_number} - ${error.error_code}: ${error.error_message.substring(0, 100)}...`);
        });
      } else {
        // Fix the errors
        const errorIds = errors.map(error => error.id);
        const results = await fixer.fixErrors(errorIds, fixOptions);
        
        // Count successes and failures
        const successes = results.filter(r => r.success).length;
        const failures = results.length - successes;
        
        spinner.succeed(`Fixed ${successes} TypeScript errors (${failures} failed)`);
        
        // Display the results
        results.forEach(result => {
          if (result.success) {
            console.log(chalk.green(`✓ Fixed error #${result.error.id} in ${result.error.file_path}:${result.error.line_number}`));
          } else {
            console.log(chalk.red(`✗ Failed to fix error #${result.error?.id || 'unknown'}: ${result.message}`));
          }
        });
        
        // Generate a report if requested
        if (options.report) {
          fs.writeFileSync(
            options.report,
            JSON.stringify({ results }, null, 2),
            'utf8'
          );
          console.log(chalk.green(`Fix report saved to ${options.report}`));
        }
      }
    } catch (err) {
      spinner.fail('Fix operation failed');
      console.error(chalk.red('Error:'), err);
    }
  });

// === UTILITY COMMANDS ===

// Stats command
program
  .command('stats')
  .description('Show TypeScript error statistics')
  .option('--report <file>', 'Generate a JSON report file')
  .action(async (options) => {
    const spinner = ora('Gathering TypeScript error statistics...').start();
    
    try {
      // Get error statistics
      const stats = await tsErrorStorage.getTypeScriptErrorStats();
      
      spinner.succeed('Statistics loaded');
      
      console.log(chalk.bold('\nTypeScript Error Statistics:'));
      console.log(`Total errors: ${stats.totalErrors}`);
      console.log(`  Pending: ${stats.pendingErrors}`);
      console.log(`  Fixed: ${stats.fixedErrors}`);
      console.log(`  Ignored: ${stats.ignoredErrors}`);
      
      console.log(chalk.bold('\nBy Severity:'));
      console.log(`  Critical: ${stats.criticalErrors}`);
      console.log(`  High: ${stats.highErrors}`);
      console.log(`  Medium: ${stats.mediumErrors}`);
      console.log(`  Low: ${stats.lowErrors}`);
      
      console.log(chalk.bold('\nBy Category:'));
      for (const category in stats.errorsByCategory) {
        console.log(`  ${category}: ${stats.errorsByCategory[category]}`);
      }
      
      // Generate a report if requested
      if (options.report) {
        await generateErrorReport(options.report);
      }
    } catch (err) {
      spinner.fail('Failed to load statistics');
      console.error(chalk.red('Error:'), err);
    }
  });

// List errors command
program
  .command('list')
  .description('List TypeScript errors')
  .option('-s, --status <status>', 'Filter by status (pending, fixed, ignored)', 'pending')
  .option('-c, --code <code>', 'Filter by error code')
  .option('-f, --file <path>', 'Filter by file path')
  .option('-v, --severity <severity>', 'Filter by severity (critical, high, medium, low)')
  .option('-l, --limit <number>', 'Maximum number of errors to show', '20')
  .option('--report <file>', 'Generate a JSON report file')
  .action(async (options) => {
    const spinner = ora('Loading TypeScript errors...').start();
    
    try {
      // Build the filter
      const filter: any = {};
      
      if (options.status) {
        filter.status = options.status;
      }
      
      // Get the errors
      let errors = await tsErrorStorage.getAllTypeScriptErrors(filter);
      
      // Apply additional filters
      if (options.code) {
        errors = errors.filter(error => error.error_code === options.code);
      }
      
      if (options.file) {
        errors = errors.filter(error => error.file_path.includes(options.file));
      }
      
      if (options.severity) {
        errors = errors.filter(error => error.severity === options.severity);
      }
      
      // Limit the results
      errors = errors.slice(0, parseInt(options.limit, 10));
      
      spinner.succeed(`Found ${errors.length} TypeScript errors`);
      
      // Display the errors
      errors.forEach(error => {
        const severityColor = 
          error.severity === ErrorSeverity.CRITICAL ? chalk.red :
          error.severity === ErrorSeverity.HIGH ? chalk.yellow :
          error.severity === ErrorSeverity.MEDIUM ? chalk.blue :
          chalk.green;
        
        console.log(chalk.bold(`\n[${error.id}] ${error.error_code}:`));
        console.log(`File: ${error.file_path}:${error.line_number}:${error.column_number}`);
        console.log(`Message: ${error.error_message}`);
        console.log(`Severity: ${severityColor(error.severity)}`);
        console.log(`Status: ${error.status}`);
        console.log(`Category: ${error.category}`);
        console.log(`First detected: ${error.first_detected_at}`);
        console.log(`Occurrences: ${error.occurrence_count}`);
      });
      
      // Generate a report if requested
      if (options.report) {
        fs.writeFileSync(
          options.report,
          JSON.stringify({ errors }, null, 2),
          'utf8'
        );
        console.log(chalk.green(`Error report saved to ${options.report}`));
      }
    } catch (err) {
      spinner.fail('Failed to list errors');
      console.error(chalk.red('Error:'), err);
    }
  });

// Mark error command
program
  .command('mark <id> <status>')
  .description('Mark an error as fixed or ignored')
  .action(async (id, status) => {
    if (!['fixed', 'ignored', 'pending'].includes(status)) {
      console.error(chalk.red('Error:'), 'Status must be one of: fixed, ignored, pending');
      return;
    }
    
    const spinner = ora(`Marking error #${id} as ${status}...`).start();
    
    try {
      const error = await tsErrorStorage.getTypeScriptErrorById(parseInt(id, 10));
      
      if (!error) {
        spinner.fail(`Error with ID ${id} not found`);
        return;
      }
      
      await tsErrorStorage.updateTypeScriptError(error.id, {
        status: status as ErrorStatus,
        ...(status === 'fixed' ? { resolved_at: new Date() } : {})
      });
      
      spinner.succeed(`Marked error #${id} as ${status}`);
    } catch (err) {
      spinner.fail(`Failed to mark error #${id}`);
      console.error(chalk.red('Error:'), err);
    }
  });

// Export errors command
program
  .command('export <file>')
  .description('Export errors to a JSON file')
  .option('-s, --status <status>', 'Filter by status (pending, fixed, ignored)')
  .option('-c, --code <code>', 'Filter by error code')
  .option('-f, --file <path>', 'Filter by file path')
  .option('-v, --severity <severity>', 'Filter by severity (critical, high, medium, low)')
  .action(async (file, options) => {
    const spinner = ora('Exporting TypeScript errors...').start();
    
    try {
      // Build the filter
      const filter: any = {};
      
      if (options.status) {
        filter.status = options.status;
      }
      
      // Get the errors
      let errors = await tsErrorStorage.getAllTypeScriptErrors(filter);
      
      // Apply additional filters
      if (options.code) {
        errors = errors.filter(error => error.error_code === options.code);
      }
      
      if (options.file) {
        errors = errors.filter(error => error.file_path.includes(options.file));
      }
      
      if (options.severity) {
        errors = errors.filter(error => error.severity === options.severity);
      }
      
      // Export the errors
      fs.writeFileSync(
        file,
        JSON.stringify({ errors }, null, 2),
        'utf8'
      );
      
      spinner.succeed(`Exported ${errors.length} errors to ${file}`);
    } catch (err) {
      spinner.fail('Failed to export errors');
      console.error(chalk.red('Error:'), err);
    }
  });

// Parse the command line arguments
program.parse(process.argv);

// If no arguments are provided, show help
if (process.argv.length === 2) {
  program.help();
}