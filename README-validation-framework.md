# Advanced Validation Framework

A comprehensive validation solution implementing a three-tier validation approach for web applications, with support for complex business rules, performance optimizations, internationalization, and analytics.

## Key Features

### Three-Tier Validation
- **Client-side Pre-submission**: Validate data before submission to provide immediate feedback
- **API Endpoint Validation**: Ensure data integrity at the API layer
- **Database-level Constraint Validation**: Protect your database from invalid data

### Business Rules Validation
- Complex interdependent field validations
- Conditional validation logic
- Custom validation rules

### Form Error Aggregation
- Consolidated error display with the `ValidationSummary` component
- Error prioritization based on severity
- Field navigation capabilities

### Schema Generation
- Generate documentation from validation schemas
- Visualize validation rules and dependencies
- Support for multiple output formats (Markdown, HTML, JSON)

### Performance Optimizations
- Validation caching for unchanged fields
- Debounced validation to reduce processing
- Batched validation for complex forms

### Localization Support
- Internationalized error messages
- AI-powered translations (with OpenAI integration)
- Context-aware messaging based on user preferences

### Validation Analytics
- Track common validation failures to improve UX
- Measure validation performance
- Generate insights on form completion rates

## Getting Started

### Basic Usage

```typescript
import { z } from 'zod';
import { createValidationFramework } from './shared/validation';

// Define your schema with Zod
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Create a validation framework instance
const validation = createValidationFramework(userSchema);

// Validate data
const result = await validation.validate({
  username: 'jo', // Too short
  email: 'not-an-email',
  password: 'short'
});

console.log(result.valid); // false
console.log(result.errors); // Array of validation errors
```

### Adding Business Rules

```typescript
import { BusinessRulesValidator, ValidationSeverity, ValidationContext } from './shared/validation';

// Create business rules
const userBusinessRules = new BusinessRulesValidator()
  .addRule({
    name: 'username_not_admin',
    description: 'Username cannot be "admin"',
    validator: (data) => {
      if (data.username.toLowerCase() === 'admin') {
        return {
          field: 'username',
          message: 'Username cannot be "admin"',
          code: 'RESERVED_USERNAME',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CUSTOM
        };
      }
      return null;
    },
    errorCode: 'RESERVED_USERNAME',
    errorMessage: 'Username cannot be "admin"',
    severity: ValidationSeverity.ERROR
  });

// Create validation framework with business rules
const validation = createValidationFramework(userSchema, userBusinessRules);
```

### Using the ValidationSummary Component

```tsx
import { ValidationSummary } from './client/src/components/form/ValidationSummary';

function MyForm() {
  const [errors, setErrors] = useState([]);
  
  // Navigation handler
  const handleNavigateToField = (field) => {
    document.getElementById(field)?.focus();
  };
  
  return (
    <form>
      {errors.length > 0 && (
        <ValidationSummary 
          errors={errors}
          onNavigateToField={handleNavigateToField}
        />
      )}
      {/* Form fields */}
    </form>
  );
}
```

### Internationalization

```typescript
// When creating the validation framework
const validation = createValidationFramework(userSchema, userBusinessRules, {
  enableLocalization: true,
  defaultLocale: 'es',
  openAiApiKey: process.env.OPENAI_API_KEY // Optional for AI-powered translations
});

// Get localized error messages
const message = validation.localize('validation.required', 'fr', { field: 'Email' });
```

### Tracking Analytics

```typescript
// Start a validation session
const sessionId = validation.startSession('registration_form');

// Track field interactions
validation.trackFieldInteraction('registration_form', 'email', 'field_changed');

// Track form submission
validation.trackFormSubmission('registration_form', false, errors);

// End the session
validation.endSession(sessionId, 'abandoned');

// Get analytics data
const analytics = validation.getAnalytics();
console.log(analytics.fieldErrorRates); // See which fields have the most errors
```

## Enhanced Validation Pipeline

