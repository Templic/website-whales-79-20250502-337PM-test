#!/usr/bin/env node

/**
 * TypeScript Error Tools
 * 
 * A CLI tool that provides commands for analyzing and fixing TypeScript errors.
 * This tool uses the TypeScript error analyzer and fixer utilities.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import readline from 'readline';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Initialize commander
const program = new Command();

// Define the program
program
  .name('ts-error-tools')
  .description('Tools for analyzing and fixing TypeScript errors')
  .version('1.0.0');

// Helper functions
const runCommand = async (command, args, cwd = projectRoot) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const message = data.toString();
      stdout += message;
      console.log(message);
    });

    child.stderr.on('data', (data) => {
      const message = data.toString();
      stderr += message;
      console.error(message);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command '${command} ${args.join(' ')}' failed with code ${code}: ${stderr}`));
      }
    });
  });
};

const askConfirmation = async (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

const formatPercentage = (value, total) => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

// Define analyze command
program
  .command('analyze')
  .description('Analyze TypeScript errors without fixing them')
  .option('-p, --path <path>', 'Path to TypeScript files to analyze', './src')
  .option('-o, --output <path>', 'Output file for analysis report (JSON format)')
  .option('-v, --verbose', 'Show detailed error information')
  .option('-s, --severity <level>', 'Filter errors by severity (critical, high, medium, low)')
  .action(async (options) => {
    try {
      console.log('\n🔍 Analyzing TypeScript errors...\n');

      // Run TypeScript compiler to get errors
      console.log('Running TypeScript compiler...');
      const tsconfig = path.join(projectRoot, 'tsconfig.json');
      
      try {
        await runCommand('npx', ['tsc', '--noEmit', '--project', tsconfig]);
        console.log('\n✅ No TypeScript errors found!');
        return;
      } catch (error) {
        // Expected to fail if there are errors
        console.log('\nAnalyzing TypeScript errors found by compiler...');
      }

      // Run our analyzer tool
      console.log('\nRunning TS Error Analyzer...');
      
      // Run the analyzer using our utility
      const { analyzeTypeScriptErrors } = await import('../server/utils/ts-error-analyzer.js');
      const analysis = await analyzeTypeScriptErrors(projectRoot, 'tsconfig.json');

      // Apply severity filter if specified
      let filteredErrors = [...analysis.errors];
      if (options.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === options.severity);
      }

      // Print analysis results
      console.log('\n📊 TypeScript Error Analysis Results:');
      console.log('---------------------------------------');
      console.log(`Total errors: ${analysis.totalErrors}`);
      console.log(`Critical errors: ${analysis.criticalErrors} (${formatPercentage(analysis.criticalErrors, analysis.totalErrors)})`);
      console.log(`High severity errors: ${analysis.highSeverityErrors} (${formatPercentage(analysis.highSeverityErrors, analysis.totalErrors)})`);
      console.log(`Medium severity errors: ${analysis.mediumSeverityErrors} (${formatPercentage(analysis.mediumSeverityErrors, analysis.totalErrors)})`);
      console.log(`Low severity errors: ${analysis.lowSeverityErrors} (${formatPercentage(analysis.lowSeverityErrors, analysis.totalErrors)})`);
      
      // Print errors by category
      console.log('\nErrors by category:');
      for (const [category, errors] of Object.entries(analysis.errorsByCategory)) {
        if (errors.length > 0) {
          console.log(`  ${category}: ${errors.length} errors (${formatPercentage(errors.length, analysis.totalErrors)})`);
        }
      }
      
      // Print top files with errors
      console.log('\nTop files with errors:');
      const sortedFiles = Object.entries(analysis.errorsByFile)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);
      
      for (const [file, errors] of sortedFiles) {
        const relativePath = path.relative(projectRoot, file);
        console.log(`  ${relativePath}: ${errors.length} errors`);
      }
      
      // Print detailed error information if verbose
      if (options.verbose) {
        console.log('\nDetailed error information:');
        
        for (const [file, errors] of Object.entries(analysis.errorsByFile)) {
          const relativePath = path.relative(projectRoot, file);
          console.log(`\n📄 ${relativePath}:`);
          
          for (const error of errors) {
            console.log(`  Line ${error.line}: ${error.message} (${error.severity})`);
            
            if (error.lineContent) {
              console.log(`    ${error.lineContent.trim()}`);
            }
            
            if (error.suggestedFix) {
              console.log(`    💡 Suggested fix: ${error.suggestedFix}`);
            }
          }
        }
      }
      
      // Save analysis to file if requested
      if (options.output) {
        const outputPath = path.resolve(projectRoot, options.output);
        fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
        console.log(`\nAnalysis saved to ${outputPath}`);
      }
      
      // Print recommendations
      console.log('\n🔧 Recommendations:');
      
      if (analysis.criticalErrors > 0) {
        console.log('  • Address critical errors first, as they prevent compilation');
      }
      
      if (analysis.errorsByCategory.TYPE_MISMATCH?.length > 0) {
        console.log('  • Fix type mismatches by ensuring variables have the correct types');
      }
      
      if (analysis.errorsByCategory.IMPLICIT_ANY?.length > 0) {
        console.log('  • Add explicit type annotations to variables with implicit any types');
      }
      
      if (analysis.errorsByCategory.MISSING_PROPERTY?.length > 0) {
        console.log('  • Add missing properties to interfaces or verify property names');
      }
      
      console.log('\nRun ts-error-tools fix to automatically fix some of these errors');
    } catch (error) {
      console.error('\n❌ Error analyzing TypeScript errors:', error);
      process.exit(1);
    }
  });

// Define fix command
program
  .command('fix')
  .description('Fix TypeScript errors automatically')
  .option('-p, --path <path>', 'Path to TypeScript files to fix', './src')
  .option('-b, --backup-dir <dir>', 'Backup directory for modified files', './ts-error-fixes-backup')
  .option('--no-backup', 'Skip creating backups of modified files')
  .option('-c, --categories <list>', 'Comma-separated list of error categories to fix')
  .option('-m, --max-per-file <number>', 'Maximum number of errors to fix per file')
  .option('-d, --dry-run', 'Show what would be fixed without making changes')
  .option('-s, --severity <level>', 'Fix only errors with this severity (critical, high, medium, low)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    try {
      console.log('\n🔧 Fixing TypeScript errors...\n');

      // Parse error categories if specified
      const categories = options.categories ? options.categories.split(',') : undefined;
      
      // Run our analyzer tool first to get error count
      console.log('Analyzing TypeScript errors first...');
      
      // Run the analyzer using our utility
      const { analyzeTypeScriptErrors } = await import('../server/utils/ts-error-analyzer.js');
      const { fixTypeScriptErrors } = await import('../server/utils/ts-error-fixer.js');
      const analysis = await analyzeTypeScriptErrors(projectRoot, 'tsconfig.json');
      
      console.log(`Found ${analysis.totalErrors} TypeScript errors`);
      
      if (analysis.totalErrors === 0) {
        console.log('\n✅ No TypeScript errors to fix!');
        return;
      }
      
      // Filter errors by severity if specified
      let fixableCounts = {
        IMPLICIT_ANY: analysis.errorsByCategory.IMPLICIT_ANY?.length || 0,
        MISSING_PROPERTY: analysis.errorsByCategory.MISSING_PROPERTY?.length || 0,
        TYPE_MISMATCH: analysis.errorsByCategory.TYPE_MISMATCH?.length || 0,
        NULL_UNDEFINED: analysis.errorsByCategory.NULL_UNDEFINED?.length || 0
      };
      
      const totalFixableErrors = Object.values(fixableCounts).reduce((sum, count) => sum + count, 0);
      
      console.log(`\nEstimated fixable errors: ${totalFixableErrors} of ${analysis.totalErrors} (${formatPercentage(totalFixableErrors, analysis.totalErrors)})`);
      
      // Confirm before proceeding
      if (!options.yes && !options.dryRun) {
        const confirmed = await askConfirmation('Do you want to proceed with fixing these errors?');
        if (!confirmed) {
          console.log('Fix operation cancelled');
          return;
        }
      }
      
      // Set up fix options
      const fixOptions = {
        createBackups: options.backup !== false,
        backupDir: options.backupDir,
        categories,
        maxErrorsPerFile: options.maxPerFile ? parseInt(options.maxPerFile, 10) : undefined,
        logLevel: 'normal',
        dryRun: options.dryRun,
        generateTypeDefinitions: true,
        fixMissingInterfaces: true,
        fixImplicitAny: true,
        fixMissingProperties: true,
        prioritizeCriticalErrors: true,
        severity: options.severity
      };
      
      console.log('\nRunning TypeScript error fixer...');
      
      // Run the fixer
      const result = await fixTypeScriptErrors(projectRoot, 'tsconfig.json', fixOptions);
      
      // Print results
      console.log('\n📊 Fix Results:');
      console.log('------------------------');
      console.log(`Fixed ${result.fixedErrors} of ${result.totalErrors} errors (${formatPercentage(result.fixedErrors, result.totalErrors)})`);
      console.log(`Files with fixes: ${result.fixedFiles.length}`);
      console.log(`Files still with errors: ${result.unfixableFiles.length}`);
      console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
      
      if (options.dryRun) {
        console.log('\n⚠️ This was a dry run. No files were modified.');
      }
      
      // Suggest next steps
      console.log('\n🔄 Next Steps:');
      
      if (result.unfixedErrors > 0) {
        console.log(`  • ${result.unfixedErrors} errors still need to be fixed manually`);
        console.log('  • Run ts-error-tools analyze to see the remaining errors');
      } else {
        console.log('  • All fixable errors have been addressed!');
      }
      
      if (options.dryRun) {
        console.log('  • Run without --dry-run to apply the fixes');
      }
      
      // Run validation if fixes were applied
      if (result.fixedErrors > 0 && !options.dryRun) {
        console.log('\n🔍 Verifying fixes...');
        
        const verificationAnalysis = await analyzeTypeScriptErrors(projectRoot, 'tsconfig.json');
        
        console.log(`Errors after fixing: ${verificationAnalysis.totalErrors} (${formatPercentage(verificationAnalysis.totalErrors, analysis.totalErrors)} of original)`);
        
        if (verificationAnalysis.totalErrors === 0) {
          console.log('\n✅ All TypeScript errors have been fixed!');
        } else {
          console.log('\n⚠️ Some errors remain. Run ts-error-tools analyze to see them');
        }
      }
    } catch (error) {
      console.error('\n❌ Error fixing TypeScript errors:', error);
      process.exit(1);
    }
  });

// Define verify command
program
  .command('verify')
  .description('Verify TypeScript code compiles without errors')
  .action(async () => {
    try {
      console.log('\n🔍 Verifying TypeScript code...\n');

      // Run TypeScript compiler to check for errors
      const tsconfig = path.join(projectRoot, 'tsconfig.json');
      
      try {
        await runCommand('npx', ['tsc', '--noEmit', '--project', tsconfig]);
        console.log('\n✅ TypeScript verification passed! No errors found.');
      } catch (error) {
        console.log('\n❌ TypeScript verification failed. Errors were found.');
        console.log('\nRun ts-error-tools analyze to see the errors');
        console.log('Run ts-error-tools fix to automatically fix some errors');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Error verifying TypeScript code:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}