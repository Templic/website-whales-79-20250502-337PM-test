# Standalone TypeScript Tools Guide

This document explains how to use the standalone TypeScript tools that complement our custom TypeScript error management system.

## Table of Contents

1. [Introduction](#introduction)
2. [TypeScript Tools Launcher](#typescript-tools-launcher)
3. [TypeScript ESLint Analyzer](#typescript-eslint-analyzer)
4. [Type Definition Fetcher](#type-definition-fetcher)
5. [Integration with Development Workflow](#integration-with-development-workflow)
6. [Best Practices](#best-practices)

## Introduction

Our TypeScript error management strategy combines custom-built error analysis and fixing tools with best-in-class standalone utilities from the TypeScript ecosystem. This hybrid approach gives us the benefits of specialized error handling tailored to our codebase, while also leveraging the strengths of established community tools.

The standalone tools are designed to work alongside our custom system rather than replace it, focusing on:

- Static code analysis with TypeScript-specific ESLint rules
- Automatic type definition management using DefinitelyTyped
- Centralized tool launching for a consistent developer experience

## TypeScript Tools Launcher

The launcher provides a unified interface to access all TypeScript error management tools, both custom and standalone.

### Basic Usage

```bash
node scripts/typescript-tools.js <command> [options]
```

### Available Commands

| Command | Description |
|---------|-------------|
| `analyze` | Run comprehensive error analysis using our custom analyzer |
| `fix` | Run automated error fixing |
| `lint` | Run ESLint with TypeScript rules |
| `types` | Manage type definitions (fetch, check, etc.) |
| `visualize` | Generate error visualization |
| `help` | Show help information |

### Examples

```bash
# Run the custom error analyzer on the entire project
node scripts/typescript-tools.js analyze

# Fix errors in a specific file
node scripts/typescript-tools.js fix --path src/components/Button.tsx

# Run ESLint with TypeScript rules and generate an HTML report
node scripts/typescript-tools.js lint --format html --output eslint-report.html

# Check and install missing type definitions
node scripts/typescript-tools.js types --install

# Generate visualization of TypeScript errors
node scripts/typescript-tools.js visualize
```

## TypeScript ESLint Analyzer

This tool runs ESLint with TypeScript-specific rules and generates detailed reports on TypeScript errors and code quality issues.

### Basic Usage

```bash
node scripts/typescript-eslint-analyzer.js [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--path` | `-p` | Directory or file to analyze | `src` |
| `--config` | `-c` | Path to ESLint config | `.eslintrc.typescript.js` |
| `--output` | `-o` | Output report file | `typescript-eslint-report.json` |
| `--format` | `-f` | Output format (json, html, markdown) | `json` |
| `--fix` | | Attempt to automatically fix problems | |
| `--verbose` | `-v` | Show detailed output | |

### Examples

```bash
# Analyze and fix TypeScript errors in a specific directory
node scripts/typescript-eslint-analyzer.js --path src/components --fix

# Generate an HTML report
node scripts/typescript-eslint-analyzer.js --format html --output reports/eslint-report.html

# Analyze with verbose output
node scripts/typescript-eslint-analyzer.js --verbose
```

### Report Formats

The analyzer can generate reports in different formats:

- **JSON**: Machine-readable format for further processing
- **HTML**: Interactive report with charts and detailed issue information
- **Markdown**: Human-readable format suitable for documentation and GitHub

## Type Definition Fetcher

This tool analyzes your project's dependencies and fetches appropriate type definitions from DefinitelyTyped if they're missing.

### Basic Usage

```bash
node scripts/fetch-type-definitions.js [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--install` | `-i` | Automatically install missing type definitions | `false` |
| `--package` | `-p` | Path to package.json | `./package.json` |
| `--force` | `-f` | Force check and install even for packages that might have built-in types | |
| `--verbose` | `-v` | Show detailed output | |

### Examples

```bash
# Check for missing type definitions
node scripts/fetch-type-definitions.js

# Check and automatically install missing type definitions
node scripts/fetch-type-definitions.js --install

# Check a specific package.json file
node scripts/fetch-type-definitions.js --package ./apps/admin/package.json

# Force check all packages and show detailed output
node scripts/fetch-type-definitions.js --force --verbose
```

## Integration with Development Workflow

### Adding to package.json Scripts

For convenient access, add these scripts to your `package.json`:

```json
"scripts": {
  "ts:analyze": "node scripts/typescript-tools.js analyze",
  "ts:fix": "node scripts/typescript-tools.js fix",
  "ts:lint": "node scripts/typescript-tools.js lint",
  "ts:types": "node scripts/typescript-tools.js types",
  "ts:visualize": "node scripts/typescript-tools.js visualize"
}
```

### Git Hooks Integration

Use with Husky to run before commits:

```json
"husky": {
  "hooks": {
    "pre-commit": "npm run ts:lint"
  }
}
```

### CI/CD Pipeline Integration

Add to your CI/CD pipeline for continuous quality checks:

```yaml
# Example GitHub Actions workflow
name: TypeScript Quality
jobs:
  typescript-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/typescript-tools.js lint --format markdown --output ts-lint-report.md
      - run: node scripts/typescript-tools.js analyze
      - uses: actions/upload-artifact@v2
        with:
          name: typescript-reports
          path: |
            ts-lint-report.md
            typescript-error-analysis.md
```

## Best Practices

### When to Use Each Tool

- **Custom Analyzer**: For deep analysis of TypeScript errors, especially cascade errors
- **ESLint Analyzer**: For code quality and style issues beyond type checking
- **Type Definition Fetcher**: Whenever adding new npm packages
- **Visualization Tools**: When presenting error patterns to the team

### Recommended Workflow

1. **Daily Development**:
   - Run `ts:lint` frequently during development
   - Use `ts:fix` for quick fixes of common issues

2. **Adding Dependencies**:
   - After adding new npm packages, run `ts:types --install`

3. **Before Commits**:
   - Run `ts:lint` to catch style and quality issues

4. **Weekly Code Quality**:
   - Run the full `ts:analyze` and `ts:visualize` to identify patterns
   - Address root cause issues identified in the analysis

### Configuration Best Practices

1. **ESLint Rules**:
   - Customize `.eslintrc.typescript.js` for your team's preferences
   - Start with warnings instead of errors for easier adoption
   - Gradually increase strictness as team familiarity grows

2. **Type Management**:
   - Create custom type definitions in `src/types` for libraries without DefinitelyTyped support
   - Document any workarounds needed for problematic packages

3. **Error Prioritization**:
   - Focus on fixing high-severity errors first
   - Address root causes before symptoms
   - Prioritize errors in shared/core components

By following these guidelines, you'll be able to effectively use our standalone TypeScript tools alongside our custom error management system, creating a comprehensive approach to TypeScript error handling.