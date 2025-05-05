/**
 * Setup Error Patterns
 * 
 * This script sets up common error patterns for the TypeScript error management system.
 * These patterns can be used to automatically identify and fix common errors.
 * 
 * Usage: ts-node setup-error-patterns.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ErrorCategory, ErrorSeverity } from './server/utils/ts-error-analyzer';

// Error pattern interface
interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  regex: string;
  fix: {
    description: string;
    example: {
      before: string;
      after: string;
    };
    automated: boolean;
  };
}

// Define common error patterns
const errorPatterns: ErrorPattern[] = [
  // Missing TypeScript import error
  {
    id: 'import-error-1',
    name: 'Missing import',
    description: 'Module or type is referenced but not imported',
    category: ErrorCategory.IMPORT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    regex: 'Cannot find name \'([^\']+)\'',
    fix: {
      description: 'Add import statement for the missing module or type',
      example: {
        before: "const button = new Button();",
        after: "import { Button } from '@/components/ui/button';\nconst button = new Button();"
      },
      automated: true
    }
  },
  
  // Type mismatch error
  {
    id: 'type-mismatch-1',
    name: 'Type assignment mismatch',
    description: 'Type is not assignable to another type',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.HIGH,
    regex: 'Type \'([^\']+)\' is not assignable to type \'([^\']+)\'',
    fix: {
      description: 'Ensure the types match or add appropriate type conversion',
      example: {
        before: "const value: string = 5;",
        after: "const value: string = '5';"
      },
      automated: true
    }
  },
  
  // React JSX attribute error - strokeWidth as string
  {
    id: 'jsx-attribute-1',
    name: 'JSX SVG strokeWidth as string',
    description: 'strokeWidth attribute incorrectly passed as string instead of number',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.MEDIUM,
    regex: 'strokeWidth=\\"([^\\"]+)\\"',
    fix: {
      description: 'Change strokeWidth from string to a numeric value',
      example: {
        before: '<svg strokeWidth="2">',
        after: '<svg strokeWidth={2}>'
      },
      automated: true
    }
  },
  
  // Missing property error
  {
    id: 'missing-property-1',
    name: 'Missing property on object',
    description: 'Property is used but not defined on the object type',
    category: ErrorCategory.MISSING_PROPERTY,
    severity: ErrorSeverity.HIGH,
    regex: 'Property \'([^\']+)\' does not exist on type',
    fix: {
      description: 'Add the missing property to the object or interface definition',
      example: {
        before: "interface User { name: string; }\nconst user: User = { name: 'John' };\nconsole.log(user.email);",
        after: "interface User { name: string; email?: string; }\nconst user: User = { name: 'John' };\nconsole.log(user.email);"
      },
      automated: false
    }
  },
  
  // Implicit any error
  {
    id: 'implicit-any-1',
    name: 'Implicit any type',
    description: 'Variable has an implicit any type',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.MEDIUM,
    regex: 'Parameter \'([^\']+)\' implicitly has an \'any\' type',
    fix: {
      description: 'Add explicit type annotation',
      example: {
        before: "function process(data) { return data; }",
        after: "function process(data: unknown) { return data; }"
      },
      automated: true
    }
  },
  
  // Missing React key prop
  {
    id: 'react-key-1',
    name: 'Missing React key prop',
    description: 'React element in an array is missing the required key prop',
    category: ErrorCategory.MISSING_PROPERTY,
    severity: ErrorSeverity.MEDIUM,
    regex: 'Each child in a list should have a unique "key" prop',
    fix: {
      description: 'Add a unique key prop to each element in the array',
      example: {
        before: "items.map(item => <div>{item.name}</div>)",
        after: "items.map(item => <div key={item.id}>{item.name}</div>)"
      },
      automated: false
    }
  },
  
  // Incorrect JSX syntax with exported function component
  {
    id: 'jsx-export-1',
    name: 'Incorrect JSX export syntax',
    description: 'Function component is not properly exported',
    category: ErrorCategory.SYNTAX_ERROR,
    severity: ErrorSeverity.HIGH,
    regex: 'const ([a-zA-Z0-9_]+)(?:: React\\.FC(?:<[^>]+>)?)? = \\(',
    fix: {
      description: 'Add export keyword to the component definition',
      example: {
        before: "const MyComponent: React.FC = () => { return <div>Hello</div>; };",
        after: "export const MyComponent: React.FC = () => { return <div>Hello</div>; };"
      },
      automated: true
    }
  },
  
  // Express router parameter type error
  {
    id: 'express-parameter-1',
    name: 'Express router parameter type error',
    description: 'Express router handler parameter types are incorrect',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.MEDIUM,
    regex: 'No overload matches this call.*Request.*Response.*NextFunction',
    fix: {
      description: 'Use correct Express request handler parameter types',
      example: {
        before: "router.get('/route', (req, res, next) => { res.send('OK'); });",
        after: "router.get('/route', (req: Request, res: Response, next: NextFunction) => { res.send('OK'); });"
      },
      automated: true
    }
  },
  
  // Duplicate import error
  {
    id: 'duplicate-import-1',
    name: 'Duplicate import declaration',
    description: 'Module is imported multiple times',
    category: ErrorCategory.IMPORT_ERROR,
    severity: ErrorSeverity.LOW,
    regex: 'Import declaration conflicts with local declaration',
    fix: {
      description: 'Consolidate multiple imports into a single import statement',
      example: {
        before: "import { Button } from '@/components/ui';\nimport { Card } from '@/components/ui';",
        after: "import { Button, Card } from '@/components/ui';"
      },
      automated: true
    }
  },
  
  // Optional chaining suggestion
  {
    id: 'optional-chaining-1',
    name: 'Missing optional chaining',
    description: 'Code could benefit from optional chaining to prevent null/undefined errors',
    category: ErrorCategory.NULL_REFERENCE,
    severity: ErrorSeverity.MEDIUM,
    regex: 'Object is possibly \'([^\']+)\'',
    fix: {
      description: 'Use optional chaining (?.) operator',
      example: {
        before: "const name = user.profile.name;",
        after: "const name = user?.profile?.name;"
      },
      automated: true
    }
  },
  
  // Default props for optional parameters
  {
    id: 'default-props-1',
    name: 'Missing default props',
    description: 'Component props marked as optional but used without checks',
    category: ErrorCategory.NULL_REFERENCE,
    severity: ErrorSeverity.MEDIUM,
    regex: 'property \'([^\']+)\' is used before being assigned',
    fix: {
      description: 'Add default values for optional props',
      example: {
        before: "function Component({ items }: { items?: string[] }) { return <div>{items.length}</div>; }",
        after: "function Component({ items = [] }: { items?: string[] }) { return <div>{items.length}</div>; }"
      },
      automated: true
    }
  }
];

// Main function to set up error patterns
async function main() {
  try {
    console.log('Setting up error patterns for TypeScript error management system...');
    
    // Create directory for error patterns if it doesn't exist
    const patternsDir = path.join(process.cwd(), 'server', 'utils', 'error-patterns');
    if (!fs.existsSync(patternsDir)) {
      fs.mkdirSync(patternsDir, { recursive: true });
    }
    
    // Write error patterns to JSON file
    const patternsFile = path.join(patternsDir, 'common-patterns.json');
    fs.writeFileSync(patternsFile, JSON.stringify(errorPatterns, null, 2));
    
    console.log(`Successfully saved ${errorPatterns.length} error patterns to ${patternsFile}`);
    
    // Generate TypeScript definitions
    const patternsTypesFile = path.join(patternsDir, 'error-patterns.d.ts');
    const typesContent = `/**
 * Error pattern definitions for TypeScript error management system
 * Generated on ${new Date().toISOString()}
 */

