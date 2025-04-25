/**
 * @file typescript-error-simple-routes.ts
 * @description Simplified API routes for TypeScript error management with basic endpoints
 */

import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

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
    const tsFiles = [];
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
 * Analyze TypeScript errors in a file and provide fix suggestions
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
    
    // We'll use the program to get the source file instead of creating one directly
    // This comment is just a placeholder to replace the createSourceFile call
    
    // Find tsconfig.json in parent directories
    let tsconfigPath = path.join(path.dirname(filePath), 'tsconfig.json');
    let currentDir = path.dirname(filePath);
    while (!fs.existsSync(tsconfigPath) && currentDir !== path.dirname(currentDir)) {
      currentDir = path.dirname(currentDir);
      tsconfigPath = path.join(currentDir, 'tsconfig.json');
    }
    
    // Create compiler options
    let compilerOptions: ts.CompilerOptions = {
      noImplicitAny: true,
      strictNullChecks: true,
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React
    };
    
    // If tsconfig.json exists, use its options
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
        if (!tsconfigFile.error) {
          const parsedConfig = ts.parseJsonConfigFileContent(
            tsconfigFile.config,
            ts.sys,
            path.dirname(tsconfigPath)
          );
          compilerOptions = parsedConfig.options;
        }
      } catch (err) {
        console.error('Error reading tsconfig.json:', err);
      }
    }
    
    // Create a program with the necessary options
    const host = ts.createCompilerHost(compilerOptions);
    
    // We need to create a valid program with proper rootNames
    const program = ts.createProgram({
      rootNames: [filePath],
      options: compilerOptions,
      host
    });
    
    // Get the source file from the program, not from createSourceFile
    const sourceFileFromProgram = program.getSourceFile(filePath);
    
    if (!sourceFileFromProgram) {
      return res.status(500).json({
        success: false,
        message: `Could not get source file from program for ${filePath}`
      });
    }
    
    // Get diagnostics using the program's methods
    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFileFromProgram);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFileFromProgram);
    const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];
    
    // Process diagnostics and generate fix suggestions
    const diagnosticsWithSuggestions = allDiagnostics.map(diagnostic => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const category = diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 
                      diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'info';
      const code = diagnostic.code;
      
      // Get location info
      let line = 0;
      let character = 0;
      let lineText = '';
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line: lineNum, character: col } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        line = lineNum + 1; // Convert to 1-based
        character = col + 1; // Convert to 1-based
        
        // Get the text of the line with the error
        const lineStarts = diagnostic.file.getLineStarts();
        const lineStart = lineStarts[lineNum];
        const lineEnd = lineNum < lineStarts.length - 1 ? lineStarts[lineNum + 1] : diagnostic.file.text.length;
        lineText = diagnostic.file.text.substring(lineStart, lineEnd).trimEnd();
      }
      
      // Generate fix suggestion based on error code
      let fixSuggestion = '';
      let fixExample = '';
      
      switch (code) {
        case 2304: // Cannot find name 'X'
          fixSuggestion = 'This identifier is undefined. You need to declare it before use or fix the typo.';
          fixExample = 'const myVariable = "value"; // Declare the variable before using it';
          break;
        case 2322: // Type 'X' is not assignable to type 'Y'
          fixSuggestion = 'The types don\'t match. Make sure you\'re using the correct type or add a type assertion if necessary.';
          fixExample = 'const value: number = 42; // Use the correct type\n// or\nconst value = "42" as unknown as number; // Use type assertion (avoid if possible)';
          break;
        case 2551: // Property 'X' does not exist on type 'Y'
          fixSuggestion = 'The object doesn\'t have this property. Check for typos or add the property to the object type.';
          fixExample = 'interface MyObject { newProperty: string; }\nconst obj: MyObject = { newProperty: "value" };';
          break;
        case 2339: // Property 'X' does not exist on type 'Y'
          fixSuggestion = 'The object doesn\'t have this property. Check for typos or add the property to the object.';
          fixExample = 'interface MyObject { myProperty: string; }\nconst obj: MyObject = { myProperty: "value" };';
          break;
        case 7006: // Parameter 'X' implicitly has an 'any' type
          fixSuggestion = 'Add an explicit type annotation to the parameter.';
          fixExample = 'function myFunction(param: string) { return param; }';
          break;
        case 2345: // Argument of type 'X' is not assignable to parameter of type 'Y'
          fixSuggestion = 'The argument type doesn\'t match the parameter type. Use a value of the correct type.';
          fixExample = 'function expectsNumber(num: number) { }\nexpectsNumber(42); // Pass a number instead of a string';
          break;
        case 2554: // Expected N arguments, but got M
          fixSuggestion = 'You\'re calling a function with the wrong number of arguments. Check the function signature.';
          fixExample = 'function twoParams(a: string, b: number) { }\ntwoParams("text", 42); // Pass all required arguments';
          break;
        default:
          fixSuggestion = 'Review the error message and check TypeScript documentation for this error code.';
          fixExample = '// See https://www.typescriptlang.org/docs/';
      }
      
      return {
        code,
        category,
        message,
        line,
        character,
        lineText,
        fixSuggestion,
        fixExample
      };
    });
    
    return res.json({
      success: true,
      filePath,
      errorCount: diagnosticsWithSuggestions.filter(d => d.category === 'error').length,
      warningCount: diagnosticsWithSuggestions.filter(d => d.category === 'warning').length,
      diagnostics: diagnosticsWithSuggestions
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

export default router;