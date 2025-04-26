/**
 * TypeScript Error Pattern Documenter
 * 
 * This utility analyzes TypeScript errors in the codebase, identifies common patterns,
 * and generates comprehensive documentation for each pattern. The documentation includes:
 * 
 * - Pattern description
 * - Error examples
 * - Root cause analysis
 * - Fix strategies
 * - Impact assessment
 * 
 * This is part of the three-phase TypeScript error management system and supports
 * the error ranking and documentation aspect of the system.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as tsErrorStorage from './server/tsErrorStorage';
import { ErrorCategory, ErrorSeverity } from './shared/schema';

interface ErrorPattern {
  id: string;
  name: string;
  category: ErrorCategory;
  errorCodes: string[];
  description: string;
  examples: Array<{
    code: string;
    message: string;
    context: string;
    file: string;
    line: number;
  }>;
  rootCause: string;
  fixStrategy: string;
  impactLevel: string;
  relatedPatterns: string[];
}

interface DocumentOptions {
  outputDir: string;
  format: 'markdown' | 'html' | 'json';
  includeExamples: boolean;
  maxExamples: number;
  groupBy: 'category' | 'severity' | 'code';
}

const defaultOptions: DocumentOptions = {
  outputDir: './ts-error-docs',
  format: 'markdown',
  includeExamples: true,
  maxExamples: 3,
  groupBy: 'category'
};

/**
 * Generate documentation for TypeScript error patterns
 */
export async function generateErrorDocumentation(options: Partial<DocumentOptions> = {}) {
  const opts = { ...defaultOptions, ...options };
  
  console.log('Generating TypeScript error pattern documentation...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(opts.outputDir)) {
    fs.mkdirSync(opts.outputDir, { recursive: true });
  }
  
  // Get all errors from the database
  const errors = await tsErrorStorage.getAllTypeScriptErrors({});
  
  if (errors.length === 0) {
    console.log('No errors found in the database. Run a scan first.');
    return;
  }
  
  console.log(`Found ${errors.length} errors in the database.`);
  
  // Identify patterns in errors
  const patterns = identifyErrorPatterns(errors);
  
  console.log(`Identified ${patterns.length} distinct error patterns.`);
  
  // Generate documentation based on the selected format
  switch (opts.format) {
    case 'markdown':
      await generateMarkdownDocumentation(patterns, opts);
      break;
    case 'html':
      await generateHtmlDocumentation(patterns, opts);
      break;
    case 'json':
      await generateJsonDocumentation(patterns, opts);
      break;
  }
  
  console.log(`Documentation generated in ${opts.outputDir}`);
}

/**
 * Identify patterns in TypeScript errors
 */
