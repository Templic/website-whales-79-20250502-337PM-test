/**
 * Progressive Validation Component
 * 
 * This component provides real-time feedback as users input data,
 * validating each field progressively and showing inline feedback.
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller, FieldValues, Path } from 'react-hook-form';
import { z } from 'zod';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationSeverity } from '../../../../shared/validation/validationTypes';

// Import UI components from Shadcn
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Validation status indicator component
interface ValidationIndicatorProps {
  status: 'valid' | 'invalid' | 'pending' | null;
}

function ValidationIndicator({ status }: ValidationIndicatorProps) {
  if (!status) return null;
  
  return (
    <div className="inline-flex ml-2">
      {status === 'valid' && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-green-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 13l4 4L19 7" 
          />
        </svg>
      )}
      
      {status === 'invalid' && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-red-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      )}
      
      {status === 'pending' && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-yellow-500 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      )}
    </div>
  );
}

interface FieldConfig {
  name: string;
  label: string;
  description?: string;
  type: 'text' | 'email' | 'password' | 'number' | 'checkbox' | 'select';
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  dependsOn?: string[];
}

interface ProgressiveValidationProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  fields: FieldConfig[];
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void;
  submitText?: string;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  showIndicators?: boolean;
}

export function ProgressiveValidation<T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitText = 'Submit',
  validationMode = 'onChange',
  showIndicators = true
}: ProgressiveValidationProps<T>) {
  // Setup form with validation
  const form = useForm<T>({
    defaultValues: defaultValues as T
  });
  
  // Build dependency map for fields
  const dependencyMap: Record<string, Array<string>> = {};
  fields.forEach(field => {
    if (field.dependsOn && field.dependsOn.length > 0) {
      field.dependsOn.forEach(dep => {
        if (!dependencyMap[dep]) {
          dependencyMap[dep] = [];
        }
        dependencyMap[dep].push(field.name);
      });
    }
  });
  
  // Use the validation hook
  const validation = useFormValidation({
    schema,
    defaultValues,
    mode: validationMode,
    dependentFields: dependencyMap as Record<string, Array<keyof T>>
  });
  
  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    // Validate all fields before submitting
    const result = await validation.validateAll();
    
    if (result.valid) {
      onSubmit(data);
    }
  });
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name as Path<T>}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>{field.label}</FormLabel>
                  {showIndicators && (
                    <ValidationIndicator 
                      status={validation.fieldValidationStatus[field.name]}
                    />
                  )}
                </div>
                <FormControl>
                  {field.type === 'select' ? (
                    <Select
                      value={formField.value as string}
                      onValueChange={formField.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'checkbox' ? (
                    <Checkbox
                      checked={formField.value as boolean}
                      onCheckedChange={formField.onChange}
                    />
                  ) : (
                    <Input
                      {...formField}
                      type={field.type}
                      placeholder={field.placeholder}
                    />
                  )}
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage>
                  {validation.validationErrors[field.name]}
                </FormMessage>
              </FormItem>
            )}
          />
        ))}
        
        <Button type="submit" disabled={validation.isValidating}>
          {validation.isValidating ? 'Validating...' : submitText}
        </Button>
      </form>
    </Form>
  );
}

// Example usage of progressive validation
export function ProgressiveValidationExample() {
  // Define schema
  const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    age: z.number().min(18, 'Must be at least 18 years old'),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: 'You must agree to the terms'
    }),
    role: z.enum(['user', 'admin', 'editor'])
  });
  
  // Define fields
  const fields: FieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter your name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter your email'
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      placeholder: 'Enter your age'
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' }
      ]
    },
    {
      name: 'agreeToTerms',
      label: 'I agree to the terms and conditions',
      type: 'checkbox'
    }
  ];
  
  // Define default values
  const defaultValues = {
    name: '',
    email: '',
    age: 18,
    agreeToTerms: false,
    role: 'user'
  };
  
  // Handle form submission
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
      <ProgressiveValidation
        schema={userSchema}
        fields={fields}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitText="Create Account"
        validationMode="onChange"
      />
    </div>
  );
}