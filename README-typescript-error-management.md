# TypeScript Error Management System

A comprehensive system for detecting, analyzing, and fixing TypeScript errors in your codebase.

## Overview

The TypeScript Error Management System is a sophisticated three-phase approach to handling TypeScript errors:

1. **Detection** - Find TypeScript errors in your codebase
2. **Analysis** - Analyze errors for patterns and root causes
3. **Resolution** - Apply fixes automatically or with guidance

## Key Components

### Error Detection

- `ts-error-finder.ts` - Core detection engine that finds TypeScript errors
- `advanced-ts-error-finder.ts` - Enhanced detection with more detailed error information

### Error Analysis

- `ts-error-analyzer.ts` - Analyzes errors for patterns and categorizes them
- `ts-batch-fixer.ts` - Builds dependency graphs between errors to identify root causes

### Error Resolution

- `ts-error-fixer.ts` - Applies pattern-based fixes to errors
- `openai-enhanced-fixer.ts` - Uses OpenAI to generate fixes for complex errors
- `error-patterns/advanced-patterns.ts` - Collection of common error patterns and fixes

### Security Integration

- `security/integration/typescript-security-scanner.ts` - Integrates with security infrastructure

## Usage

### Command Line Interface

The main interface for the error management system is through the CLI tools:

```bash
# Run the enhanced error fixer
ts-node run-enhanced-fixer.ts --project ./your-project

# Run with automated fixing
ts-node run-enhanced-fixer.ts --project ./your-project --fix

# Run security-focused scan
ts-node run-enhanced-fixer.ts --project ./your-project --security-only

# Use AI-powered analysis
ts-node run-enhanced-fixer.ts --project ./your-project --ai
```

### Options

- `--project <dir>` - Project directory to scan (default: current directory)
- `--security-only` - Only scan for security-related TypeScript issues
- `--fix` - Automatically apply fixes (default: false)
- `--pattern <pattern>` - Apply specific pattern fixes by ID (e.g. "type-assertion-1")
- `--ai` - Use OpenAI for advanced error analysis and fixing
- `--report` - Generate detailed Markdown report
- `--deep` - Perform deep error analysis with dependency tracking
- `--watch` - Watch for file changes and fix errors as they occur
- `--max-errors <num>` - Maximum number of errors to fix (default: 50)
- `--exclude <paths>` - Comma-separated list of directories/files to exclude
- `--verbose` - Show detailed output

## Advanced Error Patterns

The system includes an extensive library of advanced error patterns in `error-patterns/advanced-patterns.ts`. Each pattern includes:

- Pattern detection regex
- Multiple fix strategies based on context
- Security implications (if applicable)
- Examples of before/after code

## OpenAI Integration

The system can use OpenAI to analyze and fix complex TypeScript errors. This feature requires:

1. An OpenAI API key set as `OPENAI_API_KEY` environment variable
2. Running with the `--ai` flag

The AI integration can:

- Analyze errors with full context
- Generate precise fixes
- Provide explanations of the error cause
- Suggest alternative approaches

## Security Focus

The system integrates with the application's security infrastructure through:

1. Identifying security-critical TypeScript errors
2. Prioritizing fixes for security issues
3. Registering with the security scan queue
4. Producing security reports

Run a security-focused scan with:

```bash
ts-node run-enhanced-fixer.ts --security-only
```

## Reports

Generate detailed reports with:

```bash
ts-node run-enhanced-fixer.ts --report
```

Reports include:
- Error counts by category
- Security issues
- Applied fixes
- Recommendations

## Extending the System

### Adding New Error Patterns

To add new error patterns, edit `error-patterns/advanced-patterns.ts` and add entries following the pattern:

```typescript
{
  id: 'your-pattern-id',
  name: 'Human-readable name',
  description: 'Description of the error pattern',
  category: ErrorCategory.TYPE_MISMATCH, // Use appropriate category
  severity: ErrorSeverity.MEDIUM, // Set appropriate severity
  regex: 'Regular expression to match error message',
  fixes: [
    {
      description: 'Description of the fix',
      applicability: 'When to apply this fix',
      example: {
        before: "Code before fix",
        after: "Code after fix"
      },
      automated: true // Whether this can be applied automatically
    }
  ],
  securityImplications: {
    hasSecurity: true, // Set to true if this has security implications
    severity: 'medium', // Set security severity
    description: 'Description of security implications',
    cwe: 'CWE-ID' // Common Weakness Enumeration ID if applicable
  }
}
```

## Troubleshooting

### Common Issues

- **Error: Cannot find module 'typescript'** - Install TypeScript: `npm install -g typescript`
- **Error: OpenAI API key not found** - Set the `OPENAI_API_KEY` environment variable
- **No results or empty scan** - Check project configuration and tsconfig.json