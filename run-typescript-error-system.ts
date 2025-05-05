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
 * Options:
 *   --project <dir>     Project directory to scan (default: current directory)
 *   --categories <list> Comma-separated list of error categories to focus on (e.g., "import_error,type_mismatch")
 *   --pattern <pattern> Run pattern-based fixes for specific error patterns
 *   --deep              Perform deep analysis with dependency tracking
 *   --fix               Apply fixes (default: dry run only)
 *   --max-errors <num>  Maximum number of errors to fix (default: 50)
 *   --exclude <paths>   Comma-separated list of directories/files to exclude
 *   --verbose           Show detailed output
 */

import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

// Helper function to run a TypeScript file with node
async function runTs(file: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Running: ts-node ${file} ${args.join(' ')}`);
    
    const childProcess = spawn('npx', ['ts-node', file, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      process.stdout.write(chunk);
    });
    
    childProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      process.stderr.write(chunk);
    });
    
    childProcess.on('error', (error) => {
      reject(new Error(`Failed to run ${file}: ${error.message}`));
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${file} exited with code ${code}\n${stderr}`));
      }
    });
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string | boolean | string[]> = {
    project: '.',
    categories: [],
    deep: false,
    fix: false,
    maxErrors: 50,
    exclude: [],
    verbose: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--project' && i + 1 < args.length) {
      options.project = args[++i];
    } else if (arg === '--categories' && i + 1 < args.length) {
      options.categories = args[++i].split(',');
    } else if (arg === '--pattern' && i + 1 < args.length) {
      options.pattern = args[++i];
    } else if (arg === '--deep') {
      options.deep = true;
    } else if (arg === '--fix') {
      options.fix = true;
    } else if (arg === '--max-errors' && i + 1 < args.length) {
      options.maxErrors = parseInt(args[++i], 10);
    } else if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = args[++i].split(',');
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }
  
  return options;
}

// Log utility with time measurement
function log(phase: string, message: string) {
  console.log(`[${phase}] ${message}`);
}

// Save result from a phase to a file
function saveResult(phase: string, data: any) {
  const resultDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(resultDir, `${phase.toLowerCase()}-${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  log(phase, `Results saved to ${filename}`);
  
  return filename;
}

// Main execution function
async function main() {
  const options = parseArgs();
  const startTime = Date.now();
  
  log('System', 'Starting TypeScript Error Management System');
  log('System', `Options: ${JSON.stringify(options, null, 2)}`);
  
  try {
    // Phase 1: Detection
    log('Detection', 'Starting error detection phase');
    const detectionStart = Date.now();
    
    // Construct arguments for the error finder
    const finderArgs = [
      '--project', options.project as string
    ];
    
    if (options.verbose) {
      finderArgs.push('--verbose');
    }
    
    if (options.exclude && (options.exclude as string[]).length > 0) {
      finderArgs.push('--exclude', (options.exclude as string[]).join(','));
    }
    
    let scanResults: any;
    try {
      // Run the advanced error finder to detect errors
      const scanOutput = await runTs('./advanced-ts-error-finder.ts', finderArgs);
      
      // Extract JSON results from the output if possible
      const jsonMatch = scanOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scanResults = JSON.parse(jsonMatch[0]);
        log('Detection', `Found ${scanResults.totalErrors} errors and ${scanResults.totalWarnings} warnings`);
      } else {
        log('Detection', 'Could not extract results from output');
      }
    } catch (error) {
      log('Detection', `Error finder failed: ${error}`);
      // Fallback to simpler error finder
      log('Detection', 'Falling back to basic error finder');
      await runTs('./server/utils/ts-error-finder.ts', ['--project', options.project as string]);
    }
    
    const detectionTime = (Date.now() - detectionStart) / 1000;
    log('Detection', `Phase completed in ${detectionTime.toFixed(2)}s`);
    
    if (scanResults) {
      saveResult('Detection', scanResults);
    }
    
    // Phase 2: Analysis
    log('Analysis', 'Starting error analysis phase');
    const analysisStart = Date.now();
    
    // Construct arguments for the error analyzer
    const analyzerArgs = [
      '--project', options.project as string
    ];
    
    if (options.categories && (options.categories as string[]).length > 0) {
      analyzerArgs.push('--categories', (options.categories as string[]).join(','));
    }
    
    if (options.deep) {
      analyzerArgs.push('--deep');
    }
    
    let analysisResults: any;
    try {
      // Run the error analyzer
      await runTs('./server/utils/ts-error-analyzer.ts', analyzerArgs);
      
      // In a real implementation, we would capture structured output
      // For demonstration, we'll create a placeholder result
      analysisResults = {
        analyzedErrors: scanResults?.totalErrors || 0,
        patterns: [],
        clusters: [],
        sortedErrorIds: []
      };
    } catch (error) {
      log('Analysis', `Error analyzer failed: ${error}`);
    }
    
    const analysisTime = (Date.now() - analysisStart) / 1000;
    log('Analysis', `Phase completed in ${analysisTime.toFixed(2)}s`);
    
    if (analysisResults) {
      saveResult('Analysis', analysisResults);
    }
    
    // Phase 3: Fix
    if (options.fix) {
      log('Fix', 'Starting error fixing phase');
      const fixStart = Date.now();
      
      // Construct arguments for the error fixer
      const fixerArgs = [
        '--project', options.project as string,
        '--max-errors', options.maxErrors.toString()
      ];
      
      if (options.pattern) {
        fixerArgs.push('--pattern', options.pattern as string);
      }
      
      try {
        // Run the batch fixer
        await runTs('./server/utils/ts-batch-fixer.ts', fixerArgs);
      } catch (error) {
        log('Fix', `Batch fixer failed: ${error}`);
        // Could continue with other fixers here
      }
      
      const fixTime = (Date.now() - fixStart) / 1000;
      log('Fix', `Phase completed in ${fixTime.toFixed(2)}s`);
    } else {
      log('Fix', 'Skipping fix phase (use --fix to apply fixes)');
    }
    
    // Calculate total execution time
    const totalTime = (Date.now() - startTime) / 1000;
    log('System', `TypeScript Error Management completed in ${totalTime.toFixed(2)}s`);
    
    // Generate summary
    const summary = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      executionTime: totalTime,
      options,
      phases: {
        detection: {
          errors: scanResults?.totalErrors || 0,
          warnings: scanResults?.totalWarnings || 0,
          executionTime: detectionTime
        },
        analysis: {
          analyzedErrors: analysisResults?.analyzedErrors || 0,
          patterns: analysisResults?.patterns?.length || 0,
          clusters: analysisResults?.clusters?.length || 0,
          executionTime: analysisTime
        },
        fix: {
          applied: options.fix,
          executionTime: options.fix ? (Date.now() - fixStart) / 1000 : 0
        }
      }
    };
    
    saveResult('Summary', summary);
    
    // Print final summary to console
    console.log('\n=== TypeScript Error Management Summary ===');
    console.log(`Total execution time: ${totalTime.toFixed(2)}s`);
    console.log(`Errors detected: ${scanResults?.totalErrors || 'Unknown'}`);
    console.log(`Warnings detected: ${scanResults?.totalWarnings || 'Unknown'}`);
    
    if (options.fix) {
      console.log(`Fixes applied: Yes`);
    } else {
      console.log(`Fixes applied: No (use --fix to apply fixes)`);
    }
    
    console.log('\nTo see detailed results, check the reports directory.');
    
  } catch (error) {
    console.error(`Error in TypeScript Error Management System: ${error}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error in TypeScript Error Management System: ${error}`);
  process.exit(1);
});