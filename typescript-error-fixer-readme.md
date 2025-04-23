# TypeScript Error Fixer

A comprehensive utility for automatically detecting and fixing common TypeScript errors across your codebase. This tool is designed to help maintain code quality and resolve TypeScript compiler errors quickly and efficiently.

## Features

- **Automated Error Detection**: Scans your entire codebase for TypeScript files with errors
- **Intelligent Error Fixing**: Applies specific fixes for common TypeScript error patterns
- **Malformed Type Annotation Fixes**: Corrects common syntax issues like `: string: string` in callback parameters
- **Easy to Run**: Simple command-line interface with clear output messages
- **Configurable**: Customize which patterns to fix and which directories to scan
- **Performance Optimized**: Efficiently processes large codebases with minimal resource usage

## Getting Started

### Prerequisites

- Node.js (v14+)
- TypeScript project

### Installation

Clone this repository or copy the script file to your project:

```bash
# Option 1: Clone the repository
git clone https://github.com/yourusername/typescript-error-fixer.git

# Option 2: Copy the script directly
curl -o ts-error-fixer.ts https://raw.githubusercontent.com/yourusername/typescript-error-fixer/main/ts-error-fixer.ts
```

### Usage

1. Make sure your project uses ES modules (has `"type": "module"` in package.json)

2. Run the script:

```bash
# Using ts-node
npx ts-node ts-error-fixer.ts

# Or using Node.js with TypeScript compilation
tsc ts-error-fixer.ts
node ts-error-fixer.js
```

3. The script will:
   - Scan your project for TypeScript files
   - Fix common TypeScript errors
   - Report the number of files fixed

## Configuring the Error Fixer

Edit the CONFIG object in the script to customize its behavior:

```typescript
const CONFIG = {
  rootDir: './server',             // The root directory to scan
  ignorePatterns: [                // Directories/files to ignore
    'node_modules',
    'dist',
    '.git'
  ],
  fixPatterns: [                   // Patterns to fix
    {
      name: 'Malformed callback parameter type',
      description: 'Fixes malformed type annotations in callback parameters',
      pattern: /(\w+): string: string =>/g,
      replacement: '$1 =>'
    },
    // Add more patterns as needed
  ],
  logLevel: 'info'                 // 'debug' | 'info' | 'warn' | 'error'
};
```

## Common Error Patterns Fixed

The script addresses several common TypeScript error patterns:

1. **Malformed Type Annotations**: Fixes issues like `: string: string` in callback parameters.
   ```typescript
   // Before
   array.filter(item: string: string => item.length > 0)
   
   // After
   array.filter(item => item.length > 0)
   ```

2. **Complex Arrow Function Return Types**: Corrects return type annotations in arrow functions.
   ```typescript
   // Before
   const example = (): void: string: string => { ... }
   
   // After
   const example = (): void => { ... }
   ```

## Extending with New Patterns

To add new error fix patterns, add them to the `fixPatterns` array in the CONFIG object:

```typescript
{
  name: 'Your pattern name',
  description: 'Description of what this pattern fixes',
  pattern: /your-regex-pattern/g,
  replacement: 'replacement-string'
}
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request with new features, improvements, or bug fixes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Created to streamline TypeScript development workflows
- Inspired by the need for automated code quality tools