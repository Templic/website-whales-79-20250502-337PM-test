# TypeScript Error Management System: Implementation Guide

This guide is intended for developers who want to extend or customize the TypeScript Error Management System.

## System Architecture

The TypeScript Error Management System follows a layered approach:

```
┌───────────────────────────────────────┐
│              API Layer                │
│  (Express Routes, Request Handling)   │
└─────────────────┬─────────────────────┘
                  │
┌─────────────────▼─────────────────────┐
│           Detection Layer             │
│   (Pattern Matching, TS Compiler)     │
└─────────────────┬─────────────────────┘
                  │
┌─────────────────▼─────────────────────┐
│          Analysis Layer               │
│  (Error Categorization, Prioritization)│
└─────────────────┬─────────────────────┘
                  │
┌─────────────────▼─────────────────────┐
│          Resolution Layer             │
│     (Fix Suggestions, Examples)       │
└─────────────────┬─────────────────────┘
                  │
┌─────────────────▼─────────────────────┐
│          Reporting Layer              │
│   (JSON Responses, Aggregations)      │
└───────────────────────────────────────┘
```

## Core Files

- `server/routes/typescript-error-simple-routes.ts` - Main API endpoints for TypeScript error analysis
- `server/routes/typescript-error-routes.ts` - Admin-protected routes for more powerful operations
- `server/routes.ts` - Integration with main application routes

## Adding New Error Patterns

To add a new error pattern:

1. Open `server/routes/typescript-error-simple-routes.ts`
2. Locate the `localErrorPatterns` array in the `batch-analyze` endpoint
3. Add a new pattern following this template:

```typescript
{
  pattern: /your-regex-pattern/g, 
  code: 9xxx,  // Use appropriate code range
  category: 'error', // Or 'warning' or 'info'
  message: 'Human-readable error message',
  fixSuggestion: 'Suggestion on how to fix',
  priority: 'high', // Or 'medium' or 'low'
  appSpecific: true // Set to true for domain-specific patterns
}
```

4. Add a corresponding fix example in the `getFixExample` function:

```typescript
case 9xxx: // Your error code
  return 'Example code showing the fix';
```

## Adding New API Endpoints

To add a new API endpoint:

1. Open `server/routes/typescript-error-simple-routes.ts`
2. Add your new endpoint using this template:

```typescript
/**
 * Your endpoint description
 * 
 * @route POST /api/typescript-simple/your-endpoint
 */
router.post('/your-endpoint', async (req, res) => {
  try {
    const { param1, param2 } = req.body;
    
    // Validate required parameters
    if (!param1) {
      return res.status(400).json({
        success: false,
        message: 'Parameter1 is required'
      });
    }
    
    // Your implementation logic here
    
    return res.json({
      success: true,
      // Your response data
    });
  } catch (error) {
    console.error('Error in your endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
```

## Customizing Type Foundation Analysis

To extend the type foundation analysis:

1. Open `server/routes/typescript-error-simple-routes.ts`
2. Locate the `type-foundation` endpoint
3. Modify the `analysis` structure to include new metrics
4. Update the `analyzeFile` function to collect your new metrics
5. Add your metrics to the `calculateTypeHealthScore` function
6. Add related recommendations to the `generateTypeRecommendations` function

## Adding AI-Powered Error Fixing

To implement AI-powered error fixing using OpenAI:

1. Create a new file `server/utils/openai-error-fix.ts`:

```typescript
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate AI-powered fix suggestions for TypeScript errors
 */
export async function generateAIFixSuggestion(
  code: string,
  error: {
    code: number,
    message: string,
    line: number,
    character: number,
    lineText: string
  }
): Promise<string> {
  try {
    // Extract the relevant code context (few lines before and after)
    const lines = code.split('\n');
    const startLine = Math.max(0, error.line - 5);
    const endLine = Math.min(lines.length, error.line + 5);
    const codeContext = lines.slice(startLine, endLine).join('\n');
    
    // Create a prompt for the AI
    const prompt = `