function identifyErrorPatterns(errors: unknown[]): ErrorPattern[] {
  // Group errors by error code
  const errorsByCode: Record<string, any[]> = {};
  for (const error of errors) {
    if (!errorsByCode[error.error_code]) {
      errorsByCode[error.error_code] = [];
    }
    errorsByCode[error.error_code].push(error);
  }
  
  // Create patterns based on error codes
  const patterns: ErrorPattern[] = [];
  
  for (const [code, codeErrors] of Object.entries(errorsByCode)) {
    // Skip if there are too few errors of this type
    if (codeErrors.length < 2) continue;
    
    // Get a representative error
    const representative = codeErrors[0];
    
    // Determine the category
    const category = representative.category;
    
    // Create a pattern ID
    const patternId = `pattern-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // Create a pattern name
    const patternName = getPatternName(code, representative.error_message);
    
    // Create examples (limited)
    const examples = codeErrors.slice(0, 5).map(err => ({
      code: err.error_code,
      message: err.error_message,
      context: err.error_context,
      file: path.basename(err.file_path),
      line: err.line_number
    }));
    
    // Create a pattern
    const pattern: ErrorPattern = {
      id: patternId,
      name: patternName,
      category: category as ErrorCategory,
      errorCodes: [code],
      description: getPatternDescription(code, representative.error_message, category),
      examples,
      rootCause: getRootCause(code, category),
      fixStrategy: getFixStrategy(code, category),
      impactLevel: getImpactLevel(category),
      relatedPatterns: []
    };
    
    patterns.push(pattern);
  }
  
  // Find related patterns
  for (const pattern of patterns) {
    pattern.relatedPatterns = patterns
      .filter(p => p.id !== pattern.id && p.category === pattern.category)
      .map(p => p.id);
  }
  
  return patterns;
}

/**
 * Get a pattern name from error code and message
 */
function getPatternName(code: string, message: string): string {
  // Extract the main part of the message
  const mainMessage = message.split(':')[0].trim();
  
  // Create a concise name
  if (message.includes('is not assignable to')) {
    return 'Type Mismatch Error';
  } else if (message.includes('Cannot find')) {
    return 'Missing Declaration Error';
  } else if (message.includes('Property') && message.includes('does not exist')) {
    return 'Undefined Property Access Error';
  } else if (message.includes('null') || message.includes('undefined')) {
    return 'Null Reference Error';
  } else if (message.includes('Expected') || message.includes('syntax')) {
    return 'Syntax Error';
  } else {
    return `${code} Error`;
  }
}

/**
 * Get a pattern description from error code and message
 */
function getPatternDescription(code: string, message: string, category: string): string {
  switch (category) {
    case 'type_mismatch':
      return 'This error occurs when a value of one type is assigned to a variable or parameter of an incompatible type. TypeScript\'s type system prevents these assignments to ensure type safety at runtime.';
    case 'missing_type':
      return 'This error occurs when a variable, parameter, or return value is missing a type annotation, potentially allowing an implicit "any" type that can lead to runtime type errors.';
    case 'import_error':
      return 'This error occurs when TypeScript cannot find a module or exported member that is being imported. This can be due to typos, missing files, or incorrect module paths.';
    case 'undefined_variable':
      return 'This error occurs when attempting to reference a variable that has not been declared in the current scope. This can be due to typos, missing declarations, or scope issues.';
    case 'null_reference':
      return 'This error occurs when attempting to access properties or methods on a value that could be null or undefined. TypeScript requires proper null checking to prevent runtime errors.';
    case 'interface_mismatch':
      return 'This error occurs when a class or object does not correctly implement an interface. This means the object is missing required properties or methods defined by the interface.';
    case 'syntax_error':
      return 'This error occurs when the TypeScript code contains invalid syntax that does not conform to the language rules. This can include missing parentheses, semicolons, or other syntax elements.';
    default:
      return `This error (${code}) indicates a problem with the TypeScript code that needs to be addressed to ensure type safety and correct program behavior.`;
  }
}

/**
 * Get the root cause for a pattern
 */
function getRootCause(code: string, category: string): string {
  switch (category) {
    case 'type_mismatch':
      return 'The root cause is typically a mismatch between the expected type in a variable declaration, function parameter, or return type and the actual type of the value being used. This can happen due to incorrect assumptions about the shape of data or incorrect type declarations.';
    case 'missing_type':
      return 'The root cause is the absence of explicit type annotations in code where TypeScript cannot infer the type accurately. This is often due to complex expressions or the use of "any" types in dependencies.';
    case 'import_error':
      return 'The root cause is usually a missing module, incorrect path, or a typo in the import statement. This can also happen if the imported module does not export the member being imported or if there are circular dependencies.';
    case 'undefined_variable':
      return 'The root cause is typically a reference to a variable that has not been declared in the current scope. This could be due to a typo, a missing declaration, or trying to access a variable outside its scope.';
    case 'null_reference':
      return 'The root cause is the lack of null checking before accessing properties on an object that could be null or undefined. This is often due to assumptions about the state of objects or incomplete handling of optional values.';
    case 'interface_mismatch':
      return 'The root cause is an implementation that does not satisfy its interface contract. This is typically due to missing properties, incorrect property types, or missing methods in the implementing class.';
    case 'syntax_error':
      return 'The root cause is invalid TypeScript syntax that violates the language grammar rules. This can include missing brackets, semicolons, incorrect use of keywords, or other syntax elements.';
    default:
      return 'The root cause requires investigation of the specific error context and code behavior.';
  }
}

/**
 * Get the fix strategy for a pattern
 */
function getFixStrategy(code: string, category: string): string {
  switch (category) {
    case 'type_mismatch':
      return 'To fix this error:\n1. Verify the intended types on both sides of the assignment\n2. Add explicit type conversions where appropriate\n3. Update type definitions to match the actual data structure\n4. Use type guards to narrow types when necessary';
    case 'missing_type':
      return 'To fix this error:\n1. Add explicit type annotations to variables, parameters, and return values\n2. Create interfaces or type aliases for complex types\n3. Avoid using "any" type where possible\n4. Use the noImplicitAny compiler option to catch these issues early';
    case 'import_error':
      return 'To fix this error:\n1. Verify that the imported module exists at the specified path\n2. Check for typos in the import statement\n3. Ensure the member being imported is actually exported\n4. Use correct module resolution strategies (e.g., path aliases, relative paths)';
    case 'undefined_variable':
      return 'To fix this error:\n1. Declare the variable before using it\n2. Check for typos in the variable name\n3. Ensure the variable is accessible within the current scope\n4. Import any external variables or functions that are needed';
    case 'null_reference':
      return 'To fix this error:\n1. Add null checks before accessing properties (e.g., using if statements)\n2. Use the optional chaining operator (?.) for safer property access\n3. Use the nullish coalescing operator (??) to provide default values\n4. Use non-null assertion (!) only when you are certain a value is not null';
    case 'interface_mismatch':
      return 'To fix this error:\n1. Implement all required properties and methods from the interface\n2. Ensure property types match the interface declaration\n3. Use optional properties (?) in the interface for properties that might not be present\n4. Consider using type assertions or generics for more flexible implementations';
    case 'syntax_error':
      return 'To fix this error:\n1. Review the syntax error message carefully\n2. Check for missing brackets, parentheses, or semicolons\n3. Ensure keywords are used correctly\n4. Refer to TypeScript language documentation for correct syntax';
    default:
      return 'To fix this error, a detailed analysis of the specific error context is required. Review the error message and surrounding code carefully.';
  }
}

/**
 * Get the impact level for a pattern
 */
function getImpactLevel(category: string): string {
  switch (category) {
    case 'syntax_error':
    case 'import_error':
      return 'High - These errors prevent compilation and must be fixed immediately.';
    case 'type_mismatch':
    case 'null_reference':
      return 'High - These errors can lead to runtime exceptions and should be fixed promptly.';
    case 'interface_mismatch':
      return 'Medium - These errors may cause behavioral issues or limit code flexibility.';
    case 'missing_type':
      return 'Medium - These errors can lead to type safety issues and hidden bugs.';
    case 'undefined_variable':
      return 'High - These errors will cause runtime exceptions if not fixed.';
    default:
      return 'Medium - The impact of this error depends on its specific context.';
  }
}

/**
 * Generate Markdown documentation for error patterns
 */
async function generateMarkdownDocumentation(patterns: ErrorPattern[], options: DocumentOptions) {
  // Create index file
  let indexContent = '# TypeScript Error Patterns\n\n';
  indexContent += 'This documentation covers common TypeScript error patterns found in the codebase.\n\n';
  indexContent += '## Error Patterns by Category\n\n';
  
  // Group patterns by category
  const patternsByCategory: Record<string, ErrorPattern[]> = {};
  for (const pattern of patterns) {
    if (!patternsByCategory[pattern.category]) {
      patternsByCategory[pattern.category] = [];
    }
    patternsByCategory[pattern.category].push(pattern);
  }
  
  // Add categories to index
  for (const [category, categoryPatterns] of Object.entries(patternsByCategory)) {
    indexContent += `### ${formatCategory(category)}\n\n`;
    
    for (const pattern of categoryPatterns) {
      indexContent += `- [${pattern.name}](./patterns/${pattern.id}.md) - ${pattern.errorCodes.join(', ')}\n`;
    }
    
    indexContent += '\n';
  }
  
  // Add impact assessment section
  indexContent += '## Error Impact Assessment\n\n';
  indexContent += '| Category | Impact | Priority |\n';
  indexContent += '|----------|--------|----------|\n';
  
  const categories = Object.keys(patternsByCategory);
  for (const category of categories) {
    const impact = getImpactLevel(category);
    const priority = impact.startsWith('High') ? 'P0' : impact.startsWith('Medium') ? 'P1' : 'P2';
    indexContent += `| ${formatCategory(category)} | ${impact} | ${priority} |\n`;
  }
  
  // Write index file
  await fs.promises.writeFile(
    path.join(options.outputDir, 'index.md'),
    indexContent
  );
  
  // Create patterns directory
  const patternsDir = path.join(options.outputDir, 'patterns');
  if (!fs.existsSync(patternsDir)) {
    fs.mkdirSync(patternsDir, { recursive: true });
  }
  
  // Create individual pattern files
  for (const pattern of patterns) {
    let patternContent = `# ${pattern.name}\n\n`;
    
    patternContent += `**Category:** ${formatCategory(pattern.category)}\n`;
    patternContent += `**Error Codes:** ${pattern.errorCodes.join(', ')}\n`;
    patternContent += `**Impact Level:** ${pattern.impactLevel}\n\n`;
    
    patternContent += `## Description\n\n${pattern.description}\n\n`;
    
    patternContent += `## Root Cause\n\n${pattern.rootCause}\n\n`;
    
    patternContent += `## Fix Strategy\n\n${pattern.fixStrategy}\n\n`;
    
    if (options.includeExamples && pattern.examples.length > 0) {
      patternContent += `## Examples\n\n`;
      
      for (let i = 0; i < Math.min(options.maxExamples, pattern.examples.length); i++) {
        const example = pattern.examples[i];
        patternContent += `### Example ${i + 1}\n\n`;
        patternContent += `**File:** ${example.file}:${example.line}\n`;
        patternContent += `**Error:** ${example.message}\n\n`;
        
        if (example.context) {
          patternContent += "```typescript\n";
          patternContent += example.context;
          patternContent += "\n```\n\n";
        }
      }
    }
    
    if (pattern.relatedPatterns.length > 0) {
      patternContent += `## Related Patterns\n\n`;
      for (const relatedId of pattern.relatedPatterns) {
        const related = patterns.find(p => p.id === relatedId);
        if (related) {
          patternContent += `- [${related.name}](${relatedId}.md)\n`;
        }
      }
      patternContent += '\n';
    }
    
    // Write pattern file
    await fs.promises.writeFile(
      path.join(patternsDir, `${pattern.id}.md`),
      patternContent
    );
  }
}

