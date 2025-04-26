#!/usr/bin/env node

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
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';

// Import scanner, analyzer and fixer modules
import * as scanner from './server/utils/ts-scanner';
import * as analyzer from './server/utils/openai-integration';
import * as fixer from './server/utils/ts-error-fixer';
import { tsErrorStorage } from './server/tsErrorStorage';
import { ErrorCategory, ErrorSeverity, ErrorStatus } from './shared/schema';

// Load the main CLI script
import './scripts/ts-analyzer-cli';

// This script is just a wrapper to make the CLI script executable
// All functionality is implemented in ts-analyzer-cli.ts

// Ensure the OpenAI API key is set
if (!process.env.OPENAI_API_KEY && process.argv.includes('analyze')) {
  console.error(chalk.red('Warning: OPENAI_API_KEY environment variable is not set.'));
  console.error(chalk.yellow('The AI-powered analysis features will not be available.'));
  console.error(chalk.yellow('Set the OPENAI_API_KEY environment variable to enable these features.'));
  console.error('');
}

// Print a welcome message
console.log(chalk.blue.bold('TypeScript Intelligent Fixer'));
console.log(chalk.blue('A comprehensive TypeScript error management utility'));
console.log('');

// Execute the CLI
require('./scripts/ts-analyzer-cli');