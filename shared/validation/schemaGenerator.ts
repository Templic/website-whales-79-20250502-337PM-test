/**
 * Schema Generator Module
 * 
 * This module provides utilities to generate Zod schemas from TypeScript types
 * and visualize validation rules and dependencies.
 */

import { z } from 'zod';
import { ValidationSeverity } from './validationTypes';
import { BusinessRule, BusinessRulesValidator } from './businessRuleValidation';

/**
 * Schema visualization options
 */
export interface SchemaVisualizationOptions {
  includeDescriptions?: boolean;
  includeValidators?: boolean;
  includeBusinessRules?: boolean;
  includeDefaults?: boolean;
  format?: 'json' | 'markdown' | 'html';
}

/**
 * Schema field metadata
 */
export interface SchemaFieldMetadata {
  field: string;
  path: string[];
  type: string;
  required: boolean;
  description?: string;
  validations: {
    rule: string;
    message: string;
    severity: ValidationSeverity;
  }[];
  default?: any;
}

/**
 * Schema dependency visualization
 */
export interface SchemaDependency {
  from: string;
  to: string;
  type: 'requires' | 'mutuallyExclusive' | 'conditional';
  description: string;
}

/**
 * Schema visualization result
 */
export interface SchemaVisualization {
  name: string;
  fields: SchemaFieldMetadata[];
  dependencies: SchemaDependency[];
  version: string;
  createdAt: Date;
}

/**
 * Extract field metadata from a Zod schema
 */
export function extractZodSchemaMetadata(
  schema: z.ZodType<any>,
  schemaName: string,
  businessRules?: BusinessRulesValidator<any>
): SchemaVisualization {
  // Get schema description
  const description = (schema as any)._def?.description;
  
  // Initialize result
  const result: SchemaVisualization = {
    name: schemaName,
    fields: [],
    dependencies: [],
    version: '1.0.0',
    createdAt: new Date()
  };
  
  // Check if schema is an object schema
  if (schema instanceof z.ZodObject) {
    // Get schema shape
    const shape = schema._def.shape();
    
    // Extract field metadata
    for (const [fieldName, fieldSchema] of Object.entries(shape)) {
      const fieldMetadata = extractFieldMetadata(
        fieldSchema as z.ZodType<any>,
        fieldName,
        [fieldName]
      );
      
      result.fields.push(fieldMetadata);
    }
  }
  
  // Extract business rule dependencies if provided
  if (businessRules) {
    for (const rule of businessRules['rules'] || []) {
      if (rule.dependencies && rule.dependencies.length > 1) {
        // For each dependency pair, create a connection
        for (let i = 0; i < rule.dependencies.length - 1; i++) {
          result.dependencies.push({
            from: String(rule.dependencies[i]),
            to: String(rule.dependencies[i + 1]),
            type: getDependencyType(rule),
            description: rule.description
          });
        }
      }
    }
  }
  
  return result;
}

/**
 * Extract metadata for a single field
 */
function extractFieldMetadata(
  fieldSchema: z.ZodType<any>,
  fieldName: string,
  path: string[]
): SchemaFieldMetadata {
  // Initialize field metadata
  const metadata: SchemaFieldMetadata = {
    field: fieldName,
    path,
    type: getZodTypeName(fieldSchema),
    required: !isOptional(fieldSchema),
    validations: []
  };
  
  // Extract field description
  const description = (fieldSchema as any)._def?.description;
  if (description) {
    metadata.description = description;
  }
  
  // Extract validations
  extractValidationRules(fieldSchema, metadata.validations);
  
  // Extract default value
  const defaultValue = getDefaultValue(fieldSchema);
  if (defaultValue !== undefined) {
    metadata.default = defaultValue;
  }
  
  return metadata;
}

/**
 * Get the Zod type name
 */