import { ErrorCategory, ErrorSeverity } from '../ts-error-analyzer';

export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  regex: string;
  fix: {
    description: string;
    example: {
      before: string;
      after: string;
    };
    automated: boolean;
  };
}

export const commonPatterns: ErrorPattern[];
`;
    
    fs.writeFileSync(patternsTypesFile, typesContent);
    console.log(`Successfully generated TypeScript definitions at ${patternsTypesFile}`);
    
    // Generate simple JavaScript module to load the patterns
    const patternsModuleFile = path.join(patternsDir, 'index.ts');
    const moduleContent = `/**
 * Error patterns module for TypeScript error management system
 * Generated on ${new Date().toISOString()}
 */

import * as fs from 'fs';
import * as path from 'path';
import { ErrorPattern } from './error-patterns';

// Load common patterns from JSON
export function loadCommonPatterns(): ErrorPattern[] {
  try {
    const patternsFile = path.join(__dirname, 'common-patterns.json');
    const patternsJson = fs.readFileSync(patternsFile, 'utf-8');
    return JSON.parse(patternsJson);
  } catch (error) {
    console.error('Failed to load error patterns:', error);
    return [];
  }
}

// Get patterns by category
export function getPatternsByCategory(category: string): ErrorPattern[] {
  const patterns = loadCommonPatterns();
  return patterns.filter(pattern => pattern.category === category);
}

// Get pattern by ID
export function getPatternById(id: string): ErrorPattern | undefined {
  const patterns = loadCommonPatterns();
  return patterns.find(pattern => pattern.id === id);
}

// Get automated patterns
export function getAutomatedPatterns(): ErrorPattern[] {
  const patterns = loadCommonPatterns();
  return patterns.filter(pattern => pattern.fix.automated);
}

// Check if a message matches any pattern
export function findMatchingPattern(message: string): ErrorPattern | undefined {
  const patterns = loadCommonPatterns();
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex, 'i');
    if (regex.test(message)) {
      return pattern;
    }
  }
  
  return undefined;
}

// Export all common patterns
export const commonPatterns = loadCommonPatterns();
`;
    
    fs.writeFileSync(patternsModuleFile, moduleContent);
    console.log(`Successfully generated patterns module at ${patternsModuleFile}`);
    
    console.log('\nError patterns setup complete! You can now use these patterns with the TypeScript error management system.');
    console.log('\nExample usage:');
    console.log('```');
    console.log("import { findMatchingPattern } from './server/utils/error-patterns';");
    console.log('');
    console.log("const errorMessage = 'Cannot find name \\'Button\\'';");
    console.log('const pattern = findMatchingPattern(errorMessage);');
    console.log('');
    console.log('if (pattern) {');
    console.log('  console.log(`Found pattern: ${pattern.name}`);');
    console.log('  console.log(`Suggested fix: ${pattern.fix.description}`);');
    console.log('}');
    console.log('```');
    
  } catch (error) {
    console.error('Error setting up error patterns:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});