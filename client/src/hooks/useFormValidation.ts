/**
 * Form Validation Hook
 * 
 * This hook integrates our validation framework with react-hook-form
 * to provide a unified validation experience.
 */

import { useCallback, useEffect, useState } from 'react';
import { useForm, UseFormReturn, Path, FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { 
  ValidationContext, 
  ValidationError, 
  ValidationResult,
  ValidationSeverity,
  createValidationError,
  createValidationResult
} from '../../../shared/validation/validationTypes';

/**
 * Convert Zod errors to our validation format
 */
function zodErrorToValidationError(
  error: z.ZodError,
  context: ValidationContext
): ValidationError[] {
  return error.errors.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
    severity: ValidationSeverity.ERROR,
    context,
    path: issue.path.map(String)
  }));
}

/**
 * Field validation status type
 */
type FieldValidationStatus = 'valid' | 'invalid' | 'pending';

/**
 * Custom validator function type
 */
type CustomValidator<T> = (
  value: any, 
  data: T
) => true | string;

/**
 * Form validation state
 */
interface FormValidationState<T> {
  isValidating: boolean;
  validationResult: ValidationResult;
  validationErrors: Record<string, string>;
  touchedFields: Set<keyof T>;
  dirtyFields: Set<keyof T>;
  fieldValidationStatus: Record<string, FieldValidationStatus>;
}

/**
 * Form validation mode
 */
type ValidationMode = 
  | 'onChange'   // Validate on every change
  | 'onBlur'     // Validate on blur
  | 'onSubmit'   // Validate only on submit
  | 'onTouched'  // Validate fields that have been touched
  | 'all';       // Validate all fields at all times

/**
 * Form validation hook props
 */
interface UseFormValidationProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues?: Partial<T>;
  mode?: ValidationMode;
  customValidators?: Record<string, CustomValidator<T>>;
  dependentFields?: Record<string, Array<keyof T>>;
}

/**
 * Form validation hook 
 */