function getZodTypeName(schema: z.ZodType<any>): string {
  if (schema instanceof z.ZodString) return 'string';
  if (schema instanceof z.ZodNumber) return 'number';
  if (schema instanceof z.ZodBoolean) return 'boolean';
  if (schema instanceof z.ZodDate) return 'date';
  if (schema instanceof z.ZodArray) return `${getZodTypeName(schema._def.type)}[]`;
  if (schema instanceof z.ZodObject) return 'object';
  if (schema instanceof z.ZodEnum) return `enum(${schema._def.values.join('|')})`;
  if (schema instanceof z.ZodLiteral) return `literal(${JSON.stringify(schema._def.value)})`;
  if (schema instanceof z.ZodNullable) return `nullable<${getZodTypeName(schema._def.innerType)}>`;
  if (schema instanceof z.ZodOptional) return `optional<${getZodTypeName(schema._def.innerType)}>`;
  if (schema instanceof z.ZodUnion) return 'union';
  if (schema instanceof z.ZodRecord) return 'record';
  if (schema instanceof z.ZodMap) return 'map';
  if (schema instanceof z.ZodSet) return 'set';
  if (schema instanceof z.ZodIntersection) return 'intersection';
  if (schema instanceof z.ZodTuple) return 'tuple';
  if (schema instanceof z.ZodPromise) return `promise<${getZodTypeName(schema._def.type)}>`;
  
  return 'unknown';
}

/**
 * Check if a schema is optional
 */
function isOptional(schema: z.ZodType<any>): boolean {
  return schema instanceof z.ZodOptional;
}

/**
 * Extract validation rules
 */