/**
 * Generate HTML documentation for error patterns
 */
async function generateHtmlDocumentation(patterns: ErrorPattern[], options: DocumentOptions) {
  // Create a simple HTML documentation
  let indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript Error Patterns</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    h3 { color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: Consolas, Monaco, 'Andale Mono', monospace; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .pattern-list { list-style-type: none; padding: 0; }
    .pattern-list li { margin-bottom: 10px; padding: 10px; border-left: 3px solid #007acc; background-color: #f8f8f8; }
    .pattern-link { color: #007acc; text-decoration: none; font-weight: bold; }
    .pattern-link:hover { text-decoration: underline; }
    .error-code { font-family: monospace; color: #d14; }
    .impact-high { color: #d9534f; }
    .impact-medium { color: #f0ad4e; }
    .impact-low { color: #5cb85c; }
  </style>
</head>
<body>
  <h1>TypeScript Error Patterns</h1>
  <p>This documentation covers common TypeScript error patterns found in the codebase.</p>
  
  <h2>Error Patterns by Category</h2>
`;

  // Group patterns by category
  const patternsByCategory: Record<string, ErrorPattern[]> = {};
  for (const pattern of patterns) {
    if (!patternsByCategory[pattern.category]) {
      patternsByCategory[pattern.category] = [];
    }
    patternsByCategory[pattern.category].push(pattern);
  }
  
  // Add categories to index
  for (const [category, categoryPatterns] of Object.entries(patternsByCategory)) {
    indexContent += `  <h3>${formatCategory(category)}</h3>\n`;
    indexContent += `  <ul class="pattern-list">\n`;
    
    for (const pattern of categoryPatterns) {
      indexContent += `    <li><a href="./patterns/${pattern.id}.html" class="pattern-link">${pattern.name}</a> - <span class="error-code">${pattern.errorCodes.join(', ')}</span></li>\n`;
    }
    
    indexContent += `  </ul>\n\n`;
  }
  
  // Add impact assessment table
  indexContent += `  <h2>Error Impact Assessment</h2>\n`;
  indexContent += `  <table>\n`;
  indexContent += `    <tr>\n`;
  indexContent += `      <th>Category</th>\n`;
  indexContent += `      <th>Impact</th>\n`;
  indexContent += `      <th>Priority</th>\n`;
  indexContent += `    </tr>\n`;
  
  const categories = Object.keys(patternsByCategory);
  for (const category of categories) {
    const impact = getImpactLevel(category);
    const priority = impact.startsWith('High') ? 'P0' : impact.startsWith('Medium') ? 'P1' : 'P2';
    const impactClass = impact.startsWith('High') ? 'impact-high' : impact.startsWith('Medium') ? 'impact-medium' : 'impact-low';
    
    indexContent += `    <tr>\n`;
    indexContent += `      <td>${formatCategory(category)}</td>\n`;
    indexContent += `      <td class="${impactClass}">${impact}</td>\n`;
    indexContent += `      <td>${priority}</td>\n`;
    indexContent += `    </tr>\n`;
  }
  
  indexContent += `  </table>\n`;
  indexContent += `</body>\n</html>`;
  
  // Write index file
  await fs.promises.writeFile(
    path.join(options.outputDir, 'index.html'),
    indexContent
  );
  
  // Create patterns directory
  const patternsDir = path.join(options.outputDir, 'patterns');
  if (!fs.existsSync(patternsDir)) {
    fs.mkdirSync(patternsDir, { recursive: true });
  }
  
  // Create individual pattern files
  for (const pattern of patterns) {
    let patternContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pattern.name} - TypeScript Error Pattern</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    h3 { color: #555; }
    code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: Consolas, Monaco, 'Andale Mono', monospace; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .metadata { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .metadata p { margin: 5px 0; }
    .example { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 3px solid #007acc; }
    .back-link { display: inline-block; margin-top: 30px; color: #007acc; text-decoration: none; }
    .back-link:hover { text-decoration: underline; }
    .error-code { font-family: monospace; color: #d14; }
  </style>
</head>
<body>
  <h1>${pattern.name}</h1>
  
  <div class="metadata">
    <p><strong>Category:</strong> ${formatCategory(pattern.category)}</p>
    <p><strong>Error Codes:</strong> <span class="error-code">${pattern.errorCodes.join(', ')}</span></p>
    <p><strong>Impact Level:</strong> ${pattern.impactLevel}</p>
  </div>
  
  <h2>Description</h2>
  <p>${pattern.description}</p>
  
  <h2>Root Cause</h2>
  <p>${pattern.rootCause}</p>
  
  <h2>Fix Strategy</h2>
  <p>${pattern.fixStrategy.replace(/\n/g, '<br>')}</p>
`;

    if (options.includeExamples && pattern.examples.length > 0) {
      patternContent += `  <h2>Examples</h2>\n`;
      
      for (let i = 0; i < Math.min(options.maxExamples, pattern.examples.length); i++) {
        const example = pattern.examples[i];
        patternContent += `  <div class="example">\n`;
        patternContent += `    <h3>Example ${i + 1}</h3>\n`;
        patternContent += `    <p><strong>File:</strong> ${example.file}:${example.line}</p>\n`;
        patternContent += `    <p><strong>Error:</strong> ${example.message}</p>\n`;
        
        if (example.context) {
          patternContent += `    <pre><code>${example.context.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`;
        }
        
        patternContent += `  </div>\n`;
      }
    }
    
    if (pattern.relatedPatterns.length > 0) {
      patternContent += `  <h2>Related Patterns</h2>\n`;
      patternContent += `  <ul>\n`;
      
      for (const relatedId of pattern.relatedPatterns) {
        const related = patterns.find(p => p.id === relatedId);
        if (related) {
          patternContent += `    <li><a href="${relatedId}.html">${related.name}</a></li>\n`;
        }
      }
      
      patternContent += `  </ul>\n`;
    }
    
    patternContent += `  <a href="../index.html" class="back-link">&larr; Back to Error Pattern Index</a>\n`;
    patternContent += `</body>\n</html>`;
    
    // Write pattern file
    await fs.promises.writeFile(
      path.join(patternsDir, `${pattern.id}.html`),
      patternContent
    );
  }
}

/**
 * Generate JSON documentation for error patterns
 */
async function generateJsonDocumentation(patterns: ErrorPattern[], options: DocumentOptions) {
  // Create a JSON representation of the patterns
  const jsonContent = {
    generated: new Date().toISOString(),
    patterns: patterns,
    stats: {
      totalPatterns: patterns.length,
      patternsByCategory: patterns.reduce((acc, pattern) => {
        acc[pattern.category] = (acc[pattern.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  };
  
  // Write JSON file
  await fs.promises.writeFile(
    path.join(options.outputDir, 'patterns.json'),
    JSON.stringify(jsonContent, null, 2)
  );
}

/**
 * Format a category for display
 */
function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Execute if run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: Partial<DocumentOptions> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--output' && i + 1 < args.length) {
      options.outputDir = args[++i];
    } else if (arg === '--format' && i + 1 < args.length) {
      options.format = args[++i] as unknown;
    } else if (arg === '--no-examples') {
      options.includeExamples = false;
    } else if (arg === '--max-examples' && i + 1 < args.length) {
      options.maxExamples = parseInt(args[++i], 10);
    } else if (arg === '--group-by' && i + 1 < args.length) {
      options.groupBy = args[++i] as unknown;
    }
  }
  
  generateErrorDocumentation(options)
    .then(() => {
      console.log('Documentation generation complete.');
    })
    .catch(error => {
      console.error('Error generating documentation:', error);
      process.exit(1);
    });
}

export default generateErrorDocumentation;