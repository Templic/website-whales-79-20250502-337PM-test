/**
 * Progressive Validation Component
 * 
 * This component provides real-time validation feedback to users as they
 * complete form fields, with visual indicators of validation status.
 */

import React, { useState, useEffect } from 'react';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { z } from 'zod';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationSeverity } from '../../../shared/validation/validationTypes';

interface ProgressiveValidationProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  schema: z.ZodType<T>;
  children: React.ReactNode;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  showValidationStatus?: boolean;
  customValidators?: Record<string, (value: any, formValues: T) => string | true>;
  dependentFields?: Record<string, Array<keyof T>>;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * Field validation status component
 */
interface FieldStatusProps {
  status: 'pending' | 'valid' | 'invalid';
  severity?: string;
}

const FieldStatus: React.FC<FieldStatusProps> = ({ status, severity = 'error' }) => {
  if (status === 'pending') return null;
  
  return (
    <div className={`field-status-indicator ${status}`} aria-live="polite">
      {status === 'valid' ? (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 12l3 3 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${
          severity === 'critical' ? 'text-red-600' : 
          severity === 'error' ? 'text-red-500' : 
          severity === 'warning' ? 'text-yellow-500' : 
          'text-blue-500'
        }`}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 8v4M12 16h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

/**
 * Form validation context
 */
interface FormValidationContextType<T extends FieldValues> {
  fieldStatus: Record<string, 'pending' | 'valid' | 'invalid'>;
  errors: Record<string, string>;
  isValid: boolean;
  touchedFields: Set<keyof T>;
  dirtyFields: Set<keyof T>;
  getFieldStatus: (name: string) => {
    status: 'pending' | 'valid' | 'invalid';
    message?: string;
    severity?: string;
  };
}

const FormValidationContext = React.createContext<FormValidationContextType<any>>({
  fieldStatus: {},
  errors: {},
  isValid: false,
  touchedFields: new Set(),
  dirtyFields: new Set(),
  getFieldStatus: () => ({ status: 'pending' })
});

/**
 * Hook to access form validation context
 */
export const useFormValidationContext = <T extends FieldValues>() => 
  React.useContext(FormValidationContext as React.Context<FormValidationContextType<T>>);

/**
 * Progressive validation wrapper component
 */
export function ProgressiveValidation<T extends FieldValues>({
  form,
  schema,
  children,
  mode = 'onTouched',
  showValidationStatus = true,
  customValidators,
  dependentFields,
  onValidationChange
}: ProgressiveValidationProps<T>) {
  const { 
    isValidating, 
    validationResult, 
    validationErrors,
    fieldValidationStatus,
    touchedFields,
    dirtyFields,
    isValid
  } = useFormValidation({
    form,
    schema,
    mode,
    customValidators,
    dependentFields
  });
  
  // Track validation status changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);
  
  // Get field validation status
  const getFieldStatus = (name: string) => {
    const status = fieldValidationStatus[name] || 'pending';
    const message = validationErrors[name];
    
    // Determine severity from validation results
    let severity = 'error';
    if (message) {
      const error = validationResult.errors.find(e => e.field === name);
      if (error) {
        severity = error.severity || 'error';
      }
    }
    
    return { status, message, severity };
  };
  
  const contextValue: FormValidationContextType<T> = {
    fieldStatus: fieldValidationStatus,
    errors: validationErrors,
    isValid,
    touchedFields,
    dirtyFields,
    getFieldStatus
  };
  
  return (
    <FormValidationContext.Provider value={contextValue}>
      {children}
    </FormValidationContext.Provider>
  );
}

/**
 * Form field validation wrapper
 */
interface ValidatedFieldProps {
  name: string;
  children: React.ReactNode;
  showValidationStatus?: boolean;
}

export const ValidatedField: React.FC<ValidatedFieldProps> = ({
  name,
  children,
  showValidationStatus = true
}) => {
  const { getFieldStatus, touchedFields } = useFormValidationContext();
  const { status, message, severity } = getFieldStatus(name);
  
  // Don't show validation until field is touched
  const shouldShowValidation = showValidationStatus && 
    (status !== 'pending' && touchedFields.has(name));
  
  return (
    <div className="validated-field-wrapper">
      <div className="field-with-status">
        {children}
        {shouldShowValidation && (
          <FieldStatus status={status} severity={severity} />
        )}
      </div>
      {shouldShowValidation && status === 'invalid' && message && (
        <div 
          className={`text-sm mt-1 ${
            severity === 'critical' ? 'text-red-600' : 
            severity === 'error' ? 'text-red-500' : 
            severity === 'warning' ? 'text-yellow-500' : 
            'text-blue-500'
          }`} 
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  );
};

/**
 * Form validation summary component
 */
interface ValidationSummaryProps {
  showOnlyWhenInvalid?: boolean;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  showOnlyWhenInvalid = true,
  className = ''
}) => {
  const { errors, isValid } = useFormValidationContext();
  
  // Don't show if valid and configured to hide
  if (showOnlyWhenInvalid && isValid) {
    return null;
  }
  
  const errorList = Object.entries(errors);
  
  return (
    <div 
      className={`rounded border px-4 py-3 ${
        errorList.length > 0 
          ? 'border-red-400 bg-red-50 text-red-800' 
          : 'border-green-400 bg-green-50 text-green-800'
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      {errorList.length > 0 ? (
        <>
          <div className="flex items-center font-medium">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Please correct the following errors:
          </div>
          <ul className="mt-1 list-disc list-inside text-sm">
            {errorList.map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex items-center font-medium">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2 text-green-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 12l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Form is valid and ready to submit
        </div>
      )}
    </div>
  );
};