You are an expert TypeScript developer helping fix a TypeScript error.

Error Code: ${error.code}
Error Message: ${error.message}
Line: ${error.line}
Character: ${error.character}
Line Text: ${error.lineText}

Code Context:
\`\`\`typescript
${codeContext}
\`\`\`

Please provide a fix for this TypeScript error. Only show the fixed code, no explanations.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2, // Lower temperature for more precise code
    });

    return response.choices[0].message.content || "No suggestion available";
  } catch (error) {
    console.error('Error generating AI fix suggestion:', error);
    return "Failed to generate AI suggestion";
  }
}
```

2. Create a new API endpoint in `server/routes/typescript-error-simple-routes.ts`:

```typescript
/**
 * Get AI-powered fix suggestions for a specific error
 * 
 * @route POST /api/typescript-simple/ai-fix
 */
router.post('/ai-fix', async (req, res) => {
  try {
    const { filePath, line, character } = req.body;
    
    // Validate required parameters
    if (!filePath || !line || !character) {
      return res.status(400).json({
        success: false,
        message: 'File path, line, and character position are required'
      });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Analyze the file to find the error
    const diagnostics = []; // Your error detection logic here
    
    // Find the specific error at the given position
    const error = diagnostics.find(d => d.line === line && d.character === character);
    
    if (!error) {
      return res.status(404).json({
        success: false,
        message: 'No error found at the specified position'
      });
    }
    
    // Generate AI fix suggestion
    const aiSuggestion = await generateAIFixSuggestion(fileContent, error);
    
    return res.json({
      success: true,
      error,
      aiSuggestion
    });
  } catch (error) {
    console.error('Error generating AI fix:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
```

## Implementing Git Workflow Integration

To implement Git pre-commit hook integration:

1. Create a shell script `scripts/pre-commit.sh`:

```bash
#!/bin/bash

# Get all staged TypeScript files
files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.tsx?$')

if [ -z "$files" ]; then
    # No TypeScript files to check
    exit 0
fi

# Create a JSON array of files
json_files="[]"
for file in $files; do
    json_files=$(echo $json_files | jq --arg f "$file" '. += [$f]')
done

# Call the TypeScript error analysis API
results=$(curl -s -X POST http://localhost:5000/api/typescript-simple/batch-analyze \
  -H "Content-Type: application/json" \
  -d "{\"includePatterns\": $json_files, \"maxFiles\": 100}")

# Check if there are any errors
error_count=$(echo $results | jq '.stats.byCategory.error')

if [ "$error_count" -gt 0 ]; then
    echo "❌ TypeScript errors found in staged files:"
    echo $results | jq -r '.detailedErrors | to_entries[] | .key as $file | .value[] | select(.category == "error") | "\($file):\(.line):\(.character) - \(.message)"'
    echo "Please fix these errors before committing."
    exit 1
fi

# All good
echo "✅ No TypeScript errors found in staged files."
exit 0
```

2. Add a script to install the pre-commit hook in `package.json`:

```json
{
  "scripts": {
    "install-hooks": "cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit"
  }
}
```

## Performance Considerations

The TypeScript Error Management System can be resource-intensive when analyzing large codebases. Here are some recommendations:

1. **Limit File Analysis** - Use the `maxFiles` parameter to limit the number of files analyzed.
2. **Use Exclude Patterns** - Always exclude `node_modules`, `dist`, and other generated directories.
3. **Batch Processing** - For large operations, consider implementing a job queue system.
4. **Caching Results** - Implement a caching mechanism to avoid re-analyzing unchanged files.
5. **Incremental Analysis** - Only analyze files that have changed since the last analysis.

## Security Considerations

1. **Authentication** - Always protect administrative endpoints with authentication.
2. **Input Validation** - Validate all input parameters to prevent directory traversal and other attacks.
3. **Rate Limiting** - Implement rate limiting to prevent abuse of the API.
4. **Code Execution** - Be careful not to execute user-provided code or commands.
5. **Sensitive Information** - Avoid exposing sensitive information in error messages or logs.