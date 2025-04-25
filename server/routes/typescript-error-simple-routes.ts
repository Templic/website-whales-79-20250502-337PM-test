/**
 * @file typescript-error-simple-routes.ts
 * @description Simplified API routes for TypeScript error management with basic endpoints
 * Enhanced to include application-specific patterns and diagnostics
 */

import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

// Define types for our data structures
interface Diagnostic {
  code: number;
  category: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  character: number;
  lineText: string;
  fixSuggestion: string;
  fixExample: string;
}

interface ErrorPattern {
  pattern: RegExp;
  code: number;
  category: 'error' | 'warning' | 'info';
  message: string;
  fixSuggestion: string;
  priority: 'high' | 'medium' | 'low';
  appSpecific: boolean;
}

interface SyntaxError {
  code: number;
  message: string;
  line: number;
  column: number;
  suggestion: string;
}

interface BracketPosition {
  char: string;
  line: number;
  column: number;
}

const router = Router();

/**
 * A simple test route to verify the API is working
 * 
 * @route GET /api/typescript-simple/test
 */
router.get('/test', async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'TypeScript error management API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get basic project information without heavy analysis
 * 
 * @route POST /api/typescript-simple/project-info
 */
router.post('/project-info', async (req, res) => {
  try {
    const { projectRoot } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Find tsconfig.json
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const hasTsconfig = fs.existsSync(tsconfigPath);
    
    // Count TypeScript files (limited to avoid heavy processing)
    const tsFiles: string[] = [];
    const maxFilesToCheck = 100;
    let fileCount = 0;
    
    function countTsFiles(dir: string, depth = 0) {
      if (depth > 3 || fileCount >= maxFilesToCheck) return;
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          if (fileCount >= maxFilesToCheck) break;
          
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            countTsFiles(filePath, depth + 1);
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            tsFiles.push(filePath);
            fileCount++;
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
    }
    
    countTsFiles(projectRoot);
    
    return res.json({
      success: true,
      tsconfigExists: hasTsconfig,
      typeScriptFiles: fileCount,
      limitReached: fileCount >= maxFilesToCheck,
      fileList: tsFiles.slice(0, 10) // Return only the first 10 files
    });
  } catch (error) {
    console.error('Error getting project info:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check status of a specific TypeScript file
 * 
 * @route POST /api/typescript-simple/file-info
 */
router.post('/file-info', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    // Validate required parameters
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Check if the file exists
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lineCount = fileContent.split('\n').length;
    
    // Count imports
    const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:[^{][^;]*))(?:from\s+)?['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      imports.push(match[1]);
    }
    
    // Count simple errors - just as a demonstration
    const simpleProblemCount = {
      anyType: (fileContent.match(/:\s*any\b/g) || []).length,
      implicitAny: (fileContent.match(/function\s+\w+\s*\([^:)]*\)/g) || []).length,
      unusedImports: 0, // Would require more complex analysis
      noReturn: 0 // Would require more complex analysis
    };
    
    return res.json({
      success: true,
      fileName: path.basename(filePath),
      lineCount,
      size: fileContent.length,
      imports: imports.length,
      uniqueImports: [...new Set(imports)].length,
      simpleProblemCount,
      firstFewLines: fileContent.split('\n').slice(0, 5).join('\n')
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Simplified analysis of TypeScript errors in a file with basic error detection
 * 
 * @route POST /api/typescript-simple/analyze-file
 */
router.post('/analyze-file', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    // Validate required parameters
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Application-specific pattern-based error detection
    const errorPatterns = [
      // High-priority issues (errors)
      { 
        pattern: /function\s+\w+\s*\([^:)]*\)/g, 
        code: 7006, 
        category: 'error',
        message: 'Parameter implicitly has an any type',
        fixSuggestion: 'Add explicit type annotations to function parameters',
        priority: 'high',
        appSpecific: false
      },
      {
        pattern: /catch\s*\(\s*(\w+)\s*\)/g,
        code: 7029,
        category: 'error',
        message: 'Catch clause variable has an implicit any type',
        fixSuggestion: 'Add explicit type annotation: catch(error: unknown) or catch(error: Error)',
        priority: 'high',
        appSpecific: false
      },
      {
        pattern: /import\s+{\s*[^}]*}\s+from\s+['"][^'"]*['"]/g,
        code: 6192,
        category: 'error',
        message: 'Possible incorrect import path',
        fixSuggestion: 'Check that the import path is correct and the module exists',
        priority: 'high',
        appSpecific: true
      },
      { 
        pattern: /useEffect\([^,]+,\s*\[\]\)/g, 
        code: 8600, 
        category: 'error',
        message: 'React useEffect with empty dependency array but uses external variables',
        fixSuggestion: 'Add all dependencies used inside the effect to the dependency array',
        priority: 'high',
        appSpecific: true
      },

      // Medium-priority issues (warnings)
      { 
        pattern: /:\s*any\b/g, 
        code: 7001, 
        category: 'warning',
        message: 'Using the any type reduces type safety',
        fixSuggestion: 'Replace any with a more specific type or unknown',
        priority: 'medium',
        appSpecific: false
      },
      { 
        pattern: /(const|let|var)\s+\w+\s*=\s*[^;:]*;/g, 
        code: 7008, 
        category: 'warning',
        message: 'Variable has an implicit type',
        fixSuggestion: 'Add explicit type annotation to the variable',
        priority: 'medium',
        appSpecific: false
      },
      { 
        pattern: /function\s+\w+\s*\([^)]*\)\s*{[^}]*return\s+[^;]*;\s*}/g, 
        code: 7010, 
        category: 'warning',
        message: 'Function is missing a return type annotation',
        fixSuggestion: 'Add an explicit return type to the function',
        priority: 'medium',
        appSpecific: false
      },
      { 
        pattern: /\S+\[\s*(['"])[\w\s]+\1\s*\]/g, 
        code: 7053, 
        category: 'warning',
        message: 'Element implicitly has an any type from index signature',
        fixSuggestion: 'Add an index signature with the correct return type to the interface/type',
        priority: 'medium',
        appSpecific: false
      },
      { 
        pattern: /\[('|")[\s\w]*('|")(,\s*('|")[\s\w]*('|"))*\]/g, 
        code: 7034, 
        category: 'warning',
        message: 'String literal array should have explicit type',
        fixSuggestion: 'Add an explicit type annotation: const array: string[] = ["item1", "item2"]',
        priority: 'medium',
        appSpecific: false
      },
      { 
        pattern: /\bnew\s+[\w.]+\b\s*\([^)]*\)/g, 
        code: 2554, 
        category: 'warning',
        message: 'Potential constructor invocation without proper type checking',
        fixSuggestion: 'Make sure constructor arguments match the expected parameter types',
        priority: 'medium',
        appSpecific: false
      },
      
      // App-specific warnings
      {
        pattern: /useState\(<[^>]*>\(.*\)\)/g,
        code: 8601,
        category: 'warning',
        message: 'Unnecessary type annotation in React useState',
        fixSuggestion: 'Simplify to useState<Type>() or useState(initialValue)',
        priority: 'medium',
        appSpecific: true
      },
      {
        pattern: /from\s+["']@shared\//g,
        code: 9000,
        category: 'warning',
        message: 'Using @shared alias in imports',
        fixSuggestion: 'Use relative imports for shared modules to avoid path resolution issues',
        priority: 'medium',
        appSpecific: true
      },
      {
        pattern: /db\.(insert|update|delete|select)/g,
        code: 9001,
        category: 'warning',
        message: 'Direct database operation without error handling',
        fixSuggestion: 'Wrap in try/catch block or use proper error handling pattern',
        priority: 'high',
        appSpecific: true
      },
      {
        pattern: /type\s+(\w+)\s*=\s*any/g,
        code: 9002,
        category: 'warning',
        message: 'Type alias uses any type',
        fixSuggestion: 'Replace any with a more specific interface, type, or use unknown',
        priority: 'medium',
        appSpecific: true
      },
      
      // Low-priority issues (info)
      { 
        pattern: /console\.(log|warn|error|info|debug)/g, 
        code: 6000, 
        category: 'info',
        message: 'Console statement detected',
        fixSuggestion: 'Consider removing console statements in production code',
        priority: 'low',
        appSpecific: false
      },
      { 
        pattern: /\w+\s*\?\s*\w+\s*:\s*\w+/g, 
        code: 7023, 
        category: 'info',
        message: 'Ternary operation detected',
        fixSuggestion: 'Ensure both branches of the ternary return the same type',
        priority: 'low',
        appSpecific: false
      },
      {
        pattern: /\/\/\s*TODO/g,
        code: 6001,
        category: 'info',
        message: 'TODO comment found',
        fixSuggestion: 'Address the TODO comment or create a proper issue/task',
        priority: 'low',
        appSpecific: false
      },
      {
        pattern: /import\s+\*\s+as/g,
        code: 6002,
        category: 'info',
        message: 'Wildcard import detected',
        fixSuggestion: 'Consider using named imports for better tree-shaking',
        priority: 'low',
        appSpecific: false
      }
    ];
    
    // Analyze file line by line
    const lines = fileContent.split('\n');
    const diagnostics: Diagnostic[] = [];
    
    lines.forEach((lineText, lineIndex) => {
      errorPatterns.forEach(pattern => {
        if (pattern.pattern.test(lineText)) {
          // Reset lastIndex to ensure proper detection on subsequent calls
          pattern.pattern.lastIndex = 0;
          
          let match;
          while ((match = pattern.pattern.exec(lineText)) !== null) {
            diagnostics.push({
              code: pattern.code,
              category: pattern.category,
              message: pattern.message,
              line: lineIndex + 1,
              character: match.index + 1,
              lineText: lineText.trim(),
              fixSuggestion: pattern.fixSuggestion,
              fixExample: getFixExample(pattern.code)
            });
          }
        }
      });
    });
    
    // Prepare more sophisticated analysis for future enhancement
    const syntaxErrors = detectBasicSyntaxErrors(fileContent);
    syntaxErrors.forEach(error => {
      // For syntax errors, always use 'error' category
      const errorCategory: 'error' | 'warning' | 'info' = 'error';
      
      // Create a properly typed diagnostic object
      const syntaxDiagnostic: Diagnostic = {
        code: error.code,
        category: errorCategory,
        message: error.message,
        line: error.line,
        character: error.column,
        lineText: lines[error.line - 1] || '',
        fixSuggestion: error.suggestion,
        fixExample: getFixExample(error.code)
      };
      
      diagnostics.push(syntaxDiagnostic);
    });
    
    // Sort diagnostics by line number
    diagnostics.sort((a, b) => a.line - b.line);
    
    return res.json({
      success: true,
      filePath,
      errorCount: diagnostics.filter(d => d.category === 'error').length,
      warningCount: diagnostics.filter(d => d.category === 'warning').length,
      diagnostics
    });
  } catch (error) {
    console.error('Error analyzing file:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get an example fix for a given error code
 */
function getFixExample(code: number): string {
  switch (code) {
    // Standard TypeScript errors
    case 7006: // Parameter implicitly has an any type
      return 'function myFunction(param: string) { return param; }';
    case 7001: // Using any type
      return 'const value: unknown = someValue; // Or use a more specific type';
    case 7008: // Implicit variable type
      return 'const value: string = "Hello"; // Add explicit type';
    case 6000: // Console statement
      return '// Use a logger instead:\nlogger.info("message");';
    case 2304: // Cannot find name 'X'
      return 'const myVariable = "value"; // Declare the variable before using it';
    case 2322: // Type 'X' is not assignable to type 'Y'
      return 'const value: number = 42; // Use the correct type';
    case 2551: // Property 'X' does not exist on type 'Y'
      return 'interface MyObject { newProperty: string; }\nconst obj: MyObject = { newProperty: "value" };';
    case 7010: // Function missing return type
      return 'function calculate(value: number): number {\n  return value * 2;\n}';
    case 7053: // Element implicitly has an any type from index signature
      return 'interface Dictionary {\n  [key: string]: string; // Explicit index signature\n}\nconst dict: Dictionary = { key: "value" };';
    case 7034: // String literal array should have explicit type
      return 'const colors: string[] = ["red", "green", "blue"];';
    case 2554: // Argument of type 'X' is not assignable to parameter type 'Y'
      return 'interface User {\n  name: string;\n  age: number;\n}\n\nconst createUser = (user: User) => {...};\ncreateUser({ name: "John", age: 30 });';
    case 7023: // Ternary operations
      return 'const value: string = condition ? "true result" : "false result"; // Both branches return string';
    case 7029: // Catch clause variable implicitly has any type
      return 'try {\n  // code\n} catch (error: unknown) {\n  console.error(error);\n}';
    case 1005: // Syntax errors with brackets
      return '// Fix mismatched or unclosed brackets\nfunction example() {\n  if (condition) {\n    // code\n  } // Closing brace';
    case 2352: // Type assertion may be unsafe
      return 'const value = data as unknown as SpecificType; // Use unknown as an intermediate step';
    case 6001: // TODO comments
      return '// Create an issue for this TODO or implement the feature\n// JIRA: ABC-123';
    case 6002: // Wildcard import
      return 'import { specific, components } from \'module\'; // Better than import * as module';
    
    // Application-specific errors
    case 6192: // Incorrect import path
      return 'import { Component } from \'../correct/path\'; // Check path exists';
    case 8600: // useEffect empty deps
      return 'useEffect(() => {\n  console.log(value);\n}, [value]); // Include all dependencies';
    case 8601: // Unnecessary useState annotation
      return 'const [value, setValue] = useState<string>(\'\'); // Simplified type annotation';
    case 9000: // @shared alias in imports
      return 'import { type } from \'../../shared/types\'; // Use relative path instead of alias';
    case 9001: // Database without error handling
      return 'try {\n  await db.insert(table).values(data);\n} catch (error: unknown) {\n  logger.error(\'Database error\', error);\n  throw error;\n}';
    case 9002: // Type alias with any
      return 'type UserData = {\n  id: string;\n  name: string;\n  preferences?: Record<string, unknown>;\n}; // More specific than any';
    
    default:
      return '// See TypeScript documentation for this error code';
  }
}

/**
 * Detect basic syntax errors without using TypeScript compiler
 */
function detectBasicSyntaxErrors(fileContent: string): Array<{
  code: number,
  message: string,
  line: number,
  column: number,
  suggestion: string
}> {
  const errors: Array<{
    code: number,
    message: string,
    line: number,
    column: number,
    suggestion: string
  }> = [];
  const lines = fileContent.split('\n');
  
  // Check for mismatched brackets, parentheses, etc.
  const stack: BracketPosition[] = [];
  const brackets: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const openingBrackets = Object.keys(brackets);
  const closingBrackets = Object.values(brackets);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (openingBrackets.includes(char)) {
        stack.push({ char, line: i + 1, column: j + 1 });
      } else if (closingBrackets.includes(char)) {
        const expected = stack.pop();
        if (!expected || brackets[expected.char] !== char) {
          errors.push({
            code: 1005,
            message: `Unexpected ${char}`,
            line: i + 1,
            column: j + 1,
            suggestion: 'Check for mismatched brackets or parentheses'
          });
        }
      }
    }
    
    // Check for some common TypeScript errors
    
    // Type assertions without matching types
    const assertionMatch = line.match(/(as\s+\w+)/g);
    if (assertionMatch) {
      assertionMatch.forEach(match => {
        errors.push({
          code: 2352,
          message: 'Type assertion may be unsafe',
          line: i + 1,
          column: line.indexOf(match) + 1,
          suggestion: 'Verify that this type assertion is safe'
        });
      });
    }
    
    // Missing return types on functions
    const functionMatch = line.match(/function\s+(\w+)\s*\([^)]*\)\s*{/);
    if (functionMatch && !line.includes(':')) {
      errors.push({
        code: 7010,
        message: 'Function is missing a return type annotation',
        line: i + 1,
        column: line.indexOf(functionMatch[1]) + 1,
        suggestion: 'Add an explicit return type annotation'
      });
    }
  }
  
  // Check for unclosed brackets at the end
  if (stack.length > 0) {
    stack.forEach(item => {
      errors.push({
        code: 1005,
        message: `Unclosed ${item.char}`,
        line: item.line,
        column: item.column,
        suggestion: `Add closing ${brackets[item.char]} bracket`
      });
    });
  }
  
  return errors;
}

/**
 * Get TypeScript compiler version information
 * 
 * @route GET /api/typescript-simple/compiler-info
 */
router.get('/compiler-info', async (req, res) => {
  try {
    return res.json({
      success: true,
      version: ts.version,
      targetInfo: {
        ES3: ts.ScriptTarget.ES3,
        ES5: ts.ScriptTarget.ES5,
        ES2015: ts.ScriptTarget.ES2015,
        ES2016: ts.ScriptTarget.ES2016,
        ES2017: ts.ScriptTarget.ES2017,
        ES2018: ts.ScriptTarget.ES2018,
        ES2019: ts.ScriptTarget.ES2019,
        ES2020: ts.ScriptTarget.ES2020,
        ESNext: ts.ScriptTarget.ESNext,
      },
      moduleInfo: {
        None: ts.ModuleKind.None,
        CommonJS: ts.ModuleKind.CommonJS,
        AMD: ts.ModuleKind.AMD,
        UMD: ts.ModuleKind.UMD,
        System: ts.ModuleKind.System,
        ES2015: ts.ModuleKind.ES2015,
        ES2020: ts.ModuleKind.ES2020,
        ESNext: ts.ModuleKind.ESNext,
      }
    });
  } catch (error) {
    console.error('Error getting compiler info:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Batch analyze multiple TypeScript files and identify common error patterns
 * 
 * @route POST /api/typescript-simple/batch-analyze
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    const { projectRoot, maxFiles = 50, includePatterns = [], excludeFolders = ['node_modules', '.git', 'dist', 'build'] } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }
    
    // Find TypeScript files
    const tsFiles: string[] = [];
    let processedFiles = 0;
    
    // Helper function to find TS files
    function findTsFiles(dir: string, depth = 0): void {
      if (depth > 5 || processedFiles >= maxFiles) return;
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          if (processedFiles >= maxFiles) break;
          
          const filePath = path.join(dir, file);
          const relativePath = path.relative(projectRoot, filePath);
          
          // Skip excluded folders
          if (excludeFolders.some((folder: string) => relativePath.startsWith(folder))) {
            continue;
          }
          
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            findTsFiles(filePath, depth + 1);
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            // Check if file matches include patterns if any are specified
            if (includePatterns.length > 0) {
              if (includePatterns.some((pattern: string) => new RegExp(pattern).test(filePath))) {
                tsFiles.push(filePath);
                processedFiles++;
              }
            } else {
              tsFiles.push(filePath);
              processedFiles++;
            }
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
    }
    
    findTsFiles(projectRoot);
    
    // Process each file for errors
    const results: Record<string, any> = {};
    const allErrors: Diagnostic[] = [];
    const errorsByFile: Record<string, Diagnostic[]> = {};
    const errorsByCategory: Record<string, number> = {
      error: 0,
      warning: 0,
      info: 0
    };
    const errorsByCode: Record<number, { count: number, examples: Array<{ file: string, line: number, message: string }> }> = {};
    const appSpecificErrors: Record<string, number> = {};
    
    for (const filePath of tsFiles) {
      try {
        // Skip if file doesn't exist
        if (!fs.existsSync(filePath)) continue;
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        const diagnostics: Diagnostic[] = [];
        
        // Check for errors using the same error patterns defined earlier
        const localErrorPatterns: ErrorPattern[] = [
          // High-priority issues (errors)
          { 
            pattern: /function\s+\w+\s*\([^:)]*\)/g, 
            code: 7006, 
            category: 'error',
            message: 'Parameter implicitly has an any type',
            fixSuggestion: 'Add explicit type annotations to function parameters',
            priority: 'high',
            appSpecific: false
          },
          {
            pattern: /catch\s*\(\s*(\w+)\s*\)/g,
            code: 7029,
            category: 'error',
            message: 'Catch clause variable has an implicit any type',
            fixSuggestion: 'Add explicit type annotation: catch(error: unknown) or catch(error: Error)',
            priority: 'high',
            appSpecific: false
          },
          {
            pattern: /import\s+{\s*[^}]*}\s+from\s+['"][^'"]*['"]/g,
            code: 6192,
            category: 'error',
            message: 'Possible incorrect import path',
            fixSuggestion: 'Check that the import path is correct and the module exists',
            priority: 'high',
            appSpecific: true
          },
          { 
            pattern: /useEffect\([^,]+,\s*\[\]\)/g, 
            code: 8600, 
            category: 'error',
            message: 'React useEffect with empty dependency array but uses external variables',
            fixSuggestion: 'Add all dependencies used inside the effect to the dependency array',
            priority: 'high',
            appSpecific: true
          },
          // Medium-priority issues (warnings)
          { 
            pattern: /:\s*any\b/g, 
            code: 7001, 
            category: 'warning',
            message: 'Using the any type reduces type safety',
            fixSuggestion: 'Replace any with a more specific type or unknown',
            priority: 'medium',
            appSpecific: false
          },
          { 
            pattern: /(const|let|var)\s+\w+\s*=\s*[^;:]*;/g, 
            code: 7008, 
            category: 'warning',
            message: 'Variable has an implicit type',
            fixSuggestion: 'Add explicit type annotation to the variable',
            priority: 'medium',
            appSpecific: false
          },
          // App-specific warnings
          {
            pattern: /useState\(<[^>]*>\(.*\)\)/g,
            code: 8601,
            category: 'warning',
            message: 'Unnecessary type annotation in React useState',
            fixSuggestion: 'Simplify to useState<Type>() or useState(initialValue)',
            priority: 'medium',
            appSpecific: true
          },
          {
            pattern: /from\s+["']@shared\//g,
            code: 9000,
            category: 'warning',
            message: 'Using @shared alias in imports',
            fixSuggestion: 'Use relative imports for shared modules to avoid path resolution issues',
            priority: 'medium',
            appSpecific: true
          },
          {
            pattern: /db\.(insert|update|delete|select)/g,
            code: 9001,
            category: 'warning',
            message: 'Direct database operation without error handling',
            fixSuggestion: 'Wrap in try/catch block or use proper error handling pattern',
            priority: 'high',
            appSpecific: true
          },
          // Low-priority issues (info)
          { 
            pattern: /console\.(log|warn|error|info|debug)/g, 
            code: 6000, 
            category: 'info',
            message: 'Console statement detected',
            fixSuggestion: 'Consider removing console statements in production code',
            priority: 'low',
            appSpecific: false
          }
        ];
        
        lines.forEach((lineText, lineIndex) => {
          localErrorPatterns.forEach(pattern => {
            if (pattern.pattern.test(lineText)) {
              // Reset lastIndex to ensure proper detection on subsequent calls
              pattern.pattern.lastIndex = 0;
              
              let match;
              while ((match = pattern.pattern.exec(lineText)) !== null) {
                const diagnostic: Diagnostic = {
                  code: pattern.code,
                  category: pattern.category,
                  message: pattern.message,
                  line: lineIndex + 1,
                  character: match.index + 1,
                  lineText: lineText.trim(),
                  fixSuggestion: pattern.fixSuggestion,
                  fixExample: getFixExample(pattern.code)
                };
                
                diagnostics.push(diagnostic);
                allErrors.push(diagnostic);
                
                // Increment error category count
                errorsByCategory[pattern.category]++;
                
                // Track app-specific errors
                if (pattern.appSpecific) {
                  appSpecificErrors[pattern.message] = (appSpecificErrors[pattern.message] || 0) + 1;
                }
                
                // Track errors by code
                if (!errorsByCode[pattern.code]) {
                  errorsByCode[pattern.code] = { count: 0, examples: [] };
                }
                
                errorsByCode[pattern.code].count++;
                
                // Store an example (up to 3 for each code)
                if (errorsByCode[pattern.code].examples.length < 3) {
                  errorsByCode[pattern.code].examples.push({
                    file: path.basename(filePath),
                    line: lineIndex + 1,
                    message: pattern.message
                  });
                }
              }
            }
          });
        });
        
        // Store results for this file
        if (diagnostics.length > 0) {
          const relativePath = path.relative(projectRoot, filePath);
          errorsByFile[relativePath] = diagnostics;
          
          results[relativePath] = {
            errorCount: diagnostics.filter(d => d.category === 'error').length,
            warningCount: diagnostics.filter(d => d.category === 'warning').length,
            infoCount: diagnostics.filter(d => d.category === 'info').length,
            totalIssues: diagnostics.length
          };
        }
      } catch (err) {
        console.error(`Error analyzing file ${filePath}:`, err);
      }
    }
    
    // Sort and organize results
    const filesSortedByErrorCount = Object.entries(results)
      .sort((a, b) => b[1].totalIssues - a[1].totalIssues)
      .slice(0, 10)
      .map(([file, stats]) => ({ file, ...stats }));
    
    const errorsGroupedByCode = Object.entries(errorsByCode)
      .map(([code, data]) => ({ 
        code: parseInt(code), 
        count: data.count, 
        message: data.examples[0]?.message || '',
        examples: data.examples
      }))
      .sort((a, b) => b.count - a.count);
    
    // Calculate the most common error patterns
    const mostCommonErrors = errorsGroupedByCode.slice(0, 5);
    
    // Prepare recommended fixes for the top 3 most common errors
    const recommendedFixes = mostCommonErrors.slice(0, 3).map(error => ({
      code: error.code,
      message: error.message,
      count: error.count,
      fix: getFixExample(error.code)
    }));
    
    // Determine files with the most issues
    const hotspotFiles = filesSortedByErrorCount.slice(0, 5);
    
    // Calculate summary stats
    const totalFiles = tsFiles.length;
    const filesWithErrors = Object.keys(results).length;
    const totalIssues = allErrors.length;
    
    return res.json({
      success: true,
      stats: {
        totalFiles,
        filesWithErrors,
        filesWithoutErrors: totalFiles - filesWithErrors,
        percentClean: totalFiles ? Math.round(((totalFiles - filesWithErrors) / totalFiles) * 100) : 0,
        totalIssues,
        byCategory: errorsByCategory
      },
      hotspotFiles,
      mostCommonErrors,
      recommendedFixes,
      appSpecificIssues: Object.entries(appSpecificErrors)
        .sort((a, b) => b[1] - a[1])
        .map(([message, count]) => ({ message, count })),
      breakdownByFile: results,
      // Include detail for top files only to avoid excessively large response
      detailedErrors: Object.fromEntries(
        Object.entries(errorsByFile)
          .filter(([file]) => hotspotFiles.some(hotspot => hotspot.file === file))
          .map(([file, errors]) => [file, errors])
      )
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get a basic type foundation health report
 * 
 * @route POST /api/typescript-simple/type-foundation
 */
router.post('/type-foundation', async (req, res) => {
  try {
    const { projectRoot, maxFiles = 30 } = req.body;
    
    // Validate required parameters
    if (!projectRoot) {
      return res.status(400).json({
        success: false,
        message: 'Project root is required'
      });
    }

    // Structure to hold analysis results
    const analysis = {
      typeDefinitions: {
        interfaceCount: 0,
        typeAliasCount: 0,
        enumCount: 0,
        genericTypeCount: 0
      },
      typeUsage: {
        anyTypeCount: 0, 
        unknownTypeCount: 0,
        primitiveTypeCount: 0,
        objectTypeCount: 0,
        arrayTypeCount: 0,
        functionTypeCount: 0
      },
      typeSafety: {
        explicitTypeAnnotations: 0,
        implicitTypeAnnotations: 0,
        typeAssertions: 0,
        nonNullAssertions: 0
      },
      whaleAppSpecific: {
        whaleRelatedTypes: 0,
        oceanRelatedTypes: 0,
        soundRelatedTypes: 0,
        userInteractionTypes: 0
      },
      files: {
        analyzed: 0,
        withTypes: 0,
        withoutTypes: 0
      }
    };

    // Helper function to analyze a single file
    function analyzeFile(filePath: string): void {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let hasTypeDefinitions = false;
        
        for (const line of lines) {
          // Check for type definitions
          if (/\binterface\s+\w+/.test(line)) {
            analysis.typeDefinitions.interfaceCount++;
            hasTypeDefinitions = true;
          }
          if (/\btype\s+\w+\s*=/.test(line)) {
            analysis.typeDefinitions.typeAliasCount++;
            hasTypeDefinitions = true;
          }
          if (/\benum\s+\w+/.test(line)) {
            analysis.typeDefinitions.enumCount++;
            hasTypeDefinitions = true;
          }
          if (/<[^>]+>/.test(line)) {
            analysis.typeDefinitions.genericTypeCount++;
          }
          
          // Check type usage
          if (/:\s*any\b/.test(line) || /as\s+any\b/.test(line)) {
            analysis.typeUsage.anyTypeCount++;
          }
          if (/:\s*unknown\b/.test(line) || /as\s+unknown\b/.test(line)) {
            analysis.typeUsage.unknownTypeCount++;
          }
          if (/:\s*(string|number|boolean|null|undefined)\b/.test(line)) {
            analysis.typeUsage.primitiveTypeCount++;
          }
          if (/:\s*\{[^}]*\}/.test(line)) {
            analysis.typeUsage.objectTypeCount++;
          }
          if (/:\s*(\w+)\[\]/.test(line) || /:\s*Array</.test(line)) {
            analysis.typeUsage.arrayTypeCount++;
          }
          if (/:\s*\([^)]*\)\s*=>/.test(line)) {
            analysis.typeUsage.functionTypeCount++;
          }
          
          // Check type safety
          if (/:\s*\w+/.test(line)) {
            analysis.typeSafety.explicitTypeAnnotations++;
          }
          if (/\bconst\s+\w+\s*=/.test(line) && !/:/.test(line)) {
            analysis.typeSafety.implicitTypeAnnotations++;
          }
          if (/as\s+\w+/.test(line)) {
            analysis.typeSafety.typeAssertions++;
          }
          if (/\w+!\./.test(line) || /\w+!\[/.test(line)) {
            analysis.typeSafety.nonNullAssertions++;
          }
          
          // Check whale app specific types
          if (/\b(whale|orca|dolphin|marine|cetacean)\b/i.test(line) && (/type|interface|enum/.test(line) || /:/.test(line))) {
            analysis.whaleAppSpecific.whaleRelatedTypes++;
          }
          if (/\b(ocean|sea|aquatic|underwater|maritime)\b/i.test(line) && (/type|interface|enum/.test(line) || /:/.test(line))) {
            analysis.whaleAppSpecific.oceanRelatedTypes++;
          }
          if (/\b(sound|frequency|audio|binaural|acoustic)\b/i.test(line) && (/type|interface|enum/.test(line) || /:/.test(line))) {
            analysis.whaleAppSpecific.soundRelatedTypes++;
          }
          if (/\b(user|interaction|input|form|response)\b/i.test(line) && (/type|interface|enum/.test(line) || /:/.test(line))) {
            analysis.whaleAppSpecific.userInteractionTypes++;
          }
        }
        
        // Update file stats
        analysis.files.analyzed++;
        if (hasTypeDefinitions) {
          analysis.files.withTypes++;
        } else {
          analysis.files.withoutTypes++;
        }
      } catch (err) {
        console.error(`Error analyzing file ${filePath}:`, err);
      }
    }
    
    // Find and analyze TypeScript files
    function findAndAnalyzeFiles(dir: string, depth = 0): void {
      if (depth > 5 || analysis.files.analyzed >= maxFiles) return;
      
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          if (analysis.files.analyzed >= maxFiles) break;
          
          const filePath = path.join(dir, file);
          const relativePath = path.relative(projectRoot, filePath);
          
          // Skip node_modules and hidden folders
          if (file === 'node_modules' || file.startsWith('.')) {
            continue;
          }
          
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            findAndAnalyzeFiles(filePath, depth + 1);
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            analyzeFile(filePath);
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
    }
    
    findAndAnalyzeFiles(projectRoot);
    
    // Calculate overall type health score (0-100)
    const typeHealthScore = calculateTypeHealthScore(analysis);
    
    // Generate recommendations
    const recommendations = generateTypeRecommendations(analysis);
    
    return res.json({
      success: true,
      typeHealthScore,
      analysis,
      recommendations,
      summary: {
        totalFilesAnalyzed: analysis.files.analyzed,
        typeDefinitionsFound: analysis.typeDefinitions.interfaceCount + 
                             analysis.typeDefinitions.typeAliasCount + 
                             analysis.typeDefinitions.enumCount,
        anyTypeUsage: analysis.typeUsage.anyTypeCount,
        typeAssertionUsage: analysis.typeSafety.typeAssertions,
        appSpecificTypes: analysis.whaleAppSpecific.whaleRelatedTypes + 
                          analysis.whaleAppSpecific.oceanRelatedTypes + 
                          analysis.whaleAppSpecific.soundRelatedTypes +
                          analysis.whaleAppSpecific.userInteractionTypes
      }
    });
  } catch (error) {
    console.error('Error analyzing type foundation:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Calculate type health score from analysis data
 */
function calculateTypeHealthScore(analysis: any): number {
  // Calculate a score from 0-100 based on various factors
  
  // File coverage score (0-25)
  const fileTypeCoverage = analysis.files.analyzed === 0 ? 0 : 
    Math.min(25, Math.round((analysis.files.withTypes / analysis.files.analyzed) * 25));
  
  // Type safety score (0-30)
  const totalAnnotations = analysis.typeSafety.explicitTypeAnnotations + analysis.typeSafety.implicitTypeAnnotations;
  const explicitTypeRatio = totalAnnotations === 0 ? 0 : 
    analysis.typeSafety.explicitTypeAnnotations / totalAnnotations;
  
  const typeSafetyScore = Math.min(30, Math.round(explicitTypeRatio * 20 + 
    (analysis.typeUsage.unknownTypeCount > analysis.typeUsage.anyTypeCount ? 10 : 0)));
  
  // Type richness score (0-25)
  const typeDefinitionsCount = analysis.typeDefinitions.interfaceCount + 
    analysis.typeDefinitions.typeAliasCount + 
    analysis.typeDefinitions.enumCount;
  
  const typeRichnessScore = Math.min(25, Math.round((
    Math.min(typeDefinitionsCount, 50) / 50) * 25));
  
  // App-specific type coverage (0-20)
  const appSpecificTypeCount = analysis.whaleAppSpecific.whaleRelatedTypes + 
    analysis.whaleAppSpecific.oceanRelatedTypes + 
    analysis.whaleAppSpecific.soundRelatedTypes +
    analysis.whaleAppSpecific.userInteractionTypes;
  
  const appSpecificScore = Math.min(20, Math.round((
    Math.min(appSpecificTypeCount, 20) / 20) * 20));
  
  return fileTypeCoverage + typeSafetyScore + typeRichnessScore + appSpecificScore;
}

/**
 * Generate recommendations based on type analysis
 */
function generateTypeRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];
  
  // Check for excessive any usage
  if (analysis.typeUsage.anyTypeCount > analysis.typeUsage.unknownTypeCount * 2) {
    recommendations.push('Replace `any` types with more specific types or `unknown` for better type safety.');
  }
  
  // Check for type definition coverage
  if (analysis.files.withoutTypes > analysis.files.withTypes) {
    recommendations.push('Add more interfaces and type definitions to improve code maintainability.');
  }
  
  // Check for type assertions
  if (analysis.typeSafety.typeAssertions > 10) {
    recommendations.push('Reduce the number of type assertions (as Type) by implementing proper type guards.');
  }
  
  // Check for non-null assertions
  if (analysis.typeSafety.nonNullAssertions > 5) {
    recommendations.push('Replace non-null assertions (value!) with proper null checks or the nullish coalescing operator.');
  }
  
  // Check for domain-specific types
  if (analysis.whaleAppSpecific.whaleRelatedTypes + 
      analysis.whaleAppSpecific.oceanRelatedTypes + 
      analysis.whaleAppSpecific.soundRelatedTypes < 10) {
    recommendations.push('Create more domain-specific types for whale, ocean, and sound concepts to better model your application domain.');
  }
  
  // Check for generic type usage
  if (analysis.typeDefinitions.genericTypeCount < 5 && analysis.files.withTypes > 10) {
    recommendations.push('Increase usage of generic types to create more reusable and flexible components.');
  }
  
  // Suggest type organization improvements if there are many types
  if (analysis.typeDefinitions.interfaceCount + analysis.typeDefinitions.typeAliasCount > 20) {
    recommendations.push('Consider organizing your types into logical modules with barrel exports for better code organization.');
  }
  
  // Suggest advanced TS features if basic usage is good
  if (analysis.typeSafety.explicitTypeAnnotations > 50) {
    recommendations.push('Consider using advanced TypeScript features like conditional types, mapped types, or template literal types where appropriate.');
  }
  
  return recommendations;
}

export default router;