# TypeScript Intelligent Fixer Documentation

## Overview

The TypeScript Intelligent Fixer is a robust tool designed to automate the detection, analysis, and resolution of TypeScript errors in your codebase. Built with a three-phase approach, it offers comprehensive solutions from simple type errors to complex cascading issues.

## Three-Phase Approach

1. **Detection** - Scan your codebase to identify TypeScript errors
2. **Intelligent Analysis** - Analyze error patterns, dependencies, and root causes
3. **Prevention & Resolution** - Apply targeted fixes and prevent recurrence

## Installation

```bash
# Make the script executable
chmod +x ts-intelligent-fixer.ts

# Run the tool
./ts-intelligent-fixer.ts [command] [options]
```

## Commands

### Analyze

Scan your project for TypeScript errors without modifying any files:

```bash
./ts-intelligent-fixer.ts analyze [options]
```

Options:
- `-p, --project <path>` - Path to tsconfig.json (default: './tsconfig.json')
- `-r, --root <path>` - Project root directory (default: '.')
- `-o, --output <path>` - Output file for analysis results (JSON format)
- `-v, --verbose` - Enable verbose output
- `-d, --deep` - Perform deep analysis with dependency tracking
- `-a, --ai` - Use OpenAI to enhance analysis (requires OPENAI_API_KEY)
- `-c, --categories <list>` - Comma-separated list of error categories to analyze
- `-e, --exclude <list>` - Comma-separated list of files or directories to exclude
- `--no-save` - Don't save analysis results to the database

Example:
```bash
# Basic analysis
./ts-intelligent-fixer.ts analyze

# Deep analysis with AI assistance, excluding node_modules
./ts-intelligent-fixer.ts analyze -d -a -e node_modules
```

### Fix

Automatically fix TypeScript errors in your project:

```bash
./ts-intelligent-fixer.ts fix [options]
```

Options:
- `-p, --project <path>` - Path to tsconfig.json (default: './tsconfig.json')
- `-r, --root <path>` - Project root directory (default: '.')
- `-b, --backup <dir>` - Directory for backups (default: './ts-error-fixes-backup')
- `--no-backup` - Disable file backups
- `-c, --categories <list>` - Comma-separated list of error categories to fix
- `-m, --max-errors <number>` - Maximum number of errors to fix per file
- `-d, --dry-run` - Show what would be fixed without making changes
- `-v, --verbose` - Enable verbose output
- `--no-interfaces` - Disable generating interface definitions
- `--no-props` - Disable fixing missing properties
- `--no-any` - Disable fixing implicit any types
- `--deep-fix` - Enable fixing dependencies and cascading errors
- `-a, --ai` - Use OpenAI to enhance fixes (requires OPENAI_API_KEY)
- `--no-batch` - Disable batch fixing (fix one at a time)
- `-e, --exclude <list>` - Comma-separated list of files or directories to exclude
- `--no-save` - Don't save fix results to the database

Example:
```bash
# Fix all errors with backups
./ts-intelligent-fixer.ts fix

# Dry run with verbose output, focusing on type_mismatch errors
./ts-intelligent-fixer.ts fix -d -v -c type_mismatch
```

### Patterns

Find common error patterns in your TypeScript code:

```bash
./ts-intelligent-fixer.ts patterns [options]
```

Options:
- `-p, --project <path>` - Path to tsconfig.json (default: './tsconfig.json')
- `-r, --root <path>` - Project root directory (default: '.')
- `-o, --output <path>` - Output file for pattern results (JSON format)
- `-v, --verbose` - Enable verbose output
- `-m, --min-occurrences <number>` - Minimum number of occurrences to consider a pattern (default: '3')
- `--no-save` - Don't save patterns to the database

Example:
```bash
# Find patterns that occur at least 5 times
./ts-intelligent-fixer.ts patterns -m 5
```

### Verify

Verify that TypeScript errors were fixed correctly:

```bash
./ts-intelligent-fixer.ts verify [options]
```

Options:
- `-p, --project <path>` - Path to tsconfig.json (default: './tsconfig.json')
- `-r, --root <path>` - Project root directory (default: '.')
- `-v, --verbose` - Enable verbose output

Example:
```bash
./ts-intelligent-fixer.ts verify -v
```

### Stats

Show statistics about TypeScript errors and fixes:

```bash
./ts-intelligent-fixer.ts stats [options]
```

Options:
- `-r, --root <path>` - Project root directory (default: '.')
- `-p, --project <path>` - Path to tsconfig.json (default: './tsconfig.json')
- `-d, --days <number>` - Number of days to include in stats (default: '30')
- `-v, --verbose` - Enable verbose output

