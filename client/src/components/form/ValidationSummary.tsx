/**
 * Validation Summary Component
 * 
 * This component displays a consolidated view of all validation errors
 * with prioritization and navigation capabilities.
 */

import React, { useState } from 'react';
import { ValidationError, ValidationSeverity } from '../../../../shared/validation/validationTypes';

interface ValidationSummaryProps {
  errors: ValidationError[];
  onNavigateToField?: (field: string) => void;
  showTitle?: boolean;
  maxDisplayedErrors?: number;
  className?: string;
}

export function ValidationSummary({
  errors,
  onNavigateToField,
  showTitle = true,
  maxDisplayedErrors = 10,
  className = ''
}: ValidationSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  
  // No errors to display
  if (!errors || errors.length === 0) {
    return null;
  }
  
  // Prioritize errors by severity
  const prioritizedErrors = [...errors].sort((a, b) => {
    // First by severity
    const severityOrder = {
      [ValidationSeverity.ERROR]: 0,
      [ValidationSeverity.WARNING]: 1,
      [ValidationSeverity.INFO]: 2
    };
    
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    // Then alphabetically by field
    return a.field.localeCompare(b.field);
  });
  
  // Determine how many errors to show
  const displayedErrors = expanded 
    ? prioritizedErrors 
    : prioritizedErrors.slice(0, maxDisplayedErrors);
  
  // Get error counts by severity
  const errorCount = prioritizedErrors.filter(
    err => err.severity === ValidationSeverity.ERROR
  ).length;
  
  const warningCount = prioritizedErrors.filter(
    err => err.severity === ValidationSeverity.WARNING
  ).length;
  
  const infoCount = prioritizedErrors.filter(
    err => err.severity === ValidationSeverity.INFO
  ).length;
  
  // Get remaining count
  const remainingCount = prioritizedErrors.length - maxDisplayedErrors;
  
  // Handle click on error item
  const handleErrorClick = (field: string) => {
    if (onNavigateToField) {
      onNavigateToField(field);
    }
  };
  
  // Get severity icon
  const getSeverityIcon = (severity: ValidationSeverity) => {
    switch (severity) {
      case ValidationSeverity.ERROR:
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        );
      case ValidationSeverity.WARNING:
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-yellow-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        );
      case ValidationSeverity.INFO:
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-blue-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Validation Summary</h3>
          <div className="flex items-center space-x-2">
            {errorCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
              </span>
            )}
            {infoCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {infoCount} Info
              </span>
            )}
          </div>
        </div>
      )}
      
      <ul className="space-y-2">
        {displayedErrors.map((error, index) => (
          <li 
            key={`${error.field}-${index}`}
            className={`
              flex items-start p-2 rounded-md 
              ${onNavigateToField ? 'cursor-pointer hover:bg-gray-50' : ''}
              ${error.severity === ValidationSeverity.ERROR ? 'bg-red-50' : ''}
              ${error.severity === ValidationSeverity.WARNING ? 'bg-yellow-50' : ''}
              ${error.severity === ValidationSeverity.INFO ? 'bg-blue-50' : ''}
            `}
            onClick={() => handleErrorClick(error.field)}
          >
            <div className="flex-shrink-0 mr-2">
              {getSeverityIcon(error.severity)}
            </div>
            <div>
              <div className="text-sm font-medium">
                {error.field.split('.').map(part => 
                  part.charAt(0).toUpperCase() + part.slice(1)
                ).join(' ')}
              </div>
              <div className="text-sm text-gray-600">{error.message}</div>
            </div>
          </li>
        ))}
      </ul>
      
      {remainingCount > 0 && (
        <button
          type="button"
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded 
            ? 'Show fewer issues' 
            : `Show ${remainingCount} more ${remainingCount === 1 ? 'issue' : 'issues'}`}
        </button>
      )}
    </div>
  );
}