# TypeScript Error Pattern Recognition System

The TypeScript Error Management System includes a sophisticated pattern recognition component that identifies common error patterns across the codebase. This document explains how the pattern recognition system works and details the most common error patterns.

## Pattern Recognition Process

The pattern recognition system follows these steps:

1. **Error Collection**: All TypeScript errors are collected during the build process
2. **Semantic Clustering**: Errors are clustered based on semantic similarity
3. **Pattern Extraction**: Common patterns are extracted from each cluster
4. **Pattern Storage**: Patterns are stored in the `error_patterns` table
5. **Fix Association**: Each pattern is associated with potential fixes

## Common Error Patterns

### 1. Type Mismatch Patterns

#### String-Number Conversion

**Pattern Name**: `string_number_mismatch`
**Regex Pattern**: `'number'.*not assignable to.*'string'`
**Category**: `type_mismatch`
**Severity**: `medium`

This pattern occurs when numbers are used where strings are expected or vice versa. Common scenarios include:
- Database IDs (numbers) passed to functions expecting string IDs
- Query parameters (strings) compared with database IDs (numbers)
- String template variables using numbers without conversion

**Detection Rules**:
```json
{
  "code_patterns": [
    "(\\w+)\\s*==\\s*(\\w+)",
    "(\\w+)\\((\\w+)\\)",
    "params\\.(\\w+)"
  ],
  "message_patterns": [
    "Argument of type 'number' is not assignable to parameter of type 'string'",
    "This comparison appears to be unintentional because the types 'number' and 'string' have no overlap"
  ]
}
```

**Auto-Fixable**: `true`

#### Object-Array Mismatch

**Pattern Name**: `object_array_mismatch`
**Regex Pattern**: `'(\\w+)\\[\\]'.*not assignable to.*'(\\w+)'`
**Category**: `type_mismatch`
**Severity**: `high`

This pattern occurs when arrays are used where objects are expected or vice versa.

**Detection Rules**:
```json
{
  "code_patterns": [
    "(\\w+)\\.(\\w+)",
    "(\\w+)\\[(\\w+)\\]",
    "map\\((\\w+)\\s*=>"
  ],
  "message_patterns": [
    "Property '...' does not exist on type '...'[]",
    "Type '...' is not assignable to type '...'[]"
  ]
}
```

**Auto-Fixable**: `true`

### 2. Missing Type Patterns

#### Implicit Any Array

**Pattern Name**: `implicit_any_array`
**Regex Pattern**: `implicitly has.*'any\\[\\]'`
**Category**: `missing_type`
**Severity**: `high`

This pattern occurs when arrays are declared without explicit types.

**Detection Rules**:
```json
{
  "code_patterns": [
    "const\\s+(\\w+)\\s*=\\s*\\[",
    "const\\s+(\\w+)\\s*=\\s*await",
    "let\\s+(\\w+)\\s*=\\s*\\["
  ],
  "message_patterns": [
    "Variable '...' implicitly has type 'any[]'",
    "implicitly has an 'any[]' type"
  ]
}
```

**Auto-Fixable**: `true`

#### Parameter Implicit Any

**Pattern Name**: `parameter_implicit_any`
**Regex Pattern**: `Parameter '(\\w+)' implicitly has an 'any' type`
**Category**: `missing_type`
**Severity**: `high`

This pattern occurs when function parameters don't have explicit types.

**Detection Rules**:
```json
{
  "code_patterns": [
    "function\\s+(\\w+)\\((\\w+)(,\\s*\\w+)*\\)",
    "\\((\\w+)(,\\s*\\w+)*\\)\\s*=>",
    "app\\.(get|post|put|delete)\\("
  ],
  "message_patterns": [
    "Parameter '...' implicitly has an 'any' type"
  ]
}
```

**Auto-Fixable**: `true`

### 3. Interface Mismatch Patterns

#### Missing Property

**Pattern Name**: `missing_property`
**Regex Pattern**: `Property '(\\w+)' does not exist on type`
**Category**: `interface_mismatch`
**Severity**: `high`

This pattern occurs when code attempts to access properties that don't exist on the type.

**Detection Rules**:
```json
{
  "code_patterns": [
    "(\\w+)\\.(\\w+)",
    "const\\s*{\\s*(\\w+)(,\\s*\\w+)*\\s*}\\s*=\\s*(\\w+)"
  ],
  "message_patterns": [
    "Property '...' does not exist on type '...'",
    "does not exist on type '...'"
  ]
}
```

**Auto-Fixable**: `true`

#### Interface Extension Needed

**Pattern Name**: `interface_extension_needed`
**Regex Pattern**: `'(\\w+)'.*missing.*properties.*from.*'(\\w+)'`
**Category**: `interface_mismatch`
**Severity**: `high`

This pattern occurs when one interface is missing properties required by another.

