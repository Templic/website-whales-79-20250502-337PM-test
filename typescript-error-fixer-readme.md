# TypeScript Error Fixer

A comprehensive script-based solution to identify and automatically fix TypeScript errors across a full-stack TypeScript project with a monorepo-style layout.

## Features

- 🔍 **Project Traversal**: Recursively scans all sub-projects within the monorepo to locate TypeScript files.
- ⚠️ **Error Detection**: Executes the TypeScript compiler in each sub-project to identify type-checking errors.
- 📊 **Error Formatting**: Formats errors into a clear report, grouping them by file with detailed information.
- 🔧 **Automated Fixes**: Offers options to automatically fix errors using ESLint or ts-migrate.
- 📝 **Error Reporting**: Generates detailed reports in various formats (text, JSON, Markdown).
- 🔎 **Error Filtering**: Allows filtering errors by specific criteria like error codes or file paths.
- 🚀 **Performance Optimization**: Supports parallel execution and caching to minimize processing time.
- 💡 **Error Analysis**: Provides suggestions for common TypeScript errors.
- 🔄 **CI/CD Integration**: Can be easily integrated into continuous integration workflows.

## Prerequisites

- Node.js (v14 or newer)
- TypeScript installed in your project
- ESLint installed for automated fixes (optional)
- ts-migrate installed for deeper fixes (optional)

## Installation

### Option 1: Install the required dependencies

```bash
npm install commander
npm install --save-dev typescript @types/node
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev ts-migrate
```

### Option 2: Use the script directly

Copy the `ts-error-fixer.ts` file to your project's root directory and compile it using TypeScript:

```bash
tsc ts-error-fixer.ts
```

## Usage

### Basic Usage

```bash
node ts-error-fixer.js
```

This will scan your project for TypeScript files, detect errors, and generate a report.

### Command Line Options

The script supports the following command-line options:

| Option | Description | Default |
|--------|-------------|---------|
| `-r, --root-dir <dir>` | Root directory of the monorepo | `.` (current directory) |
| `-f, --fix-level <level>` | Level of fixes to apply: none, eslint, ts-migrate | `eslint` |
| `-e, --error-codes <codes>` | Filter errors by code (comma-separated) | |
| `-p, --paths <paths>` | Filter errors by file paths (comma-separated) | |
| `-o, --output-format <format>` | Output format: text, json, markdown | `text` |
| `--output-file <file>` | File to write the output to | |
| `--parallel` | Run in parallel to improve performance | `false` |
| `--dry-run` | Only report errors, do not apply fixes | `false` |
| `--no-cache` | Disable caching of compilation results | `false` |
| `-v, --verbose` | Print verbose output | `false` |
| `--snippets` | Include code snippets in the report | `false` |
| `--suggestions` | Include fix suggestions in the report | `false` |
| `--max-processes <num>` | Maximum number of parallel processes | Number of CPU cores - 1 |

### Examples

#### Generate a report without fixing errors

```bash
node ts-error-fixer.js --dry-run
```

#### Apply ESLint fixes and generate a JSON report

```bash
node ts-error-fixer.js --fix-level eslint --output-format json --output-file errors.json
```

#### Use ts-migrate for deeper fixes in parallel

```bash
node ts-error-fixer.js --fix-level ts-migrate --parallel
```

#### Filter errors by specific error codes

```bash
node ts-error-fixer.js --error-codes TS2339,TS2322,TS2531
```

#### Focus on specific directories or files

```bash
node ts-error-fixer.js --paths src/components,src/pages
```

#### Generate a detailed Markdown report with code snippets and suggestions

```bash
node ts-error-fixer.js --output-format markdown --output-file typescript-errors.md --snippets --suggestions
```

## CI/CD Integration

### GitHub Actions Integration

```yaml
name: TypeScript Error Check

on: 
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  ts-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install TypeScript Error Fixer dependencies
        run: |
          npm install -g typescript
          npm install commander
          
      - name: Compile TypeScript Error Fixer
        run: tsc ts-error-fixer.ts
        
      - name: Run TypeScript error check
        run: node ts-error-fixer.js --dry-run --output-format json --output-file ts-errors.json
        
      - name: Upload error report
        uses: actions/upload-artifact@v3
        with:
          name: typescript-errors
          path: ts-errors.json
        if: always()
```

### GitLab CI Integration

```yaml
typescript-check:
  stage: test
  image: node:16
  script:
    - npm ci
    - npm install -g typescript
    - npm install commander
    - tsc ts-error-fixer.ts
    - node ts-error-fixer.js --dry-run --output-format json --output-file ts-errors.json
  artifacts:
    paths:
      - ts-errors.json
    when: always
```

## Advanced Usage

### Fixing Common Error Patterns

The script can automatically fix several common TypeScript error patterns:

#### Property does not exist on type (TS2339)

```typescript
// Before
const value = obj.missingProperty;

// After (with eslint fix)
const value = (obj as any).missingProperty;
```

#### Type assignment error (TS2322)

```typescript
// Before
const value: string = 123;

// After (with ts-migrate)
const value: string = 123 as unknown as string;
```

#### Object is possibly null/undefined (TS2531, TS2532)

```typescript
// Before
const value = obj.property;

// After (with eslint fix)
const value = obj?.property;
```

### Customizing the Fix Process

For more advanced customization, you can:

1. Create an ESLint configuration file `.eslintrc.js` with specific rules for TypeScript:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off'
  }
};
```

2. Configure the script to use this configuration:

```bash
node ts-error-fixer.js --fix-level eslint
```

## Error Analysis and Suggestions

The script provides suggestions for common TypeScript errors:

- **TS2339** (Property does not exist on type): Check spelling, add type definition, use optional chaining
- **TS2322** (Type assignment error): Verify type definitions, use type assertions
- **TS2531/TS2532** (Object is possibly null/undefined): Add null checks, use optional chaining
- **TS2304** (Cannot find name): Check imports, check spelling
- **TS7006** (Parameter has implicit any type): Add explicit type annotations

## Performance Optimization

For large projects, consider these performance optimizations:

1. Enable parallel processing:

```bash
node ts-error-fixer.js --parallel
```

2. Use caching to avoid re-checking unchanged files:

```bash
node ts-error-fixer.js  # Cache is enabled by default
```

3. Focus on specific parts of your codebase:

```bash
node ts-error-fixer.js --paths src/components
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT