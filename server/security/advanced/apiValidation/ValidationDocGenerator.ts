/**
 * Validation Documentation Generator
 * 
 * Automatically generates documentation for all validation rules and endpoints,
 * making it easier for developers to understand and use the validation system.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ValidationEngine } from './ValidationEngine';

interface ValidationDocOptions {
  outputDir: string;
  format: 'markdown' | 'json' | 'html';
  includeExamples?: boolean;
  includePatterns?: boolean;
  includeSchema?: boolean;
  title?: string;
}

export class ValidationDocGenerator {
  /**
   * Generate documentation for all registered validation rules
   */
  static async generateDocs(options: ValidationDocOptions): Promise<string> {
    // Get all validation rules and endpoints
    const rules = ValidationEngine['rules']; // Access private field
    const endpoints = ValidationEngine['endpoints']; // Access private field
    
    let content = '';
    
    switch (options.format) {
      case 'markdown':
        content = this.generateMarkdown(rules, endpoints, options);
        break;
      case 'json':
        content = this.generateJson(rules, endpoints, options);
        break;
      case 'html':
        content = this.generateHtml(rules, endpoints, options);
        break;
    }
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }
    
    // Write the documentation to a file
    const filename = `validation-docs.${options.format === 'json' ? 'json' : 
                      options.format === 'html' ? 'html' : 'md'}`;
    const outputPath = path.join(options.outputDir, filename);
    
    fs.writeFileSync(outputPath, content);
    
    return outputPath;
  }
  
  /**
   * Generate markdown documentation
   */
  private static generateMarkdown(
    rules: Map<string, any>,
    endpoints: Map<string, string[]>,
    options: ValidationDocOptions
  ): string {
    const title = options.title || 'API Validation Documentation';
    let content = `# ${title}\n\n`;
    
    // Add introduction
    content += `## Introduction\n\n`;
    content += `This document provides details about the validation rules applied to API endpoints in this application. `;
    content += `It serves as a reference for developers working with the API.\n\n`;
    
    // Add validation rules section
    content += `## Validation Rules\n\n`;
    
    rules.forEach((rule, id) => {
      content += `### ${rule.name} (ID: \`${id}\`)\n\n`;
      
      if (rule.description) {
        content += `${rule.description}\n\n`;
      }
      
      content += `**Targets:** ${rule.targets.join(', ')}\n\n`;
      
      if (options.includeSchema && rule.schema) {
        content += `**Schema:**\n\`\`\`typescript\n${this.zodSchemaToString(rule.schema)}\n\`\`\`\n\n`;
      }
      
      // Find endpoints using this rule
      const usingEndpoints = Array.from(endpoints.entries())
        .filter(([, ruleIds]) => ruleIds.includes(id))
        .map(([endpoint]) => endpoint);
      
      if (usingEndpoints.length > 0) {
        content += `**Used by endpoints:**\n`;
        usingEndpoints.forEach(endpoint => {
          content += `- \`${endpoint}\`\n`;
        });
        content += `\n`;
      }
      
      if (options.includeExamples) {
        content += `**Example:**\n\`\`\`json\n${this.generateExampleForRule(rule)}\n\`\`\`\n\n`;
      }
    });
    
    // Add endpoints section
    content += `## API Endpoints\n\n`;
    
    endpoints.forEach((ruleIds, endpoint) => {
      content += `### ${endpoint}\n\n`;
      
      content += `**Validation Rules Applied:**\n`;
      ruleIds.forEach(id => {
        const rule = rules.get(id);
        if (rule) {
          content += `- ${rule.name} (ID: \`${id}\`)\n`;
        }
      });
      content += `\n`;
    });
    
    // Add usage guide
    content += `## Usage Guide\n\n`;
    content += `To work with these validation rules, ensure your API requests meet the validation criteria specified above. `;
    content += `If validation fails, the API will return a 400 Bad Request response with details about the validation errors.\n\n`;
    
    content += `### Example Error Response\n\n`;
    content += `\`\`\`json
{
  "error": "Validation Error",
  "message": "The request data failed validation",
  "timestamp": 1625097600000,
  "details": [
    {
      "path": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ]
}
\`\`\`\n\n`;
    
    return content;
  }
  
  /**
   * Generate JSON documentation
   */
  private static generateJson(
    rules: Map<string, any>,
    endpoints: Map<string, string[]>,
    options: ValidationDocOptions
  ): string {
    const doc = {
      title: options.title || 'API Validation Documentation',
      generated: new Date().toISOString(),
      rules: Array.from(rules.entries()).map(([id, rule]) => {
        const ruleDoc: any = {
          id,
          name: rule.name,
          description: rule.description,
          targets: rule.targets
        };
        
        if (options.includeSchema && rule.schema) {
          ruleDoc.schema = this.zodSchemaToObject(rule.schema);
        }
        
        if (options.includeExamples) {
          ruleDoc.example = JSON.parse(this.generateExampleForRule(rule));
        }
        
        return ruleDoc;
      }),
      endpoints: Array.from(endpoints.entries()).map(([endpoint, ruleIds]) => ({
        endpoint,
        rules: ruleIds.map(id => {
          const rule = rules.get(id);
          return rule ? { id, name: rule.name } : { id };
        })
      }))
    };
    
    return JSON.stringify(doc, null, 2);
  }
  
  /**
   * Generate HTML documentation
   */
  private static generateHtml(
    rules: Map<string, any>,
    endpoints: Map<string, string[]>,
    options: ValidationDocOptions
  ): string {
    const title = options.title || 'API Validation Documentation';
    
    let content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      border-bottom: 2px solid #eaecef;
      padding-bottom: 10px;
    }
    h2 {
      margin-top: 30px;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 5px;
    }
    h3 {
      margin-top: 25px;
    }
    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 16px;
      overflow: auto;
    }
    code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      padding: 0.2em 0.4em;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    .rule-card {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 20px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .endpoint-card {
      background-color: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin-bottom: 15px;
      padding: 15px;
    }
    .tag {
      display: inline-block;
      background-color: #e1e1e1;
      border-radius: 3px;
      padding: 2px 8px;
      margin-right: 5px;
      font-size: 12px;
    }
    .nav {
      background-color: #f3f3f3;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .nav a {
      margin-right: 15px;
      color: #0366d6;
      text-decoration: none;
    }
    .nav a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  
  <div class="nav">
    <a href="#introduction">Introduction</a>
    <a href="#rules">Validation Rules</a>
    <a href="#endpoints">API Endpoints</a>
    <a href="#guide">Usage Guide</a>
  </div>
  
  <h2 id="introduction">Introduction</h2>
  <p>
    This document provides details about the validation rules applied to API endpoints in this application.
    It serves as a reference for developers working with the API.
  </p>
  
  <h2 id="rules">Validation Rules</h2>
`;
    
    // Add validation rules
    rules.forEach((rule, id) => {
      content += `
  <div class="rule-card">
    <h3>${rule.name} <code>${id}</code></h3>
`;
      
      if (rule.description) {
        content += `    <p>${rule.description}</p>\n`;
      }
      
      content += `    <p><strong>Targets:</strong> `;
      rule.targets.forEach((target: string) => {
        content += `<span class="tag">${target}</span>`;
      });
      content += `</p>\n`;
      
      if (options.includeSchema && rule.schema) {
        content += `
    <details>
      <summary>Schema</summary>
      <pre><code>${this.escapeHtml(this.zodSchemaToString(rule.schema))}</code></pre>
    </details>
`;
      }
      
      // Find endpoints using this rule
      const usingEndpoints = Array.from(endpoints.entries())
        .filter(([, ruleIds]) => ruleIds.includes(id))
        .map(([endpoint]) => endpoint);
      
      if (usingEndpoints.length > 0) {
        content += `
    <details>
      <summary>Used by ${usingEndpoints.length} endpoints</summary>
      <ul>
`;
        usingEndpoints.forEach(endpoint => {
          content += `        <li><code>${endpoint}</code></li>\n`;
        });
        content += `      </ul>
    </details>
`;
      }
      
      if (options.includeExamples) {
        content += `
    <details>
      <summary>Example</summary>
      <pre><code>${this.escapeHtml(this.generateExampleForRule(rule))}</code></pre>
    </details>
`;
      }
      
      content += `  </div>\n`;
    });
    
    // Add endpoints section
    content += `
  <h2 id="endpoints">API Endpoints</h2>
`;
    
    endpoints.forEach((ruleIds, endpoint) => {
      content += `
  <div class="endpoint-card">
    <h3>${endpoint}</h3>
    <p><strong>Validation Rules Applied:</strong></p>
    <ul>
`;
      
      ruleIds.forEach(id => {
        const rule = rules.get(id);
        if (rule) {
          content += `      <li>${rule.name} <code>${id}</code></li>\n`;
        }
      });
      
      content += `    </ul>
  </div>
`;
    });
    
    // Add usage guide
    content += `
  <h2 id="guide">Usage Guide</h2>
  <p>
    To work with these validation rules, ensure your API requests meet the validation criteria specified above.
    If validation fails, the API will return a 400 Bad Request response with details about the validation errors.
  </p>
  
  <h3>Example Error Response</h3>
  <pre><code>{
  "error": "Validation Error",
  "message": "The request data failed validation",
  "timestamp": 1625097600000,
  "details": [
    {
      "path": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ]
}</code></pre>

  <footer>
    <p>Documentation generated on ${new Date().toLocaleString()}</p>
  </footer>
</body>
</html>
`;
    
    return content;
  }
  
  /**
   * Convert a Zod schema to a string representation
   */
  private static zodSchemaToString(schema: any): string {
    try {
      // This is a simplified representation
      return JSON.stringify(this.zodSchemaToObject(schema), null, 2);
    } catch (error) {
      return 'Schema could not be stringified';
    }
  }
  
  /**
   * Convert a Zod schema to an object representation
   */
  private static zodSchemaToObject(schema: any): any {
    // This is a very simplified representation
    // In a real implementation, you would need to analyze the Zod schema structure
    
    try {
      // Try to extract the type description from the schema
      if (schema._def) {
        // Handle different schema types
        if (schema._def.typeName === 'ZodObject') {
          const shape = {};
          
          for (const [key, value] of Object.entries(schema._def.shape())) {
            (shape as any)[key] = this.zodSchemaToObject(value);
          }
          
          return { type: 'object', shape };
        }
        else if (schema._def.typeName === 'ZodString') {
          let result: any = { type: 'string' };
          
          // Add constraints if available
          if (schema._def.checks) {
            schema._def.checks.forEach((check: any) => {
              if (check.kind === 'min') {
                result.min = check.value;
              } else if (check.kind === 'max') {
                result.max = check.value;
              } else if (check.kind === 'email') {
                result.format = 'email';
              } else if (check.kind === 'url') {
                result.format = 'url';
              } else if (check.kind === 'uuid') {
                result.format = 'uuid';
              } else if (check.kind === 'regex') {
                result.pattern = check.regex.toString();
              }
            });
          }
          
          return result;
        }
        else if (schema._def.typeName === 'ZodNumber') {
          let result: any = { type: 'number' };
          
          // Add constraints if available
          if (schema._def.checks) {
            schema._def.checks.forEach((check: any) => {
              if (check.kind === 'min') {
                result.min = check.value;
              } else if (check.kind === 'max') {
                result.max = check.value;
              } else if (check.kind === 'int') {
                result.integer = true;
              } else if (check.kind === 'positive') {
                result.exclusiveMinimum = 0;
              } else if (check.kind === 'nonnegative') {
                result.minimum = 0;
              }
            });
          }
          
          return result;
        }
        else if (schema._def.typeName === 'ZodBoolean') {
          return { type: 'boolean' };
        }
        else if (schema._def.typeName === 'ZodArray') {
          return {
            type: 'array',
            items: this.zodSchemaToObject(schema._def.type)
          };
        }
        else if (schema._def.typeName === 'ZodEnum') {
          return {
            type: 'enum',
            values: schema._def.values
          };
        }
        else {
          return { type: schema._def.typeName };
        }
      }
      
      // Fallback to simple type name if known structure not found
      return { type: typeof schema };
      
    } catch (error) {
      return { type: 'unknown' };
    }
  }
  
  /**
   * Generate a JSON example for a validation rule
   */
  private static generateExampleForRule(rule: any): string {
    try {
      if (!rule.schema) {
        return '{}';
      }
      
      // Generate an example based on the schema
      const example = this.createExampleFromSchema(rule.schema);
      return JSON.stringify(example, null, 2);
    } catch (error) {
      return '{}';
    }
  }
  
  /**
   * Create an example object from a Zod schema
   */
  private static createExampleFromSchema(schema: any): any {
    try {
      // Handle different schema types
      if (schema._def) {
        if (schema._def.typeName === 'ZodObject') {
          const example = {};
          
          for (const [key, value] of Object.entries(schema._def.shape())) {
            (example as any)[key] = this.createExampleFromSchema(value);
          }
          
          return example;
        }
        else if (schema._def.typeName === 'ZodString') {
          // Check for special string formats
          if (schema._def.checks) {
            for (const check of schema._def.checks) {
              if (check.kind === 'email') {
                return 'user@example.com';
              } else if (check.kind === 'url') {
                return 'https://example.com';
              } else if (check.kind === 'uuid') {
                return '123e4567-e89b-12d3-a456-426614174000';
              } else if (check.kind === 'regex') {
                // Return a simple example for regex patterns
                return 'example-value';
              }
            }
          }
          
          return 'string-value';
        }
        else if (schema._def.typeName === 'ZodNumber') {
          let value = 42;
          
          // Check for constraints
          if (schema._def.checks) {
            for (const check of schema._def.checks) {
              if (check.kind === 'int') {
                value = Math.floor(value);
              } else if (check.kind === 'positive') {
                value = Math.max(1, value);
              } else if (check.kind === 'nonnegative') {
                value = Math.max(0, value);
              } else if (check.kind === 'min') {
                value = Math.max(check.value, value);
              } else if (check.kind === 'max') {
                value = Math.min(check.value, value);
              }
            }
          }
          
          return value;
        }
        else if (schema._def.typeName === 'ZodBoolean') {
          return true;
        }
        else if (schema._def.typeName === 'ZodArray') {
          return [this.createExampleFromSchema(schema._def.type)];
        }
        else if (schema._def.typeName === 'ZodEnum') {
          return schema._def.values[0];
        }
        else if (schema._def.typeName === 'ZodDate') {
          return new Date().toISOString();
        }
        else if (schema._def.typeName === 'ZodOptional' || schema._def.typeName === 'ZodNullable') {
          return this.createExampleFromSchema(schema._def.innerType);
        }
        else {
          return null;
        }
      }
      
      // Default fallback
      return null;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Escape HTML special characters for safe HTML output
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Generate documentation for a specific rule
   */
  static generateRuleDoc(ruleId: string, options: ValidationDocOptions): string {
    const rule = ValidationEngine['rules'].get(ruleId);
    
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    // Format based on options
    switch (options.format) {
      case 'markdown':
        return `# ${rule.name} (${ruleId})\n\n${rule.description || ''}\n\n**Targets:** ${rule.targets.join(', ')}\n`;
      case 'json':
        return JSON.stringify({
          id: ruleId,
          name: rule.name,
          description: rule.description,
          targets: rule.targets
        }, null, 2);
      case 'html':
        return `<h1>${rule.name} (${ruleId})</h1><p>${rule.description || ''}</p><p><strong>Targets:</strong> ${rule.targets.join(', ')}</p>`;
      default:
        return '';
    }
  }
}