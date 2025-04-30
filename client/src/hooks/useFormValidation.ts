/**
 * Form Validation Hook
 * 
 * This hook provides real-time validation for forms with immediate feedback
 * and progressive validation as the user interacts with fields.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { 
  ValidationContext, 
  ValidationResult, 
  createValidationResult, 
  ValidationError,
  zodErrorToValidationError,
  ValidationSeverity
} from '../lib/validation/types';

interface UseFormValidationProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  schema: z.ZodType<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  validateFields?: Array<keyof T>;
  customValidators?: Record<string, (value: any, formValues: T) => string | true>;
  dependentFields?: Record<string, Array<keyof T>>;
}

interface FormValidationState<T extends FieldValues> {
  isValidating: boolean;
  validationResult: ValidationResult;
  validationErrors: Record<string, string>;
  touchedFields: Set<keyof T>;
  dirtyFields: Set<keyof T>;
  fieldValidationStatus: Record<string, 'pending' | 'valid' | 'invalid'>;
}

/**
 * Custom hook for form validation with immediate feedback
 */
export function useFormValidation<T extends FieldValues>({
  form,
  schema,
  mode = 'onTouched',
  validateFields = [],
  customValidators = {},
  dependentFields = {}
}: UseFormValidationProps<T>) {
  const { 
    watch, 
    formState,
    trigger,
    getValues,
    setError,
    clearErrors
  } = form;
  
  const [state, setState] = useState<FormValidationState<T>>({
    isValidating: false,
    validationResult: createValidationResult(true, [], ValidationContext.CLIENT),
    validationErrors: {},
    touchedFields: new Set<keyof T>(),
    dirtyFields: new Set<keyof T>(),
    fieldValidationStatus: {}
  });
  
  const allFields = useMemo(() => {
    return validateFields.length > 0 
      ? validateFields 
      : Object.keys(getValues()) as Array<keyof T>;
  }, [validateFields, getValues]);
  
  // Track touched and dirty fields
  useEffect(() => {
    const { touchedFields, dirtyFields } = formState;
    
    setState(prev => ({
      ...prev,
      touchedFields: new Set(Object.keys(touchedFields) as Array<keyof T>),
      dirtyFields: new Set(Object.keys(dirtyFields) as Array<keyof T>)
    }));
  }, [formState.touchedFields, formState.dirtyFields]);
  
  // Create a validation function with context
  const validateFormData = useCallback(async (
    data: Partial<T>,
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