function extractValidationRules(
  schema: z.ZodType<any>,
  validations: { rule: string; message: string; severity: ValidationSeverity }[]
): void {
  // Extract min/max for string
  if (schema instanceof z.ZodString) {
    if (schema._def.minLength !== null) {
      validations.push({
        rule: `minLength(${schema._def.minLength.value})`,
        message: schema._def.minLength.message || `Must be at least ${schema._def.minLength.value} characters`,
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (schema._def.maxLength !== null) {
      validations.push({
        rule: `maxLength(${schema._def.maxLength.value})`,
        message: schema._def.maxLength.message || `Cannot exceed ${schema._def.maxLength.value} characters`,
        severity: ValidationSeverity.ERROR
      });
    }
    
    if (schema._def.regex) {
      validations.push({
        rule: `regex(${schema._def.regex.source})`,
        message: schema._def.regex.message || 'Invalid format',
        severity: ValidationSeverity.ERROR
      });
    }
  }
  
  // Extract min/max for number
  if (schema instanceof z.ZodNumber) {
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        if (check.kind === 'min') {
          validations.push({
            rule: `min(${check.value})`,
            message: check.message || `Must be at least ${check.value}`,
            severity: ValidationSeverity.ERROR
          });
        } else if (check.kind === 'max') {
          validations.push({
            rule: `max(${check.value})`,
            message: check.message || `Cannot exceed ${check.value}`,
            severity: ValidationSeverity.ERROR
          });
        } else if (check.kind === 'int') {
          validations.push({
            rule: 'int()',
            message: check.message || 'Must be an integer',
            severity: ValidationSeverity.ERROR
          });
        } else if (check.kind === 'multipleOf') {
          validations.push({
            rule: `multipleOf(${check.value})`,
            message: check.message || `Must be a multiple of ${check.value}`,
            severity: ValidationSeverity.ERROR
          });
        }
      }
    }
  }
  
  // Extract refinements
  if (schema._def && schema._def.refinement) {
    validations.push({
      rule: 'refinement()',
      message: schema._def.refinement.message || 'Custom validation failed',
      severity: ValidationSeverity.ERROR
    });
  }
  
  // Handle inner type for optional
  if (schema instanceof z.ZodOptional && schema._def.innerType) {
    extractValidationRules(schema._def.innerType, validations);
  }
}

/**
 * Get the default value from a schema
 */
function getDefaultValue(schema: z.ZodType<any>): any {
  if (schema instanceof z.ZodDefault) {
    const defaultValue = schema._def.defaultValue();
    return defaultValue;
  }
  
  return undefined;
}

/**
 * Get the type of dependency from a business rule
 */
function getDependencyType(rule: BusinessRule): 'requires' | 'mutuallyExclusive' | 'conditional' {
  const name = rule.name.toLowerCase();
  
  if (name.includes('required') || name.includes('dependency')) {
    return 'requires';
  } else if (name.includes('exclusive') || name.includes('mutex')) {
    return 'mutuallyExclusive';
  } else {
    return 'conditional';
  }
}

/**
 * Generate a visualization of a schema
 */
export function visualizeSchema(
  schema: z.ZodType<any>,
  schemaName: string,
  businessRules?: BusinessRulesValidator<any>,
  options: SchemaVisualizationOptions = {}
): string {
  const {
    includeDescriptions = true,
    includeValidators = true,
    includeBusinessRules = true,
    includeDefaults = true,
    format = 'markdown'
  } = options;
  
  // Extract metadata
  const metadata = extractZodSchemaMetadata(
    schema,
    schemaName,
    includeBusinessRules ? businessRules : undefined
  );
  
  // Generate visualization based on format
  switch (format) {
    case 'json':
      return JSON.stringify(metadata, null, 2);
    case 'html':
      return generateHtmlVisualization(metadata, options);
    case 'markdown':
    default:
      return generateMarkdownVisualization(metadata, options);
  }
}

/**
 * Generate a markdown visualization
 */
function generateMarkdownVisualization(
  metadata: SchemaVisualization,
  options: SchemaVisualizationOptions
): string {
  const {
    includeDescriptions = true,
    includeValidators = true,
    includeBusinessRules = true,
    includeDefaults = true
  } = options;
  
  let markdown = `# ${metadata.name} Schema\n\n`;
  
  // Add metadata
  markdown += `**Version:** ${metadata.version}  \n`;
  markdown += `**Created:** ${metadata.createdAt.toISOString()}  \n\n`;
  
  // Add fields section
  markdown += `## Fields\n\n`;
  
  metadata.fields.forEach(field => {
    markdown += `### ${field.field}\n\n`;
    markdown += `**Type:** ${field.type}  \n`;
    markdown += `**Required:** ${field.required ? 'Yes' : 'No'}  \n`;
    
    if (includeDescriptions && field.description) {
      markdown += `**Description:** ${field.description}  \n`;
    }
    
    if (includeDefaults && field.default !== undefined) {
      markdown += `**Default:** ${JSON.stringify(field.default)}  \n`;
    }
    
    if (includeValidators && field.validations.length > 0) {
      markdown += `\n**Validations:**\n\n`;
      
      field.validations.forEach(validation => {
        markdown += `- **${validation.rule}**: ${validation.message} (${validation.severity})\n`;
      });
      
      markdown += '\n';
    }
  });
  
  // Add dependencies section
  if (includeBusinessRules && metadata.dependencies.length > 0) {
    markdown += `## Dependencies\n\n`;
    
    metadata.dependencies.forEach(dependency => {
      markdown += `- **${dependency.from}** ${getRelationshipText(dependency.type)} **${dependency.to}**: ${dependency.description}\n`;
    });
  }
  
  return markdown;
}

/**
 * Generate an HTML visualization
 */
function generateHtmlVisualization(
  metadata: SchemaVisualization,
  options: SchemaVisualizationOptions
): string {
  const {
    includeDescriptions = true,
    includeValidators = true,
    includeBusinessRules = true,
    includeDefaults = true
  } = options;
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${metadata.name} Schema</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; max-width: 1000px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { margin-top: 30px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
    h3 { margin-top: 20px; color: #0066cc; }
    .field { background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .validations { margin-top: 10px; }
    .validation { padding: 5px 10px; margin: 5px 0; border-left: 3px solid #ddd; }
    .validation.error { border-left-color: #ff4d4f; }
    .validation.warning { border-left-color: #faad14; }
    .validation.info { border-left-color: #1890ff; }
    .metadata { font-size: 0.9em; color: #666; margin-bottom: 20px; }
    .dependencies { list-style-type: none; padding: 0; }
    .dependency { padding: 10px; background: #f0f0f0; margin-bottom: 10px; border-radius: 5px; }
    .requires { color: #52c41a; }
    .mutuallyExclusive { color: #fa8c16; }
    .conditional { color: #722ed1; }
  </style>
</head>
<body>
  <h1>${metadata.name} Schema</h1>
  
  <div class="metadata">
    <p><strong>Version:</strong> ${metadata.version}</p>
    <p><strong>Created:</strong> ${metadata.createdAt.toISOString()}</p>
  </div>
  
  <h2>Fields</h2>
`;
  
  metadata.fields.forEach(field => {
    html += `
  <div class="field">
    <h3>${field.field}</h3>
    <p><strong>Type:</strong> ${field.type}</p>
    <p><strong>Required:</strong> ${field.required ? 'Yes' : 'No'}</p>
`;
    
    if (includeDescriptions && field.description) {
      html += `    <p><strong>Description:</strong> ${field.description}</p>\n`;
    }
    
    if (includeDefaults && field.default !== undefined) {
      html += `    <p><strong>Default:</strong> ${JSON.stringify(field.default)}</p>\n`;
    }
    
    if (includeValidators && field.validations.length > 0) {
      html += `    <div class="validations">
      <p><strong>Validations:</strong></p>`;
      
      field.validations.forEach(validation => {
        html += `
      <div class="validation ${validation.severity.toLowerCase()}">
        <p><strong>${validation.rule}:</strong> ${validation.message} <span class="severity">(${validation.severity})</span></p>
      </div>`;
      });
      
      html += `\n    </div>`;
    }
    
    html += `\n  </div>`;
  });
  
  // Add dependencies section
  if (includeBusinessRules && metadata.dependencies.length > 0) {
    html += `
  <h2>Dependencies</h2>
  <ul class="dependencies">`;
    
    metadata.dependencies.forEach(dependency => {
      html += `
    <li class="dependency">
      <p><strong>${dependency.from}</strong> <span class="${dependency.type}">${getRelationshipText(dependency.type)}</span> <strong>${dependency.to}</strong>: ${dependency.description}</p>
    </li>`;
    });
    
    html += `\n  </ul>`;
  }
  
  html += `
</body>
</html>`;
  
  return html;
}

/**
 * Get relationship text
 */
function getRelationshipText(type: 'requires' | 'mutuallyExclusive' | 'conditional'): string {
  switch (type) {
    case 'requires':
      return 'requires';
    case 'mutuallyExclusive':
      return 'is mutually exclusive with';
    case 'conditional':
      return 'conditionally affects';
  }
}

/**
 * Generate a Zod schema from an interface type
 * This utility serves as a starting point for schema generation
 * but requires TypeScript's type system, which is not available at runtime.
 * For full functionality, this would be used in a build step or code generation tool.
 */
export function generateZodSchema<T>(
  sampleObject: T,
  options: {
    name?: string;
    description?: string;
    addValidations?: boolean;
  } = {}
): z.ZodType<T> {
  const { name = 'Generated', description, addValidations = true } = options;
  
  // Create base schema
  const schema = generateSchemaForObject(sampleObject, addValidations);
  
  // Add description if provided
  if (description) {
    return schema.describe(description);
  }
  
  return schema;
}

/**
 * Generate a schema for an object
 */
function generateSchemaForObject<T>(
  obj: T,
  addValidations: boolean
): z.ZodType<T> {
  if (obj === null) {
    return z.null() as any;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return z.array(z.any()) as any;
    }
    
    // Use the first item as a template
    const itemSchema = generateSchemaForObject(obj[0], addValidations);
    return z.array(itemSchema) as any;
  }
  
  if (typeof obj === 'object') {
    const shape: Record<string, z.ZodTypeAny> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      shape[key] = generateSchemaForObject(value, addValidations);
    }
    
    return z.object(shape) as any;
  }
  
  // Handle primitive types
  switch (typeof obj) {
    case 'string':
      return addValidations 
        ? z.string().min(1, 'This field is required') 
        : z.string() as any;
    case 'number':
      return z.number() as any;
    case 'boolean':
      return z.boolean() as any;
    case 'undefined':
      return z.undefined() as any;
    default:
      return z.any() as any;
  }
}