Example:
```bash
# Show stats for the last 7 days
./ts-intelligent-fixer.ts stats -d 7
```

### Fix-File

Fix TypeScript errors in a specific file:

```bash
./ts-intelligent-fixer.ts fix-file <file> [options]
```

Arguments:
- `<file>` - Path to the file to fix

Options:
- `-p, --project <path>` - Path to tsconfig.json (default: './tsconfig.json')
- `-r, --root <path>` - Project root directory (default: '.')
- `-b, --backup <dir>` - Directory for backups (default: './ts-error-fixes-backup')
- `--no-backup` - Disable file backups
- `-d, --dry-run` - Show what would be fixed without making changes
- `-v, --verbose` - Enable verbose output
- `-a, --ai` - Use OpenAI to enhance fixes (requires OPENAI_API_KEY)

Example:
```bash
# Fix errors in a specific file
./ts-intelligent-fixer.ts fix-file ./src/components/Button.tsx
```

## Error Categories

The tool categorizes TypeScript errors into these types:

- **type_mismatch**: Type compatibility issues
- **missing_type**: Missing type declarations
- **import_error**: Import-related issues
- **null_reference**: Null/undefined handling issues
- **interface_mismatch**: Interface implementation issues
- **generic_constraint**: Generic type constraint issues
- **declaration_error**: Variable/function declaration issues
- **syntax_error**: Syntax errors
- **other**: Other TypeScript errors

## Error Severities

Errors are assigned one of these severity levels:

- **critical**: Errors that prevent compilation
- **high**: Errors that will likely cause runtime issues
- **medium**: Errors that might cause runtime issues
- **low**: Minor issues and code quality concerns

## Using with OpenAI

For advanced analysis and fixes, you can use the `-a, --ai` option, which integrates with OpenAI's models. This requires setting the `OPENAI_API_KEY` environment variable:

```bash
export OPENAI_API_KEY=your-api-key
./ts-intelligent-fixer.ts analyze -a
./ts-intelligent-fixer.ts fix -a
```

## Batch vs. One-by-One Fixes

By default, the tool uses batch fixing to improve performance. For more precise control, you can disable batch fixing:

```bash
./ts-intelligent-fixer.ts fix --no-batch
```

## Deep Analysis and Dependency Tracking

The deep analysis feature identifies dependencies between errors, helping focus on root causes:

```bash
./ts-intelligent-fixer.ts analyze -d
```

## Database Integration

Analysis results, error patterns, and fix history are stored in a database for tracking and reporting. Use the `--no-save` option to disable this feature.

## Best Practices

1. **Always run analysis first** to understand the errors in your codebase
2. **Use backups** when fixing errors to easily revert changes if needed
3. **Start with a dry run** to see what would be fixed without modifying files
4. **Focus on critical errors first** by using the `-c` option with error categories
5. **Use deep analysis** to identify root causes of cascading errors
6. **Verify fixes** after applying them to ensure no new errors were introduced
7. **Monitor patterns** to identify recurring issues that may need architectural changes

## Troubleshooting

### Common Issues

1. **Tool not finding all errors**:
   - Ensure your tsconfig.json is correctly configured
   - Try running with `-v` for verbose output

2. **Fixes not applying correctly**:
   - Try using `--no-batch` to fix errors one by one
   - Check for circular dependencies in your code

3. **Database-related errors**:
   - Ensure your database is properly configured
   - Use `--no-save` to bypass database integration

### Getting Help

For more information, run:

```bash
./ts-intelligent-fixer.ts --help
```

Or for help with a specific command:

```bash
./ts-intelligent-fixer.ts analyze --help
```

## Examples

### Complete Workflow

```bash
# 1. Analyze your project
./ts-intelligent-fixer.ts analyze -v

# 2. Find common error patterns
./ts-intelligent-fixer.ts patterns

# 3. Fix errors with backups and AI assistance
./ts-intelligent-fixer.ts fix -b ./backups -a

# 4. Verify the fixes
./ts-intelligent-fixer.ts verify

# 5. Check error statistics
./ts-intelligent-fixer.ts stats
```

### Focusing on Specific Issues

```bash
# Find and fix only import errors
./ts-intelligent-fixer.ts analyze -c import_error
./ts-intelligent-fixer.ts fix -c import_error
```

### Excluding Files or Directories

```bash
# Analyze excluding test files and generated code
./ts-intelligent-fixer.ts analyze -e "**/*.test.ts,**/*.generated.ts"
```

## Contributing

Contributions to the TypeScript Intelligent Fixer are welcome! Please feel free to submit pull requests or open issues to improve the tool.

## License

This project is licensed under the MIT License - see the LICENSE file for details.