export function useFormValidation<T extends FieldValues>(
  props: UseFormValidationProps<T>
) {
  const { 
    schema, 
    defaultValues, 
    mode = 'onChange',
    customValidators = {},
    dependentFields = {}
  } = props;
  
  // Use react-hook-form
  const {
    register,
    handleSubmit,
    formState,
    getValues,
    setValue,
    reset,
    watch,
    setError,
    clearErrors,
    trigger
  } = useForm<T>({
    defaultValues: defaultValues as T
  });
  
  // Track validation state
  const [state, setState] = useState<FormValidationState<T>>({
    isValidating: false,
    validationResult: createValidationResult(true, [], ValidationContext.CLIENT),
    validationErrors: {},
    touchedFields: new Set<keyof T>(),
    dirtyFields: new Set<keyof T>(),
    fieldValidationStatus: {}
  });
  
  // Update touched fields when fields are touched
  useEffect(() => {
    const touchedFieldNames = Object.keys(formState.touchedFields) as Array<keyof T>;
    
    if (touchedFieldNames.length > 0) {
      setState(prev => ({
        ...prev,
        touchedFields: new Set([...prev.touchedFields, ...touchedFieldNames])
      }));
    }
  }, [formState.touchedFields]);
  
  // Update dirty fields when fields are changed
  useEffect(() => {
    const dirtyFieldNames = Object.keys(formState.dirtyFields) as Array<keyof T>;
    
    if (dirtyFieldNames.length > 0) {
      setState(prev => ({
        ...prev,
        dirtyFields: new Set([...prev.dirtyFields, ...dirtyFieldNames])
      }));
    }
  }, [formState.dirtyFields]);
  
  // Validate form data with schema and custom validators
  const validateFormData = useCallback(async (
    data: T,
    fieldsToValidate?: Array<keyof T>
  ): Promise<ValidationResult> => {
    try {
      setState(prev => ({ ...prev, isValidating: true }));
      
      // If specific fields to validate, only validate those
      if (fieldsToValidate && fieldsToValidate.length > 0) {
        const partialSchema = z.object(
          fieldsToValidate.reduce((acc, field) => {
            const fieldPath = field.toString().split('.');
            // Access schema properties safely with type assertion
            let currentObj = schema as any;
            
            for (const pathPart of fieldPath) {
              if (currentObj && currentObj[pathPart]) {
                currentObj = currentObj[pathPart];
              } else {
                currentObj = null;
                break;
              }
            }
            
            if (currentObj) {
              // Use type assertion for index access
              (acc as any)[field.toString()] = currentObj;
            }
            
            return acc;
          }, {})
        );
        
        // Partial validation
        await partialSchema.parseAsync(data);
      } else {
        // Full validation
        await schema.parseAsync(data);
      }
      
      // Apply custom validators if provided
      const customErrors: ValidationError[] = [];
      
      if (customValidators && Object.keys(customValidators).length > 0) {
        for (const [field, validator] of Object.entries(customValidators)) {
          if (!fieldsToValidate || fieldsToValidate.includes(field as keyof T)) {
            const fieldValue = data[field as keyof T];
            const result = validator(fieldValue, data as T);
            
            if (result !== true) {
              customErrors.push({
                field,
                message: result,
                code: 'custom',
                severity: ValidationSeverity.ERROR,
                context: ValidationContext.CLIENT,
                path: [field]
              });
            }
          }
        }
      }
      
      if (customErrors.length > 0) {
        return createValidationResult(
          false,
          customErrors,
          ValidationContext.CLIENT
        );
      }
      
      return createValidationResult(
        true, 
        [], 
        ValidationContext.CLIENT,
        data
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = zodErrorToValidationError(
          error,
          ValidationContext.CLIENT
        );
        
        return createValidationResult(
          false,
          errors,
          ValidationContext.CLIENT
        );
      }
      
      // Unexpected error
      return createValidationResult(
        false,
        [{
          field: 'form',
          message: 'An unexpected validation error occurred',
          code: 'unknown',
          severity: ValidationSeverity.ERROR,
          context: ValidationContext.CLIENT
        }],
        ValidationContext.CLIENT
      );
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [schema, customValidators]);
  
  // Watch for form changes based on validation mode
  useEffect(() => {
    const subscription = watch((formData, { name, type }) => {
      // Skip if no field changed or if in onSubmit mode
      if (!name || mode === 'onSubmit') return;
      
      // Determine which fields to validate
      let fieldsToValidate: Array<keyof T> = [];
      
      // For the changed field
      if (
        mode === 'onChange' || 
        (mode === 'onTouched' && state.touchedFields.has(name as keyof T)) ||
        (mode === 'onBlur' && type === 'blur') ||
        (mode === 'all')
      ) {
        fieldsToValidate.push(name as keyof T);
        
        // Add dependent fields if any
        if (dependentFields[name]) {
          fieldsToValidate = [
            ...fieldsToValidate,
            ...dependentFields[name]
          ];
        }
      }
      
      // Run validation if needed
      if (fieldsToValidate.length > 0) {
        validateFormData(formData as T, fieldsToValidate)
          .then(result => {
            const newFieldStatus = { ...state.fieldValidationStatus };
            
            // Update validation status for each field
            fieldsToValidate.forEach(field => {
              const fieldErrors = result.errors.filter(
                err => err.field === field.toString()
              );
              
              if (fieldErrors.length > 0) {
                // Set field as invalid with error message
                newFieldStatus[field.toString()] = 'invalid';
                
                // Update react-hook-form error state
                setError(field as Path<T>, {
                  type: 'validation',
                  message: fieldErrors[0].message
                });
              } else {
                // Set field as valid
                newFieldStatus[field.toString()] = 'valid';
                clearErrors(field as Path<T>);
              }
            });
            
            setState(prev => ({
              ...prev,
              validationResult: result,
              fieldValidationStatus: newFieldStatus,
              validationErrors: result.errors.reduce(
                (acc, err) => ({ ...acc, [err.field]: err.message }),
                {}
              )
            }));
          });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, mode, validateFormData, state.touchedFields, state.dirtyFields, dependentFields, setError, clearErrors]);
  
  // Validate all fields
  const validateAll = useCallback(async () => {
    const currentValues = getValues();
    return validateFormData(currentValues);
  }, [getValues, validateFormData]);
  
  // Validate specific fields
  const validateSpecificFields = useCallback(async (fields: Array<keyof T>) => {
    const currentValues = getValues();
    return validateFormData(currentValues, fields);
  }, [getValues, validateFormData]);
  
  // Reset validation state
  const resetValidation = useCallback(() => {
    setState({
      isValidating: false,
      validationResult: createValidationResult(true, [], ValidationContext.CLIENT),
      validationErrors: {},
      touchedFields: new Set<keyof T>(),
      dirtyFields: new Set<keyof T>(),
      fieldValidationStatus: {}
    });
    clearErrors();
  }, [clearErrors]);
  
  return {
    ...state,
    validateAll,
    validateFields: validateSpecificFields,
    resetValidation,
    isValid: state.validationResult.valid && Object.keys(state.validationErrors).length === 0
  };
}