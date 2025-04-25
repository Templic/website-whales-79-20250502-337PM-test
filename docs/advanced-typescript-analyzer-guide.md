# Advanced TypeScript Error Analyzer Guide

This guide explains how to use the Advanced TypeScript Error Analyzer to identify, categorize, and fix TypeScript errors in your project.

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Command Line Options](#command-line-options)
6. [Understanding the Analysis Report](#understanding-the-analysis-report)
7. [Integration with Your Workflow](#integration-with-your-workflow)
8. [Advanced Usage](#advanced-usage)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

## Introduction

The Advanced TypeScript Error Analyzer is a powerful tool designed to help you manage TypeScript errors in your project. Unlike simple error reporting, this analyzer:

- Identifies root causes of cascading errors
- Categorizes errors by type and severity
- Suggests targeted fix strategies
- Provides context around each error
- Analyzes dependency relationships between files
- Estimates the effort required to fix errors

This tool significantly improves upon traditional "fix errors as they appear" approaches by providing a holistic view of your project's type system and pinpointing the most impactful errors to fix first.

## Key Features

- **Root Cause Analysis**: Identifies errors that cause cascading issues throughout your codebase
- **Pattern Recognition**: Categorizes errors into common patterns for targeted fixes
- **Dependency Tracking**: Analyzes file dependencies to understand error propagation
- **Fix Strategies**: Suggests appropriate strategies for each error type
- **Context Preservation**: Shows code surrounding each error for better understanding
- **Severity Assessment**: Prioritizes errors by their potential impact
- **Effort Estimation**: Provides time estimates for fixing identified issues
- **Comprehensive Reporting**: Generates detailed Markdown reports with actionable insights

## Installation

The Advanced TypeScript Error Analyzer is already installed in your project. The main components are:

- `server/utils/advanced-ts-analyzer.ts`: The core analyzer module
- `scripts/analyze-typescript-errors.js`: Command-line interface for running analysis

## Quick Start

To run a basic analysis of your project:

```bash
node scripts/analyze-typescript-errors.js
```

This will:

1. Scan your project for TypeScript errors
2. Analyze their relationships and patterns
3. Generate a report at `typescript-error-analysis.md`
4. Save detailed JSON data at `typescript-error-analysis.json`

For a quick test with specific examples:

```bash
node scripts/analyze-typescript-errors.js --include server/examples
```

## Command Line Options

The analyzer supports several command-line options:

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `typescript-error-analysis.md` |
| `--tsconfig` | `-t` | Path to tsconfig.json | `tsconfig.json` |
| `--include` | `-i` | Comma-separated list of directories to include | (all) |
| `--exclude` | `-e` | Comma-separated list of directories to exclude | `node_modules,dist,build` |
| `--max` | `-m` | Maximum number of errors to analyze | 1000 |
| `--help` | `-h` | Show help message | - |

Examples:

```bash
# Analyze only server code
node scripts/analyze-typescript-errors.js --include server

# Exclude test files
node scripts/analyze-typescript-errors.js --exclude node_modules,dist,build,tests

# Generate report in a specific location
node scripts/analyze-typescript-errors.js --output reports/weekly-analysis.md
```

## Understanding the Analysis Report

The generated report contains several sections:

### Summary

Provides key metrics including:
- Total number of errors
- Breakdown by severity
- Most common error types
- Most affected files
- Estimated fix time

### Root Causes

Lists errors that are likely causing cascading issues. These errors:
- Typically exist in files that many other files depend on
- Often involve type definitions or exports
- Have high severity ratings
- Fixing these first will often resolve many dependent errors

### Errors by Category

Groups errors by their type, such as:
- TYPE_MISMATCH
- MISSING_PROPERTY
- IMPLICIT_ANY
- UNUSED_VARIABLE
- NULL_UNDEFINED
- And others...

### Errors by Severity

Groups errors by their impact:
- **Critical**: Prevents compilation or reliably causes runtime crashes
- **High**: Likely causes runtime errors in common scenarios
- **Medium**: May cause subtle bugs or unexpected behavior
- **Low**: Style issues or minor type inconsistencies

## Integration with Your Workflow

To integrate the analyzer into your development workflow:

### Regular Analysis

Run the analyzer regularly to track progress:

```bash
# Add to package.json scripts
"scripts": {
  "analyze-ts": "node scripts/analyze-typescript-errors.js"
}
```

### Pre-Commit Hooks

Use with tools like Husky to analyze before committing:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run analyze-ts -- --max 100"
    }
  }
}
```

### CI/CD Integration

Add to your CI/CD pipeline to track error trends:

```yaml
# Example GitHub Actions workflow
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/analyze-typescript-errors.js --output reports/ci-analysis.md
      - uses: actions/upload-artifact@v2
        with:
          name: ts-analysis
          path: reports/ci-analysis.md
```

## Advanced Usage

### Programmatic API

You can use the analyzer programmatically in your own scripts:

```typescript
import { analyzeTypeScriptProject, generateErrorReport } from '../server/utils/advanced-ts-analyzer';

async function customAnalysis() {
  const analysis = await analyzeTypeScriptProject('./src', {
    includePaths: ['components', 'utils'],
    excludePaths: ['tests', 'mocks'],
    maxErrors: 500
  });
  
  // Do custom processing with the analysis
  const criticalErrors = analysis.errorsBySeverity.critical || [];
  console.log(`Found ${criticalErrors.length} critical errors`);
  
  // Generate and save a report
  const report = generateErrorReport(analysis);
  fs.writeFileSync('custom-report.md', report);
}
```

### Custom Reporting

You can extract specific information from the JSON data:

```typescript
import fs from 'fs';

// Load saved analysis data
const analysisData = JSON.parse(fs.readFileSync('typescript-error-analysis.json', 'utf-8'));

// Extract specific information
const filesWithMostErrors = Object.entries(analysisData.errorsByFile)
  .map(([file, errors]) => ({ file, count: errors.length }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);

console.table(filesWithMostErrors);
```

## API Reference

### Main Functions

#### `analyzeTypeScriptProject(projectPath, options)`

Analyzes TypeScript errors in a project.

- **Parameters**:
  - `projectPath`: Path to the project root
  - `options`: Configuration options
    - `tsConfigPath`: Path to tsconfig.json
    - `includePaths`: Directories to include
    - `excludePaths`: Directories to exclude
    - `maxErrors`: Maximum errors to analyze

- **Returns**: A `TypeScriptErrorAnalysis` object

#### `generateErrorReport(analysis)`

Generates a Markdown report from analysis data.

- **Parameters**:
  - `analysis`: A `TypeScriptErrorAnalysis` object
  
- **Returns**: Markdown string

#### `analyzeAndReportTypeScriptErrors(projectPath, options)`

Combines analysis and reporting in one function.

- **Parameters**:
  - `projectPath`: Path to the project root
  - `options`: Configuration options
    - `outputPath`: Report output path
    - `tsConfigPath`: Path to tsconfig.json
    - `includePaths`: Directories to include
    - `excludePaths`: Directories to exclude
    - `maxErrors`: Maximum errors to analyze

### Data Structures

#### `TypeScriptError`

Represents a single TypeScript error with detailed information.

```typescript
interface TypeScriptError {
  filePath: string;        // File containing the error
  line: number;            // Line number
  column: number;          // Column number
  code: string;            // Error code (e.g., "TS2322")
  message: string;         // Error message
  category: ErrorCategory; // Categorized error type
  severity: ErrorSeverity; // Error severity
  relatedTypes: string[];  // Types involved in the error
  contextCode?: string;    // Surrounding code
  fixStrategy?: FixStrategy; // Suggested fix approach
  fixSuggestion?: string;  // Specific fix suggestion
}
```

#### `TypeScriptErrorAnalysis`

Contains the complete analysis results.

```typescript
interface TypeScriptErrorAnalysis {
  totalErrors: number;     // Total error count
  errorsByCategory: Record<ErrorCategory, TypeScriptError[]>;
  errorsByFile: Record<string, TypeScriptError[]>;
  errorsBySeverity: Record<ErrorSeverity, TypeScriptError[]>;
  filesWithErrors: FileWithErrors[];
  dependencyGraph: Record<string, string[]>;
  errors: TypeScriptError[];
  rootCauses: TypeScriptError[];
  summary: AnalysisSummary;
}
```

## Troubleshooting

### Common Issues

#### Large Projects

For very large projects, you may encounter memory issues. Try:

```bash
node --max-old-space-size=4096 scripts/analyze-typescript-errors.js --max 500
```

#### Custom TypeScript Config

If you have a custom tsconfig path:

```bash
node scripts/analyze-typescript-errors.js --tsconfig ./configs/tsconfig.custom.json
```

#### Path Resolution Issues

If you see path resolution errors:

1. Check that your tsconfig.json has proper path mappings
2. Ensure the analyzer can resolve your import paths
3. Try using absolute paths with the `--include` option

#### Slow Analysis

For faster analysis:

```bash
node scripts/analyze-typescript-errors.js --include src/critical-module --max 100
```

---

By following this guide, you'll be able to use the Advanced TypeScript Error Analyzer to systematically identify and fix TypeScript errors in your project, focusing on root causes and avoiding the cascade effect of error propagation.