**Detection Rules**:
```json
{
  "code_patterns": [
    "implements\\s+(\\w+)",
    "extends\\s+(\\w+)",
    "as\\s+(\\w+)"
  ],
  "message_patterns": [
    "Type '...' is missing the following properties from type '...': ...",
    "Type '...' is not assignable to type '...'"
  ]
}
```

**Auto-Fixable**: `true`

### 4. Null Reference Patterns

#### Null/Undefined Property Access

**Pattern Name**: `null_undefined_access`
**Regex Pattern**: `'(\\w+)' is possibly '(null|undefined)'`
**Category**: `null_reference`
**Severity**: `high`

This pattern occurs when properties are accessed on objects that might be null or undefined.

**Detection Rules**:
```json
{
  "code_patterns": [
    "(\\w+)\\.(\\w+)",
    "(\\w+)\\[(\\w+)\\]",
    "const\\s*{\\s*(\\w+)(,\\s*\\w+)*\\s*}\\s*=\\s*(\\w+)"
  ],
  "message_patterns": [
    "is possibly 'null'",
    "is possibly 'undefined'",
    "Object is possibly 'null'"
  ]
}
```

**Auto-Fixable**: `true`

#### Unknown Type Access

**Pattern Name**: `unknown_type_access`
**Regex Pattern**: `Object is of type 'unknown'`
**Category**: `null_reference`
**Severity**: `high`

This pattern occurs when properties are accessed on objects of type `unknown`.

**Detection Rules**:
```json
{
  "code_patterns": [
    "(\\w+)\\.(\\w+)",
    "(\\w+)\\[(\\w+)\\]",
    "as\\s+any"
  ],
  "message_patterns": [
    "Object is of type 'unknown'",
    "is of type 'unknown'"
  ]
}
```

**Auto-Fixable**: `true`

### 5. Import Error Patterns

#### Missing Import

**Pattern Name**: `missing_import`
**Regex Pattern**: `Cannot find module '(.*?)' or its corresponding type declarations`
**Category**: `import_error`
**Severity**: `critical`

This pattern occurs when imports reference modules that don't exist or aren't installed.

**Detection Rules**:
```json
{
  "code_patterns": [
    "import\\s*{\\s*(\\w+)(,\\s*\\w+)*\\s*}\\s*from\\s*'([^']+)'",
    "import\\s+(\\w+)\\s+from\\s*'([^']+)'",
    "require\\(['\"](.*?)['\"]\\)"
  ],
  "message_patterns": [
    "Cannot find module '...' or its corresponding type declarations",
    "Module '...' has no exported member '...'"
  ]
}
```

**Auto-Fixable**: `false` (requires dependency installation)

#### Duplicate Import

**Pattern Name**: `duplicate_import`
**Regex Pattern**: `Duplicate identifier '(\\w+)'`
**Category**: `import_error`
**Severity**: `medium`

This pattern occurs when the same identifier is imported multiple times.

**Detection Rules**:
```json
{
  "code_patterns": [
    "import\\s*{\\s*(\\w+)(,\\s*\\w+)*\\s*}\\s*from\\s*'([^']+)'",
    "import\\s+(\\w+)\\s+from\\s*'([^']+)'"
  ],
  "message_patterns": [
    "Duplicate identifier '...'",
    "already declared" 
  ]
}
```

**Auto-Fixable**: `true`

## Pattern Recognition in Action

When the TypeScript Error Management System encounters a new error, it follows these steps:

1. **Pattern Matching**: The error message and surrounding code are compared against known patterns
2. **Confidence Calculation**: A confidence score is calculated for each potential pattern match
3. **Categorization**: The error is categorized based on the highest-confidence pattern match
4. **Fix Suggestion**: Appropriate fixes are suggested based on the matched pattern
5. **Learning**: If a new pattern is detected, it's added to the pattern database

## Benefits of Pattern Recognition

The pattern recognition system provides several benefits:

1. **Consistent Fixes**: Ensures similar errors are fixed in the same way
2. **Fix Prioritization**: Allows critical errors to be fixed first
3. **Batch Processing**: Enables fixing multiple instances of the same pattern at once
4. **Root Cause Analysis**: Helps identify the underlying causes of errors
5. **Learning System**: Improves over time as it encounters more errors

## Extending the Pattern System

Developers can extend the pattern recognition system by adding new patterns:

```typescript
// server/utils/ts-error-patterns.ts
export function addCustomPattern(
  name: string,
  regex: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  detectionRules: {
    code_patterns?: string[];
    message_patterns?: string[];
    context_clues?: string[];
  },
  autoFixable: boolean = false
): Promise<ErrorPattern> {
  return storage.addErrorPattern({
    name,
    regex,
    category,
    severity,
    detectionRules,
    autoFixable
  });
}
```

This extensible design allows the system to adapt to new error patterns as they emerge.

## Conclusion

The pattern recognition system is a core component of the TypeScript Error Management System, providing intelligent categorization and fix suggestions for TypeScript errors. By understanding common error patterns, the system can efficiently handle most TypeScript errors with minimal human intervention.