# TypeScript Error Automation System

This document provides instructions for using the automated TypeScript error management system in this project.

## Overview

The TypeScript Error Automation System is a comprehensive solution for detecting, analyzing, and automatically fixing TypeScript errors. It follows a three-phase approach:

1. **Detection Phase**: Scans the codebase to identify TypeScript errors
2. **Analysis Phase**: Analyzes errors to categorize them and identify patterns
3. **Fix Phase**: Applies automated fixes to resolve errors

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- TypeScript 4.5+
- ts-node (for running TypeScript files directly)

### Setup

1. Make sure you have installed the necessary TypeScript dependencies:

```bash
npm install typescript ts-node --save-dev
```

2. Set up the error patterns database:

```bash
npx ts-node setup-error-patterns.ts
```

## Usage

### Running the Full System

To run the complete TypeScript error management system:

```bash
npx ts-node run-typescript-error-system.ts [options]
```

Available options:
- `--project <dir>`: Project directory to scan (default: current directory)
- `--categories <list>`: Comma-separated list of error categories to focus on
- `--pattern <pattern>`: Run pattern-based fixes for specific error patterns
- `--deep`: Perform deep analysis with dependency tracking
- `--fix`: Apply fixes (default: dry run only)
- `--max-errors <num>`: Maximum number of errors to fix (default: 50)
- `--exclude <paths>`: Comma-separated list of directories/files to exclude
- `--verbose`: Show detailed output

### Running Individual Phases

You can also run each phase separately:

#### Detection Phase

```bash
npx ts-node advanced-ts-error-finder.ts --project .
```

#### Analysis Phase

```bash
npx ts-node server/utils/ts-error-analyzer.ts --project .
```

#### Fix Phase

```bash
npx ts-node server/utils/ts-batch-fixer.ts --project . --max-errors 50
```

## Common Error Patterns

The system includes predefined patterns for common TypeScript errors:

1. **Import Errors**: Missing imports, unused imports
2. **Type Mismatches**: Incompatible types, implicit any types
3. **JSX/React Errors**: Missing React key props, incorrect component exports
4. **Null Reference Errors**: Optional chaining suggestions
5. **SVG Attribute Errors**: Converting string attributes to numeric values

## Extending the System

### Adding New Error Patterns

To add a new error pattern, modify the `setup-error-patterns.ts` file and add a new pattern to the `errorPatterns` array:

```typescript
{
  id: 'custom-pattern-1',
  name: 'My Custom Pattern',
  description: 'Description of the error pattern',
  category: ErrorCategory.TYPE_MISMATCH,
  severity: ErrorSeverity.MEDIUM,
  regex: 'Regular expression to match the error',
  fix: {
    description: 'Description of how to fix the error',
    example: {
      before: "Code before the fix",
      after: "Code after the fix"
    },
    automated: true // Set to true if the fix can be automated
  }
}
```

Then run the setup script again to update the patterns database:

```bash
npx ts-node setup-error-patterns.ts
```

### Custom Fixes

For more complex fixes that aren't covered by the standard patterns, you can create custom fixers by extending the `server/utils/ts-error-fixer.ts` module.

## Best Practices

1. **Start with a Scan**: Always begin with a detection phase to understand the full scope of errors
2. **Focus on Patterns**: Identify common error patterns and prioritize fixing them
3. **Fix Root Causes**: Address root cause errors first to prevent cascade effects
4. **Test After Fixes**: Always test your application after applying automated fixes
5. **Gradual Application**: Fix errors in batches rather than all at once

## Troubleshooting

### Error: Cannot find module

If you encounter a "Cannot find module" error, make sure the module is properly installed and imported:

```bash
npm install <module-name>
```

### Fixes Not Applied

If fixes aren't being applied, check:
1. Did you use the `--fix` flag?
2. Is the error pattern supported for automated fixing?
3. Are there conflicting changes that prevent the fix?

## Additional Resources

For more information on TypeScript error management, refer to:

- [TypeScript-Error-Management-README.md](TypeScript-Error-Management-README.md)
- [TypeScript-Error-Management-Roadmap.md](TypeScript-Error-Management-Roadmap.md)
- [TypeScript official documentation](https://www.typescriptlang.org/docs/)