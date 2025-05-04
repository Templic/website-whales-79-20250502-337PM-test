/**
 * Validation Documentation Generator
 * 
 * Automatically generates documentation for all validation rules and endpoints,
 * making it easier for developers to understand and use the validation system.
 */

import { ValidationRule } from './ValidationEngine';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

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
    try {
      // Dynamically import ValidationEngine to avoid circular dependencies
      const { ValidationEngine } = require('./ValidationEngine');
      
      // Get all rules and endpoints
      const rules = ValidationEngine.getAllRules();
      const endpoints = ValidationEngine.getAllEndpoints();
      
      let docs: string;
      
      // Generate docs in the requested format
      switch (options.format) {
        case 'markdown':
          docs = this.generateMarkdown(rules, endpoints, options);
          break;
        case 'json':
          docs = this.generateJson(rules, endpoints, options);
          break;
        case 'html':
          docs = this.generateHtml(rules, endpoints, options);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
      
      // Ensure output directory exists
      if (!fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
      }
      
      // Write the documentation to a file
      const filename = `api-validation.${options.format === 'html' ? 'html' : options.format === 'json' ? 'json' : 'md'}`;
      const outputPath = path.join(options.outputDir, filename);
      
      fs.writeFileSync(outputPath, docs);
      
      return docs;
    } catch (error) {
      throw new Error(`Error generating validation documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate markdown documentation
   */
  private static generateMarkdown(
    rules: ValidationRule[],
    endpoints: { endpoint: string; ruleIds: string[] }[],
    options: ValidationDocOptions
  ): string {
    const title = options.title || 'API Validation Documentation';
    
    let markdown = `# ${title}\n\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;
    
    // Table of contents
    markdown += `## Table of Contents\n\n`;
    markdown += `- [Overview](#overview)\n`;
    markdown += `- [Endpoints](#endpoints)\n`;
    markdown += `- [Validation Rules](#validation-rules)\n`;
    
    if (options.includePatterns) {
      markdown += `- [Validation Patterns](#validation-patterns)\n`;
    }
    
    // Overview
    markdown += `\n## Overview\n\n`;
    markdown += `This document provides detailed information about the API validation rules used in the system. `;
    markdown += `The validation system ensures that all API requests are properly validated for data integrity and security.\n\n`;
    markdown += `Total Rules: ${rules.length}\n`;
    markdown += `Total Endpoints: ${endpoints.length}\n\n`;
    
    // Endpoints
    markdown += `\n## Endpoints\n\n`;
    
    if (endpoints.length === 0) {
      markdown += `No endpoints with validation rules defined.\n\n`;
    } else {
      markdown += `| Endpoint | Validation Rules |\n`;
      markdown += `|---------|------------------|\n`;
      
      endpoints.forEach(endpoint => {
        const ruleNames = endpoint.ruleIds
          .map(id => {
            const rule = rules.find(r => r.id === id);
            return rule ? rule.name : id;
          })
          .join(', ');
        
        markdown += `| \`${endpoint.endpoint}\` | ${ruleNames} |\n`;
      });
    }
    
    // Validation Rules
    markdown += `\n## Validation Rules\n\n`;
    
    rules.forEach(rule => {
      markdown += `### ${rule.name}\n\n`;
      
      if (rule.description) {
        markdown += `${rule.description}\n\n`;
      }
      
      markdown += `- **ID**: \`${rule.id}\`\n`;
      markdown += `- **Target**: ${rule.target || 'all'}\n`;
      markdown += `- **Active**: ${rule.isActive ? 'Yes' : 'No'}\n`;
      
      if (rule.priority !== undefined) {
        markdown += `- **Priority**: ${rule.priority}\n`;
      }
      
      if (rule.tags && rule.tags.length > 0) {
        markdown += `- **Tags**: ${rule.tags.join(', ')}\n`;
      }
      
      // Include schema details if requested
      if (options.includeSchema && rule.schema) {
        markdown += `\n#### Schema\n\n`;
        markdown += `\`\`\`typescript\n${this.zodSchemaToString(rule.schema)}\n\`\`\`\n\n`;
      }
      
      // Include examples if requested
      if (options.includeExamples) {
        markdown += `\n#### Example\n\n`;
        markdown += `\`\`\`json\n${this.generateExampleForRule(rule)}\n\`\`\`\n\n`;
      }
      
      markdown += `\n`;
    });
    
    return markdown;
  }
  
  /**
   * Generate JSON documentation
   */
  private static generateJson(
    rules: ValidationRule[],
    endpoints: { endpoint: string; ruleIds: string[] }[],
    options: ValidationDocOptions
  ): string {
    const doc = {
      title: options.title || 'API Validation Documentation',
      generatedAt: new Date().toISOString(),
      summary: {
        totalRules: rules.length,
        totalEndpoints: endpoints.length
      },
      endpoints: endpoints.map(endpoint => ({
        path: endpoint.endpoint,
        ruleIds: endpoint.ruleIds,
        rules: endpoint.ruleIds.map(id => {
          const rule = rules.find(r => r.id === id);
          return rule ? {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            target: rule.target || 'all',
            isActive: rule.isActive
          } : { id };
        })
      })),
      rules: rules.map(rule => {
        const result: any = {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          target: rule.target || 'all',
          isActive: rule.isActive
        };
        
        if (rule.priority !== undefined) {
          result.priority = rule.priority;
        }
        
        if (rule.tags && rule.tags.length > 0) {
          result.tags = rule.tags;
        }
        
        if (options.includeSchema && rule.schema) {
          try {
            result.schema = this.zodSchemaToObject(rule.schema);
          } catch (error) {
            result.schema = { error: 'Unable to serialize schema' };
          }
        }
        
        if (options.includeExamples) {
          try {
            result.example = JSON.parse(this.generateExampleForRule(rule));
          } catch (error) {
            result.example = { note: 'Example could not be generated' };
          }
        }
        
        return result;
      })
    };
    
    return JSON.stringify(doc, null, 2);
  }
  
  /**
   * Generate HTML documentation
   */
  private static generateHtml(
    rules: ValidationRule[],
    endpoints: { endpoint: string; ruleIds: string[] }[],
    options: ValidationDocOptions
  ): string {
    const title = options.title || 'API Validation Documentation';
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2c3e50; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { font-family: monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    .rule { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .description { font-style: italic; color: #666; }
    .tag { display: inline-block; background-color: #e0e0e0; padding: 2px 6px; border-radius: 3px; margin-right: 5px; font-size: 0.9em; }
    .active { color: green; }
    .inactive { color: red; }
    .toc { background-color: #f9f9f9; padding: 10px 20px; border-radius: 5px; margin-bottom: 20px; }
    .toc ul { list-style-type: none; padding-left: 20px; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(title)}</h1>
  <p>Generated on: ${new Date().toISOString()}</p>
  
  <div class="toc">
    <h2>Table of Contents</h2>
    <ul>
      <li><a href="#overview">Overview</a></li>
      <li><a href="#endpoints">Endpoints</a></li>
      <li><a href="#validation-rules">Validation Rules</a></li>
      ${options.includePatterns ? '<li><a href="#validation-patterns">Validation Patterns</a></li>' : ''}
    </ul>
  </div>
  
  <h2 id="overview">Overview</h2>
  <p>
    This document provides detailed information about the API validation rules used in the system.
    The validation system ensures that all API requests are properly validated for data integrity and security.
  </p>
  <p>
    <strong>Total Rules:</strong> ${rules.length}<br>
    <strong>Total Endpoints:</strong> ${endpoints.length}
  </p>
  
  <h2 id="endpoints">Endpoints</h2>
`;
    
    if (endpoints.length === 0) {
      html += `<p>No endpoints with validation rules defined.</p>`;
    } else {
      html += `<table>
    <tr>
      <th>Endpoint</th>
      <th>Validation Rules</th>
    </tr>
`;
      
      endpoints.forEach(endpoint => {
        const ruleNames = endpoint.ruleIds
          .map(id => {
            const rule = rules.find(r => r.id === id);
            return rule ? this.escapeHtml(rule.name) : this.escapeHtml(id);
          })
          .join(', ');
        
        html += `    <tr>
      <td><code>${this.escapeHtml(endpoint.endpoint)}</code></td>
      <td>${ruleNames}</td>
    </tr>
`;
      });
      
      html += `</table>`;
    }
    
    html += `
  <h2 id="validation-rules">Validation Rules</h2>
`;
    
    rules.forEach(rule => {
      html += `<div class="rule">
    <h3>${this.escapeHtml(rule.name)}</h3>
`;
      
      if (rule.description) {
        html += `    <p class="description">${this.escapeHtml(rule.description)}</p>
`;
      }
      
      html += `    <p>
      <strong>ID:</strong> <code>${this.escapeHtml(rule.id)}</code><br>
      <strong>Target:</strong> ${this.escapeHtml(rule.target || 'all')}<br>
      <strong>Active:</strong> <span class="${rule.isActive ? 'active' : 'inactive'}">${rule.isActive ? 'Yes' : 'No'}</span><br>
`;
      
      if (rule.priority !== undefined) {
        html += `      <strong>Priority:</strong> ${rule.priority}<br>
`;
      }
      
      if (rule.tags && rule.tags.length > 0) {
        html += `      <strong>Tags:</strong> `;
        
        rule.tags.forEach(tag => {
          html += `<span class="tag">${this.escapeHtml(tag)}</span>`;
        });
        
        html += `<br>
`;
      }
      
      html += `    </p>
`;
      
      // Include schema details if requested
      if (options.includeSchema && rule.schema) {
        html += `    <h4>Schema</h4>
    <pre><code>${this.escapeHtml(this.zodSchemaToString(rule.schema))}</code></pre>
`;
      }
      
      // Include examples if requested
      if (options.includeExamples) {
        html += `    <h4>Example</h4>
    <pre><code>${this.escapeHtml(this.generateExampleForRule(rule))}</code></pre>
`;
      }
      
      html += `  </div>
`;
    });
    
    html += `
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Convert a Zod schema to a string representation
   */
  private static zodSchemaToString(schema: any): string {
    try {
      if (!schema) return 'undefined';
      
      // Try to get the description of the schema
      let schemaStr = '';
      
      if (typeof schema.describe === 'function') {
        const description = schema.describe();
        schemaStr = JSON.stringify(description, null, 2);
      } else {
        schemaStr = String(schema);
      }
      
      return schemaStr;
    } catch (error) {
      return `Unable to convert schema to string: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * Convert a Zod schema to an object representation
   */
  private static zodSchemaToObject(schema: any): any {
    try {
      if (!schema) return null;
      
      if (typeof schema.describe === 'function') {
        return schema.describe();
      }
      
      return { type: 'unknown' };
    } catch (error) {
      return { error: `Unable to convert schema to object: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  
  /**
   * Generate a JSON example for a validation rule
   */
  private static generateExampleForRule(rule: ValidationRule): string {
    try {
      if (!rule.schema) return '{}';
      
      // Create an example based on the schema
      const example = this.createExampleFromSchema(rule.schema);
      
      return JSON.stringify(example, null, 2);
    } catch (error) {
      return `{"error": "Unable to generate example: ${error instanceof Error ? error.message : String(error)}"}`;
    }
  }
  
  /**
   * Create an example object from a Zod schema
   */
  private static createExampleFromSchema(schema: any): any {
    try {
      if (!schema) return {};
      
      if (typeof schema.describe !== 'function') {
        return { example: 'not available' };
      }
      
      const description = schema.describe();
      
      switch (description.type) {
        case 'string':
          return 'example-string';
        case 'number':
          return 123;
        case 'boolean':
          return true;
        case 'date':
          return new Date().toISOString();
        case 'array':
          return [this.createExampleFromSchema(description.element)];
        case 'object':
          const example: any = {};
          if (description.shape) {
            for (const [key, value] of Object.entries(description.shape)) {
              example[key] = this.createExampleFromSchema(value);
            }
          }
          return example;
        case 'enum':
          return description.values?.[0] || 'enum-value';
        case 'union':
          return this.createExampleFromSchema(description.options?.[0]);
        default:
          return { example: `type: ${description.type}` };
      }
    } catch (error) {
      return { error: `Example generation failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  
  /**
   * Escape HTML special characters for safe HTML output
   */
  private static escapeHtml(text: string): string {
    if (!text) return '';
    
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
    try {
      // Dynamically import ValidationEngine to avoid circular dependencies
      const { ValidationEngine } = require('./ValidationEngine');
      
      const rule = ValidationEngine.getRule(ruleId);
      
      if (!rule) {
        throw new Error(`Rule with ID '${ruleId}' not found`);
      }
      
      // Generate documentation for just this rule
      switch (options.format) {
        case 'markdown':
          let markdown = `# Validation Rule: ${rule.name}\n\n`;
          
          if (rule.description) {
            markdown += `${rule.description}\n\n`;
          }
          
          markdown += `- **ID**: \`${rule.id}\`\n`;
          markdown += `- **Target**: ${rule.target || 'all'}\n`;
          markdown += `- **Active**: ${rule.isActive ? 'Yes' : 'No'}\n`;
          
          if (rule.priority !== undefined) {
            markdown += `- **Priority**: ${rule.priority}\n`;
          }
          
          if (rule.tags && rule.tags.length > 0) {
            markdown += `- **Tags**: ${rule.tags.join(', ')}\n`;
          }
          
          // Include schema details if requested
          if (options.includeSchema && rule.schema) {
            markdown += `\n## Schema\n\n`;
            markdown += `\`\`\`typescript\n${this.zodSchemaToString(rule.schema)}\n\`\`\`\n\n`;
          }
          
          // Include examples if requested
          if (options.includeExamples) {
            markdown += `\n## Example\n\n`;
            markdown += `\`\`\`json\n${this.generateExampleForRule(rule)}\n\`\`\`\n\n`;
          }
          
          return markdown;
          
        case 'json':
          const jsonDoc: any = {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            target: rule.target || 'all',
            isActive: rule.isActive
          };
          
          if (rule.priority !== undefined) {
            jsonDoc.priority = rule.priority;
          }
          
          if (rule.tags && rule.tags.length > 0) {
            jsonDoc.tags = rule.tags;
          }
          
          if (options.includeSchema && rule.schema) {
            try {
              jsonDoc.schema = this.zodSchemaToObject(rule.schema);
            } catch (error) {
              jsonDoc.schema = { error: 'Unable to serialize schema' };
            }
          }
          
          if (options.includeExamples) {
            try {
              jsonDoc.example = JSON.parse(this.generateExampleForRule(rule));
            } catch (error) {
              jsonDoc.example = { note: 'Example could not be generated' };
            }
          }
          
          return JSON.stringify(jsonDoc, null, 2);
          
        case 'html':
          // Similar to the HTML generation in generateHtml, but for a single rule
          let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Validation Rule: ${this.escapeHtml(rule.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2c3e50; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { font-family: monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    .rule { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .description { font-style: italic; color: #666; }
    .tag { display: inline-block; background-color: #e0e0e0; padding: 2px 6px; border-radius: 3px; margin-right: 5px; font-size: 0.9em; }
    .active { color: green; }
    .inactive { color: red; }
  </style>
</head>
<body>
  <h1>Validation Rule: ${this.escapeHtml(rule.name)}</h1>
`;
          
          if (rule.description) {
            html += `  <p class="description">${this.escapeHtml(rule.description)}</p>
`;
          }
          
          html += `  <p>
    <strong>ID:</strong> <code>${this.escapeHtml(rule.id)}</code><br>
    <strong>Target:</strong> ${this.escapeHtml(rule.target || 'all')}<br>
    <strong>Active:</strong> <span class="${rule.isActive ? 'active' : 'inactive'}">${rule.isActive ? 'Yes' : 'No'}</span><br>
`;
          
          if (rule.priority !== undefined) {
            html += `    <strong>Priority:</strong> ${rule.priority}<br>
`;
          }
          
          if (rule.tags && rule.tags.length > 0) {
            html += `    <strong>Tags:</strong> `;
            
            rule.tags.forEach(tag => {
              html += `<span class="tag">${this.escapeHtml(tag)}</span>`;
            });
            
            html += `<br>
`;
          }
          
          html += `  </p>
`;
          
          // Include schema details if requested
          if (options.includeSchema && rule.schema) {
            html += `  <h2>Schema</h2>
  <pre><code>${this.escapeHtml(this.zodSchemaToString(rule.schema))}</code></pre>
`;
          }
          
          // Include examples if requested
          if (options.includeExamples) {
            html += `  <h2>Example</h2>
  <pre><code>${this.escapeHtml(this.generateExampleForRule(rule))}</code></pre>
`;
          }
          
          html += `</body>
</html>`;
          
          return html;
          
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      throw new Error(`Error generating rule documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}