The validation framework has been enhanced with a powerful, three-phase validation pipeline that offers advanced performance and integration features.

### Key Pipeline Features

1. **Three-Phase Validation Process**
   - **Pre-validation phase**: Checks cache, performs request batching
   - **Main validation phase**: Executes schema and/or AI-powered validation
   - **Post-validation phase**: Logs results, updates cache, generates metrics

2. **Performance Optimizations**
   - **LRU caching**: Caches validation results for identical requests
   - **Request batching**: Groups similar validation requests for processing
   - **Tiered validation**: Skips unnecessary validation steps based on context
   
3. **Security Integration**
   - **AI-powered threat detection**: Leverages GPT-4o for intelligent analysis
   - **Severity-based warnings**: Classifies security concerns by severity
   - **Immutable audit logging**: Records validation activity for security analysis

4. **Middleware Integration**
   - **Schema validation middleware**: For Zod schema validation
   - **AI validation middleware**: For pure AI-powered validation
   - **Database operation middleware**: Specialized validation for database queries

### Using the Pipeline

```typescript
// Schema Validation
app.post('/contact', createValidationMiddleware(
  contactSchema,
  { batchKey: 'contact-forms' }
), (req, res) => {
  // Access validated data
  const validatedData = req.validatedData;
  // Access validation metadata
  const validationMeta = req.validationResult;
  // Process the validated data
  res.json({ success: true });
});

// AI Validation
app.post('/api/data', createAIValidationMiddleware({
  contentType: 'api',
  detailedAnalysis: true,
  threshold: 0.7
}), (req, res) => {
  // Process the validated data
  res.json({ success: true });
});

// Database Validation
app.post('/db/query', createDatabaseValidationMiddleware({
  detailedAnalysis: true
}), (req, res) => {
  // Process the validated database operation
  res.json({ success: true });
});
```

### Pipeline Status and Management

The validation pipeline provides monitoring capabilities to track usage and performance:

```typescript
// Get pipeline status
const status = await validationPipeline.getStatus();
console.log(status.cacheStats); // Cache performance metrics
console.log(status.activeBatches); // Current batch processing status
console.log(status.aiValidation); // AI service status

// Clear validation cache
validationPipeline.clearCache();
```

## Future Enhancements

1. **Schema Evolution Support**
   - Track schema changes over time
   - Version migration support
   - Backward compatibility validation

2. **Machine Learning Validation**
   - Learn from user behavior to predict validation errors
   - Suggest fixes based on common patterns
   - Adaptive validation based on user proficiency

3. **Cross-Field Dependency Visualization**
   - Interactive graph visualization of field dependencies
   - Impact analysis for validation rule changes
   - Field dependency heatmaps

4. **Enhanced Accessibility Features**
   - Screen reader optimized error messages
   - Keyboard navigation through errors
   - Focus management for validation failures

5. **Validation Rule Testing Framework**
   - Automated test generation for validation rules
   - Mutation testing for validation coverage
   - Performance benchmarking tools

## Architecture

The validation framework is organized into the following modules:

- **validationTypes.ts**: Core types and interfaces
- **businessRuleValidation.ts**: Complex business rule validation
- **validationIntegration.ts**: Integration between validation layers
- **validationPatterns.ts**: Reusable validation patterns
- **schemaGenerator.ts**: Schema documentation generation
- **optimizedValidation.ts**: Performance optimizations
- **localization.ts**: Internationalization support
- **analytics.ts**: Validation analytics tracking
- **index.ts**: Main entrypoint that brings everything together

Each module is designed to be used independently or as part of the complete framework, providing maximum flexibility for different use cases.

## Integration with Existing Systems

The validation framework is designed to integrate seamlessly with existing systems:

- **Forms**: Works with React Hook Form, Formik, or vanilla forms
- **API**: Compatible with Express, Next.js, or any API framework
- **Database**: Works with any database system through an abstraction layer
- **UI Frameworks**: Compatible with any UI framework (Shadcn, Material-UI, etc.)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.